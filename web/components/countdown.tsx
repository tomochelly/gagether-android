import type {Locale} from '@/lib/types';
import {countdownIsUrgent,remainingTime} from '@/lib/schedule';

/** Keep each number and unit together; only exact deadlines under 24h are bold. */
export default function Countdown({at,now,locale,compact=false}:{at:string;now:number;locale:Locale;compact?:boolean}){
 const full=remainingTime(at,now,locale),parts=full.split(' ');
 return <time className="countdown-value" dateTime={at} data-urgent={countdownIsUrgent(at,now)} title={full} aria-label={full}>{(compact?parts.slice(0,2):parts).map((part,i)=><span key={i}>{i>0?' ':''}{part}</span>)}</time>;
}
