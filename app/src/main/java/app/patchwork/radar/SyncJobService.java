package app.patchwork.radar;
import android.app.job.*;
public class SyncJobService extends JobService {
 @Override public boolean onStartJob(JobParameters params){SyncManager.EXECUTOR.execute(()->{boolean retry=false;try{SyncManager.sync(this);}catch(Exception e){retry=!(e instanceof SecurityException);}jobFinished(params,retry);});return true;}
 @Override public boolean onStopJob(JobParameters params){return true;}
}
