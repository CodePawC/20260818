import React from 'react';
import { 
  Receipt, 
  Wallet, 
  Coins, 
  Scale, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CalendarCheck2,
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import { MonthlyFrameworkBatch } from '../types/vendorCollaborationTypes';
import { ActiveTab } from '../types';

interface PinnedFinancialKpiGridProps {
  batches: MonthlyFrameworkBatch[];
  monthlyRepairCost: number;
  healthRate: number;
  normalCount: number;
  faultCount: number;
  borrowedCount: number;
  urgentReconcileCount: number;
  totalDiffAmount: number;
  isDeptView?: boolean;
  userDept?: string;
  pendingDeptSignoffsCount?: number;
  upcomingPmCount?: number;
  lifeSupportCount?: number;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onScrollToReconciliation?: () => void;
  onNavigateToApprovals?: () => void;
}

export const PinnedFinancialKpiGrid: React.FC<PinnedFinancialKpiGridProps> = ({
  batches,
  monthlyRepairCost,
  healthRate,
  normalCount,
  faultCount,
  borrowedCount,
  urgentReconcileCount,
  totalDiffAmount,
  isDeptView,
  userDept,
  pendingDeptSignoffsCount = 0,
  upcomingPmCount = 0,
  lifeSupportCount = 0,
  onNavigateToTab,
  onScrollToReconciliation,
  onNavigateToApprovals
}) => {
  // 1. 计算未开票项目指标（管理科室/全院视角）
  const allItems = batches.flatMap(b => b.items);
  const uninvoicedItems = allItems.filter(it => !it.invoiced);
  const uninvoicedAmount = uninvoicedItems.reduce((s, it) => s + (it.totalPrice || 0), 0);
  const uninvoicedCount = uninvoicedItems.length;
  const uninvoicedBatches = batches.filter(b => b.invoiceStatus === 'NOT_INVOICED' || b.paymentStatus === 'UNBILLED');

  // 2. 计算待回款与清结进度指标（管理科室/全院视角）
  const totalSettledAmount = batches.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const paidAmount = batches.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const pendingCollectionAmount = Math.max(0, totalSettledAmount - paidAmount);
  const collectionRate = totalSettledAmount > 0 ? Math.round((paidAmount / totalSettledAmount) * 100) : 0;
  const inTransitBatches = batches.filter(b => b.paymentStatus === 'IN_TRANSIT');

  // 3. 计算月度维修费用与核减节约指标
  const auditSavings = 4120.00; // 医工审定协议核减节约

  return (
    <div 
      id="pinned-financial-kpi-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 shrink-0"
    >
      {/* ========================================================================================= */}
      {/* 临床科室人员视角 VS 管理科室/全院视角卡片精准区分 */}
      {/* 临床视角下彻底隐藏：1.未开票项目归集 2.待回款与清结进度 4.双方即时对账待办 */}
      {/* ========================================================================================= */}

      {!isDeptView ? (
        <>
          {/* ==================== 管理科室/全院核心卡片 1: 未开票项目归集 (置顶高亮) ==================== */}
          <div 
            id="kpi-uninvoiced-items"
            onClick={() => onNavigateToTab?.('vendor_collaboration')}
            className="bg-white rounded-xl border border-amber-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>未开票项目归集</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  待供应商上传发票
                </span>
              </div>

              <div>
                <div className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-amber-700 transition">
                  ¥{uninvoicedAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>共 <strong className="text-slate-800 font-mono font-bold">{uninvoicedCount}</strong> 笔明细待开票</span>
                  <span className="text-[10.5px] text-amber-700 font-medium">涉及 {uninvoicedBatches.length || 1} 个批次</span>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
              <span className="truncate">2026年09月度批次施工已毕</span>
              <span className="text-amber-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
                <span>对账核验</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* ==================== 管理科室/全院核心卡片 2: 待回款与清结进度 (置顶高亮) ==================== */}
          <div 
            id="kpi-pending-collection"
            onClick={() => onNavigateToTab?.('vendor_collaboration')}
            className="bg-white rounded-xl border border-emerald-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>待回款与清结进度</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  回款率 {collectionRate}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-emerald-700 transition">
                    ¥{pendingCollectionAmount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">在途/待拨付</span>
                </div>

                {/* 进度条 */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(12, collectionRate))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>已入账: <strong className="font-mono text-emerald-700">¥{paidAmount.toLocaleString()}</strong></span>
              <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
                <span>电汇流水</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ==================== 临床科室专属卡片 1: 急救生命支持与在运监护保障 ==================== */}
          <div 
            id="kpi-clinical-life-support"
            onClick={() => onNavigateToTab?.('ledger')}
            className="bg-white rounded-xl border border-teal-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>急救生命支持保障</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  100% 待命在运
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-teal-700 transition">
                    {lifeSupportCount || normalCount}
                  </span>
                  <span className="text-xs font-bold text-slate-600">台核心急救设备</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>呼吸机/除颤仪/监护仪</span>
                  <span className="text-teal-700 font-medium">完好率 100%</span>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
              <span className="truncate">晨班点检全覆盖</span>
              <span className="text-teal-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
                <span>设备清单</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* ==================== 临床科室专属卡片 2: 科室审批流转与初审待办 ==================== */}
          <div 
            id="kpi-clinical-pending-signoffs"
            onClick={onNavigateToApprovals}
            className="bg-white rounded-xl border border-indigo-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                  <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                  <span>科室审批流转待办</span>
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  pendingDeptSignoffsCount > 0 
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 animate-pulse' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {pendingDeptSignoffsCount > 0 ? `${pendingDeptSignoffsCount} 笔待科审` : '已全部批结'}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-indigo-700 transition">
                    {pendingDeptSignoffsCount}
                  </span>
                  <span className="text-xs font-bold text-slate-600">项申请需科室确认</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                  <span>采购论证 / 借调 / 维保</span>
                  <span className="text-indigo-700 font-medium">护士长/科主任签署</span>
                </div>
              </div>
            </div>

            <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
              <span className="truncate">协同审批工作流</span>
              <span className="text-indigo-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
                <span>进入审核</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </>
      )}

      {/* ==================== 核心卡片 3: 维保支出/维修费用 (按视角动态呈现) ==================== */}
      <div 
        id="kpi-repair-cost"
        onClick={() => onNavigateToTab?.('vendor_collaboration')}
        className="bg-white rounded-xl border border-blue-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
              <Coins className="w-4 h-4 text-blue-600" />
              <span>{isDeptView && userDept ? `${userDept}维保支出` : '月度维保费用支出'}</span>
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {isDeptView ? '科室支出统计' : '环比 -3.2%'}
            </span>
          </div>

          <div>
            <div className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-blue-700 transition">
              ¥{monthlyRepairCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>{isDeptView ? '本年度维保与换件累计' : '医工审定核减节约'}</span>
              <span className="font-mono font-bold text-emerald-600">
                {isDeptView ? '含定期保养及巡检' : `-¥${auditSavings.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
          <span>{isDeptView ? '设备定期保养与配件维保' : '零星维保与专项抢修'}</span>
          <span className="text-blue-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
            <span>费用明细</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 核心卡片 4: 管理科室视角为“双方即时对账待办”；临床科室人员视角切换为“近期待强检/维保预警提醒” */}
      {/* 临床视角下绝不显示未开票、待回款、双方对账等财务代办！ */}
      {/* ========================================================================================= */}
      {!isDeptView ? (
        <div 
          id="kpi-instant-reconciliation"
          onClick={onScrollToReconciliation}
          className="bg-white rounded-xl border border-rose-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                <Scale className="w-4 h-4 text-rose-600" />
                <span>双方即时对账待办</span>
              </span>
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>需即时核签</span>
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-rose-700 transition">
                  {urgentReconcileCount}
                </span>
                <span className="text-xs font-bold text-slate-600">笔工单需双向确认</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>核减待认领差额</span>
                <span className="font-mono font-bold text-rose-600">¥{totalDiffAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
            <span>旧件退库与差额核对</span>
            <span className="text-rose-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
              <span>立即处理</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      ) : (
        <div 
          id="kpi-clinical-pm-calibration"
          onClick={() => onNavigateToTab?.('ledger')}
          className="bg-white rounded-xl border border-amber-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
                <CalendarCheck2 className="w-4 h-4 text-amber-600" />
                <span>强检与定期保养预警</span>
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                upcomingPmCount > 0 
                  ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {upcomingPmCount > 0 ? `${upcomingPmCount} 台临期关注` : '周期正常'}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-amber-700 transition">
                  {upcomingPmCount}
                </span>
                <span className="text-xs font-bold text-slate-600">台近期需定标维保</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                <span>30-60天法定强检/定标</span>
                <span className="text-amber-700 font-medium">防患于未然</span>
              </div>
            </div>
          </div>

          <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
            <span className="truncate">提前安排送检/工程师到科</span>
            <span className="text-amber-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
              <span>查看计划</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}

      {/* ==================== 核心卡片 5: 全院/科室设备完好率 (资产健康) ==================== */}
      <div 
        id="kpi-equipment-health-rate"
        onClick={() => onNavigateToTab?.('ledger')}
        className="bg-white rounded-xl border border-indigo-200/90 shadow-2xs hover:shadow-xs transition-all p-3 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{isDeptView && userDept ? `${userDept}设备完好率` : '全院设备完好率'}</span>
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
              生命支持 100%
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black font-mono text-slate-900 tracking-tight group-hover:text-indigo-700 transition">
                {healthRate}%
              </span>
              <span className="text-[11px] text-slate-400 font-medium">完好在运</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
              <span>正常 <strong className="font-mono text-emerald-700">{normalCount}</strong> 台</span>
              <span>故障 <strong className="font-mono text-rose-600">{faultCount}</strong> 台</span>
            </div>
          </div>
        </div>

        <div className="pt-2 mt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
          <span>应急在借: {borrowedCount} 台</span>
          <span className="text-indigo-700 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 shrink-0">
            <span>设备台账</span>
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

