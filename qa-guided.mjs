const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');import assert from 'node:assert/strict';import fs from 'node:fs';
fs.mkdirSync('qa-output',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));const base=process.env.TARGET||'http://127.0.0.1:8765/';await page.goto(base);await page.locator('#welcome [data-pick="31"]').waitFor();
await page.screenshot({path:'qa-output/guided-home.png'});
const go=async id=>{await page.evaluate(id=>{document.querySelector('#browse').click();document.querySelector(`#ideas [data-pick="${id}"]`).click();},id);};
const click=async(step,selector)=>{await page.locator(`#step-${step} ${selector}`).first().evaluate(n=>n.click());};
async function complete(id,route='existing',trigger='clock'){
await go(id);await click(1,'.choice');await click(2,'.choice');await click(3,`[data-value="${route}"]`);await click(4,'.primary');assert.ok(await page.locator('#step-4 .sample-list').isVisible());await click(4,'.primary');await click(5,`[data-value="${trigger}"]`);await click(6,'.choice');for(let i=7;i<=14;i++)await click(i,'.primary');assert.equal(await page.locator('.guided-step').count(),15);assert.ok(await page.locator('#step-15').isVisible());assert.ok(await page.locator('#step-14 .result-cards').innerText());
const all=await page.locator('.guided-step').evaluateAll(nodes=>nodes.map(n=>({h:n.getBoundingClientRect().height,buttons:n.querySelectorAll('.primary').length})));assert.ok(all.every(n=>n.h>=innerHeightStub-64));
}
const innerHeightStub=1000;
for(let id=1;id<=60;id++)await complete(id);
for(const route of ['existing','connect','files'])for(const trigger of ['clock','chat','file'])await complete(31,route,trigger);
await click(15,'.secondary');assert.ok((await page.locator('#step-15').innerText()).includes('不再多建'));
const download=page.waitForEvent('download');await click(15,'.primary');const d=await download;assert.ok(fs.readFileSync(await d.path(),'utf8').includes('搭建需求说明'));
await click(15,'.text-link');assert.equal(await page.locator('.guided-step').count(),11);await click(11,'.primary');await click(12,'.text-link');assert.ok(await page.locator('#step-12 .primary').isDisabled());await click(12,'.text-link');assert.ok(await page.locator('#step-12 .primary').isEnabled());
await page.setViewportSize({width:390,height:844});await go(31);await page.screenshot({path:'qa-output/guided-mobile-question.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await click(1,'.choice');await click(2,'.choice');await click(3,'.choice');await click(4,'.primary');await click(4,'.primary');await click(5,'[data-value="chat"]');await click(6,'.choice');for(let i=7;i<=11;i++)await click(i,'.primary');await page.screenshot({path:'qa-output/guided-mobile-run.png'});await click(12,'.primary');await click(13,'.primary');await page.screenshot({path:'qa-output/guided-mobile-result.png'});
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS 60 complete 15-screen journeys; 9 source/trigger combinations; download; replay; issue recovery; mobile');await browser.close();
