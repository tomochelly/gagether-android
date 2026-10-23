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
