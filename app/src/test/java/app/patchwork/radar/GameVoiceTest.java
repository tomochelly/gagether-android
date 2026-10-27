package app.patchwork.radar;
import org.junit.Test;import static org.junit.Assert.*;
public class GameVoiceTest {
 @Test public void playerAddressStaysFixedForEachGame(){assertEquals("방랑자",GameVoice.address("wuwa","ko"));assertEquals("선생님",GameVoice.address("bluearchive","ko"));assertEquals("지휘관",GameVoice.address("nikke","ko"));assertEquals("트레이너",GameVoice.address("umamusume","ko"));assertEquals("Sensei",GameVoice.address("bluearchive","en"));assertEquals("先生",GameVoice.address("bluearchive","ja"));assertEquals("指挥官",GameVoice.address("nikke","zh"));}
 @Test public void liveClockAndExactBoundaryNeverInventRemainingHours(){String line=GameVoice.line("wuwa","ko","루실라 픽업","end",10800000,0);assertTrue(line.startsWith("방랑자, 루실라 픽업"));assertTrue(line.contains("3시간"));assertTrue(GameVoice.line("bluearchive","ko","리콜렉트 모집","start",1000,1000).contains("시작!"));assertFalse(GameVoice.line("nikke","en","Recruitment","end",1000,1000).contains("in "));}
}
