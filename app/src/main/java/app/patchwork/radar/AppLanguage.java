package app.patchwork.radar;
import java.util.*;
/** Display language is independent of the selected game service. */
public final class AppLanguage {
 private AppLanguage(){}
 public static String resolve(List<String> tags){for(String tag:tags){String l=Locale.forLanguageTag(tag.replace('_','-')).getLanguage();if(Arrays.asList("ko","en","ja","zh").contains(l))return l;}return "en";}
}
