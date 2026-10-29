package app.patchwork.radar;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.AtomicFile;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public final class AppStore {
 private static final Object LOCK=new Object();
 public static SharedPreferences store(Context c){return c.getSharedPreferences("patchwork",Context.MODE_PRIVATE);}
 public static JSONObject defaults(Context c){
  JSONObject o=new JSONObject();String l=systemLocale(c);
  try{o.put("enabled",false).put("ownerPushEnabled",false).put("locale",l).put("localeMode","system").put("region",l.equals("ko")?"kr":l.equals("ja")?"jp":"global").put("games",new JSONArray()).put("gameRegions",new JSONObject()).put("kinds",new JSONArray(Arrays.asList("pickup","weapon","event","package"))).put("offsets",new JSONArray(Arrays.asList(1440,60))).put("starts",true).put("quietEnabled",true).put("quietStart",23).put("quietEnd",8).put("followMyGames",true).put("characterTone",false).put("broadcastsEnabled",false).put("broadcastOffsets",new JSONArray().put(15).put(0));o.put("notificationRules",ReminderSettings.normalize(new JSONObject().put("offsets",new JSONArray(Arrays.asList(1440,60,0)))));}catch(JSONException ignored){}return o;
 }
 public static String systemLocale(Context c){List<String> tags=new ArrayList<>();android.os.LocaleList locales=c.getResources().getConfiguration().getLocales();for(int i=0;i<locales.size();i++)tags.add(locales.get(i).toLanguageTag());return AppLanguage.resolve(tags);}
 public static JSONObject prefs(Context c){try{JSONObject p=new JSONObject(store(c).getString("preferences",defaults(c).toString()));String mode=p.optString("localeMode","system");p.put("localeMode",mode);if(!mode.equals("manual"))p.put("locale",systemLocale(c));return p;}catch(Exception ignored){return defaults(c);}}
 public static void setPrefs(Context c,JSONObject input)throws JSONException{
  if(input.has("ownerPushEnabled")&&!(input.opt("ownerPushEnabled") instanceof Boolean))throw new JSONException("Invalid push consent");JSONObject out=defaults(c);String mode=input.optString("localeMode",prefs(c).optString("localeMode","system"));if(!Arrays.asList("system","manual").contains(mode))throw new JSONException("Invalid language mode");String locale=mode.equals("system")?systemLocale(c):input.optString("locale","en"),region=input.optString("region",prefs(c).optString("region","global"));
  if(!new HashSet<>(Arrays.asList("ko","en","ja","zh")).contains(locale)||!new HashSet<>(Arrays.asList("kr","jp","global")).contains(region))throw new JSONException("Invalid preference");
  out.put("ownerPushEnabled",input.optBoolean("ownerPushEnabled",prefs(c).optBoolean("ownerPushEnabled",false)));out.put("locale",locale).put("localeMode",mode).put("region",region).put("enabled",input.optBoolean("enabled")).put("starts",input.optBoolean("starts",true)).put("quietEnabled",input.optBoolean("quietEnabled",true));
  out.put("quietStart",Math.max(0,Math.min(23,input.optInt("quietStart",23)))).put("quietEnd",Math.max(0,Math.min(23,input.optInt("quietEnd",8))));
  JSONArray gs=new JSONArray(),ks=new JSONArray(),os=new JSONArray();JSONObject regions=new JSONObject();
  for(String game:ReminderPolicy.GAME_IDS)if(ReminderPolicy.contains(input.optJSONArray("games"),game))gs.put(game);
  for(String kind:Arrays.asList("pickup","weapon","event","package"))if(ReminderPolicy.contains(input.optJSONArray("kinds"),kind))ks.put(kind);
  JSONArray offsets=input.optJSONArray("offsets");for(int off:Arrays.asList(60,1440,4320))if(offsets!=null)for(int i=0;i<offsets.length();i++)if(offsets.optInt(i)==off){os.put(off);break;}
  JSONObject requested=input.optJSONObject("gameRegions");if(requested!=null)for(String g:ReminderPolicy.GAME_IDS){String r=requested.optString(g);if(ReminderPolicy.supportsRegion(g,r))regions.put(g,r);}
  out.put("broadcastsEnabled",input.optBoolean("broadcastsEnabled",false)).put("broadcastOffsets",new JSONArray(ReminderSettings.clean(input.has("broadcastOffsets")?input.optJSONArray("broadcastOffsets"):new JSONArray().put(15).put(0))));
  out.put("games",gs).put("kinds",ks).put("offsets",os).put("gameRegions",regions).put("followMyGames",input.optBoolean("followMyGames",false)).put("characterTone",input.optBoolean("characterTone",false)).put("notificationRules",ReminderSettings.normalize(input));store(c).edit().putString("preferences",out.toString()).apply();
 }
 public static JSONObject feed(Context c){synchronized(LOCK){try{return new JSONObject(new String(new AtomicFile(new File(c.getFilesDir(),"schedule.json")).readFully(),StandardCharsets.UTF_8));}catch(Exception ignored){return new JSONObject();}}}
 public static boolean saveFeed(Context c,JSONObject feed)throws Exception{
  byte[] bytes=FeedValidator.encode(feed);
  synchronized(LOCK){AtomicFile file=new AtomicFile(new File(c.getFilesDir(),"schedule.json"));FileOutputStream out=null;try{out=file.startWrite();out.write(bytes);file.finishWrite(out);}catch(Exception e){if(out!=null)file.failWrite(out);throw e;}}
  store(c).edit().putLong("lastSyncAt",System.currentTimeMillis()).remove("syncError").apply();return true;
 }
 public static String locale(Context c){return prefs(c).optString("locale","ko");}
 public static boolean fresh(Context c){return System.currentTimeMillis()-store(c).getLong("lastSyncAt",0)<24L*3600000;}
 public static JSONObject entry(Context c,String id){List<JSONObject> entries=ReminderPolicy.records(feed(c));for(int i=0;i<entries.size();i++){JSONObject e=entries.get(i);if(e!=null&&id.equals(e.optString("id")))return e;}return null;}
}
