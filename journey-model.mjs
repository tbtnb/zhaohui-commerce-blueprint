// Planning for a local interactive explanation; never authorizes or creates real tasks.
export const SOURCE_NAMES=Object.freeze({existing:'使用已有连接',connect:'带我连接店铺或工具',files:'选择我的工作资料'});
export const TRIGGERS=Object.freeze({
  clock:{label:'到约定时间',action:'让时间来到检查时刻',engine:'使用现有定时功能，在你确认的时间开始任务，并保留实际完成记录。'},
  chat:{label:'我在聊天里交给昭回',action:'发送这条示例需求',engine:'你在聊天中提出问题，昭回读取保存的工作说明，处理这次任务。'},
  file:{label:'指定文件有更新',action:'放入一份更新后的示例资料',engine:'使用现有文件更新检查，只观察指定的工作文件夹；文件变化后安排一次任务。'}
});
export function blankAnswers(scene){return {focus:null,detail:null,source:null,shop:scene.platforms[0],connectionConfirmed:false,trigger:null,delivery:null,note:'',time:'09:00'};}
export function validateAnswers(scene,a){
  return Boolean(a && Number.isInteger(a.focus) && scene.choices[a.focus] && Number.isInteger(a.detail) && scene.details[a.detail] && Object.hasOwn(SOURCE_NAMES,a.source) && scene.platforms.includes(a.shop) && a.connectionConfirmed===true && Object.hasOwn(TRIGGERS,a.trigger) && ['brief','explained'].includes(a.delivery) && /^([01]\d|2[0-3]):[0-5]\d$/.test(a.time||'09:00'));
}
export function sampleAnswers(scene){return {...blankAnswers(scene),focus:1,detail:0,source:'existing',connectionConfirmed:true,trigger:scene.trigger,delivery:'explained'};}
export function chosenObjects(scene,a){return (scene.choices[a.focus]?.items || [0,1,2]).map(i=>({index:i,title:scene.objects[i],before:scene.before[i],after:scene.after[i]}));}
export function sourceSteps(scene,a){
  if(a.source==='files')return ['由你选择这项工作的文件夹',`读取其中的${scene.source}`,`请你确认${scene.objects[0]}和资料日期`];
  if(a.source==='existing')return ['查找已经保存的可用连接',`选择${a.shop}，只读取本次用到的${scene.source}`,`核对一份样例里的${scene.objects[0]}和更新时间`];
  return ['接入助手先寻找可用的正式读取方法','需要登录时，由你在对应后台确认账号与允许范围',`试读${scene.source}，核对正确后保存供这项工作复用`];
}
export function setupSteps(scene,a){
  const focus=scene.choices[a.focus]?.label || '本次需要关注的内容';
  const detail=scene.details[a.detail] || '你确认的具体处理方式';
  const route=a.source || 'existing';const trigger=a.trigger || scene.trigger;
  return [
    {id:'goal',name:'在聊天里确认目标',you:`在昭回新建聊天，说明“${scene.thought}”，再确认“${focus}”和“${detail}”。`,ai:'把目标、允许处理的范围和确认方式整理成一份工作说明，放在这项工作的文件夹中。',result:`目标：${focus}；处理要求：${detail}。`,place:'聊天与工作说明',refs:['E01','E05']},
    {id:'source',name:'接好这项工作使用的资料',you:route==='files'?'选择允许查看的工作文件夹。':`选择${a.shop || scene.platforms[0]}，在需要时完成登录并确认允许查看的范围。`,ai:sourceSteps(scene,{...a,source:route,shop:a.shop||scene.platforms[0]}).join('。')+'。已有连接先复用；没有适用的读取方法，就在这一步与你商量使用允许的工作文件。',result:`这项工作使用：${scene.source}。`,place:'已有接入能力与工作文件',refs:['E03','E02']},
    {id:'sample',name:'确认一份资料确实对应正确',you:`核对${scene.objects[0]}，确认属于这家店、这件商品或这笔工作。`,ai:scene.steps[0]+'。检查来源、日期和需要的内容；不把其他商品或旧记录混进来。',result:`逐项核对：${scene.objects.join('、')}。`,place:'读取结果与商品资料',refs:['E03','E05']},
    {id:'work',name:'保存具体处理办法',you:`确认优先关注${focus}，按照“${detail}”处理；不清楚的地方先请人判断。`,ai:scene.steps.join(' → ')+'。将这项工作的步骤、需要保留的记录与'+(a.delivery==='brief'?'简明清单':'带依据的说明')+'写入工作说明，后续任务继续使用。',result:`结果形式：${scene.result}。`,place:'工作说明与任务执行',refs:['E04','E05']},
    {id:'trigger',name:'安排何时开始',you:`确认：${TRIGGERS[trigger].label}${trigger==='clock'?'，每天 '+(a.time||'09:00')+'，按北京时间':''}。`,ai:TRIGGERS[trigger].engine+' 每次先取得本次资料。文件更新指指定工作文件变化；不会把它当作已连接所有平台的消息。',result:trigger==='clock'?`每天 ${a.time||'09:00'} 检查；电脑和任务需要能够正常运行。`:trigger===scene.trigger?scene.when:TRIGGERS[trigger].label,place:trigger==='clock'?'定时任务':trigger==='file'?'工作文件更新':'聊天中的任务',refs:[trigger==='file'?'E02':'E01']},
    {id:'verify',name:'试一次，再确认后续安排',you:`检查${scene.result}，指出哪里有帮助、哪里重复、哪里不准确。`,ai:`保存这次结果、来源和没处理完的事情。${scene.improve} 正式商品说明、客服规则和工具修改先提出建议，经你确认后再使用。`,result:scene.metric,place:'任务记录、结果与反馈',refs:['E01','E05']}
  ];
}
export function makeJourneyPlan(scene,a,revision=1){
  if(!validateAnswers(scene,a))throw new Error('请先完成需求与资料确认。');
  return {kind:'planning_brief_not_runtime_config',version:1,demo:true,activated:false,scene_id:scene.id,scene_title:scene.title,original_need:scene.thought,focus:scene.choices[a.focus].label,detail:scene.details[a.detail],source_route:SOURCE_NAMES[a.source],shop:a.shop,source:scene.source,authorization:'not_granted_by_this_demo',start:TRIGGERS[a.trigger].label,trigger_code:a.trigger,time:a.trigger==='clock'?a.time:null,timezone:a.trigger==='clock'?'Asia/Shanghai':null,delivery:a.delivery==='brief'?'先看简明清单':'附上依据和处理建议',note:String(a.note||'').slice(0,600),steps:setupSteps(scene,a),sample_items:chosenObjects(scene,a),revision,finance:'excluded',external_business_actions:'not_executed',human_confirmation:scene.human,feedback_proposal:scene.improve};
}
export function planText(p){return ['# '+p.scene_title,'','这是一份搭建需求说明。本网页没有登录真实店铺、取得权限或启动任务。','','原来的想法：'+p.original_need,'明确后的重点：'+p.focus,'具体处理要求：'+p.detail,'店铺：'+p.shop,'资料：'+p.source,'取得资料的方式：'+p.source_route,'开始工作的条件：'+p.start,...(p.time?['检查时间：每天 '+p.time+'，北京时间']:[]),'希望收到的结果：'+p.delivery,...(p.note?['补充要求：'+p.note]:[]),'',...p.steps.flatMap((s,i)=>[`## ${i+1}. ${s.name}`,'','需要我确认：'+s.you,'','请昭回完成：'+s.ai,'','这一阶段应看到：'+s.result,'']), '## 使用反馈','',p.feedback_proposal,'','## 操作范围','',p.human,'','先调用已有接入能力寻找并复用合适的连接，需要登录时由我确认。实际完成后核对读取结果与运行记录。','先用真实资料尝试一次，确认正确后再讨论持续工作。对外发送、发布、库存和发货等操作需要另外确认；不处理资金和财务。'].join('\n');}

