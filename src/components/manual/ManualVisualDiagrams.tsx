import React, { useState } from 'react';
import {
  Compass,
  Layers,
  Wrench,
  ShieldCheck,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Info,
  Maximize2,
  Printer,
  Sparkles,
  Users,
  Building,
  Zap,
  Clock,
  QrCode
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface ManualVisualDiagramsProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
}

export const ManualVisualDiagrams: React.FC<ManualVisualDiagramsProps> = ({
  onNavigateTab,
  showToast
}) => {
  const [activeDiagramId, setActiveDiagramId] = useState<string>('diag-repair');

  const diagrams = [
    {
      id: 'diag-repair',
      title: '临床故障报修五步闭环流程图',
      code: 'FLOW-01',
      icon: Wrench,
      targetTab: 'repairs' as ActiveTab,
      targetLabel: '临床报修处置',
      summary: '从临床扫码直报、SLA智能派工、现场排障换件、实机通电复核手写签名到自动恢复正常。',
      steps: [
        {
          num: 1,
          role: '临床护士/医师',
          roleColor: 'bg-blue-600',
          title: '扫码/移动端报修发起',
          details: '手机微信/钉钉扫机身防水活码、移动护理PDA或PC台账直报，选定紧急度（P0抢救紧急/P1平诊/P2常规），录入故障现象。',
          kpi: '耗时 < 30 秒'
        },
        {
          num: 2,
          role: '医工调度中心',
          roleColor: 'bg-indigo-600',
          title: 'SLA派工与备件智能预占',
          details: '系统按网格责任制分派工程师，触发飞书/微信强提醒。自动匹配备品备件库，预占维修所需耗材零配件。',
          kpi: 'P0级 20分钟内到场'
        },
        {
          num: 3,
          role: '责任工程师',
          roleColor: 'bg-purple-600',
          title: '现场排障与电气安全复测',
          details: '排查电路、清洁气路或换件，录入故障根因及材料工时。按 GB 9706.1 标准检测保护接地阻抗（≤0.2Ω）与漏电流。',
          kpi: '一次修复率 ≥ 92%'
        },
        {
          num: 4,
          role: '临床科室护士长',
          roleColor: 'bg-amber-600',
          title: '实机通电复核与电子手写签名',
          details: '临床当面通电试机，验证测量参数与临床波形。在移动端手写电子签名并给出 1~5 星服务评价，严禁电话代签。',
          kpi: '100% 当面通电试机'
        },
        {
          num: 5,
          role: '系统自动闭环',
          roleColor: 'bg-emerald-600',
          title: '状态回滚恢复与知识库归档',
          details: '系统自动将设备状态从“故障待修”变更为“正常运行”，扣减备品库库存，生成三联电子单据，并将案例沉淀入 AI 维保知识库。',
          kpi: '全流程数字闭环'
        }
      ]
    },
    {
      id: 'diag-loan',
      title: '急救生命支持机具跨科室应急借调图',
      code: 'FLOW-02',
      icon: Activity,
      targetTab: 'emergency_reserve' as ActiveTab,
      targetLabel: '急救调配机库',
      summary: '急救设备共享机库智能匹配、附件交接点检、在用24小时倒计时进度监控与归还性能复验。',
      steps: [
        {
          num: 1,
          role: '急需科室',
          roleColor: 'bg-rose-600',
          title: '提出应急借调申请',
          details: '因危重病患突增或突发抢救，科室在移动端或急救调配看板发起机具借调（除颤仪、呼吸机、高流量湿化仪等）。',
          kpi: '急救响应秒级发起'
        },
        {
          num: 2,
          role: '全院共享机库',
          roleColor: 'bg-blue-600',
          title: '空间信标就近智能匹配',
          details: '系统依据蓝牙空间定位与设备在位档案，秒级检索全院空闲可用机具，优先推荐物理距离最近的在库设备。',
          kpi: '智能命中最佳机具'
        },
        {
          num: 3,
          role: '借贷双方责任人',
          roleColor: 'bg-indigo-600',
          title: '4大必备附件点检交接',
          details: '出库时双方当面清点电源线、电极板/导联线、电池满电状态及耗材包，双人手写签字确认出库，生成借调交接单。',
          kpi: '附件 100% 齐备出库'
        },
        {
          num: 4,
          role: '系统与临床科室',
          roleColor: 'bg-amber-600',
          title: '在用倒计时与超期预警',
          details: '系统开启 24 小时倒计时动态进度条。在预计归还前 2 小时向双方护士长推送提醒；超期未还则标红告警。',
          kpi: '倒计时实时在控'
        },
        {
          num: 5,
          role: '急救库管工程师',
          roleColor: 'bg-emerald-600',
          title: '归还复核消杀与状态复原',
          details: '机具归还后执行终末消杀，通电自检放电能量与气密性，确认完好后在系统中一键“归还入库”，恢复共享池待调状态。',
          kpi: '设备完好率 100%'
        }
      ]
    },
    {
      id: 'diag-metro',
      title: '法定计量强检与超期特许备案图',
      code: 'FLOW-03',
      icon: ShieldCheck,
      targetTab: 'maintenance' as ActiveTab,
      targetLabel: '维保强检计划',
      summary: 'e-CQS免费免征强检申报、绿色合格证张贴、超期72小时满负荷检测与管委会特许准用。',
      steps: [
        {
          num: 1,
          role: '系统自动监控',
          roleColor: 'bg-blue-600',
          title: '强检到期 60 天红黄预警',
          details: '系统每日后台比对强检定标有效期，提前 60 天标记黄色预警，提前 30 天标记橙色加急，超期直接变红并锁定派工。',
          kpi: '到期预警零漏网'
        },
        {
          num: 2,
          role: '医工质控专员',
          roleColor: 'bg-indigo-600',
          title: '国家 e-CQS 平台免征申报',
          details: '登入全国法制计量管理系统申报免费强检项目（除颤仪、心电图、超声、电刀等），全额享受国家免收检定费红利政策。',
          kpi: '合规免征 100%'
        },
        {
          num: 3,
          role: '法定计量科学研究院',
          roleColor: 'bg-purple-600',
          title: '现场检定与张贴绿色合格证',
          details: '检定员到院开展参数检测，出具法定检定证书并在机身显眼位置张贴绿色「计量检定合格证」（标明有效日期与检定员）。',
          kpi: '受检率达 100%'
        },
        {
          num: 4,
          role: '医工与临床科室',
          roleColor: 'bg-amber-600',
          title: '超期服役稳定性检测申报',
          details: '达到设计使用年限（如8年）继续使用的机具，执行 72 小时连续满负荷稳定性测试与 GB 9706.1 医用电气安全测试。',
          kpi: '严禁带病超期上岗'
        },
        {
          num: 5,
          role: '医学装备管理委员会',
          roleColor: 'bg-emerald-600',
          title: '分管院长特许准用备案批准',
          details: '提交《超期服役医疗设备特许准用核验申请表》，经分管院长终审批准后张贴特许准用标签，列入月度重点巡检台账。',
          kpi: '四级核准特许服役'
        }
      ]
    },
    {
      id: 'diag-adverse',
      title: '医疗器械不良事件警戒直报流程图',
      code: 'FLOW-04',
      icon: AlertTriangle,
      targetTab: 'adverse_events' as ActiveTab,
      targetLabel: '不良事件直报',
      summary: '严重伤害10日/死亡3日时限红线、就地停用封存留样、国家平台直报与全国召回雷达联动。',
      steps: [
        {
          num: 1,
          role: '临床使用人员',
          roleColor: 'bg-rose-600',
          title: '事件突发与现场处置救治',
          details: '诊疗过程中发生可疑器械不良反应（如电刀灼伤、输液泵过量注入），首先全力抢救保障患者生命安全。',
          kpi: '患者生命安全第一'
        },
        {
          num: 2,
          role: '科室专管员与医工',
          roleColor: 'bg-amber-600',
          title: '涉事设备停用与物证耗材封存',
          details: '立即停止使用该设备并挂牌锁定；封存涉事同批次耗材（记录批号LOT）；对创面、操作界面及报警参数拍照取证。',
          kpi: '严禁擅自销毁物证'
        },
        {
          num: 3,
          role: '医工质控组',
          roleColor: 'bg-purple-600',
          title: '法定红线倒计时判定',
          details: '死亡事件：3 个工作日内报告；严重伤害/器官机能受损：10 个工作日内初报；一般事件：30 日内报告。系统开启红线倒计时。',
          kpi: '时限合规率 100%'
        },
        {
          num: 4,
          role: '质控主管',
          roleColor: 'bg-blue-600',
          title: '国家不良事件监测网直报',
          details: '登入国家药品监督管理局系统（adverse.gov.cn）填报《医疗器械不良事件可疑报告》，院质管办与分管领导复核审核。',
          kpi: '如实填报严禁瞒报'
        },
        {
          num: 5,
          role: '全院质控雷达',
          roleColor: 'bg-emerald-600',
          title: '同类机具召回排查与预警',
          details: '系统自动将涉事设备批号与国家召回库比对，联动召回雷达排查全院同型号、同批次设备与耗材，形成质控防范闭环。',
          kpi: '全院防范二次伤害'
        }
      ]
    },
    {
      id: 'diag-scrap',
      title: '国有资产报废技术鉴定多方会签图',
      code: 'FLOW-05',
      icon: FileSpreadsheet,
      targetTab: 'scrap_workflow' as ActiveTab,
      targetLabel: '报废处置工作流',
      summary: '临床提出申请、医工技术鉴定、财务折旧核实、分管院长批准至财政局批复下账。',
      steps: [
        {
          num: 1,
          role: '临床使用科室',
          roleColor: 'bg-blue-600',
          title: '科室提出报废处置申请',
          details: '设备服役达到折旧年限，或因主要部件损坏无法修复，由科室主任签字并在系统提交《国有资产报废申请》。',
          kpi: '使用科室首倡'
        },
        {
          num: 2,
          role: '医学工程科',
          roleColor: 'bg-indigo-600',
          title: '技术鉴定与残值评估',
          details: '技术鉴定小组实地检测，确认修复费用超过新机现值75%或原厂核心零备件已全线停产停更，出具技术鉴定结论与残值预估。',
          kpi: '出具权威技术鉴定'
        },
        {
          num: 3,
          role: '财务资产管理科',
          roleColor: 'bg-purple-600',
          title: '账面净值与折旧计提核实',
          details: '核查资产卡片台账，确认购置原值、已服役月数、累计计提折旧额及当前账面净值，核实是否提足折旧。',
          kpi: '防止国有资产流失'
        },
        {
          num: 4,
          role: '院长办公会与主管部门',
          roleColor: 'bg-amber-600',
          title: '院领导多方会签与财政批复',
          details: '医学装备管委会审议通过，分管副院长会签批准，报县卫生健康局与县财政国资监管科审批下发正式处置批文。',
          kpi: '行政审批合法合规'
        },
        {
          num: 5,
          role: '指定具备资质单位',
          roleColor: 'bg-emerald-600',
          title: '公开竞价拍卖与系统销账',
          details: '由具备环保回收拆解资质的第三方公开竞价变现，残值收入上缴财政专户；财务资产科下账，医工科注销资产卡片。',
          kpi: '残值入账·彻底销卡'
        }
      ]
    }
  ];

  const currentDiagram = diagrams.find(d => d.id === activeDiagramId) || diagrams[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
      {/* 顶部标题与说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Compass className="w-3 h-3 text-blue-600" />
            <span>五莲县人民医院 全景业务流程图解库</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>核心业务流转全景拓扑图解</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            将枯燥的制度文字转化为清晰的端到端交互流转图，清晰标识角色分工、关键动作、SLA考核红线与系统自动化节点。
          </p>
        </div>

        {/* 右侧直达对应功能按钮 */}
        {currentDiagram.targetTab && onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab(currentDiagram.targetTab!)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-center"
          >
            <span>直达「{currentDiagram.targetLabel}」功能</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 流程图选择横向选项卡 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {diagrams.map(d => {
          const isActive = d.id === currentDiagram.id;
          const Icon = d.icon;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDiagramId(d.id)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-2xs font-mono text-slate-500">{d.code}</span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <div className="text-xs truncate">{d.title}</div>
            </button>
          );
        })}
      </div>

      {/* 当前选定流程图大卡片 */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-6">
        {/* 流程摘要 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
          <div>
            <div className="text-2xs font-mono font-bold text-blue-600 uppercase mb-0.5">{currentDiagram.code}</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{currentDiagram.title}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{currentDiagram.summary}</p>
          </div>
          <div className="flex items-center gap-2 text-2xs text-slate-500 font-mono">
            <span>标准步骤: 5 步</span>
            <span aria-hidden="true">·</span>
            <span>三级闭环全覆盖</span>
          </div>
        </div>

        {/* 水平流转步骤卡片群 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {currentDiagram.steps.map((step, idx) => (
            <div
              key={step.num}
              className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-2xs relative group hover:border-blue-400 transition-all"
            >
              <div>
                {/* 角色与步骤角标 */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-2xs font-bold text-white ${step.roleColor}`}>
                    {step.role}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    0{step.num}
                  </span>
                </div>

                {/* 步骤标题 */}
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-2">
                  {step.title}
                </h4>

                {/* 步骤具体内容 */}
                <p className="text-2xs text-slate-600 leading-relaxed">
                  {step.details}
                </p>
              </div>

              {/* 关键考核KPI底栏 */}
              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs">
                <span className="text-slate-400">核心指标:</span>
                <span className="font-mono font-bold text-blue-700">{step.kpi}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 关键把关与避坑提醒提示条 */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong>质量安全与三甲评审把关提醒：</strong>该流程为五莲县人民医院三级闭环核心规范，各环节均有严格的权限防护与防篡改日志记录。严禁跳步、严禁越权代签、严禁隐瞒不报。所有签名均包含工号与时间戳并归档留痕。
          </div>
        </div>
      </div>
    </div>
  );
};
