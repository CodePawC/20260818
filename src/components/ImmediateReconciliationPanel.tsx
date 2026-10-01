import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  Check, 
  ShieldCheck, 
  Scale, 
  RotateCcw,
  ExternalLink,
  Info,
  Calendar,
  Building2,
  User,
  Wrench,
  X
} from 'lucide-react';
import { MonthlyFrameworkBatch, MonthlyFrameworkItem } from '../types/vendorCollaborationTypes';
import { ActiveTab } from '../types';

export interface ImmediateReconciliationItem {
  id: string;
  batchId: string;
  itemId?: string;
  workOrderNo: string;
  title: string;
  department: string;
  vendorName: string;
  engineerName: string;
  clinicalSignee: string;
  serviceDate: string;
  category: 'diff' | 'parts' | 'signoff' | 'invoice';
  categoryLabel: string;
  declaredAmount: number;
  approvedAmount: number;
  diffAmount: number; // positive means declared > approved (audit deduction)
  oldPartsStatus?: 'pending_return' | 'returned';
  urgency: 'urgent' | 'high' | 'normal';
  status: 'pending' | 'reconciled';
  description: string;
  auditReason?: string;
  notes?: string;
}

interface ImmediateReconciliationPanelProps {
  batches: MonthlyFrameworkBatch[];
  isDeptView?: boolean;
  userDept?: string;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onItemReconciled?: (item: ImmediateReconciliationItem) => void;
}

