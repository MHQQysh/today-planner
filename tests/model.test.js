import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validate,overlaps,shiftDate,stats} from '../src/model.js';
const p={id:'a',day:'2026-09-11',title:'阅读',start:'09:00',end:'10:00',category:'work',done:false};
test('拒绝空白名称、非法时间和跨夜时间',()=>{assert.equal(validate(p),'');for(const patch of [{title:' '},{start:'25:00'},{end:'09:00'},{end:'08:00'}])assert.ok(validate({...p,...patch}));});
test('相邻计划不冲突，自身编辑不冲突，交叉时段冲突',()=>{assert.equal(overlaps({...p,id:'b',start:'10:00',end:'11:00'},[p]),false);assert.equal(overlaps(p,[p]),false);assert.equal(overlaps({...p,id:'b',start:'09:30'},[p]),true);assert.equal(overlaps({...p,id:'b',day:'2026-09-12'},[p]),false);});
test('日期跨月、跨年和闰年',()=>{assert.equal(shiftDate('2026-12-31',1),'2027-01-01');assert.equal(shiftDate('2024-03-01',-1),'2024-02-29');});
test('完成比例所需统计与时长',()=>{assert.deepEqual(stats([p,{...p,done:true,end:'10:30'}]),{count:2,done:1,duration:150});assert.deepEqual(stats([]),{count:0,done:0,duration:0});});
