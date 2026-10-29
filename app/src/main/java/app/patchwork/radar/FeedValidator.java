package app.patchwork.radar;

import org.json.JSONException;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;

/** Validates the same payload consumed by native sync, reminders and widgets. */
public final class FeedValidator {
 private FeedValidator(){}
 public static byte[] encode(JSONObject feed)throws JSONException {
  if(feed.optInt("schemaVersion")!=1||feed.optJSONArray("entries")==null||feed.optJSONArray("games")==null||feed.getJSONArray("entries").length()>700)throw new JSONException("Unsupported schedule data");
  byte[] bytes=feed.toString().getBytes(StandardCharsets.UTF_8);
  if(bytes.length>1500000)throw new JSONException("Schedule too large");
  if(feed.has("broadcasts")&&(feed.optJSONArray("broadcasts")==null||feed.getJSONArray("broadcasts").length()>150))throw new JSONException("Invalid broadcasts");
  if(feed.has("widgetEntries")&&(feed.optJSONArray("widgetEntries")==null||feed.getJSONArray("widgetEntries").length()>700))throw new JSONException("Invalid widget dates");
  java.util.Set<String> ids=new java.util.HashSet<>();
  for(String collection:java.util.Arrays.asList("entries","broadcasts","widgetEntries")){org.json.JSONArray rows=feed.optJSONArray(collection);if(rows==null)continue;for(int i=0;i<rows.length();i++){JSONObject e=rows.getJSONObject(i);
   if(collection.equals("broadcasts")!=ReminderPolicy.isBroadcast(e))throw new JSONException("Invalid content collection");
   if(collection.equals("widgetEntries")){
    if(!e.optBoolean("dateOnly")||!e.isNull("startAt")||!e.isNull("endAt")||!"official".equals(e.optString("sourceKind")))throw new JSONException("Invalid date-only record");
    boolean hasStart=!e.isNull("startDate"),hasEnd=!e.isNull("endDate");
    if(!hasStart&&!hasEnd||hasStart&&WidgetPolicy.date(e.optString("startDate"))==null||hasEnd&&WidgetPolicy.date(e.optString("endDate"))==null||hasStart&&hasEnd&&e.optString("startDate").compareTo(e.optString("endDate"))>0)throw new JSONException("Invalid widget date");
   }
   if(!ids.add(e.optString("id")))throw new JSONException("Duplicate schedule identity");
   if(ReminderPolicy.isBroadcast(e)&&(e.optJSONObject("broadcast")==null||!e.isNull("startAt")||!e.isNull("endAt")))throw new JSONException("Invalid broadcast reservation");
   if(!ReminderPolicy.supportsRegion(e.optString("gameId"),e.optString("region"))||!e.optString("id").matches("[a-zA-Z0-9_-]{1,160}"))throw new JSONException("Invalid schedule");
  }
  }
  return bytes;
 }
}
