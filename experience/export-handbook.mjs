import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {sampleAnswers,setupSteps,sourceSteps,SOURCE_NAMES,TRIGGERS} from './journey-model.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(await fs.readFile(path.join(root,'journeys.json'),'utf8'));
const lines=['# 昭回 · 60 项需求的搭建与运行说明','','这份说明配合互动演示使用。每项从一个模糊的想法开始，逐步确认范围、资料、处理方式和开始条件。连接资料是搭建步骤的一部分。','','下面使用示例数据，不代表已经登录你的店铺或启动真实工作。页面中的图用于解释过程，实际在昭回中从聊天、接入能力、工作文件与任务安排开始。','','## 先了解实际搭建方式','','先在聊天里说明工作目标。昭回可以把确认后的要求保存为工作说明，通过已有接入能力寻找和复用合适的资料来源。需要登录时由用户确认账号与允许范围，再读一份实际资料核对对象和日期。','','确认处理方法后，可以继续从聊天发起任务，或按用户指定的时间、指定工作文件的更新安排检查。每次保留来源、结果与未完成事项。现有文件更新检查只针对允许的工作文件，不等于已经订阅所有平台消息。','','首次使用先用真实资料尝试并核对结果，之后再确认是否长期运行。电脑离线、任务等待、数据过期和未取得的权限必须如实说明。正式经营规则和对外操作不因本说明自动获得批准。'];
for(const s of data.scenes){
 const a=sampleAnswers(s);
 lines.push('',`## ${String(s.id).padStart(2,'0')} · ${s.thought}`,'',s.title,'','### 把想法说清楚','',s.question,...s.choices.map(c=>'- '+c.label),'',s.detailQuestion,...s.details.map(c=>'- '+c),'','### 在沟通中安排资料','','这项工作需要：'+s.source+'。');
 for(const source of ['existing','connect','files'])lines.push('',`**${SOURCE_NAMES[source]}：**`,...sourceSteps(s,{...a,source}).map((t,i)=>`${i+1}. ${t}`));
 lines.push('','### 在昭回中怎样搭建','');
 for(const [i,step] of setupSteps(s,a).entries())lines.push(`**${i+1}. ${step.name}**`,'','你来确认：'+step.you,'','昭回负责：'+step.ai,'','完成后应看到：'+step.result,'');
 lines.push('### 每次工作怎样开始','','这项场景原本适合的开始情况：'+s.when,'','可以在问答中改为以下方式：',...Object.values(TRIGGERS).map(t=>'- '+t.label+'：'+t.engine),'','### 一次示例中的变化','');
 s.objects.forEach((object,i)=>lines.push(`- ${object}：${s.before[i]} → ${s.after[i]}`));
 lines.push('','处理顺序：'+s.steps.join(' → '),'','结果：'+s.result,'','### 遇到不确定情况怎么办','',s.issue,'','先确认资料再继续；不能把按钮里的模拟确认当成真实业务确认。','','### 下次怎样改进','',s.improve,'','需要人确认的范围：'+s.human,'','判断是否有帮助：'+s.metric,'','参考资料：'+s.sources.map(id=>`[${id}](https://tbtnb.github.io/zhaohui-commerce-blueprint/guide.html#evidence-${id})`).join(' '));
}
lines.push('','## 演示范围','','60 项演示使用不同的业务对象、前后变化、问题处理与动作说明。场景之间共用基础图形和播放器，不是 60 个已经接入真实店铺的独立软件。','','按钮只操作浏览器里的示例。保存的说明不会创建真实任务，不会发送客服消息、修改价格或库存、出库发货，也不处理退款、付款、结算或财务。');
await fs.writeFile(path.join(root,'journey-handbook.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({handbook:'experience/journey-handbook.md',scenes:data.scenes.length,buildSteps:data.scenes.length*6,rootHomepageChanged:false}));
