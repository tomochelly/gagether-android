package app.patchwork.radar;
import org.json.*;
import org.junit.Test;
import java.time.Instant;
import java.util.*;
import static org.junit.Assert.*;
public class WidgetPolicyTest {
 final long now=Instant.parse("2026-10-17T00:00:00Z").toEpochMilli();
 JSONObject prefs()throws Exception{return new JSONObject("{\"region\":\"kr\",\"games\":[\"wuwa\",\"arknights\"],\"gameRegions\":{},\"kinds\":[\"pickup\",\"event\"]}");}
 JSONObject e(String id,String game,String region,long start,long end)throws Exception{return new JSONObject().put("id",id).put("gameId",game).put("region",region).put("kind","pickup").put("startAt",start==0?JSONObject.NULL:Instant.ofEpochMilli(start).toString()).put("endAt",end==0?JSONObject.NULL:Instant.ofEpochMilli(end).toString());}
 JSONObject feed(JSONObject... es)throws Exception{return new JSONObject().put("games",new JSONArray("[{\"id\":\"wuwa\",\"canonicalRegions\":{\"kr\":\"global\"}},{\"id\":\"arknights\",\"canonicalRegions\":{\"kr\":\"kr\",\"cn\":\"cn\"}}]")).put("entries",new JSONArray(Arrays.asList(es)));}
 @Test public void moreThanThreeGamesSchedulesRemainScrollable()throws Exception{JSONObject[] entries=new JSONObject[30];for(int i=0;i<30;i++)entries[i]=e("a"+i,"wuwa","global",now-1,now+(i+1)*3600000);assertEquals(30,WidgetPolicy.rows(feed(entries),prefs(),now,false).size());}
 @Test public void upcomingStartAndActiveEndAreDifferent()throws Exception{List<WidgetPolicy.Row> rows=WidgetPolicy.rows(feed(e("future","wuwa","global",now+1000,now+9000),e("active","wuwa","global",now-1,now+5000)),prefs(),now,false);assertTrue(rows.get(0).start);assertEquals(now+1000,rows.get(0).at);assertFalse(rows.get(1).start);}
 @Test public void groupedListKeepsAllGamesAndOrdersEachGame()throws Exception{JSONObject f=feed(e("a","wuwa","global",0,now+1000),e("b","arknights","kr",0,now+2000),e("c","wuwa","global",0,now+3000));List<WidgetPolicy.Row> rows=WidgetPolicy.rows(f,prefs(),now,true);assertEquals("a",rows.get(0).entry.getString("id"));assertEquals("c",rows.get(1).entry.getString("id"));assertEquals("b",rows.get(2).entry.getString("id"));}
 @Test public void unknownForecastExpiredWrongServerAreExcluded()throws Exception{JSONObject forecast=e("forecast","wuwa","global",now+1000,0).put("pickupArchive",new JSONObject().put("status","forecast"));JSONObject f=feed(forecast,e("unknown","wuwa","global",0,0),e("old","wuwa","global",0,now-1),e("jp","arknights","jp",0,now+1000));assertTrue(WidgetPolicy.rows(f,prefs(),now,false).isEmpty());}
 @Test public void cnChoiceAndEmptyFavoritesWork()throws Exception{JSONObject p=prefs().put("gameRegions",new JSONObject().put("arknights","cn"));JSONObject f=feed(e("cn","arknights","cn",0,now+1000));assertEquals(1,WidgetPolicy.rows(f,p,now,false).size());p.put("games",new JSONArray());assertTrue(WidgetPolicy.rows(f,p,now,false).isEmpty());}
 @Test public void deduplicatesSameEntryAndCountsGamesOnce()throws Exception{JSONObject a=e("same","wuwa","global",0,now+1000);assertEquals(1,WidgetPolicy.rows(feed(a,a),prefs(),now,false).size());assertEquals(2,WidgetPolicy.selectedGames(prefs()));}
}