export function frameStory(scene,a,frame,{variant='normal',resolved=false,quiet=false,duplicate=false}={}){
  const titles=[TRIGGERS[a.trigger].label,'取得本次资料',scene.steps[0],scene.steps[1],scene.result,'保留结果，继续跟进'];
  const count=chosenObjects(scene,a).length;
  const descriptions=[
    a.trigger==='clock'?`演示时间到达 ${a.time}，开始这项工作。`:a.trigger==='file'?`示例中的${scene.source}更新了。`:`你把“${scene.thought}”交给昭回。`,
    `${SOURCE_NAMES[a.source]}：查看${a.shop}的${scene.source}。本次关注${count}项示例记录。`,
    `按“${scene.details[a.detail]}”核对资料。${scene.steps[0]}。`,
    `优先处理“${scene.choices[a.focus].label}”。${scene.steps[1]}。不在范围内的记录不会被当成本次重点。`,
    `${scene.steps[2]}。${a.delivery==='brief'?'先显示简明清单。':'同时列出原来情况、处理结果和需要人确认的部分。'}`,
    `${scene.improve}${quiet?' 本轮没有变化的旧内容放回工作记录，不重复打扰。':''}`
  ];
  if(variant==='issue'&&frame===2&&!resolved)return {title:'先确认这份资料',description:scene.issue,blocked:true};
  if(duplicate&&frame===1)return {title:'这是同一份输入',description:'示例记录已经处理过，查看原结果，不重新生成第二份待办。',blocked:false};
  if(duplicate&&frame>=4)return {title:'继续原来的记录',description:'这次没有新建结果。重要变化仍会单独检查，不把所有重复输入都当成新工作。',blocked:false};
  return {title:titles[frame],description:descriptions[frame],blocked:false};
}

export class StepPlayer {
  constructor(onStep,{interval=1600,onState=()=>{}}={}){this.onStep=onStep;this.onState=onState;this.interval=interval;this.timer=null;this.frame=-1;this.max=5;this.playing=false;this.speed=1;this.destroyed=false;}
  start({frame=0,max=5,auto=true}={}){this.stop();this.destroyed=false;this.max=max;this.frame=frame;this.playing=auto;this.onStep(frame);this.onState(this);this.schedule();}
  schedule(){clearTimeout(this.timer);this.timer=null;if(this.playing&&!this.destroyed&&this.frame<this.max)this.timer=setTimeout(()=>this.next(),this.interval/this.speed);}
  next(){if(this.destroyed||this.frame>=this.max)return;clearTimeout(this.timer);this.frame++;if(this.frame===this.max)this.playing=false;this.onStep(this.frame);this.onState(this);this.schedule();}
  pause(){this.playing=false;clearTimeout(this.timer);this.timer=null;this.onState(this);}
  resume(){if(this.destroyed||this.frame>=this.max)return;this.playing=true;this.onState(this);this.schedule();}
  toggle(){this.playing?this.pause():this.resume();}
  setSpeed(speed){this.speed=[1,2].includes(Number(speed))?Number(speed):1;this.schedule();}
  stop(){clearTimeout(this.timer);this.timer=null;this.playing=false;this.destroyed=true;}
}
