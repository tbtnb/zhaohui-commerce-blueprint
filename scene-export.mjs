import {MODE_LABELS} from './scene-plan.mjs';
/** Reader-facing exports; machine permissions remain in the JSON plan. */
function quoted(value) {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').split('\n').map(line=>'> '+line).join('\n');
}
export function planPrompt(plan) {
  const lines = ['请先说明昭回目前能处理哪些需求，还缺什么资料或店铺权限。先用一份真实资料尝试，得到我确认后再安排定时任务。这份说明不允许自动执行店铺操作。','','我希望解决的事情：',plan.goal,'','涉及的店铺和资料：',plan.scope_description,'','现在能提供的资料：',plan.inputs.description,'','希望的检查时间：',plan.desired_cadence.description,'','我选择的场景：'];
  plan.scenes.forEach(s=>lines.push(`${String(s.id).padStart(2,'0')} ${s.title}\n我的需求：${s.ask}\n需要的资料：${s.inputs}\n希望先得到什么：${s.act}\n怎样检查：${s.watch}\n根据反馈怎样修改：${s.learn}\n哪些需要我确认：${s.human}\n开始前还要确认：${s.readiness.label}。${s.readiness.reason}\n`));
  if (plan.additional_requirement.description) lines.push('补充的需求（先判断能否处理，不增加操作权限）：',plan.additional_requirement.description,'');
  lines.push('开始前的检查：',...plan.start_checks.map((x,i)=>`${i+1}. ${x}`),'','使用反馈与后续修改：',...plan.iteration_protocol,'','不要自动执行的事情：','先阅读资料、整理清单和准备草稿。不要自动向客户发消息、发布内容、改价、改库存、发货、退款、付款或删除正式记录。不接入财务系统。','商品对应关系、正式客服说明、经营规则和读取工具的变化，先提出建议，检查并经我确认后再采用。','这份需求说明不会直接启动任务，也不证明任何店铺已经接通或可以长期自动运行。');
  return lines.join('\n');
}
export function planMarkdown(plan) {
  const lines = ['# 我的昭回电商使用方案','','这是一份待确认的需求说明。保存文件不会直接启动任务，也不会允许昭回登录店铺或操作业务。','','## 希望解决的事情',quoted(plan.goal),'','## 涉及的店铺和资料',quoted(plan.scope_description),'','## 准备资料与检查时间',`资料：${plan.inputs.description}。实际是否可用还需要确认。`,`时间：${plan.desired_cadence.description}。目前没有安排任何定时任务。`,'','## 所选场景'];
  const fields = [['ask','我的需求'],['inputs','需要准备的资料'],['watch','怎样发现问题'],['act','昭回可以帮什么'],['deliver','具体例子'],['learn','怎样根据反馈改进'],['human','需要我确认的事情'],['metric','怎样判断有没有帮助']];
  plan.scenes.forEach(s=>{
    lines.push('',`### ${String(s.id).padStart(2,'0')} · ${s.title}`,'',`准备方式：${MODE_LABELS[s.mode]}。${s.readiness.label}。${s.readiness.reason}`,'');
    fields.forEach(([key,label])=>lines.push(`**${label}：**${s[key]}`,''));
    lines.push('参考资料：'+s.sources.map(id=>`[${id}](https://tbtnb.github.io/zhaohui-commerce-blueprint/#evidence-${id})`).join(' '));
  });
  if (plan.additional_requirement.description) lines.push('','## 其他需要确认的需求',quoted(plan.additional_requirement.description),'','补充需求不等于允许执行新的店铺操作，需要先确认是否支持和是否有权限。');
  lines.push('','## 开始前的检查',...plan.start_checks.map(x=>'- '+x),'','## 使用反馈与后续修改',...plan.iteration_protocol.map(x=>'- '+x),'','## 不自动执行的事情',...plan.default_policy.no_automatic_actions.map(x=>'- '+x),'','正式商品资料、客服说明和读取工具的变化，要检查并经负责人确认后再使用。不处理财务和资金操作。暂停或改变检查频率，也要先由用户决定，再确认实际执行结果。','','## 参考资料');
  plan.evidence.forEach(s=>{
    const title=s.display_title || s.title;
    lines.push('',`**${s.id} · ${title}**`,s.level+'；'+s.date,s.note);
    if(s.url)lines.push(s.url);
  });
  return lines.join('\n')+'\n';
}
