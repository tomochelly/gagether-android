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
 @Test public void mixedFeedAcceptsOnlyTheTwoSupportedChineseServices()throws Exception{
  assertTrue(FeedValidator.encode(feed(entry("wuwa","global"),entry("arknights","kr"),entry("arknights","cn"),entry("gfl2","cn"))).length>0);
 }
 @Test public void otherChineseServicesAndUnknownGamesRemainRejected()throws Exception{
  for(String game:ReminderPolicy.GAME_IDS)if(!game.equals("arknights")&&!game.equals("gfl2"))assertThrows(JSONException.class,()->FeedValidator.encode(feed(entry(game,"cn"))));
  assertThrows(JSONException.class,()->FeedValidator.encode(feed(entry("unlisted","kr"))));
 }
 @Test public void chineseSelectionUsesOnlyThatGamesChineseSchedule()throws Exception{
  JSONObject f=feed(entry("arknights","kr"),entry("arknights","cn"),entry("gfl2","kr"),entry("gfl2","cn"));
  JSONObject p=new JSONObject("{\"enabled\":true,\"region\":\"kr\",\"games\":[\"arknights\",\"gfl2\"],\"gameRegions\":{\"arknights\":\"cn\",\"gfl2\":\"kr\"},\"kinds\":[\"pickup\"],\"offsets\":[60],\"quietEnabled\":false}");
  long now=Instant.parse("2026-10-17T03:00:00Z").toEpochMilli();
  assertEquals(2,ReminderPolicy.deadlines(f,p,now).size());
  assertTrue(ReminderPolicy.plan(f,p,now,ZoneId.of("Asia/Tokyo")).stream().allMatch(r->r.entryId.equals("arknights-cn")||r.entryId.equals("gfl2-kr")));
 }
 @Test public void malformedFeedRemainsRejected()throws Exception{
  assertThrows(JSONException.class,()->FeedValidator.encode(feed().put("schemaVersion",2)));
  assertThrows(JSONException.class,()->FeedValidator.encode(feed(entry("arknights","cn").put("id","../bad"))));
 }
}
