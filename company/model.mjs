import {templates,systems,questions} from './catalog.mjs';
import {tailor} from './variants.mjs';
export const MODES={existing:'复用已有连接',connect:'引导接入系统',files:'使用工作文件',later:'稍后补充'};
export function initial(){return {version:1,goal:null,model:null,size:null,channels:[],inventory:[],connections:{},detail:0,policy:'copilot',time:'09:00',note:''};}
export function recommend(a){
 const scores=Object.fromEntries(templates.map(t=>[t.id,0]));
 const reason={};const add=(id,n,r)=>{scores[id]+=n;(reason[id]??=[]).push(r);};
 if(a.model&&a.model!=='unknown')add(a.model==='member'?'member':a.model,6,'匹配你的主要经营方式');
 if(a.goal==='unknown')add('diagnosis',10,'先把含糊目标变成可验证的经营安排');
 if(a.model==='unknown')add('diagnosis',10,'经营方式还不清楚，先复原现状');
 if(a.goal==='profit')add('profit',14,'你希望看清成交之后的经营收益');
 if(a.goal==='service')add('service',14,'你希望先改善客服与售后');
 if(a.goal==='efficiency'){add(a.model==='supply'?'supply':a.model==='member'?'member':a.size==='small'?'service':'omni',5,'优先减少重复核对与交接');}
 if(a.goal==='growth')add(['content','member'].includes(a.model)?a.model:'shelf',4,'围绕当前获客方式做可验证的小实验');
 if(a.size==='company')add('omni',2,'多部门需要统一对象与负责人');
 const sorted=templates.map(t=>({...t,score:scores[t.id],reasons:reason[t.id]||[]})).sort((x,y)=>y.score-x.score);
 const primary=tailor(sorted[0],a);
 const companions=sorted.filter(t=>t.id!==primary.id&&t.score>0&&t.id!=='diagnosis').slice(0,a.size==='small'?1:2);
 return {primary,companions};
}
export function required(a){const {primary}=recommend(a);return primary.needs.map(id=>systems.find(s=>s.id===id));}
export function readiness(a){const list=required(a);return {ready:list.filter(s=>['existing','connect','files'].includes(a.connections[s.id]?.route)&&a.connections[s.id]?.confirmed),missing:list.filter(s=>!a.connections[s.id]?.confirmed),files:list.filter(s=>a.connections[s.id]?.route==='files'&&a.connections[s.id]?.confirmed)};}
export function ruleText(a,t=recommend(a).primary){return `${t.choices[a.detail]||t.choices[0]}；${a.policy==='shadow'?'先观察，只生成分析和草稿':'AI 准备建议，由负责人核对执行'}；每天 ${a.time}（北京时间）检查。`;}
export function plan(a){const {primary,companions}=recommend(a),r=readiness(a);return {kind:'company_planning_brief',version:1,demo:true,activated:false,profile:structuredClone(a),primary:primary.id,companions:companions.map(t=>t.id),rules:ruleText(a),missing:r.missing.map(s=>s.id),sources:primary.sources,steps:primary.build,roles:primary.roles,metrics:primary.metric,firstWeek:primary.firstWeek,later:primary.later};}
export function exportText(a,sources){const p=plan(a),t=recommend(a).primary;return ['# 昭回 · 公司 AI 化搭建说明','',`主方案：${t.name}`,`配套方案：${p.companions.map(id=>templates.find(x=>x.id===id).name).join('、')||'先完成主方案'}`,'','这是基于预设问答和合成资料形成的规划说明。没有取得真实账号权限，没有创建任务或发送消息。','',`目标：${questions[0].options.find(x=>x[0]===a.goal)?.[1]||'待确认'}；经营模式：${questions[1].options.find(x=>x[0]===a.model)?.[1]||'待确认'}；团队：${questions[2].options.find(x=>x[0]===a.size)?.[1]||'待确认'}`,`平台：${a.channels.join('、')}`,`补充：${a.note||'无'}`,'','## 为什么这样安排',t.logic,...recommend(a).primary.reasons.map(x=>'- '+x),'','## 当前系统与资料',...systems.filter(s=>a.inventory.includes(s.id)||t.needs.includes(s.id)).map(s=>`- ${s.name}：${MODES[a.connections[s.id]?.route]||'尚未安排'}；${a.connections[s.id]?.confirmed?'示例资料已确认':'真实实施前需补充'}；${s.data}`),'','## 运行要求',p.rules,...p.roles.map(x=>'- '+x),'','## 搭建步骤',...p.steps.flatMap(([name,work,out],i)=>[`### ${i+1}. ${name}`,work,`应交付：${out}`,'']),'## 试点与验收',p.firstWeek,p.metrics,'','## 后续扩展',p.later,'','## 能力边界',t.maturity,'需以具体平台、账号、授权和新鲜业务回执验证。文件更新不是平台事件；只读连接不获得对外写入权限。',`未补齐：${readiness(a).missing.map(s=>s.name).join('、')||'示例中的必需资料已确认；真实接入仍待验证'}`,'','## 研究依据',...sources.filter(s=>p.sources.includes(s.id)).map(s=>`- [${s.title}](${s.url}) — ${s.publisher}；${s.date}；${s.access}。${s.limits}`)].join('\n');}
