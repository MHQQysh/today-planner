import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge'});
const db={shared_plans:[],shared_tasks:[]};let version=0,failWrites=false;const errors=[];
try{
const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
for(const context of contexts){await context.addInitScript(()=>localStorage.setItem('today-cloud-config',JSON.stringify({url:'https://test-project.supabase.co',key:'sb_publishable_test'})));await context.route('https://test-project.supabase.co/**',async route=>{
 const request=route.request(),url=new URL(request.url());assert.ok(!url.pathname.includes('/auth/'),'不应请求登录接口');const table=url.pathname.split('/').at(-1);assert.ok(db[table]);
 let rows=db[table];for(const key of ['id','updated_at'])if(url.searchParams.has(key))rows=rows.filter(r=>r[key]===url.searchParams.get(key).slice(3));
 if(request.method()==='GET'){await route.fulfill({json:rows});return;}
 if(failWrites){await route.fulfill({status:403,json:{message:'permission denied'}});return;}
 if(request.method()==='POST'){const data=request.postDataJSON();const row={...data,updated_at:String(++version),created_at:String(version)};db[table].push(row);rows=[row];}
 if(request.method()==='PATCH'){for(const row of rows)Object.assign(row,request.postDataJSON(),{updated_at:String(++version)});}
 if(request.method()==='DELETE')db[table]=db[table].filter(r=>!rows.includes(r));
 await route.fulfill({json:rows});
 });}
const a=await contexts[0].newPage(),b=await contexts[1].newPage();for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
await a.goto('http://127.0.0.1:5173/');await a.locator('#task-title').fill('共享任务');await a.locator('#task-form button').click();await a.locator('.task-row').waitFor();
await b.goto('http://127.0.0.1:5173/');await b.locator('.task-row').waitFor();await b.locator('.task-check').click();await b.waitForFunction(()=>document.querySelector('.task-check').getAttribute('aria-pressed')==='true');await a.reload();await a.waitForFunction(()=>document.querySelector('.task-check')?.getAttribute('aria-pressed')==='true');
await a.locator('#add').click();await a.locator('#title').fill('共享时间规划');await a.locator('#start').fill('09:00');await a.locator('#end').fill('10:00');await a.locator('#save').click();await a.locator('.calendar-event').waitFor();await b.reload();await b.locator('.calendar-event').click();await b.locator('#title').fill('另一台电脑修改');await b.locator('#save').click();await b.getByText('另一台电脑修改',{exact:true}).waitFor();
await a.reload();await a.locator('.calendar-event').click();failWrites=true;await a.locator('#title').fill('失败时保留草稿');await a.locator('#save').click();await a.getByText('未保存：permission denied',{exact:true}).waitFor();assert.equal(await a.locator('#title').inputValue(),'失败时保留草稿');failWrites=false;
await a.locator('[data-close="editor"]').first().click();await b.locator('.calendar-event').click();b.once('dialog',d=>d.accept());await b.locator('#delete-event').click();await b.waitForFunction(()=>!document.querySelector('.calendar-event'));await a.reload();await a.locator('.task-row').waitFor();assert.equal(await a.locator('.calendar-event').count(),0);assert.deepEqual(errors,[]);console.log('PASS 无登录双浏览器共享读写、删除、写入失败保留草稿（模拟云端）');
}finally{await browser.close();}
