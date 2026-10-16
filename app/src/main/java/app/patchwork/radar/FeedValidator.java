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
  for(int i=0;i<feed.getJSONArray("entries").length();i++){
   JSONObject e=feed.getJSONArray("entries").getJSONObject(i);
   if(!ReminderPolicy.supportsRegion(e.optString("gameId"),e.optString("region"))||!e.optString("id").matches("[a-zA-Z0-9_-]{1,160}"))throw new JSONException("Invalid schedule");
  }
  return bytes;
 }
}
