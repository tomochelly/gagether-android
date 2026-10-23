package app.patchwork.radar;
import org.json.*;
import java.util.*;

/** Versioned per-content rules. Legacy preferences retain their original behaviour. */
public final class ReminderSettings {
 public static final List<String> KINDS=Arrays.asList("pickup","weapon","event","package");
 public static List<Integer> clean(JSONArray values){
  TreeSet<Integer> out=new TreeSet<>(Comparator.reverseOrder());
  if(values!=null)for(int i=0;i<values.length();i++){Object v=values.opt(i);if(v instanceof Number){double d=((Number)v).doubleValue();if(d==Math.rint(d)&&d>=0&&d<=10080)out.add((int)d);}}
  return new ArrayList<>(out).subList(0,Math.min(8,out.size()));
 }
 public static List<Integer> offsets(JSONObject prefs,String kind,String event){
  if(kind.equals("broadcast"))return event.equals("broadcast")&&prefs.optBoolean("broadcastsEnabled",false)?clean(prefs.has("broadcastOffsets")?prefs.optJSONArray("broadcastOffsets"):new JSONArray().put(15).put(0)):Collections.emptyList();
  if(!KINDS.contains(kind)||!Arrays.asList("start","end").contains(event))return Collections.emptyList();
  JSONObject all=prefs.optJSONObject("notificationRules"),rule=all==null?null:all.optJSONObject(kind);boolean start=event.equals("start");
  if(rule!=null){if(!rule.optBoolean(start?"starts":"ends",true))return Collections.emptyList();return clean(rule.optJSONArray(start?"startOffsets":"endOffsets"));}
  return start?(prefs.optBoolean("starts",true)?Collections.singletonList(0):Collections.emptyList()):clean(prefs.optJSONArray("offsets"));
 }
 public static JSONObject normalize(JSONObject input)throws JSONException{
  JSONObject result=new JSONObject(),all=input.optJSONObject("notificationRules");
  for(String kind:KINDS){JSONObject r=all==null?null:all.optJSONObject(kind);boolean starts=r==null?input.optBoolean("starts",true):r.optBoolean("starts",true),ends=r==null||r.optBoolean("ends",true);
   JSONArray start=r!=null&&r.has("startOffsets")?r.optJSONArray("startOffsets"):new JSONArray().put(0);
   JSONArray end=r!=null&&r.has("endOffsets")?r.optJSONArray("endOffsets"):input.optJSONArray("offsets");
   result.put(kind,new JSONObject().put("starts",starts).put("ends",ends).put("startOffsets",new JSONArray(clean(start))).put("endOffsets",new JSONArray(clean(end))));
  }return result;
 }
 public static boolean due(JSONObject entry,JSONObject prefs,String event,long at,int offset,long now){
  if(!offsets(prefs,entry.optString("kind"),event).contains(offset))return false;
  if(ReminderPolicy.isBroadcast(entry)&&!ReminderPolicy.broadcastEligible(entry,now))return false;
  long current=ReminderPolicy.eventAt(entry,event);
  if(current==0||at!=current||now<at-offset*60000L)return false;
  // An early reminder must never arrive after its deadline. An exact-time reminder
  // may be delayed by Android, but is discarded after six hours.
  return offset==0?now<=at+6*3600000L:now<at;
 }
}
