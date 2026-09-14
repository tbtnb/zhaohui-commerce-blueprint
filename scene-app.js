import {createPlan, validSelection, readinessFor} from './scene-plan.mjs';
import {planMarkdown, planPrompt} from './scene-export.mjs';

// This page only filters research content and exports local planning documents.
// Preserve links shared before the scene-first homepage was introduced.
const previousSections = new Set(['reality','platforms','systems','workflows','architecture','onboarding','lab','observability','roadmap','guardrails','research','sources']);
function redirectPreviousLink() {
  const previousHash = window.location.hash.slice(1);
  if (previousSections.has(previousHash) || /^source-[A-Z]\d{2}$/.test(previousHash)) {
    window.location.replace(new URL(`architecture.html#${previousHash}`,window.location.href).href);
    return true;
  }
  return false;
}
redirectPreviousLink();
const byId = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const bundle = JSON.parse(byId('report-data').textContent);
const scenes = bundle.groups.flatMap(g => g.scenes);
const sceneMap = new Map(scenes.map(s => [s.id,s]));
const cards = all('.scene-card');
const groups = all('.scene-group');
const storageKey = 'zhaohui.scene-selection.v2';
let selected = new Set();
try { selected = new Set(validSelection(JSON.parse(localStorage.getItem(storageKey) || '[]'), scenes)); } catch { /* Storage can be unavailable or malformed. */ }
let category = 'all';
let toastTimer;
function toast(text) {
  clearTimeout(toastTimer);
  const element = byId('status-toast');
  element.textContent = text;
  element.hidden = false;
  toastTimer = setTimeout(() => { element.hidden = true; },3500);
}
function persistSelection() {
  try {
    if (selected.size) localStorage.setItem(storageKey,JSON.stringify([...selected].sort((a,b)=>a-b)));
    else localStorage.removeItem(storageKey);
  } catch { toast('当前浏览器无法保留选择；仍可在本页组合和导出。'); }
}
function options() {
  return {goal:byId('plan-goal').value,scope:byId('plan-scope').value,extra:byId('plan-extra').value,inputMode:byId('plan-input').value,cadence:byId('plan-cadence').value};
}
function currentPlan() { return createPlan(bundle,[...selected],options()); }
function newElement(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function updateDetailsButton() {
  const visible = cards.filter(c => !c.hidden);
  const expanded = visible.length > 0 && visible.every(c => c.querySelector('details').open);
  byId('toggle-details').setAttribute('aria-pressed',String(expanded));
  byId('toggle-details').textContent = expanded ? '收起当前结果' : '展开当前结果';
  byId('toggle-details').disabled = visible.length === 0;
}
function filterScenes() {
  const query = byId('scene-search').value.trim().toLocaleLowerCase();
  const platform = byId('platform-filter').value;
  const mode = byId('mode-filter').value;
  const onlySelected = byId('selected-only').checked;
  let count = 0;
  cards.forEach(card => {
    const s = sceneMap.get(Number(card.dataset.sceneId));
    const searchable = [String(s.id).padStart(2,'0'),s.title,s.ask,s.moment,s.inputs,s.watch,s.act,s.deliver,s.learn,s.human,s.metric,...s.platforms].join(' ').toLocaleLowerCase();
    const matches = (category === 'all' || card.dataset.category === category) && (platform === 'all' || s.platforms.includes(platform)) && (mode === 'all' || s.mode === mode) && (!onlySelected || selected.has(s.id)) && (!query || searchable.includes(query));
    card.hidden = !matches;
    if (matches) count++;
  });
  groups.forEach(group => { group.hidden = ![...group.querySelectorAll('.scene-card')].some(c => !c.hidden); });
  all('.category-filter').forEach(button => {
    const active = button.dataset.category === category;
    button.setAttribute('aria-pressed',String(active));
    button.classList.toggle('active',active);
  });
  byId('scene-count').textContent = `显示 ${count} / ${scenes.length} 个场景`;
  byId('scene-empty').hidden = count !== 0;
  updateDetailsButton();
}
function resetFilters() {
  category = 'all';
  byId('scene-search').value = '';
  byId('platform-filter').value = 'all';
  byId('mode-filter').value = 'all';
  byId('selected-only').checked = false;
  filterScenes();
}
all('.category-filter').forEach(button => button.addEventListener('click', () => { category = button.dataset.category; filterScenes(); }));
byId('scene-search').addEventListener('input',filterScenes);
['platform-filter','mode-filter','selected-only'].forEach(id => byId(id).addEventListener('change',filterScenes));
['clear-filters','empty-reset'].forEach(id => byId(id).addEventListener('click',resetFilters));
byId('toggle-details').addEventListener('click', () => {
  const open = byId('toggle-details').getAttribute('aria-pressed') !== 'true';
  cards.filter(c => !c.hidden).forEach(c => { c.querySelector('details').open = open; });
  updateDetailsButton();
});
cards.forEach(card => card.querySelector('details').addEventListener('toggle',updateDetailsButton));

function updatePlan() {
  const ids = [...selected].sort((a,b)=>a-b);
  ['header-count','plan-count','dock-count'].forEach(id => { byId(id).textContent = String(ids.length); });
  byId('selection-dock').hidden = ids.length === 0;
  byId('plan-empty').hidden = ids.length !== 0;
  ['export-md','export-json','copy-brief'].forEach(id => { byId(id).disabled = ids.length === 0; });
  const list = byId('chosen-scenes');
  list.replaceChildren();
  ids.forEach(id => {
    const s = sceneMap.get(id);
    const row = newElement('div',undefined,'chosen-row');
    const number = newElement('span',String(id).padStart(2,'0'),'number');
    const body = newElement('div');
    const link = newElement('a',s.title);
    link.href = `#scene-${String(id).padStart(2,'0')}`;
    body.append(link,newElement('p',readinessFor(s,byId('plan-input').value).label));
    const remove = newElement('button','×','remove-scene');
    remove.type = 'button';
    remove.dataset.remove = String(id);
    remove.setAttribute('aria-label',`移除场景${String(id).padStart(2,'0')}：${s.title}`);
    row.append(number,body,remove);
    list.append(row);
  });
  cards.forEach(card => {
    const id = Number(card.dataset.sceneId);
    const active = selected.has(id);
    card.classList.toggle('selected',active);
    const button = card.querySelector('[data-add]');
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',`${active ? '移除' : '加入'}场景${String(id).padStart(2,'0')}：${sceneMap.get(id).title}`);
    button.textContent = active ? '已加入 · 点击移除 ✓' : '加入我的方案 ＋';
  });
  const readCount = ids.filter(id => sceneMap.get(id).mode === 'read').length;
  const mode = byId('plan-input').value;
  let heading = '尚未选定场景';
  let detail = '选择后会显示资料准备和能力核验提醒。';
  if (ids.length && mode === 'none') {
    heading = '先做资料与能力盘点，不是开始运行';
    detail = `选中了${ids.length}个场景，其中${readCount}个涉及新鲜读取。请先确认店铺、资料、用途、数据时效和读取范围；目前仅能导出需求草案。`;
  } else if (ids.length && mode === 'files') {
    heading = readCount ? `${readCount}个时效型场景仍需补读取能力` : '可先准备一份文件样本试搭';
    detail = readCount ? '文件版可整理截至导出时的清单，但不能保证当前会话、库存或履约状态。其余文件场景也要核验身份与数据时效，并完成业务试跑。' : '从一到三个场景开始，检查真实样本的来源、身份、覆盖和产物。能够提供文件不等于这些场景已经安装或验收。';
  } else if (ids.length) {
    heading = '已有连接，也要逐场景核验';
    detail = '需要确认目标店铺、对象、字段、时效、授权和结果回执。自述有连接不会让本页面认定已接通；这里只生成评审方案。';
  }
  const readiness = byId('readiness');
  readiness.replaceChildren(newElement('strong',heading),newElement('p',detail));
  filterScenes();
}
function toggleSelection(id) {
  if (!sceneMap.has(id)) return;
  const removed = selected.has(id);
  if (removed) selected.delete(id); else selected.add(id);
  persistSelection(); updatePlan();
  toast(removed ? `已从方案移除场景${String(id).padStart(2,'0')}` : `已加入场景${String(id).padStart(2,'0')}；可继续组合，或去“我的方案”导出。`);
}
all('[data-add]').forEach(button => button.addEventListener('click', () => toggleSelection(Number(button.dataset.add))));
byId('chosen-scenes').addEventListener('click', event => {
  const button = event.target.closest('[data-remove]');
  if (!button) return;
  toggleSelection(Number(button.dataset.remove));
  (byId('chosen-scenes').querySelector('[data-remove]') || byId('clear-plan')).focus({preventScroll:true});
});
all('[data-preset]').forEach(button => button.addEventListener('click', () => {
  const preset = bundle.presets.find(p => p.id === button.dataset.preset);
  if (!preset) return;
  const before = selected.size;
  preset.ids.forEach(id => selected.add(id));
  if (!byId('plan-goal').value.trim()) byId('plan-goal').value = preset.goal;
  persistSelection(); updatePlan();
  toast(`已加入“${preset.name}”，新增${selected.size-before}个场景；保留原选择，没有执行任何任务。`);
}));
byId('clear-plan').addEventListener('click', () => {
  selected.clear(); persistSelection(); updatePlan();
  byId('copy-fallback').hidden = true;
  byId('copy-text').value = '';
  toast('场景选择已清空。经营目标文字保留在当前页面，不会上传。');
});
byId('plan-input').addEventListener('change',updatePlan);

function downloadText(text, name, mime) {
  const url = URL.createObjectURL(new Blob([text],{type:mime+';charset=utf-8'}));
  const link = newElement('a');
  link.href = url; link.download = name; document.body.append(link);
  link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url),2000);
}
byId('export-md').addEventListener('click', () => {
  if (!selected.size) return;
  downloadText(planMarkdown(currentPlan()),'zhaohui-commerce-plan.md','text/markdown');
  toast('需求说明已生成。文件不是运行配置，不会触发店铺操作。');
});
byId('export-json').addEventListener('click', () => {
  if (!selected.size) return;
  downloadText(JSON.stringify(currentPlan(),null,2)+'\n','zhaohui-commerce-plan.json','application/json');
  toast('结构化草案已生成，所有授权仍标为未验证。');
});
byId('copy-brief').addEventListener('click', async () => {
  if (!selected.size) return;
  const text = planPrompt(currentPlan());
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    toast('已复制需求说明；请先让昭回盘点能力和试跑，不要直接开放业务写入。');
  } catch {
    byId('copy-text').value = text;
    const fallback = byId('copy-fallback');
    fallback.hidden = false; fallback.open = true;
    byId('copy-text').focus(); byId('copy-text').select();
    toast('剪贴板不可用，已展开可手动复制的说明。');
  }
});

