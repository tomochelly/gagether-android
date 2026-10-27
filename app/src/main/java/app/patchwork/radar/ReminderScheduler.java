package app.patchwork.radar;
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Build;
import org.json.*;
import java.time.ZoneId;
import java.util.*;

public final class ReminderScheduler {
 public static final String CHANNEL="schedule_reminders",BROADCAST_CHANNEL="broadcast_reminders";
 public static void channel(Context c){NotificationManager manager=c.getSystemService(NotificationManager.class);NotificationChannel ch=new NotificationChannel(CHANNEL,Words.reminders(c),NotificationManager.IMPORTANCE_DEFAULT);ch.setDescription("GAGETHER");ch.enableVibration(true);manager.createNotificationChannel(ch);NotificationChannel broadcast=new NotificationChannel(BROADCAST_CHANNEL,Words.broadcasts(c),NotificationManager.IMPORTANCE_DEFAULT);broadcast.setDescription("GAGETHER · official streams");broadcast.enableVibration(true);manager.createNotificationChannel(broadcast);}
 public static boolean permissionGranted(Context c){return Build.VERSION.SDK_INT<33||c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)==android.content.pm.PackageManager.PERMISSION_GRANTED;}
 public static boolean allowed(Context c){return allowed(c,CHANNEL);}
 public static boolean appAllowed(Context c){return c.getSystemService(NotificationManager.class).areNotificationsEnabled()&&permissionGranted(c);}
 public static boolean allowed(Context c,String channel){channel(c);NotificationChannel ch=c.getSystemService(NotificationManager.class).getNotificationChannel(channel);return appAllowed(c)&&ch!=null&&ch.getImportance()!=NotificationManager.IMPORTANCE_NONE;}
 public static boolean exactAllowed(Context c){return Build.VERSION.SDK_INT<31||c.getSystemService(AlarmManager.class).canScheduleExactAlarms();}
 private static boolean arm(Context c,long at,PendingIntent p){AlarmManager am=c.getSystemService(AlarmManager.class);try{if(exactAllowed(c)){try{am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,p);return true;}catch(SecurityException revoked){/* The user may revoke exact access between the check and set. */}}am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,p);return true;}catch(RuntimeException unavailable){return false;}}
 public static boolean test(Context c){if(!allowed(c))return false;Intent i=new Intent(c,ReminderReceiver.class).setAction("app.patchwork.TEST_REMINDER").setData(Uri.parse("patchwork://reminder-test"));PendingIntent p=PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);boolean ok=arm(c,System.currentTimeMillis()+5000,p);if(ok)AppStore.store(c).edit().putLong("lastTestScheduledAt",System.currentTimeMillis()).apply();return ok;}
 public static synchronized void notifyLiveBroadcasts(Context c){
  JSONObject prefs=AppStore.prefs(c),feed=AppStore.feed(c);long now=System.currentTimeMillis();
  if(!prefs.optBoolean("enabled")||!prefs.optBoolean("broadcastsEnabled")||!AppStore.fresh(c)||!allowed(c,BROADCAST_CHANNEL)||ReminderPolicy.quietAt(now,prefs,ZoneId.systemDefault()))return;
  Set<String> sent=new HashSet<>(AppStore.store(c).getStringSet("liveSent",Collections.emptySet())),scheduled=AppStore.store(c).getStringSet("sent",Collections.emptySet());
  for(JSONObject e:ReminderPolicy.records(feed)){
   if(!ReminderPolicy.matches(e,prefs,feed)||!ReminderPolicy.liveBroadcastEligible(e,now))continue;
   JSONObject b=e.optJSONObject("broadcast");String key=e.optString("gameId")+"/"+e.optString("region")+"/"+e.optString("expectedLocale")+"/"+b.optString("youtubeId",e.optString("id"));
   if(sent.contains(key)||scheduled.contains(ReminderPolicy.groupKey(e,"broadcast",ReminderPolicy.eventAt(e,"broadcast"))+"|0"))continue;
   String game=ReminderPolicy.gameName(feed,e.optString("gameId"),prefs.optString("locale","en")),title=Words.pick(c,"공식 방송 시작","Official broadcast is live","公式配信が開始","官方直播已开始");
   if(show(c,game+" · "+title,ReminderPolicy.text(e.optJSONObject("title"),prefs.optString("locale","en")),e.optString("id"),BROADCAST_CHANNEL))sent.add(key);
  }
  // Retain recent video identities without growing an unbounded preference value.
  if(sent.size()>250){Set<String> current=new HashSet<>();for(JSONObject e:ReminderPolicy.records(feed)){JSONObject b=e.optJSONObject("broadcast");if(b!=null)current.add(e.optString("gameId")+"/"+e.optString("region")+"/"+e.optString("expectedLocale")+"/"+b.optString("youtubeId",e.optString("id")));}sent.retainAll(current);}
  AppStore.store(c).edit().putStringSet("liveSent",sent).apply();
 }
 private static PendingIntent pending(Context c,String key){Intent i=new Intent(c,ReminderReceiver.class).setAction("app.patchwork.REMINDER").setData(Uri.parse("patchwork://reminder/"+Uri.encode(key))).putExtra("key",key);return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static synchronized void schedule(Context c){
  channel(c);AlarmManager am=c.getSystemService(AlarmManager.class);Set<String> old=new HashSet<>(AppStore.store(c).getStringSet("alarms",Collections.emptySet()));
  List<ReminderPolicy.Reminder> plan=AppStore.fresh(c)&&appAllowed(c)?ReminderPolicy.plan(AppStore.feed(c),AppStore.prefs(c),System.currentTimeMillis(),ZoneId.systemDefault()):Collections.emptyList();Set<String> next=new HashSet<>();
  int eligible=0;for(ReminderPolicy.Reminder r:plan){String channel=r.event.equals("broadcast")?BROADCAST_CHANNEL:CHANNEL;if(!allowed(c,channel))continue;eligible++;if(arm(c,r.fireAt,pending(c,r.key())))next.add(r.key());}
  for(String key:old)if(!next.contains(key)){PendingIntent p=pending(c,key);am.cancel(p);p.cancel();}
  AppStore.store(c).edit().putStringSet("alarms",next).putLong("lastScheduledAt",System.currentTimeMillis()).putInt("scheduledCount",next.size()).putString("scheduleError",next.size()<eligible?"alarm-scheduling-failed":"").apply();
 }
 public static PendingIntent open(Context c,String entry){Intent i=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("test".equals(entry)?"patchwork://open":"patchwork://open?entry="+Uri.encode(entry))).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);return PendingIntent.getActivity(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static boolean show(Context c,String title,String text,String id){return show(c,title,text,id,CHANNEL);}
 public static boolean show(Context c,String title,String text,String id,String channel){if(!allowed(c,channel))return false;channel(c);Notification n=new Notification.Builder(c,channel).setSmallIcon(R.drawable.ic_notification).setColor(0xFFC3E69A).setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text)).setAutoCancel(true).setContentIntent(open(c,id)).setVisibility(Notification.VISIBILITY_PRIVATE).build();try{c.getSystemService(NotificationManager.class).notify(id.hashCode(),n);AppStore.store(c).edit().putLong("lastNotificationAt",System.currentTimeMillis()).apply();return true;}catch(RuntimeException denied){return false;}}
}
