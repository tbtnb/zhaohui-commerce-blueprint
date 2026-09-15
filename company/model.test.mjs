import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {templates,questions,systems} from './catalog.mjs';
import {initial,recommend,required,readiness,plan,exportText} from './model.mjs';
import {sceneMarkup} from './animation.mjs';
const sources=JSON.parse(fs.readFileSync(new URL('./research/sources.json',import.meta.url)));
const cases=[['unknown','unknown','diagnosis'],['growth','shelf','shelf'],['growth','content','content'],['efficiency','supply','supply'],['efficiency','omni','omni'],['service','shelf','service'],['growth','member','member'],['profit','omni','profit']];
test('eight routes each produce a distinct main operating plan and three material branches',()=>{
 const baseline=JSON.stringify(templates);
 for(const [goal,model,id] of cases){const variants=[];for(let detail=0;detail<3;detail++){
 const a={...initial(),goal,model,size:'team',detail};const t=recommend(a).primary;
 assert.equal(t.id,id);assert.equal(t.frames.length,8);assert.equal(t.build.length,3);assert.equal(t.evidence.length,3);
 for(const sid of t.sources)assert.ok(sources.some(s=>s.id===sid));for(const sid of t.needs)assert.ok(systems.some(s=>s.id===sid));
 for(let frame=0;frame<8;frame++){const html=sceneMarkup(t,frame,a);assert.ok(!html.includes('undefined'));assert.ok(html.includes('合成业务资料'));}
 variants.push(JSON.stringify({frames:t.frames,diagnosis:t.diagnosis,evidence:t.evidence,build:t.build}));
 }assert.equal(new Set(variants).size,3,id);}
 assert.equal(JSON.stringify(templates),baseline,'tailoring must not mutate shared templates');
});
test('all 270 goal/model/team/detail combinations return valid bounded plans',()=>{
 let n=0;for(const [goal]of questions[0].options)for(const [model]of questions[1].options)for(const [size]of questions[2].options)for(let detail=0;detail<3;detail++){
 const a={...initial(),goal,model,size,detail};const p=plan(a);assert.equal(p.activated,false);assert.equal(p.demo,true);assert.equal(p.missing.length,required(a).length);assert.ok(p.companions.length<=(size==='small'?1:2));assert.ok(!p.companions.includes(p.primary));n++;
 }assert.equal(n,270);
});
test('missing, failed and file connections stay distinguishable in readiness and export',()=>{
 const a={...initial(),goal:'efficiency',model:'omni',size:'team',channels:['淘宝 / 天猫']};const ids=required(a).map(s=>s.id);
 a.connections[ids[0]]={route:'existing',confirmed:true};a.connections[ids[1]]={route:'connect',confirmed:false};a.connections[ids[2]]={route:'files',confirmed:true};
 assert.equal(readiness(a).ready.length,2);assert.deepEqual(plan(a).missing,[ids[1]]);assert.equal(readiness(a).files.length,1);
 const p=plan(a);p.profile.channels.push('changed');assert.equal(a.channels.length,1);
 const text=exportText(a,sources);assert.ok(text.includes('未补齐'));assert.ok(text.includes('没有创建任务或发送消息'));assert.ok(text.includes('使用工作文件'));assert.ok(!text.includes('undefined'));
});
test('animation escapes business text and separates stock, contribution and opt-out states',()=>{
 const a={...initial(),detail:0,size:'team'};const t=structuredClone(templates[0]);t.frames[0][2]='<img src=x onerror=alert(1)>';t.frames[0][3]='chat';assert.ok(!sceneMarkup(t,0,a).includes('<img'));
 const supply=templates.find(t=>t.id==='supply');const i=supply.frames.findIndex(f=>f[3]==='inventory');assert.ok(i>=0);assert.equal((sceneMarkup(supply,i,a).match(/box locked/g)||[]).length,10);assert.equal((sceneMarkup(supply,i,a).match(/box available/g)||[]).length,2);
 const profit=templates.find(t=>t.id==='profit');assert.ok(sceneMarkup(profit,3,a).includes('不等同净利润'));
 const member=templates.find(t=>t.id==='member');const m=member.frames.findIndex(f=>f[3]==='members');assert.ok(sceneMarkup(member,m,a).includes('不进入联系队列'));
});
