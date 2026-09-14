# 场景版网站验证记录

验证日期：2026-09-14。

## 验证范围

静态场景手册、本地组合器、规划导出及技术附录兼容。不验证商家接入，不代表60个场景已实施或正在持续运行。

## 本地实际结果

- 场景版：90项检查全部通过；浏览器错误0，第三方/商家网络请求0。
- 技术附录：61项原有检查全部通过。
- 视口宽度1440、768、390、320像素无文档横向溢出，手机展开场景正常。
- 已检查桌面、手机、完整场景卡和组合器截图。
- 60个不同编号场景；每项都有情境、资料、监控、产物、反馈改进、人工边界和观察指标。
- 覆盖10类筛选、平台/起步方式/关键词/已选筛选、7套组合的增量加入、去重、移除、空状态。
- 实际浏览器下载Markdown与JSON并校验内容；导出保持未激活、权限未验证、业务写入拒绝、财务排除。
- 剪贴板允许/拒绝的浏览器边界模拟、手工复制回退、存储损坏/不可用、自由文本不持久化均通过。
- 直接场景/证据链接和前版技术章节/证据链接均通过；禁用JavaScript仍可读取全部场景。
- 3类反馈交互只生成本地解释，不调用模型、不发布规则。

首次新增旧链接回归发现同页hash变化未转到技术附录，已修复后重跑通过。没有降低原断言，也没有把失败记作通过。

## 重复验证

```sh
python3 build-scenes.py
PLAYWRIGHT_MODULE=/path/to/playwright/index.js node qa-scenes.mjs
PLAYWRIGHT_MODULE=/path/to/playwright/index.js node qa.mjs
```

设置SITE_URL为线上首页可执行线上回归；详细本地证据在忽略目录qa-output中，不公开测试浏览器状态或真实数据。

## 发布前静态内容指纹

- `index.html` SHA-256：`d2fda451165777aeec898a8fef500a3f10e8592b28b77d6241483345591b8b59`
- `scene.css` SHA-256：`7207f134a8d321257ddb5e147ef454d91309c4f395197bc89b6ee477d5e269a1`
- `scene-app.js` SHA-256：`62ad48dfe9aa47d592eb43ed74f2aea065859368fd0fc056a5634c1d19d336ef`
- `scene-plan.mjs` SHA-256：`3707f919e46f219dfdfefff254141502ddffeb2b6d3acfd6fecfdab2947889e5`
- `scene-export.mjs` SHA-256：`2910029f67567016900a34f4d7aa07227349f7f1c52c260b3854331b8977046c`
- `scenarios.md` SHA-256：`3c8ddce8d663dd47bd400fd675a8c72d1e90b6f859de597fbb4744eb120c6f27`
- `scenarios.json` SHA-256：`52cafd0e9ca2bc69a46ed5ac9b4cc021a8e00b739d4ea93796a28ff3d1bd2702`

## 未做的事情

未操作真实店铺、未发送客户消息、未新增自动化任务、未修改原应用业务代码或运行配置、未重跑历史Agent业务实验。未发布账户、密钥、Cookie、真实客户资料或原应用源码。

## 线上实际验证

已对 https://tbtnb.github.io/zhaohui-commerce-blueprint/ 执行同一套90项检查，全部通过；首页HTTP 200，浏览器错误0、第三方和商家请求0。GitHub Pages构建成功且启用HTTPS。

被测内容提交：`3372818034e3d80ff096a3f1827c06a1a88d02ff`。本节及JSON记录为发布后的文档补记，不改变被测HTML/CSS/JS内容。详情见`SCENE-VALIDATION.json`。线上验证仍只证明说明网站和本地导出，不证明商家场景已运行。
