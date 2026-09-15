import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,stateAt,stories,exportReport} from './story.mjs';
for(const story of Object.keys(stories)){
 test(`${story}: a submission is not a receipt`,()=>{
  let a={...initial(),story,frame:2};assert.equal(stateAt(a).receiptCount,0);
  a.frame=3;assert.deepEqual(stateAt(a).statuses,['已提交','已提交','已提交']);
  a.frame=4;assert.equal(stateAt(a).receiptCount,3);
 });
 test(`${story}: missing evidence blocks until verified`,()=>{
  let a={...initial(),story,branch:'missing',frame:3};assert.equal(stateAt(a).blocked,true);assert.equal(stateAt(a).receiptCount,0);
  a.resolved=true;a.frame=4;assert.equal(stateAt(a).blocked,false);assert.equal(stateAt(a).receiptCount,3);
 });
 test(`${story}: failure preserves only actual receipts`,()=>{
  let a={...initial(),story,branch:'failed',frame:3};const v=stateAt(a);assert.equal(v.blocked,true);assert.equal(v.receiptCount,story==='delay'?2:story==='launch'?1:0);
  a.resolved=true;a.frame=4;assert.equal(stateAt(a).receiptCount,3);
 });
 test(`${story}: human changes actions and report`,()=>{
  let a={...initial(),story,branch:'human',frame:4};const v=stateAt(a);assert.deepEqual(v.actions,stories[story].humanActions);assert.notEqual(v.result,stories[story].result);
  a.pausedStatuses=v.statuses;a.intervention='pause';assert.equal(stateAt(a).blocked,true);assert.equal(stateAt(a).receiptCount,v.receiptCount);
  const report=exportReport(a);assert.match(report,/未操作真实业务系统/);assert.match(report,/人工介入/);
 });
}
test('pausing an in-flight action retains uncertain status',()=>{
 const a={...initial(),frame:3,branch:'human'};a.pausedStatuses=stateAt(a).statuses;a.intervention='pause';assert.deepEqual(stateAt(a).statuses,['待核实','待核实','待核实']);
});
