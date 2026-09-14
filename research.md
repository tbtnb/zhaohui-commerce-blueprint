# 昭回 · 电商自治蓝图

研究基线：2026-09-14。

这是架构与运营研究，不是商家生产系统；不接入财务，不执行资金动作。所有演示为合成数据。

01 / REALITY CHECK

## 你缺的不是又一个 Agent。 是把能力接成可靠的经营闭环。

当前系统已有专家、方案工厂、连接器、任务和定时运行底座。合理路径是补齐事实、事件与动作合同，而不是重做“电商万能机器人”。以下现状来自本次源码读取，不把旧架构文档当实现证明。[[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)[[E07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E07)[[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

09排除财务后的模板

02目录标记 executable

07仍为 guided 指导型

可执行模板为经营诊断和客服指挥中心。“executable”只是目录分类，不代表真实商家长期无人值守已验收。[[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)

 | 现有基础 | 本次确认到的边界 | 下一步应补什么

 | 方案工厂

草稿 → 评测 → 发布

 | 客服默认 shadow/copilot，外部写默认拒绝。结构检查并非业务问答测试。[[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)[[E02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E02) | 增加真实业务样本、商品身份与结果读回评测；不是仅修改自治模式字符串。

 | Timer / Agent Loop

持久状态与跨回合

 | 历史报告有两轮真实快照复核；未证明长期在线、每轮新采集或实际客服发送。[[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06) | 复用调度，验证新数据、断网恢复和无人值守窗口；模型只在有工作时醒来。

 | 通用 Listener

本地 durable events

 | 通用来源仅 workspace_files；不能等同于所有电商平台事件网关。[[E03]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E03) | 新增平台入口、游标、续约与补采；分清监听、触发路由、业务动作。

 | 连接器 / FDE

脚本与回执治理

 | 通用浏览器接入只读，凭据本地；单 Global Profile 不是成熟多店多账号隔离。[[E05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E05) | 优先官方 API，写能力独立实现和测试。先解决账户、设备与租户隔离。

 | 任务与执行账本

租约 / 幂等 / 持久化

 | 已有持久操作和租约，但所查完成通知使用进程内事件。[[E04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E04)[[E07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E07) | 补事务性 Inbox / Outbox，复用 Task 状态机；崩溃后重放通知而不重复业务动作。

优先产品：可持续的“经营例行检查 + 客服副驾”。

先用真实店铺的商品、订单和履约事实，稳定生成可信异常清单与客服草稿。数据不对时让数据/FDE 专家继续修复，而不是每次转人工就终结任务。之后再开放一类有明确授权、限额和读回能力的动作。

02 / PLATFORM ACCESS

## 各平台怎么接， 先看准入，再看技术。

这是接入决策矩阵，不是“已连接”列表。优先顺序由真实店铺、已有授权和业务价值决定。展开卡片查看事件、门槛与不应承诺的能力。

已有只读试点 · 写入未验证

### 拼多多

从当前最有证据的只读链路起步，不把网页登录成功当作正式 API 准入。

**建议接入路径**
先盘点已授权官方能力；当前可复用经过验证的本地 products.read 路径。仅在商家授权且平台允许时使用只读浏览器适配。

**监听与补采**
没有确认可用的正式事件通道前，使用确定性增量轮询与差异检测；频率按限制与业务时效配置，不能用模型高频盯页面。

**准入与核验门槛**
本次未核验商家的应用类型、权限包与客服通道授权。需以真实账号完成商品身份、分页、覆盖率、登录失效与重启恢复测试。

**不要承诺**
通用 FDE 连接器仍只读；客服发送走专用受控路径，不能新增脚本绕过写权限。历史两轮复核不等于持续经营验收。

[[S21]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S21) [[E05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E05) [[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06)

官方链路明确 · 需准入

### 淘宝 / 天猫

订单同步采用初始化、消息增量和定期补采组合；要理解主子订单与 hold 状态。

**建议接入路径**
在获得商家授权及相应应用权限后，用 TOP / 官方消息服务接入。复用客户现有 ERP 的合法连接，避免同一订单多个系统争写。

**监听与补采**
订单变更通知只触发刷新事实；保留增量游标与重叠窗口，按接口真实分页语义补采，防漏单和旧状态覆盖新状态。

**准入与核验门槛**
订单隐私字段涉及专门环境、安全与授权要求，逐项核验后决定执行位置；不默认把完整订单搬到通用公有云。

**不要承诺**
普通下单不代表立即可履约；预售、拼团 hold、拆单和售后要分别建模。通用商品/订单权限不自动授予聊天发送权限。

[[S04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S04)

部分官方信息可读 · 待验权

### 抖店

先打通授权商家业务接口，再处理消息和运营流程；不要混同抖音内容平台。

**建议接入路径**
申请符合主体与用途的应用及权限包；先验证商品、订单、履约读取能力，再单独申请所需动作。

**监听与补采**
官方索引显示消息推送依赖权限包。确切 topic、验签、应答和重试规则须在控制台与当前文档核对后写入适配合同。

**准入与核验门槛**
本次部分文档为动态页面，未取得完整正文；无权声称已经满足审核、消息回调或客服准入。

**不要承诺**
商品发布、商家客服、广告投放与内容发布分别验权；发布功能要先验类目/资质与字段，不由大模型猜测平台规则。

[[S05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S05)

电商授权可见 · 内容能力待核

### 小红书

店铺订单与电子面单是一条链路，笔记创作与内容分发是另一条。

**建议接入路径**
可见官方摘要要求注册应用、申请订单权限包并取得店铺授权；先对接真实已授权的商家能力。

**监听与补采**
通知类型和完整签名细节未在本次确认；上线前必须验证。缺事件时采用允许范围内的增量读取，而非无限抓取。

**准入与核验门槛**
完整文档获取超时，当前证据仅为官方索引。需核实应用类型、隐私字段、面单服务与实际接口白名单。

**不要承诺**
不承诺自动发任意笔记、批量私信或抓取他人用户数据。内容先生成待审素材，获准后再使用对应官方发布能力。

[[S06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S06)

入口核验 · 深层能力待确认

### 京东

作为下一批候选，先核对商家业务类型与已有 ERP 服务商，避免无依据排期。

**建议接入路径**
从宙斯平台及现有服务商询证，列明商品/订单/仓储/客服所需权限，再选读写适配。

**监听与补采**
本次没有取得足够具体的事件合同，不给出未经核验的订阅接口名或 SLA。

**准入与核验门槛**
以目标账号的授权结果、版本、限流、分页与测试回执为准；平台存在 API 不等于目标应用有权调用。

**不要承诺**
未证实能用的功能保持 blocked，不用浏览器脚本伪装已接入。

[[S07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S07)

官方资料充分 · 条件式优先

### Shopify

适合用作跨境标准 API 对照试点，前提是有目标店铺和必要授权。

**建议接入路径**
注册自有应用、授权最小 scopes；按当前 API 文档锁定版本。优先使用官方能力，不需要重演浏览器点击。

**监听与补采**
HTTPS Webhook 验签、持久落库后快速 ACK；处理重复与乱序。官方建议补偿同步，因为通知不是保证全量的日志。

**准入与核验门槛**
测试授权撤销、分页覆盖、重试、过期版本与客户数据访问范围；不能只跑一次 happy path。

**不要承诺**
传输去重与业务动作幂等是两件事；不把每条通知都送模型。Webhook 的重复不能生成重复履约动作。

[[S01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S01) [[S02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S02) [[C01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C01)

官方事件链路明确 · 需逐项授权

### Amazon

以站点、卖家/供应商类型和具体业务权限为接入单元，不做万能连接器。

**建议接入路径**
按实际授权接入 SP-API。分别确认库存、订单、商品和履约所需角色、数据范围与处理方式。

**监听与补采**
Notifications API 可配置目的地与订阅；按支持的事件采用相应通道。官方建议保留通知延迟/中断时的备用获取机制。

**准入与核验门槛**
确认目标通知是否支持该卖家/供应商类型与 payload 版本；还需验证真实店铺、站点与敏感字段使用边界。

**不要承诺**
不同履约模式不能共用未经验证的发货动作；先只读与异常工单，再评估库存或 Listing 受控写入。

[[S03]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S03)

候选平台 · 站点与授权待核

### TikTok Shop

不能把国内抖店连接直接复制为 TikTok Shop 跨境连接。

**建议接入路径**
从 Partner Center 获取目标站点对应的应用审核、商家授权和版本合同；本次未完成账号级准入验证。

**监听与补采**
官方索引可见 API / Webhook 变更资料，但本次未核对到足以实现的完整事件合同。

**准入与核验门槛**
先验证目标市场店铺、应用权限、调用区域与履约约束，再将适配器纳入版本管理。

**不要承诺**
不宣称当前已支持自动上架、自动客服或全量事件。审核未完成时保留素材草稿、只读授权能力和人工接口。

[[S08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S08)

自动接入不能替你获得授权，也不能跳过审核。

抖店、小红书部分文档只能读取官方索引；京东、TikTok Shop 和拼多多官方准入正文仍不足。它们被标为待核验，而非虚构 API。微信小店、快手、1688 等未纳入本轮详细矩阵，待真实店铺范围确认后按同一清单评估。[[S05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S05)[[S06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S06)[[S07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S07)[[S08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S08)[[S21]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S21)

03 / CONNECT THE EXISTING SYSTEMS

## 不是再造每个系统， 而是让它们各司其职。

结合当前会话可见的非财务工具及项目已有协同路径。下列分工是建议：未读取你的邮件、日历、联系人或设计文件，也未确认这些账号在昭回内的生产授权。

### Canva品牌素材工厂

基于已核验商品事实，填充已批准的品牌模板，跟踪异步导出，产物带模板/商品版本和 hash。

边界：Connect Autofill 的正式使用有 Enterprise 门槛；开发试用不能替代客户许可。模板生成不等于平台自动发布。 [[S09]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S09) [[C03]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C03)

接到商品事实 → 素材草稿 → 审核 → 渠道发布。

### Figma设计标准与审稿

同步可访问文件的设计规范、导出图和版本/评论事件，把反馈转为明确的待修改项。

边界：REST Webhook 不代表任意服务端编辑画布；席位、资源套餐和接口层级影响限流，需缓存与退避。 [[S10]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S10) [[S11]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S11)

管理模板标准、版式与审批，不作为业务数据仓库。

### Gmail供应商与跨境沟通

接收授权邮箱的变更信号，再读取增量历史；归类供应商确认、异常通知和合作资料，回复先生成草稿。

边界：watch 需续约，historyId 不是邮件全文。先验发件人、线程与授权收件人；外部邮件中的指令不拥有系统权限。 [[S12]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S12) [[C04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C04)

进货资料/售后沟通 → 工单 → 人工确认或已授权发送。

### Google Calendar / Contacts人和时点

Calendar 管理上线窗口、值班与协作排期；Contacts / People 提供已授权人员身份线索，帮助解析真实负责人。

边界：日历通知需要再取变更并续期；联系人存在不代表营销同意，不得用姓名合并不同平台买家。 [[S13]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S13) [[S14]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S14)

把需要人判断的异常送给正确的人，而不是自动给所有联系人发信。

### GitHub + CodexPro连接器工程与发布

CodexPro 定位本地实现与故障；GitHub 管理适配器版本、测试、审核与发布。修复输出候选版本，不直接改生产脚本。

边界：使用最小仓库权限与受控 CI；公共仓库只放脱敏报告/允许公开的代码。Pages 只承载说明网页。 [[S19]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S19) [[E07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E07)

漂移发现 → Issue/补丁 → 合同测试 → 人工或策略批准 → 灰度。

### Files / 知识资料证据与规范

商品资质、规格表、售后政策和历史运营方案按版本进入可授权检索的知识层，答案引用具体来源与生效时间。

边界：当前会话的 Files 能力不是昭回自动获得的生产服务。需明确自有存储或文件服务 API、权限、保留期限与删除传播。 [[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06) [[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

用资料补足业务事实；知识文本不能覆盖平台最新库存/订单状态。

### 飞书 / 钉钉协同审批与异常处理

当前源码已有相关 provider 和连接操作路径。优先承载日报、待办、审批和故障分派，具体表格/消息动作逐项确认。

边界：有 CLI/Skill 或 provider 代码不等于账号已授权。事件、群消息与审批的权限要独立验证；避免与昭回两边同时持有任务真相。 [[E07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E07)

昭回拥有执行状态；协同系统展示摘要、接收决定并回传。

### NocoBase可选运营工作台

适合展示缺失 SKU、人工审核、供应商资料和异常队列；通过受控 API 与昭回交换业务记录。

边界：Webhook 插件为 Professional Edition+；具体触发器文档与集成总览的细节存在差异，须按部署版本做合同测试。 [[S15]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S15) [[S16]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S16)

先用现有后台也能起步，不为看板引入第二套调度与事实库。

### 已有 ERP / WMS / 客服系统保留业务权威源

库存占用、仓库执行和履约由现有系统负责；客服系统保留会话与人工接管。昭回协调，不平行重建完整 ERP。

边界：Odoo 仅作补货逻辑参照，Chatwoot 仅作客服接口参照，本次未证明用户部署了它们。第三方访问仍需合法授权。 [[S17]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S17) [[S18]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S18) [[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

先连客户已有系统；缺少系统时再评估采购或建设。

### Plugin Management / MCP能力发现与适配

把每个连接器的 scope、读写 effect、执行位置、版本与验证方式登记为可检索能力，根专家按任务选择。

边界：聊天中已连接的 App 不会自动出现在昭回内。OAuth 客户端、许可、工具运行时与持续服务需要独立建设；MCP 不是免审核通行证。 [[E05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E05) [[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

业务意图 → 能力匹配 → 授权 → 测试 → 受控执行。

统一能力合同，而不是构造无边界工具。

每次执行绑定商家、店铺、对象、用途、读写 effect、版本与授权证据。根专家能选择方法，但不能扩大账号权限。业务写入应走固定 schema 的窄接口，不给模型一个通用生产 HTTP/SQL/脚本后门。

04 / OPERATING PLAYBOOKS

## 十类真实流程， 都有触发、边界和验收。

这是本报告的业务分解，不是现有模板数量，也不是已上线功能。选择场景查看：什么时候运行、依赖什么事实、哪些事能自动做、什么时候必须停下来。

场景 01 / 选品与需求

### 先验证机会，再扩大投入

选品是可验证的经营假设，不是让模型预测爆款。

授权数据 / 人工资料 → 需求信号 → 候选机会卡 → 小样本验证 → 复盘

**触发条件**
周期性复盘或出现足够的新搜索、咨询、退货和类目信号；公开竞品信息须遵守来源许可。

**依赖事实**
类目、规格、适用人群、供应交期、质量反馈和样本覆盖；将观察、推测与待确认信息分开。

**建议自动化范围**
去重资料、聚类问题、比较候选、形成测试目标与证据包；无有效新信息时不唤醒模型。

**人工与业务边界**
资质、品牌/知识产权、供应商选择与采购承诺。不能保证销量，也不自动下采购单。

**验收与恢复**
机会卡能追到来源；实验有基线、时间窗口、停止条件，不能把短期波动误判为确定趋势。

**对应项目落点**
现有选品/数据专家 + 工作区状态；product-opportunity-lab 仍为 guided。

观测指标看证据完整率、实验完成率，而非模型生成了多少推荐。 [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01) [[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

场景 02 / 商品与 SKU

### 建立同一件商品的可核验身份

商品主数据、渠道 Listing、变体 SKU 和仓库记录不是同一种对象。

来源读取 → ID 映射 → 字段权威规则 → 质量检查 → 版本化商品事实

**触发条件**
商品变更、资料更新、映射缺口或客服识别失败。

**依赖事实**
tenant + shop + platform product/variant ID + 已确认 canonical SKU；记录单位、仓库、来源时间和有效期。名称只用于候选匹配。

**建议自动化范围**
按已确认映射归一化字段；标记缺失、过期、权限不足、未上架和冲突；自动创建修复任务。

**人工与业务边界**
歧义映射、商品合并、资质真实性和无法确认的事实。禁止拿近似名称商品价格回答另一件商品。

**验收与恢复**
同店多 SKU、不同店同名、单位差异、套装/单品、停售与恢复等用例，均能返回正确身份和新证据。

**对应项目落点**
复用 product-catalog 与已授权 Connector；补跨来源 identity_map 和字段级 provenance。

观测指标唯一映射率、关键字段完整率、过期事实使用次数。 [[C02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C02) [[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06) [[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

场景 03 / 素材与上架

### 事实先行，素材与发布分离

创作可以自动化，发布必须看渠道能力、品牌规范与明确授权。

已核验商品事实 → Canva/Figma 素材 → 规则校验 → 审核 → 官方发布 → 读回

**触发条件**
新商品准备、已批准活动排期、素材版本更新。

**依赖事实**
规格、禁用表述、品牌模板、图片版权、类目属性、资质和站点语言；渠道当前 schema 由适配器验证。

**建议自动化范围**
生成文案、尺寸变体、图片素材及差异预览；已获审批的低风险版本可进入受控发布队列。

**人工与业务边界**
首次上架、资质/功效宣称、品牌授权、大批量变更；没有发布 API 权限时只交付草稿。

**验收与恢复**
异步导出成功 ≠ 发布成功；保存素材 hash、平台返回 ID，读回可见状态与内容版本。失败不盲目新建重复 Listing。

**对应项目落点**
content-growth-studio / product-digital-twin 从 guided 升级；Canva 企业许可单独验收。

观测指标事实错误率、一次审核通过率、重复 Listing 数与发布回执完整率。 [[S09]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S09) [[S10]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S10) [[S11]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S11) [[S05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S05) [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)

场景 04 / 订单与履约

### 订单事件不是立即发货指令

将平台状态翻译成真正的履约条件，库存和仓库执行由已有 ERP/WMS 掌握。

事件入库 → 订单详情刷新 → 状态/hold 校验 → WMS 任务 → 发货回传 → 结果核验

**触发条件**
授权订单状态变化或定期漏单补采；同一订单多个事件只刷新最新有效事实。

**依赖事实**
主子订单、行项目数量、取消/售后状态、预售/hold、库存占用、包裹、承运商和隐私受控地址引用。

**建议自动化范围**
同步数据、准备履约任务、检测拆单/部分发货差异、提醒超时；已批准动作依赖稳定业务幂等键。

**人工与业务边界**
缺货替换、改地址、无法确认的发货、异常包裹；涉及支付、结算和退款执行一律不在本方案范围。

**验收与恢复**
订单刚取消时不发货；重复通知不重复创建出库；超时未知先查 WMS/平台结果，再决定是否重试。

**对应项目落点**
新增订单/履约适配，复用 Task/Run/租约；不复用通用只读浏览器去执行发货。

观测指标漏单差异、重复出库次数、待履约超时、不可判定动作年龄。 [[S04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S04) [[S01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S01) [[E07]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E07)

场景 05 / 库存与补货

### 先统一可售口径，再谈预测

渠道库存、在库数量、已占用、残次品和在途不是可以直接相加的数。

仓库快照 → 可承诺量 → 渠道差异 → 缺货/积压预警 → 补货建议

**触发条件**
库存或订单变更，以及按业务时效安排的定期复核。

**依赖事实**
以商家确认的 WMS/ERP 字段为权威：on-hand、已占用、不可售、在途和安全缓冲；避免重复扣减已含占用的 available 字段。

**建议自动化范围**
计算口径一致的预警、交期区间和需求情景；限制无证据预测。小范围库存回写需另行开放写适配与审批。

**人工与业务边界**
采购承诺、供应商变更和安全库存策略；高波动或数据过期时不能自动扩大库存承诺。

**验收与恢复**
同 SKU 多仓、多渠道同时售卖、取消释放占用、到货延期和盘点修正均能一致解释。

**对应项目落点**
demand-inventory-procurement 当前 guided；先复用已有 ERP/WMS，不新造库存账本争写。

观测指标库存同步差异、缺货预警提前量、预测区间覆盖、过期库存占比。 [[S17]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S17) [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01) [[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

场景 06 / 客服与售后

### 让答案可信，也让发送可控

热路径由客服处理，缺数据则派给数据/FDE 专家修复，不必每条消息召开专家会议。

新入站消息 → 会话去重 → 绑定商品/订单 → 有来源草稿 → 策略/人工 → 发送核验

**触发条件**
经过标准化的买家入站事件；过滤自己发出的消息、内部备注和已被新消息替代的事件。

**依赖事实**
最新会话状态、商品身份、库存/订单时效、有效售后政策与人工接管状态。

**建议自动化范围**
事实检索、回复草稿、意图分类、内部备注与数据修复任务；当前模板仍是 shadow/copilot。

**人工与业务边界**
争议、无法确认的事实、敏感承诺和真实发送授权；未来低风险自动回复须新增执行策略与验收，不能只改提示词。

**验收与恢复**
发送前重新核对最新消息、商家/会话、人工接管及授权；网络超时标记 unknown，先查平台记录，不直接重发。

**对应项目落点**
复用 customer-service、专用通道、delivery reconciliation；补业务问答评测，不把配置 hash 检查当答案正确。

观测指标错误事实率、人工采用/修改率、首次有效响应、重复发送与转人工原因。 [[S18]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S18) [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01) [[E02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E02) [[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06)

场景 07 / 退货与 VOC

### 把售后问题变成改进任务

售后流程继续覆盖，但任何资金返还、赔付和调账执行均被排除。

已授权反馈/退货原因 → 去标识聚类 → 根因候选 → 改进任务 → 样本复核

**触发条件**
新售后记录、质量反馈或积累到足够样本；可与周期性复盘合并。

**依赖事实**
商品批次、规格、物流阶段、问题描述、附件授权与结果；同一事件的多条沟通不能重复计数。

**建议自动化范围**
整理证据、区分产品/说明/物流/使用条件问题，生成客服政策或商品资料改进草稿。

**人工与业务边界**
质量结论、召回、责任认定、政策更改；退款与补偿交由商家已有合规流程，不调用财务接口。

**验收与恢复**
样本抽查分类正确，改进有负责人/截止条件；以同类样本和时间窗比较，不把相关性说成因果。

**对应项目落点**
returns-voc-loop 当前 guided；复用任务、知识版本和协同审批。

观测指标原因归类覆盖、重复问题率、改进完成率与客诉升级率。 [[S18]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S18) [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)

场景 08 / 内容与增长

### 用实验组织运营，不做无边界投放

本方案聚焦内容与运营实验，不接入广告账户扣费、预算调整或财务数据。

目标人群假设 → 内容版本 → 审核排期 → 授权渠道发布 → 一致窗口复盘

**触发条件**
已批准活动计划、渠道表现变化或足够的新样本。

**依赖事实**
素材版本、曝光/点击/咨询等获准指标、统计窗口、归因定义与渠道数据覆盖。

**建议自动化范围**
素材变体、日历草稿、指标聚合、异常识别和实验复盘；不承诺跨平台用户完整归因。

**人工与业务边界**
品牌/广告合规、对外发布和预算决策；不生成虚假评价、不批量骚扰、不规避平台限制。

**验收与恢复**
使用相同指标定义和时间窗；部分渠道未同步时显示覆盖率，避免把不同口径点击数当同一个漏斗。

**对应项目落点**
content-growth-studio 当前 guided；素材、日历与日报经独立适配组合。

观测指标素材采用率、有效咨询率、实验样本量与口径完整率。 [[S09]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S09) [[S13]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S13) [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)

场景 09 / 会员与协同

### 先确认同意，再安排触达

客户识别遵循店铺和用途边界；跨系统协作不应变成无授权用户画像。

合法会员来源 → 同意/用途检查 → 频控 → 待审触达或负责人任务 → 回执

**触发条件**
用户主动订阅、授权旅程事件或人工批准的服务提醒。

**依赖事实**
明确的会员身份、同意来源/时间/用途、退订状态、触达频次与渠道权限；通讯录不替代同意记录。

**建议自动化范围**
生成内容草稿、检查频控/退订、解析供应商或内部负责人，必要时创建日历/待办。

**人工与业务边界**
跨用途使用、陌生营销、敏感客群策略与批量外发；收件人歧义必须停止，而不是选相似名字。

**验收与恢复**
退订后不再触达；删除请求传播到缓存/检索；同名不同店铺用户不会合并。

**对应项目落点**
member-lifecycle 当前 guided；Gmail/Contacts/Calendar 与现有 CRM 依用途接入。

观测指标未经同意触达为零的验收目标、退订传播时延、负责人解析准确率。 [[S12]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S12) [[S13]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S13) [[S14]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S14) [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)

场景 10 / 日报与巡检

### 每天交付结论、证据和下一步

日报不是多张表拼接，而是经过口径核验的异常清单与行动交接。

定时唤醒 → 低成本拉取/聚合 → 质量检查 → 异常摘要 → 工单 → 次日复核

**触发条件**
商家指定的经营时区和排班；数据变化或故障事件另行触发，不让所有店铺整点拥塞。

**依赖事实**
每个指标的店铺范围、时间窗、去重键、单位、分母、最后同步与缺失渠道；库存是时点值，订单是区间值。

**建议自动化范围**
确定性聚合后才让模型解释异常；相同问题沿用稳定 ID，跟踪责任人和处理结果，避免每天新建重复工单。

**人工与业务边界**
需要经营决策的事项清楚列出备选项与证据；资料不足时报告未知，不编造统计。

**验收与恢复**
抽样能回到原始记录；断网补采后重算，报告注明修订；不得把部分同步结果标成全量。

**对应项目落点**
复用 Timer、运行账本和跨回合工作区；daily-commerce-operator 模板仍 guided，不重复造 Agent 调度器。

观测指标数据新鲜度、异常关闭率、重复工单率、日报覆盖率与修订次数。 [[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01) [[E03]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E03) [[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06) [[S02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S02)

05 / REFERENCE ARCHITECTURE

## 补三条链路， 复用一个控制层。

事实链、事件链、动作链连接现有专家、方案工厂与 Task/Run。首期继续模块化单体和现有数据库，不因“Agent 架构”引入一整套微服务、图数据库或第二个调度引擎。下图是建议架构。

EXTERNAL外部系统

店铺官方 API / 现有 ERP & WMS / 客服系统 / 设计、文件与协作平台

保留事实与执行权威源。每个接口单独验权；平台要求的执行区域与敏感数据规则优先。[[S04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S04)

ADD / ADAPT事件接入层

Webhook / 消息队列 / 订阅续约 / 受控增量采集 → Durable Inbox

校验来源与签名，写入持久收件箱再确认接收；解析、去重、乱序处理和缺口补采由确定性代码执行。

ADD / EXTEND业务事实层

身份映射 + 字段来源 + 时效/覆盖质量 + 变更检测

复用 product-catalog，按需扩展订单/履约事实。先解释“这是哪件商品、哪个时点、哪些店铺的数据”。

REUSE经营控制层

目标/约束 → 专家与方案工厂 → Timer / Task / Run / Attempt

持续的是状态，不是无限长对话。事件唤醒任务；确定性规则先分流，再给模型明确的待判断问题。[[E06]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E06)[[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

ADD / HARDEN受控执行层

Policy Gate → Action Outbox → 固定版本 Adapter → Receipt → Read-back

执行前重验授权、对象租约、限额和最新状态。超时不等于失败；未知结果进入核验队列，不重新执行。

CROSS-CUTTING监控与恢复

链路追踪 / 数据质量 / 业务 SLA / 权限告警 / 人工决策 / 修复发布

配置回滚只影响后续执行，不能撤销已发消息或真实出库；外部补偿动作需要独立授权和验证。

#### 云端：持续服务，不依赖聊天窗口

在允许的区域部署 HTTPS 入口、持久 worker、授权服务与监控。复用现有模型网关；生产凭据保管在受控服务，不放前端页面。

#### Desktop：授权边缘执行器

浏览器凭据留本地。检查设备心跳、页面漂移与登录状态；机器休眠不能声称实时监听。扩大商家数量前先验证隔离，不默认复用一个 Global Profile。[[E05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E05)

### 事件怎么才算“可靠”？

- 

通知是唤醒信号，不是唯一事实来源。

Shopify、Amazon 和 Google 文档都有通知不完整/延迟或备用获取说明。收到变化后读详情，按游标补采，不能把通知数量当订单数量。[[S02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S02)[[S03]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S03)[[S12]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S12)

- 

传输去重与业务幂等分开。

Inbox 唯一键包含租户、平台、店铺、订阅与来源交付标识；动作键绑定业务对象与意图版本。即使来源发来不同通知，同一履约意图不能执行两次。具体来源 ID 语义按平台适配。

- 

把提交边界写进事务。

落库才 ACK；业务状态与待发送 Outbox 同事务提交。现有完成事件仍可作进程内提示，但消费者从持久记录恢复。所查通知路径本身不是持久消息总线。[[E04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E04)

- 

重复、乱序、崩溃都是正常输入。

按来源版本或业务修改时间拒绝旧覆盖；无法比较时刷新当前状态。保留重叠增量窗口、分页断点、退避和随机抖动。权限拒绝不无限重试，空数据不静默解释为零。

- 

恢复先核验，再继续。

采用至少一次交付加业务幂等，不宣传跨平台端到端 exactly-once。unknown 不自动重放；死信按原因修复后授权重放，沿用业务身份并再次核验。

### 汇总不是堆数据，而是建立可信口径。

#### 一条事实至少带什么？

商家/店铺、平台对象 ID、确认的内部映射、字段/单位、来源记录、采集时间、业务有效时间、覆盖范围、缺失原因和证据引用。

“没查到”“无权限”“已过期”“未上架”“真实冲突”分别返回。名称只能召回候选，不能直接确立身份。

#### 一项指标如何解释？

分子/分母、去重键、时区与半开时间窗、店铺范围、水位、未覆盖渠道、修订版本。对比前统一口径。

库存是时点快照；订单/咨询是区间事件。商品、变体、订单行和包裹不能用同一个 count 代替。

不能把“3 店中 2 店已同步”写成“全店汇总”。

报告应写“截至当前水位，覆盖已同步的 2/3 店铺”；缺失店铺单列原因。本例为说明口径的假设，不是读取了你的店铺数据。

06 / CONTROLLED AUTO-INTEGRATION

## 自动接入的产物， 是一份可验收的能力合同。

FDE 应发现能力、生成可复用适配、产出验证证据，而不是每次临时现场发挥。复用已有 Registry、包校验和发布治理，新增环节在此均为建议。[[E05]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E05)[[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

- 

盘点：从经营目标到系统清单。

识别商家、店铺、地区、ERP/客服系统、对象与时效。先找健康授权连接；缺系统时给方案，不默默注册新账号。

- 

验权：不试探越权接口。

核对应用资质、套餐、scopes、对象范围、区域与开发/商用许可。保留撤销和续约机制；需登录或平台审核时进入 waiting_auth。

- 

选路：官方能力优先。

官方 API/SDK → 已有系统 API → 已发布 MCP/受控 CLI → 平台允许的只读浏览器 → 明确的导入/人工步骤。网页可见不代表允许自动写入。

- 

探测：验证数据语义，不只 HTTP 状态。

检查身份、分页、字段覆盖、时效与单位；用目标商品/订单核对。HTTP 200、空表、旧缓存或截图都不能单独证明接入成功。

- 

固化：生成最小能力合同。

声明 effect、权限、输入输出 schema、允许域名、限流/重试、幂等、read-back 与失效条件。生成代码需审查依赖、外传和权限；不直接运行社区未知脚本。

- 

验证：契约 → 商家场景。

Schema → 脱敏回放 → 测试账号 → 真实只读抽样 → shadow → 获批小范围写入。加入重复事件、过期授权与未知回执负例。

- 

发布：候选 → 灰度 → 晋级。

固定包 hash 与运行合同，限制店铺与动作数。错配、权限扩大或回执异常立即熔断；不原地修改生产 Skill 来“自愈”。

- 

运营：维护能力健康。

订阅到期、授权失效、字段漂移、空结果与套餐变化均可使能力降级。修复产生新候选；暂停受影响动作，其他安全流程继续。

#### PROPOSED CONTRACT / 设计示例，非当前 API

```json
{
  "capability": "commerce.product_facts.read",
  "status": "proposed_not_implemented",
  "scope": [
    "tenant",
    "shop",
    "product_or_variant"
  ],
  "effect": "data.read",
  "transport": "official_api_or_approved_read_adapter",
  "quality": [
    "identity",
    "provenance",
    "freshness",
    "coverage"
  ],
  "failure": [
    "needs_auth",
    "stale",
    "ambiguous",
    "rate_limited"
  ],
  "release": {
    "version": "candidate",
    "writes": "deny"
  }
}
```

[保存能力合同示例 ↗](./capability-example.json) · 仅用于设计讨论，不能作为现有 Broker 命令执行。

07 / FAILURE LAB

## 能停下来、能恢复， 才有资格自动运行。

选择一个故障，查看建议控制链如何处理。事件、对象和计数都是合成数据；没有请求店铺 API、发送消息或调用模型。

### 经营事件回放台

确定性演示 · 不代表现有后端已实现这些策略

SYNTHETIC DATA / NO LIVE CALLS

READY请选择故障并运行演示。

#### 本轮模拟结果

**输入交付次数**
0

**独立业务任务**
0

**已核验外部动作（模拟）**
0

**被阻止的重复/风险动作**
0

**任务状态**
idle

不把未知当成功，不把失败当成重试许可。

这里只验证报告的分支逻辑。生产仍需持久化、真实平台查询能力与账号级验收；找不到权威结果时必须保持 unknown 并转人工。

08 / OBSERVABILITY & RESPONSE

## 系统在线， 不代表业务在正常运转。

看板同时回答：连接健康吗、事实新鲜吗、动作完成了吗、问题解决了吗？下面的指标与阈值是建议，不是当前测量值。

SOURCE

#### 连接与数据

授权/订阅剩余时间、采集水位、分页覆盖、空表突变、Schema 漂移、设备心跳、每店限流与补采积压。

RUNTIME

#### 事件与执行

Inbox 延迟、队列年龄、租约回收、死信、去重、unknown 年龄、模型调用量、暂停后仍执行的动作数。

BUSINESS

#### 事实与结果

错误 SKU/过期事实使用、重复出库/发送、订单覆盖、履约超时、人工采用率、接管原因与异常关闭率。

### 故障要有处理责任，不全部丢给用户。

 | 故障 | 先自动做什么 | 谁接手 / 何时恢复

 | 401 / 授权失效 | 在许可内续约；失败停止相关动作，不反复试密码或绕验证。 | 账号管理员重新授权；只读探针与 scope 核验通过。

 | 429 / 配额不足 | 遵循退避/Retry-After，降频、合并、每店公平调度，不换账号绕限制。 | 连接负责人调整策略；证明积压可在业务窗口内清理。[[S11]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S11)

 | 字段 / 页面漂移 | 隔离异常数据，记录脱敏证据，创建修复候选，不静默填默认值。 | FDE / 工程完成合同与真实样本测试后灰度。

 | 商品不匹配 | 拒绝错误事实，生成映射/补全任务，不猜价格、库存和规格。 | 数据专家修复；歧义由商家确认，随后重验仍有效的业务任务。

 | 外部动作 unknown | 冻结同意图再次执行，查平台记录或回执。 | 执行负责人确认结果；查不清则保持 unknown，人工判断。

 | 设备离线 / 崩溃 | 标记 degraded 与水位；持久保留事件，恢复后补采。 | 运维复核心跳、游标、积压与事实；不只看进程启动。

#### 建议首批告警目标

把重复真实发送/出库作为零容忍验收项；超过约定数据时效即降级。unknown 的告警窗口可先讨论 15 分钟，再按业务确认，这不是平台 SLA。

先记录基线再定每个来源的 SLO。Webhook 接收耗时小于平台期限，模型不占用 ACK 热路径。[[S01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S01)

#### 贯穿全链路的证据

trace → tenant/shop → event → fact refs → Task/Run/Attempt → policy → action → receipt → read-back

日志脱敏、权限分离、备份恢复要测试。配置回滚与外部业务补偿分别治理，不把一键回滚说成撤回所有动作。

持续工作不等于持续调用模型。

假设 5 店 × 12 类检查 × 每 5 分钟一次，即便每次仅一请求，也有 17,280 次请求/天，分页还会增加。先批量/增量、规则去噪和按对象合并，再调用模型。这是量级假设，不是你的实际使用量。

09 / DELIVERY GATES

## 先证明一个闭环， 再复制到更多店铺。

建议以约 90 天为规划窗口，不是交付承诺。是否推进取决于授权、样本、工程资源与验收；平台审核可能是关键路径，日期不能替代门槛。

PHASE 01 / ACCESS & TRUTH

### 盘点与只读基线

选择业务价值最高的一店，核验官方授权或已有允许的只读连接；确认商品/订单字段、隐私与覆盖。

交付连接清单、SKU 映射、指标字典和日报样例。用当前 PDD 历史证据作测试线索；有跨境需求及账号时，可选 Shopify 作官方 API 对照。

晋级门槛：事实可回源，覆盖与时效可解释，无未知权限，无外部写。

PHASE 02 / DURABLE OBSERVATION

### 持续监听与恢复

实现事件 Inbox、续约、补采、质量检查；日报与客服草稿进入 shadow。模型只处理新工作。

演练重复/乱序、崩溃、离线、过期授权；复用 Task/Run 与 Timer，不创建第二套调度。

待执行验收：建议连续 72 小时只读观察；恢复后无不可解释的事件缺口和重复工单。

PHASE 03 / ONE CONTROLLED ACTION

### 只开放一类低风险动作

优先内部工单、知识草稿或已批准客服发送之一；真实外发需明确授权和独立写适配。

补策略门、Outbox、最新状态重验、unknown 核验与暂停。模型输出不能直接调用生产写接口。

待执行验收：建议连续 7 天小范围试点；重复副作用为零，未知结果已解释，接管可用。

PHASE 04 / REPEATABLE OPERATIONS

### 复制能力，不复制临时脚本

第二店、第二平台复用能力合同与测试；扩展库存、素材、履约及协同。

建立维护与值班责任。先解决多租户、Global Profile 限制、数据驻留，再扩大并发。

规模化门槛：每店隔离、限流和恢复合格；新增平台有经营收益，维护负担可承担。

### 落到 online-agent：优先改这些位置。

 | 交付优先级 | 复用与建议扩展位置 | 核心验收

 | P0 · 能力准入 | src/connector/ + 本地 FDE / 包治理

扩展用途、对象 scope、时效/覆盖及验证方式。

 | 真实探针、权限负例、回执归属与版本一致；不靠平台名匹配工具。

 | P0 · 商品事实 | src/product-catalog/ + 客服事实消费

新增确认映射与字段级来源服务。

 | 异类商品、同名 SKU、单位变化、过期/缺失、跨店串数据。

 | P0 · 持久事件桥 | src/task/ / src/connector/ / Timer

新增 Inbox/Outbox 与恢复 worker，复用运行租约。

 | 提交/ACK 边界、崩溃、重复、游标分页与积压恢复。

 | P0 · 业务评测 | src/solution-factory/solution-evaluation.service.ts

保留结构校验，另加业务场景评测。

 | 结构通过但商品错误仍拒绝；shadow 不发送；负例真正执行。

 | P1 · 动作治理 | src/customer-service/ + 专用适配

策略门、固定 schema、Outbox 与读回。

 | 新消息、接管、授权撤销、unknown、重复回调、暂停竞态。

 | P1 · 团队与运维 | src/runtime/ / src/expert/

验证 managed/本地路径的角色与上下文继承。

 | 交接有任务身份与产物；成员 Skill 合并不能等同独立团队协作已完成。[[E08]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E08)

优先投入接入和验证，不是新框架。

明确四类责任：商家运营确认口径/授权；集成工程维护平台适配；平台工程负责持久执行/隔离；测试运维负责故障演练/值班。小团队可兼任，但授权和结果复核不能无人负责。没有真实账号，不给确定的全自动覆盖率。

10 / AUTONOMY WITH BOUNDARIES

## 自治等级应写进代码， 不只写在提示词里。

当前客服模板仅支持 shadow / copilot；后两级是演进建议，需新增策略、通道与真实场景验收。[[E01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E01)[[E02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-E02)

 | 等级 | 允许内容 | 门槛

 | L0 · shadow | 读取、影子决策、观察与异常记录；无方案业务外部写。 | 账号授权、来源与质量、敏感数据保护。

 | L1 · copilot | 草稿、差异与证据；人通过受控路径批准发送或变更。 | 明确对象/内容、授权范围、人工接管和回执。

 | L2 · 有限自治

建议，非当前已支持

 | 仅执行获批白名单、限额内且可核验的动作。 | 业务评测、状态重验、幂等、unknown 核验与熔断。

 | L3 · 持续优化

建议目标，非无限自治

 | 发现问题、产出修复候选、测试、批准后灰度复盘。 | 不自扩权限、不绕审核、不原地改生产；外部不可逆结果单独处理。

### 数据不是指令

网页、买家消息、邮件、文档都可能携带恶意指令。工具权限、发送对象和允许域名由代码控制；材料里的文字不能授予执行权限。

### 最小必要数据

按商家、店铺和目的隔离；日志脱敏，保留/删除策略传播到缓存与检索。跨境及平台指定运行环境逐项核验，不用一套云存储通吃。[[S04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S04)

### 不把规避当能力

不绕验证码、不伪装授权、不换账号绕限流、不批量骚扰、不刷单刷评。平台不开放的功能保留人工步骤。

### 排除财务系统

不接银行、结算、利润核算、流水、支付、退款执行和广告扣费。售后可做工单/原因分析，资金动作不作为 Agent 可调用能力。

11 / WHAT THE FIELD TAUGHT US

## 从真实问题里， 提炼可执行的设计判断。

社区发现失败方式，官方合同界定平台行为；历史帖不冒充最新规则。以下为原始问题或官方社区公告，不是故障频率统计。设计结论是本报告推论。

SHOPIFY COMMUNITY / 2025.04

### 重复通知暴露提交边界。

开发者报告重复 Webhook 及处理耗时问题。结合官方说明，不能等模型完成才应答。[[C01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C01)[[S01]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S01)

推论：持久化后 ACK，模型与动作异步；传输/业务分别去重。

SHOPIFY COMMUNITY / 2026.09.02

### SKU 文本不应是全球主键。

开发者提出同店 SKU 唯一约束问题。跨渠道同名和人为修改应进入映射治理。[[C02]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C02)

推论：平台对象 ID + 店铺作用域 → 已确认内部商品，不按相似名字合并。

CANVA OFFICIAL COMMUNITY / 2026.05 & 09

### 能开发不等于能商用。

Autofill 企业门槛与 SDK 弃用公告提示许可、应用形态和版本也是接入依赖。[[C03]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C03)[[S20]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S20)[[S09]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S09)

推论：能力登记许可/版本失效条件，不能把开发试用宣传为客户可用。

STACK OVERFLOW / 历史案例，现行文档复核

### watch 不是无限模型循环。

Gmail 原始问题将订阅误解为循环轮询；现行官方文档说明 Pub/Sub、历史增量与续约。[[C04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-C04)[[S12]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S12)

推论：确定性服务维护订阅，有业务变化才唤醒经营任务。

淘宝的经验文档比“万能自动化”宣传更接近运营现场。

官方讨论交易类型漏单、可变时间分页、延迟更新与断连补采。这提醒系统必须理解业务对象与平台语义，而不是只把 JSON 搬进数据库。[[S04]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S04)

12 / EVIDENCE REGISTER

## 每个判断， 都有来源与适用边界。

收录 33 条证据，包括公开资料、原始社区讨论与源码/历史报告。部分平台只取得摘要或入口，限制被明确保留。代码仅列路径级定位，不公开私有源码、业务回执或账号数据。

33 / 33 条证据

S01

#### [Shopify · Verify webhook deliveries ↗](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)

签名、快速应答、重复交付、重试与补偿同步的依据。平台规定不等于昭回已实现。

官方正文已读取 · 访问 2026-09-14

S02

#### [Shopify · About webhooks ↗](https://shopify.dev/docs/apps/build/webhooks)

事件不保证顺序与完整交付；应定期同步恢复缺失数据。新的 Events 预览不能直接视作生产基线。

官方正文已读取 · 访问 2026-09-14

S03

#### [Amazon SP-API · Notifications API ↗](https://developer-docs.amazon/sp-api/docs/notifications-api)

卖家/供应商通知类型、目的地与订阅机制；官方建议在通知延迟或中断时具备备用数据获取方案。

官方正文已读取 · 访问 2026-09-14

S04

#### [淘宝开放平台 · 订单同步场景 ↗](https://open.alitrip.com/docs/doc.htm?articleId=1029&docType=1&treeId=1)

主子订单、特殊订单 hold、历史初始化、增量消息与漏单补采。敏感订单字段有专门运行环境与安全要求，不能默认复制到任意云端。

官方正文已读取 · 更新 2025-09-30；访问 2026-09-14

S05

#### [抖店开放平台 · 消息推送问题文档 ↗](https://op.jinritemai.com/docs/question-docs/1553)

索引显示消息需要对应权限包；未核验本商家的应用资质、可订阅 topic、回调签名和限流配额。不得作为已接通证明。

仅官方索引摘要；正文为动态页面 · 检索 2026-09-14

S06

#### [小红书开放平台 · 电子面单对接说明（新） ↗](https://open.xiaohongshu.com/document/developer/file/295)

可见应用注册、订单接口权限包、店铺授权步骤；只支持对商家电商接入门槛的判断，不证明通用笔记发布接口开放。

仅官方索引摘要；正文获取超时 · 检索 2026-09-14

S07

#### [京东宙斯开放平台 · 官方入口 ↗](https://jos.jd.com/)

本次没有取得足够的具体授权文档，不承诺订单、仓储或客服接口对目标账号可用。作为后续准入调查入口。

入口级核验；详细能力待账号验证 · 检索 2026-09-14

S08

#### [TikTok Shop Partner Center · 官方入口 ↗](https://partner.tiktokshop.com/)

后续需逐站点核实应用审核、商家授权、API 版本、事件和履约能力。不能从抖店国内授权推导跨境授权。

入口与索引可见；详细条款未完整核验 · 检索 2026-09-14

S09

#### [Canva Connect APIs · Autofill guide ↗](https://www.canva.dev/docs/connect/autofill-guide/)

品牌模板字段、异步任务与导出链路；Autofill/Brand Templates 的 Enterprise 使用门槛，开发试用不等于客户商用许可。

官方正文已读取 · 访问 2026-09-14

S10

#### [Figma REST API · Webhooks ↗](https://developers.figma.com/docs/rest-api/webhooks/)

按可访问团队/项目/文件订阅事件；文件版本、评论等变更可进入审核流程。不能据此推导任意服务端画布编辑能力。

官方正文已读取 · 访问 2026-09-14

S11

#### [Figma REST API · Rate limits ↗](https://developers.figma.com/docs/rest-api/rate-limits/)

限流与调用者席位、接口层级、资源所属套餐相关；需要缓存、事件驱动和 Retry-After 处理。

官方正文已读取 · 规则变更 2025-11-17；访问 2026-09-14

S12

#### [Google Gmail API · Configure push notifications ↗](https://developers.google.com/workspace/gmail/api/guides/push)

Pub/Sub 通知带 historyId，随后拉取变更；watch 至少每七天续约，官方建议每日续约；通知可能延迟/丢失。

官方正文已读取 · 更新 2026-09-10；访问 2026-09-14

S13

#### [Google Calendar API · Push notifications ↗](https://developers.google.com/workspace/calendar/api/guides/push)

资源级 HTTPS 通知、不含变更正文、channel 到期需重建，通知不保证全部送达。

官方正文已读取 · 更新 2026-09-11；访问 2026-09-14

S14

#### [Google People API · Read Profiles ↗](https://developers.google.com/people/v1/profiles)

按授权读取人员字段的官方参考；本报告将联系人限定为负责人/供应商的解析线索，不把联系人记录当作营销同意。

官方正文已读取 · 访问 2026-09-14

S15

#### [NocoBase · Workflow: Webhook 插件 ↗](https://docs.nocobase.com/plugins/%40nocobase/plugin-workflow-webhook/)

Webhook 插件为 Professional Edition+，非默认内置启用。不能把社区版已有工作流等同于所有扩展可用。

官方文档正文/索引已读取 · 访问 2026-09-14

S16

#### [NocoBase · Webhook trigger ↗](https://docs.nocobase.com/workflow/triggers/webhook)

具体触发器文档写明 POST 与同步/异步执行方式；集成总览与具体文档表述不完全一致，应以实际版本合同测试为准。

官方文档正文/索引已读取 · 访问 2026-09-14

S17

#### [Odoo 19 · Reordering rules ↗](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment/reordering_rules.html)

摘要支持预测库存与上下阈值的补货思路。本报告不据此断言你已安装 Odoo 或已开通其外部 API。

官方摘要可读；完整页面超时 · 检索 2026-09-14

S18

#### [Chatwoot · Conversation infrastructure APIs & Webhooks ↗](https://www.chatwoot.com/use-cases/conversation-infra)

客服会话与消息 API、事件集成及中断后的补采边界；用作既有客服系统对接参照，不建议平行重建客服底座。

官方正文已读取 · 访问 2026-09-14

S19

#### [GitHub Docs · What is GitHub Pages? ↗](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

Pages 是静态站点托管。本报告可部署在此，生产 Webhook、模型、数据库与密钥不可托管在页面中。

官方正文已读取 · 访问 2026-09-14

S20

#### [Canva 官方开发者社区 · 移除弃用的 Apps SDK API ↗](https://community.canva.dev/t/we-are-removing-support-for-deprecated-apis-in-the-apps-sdk/8884)

作为接口生命周期变化的近期证据；Apps SDK 与 Connect API 必须区分，不能直接互换权限和执行形态。

官方社区公告；正文已读取 · 发布 2026-09-09；访问 2026-09-14

S21

#### [拼多多开放平台 · 官方准入调查入口 ↗](https://open.pinduoduo.com/)

不据此声称客服发送、消息订阅或任意商家数据接口已开放。当前试点结论仅来自本地代码与历史只读证据 E05/E06。

本次未取得足够可读的官方准入正文 · 检索 2026-09-14

C01

#### [Shopify Developer Community · Duplicate Webhook Received ↗](https://community.shopify.dev/t/duplicate-webhook-received/14148)

发帖者遇到重复事件及处理耗时问题。作为失败场景来源，不作为故障发生率统计，精确重试规则以官方文档为准。

原始开发者问题；与 S01 交叉核验 · 讨论始于 2025-04-24；访问 2026-09-14

C02

#### [Shopify Developer Community · Enforce unique SKU validation ↗](https://community.shopify.dev/t/how-can-i-enforce-unique-sku-validation-across-all-products-variants-in-shopify/37370)

开发者提出 SKU 唯一性校验难题，提示跨平台身份治理不可只依赖可编辑的 SKU 文本。

原始开发者需求；不是正式接口保证 · 发布 2026-09-02；访问 2026-09-14

C03

#### [Canva 官方开发者社区 · Autofill Enterprise 门槛 ↗](https://community.canva.dev/t/autofill-api-now-gated-to-enterprise-with-a-limited-trial-for-integrations-under-development/8709)

开发阶段试用与企业正式使用条件不同；接入可行性必须把商业授权作为前置依赖。

官方社区公告；与 S09 交叉核验 · 发布 2026-05-20；访问 2026-09-14

C04

#### [Stack Overflow · How to properly watch for Gmail push notifications ↗](https://stackoverflow.com/questions/67057438/how-to-properly-watch-for-gmail-push-notifications)

问题将 watch 误解为无限循环轮询。用于说明订阅生命周期管理与模型持续推理是两回事，不复制其过宽权限示例。

原始问题；现行规则以 S12 为准 · 提问 2021-04-12；历史案例，访问 2026-09-14

E01

#### 当前模板目录：9 个非财务模板，2 executable / 7 guided

排除 profit-risk-cockpit；可执行为 commerce-diagnostic 与 customer-service-command-center。客服仅 shadow/copilot，外部写默认拒绝。

online-codex-server/data/ecommerce-solution-templates.v1.json

当前工作树已核对；不是生产验收 · 源码读取 2026-09-14

E02

#### 方案评测：结构检查不等于业务正确

校验 schema、依赖闭包、授权隔离、接管配置、配置 hash 与应用版本；这条路径没有实际 SKU 问答准确性检验。

online-codex-server/src/solution-factory/solution-evaluation.service.ts:18–140

当前工作树已核对 · 源码读取 2026-09-14

E03

#### 本地 Listener：当前通用来源仅 workspace_files

已有 durable events、record_only、重试/死信与自动化目标；不代表所有电商 Webhook 已接入。当前聊天回合空闲后才推进新自动化回合。

online-codex-desktop/resources/builtin-skills/zhaora-listener-manager/SKILL.md:16–79

当前工作树已核对 · 源码读取 2026-09-14

E04

#### 服务端任务与连接器完成通知：进程内事件路径

分别使用 RxJS Subject 与内存 listener Set；这些通知路径本身不足以承担崩溃后持久业务唤醒，不否认其他执行表已持久化。

online-codex-server/src/task/task-completion-events.service.ts:13–20；src/connector/connector-operation-events.service.ts:8–21

当前工作树已核对 · 源码读取 2026-09-14

E05

#### 浏览器与 FDE 边界：单 Global Profile、凭据本地、只读连接器

浏览器 R3 单 Global Profile、Agent 页面所有权隔离；FDE R1 data.read，写 effect fail-closed。Cookie、Profile 与验证材料不得传给模型/云端。

AGENTS.md：内置浏览器能力 / FDE 黑盒浏览器连接器

当前仓库规则；非多店铺实测 · 当前规则读取 2026-09-14

E06

#### 历史 Agent Loop 验证：真实快照、两轮定时复核

同一真实平台快照的两轮业务复核和暂停记录；明确不代表每轮新采集、真实 Listener 事件、实际客服发送或长期无人值守已验收。

docs/research/ecommerce-agent-loop-capability-verification.md

历史报告；本次未重跑 · 报告实验 2026-09-09；读取 2026-09-14

E07

#### 已有连接操作账本、租约、幂等及协同系统路径

存在持久操作、skip_locked、租约、幂等键，以及 Feishu / DingTalk provider 处理。代码存在不等于某个账号连接已健康。

online-codex-server/src/connector/connector-operation.service.ts:58–93,195–235,313–374

当前工作树已核对；未操作真实账号 · CodeGraph 定向探索 + 当前源码读取 2026-09-14

E08

#### 既有 Agent Loop 提案与统一自动接入目标架构

复用现有 runtime、Task/Run、Timer，补经营目标、事实绑定与持久事件。较早多 Profile 等表述以当前 E05 规则为准。

docs/research/ecommerce-agent-loop-proposal.md；docs/architecture/unified-agent-platform-and-auto-integration-architecture.md

方案文档；非实现证明 · 文档 2026-09-09 / 2026-07-22；读取 2026-09-14

没有匹配的证据。请调整关键词或类型。

访问/读取基准：2026-09-14。生产实施时应再次核验平台规则、账号授权和版本。本次未复跑真实商家业务验收。

THE NEXT RIGHT STEP

## 先让一个真实问题被持续解决， 再让更多流程放心交给昭回。

建议起点：一店、一条可信事实链、一份能回源的日报、一类客服草稿。把中断、歧义和权限不足处理好，比做更多“成功演示”重要。

[保存文字研究稿 ↗](./research.md)[查看报告仓库 ↗](https://github.com/tbtnb/zhaohui-commerce-blueprint)[返回顶部 ↑](#top)

本网站是独立静态说明与合成演示。GitHub Pages 不运行电商服务；Webhook、数据库和后台执行需另行部署。[[S19]](https://tbtnb.github.io/zhaohui-commerce-blueprint/#source-S19)
