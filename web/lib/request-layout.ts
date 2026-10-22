import {cookies,headers} from 'next/headers';

// Render a returning mobile visitor's chosen layout before any artwork is requested.
// The client media query takes over on resize (including Fold and multi-window).
export async function requestLayout(){
 const [c,h]=await Promise.all([cookies(),headers()]);
 return {initialMobileView:c.get('gagether.mobile-view')?.value==='simple'?'simple' as const:'full' as const,initialCompactWidth:/Android|Mobile|iPhone|iPad/i.test(h.get('user-agent')||'')};
}
