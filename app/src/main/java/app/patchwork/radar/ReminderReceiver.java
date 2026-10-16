package app.patchwork.radar;
import android.content.*;
import org.json.*;
import java.time.ZoneId;
import java.util.*;
public class ReminderReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent intent){
  String key=intent.getStringExtra("key");if(key==null||!AppStore.fresh(c)||!AppStore.prefs(c).optBoolean("enabled")||!ReminderScheduler.allowed(c))return;
  String[] bits=key.split("\\|");if(bits.length!=4)return;
  try{
   long at=Long.parseLong(bits[2]);int offset=Integer.parseInt(bits[3]);long now=System.currentTimeMillis();JSONObject e=AppStore.entry(c,bits[0]),prefs=AppStore.prefs(c),feed=AppStore.feed(c);
   if(e==null||!ReminderPolicy.matches(e,prefs,feed)||ReminderPolicy.quietAt(now,prefs,ZoneId.systemDefault()))return;
   boolean start=bits[1].equals("start");if(!start&&!bits[1].equals("end"))return;
   if(start?!prefs.optBoolean("starts",true):!ReminderPolicy.contains(prefs.optJSONArray("offsets"),String.valueOf(offset)))return;
   long current=ReminderPolicy.epoch(e.optString(start?"startAt":"endAt"));if(at!=current||(!start&&now>=at)||(start&&now>at+6*3600000L)||now<at-offset*60000L-60000)return;
   Set<String> sent=new HashSet<>(AppStore.store(c).getStringSet("sent",Collections.emptySet()));if(sent.contains(key))return;
   String locale=AppStore.locale(c),game=ReminderPolicy.gameName(feed,e.optString("gameId"),locale);String title=ReminderPolicy.text(e.optJSONObject("title"),locale);
   ReminderScheduler.show(c,game+" · "+(start?Words.start(c):Words.before(c,offset)),title,e.optString("id"));
   if(sent.size()>400)sent.clear();sent.add(key);AppStore.store(c).edit().putStringSet("sent",sent).apply();DeadlineWidget.updateAll(c);
  }catch(Exception ignored){}
 }
}
