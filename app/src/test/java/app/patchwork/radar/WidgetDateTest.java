package app.patchwork.radar;
import org.json.*;import org.junit.Test;import java.nio.charset.StandardCharsets;import java.time.*;import java.util.*;import static org.junit.Assert.*;
public class WidgetDateTest {
 final long now=Instant.parse("2026-10-29T13:00:00Z").toEpochMilli();
 JSONObject feed()throws Exception{try(var in=getClass().getResourceAsStream("/widget-six-games.json")){return new JSONObject(new String(in.readAllBytes(),StandardCharsets.UTF_8));}}
 JSONObject prefs()throws Exception{return new JSONObject("{\"enabled\":true,\"locale\":\"ko\",\"region\":\"kr\",\"games\":[\"trickcal\",\"hi3\",\"reverse1999\",\"limbus\",\"dna\",\"holodreams\"],\"kinds\":[\"pickup\",\"event\"],\"quietEnabled\":false,\"offsets\":[60]}");}
 @Test public void allSixPublicSchedulesAppearAndDateFactsAreNotAlarms()throws Exception{
  JSONObject f=feed(),p=prefs();assertTrue(FeedValidator.encode(f).length>0);List<WidgetPolicy.Row> rows=WidgetPolicy.rows(f,p,now,false);assertEquals(6,rows.size());assertEquals(3,rows.stream().filter(WidgetPolicy.Row::dateOnly).count());
  Set<String> games=new HashSet<>();for(WidgetPolicy.Row r:rows){games.add(r.entry.getString("gameId"));if(r.dateOnly()){assertEquals(0,r.at);assertNotNull(WidgetPolicy.date(r.date));}}
  assertEquals(6,games.size());assertEquals(6,WidgetPolicy.selectedGames(p));
  Set<String> dateIds=new HashSet<>();for(WidgetPolicy.Row r:rows)if(r.dateOnly())dateIds.add(r.entry.getString("id"));
  assertTrue(ReminderPolicy.plan(f,p,now,ZoneId.of("Asia/Seoul")).stream().noneMatch(r->dateIds.contains(r.entryId)));
  JSONObject legacy=new JSONObject(f.toString());legacy.remove("widgetEntries");assertEquals(3,WidgetPolicy.rows(legacy,p,now,false).size());
 }
 @Test public void addedFavoritesAndExplicitEmptySelectionsAreHonored()throws Exception{
  JSONObject f=feed(),p=prefs().put("games",new JSONArray().put("limbus").put("dna").put("holodreams"));assertEquals(3,WidgetPolicy.rows(f,p,now,false).size());p.put("games",new JSONArray());assertTrue(WidgetPolicy.rows(f,p,now,false).isEmpty());
 }
 @Test public void invalidDatesAndFabricatedClockFailValidation()throws Exception{
  for(String bad:Arrays.asList("2026-02-30","2026-13-01","tomorrow","2026-10-29T00:00:00Z")){JSONObject f=feed();f.getJSONArray("widgetEntries").getJSONObject(0).put("endDate",bad);assertThrows(JSONException.class,()->FeedValidator.encode(f));}
  JSONObject f=feed();f.getJSONArray("widgetEntries").getJSONObject(0).put("endAt","2026-11-05T00:00:00Z");assertThrows(JSONException.class,()->FeedValidator.encode(f));
 }
 @Test public void dateEndsRemainVisibleThroughThatLocalDateAndRespectTheRealDeviceZone()throws Exception{
  JSONObject f=feed(),p=prefs().put("locale","en").put("games",new JSONArray().put("trickcal"));JSONObject e=f.getJSONArray("widgetEntries").getJSONObject(0);e.put("endDate","2026-10-29");
  long clock=Instant.parse("2026-10-30T02:00:00Z").toEpochMilli();assertEquals(1,WidgetPolicy.rows(f,p,clock,false,ZoneId.of("America/Los_Angeles")).size());assertEquals(0,WidgetPolicy.rows(f,p,clock,false,ZoneId.of("Asia/Tokyo")).size());
  assertEquals(ZoneId.of("Asia/Seoul"),WidgetPolicy.dateZone(prefs(),ZoneId.of("America/New_York")));
 }
}
