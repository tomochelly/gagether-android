package app.patchwork.radar;
import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.Build;
import org.json.*;
import java.time.ZoneId;
import java.util.*;

public final class ReminderScheduler {
 public static final String CHANNEL="schedule_reminders";
 public static void channel(Context c){NotificationManager manager=c.getSystemService(NotificationManager.class);NotificationChannel ch=new NotificationChannel(CHANNEL,Words.reminders(c),NotificationManager.IMPORTANCE_DEFAULT);ch.setDescription("GAGETHER");ch.enableVibration(true);manager.createNotificationChannel(ch);}
 public static boolean allowed(Context c){return c.getSystemService(NotificationManager.class).areNotificationsEnabled()&&(Build.VERSION.SDK_INT<33||c.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)==android.content.pm.PackageManager.PERMISSION_GRANTED);}
 private static PendingIntent pending(Context c,String key){Intent i=new Intent(c,ReminderReceiver.class).setAction("app.patchwork.REMINDER").setData(Uri.parse("patchwork://reminder/"+Uri.encode(key))).putExtra("key",key);return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static synchronized void schedule(Context c){
  channel(c);AlarmManager am=c.getSystemService(AlarmManager.class);Set<String> old=new HashSet<>(AppStore.store(c).getStringSet("alarms",Collections.emptySet()));
  List<ReminderPolicy.Reminder> plan=AppStore.fresh(c)&&allowed(c)?ReminderPolicy.plan(AppStore.feed(c),AppStore.prefs(c),System.currentTimeMillis(),ZoneId.systemDefault()):Collections.emptyList();Set<String> next=new HashSet<>();
  for(ReminderPolicy.Reminder r:plan){next.add(r.key());try{am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,r.fireAt,pending(c,r.key()));}catch(SecurityException ignored){}}
  for(String key:old)if(!next.contains(key)){PendingIntent p=pending(c,key);am.cancel(p);p.cancel();}
  AppStore.store(c).edit().putStringSet("alarms",next).apply();
 }
 public static PendingIntent open(Context c,String entry){Intent i=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("patchwork://open?entry="+Uri.encode(entry))).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);return PendingIntent.getActivity(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 public static void show(Context c,String title,String text,String id){if(!allowed(c))return;channel(c);Notification n=new Notification.Builder(c,CHANNEL).setSmallIcon(R.drawable.ic_notification).setColor(0xFFC3E69A).setContentTitle(title).setContentText(text).setStyle(new Notification.BigTextStyle().bigText(text)).setAutoCancel(true).setContentIntent(open(c,id)).setVisibility(Notification.VISIBILITY_PRIVATE).build();c.getSystemService(NotificationManager.class).notify(id.hashCode(),n);}
}
