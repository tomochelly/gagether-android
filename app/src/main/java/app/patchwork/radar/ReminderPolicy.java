package app.patchwork.radar;

import org.json.JSONArray;
import org.json.JSONObject;
import java.time.Instant;
import java.time.ZoneId;
import java.util.*;

/** Pure scheduling rules, shared by background sync, reminders and widget selection. */
public final class ReminderPolicy {
 public static final Set<String> GAME_IDS=new HashSet<>(Arrays.asList("wuwa","bluearchive","nikke","endfield","umamusume","nte","gfl2","arknights","genshin","hsr","zzz"));
 public static boolean supportsRegion(String game,String region){
  return GAME_IDS.contains(game)&&(Arrays.asList("kr","jp","global").contains(region)||("cn".equals(region)&&("arknights".equals(game)||"gfl2".equals(game))));
 }
 public static long epoch(String iso){try{return Instant.parse(iso).toEpochMilli();}catch(Exception ignored){try{return java.time.OffsetDateTime.parse(iso).toInstant().toEpochMilli();}catch(Exception ignored2){return 0;}}}
 public static String text(JSONObject value,String locale){if(value==null)return "";String s=value.optString(locale,"");return s.isEmpty()?value.optString("en",""):s;}
 public static boolean contains(JSONArray values,String key){if(values==null)return false;for(int i=0;i<values.length();i++)if(key.equals(values.optString(i)))return true;return false;}
 public static boolean quietAt(long time,JSONObject prefs,ZoneId zone){
  if(!prefs.optBoolean("quietEnabled",true))return false;int hour=Instant.ofEpochMilli(time).atZone(zone).getHour(),start=prefs.optInt("quietStart",23),end=prefs.optInt("quietEnd",8);
  return start==end?false:start<end?hour>=start&&hour<end:hour>=start||hour<end;
 }
 public static boolean matches(JSONObject entry,JSONObject prefs,JSONObject feed){
  String game=entry.optString("gameId"),wanted=prefs.optString("region","kr");
  if(!supportsRegion(game,entry.optString("region")))return false;
  if(!contains(prefs.optJSONArray("games"),game)||!contains(prefs.optJSONArray("kinds"),entry.optString("kind")))return false;
  JSONObject overrides=prefs.optJSONObject("gameRegions");if(overrides!=null)wanted=overrides.optString(game,wanted);
  if(!supportsRegion(game,wanted))return false;
  JSONArray games=feed.optJSONArray("games");if(games==null)return false;
  for(int i=0;i<games.length();i++){JSONObject g=games.optJSONObject(i);if(g!=null&&game.equals(g.optString("id"))){JSONObject mapping=g.optJSONObject("canonicalRegions");return entry.optString("region").equals(mapping==null?wanted:mapping.optString(wanted,wanted));}}
  return false;
 }
 public static List<JSONObject> deadlines(JSONObject feed,JSONObject prefs,long now){
  List<JSONObject> list=new ArrayList<>();JSONArray entries=feed.optJSONArray("entries");if(entries==null)return list;
  for(int i=0;i<entries.length();i++){JSONObject e=entries.optJSONObject(i);if(e!=null&&matches(e,prefs,feed)&&epoch(e.optString("endAt"))>now&& (epoch(e.optString("startAt"))==0||epoch(e.optString("startAt"))<=now))list.add(e);}
  list.sort(Comparator.comparingLong(e->epoch(e.optString("endAt"))));return list;
 }
 public static final class Reminder {
  public final String entryId,event;public final long eventAt,fireAt;public final int offset;
  Reminder(String id,String event,long at,long fire,int offset){this.entryId=id;this.event=event;eventAt=at;fireAt=fire;this.offset=offset;}
  public String key(){return entryId+"|"+event+"|"+eventAt+"|"+offset;}
 }
 public static String groupKey(JSONObject e,String event,long at){
  String group=e.optString("notificationGroup");
  return ("pickup".equals(e.optString("kind"))&&!group.isEmpty()?e.optString("gameId")+"/"+e.optString("region")+"/"+group:e.optString("id"))+"|"+event+"|"+at;
 }
 public static List<JSONObject> groupEntries(JSONObject feed,JSONObject prefs,JSONObject entry,String event,long at){
  List<JSONObject> peers=new ArrayList<>();JSONArray all=feed.optJSONArray("entries");String key=groupKey(entry,event,at);
  if(all!=null)for(int i=0;i<all.length();i++){JSONObject e=all.optJSONObject(i);if(e!=null&&matches(e,prefs,feed)&&epoch(e.optString(event.equals("start")?"startAt":"endAt"))==at&&key.equals(groupKey(e,event,at)))peers.add(e);}
  peers.sort(Comparator.comparing(e->e.optString("id")));if(peers.isEmpty())peers.add(entry);return peers;
 }
 public static List<Reminder> plan(JSONObject feed,JSONObject prefs,long now,ZoneId zone){
  List<Reminder> result=new ArrayList<>();if(!prefs.optBoolean("enabled",false))return result;
  JSONArray entries=feed.optJSONArray("entries");if(entries==null)return result;Set<String> seen=new HashSet<>();
  List<JSONObject> ordered=new ArrayList<>();for(int i=0;i<entries.length();i++){JSONObject e=entries.optJSONObject(i);if(e!=null)ordered.add(e);}ordered.sort(Comparator.comparing(e->e.optString("id")));
  for(JSONObject e:ordered){
   if(!matches(e,prefs,feed))continue;String id=e.optString("id");long start=epoch(e.optString("startAt"));
   for(String event:Arrays.asList("start","end")){
    long at=epoch(e.optString(event.equals("start")?"startAt":"endAt"));if(at<=now)continue;
    for(int offset:ReminderSettings.offsets(prefs,e.optString("kind"),event)){
     long fire=at-offset*60000L;String identity=groupKey(e,event,at)+"|"+offset;
     if(fire>now&&fire<now+90L*86400000&&(event.equals("start")||start==0||fire>=start)&&!quietAt(fire,prefs,zone)&&seen.add(identity))result.add(new Reminder(id,event,at,fire,offset));
    }
   }
  }
  result.sort(Comparator.comparingLong((Reminder r)->r.fireAt).thenComparing(r->r.entryId));return result.subList(0,Math.min(80,result.size()));
 }
 public static String gameName(JSONObject feed,String id,String locale){JSONArray gs=feed.optJSONArray("games");if(gs!=null)for(int i=0;i<gs.length();i++){JSONObject g=gs.optJSONObject(i);if(g!=null&&id.equals(g.optString("id")))return text(g.optJSONObject("name"),locale);}return id;}
}
