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
   if(!ReminderSettings.due(e,prefs,bits[1],at,offset,now))return;
   Set<String> sent=new HashSet<>(AppStore.store(c).getStringSet("sent",Collections.emptySet()));String delivery=ReminderPolicy.groupKey(e,bits[1],at)+"|"+offset;if(sent.contains(key)||sent.contains(delivery))return;
   ReminderMessage message=ReminderMessage.create(feed,prefs,e,bits[1],at,offset,now,ZoneId.systemDefault());
   ReminderScheduler.show(c,message.title,message.body,message.entryId);
   if(sent.size()>400)sent.clear();sent.add(key);sent.add(delivery);AppStore.store(c).edit().putStringSet("sent",sent).apply();DeadlineWidget.updateAll(c);
  }catch(Exception ignored){}
 }
}
