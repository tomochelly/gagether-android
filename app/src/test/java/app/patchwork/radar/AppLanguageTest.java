package app.patchwork.radar;
import org.junit.Test;import java.util.*;import static org.junit.Assert.*;
public class AppLanguageTest {
 @Test public void resolvesRegionalAndScriptTags(){for(String[] pair:new String[][]{{"ko-KR","ko"},{"en-GB","en"},{"ja-JP","ja"},{"zh-Hant-TW","zh"},{"zh-Hans-CN","zh"}})assertEquals(pair[1],AppLanguage.resolve(Arrays.asList(pair[0])));}
 @Test public void usesNextSupportedPreferenceAndEnglishFallback(){assertEquals("ja",AppLanguage.resolve(Arrays.asList("fr-FR","ja-JP")));assertEquals("en",AppLanguage.resolve(Arrays.asList("fr-FR")));assertEquals("en",AppLanguage.resolve(Collections.emptyList()));}
}
