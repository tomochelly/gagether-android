package app.patchwork.radar;

import org.json.*;
import org.junit.Test;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Arrays;
import static org.junit.Assert.*;

public class FeedValidatorTest {
 private JSONObject entry(String game,String region)throws Exception{return new JSONObject().put("id",game+"-"+region).put("gameId",game).put("region",region).put("kind","pickup").put("startAt","2026-10-15T03:00:00Z").put("endAt","2026-10-19T03:00:00Z");}
 private JSONObject feed(JSONObject... entries)throws Exception{return new JSONObject().put("schemaVersion",1).put("games",new JSONArray("[{\"id\":\"arknights\",\"canonicalRegions\":{\"kr\":\"kr\",\"jp\":\"jp\",\"global\":\"global\",\"cn\":\"cn\"}},{\"id\":\"gfl2\",\"canonicalRegions\":{\"kr\":\"kr\",\"cn\":\"cn\"}}]")).put("entries",new JSONArray(Arrays.asList(entries)));}
 @Test public void mixedFeedAcceptsTheThreeSupportedChineseServices()throws Exception{
  assertTrue(FeedValidator.encode(feed(entry("wuwa","global"),entry("arknights","kr"),entry("arknights","cn"),entry("gfl2","cn"),entry("reverse1999","cn"),entry("trickcal","kr"),entry("hi3","global"),entry("stellasora","global"))).length>0);
 }
 @Test public void otherChineseServicesAndUnknownGamesRemainRejected()throws Exception{
  for(String game:ReminderPolicy.GAME_IDS)if(!game.equals("arknights")&&!game.equals("gfl2")&&!game.equals("reverse1999"))assertThrows(JSONException.class,()->FeedValidator.encode(feed(entry(game,"cn"))));
  assertThrows(JSONException.class,()->FeedValidator.encode(feed(entry("unlisted","kr"))));
 }
 @Test public void chineseSelectionUsesOnlyThatGamesChineseSchedule()throws Exception{
  JSONObject f=feed(entry("arknights","kr"),entry("arknights","cn"),entry("gfl2","kr"),entry("gfl2","cn"));
  JSONObject p=new JSONObject("{\"enabled\":true,\"region\":\"kr\",\"games\":[\"arknights\",\"gfl2\"],\"gameRegions\":{\"arknights\":\"cn\",\"gfl2\":\"kr\"},\"kinds\":[\"pickup\"],\"offsets\":[60],\"quietEnabled\":false}");
  long now=Instant.parse("2026-10-17T03:00:00Z").toEpochMilli();
  assertEquals(2,ReminderPolicy.deadlines(f,p,now).size());
  assertTrue(ReminderPolicy.plan(f,p,now,ZoneId.of("Asia/Tokyo")).stream().allMatch(r->r.entryId.equals("arknights-cn")||r.entryId.equals("gfl2-kr")));
 }
 @Test public void allEighteenGamesHaveNativeCoverage(){assertEquals(18,ReminderPolicy.GAME_IDS.size());}
 @Test public void addedGamesUseCanonicalGlobalWithoutChangingStoredChoices()throws Exception{
  long now=Instant.parse("2026-10-17T03:00:00Z").toEpochMilli();
  for(String game:Arrays.asList("limbus","dna","holodreams")){
   JSONObject e=entry(game,"global");if(game.equals("dna"))e.put("kind","event");
   JSONObject f=feed(e).put("games",new JSONArray().put(new JSONObject().put("id",game).put("canonicalRegions",new JSONObject().put("kr","global").put("jp","global").put("global","global"))));
   assertTrue(FeedValidator.encode(f).length>0);
   for(String region:Arrays.asList("kr","jp","global")){
    JSONObject p=new JSONObject().put("enabled",true).put("games",new JSONArray().put(game)).put("region",region).put("kinds",new JSONArray().put(e.getString("kind"))).put("quietEnabled",false).put("offsets",new JSONArray().put(60));
    assertTrue(ReminderPolicy.matches(e,p,f));assertEquals(1,ReminderPolicy.deadlines(f,p,now).size());assertEquals(region,p.getString("region"));
    e.put("endAt",JSONObject.NULL);assertEquals(0,ReminderPolicy.deadlines(f,p,now).size());e.put("endAt","2026-10-19T03:00:00Z");
   }
  }
 }
 @Test public void malformedFeedRemainsRejected()throws Exception{
  assertThrows(JSONException.class,()->FeedValidator.encode(feed().put("schemaVersion",2)));
  assertThrows(JSONException.class,()->FeedValidator.encode(feed(entry("arknights","cn").put("id","../bad"))));
 }
}
