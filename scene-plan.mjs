/** Local report planning data. No service calls or task registration. */
export const INPUT_LABELS = Object.freeze({none:'还不清楚，需要先确认',files:'能提供表格和说明文件，并遮去无关个人信息',read:'已有读取方式，需要检查这家店是否允许、资料是否最新'});
export const CADENCE_LABELS = Object.freeze({manual:'先尝试处理一次',daily:'希望每天检查，具体时间和运行条件待确认',weekly:'希望每周总结，具体时间和运行条件待确认'});
export const MODE_LABELS = Object.freeze({file:'可先用文件尝试',read:'需要最新店铺资料'});
export function validSelection(values, scenes) {
  if (!Array.isArray(values)) return [];
  const known = new Set(scenes.map(s => s.id));
  return [...new Set(values.filter(id => typeof id === 'number' && Number.isInteger(id) && known.has(id)))].sort((a,b) => a-b);
}
const clipped = (value, limit) => typeof value === 'string' ? value.trim().slice(0,limit) : '';
export function readinessFor(scene, inputMode) {
  if (inputMode === 'none') return {code:'waiting_for_data_and_scope',label:'先确认能提供什么资料',reason:'现在只是需求，还不能判断是否可以开始处理。'};
  if (inputMode === 'files' && scene.mode === 'read') return {code:'offline_snapshot_only',label:'文件只能说明导出时的情况',reason:'要判断当前订单、库存或聊天，还需要检查能否读取最新资料。'};
  if (inputMode === 'read') return {code:'connector_verification_required',label:'先检查读取是否可用',reason:'需要实际确认店铺权限、能读到的内容和更新时间，不能只凭已有连接就认定可以使用。'};
  return {code:'file_pilot_needs_acceptance',label:'可以先用一份文件尝试',reason:'先核对商品、资料范围和日期，再检查整理结果是否正确、有用。'};
}
export function createPlan(bundle, selection, options = {}) {
  const all = bundle.groups.flatMap(g => g.scenes);
  const ids = validSelection(selection, all);
  const inputMode = Object.hasOwn(INPUT_LABELS,options.inputMode) ? options.inputMode : 'none';
  const cadence = Object.hasOwn(CADENCE_LABELS,options.cadence) ? options.cadence : 'manual';
  const scenes = ids.map(id => all.find(s => s.id === id));
  const sourceIds = new Set(scenes.flatMap(s => s.sources));
  return {
    kind:'planning_brief_not_runtime_config',format_version:1,report_edition:bundle.edition,
    status:'draft_for_capability_and_business_review',generated_at:options.generatedAt || new Date().toISOString(),
    activated:false,authorization:'unverified_no_permissions_granted_by_this_document',
    goal:clipped(options.goal,1000) || '先确认希望解决哪件具体工作，再尝试处理一份资料。',
    scope_description:clipped(options.scope,600) || '还需要确认涉及哪些店铺、可以使用什么资料，以及用于什么工作。',
    inputs:{declared_mode:inputMode,description:INPUT_LABELS[inputMode],verified:false},
    desired_cadence:{selection:cadence,description:CADENCE_LABELS[cadence],timer_registered:false},
    additional_requirement:{description:clipped(options.extra,1000),status:'requires_capability_review_not_authorization'},
    default_policy:{output_scope:'read_only_analysis_workspace_checklists_and_drafts',external_business_writes:'deny',financial_execution:'excluded',production_changes:'candidate_only_until_approved_and_tested',no_automatic_actions:['向客户发送消息','发布商品或内容','修改价格或发券','修改库存、安排出库或发货','退款、付款或结算','删除正式业务记录'],pause_or_schedule_changes:'require_user_decision_and_formal_capability_receipt'},
    shared_workspace_proposal:['经营目标和允许处理的范围','未完成事项及原来的编号','资料来源和实际截止日期','整理好的清单和草稿','人工修改和后续建议','任务完成记录和仍需跟进的事情'],
    scene_ids:ids,scenes:scenes.map(s => ({...s,readiness:readinessFor(s,inputMode)})),
    start_checks:['先说明昭回当前能处理什么，还缺哪份资料或哪个店铺的允许。','使用一份真实资料尝试，遮去无关个人信息，核对商品、日期和结果。','得到用户确认后再安排定时或文件更新检查，并确认实际完成记录。','电脑离线、正在处理其他任务、资料过期或结果不明时，如实说明。'],
    iteration_protocol:['保存问题进展、人工采用和修改的内容，没有新资料就不编造新结论。','提出具体修改建议，说明依据和可能遗漏的情况，不自动修改正式规则。','用以前的问题检查新建议，经负责人批准后，小范围尝试并继续观察。','减少提醒和转人工不能以漏掉急事、写错事实或超出权限为代价。'],
    evidence:bundle.sources.filter(s => sourceIds.has(s.id))
  };
}
