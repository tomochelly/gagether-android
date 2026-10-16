package app.patchwork.radar;
import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.*;
import android.view.View;
import android.widget.RemoteViews;
import org.json.*;
import java.text.DateFormat;
import java.util.*;
public class DeadlineWidget extends AppWidgetProvider {
 private static final String REFRESH="app.patchwork.WIDGET_REFRESH";
 public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(int id:m.getAppWidgetIds(new ComponentName(c,DeadlineWidget.class)))update(c,m,id);}
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)update(c,m,id);SyncManager.schedule(c);SyncManager.once(c);}
 @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){update(c,m,id);}
 @Override public void onReceive(Context c,Intent i){super.onReceive(c,i);if(REFRESH.equals(i.getAction())){PendingResult pending=goAsync();SyncManager.EXECUTOR.execute(()->{try{SyncManager.sync(c);}catch(Exception ignored){}finally{pending.finish();}});}}
 private static PendingIntent settings(Context c){Intent i=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("patchwork://open?tab=settings"));return PendingIntent.getActivity(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 private static String clock(Context c,long at){DateFormat f=DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT,Locale.forLanguageTag(AppStore.locale(c)));return f.format(new Date(at));}
 public static void update(Context c,AppWidgetManager manager,int id){
  RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.deadline_widget);JSONObject feed=AppStore.feed(c),prefs=AppStore.prefs(c);long now=System.currentTimeMillis(),synced=AppStore.store(c).getLong("lastSyncAt",0);List<JSONObject> entries=ReminderPolicy.deadlines(feed,prefs,now);String locale=AppStore.locale(c);
  v.setOnClickPendingIntent(R.id.widget_root,settings(c));v.setContentDescription(R.id.widget_refresh,Words.refresh(c));Intent refresh=new Intent(c,DeadlineWidget.class).setAction(REFRESH);v.setOnClickPendingIntent(R.id.widget_refresh,PendingIntent.getBroadcast(c,5,refresh,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
  String status=AppStore.store(c).getString("syncError","");v.setTextViewText(R.id.widget_updated,status.isEmpty()&&AppStore.fresh(c)?Words.last(c)+" · "+clock(c,synced):Words.stale(c));
  if(entries.isEmpty()){
   v.setViewVisibility(R.id.widget_lead,View.GONE);v.setViewVisibility(R.id.widget_empty,View.VISIBLE);v.setTextViewText(R.id.widget_empty,prefs.optJSONArray("games")==null||prefs.optJSONArray("games").length()==0?Words.empty(c):synced==0?Words.stale(c):Words.none(c));
  }else{
   JSONObject e=entries.get(0);long end=ReminderPolicy.epoch(e.optString("endAt"));v.setViewVisibility(R.id.widget_lead,View.VISIBLE);v.setViewVisibility(R.id.widget_empty,View.GONE);
   v.setTextViewText(R.id.widget_game,ReminderPolicy.gameName(feed,e.optString("gameId"),locale));v.setTextViewText(R.id.widget_title,ReminderPolicy.text(e.optJSONObject("title"),locale));v.setTextViewText(R.id.widget_deadline,Words.end(c)+" · "+clock(c,end));
   v.setChronometerCountDown(R.id.widget_countdown,true);v.setChronometer(R.id.widget_countdown,SystemClock.elapsedRealtime()+end-now,"%s",AppStore.fresh(c));v.setOnClickPendingIntent(R.id.widget_lead,ReminderScheduler.open(c,e.optString("id")));
   Bitmap art=WidgetArtwork.cached(c,e);v.setViewVisibility(R.id.widget_image,art==null?View.GONE:View.VISIBLE);if(art!=null)v.setImageViewBitmap(R.id.widget_image,art);
   int height=manager.getAppWidgetOptions(id).getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT,130);int[] rows={R.id.widget_row2,R.id.widget_row3};for(int n=0;n<2;n++){boolean show=entries.size()>n+1&&height>=(n==0?205:250);v.setViewVisibility(rows[n],show?View.VISIBLE:View.GONE);if(show){JSONObject row=entries.get(n+1);v.setTextViewText(rows[n],ReminderPolicy.gameName(feed,row.optString("gameId"),locale)+" · "+ReminderPolicy.text(row.optJSONObject("title"),locale)+"\n"+clock(c,ReminderPolicy.epoch(row.optString("endAt"))));v.setOnClickPendingIntent(rows[n],ReminderScheduler.open(c,row.optString("id")));}}
  }
  manager.updateAppWidget(id,v);
 }
}
