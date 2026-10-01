import { RegulationWorkflow, RegulationCategory, RegulationFormTemplate } from '../types/regulationTypes';

/**
 * 医院各业务分类的标准默认流转 SOP 流程规范与节点库
 */
export const CATEGORY_DEFAULT_WORKFLOWS: Record<RegulationCategory, RegulationWorkflow> = {
  '采购准入': {
    workflowCode: 'SOP-FLOW-CG-01',
    workflowName: '医疗装备配置准入、需求论证与招标采购全流程SOP',
    purpose: '规范设备购置立项论证、技术参数合规初审、专家阶梯评审、阳光招标采购全链条，确保资金效益与学科适配。',
    triggerCondition: '临床科室提出年度预算申购、专科重大技术升级需求或突发应急机具增配。',
    cycleTime: '常规项目 15-25 个工作日；大型乙类设备按卫健审批时限',
    emergencyException: '突发公共卫生事件或重症急救设备开辟“先采购后补办”院长特批绿色通道。',
    steps: [
      {
        stepNumber: 1,
        title: '临床科室提报可行性论证',
        role: '临床科室主任 / 护士长',
        slaTime: '年度预算申报期内',
        actionDescription: '填报年度设备购置申请书，详尽测算近三年预期服务人次、耗材匹配性、机房环境要求及ROI投资回报预期。',
        deliverables: '《医疗设备配置可行性论证表》、《科室新技术开展报告》',
        riskControlPoint: '严禁虚报测算人次与夸大技术效益；大型设备必须核验配置许可资质。',
        systemAction: {
          label: '前往审批中心查验',
          tab: 'approvals',
          tooltip: '查看当前医院在审的大型设备立项审批流'
        }
      },
      {
        stepNumber: 2,
        title: '医工保障中心技术初审与机房勘测',
        role: '医学工程科 主管工程师',
        slaTime: '3个工作日内',
        actionDescription: '核实设备国内注册证有效性、同类在役机型负荷率、水电气屏蔽等机房预留条件，出具工程技术可行性初评意见。',
        deliverables: '《医工保障中心技术参数初核报告》、《机房场地勘查预审表》',
        riskControlPoint: '杜绝指向性排他参数；严禁采购已进入淘汰目录或淘汰型号的机具。',
        systemAction: {
          label: '查验台账在役负荷',
          tab: 'ledger',
          tooltip: '核查全院同类设备台账在册数量与使用现状'
        }
      },
      {
        stepNumber: 3,
        title: '专家委员会技术评审与阶梯审批',
        role: '医院医学装备管理委员会专家',
        slaTime: '3-5个工作日内',
        actionDescription: '组织院内外临床、医学工程、院感及财务专家举行专题论证会，对技术先进性、安全性及经济效益进行综合打分。',
        deliverables: '《医学装备专家委员会评审决议纪要》、《专家打分汇总表》',
        riskControlPoint: '专家评审实行利益回避制度；单价50万以上必须经院党委会审定。',
        systemAction: {
          label: '查看审批留痕记录',
          tab: 'approvals',
          tooltip: '查看专家会签与分管院长审批进度'
        }
      },
      {
        stepNumber: 4,
        title: '招标办发布采购公告与规范开标',
        role: '招标采购办公室 / 院纪检监督员',
        slaTime: '挂网法定公告期 (20天)',
        actionDescription: '依据政府采购法在指定政府采购平台公开发布招标公告，组织三方独立评委规范开展评标与澄清。',
        deliverables: '《公开招标文件》、《中标通知书》、《阳光采购廉政合同》',
        riskControlPoint: '严禁违规化整为零肢解标的逃避公开招标；严格实行廉洁双签。',
        systemAction: {
          label: '前往外协协同中心',
          tab: 'vendor_collaboration',
          tooltip: '进入供应商服务商资质与协同大厅'
        }
      },
      {
        stepNumber: 5,
        title: '商务合同签订与供货履约排期',
        role: '分管院长 / 医工科长 / 中标厂商',
        slaTime: '中标通知书下达后7日内',
        actionDescription: '根据招标文件与投标文件签订法律生效的供货合同，明确原厂保修期、关键部件寿命、装机到货时限及违约赔偿责任。',
        deliverables: '《医疗器械采购正式合同文本》、《原厂配件供应保障协议》',
        riskControlPoint: '严禁私下变更核心条款；保修期起算时间必须以三方最终临床验收合格为准。',
        systemAction: {
          label: '查看台账准入规范',
          tab: 'ledger',
          tooltip: '进入台账管理查看建卡规范'
        }
      }
    ]
  },

  '运行维保': {
    workflowCode: 'SOP-FLOW-PM-02',
    workflowName: '医疗设备预防性维护(PM)与周期巡检标准化流转规程',
    purpose: '落实周期性电气安全、性能校验、机械润滑与耗损件更换，压降突发故障率，延长设备服役寿命。',
    triggerCondition: '季度/半年度PM维护计划自动到期或临床使用负荷达到预警阈值。',
    cycleTime: '生命支持类设备按季闭环；常规设备半年度闭环；单台巡检20-60分钟',
    steps: [
      {
        stepNumber: 1,
        title: '系统智能排期与PM工单自动生成',
        role: '医工质控调度工程师',
        slaTime: '每季度首日前3天',
        actionDescription: '依据风险等级自动提取台账在册机具，生成当期PM派工单并推送至对应专业维保责任工程师终端。',
        deliverables: '《季度预防性维护(PM)派工清单》',
        riskControlPoint: '急救生命支持类设备列为第一优先级；漏保率考核指标必须为0。',
        systemAction: {
          label: '查验维保计划工作台',
          tab: 'maintenance',
          tooltip: '前往系统维护计划看板查看当月待检设备'
        }
      },
      {
        stepNumber: 2,
        title: '现场结构除尘、电气安全与接地阻抗测试',
        role: '专业维保工程师',
        slaTime: '按预约时段现场实施',
        actionDescription: '清洁散热风道防尘滤网，紧固关键机械连接，使用高精度电气安全分析仪测量机壳漏电流与保护接地阻抗。',
        deliverables: '《设备电气安全检测原始记录数据》',
        riskControlPoint: '接地阻抗须≤0.2Ω，漏电流超标机具立即切断电源并就地挂黄色警示牌。'
      },
      {
        stepNumber: 3,
        title: '关键参数质控检测与耗材易损件更换',
        role: '专业维保工程师',
        slaTime: '当日完成',
        actionDescription: '针对呼吸机潮气量、监护仪无创血压、除颤仪释放能量等核心指标使用专用质控仿真仪进行定标与校准。',
        deliverables: '《PM核心性能参数质控检测报告》、《耗损配件更换登记表》',
        riskControlPoint: '质控检测必须使用经国家检定在有效期的专用校验仪器。'
      },
      {
        stepNumber: 4,
        title: '张贴当期PM合格绿色视认标识',
        role: '维保工程师 / 科室感控联络员',
        slaTime: '测试通过后即刻',
        actionDescription: '在设备机身正面显著位置张贴绿色《预防性维护(PM)合格视认标贴》，标明本次维保日期及下次维保截止日期。',
        deliverables: '《设备PM合格绿色标识卡》',
        riskControlPoint: '禁止张贴模糊、破损或无责任工程师签章的标识。'
      },
      {
        stepNumber: 5,
        title: '临床科室护士长复核签字与归档闭环',
        role: '临床科室护士长 / 设备管理员',
        slaTime: '现场即刻会签',
        actionDescription: '现场核验设备运行状态与清洁度，在电子工单上确认并签署满意度评价，系统自动更新台账健康度与下次维护日期。',
        deliverables: '《医疗设备预防性维护(PM)完成凭据联单》',
        riskControlPoint: '严禁工程师代签；存在遗留缺陷隐患不得签署合格。',
        systemAction: {
          label: '查看台账健康评分',
          tab: 'ledger',
          tooltip: '查看该设备健康综合得分与生命周期履历'
        }
      }
    ]
  },

  '计量强检': {
    workflowCode: 'SOP-FLOW-JL-03',
    workflowName: '法定计量器具周期申报、检定、合格标识与不合格封存流程',
    purpose: '严格执行《中华人民共和国计量法》，实现全院强检器具100%在检定有效期内合规运行。',
    triggerCondition: '计量管理模块发出“检定有效期前30天预警”或新设备建卡准入。',
    cycleTime: '提前30天提报，法定检定机构入场检定并在15日内核发证书',
    emergencyException: '急救室新换设备如需紧急上线，由取得检定员资质的医工工程师出具临时自检报告，并在7日内完成外部法定溯源。',
    steps: [
      {
        stepNumber: 1,
        title: '强检到期预警与全院批次申报汇总',
        role: '医工科 专职计量管理员',
        slaTime: '证书到期前30天',
        actionDescription: '系统自动筛选即将到期的监护仪、心电图机、除颤仪、婴儿培养箱等器具，生成集中检定委托申请。',
        deliverables: '《法定计量强检申报清单》、《强检器具动态台账》',
        riskControlPoint: '坚决杜绝超期未检或漏报情况；核实器具出厂编号与台账一致。',
        systemAction: {
          label: '前往强检申报目录',
          tab: 'master_data',
          tooltip: '进入强检目录维护与法定检定工作台'
        }
      },
      {
        stepNumber: 2,
        title: '预约法定计量测试所现场集中检定',
        role: '法定计量院检定专家 / 医工计量员',
        slaTime: '提前5个工作日协调排期',
        actionDescription: '对接市/县市场监督管理局指定法定计量测试机构，分科室落实场地与备用机，开展现场标准器测量。',
        deliverables: '《现场计量检定原始记录表》、《检定交接单》',
        riskControlPoint: '临床重症区域检定须避开治疗高峰；提前调派应急备用机保障医疗不间断。'
      },
      {
        stepNumber: 3,
        title: '检定数据核验与法定检定证书录入',
        role: '专职计量管理员',
        slaTime: '收到官方证书后2个工作日内',
        actionDescription: '将法定机构核发的检定证书/校准证书编号、有效期截止日、检定结论逐台录入系统并上传PDF电子影印件。',
        deliverables: '《法定计量检定合格证书 (PDF扫描件)》',
        riskControlPoint: '证书结论必须严格区分为“合格”、“准用”、“禁用”；关键示值误差超标必须纠正。'
      },
      {
        stepNumber: 4,
        title: '设备显著位置换贴绿色强检合格标贴',
        role: '计量巡检工程师',
        slaTime: '证书录入后24小时内',
        actionDescription: '在仪器正面上方粘贴带有反光防伪特性的《强检计量合格证》，明确标注证书编号与下次检定日期。',
        deliverables: '《在役设备强检合格绿色标贴》',
        riskControlPoint: '旧标必须揭除，严禁多标重叠张贴引起临床误读。'
      },
      {
        stepNumber: 5,
        title: '检定不合格器具红牌封存与紧急返修',
        role: '质控主管 / 维修责任工程师',
        slaTime: '检定不合格现场即刻',
        actionDescription: '对检定结论不合格的设备，现场加贴红色《停用封存》警示标签，移出临床病区送修调试，复检合格后方可解封。',
        deliverables: '《计量不合格设备封存通知书》、《复检合格单》',
        riskControlPoint: '任何科室或个人严禁私自撕毁封条强行带病使用不合格计量器械。',
        systemAction: {
          label: '发起故障维修工单',
          tab: 'repair_closed_loop',
          tooltip: '将计量不合格设备转入维修闭环处理'
        }
      }
    ]
  },

  '急救调配': {
    workflowCode: 'SOP-FLOW-JJ-04',
    workflowName: '全院急救与生命支持类设备应急借调、极速配送与闭环流转SOP',
    purpose: '保障重症监护、急诊抢救及批量突发伤员救治，确保呼吸机、监护仪、注射泵“随时调得出、用得上、零延误”。',
    triggerCondition: '临床科室突发抢救机具短缺、批量患者收治或科室自有设备突发故障。',
    cycleTime: '常规借调 15分钟送达；极危急救生命支持 10分钟专人携机送达床旁',
    emergencyException: '患者处于心跳骤停或窒息等极危重时刻，可直接电话呼叫“112急救调配专线”，先配送救命后补扫码借还手续。',
    steps: [
      {
        stepNumber: 1,
        title: '临床科室发起应急借调申请',
        role: '当班责任护士 / 值班医生',
        slaTime: '故障/缺机即发即报',
        actionDescription: '在移动端或应急借调终端点击“一键借调”，选定机型规格（如转运呼吸机、高流量吸氧仪）及急迫等级。',
        deliverables: '《急救生命支持设备在线借调申请单》',
        riskControlPoint: '准确填写患者床位号与抢救指征；杜绝非抢救目的长期占用热备机具。',
        systemAction: {
          label: '前往应急调配工作台',
          tab: 'emergency_reserve',
          tooltip: '直通应急调配中心查看当前在库热备设备'
        }
      },
      {
        stepNumber: 2,
        title: '应急中心库热备状态极速核验与出库',
        role: '应急储备库 值班工程师',
        slaTime: '接单后 3 分钟内',
        actionDescription: '核查待出库设备电池满电状态、气路管道、自检Pass报告，扫描设备条码完成系统出库绑定。',
        deliverables: '《应急借调出库检测核对单》',
        riskControlPoint: '电池电量必须≥80%；耗材附件必须处于无菌有效期内。'
      },
      {
        stepNumber: 3,
        title: '绿色通道专人配送至临床抢救床旁',
        role: '应急调配专职配送员',
        slaTime: '全院 10 分钟内送达',
        actionDescription: '推运专用避震转运推车，走急救专用电梯与绿色通道，极速推送到用机科室抢救床旁。',
        deliverables: '《急救设备床旁送达签收联》',
        riskControlPoint: '配送途中确保仪器固定牢固，避免剧烈颠簸震动导致精密传感器失准。'
      },
      {
        stepNumber: 4,
        title: '床旁开机自检与医护双人交接试机',
        role: '配送专员 / 抢救主管护士',
        slaTime: '现场 2 分钟完成',
        actionDescription: '开机确认自检通过，共同核对呼吸回路、探头附件完备，双方在终端完成电子签字确认。',
        deliverables: '《急救设备借还交接凭证联单》',
        riskControlPoint: '现场连接患者前必须确认声光报警功能正常。'
      },
      {
        stepNumber: 5,
        title: '使用结束终末消杀与恢复充电归库',
        role: '借调科室 / 应急库管理员',
        slaTime: '病情平稳脱机后 2 小时内',
        actionDescription: '临床科室按规范完成表面消毒与管路废弃处置后归还；应急库工程师再次进行电气性能测试并接入充电桩恢复常备状态。',
        deliverables: '《终末消毒登记表》、《归还入库复检合格单》',
        riskControlPoint: '严禁带污染入库；必须彻底充满电后方可重新置为“在库待命”状态。',
        systemAction: {
          label: '查验应急库待命机群',
          tab: 'emergency_reserve',
          tooltip: '查看在库机具充电与待命就绪率'
        }
      }
    ]
  },

  '维修闭环': {
    workflowCode: 'SOP-FLOW-WX-05',
    workflowName: '设备报修、院内抢修、外协返厂与修复临床验收全生命周期闭环SOP',
    purpose: '规范报修接单、工程师响应时效、自主快修、外协返厂论证及临床验收签字，降低设备停工停诊时间。',
    triggerCondition: '设备运行异常、警报死机、外观受损或质控巡检发现严重安全隐患。',
    cycleTime: '常规响应 15分钟；院内快修 ≤4小时；外协返厂按合同审批约定',
    emergencyException: '急诊/ICU生命支持设备停机立即启动备用机无缝替换，故障机就地封存免停诊等待。',
    steps: [
      {
        stepNumber: 1,
        title: '临床科室一键扫码报修与停机挂牌',
        role: '临床科室医护人员',
        slaTime: '故障发生即刻',
        actionDescription: '手机扫描机身二维码，拍摄故障报错代码及外观视频，描述故障现象并提交系统派工。同时在机器挂贴《暂停使用》标牌。',
        deliverables: '《医疗设备故障报修工单》、《现场故障照片/代码》',
        riskControlPoint: '严禁故障后强行继续对患者施治；详实说明是否有电击、漏气等安全异常。',
        systemAction: {
          label: '发起故障报修协同',
          tab: 'repair_closed_loop',
          tooltip: '直通报修协同与闭环工单中心'
        }
      },
      {
        stepNumber: 2,
        title: '医工工程师15分钟响应与现场诊断',
        role: '值班医工工程师',
        slaTime: '急危科室 10分钟；普通科室 15分钟',
        actionDescription: '携带常用备件箱赶赴科室现场，排查电源供电、信号线缆、气路密封及板卡状态，判定故障层级。',
        deliverables: '《现场故障初诊勘察记录单》',
        riskControlPoint: '严禁无防护带电拆卸；涉及放射类设备必须先切断高压并核查联锁。'
      },
      {
        stepNumber: 3,
        title: '院内自主快修 / 领用配件更换',
        role: '专业维修工程师',
        slaTime: '常规故障 2-4 小时内',
        actionDescription: '如属院内可修范围，在备件库申领保险丝、按键板、电源适配器等原厂合格备件并实施精准更换与调试。',
        deliverables: '《配件申领出库单》、《维修过程处置记录》',
        riskControlPoint: '严禁使用无合格证的翻新三无零配件；换下的旧件必须如实入库封存。',
        systemAction: {
          label: '前往配件备件库',
          tab: 'parts_inventory',
          tooltip: '查看备件库存与申领更换'
        }
      },
      {
        stepNumber: 4,
        title: '重大疑难故障转外协返厂与商务议价',
        role: '医工科长 / 厂家工程师 / 审计专员',
        slaTime: '2个工作日内完成方案核定',
        actionDescription: '对主板烧毁、球管失效等重大故障，启动外协返厂评估，开展技术方案评审、三方联合议价及合同签约。',
        deliverables: '《外协返厂维修审批表》、《厂家报价单》、《价格谈判纪要》',
        riskControlPoint: '外协维修单价超1万元必须进行多方比价；严禁以修代买。',
        systemAction: {
          label: '进入返厂维修中心',
          tab: 'factory_repair_workflow',
          tooltip: '查看外协返厂物流与三方议价看板'
        }
      },
      {
        stepNumber: 5,
        title: '修复后电气安全性能复测与临床带机验收',
        role: '维保工程师 / 临床使用科室主任',
        slaTime: '修复现场即刻',
        actionDescription: '修复完毕后必须进行电气安全与校准测试，由临床使用人员进行带机试运行，核验满意后双方电子签名结案。',
        deliverables: '《医疗设备维修竣工验收单 (双方签字联)》',
        riskControlPoint: '未经性能测试严禁交付临床使用；保修期内同一故障返修率纳入工程师KPI。',
        systemAction: {
          label: '查看维修闭环档案',
          tab: 'repair_closed_loop',
          tooltip: '查看维修完整工单履历与工时配件成本'
        }
      }
    ]
  },

  '质控安全': {
    workflowCode: 'SOP-FLOW-ZK-06',
    workflowName: '医疗器械不良事件(MDR)自查监测、快速上报、根因分析与警戒处置SOP',
    purpose: '落实《医疗器械不良事件监测和再评价管理办法》，对可疑不良事件“早发现、早报告、早控制”，严防群发危害。',
    triggerCondition: '患者使用医疗器械后发生不可预期的死亡、严重伤害或器械可能导致严重伤害的突发故障。',
    cycleTime: '死亡事件 24小时内；严重伤害 3个工作日内；一般事件 15日内',
    emergencyException: '发生群体性可疑不良事件时，立即电话直接报告市级药监与卫健委，并就地封存同批次全部器械耗材。',
    steps: [
      {
        stepNumber: 1,
        title: '现场处置与涉案设备耗材立即隔离封存',
        role: '临床首诊医护人员',
        slaTime: '事件发生即刻',
        actionDescription: '立即对患者采取补救治疗，断开设备并就地加封封条，完好封存同批号耗材外包装及当时运行参数日志。',
        deliverables: '《不良事件涉案设备与耗材封存清单》、《现场处置记录》',
        riskControlPoint: '严禁丢弃残留耗材、严禁关机破坏内存日志；严禁隐瞒不报。',
        systemAction: {
          label: '前往不良事件登记',
          tab: 'adverse_events',
          tooltip: '直通国家不良事件上报标准表单'
        }
      },
      {
        stepNumber: 2,
        title: '填报不良事件初报表并上报医工安全组',
        role: '科室不良事件质控联络员',
        slaTime: '严重伤害24小时内',
        actionDescription: '在不良事件监测系统如实填报器械注册证号、生产批号、患者临床转归、事件经过及初步因果关联。',
        deliverables: '《可疑医疗器械不良事件报告表 (初报)》',
        riskControlPoint: '按药监标准分类填报，不得漏项；关联性评价遵循临床合理怀疑原则。'
      },
      {
        stepNumber: 3,
        title: '医工保障中心调取黑匣子日志与技术鉴定',
        role: '医工质控主管 / 资深工程师',
        slaTime: '接报后 12 小时内',
        actionDescription: '现场读取设备存储芯片黑匣子日志，排查输出能量、波形脉冲、供电电压及临床违规操作因素，出具技术初勘意见。',
        deliverables: '《设备运行参数黑匣子分析记录》、《工程技术鉴定报告》',
        riskControlPoint: '鉴定过程保持客观中立，区分设备机械电气故障与临床操作失误。'
      },
      {
        stepNumber: 4,
        title: '医院医疗安全委员会多学科根因调查',
        role: '医疗安全委员会 / 医工科 / 药学部',
        slaTime: '初报后 3 个工作日内',
        actionDescription: '召开院级多学科分析会，采用鱼骨图与RCA根因分析法，判定器械固有缺陷、耗材适配性或临床操作流程问题。',
        deliverables: '《不良事件根因分析报告 (RCA)》、《整改防范措施方案》',
        riskControlPoint: '对同批次器械进行全院横向排查，必要时下发全院停用警示通报。'
      },
      {
        stepNumber: 5,
        title: '直报国家药监不良事件系统与跟踪反馈',
        role: '医院不良事件专职直报员',
        slaTime: '法定时限内',
        actionDescription: '将院内终报审核意见通过国家医疗器械不良事件监测信息系统完成直报，对接厂家质量部及药监核查闭环。',
        deliverables: '《国家系统在线回执》、《厂家召回或技术改进承诺书》',
        riskControlPoint: '对药监系统反馈质询在5个工作日内完成补充说明与档案归卷。',
        systemAction: {
          label: '查验不良事件统计',
          tab: 'adverse_events',
          tooltip: '查看不良事件处理状态与分析'
        }
      }
    ]
  },

  '应急预案': {
    workflowCode: 'SOP-FLOW-YJ-07',
    workflowName: '重症监护设备突发死机、供氧中断及全院断电应急抢险SOP',
    purpose: '建立应对术中设备宕机、负压失压、市电双回路跳闸突发灾害的极速无缝兜底机制，杜绝患者人身伤亡。',
    triggerCondition: '市电突然中断、中心供氧总管失压、手术进行中生命支持设备突然黑屏死机。',
    cycleTime: '机载电池自动切换 0秒；人工气囊接替 ≤5秒；柴油发电机发电 ≤30秒；工程队抵达 ≤5分钟',
    emergencyException: '本流程本身即为全院最高等级红橙黄色应急响应通道，具有绝对处置优先权。',
    steps: [
      {
        stepNumber: 1,
        title: '立即脱机并采用手动简易呼吸皮囊维持生命体征',
        role: '当班主管护士 / 主刀医师',
        slaTime: '设备死机 5 秒内',
        actionDescription: '脱开患者与故障呼吸机，迅速连接床旁常备简易人工皮囊进行人工通气，严密监测血氧与心率。',
        deliverables: '《床旁抢救即时生命体征监测记录》',
        riskControlPoint: '每张重症抢救床位必须常备状态完好的简易呼吸皮囊与氧气袋。'
      },
      {
        stepNumber: 2,
        title: '自备蓄电池无缝接续与呼叫抢险突击队',
        role: '巡回护士 / 当班住院总',
        slaTime: '1 分钟内',
        actionDescription: '确认设备自带锂电池是否持续供电，拨打医工24小时应急抢修专线与总务后勤变电所电话。',
        deliverables: '《应急通联与受令登记》',
        riskControlPoint: '医工值班电话必须24小时双人双响，确保3声内必有人接听。'
      },
      {
        stepNumber: 3,
        title: '柴油发电机双回路应急供电自动合闸',
        role: '总务动力科 配电值班电工',
        slaTime: '停电 30 秒内',
        actionDescription: '全自动应急发电机组在30秒内自动点火起动并并网合闸，优先恢复重症病区、手术室与急诊专用动力插座供电。',
        deliverables: '《配电系统自动切换状态报告》',
        riskControlPoint: '每月必须组织柴油发电机带载试运行演练并保持满载油料储备。'
      },
      {
        stepNumber: 4,
        title: '医工应急队携热备新机5分钟内床旁替换',
        role: '医工应急抢险突击队员',
        slaTime: '5 分钟内抵达床旁',
        actionDescription: '携带应急库满电热备机及移动储能电源车进驻现场，完成管路连接并顺利接管患者通气。',
        deliverables: '《应急热备机紧急交接单》',
        riskControlPoint: '替换前严格测试新机通气压力，平稳过渡后方可撤除手动人工辅助。',
        systemAction: {
          label: '前往应急库调拨热备机',
          tab: 'emergency_reserve',
          tooltip: '查看应急库待命急救设备'
        }
      },
      {
        stepNumber: 5,
        title: '故障机就地隔离封存与事故复盘总结',
        role: '医工科主任 / 医疗副院长',
        slaTime: '险情解除后 24 小时内',
        actionDescription: '封存故障机具进行深度拆解与波形数据提取，召开全院应急抢险复盘会，修订应急预案与常态防范措施。',
        deliverables: '《突发意外事件应急处置总结报告》、《设备隐患排查整改清单》',
        riskControlPoint: '严禁瞒报、虚报险情持续时间；总结报告按规定报院领导与安全生产委员会备案。'
      }
    ]
  },

  '法规依据': {
    workflowCode: 'SOP-FLOW-FG-08',
    workflowName: '国家医疗器械法律法规与强制性标准宣贯、对照自查与执行闭环SOP',
    purpose: '确保国家新颁布法律、行政法规、卫健委标准在全院各科室无死角贯彻落地，守牢合规底线。',
    triggerCondition: '国家出台新修订法案、药监局发布产品警示或医院启动等级评审对照自查。',
    cycleTime: '法规发布后30天内完成宣贯；每季度开展合规自查',
    steps: [
      {
        stepNumber: 1,
        title: '新法规新标准识别、分类与官方入库',
        role: '医工科 政策法规联络员',
        slaTime: '正式颁布实施后 7 天内',
        actionDescription: '收集国务院、国家药监局、国家卫健委最新发布的医疗器械法规与技术强制标准，在制度中心完成档案建立。',
        deliverables: '《国家医疗器械政策法规入库索引清单》',
        riskControlPoint: '严格采用官方正式红头版本，避免引用非权威草案。'
      },
      {
        stepNumber: 2,
        title: '条款拆解与全院职责分解清单编制',
        role: '医学工程保障中心 主任',
        slaTime: '入库后 10 个工作日内',
        actionDescription: '对照法规条文逐条梳理与我院采购、验收、维保、不良事件等现有规章的差异，形成整改推进方案。',
        deliverables: '《法规条款对照整改执行台账》',
        riskControlPoint: '对涉及行政处罚与法律责任的红线条款重点标注并向院领导呈报。'
      },
      {
        stepNumber: 3,
        title: '组织全院多层级业务宣贯培训与考核',
        role: '临床科室 / 护理部 / 医工科',
        slaTime: '全员覆盖 30 天内',
        actionDescription: '分批开展科室主任、护士长、骨干医师及工程技术人员的线上线下专题培训，组织随堂答题考核。',
        deliverables: '《全院法规培训签到表》、《人员答题考核成绩单》',
        riskControlPoint: '等级评审核心培训覆盖率须达100%，留存完整现场影像与签到记录。'
      },
      {
        stepNumber: 4,
        title: '现场双随机合规抽检与风险点督办',
        role: '院质量控制办公室 / 纪检监督室',
        slaTime: '每季度开展一次',
        actionDescription: '深入临床病区与机房，采取飞检方式核查设备使用记录、维护合格标签、强检证书及应急演练记录。',
        deliverables: '《全院医疗器械依法执业督导通报》',
        riskControlPoint: '发现违规使用未注册或超期器械一票否决，责令限期整改并追究责任人。'
      },
      {
        stepNumber: 5,
        title: '持续改进与制度修编归档',
        role: '医学工程保障中心 规程起草组',
        slaTime: '年度例行修编',
        actionDescription: '将法规执行过程中的管理经验融入科室日常作业SOP，修编制度版本并报院办公会审定生效。',
        deliverables: '《医院医学装备制度新版汇编全书》',
        riskControlPoint: '废止旧版制度并注明作废日期，避免新旧版本混用导致管理混乱。'
      }
    ]
  },

  '资产处置': {
    workflowCode: 'SOP-FLOW-ZC-09',
    workflowName: '医疗装备报废技术鉴定、残值评估、批复与环保处置全流程SOP',
    purpose: '严把设备报废技术鉴定关，严防带病超期服役与资产流失，落实大型设备环保无害化销毁。',
    triggerCondition: '设备服役达到国家淘汰年限、性能严重劣化无修复价值或维修成本超过新机残值。',
    cycleTime: '每季度集中申报一次；从申办到批复约 15-20 个工作日',
    steps: [
      {
        stepNumber: 1,
        title: '使用科室提出资产报废初步申请',
        role: '使用科室主任 / 设备管理员',
        slaTime: '达到报废标准随时发起',
        actionDescription: '核实台账固定资产编号，详细阐述设备故障历史、无法修复原因及临床更新换代规划。',
        deliverables: '《固定资产报废处置申请意向表》',
        riskControlPoint: '必须查验设备实体在位，杜绝“账销案存、机不知去向”资产流失。',
        systemAction: {
          label: '在台账中核查折旧',
          tab: 'ledger',
          tooltip: '查看设备购置原值与累计折旧残值'
        }
      },
      {
        stepNumber: 2,
        title: '医工专家组现场技术拆解与残值鉴定',
        role: '医工技术鉴定专家小组 (3人以上)',
        slaTime: '接单后 5 个工作日内',
        actionDescription: '对设备主要部件进行外观、电气绝缘、主要功能检测，评估维修经济性，出具法定技术鉴定结论。',
        deliverables: '《大型医疗设备报废技术鉴定书》',
        riskControlPoint: '专家组须具备工程师以上职称；严禁对尚有修复价值且急需的机具违规报废。'
      },
      {
        stepNumber: 3,
        title: '院级审批与财政国资部门审核备案',
        role: '财务资产科 / 分管院长 / 财政国资局',
        slaTime: '按国资审批流程',
        actionDescription: '汇总全院报废清单，经院长办公会、党委会讨论通过后，正式报送县卫生健康局与财政国资局审批。',
        deliverables: '《财政国资部门准予报废批复文件》',
        riskControlPoint: '未取得官方国资批文前，任何科室严禁私自处置、拆解或丢弃资产。'
      },
      {
        stepNumber: 4,
        title: '残值公开竞价拍卖与专业环保回收',
        role: '招标采购办 / 具备资质的环保回收商',
        slaTime: '批复后 15 日内',
        actionDescription: '由具备医疗废物及电子垃圾拆解资质的合法机构公开竞拍回收，残值款项全部规范缴入财政指定专户。',
        deliverables: '《报废器械公开竞价成交单》、《残值缴款凭据》、《环保拆解承诺书》',
        riskControlPoint: '对含有放射源、重金属的特殊机具必须由持牌专业机构进行去污染合规处置。'
      },
      {
        stepNumber: 5,
        title: '台账下账销号与永久档案封存',
        role: '资产管理员 / 财务科',
        slaTime: '残值入账后 3 个工作日内',
        actionDescription: '在固定资产系统与医工全周期台账中标注“已报废处置”，撕毁或注销机身二维码标签，纸质档案归档备查。',
        deliverables: '《固定资产台账注销核减单》',
        riskControlPoint: '报废注销后严禁机体及核心零部件流向二手市场违规二次使用。',
        systemAction: {
          label: '查看台账处置记录',
          tab: 'ledger',
          tooltip: '查看资产注销台账与履历归卷'
        }
      }
    ]
  },

  '外协协同': {
    workflowCode: 'SOP-FLOW-WX-10',
    workflowName: '第三方维修外协维保服务商准入、议价三方会审与履约考评SOP',
    purpose: '严把外协技术服务商资质，规范价格谈判，杜绝利益输送与高价维修，保证外协保修品质。',
    triggerCondition: '设备发生原厂专有代码锁死、重大配件损坏且院内无法自行解决。',
    cycleTime: '常规外协谈判 2-3 工作日；紧急抢修方案 12小时内确定',
    steps: [
      {
        stepNumber: 1,
        title: '外协供应商三证一书资质首营审核',
        role: '医工科 供应商资质审核专员',
        slaTime: '业务合作前',
        actionDescription: '核验第三方服务商营业执照、原厂工程师培训认证证书、无犯罪合规记录及辐射安全许可证等资质。',
        deliverables: '《外协服务商资质审核档案卡》',
        riskControlPoint: '严禁使用无任何资质证明的皮包中介或无证流动维修人员。',
        systemAction: {
          label: '查验服务商资质库',
          tab: 'partners',
          tooltip: '直通外协合作服务商资质大厅'
        }
      },
      {
        stepNumber: 2,
        title: '现场开箱技术勘察与故障诊断清单',
        role: '厂家认证工程师 / 院方跟台工程师',
        slaTime: '工程师到场后 4 小时内',
        actionDescription: '现场共同对仪器进行故障定位，拆解损坏模块，出具书面故障确认书并列明需更换的具体零配件清单。',
        deliverables: '《外协技术勘验确认书》、《损坏备件明细单》',
        riskControlPoint: '院方工程师必须全程跟台，严防人为扩大故障范围或偷换良品配件。'
      },
      {
        stepNumber: 3,
        title: '厂家技术报价与三方联合议价谈判',
        role: '医工科长 / 审计科专员 / 厂家代表',
        slaTime: '报价提交后 24 小时内',
        actionDescription: '对比同类配件历史维修数据库与周边三甲医院结算价，召开联合议价会，核减非合理工时与过高备件加价。',
        deliverables: '《外协维修三方议价确认单》、《价格比对参考表》',
        riskControlPoint: '单次维修超过2万元须进行多方询比价；严格杜绝暗箱操作。',
        systemAction: {
          label: '前往议价协同中心',
          tab: 'vendor_collaboration',
          tooltip: '查看议价工作台与合同签署'
        }
      },
      {
        stepNumber: 4,
        title: '签订维修保障合同与明确质保期',
        role: '医院法人代表授权人 / 供应商代表',
        slaTime: '谈判达成即刻签署',
        actionDescription: '签署法定维修服务合同，明确备件需为原厂全新件、保修期至少为90-180天，约定故障复发违约赔偿责任。',
        deliverables: '《单次外协维修技术服务合同》',
        riskControlPoint: '合同付款方式严禁100%全额预付，至少预留30%质保尾款在试运行无误后结算。'
      },
      {
        stepNumber: 5,
        title: '修复验收、旧件回收销毁与服务考评',
        role: '使用科室 / 医工工程师 / 质控考评组',
        slaTime: '修复验收后 3 日内',
        actionDescription: '临床带机测试各项参数合格，旧配件按规定收回销毁，对供应商响应速度、技术能力、收费合理性进行考评打分。',
        deliverables: '《外协修复临床验收单》、《旧件收回登记单》、《服务商季度考评表》',
        riskControlPoint: '旧配件必须严格回收，严防翻新二次流入我院；考评不合格列入黑名单。',
        systemAction: {
          label: '查看服务商考评榜',
          tab: 'vendor_collaboration',
          tooltip: '查看外协服务商履约质量排行榜'
        }
      }
    ]
  },

  '培训考核': {
    workflowCode: 'SOP-FLOW-PX-11',
    workflowName: '医用设备上岗准入、操作技能培训、应急演练与授权考核SOP',
    purpose: '落实“未经培训不得上机”硬性规定，提高临床医护与工程人员实操技能，预防人为误操作引发的医疗事故。',
    triggerCondition: '新设备装机入科、新入职转岗医护人员或三甲评审年度技能复训。',
    cycleTime: '新设备到货7日内完成全员初训；每年组织2次应急实操考核',
    steps: [
      {
        stepNumber: 1,
        title: '制定年度及新设备专项培训计划',
        role: '医工教学秘书 / 临床科室护士长',
        slaTime: '每季度初发布',
        actionDescription: '结合新设备配置台账与科室人员梯队，明确培训机型、培训课时、理论考核与床旁实操要点。',
        deliverables: '《医疗设备临床使用技能培训实施方案》',
        riskControlPoint: '大型影像、重症生命支持设备列为重点必培项目。'
      },
      {
        stepNumber: 2,
        title: '厂家资深工程师与医工骨干床旁示教',
        role: '原厂临床应用专家 / 医工带教工程师',
        slaTime: '连续开展 2-3 天',
        actionDescription: '分理论讲解、参数设置、常规报警排查、传感器校准、日常清洁保养五个模块开展实机拆解示教。',
        deliverables: '《现场示教课件》、《实操指导手册》',
        riskControlPoint: '示教必须覆盖A/B班各级医护人员，确保夜班值班人员掌握应急抢救机具操作。'
      },
      {
        stepNumber: 3,
        title: '理论闭卷测试与床旁实操情景盲测',
        role: '医工考核专家组 / 临床考评员',
        slaTime: '培训结束后 3 日内',
        actionDescription: '组织线上理论答题与现场突发故障情景盲测，重点考察呼吸回路误接、气道高压报警、电源跳闸处置响应。',
        deliverables: '《学员考核答卷》、《床旁实操技能评分表》',
        riskControlPoint: '实操成绩低于85分者一律判定不合格并限期补训重考。'
      },
      {
        stepNumber: 4,
        title: '核发上岗准入授权资格证书',
        role: '医务处 / 护理部 / 医学工程科',
        slaTime: '考核合格后 2 个工作日内',
        actionDescription: '在医院考培系统中生成个人《大型医疗设备操作准入资格授权凭证》，与工号系统绑定，有效期2年。',
        deliverables: '《大型医用设备临床操作准入资格证》',
        riskControlPoint: '未取得授权上岗证书人员严禁独立开展特殊设备临床诊疗。'
      },
      {
        stepNumber: 5,
        title: '培训影像归档与三甲评审专卷建立',
        role: '医工科 规程档案管理员',
        slaTime: '考核后 1 周内',
        actionDescription: '将签到表扫描件、现场实操照片、答题成绩汇总表分类归入各科室三甲复审专卷，供评审专家随时调阅。',
        deliverables: '《科室医疗设备操作培训三甲专卷档案》',
        riskControlPoint: '原始纸质签到与电子记录永久归档，做到一人一档、一机一档。'
      }
    ]
  }
};

