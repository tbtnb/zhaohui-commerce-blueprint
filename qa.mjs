/* Browser checks for the report only, never merchant integration tests. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.resolve(root, process.env.QA_OUTPUT || 'qa-output');
await fs.mkdir(output, {recursive: true});
let server;
let site = process.env.SITE_URL;
if (!site) {
  const types = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8'};
  server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);
      const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
      const data = await fs.readFile(target);
      response.writeHead(200, {'Content-Type': types[path.extname(target)] || 'application/octet-stream'});
      response.end(data);
    } catch { response.writeHead(404).end('Not found'); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  site = `http://127.0.0.1:${server.address().port}/architecture.html`;
}
let browser;
const checks = [];
const failures = [];
function ok(name, condition = true) {
  assert.ok(condition, name);
  checks.push(name);
}
try {
  try { browser = await chromium.launch({headless: true}); }
  catch { browser = await chromium.launch({headless: true, channel: 'chrome'}); }
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, reducedMotion: 'reduce'});
  const page = await context.newPage();
  const pageErrors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(site).origin) externalRequests.push(request.url());
  });
  const response = await page.goto(site, {waitUntil: 'networkidle', timeout: 45000});
  ok('HTTP 200', response.status() === 200);
  ok('Correct report title', (await page.title()).includes('昭回 · 电商自治蓝图'));
  ok('12 chapters', await page.locator('section.chapter').count() === 12);
  ok('8 platforms', await page.locator('.platform').count() === 8);
  ok('10 workflows', await page.locator('.flow-panel').count() === 10);
  ok('33 evidence entries', await page.locator('.source').count() === 33);
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) => links.filter((link) => !document.getElementById(link.hash.slice(1))).map((link) => link.hash));
  ok('All internal anchors resolve', missing.length === 0);
  ok('No unexpanded placeholders', !(await page.content()).includes('{{'));

  for (const [name, width, height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['narrow',320,740]]) {
    await page.setViewportSize({width, height});
    await page.evaluate(() => window.scrollTo(0,0));
    const dimensions = await page.evaluate(() => ({scroll: document.documentElement.scrollWidth, width: window.innerWidth}));
    ok(`${name}: no document horizontal overflow`, dimensions.scroll <= dimensions.width);
    await page.screenshot({path: path.join(output, `${name}.png`)});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('.filter[data-region="domestic"]').click();
  ok('Domestic filter shows 5', await page.locator('.platform:visible').count() === 5);
  await page.locator('.filter[data-region="global"]').click();
  ok('Global filter shows 3', await page.locator('.platform:visible').count() === 3);
  await page.locator('.filter[data-region="all"]').click();
  await page.locator('#expand-platforms').click();
  ok('Expand all platforms', await page.locator('.platform[open]').count() === 8);
  await page.locator('#expand-platforms').click();
  ok('Collapse all platforms', await page.locator('.platform[open]').count() === 0);
  await page.locator('.platform summary').first().click();
  ok('Individual disclosure works', await page.locator('.platform[open]').count() === 1);
  await page.locator('.platform summary').first().click();

  for (const tab of await page.locator('[role="tab"]').all()) {
    await tab.click();
    const target = await tab.getAttribute('aria-controls');
    ok(`Workflow ${target}`, await page.locator(`#${target}`).isVisible() && await page.locator('.flow-panel:visible').count() === 1);
  }
  await page.locator('#tab-selection').focus();
  await page.keyboard.press('ArrowRight');
  ok('Keyboard tab navigation', await page.locator('#tab-catalog').getAttribute('aria-selected') === 'true');
  await page.locator('#tab-service').click();
  await page.locator('.workflow-layout').screenshot({path:path.join(output,'workflows.png')});

  await page.locator('#source-search').fill('Canva');
  ok('Evidence search filters results', await page.locator('.source:visible').count() >= 3 && await page.locator('.source:visible').count() < 33);
  await page.locator('#source-search').fill('no-match-unavailable-000');
  ok('Empty search state', await page.locator('#source-empty').isVisible());
  await page.locator('#source-search').fill('');
  await page.locator('#source-type').selectOption('code');
  ok('Code evidence filter: 8', await page.locator('.source:visible').count() === 8);
  await page.locator('a.ref[href="#source-S01"]:visible').first().click();
  ok('Citation clears incompatible filter', await page.locator('#source-S01').isVisible() && await page.locator('#source-type').inputValue() === 'all');

  for (const [incident,status,effects] of [['duplicate','verified','1'],['mismatch','waiting_data','0'],['timeout','unknown','unknown'],['offline','waiting_auth','0']]) {
    await page.locator('#incident').selectOption(incident);
    ok(`${incident}: changing scenario resets`, await page.locator('#sim-status').innerText() === 'idle');
    await page.locator('#run-simulation').click();
    ok(`${incident}: expected state`, await page.locator('#sim-status').innerText() === status);
    ok(`${incident}: honest effect count`, await page.locator('#sim-effects').innerText() === effects);
    if (incident === 'duplicate') {
      ok('Duplicate: 2 deliveries and 1 task', await page.locator('#sim-deliveries').innerText() === '2' && await page.locator('#sim-tasks').innerText() === '1');
      await page.locator('#run-simulation').dblclick();
      ok('Re-running demonstration does not accumulate', await page.locator('#sim-effects').innerText() === '1');
    }
    if (incident === 'timeout') {
      ok('Unknown permits only reconciliation', await page.locator('#reconcile-simulation').isEnabled());
      await page.locator('.lab').screenshot({path:path.join(output,'failure-lab.png')});
      await page.locator('#reconcile-simulation').click();
      ok('Read-back settles without resending', await page.locator('#sim-status').innerText() === 'verified' && await page.locator('#sim-effects').innerText() === '1');
      ok('Repeat reconciliation disabled', await page.locator('#reconcile-simulation').isDisabled());
    }
  }
  await page.locator('#reset-simulation').click();
  ok('Reset disables reconciliation', await page.locator('#sim-status').innerText() === 'idle' && await page.locator('#reconcile-simulation').isDisabled());
  await page.setViewportSize({width:390,height:844});
  await page.locator('#mobile-chapter').selectOption('roadmap');
  ok('Mobile chapter navigation', new URL(page.url()).hash === '#roadmap');
  ok('Mobile tab orientation', await page.locator('[role="tablist"]').getAttribute('aria-orientation') === 'horizontal');
  for (const file of ['capability-example.json','research.md','styles.css','app.js']) {
    const result = await context.request.get(new URL(file,site).href);
    ok(`Published asset ${file}`, result.status() === 200);
    if (file.endsWith('.json')) ok('Contract marked as proposal', (await result.json()).status === 'proposed_not_implemented');
    if (file.endsWith('.md')) ok('Text report includes final evidence', (await result.text()).includes('E08'));
  }
  ok('No browser console or runtime errors', pageErrors.length === 0);
  ok('No third-party requests or merchant API calls', externalRequests.length === 0);
  const noJs = await browser.newContext({javaScriptEnabled:false});
  const fallback = await noJs.newPage();
  await fallback.goto(site);
  ok('No-JavaScript workflows remain readable', await fallback.locator('.flow-panel:visible').count() === 10);
  await noJs.close();
  const report = {result:'passed',scope:'Static explanatory report only; not merchant integration validation',url:site,checks:checks.length,details:checks,browserErrors:pageErrors,externalRequests};
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch (error) {
  failures.push(String(error));
  console.error(JSON.stringify({result:'failed',passed:checks,failures},null,2));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
