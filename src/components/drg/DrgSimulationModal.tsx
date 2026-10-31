import React, { useState, useMemo } from 'react';
import { DrgGroupMaster } from '../../types/drgTypes';
import { X, Calculator, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Layers } from 'lucide-react';

interface DrgSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: DrgGroupMaster[];
}

export const DrgSimulationModal: React.FC<DrgSimulationModalProps> = ({
  isOpen,
  onClose,
  groups
}) => {
  // 模拟输入表单状态
  const [selectedDrgCode, setSelectedDrgCode] = useState<string>(groups[0]?.drgCode || 'FM19');
  const [equipmentName, setEquipmentName] = useState<string>('拟引进高端4K三维腔镜系统');
  const [purchasePrice, setPurchasePrice] = useState<number>(2400000); // 240万
  const [deprYears, setDeprYears] = useState<number>(8); // 8年折旧
  const [annualMaintenanceFee, setAnnualMaintenanceFee] = useState<number>(60000); // 年维保6万
  const [hoursPerCase, setHoursPerCase] = useState<number>(2.5); // 单台手术开机2.5h
  const [consumableCostPerCase, setConsumableCostPerCase] = useState<number>(3600); // 配套专耗3600元
  const [estimatedMonthlyCases, setEstimatedMonthlyCases] = useState<number>(25); // 预估月开展例数25台
  const [otherCostPerCase, setOtherCostPerCase] = useState<number>(18000); // 药品/麻醉/床位其他成本

  const currentGroup = useMemo(() => {
    return groups.find(g => g.drgCode === selectedDrgCode) || groups[0];
  }, [groups, selectedDrgCode]);

  // 计算逻辑
  const simulationResult = useMemo(() => {
    const annualDepreciation = purchasePrice / deprYears;
    const monthlyFixedCost = (annualDepreciation + annualMaintenanceFee) / 12;

    // 假设设备年总工作机时 = 月例数 * 12 * 单台工时 (加 10% 调试保养预备)
    const annualRunningHours = Math.max(100, estimatedMonthlyCases * 12 * hoursPerCase);
    const hourlyCostBenchmark = Math.round((annualDepreciation + annualMaintenanceFee) / annualRunningHours);

    // 单病案分摊专机折旧机时成本
    const eqCostPerCase = Math.round(hoursPerCase * hourlyCostBenchmark);
    
    // 单病案测算总成本
    const totalCostPerCase = eqCostPerCase + consumableCostPerCase + otherCostPerCase;
    
    // 医保定额支付标准
    const benchmarkPay = currentGroup.benchmarkPayment;
    
    // 单病案医保结余
    const netBalPerCase = benchmarkPay - totalCostPerCase;
    
    // 月度总医疗收入与总结余
    const monthlyIncome = benchmarkPay * estimatedMonthlyCases;
    const monthlyNetBalance = netBalPerCase * estimatedMonthlyCases;

    // 保本点月手术例数 (Break-even volume)
    // 边际贡献 = 医保定额 - (配套专耗 + 其他变动成本)
    const contributionMarginPerCase = benchmarkPay - (consumableCostPerCase + otherCostPerCase);
    const breakEvenCasesMonthly = contributionMarginPerCase > 0 
      ? Math.ceil(monthlyFixedCost / contributionMarginPerCase)
      : -1;

    // 静态回收期 (年)
    const annualNetBalance = monthlyNetBalance * 12;
    const paybackYears = annualNetBalance > 0 
      ? +(purchasePrice / (annualNetBalance + annualDepreciation)).toFixed(1)
      : -1;

    return {
      hourlyCostBenchmark,
      eqCostPerCase,
      totalCostPerCase,
      benchmarkPay,
      netBalPerCase,
      monthlyIncome,
      monthlyNetBalance,
      breakEvenCasesMonthly,
      paybackYears,
      monthlyFixedCost: Math.round(monthlyFixedCost)
    };
  }, [
    purchasePrice, 
    deprYears, 
    annualMaintenanceFee, 
    hoursPerCase, 
    consumableCostPerCase, 
    estimatedMonthlyCases, 
    otherCostPerCase,
    currentGroup
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* 顶部标题 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                拟引进/升级医疗设备 DRG病组成本效益保本点模拟器
              </h2>
              <div className="text-xs text-slate-500">
                对标公立医院设备购置可行性论证与DRG支付改革下盈亏测算规范
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体两栏布局 */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：输入测算参数 (7列) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>测算参数设定</span>
            </h3>

            {/* 目标DRG病组选择 */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                目标DRG病组 (医保标额基准)
              </label>
              <select
                value={selectedDrgCode}
                onChange={(e) => {
                  setSelectedDrgCode(e.target.value);
                  const grp = groups.find(g => g.drgCode === e.target.value);
                  if (grp) {
                    setHoursPerCase(grp.dedicatedEquipment[0]?.standardHoursPerCase || 2.0);
                    setConsumableCostPerCase(grp.dedicatedConsumables[0]?.unitPrice || 2000);
                    setOtherCostPerCase(Math.round(grp.benchmarkPayment * 0.42));
                  }
                }}
                className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {groups.map(g => (
                  <option key={g.drgCode} value={g.drgCode}>
                    [{g.drgCode}] {g.drgName} ({g.departmentName} · 标额¥{g.benchmarkPayment.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  拟购置/升级设备名称
                </label>
                <input
                  type="text"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  设备拟采购总价 (元)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  折旧年限 (年)
                </label>
                <input
                  type="number"
                  min={3}
                  max={15}
                  value={deprYears}
                  onChange={(e) => setDeprYears(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  年度维保强检 (元)
                </label>
                <input
                  type="number"
                  step={5000}
                  value={annualMaintenanceFee}
                  onChange={(e) => setAnnualMaintenanceFee(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  例均专机工时 (小时)
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={hoursPerCase}
                  onChange={(e) => setHoursPerCase(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  配套专耗费 (元/例)
                </label>
                <input
                  type="number"
                  step={100}
                  value={consumableCostPerCase}
                  onChange={(e) => setConsumableCostPerCase(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  预估月手术量 (例)
                </label>
                <input
                  type="number"
                  min={1}
                  value={estimatedMonthlyCases}
                  onChange={(e) => setEstimatedMonthlyCases(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  其他医疗成本 (元/例)
                </label>
                <input
                  type="number"
                  step={500}
                  value={otherCostPerCase}
                  onChange={(e) => setOtherCostPerCase(+e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 右侧：模拟测算结果输出面板 (5列) */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-teal-500" />
                <span>DRG保本点与投资回收测算结论</span>
              </h3>

              {/* 核心指标卡群 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">单位有效机时成本:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    ¥{simulationResult.hourlyCostBenchmark} / 小时
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">单病案分摊专机折旧:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ¥{simulationResult.eqCostPerCase.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">单病案测算总成本:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ¥{simulationResult.totalCostPerCase.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">医保标额 vs 单案结余:</span>
                  <span className={`font-mono font-bold ${simulationResult.netBalPerCase >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {simulationResult.netBalPerCase >= 0 ? '+' : ''}¥{simulationResult.netBalPerCase.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">预估月度综合结余:</span>
                  <span className={`font-mono font-bold text-sm ${simulationResult.monthlyNetBalance >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {simulationResult.monthlyNetBalance >= 0 ? '+' : ''}¥{simulationResult.monthlyNetBalance.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">保本月手术开展例数:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {simulationResult.breakEvenCasesMonthly > 0 ? `${simulationResult.breakEvenCasesMonthly} 例/月` : '无法保本(变动超标)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-slate-500">预计设备回收期:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {simulationResult.paybackYears > 0 ? `${simulationResult.paybackYears} 年` : '不可行'}
                  </span>
                </div>
              </div>
            </div>

            {/* 结论评价 */}
            <div className={`mt-4 p-3 rounded-lg border text-xs ${
              simulationResult.netBalPerCase >= 0 && simulationResult.breakEvenCasesMonthly <= estimatedMonthlyCases
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}>
              <div className="font-semibold flex items-center gap-1 mb-1">
                {simulationResult.netBalPerCase >= 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>可行性论证结论</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {simulationResult.netBalPerCase >= 0
                  ? `在月开展 ${estimatedMonthlyCases} 例假设下，单病例医保结余良好，月度保本阈值为 ${simulationResult.breakEvenCasesMonthly} 例，具备优秀的DRG控费效益。`
                  : `单病例总医疗成本已超出医保标额定额，出现成本倒挂，建议压缩耗材单价或将单台手术机时控制在 ${(hoursPerCase * 0.8).toFixed(1)} 小时内。`}
              </p>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            完成测算并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
