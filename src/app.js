import './style.css';
import './calendar.css';
import {mountCalendar,renderCalendar,bindSelection,weekDays} from './calendar.js';
import {categories,localDate,shiftDate,minutes,validate,overlaps,stats} from './model.js';
import {cloud,readConfig,saveConfig,listCloud,writeCloud,deleteCloud} from './cloud.js';
mountCalendar();
const $=id=>document.getElementById(id), localKey='today-plans-v1';
let mode=matchMedia('(max-width:700px)').matches?'day':'week',miniMonth=localDate().slice(0,7),tasks=[],draftDay=null;
let day=localDate(),plans=[],user=null,editing=null,busy=false,loadVersion=0,toastTimer;
const colors={work:'#7891b1',life:'#c5a16f',health:'#86a17d',rest:'#aa96b9'};
function localPlans(){const raw=localStorage.getItem(localKey);if(!raw)return [];const data=JSON.parse(raw);if(!Array.isArray(data))throw Error('本机数据格式异常，请先导出备份');return data;}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function sync(message){$('sync').textContent=message;$('settings-status').textContent=message;}
function render(){renderCalendar({day,plans,user,cloud,mode,tasks,miniMonth});}
async function load(){const version=++loadVersion;const requestedDay=day;try{const rows=user?await listCloud():localPlans();const taskRows=user?await listTasksCloud():localTasks();if(version!==loadVersion)return;tasks=taskRows;plans=rows.sort((a,b)=>a.start.localeCompare(b.start));render();sync(user?'✓ 已同步 · 每 15 秒更新':'○ 本机保存 · 未开启跨设备同步');}catch(e){if(version===loadVersion){sync('读取失败 · '+e.message);toast('读取失败：'+e.message);}}}
async function save(plan,previous){if(user)await writeCloud(plan,user.id,previous);else{const all=localPlans();const index=all.findIndex(p=>p.id===plan.id);if(index>=0)all[index]=plan;else all.push(plan);localStorage.setItem(localKey,JSON.stringify(all));}await load();}
function openEditor(plan,date=day,startTime,endTime){draftDay=date;editing=plan?{...plan}:null;$('editor-title').textContent=plan?'编辑计划':'添加计划';$('title').value=plan?.title||'';const hour=Math.min(new Date().getHours()+1,22);$('start').value=plan?.start||startTime||`${String(hour).padStart(2,'0')}:00`;$('end').value=plan?.end||endTime||`${String(hour+1).padStart(2,'0')}:00`;$('category').value=plan?.category||'work';$('note').value=plan?.note||'';$('form-error').textContent='';$('event-extra').hidden=!plan;$('toggle-event').textContent=plan?.done?'标记未完成':'标记已完成';$('editor').showModal();$('title').focus();}
async function action(fn){if(busy)return;busy=true;try{await fn();}catch(e){toast(e.message);sync('操作未保存 · '+e.message);}finally{busy=false;}}
function changeDay(value){if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return;day=value;miniMonth=day.slice(0,7);render();load();}
for(const button of document.querySelectorAll('[data-close]'))button.addEventListener('click',()=>{if(!busy)$(button.dataset.close).close();});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
const settings=()=>{const config=readConfig();$('cloud-url').value=config.url;$('cloud-key').value=config.key;$('settings-dialog').showModal();};
 $('settings').onclick=settings;$('account').onclick=settings;$('add').onclick=()=>openEditor();$('prev').onclick=()=>changeDay(shiftDate(day,mode==='week'?-7:-1));$('next').onclick=()=>changeDay(shiftDate(day,mode==='week'?7:1));$('today').onclick=()=>changeDay(localDate());$('day').onchange=e=>changeDay(e.target.value);
 $('plan-form').onsubmit=async e=>{e.preventDefault();if(busy)return;const plan={id:editing?.id||crypto.randomUUID(),day:editing?.day||draftDay||day,title:$('title').value.trim(),start:$('start').value,end:$('end').value,category:$('category').value,note:$('note').value.trim(),done:editing?.done||false};const error=validate(plan);if(error){$('form-error').textContent=error;return;}if(overlaps(plan,plans)&&!confirm('这个时间段与已有计划重叠，仍然保存吗？'))return;busy=true;$('save').disabled=true;$('form-error').textContent='';try{await save(plan,editing);$('editor').close();toast(user?'计划已保存到云端':'计划已保存到本机');}catch(error){$('form-error').textContent='未保存：'+error.message;}finally{busy=false;$('save').disabled=false;}};
 $('plans').onclick=e=>{const button=e.target.closest('[data-action]');if(!button||busy)return;const plan=plans.find(p=>p.id===button.dataset.id);if(!plan)return;if(button.dataset.action==='edit')openEditor(plan);if(button.dataset.action==='toggle')action(async()=>{await save({...plan,done:!plan.done},plan);});if(button.dataset.action==='delete'&&confirm(`删除“${plan.title}”？`))action(async()=>{if(user)await deleteCloud(plan);else localStorage.setItem(localKey,JSON.stringify(localPlans().filter(p=>p.id!==plan.id)));await load();toast('计划已删除');});};
 $('config-form').onsubmit=e=>{e.preventDefault();try{saveConfig($('cloud-url').value.trim(),$('cloud-key').value.trim());location.reload();}catch(error){toast(error.message);}};
 $('login').onclick=()=>action(async()=>{if(!cloud)throw Error('请先填写并保存云端连接配置');const {error}=await cloud.auth.signInWithOAuth({provider:'github',options:{redirectTo:location.origin+location.pathname}});if(error)throw error;});
 $('logout').onclick=()=>action(async()=>{const {error}=await cloud.auth.signOut();if(error)throw error;user=null;await load();toast('已退出，当前显示本机计划');});
 $('import').onclick=()=>action(async()=>{const local=localPlans(),localTaskRows=localTasks();if(!local.length&&!localTaskRows.length){toast('本机没有需要导入的内容');return;}if(!confirm(`将 ${local.length} 条时间规划和 ${localTaskRows.length} 条任务导入当前账号？已有同编号记录保留云端版本。`))return;const records=local.map(p=>({id:p.id,day:p.day,title:p.title,start:p.start,end:p.end,category:p.category,note:p.note,done:p.done,user_id:user.id}));if(records.length){const {error}=await cloud.from('plans').upsert(records,{onConflict:'id',ignoreDuplicates:true});if(error)throw error;}if(localTaskRows.length){const {error}=await cloud.from('tasks').upsert(localTaskRows.map(t=>({id:t.id,title:t.title,done:t.done,user_id:user.id})),{onConflict:'id',ignoreDuplicates:true});if(error)throw Error('任务导入失败，可重试；已导入的规划不会重复：'+error.message);}await load();toast('导入完成，本机原始记录仍保留');});
 $('export').onclick=()=>action(async()=>{const rows=user?await listCloud():localPlans();const taskRows=user?await listTasksCloud():localTasks();const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),plans:rows,tasks:taskRows},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`今日规划-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(`已导出 ${rows.length} 条计划`);});
window.addEventListener('focus',()=>{if(!busy)load();});window.addEventListener('storage',e=>{if([localKey,taskKey].includes(e.key)&&!user&&!busy)load();});window.addEventListener('online',()=>load());
setInterval(()=>{if(!document.hidden&&!busy){if(user)load();else render();}},15000);

const taskKey='today-tasks-v1';
function localTasks(){const rows=JSON.parse(localStorage.getItem(taskKey)||'[]');if(!Array.isArray(rows))throw Error('本机任务格式异常');return rows;}
async function listTasksCloud(){const {data,error}=await cloud.from('tasks').select('*').order('created_at');if(error)throw Error('任务读取失败，请执行最新版 supabase.sql：'+error.message);return data;}
async function saveTask(task,previous){if(user){const record={id:task.id,title:task.title,done:task.done,user_id:user.id};const query=previous?cloud.from('tasks').update(record).eq('id',task.id).eq('updated_at',previous.updated_at):cloud.from('tasks').insert(record);const {data,error}=await query.select();if(error)throw error;if(!data.length)throw Error('任务已在另一台设备改动，请刷新后重试');}else{const all=localTasks(),i=all.findIndex(t=>t.id===task.id);if(i<0)all.push(task);else all[i]=task;localStorage.setItem(taskKey,JSON.stringify(all));}await load();}
$('task-form').onsubmit=e=>{e.preventDefault();const title=$('task-title').value.trim();if(!title)return;action(async()=>{await saveTask({id:crypto.randomUUID(),title,done:false});$('task-title').value='';});};
$('tasks').onclick=e=>{const b=e.target.closest('[data-task-action]');if(!b)return;const task=tasks.find(t=>t.id===b.dataset.id);if(!task)return;action(async()=>{if(b.dataset.taskAction==='toggle')await saveTask({...task,done:!task.done},task);if(b.dataset.taskAction==='edit'){const title=prompt('修改任务名称',task.title);if(title?.trim()){if(title.trim().length>120)throw Error('任务名称最多 120 字');await saveTask({...task,title:title.trim()},task);}}if(b.dataset.taskAction==='delete'&&confirm('删除这个任务？')){if(user){const {data,error}=await cloud.from('tasks').delete().eq('id',task.id).eq('updated_at',task.updated_at).select('id');if(error)throw error;if(!data.length)throw Error('任务已在另一台设备改动，请刷新后重试');}else localStorage.setItem(taskKey,JSON.stringify(localTasks().filter(t=>t.id!==task.id)));await load();}});};
for(const id of ['calendar-days','mini-days'])$(id).onclick=e=>{const b=e.target.closest('[data-day]');if(b)changeDay(b.dataset.day);};
for(const [id,amount] of [['mini-prev',-1],['mini-next',1]])$(id).onclick=()=>{const date=new Date(miniMonth+'-01T12:00:00');date.setMonth(date.getMonth()+amount);miniMonth=localDate(date).slice(0,7);render();};
$('view-mode').onchange=e=>{mode=e.target.value;render();};
matchMedia('(max-width:700px)').addEventListener('change',e=>{mode=e.matches?'day':'week';render();});
bindSelection((date,start,end)=>openEditor(null,date,start,end));
$('toggle-event').onclick=()=>action(async()=>{if(editing){await save({...editing,done:!editing.done},editing);$('editor').close();}});
$('delete-event').onclick=()=>action(async()=>{if(!editing||!confirm('删除这段时间规划？'))return;if(user)await deleteCloud(editing);else localStorage.setItem(localKey,JSON.stringify(localPlans().filter(p=>p.id!==editing.id)));await load();$('editor').close();});
render();
if(cloud){const {data,error}=await cloud.auth.getSession();if(error)toast('登录状态读取失败：'+error.message);user=data?.session?.user||null;cloud.auth.onAuthStateChange((_event,session)=>{const changed=user?.id!==session?.user?.id;user=session?.user||null;if(changed){plans=[];render();setTimeout(load,0);}});}
await load();

$('calendar-scroll').scrollTop=7*64;
