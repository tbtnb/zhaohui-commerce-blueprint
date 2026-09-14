const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:"chrome"});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
fs.mkdirSync('qa-output',{recursive:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.TARGET||'http://127.0.0.1:8765/';
await page.goto(base);await page.screenshot({path:'qa-output/hero.png'});
const choose=async id=>{await page.locator(`.library-card [data-pick="${id}"]`).click();};
const ready=async()=>{await page.locator('#load-example').click();for(let j=0;j<5;j++)await page.locator('#build-next').click();await page.locator('#start-run-view').click();};
const finish=async()=>{await page.locator('#trigger-run').click();for(let j=0;j<5;j++)await page.locator('#run-next').click();assert.equal(await page.locator('#frame-number').textContent(),'6 / 6');};
const signatures=[];
for(let id=1;id<=60;id++){
 await choose(id);await ready();await finish();
 signatures.push(await page.locator('#world-host').getAttribute('data-motion-cue'));
 assert.ok(await page.locator('#result-records').innerText());
 assert.equal(await page.locator('#result-panel').evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.locator('#run-variant').selectOption('issue');await page.locator('#trigger-run').click();await page.locator('#run-next').click();await page.locator('#run-next').click();assert.ok(await page.locator('#issue-resolution').isVisible());assert.ok(await page.locator('#run-next').isDisabled());await page.locator('#resolve-example').click();await page.locator('#run-next').click();await page.locator('#run-next').click();
 await page.locator('#run-variant').selectOption('duplicate');await finish();assert.equal(await page.locator('#result-title').innerText(),'沿用上一次结果');
 if([11,26,31,33,38,49,58].includes(id)){await page.locator('#world-host').screenshot({path:`qa-output/scene-${id}.png`});}
}
assert.equal(new Set(signatures).size,60);
for(const route of ['existing','connect','files'])for(const trigger of ['clock','chat','file']){
 await choose(31);await page.locator('[data-answer="0"]').click();await page.locator('[data-answer="1"]').click();await page.locator(`[data-answer="${route}"]`).click();await page.locator('[data-answer="yes"]').click();await page.locator('#check-time').fill('15:45');await page.locator(`[data-answer="${trigger}"]`).click();await page.locator('#extra-note').fill('<script>示例要求</script>');await page.locator('[data-answer="brief"]').click();for(let i=0;i<5;i++)await page.locator('#build-next').click();await page.locator('#start-run-view').click();await finish();
 assert.equal(await page.locator('#result-records .result-record').count(),2);
 const downloadPromise=page.waitForEvent('download');await page.locator('#save-plan').click();const download=await downloadPromise;const content=fs.readFileSync(await download.path(),'utf8');assert.ok(content.includes('15:45')=== (trigger==='clock'));assert.ok(content.includes('<script>示例要求</script>'));
}
await page.setViewportSize({width:390,height:844});await choose(33);await ready();await finish();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#journey-app').screenshot({path:'qa-output/mobile.png'});
await page.locator('#idea-search').fill('不存在的场景xyz');assert.ok(await page.locator('#search-empty').isVisible());await page.locator('#reset-search').click();assert.equal(await page.locator('.library-card:visible').count(),60);
assert.deepEqual(errors,[]);
fs.writeFileSync('qa-output/verification.json',JSON.stringify({target:base,scenes:60,uniqueMotionCues:new Set(signatures).size,normal:60,issueRecovery:60,duplicate:60,answerRoutes:9,mobileWidth:390,errors},null,2));console.log('PASS: 60 scenes normal/issue/duplicate; 9 answer routes; export; mobile; search');await browser.close();
