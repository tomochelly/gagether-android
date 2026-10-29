package app.patchwork.radar;
import org.json.*;
import java.util.*;
import java.time.*;
/** Widgets accept confirmed date facts separately from notification clocks. */
public final class WidgetPolicy {
 public static final class Row {
  public final JSONObject entry;public final long at;public final boolean start;public final String date;
  Row(JSONObject e,long time,boolean begins){this(e,time,begins,null);}
  Row(JSONObject e,long time,boolean begins,String day){entry=e;at=time;start=begins;date=day;}
  public boolean dateOnly(){return date!=null;}
  public String key(){return entry.optString("id")+"|"+(start?"start":"end")+(dateOnly()?"|"+date:"");}
 }
 public static LocalDate date(String value){try{return value.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")?LocalDate.parse(value):null;}catch(Exception ignored){return null;}}
 public static ZoneId dateZone(JSONObject prefs,ZoneId device){return switch(prefs.optString("locale")){case "ko"->ZoneId.of("Asia/Seoul");case "ja"->ZoneId.of("Asia/Tokyo");case "zh"->ZoneId.of("Asia/Shanghai");default->device;};}
 public static List<Row> rows(JSONObject feed,JSONObject prefs,long now,boolean grouped){
  return rows(feed,prefs,now,grouped,ZoneId.systemDefault());
 }
 public static List<Row> rows(JSONObject feed,JSONObject prefs,long now,boolean grouped,ZoneId device){
  ZoneId zone=dateZone(prefs,device);LocalDate today=Instant.ofEpochMilli(now).atZone(zone).toLocalDate();
  List<Row> rows=new ArrayList<>();JSONArray entries=feed.optJSONArray("entries");Set<String> seen=new HashSet<>();
  if(entries!=null)for(int i=0;i<entries.length();i++){
   JSONObject e=entries.optJSONObject(i);if(e==null||!ReminderPolicy.matches(e,prefs,feed))continue;
   JSONObject archive=e.optJSONObject("pickupArchive");if("forecast".equals(e.optString("status"))||archive!=null&&"forecast".equals(archive.optString("status")))continue;
   long start=ReminderPolicy.epoch(e.optString("startAt")),end=ReminderPolicy.epoch(e.optString("endAt"));
   if(end>0&&end<=now)continue;boolean begins=start>now;long at=begins?start:end;
   if(at<=now||at>now+90L*86400000)continue;Row row=new Row(e,at,begins);if(seen.add(row.key()))rows.add(row);
  }
  JSONArray dates=feed.optJSONArray("widgetEntries");
  if(dates!=null)for(int i=0;i<dates.length();i++){
   JSONObject e=dates.optJSONObject(i);if(e==null||!ReminderPolicy.matches(e,prefs,feed)||!e.optBoolean("dateOnly")||!"official".equals(e.optString("sourceKind"))||ReminderPolicy.epoch(e.optString("startAt"))!=0||ReminderPolicy.epoch(e.optString("endAt"))!=0||"forecast".equals(e.optString("status")))continue;
   JSONObject archive=e.optJSONObject("pickupArchive");if(archive!=null&&"forecast".equals(archive.optString("status")))continue;
   LocalDate start=date(e.optString("startDate")),end=date(e.optString("endDate"));
   if(start==null&&end==null||start!=null&&end!=null&&end.isBefore(start)||end!=null&&end.isBefore(today))continue;
   boolean begins=start!=null&&start.isAfter(today);LocalDate target=begins?start:end;
   if(target==null&&start!=null&&start.equals(today)){target=start;begins=true;}
   if(target==null||target.isBefore(today)||target.isAfter(today.plusDays(90)))continue;
   Row row=new Row(e,0,begins,target.toString());if(seen.add(row.key()))rows.add(row);
  }
  // Dates stay dates. A midnight value is never manufactured as a deadline.
  rows.sort(Comparator.comparing((Row r)->r.dateOnly()?LocalDate.parse(r.date):Instant.ofEpochMilli(r.at).atZone(zone).toLocalDate()).thenComparing(r->r.dateOnly()).thenComparingLong(r->r.at));
  if(grouped){Map<String,Integer> rank=new HashMap<>();for(Row row:rows)rank.putIfAbsent(row.entry.optString("gameId"),rank.size());rows.sort(Comparator.comparingInt((Row row)->rank.get(row.entry.optString("gameId"))));}
  return rows;
 }
 public static int selectedGames(JSONObject prefs){JSONArray games=prefs.optJSONArray("games");Set<String> unique=new HashSet<>();if(games!=null)for(int i=0;i<games.length();i++)if(ReminderPolicy.GAME_IDS.contains(games.optString(i)))unique.add(games.optString(i));return unique.size();}
}
