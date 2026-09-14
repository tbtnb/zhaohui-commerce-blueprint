# 昭回 · 国内电商AI场景手册

公开站点：https://tbtnb.github.io/zhaohui-commerce-blueprint/

## 当前版本：场景优先

首页包含60个国内电商应用设计，分为10类经营领域；每个场景都写明商家诉求、所需资料、监控方式、可交付产物、反馈改进、人工边界和观察指标。提供7套可组合的岗位方案以及本地需求说明导出。

这不是60个已经安装或验收的App功能。48个场景可先用商家合法提供的文件准备试搭；12个时效型场景需要核验新鲜读取，离线文件只能给截至导出时的结果。所有场景仍需数据准备、授权检查与业务试跑。

不接财务；不自动对客发送、发布、改价、发券、库存回写、出库、发货、退款、支付、结算或删除生产记录。已有通用连接器只读；客服仍受当前shadow/copilot边界限制。

方案组合器在浏览器本地运行。只尝试记住所选场景编号，经营目标/补充文本不写入localStorage、不上传。Markdown/JSON导出是`planning_brief_not_runtime_config`，不会注册Timer、安装插件或授予权限。复制的任务说明要求先盘点能力、验证真实资料，再确认是否持续运行。

## 文件

- `index.html`：场景手册与组合器。
- `scenarios.md`：完整60场景文字稿。
- `scenarios.json`：完整场景设计数据及来源。
- `scene-data/`：按经营领域组织的场景源数据。
- `scene-config.json`：7套组合方案。
- `scene-sources.json`：本轮24条分级依据。
- `scene-template.html`、`scene.css`、`scene-app.js`：网页模板、样式和本地交互。
- `scene-plan.mjs`、`scene-export.mjs`：纯规划数据与文本导出。
- `architecture.html`：保留前一版技术研究报告；旧章节/证据链接由首页转到本附录。
- `research.md`：技术报告文字稿。
- `SCENE-DESIGN.md`：此次改版目标与边界。

## 重建

无构建依赖，仅Python标准库：

```sh
python3 build-scenes.py
```

重建技术附录（不会覆盖场景首页）：

```sh
python3 build.py
```

本地预览：

```sh
python3 -m http.server 8767 --bind 127.0.0.1
```

## 浏览器验证

Node与已安装的Playwright包：

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.js node qa-scenes.mjs
PLAYWRIGHT_MODULE=/path/to/playwright/index.js node qa.mjs
```

前者验证场景首页和方案导出，后者验证技术附录。省略SITE_URL时，各自启动仅监听本机的临时随机端口服务，结束后关闭。输出在被忽略的`qa-output/`。验证线上首页：

```sh
SITE_URL=https://tbtnb.github.io/zhaohui-commerce-blueprint/ \
QA_OUTPUT=qa-output/scenes-live \
PLAYWRIGHT_MODULE=/path/to/playwright/index.js node qa-scenes.mjs
```

这些检查仅验证报告网站、交互和导出合同，不验证任何商家业务接入。最新实际结果见`SCENE-VALIDATION.md`；前版记录保留在`VALIDATION.md`。

## 发布与数据边界

独立公开仓库通过GitHub Pages的main分支根目录发布。只包含本次撰写的研究、公开来源链接、路径级架构说明和合成演示；没有原项目源码、客户明细、账号或凭据。真实Webhook、数据库、模型与后台任务不能在静态Pages中运行。

来源覆盖不等于权限覆盖。部分国内规则只取得官方索引，未完整核验的时限、额度与规则不写成确定结论。社区历史案例用于发现经营问题，不作行业发生率统计或现行平台规则。
