export const PERSONAL_APPLIED='gagether:personal-applied';
export const PERSONAL_CHANGED='gagether:personal-changed';
export function personalChanged(){if(typeof window!=='undefined')window.dispatchEvent(new Event(PERSONAL_CHANGED));}
