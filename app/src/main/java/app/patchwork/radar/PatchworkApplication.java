package app.patchwork.radar;
import android.app.Application;
public class PatchworkApplication extends Application {@Override public void onCreate(){super.onCreate();ReminderScheduler.channel(this);PushManager.channel(this);PushManager.reconcile(this);}}
