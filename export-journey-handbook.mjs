import fs from 'node:fs';
import {sampleAnswers,makeJourneyPlan,planText} from './journey-model.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./journeys.json',import.meta.url)));
fs.writeFileSync(new URL('./journey-handbook.md',import.meta.url),'# 昭回 · 60 项搭建说明\n\n选择需求、确认资料、试用并检查结果。以下均为示例方案。\n\n'+data.scenes.map(s=>planText(makeJourneyPlan(s,sampleAnswers(s)))).join('\n\n---\n\n'));
