import React, { useState } from 'react';
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Activity,
  FileText,
  Clock,
  Sparkles,
  PhoneCall,
  Flame,
  Check,
  ChevronRight,
  Layers,
  Camera,
  Download
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface OperationalSandboxProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
}

export const OperationalSandbox: React.FC<OperationalSandboxProps> = ({
  onNavigateTab,
  showToast
}) => {
  const [activeScenario, setActiveScenario] = useState<'repair' | 'loan' | 'adverse'>('repair');

  // 场景 1：临床急诊抢修闭环全演练状态
  const [repairStep, setRepairStep] = useState<number>(1);
  const [repairSelectedDevice, setRepairSelectedDevice] = useState<'ventilator' | 'monitor' | 'defib'>('ventilator');
  const [repairPriority, setRepairPriority] = useState<'P0' | 'P1' | 'P2'>('P0');
  const [repairSymptom, setRepairSymptom] = useState<string>('呼气阀膜片破损，机器出现持续 High Pressure 报警且无法维持PEEP');
  const [engineerAssigned, setEngineerAssigned] = useState<string>('李明 (重症支持专职工程师 - 工号 ET-041)');
  const [sparePartCode, setSparePartCode] = useState<string>('SP-DRG-V300-VALVE (德尔格原装呼气阀总成，库存: 4套)');
  const [electricalTested, setElectricalTested] = useState<boolean>(true);
  const [nurseSignature, setNurseSignature] = useState<string>('张晓燕 (ICU护士长)');
  const [satisfactionScore, setSatisfactionScore] = useState<number>(5);

  // 场景 2：急救设备跨科室借调演练状态
  const [loanStep, setLoanStep] = useState<number>(1);
  const [borrowingDept, setBorrowingDept] = useState<string>('普外科二病区');
  const [loanDeviceType, setLoanDeviceType] = useState<string>('迈瑞除颤监护仪 BeneHeart D6');
  const [sourceDept, setSourceDept] = useState<string>('急救医学中心设备暂存共享池');
  const [loanDurationHours, setLoanDurationHours] = useState<number>(24);
  const [accessoriesChecked, setAccessoriesChecked] = useState<{ [key: string]: boolean }>({
    cable: true,
    pads: true,
    battery: true,
    conductiveGel: true
  });

  // 场景 3：不良事件警戒直报演练状态
  const [adverseStep, setAdverseStep] = useState<number>(1);
  const [adverseLevel, setAdverseLevel] = useState<'severe' | 'injury' | 'potential'>('injury');
  const [adverseEventDesc, setAdverseEventDesc] = useState<string>('术中高频电刀负极板边缘微翘，导致患者右大腿外侧局部I度浅表灼伤红肿（约2cm×1cm）');
  const [evidencePreserved, setEvidencePreserved] = useState<boolean>(true);
  const [reportDeadlineDays, setReportDeadlineDays] = useState<number>(10);

  const handleResetRepair = () => {
    setRepairStep(1);
    if (showToast) showToast('已重置抢修演练流程');
  };

  const handleResetLoan = () => {
    setLoanStep(1);
    if (showToast) showToast('已重置应急借调演练流程');
  };

  const handleResetAdverse = () => {
    setAdverseStep(1);
    if (showToast) showToast('已重置不良事件演练流程');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
      {/* 演练沙盘头部说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>无破坏性·免登录体验·交互式仿真</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>核心业务闭环实操演练沙盘</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            提供三大最核心、最严苛的医疗装备业务流转情景模拟。操作仅在沙盘内存中演算，绝不污染正式业务数据库。
          </p>
        </div>

        {/* 场景切换按钮组 */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveScenario('repair')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeScenario === 'repair'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-blue-600" />
            <span>1. 临床报修闭环</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScenario('loan')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeScenario === 'loan'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. 急救应急借调</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveScenario('adverse')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeScenario === 'adverse'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>3. 不良事件直报</span>
          </button>
        </div>
      </div>

      {/* 场景 1: 临床报修闭环五步法演练 */}
      {activeScenario === 'repair' && (
        <div className="space-y-6">
          {/* 步骤条 */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { num: 1, label: '扫码发起报修' },
              { num: 2, label: '响应SLA与派工' },
              { num: 3, label: '现场检修换件' },
              { num: 4, label: '通电复核签字' },
              { num: 5, label: '结案与归档' }
            ].map((step) => {
              const isDone = repairStep > step.num;
              const isCurr = repairStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurr
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs font-bold'
                      : isDone
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full text-2xs flex items-center justify-center ${isCurr ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {step.num}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 步骤具体内容卡片 */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            {repairStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>步骤 1：临床护士长扫描机身防水活码直报</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 01 / 05</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      模拟扫码选定故障机具
                    </label>
                    <select
                      value={repairSelectedDevice}
                      onChange={(e) => setRepairSelectedDevice(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ventilator">德尔格呼吸机 Evita V300 (ICU-04 / SN: DRG-88219)</option>
                      <option value="monitor">迈瑞多参数监护仪 uMEC12 (普外-12 / SN: MR-55910)</option>
                      <option value="defib">飞利浦除颤监护仪 XL+ (急诊-02 / SN: PH-22019)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      紧急度判定级别 (触发不同 SLA 响应)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['P0', 'P1', 'P2'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setRepairPriority(lvl)}
                          className={`p-2 rounded-lg border text-2xs font-bold text-center cursor-pointer transition-colors ${
                            repairPriority === lvl
                              ? lvl === 'P0'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : lvl === 'P1'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {lvl === 'P0' ? 'P0 抢救紧急 (20分)' : lvl === 'P1' ? 'P1 重要平诊 (2小时)' : 'P2 常规维保 (24小时)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    故障现象与报错描述 (临床真实录入)
                  </label>
                  <input
                    type="text"
                    value={repairSymptom}
                    onChange={(e) => setRepairSymptom(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-2xs text-blue-800 flex items-center justify-between">
                  <span>点击「提交报修」，系统将依据网格自动锁定责任工程师并发出飞书/微信急诊抢修提醒。</span>
                  <button
                    type="button"
                    onClick={() => setRepairStep(2)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0 ml-3 flex items-center gap-1 text-xs"
                  >
                    <span>提交模拟报修</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {repairStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>步骤 2：医学工程调度中心派工与零配件预占</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 02 / 05</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <div className="text-2xs font-bold text-slate-500 uppercase">工单派发详情</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">工单流水号:</span>
                      <span className="font-mono font-bold text-slate-900">WO-202610-8801</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">优先级响应:</span>
                      <span className="px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-800">{repairPriority} 抢救紧急 (倒计时 20:00)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">被指派工程师:</span>
                      <span className="font-medium text-blue-700">{engineerAssigned}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <div className="text-2xs font-bold text-slate-500 uppercase">备品备件智能锁定</div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">锁定备件:</span>
                      <span className="font-bold text-slate-900">{sparePartCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">备件出库状态:</span>
                      <span className="text-emerald-700 font-medium">已自动预占，待随工出库</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">预估维修费:</span>
                      <span className="font-mono font-bold text-slate-900">¥1,450.00 (备件成本)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setRepairStep(1)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairStep(3)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>工程师接单并到达现场</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {repairStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>步骤 3：现场排障换件与 GB 9706.1 医用电气安全测试</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 03 / 05</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3 text-xs">
                  <div className="font-bold text-slate-900">工程师技术排查记录</div>
                  <p className="text-slate-600 leading-relaxed text-2xs">
                    拆解德尔格呼吸机呼气盒，确认呼气阀硅胶密封圈由于长期蒸汽灭菌老化发硬破损，导致气密性失效。更换新总成后气密性打压测试 60hPa 保持无衰减。
                  </p>

                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>医用电气安全测试 (GB 9706.1 强制标准)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-200 text-emerald-800">全部达标</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-2xs text-emerald-800">
                      <div>接地保护阻抗: <strong>0.07 Ω</strong> (限值 &le;0.2Ω)</div>
                      <div>对地漏电流: <strong>42 μA</strong> (限值 &le;500μA)</div>
                      <div>机壳漏电流: <strong>18 μA</strong> (限值 &le;100μA)</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setRepairStep(2)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairStep(4)}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>完工报验并提交临床复核</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {repairStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span>步骤 4：临床科室实机通电复核与手写电子签名</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 04 / 05</span>
                </div>

                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>实机通电试机验证（严禁未试机擅自签字）</span>
                  </div>
                  <p className="text-2xs text-amber-800">
                    临床护士长当面连接模拟肺，测试呼吸机通气波形正常、氧浓度监测误差 &lt;±2%，通气无漏气报警。
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-2xs font-bold text-slate-700 mb-1">
                        临床科室手写电子签名人
                      </label>
                      <input
                        type="text"
                        value={nurseSignature}
                        onChange={(e) => setNurseSignature(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold text-slate-700 mb-1">
                        服务满意度评价 (1~5星)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setSatisfactionScore(star)}
                            className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                              satisfactionScore >= star ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="text-2xs font-bold text-amber-700 ml-2">{satisfactionScore} 星极高满意</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setRepairStep(3)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairStep(5)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>确认手写签名并结案</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {repairStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>步骤 5：系统自动闭环结案与设备状态回滚</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 05 / 05</span>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>抢修闭环全流程圆满达成！</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs text-emerald-800">
                    <div className="p-2 bg-white/80 rounded border border-emerald-200">
                      <span className="text-slate-500 block">设备状态变化</span>
                      <strong className="text-emerald-700">故障待修 &rarr; 正常运行</strong>
                    </div>
                    <div className="p-2 bg-white/80 rounded border border-emerald-200">
                      <span className="text-slate-500 block">响应履约时长</span>
                      <strong className="text-emerald-700">14 分钟 (优于20分标准)</strong>
                    </div>
                    <div className="p-2 bg-white/80 rounded border border-emerald-200">
                      <span className="text-slate-500 block">库存备品扣减</span>
                      <strong className="text-emerald-700">4套 &rarr; 3套 (自动出库)</strong>
                    </div>
                    <div className="p-2 bg-white/80 rounded border border-emerald-200">
                      <span className="text-slate-500 block">三联凭证归档</span>
                      <strong className="text-emerald-700">PDF电子印章已归档</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetRepair}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重新演练一遍</span>
                  </button>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('repairs')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <span>前往正式「临床报修处置」页面</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 场景 2: 急救设备跨科室借调演练 */}
      {activeScenario === 'loan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: '临床紧急发起' },
              { num: 2, label: '共享机库智能匹配' },
              { num: 3, label: '附件与性能核验' },
              { num: 4, label: '归还与状态复原' }
            ].map((step) => {
              const isDone = loanStep > step.num;
              const isCurr = loanStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurr
                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 shadow-2xs font-bold'
                      : isDone
                      ? 'bg-blue-50/60 border-blue-200 text-blue-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full text-2xs flex items-center justify-center ${isCurr ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {step.num}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            {loanStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>步骤 1：普外科病区急诊收治，跨科室急需生命支持机具</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 01 / 04</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">借调科室</label>
                    <input
                      type="text"
                      value={borrowingDept}
                      onChange={(e) => setBorrowingDept(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">急需设备机型</label>
                    <input
                      type="text"
                      value={loanDeviceType}
                      onChange={(e) => setLoanDeviceType(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">预估借调时长 (小时)</label>
                    <input
                      type="number"
                      value={loanDurationHours}
                      onChange={(e) => setLoanDurationHours(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-2xs text-emerald-800 flex items-center justify-between">
                  <span>点击「检索全院急救机库」，系统将基于蓝牙信标与空间定位智能匹配空闲机具。</span>
                  <button
                    type="button"
                    onClick={() => setLoanStep(2)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shrink-0 ml-3 flex items-center gap-1 text-xs"
                  >
                    <span>智能机库匹配</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loanStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>步骤 2：全院急救机库智能匹配结果</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 02 / 04</span>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">命中匹配设备：迈瑞 BeneHeart D6 (编号: EQ-DEFIB-008)</span>
                    <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">在位空闲可用</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs text-slate-600 pt-1">
                    <div>当前所在位置: <strong>急救中心 1F 备用区</strong></div>
                    <div>距离申请科室: <strong>约 130 米 (电梯直达)</strong></div>
                    <div>强检定标有效期: <strong>剩余 168 天</strong></div>
                    <div>机内电池健康度: <strong>100% 满充就绪</strong></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setLoanStep(1)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanStep(3)}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>核验随机附件并出库</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loanStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>步骤 3：交接出库前 4 大必备附件点检</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 03 / 04</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: 'cable', label: '心电导联电缆 (5导)' },
                    { key: 'pads', label: '体外除颤板 (成人/儿童二合一)' },
                    { key: 'battery', label: '锂电池组及医用电源线' },
                    { key: 'conductiveGel', label: '导电膏 (未过期且余量充足)' }
                  ].map((acc) => (
                    <button
                      key={acc.key}
                      type="button"
                      onClick={() => setAccessoriesChecked(prev => ({ ...prev, [acc.key]: !prev[acc.key] }))}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        accessoriesChecked[acc.key]
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xs font-mono">{acc.key}</span>
                        {accessoriesChecked[acc.key] ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                        )}
                      </div>
                      <div className="text-2xs">{acc.label}</div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setLoanStep(2)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanStep(4)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>确认出库并启动倒计时</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loanStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>步骤 4：在用监管倒计时与安全归还闭环</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 04 / 04</span>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>借调出库成功！系统已自动生成电子交接单号 LN-202610-0992</span>
                  </div>
                  <div className="p-3 bg-white/90 rounded-lg border border-emerald-200 text-2xs text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>实时使用时长监测:</span>
                      <strong className="text-emerald-700 font-mono">倒计时 23:59:45 正常运行中</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>借用科室责任人:</span>
                      <span>普外科护士长 (王桂兰)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>系统风险策略:</span>
                      <span>借用超期前 2 小时将向双方护士长推送微信企业号归还提醒</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetLoan}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重新演练借调</span>
                  </button>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('emergency_reserve')}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <span>前往正式「急救调配」机库</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 场景 3: 不良事件警戒直报演练 */}
      {activeScenario === 'adverse' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: '事件识别与评估' },
              { num: 2, label: '物证封存留样' },
              { num: 3, label: '法定红线倒计时' },
              { num: 4, label: '直报表单导出' }
            ].map((step) => {
              const isDone = adverseStep > step.num;
              const isCurr = adverseStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    isCurr
                      ? 'bg-rose-50/80 border-rose-400 text-rose-900 shadow-2xs font-bold'
                      : isDone
                      ? 'bg-blue-50/60 border-blue-200 text-blue-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 text-xs">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full text-2xs flex items-center justify-center ${isCurr ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {step.num}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            {adverseStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>步骤 1：医疗器械不良事件识别与严重程度研判</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 01 / 04</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {(['severe', 'injury', 'potential'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setAdverseLevel(lvl);
                        setReportDeadlineDays(lvl === 'severe' ? 3 : lvl === 'injury' ? 10 : 30);
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                        adverseLevel === lvl
                          ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">
                          {lvl === 'severe' ? '导致患者死亡' : lvl === 'injury' ? '严重伤害 / 器官损伤' : '一般伤害或潜在隐患'}
                        </span>
                      </div>
                      <div className="text-2xs text-rose-700 font-mono">
                        法定上报时限：{lvl === 'severe' ? '3 个工作日内' : lvl === 'injury' ? '10 个工作日内' : '30 个自然日内'}
                      </div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">不良事件发生经过简述</label>
                  <input
                    type="text"
                    value={adverseEventDesc}
                    onChange={(e) => setAdverseEventDesc(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-2xs text-slate-500">
                    注：依据国家《医疗器械不良事件监测和再评价管理办法》，隐瞒不报将追究单位责任。
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdverseStep(2)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>锁定机具并物证留存</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {adverseStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span>步骤 2：就地停用、物证留样与批号封存</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 02 / 04</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                  <div className="font-bold text-slate-900">必须立即执行的三项保全动作：</div>
                  <div className="space-y-1.5 text-2xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1. 机身挂牌「暂停使用·封存取证」，并在系统台账中一键变更为「停用锁定」；</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. 封存涉事同批次负极板耗材（批号：LOT-20240915，未拆封剩余 45 片）；</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>3. 拍摄患者创面照片、电刀功率设置界面及负极板接触面留存证据链。</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAdverseStep(1)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdverseStep(3)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>确认物证保全并核算时限</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {adverseStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>步骤 3：国家直报法定红线倒计时看板</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 03 / 04</span>
                </div>

                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-sm">法定上报倒计时红线</span>
                    <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-mono font-bold text-xs">
                      剩余 {reportDeadlineDays} 个工作日
                    </span>
                  </div>
                  <p className="text-2xs text-rose-800 leading-relaxed">
                    医学工程科质控组已收到短信与系统双重加急派工，须在规定工作日内登入国家医疗器械不良事件监测信息系统（www.adverse.gov.cn）填报《医疗器械不良事件/事件可疑报告》。
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setAdverseStep(2)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    返回上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdverseStep(4)}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>生成直报表单</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {adverseStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>步骤 4：标准化 NMPA 直报表单生成与归档</span>
                  </h4>
                  <span className="text-2xs text-slate-500 font-mono">STEP 04 / 04</span>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>国家标准不良事件上报凭证生成完毕 (编号: MDR-202610-0012)</span>
                  </div>
                  <p className="text-2xs text-emerald-800">
                    已自动同步召回雷达，若同厂家在全国范围内发布同批次召回通知，系统将秒级弹窗提示全院排查。
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetAdverse}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重新演练</span>
                  </button>
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('adverse_events')}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <span>前往正式「不良事件直报」模块</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
