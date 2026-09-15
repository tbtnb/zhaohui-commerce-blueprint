# 昭回 · 从老板的想法到公司的 AI 经营方案

新版入口从“我想把公司 AI 化”等含糊目标开始，通过经营方式、团队、渠道和现有系统的选择制定方案，再引导资料连接、诊断、搭建、试跑和后续安排。

**8 个经营模板、24 个细分方向**：公司 AI 化路线、货架经营增长、内容与直播经营、供货与履约协同、多渠道经营协同、客服与售后改进、会员服务与复购、经营收益复盘。模板由推荐逻辑选出，首页不展示场景目录。

每条路径 16–17 屏，每套包含三步搭建和八段业务动画。支持已有连接、引导接入、工作文件、稍后补充；可模拟账号不一致、读取失败、业务资料异常、重复事件和新资料变化。可暂停、逐步查看、重播、调速、减少动效及导出搭建说明。返回修改会重新生成后续方案。

## 预览与构建

```sh
python3 build-company.py
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8765/>；研究页为 `/company/research.html`。公开站点：https://tbtnb.github.io/zhaohui-commerce-blueprint/ 。

```sh
node --test company/model.test.mjs
```

## 资料与实现

- `company/catalog.mjs`：八套方案、系统与提问。
- `company/variants.mjs`：根据进一步选择调整证据、诊断与运行故事。
- `company/model.mjs`：推荐、资料就绪状态和说明导出。
- `company/app.mjs`、`animation.mjs`、`style.css`、`visuals.css`：互动流程与业务动画。
- `company/research/report.md`：国内电商经营研究与八套深度规格。
- `company/research/sources.json`：18 条来源及访问记录（包括访问受限记录）。
- `company/research/capability-snapshot.json`：online-agent 本地模板与设计依据快照。
- `company/VALIDATION.md`：本次实际验证范围。

## 证据与运行范围

使用公开平台资料、V2EX 商家讨论、运营复盘和厂商案例交叉分析。知乎正文受登录/安全验证限制，派代访问失败，不能当作已读全文。未做代表性抽样或真实商家访谈；八模板是设计归纳，不是市场统计分类。

这是使用合成资料的静态互动蓝图，不调用模型或连接真实业务后台，也不会创建任务、发送消息或启动经营服务。在线接入、写入授权及真实业务回执仍需具体实施验证。online-agent 仅作只读参考，模板成熟度不代表平台已经接通。

## 历史文件

旧 60 场景不再是新版入口、推荐或动画的数据源。历史文件与原有未提交修改保留。`build-guided.py` 现转到新版构建；`build-scenes.py` / `build-journey.py` 等旧构建器仅用于维护历史产物，可能覆盖首页，之后必须运行 `build-company.py` 恢复新版。
