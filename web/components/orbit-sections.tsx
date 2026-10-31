'use client';
import {createContext,useContext,type ComponentProps} from 'react';
import PageSections from './page-sections';
import type {OrbitGroup,OrbitTab} from '@/lib/orbit';
import type {SectionId} from '@/lib/site-layout';
export const OrbitContext=createContext<{group:OrbitGroup;tab:OrbitTab}|null>(null);
export default function OrbitSections(props:ComponentProps<typeof PageSections>){const orbit=useContext(OrbitContext);if(!orbit||orbit.tab==='all')return <PageSections {...props}/>;
 let ids:SectionId[]=[];
 if(orbit.tab==='saved'||orbit.tab==='sources'||orbit.tab==='history'||orbit.tab==='videos'||orbit.tab==='weapons')ids=['content'];
 else if(orbit.group==='schedule')ids=(orbit.tab==='calendar'||orbit.tab==='overview')?['calendar','resets','deadlines','news']:[];
 else if(orbit.group==='news')ids=['version','broadcast','pv','events','content','social'];
 else if(orbit.group==='pickups')ids=['pickup','upcoming'];
 return <div className={'orbit-section-layout orbit-section-'+orbit.group+((orbit.tab==='calendar'||orbit.tab==='overview')?' is-calendar':'')}>{ids.map(id=>{const item=props.sections.find(s=>s.id===id);return item?.content?<section key={id} className={'orbit-piece orbit-piece-'+id} data-orbit-piece={id}>{item.content}</section>:null;})}</div>;
}
