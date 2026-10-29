package app.patchwork.radar;
import android.app.*;
import android.content.*;
import android.net.Uri;
import org.json.*;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import com.google.android.gms.tasks.Tasks;
import com.google.firebase.messaging.FirebaseMessaging;

public final class PushManager{
 public static final String CHANNEL="owner_game_announcements";
 private static final ScheduledExecutorService WORKER=Executors.newSingleThreadScheduledExecutor();
 private static final AtomicBoolean QUEUED=new AtomicBoolean();
 public static boolean configured(Context c){return !com.google.firebase.FirebaseApp.getApps(c).isEmpty();}
 public static void channel(Context c){NotificationChannel n=new NotificationChannel(CHANNEL,Words.pick(c,"운영자 게임 알림","Game announcements","運営者のゲームお知らせ","运营者游戏通知"),NotificationManager.IMPORTANCE_DEFAULT);n.setDescription("GAGETHER · My games · opt-in");c.getSystemService(NotificationManager.class).createNotificationChannel(n);}
 public static boolean allowed(Context c){channel(c);NotificationChannel n=c.getSystemService(NotificationManager.class).getNotificationChannel(CHANNEL);return ReminderScheduler.appAllowed(c)&&n!=null&&n.getImportance()!=NotificationManager.IMPORTANCE_NONE;}
 public static void audience(Context c,JSONObject input)throws JSONException{if(!input.has("ready")||!(input.opt("ready") instanceof Boolean)||input.optJSONArray("games")==null||input.optJSONArray("games").length()>30)throw new JSONException("Invalid audience");Set<String> ids=new HashSet<>();JSONArray gs=input.optJSONArray("games");for(int i=0;i<gs.length();i++)if(PushPolicy.GAME_IDS.contains(gs.optString(i)))ids.add(gs.optString(i));AppStore.store(c).edit().putBoolean("ownerPushAudienceKnown",input.optBoolean("ready")).putStringSet("ownerPushGames",ids).apply();reconcile(c);}
 private static Set<String> desired(Context c){return PushPolicy.topics(AppStore.store(c).getStringSet("ownerPushGames",Collections.emptySet()),AppStore.locale(c),AppStore.prefs(c).optBoolean("ownerPushEnabled",false),allowed(c),AppStore.store(c).getBoolean("ownerPushAudienceKnown",false));}
 public static void reconcile(Context context){final Context c=context.getApplicationContext();if(!configured(c)||!QUEUED.compareAndSet(false,true))return;WORKER.execute(()->{boolean retry=false;try{
  FirebaseMessaging f=FirebaseMessaging.getInstance();Set<String>wanted=desired(c),old=new HashSet<>(AppStore.store(c).getStringSet("ownerPushTopics",Collections.emptySet()));
  if(wanted.isEmpty())f.setAutoInitEnabled(false);
  for(String t:new HashSet<>(old))if(!wanted.contains(t)){Tasks.await(f.unsubscribeFromTopic(t),20,TimeUnit.SECONDS);old.remove(t);AppStore.store(c).edit().putStringSet("ownerPushTopics",new HashSet<>(old)).commit();}
  if(wanted.isEmpty()){
   if(AppStore.store(c).getBoolean("ownerPushRegistered",false)){Tasks.await(f.deleteToken(),20,TimeUnit.SECONDS);AppStore.store(c).edit().putBoolean("ownerPushRegistered",false).commit();}
  }else{
   if(!wanted.equals(desired(c))){retry=true;return;}f.setAutoInitEnabled(true);Tasks.await(f.getToken(),20,TimeUnit.SECONDS);AppStore.store(c).edit().putBoolean("ownerPushRegistered",true).commit();boolean force=AppStore.store(c).getBoolean("ownerPushNeedsResubscribe",false);
   for(String t:wanted){if(!wanted.equals(desired(c))){retry=true;return;}if(!old.contains(t)||force){Tasks.await(f.subscribeToTopic(t),20,TimeUnit.SECONDS);old.add(t);AppStore.store(c).edit().putStringSet("ownerPushTopics",new HashSet<>(old)).commit();}}
   AppStore.store(c).edit().putBoolean("ownerPushNeedsResubscribe",false).commit();
  }
  AppStore.store(c).edit().putString("ownerPushError","").putLong("ownerPushSyncAt",System.currentTimeMillis()).apply();retry=!wanted.equals(desired(c));
 }catch(Exception e){AppStore.store(c).edit().putString("ownerPushError","subscription-pending").apply();retry=true;}finally{QUEUED.set(false);if(retry)WORKER.schedule(()->reconcile(c),30,TimeUnit.SECONDS);}});}
 public static synchronized void receive(Context c,Map<String,String>data){long now=System.currentTimeMillis();PushPolicy.Message m=PushPolicy.parse(data,now);if(m==null)return;
  try{JSONObject seen=new JSONObject(AppStore.store(c).getString("ownerPushSeenV1","{}"));List<String> ids=new ArrayList<>();Iterator<String> keys=seen.keys();while(keys.hasNext())ids.add(keys.next());for(String id:ids)if(seen.optLong(id,0)<=now)seen.remove(id);if(seen.has(m.id)||seen.length()>=2048)return;seen.put(m.id,Long.parseLong(data.get("expires_at")));if(!AppStore.store(c).edit().putString("ownerPushSeenV1",seen.toString()).commit())return;}catch(JSONException|NumberFormatException e){return;}
  boolean quiet=ReminderPolicy.quietAt(now,AppStore.prefs(c),ZoneId.systemDefault());if(!AppStore.store(c).getBoolean("ownerPushAudienceKnown",false)||!PushPolicy.eligible(m,AppStore.store(c).getStringSet("ownerPushGames",Collections.emptySet()),AppStore.locale(c),AppStore.prefs(c).optBoolean("ownerPushEnabled",false),allowed(c),quiet))return;
  Intent intent=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).setData(Uri.parse("patchwork://open?game="+Uri.encode(m.game))).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);PendingIntent pending=PendingIntent.getActivity(c,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification n=new Notification.Builder(c,CHANNEL).setSmallIcon(R.drawable.ic_notification).setColor(0xFFC3E69A).setContentTitle(m.title).setContentText(m.body).setStyle(new Notification.BigTextStyle().bigText(m.body)).setContentIntent(pending).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build();try{c.getSystemService(NotificationManager.class).notify("owner-push:"+m.id,0,n);AppStore.store(c).edit().putLong("ownerPushLastPostedAt",now).apply();}catch(RuntimeException ignored){}
 }
}
