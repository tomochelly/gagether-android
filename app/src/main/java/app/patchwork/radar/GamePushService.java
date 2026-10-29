package app.patchwork.radar;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
public class GamePushService extends FirebaseMessagingService{
 @Override public void onNewToken(String token){AppStore.store(this).edit().putBoolean("ownerPushRegistered",true).putBoolean("ownerPushNeedsResubscribe",true).apply();PushManager.reconcile(this);}
 @Override public void onMessageReceived(RemoteMessage message){PushManager.receive(this,message.getData());}
}
