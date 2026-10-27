package app.patchwork.radar;
import android.app.job.*;
import android.content.*;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
public final class SyncManager {
 public static final ExecutorService EXECUTOR=Executors.newSingleThreadExecutor();
 public static final int JOB=91345;
 public static void schedule(Context c){JobInfo job=new JobInfo.Builder(JOB,new ComponentName(c,SyncJobService.class)).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPeriodic(15*60*1000L,5*60*1000L).setPersisted(true).build();c.getSystemService(JobScheduler.class).schedule(job);}
 public static void once(Context c){Context app=c.getApplicationContext();EXECUTOR.execute(()->{try{sync(app);}catch(Exception ignored){}});}
 public static byte[] get(Context c,String path,int limit)throws Exception{
  if(!path.startsWith("/")||path.startsWith("//"))throw new IOException("Invalid path");
  HttpURLConnection conn=(HttpURLConnection)new URL(BuildConfig.SITE_ORIGIN+path).openConnection();conn.setInstanceFollowRedirects(false);conn.setConnectTimeout(15000);conn.setReadTimeout(20000);conn.setRequestProperty("Accept","application/json,image/*");conn.setRequestProperty("User-Agent","GAGETHER-Android/"+BuildConfig.VERSION_NAME);
  try{
   int code=conn.getResponseCode();if(code==401||code==403||code>=300&&code<400)throw new IOException("Service unavailable");if(code!=200)throw new IOException("HTTP "+code);
   String type=conn.getContentType();if(path.startsWith("/api/")&&(type==null||!type.contains("application/json")))throw new IOException("Service unavailable");
   try(InputStream in=conn.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(out.size()+n>limit)throw new IOException("Response too large");out.write(b,0,n);}return out.toByteArray();}
  }finally{conn.disconnect();}
 }
 public static void sync(Context c)throws Exception{
  try{
   JSONObject feed=new JSONObject(new String(get(c,"/api/mobile/data?locale="+AppStore.locale(c),1500000),StandardCharsets.UTF_8));accept(c,feed);
  }catch(Exception e){AppStore.store(c).edit().putString("syncError","offline").apply();DeadlineWidget.updateAll(c);throw e;}
 }
 public static void accept(Context c,JSONObject feed)throws Exception{AppStore.saveFeed(c,feed);ReminderScheduler.schedule(c);ReminderScheduler.notifyLiveBroadcasts(c);DeadlineWidget.updateAll(c);WidgetArtwork.refresh(c,feed);DeadlineWidget.updateAll(c);}
}
