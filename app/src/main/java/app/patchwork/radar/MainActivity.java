package app.patchwork.radar;

import android.app.*;
import android.appwidget.AppWidgetManager;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import androidx.webkit.*;
import org.json.*;
import java.util.*;

public class MainActivity extends Activity {
 private WebView web;private LinearLayout root;private FrameLayout content;private LinearLayout failure;private ProgressBar progress;
 private String shownLocale="";
 private JavaScriptReplyProxy reply;private boolean testAfterPermission=false;private final Handler handler=new Handler(Looper.getMainLooper());
 private final String origin=BuildConfig.SITE_ORIGIN;private boolean authenticatedPage=false;
 private boolean isSite(Uri uri){Uri base=Uri.parse(origin);return "https".equals(uri.getScheme())&&base.getHost().equals(uri.getHost())&&(uri.getPort()==-1||uri.getPort()==443);}
 private boolean isAuth(Uri uri){return "https".equals(uri.getScheme())&&new HashSet<>(Arrays.asList("auth.openai.com","chatgpt.com","auth0.openai.com")).contains(uri.getHost())&&(uri.getPort()==-1||uri.getPort()==443);}
 private String target(Intent intent){String id=intent.getData()!=null?intent.getData().getQueryParameter("entry"):null;String tab=intent.getData()!=null?intent.getData().getQueryParameter("tab"):null;Uri.Builder b=Uri.parse(origin+"/mobile").buildUpon().appendQueryParameter("locale",AppStore.locale(this));if(id!=null&&id.matches("[a-zA-Z0-9_-]{1,160}"))b.appendQueryParameter("entry",id);else if("settings".equals(tab))b.appendQueryParameter("tab","settings");return b.build().toString();}

