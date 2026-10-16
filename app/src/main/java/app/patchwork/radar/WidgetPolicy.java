package app.patchwork.radar;
import org.json.*;
import java.util.*;
/** Widget selection is independent of notification permission; only confirmed clocks enter it. */
public final class WidgetPolicy {
 public static final class Row {
  public final JSONObject entry;public final long at;public final boolean start;
  Row(JSONObject e,long time,boolean begins){entry=e;at=time;start=begins;}
  public String key(){return entry.optString("id")+"|"+(start?"start":"end");}
 }
 public static List<Row> rows(JSONObject feed,JSONObject prefs,long now,boolean grouped){
  List<Row> rows=new ArrayList<>();JSONArray entries=feed.optJSONArray("entries");Set<String> seen=new HashSet<>();
  if(entries!=null)for(int i=0;i<entries.length();i++){
   JSONObject e=entries.optJSONObject(i);if(e==null||!ReminderPolicy.matches(e,prefs,feed))continue;
   JSONObject archive=e.optJSONObject("pickupArchive");if("forecast".equals(e.optString("status"))||archive!=null&&"forecast".equals(archive.optString("status")))continue;
   long start=ReminderPolicy.epoch(e.optString("startAt")),end=ReminderPolicy.epoch(e.optString("endAt"));
   if(end>0&&end<=now)continue;boolean begins=start>now;long at=begins?start:end;
   if(at<=now||at>now+90L*86400000)continue;Row row=new Row(e,at,begins);if(seen.add(row.key()))rows.add(row);
  }
  rows.sort(Comparator.comparingLong(a->a.at));
  if(grouped){Map<String,Integer> rank=new HashMap<>();for(Row row:rows)rank.putIfAbsent(row.entry.optString("gameId"),rank.size());rows.sort(Comparator.comparingInt((Row row)->rank.get(row.entry.optString("gameId"))).thenComparingLong(row->row.at));}
  return rows;
 }
 public static int selectedGames(JSONObject prefs){JSONArray games=prefs.optJSONArray("games");Set<String> unique=new HashSet<>();if(games!=null)for(int i=0;i<games.length();i++)if(ReminderPolicy.GAME_IDS.contains(games.optString(i)))unique.add(games.optString(i));return unique.size();}
}
