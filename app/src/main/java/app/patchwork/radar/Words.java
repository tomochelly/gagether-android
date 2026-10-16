package app.patchwork.radar;
import android.content.Context;
public final class Words {
 public static String pick(Context c,String ko,String en,String ja,String zh){return switch(AppStore.locale(c)){case "en"->en;case "ja"->ja;case "zh"->zh;default->ko;};}
 public static String start(Context c){return pick(c,"시작","Starts","開始","开始");}
 public static String end(Context c){return pick(c,"종료","Ends","終了","结束");}
 public static String refresh(Context c){return pick(c,"새로고침","Refresh","更新","刷新");}
 public static String reminders(Context c){return pick(c,"일정 알림","Schedule reminders","予定の通知","日程提醒");}
 public static String test(Context c){return pick(c,"알림이 정상적으로 표시됩니다.","Notifications are working.","通知が正常に表示されています。","通知已正常显示。");}
 public static String empty(Context c){return pick(c,"앱 설정에서 관심 게임을 선택하세요.","Choose games in App settings.","アプリ設定でゲームを選択してください。","请在应用设置中选择游戏。");}
 public static String none(Context c){return pick(c,"확인된 현재·예정 일정이 없습니다.","No confirmed current or upcoming schedules.","確認済みの開催中・今後の予定はありません。","暂无已确认的当前或未来日程。");}
 public static String stale(Context c){return pick(c,"앱을 열어 최신 일정을 동기화하세요.","Open the app to sync current schedules.","アプリを開いて最新の予定を同期してください。","请打开应用同步最新日程。");}
 public static String last(Context c){return pick(c,"갱신","Updated","更新","更新");}
 public static String retry(Context c){return pick(c,"다시 연결","Retry","再試行","重试");}
 public static String offline(Context c){return pick(c,"사이트에 연결할 수 없습니다.","Cannot connect to the site.","サイトに接続できません。","无法连接网站。");}
 public static String before(Context c,int minutes){int value=minutes>=1440?minutes/1440:minutes/60;String unit=minutes>=1440?pick(c,"일","days","日","天"):pick(c,"시간","hours","時間","小时");return pick(c,"종료 "+value+unit+" 전",value+" "+unit+" before end","終了"+value+unit+"前","结束前"+value+unit);}
}