const dayTabs = all('.day-tabs [role="tab"]');
function setDay(index, focus=false) {
  dayTabs.forEach((tab,i) => {
    const active = i === index;
    tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1;
    byId(tab.getAttribute('aria-controls')).hidden = !active;
  });
  if (focus) dayTabs[index].focus();
}
dayTabs.forEach((tab,index) => {
  tab.addEventListener('click',() => setDay(index));
  tab.addEventListener('keydown',event => {
    let next;
    if (event.key === 'ArrowRight') next = (index+1)%dayTabs.length;
    if (event.key === 'ArrowLeft') next = (index-1+dayTabs.length)%dayTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = dayTabs.length-1;
    if (next !== undefined) { event.preventDefault(); setDay(next,true); }
  });
});
setDay(0);
const feedback = {
  useful:['保留跟进 · 示例候选','继续维护原问题，突出真正的新进展。','保存“有用”反馈和处理结果。若数据或交期变化，再进入下一次摘要；不因为被采纳就提高通知频率。正式规则未改变。'],
  repeat:['减少重复 · 待验证候选','合并无变化提醒，但保留到期与状态变化。','提出按问题编号合并的候选，用旧事件检查是否漏掉紧急变化。商家批准后才用于后续正式流程；原待办没有关闭。'],
  wrong:['纠正事实 · 等待核实','先隔离错误依据，不在错数据上优化话术。','核对商品身份、资料版本和来源；生成修复清单。经人工确认后把该问题加入回放样本，再考虑候选规则，不自动覆盖正式事实。']
};
all('[data-feedback]').forEach(button => button.addEventListener('click', () => {
  all('[data-feedback]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
  const [state,title,body] = feedback[button.dataset.feedback];
  byId('feedback-state').textContent = state;
  byId('feedback-title').textContent = title;
  byId('feedback-body').textContent = body;
}));

const sourceItems = all('.source-item');
function filterEvidence() {
  const query = byId('evidence-search').value.trim().toLocaleLowerCase();
  const type = byId('evidence-filter').value;
  let count = 0;
  sourceItems.forEach(item => {
    item.hidden = !((type === 'all' || item.dataset.evidenceType === type) && item.textContent.toLocaleLowerCase().includes(query));
    if (!item.hidden) count++;
  });
  byId('evidence-count').textContent = `显示 ${count} / ${sourceItems.length} 条依据`;
  byId('evidence-empty').hidden = count !== 0;
}
byId('evidence-search').addEventListener('input',filterEvidence);
byId('evidence-filter').addEventListener('change',filterEvidence);
function revealTarget(hash) {
  if (/^#scene-\d{2}$/.test(hash)) {
    const target = byId(hash.slice(1));
    if (!target) return null;
    if (target.closest('.scene-card').hidden) resetFilters();
    target.open = true;
    return target;
  }
  if (/^#evidence-[RE]\d{2}$/.test(hash)) {
    const target = byId(hash.slice(1));
    if (!target) return null;
    byId('evidence-register').open = true;
    byId('evidence-search').value = '';
    byId('evidence-filter').value = 'all';
    filterEvidence();
    return target;
  }
  return null;
}
document.addEventListener('click',event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = revealTarget(link.hash);
  if (!target) return;
  event.preventDefault();
  if (window.location.hash !== link.hash) history.pushState(null,'',link.hash);
  target.scrollIntoView({block:'start',behavior:'auto'});
});
function revealCurrentHash() {
  if (redirectPreviousLink()) return;
  const target = revealTarget(window.location.hash);
  if (target) requestAnimationFrame(() => target.scrollIntoView({block:'start',behavior:'auto'}));
}
window.addEventListener('hashchange',revealCurrentHash);
window.addEventListener('popstate',revealCurrentHash);
let printState = [];
window.addEventListener('beforeprint', () => {
  printState = [...cards,...groups,...sourceItems,...all('.scene-card details'),byId('evidence-register')].map(element=>({element,hidden:element.hidden,open:element.open}));
  printState.forEach(({element})=>{element.hidden=false;if(element.tagName==='DETAILS') element.open=true;});
});
window.addEventListener('afterprint', () => {
  printState.forEach(({element,hidden,open})=>{element.hidden=hidden;if(element.tagName==='DETAILS') element.open=open;});
  printState=[]; updateDetailsButton();
});
updatePlan(); filterEvidence(); revealCurrentHash();
