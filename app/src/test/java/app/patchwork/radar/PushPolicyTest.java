package app.patchwork.radar;
import org.junit.Test;import static org.junit.Assert.*;import java.util.*;
public class PushPolicyTest{
 private final long now=1793268000000L;
 private Map<String,String> message(){Map<String,String>d=new HashMap<>();d.put("schema","1");d.put("id","4c911df2-bd60-48d8-807a-a35dbe07dbf2");d.put("game_id","wuwa");d.put("locale","ko");d.put("title","명조 방송 시작");d.put("body","공식 방송을 확인하세요.");d.put("path","/ko/games/wuwa");d.put("sent_at",Long.toString(now));d.put("expires_at",Long.toString(now+3600000));return d;}
 @Test public void publicMessageTargetsExactGamesAndLanguageWithoutChangingReminderSettings(){
  PushPolicy.Message m=PushPolicy.parse(message(),now);assertNotNull(m);assertEquals("/ko/games/wuwa",m.path);assertTrue(PushPolicy.eligible(m,Arrays.asList("wuwa","nte"),"ko",true,true,false));
  assertFalse(PushPolicy.eligible(m,Arrays.asList("nte"),"ko",true,true,false));assertFalse(PushPolicy.eligible(m,Arrays.asList("wuwa"),"en",true,true,false));assertFalse(PushPolicy.eligible(m,Arrays.asList("wuwa"),"ko",false,true,false));assertFalse(PushPolicy.eligible(m,Arrays.asList("wuwa"),"ko",true,false,false));assertFalse(PushPolicy.eligible(m,Arrays.asList("wuwa"),"ko",true,true,true));
 }
 @Test public void subscriptionsRequireSeparateConsentPermissionAndLoadedMyGames(){
  assertEquals(new TreeSet<>(Arrays.asList("gagether_game_nte_en_v1","gagether_game_wuwa_en_v1")),PushPolicy.topics(Arrays.asList("wuwa","nte","unknown"),"en",true,true,true));
  assertTrue(PushPolicy.topics(Arrays.asList("wuwa"),"ko",false,true,true).isEmpty());assertTrue(PushPolicy.topics(Arrays.asList("wuwa"),"ko",true,false,true).isEmpty());assertTrue(PushPolicy.topics(Arrays.asList("wuwa"),"ko",true,true,false).isEmpty());assertTrue(PushPolicy.topics(Arrays.asList("wuwa"),"ko",true,true,true).contains("gagether_game_wuwa_ko_v1"));
 }
 @Test public void rejectsExpiredMessagesClockAbuseForeignLinksUnknownGamesAndOversizedCopy(){
  for(String[]v:new String[][]{{"path","https://example.test"},{"path","/ko/games/nte"},{"game_id","other"},{"locale","all"},{"schema","2"},{"id","unbounded-id"},{"expires_at",Long.toString(now-1)},{"expires_at",Long.toString(now+3600001)},{"sent_at",Long.toString(now+300001)},{"title",""}}){Map<String,String>d=message();d.put(v[0],v[1]);assertNull(v[0],PushPolicy.parse(d,now));}
  Map<String,String>d=message();d.put("body",String.join("",Collections.nCopies(501,"a")));assertNull(PushPolicy.parse(d,now));d=message();d.put("unexpected","data");assertNull(PushPolicy.parse(d,now));
 }
}
