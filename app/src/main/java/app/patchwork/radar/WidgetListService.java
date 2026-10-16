package app.patchwork.radar;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.widget.*;
import org.json.*;
import java.util.*;
/** Android 8–11 collection fallback. Android 12+ uses RemoteCollectionItems. */
public class WidgetListService extends RemoteViewsService {
 @Override public RemoteViewsFactory onGetViewFactory(Intent intent){final int id=intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,-1);return new RemoteViewsFactory(){
  JSONObject feed=new JSONObject();List<WidgetPolicy.Row> rows=Collections.emptyList();
  public void onCreate(){onDataSetChanged();}public void onDestroy(){}public void onDataSetChanged(){feed=AppStore.feed(WidgetListService.this);rows=WidgetPolicy.rows(feed,AppStore.prefs(WidgetListService.this),System.currentTimeMillis(),DeadlineWidget.grouped(WidgetListService.this,id));}
  public int getCount(){return rows.size();}public RemoteViews getViewAt(int p){return p<0||p>=rows.size()?null:DeadlineWidget.rowView(WidgetListService.this,feed,rows.get(p));}public RemoteViews getLoadingView(){return null;}public int getViewTypeCount(){return 1;}public long getItemId(int p){return p<0||p>=rows.size()?0:DeadlineWidget.stableId(rows.get(p).key());}public boolean hasStableIds(){return true;}
 };}
}
