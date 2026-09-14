// Each scene has a distinct business operation, props and motion cue.
// Geometry is reused where the underlying business action is the same.
export const ART = Object.freeze({
 sort:['list','先按轻重缓急排好','上移急事，保留以后再办的事','reorder'],
 trace:['trace','顺着线索逐项排查','先核实缺货，再查看访问变化','scan-path'],
 signal:['signal','检查资料有没有读到','断开的来源不能当成零订单','interrupt'],
 checklist:['paper','逐项寻找活动材料','缺少的项目留下待办','check-row'],
 handoff:['person','白班交给下一班','照片和承诺随同一条记录交接','handoff'],
 progress:['list','完成记录也要有结果','已勾选与真正有效分别核对','progress'],
 catalog:['tag','给新品整理一张资料卡','已确认的规格入卡，缺项留空','fill-form'],
 compare:['paper','左右对照同一款商品','保留正常差异，标记事实冲突','compare'],
 match:['tag','相同名字也可能是不同商品','用编号对齐，不把两款合在一起','match'],
 versions:['paper','新旧包装分开保留','新说明补入，旧交易记录留下','versions'],
 measure:['shirt','沿尺码表核对测量方法','数值有出处，测量方式先确认','measure'],
 publish:['screen','对照实际商品页面','主图和规格分别检查','readback'],
 funnel:['chart','内容互动不等于购买','只连接实际拿得到的数据','funnel'],
 cluster:['bubble','从重复问题整理主题','清洗、安装、尺寸分别归类','cluster'],
 studio:['screen','一份商品说明准备多种文案','展开详情、直播和笔记稿','fan-out'],
 live:['screen','本场货盘与讲稿核对','规格、赠品、发货逐项确认','live'],
 transcript:['paper','沿文字记录定位承诺','高亮原句，保留原片时间','highlight'],
 experiment:['chart','把讲解放回当时的时间段','同时变化的条件一起说明','timeline'],
 offer:['coupon','核对这次赠品适用条件','套装限定和活动期限一起检查','conditions'],
 countdown:['calendar','临近报名截止的准备','缺材料和待负责人确认分开','countdown'],
 calendar:['calendar','从节日前倒排每项准备','包材延期会影响后续安排','reschedule'],
 watch:['signal','同时查看三类经营变化','有变化的事项进入本次清单','watch'],
 archive:['folder','活动结束后的资料收尾','当前文案停用，历史记录保留','archive'],
 abtest:['screen','本次只尝试一项修改','另外两项保持不变作比较','abtest'],
 inbox:['bubble','从未结束的咨询开始','已有人处理的内容不重复排队','inbox'],
 chat:['bubble','从问题到有出处的回复','确认型号以后准备待审草稿','chat'],
 stalechat:['bubble','新消息到达，旧稿先暂停','商品变了就重新确认','interrupt-chat'],
 repair:['paper','原来的资料缺口继续跟进','新说明到达以后更新同一个问题','repair'],
 promise:['calendar','答应买家的事按时跟进','今天应答与下周回访分开','promise'],
 patch:['paper','比较人工到底修改了什么','纠正承诺、补条件、再调语气','patch'],
 deadline:['parcel','按照有效承诺查看发货','现货、预售和改期分别处理','deadline'],
 parcel:['parcel','快递录单与实际收件不同','没有揽收证据就停在核查步骤','parcel'],
 split:['parcel','一笔订单，分别追到每件货','分开的包裹各自保留进展','split'],
 address:['pin','先确认包裹现在到哪一步','已经出库就不直接改订单字段','address'],
 routes:['pin','通知只影响指定的网点','受影响与正常地区分开','routes'],
 tracking:['parcel','把新进展补回原来的记录','同一包裹不用重复建档','tracking'],
 sizes:['shirt','整款有货也可能缺常卖规格','把尺码与颜色拆开查看','sizes'],
 kit:['parcel','组成一套，需要所有配件','收纳袋是本例中限制数量的部分','assemble'],
 inventory:['warehouse','几家店对应同一批实物','分配数不能当成额外库存','shared-stock'],
 supplier:['calendar','一项到货延期影响哪些准备','只移动依赖这批货的工作','dependency'],
 inspect:['swatch','把人工验货与样品约定对照','颜色、尺寸、包装逐项比较','inspect'],
 batch:['parcel','同名商品也要看实际批次','新限制只用于确认过的批次','batch'],
 returns:['parcel','沿退回方向跟进包裹','签收以后还要等待实际验收','return'],
 exchange:['parcel','旧件退回，再确认新件补寄','中间缺规格选择就先停下来','exchange'],
 booking:['calendar','已联系不等于预约完成','双方确认时间后才进入下一步','booking'],
 reviews:['bubble','把相同问题放在一起查看','按商品与观察时间比较','reviews'],
 damage:['parcel','旧包装与试用包装分别记录','比较前先核对发货数量','damage'],
 evidence:['paper','把分散记录按真实经过排列','每份记录只证明它能证明的事','evidence'],
 members:['person','同意、型号和最近购买一起检查','合适的人进入待审服务名单','members'],
 suppress:['person','未结售后先继续服务','暂缓营销，保留必要通知','suppress'],
 merge:['bubble','合并同一活动的重复安排','维修通知仍然单独保留','merge'],
 unsubscribe:['folder','当前名单与旧表分别检查','本次排除，旧表交给负责人处理','unsubscribe'],
 creator:['parcel','寄样以后继续检查资料和交稿','收到样品不等于已经能交稿','creator'],
 roles:['person','先找到真正需要作决定的人','仓库等待的是商品负责人的确认','roles'],
 freshness:['calendar','保存日期和业务日期要分别看','今天保存的文件也可能还是旧数据','freshness'],
 dedup:['list','旧问题与新变化分开','两次相同输入合并，新的交期保留','dedup'],
 schema:['paper','列名变了，先确认实际含义','商品件数不能由包裹数替代','schema'],
 replay:['paper','同一个问题比较两版回答','新版漏条件就不替换正式稿','replay'],
 migration:['folder','通用办法与本店资料分开','方法可以参考，目标店事实重新确认','migration'],
 value:['chart','比较实际帮助，不只统计次数','重复的合并，有用的保留','value']
});
export function artFor(scene){const [prop,title,explain,cue]=ART[scene.kind]||ART.sort;return {prop,title,explain,cue};}
export function decorateStage(stage,scene,make){
 const art=artFor(scene);
 const decor=make('div',undefined,`scene-decor decor-${art.cue}`);decor.setAttribute('aria-hidden','true');
 const plinth=make('div',undefined,'scene-plinth');for(let i=0;i<3;i++)plinth.append(make('i'));
 const emblem=make('div',undefined,`scene-emblem emblem-${art.prop}`);for(let i=0;i<5;i++)emblem.append(make('i'));
 const pulse=make('div',undefined,'scene-pulse');
 const callout=make('span',art.explain,'scene-callout');
 decor.append(plinth,emblem,pulse,callout);stage.append(decor);
 return {update(frame){decor.dataset.cueFrame=String(frame);}};
}
