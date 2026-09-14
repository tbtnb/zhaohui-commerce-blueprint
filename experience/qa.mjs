import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {sampleAnswers,blankAnswers,validateAnswers,makeJourneyPlan,planText,chosenObjects,sourceSteps,setupSteps,frameStory,StepPlayer} from './journey-model.mjs';
import {ART,artFor} from './journey-art.mjs';
import {posesFor,familyOf} from './journey-visuals.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const serveRoot=path.dirname(root);
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(root,process.env.QA_OUTPUT||'qa-output/journey');await fs.mkdir(out,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(root,'journeys.json'),'utf8'));
const checks=[],sceneRuns=[],layoutFindings=[],browserErrors=[];
const check=(name,condition=true)=>{assert.ok(condition,name);checks.push(name);};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let server,browser,page,site=process.env.SITE_URL;
let stage='initialization';
try{
 check('All 60 scene identities and individual visual operations exist',data.scenes.length===60&&new Set(data.scenes.map(s=>s.kind)).size===60&&data.scenes.every(s=>Boolean(ART[s.kind])));
 check('All scenes have independently authored questions, objects and failure cases',new Set(data.scenes.map(s=>s.question)).size===60&&new Set(data.scenes.map(s=>s.issue)).size===60&&data.scenes.every(s=>s.objects.length===3&&s.before.length===3&&s.after.length===3));
 const signatures=data.scenes.map(s=>JSON.stringify({geometry:familyOf(s.kind),prop:artFor(s).prop,cue:artFor(s).cue,poses:Array.from({length:6},(_,f)=>posesFor(s,f)),objects:s.objects}));
 check('60 complete motion descriptions are distinct',new Set(signatures).size===60);
 for(const scene of data.scenes){
  const a=sampleAnswers(scene);assert.ok(validateAnswers(scene,a));
  for(const source of ['existing','connect','files']){const p=makeJourneyPlan(scene,{...a,source});assert.equal(p.activated,false);assert.equal(p.authorization,'not_granted_by_this_demo');assert.equal(p.steps.length,6);assert.equal(sourceSteps(scene,{...a,source}).length,3);}
  assert.ok(!validateAnswers(scene,blankAnswers(scene)));
  assert.ok(!validateAnswers(scene,{...a,connectionConfirmed:false}));
  assert.ok(!validateAnswers(scene,{...a,shop:'unapproved-store'}));
  assert.ok(!validateAnswers(scene,{...a,time:'99:90'}));
  assert.ok(frameStory(scene,a,2,{variant:'issue'}).blocked);
  assert.ok(!frameStory(scene,a,3,{variant:'issue',resolved:true}).blocked);
 }
 check('All scenes require explicit answers, scoped sources and valid time before plan export');
 check('All 60 plans retain non-activation and human-confirmed source setup');
 let ticks=[];const player=new StepPlayer(f=>ticks.push(f),{interval:25});
 player.start({auto:true});player.pause();await delay(65);check('Pause cancels scheduled progress',ticks.length===1);
 player.next();check('Single step advances one frame',ticks.at(-1)===1);
 player.resume();await delay(40);check('Resume continues the paused player',ticks.length>=3);
 player.stop();const before=ticks.length;await delay(60);check('Stopping prevents stale callbacks',ticks.length===before);
 player.start({auto:false});player.next();player.next();check('A new run starts fresh',player.frame===2);player.stop();
 if(!site){
  const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8'};
  server=http.createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const file=path.resolve(serveRoot,'.'+(p.endsWith('/')?p+'index.html':p));if(!file.startsWith(serveRoot+path.sep)||p.split('/').some(v=>v.startsWith('.'))){res.writeHead(403).end();return;}const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404).end('Not found');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));site=`http://127.0.0.1:${server.address().port}/experience/`;
 }
 try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true});
 page=await context.newPage();page.setDefaultTimeout(6000);page.setDefaultNavigationTimeout(35000);
 const errors=browserErrors,requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{const u=new URL(r.url());if(['http:','https:'].includes(u.protocol)&&u.origin!==new URL(site).origin)requests.push(r.url());});
 stage='initial page';const response=await page.goto(site,{waitUntil:'networkidle'});
 check('Published homepage returns HTTP 200',response.status()===200);
 check('Scene library and idea buttons include all 60 choices',await page.locator('.library-card').count()===60&&await page.locator('.idea-space button[data-pick]').count()===60);
 check('Page identifies its dialogue and data as demonstration',(await page.locator('.demo-caption').innerText()).includes('预设对话'));
 check('Reduced motion starts without background movement',await page.locator('#motion-toggle').getAttribute('aria-pressed')==='true');
 check('No technical integration-readiness labels on the new library',!(await page.locator('#journey-library').innerText()).includes('需核验新鲜读取'));
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['narrow',320,740]]){
  await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
  check(`${name} homepage has no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,`hero-${name}.png`)});
 }
 await page.setViewportSize({width:1440,height:1000});
 const select=async(id)=>{await page.locator(`.library-card[data-id="${id}"] a[data-pick]`).click();await page.locator(`#journey-app[data-scene="${id}"][data-phase="clarify"]`).waitFor();};
 const choose=async(field,value)=>page.locator(`[data-field="${field}"][data-answer="${value}"]`).click();
 async function finishBuild(){await page.locator('#confirm-build').click();for(let i=1;i<6;i++)await page.locator('#build-next').click();assert.equal(await page.locator('#journey-app').getAttribute('data-build-frame'),'5');await page.locator('#start-run-view').click();}
 async function completedRun(){await page.locator('#trigger-run').click();for(let i=1;i<6;i++)await page.locator('#run-next').click();await page.locator('#journey-app[data-run-state="completed"]').waitFor();}
 for(const c of data.categories){await page.locator(`#category-filters [data-category="${c.id}"]`).click();check(`${c.name} filter shows six ideas`,await page.locator('.library-card:visible').count()===6);}
 await page.locator('#reset-search').click();await page.locator('#idea-search').fill('不存在的内容-00000');check('Empty searches explain no match',await page.locator('#search-empty').isVisible());await page.locator('#idea-search').fill('换货');check('Search matches actual business wording',await page.locator('.library-card:visible').count()>0&&await page.locator('.library-card:visible').count()<60);await page.locator('#reset-search').click();
 stage='guided conversation';await select(31);const s31=data.scenes.find(s=>s.id===31);
 check('The first question is specific to the selected need',(await page.locator('.question-title').innerText())===s31.question);
 await page.locator('#need-help').click();check('Uncertain users can inspect a concrete example',(await page.locator('#clarify-example').innerText()).includes(s31.objects[0]));
 await choose('focus',0);await choose('detail',1);await choose('source','connect');
 check('Connection guidance appears within the conversation',await page.locator('#connection-preview').isVisible()&&(await page.locator('#connection-preview').innerText()).includes('登录'));
 check('A source sample is required before confirmation',await page.locator('#confirm-source').count()===0);
 await page.locator('#source-shop').selectOption(s31.platforms.at(-1));await page.locator('#probe-source').click();
 check('Source sample matches the selected scope',await page.locator('#source-sample>div').count()===s31.choices[0].items.length);
 await page.locator('#confirm-source').click();await page.locator('#check-time').fill('16:30');await choose('trigger','clock');await page.locator('#extra-note').fill('仅用于样例，不联系买家。');await choose('delivery','brief');
 check('Summary incorporates actual user choices',(await page.locator('.build-confirm').innerText()).includes('16:30')&&(await page.locator('.build-confirm').innerText()).includes(s31.details[1]));
 check('Building requires a final confirmation',await page.locator('#journey-app').getAttribute('data-phase')==='clarify');
 await page.locator('#journey-app').screenshot({path:path.join(out,'conversation-summary.png')});
 await finishBuild();
 check('Per-scene setup explains six practical steps',await page.locator('.setup-card').count()===6&&(await page.locator('#setup-cards').innerText()).includes(s31.source));
 check('Selected time reaches the runtime trigger',(await page.locator('#trigger-context').innerText()).includes('16:30'));
 check('Duplicate replay is unavailable before a completed result',await page.locator('#run-variant option[value="duplicate"]').evaluate(n=>n.disabled===true));
 await completedRun();
 check('Narrowed requirement changes the actual result count',await page.locator('.result-record').count()===s31.choices[0].items.length);
 check('Brief output omits old-record detail',await page.locator('.result-record small').count()===0);
 check('Clarification changes the result explanation',(await page.locator('#result-detail').innerText()).includes(s31.details[1]));
 const downloadPromise=page.waitForEvent('download');await page.locator('#save-plan').click();const download=await downloadPromise;await download.saveAs(path.join(out,'selected-plan.md'));
 const exported=await fs.readFile(path.join(out,'selected-plan.md'),'utf8');
 check('Saved instructions retain chosen shop, time and human checks',exported.includes(s31.platforms.at(-1))&&exported.includes('16:30')&&exported.includes(s31.choices[0].label)&&exported.includes('没有登录真实店铺'));
 await page.locator('#run-variant').selectOption('duplicate');await completedRun();
 check('Duplicate input reuses one result rather than creating another',await page.locator('#result-panel').getAttribute('data-unique-results')==='1'&&await page.locator('.duplicate-chip').isVisible());
 await page.locator('#run-variant').selectOption('issue');await page.locator('#trigger-run').click();await page.locator('#run-next').click();await page.locator('#run-next').click();
 check('An issue pauses at the specific uncertainty',await page.locator('#issue-resolution').isVisible()&&await page.locator('#run-next').isDisabled()&&(await page.locator('#issue-description').innerText())===s31.issue);
 check('No success result appears while blocked',!(await page.locator('#result-panel').isVisible()));
 await page.locator('#resolve-example').click();await page.locator('#run-next').click();await page.locator('#run-next').click();
 check('Explicit sample confirmation allows continuation',await page.locator('#journey-app').getAttribute('data-run-state')==='completed');
 await page.locator('[data-feedback="wrong"]').click();await page.locator('#apply-proposal').click();check('Wrong data feedback returns to source confirmation',await page.locator('#source-shop').isVisible()&&await page.locator('#confirm-source').count()===0);
 // Every journey is rendered, built, triggered and completed through actual UI controls.
 stage='all sixty complete journeys';
 for(const s of data.scenes){
  await select(s.id);await page.locator('#load-example').click();await finishBuild();
  const startBoxes=await page.locator('.actor').evaluateAll(nodes=>nodes.map(n=>({left:n.style.left,top:n.style.top,width:n.style.width})));
  assert.equal(await page.locator('#trigger-card').getAttribute('data-trigger'),s.trigger);
  await page.locator('#trigger-run').click();
  for(let frame=1;frame<=5;frame++){
   await page.locator('#run-next').click();assert.equal(await page.locator('#journey-app').getAttribute('data-run-frame'),String(frame));
   if([26,31,33,38,46,55,56,57,60].includes(s.id)&&frame===4)await page.locator('#world-host').screenshot({path:path.join(out,`scene-${String(s.id).padStart(2,'0')}.png`)});
  }
  const values=await page.locator('.result-record p').allTextContents();assert.deepEqual(values,s.after);
  const endBoxes=await page.locator('.actor').evaluateAll(nodes=>nodes.map(n=>({left:n.style.left,top:n.style.top,width:n.style.width})));
  assert.notDeepEqual(startBoxes,endBoxes,`Scene ${s.id}: motion must change arrangement`);
  assert.equal(await page.locator('#world-host').getAttribute('data-kind'),s.kind);
  assert.equal(await page.locator('#world-host').getAttribute('data-motion-cue'),artFor(s).cue);
  const bad=await page.locator('#world-host').evaluate(host=>{const canvas=host.querySelector('.world-canvas').getBoundingClientRect();return [...host.querySelectorAll('.actor')].flatMap(n=>{const r=n.getBoundingClientRect();return r.left<canvas.left-2||r.right>canvas.right+2||r.top<canvas.top-2||r.bottom>canvas.bottom+2?[{object:n.querySelector('b').textContent,left:r.left-canvas.left,top:r.top-canvas.top,width:r.width,height:r.height,canvasWidth:canvas.width,canvasHeight:canvas.height}]:[];});});
  if(bad.length)layoutFindings.push({id:s.id,bad});
  assert.equal(await page.locator('#journey-app').getAttribute('data-run-state'),'completed');
  const firstId=await page.locator('#result-panel').getAttribute('data-record-id');
  await page.locator('#run-variant').selectOption('issue');await page.locator('#trigger-run').click();await page.locator('#run-next').click();await page.locator('#run-next').click();
  assert.equal(await page.locator('#issue-description').innerText(),s.issue);assert.ok(await page.locator('#run-next').isDisabled());assert.ok(!(await page.locator('#result-panel').isVisible()));
  await page.locator('#resolve-example').click();await page.locator('#run-next').click();await page.locator('#run-next').click();
  assert.equal(await page.locator('#journey-app').getAttribute('data-run-state'),'completed');
  await page.locator('#run-variant').selectOption('duplicate');await completedRun();
  assert.equal(await page.locator('#result-panel').getAttribute('data-record-id'),firstId);assert.equal(await page.locator('#result-panel').getAttribute('data-unique-results'),'1');assert.equal(await page.locator('.result-record[data-pending="true"]').count(),1);
  sceneRuns.push({id:s.id,kind:s.kind,trigger:s.trigger,resultItems:values.length,frames:6,motionCue:artFor(s).cue,issueRecovery:true,duplicateReuse:true});
 }
 check('All 60 UI journeys complete six build and six runtime stages',sceneRuns.length===60);
 check('Every scene uses its own data and all expected result items');
 check('Every scene has a distinct illustrated operation and visible positional change');
 await fs.writeFile(path.join(out,'layout-findings.json'),JSON.stringify(layoutFindings,null,2));
 check('All final business objects stay inside their illustration',layoutFindings.length===0);
 stage='feedback and delivery variants';
 await page.locator('[data-feedback="noise"]').click();await page.locator('#apply-proposal').click();for(let i=1;i<6;i++)await page.locator('#run-next').click();
 check('Approved feedback changes the next visible output',await page.locator('.result-record small').count()===0&&await page.locator('.result-record').count()===3&&(await page.locator('#result-detail').innerText()).includes('全部保留'));
 check('Feedback replay advances the local example revision',await page.locator('#result-panel').getAttribute('data-record-id')==='example-60-2');
 for(const [source,trigger,id] of ['existing','connect','files'].flatMap(source=>['clock','chat','file'].map(trigger=>[source,trigger,trigger==='file'?55:26]))){
  await select(id);await choose('focus',1);await choose('detail',0);await choose('source',source);await page.locator('#probe-source').click();await page.locator('#confirm-source').click();await choose('trigger',trigger);await page.locator('#extra-note').fill('<img src=x onerror="window.injected=true">');await choose('delivery','explained');await finishBuild();await completedRun();
  check(`${source} source and ${trigger} trigger work as a normal setup path`,await page.locator('#trigger-card').getAttribute('data-trigger')===trigger&&(await page.locator('#run-brief').innerText()).includes(source==='files'?'选择我的工作资料':source==='connect'?'带我连接店铺或工具':'使用已有连接'));
  check(`${trigger} detailed output preserves before/after explanation`,await page.locator('.result-record small').count()===3);
 }
 check('Custom text is displayed as text, not executed',await page.evaluate(()=>window.injected===undefined&&document.querySelectorAll('#run-brief img,#result-detail img').length===0));
 check('No personal requirement text stored in browser storage',await page.evaluate(()=>localStorage.length===0));
 stage='mobile experience';
 for(const [name,width,height] of [['mobile',390,844],['narrow',320,740]]){
  await page.setViewportSize({width,height});await select(33);await page.locator('#load-example').click();await page.locator('#confirm-build').click();
  await page.locator('#journey-app').screenshot({path:path.join(out,`build-${name}.png`)});
  for(let i=1;i<6;i++)await page.locator('#build-next').click();await page.locator('#start-run-view').click();await completedRun();
  check(`${name} workflow has no horizontal page overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`${name} illustration uses readable stacked objects`,await page.locator('#world-host').getAttribute('data-compact')==='true');
  await page.locator('#world-host').screenshot({path:path.join(out,`runtime-${name}.png`)});
 }
 stage='motion controls';
 await page.setViewportSize({width:1440,height:1000});await page.locator('#motion-toggle').click();
 await select(26);await page.locator('#load-example').click();await page.locator('#confirm-build').click();await page.locator('#journey-app[data-build-frame="1"]').waitFor({timeout:5000});await page.locator('#build-toggle').click();
 const buildPaused=await page.locator('#journey-app').getAttribute('data-build-frame');await delay(1700);check('Build pause preserves the current step',await page.locator('#journey-app').getAttribute('data-build-frame')===buildPaused);
 for(let i=Number(buildPaused);i<5;i++)await page.locator('#build-next').click();await page.locator('#start-run-view').click();await page.locator('#trigger-run').click();
 await page.locator('#journey-app[data-run-frame="1"]').waitFor({timeout:5000});await page.locator('#play-toggle').click();const pausedFrame=await page.locator('#journey-app').getAttribute('data-run-frame');await delay(1900);
 check('Runtime pause stops progression',await page.locator('#journey-app').getAttribute('data-run-frame')===pausedFrame);
 await page.locator('#play-speed').selectOption('2');await page.locator('#play-toggle').click();await page.locator('#journey-app[data-run-frame="2"]').waitFor({timeout:4000});
 check('Speed selection and resume advance the same run');
 await select(38);await delay(1800);check('Switching scenes cancels previous playback',await page.locator('#journey-app').getAttribute('data-scene')==='38'&&await page.locator('#journey-app').getAttribute('data-phase')==='clarify'&&!(await page.locator('#result-panel').isVisible()));
 await page.locator('#motion-toggle').click();check('Page motion can be paused explicitly',await page.locator('#motion-toggle').getAttribute('aria-pressed')==='true');
 stage='links and assets';
 for(const name of ['../guide.html','../architecture.html','journey-handbook.md','journeys.json','journey-model.mjs','journey-visuals.mjs','journey-art.mjs','journey-world.css']){const response=await context.request.get(new URL(name,site).href);check(`Asset ${name} is served`,response.status()===200);}
 const direct=await context.newPage();await direct.goto(new URL('#scene-60',site).href,{waitUntil:'networkidle'});check('Direct links select the correct need',await direct.locator('#journey-app').getAttribute('data-scene')==='60');
 await direct.goto(new URL('#lab',site).href,{waitUntil:'networkidle'});await direct.waitForURL('**/architecture.html#lab');check('Older technical links still resolve');
 await direct.goto(new URL('#compose',site).href,{waitUntil:'networkidle'});await direct.waitForURL('**/guide.html#compose');check('Older plan-builder links still resolve');await direct.close();
 const noJS=await browser.newContext({javaScriptEnabled:false});const fallback=await noJS.newPage();await fallback.goto(site);check('All 60 ideas and readable handout links exist without scripts',await fallback.locator('.library-card').count()===60&&await fallback.locator('a[href="./journey-handbook.md"]').count()>0);await noJS.close();
 check('No browser runtime or console errors',errors.length===0);
 check('No third-party, model or merchant requests',requests.length===0);
 const result={result:'passed',scope:'Static guided-demo site only, not production merchant integration',url:site,checks:checks.length,details:checks,sceneJourneys:sceneRuns.length,sceneRuns,visualFamilies:new Set(data.scenes.map(s=>familyOf(s.kind))).size,distinctMotionCues:new Set(data.scenes.map(s=>artFor(s).cue)).size,browserErrors:errors,externalRequests:requests};
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,details:undefined,sceneRuns:undefined},null,2));
}catch(error){if(page){try{await page.screenshot({path:path.join(out,'failure.png')});}catch{}}const result={result:'failed',stage,passed:checks.length,details:checks,sceneRuns,layoutFindings,error:String(error),browserErrors};await fs.writeFile(path.join(out,'results.json'),JSON.stringify(result,null,2));console.error(JSON.stringify({result:'failed',stage,passed:checks.length,completedScenes:sceneRuns.length,error:String(error),browserErrors},null,2));process.exitCode=1;}finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
