package app.patchwork.radar;
import org.json.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** A factual deadline is always shown; optional reviewed creative text is separate. */
public final class ReminderMessage {
 public final String title,body,entryId;public final boolean creative;
 ReminderMessage(String title,String body,String entryId,boolean creative){this.title=title;this.body=body;this.entryId=entryId;this.creative=creative;}
 private static String pick(String l,String ko,String en,String ja,String zh){return switch(l){case "ko"->ko;case "ja"->ja;case "zh"->zh;default->en;};}
 public static String timing(String l,String event,long at,long now){
  boolean start=event.equals("start");long minutes=Math.max(0,(long)Math.ceil((at-now)/60000.0));
  if(minutes==0)return start?pick(l,"시작됨","Started","開始しました","已开始"):pick(l,"종료됨","Ended","終了しました","已结束");
  String amount;if(minutes>=1440){long d=minutes/1440,h=(minutes%1440)/60;amount=pick(l,d+"일"+(h>0?" "+h+"시간":""),d+"d"+(h>0?" "+h+"h":""),d+"日"+(h>0?" "+h+"時間":""),d+"天"+(h>0?" "+h+"小时":""));}
  else if(minutes>=60){long h=minutes/60,m=minutes%60;amount=pick(l,h+"시간"+(m>0?" "+m+"분":""),h+"h"+(m>0?" "+m+"m":""),h+"時間"+(m>0?" "+m+"分":""),h+"小时"+(m>0?" "+m+"分钟":""));}
  else amount=pick(l,minutes+"분",minutes+"m",minutes+"分",minutes+"分钟");
  return start?pick(l,"시작까지 "+amount,"Starts in "+amount,"開始まで "+amount,"距开始 "+amount):pick(l,"종료까지 "+amount,"Ends in "+amount,"終了まで "+amount,"距结束 "+amount);
 }
 public static List<JSONObject> roster(JSONObject feed,JSONObject prefs,JSONObject entry,String event,long at){
  List<JSONObject> entries=ReminderPolicy.groupEntries(feed,prefs,entry,event,at),characters=new ArrayList<>();Set<String> seen=new HashSet<>();
  for(JSONObject e:entries){JSONArray list=e.optJSONArray("notificationCharacters");if(list!=null)for(int i=0;i<list.length();i++){JSONObject ch=list.optJSONObject(i);if(ch!=null&&seen.add(ch.optString("id"))){characters.add(ch);}}}
  characters.sort(Comparator.comparing(ch->ch.optString("id")));return characters;
 }
 public static ReminderMessage create(JSONObject feed,JSONObject prefs,JSONObject entry,String event,long at,int offset,long now,ZoneId zone){
  String l=prefs.optString("locale","en"),game=ReminderPolicy.gameName(feed,entry.optString("gameId"),l),label=timing(l,event,at,now),id=entry.optString("id");
  if(ReminderPolicy.isBroadcast(entry)){
   JSONObject b=entry.optJSONObject("broadcast");if(b==null)return new ReminderMessage(game,"",id,false);boolean program=ReminderPolicy.epoch(b.optString("programStartAt"))>0;
   String time=Instant.ofEpochMilli(at).atZone(zone).format(DateTimeFormatter.ofPattern("MM-dd HH:mm z",Locale.forLanguageTag(l)));
   String when=program?pick(l,"본방 시작 ","Program starts ","本編開始 ","正片开始 "):pick(l,"예약 송출 ","Scheduled transmission ","予約配信 ","预约开播 ");
   return new ReminderMessage(game+" · "+pick(l,"공식 방송","Official broadcast","公式配信","官方直播")+" · "+(now>=at?pick(l,"방송 예약 시각","Scheduled broadcast time","配信予約時刻","预约开播时间"):timing(l,"start",at,now)),ReminderPolicy.text(entry.optJSONObject("title"),l)+"\n"+when+time,id,false);
  }
  List<JSONObject> peers=ReminderPolicy.groupEntries(feed,prefs,entry,event,at);List<String> titles=new ArrayList<>();
  for(JSONObject e:peers){String t=ReminderPolicy.text(e.optJSONObject("title"),l);if(!t.isEmpty()&&!titles.contains(t))titles.add(t);}
  String factual=String.join(" · ",titles);String clock=Instant.ofEpochMilli(at).atZone(zone).format(DateTimeFormatter.ofPattern("MM-dd HH:mm z",Locale.forLanguageTag(l)));
  factual+="\n"+pick(l,event.equals("start")?"시작 ":"종료 ",event.equals("start")?"Starts ":"Ends ",event.equals("start")?"開始 ":"終了 ",event.equals("start")?"开始 ":"结束 ")+clock;
  if(prefs.optBoolean("characterTone",false)){
   List<String> names=new ArrayList<>();for(JSONObject ch:roster(feed,prefs,entry,event,at)){String name=ReminderPolicy.text(ch.optJSONObject("name"),l);if(!name.isEmpty())names.add(name);}
   String subject=names.isEmpty()?String.join(" · ",titles):String.join(" / ",names)+pick(l," 픽업"," banner","ピックアップ","招募");
   return new ReminderMessage(game+" · "+label,GameVoice.line(entry.optString("gameId"),l,subject,event,at,now)+"\n"+factual,id,true);
  }
  return new ReminderMessage(game+" · "+label,factual,id,false);
 }
}
