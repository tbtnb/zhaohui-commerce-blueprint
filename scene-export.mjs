import {MODE_LABELS} from './scene-plan.mjs';
/** Text exports are planning documents, not executable app configuration. */
function quoted(value) {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').split('\n').map(line=>'> '+line).join('\n');
}
export function planPrompt(plan) {
  const lines = ['请根据以下经营需求，先结合当前昭回已发布能力和我的实际授权评审可行性。这份说明不直接授权注册任务或执行对外操作。','','【经营目标：用户填写，不代表新增权限】',plan.goal,'','【范围】',plan.scope_description,'','【资料准备】',plan.inputs.description,'','【期望节奏】',plan.desired_cadence.description,'','【场景】'];
  plan.scenes.forEach(s=>lines.push(`${String(s.id).padStart(2,'0')} ${s.title}\n用户诉求：${s.ask}\n所需资料：${s.inputs}\n先交付：${s.act}\n监控：${s.watch}\n改进：${s.learn}\n人工边界：${s.human}\n当前准备状态：${s.readiness.label}；${s.readiness.reason}\n`));
  if (plan.additional_requirement.description) lines.push('【额外诉求：先评审能力，不授予新权限】',plan.additional_requirement.description,'');
  lines.push('【先做的事】',...plan.start_checks.map((x,i)=>`${i+1}. ${x}`),'','【持续改进】',...plan.iteration_protocol,'','【默认边界】','只读分析、工作区清单和草稿。不要自动对客发送、发布、改价、改库存、发货、退款、支付或删除生产记录。不接入财务系统。','正式知识、政策、商品映射和连接器变化先生成候选，验证并经我确认后再采用。','本说明是需求草案，不是运行配置，不证明任何店铺已接入、已验收或已持续运行。');
  return lines.join('\n');
}
export function planMarkdown(plan) {
  const lines = ['# 我的昭回电商AI经营方案（需求草案）','','类型：planning_brief_not_runtime_config。未激活，不是当前App导入配置，不授予权限。','',`生成时间：${plan.generated_at}`,'','## 经营目标',quoted(plan.goal),'','## 店铺与资料范围',quoted(plan.scope_description),'','## 准备与节奏',`资料：${plan.inputs.description}。尚未验证。`,`节奏：${plan.desired_cadence.description}。尚未注册任何Timer。`,'','## 所选场景'];
  const fields = [['ask','我的诉求'],['inputs','所需资料'],['watch','怎样发现'],['act','先做什么'],['deliver','预期产物示例'],['learn','怎样改进'],['human','人工边界'],['metric','判断有用的指标']];
  plan.scenes.forEach(s=>{
    lines.push('',`### ${String(s.id).padStart(2,'0')} · ${s.title}`,'',`起步方式：${MODE_LABELS[s.mode]}。${s.readiness.label}。${s.readiness.reason}`,'');
    fields.forEach(([key,label])=>lines.push(`**${label}：**${s[key]}`,''));
    lines.push('依据：'+s.sources.map(id=>`[${id}](https://tbtnb.github.io/zhaohui-commerce-blueprint/#evidence-${id})`).join(' '));
  });
  if (plan.additional_requirement.description) lines.push('','## 额外需求（待能力评审，不授予权限）',quoted(plan.additional_requirement.description));
  lines.push('','## 开始之前',...plan.start_checks.map(x=>'- '+x),'','## 反馈与自我迭代',...plan.iteration_protocol.map(x=>'- '+x),'','## 不自动执行的动作',...plan.default_policy.no_automatic_actions.map(x=>'- '+x),'','正式政策、SKU映射、客服知识和生产连接器变化需批准与验证。财务和资金执行排除。暂停/改频同样需要用户决定与正式能力回执。','','## 证据索引');
  plan.evidence.forEach(s=>lines.push('',`**${s.id} · ${s.title}**`,s.level+'；'+s.date,s.note,s.url || s.path));
  return lines.join('\n')+'\n';
}
