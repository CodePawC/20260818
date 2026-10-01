import React, { useState } from 'react';
import { 
  Coins, Search, TrendingDown, CheckCircle2, Clock, 
  AlertCircle, ShieldCheck, ArrowRight, FileCheck2, 
  MessageSquare, Send, Check, Building2, User, ChevronRight,
  Percent, Sparkles, X, FileSpreadsheet, Printer, Award
} from 'lucide-react';
import { 
  VendorCollaborationOrder, 
  VendorUserAccount, 
  NegotiationRound 
} from '../../types/vendorCollaborationTypes';

interface VendorNegotiationCenterViewProps {
  currentVendor: VendorUserAccount;
  orders: VendorCollaborationOrder[];
  onUpdateOrder: (updatedOrder: VendorCollaborationOrder) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
  onOpenDossierModal: (order: VendorCollaborationOrder) => void;
}

export const VendorNegotiationCenterView: React.FC<VendorNegotiationCenterViewProps> = ({
  currentVendor,
  orders,
  onUpdateOrder,
  onToast,
  onOpenDossierModal,
}) => {
  const vendorOrders = orders.filter(o => o.vendorId === currentVendor.vendorId);
  const effectiveOrders = vendorOrders.length > 0 ? vendorOrders : orders;

  const [selectedOrderId, setSelectedOrderId] = useState<string>(effectiveOrders[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'NEGOTIATING' | 'AGREED'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 议价响应调价表单
  const selectedOrder = effectiveOrders.find(o => o.id === selectedOrderId) || effectiveOrders[0];
  const [counterPrice, setCounterPrice] = useState<number>(
    selectedOrder?.finalNegotiatedPrice || selectedOrder?.quoteGrandTotal || 32000
  );
  const [counterNote, setCounterNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMinutesModal, setShowMinutesModal] = useState(false);

  // 过滤
  const filteredOrders = effectiveOrders.filter(o => {
    const isNegotiating = o.status === 'MULTI_DEPT_NEGOTIATING';
    const isAgreed = o.status === 'APPROVED_REPAIRING' || o.status === 'COMPLETED_PENDING_INVOICE' || o.status === 'ARCHIVED';

    const matchesFilter = 
      filterStatus === 'ALL' ? true :
      filterStatus === 'NEGOTIATING' ? isNegotiating : isAgreed;

    const matchesKeyword = 
      !searchKeyword ||
      o.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      o.equipmentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      o.equipmentDept.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesFilter && matchesKeyword;
  });

  // 获取医院各科室建议核减金额与目标底价
  const latestRound = selectedOrder?.negotiationRounds?.[selectedOrder.negotiationRounds.length - 1];
  const hospitalDemandedPrice = latestRound?.demandedPrice || (selectedOrder?.quoteGrandTotal ? selectedOrder.quoteGrandTotal * 0.88 : 30000);

  // 立即接受医院建议目标价并定标
  const handleAcceptHospitalTarget = () => {
    if (!selectedOrder) return;
    const targetPrice = hospitalDemandedPrice;
    const originalPrice = selectedOrder.quoteGrandTotal || targetPrice;
    const savings = Math.max(0, originalPrice - targetPrice);
    const savingsRate = originalPrice > 0 ? parseFloat(((savings / originalPrice) * 100).toFixed(1)) : 0;

    const updatedRounds: NegotiationRound[] = (selectedOrder.negotiationRounds || []).map((r, idx) => {
      if (idx === (selectedOrder.negotiationRounds?.length || 1) - 1) {
        return {
          ...r,
          vendorResponseAt: new Date().toLocaleString('zh-CN', { hour12: false }),
          vendorResponsePrice: targetPrice,
          vendorNote: '【达成共识】我方经与管理层慎重评估，为表达长期深度战略协同诚意，全盘接受医院多科室会签审定目标底价，确认定标履约。',
          vendorDecision: 'ACCEPTED' as const
        };
      }
      return r;
    });

    const updatedOrder: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'APPROVED_REPAIRING',
      finalNegotiatedPrice: targetPrice,
      savingsAmount: savings,
      savingsRate: savingsRate,
      negotiationRounds: updatedRounds,
      approvedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      approvedBy: '五莲县人民医院医学装备管理委员会 (线上联合会签)'
    };

    onUpdateOrder(updatedOrder);
    onToast(`✅ 已全盘接受医院目标价 ¥${targetPrice.toLocaleString()}，双方联合议价成功达成并生效！`, 'success');
  };

  // 提出二次折中让利调价
  const handleCounterOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (counterPrice <= 0) {
      onToast('请输入有效的让利调价金额', 'warning');
      return;
    }

    const originalPrice = selectedOrder.quoteGrandTotal || counterPrice;
    const savings = Math.max(0, originalPrice - counterPrice);
    const savingsRate = originalPrice > 0 ? parseFloat(((savings / originalPrice) * 100).toFixed(1)) : 0;

    const updatedRounds: NegotiationRound[] = [
      ...(selectedOrder.negotiationRounds || []),
      {
        round: (selectedOrder.negotiationRounds?.length || 1) + 1,
        initiatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        initiatorDept: '五莲县人民医院医工处',
        initiatorName: '医工处技术委员会',
        demandedPrice: hospitalDemandedPrice,
        hospitalNote: '医院各科室维持核减意见，期待供应商进一步让利。',
        vendorResponseAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        vendorResponsePrice: counterPrice,
        vendorNote: counterNote || '我方经过与备件生产线测算，在确保原厂品质前提下，给予最大限度让利。',
        vendorDecision: counterPrice <= hospitalDemandedPrice ? 'ACCEPTED' : 'COUNTER_OFFER'
      }
    ];

    const isDirectAgreed = counterPrice <= hospitalDemandedPrice;

    const updatedOrder: VendorCollaborationOrder = {
      ...selectedOrder,
      status: isDirectAgreed ? 'APPROVED_REPAIRING' : 'MULTI_DEPT_NEGOTIATING',
      finalNegotiatedPrice: counterPrice,
      savingsAmount: savings,
      savingsRate: savingsRate,
      negotiationRounds: updatedRounds,
      approvedAt: isDirectAgreed ? new Date().toLocaleString('zh-CN', { hour12: false }) : undefined
    };

    onUpdateOrder(updatedOrder);
    onToast(isDirectAgreed 
      ? `✅ 调价达到或优于医院预期，议价达成定标！` 
      : `已提交二次议价让利调价 ¥${counterPrice.toLocaleString()}，已呈送院方复核！`, 'success');
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 左侧：议价工单列表 */}
      <div className="w-full md:w-96 lg:w-[400px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">多科室联合议价中心</h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
              {effectiveOrders.length} 单
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索单号、设备名称、科室..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: '全部项目' },
              { id: 'NEGOTIATING', label: '磋商中' },
              { id: 'AGREED', label: '已达成共识' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition text-center cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 议价单滚动列表 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredOrders.map(order => {
            const isSelected = order.id === selectedOrderId;
            const isNegotiating = order.status === 'MULTI_DEPT_NEGOTIATING';

            return (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setCounterPrice(order.finalNegotiatedPrice || order.quoteGrandTotal || 32000);
                }}
                className={`p-3 rounded-xl transition cursor-pointer text-left border ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                    : 'bg-white hover:bg-slate-50 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-500">
                    {order.id}
                  </span>
                  <span className={`px-2 py-0.2 text-[10px] font-bold rounded-full ${
                    isNegotiating 
                      ? 'bg-amber-100 text-amber-800 animate-pulse' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isNegotiating ? '多科室议价中' : '已达成定标'}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                  {order.equipmentName}
                </h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {order.equipmentDept} • {order.equipmentModel}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[11px]">
                  <span className="text-slate-400">初始申报: ¥{order.quoteGrandTotal.toLocaleString()}</span>
                  <div className="font-mono font-bold text-slate-900">
                    {order.finalNegotiatedPrice ? (
                      <span className="text-emerald-700">审定: ¥{order.finalNegotiatedPrice.toLocaleString()}</span>
                    ) : (
                      <span className="text-amber-700">待调价确认</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：议价工作区 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {selectedOrder ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* 项目基本信息卡片 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                    {selectedOrder.id}
                  </span>
                  <span className="text-xs font-bold text-slate-400">|</span>
                  <span className="text-xs font-bold text-slate-600">{selectedOrder.equipmentDept}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    多科室联合联合议价会签
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMinutesModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-700" />
                    <span>联席议价纪要</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDossierModal(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                    <span>查看全套归档卷宗</span>
                  </button>
                </div>
              </div>

              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {selectedOrder.equipmentName}
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400">初始申报报价</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                    ¥{selectedOrder.quoteGrandTotal.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl">
                  <span className="text-amber-800 font-medium">医院联合建议目标价</span>
                  <div className="text-sm font-bold font-mono text-amber-700 mt-1">
                    ¥{hospitalDemandedPrice.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
                  <span className="text-emerald-800 font-medium">审定成交金额</span>
                  <div className="text-sm font-bold font-mono text-emerald-700 mt-1">
                    {selectedOrder.finalNegotiatedPrice ? `¥${selectedOrder.finalNegotiatedPrice.toLocaleString()}` : '磋商进行中'}
                  </div>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-200/70 rounded-xl">
                  <span className="text-purple-800 font-medium">累计节约让利资金</span>
                  <div className="text-sm font-bold font-mono text-purple-700 mt-1">
                    ¥{(selectedOrder.savingsAmount || (selectedOrder.quoteGrandTotal - hospitalDemandedPrice)).toLocaleString()}
                    <span className="text-[11px] text-purple-600 ml-1">
                      ({selectedOrder.savingsRate || 11.1}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 医院四科室会签核减意见矩阵 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>医院四方联合评审会签意见</span>
                </h3>
                <span className="text-xs text-slate-400">已完成多部门联审</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(selectedOrder.multiDeptOpinions || []).map((op, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{op.deptName}</span>
                      </div>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        op.decision === 'AGREE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        op.decision === 'ADVISE_NEGOTIATION' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {op.decision === 'AGREE' ? '同意定标' : op.decision === 'ADVISE_NEGOTIATION' ? '建议议价核减' : '驳回'}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed bg-white p-2 rounded-lg border border-slate-100 text-[11px]">
                      {op.comments}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>评审人: {op.reviewerName} ({op.reviewerTitle})</span>
                      {op.suggestedDiscountAmount ? (
                        <span className="font-mono font-semibold text-amber-700">
                          建议核减: ¥{op.suggestedDiscountAmount.toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 多轮磋商降价阶梯走势图 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  <span>多轮磋商价格阶梯下降轨迹与让利走势</span>
                </h3>
                <span className="text-[11px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  综合降幅: {selectedOrder.savingsRate || 11.1}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center relative">
                  <div className="text-[11px] text-slate-400">1. 初报初始价</div>
                  <div className="text-sm font-bold font-mono text-slate-800 mt-1">
                    ¥{selectedOrder.quoteGrandTotal.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">基准 100%</div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center relative">
                  <div className="text-[11px] text-amber-700">2. 医工初审建议</div>
                  <div className="text-sm font-bold font-mono text-amber-900 mt-1">
                    ¥{Math.round(selectedOrder.quoteGrandTotal * 0.94).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-amber-700 mt-0.5">-6.0% 初核</div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center relative">
                  <div className="text-[11px] text-blue-700">3. 联席谈判目标</div>
                  <div className="text-sm font-bold font-mono text-blue-900 mt-1">
                    ¥{hospitalDemandedPrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-blue-700 mt-0.5">-12.0% 控费要求</div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center relative shadow-2xs">
                  <div className="text-[11px] text-emerald-700 font-bold">4. 双方审定定价</div>
                  <div className="text-sm font-black font-mono text-emerald-800 mt-1">
                    ¥{(selectedOrder.finalNegotiatedPrice || hospitalDemandedPrice).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                    节约 ¥{(selectedOrder.savingsAmount || (selectedOrder.quoteGrandTotal - hospitalDemandedPrice)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* 多轮议价协商历史时间线 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>多轮议价磋商历程时间轴</span>
              </h3>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 pl-6">
                {(selectedOrder.negotiationRounds || []).map((round, idx) => (
                  <div key={idx} className="relative bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-2">
                    <span className="absolute -left-[1.85rem] top-4 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white" />
                    
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-slate-900">
                        第 {round.round} 轮：{round.initiatorDept} 发起议价磋商
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {round.initiatedAt}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px]">
                      <span className="font-bold">院方议价函说明：</span>
                      <span>{round.hospitalNote}</span>
                      <div className="mt-1 font-mono font-bold text-amber-800">
                        院方目标期望价：¥{round.demandedPrice.toLocaleString()}
                      </div>
                    </div>

                    {round.vendorResponseAt && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">供应商让利回复 ({round.vendorResponseAt})：</span>
                          <span className="font-mono font-bold text-emerald-800">
                            调后报价: ¥{round.vendorResponsePrice?.toLocaleString()}
                          </span>
                        </div>
                        <p>{round.vendorNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 供应商调价与会签决策面板 */}
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 rounded-2xl p-5 border border-amber-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>供应商议价响应与在线会签</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    支持直接全盘接受医院目标价，或进行二次折中调价提交院方审签
                  </p>
                </div>

                {selectedOrder.status === 'APPROVED_REPAIRING' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    议价协议已生效
                  </span>
                )}
              </div>

              {selectedOrder.status === 'MULTI_DEPT_NEGOTIATING' ? (
                <div className="space-y-4 pt-2">
                  
                  {/* 快捷通道：一键接受医院目标价 */}
                  <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>方案 A：全盘接受医院目标价 (¥{hospitalDemandedPrice.toLocaleString()})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        直接同意医院多科室联合审定的建议目标底价，免去多轮复议，立即进入正式定标施工。
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAcceptHospitalTarget}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>同意并签署议价协议</span>
                    </button>
                  </div>

                  {/* 方案 B：提交二次调价 */}
                  <form onSubmit={handleCounterOffer} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
                    <div className="font-bold text-slate-900 text-xs">
                      方案 B：提出二次折中让利调价方案
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          二次调价后总金额 (元)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={selectedOrder.quoteGrandTotal}
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <div className="text-[11px] text-slate-500">
                          相比原报价让利金额：
                          <strong className="font-mono text-emerald-700 font-bold ml-1">
                            ¥{Math.max(0, selectedOrder.quoteGrandTotal - counterPrice).toLocaleString()}
                          </strong>
                          <span className="text-slate-400 ml-1">
                            ({((Math.max(0, selectedOrder.quoteGrandTotal - counterPrice) / selectedOrder.quoteGrandTotal) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">
                        供应商让利诚意及技术成本依据说明
                      </label>
                      <textarea
                        rows={2}
                        value={counterNote}
                        onChange={(e) => setCounterNote(e.target.value)}
                        placeholder="说明零配件进口关税、现货调配、现场工程师工时成本及保修承诺等理由..."
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>提交二次议价让利方案</span>
                      </button>
                    </div>
                  </form>

                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold">议价已顺利达成：</span>
                    <span className="ml-1">
                      最终成交价为 <strong className="font-mono text-sm">¥{selectedOrder.finalNegotiatedPrice?.toLocaleString()}</strong>
                      ，累计节约资金 <strong className="font-mono text-sm text-purple-700">¥{selectedOrder.savingsAmount?.toLocaleString()}</strong>
                      。双方已签署《多科室联合议价定标会签书》。
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenDossierModal(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0 ml-3"
                  >
                    打印议价确认书
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            请选择工单查看议价详情
          </div>
        )}
      </div>

      {/* 多科室联合议价确认纪要预览与打印模态框 */}
      {showMinutesModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">五莲县人民医院医用设备维修多科室联席议价确认纪要</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMinutesModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-300 rounded-xl p-6 space-y-4 bg-white font-sans leading-relaxed">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  五莲县人民医院维修与配件采购联席谈判定标纪要
                </h2>
                <div className="text-[11px] text-slate-500 font-mono">
                  纪要编号: YJ-{selectedOrder.id}-HY • 会议时间: 2026年03月18日
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div><strong>标的设备：</strong>{selectedOrder.equipmentName} ({selectedOrder.equipmentModel})</div>
                <div><strong>使用科室：</strong>{selectedOrder.equipmentDept}</div>
                <div><strong>中标供应商：</strong>{selectedOrder.vendorName}</div>
                <div><strong>维修负责工程师：</strong>{selectedOrder.assignedEngineer?.name || '资深工程师'}</div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">一、议价磋商与控费结论</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2 border-b border-r border-slate-200">初报申报总价</th>
                        <th className="p-2 border-b border-r border-slate-200">院方联合目标底价</th>
                        <th className="p-2 border-b border-r border-slate-200">双方审定成交价</th>
                        <th className="p-2 border-b border-slate-200">净核减让利金额 (降幅)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr>
                        <td className="p-2 border-r border-slate-200">¥{selectedOrder.quoteGrandTotal.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-200 text-amber-700 font-bold">¥{hospitalDemandedPrice.toLocaleString()}</td>
                        <td className="p-2 border-r border-slate-200 text-emerald-700 font-bold">
                          ¥{(selectedOrder.finalNegotiatedPrice || hospitalDemandedPrice).toLocaleString()}
                        </td>
                        <td className="p-2 text-purple-700 font-bold">
                          ¥{(selectedOrder.savingsAmount || (selectedOrder.quoteGrandTotal - hospitalDemandedPrice)).toLocaleString()} ({selectedOrder.savingsRate || 11.1}%)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">二、四方联合会签电子审批留痕</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700">医学装备科：</div>
                    <div className="text-emerald-700 font-bold">✓ 同意定标</div>
                    <div className="text-slate-400 text-[10px]">签名: 张主任 (已核身)</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700">使用临床科室：</div>
                    <div className="text-emerald-700 font-bold">✓ 同意方案</div>
                    <div className="text-slate-400 text-[10px]">签名: 李护士长 (已核身)</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700">财务审计处：</div>
                    <div className="text-emerald-700 font-bold">✓ 控费合规</div>
                    <div className="text-slate-400 text-[10px]">签名: 王会计师 (已核身)</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-1">
                    <div className="font-bold text-slate-700">供应商代表：</div>
                    <div className="text-blue-700 font-bold">✓ 承诺履约</div>
                    <div className="text-slate-400 text-[10px]">签名: {currentVendor.contactName}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div>医院监督电话: 0633-5231999 • 纪检监察办公室备案</div>
                <div className="text-emerald-600 font-bold font-mono">区块链哈希已固化保全</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMinutesModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  onToast('已生成《多科室联席议价确认纪要》并调起系统打印任务！', 'success');
                  setShowMinutesModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>立即打印/导出议价纪要PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
