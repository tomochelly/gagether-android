package app.patchwork.radar;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.*;
import android.util.SizeF;
import android.view.View;
import android.widget.RemoteViews;
import org.json.*;
import java.text.DateFormat;
import java.util.*;
public class DeadlineWidget extends AppWidgetProvider {
 private static final String REFRESH="app.patchwork.WIDGET_REFRESH";
 public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(Class<?> type:new Class<?>[]{DeadlineWidget.class,AgendaWidget.class,GamesWidget.class})for(int id:m.getAppWidgetIds(new ComponentName(c,type)))update(c,m,id);}
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)update(c,m,id);SyncManager.schedule(c);SyncManager.once(c);}
 @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){update(c,m,id);}
 @Override public void onReceive(Context c,Intent i){super.onReceive(c,i);if(REFRESH.equals(i.getAction())){PendingResult pending=goAsync();SyncManager.EXECUTOR.execute(()->{try{SyncManager.sync(c);}catch(Exception ignored){}finally{pending.finish();}});}}
 private static PendingIntent settings(Context c){Intent i=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("patchwork://open?tab=settings"));return PendingIntent.getActivity(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 static String clock(Context c,long at){return DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT,Locale.forLanguageTag(AppStore.locale(c))).format(new Date(at));}
 static String rowClock(Context c,WidgetPolicy.Row row){return row.dateOnly()?java.time.format.DateTimeFormatter.ofLocalizedDate(java.time.format.FormatStyle.MEDIUM).withLocale(Locale.forLanguageTag(AppStore.locale(c))).format(java.time.LocalDate.parse(row.date))+" · "+Words.pick(c,"시각 미공개","Time unannounced","時刻未発表","时刻未公布"):clock(c,row.at);}
 static boolean grouped(Context c,int id){AppWidgetProviderInfo info=AppWidgetManager.getInstance(c).getAppWidgetInfo(id);return info!=null&&info.provider.getClassName().equals(GamesWidget.class.getName());}
 static RemoteViews rowView(Context c,JSONObject feed,WidgetPolicy.Row row){
  RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.widget_schedule_row);JSONObject e=row.entry;
  v.setTextViewText(R.id.row_game,ReminderPolicy.gameName(feed,e.optString("gameId"),AppStore.locale(c)));
  v.setTextViewText(R.id.row_title,ReminderPolicy.text(e.optJSONObject("title"),AppStore.locale(c)));
  v.setTextViewText(R.id.row_time,(row.start?Words.start(c):Words.end(c))+" · "+rowClock(c,row));
  v.setTextColor(R.id.row_time,!row.dateOnly()&&!row.start&&row.at-System.currentTimeMillis()<=3L*86400000?(c.getResources().getConfiguration().uiMode&android.content.res.Configuration.UI_MODE_NIGHT_MASK)==android.content.res.Configuration.UI_MODE_NIGHT_YES?0xFFFFCC91:0xFFA35B19:c.getColor(R.color.widget_accent));
  Intent fill=new Intent().setData(Uri.parse("patchwork://open?entry="+Uri.encode(e.optString("id"))));v.setOnClickFillInIntent(R.id.row_root,fill);return v;
 }
 public static void update(Context c,AppWidgetManager manager,int id){
  JSONObject feed=AppStore.feed(c),prefs=AppStore.prefs(c);List<WidgetPolicy.Row> entries=WidgetPolicy.rows(feed,prefs,System.currentTimeMillis(),grouped(c,id));
  if(Build.VERSION.SDK_INT>=31){Map<SizeF,RemoteViews> sizes=new LinkedHashMap<>();sizes.put(new SizeF(180,110),render(c,id,feed,prefs,entries,110));sizes.put(new SizeF(180,160),render(c,id,feed,prefs,entries,160));sizes.put(new SizeF(180,240),render(c,id,feed,prefs,entries,240));manager.updateAppWidget(id,new RemoteViews(sizes));}
  else {Bundle b=manager.getAppWidgetOptions(id);RemoteViews portrait=render(c,id,feed,prefs,entries,b.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT,130));RemoteViews landscape=render(c,id,feed,prefs,entries,b.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT,130));manager.updateAppWidget(id,new RemoteViews(landscape,portrait));manager.notifyAppWidgetViewDataChanged(id,R.id.widget_list);}
 }
 private static RemoteViews render(Context c,int id,JSONObject feed,JSONObject prefs,List<WidgetPolicy.Row> entries,int height){
  boolean expanded=height>=240;
  RemoteViews v=new RemoteViews(c.getPackageName(),expanded?R.layout.widget_agenda:R.layout.deadline_widget);long now=System.currentTimeMillis(),synced=AppStore.store(c).getLong("lastSyncAt",0);
  v.setOnClickPendingIntent(R.id.widget_header,settings(c));v.setContentDescription(R.id.widget_refresh,Words.refresh(c));Intent refresh=new Intent(c,DeadlineWidget.class).setAction(REFRESH);v.setOnClickPendingIntent(R.id.widget_refresh,PendingIntent.getBroadcast(c,5,refresh,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
  String status=AppStore.store(c).getString("syncError","");v.setTextViewText(R.id.widget_updated,status.isEmpty()&&AppStore.fresh(c)?Words.last(c)+" · "+clock(c,synced):Words.stale(c));
  v.setTextViewText(R.id.widget_summary,Words.pick(c,"내 게임 ","My games ","マイゲーム ","我的游戏 ")+WidgetPolicy.selectedGames(prefs)+" · "+entries.size()+Words.pick(c,"개 일정"," schedules","件の予定","项日程"));
  v.setTextViewText(R.id.widget_empty,WidgetPolicy.selectedGames(prefs)==0?Words.empty(c):synced==0?Words.stale(c):Words.none(c));v.setOnClickPendingIntent(R.id.widget_empty,settings(c));
  if(expanded){
   v.setTextViewText(R.id.widget_hint,grouped(c,id)?Words.pick(c,"게임별 · 스크롤","By game · Scroll","ゲーム別 · スクロール","按游戏 · 滚动"):Words.pick(c,"시간순 · 스크롤","By time · Scroll","日時順 · スクロール","按时间 · 滚动"));
   Intent open=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
   v.setPendingIntentTemplate(R.id.widget_list,PendingIntent.getActivity(c,id,open,PendingIntent.FLAG_UPDATE_CURRENT|(Build.VERSION.SDK_INT>=31?PendingIntent.FLAG_MUTABLE:0)));
   if(Build.VERSION.SDK_INT>=31){RemoteViews.RemoteCollectionItems.Builder b=new RemoteViews.RemoteCollectionItems.Builder().setHasStableIds(true).setViewTypeCount(1);for(WidgetPolicy.Row row:entries)b.addItem(stableId(row.key()),rowView(c,feed,row));v.setRemoteAdapter(R.id.widget_list,b.build());}
   else {Intent adapter=new Intent(c,WidgetListService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,id);adapter.setData(Uri.parse("patchwork://widget/"+id));v.setRemoteAdapter(R.id.widget_list,adapter);}
   v.setEmptyView(R.id.widget_list,R.id.widget_empty);
  }else{
   v.setViewVisibility(R.id.widget_countdown,height<160?View.GONE:View.VISIBLE);v.setViewVisibility(R.id.widget_deadline,height<160?View.GONE:View.VISIBLE);
   v.setViewVisibility(R.id.widget_lead,entries.isEmpty()?View.GONE:View.VISIBLE);v.setViewVisibility(R.id.widget_empty,entries.isEmpty()?View.VISIBLE:View.GONE);
   if(!entries.isEmpty()){WidgetPolicy.Row row=entries.get(0);JSONObject e=row.entry;v.setTextViewText(R.id.widget_game,ReminderPolicy.gameName(feed,e.optString("gameId"),AppStore.locale(c)));v.setTextViewText(R.id.widget_title,ReminderPolicy.text(e.optJSONObject("title"),AppStore.locale(c)));v.setTextViewText(R.id.widget_deadline,(row.start?Words.start(c):Words.end(c))+" · "+rowClock(c,row));v.setViewVisibility(R.id.widget_countdown,height<160||row.dateOnly()?View.GONE:View.VISIBLE);v.setChronometerCountDown(R.id.widget_countdown,true);v.setChronometer(R.id.widget_countdown,SystemClock.elapsedRealtime()+row.at-now,"%s",AppStore.fresh(c)&&!row.dateOnly());v.setOnClickPendingIntent(R.id.widget_lead,ReminderScheduler.open(c,e.optString("id")));Bitmap art=WidgetArtwork.cached(c,e);v.setViewVisibility(R.id.widget_image,height<160||art==null?View.GONE:View.VISIBLE);if(art!=null)v.setImageViewBitmap(R.id.widget_image,art);}
  }
  return v;
 }
 static long stableId(String s){long h=1125899906842597L;for(int i=0;i<s.length();i++)h=31*h+s.charAt(i);return h;}
}
