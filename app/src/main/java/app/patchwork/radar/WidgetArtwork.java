package app.patchwork.radar;
import android.content.Context;
import android.graphics.*;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
public final class WidgetArtwork {
 private static File file(Context c,JSONObject art)throws Exception{String identity=art.toString();byte[] hash=MessageDigest.getInstance("SHA-256").digest(identity.getBytes(StandardCharsets.UTF_8));StringBuilder key=new StringBuilder();for(byte b:hash)key.append(String.format("%02x",b));File dir=new File(c.getCacheDir(),"widget-art");dir.mkdirs();return new File(dir,key+".png");}
 public static Bitmap cached(Context c,JSONObject entry){try{JSONObject art=entry.optJSONObject("artwork");if(art==null)return null;File f=file(c,art);return f.exists()?BitmapFactory.decodeFile(f.getAbsolutePath()):null;}catch(Exception e){return null;}}
 public static void refresh(Context c,JSONObject feed){List<JSONObject> rows=ReminderPolicy.deadlines(feed,AppStore.prefs(c),System.currentTimeMillis());if(rows.isEmpty())return;JSONObject art=rows.get(0).optJSONObject("artwork");if(art==null)return;
  try{File dest=file(c,art);if(dest.exists())return;String path=art.optString("path");if(!path.matches("/assets/[a-zA-Z0-9_./-]+")||path.contains(".."))return;
   byte[] bytes=SyncManager.get(c,path,20000000);BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);if(options.outWidth<1||options.outHeight<1)return;options.inSampleSize=1;while(Math.max(options.outWidth,options.outHeight)/options.inSampleSize>1200)options.inSampleSize*=2;options.inJustDecodeBounds=false;Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);if(bitmap==null)return;
   JSONObject b=art.optJSONObject("bounds"),f=art.optJSONObject("focus");double left=b==null?0:b.optDouble("left",0),right=b==null?100:b.optDouble("right",100),top=b==null?0:b.optDouble("top",0),bottom=b==null?100:b.optDouble("bottom",100);
   int x0=(int)(bitmap.getWidth()*Math.max(0,left)/100),x1=(int)(bitmap.getWidth()*Math.min(100,right)/100),y0=(int)(bitmap.getHeight()*Math.max(0,top)/100),y1=(int)(bitmap.getHeight()*Math.min(100,bottom)/100);int crop=Math.min(x1-x0,y1-y0);if(crop<1){bitmap.recycle();return;}
   double zoom=f==null?1.4:Math.max(1,f.optDouble("zoom",1.4));crop=Math.max(1,(int)(crop/Math.min(2.2,zoom)));
   int fx=(int)(bitmap.getWidth()*(f==null?50:f.optDouble("x",50))/100),fy=(int)(bitmap.getHeight()*(f==null?32:f.optDouble("y",32))/100);int x=Math.max(x0,Math.min(x1-crop,fx-crop/2)),y=Math.max(y0,Math.min(y1-crop,fy-(int)(crop*.38)));
   Bitmap cut=Bitmap.createBitmap(bitmap,x,y,crop,crop);Bitmap scaled=Bitmap.createScaledBitmap(cut,Math.min(256,crop),Math.min(256,crop),true);try(FileOutputStream out=new FileOutputStream(dest)){scaled.compress(Bitmap.CompressFormat.PNG,100,out);}if(scaled!=cut)scaled.recycle();if(cut!=bitmap)cut.recycle();bitmap.recycle();
   File[] old=dest.getParentFile().listFiles();if(old!=null&&old.length>30){Arrays.sort(old,Comparator.comparingLong(File::lastModified));for(int i=0;i<old.length-20;i++)old[i].delete();}
  }catch(Exception ignored){}
 }
}
