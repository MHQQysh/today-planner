import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'msedge'});
try {
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
 const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/');await page.getByText('今天的时间，由你安排').waitFor();
 await page.locator('#add').click();await page.locator('#title').fill('阅读论文 <重要>');await page.locator('#start').fill('09:00');await page.locator('#end').fill('10:30');await page.locator('#note').fill('完成方法部分');await page.locator('#save').click();await page.locator('.plan-content h3').waitFor();assert.equal(await page.locator('.plan-content h3').textContent(),'阅读论文 <重要>');
 await page.reload();await page.locator('.plan-content h3').waitFor();assert.equal(await page.locator('.plan').count(),1);
 await page.getByRole('button',{name:'编辑',exact:true}).click();await page.locator('#title').fill('精读方法');await page.locator('#save').click();await page.getByRole('heading',{name:'精读方法',exact:true}).last().waitFor();
 await page.locator('.check').click();await page.waitForFunction(()=>document.querySelector('.check').getAttribute('aria-pressed')==='true');
 await page.locator('#next').click();await page.getByText('今天的时间，由你安排').waitFor();await page.locator('#prev').click();await page.locator('.plan').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:viewport.width===390?'preview-mobile.png':'preview-desktop.png',fullPage:true});
 await page.locator('#settings').click();const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();assert.ok((await downloadPromise).suggestedFilename().endsWith('.json'));await page.locator('[data-close="settings-dialog"]').click();
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'删除',exact:true}).click();await page.getByText('今天的时间，由你安排').waitFor();await page.reload();await page.getByText('今天的时间，由你安排').waitFor();assert.deepEqual(errors,[]);console.log(`PASS ${viewport.width}px: create/edit/complete/date/export/delete/persistence/no overflow/no JS errors`);await context.close();
}
}finally{await browser.close();}
