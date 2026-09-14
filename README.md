# 昭回 · 从一个想法开始搭建

[公开站点](https://tbtnb.github.io/zhaohui-commerce-blueprint/)

首页包含 60 项电商互动演示：漂浮想法、逐步追问、资料连接、流程准备、触发运行、异常确认及反馈。每项具有独立的业务对象、动作提示、前后状态和搭建说明。网页使用预设对话和合成资料，不访问模型、店铺或真实业务系统。

资料连接在问答中完成。已有连接、新建连接和工作文件都属于搭建过程，入口不按接入条件分组。回答影响对象范围、资料方式、时间、触发与结果内容。导出为需求说明，不启动任务。

- `journey-data/`：60 项场景脚本。
- `journey-template.html`、`journey.mjs`、`journey.css`：页面与互动流程。
- `journey-model.mjs`：问答、搭建步骤、导出与播放器。
- `journey-art.mjs`、`journey-visuals.mjs`、`journey-world.css`：业务图形与动画。
- `journey-handbook.md`：60 项完整搭建说明。
- `guide.html`：保留原场景手册与组合器。
- `architecture.html`：技术附录及原研究资料。

## 重建及预览

```sh
python3 build-journey.py
node export-journey-handbook.mjs
python3 -m http.server 8765 --bind 127.0.0.1
```

`build-scenes.py` 属于旧版手册构建器，会覆盖 index.html；维护旧手册时先将它的输出保存为 guide.html，再运行新首页构建器。

## 验证

安装 Playwright 并准备 Chrome 后，在此目录执行：

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node qa-journey.mjs
```

默认检查本机 8765 端口；设置 `TARGET` 可以检查已部署地址。截图与结果保存在被忽略的 qa-output 中。检查覆盖 60 个正常流程、60 个异常恢复、60 个重复输入，以及问答组合、导出、搜索和手机布局。原检查及历史结果仍保留，最新结果见 JOURNEY-VALIDATION.md。

发布内容仅包括公开研究、示例与静态网页，不包含原应用代码、凭据或商家数据。
