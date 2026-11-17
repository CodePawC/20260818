import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Building,
  Stamp,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { ExpensePreApprovalModal } from '../payment/ExpensePreApprovalModal';

interface HospitalStandardFormsModalProps {
  onClose?: () => void;
}

export const HospitalStandardFormsModal: React.FC<HospitalStandardFormsModalProps> = () => {
  const [selectedFormIndex, setSelectedFormIndex] = useState<number>(0);
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const [isPreApprovalModalOpen, setIsPreApprovalModalOpen] = useState<boolean>(false);

  const formsList = [
    {
      id: 'form-01',
      title: '医疗装备开箱验收入库与安装调试验收单',
      category: '入库准入',
      triplicate: '一式三联（白联：资产科留存入账；红联：医学工程科建档；黄联：使用科室留存）',
      lawBasis: '《医疗器械使用质量监督管理办法》第九条；公立医院资产入库规程',
      content: {
        docNo: 'WLPH-ACC-202610-019',
        equipmentName: '全自动数字减影血管造影机 (DSA)',
        model: 'Artis zee ceiling / 西门子医疗',
        sn: 'SN: SMZ-DSA-88092',
        contractNo: 'HT-2026-MED-042',
        price: '¥ 6,800,000.00',
        supplier: '西门子医疗系统有限公司',
        dept: '导管介入室 (总院区 3号楼 2F)',
        acceptanceDate: '2026年10月24日',
        itemsChecked: [
          { item: '外包装箱体完好无损，无受潮、倾斜、碰撞破损痕迹', result: '合格' },
          { item: '随机技术资料完整（原厂说明书、保修卡、合格证、NMPA注册证三套齐全）', result: '合格' },
          { item: '设备零备件、专用线缆、手柄及配套高压注射器型号与合同清单一致', result: '合格' },
          { item: '安装环境符合要求（地面荷载、铅防护屏蔽工程、稳压电源及接地阻抗<0.1Ω）', result: '合格' },
          { item: '满负荷连续运行通电试机 72 小时无异常报错，图像空间分辨力达标', result: '合格' },
          { item: '原厂高级应用工程师已完成对科室主任、介入医师及专科护士实操培训', result: '合格' }
        ],
        signatures: [
          { role: '临床使用科室主任/专管员', name: '李建军 (介入室主任)', date: '2026-10-24' },
          { role: '医学工程科质控工程师', name: '崔伟 (主任工程师)', date: '2026-10-24' },
          { role: '财务资产管理科核算员', name: '王淑华', date: '2026-10-25' },
          { role: '分管医疗装备副院长', name: '张明理 (批准入库)', date: '2026-10-26' }
        ]
      }
    },
    {
      id: 'form-02',
      title: '医疗器械故障现场维修确认与临床验收单',
      category: '维修闭环',
      triplicate: '一式三联（白联：医学工程科抵扣出库备件；红联：供应商核销工时；黄联：病区护士长备查）',
      lawBasis: '三级医院评审第四篇；五莲县人民医院报修闭环五步SOP',
      content: {
        docNo: 'WLPH-REP-202610-8801',
        equipmentName: '德尔格呼吸机 Evita V300',
        model: 'Evita V300 / 德尔格医疗',
        sn: 'SN: DRG-88219',
        dept: '重症医学科 (ICU病区)',
        faultDate: '2026年10月30日 08:35',
        repairedDate: '2026年10月30日 09:12',
        faultReason: '呼气阀密封硅胶膜长期灭菌老化破损，导致持续 High Pressure 报警',
        solution: '领料更换原装呼气阀膜片总成 (SP-DRG-V300-VALVE)，气密性测试 60hPa 保持无压降',
        electricalSafety: '接地电阻 0.07Ω（达标），外壳漏电流 18μA（达标），电磁兼容正常',
        costDetail: '备件材料费: ¥1,450.00 | 自主工程工时费: ¥0.00 | 合计: ¥1,450.00',
        signatures: [
          { role: '维修执行工程师', name: '李明 (工号 ET-041)', date: '2026-10-30 09:15' },
          { role: '临床验收当班护士长', name: '张晓燕 (实机通电试机合格)', date: '2026-10-30 09:20' },
          { role: '医学工程科质控审核', name: '赵文博 (科长终审通过)', date: '2026-10-30 10:00' }
        ]
      }
    },
    {
      id: 'form-03',
      title: '急救生命支持机具跨科室应急借调交接单',
      category: '急救调配',
      triplicate: '一式两联（存根联：共享调配机库记录；交接联：借用科室随机放置）',
      lawBasis: '《公立医院急救与生命支持设备调配管理规程》',
      content: {
        docNo: 'WLPH-LN-202610-0992',
        equipmentName: '双相波除颤监护仪 BeneHeart D6',
        model: 'BeneHeart D6 / 深圳迈瑞',
        sn: 'SN: MR-D6-9921',
        lenderDept: '急救医学中心共享调配机库',
        borrowerDept: '普外科二病区 (3号楼 6F)',
        startTime: '2026-10-30 14:00',
        expectedReturnTime: '2026-10-31 14:00 (借期24小时)',
        itemsChecked: [
          { item: '5导心电电缆与导联线完好无断针', result: '点检齐备' },
          { item: '体外除颤电极板清洁无残存导电膏', result: '点检齐备' },
          { item: '锂电池组充满电，AC交流电源线完好', result: '状态良好' },
          { item: '开机自检通过，200J放电测试正常', result: '自检通过' }
        ],
        signatures: [
          { role: '机库调配交付人', name: '陈志远 (急救库管员)', date: '2026-10-30 14:05' },
          { role: '借用科室接机护士', name: '王桂兰 (普外护士长)', date: '2026-10-30 14:10' },
          { role: '归还复核检验工程师', name: '待归还时复核签名', date: '待填' }
        ]
      }
    },
    {
      id: 'form-04',
      title: '超期服役医疗设备特许准用稳定性核验申请表',
      category: '合规备案',
      triplicate: '一式两联（医学工程科档案留存；临床科室张贴准用标识）',
      lawBasis: '《医疗器械使用质量监督管理办法》第十七条；国家卫健委大型设备监管细则',
      content: {
        docNo: 'WLPH-OVR-2026-008',
        equipmentName: '彩色多普勒超声诊断仪',
        model: 'GE LOGIQ E9 / 购置日期: 2017-03-12',
        sn: 'SN: GE-US-44912',
        dept: '超声医学科 (门诊楼 2F)',
        currentAge: '已服役 9 年 7 个月 (设计推荐年限: 8年)',
        evaluationSummary: '经医学工程科工程师与省计量院联合测试，该机腹部凸阵探头、高频浅表探头声束分辨力正常，无坏阵元；GB 9706.1 电气安全漏电流测试完全合格。近12个月非计划故障停机率仅0.8%，机况平稳。',
        safetyMeasures: '1. 每季度安排一次超声体模衰减检测；2. 每月执行一次探头漏电巡检；3. 挂设「超期服役特许准用标识」；4. 准用有效期至 2027年10月31日。',
        signatures: [
          { role: '使用科室负责人', name: '周秀英 (超声科主任)', date: '2026-10-18' },
          { role: '技术检测评价工程师', name: '崔伟 (主任工程师)', date: '2026-10-20' },
          { role: '医学工程科长', name: '赵文博', date: '2026-10-21' },
          { role: '分管院长批复', name: '张明理 (同意特许准用服役一年)', date: '2026-10-22' }
        ]
      }
    },
    {
      id: 'form-05',
      title: '医疗设备外协维修联合议价与技术评审纪要',
      category: '采购议价',
      triplicate: '一式两联（纪委监察室/审计科备案；医学工程科执行合同结算）',
      lawBasis: '五莲县人民医院《大额设备维修外协技术评审与价格谈判制度》',
      content: {
        docNo: 'WLPH-NEG-202610-003',
        equipmentName: '西门子 1.5T 超导磁共振 (MAGNETOM Aera)',
        faultPhenomenon: '射频功放模块 (RFPA) 内部IGBT击穿损坏，导致质子共振激发失败',
        originalQuote: '原厂初次报价: ¥385,000.00 (换全新射频功放板)',
        negotiatedPrice: '联合谈判确认价: ¥168,000.00 (原厂件置换保税件，质保期延长至18个月)',
        savings: '为医院直接节约维修支出 ¥217,000.00 (降幅 56.4%)',
        bargainingPanel: '医学工程科代表、财务资产科代表、审计监察室代表、使用科室主任',
        signatures: [
          { role: '服务商授权代表', name: '刘振东 (西门子医疗高级工程师)', date: '2026-10-25' },
          { role: '医学工程科代表', name: '赵文博 (科长)', date: '2026-10-25' },
          { role: '审计监察室见证人', name: '孙立宏 (监察室主任)', date: '2026-10-25' },
          { role: '财务资产科审核', name: '王淑华', date: '2026-10-26' }
        ]
      }
    },
    {
      id: 'form-06',
      title: '国家医疗器械不良事件可疑报告登记表',
      category: '警戒直报',
      triplicate: '一式两联（上报省/国家不良事件监测平台；医院质控档案终身留存）',
      lawBasis: '《医疗器械不良事件监测和再评价管理办法》；国家药品监督管理局标准样式',
      content: {
        docNo: 'NMPA-MDR-2026-3701-098',
        equipmentName: '高频手术电刀 (ValleyLab Force FX)',
        nmpaRegNo: '国械注进 20183010412',
        patientInfo: '男 / 58岁 / 术中突发局部皮肤灼伤',
        incidentDesc: '腹腔镜胆囊切除术中，电凝止血时报警回路异常，术毕发现右侧大腿负极板粘贴处边缘红肿伴表皮水泡（II度灼伤约3cm×2cm）。',
        clinicalAction: '立即停用涉事电刀，外涂烧伤湿润膏保护；患者生命体征平稳，创面好转。',
        investigation: '医学工程科联合厂家现场排查：负极板贴附处患者体毛较密未做备皮，局部接触阻抗过大，导致高频电流回流通路电流密度骤增所致。',
        reportingTimeline: '一般伤害/严重伤害事件已于 10 个工作日内向国家监测平台直报。',
        signatures: [
          { role: '临床报告医师', name: '张志刚 (主治医师)', date: '2026-10-15' },
          { role: '医学工程质控专员', name: '李明 (工程师)', date: '2026-10-16' },
          { role: '院医疗质量管理办公室', name: '宋德清 (主任)', date: '2026-10-17' }
        ]
      }
    },
    {
      id: 'form-07',
      title: '县级公立医院国有资产报废技术鉴定多方会签表',
      category: '资产下账',
      triplicate: '一式四联（县卫健局审批；县财政国资科批复下账；资产科销账；医工科销卡）',
      lawBasis: '国务院令第738号《行政事业性国有资产管理条例》；山东省公立医疗机构资产处置暂行规定',
      content: {
        docNo: 'WLPH-SCRAP-2026-004',
        equipmentName: '日立 7020 全自动生化分析仪',
        model: 'Hitachi 7020 / 原值: ¥520,000.00',
        sn: 'SN: HT-7020-0419',
        dept: '医学检验科 (原门诊化验室)',
        serviceYears: '服役年限: 13 年 (国家推荐年限 8 年)',
        appraisalConclusion: '该机光学比色通道老化漂移失真，反应盘温控失效，主板芯片已全线停产无法采购替换备件。维修报价超过新机现值的75%，已彻底丧失临床使用与维修价值，建议做技术性报废。',
        salvageValue: '评估回收残值: ¥ 3,800.00 (由指定具备环保拆解资质单位竞价回收)',
        signatures: [
          { role: '使用科室负责人', name: '刘桂兰 (检验科主任)', date: '2026-10-10' },
          { role: '医学工程鉴定组长', name: '崔伟 (高级工程师)', date: '2026-10-12' },
          { role: '财务资产管理科长', name: '王淑华', date: '2026-10-14' },
          { role: '分管院长审查意见', name: '张明理 (同意报废，报县卫健局)', date: '2026-10-15' }
        ]
      }
    },
    {
      id: 'form-08',
      title: '五莲县人民医院费用预批单及存根（一式两联）',
      category: '费用预批',
      triplicate: '一式两联（正本联：报销申请入账主联；存根联：医疗设备科留存备查）',
      lawBasis: '五莲县人民医院财务支出预审制度；特种设备年检及维修支出预批规程',
      content: {
        docNo: 'WLPH-PRE-548',
        equipmentName: '特种设备安全阀定期校验（编号：548）',
        model: 'A48Y-16C / DN50',
        sn: 'WLPH-VALVE-2026',
        dept: '医疗设备科',
        price: '¥ 960.00 (大写: 玖佰陆拾圆整)',
        supplier: '日照市特种设备检验科学研究院',
        evaluationSummary: '经科室核对，符合国家特种设备安全技术规范年度定期校验法定要求，检验检测报告与增值税发票齐全无误，三单勾稽一致，准予按规预批。',
        signatures: [
          { role: '经办人签字', name: '崔伟', date: '2026-11-04' },
          { role: '科室负责人签字', name: '赵文博', date: '2026-11-04' },
          { role: '分管领导签批', name: '张明理', date: '2026-11-05' },
          { role: '主要负责人签批', name: '同意批复', date: '2026-11-06' }
        ]
      }
    }
  ];

  const currentForm = formsList[selectedFormIndex];

  const handleCopyDocNo = (docNo: string) => {
    navigator.clipboard.writeText(docNo);
    setCopiedFormId(docNo);
    setTimeout(() => setCopiedFormId(null), 2000);
  };

  const handlePrintCurrentForm = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
      {/* 头部说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <Building className="w-3 h-3 text-indigo-600" />
            <span>五莲县人民医院 官方标准公文与多联单据图例规范</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>全生命周期 8 套标准单据范本与打印中心</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            严格按照三级公立医院评审、国家卫健委《医疗器械使用质量监督管理办法》与山东省国有资产管理条例研制。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center print:hidden">
          <button
            type="button"
            onClick={() => setIsPreApprovalModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>打开费用预批单生成工作台</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCurrentForm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>打印 / 导出当前表单标准稿</span>
          </button>
        </div>
      </div>

      {/* 单据切换选择标签 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 print:hidden">
        {formsList.map((f, idx) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFormIndex(idx)}
            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
              selectedFormIndex === idx
                ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="text-2xs font-mono text-slate-500 mb-0.5">{f.category}</div>
            <div className="text-xs truncate">{f.title}</div>
          </button>
        ))}
      </div>

      {/* 当前单据高仿真纸质红头单呈现区 */}
      <div className="bg-slate-50/60 p-4 sm:p-8 rounded-xl border border-slate-300 print:border-none print:p-0">
        {currentForm.id === 'form-08' && (
          <div className="max-w-4xl mx-auto mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs print:hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-red-950 text-xs flex items-center gap-2">
                  <span>1:1 真实原件一式两联（正本联+存根联）互动式开具与导出</span>
                  <span className="text-3xs font-mono px-1.5 py-0.2 rounded bg-red-200 text-red-900 font-bold">
                    发票收到后专用
                  </span>
                </div>
                <div className="text-[11px] text-red-800 mt-0.5">
                  支持从发票自动带出金额与供货单位、金额大写智能换算、纸质裁切线打印与 CA 电子防伪验签流转。
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPreApprovalModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>打开预批单生成工作台</span>
            </button>
          </div>
        )}

        <div className="bg-white max-w-4xl mx-auto border border-slate-300 p-8 sm:p-12 shadow-sm rounded-lg relative overflow-hidden print:shadow-none print:border-none">
          {/* 水印 */}
          <div className="absolute right-10 bottom-16 opacity-5 pointer-events-none select-none text-slate-900 font-bold text-6xl tracking-widest uppercase rotate-[-25deg]">
            WLPH OFFICIAL
          </div>

          {/* 表头区 */}
          <div className="text-center border-b-2 border-red-700 pb-4 mb-6">
            <div className="text-xs font-bold tracking-widest text-red-700 uppercase mb-1">
              五莲县人民医院 · 医学装备管理公文
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-slate-900 tracking-wide">
              {currentForm.title}
            </h1>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-4 text-2xs text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <span>单据编号:</span>
                <strong className="text-slate-800">{currentForm.content.docNo}</strong>
                <button
                  type="button"
                  onClick={() => handleCopyDocNo(currentForm.content.docNo)}
                  className="p-1 hover:text-blue-600 print:hidden cursor-pointer"
                  title="复制单据号"
                >
                  {copiedFormId === currentForm.content.docNo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div>
                <span>联次说明:</span>
                <span className="text-red-700 font-sans font-medium">{currentForm.triplicate}</span>
              </div>
            </div>
          </div>

          {/* 法规依据栏 */}
          <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded text-2xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-700">法定执行规程：{currentForm.lawBasis}</span>
            <span className="text-slate-400 font-mono">版本：2026-V3.2</span>
          </div>

          {/* 表体内容 */}
          <div className="space-y-4 text-xs text-slate-800">
            {/* 基础元数据网格 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-slate-300 p-3 rounded bg-slate-50/50">
              <div>
                <span className="text-slate-500 block text-2xs">设备全称:</span>
                <strong className="text-slate-900">{currentForm.content.equipmentName}</strong>
              </div>
              {currentForm.content.model && (
                <div>
                  <span className="text-slate-500 block text-2xs">规格型号:</span>
                  <span className="font-mono">{currentForm.content.model}</span>
                </div>
              )}
              {currentForm.content.sn && (
                <div>
                  <span className="text-slate-500 block text-2xs">出厂序列号(SN):</span>
                  <span className="font-mono font-bold text-blue-700">{currentForm.content.sn}</span>
                </div>
              )}
              {currentForm.content.dept && (
                <div>
                  <span className="text-slate-500 block text-2xs">使用/责任科室:</span>
                  <span>{currentForm.content.dept}</span>
                </div>
              )}
              {currentForm.content.price && (
                <div>
                  <span className="text-slate-500 block text-2xs">购置金额/原值:</span>
                  <span className="font-mono font-bold text-emerald-700">{currentForm.content.price}</span>
                </div>
              )}
              {currentForm.content.supplier && (
                <div>
                  <span className="text-slate-500 block text-2xs">中标供应商/制造商:</span>
                  <span>{currentForm.content.supplier}</span>
                </div>
              )}
            </div>

            {/* 核验条目列表 (若有) */}
            {currentForm.content.itemsChecked && (
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-semibold text-2xs">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">序号</th>
                      <th className="px-3 py-2">核验检验项目及标准</th>
                      <th className="px-3 py-2 w-28 text-center">验收测试结果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentForm.content.itemsChecked.map((chk, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-center font-mono text-slate-500 text-2xs">{i + 1}</td>
                        <td className="px-3 py-1.5 text-slate-700">{chk.item}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-emerald-700 text-2xs bg-emerald-50/30">
                          {chk.result}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 特殊描述栏 (若有) */}
            {currentForm.content.evaluationSummary && (
              <div className="p-3 border border-slate-300 rounded bg-white space-y-1">
                <div className="font-bold text-slate-900 text-2xs">技术鉴定综合评语：</div>
                <p className="text-2xs text-slate-700 leading-relaxed">{currentForm.content.evaluationSummary}</p>
              </div>
            )}

            {currentForm.content.appraisalConclusion && (
              <div className="p-3 border border-slate-300 rounded bg-white space-y-1">
                <div className="font-bold text-slate-900 text-2xs">技术报废鉴定结论：</div>
                <p className="text-2xs text-slate-700 leading-relaxed">{currentForm.content.appraisalConclusion}</p>
                <div className="text-2xs text-emerald-700 font-bold mt-1">{currentForm.content.salvageValue}</div>
              </div>
            )}

            {currentForm.content.solution && (
              <div className="p-3 border border-slate-300 rounded bg-white space-y-1">
                <div className="font-bold text-slate-900 text-2xs">排查与修复方案：</div>
                <p className="text-2xs text-slate-700">{currentForm.content.solution}</p>
                <div className="text-2xs text-blue-700 mt-1">{currentForm.content.electricalSafety}</div>
                <div className="text-2xs font-mono font-bold text-slate-900 mt-1">{currentForm.content.costDetail}</div>
              </div>
            )}

            {currentForm.content.incidentDesc && (
              <div className="p-3 border border-slate-300 rounded bg-white space-y-1">
                <div className="font-bold text-slate-900 text-2xs">突发事件经过与调查处置：</div>
                <p className="text-2xs text-slate-700 leading-relaxed">{currentForm.content.incidentDesc}</p>
                <p className="text-2xs text-slate-600 mt-1"><strong>现场调查：</strong>{currentForm.content.investigation}</p>
              </div>
            )}

            {/* 多方会签盖章区域 */}
            <div className="pt-4 border-t-2 border-slate-300">
              <div className="text-2xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                法定责任会签盖章区域 (电子签名与实物公章具有同等法律效力)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {currentForm.content.signatures.map((sig, sIdx) => (
                  <div key={sIdx} className="p-3 border border-slate-300 rounded bg-slate-50/40 relative">
                    <div className="text-2xs font-bold text-slate-600 mb-1">{sig.role}</div>
                    <div className="font-serif font-bold text-blue-900 text-xs sm:text-sm py-1.5 flex items-center justify-between">
                      <span>{sig.name}</span>
                      <Stamp className="w-5 h-5 text-red-600/30 shrink-0" />
                    </div>
                    <div className="text-2xs font-mono text-slate-400 mt-1">签署日期: {sig.date}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部附注 */}
            <div className="pt-3 text-2xs text-slate-400 flex items-center justify-between border-t border-slate-200">
              <span>五莲县人民医院医学装备管理委员会监制</span>
              <span>MED-TECH HOSPITAL OFFICIAL FORM · ISO9001 质量管理体系认证</span>
            </div>
          </div>
        </div>
      </div>

      {/* 交互式费用预批单生成工作台 */}
      <ExpensePreApprovalModal
        isOpen={isPreApprovalModalOpen}
        onClose={() => setIsPreApprovalModalOpen(false)}
        initialData={{
          id: '548',
          docNo: '548'
        }}
      />
    </div>
  );
};