/**
 * 标准配套表单模版预设
 */
export const STANDARD_FORM_TEMPLATES: Record<RegulationCategory, RegulationFormTemplate[]> = {
  '采购准入': [
    { id: 'f-cg-01', formCode: 'FORM-CG-01', name: '五莲县人民医院医疗设备年度购置可行性技术论证表', description: '包含临床指征、预期人次测算、耗材成本及ROI投资回收期测算', department: '临床科室/医工保障中心', isMandatoryForAccreditation: true },
    { id: 'f-cg-02', formCode: 'FORM-CG-02', name: '大型医用设备机房环境与水电气屏蔽勘查预审单', description: '机房承重、防辐射铅防护、双回路电源及冷热通风现场勘查记录', department: '医工科/总务动力科', isMandatoryForAccreditation: true },
    { id: 'f-cg-03', formCode: 'FORM-CG-03', name: '医学装备管理委员会专家技术评审打分表与会签决议', description: '专家技术评审打分、利益回避承诺及阶梯化审批纪要', department: '医学装备专家委员会', isMandatoryForAccreditation: true }
  ],
  '运行维保': [
    { id: 'f-pm-01', formCode: 'FORM-PM-01', name: '生命支持类设备预防性维护(PM)标准化现场质控记录单', description: '覆盖机壳漏电流、接地阻抗、核心输出参数校准与护士长验收会签', department: '医学工程保障中心', isMandatoryForAccreditation: true },
    { id: 'f-pm-02', formCode: 'FORM-PM-02', name: '医疗设备日常巡检、防尘保养与运行状态日核查表', description: '科室每日交接班对机器通电自检、外观清洁度及管路连接检查记录', department: '各临床病区/ICU', isMandatoryForAccreditation: false }
  ],
  '计量强检': [
    { id: 'f-jl-01', formCode: 'FORM-JL-01', name: '法定强制检定计量器具周期申报委托明细清单', description: '市县市场监管局法定计量所现场委托检定统一单据', department: '专职计量管理员', isMandatoryForAccreditation: true },
    { id: 'f-jl-02', formCode: 'FORM-JL-02', name: '计量检定不合格器械现场红色警示封存与停用整改单', description: '明确停机原因、封存位置、责任工程师及复核检验要求', department: '质控安全组', isMandatoryForAccreditation: true }
  ],
  '急救调配': [
    { id: 'f-jj-01', formCode: 'FORM-JJ-01', name: '急救生命支持类设备应急借调床旁交接双向签认单', description: '明确借用时间、抢救病床号、开机自检状态、探头附件及双人签字', department: '应急调配中心/借用科室', isMandatoryForAccreditation: true },
    { id: 'f-jj-02', formCode: 'FORM-JJ-02', name: '应急储备库生命支持设备终末消毒与热备状态复检卡', description: '终末消杀记录、电池饱充测试与常备待命确认', department: '应急调配中心', isMandatoryForAccreditation: true }
  ],
  '维修闭环': [
    { id: 'f-wx-01', formCode: 'FORM-WX-01', name: '医疗设备故障报修、诊断处置与临床修复验收联单', description: '报修时间、初诊工时、故障原因分析、更换备件明细及科室评价', department: '临床科室/维修工程组', isMandatoryForAccreditation: true },
    { id: 'f-wx-02', formCode: 'FORM-WX-02', name: '疑难设备外协返厂维修审批、三方议价与旧件回收单', description: '厂家报价比价、议价记录、返厂物流追踪及旧件回收销毁凭证', department: '医工保障中心/审计科', isMandatoryForAccreditation: true }
  ],
  '质控安全': [
    { id: 'f-zk-01', formCode: 'FORM-ZK-01', name: '国家标准医疗器械疑似不良事件(MDR)快速报告初报表', description: '涉案器械注册证、出厂批号、损害程度、黑匣子参数及因果判定', department: '临床科室/安全监测组', isMandatoryForAccreditation: true },
    { id: 'f-zk-02', formCode: 'FORM-ZK-02', name: '严重医疗器械不良事件鱼骨图根因分析(RCA)与整改报告', description: '多学科联合调查、人机料法环根因剖析与全院防范改进措施', department: '医院医疗安全委员会', isMandatoryForAccreditation: true }
  ],
  '应急预案': [
    { id: 'f-yj-01', formCode: 'FORM-YJ-01', name: '生命支持设备突发死机及严重断电应急抢险处置登记表', description: '通联时刻、人工皮囊接替时间、发电机并网时效及热备机就位记录', department: '医工抢险突击队/总务处', isMandatoryForAccreditation: true },
    { id: 'f-yj-02', formCode: 'FORM-YJ-02', name: '全院突发大面积停电与医用供氧突然失压演练评估表', description: '无脚本实战演练时效考评、漏洞排查与处置能力评估', department: '应急管理办公室', isMandatoryForAccreditation: true }
  ],
  '法规依据': [
    { id: 'f-fg-01', formCode: 'FORM-FG-01', name: '国家医疗器械法律法规与强制标准合规性自查表', description: '对照国务院令739号、大型设备配置规范逐条自查整改清单', department: '依法执业办公室/医工中心', isMandatoryForAccreditation: true }
  ],
  '资产处置': [
    { id: 'f-zc-01', formCode: 'FORM-ZC-01', name: '大型医疗设备报废技术鉴定书与专家组论证意见表', description: '多维度技术寿命、电气绝缘、经济效益评估与3名以上专家签名', department: '医工技术鉴定专家组', isMandatoryForAccreditation: true },
    { id: 'f-zc-02', formCode: 'FORM-ZC-02', name: '报废医疗器械公开竞价残值收缴与环保拆解销毁联单', description: '残值缴入财政专户凭据与具有资质机构环保销毁承诺', department: '资产管理科/环保回收商', isMandatoryForAccreditation: true }
  ],
  '外协协同': [
    { id: 'f-wx-03', formCode: 'FORM-WX-03', name: '外协维修第三方技术服务商资质审核与合规档案卡', description: '营业执照、原厂授权、工程师资质、无违规记录', department: '医学工程保障中心', isMandatoryForAccreditation: true },
    { id: 'f-wx-04', formCode: 'FORM-WX-04', name: '外协技术维修三方联合议价谈判记录与廉洁承诺书', description: '多方比价依据、核减金额、最终合同总价及廉洁双签', department: '医工科/院纪委/供应商', isMandatoryForAccreditation: true }
  ],
  '培训考核': [
    { id: 'f-px-01', formCode: 'FORM-PX-01', name: '医疗设备临床操作技能培训签到与床旁实操盲测评分表', description: '理论考核成绩、床旁报警排查实操盲测打分及带教老师评价', department: '教学培训组/临床科室', isMandatoryForAccreditation: true },
    { id: 'f-px-02', formCode: 'FORM-PX-02', name: '大型医用设备临床独立上岗操作准入资格授权凭证', description: '医务处、护理部、医工科三方联合授权操作证明', department: '医务处/医学工程科', isMandatoryForAccreditation: true }
  ]
};

