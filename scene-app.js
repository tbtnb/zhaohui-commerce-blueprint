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
  } catch { toast('当前浏览器不能记住选择，但仍可在这次打开的页面里组合和保存方案。'); }
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
  let heading = '还没有选择场景';
  let detail = '选择后会说明开始前需要确认哪些资料。';
  if (ids.length && mode === 'none') {
    heading = '先确认资料，暂不安排运行';
    detail = `已选 ${ids.length} 个场景，其中 ${readCount} 个需要最新店铺资料。先确认允许使用的资料和更新时间，现在只保存需求说明。`;
  } else if (ids.length && mode === 'files') {
    heading = readCount ? `有 ${readCount} 个场景需要最新店铺资料` : '可以先用一份文件尝试';
    detail = readCount ? '文件能说明导出时的情况，不能保证现在的聊天、库存或发货状态。其它场景也要确认资料属于哪家店、哪件商品，再尝试整理结果。' : '可以先选一到三个场景，提供真实资料，并检查清单或草稿是否正确。能提供文件，不代表相应功能已经完成测试。';
  } else if (ids.length) {
    heading = '先检查能否读取这家店的最新资料';
    detail = '需要实际确认店铺是否允许、哪些资料能读取，以及是否已经更新。本页面不会因为选择了已有读取方式，就认定店铺已接通。';
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
  toast(removed ? `已从方案移除场景${String(id).padStart(2,'0')}` : `已加入场景 ${String(id).padStart(2,'0')}。可以继续选择，或到我的方案保存说明。`);
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
  toast(`已加入这套组合，新增 ${selected.size-before} 个场景。原选择保留，没有执行任务。`);
}));
byId('clear-plan').addEventListener('click', () => {
  selected.clear(); persistSelection(); updatePlan();
  byId('copy-fallback').hidden = true;
  byId('copy-text').value = '';
  toast('选择已清空，填写的需求暂时保留在本页，不会上传。');
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
  toast('文字方案已生成，不会因此启动任务或操作店铺。');
});
byId('export-json').addEventListener('click', () => {
  if (!selected.size) return;
  downloadText(JSON.stringify(currentPlan(),null,2)+'\n','zhaohui-commerce-plan.json','application/json');
  toast('方案数据已保存，供开发者参考。店铺权限仍需另外确认。');
});
byId('copy-brief').addEventListener('click', async () => {
  if (!selected.size) return;
  const text = planPrompt(currentPlan());
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);
    toast('说明已复制。请先让昭回确认资料和权限，再尝试处理一次。');
  } catch {
    byId('copy-text').value = text;
    const fallback = byId('copy-fallback');
    fallback.hidden = false; fallback.open = true;
    byId('copy-text').focus(); byId('copy-text').select();
    toast('浏览器暂时不能自动复制，下面可以手动选择文字复制。');
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
  useful:['继续跟进的建议','保留原问题，有进展再更新。','记录这条提醒有用，以及你怎样处理。资料或交期变化后再更新进展，不因此增加提醒次数。这次演示不会改变真实规则。'],
  repeat:['减少重复提醒的建议','合并没有变化的提醒，保留到期提示。','建议把同一问题的重复提醒合并，先用以前的记录检查是否会漏掉急事。你确认后再修改正式安排，原待办不会被关闭。'],
  wrong:['先核对资料','确认错误来源，再修改答复。','先核对商品、资料日期和来源，整理需要修正的地方。你确认以后，再用这个问题检查后续回复，不自动修改正式资料。']
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
  byId('evidence-count').textContent = `显示 ${count} / ${sourceItems.length} 条资料`;
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
