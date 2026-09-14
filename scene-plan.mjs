/** Local report planning data. No service calls or task registration. */
export const INPUT_LABELS = Object.freeze({none:'还没确认资料与权限',files:'可定期提供脱敏文件',read:'自述已有读取连接，仍需逐项验证'});
export const CADENCE_LABELS = Object.freeze({manual:'先手动试一次',daily:'计划每日复核，时间与运行条件待确认',weekly:'计划每周复盘，时间与运行条件待确认'});
export const MODE_LABELS = Object.freeze({file:'文件可试搭',read:'需核验新鲜读取'});
export function validSelection(values, scenes) {
  if (!Array.isArray(values)) return [];
  const known = new Set(scenes.map(s => s.id));
  return [...new Set(values.filter(id => typeof id === 'number' && Number.isInteger(id) && known.has(id)))].sort((a,b) => a-b);
}
const clipped = (value, limit) => typeof value === 'string' ? value.trim().slice(0,limit) : '';
export function readinessFor(scene, inputMode) {
  if (inputMode === 'none') return {code:'waiting_for_data_and_scope',label:'先确认资料与权限',reason:'当前只是一项需求，尚不能认定可以运行。'};
  if (inputMode === 'files' && scene.mode === 'read') return {code:'offline_snapshot_only',label:'文件版仅作事后核对',reason:'时效用途仍需新鲜读取；导出快照不能保证当前状态或实时提醒。'};
  if (inputMode === 'read') return {code:'connector_verification_required',label:'读取能力仍待逐项验证',reason:'已有连接是用户描述，不代表对象、权限、时效与覆盖已通过。'};
  return {code:'file_pilot_needs_acceptance',label:'可准备文件样本试搭',reason:'须核对资料身份、范围与时效，并完成本场景的业务试跑；不是现成插件。'};
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
    goal:clipped(options.goal,1000) || '待商家确认经营目标；先选择一个具体问题试搭。',
    scope_description:clipped(options.scope,600) || '待确认店铺、经营主体、资料范围与处理用途。',
    inputs:{declared_mode:inputMode,description:INPUT_LABELS[inputMode],verified:false},
    desired_cadence:{selection:cadence,description:CADENCE_LABELS[cadence],timer_registered:false},
    additional_requirement:{description:clipped(options.extra,1000),status:'requires_capability_review_not_authorization'},
    default_policy:{output_scope:'read_only_analysis_workspace_checklists_and_drafts',external_business_writes:'deny',financial_execution:'excluded',production_changes:'candidate_only_until_approved_and_tested',no_automatic_actions:['对客发送','发布商品或内容','改价/发券','库存/出库/发货','退款/支付/结算','删除生产记录'],pause_or_schedule_changes:'require_user_decision_and_formal_capability_receipt'},
    shared_workspace_proposal:['经营目标与授权范围','当前问题与稳定编号','资料来源与业务截止时间','已生成清单和草稿','人工反馈与改进候选','运行回执与未结事项'],
    scene_ids:ids,scenes:scenes.map(s => ({...s,readiness:readinessFor(s,inputMode)})),
    start_checks:['盘点现有已发布能力及真实授权，分为能试搭、缺资料、缺权限。','用一份真实脱敏样本试跑，核验身份、时效、覆盖和结果。','用户确认持续运行后，才注册Timer或文件Listener并核验实际账本。','设备离线、回合占用、输入过期和结果未知须明确披露。'],
    iteration_protocol:['记录观察、问题进度与人工采纳和纠错；没有新证据不制造新结论。','生成有来源、有反例的改进候选，不自动覆盖正式经营规则。','用旧样本对照核验，再由负责人批准；批准后小范围观察实际效果。','错误事实、越权或重要遗漏不能用减少提醒和转人工来掩盖。'],
    evidence:bundle.sources.filter(s => sourceIds.has(s.id))
  };
}