 @Override public void onCreate(Bundle state){
  super.onCreate(state);shownLocale=AppStore.locale(this);getWindow().setStatusBarColor(Color.rgb(16,23,17));getWindow().setNavigationBarColor(Color.rgb(16,23,17));
  if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,this::navigateBack);
  root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(16,23,17));setContentView(root);
  root.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets pad=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(pad.left,pad.top,pad.right,pad.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
  progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(100);root.addView(progress,new LinearLayout.LayoutParams(-1,dp(2)));
  content=new FrameLayout(this);root.addView(content,new LinearLayout.LayoutParams(-1,0,1));web=new WebView(this);web.setBackgroundColor(Color.rgb(16,23,17));content.addView(web,new FrameLayout.LayoutParams(-1,-1));
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setSafeBrowsingEnabled(true);s.setMediaPlaybackRequiresUserGesture(true);s.setSupportMultipleWindows(true);s.setBuiltInZoomControls(false);s.setLoadWithOverviewMode(true);s.setUseWideViewPort(true);s.setTextZoom(Math.round(100*getResources().getConfiguration().fontScale));s.setUserAgentString(s.getUserAgentString()+" GAGETHER/"+BuildConfig.VERSION_NAME);s.setCacheMode(WebSettings.LOAD_DEFAULT);
  CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
  if(WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER))WebViewCompat.addWebMessageListener(web,"PatchworkNative",Collections.singleton(origin),(view,message,source,isMainFrame,replyProxy)->{
   if(!isMainFrame||!isSite(source)||message.getData()==null||message.getData().length()>1500000)return;reply=replyProxy;
   try{JSONObject data=new JSONObject(message.getData());if(data.optInt("version")!=1)return;handle(data.optString("type"),data.opt("payload"));}catch(Exception e){replyError("Invalid app request");}
  });
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(!request.isForMainFrame())return false;if(isSite(uri)||isAuth(uri))return false;if("https".equals(uri.getScheme())||"mailto".equals(uri.getScheme())){external(uri);return true;}return true;}
   @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){progress.setVisibility(View.VISIBLE);hideFailure();authenticatedPage=false;}
   @Override public void onPageFinished(WebView view,String url){progress.setVisibility(View.GONE);CookieManager.getInstance().flush();authenticatedPage=isSite(Uri.parse(url))&&Uri.parse(url).getPath()!=null&&Uri.parse(url).getPath().startsWith("/mobile");if(authenticatedPage){SyncManager.schedule(MainActivity.this);SyncManager.once(MainActivity.this);}}
   @Override public void onReceivedError(WebView view,WebResourceRequest req,WebResourceError error){if(req.isForMainFrame())showFailure();}
   @Override public void onReceivedHttpError(WebView view,WebResourceRequest req,WebResourceResponse response){if(req.isForMainFrame())showFailure();}
   @Override public void onReceivedSslError(WebView view,SslErrorHandler handler,android.net.http.SslError error){handler.cancel();showFailure();}
   @Override public boolean onRenderProcessGone(WebView view,RenderProcessGoneDetail detail){view.destroy();recreate();return true;}
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public void onProgressChanged(WebView view,int value){progress.setProgress(value);progress.setVisibility(value>=100?View.GONE:View.VISIBLE);}
   @Override public boolean onCreateWindow(WebView view,boolean dialog,boolean userGesture,Message result){if(!userGesture)return false;WebView popup=new WebView(MainActivity.this);popup.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri uri=r.getUrl();if(isSite(uri)||isAuth(uri))web.loadUrl(uri.toString());else if("https".equals(uri.getScheme()))external(uri);v.destroy();return true;}});((WebView.WebViewTransport)result.obj).setWebView(popup);result.sendToTarget();return true;}
  });
  WebBackForwardList restored=state==null?null:web.restoreState(state);
  if(restored==null||restored.getCurrentItem()==null||!isSite(Uri.parse(restored.getCurrentItem().getUrl())))web.loadUrl(target(getIntent()));
  SyncManager.schedule(this);ReminderScheduler.schedule(this);
 }
 private void handle(String type,Object payload)throws Exception{
  switch(type){
   case "hello": state();break;
   case "preferences": if(!(payload instanceof JSONObject))return;AppStore.setPrefs(this,(JSONObject)payload);SyncManager.EXECUTOR.execute(()->{ReminderScheduler.schedule(this);DeadlineWidget.updateAll(this);});state();break;
   case "snapshot": if(!(payload instanceof JSONObject))return;SyncManager.EXECUTOR.execute(()->{try{SyncManager.accept(this,(JSONObject)payload);handler.post(this::state);}catch(Exception e){handler.post(()->replyError("Unable to save schedules"));}});break;
   case "sync": SyncManager.EXECUTOR.execute(()->{try{SyncManager.sync(this);}catch(Exception ignored){}handler.post(this::state);});break;
   case "permission": permission(false);break;
   case "systemSettings":startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));break;
   case "widget": AppWidgetManager m=getSystemService(AppWidgetManager.class);if(m.isRequestPinAppWidgetSupported())new AlertDialog.Builder(this).setTitle(Words.pick(this,"위젯 선택","Choose widget","ウィジェットを選択","选择小组件")).setItems(new String[]{getString(R.string.widget_compact),getString(R.string.widget_agenda),getString(R.string.widget_games)},(dialog,which)->m.requestPinAppWidget(new ComponentName(this,new Class<?>[]{DeadlineWidget.class,AgendaWidget.class,GamesWidget.class}[which]),null,null)).show();else Toast.makeText(this,Words.pick(this,"홈 화면을 길게 눌러 위젯을 추가하세요.","Long-press the home screen to add a widget.","ホーム画面を長押しして追加してください。","长按桌面添加小组件。"),Toast.LENGTH_LONG).show();break;
   case "exactAlarmSettings":if(Build.VERSION.SDK_INT>=31)startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getPackageName())));break;
   case "test":permission(true);break;
  }
 }
 private void permission(boolean test){if(ReminderScheduler.allowed(this)){if(test)ReminderScheduler.test(this);state();return;}testAfterPermission=test;if(Build.VERSION.SDK_INT>=33&&!ReminderScheduler.permissionGranted(this))requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},14);else startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName()));}
 @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants){super.onRequestPermissionsResult(code,permissions,grants);if(code==14){if(testAfterPermission&&ReminderScheduler.allowed(this))ReminderScheduler.test(this);testAfterPermission=false;ReminderScheduler.schedule(this);state();}}
 private void state(){if(reply==null)return;try{JSONObject o=new JSONObject().put("type","state").put("reminderConfigVersion",3).put("systemLocale",AppStore.systemLocale(this)).put("exactAlarmsAllowed",ReminderScheduler.exactAllowed(this)).put("scheduledCount",AppStore.store(this).getInt("scheduledCount",0)).put("lastNotificationAt",AppStore.store(this).getLong("lastNotificationAt",0)).put("lastTestScheduledAt",AppStore.store(this).getLong("lastTestScheduledAt",0)).put("lastTestDeliveredAt",AppStore.store(this).getLong("lastTestDeliveredAt",0)).put("scheduleError",AppStore.store(this).getString("scheduleError","")).put("appVersion",BuildConfig.VERSION_NAME).put("preferences",AppStore.prefs(this)).put("notificationsGranted",ReminderScheduler.allowed(this)).put("widgetSupported",getSystemService(AppWidgetManager.class).isRequestPinAppWidgetSupported()).put("lastSyncAt",AppStore.store(this).getLong("lastSyncAt",0)).put("error",AppStore.store(this).getString("syncError",""));reply.postMessage(o.toString());}catch(Exception ignored){}}
 private void replyError(String message){if(reply!=null)try{reply.postMessage(new JSONObject().put("type","error").put("message",message).toString());}catch(Exception ignored){}}
 private void external(Uri uri){try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(ActivityNotFoundException ignored){}}
 private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
 private void hideFailure(){if(failure!=null)failure.setVisibility(View.GONE);web.setVisibility(View.VISIBLE);}
 private void showFailure(){
  progress.setVisibility(View.GONE);if(failure!=null)content.removeView(failure);failure=new LinearLayout(this);failure.setOrientation(LinearLayout.VERTICAL);failure.setGravity(Gravity.CENTER);failure.setPadding(dp(28),dp(20),dp(28),dp(20));failure.setBackgroundColor(Color.rgb(16,23,17));
  TextView brand=new TextView(this);brand.setText("GAGETHER");brand.setTextColor(0xFFD4EDB4);brand.setTextSize(28);brand.setGravity(Gravity.CENTER);failure.addView(brand);
  TextView note=new TextView(this);note.setText(Words.offline(this));note.setTextSize(14);note.setTextColor(0xFFB7C8AB);note.setGravity(Gravity.CENTER);note.setPadding(0,dp(20),0,dp(24));failure.addView(note);
  Button retry=new Button(this);retry.setText(Words.retry(this));retry.setOnClickListener(v->web.loadUrl(target(getIntent())));failure.addView(retry);
  if(AppStore.store(this).getLong("lastSyncAt",0)>0){TextView cached=new TextView(this);cached.setText(Words.stale(this));cached.setTextSize(12);cached.setTextColor(0xFF8CA47D);cached.setPadding(0,dp(24),0,0);cached.setGravity(Gravity.CENTER);failure.addView(cached);}
  content.addView(failure,new FrameLayout.LayoutParams(-1,-1));web.setVisibility(View.INVISIBLE);
 }
 @Override public void onConfigurationChanged(android.content.res.Configuration config){super.onConfigurationChanged(config);if(web!=null){web.getSettings().setTextZoom(Math.round(100*config.fontScale));web.requestLayout();}root.requestApplyInsets();refreshLanguage();}
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(web!=null)web.loadUrl(target(intent));}
 private void refreshLanguage(){String next=AppStore.locale(this);if(!shownLocale.equals(next)){shownLocale=next;if(web!=null)web.loadUrl(target(getIntent()));SyncManager.once(this);DeadlineWidget.updateAll(this);}}
 @Override protected void onResume(){super.onResume();refreshLanguage();ReminderScheduler.schedule(this);if(testAfterPermission&&ReminderScheduler.allowed(this)){testAfterPermission=false;ReminderScheduler.test(this);}if(web!=null){web.onResume();web.resumeTimers();if(authenticatedPage)SyncManager.once(this);}state();}
 @Override protected void onPause(){if(web!=null){web.onPause();CookieManager.getInstance().flush();}super.onPause();}
 @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);if(web!=null)web.saveState(state);}
 private void navigateBack(){if(web==null){finish();return;}web.evaluateJavascript("window.__patchworkBack ? window.__patchworkBack() : false",value->{if("true".equals(value))return;if(web.canGoBack())web.goBack();else finish();});}
 @Override public void onBackPressed(){navigateBack();}
 @Override protected void onDestroy(){reply=null;if(web!=null){web.stopLoading();content.removeView(web);web.destroy();}super.onDestroy();}
}
