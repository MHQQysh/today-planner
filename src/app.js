import './style.css';
import {categories,localDate,shiftDate,minutes,validate,overlaps,stats} from './model.js';
import {cloud,readConfig,saveConfig,listCloud,writeCloud,deleteCloud} from './cloud.js';
const $=id=>document.getElementById(id), localKey='today-plans-v1';
let day=localDate(),plans=[],user=null,editing=null,busy=false,loadVersion=0,toastTimer;
const colors={work:'#7891b1',life:'#c5a16f',health:'#86a17d',rest:'#aa96b9'};
function localPlans(){const raw=localStorage.getItem(localKey);if(!raw)return [];const data=JSON.parse(raw);if(!Array.isArray(data))throw Error('本机数据格式异常，请先导出备份');return data;}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function sync(message){$('sync').textContent=message;$('settings-status').textContent=message;}
function render(){
 $('day').value=day;const date=new Date(day+'T12:00:00');$('date-label').textContent=date.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
 const s=stats(plans),percent=s.count?Math.round(s.done/s.count*100):0;
 $('count').innerHTML=`${s.count}<small>项</small>`;$('duration').innerHTML=`${Number((s.duration/60).toFixed(1))}<small>小时</small>`;$('progress').innerHTML=`${percent}<small>%</small>`;$('progress-bar').style.width=percent+'%';
 const now=new Date(),time=now.getHours()*60+now.getMinutes();const current=day===localDate()?plans.find(p=>!p.done&&minutes(p.start)<=time&&minutes(p.end)>time):null;
 const next=plans.find(p=>!p.done&&(day!==localDate()||minutes(p.start)>time));const featured=current||next;
 $('focus-label').textContent=current?'正在进行':featured?'下一件值得投入的事':s.count&&s.done===s.count?'今天的计划，全部完成':'留一点时间，给自己';
 $('focus-title').textContent=featured?featured.title:s.count&&s.done===s.count?'做得不错，享受你的空闲吧':'从一件小事开始今天';
 $('focus-detail').textContent=featured?`${featured.start} — ${featured.end} · ${categories[featured.category]}`:'把想做的事，放进合适的时间里。';
 $('plans').innerHTML=plans.length?plans.map(p=>`<article class="plan"><div class="plan-time">${escape(p.start)}<small>${escape(p.end)}</small></div><div class="plan-card ${p.done?'done':''}" style="--category:${colors[p.category]||colors.work}"><button class="check" data-action="toggle" data-id="${escape(p.id)}" aria-label="${p.done?'标记未完成':'标记完成'}：${escape(p.title)}" aria-pressed="${p.done}">${p.done?'✓':''}</button><div class="plan-content"><h3>${escape(p.title)}</h3><span class="badge">${categories[p.category]||'工作学习'}</span>${p.note?`<p>${escape(p.note)}</p>`:''}</div><div class="plan-actions"><button data-action="edit" data-id="${escape(p.id)}">编辑</button><button data-action="delete" data-id="${escape(p.id)}">删除</button></div></div></article>`).join(''):'<div class="empty"><div class="empty-symbol">◷</div><h3>今天的时间，由你安排</h3><p>还没有计划。为重要的事情，留一个时间段吧。</p><button class="outline" id="empty-add">＋ 创建第一条计划</button></div>';
 $('empty-add')?.addEventListener('click',()=>openEditor());
 $('account').textContent=user?'已登录 · 云端同步':cloud?'登录同步':'连接云端';$('login').hidden=!!user;$('logout').hidden=!user;$('import').hidden=!user;
}
async function load(){const version=++loadVersion;const requestedDay=day;try{const rows=user?await listCloud(requestedDay):localPlans().filter(p=>p.day===requestedDay);if(version!==loadVersion)return;plans=rows.sort((a,b)=>a.start.localeCompare(b.start));render();sync(user?'✓ 已同步 · 每 15 秒更新':'○ 本机保存 · 未开启跨设备同步');}catch(e){if(version===loadVersion){sync('读取失败 · '+e.message);toast('读取失败：'+e.message);}}}
async function save(plan,previous){if(user)await writeCloud(plan,user.id,previous);else{const all=localPlans();const index=all.findIndex(p=>p.id===plan.id);if(index>=0)all[index]=plan;else all.push(plan);localStorage.setItem(localKey,JSON.stringify(all));}await load();}
function openEditor(plan){editing=plan?{...plan}:null;$('editor-title').textContent=plan?'编辑计划':'添加计划';$('title').value=plan?.title||'';const hour=Math.min(new Date().getHours()+1,22);$('start').value=plan?.start||`${String(hour).padStart(2,'0')}:00`;$('end').value=plan?.end||`${String(hour+1).padStart(2,'0')}:00`;$('category').value=plan?.category||'work';$('note').value=plan?.note||'';$('form-error').textContent='';$('editor').showModal();$('title').focus();}
async function action(fn){if(busy)return;busy=true;try{await fn();}catch(e){toast(e.message);sync('操作未保存 · '+e.message);}finally{busy=false;}}
function changeDay(value){if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return;day=value;plans=[];render();load();}
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>{if(!busy)$(button.dataset.close).close();});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
const settings=()=>{const config=readConfig();$('cloud-url').value=config.url;$('cloud-key').value=config.key;$('settings-dialog').showModal();};
 $('settings').onclick=settings;$('account').onclick=settings;$('add').onclick=()=>openEditor();$('prev').onclick=()=>changeDay(shiftDate(day,-1));$('next').onclick=()=>changeDay(shiftDate(day,1));$('today').onclick=()=>changeDay(localDate());$('day').onchange=e=>changeDay(e.target.value);
 $('plan-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const plan={id:editing?.id||crypto.randomUUID(),day:editing?.day||day,title:$('title').value.trim(),start:$('start').value,end:$('end').value,category:$('category').value,note:$('note').value.trim(),done:editing?.done||false};const error=validate(plan);if(error){$('form-error').textContent=error;return;}if(overlaps(plan,plans)&&!confirm('这个时间段与已有计划重叠，仍然保存吗？'))return;busy=true;$('save').disabled=true;$('form-error').textContent='';try{await save(plan,editing);$('editor').close();toast(user?'计划已保存到云端':'计划已保存到本机');}catch(error){$('form-error').textContent='未保存：'+error.message;}finally{busy=false;$('save').disabled=false;}};
 $('plans').onclick=e=>{const button=e.target.closest('[data-action]');if(!button||busy)return;const plan=plans.find(p=>p.id===button.dataset.id);if(!plan)return;if(button.dataset.action==='edit')openEditor(plan);if(button.dataset.action==='toggle')action(async()=>{await save({...plan,done:!plan.done},plan);});if(button.dataset.action==='delete'&&confirm(`删除“${plan.title}”？`))action(async()=>{if(user)await deleteCloud(plan);else localStorage.setItem(localKey,JSON.stringify(localPlans().filter(p=>p.id!==plan.id)));await load();toast('计划已删除');});};
 $('config-form').onsubmit=e=>{e.preventDefault();try{saveConfig($('cloud-url').value.trim(),$('cloud-key').value.trim());location.reload();}catch(error){toast(error.message);}};
 $('login').onclick=()=>action(async()=>{if(!cloud)throw Error('请先填写并保存云端连接配置');const {error}=await cloud.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;});
 $('logout').onclick=()=>action(async()=>{const {error}=await cloud.auth.signOut();if(error)throw error;user=null;await load();toast('已退出，当前显示本机计划');});
 $('import').onclick=()=>action(async()=>{const local=localPlans();if(!local.length){toast('本机没有需要导入的计划');return;}if(!confirm(`将 ${local.length} 条本机计划导入当前账号？已有同编号计划将保留云端版本。`))return;const records=local.map(p=>({id:p.id,day:p.day,title:p.title,start:p.start,end:p.end,category:p.category,note:p.note,done:p.done,user_id:user.id}));const {error}=await cloud.from('plans').upsert(records,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;await load();toast('导入完成，本机原始记录仍保留');});
 $('export').onclick=()=>action(async()=>{const rows=user?await listCloud():localPlans();const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),plans:rows},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`今日规划-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`已导出 ${rows.length} 条计划`);});
window.addEventListener('focus',()=>{if(!busy)load();});window.addEventListener('storage',e=>{if(e.key===localKey&&!user&&!busy)load();});window.addEventListener('online',()=>load());
setInterval(()=>{if(!document.hidden&&!busy){if(user)load();else render();}},15000);
render();
if(cloud){const {data,error}=await cloud.auth.getSession();if(error)toast('登录状态读取失败：'+error.message);user=data?.session?.user||null;cloud.auth.onAuthStateChange((_event,session)=>{const changed=user?.id!==session?.user?.id;user=session?.user||null;if(changed){plans=[];render();setTimeout(load,0);}});}
await load();
