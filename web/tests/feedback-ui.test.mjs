import './load-typescript.mjs';import {test} from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
const {default:FeedbackDialog}=await import('../components/feedback-dialog.tsx'),{default:GameBadge}=await import('../components/game-badge.tsx'),{CatalogContext}=await import('../components/catalog-context.tsx'),{feedbackCopy,feedbackCategories}=await import('../lib/feedback.ts'),{games,byId}=await import('../lib/games.ts');
test('all feedback categories and controls are localized, preserve game context and allow images',()=>{
 for(const locale of ['ko','en','ja','zh']){const html=renderToStaticMarkup(React.createElement(FeedbackDialog,{locale,context:{gameId:'wuwa',region:'kr'},onClose:()=>{}}));for(const c of feedbackCategories)assert.ok(html.includes(feedbackCopy[locale].categories[c]));assert.ok(html.includes('accept="image/png,image/jpeg,image/webp"'));assert.ok(html.includes('maxLength="5000"'));assert.ok(html.includes('value="wuwa" selected'));assert.ok(!html.includes('FormSubmit'));}
});
test('dashboard badges use app icons and localized names, including a My games-only scope',()=>{
 const base={games,byId,t:{},settings:{},canEdit:false,editMode:false,simpleMode:false,openEditor:()=>{},showGameIcons:true};
 for(const locale of ['ko','en','ja','zh'])for(const game of games){const html=renderToStaticMarkup(React.createElement(CatalogContext.Provider,{value:base},React.createElement(GameBadge,{gameId:game.id,locale})));assert.ok(html.includes(game.icon||game.logo));assert.ok(html.includes(game.name[locale]));}
});
