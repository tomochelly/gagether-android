package app.patchwork.radar;
/** GAGETHER-authored reminder copy. Game-fixed address, never rotating banner actors. */
public final class GameVoice {
 private static String pick(String l,String ko,String en,String ja,String zh){return switch(l){case "ko"->ko;case "ja"->ja;case "zh"->zh;default->en;};}
 public static String address(String game,String locale){return switch(game){
  case "wuwa"->pick(locale,"방랑자","Rover","漂泊者","漂泊者");
  case "bluearchive"->pick(locale,"선생님","Sensei","先生","老师");
  case "nikke","gfl2"->pick(locale,"지휘관","Commander","指揮官","指挥官");
  case "umamusume"->pick(locale,"트레이너","Trainer","トレーナー","训练员");
  case "arknights"->pick(locale,"박사","Doctor","ドクター","博士");
  case "endfield","limbus"->pick(locale,"관리자","Manager","管理人","管理者");
  case "genshin"->pick(locale,"여행자","Traveler","旅人","旅行者");
  case "hsr"->pick(locale,"개척자","Trailblazer","開拓者","开拓者");
  case "zzz"->pick(locale,"로프꾼","Proxy","プロキシ","绳匠");
  case "reverse1999"->pick(locale,"타임키퍼","Timekeeper","タイムキーパー","司辰");
  case "hi3"->pick(locale,"함장","Captain","艦長","舰长");
  case "trickcal"->pick(locale,"교주","Leader","教主","教主");
  default->"";
 };}
 public static String line(String game,String l,String title,String event,long at,long now){
  String address=address(game,l),prefix=address.isEmpty()?"":address+pick(l,", ",", ","、","，"),time=ReminderMessage.timing(l,event,at,now);
  if(now>=at)return prefix+title+pick(l,event.equals("start")?" 시작!":" 종료!",event.equals("start")?" has started!":" has ended!",event.equals("start")?"が始まったよ！":"が終了したよ！",event.equals("start")?"开始了！":"已结束！");
  if(l.equals("ko"))return prefix+title+" · "+time+(game.equals("wuwa")?" 남았어! 잊지 말라구!":game.equals("nikke")||game.equals("gfl2")?" 남았습니다.":" 남았어요!");
  return prefix+title+" · "+time+pick(l,"","!","だよ！","！");
 }
}