/**
 * 智能获取制度配套的工作流程
 * 如果该制度自带工作流则直接返回；否则按其业务类别自动匹配对应的医院标准专业流转 SOP
 */
export function getRegulationWorkflow(regulation: {
  category: RegulationCategory;
  title: string;
  code: string;
  workflow?: RegulationWorkflow;
}): RegulationWorkflow {
  if (regulation.workflow && regulation.workflow.steps?.length > 0) {
    return regulation.workflow;
  }

  const categoryPreset = CATEGORY_DEFAULT_WORKFLOWS[regulation.category];
  if (categoryPreset) {
    return {
      ...categoryPreset,
      workflowName: `${regulation.title.replace(/[《》]/g, '')}配套执行流程SOP`
    };
  }

  // 通用应急兜底流程
  return {
    workflowCode: `SOP-FLOW-${regulation.code}`,
    workflowName: `${regulation.title.replace(/[《》]/g, '')}执行流程规范`,
    purpose: '建立标准流转规程，实现责任到人、时限明确、留痕可溯。',
    triggerCondition: '业务触发或定期例行开展',
    cycleTime: '3-7个工作日',
    steps: [
      {
        stepNumber: 1,
        title: '提请发起与需求登记',
        role: '责任科室责任人',
        slaTime: '即刻',
        actionDescription: '明确操作事项并向系统提交流转登记申请。',
        deliverables: '《业务申请登记单》',
        riskControlPoint: '核对基本信息真实合规。'
      },
      {
        stepNumber: 2,
        title: '技术初审与合规评估',
        role: '医工保障中心工程师',
        slaTime: '1个工作日内',
        actionDescription: '核实技术参数、制度标准与安全规范要求。',
        deliverables: '《技术合规评估报告》',
        riskControlPoint: '严格按照国家法律法规执行。'
      },
      {
        stepNumber: 3,
        title: '现场实施与规范作业',
        role: '专业技术人员',
        slaTime: '按规程实施',
        actionDescription: '遵照标准操作规程(SOP)开展现场作业与调试。',
        deliverables: '《现场作业记录单》',
        riskControlPoint: '防范电气安全隐患与操作失误。'
      },
      {
        stepNumber: 4,
        title: '科室复核与验收闭环',
        role: '科室主任 / 护士长',
        slaTime: '当日完成',
        actionDescription: '现场核验作业成效，签署复核意见，完成系统归档。',
        deliverables: '《业务闭环验收报告》',
        riskControlPoint: '留存完整签批档案备查。'
      }
    ]
  };
}

/**
 * 获取制度配套的标准表单清单
 */
export function getRegulationFormTemplates(category: RegulationCategory): RegulationFormTemplate[] {
  return STANDARD_FORM_TEMPLATES[category] || [];
}
