import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weekDays,layoutEvents,timeString} from '../src/calendar.js';
import {monthDays,moveDate} from '../src/calendar.js';
test('月视图覆盖闰月，翻月时限制月末日期',()=>{assert.equal(monthDays('2024-02-15').length,42);assert.ok(monthDays('2024-02-15').includes('2024-02-29'));assert.equal(moveDate('2026-01-31','month',1),'2026-02-28');assert.equal(moveDate('2026-01-31','month',-1),'2025-12-31');});
test('周视图跨月，日视图只包含所选日期',()=>{assert.deepEqual(weekDays('2026-10-01','week'),['2026-09-27','2026-09-28','2026-09-29','2026-09-30','2026-10-01','2026-10-02','2026-10-03']);assert.deepEqual(weekDays('2026-10-01','day'),['2026-10-01']);});
test('重叠时间块分列，相邻时段不分列',()=>{const rows=layoutEvents([{id:1,start:'09:00',end:'10:00'},{id:2,start:'09:30',end:'10:30'},{id:3,start:'10:30',end:'11:00'}]);assert.equal(rows[0].columns,2);assert.equal(rows[1].lane,1);assert.equal(rows[2].columns,1);assert.equal(timeString(570),'09:30');});
