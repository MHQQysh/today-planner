export const categories={work:'工作学习',life:'日常生活',health:'运动健康',rest:'休息放松'};
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function shiftDate(day,amount){const d=new Date(`${day}T12:00:00`);d.setDate(d.getDate()+amount);return localDate(d);}
export function minutes(t){return Number(t.slice(0,2))*60+Number(t.slice(3,5));}
export function validate(plan){if(!plan.title.trim())return '请填写计划名称';if(!/^\d{4}-\d{2}-\d{2}$/.test(plan.day))return '请选择日期';if(![plan.start,plan.end].every(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))return '请选择有效时间';if(minutes(plan.end)<=minutes(plan.start))return '结束时间需要晚于开始时间；跨夜计划请分两天填写';if(!categories[plan.category])return '请选择分类';return '';}
export function overlaps(plan,plans){return plans.some(p=>p.id!==plan.id&&p.day===plan.day&&minutes(p.start)<minutes(plan.end)&&minutes(p.end)>minutes(plan.start));}
export function stats(plans){return {count:plans.length,done:plans.filter(p=>p.done).length,duration:plans.reduce((s,p)=>s+minutes(p.end)-minutes(p.start),0)};}
