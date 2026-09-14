import {artFor,decorateStage} from './journey-art.mjs';
// Semantic motion layouts, with independent business props and scripts for all 60 scenes.
const GROUPS={board:['sort','progress','inbox','watch','value'],pipeline:['trace','signal','freshness'],paper:['checklist','catalog','countdown','calendar'],handoff:['handoff','roles'],compare:['compare','versions','batch','inspect','publish','abtest','replay','patch'],match:['match','schema'],wardrobe:['measure','sizes'],cluster:['funnel','cluster','reviews'],studio:['studio'],stage:['live','transcript','experiment'],archive:['offer','archive','unsubscribe'],repair:['repair','creator','supplier'],chat:['chat','stalechat'],clock:['promise','deadline','booking'],road:['parcel','tracking','routes','address'],split:['split'],exchange:['exchange'],returns:['returns'],kit:['kit','inventory'],evidence:['evidence'],people:['members','suppress','merge','dedup'],damage:['damage'],migration:['migration']};
const LABELS={board:['输入的事情','按要求整理','本次结果'],pipeline:['资料来源','核对时间与对象','保留真实结果'],paper:['本次要求','逐项检查','准备下一步'],handoff:['上一步记录','等待的条件','下一负责人'],compare:['原来记录','对照检查','修改或保留'],match:['看到的名称','确认具体编号','正确对应'],wardrobe:['商品规格','核实说明','准备回复'],cluster:['分散的问题','相同主题','可处理的问题'],studio:['已确认商品事实','分别准备文案','交给人审核'],stage:['本场资料','讲解与承诺','下次的准备'],archive:['当前使用','检查是否适用','保留历史记录'],repair:['已有问题','新资料到达','继续原来的工作'],chat:['买家的问题','核对商品资料','待审核回复'],clock:['约定时间','实际进度','需要人处理'],road:['仓库记录','确认实际进展','本次核查结果'],split:['一笔订单','分别寻找包裹','逐件说明'],exchange:['旧件退回','新规格确认','新件补寄记录'],returns:['买家退回','仓库签收','实际验收'],kit:['每套组成','确认可用数量','找到限制整套的部分'],evidence:['零散记录','按顺序对应','可核对的目录'],people:['名单与记录','确认身份和用途','交给人审核'],damage:['包装记录','核查已知破损','提出验证办法'],migration:['原店的方法','区分通用与专属','目标店的说明']};
export function familyOf(kind){return Object.keys(GROUPS).find(k=>GROUPS[k].includes(kind))||'board';}
const interpolate=(a,b,t)=>a+(b-a)*t;
const P=(x,y,w=27,angle=0)=>({x,y,w,angle});
export function posesFor(scene,frame,compact=false){
 const family=familyOf(scene.kind),f=Math.max(0,frame),t=Math.min(1,Math.max(0,(f-1)/3));
 let start,end;
 switch(family){
 case 'board':start=[P(53,72,66,-3),P(47,23,66,2),P(51,48,66,-1)];end=[P(50,23,66),P(50,48,66),P(50,73,66)];break;
 case 'pipeline':start=[P(20,28,28),P(30,55,28),P(22,78,28)];end=[P(19,45,28),P(50,45,28),P(81,45,28)];break;
 case 'paper':start=[P(39,38,65,-8),P(52,47,65,4),P(60,56,65,8)];end=[P(51,25,68),P(51,49,68),P(51,73,68)];break;
 case 'handoff':start=[P(22,29,34,-3),P(25,54,34,2),P(22,78,34)];end=[P(76,27,35),P(76,52,35),P(76,77,35)];break;
 case 'compare':start=[P(26,25,39),P(26,50,39),P(26,75,39)];end=[P(74,25,39),P(74,50,39),P(74,75,39)];break;
 case 'match':start=[P(23,20,34),P(24,73,34),P(22,47,34)];end=[P(74,24,36),P(74,50,36),P(74,76,36)];break;
 case 'wardrobe':start=[P(18,37,28,-3),P(52,42,28,2),P(82,34,28,3)];end=[P(18,57,28),P(50,57,28),P(82,57,28)];break;
 case 'cluster':start=[P(25,22,32,-8),P(69,35,32,7),P(43,72,32,-4)];end=scene.kind==='funnel'?[P(50,24,76),P(50,49,60),P(50,74,44)]:[P(18,55,29),P(50,55,29),P(82,55,29)];break;
 case 'studio':start=[P(50,43,28,-4),P(50,44,28,2),P(50,45,28,5)];end=[P(18,57,29),P(50,57,29),P(82,57,29)];break;
 case 'stage':start=scene.kind==='transcript'?[P(30,23,45),P(30,49,45),P(30,75,45)]:[P(18,55,28),P(50,55,28),P(82,55,28)];end=scene.kind==='transcript'?[P(66,23,51),P(66,49,51),P(66,75,51)]:[P(18,48,28),P(50,48,28),P(82,48,28)];break;
 case 'archive':start=[P(24,26,35,-2),P(26,52,35,2),P(24,77,35,-1)];end=[P(72,26,39),P(72,52,39),P(72,77,39)];break;
 case 'repair':start=[P(19,55,28),P(50,55,28),P(81,55,28)];end=[P(19,41,28),P(50,54,28),P(81,41,28)];break;
 case 'chat':start=[P(37,25,56),P(61,52,56),P(38,78,56)];end=scene.kind==='stalechat'?[P(29,20,45),P(69,47,49,3),P(34,77,52)]:[P(34,22,51),P(65,47,51),P(35,76,58)];break;
 case 'clock':start=[P(70,75,45),P(70,25,45),P(70,50,45)];end=[P(70,25,45),P(70,50,45),P(70,75,45)];break;
 case 'road':start=[P(19,35,28),P(34,59,28),P(49,80,28)];end=scene.kind==='routes'?[P(22,50,30),P(68,25,35),P(68,75,35)]:[P(18,46,29),P(50,46,29),P(82,46,29)];break;
 case 'split':start=[P(24,39,30,-3),P(24,49,30),P(24,59,30,3)];end=[P(73,23,39),P(73,49,39),P(73,75,39)];break;
 case 'exchange':start=[P(75,25,33),P(50,49,33),P(25,75,33)];end=[P(25,25,33),P(50,49,33),P(75,75,33)];break;
 case 'returns':start=[P(81,38,28),P(51,61,28),P(20,78,28)];end=[P(81,42,28),P(50,42,28),P(19,42,28)];break;
 case 'kit':start=[P(18,24,28),P(50,24,28),P(82,24,28)];end=[P(18,52,28),P(50,52,28),P(82,52,28)];break;
 case 'evidence':start=[P(36,48,36,-14),P(51,44,36,6),P(62,52,36,15)];end=[P(22,38,30),P(50,52,30),P(78,66,30)];break;
 case 'people':start=[P(21,24,35),P(21,50,35),P(21,76,35)];end=['merge','dedup'].includes(scene.kind)?[P(65,27,46),P(65,51,46),P(65,77,46)]:[P(71,24,45),P(71,50,45),P(71,76,45)];break;
 case 'damage':start=[P(24,55,33,-5),P(72,55,33,4),P(50,80,41)];end=[P(24,44,33),P(72,44,33),P(50,77,45)];break;
 case 'migration':start=[P(26,25,38),P(26,50,38),P(26,75,38)];end=[P(74,25,38),P(50,50,38),P(74,75,38)];break;
 }
 // Individual routes keep the visual action tied to the business operation.
 if(scene.kind==='inbox'){end=[P(43,26,66),P(43,54,66),P(66,81,54)];}
 if(scene.kind==='value'){end=[P(57,72,61),P(48,23,70),P(57,48,61)];}
 if(scene.kind==='abtest'){end=[P(74,25,39),P(26,50,39),P(26,75,39)];}
 if(scene.kind==='replay'){end=[P(74,25,39),P(26,50,39),P(74,75,39)];}
 if(scene.kind==='versions'){end=[P(74,24,39),P(71,51,39),P(67,77,39,-3)];}
 if(scene.kind==='patch'){end=[P(72,24,40),P(72,51,40),P(72,77,40)];}
 if(scene.kind==='freshness'){end=[P(29,27,43),P(69,54,43),P(31,80,43)];}
 if(scene.kind==='signal'){end=[P(24,26,38),P(24,53,38),P(72,68,38)];}
 if(scene.kind==='promise'){end=[P(70,25,46),P(70,51,46),P(73,79,40)];}
 if(scene.kind==='booking'){end=[P(70,24,46),P(62,52,46),P(72,80,40)];}
 if(scene.kind==='address'){end=[P(19,33,28),P(50,50,28),P(80,69,28)];}
 if(scene.kind==='tracking'){end=[P(21,30,32),P(24,58,32),P(74,67,36)];}
 if(scene.kind==='sizes'){end=[P(18,42,29),P(50,52,29),P(82,63,29)];}
 if(scene.kind==='inventory'){end=[P(22,28,35),P(77,28,35),P(50,70,44)];}
 if(scene.kind==='merge'){end=[P(70,22,43),P(70,44,43),P(70,76,43)];}
 if(scene.kind==='dedup'){end=[P(67,24,48),P(67,44,48),P(67,77,48)];}
 if(scene.kind==='suppress'){end=[P(26,24,41),P(26,51,41),P(75,76,40)];}
 if(scene.kind==='supplier'){end=[P(31,37,37),P(67,63,37),P(82,28,28)];}
 if(scene.kind==='roles'){end=[P(29,29,40),P(30,57,40),P(73,78,40)];}
 if(scene.kind==='unsubscribe'){end=[P(76,25,36),P(69,51,43),P(27,76,41)];}
 if(compact){
  const backward=['returns','exchange','migration'].includes(family);
  start=[P(backward?60:40,24,70,-2),P(50,50,70,2),P(backward?40:60,76,70,-2)];
  end=[P(50,24,83),P(50,50,83),P(50,76,83)];
  if(['sort','promise','deadline','progress','value'].includes(scene.kind))start=[P(50,76,79,-2),P(50,24,79,2),P(50,50,79)];
  if(scene.kind==='stalechat')end=[P(45,24,76),P(54,50,76,-2),P(45,76,76)];
  if(scene.kind==='split')start=[P(50,40,61,-5),P(50,50,61),P(50,60,61,5)];
 }
 return start.map((p,i)=>{const delay=Math.min(1,Math.max(0,t+(i===0?.08:i===2?-.08:0)));return {x:interpolate(p.x,end[i].x,delay),y:interpolate(p.y,end[i].y,delay),w:interpolate(p.w,end[i].w,delay),angle:interpolate(p.angle,end[i].angle,delay)};});
}
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x;};
export function createWorld(host,scene){
 const family=familyOf(scene.kind),art=artFor(scene);host.replaceChildren();host.className=`world family-${family} kind-${scene.kind} prop-${art.prop}`;host.dataset.sceneId=String(scene.id);host.dataset.kind=scene.kind;host.dataset.motionCue=art.cue;
 const header=el('div',undefined,'world-heading');header.append(el('span',art.title),el('span','示例资料','tiny'));host.append(header);
 const stage=el('div',undefined,'world-canvas');stage.setAttribute('role','img');stage.setAttribute('aria-label',scene.title+'的工作示意');host.append(stage);
 const labels=LABELS[family]||LABELS.board;const lane=el('div',undefined,'world-lanes');labels.forEach((label,i)=>{const d=el('span',label);d.style.setProperty('--i',i);lane.append(d);});stage.append(lane);
 const rail=el('div',undefined,'world-rail');rail.append(el('span',undefined,'traveler'));stage.append(rail);
 if(family==='clock'){const clock=el('div',undefined,'scene-clock');clock.append(el('i',undefined,'clock-hand'),el('b','约定时间'));stage.append(clock);}
 if(family==='compare'||family==='match'||family==='migration'){const ghosts=el('div',undefined,'original-records');scene.objects.forEach((title,i)=>{const g=el('div');g.append(el('small',title),el('span',scene.before[i]));ghosts.append(g);});stage.append(ghosts);}
 if(family==='kit'){const tray=el('div',scene.kind==='kit'?'检查整套能否配齐':'按同一仓库口径核对','assembly-tray');stage.append(tray);}
 if(family==='stage'){stage.append(el('div',scene.kind==='transcript'?'原文位置':scene.kind==='experiment'?'讲解前后的观察':'本场商品与讲稿','stage-marquee'));}
 if(family==='road'||family==='split'||family==='returns'||family==='exchange'){stage.append(el('div','读取已有物流记录，不会在这里真实发货','world-context'));}
 const actors=scene.objects.map((title,i)=>{
  const card=el('div',undefined,'actor');card.dataset.actor=String(i);card.style.setProperty('--i',i);
  const shape=el('div',undefined,'actor-shape');shape.append(el('i'),el('i'),el('i'));const code=el('span',String(i+1).padStart(2,'0'),'actor-index');
  const info=el('div',undefined,'actor-copy');const h=el('b',title);const value=el('p',scene.before[i]);const verdict=el('small','等待检查','actor-verdict');info.append(h,value,verdict);card.append(shape,code,info);stage.append(card);return {card,value,verdict};
 });
 const scanner=el('div',undefined,'world-scanner');stage.append(scanner);
 const decor=decorateStage(stage,scene,el);
 const footer=el('div',undefined,'world-footer');footer.append(el('span','等待启动','world-status'),el('span','结果与来源会一起保留','world-memory'));host.append(footer);
 let lastFrame=-1,lastOptions={},lastWidth=0;
 function setPaused(paused){host.classList.toggle('world-paused',paused);host.getAnimations({subtree:true}).forEach(a=>{if(a.playState!=='finished'){if(paused)a.pause();else a.play();}});}
 function update(frame,{indices=[0,1,2],paused=false,variant='normal',revision=1,quiet=false,detail='',resolved=false}={}){
  lastFrame=frame;lastOptions={indices,paused,variant,revision,quiet,detail,resolved};
  const compact=host.clientWidth<500;
  const poses=posesFor(scene,frame,compact);host.dataset.frame=String(frame);host.dataset.variant=variant;host.dataset.quiet=String(quiet);host.dataset.resolved=String(resolved);host.dataset.compact=String(compact);host.style.setProperty('--frame',Math.max(0,frame));decor.update(frame);
  actors.forEach(({card,value,verdict},i)=>{
   const p=poses[i];card.style.left=p.x+'%';card.style.top=p.y+'%';card.style.width=p.w+'%';card.style.transform=`translate(-50%,-50%) rotate(${p.angle}deg)`;
   const picked=indices.includes(i);card.classList.toggle('not-selected',!picked&&frame>=1);card.classList.toggle('checked',frame>=3&&picked);card.classList.toggle('focused',frame===2&&i===indices[0]);
   value.textContent=frame>=3&&picked?scene.after[i]:scene.before[i];
   const attention=/待|核|缺|先|不|暂停/.test(scene.after[i]);card.classList.toggle('attention',attention&&picked&&frame>=3);
   verdict.textContent=!picked&&frame>=1?'本次不包含这一项':frame<1?'示例中的原始记录':frame===1?'本次输入':frame===2?'正在核对':frame>=5?`已保留 · 第 ${revision} 次演示`:attention?'列入待确认事项':'整理到本次结果';
  });
  footer.firstChild.textContent=frame<0?'等待启动':frame<2?'读取本次资料':frame<4?'按确认的要求整理':frame<5?'结果已形成':'保存进展，等待下一次变化';
  if(variant==='issue'&&frame===2&&!resolved){footer.firstChild.textContent='先核实这份资料';host.classList.add('has-issue');}else host.classList.remove('has-issue');
  if(variant==='duplicate'){footer.firstChild.textContent=frame<1?'又收到同一份输入':'使用原记录，不重复建待办';}
  footer.lastChild.textContent=quiet?'未变化内容保留在工作记录':detail||'结果与来源会一起保留';
  stage.setAttribute('aria-label',`${scene.title}。${frame<0?'等待启动':frame<2?'读取资料':frame<4?scene.steps[Math.min(2,frame-2)]:scene.result}。本次检查${indices.length}项示例记录。`);
  host.classList.toggle('world-paused',paused);
 }
 const observer=new ResizeObserver(entries=>{const width=Math.round(entries[0].contentRect.width);if(width&&width!==lastWidth){lastWidth=width;update(lastFrame,lastOptions);}});observer.observe(host);
 update(-1);return {update,setPaused,family,destroy(){observer.disconnect();host.getAnimations({subtree:true}).forEach(a=>a.cancel());},signature:()=>JSON.stringify({kind:scene.kind,cue:art.cue,prop:art.prop,poses:Array.from({length:6},(_,f)=>posesFor(scene,f)),objects:scene.objects,before:scene.before,after:scene.after})};
}
