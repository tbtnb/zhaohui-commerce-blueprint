import {SOURCE_NAMES,TRIGGERS,blankAnswers,validateAnswers,sampleAnswers,chosenObjects,sourceSteps,setupSteps,makeJourneyPlan,planText,frameStory,StepPlayer} from './journey-model.mjs';
import {createWorld} from './journey-visuals.mjs';

// Local explanatory dialogue and sample data only. No merchant or model requests.
const $=id=>document.getElementById(id);
const all=s=>[...document.querySelectorAll(s)];
const data=JSON.parse($('journey-data').textContent);
const scenes=new Map(data.scenes.map(s=>[s.id,s]));
const media=matchMedia('(prefers-reduced-motion: reduce)');
const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(cls)n.className=cls;return n;};
const show=(id,visible)=>{$(id).hidden=!visible;};
const text=(id,value)=>{$(id).textContent=String(value);};
let scene=null,a=null,step=0,world=null,phase='clarify';
let motionPaused=media.matches,manualMotionChoice=false,category='all',sampleShown=false;
let revision=1,quiet=false,resolved=false,blocked=false,feedback=null,variant='normal';
let toastTimer=null,probeTimer=null,probeGeneration=0;
const completed=new Map();
const run=new StepPlayer(renderRunFrame,{interval:1750,onState:updateRunControls});
const build=new StepPlayer(renderBuildFrame,{interval:1450,onState:updateBuildControls});
function toast(message){clearTimeout(toastTimer);text('toast',message);show('toast',true);toastTimer=setTimeout(()=>show('toast',false),3600);}
function scroll(id){$(id).scrollIntoView({block:'start',behavior:motionPaused?'auto':'smooth'});}
function stop(){run.stop();build.stop();clearTimeout(probeTimer);probeTimer=null;probeGeneration++;world?.destroy();world=null;blocked=false;resolved=false;}
function fingerprint(){return JSON.stringify({scene:scene.id,answers:a,revision});}
function setPhase(value){
 phase=value;$('journey-app').dataset.phase=value;$('journey-app').dataset.step=String(step);
 const current=value==='build'?2:value==='run'?3:step>=2&&step<=3?1:step>3?2:0;
 all('[data-phase-label]').forEach((n,i)=>{n.classList.toggle('current',i===current);n.classList.toggle('done',i<current);});
}
function selectScene(id,{shouldScroll=true,historyMode='push'}={}){
 const selected=scenes.get(Number(id));if(!selected)return;
 stop();scene=selected;a=blankAnswers(scene);step=0;revision=1;quiet=false;feedback=null;sampleShown=false;completed.clear();
 $('journey-app').dataset.scene=String(scene.id);
 all('.idea-chip').forEach(n=>n.classList.toggle('is-picked',Number(n.dataset.pick)===scene.id));
 show('empty-experience',false);show('journey-app',true);$('load-example').disabled=false;
 text('current-title',scene.thought);text('current-subtitle',scene.title);
 const hash=`#scene-${String(scene.id).padStart(2,'0')}`;
 if(historyMode==='push'&&location.hash!==hash)history.pushState(null,'',hash);
 renderQuestion();
 if(shouldScroll){scroll('experience');$('current-title').tabIndex=-1;$('current-title').focus({preventScroll:true});}
}
function clearFrom(index){
 if(index<=0)a.focus=null;if(index<=1)a.detail=null;if(index<=2)a.source=null;
 if(index<=3){a.connectionConfirmed=false;sampleShown=false;}if(index<=4)a.trigger=null;if(index<=5)a.delivery=null;
 completed.clear();show('feedback-proposal',false);feedback=null;blocked=false;resolved=false;
}
function returnTo(index){stop();clearFrom(index);step=index;renderQuestion();scroll('journey-app');}
function summaries(){return [a.focus===null?null:scene.choices[a.focus].label,a.detail===null?null:scene.details[a.detail],a.source?SOURCE_NAMES[a.source]:null,a.connectionConfirmed?`${a.shop}，示例资料已确认`:null,a.trigger?TRIGGERS[a.trigger].label+(a.trigger==='clock'?`，${a.time}`:''):null,a.delivery?(a.delivery==='brief'?'先看简明清单':'附上依据和处理建议'):null];}
function questions(){return [scene.question,scene.detailQuestion,'这些工作资料从哪里取得？','请确认店铺、范围和一份样例。','希望这项工作在什么时候开始？','希望收到怎样的结果？'];}
function renderChat(){
 const host=$('chat-history');host.replaceChildren();
 const append=(who,message)=>{const block=el('div',undefined,`chat-message ${who}`);block.append(el('small',who==='user'?'你的示例回答':'昭回 · 示例提问'),document.createTextNode(message));host.append(block);};
 append('user',scene.thought);const values=summaries(),qs=questions();
 for(let i=0;i<Math.min(step,6);i++){append('ai',qs[i]);if(values[i])append('user',values[i]);}
 append('ai',step<6?qs[step]:`我会先整理${scene.result}。下面是按你的回答准备的安排，确认后再演示搭建。`);
 host.lastElementChild?.classList.add('new-message');host.scrollTop=host.scrollHeight;
}
function addOptions(title,options,field){
 const area=$('question-area');area.append(el('h3',title,'question-title'));const wrap=el('div',undefined,'question-options');
 options.forEach(([value,label])=>{const b=el('button',undefined,'answer-button');b.type='button';b.dataset.answer=String(value);b.dataset.field=field;b.append(el('b',label),el('span','↗'));wrap.append(b);});area.append(wrap);
}
function labelInput(id,label,input){input.id=id;const l=el('label',label);l.htmlFor=id;return [l,input];}
function previewPlan(){
 text('intent-thought',scene.thought);text('answers-progress',`${Math.min(step,6)} / 6`);
 const pills=el('div',undefined,'intent-pills');summaries().filter(Boolean).forEach(s=>pills.append(el('span',s)));$('intent-choices').replaceChildren(pills);
 $('flow-sketch').replaceChildren();setupSteps(scene,a).forEach((s,i)=>{
  const n=el('div',undefined,'flow-node');n.dataset.node=s.id;
  const ready=[a.focus!==null,a.source!==null,a.connectionConfirmed,a.detail!==null,Boolean(a.trigger),Boolean(a.delivery)][i];
  n.classList.toggle('waiting',!ready);n.classList.toggle('ready',ready);n.append(el('small',String(i+1).padStart(2,'0')),el('b',s.name),el('p',s.place));$('flow-sketch').append(n);
 });
 show('connection-preview',step===2||step===3);$('connection-preview').classList.toggle('sample-ready',sampleShown);
 if(step>=2){text('connection-origin',a.source==='files'?'这项工作的文件夹':a.shop);$('connection-preview-steps').replaceChildren(...sourceSteps(scene,{...a,source:a.source||'existing'}).map(s=>el('li',s)));}
 text('plan-status',step===6?'这份安排由刚才的回答形成。确认以后，观看平台怎样准备资料、步骤和开始条件。':step===3?'接入也是这项工作的一个步骤。先复用已有工具或完成必要的登录，再确认一份资料。':'先逐项说清要求，后面的工作安排会随回答变化。');
}
function renderQuestion(){
 setPhase('clarify');show('question-area',true);show('build-left',false);show('run-left',false);show('planning-view',true);show('runtime-view',false);show('start-run-view',false);show('how-build',false);show('issue-resolution',false);show('result-panel',false);$('back-answer').disabled=step===0;
 text('conversation-title',step>=2&&step<=3?'把资料一起安排好':step===6?'确认这次的工作安排':'先把想法说清楚');text('conversation-subtitle','你的回答会改变范围、开始方式和结果。');
 const area=$('question-area');area.replaceChildren();area.append(el('p',step<6?`第 ${step+1} 项确认`:'开始搭建前','question-progress'));
 if(step===0){
  addOptions(scene.question,scene.choices.map((x,i)=>[i,x.label]),'focus');
  const help=el('button','我还没想清楚，先看一个例子','text-button');help.type='button';help.id='need-help';area.append(help);
  help.onclick=()=>{if(!$('clarify-example')){const n=el('p',`例如：${scene.objects[0]}目前是“${scene.before[0]}”，${scene.objects[2]}是“${scene.before[2]}”。可以先关注部分情况，也可以把三项一起整理。`,'question-hint');n.id='clarify-example';area.append(n);}};
 }else if(step===1)addOptions(scene.detailQuestion,scene.details.map((x,i)=>[i,x]),'detail');
 else if(step===2){addOptions('这些工作资料从哪里取得？',Object.entries(SOURCE_NAMES),'source');area.append(el('p','昭回先查看已有能力，再引导完成这项工作需要的连接。','quiet-note'));}
 else if(step===3){
  area.append(el('h3',a.source==='files'?'选择资料，并确认内容':'选择店铺，并确认读取范围','question-title'));
  const select=el('select');scene.platforms.forEach(p=>{const o=el('option',p);o.value=p;o.selected=p===a.shop;select.append(o);});area.append(...labelInput('source-shop','这份资料属于哪家店或哪个平台？',select));
  area.append(el('p',`本次只用到：${scene.source}。`,'question-hint'));
  const probe=el('button',sampleShown?'重新查看示例资料':'演示接入，并查看一份样例','button full');probe.id='probe-source';probe.type='button';area.append(probe);
  if(sampleShown){
   const sample=el('div',undefined,'data-sample');sample.id='source-sample';chosenObjects(scene,a).forEach(item=>{const row=el('div');row.append(el('b',item.title),el('span',item.before));sample.append(row);});sample.append(el('p','这是本次演示的资料，不是你的店铺记录。','quiet-note'));area.append(sample);
   const confirm=el('button','样例对应正确，继续','button primary full');confirm.id='confirm-source';confirm.type='button';area.append(confirm);confirm.onclick=()=>{a.connectionConfirmed=true;step=4;renderQuestion();};
  }
  area.append(el('p',a.source==='connect'?'真实使用时，账号登录与允许范围由你在对应后台确认。这里不索要密码。':'实际搭建时，确认资料属于本店、对象对应正确、日期也符合要求。','quiet-note'));
  select.onchange=()=>{a.shop=select.value;a.connectionConfirmed=false;sampleShown=false;clearTimeout(probeTimer);probeGeneration++;renderQuestion();};probe.onclick=probeSource;
 }else if(step===4){
  const time=el('input');time.type='time';time.value=a.time;time.required=true;area.append(...labelInput('check-time','选择定时时使用的时间（北京时间）',time));time.oninput=()=>{if(time.validity.valid&&time.value)a.time=time.value;};
  addOptions('希望它怎样开始？',Object.entries(TRIGGERS).map(([k,v])=>[k,v.label]),'trigger');area.append(el('p','时间示例按每天检查安排。聊天与文件更新则按对应动作开始，不要求一直停留在对话里。','quiet-note'));
 }else if(step===5){
  const note=el('textarea');note.maxLength=600;note.rows=3;note.value=a.note;note.placeholder='例如：先给我查看结果，不要向客户发消息。';area.append(...labelInput('extra-note','还有什么要求？（选填）',note));note.oninput=()=>{a.note=note.value;};
  addOptions('希望怎样查看结果？',[['brief','先看简明清单'],['explained','附上依据和处理建议']],'delivery');area.append(el('p','补充文字会保存进说明；本页的示例不会理解并执行任意新指令。','quiet-note'));
 }else{
  area.append(el('h3','按这些要求搭建，可以吗？','question-title'));
  const review=el('div',undefined,'build-confirm');review.append(el('p',`重点：${scene.choices[a.focus].label}`),el('p',`处理方式：${scene.details[a.detail]}`),el('p',`资料：${SOURCE_NAMES[a.source]} · ${a.shop}`),el('p',`开始：${TRIGGERS[a.trigger].label}${a.trigger==='clock'?'，每天 '+a.time:''}`));if(a.note)review.append(el('p','补充要求：'+a.note));area.append(review);
  const b=el('button','确认安排，观看搭建','button primary full');b.id='confirm-build';b.type='button';area.append(b);b.onclick=startBuild;area.append(el('p','下面演示接入和搭建步骤，不会创建真实任务。','quiet-note'));
 }
 renderChat();previewPlan();
}
function probeSource(){
 const generation=++probeGeneration,button=$('probe-source');button.disabled=true;sampleShown=false;const steps=sourceSteps(scene,a);text('plan-status',steps[0]);
 if(motionPaused){sampleShown=true;renderQuestion();return;}
 let index=0;const tick=()=>{if(generation!==probeGeneration||step!==3)return;index++;if(index<steps.length){text('plan-status',steps[index]);probeTimer=setTimeout(tick,720);}else{sampleShown=true;renderQuestion();text('plan-status','示例资料已显示，请确认对象和日期。真实连接需要实际读取结果。');}};probeTimer=setTimeout(tick,720);
}
$('question-area').addEventListener('click',event=>{
 const b=event.target.closest('[data-answer]');if(!b||!scene)return;const field=b.dataset.field,value=b.dataset.answer;
 if(!['focus','detail','source','trigger','delivery'].includes(field))return;
 if(field==='trigger'&&value==='clock'&&!$('check-time').reportValidity())return;
 const index={focus:0,detail:1,source:2,trigger:4,delivery:5}[field];if(step!==index)return;
 clearFrom(index+1);a[field]=field==='focus'||field==='detail'?Number(value):value;step++;renderQuestion();
});
function instructions(){
 show('how-build',true);const cards=$('setup-cards');cards.replaceChildren();
 setupSteps(scene,a).forEach((s,i)=>{const card=el('article',undefined,'setup-card');card.append(el('small',`${String(i+1).padStart(2,'0')} · ${s.place}`),el('h3',s.name));const dl=el('dl');[['你来确认',s.you],['昭回负责',s.ai],['完成后应看到',s.result]].forEach(([label,value])=>dl.append(el('dt',label),el('dd',value)));card.append(dl);const refs=el('p',undefined,'setup-result');s.refs.forEach(id=>{const link=el('a',`[${id}]`);link.href=`../guide.html#evidence-${id}`;refs.append(link);});card.append(refs);cards.append(card);});
 const grid=el('div',undefined,'principle-grid');
 const rows=[['需求保存在工作说明里',`保存重点“${scene.choices[a.focus].label}”和处理方式“${scene.details[a.detail]}”，后续任务按同一份说明工作。`],['连接负责取得这次用到的资料',`复用已确认的${a.shop}资料来源，每次核对${scene.source}的对象与日期。`],['触发后开始一次任务',TRIGGERS[a.trigger].engine+' 电脑离线或正在处理其他任务时，需要说明等待或延迟。'],['未完成的事保留进展',`每次保留${scene.result}和来源。${scene.improve} 正式规则改变仍先请你确认。`]];
 rows.forEach(([title,body])=>{const n=el('div');n.append(el('h4',title),el('p',body));grid.append(n);});$('working-principle').replaceChildren(grid);
}
function startBuild(){
 if(!validateAnswers(scene,a)){toast('请先确认需求、资料和开始方式。');return;}
 run.stop();build.stop();world?.destroy();world=null;step=6;setPhase('build');show('question-area',false);show('build-left',true);show('run-left',false);show('planning-view',true);show('runtime-view',false);show('start-run-view',false);$('back-answer').disabled=true;
 text('conversation-title','按你的要求准备流程');text('conversation-subtitle','每一步都能暂停或逐项查看。');previewPlan();show('connection-preview',false);text('answers-progress','6 / 6');$('build-list').replaceChildren(...setupSteps(scene,a).map(s=>el('li',s.name)));instructions();build.start({auto:!motionPaused});
}
function renderBuildFrame(frame){
 if(!scene)return;const s=setupSteps(scene,a)[frame];$('journey-app').dataset.buildFrame=String(frame);
 all('#build-list li').forEach((n,i)=>{n.classList.toggle('done',i<frame||frame===5);n.classList.toggle('current',i===frame&&frame<5);});
 all('.flow-node').forEach((n,i)=>{n.classList.remove('waiting');n.classList.toggle('ready',i<frame||frame===5);n.classList.toggle('active',i===frame&&frame<5);});
 text('plan-status',`${s.ai} 完成后应看到：${s.result}`);show('connection-preview',frame===1||frame===2);
 if(frame===1||frame===2){text('connection-origin',a.source==='files'?'已选择的工作文件夹':a.shop);$('connection-preview-steps').replaceChildren(...sourceSteps(scene,a).map(s=>el('li',s)));$('connection-preview').classList.add('sample-ready');}
 show('start-run-view',frame===5);if(frame===5)text('conversation-subtitle','示例流程已准备好，可以触发一次运行。');
}
function updateBuildControls(){text('build-toggle',build.playing?'暂停搭建演示':'继续搭建演示');$('build-toggle').disabled=build.frame>=5;$('build-next').disabled=build.frame>=5;}
function enterRuntime(){
 if(build.frame!==5||!validateAnswers(scene,a))return;build.stop();setPhase('run');show('build-left',false);show('question-area',false);show('run-left',true);show('planning-view',false);show('runtime-view',true);
 text('conversation-title','这项工作怎样执行');text('conversation-subtitle','触发一次，观察资料怎样变成结果。');
 const rows=[['最初的想法',scene.thought],['关注范围',scene.choices[a.focus].label],['具体处理方式',scene.details[a.detail]],['资料',SOURCE_NAMES[a.source]+' · '+a.shop],['开始条件',TRIGGERS[a.trigger].label+(a.trigger==='clock'?'，每天 '+a.time:'')],['结果形式',a.delivery==='brief'?'简明清单':'附上依据与处理建议']];if(a.note)rows.push(['补充要求',a.note]);
 $('run-brief').replaceChildren(...rows.map(([label,value])=>{const row=el('div',undefined,'run-brief-row');row.append(el('small',label),el('p',value));return row;}));
 $('trigger-card').dataset.trigger=a.trigger;text('trigger-symbol',{clock:'◷',chat:'✉',file:'▤'}[a.trigger]);text('trigger-title',TRIGGERS[a.trigger].label);text('trigger-context',a.trigger==='clock'?`每天 ${a.time}，北京时间`:a.trigger===scene.trigger?scene.when:TRIGGERS[a.trigger].action);text('trigger-run',TRIGGERS[a.trigger].action);
 world?.destroy();world=createWorld($('world-host'),scene);$('run-variant').value='normal';variant='normal';resetRun();scroll('journey-app');
}
function resetRun(){
 run.stop();resolved=false;blocked=false;feedback=null;show('result-panel',false);show('issue-resolution',false);show('feedback-proposal',false);$('journey-app').dataset.runFrame='-1';$('journey-app').dataset.runState='ready';
 text('frame-number','等待开始');text('frame-title','先触发一份示例输入。');text('frame-description','根据刚才确认的要求，观察本次资料怎样变成结果。');$('trigger-card').classList.remove('is-triggered');['play-toggle','run-next','replay-run'].forEach(id=>$(id).disabled=true);$('trigger-run').disabled=false;
 $('run-variant').querySelector('[value=duplicate]').disabled=!completed.has(fingerprint());world?.update(-1,{indices:chosenObjects(scene,a).map(x=>x.index),paused:true,revision});renderRail(-1);
}
function startRun(){
 if(phase!=='run'||!world)return;run.stop();variant=$('run-variant').value;
 if(variant==='duplicate'&&!completed.has(fingerprint())){toast('先完成一次示例，再查看重复输入。');return;}
 blocked=false;resolved=false;feedback=null;show('result-panel',false);show('issue-resolution',false);show('feedback-proposal',false);all('[data-feedback]').forEach(b=>b.setAttribute('aria-pressed','false'));
 $('trigger-card').classList.remove('is-triggered');void $('trigger-card').offsetWidth;$('trigger-card').classList.add('is-triggered');$('replay-run').disabled=false;run.start({auto:!motionPaused});
}
function renderRail(frame){$('runtime-rail').replaceChildren(...['触发','读取','核对','整理','结果','跟进'].map((label,i)=>{const n=el('span',label,'runtime-stop');n.classList.toggle('current',i===frame);n.classList.toggle('done',i<frame);return n;}));}
function renderRunFrame(frame){
 const story=frameStory(scene,a,frame,{variant,resolved,quiet,duplicate:variant==='duplicate'});blocked=story.blocked;
 world.update(frame,{indices:chosenObjects(scene,a).map(x=>x.index),paused:!run.playing,variant,revision,quiet,detail:scene.details[a.detail],resolved,pendingIndices:resultItems().filter(item=>item.pending).map(item=>item.index)});
 $('journey-app').dataset.runFrame=String(frame);$('journey-app').dataset.runState=blocked?'waiting_confirmation':frame===5?'completed':'running';text('frame-number',`${frame+1} / 6`);text('frame-title',story.title);text('frame-description',story.description);renderRail(frame);
 show('issue-resolution',blocked);if(blocked){text('issue-description',scene.issue);run.pause();}show('result-panel',frame>=4&&!blocked);
 if(frame>=4&&!blocked)renderResult(frame);
 if(frame===5){const key=fingerprint(),previous=completed.get(key);if(variant!=='duplicate')completed.set(key,{recordId:previous?.recordId||`example-${scene.id}-${revision}`,items:resultItems()});$('result-panel').dataset.recordId=completed.get(key).recordId;$('result-panel').dataset.uniqueResults=String(completed.size);$('run-variant').querySelector('[value=duplicate]').disabled=false;}
}
function resultItems(){
 const previous=completed.get(fingerprint());
 if(variant==='duplicate'&&previous)return previous.items;
 const items=chosenObjects(scene,a);
 return items.map(item=>{
  const pending=variant==='issue'&&resolved&&item.index===items[0].index;
  return {...item,pending,after:pending?'单独交给人确认，不按原建议继续处理':item.after};
 });
}
function renderResult(frame){
 const items=resultItems(),duplicate=variant==='duplicate';text('result-title',duplicate?'继续查看上一次的结果':scene.result);text('result-count',`${items.length} 项示例`);
 $('result-records').replaceChildren(...items.map(item=>{const row=el('div',undefined,'result-record');row.dataset.record=String(item.index);row.append(el('b',item.title));if(a.delivery==='explained'&&!quiet)row.append(el('small','原来：'+item.before));row.append(el('p',item.after));if(item.pending)row.dataset.pending='true';return row;}));
 if(duplicate)$('result-records').append(el('p','这份输入已经处理过，没有再创建第二份记录。','duplicate-chip'));
 text('result-detail',`本次按“${scene.details[a.detail]}”处理。${quiet?'重复的原始说明收起，当前需要处理的内容仍然全部保留。':''}${a.note?'补充要求：'+a.note+'。':''}`);all('[data-feedback]').forEach(b=>b.disabled=frame!==5);
}
function updateRunControls(){
 const hasFrame=run.frame>=0&&phase==='run';$('play-toggle').disabled=!hasFrame||blocked||run.frame>=5;$('run-next').disabled=!hasFrame||blocked||run.frame>=5;text('play-toggle',run.playing?'暂停':'继续');
 if(phase==='run'){$('trigger-run').disabled=hasFrame&&run.frame<5;if(hasFrame)$('journey-app').dataset.playing=String(run.playing);world?.setPaused(!run.playing||motionPaused||blocked);}
}
function nextRun(){if(blocked)return;run.pause();run.next();}
function showFeedback(kind){
 if(run.frame!==5||phase!=='run')return;feedback=kind;all('[data-feedback]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.feedback===kind)));
 const proposal=kind==='noise'?`下一轮收起重复的原始说明，保留全部当前结果。${scene.improve}`:kind==='wrong'?`先重新确认资料：${scene.issue} 确认后再继续这项工作。`:`继续保留这种处理方法，并检查实际结果。${scene.improve}`;
 text('proposal-text',proposal);text('apply-proposal',kind==='wrong'?'返回资料确认':'按这个调整再演示一次');show('feedback-proposal',true);
}
function applyProposal(){if(!feedback||run.frame!==5)return;if(feedback==='wrong'){returnTo(3);return;}revision++;quiet=feedback==='noise';$('run-variant').value='normal';variant='normal';completed.clear();instructions();startRun();}
function savePlan(){
 if(!scene||!validateAnswers(scene,a))return;const p=makeJourneyPlan(scene,a,revision);if(quiet)p.feedback_proposal='收起重复的原始说明，但保留全部当前结果。'+p.feedback_proposal;
 const url=URL.createObjectURL(new Blob([planText(p)],{type:'text/markdown;charset=utf-8'}));const link=el('a');link.href=url;link.download=`昭回-${String(scene.id).padStart(2,'0')}-搭建说明.md`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1600);toast('搭建说明已准备好。文件不会直接启动任务，实际使用时再确认连接和结果。');
}
$('load-example').onclick=()=>{if(!scene)return;stop();a=sampleAnswers(scene);sampleShown=true;step=6;revision=1;quiet=false;completed.clear();renderQuestion();toast('已填入一组示例回答，仍可以返回修改。');};
$('back-answer').onclick=()=>{if(step>0&&phase==='clarify'){step--;clearFrom(step);renderQuestion();}};
$('build-toggle').onclick=()=>build.toggle();$('build-next').onclick=()=>{build.pause();build.next();};$('start-run-view').onclick=enterRuntime;$('trigger-run').onclick=startRun;$('replay-run').onclick=startRun;$('play-toggle').onclick=()=>{if(!blocked)run.toggle();};$('run-next').onclick=nextRun;
$('play-speed').onchange=e=>run.setSpeed(e.target.value);$('run-variant').onchange=()=>{variant=$('run-variant').value;resetRun();};
$('resolve-example').onclick=()=>{if(!blocked)return;resolved=true;blocked=false;show('issue-resolution',false);run.pause();run.next();toast('先保留待确认事项，继续整理其他内容。没有把问题当成已经解决。');};
$('return-to-source').onclick=()=>returnTo(2);$('edit-requirements').onclick=()=>returnTo(0);$('choose-another').onclick=()=>{run.pause();build.pause();scroll('library');};$('apply-proposal').onclick=applyProposal;$('save-plan').onclick=savePlan;
document.addEventListener('click',event=>{const pick=event.target.closest('[data-pick]');if(pick&&!event.metaKey&&!event.ctrlKey){event.preventDefault();selectScene(pick.dataset.pick);return;}const b=event.target.closest('[data-feedback]');if(b)showFeedback(b.dataset.feedback);});
function filterLibrary(){
 const query=$('idea-search').value.trim().toLocaleLowerCase();let count=0;
 all('.library-card').forEach(card=>{const s=scenes.get(Number(card.dataset.id));const body=[s.thought,s.title,s.question,s.source,s.categoryName,...s.platforms,...s.objects].join(' ').toLocaleLowerCase();const visible=(category==='all'||s.category===category)&&(!query||body.includes(query));card.hidden=!visible;if(visible)count++;});
 text('library-count',`${count} / 60 个场景`);show('search-empty',count===0);all('#category-filters [data-category]').forEach(b=>{const active=b.dataset.category===category;b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);});
}
$('idea-search').oninput=filterLibrary;$('idea-search-form').onsubmit=e=>{e.preventDefault();filterLibrary();};$('category-filters').onclick=e=>{const b=e.target.closest('[data-category]');if(b){category=b.dataset.category;filterLibrary();}};$('reset-search').onclick=()=>{category='all';$('idea-search').value='';filterLibrary();};
function applyMotion(){document.body.classList.toggle('motion-paused',motionPaused);$('motion-toggle').setAttribute('aria-pressed',String(motionPaused));text('motion-toggle',motionPaused?'开启动效':'暂停动效');if(motionPaused){run.pause();build.pause();}}
$('motion-toggle').onclick=()=>{manualMotionChoice=true;motionPaused=!motionPaused;applyMotion();};media.addEventListener('change',event=>{if(!manualMotionChoice){motionPaused=event.matches;applyMotion();}});
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-away',document.hidden);if(document.hidden){run.pause();build.pause();}});
new IntersectionObserver(entries=>document.body.classList.toggle('dream-away',!entries[0].isIntersecting),{threshold:0}).observe(document.querySelector('.dream'));
all('.idea-chip[data-pick]').forEach(chip=>chip.addEventListener('focus',()=>chip.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'})));
window.addEventListener('pagehide',()=>{run.pause();build.pause();clearTimeout(probeTimer);});
const technicalSections=new Set(['reality','platforms','systems','workflows','architecture','onboarding','lab','observability','roadmap','guardrails','research','sources']);const guideSections=new Set(['compose','presets','stories','improve','capabilities','evidence']);
function routeHash(){const hash=location.hash.slice(1),m=hash.match(/^scene-(\d{1,2})$/);if(m&&scenes.has(Number(m[1]))){if(!scene||scene.id!==Number(m[1]))selectScene(m[1],{historyMode:'none'});return;}if(technicalSections.has(hash)||/^source-[A-Z]\d{2}$/.test(hash)){location.replace(new URL(`../architecture.html#${hash}`,location.href).href);return;}if(guideSections.has(hash)||/^evidence-[RE]\d{2}$/.test(hash)||/^group-/.test(hash))location.replace(new URL(`../guide.html#${hash}`,location.href).href);}
window.addEventListener('hashchange',routeHash);window.addEventListener('popstate',routeHash);applyMotion();filterLibrary();routeHash();
