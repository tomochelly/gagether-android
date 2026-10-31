import type {OfficialBroadcast} from './types';

// The owner marks the state; the time of this edit is not the stream's actual end.
export function changeBroadcastStatus(b:OfficialBroadcast,status:OfficialBroadcast['status'],changedAt:string):OfficialBroadcast{
 return {...b,status,endedAt:status==='ended'?b.endedAt:null,statusCheckedAt:changedAt};
}
export const broadcastArchiveText={
 ko:{active:'예정·방송 중',ended:'방송 종료',replay:'다시 보기',empty:'종료된 방송이 없습니다.',status:'방송 상태',markEnded:'방송 종료로 변경',endedAt:'실제 종료 시각 (선택)'},
 en:{active:'Upcoming · Live',ended:'Ended broadcasts',replay:'Watch replay',empty:'No ended broadcasts.',status:'Broadcast status',markEnded:'Mark as ended',endedAt:'Actual end time (optional)'},
 ja:{active:'予定・配信中',ended:'配信終了',replay:'アーカイブを見る',empty:'終了した配信はありません。',status:'配信の状態',markEnded:'配信終了に変更',endedAt:'実際の終了時刻（任意）'},
 zh:{active:'预约・直播中',ended:'直播结束',replay:'观看回放',empty:'暂无已结束的直播。',status:'直播状态',markEnded:'标记为已结束',endedAt:'实际结束时间（选填）'}
};
