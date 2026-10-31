import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const {default:Period}=await import('../components/document-period.tsx');
test('document periods display exact instants in the locale zone while date-only facts retain their literal dates',()=>{
 const props={startAt:'2026-10-28T21:00:00.000Z',endAt:'2026-11-04T21:00:00.000Z'};
 for(const[locale,zone,hour]of [['ko','Asia/Seoul','06:00'],['ja','Asia/Tokyo','6:00'],['zh','Asia/Shanghai','05:00'],['en','UTC','21:00']]){const html=renderToStaticMarkup(React.createElement(Period,{...props,locale})),text=html.replace(/<[^>]+>/g,'');assert.match(text,new RegExp(zone));assert.ok(text.includes(hour),text);assert.doesNotMatch(text,/T21:00:00|\.000Z/);assert.match(html,/dateTime="2026-10-28T21:00:00.000Z"/);}
 const dates=renderToStaticMarkup(React.createElement(Period,{locale:'en',startAt:null,endAt:null,startDate:'2028-02-29',endDate:'2028-03-01'}));assert.match(dates,/>2028-02-29<\/time> — <time/);assert.doesNotMatch(dates.replace(/<[^>]+>/g,''),/UTC|00:00|T/);
});
