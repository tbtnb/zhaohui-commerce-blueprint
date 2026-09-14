/* All interactions are local presentation logic. No accounts or external APIs. */
'use strict';
(() => {
  const all = (selector) => [...document.querySelectorAll(selector)];
  const byId = (id) => document.getElementById(id);
  const platforms = all('.platform');
  const filters = all('.filter[data-region]');
  filters.forEach((button) => button.addEventListener('click', () => {
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    platforms.forEach((p) => { p.hidden = button.dataset.region !== 'all' && p.dataset.region !== button.dataset.region; });
  }));
  byId('expand-platforms').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const open = button.getAttribute('aria-pressed') !== 'true';
    platforms.forEach((p) => { p.open = open; });
    button.setAttribute('aria-pressed', String(open));
    button.textContent = open ? '收起全部详情' : '展开全部详情';
  });

  const tabs = all('[role="tab"]');
  const panels = all('.flow-panel');
  function selectTab(tab, focus = false) {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    panels.forEach((p) => { p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    if (focus) tab.focus({preventScroll: true});
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      const offsets = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1};
      let next;
      if (event.key in offsets) next = (index + offsets[event.key] + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next], true);
        tabs[next].scrollIntoView({block: 'nearest', inline: 'nearest'});
      }
    });
  });
  selectTab(tabs[0]);
  const narrow = window.matchMedia('(max-width:580px)');
  function orientation() {
    document.querySelector('[role="tablist"]').setAttribute('aria-orientation', narrow.matches ? 'horizontal' : 'vertical');
  }
  narrow.addEventListener('change', orientation);
  orientation();

  const sources = all('.source');
  const sourceSearch = byId('source-search');
  const sourceType = byId('source-type');
  function filterSources() {
    const query = sourceSearch.value.trim().toLocaleLowerCase();
    let count = 0;
    sources.forEach((source) => {
      const matched = (sourceType.value === 'all' || source.dataset.type === sourceType.value) && source.textContent.toLocaleLowerCase().includes(query);
      source.hidden = !matched;
      if (matched) count++;
    });
    byId('source-count').textContent = `${count} / ${sources.length} 条证据`;
    byId('source-empty').hidden = count !== 0;
  }
  sourceSearch.addEventListener('input', filterSources);
  sourceType.addEventListener('change', filterSources);
  function revealSource(hash) {
    if (!hash.startsWith('#source-')) return;
    sourceSearch.value = '';
    sourceType.value = 'all';
    filterSources();
  }
  all('a.ref').forEach((link) => link.addEventListener('click', () => revealSource(link.hash)));
  window.addEventListener('hashchange', () => revealSource(window.location.hash));
  revealSource(window.location.hash);

  const chapters = all('section.chapter');
  const tocLinks = all('.toc nav a');
  const mobile = byId('mobile-chapter');
  mobile.addEventListener('change', () => {
    window.location.hash = mobile.value;
  });
  let scheduled = false;
  function updateReading() {
    scheduled = false;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    byId('reading-progress').style.width = `${total > 0 ? Math.min(100, window.scrollY / total * 100) : 0}%`;
    let current = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= 180) current = chapter;
    }
    tocLinks.forEach((a) => {
      const active = a.hash === `#${current.id}`;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (document.activeElement !== mobile) mobile.value = current.id;
  }
  function onScroll() {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateReading); }
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll, {passive: true});
  updateReading();

  // A synthetic, in-memory state machine: this is not production persistence.
  const incident = byId('incident');
  const log = byId('simulation-log');
  const reconcile = byId('reconcile-simulation');
  let simulated = {deliveries: 0, tasks: 0, effects: 0, blocked: 0, status: 'idle'};
  function line(label, text, warning = false) {
    const row = document.createElement('div');
    row.className = `log-line${warning ? ' warning' : ''}`;
    const badge = document.createElement('span');
    badge.textContent = label;
    row.append(badge, document.createTextNode(text));
    log.append(row);
  }
  function renderSimulation(verdict) {
    Object.entries(simulated).forEach(([key, value]) => { byId(`sim-${key}`).textContent = String(value); });
    byId('sim-verdict').textContent = verdict;
    reconcile.disabled = simulated.status !== 'unknown';
  }
  function reset() {
    simulated = {deliveries: 0, tasks: 0, effects: 0, blocked: 0, status: 'idle'};
    log.replaceChildren();
    line('READY', '请选择故障并运行演示。所有输入均为合成样本。');
    renderSimulation('不把未知当成功，不把失败当成重试许可。');
  }
  function run() {
    reset();
    log.replaceChildren();
    const inbox = new Set();
    const businessTasks = new Map();
    if (incident.value === 'duplicate') {
      for (const eventId of ['sample-event-A', 'sample-event-A']) {
        simulated.deliveries++;
        if (inbox.has(eventId)) {
          simulated.blocked++;
          line('DEDUP', '同一交付身份已经入库，忽略重复，不创建第二个任务。', true);
          continue;
        }
        inbox.add(eventId);
        businessTasks.set('sample-workitem-A', 'ready');
        line('INBOX', '模拟事件落库并应答，创建唯一的内部工单意图。');
      }
      simulated.tasks = businessTasks.size;
      line('POLICY', '示例预设：该内部工单动作已授权，幂等键与对象租约一致。');
      line('VERIFY', '模拟读回确认仅创建一个工单；没有调用实际系统。');
      simulated.effects = 1;
      simulated.status = 'verified';
      renderSimulation('两次交付，一个任务，一个已核验的模拟工单。传输去重与业务幂等需要同时存在。');
    } else if (incident.value === 'mismatch') {
      simulated = {deliveries: 1, tasks: 1, effects: 0, blocked: 1, status: 'waiting_data'};
      line('EVENT', '合成咨询指向商品 A，读取结果却关联商品 B。');
      line('IDENTITY', '平台对象 ID / 已确认映射不一致，禁止借用相似商品事实。', true);
      line('REPAIR', '建立唯一数据修复任务，附来源与缺失字段。');
      line('HOLD', '不回答未经确认的价格、库存和规格；需要商家确认的歧义单独升级。', true);
      renderSimulation('安全完成不是“强行回答”。保留待办，修复身份后重验仍有效的咨询。');
    } else if (incident.value === 'timeout') {
      simulated = {deliveries: 1, tasks: 1, effects: 'unknown', blocked: 1, status: 'unknown'};
      line('POLICY', '示例预设：一条草稿已获批准，模拟发起一次发送。');
      line('TIMEOUT', '响应超时。无法由客户端确认消息有没有送达。', true);
      line('FREEZE', '冻结该业务意图的重试；不能把超时当失败。', true);
      line('NEXT', '点击“核验外部结果”读取本地预设的模拟平台记录。');
      renderSimulation('外部结果未知，动作数也必须保持未知。按钮只查询合成样本，不连接店铺。');
    } else {
      simulated = {deliveries: 1, tasks: 1, effects: 0, blocked: 1, status: 'waiting_auth'};
      line('HEALTH', '合成故障：设备离线，登录态无法确认。', true);
      line('PAUSE', '暂停依赖此连接的动作；数据标为过期，不展示“实时正常”。', true);
      line('QUEUE', '示意保留事件、游标和未完成工作，其他健康流程继续。');
      line('RECOVER', '重新授权/在线 → 只读探针 → 补采与数据核验 → 按策略恢复。');
      renderSimulation('不要靠更强提示词绕过登录。授权与数据恢复都验证通过，才恢复受影响动作。');
    }
  }
  byId('run-simulation').addEventListener('click', run);
  byId('reset-simulation').addEventListener('click', reset);
  incident.addEventListener('change', reset);
  reconcile.addEventListener('click', () => {
    if (simulated.status !== 'unknown') return;
    line('READ-BACK', '预设样本：按同一业务身份查到一次成功发送及对应内容。');
    line('SETTLED', '模拟结果改为已核验；不再发送第二条。');
    simulated.effects = 1;
    simulated.status = 'verified';
    renderSimulation('本例的合成证据确认已完成。真实环境若仍无法核验，就继续 unknown 并升级人工。');
  });

  let printState = [];
  window.addEventListener('beforeprint', () => {
    printState = [...platforms, ...panels, ...sources].map((element) => ({element, hidden: element.hidden, open: element.open}));
    printState.forEach(({element}) => { element.hidden = false; if (element.tagName === 'DETAILS') element.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printState.forEach(({element, hidden, open}) => { element.hidden = hidden; if (element.tagName === 'DETAILS') element.open = open; });
    printState = [];
  });
  byId('print-report').addEventListener('click', () => window.print());
})();
