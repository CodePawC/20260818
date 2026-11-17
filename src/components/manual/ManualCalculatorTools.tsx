import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Zap,
  Info
} from 'lucide-react';

export const ManualCalculatorTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'drg' | 'scrap' | 'adverse' | 'safety'>('drg');

  // 工具 1: DRG 专机折旧与保本点测算器
  const [calcPrice, setCalcPrice] = useState<number>(3200000);
  const [calcYears, setCalcYears] = useState<number>(8);
  const [calcSalvage, setCalcSalvage] = useState<number>(5);
  const [calcMonthlyCases, setCalcMonthlyCases] = useState<number>(680);
  const [calcFeePerCase, setCalcFeePerCase] = useState<number>(280);
  const [calcConsumableCost, setCalcConsumableCost] = useState<number>(45);
  const [calcStaffPowerCost, setCalcStaffPowerCost] = useState<number>(35);

  const drgResults = useMemo(() => {
    const totalMonths = Math.max(calcYears * 12, 1);
    const depreciableTotal = calcPrice * (1 - calcSalvage / 100);
    const monthlyDepreciation = depreciableTotal / totalMonths;
    const perCaseDepreciation = calcMonthlyCases > 0 ? monthlyDepreciation / calcMonthlyCases : 0;
    const totalVariableCostPerCase = calcConsumableCost + calcStaffPowerCost;
    const contributionMarginPerCase = Math.max(calcFeePerCase - totalVariableCostPerCase, 0.01);
    const breakEvenMonthlyCases = Math.ceil(monthlyDepreciation / contributionMarginPerCase);
    const monthlyNetIncome = (calcMonthlyCases * calcFeePerCase) - (calcMonthlyCases * totalVariableCostPerCase) - monthlyDepreciation;
    const annualNetIncome = monthlyNetIncome * 12;
    const paybackYears = annualNetIncome > 0 ? (calcPrice / annualNetIncome).toFixed(1) : '无法收回';

    return {
      monthlyDepreciation: Math.round(monthlyDepreciation),
      perCaseDepreciation: perCaseDepreciation.toFixed(1),
      breakEvenMonthlyCases,
      monthlyNetIncome: Math.round(monthlyNetIncome),
      paybackYears
    };
  }, [calcPrice, calcYears, calcSalvage, calcMonthlyCases, calcFeePerCase, calcConsumableCost, calcStaffPowerCost]);

  // 工具 2: 国有资产折旧与报废残值评估测算器
  const [assetOriginalValue, setAssetOriginalValue] = useState<number>(1200000);
  const [assetDepYears, setAssetDepYears] = useState<number>(8);
  const [assetSalvageRate, setAssetSalvageRate] = useState<number>(5);
  const [assetServedMonths, setAssetServedMonths] = useState<number>(84);
  const [assetScrapOffer, setAssetScrapOffer] = useState<number>(15000);

  const scrapResults = useMemo(() => {
    const totalMonths = assetDepYears * 12;
    const depreciableBase = assetOriginalValue * (1 - assetSalvageRate / 100);
    const monthlyStraightLine = depreciableBase / totalMonths;
    const effectiveServed = Math.min(assetServedMonths, totalMonths);
    const accumulatedDepreciation = monthlyStraightLine * effectiveServed;
    const netBookValue = Math.max(assetOriginalValue - accumulatedDepreciation, assetOriginalValue * (assetSalvageRate / 100));
    const salvageGainLoss = assetScrapOffer - (assetOriginalValue * (assetSalvageRate / 100));

    return {
      monthlyStraightLine: Math.round(monthlyStraightLine),
      accumulatedDepreciation: Math.round(accumulatedDepreciation),
      netBookValue: Math.round(netBookValue),
      salvageGainLoss: Math.round(salvageGainLoss),
      isFullyDepreciated: assetServedMonths >= totalMonths
    };
  }, [assetOriginalValue, assetDepYears, assetSalvageRate, assetServedMonths, assetScrapOffer]);

  // 工具 3: 医疗器械不良事件上报法定红线时限倒计时
  const [adverseLevel, setAdverseLevel] = useState<'death' | 'injury' | 'cluster' | 'general'>('injury');
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const adverseResults = useMemo(() => {
    const selectedDate = new Date(incidentDate);
    let workDaysLimit = 10;
    let desc = '导致患者严重伤害或永久器官机能受损';
    let urgency = '高危紧迫';

    if (adverseLevel === 'death') {
      workDaysLimit = 3;
      desc = '突发导致患者死亡恶性不良事件';
      urgency = '极度特急 (72小时红线)';
    } else if (adverseLevel === 'cluster') {
      workDaysLimit = 1;
      desc = '5例以上突发群体性严重不良事件';
      urgency = '紧急熔断 (立即直报)';
    } else if (adverseLevel === 'general') {
      workDaysLimit = 30;
      desc = '一般轻微器械可疑不良事件';
      urgency = '常规监测';
    }

    // 粗算工作日截止日期 (跳过周末)
    let cur = new Date(selectedDate);
    let addedDays = 0;
    while (addedDays < workDaysLimit) {
      cur.setDate(cur.getDate() + 1);
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    const today = new Date();
    const diffTime = cur.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      workDaysLimit,
      deadlineString: cur.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      remainingDays: diffDays,
      desc,
      urgency
    };
  }, [adverseLevel, incidentDate]);

  // 工具 4: GB 9706.1 医用电气安全测试限值达标校验器
  const [earthResistance, setEarthResistance] = useState<number>(0.08); // Ω
  const [chassisLeakage, setChassisLeakage] = useState<number>(35); // μA
  const [patientLeakage, setPatientLeakage] = useState<number>(12); // μA
  const [appliedPartType, setAppliedPartType] = useState<'B' | 'BF' | 'CF'>('CF');

  const safetyResults = useMemo(() => {
    // GB 9706.1-2020 标准限值:
    // 保护接地阻抗: <= 0.2 Ω (含电源线)
    // 外壳漏电流: 正常状态 <= 100 μA, 单一故障 <= 500 μA
    // 患者漏电流 (CF型): 正常状态 <= 10 μA (若超出则不合格)
    const earthOk = earthResistance <= 0.2;
    const chassisOk = chassisLeakage <= 100;

    let patientLimit = 100;
    if (appliedPartType === 'BF') patientLimit = 100;
    if (appliedPartType === 'CF') patientLimit = 10;
    if (appliedPartType === 'B') patientLimit = 100;

    const patientOk = patientLeakage <= patientLimit;
    const overallPass = earthOk && chassisOk && patientOk;

    return {
      earthOk,
      chassisOk,
      patientOk,
      patientLimit,
      overallPass
    };
  }, [earthResistance, chassisLeakage, patientLeakage, appliedPartType]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
      {/* 头部说明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
            <Calculator className="w-3 h-3 text-purple-600" />
            <span>精细化测算与工程合规工具箱</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>四大医院医工管理智能测算器</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            覆盖国家 DRG 专机折旧分摊、国有资产报废残值评估、不良事件法定上报时限倒计时及 GB 9706.1 电气安全合规判定。
          </p>
        </div>

        {/* 工具选择选项卡 */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start sm:self-center overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTool('drg')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'drg' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. DRG 专机保本点
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('scrap')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'scrap' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. 资产报废与残值
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('adverse')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'adverse' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. 不良事件时限
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('safety')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'safety' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. 电气安全合规
          </button>
        </div>
      </div>

      {/* 测算器 1: DRG 专机折旧与保本点测算器 */}
      {activeTool === 'drg' && (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>测算原理与价值：</strong>依据国家医保局 DRG/DIP 付费病组成本核算指南，通过设备购入原值、折旧年限及边际贡献率，计算单次检查应摊折旧额及月度保本门槛人次（Break-Even Point），辅助科室合理规划排班与避免亏损。
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧参数输入区 (占 7 列) */}
            <div className="lg:col-span-7 space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                基础参数录入 (支持自由微调)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    设备购置原值 (元)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(Math.max(Number(e.target.value), 10000))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    财务设计折旧年限 (年)
                  </label>
                  <input
                    type="number"
                    value={calcYears}
                    onChange={(e) => setCalcYears(Math.max(Number(e.target.value), 1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    法定净残值率 (%)
                  </label>
                  <input
                    type="number"
                    value={calcSalvage}
                    onChange={(e) => setCalcSalvage(Math.max(Number(e.target.value), 0))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    月度预估开机人次 (例)
                  </label>
                  <input
                    type="number"
                    value={calcMonthlyCases}
                    onChange={(e) => setCalcMonthlyCases(Math.max(Number(e.target.value), 1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    DRG 病组单次分摊收入 (元/例)
                  </label>
                  <input
                    type="number"
                    value={calcFeePerCase}
                    onChange={(e) => setCalcFeePerCase(Math.max(Number(e.target.value), 1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    单次专属耗材成本 (元/例)
                  </label>
                  <input
                    type="number"
                    value={calcConsumableCost}
                    onChange={(e) => setCalcConsumableCost(Math.max(Number(e.target.value), 0))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* 右侧测算结果卡片 (占 5 列) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-blue-800 pb-3">
                  <span className="text-2xs font-bold uppercase tracking-wider text-blue-300">DRG 专机效益核算结果</span>
                  <span className="px-2 py-0.5 rounded text-2xs bg-blue-800 text-blue-200">实时测算</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-2xs text-blue-300 block">月度固定折旧计提额</span>
                    <div className="text-2xl font-bold font-mono">
                      ¥ {drgResults.monthlyDepreciation.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-blue-800/60">
                    <div>
                      <span className="text-2xs text-blue-300 block">单例检查折旧成本</span>
                      <div className="text-base font-bold font-mono text-emerald-300">
                        ¥ {drgResults.perCaseDepreciation}
                      </div>
                    </div>
                    <div>
                      <span className="text-2xs text-blue-300 block">月度保本门槛人次</span>
                      <div className="text-base font-bold font-mono text-amber-300">
                        {drgResults.breakEvenMonthlyCases} 例/月
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-blue-800/60">
                    <div>
                      <span className="text-2xs text-blue-300 block">月度预估净收益</span>
                      <div className={`text-base font-bold font-mono ${drgResults.monthlyNetIncome >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                        ¥ {drgResults.monthlyNetIncome.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-2xs text-blue-300 block">预计投资静态回收期</span>
                      <div className="text-base font-bold font-mono text-blue-200">
                        {drgResults.paybackYears} 年
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-800/60 text-2xs text-blue-300">
                {calcMonthlyCases >= drgResults.breakEvenMonthlyCases ? (
                  <span className="text-emerald-300">
                    ✓ 当前开机人次 ({calcMonthlyCases}例) 高于保本点，处于良性盈利区间。
                  </span>
                ) : (
                  <span className="text-rose-300">
                    ⚠ 当前开机人次低于保本点 ({drgResults.breakEvenMonthlyCases}例)，需统筹排班提高利用率。
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 测算器 2: 国有资产折旧与报废残值评估 */}
      {activeTool === 'scrap' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>国有资产折旧与报废核销：</strong>依据《行政事业性国有资产管理条例》，资产报废须严格按照年限平均法计提折旧，精确核实当前账面净值、累计折旧及残值回收收益，杜绝国有资产流失。
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                设备资产财务底账参数
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    设备购入原值 (元)
                  </label>
                  <input
                    type="number"
                    value={assetOriginalValue}
                    onChange={(e) => setAssetOriginalValue(Math.max(Number(e.target.value), 1000))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    规定折旧年限 (年)
                  </label>
                  <input
                    type="number"
                    value={assetDepYears}
                    onChange={(e) => setAssetDepYears(Math.max(Number(e.target.value), 1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    预计净残值率 (%)
                  </label>
                  <input
                    type="number"
                    value={assetSalvageRate}
                    onChange={(e) => setAssetSalvageRate(Math.max(Number(e.target.value), 0))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    实际已服役月数 (月)
                  </label>
                  <input
                    type="number"
                    value={assetServedMonths}
                    onChange={(e) => setAssetServedMonths(Math.max(Number(e.target.value), 1))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    第三方回收商竞价残值报价 (元)
                  </label>
                  <input
                    type="number"
                    value={assetScrapOffer}
                    onChange={(e) => setAssetScrapOffer(Math.max(Number(e.target.value), 0))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-emerald-900 to-teal-950 text-white p-6 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
                  <span className="text-2xs font-bold uppercase tracking-wider text-emerald-300">国有资产折旧与报废鉴定</span>
                  <span className="px-2 py-0.5 rounded text-2xs bg-emerald-800 text-emerald-200">
                    {scrapResults.isFullyDepreciated ? '已提足折旧' : '折旧期内'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-2xs text-emerald-300 block">当前账面净值 (Net Book Value)</span>
                    <div className="text-2xl font-bold font-mono text-white">
                      ¥ {scrapResults.netBookValue.toLocaleString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-emerald-800/60">
                    <div>
                      <span className="text-2xs text-emerald-300 block">已累计计提折旧</span>
                      <div className="text-base font-bold font-mono text-emerald-200">
                        ¥ {scrapResults.accumulatedDepreciation.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-2xs text-emerald-300 block">月折旧额</span>
                      <div className="text-base font-bold font-mono text-emerald-200">
                        ¥ {scrapResults.monthlyStraightLine.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 border-t border-emerald-800/60">
                    <span className="text-2xs text-emerald-300 block">残值处置收益偏离</span>
                    <div className={`text-base font-bold font-mono ${scrapResults.salvageGainLoss >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {scrapResults.salvageGainLoss >= 0 ? '+' : ''}¥ {scrapResults.salvageGainLoss.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-emerald-800/60 text-2xs text-emerald-300">
                {scrapResults.isFullyDepreciated
                  ? '该设备已达到或超出规定折旧寿命，符合四级报废技术鉴定与下账申请前置条件。'
                  : '提示：设备尚未提足折旧，若非重大不可逆故障或安全隐患，原则上不建议提前报废。'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 测算器 3: 不良事件上报法定红线倒计时 */}
      {activeTool === 'adverse' && (
        <div className="space-y-6">
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 leading-relaxed">
              <strong>国家法定上报时限红线：</strong>依据《医疗器械不良事件监测和再评价管理办法》（国家总局令第1号），死亡事件须3个工作日内直报，严重伤害须10个工作日内直报。倒计时到期前未报将面临通报与行政处罚。
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                不良事件发生参数
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    不良事件危害严重等级
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'death', label: '导致患者死亡', tag: '3个工作日' },
                      { key: 'injury', label: '严重伤害/机能受损', tag: '10个工作日' },
                      { key: 'cluster', label: '突发群体事件', tag: '立即报告' },
                      { key: 'general', label: '一般可疑事件', tag: '30日内' }
                    ].map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setAdverseLevel(item.key as any)}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                          adverseLevel === item.key
                            ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs">{item.label}</div>
                        <div className="text-2xs text-rose-600 font-mono mt-0.5">{item.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    事件发生/发现日期
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-rose-900 to-red-950 text-white p-6 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-rose-800 pb-3">
                  <span className="text-2xs font-bold uppercase tracking-wider text-rose-300">直报倒计时雷达</span>
                  <span className="px-2 py-0.5 rounded text-2xs bg-rose-800 text-rose-200">
                    {adverseResults.urgency}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-2xs text-rose-300 block">法定最迟上报截止日期</span>
                    <div className="text-2xl font-bold font-mono text-white">
                      {adverseResults.deadlineString}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-rose-800/60">
                    <div>
                      <span className="text-2xs text-rose-300 block">法定工作日限值</span>
                      <div className="text-base font-bold font-mono text-rose-200">
                        {adverseResults.workDaysLimit} 个工作日
                      </div>
                    </div>
                    <div>
                      <span className="text-2xs text-rose-300 block">距今剩余自然天</span>
                      <div className={`text-base font-bold font-mono ${adverseResults.remainingDays <= 2 ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {adverseResults.remainingDays > 0 ? `${adverseResults.remainingDays} 天` : '已超期'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-800/60 text-2xs text-rose-300">
                国家直报系统通道：国家药品监督管理局医疗器械不良事件监测网络 (adverse.gov.cn)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 测算器 4: GB 9706.1 医用电气安全测试限值校验器 */}
      {activeTool === 'safety' && (
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 leading-relaxed">
              <strong>GB 9706.1-2020 强制性标准核验：</strong>医用电气设备在投用、大修及强检时，必须执行医用电气安全测试。若接地阻抗 &gt;0.2Ω 或外壳/患者漏电流超标，将存在微电击致死风险，系统将自动锁定机具。
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4 bg-slate-50 border border-slate-200 p-5 rounded-xl">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                实测电气安全参数
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    应用部分分类 (CF / BF / B)
                  </label>
                  <select
                    value={appliedPartType}
                    onChange={(e) => setAppliedPartType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="CF">CF 型 (直接作用于心脏，如除颤、心导管)</option>
                    <option value="BF">BF 型 (身体接触，如超声、心电图)</option>
                    <option value="B">B 型 (一般体外接触，如电动病床)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    保护接地阻抗 (Ω / 限值 &le;0.2Ω)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={earthResistance}
                    onChange={(e) => setEarthResistance(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    外壳漏电流 (μA / 限值 &le;100μA)
                  </label>
                  <input
                    type="number"
                    value={chassisLeakage}
                    onChange={(e) => setChassisLeakage(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    患者漏电流 (μA / CF限值 &le;10μA)
                  </label>
                  <input
                    type="number"
                    value={patientLeakage}
                    onChange={(e) => setPatientLeakage(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
                  <span className="text-2xs font-bold uppercase tracking-wider text-indigo-300">电气安全评定结论</span>
                  <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                    safetyResults.overallPass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {safetyResults.overallPass ? '测试合格·准予临床使用' : '安全不达标·严禁上岗'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <span>保护接地阻抗: {earthResistance} Ω</span>
                    <span className="font-mono font-bold">
                      {safetyResults.earthOk ? <span className="text-emerald-400">合格 (&le;0.2Ω)</span> : <span className="text-rose-400">超标</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <span>外壳对地漏电流: {chassisLeakage} μA</span>
                    <span className="font-mono font-bold">
                      {safetyResults.chassisOk ? <span className="text-emerald-400">合格 (&le;100μA)</span> : <span className="text-rose-400">超标</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <span>患者漏电流: {patientLeakage} μA</span>
                    <span className="font-mono font-bold">
                      {safetyResults.patientOk ? <span className="text-emerald-400">合格 (&le;{safetyResults.patientLimit}μA)</span> : <span className="text-rose-400">超标</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-indigo-800/60 text-2xs text-indigo-300">
                符合标准：GB 9706.1-2020《医用电气设备 第1部分：基本安全和基本性能的通用要求》
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
