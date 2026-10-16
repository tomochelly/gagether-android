package app.patchwork.radar;
import android.content.*;
public class BootReceiver extends BroadcastReceiver {@Override public void onReceive(Context c,Intent i){SyncManager.schedule(c);ReminderScheduler.schedule(c);DeadlineWidget.updateAll(c);}}
