package app.patchwork.radar;
import java.util.*;
/** Public announcement contract; contains no device/account identifiers. */
public final class PushPolicy {
 public static final Set<String> GAME_IDS=Collections.unmodifiableSet(new HashSet<>(Arrays.asList("wuwa","bluearchive","nikke","endfield","umamusume","nte","gfl2","arknights","genshin","hsr","zzz","trickcal","hi3","stellasora","reverse1999","limbus","dna","holodreams","silver-palace","azur-promilia","ananta")));
 public static final Set<String> LOCALES=Collections.unmodifiableSet(new HashSet<>(Arrays.asList("ko","en","ja","zh")));
 public static String topic(String game,String locale){if(!GAME_IDS.contains(game)||!LOCALES.contains(locale))throw new IllegalArgumentException("Invalid audience");return "gagether_game_"+game+"_"+locale+"_v1";}
 public static Set<String> topics(Collection<String> games,String locale,boolean enabled,boolean permission,boolean audienceKnown){Set<String> result=new TreeSet<>();if(enabled&&permission&&audienceKnown&&LOCALES.contains(locale))for(String id:games)if(GAME_IDS.contains(id))result.add(topic(id,locale));return result;}
 public static final class Message{public final String id,game,locale,title,body,path;public final long sentAt,expiresAt;Message(Map<String,String>d,long sent,long expires){id=d.get("id");game=d.get("game_id");locale=d.get("locale");title=d.get("title");body=d.get("body");path=d.get("path");sentAt=sent;expiresAt=expires;}}
 public static Message parse(Map<String,String>d,long now){try{
  if(d==null||d.size()!=9||!"1".equals(d.get("schema"))||!GAME_IDS.contains(d.get("game_id"))||!LOCALES.contains(d.get("locale"))||d.get("id")==null||!d.get("id").matches("[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}"))return null;
  String title=d.get("title"),body=d.get("body"),path="/"+d.get("locale")+"/games/"+d.get("game_id");if(title==null||title.trim().isEmpty()||title.length()>100||body==null||body.trim().isEmpty()||body.length()>500||!path.equals(d.get("path"))||(title+body).matches("(?s).*[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f].*"))return null;
  if(!d.getOrDefault("sent_at","").matches("[0-9]{13}")||!d.getOrDefault("expires_at","").matches("[0-9]{13}"))return null;long sent=Long.parseLong(d.get("sent_at")),expires=Long.parseLong(d.get("expires_at"));if(sent>now+300000||sent<now-3600000||expires<=sent||expires>sent+3600000||expires<=now)return null;return new Message(d,sent,expires);
 }catch(RuntimeException e){return null;}}
 public static boolean eligible(Message m,Collection<String>myGames,String locale,boolean optedIn,boolean permission,boolean quiet){return m!=null&&optedIn&&permission&&!quiet&&m.locale.equals(locale)&&myGames.contains(m.game);}
}