export const ImmediateReconciliationPanel: React.FC<ImmediateReconciliationPanelProps> = ({
  batches,
  isDeptView,
  userDept,
  onNavigateToTab,
  onItemReconciled
}) => {
  // 过滤 Tab: 'all' | 'diff' | 'parts' | 'signoff' | 'invoice'
  const [activeTab, setActiveTab] = useState<'all' | 'diff' | 'parts' | 'signoff' | 'invoice'>('all');
  
  // 详情弹窗
  const [inspectingItem, setInspectingItem] = useState<ImmediateReconciliationItem | null>(null);

  // 成功提示反馈
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 待办即时对账事项状态（支持本地交互已认领）
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set());

  // 真实组装院企双方需即时对账的待办工单与批次
  const initialUrgentItems: ImmediateReconciliationItem[] = [
    {
      id: 'URG-001',
      batchId: 'BATCH-2026-08',
      itemId: 'ITEM-202608-05',
      workOrderNo: 'REP-202608-05',
      title: '重症医学科(ICU) 飞利浦高阶多参数监护仪心电主板芯片排障与导联线换新',
      department: '重症医学科(ICU)',
      vendorName: '国药器械医工技术服务 (中国) 有限公司',
      engineerName: '陈志远',
      clinicalSignee: '李建华 护士长',
      serviceDate: '2026/8/22',
      category: 'diff',
      categoryLabel: '金额核减待认领',
      declaredAmount: 1800.00,
      approvedAmount: 1500.00,
      diffAmount: 300.00,
      oldPartsStatus: 'pending_return',
      urgency: 'urgent',
      status: 'pending',
      description: '原厂配件依全院零星维保框架协议下浮15%计价，核减 ¥300.00；换下损坏主板需原样交回医工资产库。',
      auditReason: '零星维保框架第四章第三条“耗材配件限价结算”条款',
    },
    {
      id: 'URG-002',
      batchId: 'BATCH-2026-08',
      itemId: 'ITEM-202608-11',
      workOrderNo: 'REP-202608-11',
      title: '医学影像科 悬吊DR探测器温控传感单元检修与电路板加固',
      department: '医学影像科',
      vendorName: '国药器械医工技术服务 (中国) 有限公司',
      engineerName: '王强',
      clinicalSignee: '张主任技师',
      serviceDate: '2026/8/19',
      category: 'diff',
      categoryLabel: '工时费核减',
      declaredAmount: 3600.00,
      approvedAmount: 3200.00,
      diffAmount: 400.00,
      oldPartsStatus: 'returned',
      urgency: 'high',
      status: 'pending',
      description: '医工科现场复核该探测器工时依据，调减多列工时费 ¥400.00，等待服务商财务确认同意。',
      auditReason: '定额工时复核核减',
    },
    {
      id: 'URG-003',
      batchId: 'BATCH-2026-08',
      itemId: 'ITEM-202608-17',
      workOrderNo: 'REP-202608-17',
      title: '麻醉手术科 德尔格麻醉机活瓣箱总成换新与气路密闭性检测试压',
      department: '麻醉手术科',
      vendorName: '国药器械医工技术服务 (中国) 有限公司',
      engineerName: '李强',
      clinicalSignee: '王敏 护士长',
      serviceDate: '2026/8/24',
      category: 'parts',
      categoryLabel: '旧件退库待验',
      declaredAmount: 2200.00,
      approvedAmount: 2200.00,
      diffAmount: 0.00,
      oldPartsStatus: 'pending_return',
      urgency: 'urgent',
      status: 'pending',
      description: '新件已装机验收，换下的高价值废旧活瓣箱总成待双方库管人员双签原样退库验收单。',
      auditReason: '四流合规“以旧换新”硬性内控要求',
    },
    {
      id: 'URG-004',
      batchId: 'BATCH-2026-08',
      workOrderNo: 'BATCH-2026-08-SIGNOFF',
      title: '2026年08月度全院零星维保结算批次联合审签单',
      department: '全院各临床科室',
      vendorName: '国药器械医工技术服务 (中国) 有限公司',
      engineerName: '驻场服务总监',
      clinicalSignee: '各科室护士长会签',
      serviceDate: '2026/8/31',
      category: 'signoff',
      categoryLabel: '四方联合审签',
      declaredAmount: 29660.00,
      approvedAmount: 28710.00,
      diffAmount: 950.00,
      oldPartsStatus: 'returned',
      urgency: 'urgent',
      status: 'pending',
      description: '全批次26项零星维修工程量已审核完毕，等待临床代表、医工科主管与供应商代表联合电子会签。',
      auditReason: '完成四方盖章后流转财务科安排集中电汇拨付',
    },
    {
      id: 'URG-005',
      batchId: 'BATCH-2026-09',
      workOrderNo: 'INV-202609-WAIT',
      title: '2026年09月度全院零星维保增值税专用发票与税控清单待比对',
      department: '财务科 & 医工科',
      vendorName: '国药器械医工技术服务 (中国) 有限公司',
      engineerName: '财务开票专员',
      clinicalSignee: '医工资产核算组',
      serviceDate: '2026/9/05',
      category: 'invoice',
      categoryLabel: '发票销货清单',
      declaredAmount: 21368.00,
      approvedAmount: 21368.00,
      diffAmount: 0.00,
      oldPartsStatus: 'returned',
      urgency: 'high',
      status: 'pending',
      description: '09月度批次13项零星维保已完成临床施工，待供应商上传防伪税控销货清单与增值税发票。',
      auditReason: '金税盘销货清单与系统单据逐笔勾稽核对',
    },
    {
      id: 'URG-006',
      batchId: 'BATCH-2026-08',
      itemId: 'ITEM-202608-22',
      workOrderNo: 'REP-202608-22',
      title: '急诊科 迈瑞便携式心电监护仪按键面板与锂电池组维护',
      department: '急诊科',
      vendorName: '国药器械医工技术服务 (中国) 有限公司',
      engineerName: '陈志远',
      clinicalSignee: '赵护士长',
      serviceDate: '2026/8/26',
      category: 'diff',
      categoryLabel: '金额核减待认领',
      declaredAmount: 1250.00,
      approvedAmount: 1000.00,
      diffAmount: 250.00,
      oldPartsStatus: 'pending_return',
      urgency: 'normal',
      status: 'pending',
      description: '原装电池依据医院大批量框架集采价格审定核减 ¥250.00；废旧电池交由危废库房。',
      auditReason: '集采价格库自动对齐',
    }
  ];

  // 动态筛选：如果处于科室视图，优先显示本科室待办
  const filteredItems = initialUrgentItems
    .filter(item => {
      // 1. 本地状态是否已被处理
      const isResolved = reconciledIds.has(item.id);
      if (isResolved) return false;

      // 2. 科室过滤
      if (isDeptView && userDept) {
        const matchesDept = item.department.includes(userDept) || item.department.includes('全院');
        if (!matchesDept) return false;
      }

      // 3. Tab过滤
      if (activeTab === 'diff') return item.category === 'diff';
      if (activeTab === 'parts') return item.category === 'parts';
      if (activeTab === 'signoff') return item.category === 'signoff';
      if (activeTab === 'invoice') return item.category === 'invoice';
      return true;
    });

  // 处理即时认领/双签确认
  const handleResolveItem = (item: ImmediateReconciliationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setReconciledIds(prev => new Set(prev).add(item.id));
    setActionFeedback(`双方已确认同意【${item.workOrderNo}】核算结论，已生成协同公文留痕！`);
    setTimeout(() => setActionFeedback(null), 4000);
    onItemReconciled?.(item);
  };

  const totalDiffAmount = filteredItems.reduce((s, it) => s + it.diffAmount, 0);

  return (
    <div 
      id="immediate-reconciliation-panel"
      className="bg-white rounded-xl border-2 border-amber-300 shadow-xs flex flex-col min-h-0 overflow-hidden relative"
    >
      {/* 顶部高亮标头 */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/15 via-amber-50/50 to-white border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping absolute"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 relative"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-600" />
                <span>院企双方即时对账待办协同舱</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                {filteredItems.length} 笔需双方即时核签
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              四流合规内控 · 审定核减差异认领 · 换下旧件原样退库双签 · 四方联合会签
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToTab?.('vendor_collaboration')}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title="前往月度框架对账工作台处理全量48项明细"
          >
            <span>进入月度对账工作台</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 协同反馈提示条 */}
      {actionFeedback && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 px-3.5 py-1.5 text-xs flex items-center justify-between shadow-2xs shrink-0 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionFeedback}</span>
          </div>
          <button 
            onClick={() => setActionFeedback(null)} 
            className="text-emerald-700 hover:text-emerald-950 font-bold"
          >
            关闭
          </button>
        </div>
      )}

      {/* 分类快捷筛选药丸栏 */}
      <div className="px-3 py-1.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-1.5 shrink-0 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2 py-0.8 rounded-md font-bold transition cursor-pointer flex items-center gap-1 text-[11px] ${
              activeTab === 'all'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <span>全部待办</span>
            <span className="px-1 py-0.2 rounded bg-white/20 text-[9.5px]">
              {initialUrgentItems.filter(it => !reconciledIds.has(it.id)).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diff')}
            className={`px-2 py-0.8 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 text-[11px] ${
              activeTab === 'diff'
                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-white hover:text-rose-700'
            }`}
          >
            <span>⚠️ 审定核减差异</span>
            <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-800 text-[9.5px] font-bold">
              {initialUrgentItems.filter(it => it.category === 'diff' && !reconciledIds.has(it.id)).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parts')}
            className={`px-2 py-0.8 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 text-[11px] ${
              activeTab === 'parts'
                ? 'bg-amber-700 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-white hover:text-amber-800'
            }`}
          >
            <span>📦 旧件退库待验</span>
            <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-900 text-[9.5px] font-bold">
              {initialUrgentItems.filter(it => it.category === 'parts' && !reconciledIds.has(it.id)).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signoff')}
            className={`px-2 py-0.8 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 text-[11px] ${
              activeTab === 'signoff'
                ? 'bg-blue-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-white hover:text-blue-800'
            }`}
          >
            <span>✍️ 四方联合会签</span>
            <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-800 text-[9.5px] font-bold">
              {initialUrgentItems.filter(it => it.category === 'signoff' && !reconciledIds.has(it.id)).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoice')}
            className={`px-2 py-0.8 rounded-md font-semibold transition cursor-pointer flex items-center gap-1 text-[11px] ${
              activeTab === 'invoice'
                ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:bg-white hover:text-emerald-800'
            }`}
          >
            <span>🧾 发票销货清单</span>
            <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold">
              {initialUrgentItems.filter(it => it.category === 'invoice' && !reconciledIds.has(it.id)).length}
            </span>
          </button>
        </div>

        {totalDiffAmount > 0 && (
          <div className="text-[11px] text-slate-500 shrink-0 font-medium">
            当前核减待认领差额: <strong className="text-rose-600 font-mono">¥{totalDiffAmount.toFixed(2)}</strong>
          </div>
        )}
      </div>

      {/* 待办工单列表主体 */}
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-2.5 space-y-1.5">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 min-h-[160px]">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 opacity-90 mb-1.5" />
            <p className="text-slate-800 font-bold text-xs">当前暂无待双向认领的对账待办</p>
            <p className="text-[11px] text-slate-400 mt-0.5">全院零星维保四流审签与核算差异均已核销归档</p>
            <button
              type="button"
              onClick={() => onNavigateToTab?.('vendor_collaboration')}
              className="mt-2.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>查看月度历史归档与发票台账</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const isDiff = item.category === 'diff';
            const isParts = item.category === 'parts';
            const isSignoff = item.category === 'signoff';
            const isInvoice = item.category === 'invoice';

            return (
              <div 
                key={item.id}
                onClick={() => setInspectingItem(item)}
                className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDiff 
                    ? 'bg-rose-50/40 hover:bg-rose-50/70 border-rose-200' 
                    : isParts
                    ? 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200'
                    : isSignoff
                    ? 'bg-blue-50/40 hover:bg-blue-50/70 border-blue-200'
                    : 'bg-emerald-50/30 hover:bg-emerald-50/60 border-emerald-200'
                }`}
              >
                {/* 左侧信息 */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      isDiff 
                        ? 'bg-rose-100 text-rose-800 border-rose-300' 
                        : isParts
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : isSignoff
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {item.categoryLabel}
                    </span>

                    <span className="font-mono text-xs font-bold text-slate-700 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200">
                      {item.workOrderNo}
                    </span>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.department}
                    </span>

                    <span className="text-[10.5px] text-slate-400 font-mono">
                      {item.serviceDate}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-amber-700 transition truncate">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-3 text-[10.5px] text-slate-500 flex-wrap pt-0.5">
                    <span>施工: <strong className="text-slate-700">{item.engineerName}</strong></span>
                    <span>验收: <strong className="text-slate-700">{item.clinicalSignee}</strong></span>
                    {item.oldPartsStatus === 'pending_return' && (
                      <span className="text-amber-700 font-bold bg-amber-100/80 px-1.5 py-0.2 rounded">
                        旧件待交库房
                      </span>
                    )}
                  </div>
                </div>

                {/* 右侧金额对比与快速操作 */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                  <div className="text-right font-mono">
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-[11px] text-slate-400 line-through">
                        申 ¥{item.declaredAmount.toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        定 ¥{item.approvedAmount.toFixed(2)}
                      </span>
                    </div>

                    {item.diffAmount > 0 ? (
                      <div className="text-[10px] font-bold text-rose-600 flex items-center justify-end gap-0.5">
                        <span>核减 -¥{item.diffAmount.toFixed(2)}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-0.5">
                        <span>金额无差额</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleResolveItem(item, e)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                      title="点击确认双方认领同意该核算结果"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>确认认领</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingItem(item);
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap"
                      title="查看五单合一单据凭证"
                    >
                      <span>单据</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ==================== 详情与单据核验模态框 ==================== */}
      {inspectingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-amber-600 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">
                  院企双方即时对账 · 单据凭证与核减详情
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs text-slate-700 flex-1">
              {/* 核心工单卡 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    工单号: {inspectingItem.workOrderNo}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {inspectingItem.categoryLabel}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {inspectingItem.title}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                  <span>发生科室: {inspectingItem.department}</span>
                  <span>施工日期: {inspectingItem.serviceDate}</span>
                </div>
              </div>

              {/* 申报与审定金额对比表 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                  <span>金额对账与核减核算表</span>
                  <span className="text-[11px] text-slate-500 font-mono">单位: 人民币(元)</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-200 text-center p-3">
                  <div>
                    <div className="text-[11px] text-slate-500">供应商申报金额</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      ¥{inspectingItem.declaredAmount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">医工科审定金额</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                      ¥{inspectingItem.approvedAmount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">审定核减差额</div>
                    <div className={`text-base font-bold font-mono mt-0.5 ${
                      inspectingItem.diffAmount > 0 ? 'text-rose-600' : 'text-slate-700'
                    }`}>
                      {inspectingItem.diffAmount > 0 ? `-¥${inspectingItem.diffAmount.toFixed(2)}` : '¥0.00'}
                    </div>
                  </div>
                </div>
                {inspectingItem.auditReason && (
                  <div className="bg-rose-50/70 border-t border-rose-100 px-3 py-1.5 text-[11px] text-rose-800">
                    <strong>核减依据:</strong> {inspectingItem.auditReason}
                  </div>
                )}
              </div>

              {/* 四流合规“五单合一”内控核验进度 */}
              <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>四流合规 · “五单合一”审计证据链核验</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span>1. 临床报修派工依据</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> 已齐备
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span>2. 驻场工程师技术服务单</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> 签字确认
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg border flex items-center justify-between ${
                    inspectingItem.oldPartsStatus === 'returned'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  }`}>
                    <span>3. 换下旧件原样以旧换新</span>
                    <span>{inspectingItem.oldPartsStatus === 'returned' ? '已退库入库' : '待送交库房!'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <span>4. 科室护士长/技师长验收</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> {inspectingItem.clinicalSignee}
                    </span>
                  </div>
                </div>
              </div>

              {/* 协作说明 */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>院企双方协同确认说明</span>
                </div>
                <p>
                  点击“确认认领无误”后，双方财务核算单据将锁定该审定价格并计入月度结算清册，不再产生二次争议。
                </p>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setInspectingItem(null);
                  onNavigateToTab?.('vendor_collaboration');
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                前往月度工作台编辑
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  关闭
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    handleResolveItem(inspectingItem, e);
                    setInspectingItem(null);
                  }}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确认双方认领同意</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
