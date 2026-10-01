import React, { useState } from 'react';
import { 
  Building2, FileSpreadsheet, Receipt, MessageSquare, CheckCircle, 
  Clock, AlertTriangle, Upload, Plus, Trash2, Send, Eye, ShieldCheck,
  TrendingDown, ArrowRight, Sparkles, User, Search, Filter, CheckCircle2,
  ChevronDown, Download, Printer, Layers, FileCheck2, Tag, Calendar,
  Star, Check, AlertCircle, X, Maximize2, Coins
} from 'lucide-react';
import { 
  VendorCollaborationOrder, 
  VendorUserAccount, 
  QuotePartItem, 
  VendorCollabStatus 
} from '../../types/vendorCollaborationTypes';

interface VendorSpecialOrderWorkbenchProps {
  currentVendor: VendorUserAccount;
  orders: VendorCollaborationOrder[];
  onUpdateOrder: (updatedOrder: VendorCollaborationOrder) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
  onOpenDossierModal: (order: VendorCollaborationOrder) => void;
}

export const VendorSpecialOrderWorkbench: React.FC<VendorSpecialOrderWorkbenchProps> = ({
  currentVendor,
  orders,
  onUpdateOrder,
  onToast,
  onOpenDossierModal,
}) => {
  // 只显示本供应商承接的外协工单
  const vendorOrders = orders.filter(o => o.vendorId === currentVendor.vendorId);
  const effectiveOrders = vendorOrders.length > 0 ? vendorOrders : orders;

  const [selectedOrderId, setSelectedOrderId] = useState<string>(effectiveOrders[0]?.id || '');
  const selectedOrder = effectiveOrders.find(o => o.id === selectedOrderId) || effectiveOrders[0];

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'QUOTE' | 'NEGOTIATION' | 'COMPLETION' | 'INVOICE' | 'MESSAGES'>('DETAILS');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_QUOTE' | 'MULTI_DEPT_NEGOTIATING' | 'APPROVED_REPAIRING' | 'COMPLETED_PENDING_INVOICE' | 'INVOICE_UPLOADED' | 'ARCHIVED'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'HIGH' | 'NORMAL'>('ALL');

  // 图片放大预览
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // 报价单表单状态
  const [quoteLabor, setQuoteLabor] = useState<number>(selectedOrder?.quoteLaborCost || 3000);
  const [quoteTravel, setQuoteTravel] = useState<number>(selectedOrder?.quoteTravelCost || 1000);
  const [quoteParts, setQuoteParts] = useState<QuotePartItem[]>(
    selectedOrder?.quoteParts?.length ? selectedOrder.quoteParts : [
      {
        id: 'new-part-1',
        name: '原厂关键控制主板/射频组件',
        spec: 'ORIG-SPEC-001',
        brand: currentVendor.vendorName.includes('GE') ? 'GE原厂' : '原厂正品',
        partNo: 'PT-88902',
        quantity: 1,
        unitPrice: 24000,
        totalPrice: 24000,
        warrantyPeriodMonths: 12,
        isOriginal: true,
      }
    ]
  );
  const [quoteValidDate, setQuoteValidDate] = useState('2026-10-15');
  const [uploadedQuoteFileName, setUploadedQuoteFileName] = useState(selectedOrder?.quoteFileName || '正式盖章维修报价单.pdf');

  // 议价响应调价
  const [counterPrice, setCounterPrice] = useState<number>(
    selectedOrder?.finalNegotiatedPrice || selectedOrder?.quoteGrandTotal || 0
  );
  const [counterNote, setCounterNote] = useState('');

  // 完工报告表单
  const [engName, setEngName] = useState(currentVendor.contactPerson || '陈工');
  const [engPhone, setEngPhone] = useState(currentVendor.phone || '13812345678');
  const [repAnalysis, setRepAnalysis] = useState(
    selectedOrder?.completionReport?.faultCauseAnalysis || 
    '经现场仪器检测排查，确认板卡受潮短路触发连锁保护，已完成原厂备件上机更换并重新完成全套几何与电信号标定校准。'
  );
  const [repSummary, setRepSummary] = useState(
    selectedOrder?.completionReport?.repairMeasuresSummary || 
    '拆卸原故障部件，安装原装新备件，上机通过自检及临床试运行连续测试无误，性能参数符合国家计量及原厂标准。'
  );
  const [oldPartsReturnedCheck, setOldPartsReturnedCheck] = useState(true);
  const [clinicalRating, setClinicalRating] = useState<number>(5);

  // 发票表单
  const [invType, setInvType] = useState<'SPECIAL_VAT' | 'NORMAL_VAT'>('SPECIAL_VAT');
  const [invCode, setInvCode] = useState('033002200111');
  const [invNo, setInvNo] = useState('99823019');
  const [invAmount, setInvAmount] = useState<number>(
    selectedOrder?.finalNegotiatedPrice || selectedOrder?.quoteGrandTotal || 30000
  );
  const [invTaxRate, setInvTaxRate] = useState<number>(13);
  const [invFileName, setInvFileName] = useState('增值税专用发票_电子原件.pdf');

  // 在线沟通留言
  const [newMsgText, setNewMsgText] = useState('');

  // 切换工单
  const handleSelectOrder = (order: VendorCollaborationOrder) => {
    setSelectedOrderId(order.id);
    setQuoteLabor(order.quoteLaborCost || 3000);
    setQuoteTravel(order.quoteTravelCost || 1000);
    setQuoteParts(order.quoteParts?.length ? order.quoteParts : [
      {
        id: 'new-part-1',
        name: '原厂关键部件',
        spec: 'ORIG-SPEC-001',
        brand: '原厂正品',
        partNo: 'PT-88902',
        quantity: 1,
        unitPrice: 20000,
        totalPrice: 20000,
        warrantyPeriodMonths: 12,
        isOriginal: true,
      }
    ]);
    setCounterPrice(order.finalNegotiatedPrice || order.quoteGrandTotal || 0);
    setInvAmount(order.finalNegotiatedPrice || order.quoteGrandTotal || 30000);
  };

  // 添加配件行
  const handleAddPartItem = () => {
    const newItem: QuotePartItem = {
      id: `qp-${Date.now()}`,
      name: '新配件',
      spec: '标准型号',
      brand: '原厂正品',
      partNo: 'PART-00',
      quantity: 1,
      unitPrice: 5000,
      totalPrice: 5000,
      warrantyPeriodMonths: 12,
      isOriginal: true,
    };
    setQuoteParts([...quoteParts, newItem]);
  };

  // 移除配件行
  const handleRemovePartItem = (id: string) => {
    setQuoteParts(quoteParts.filter(p => p.id !== id));
  };

  // 更新配件行字段
  const handleUpdatePartItem = (id: string, field: keyof QuotePartItem, val: any) => {
    setQuoteParts(quoteParts.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: val };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Number(val) : p.quantity;
          const u = field === 'unitPrice' ? Number(val) : p.unitPrice;
          updated.totalPrice = q * u;
        }
        return updated;
      }
      return p;
    }));
  };

  // 提交/更新报价
  const handleSubmitQuote = () => {
    if (!selectedOrder) return;
    const partsTotal = quoteParts.reduce((sum, p) => sum + (p.totalPrice || (p.quantity * p.unitPrice)), 0);
    const grandTotal = partsTotal + Number(quoteLabor) + Number(quoteTravel);
    
    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'MULTI_DEPT_NEGOTIATING',
      quoteLaborCost: Number(quoteLabor),
      quoteTravelCost: Number(quoteTravel),
      quotePartsTotal: partsTotal,
      quoteGrandTotal: grandTotal,
      finalNegotiatedPrice: grandTotal,
      quoteParts,
      quoteValidUntil: quoteValidDate,
      quoteFileName: uploadedQuoteFileName,
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'VENDOR',
          senderName: `${currentVendor.contactPerson} (${currentVendor.vendorName})`,
          timestamp: new Date().toLocaleString(),
          content: `已正式提交盖章报价单【${uploadedQuoteFileName}】，报价总额 ¥${grandTotal.toLocaleString()}（含工时 ¥${quoteLabor}、差旅 ¥${quoteTravel}、零配件 ¥${partsTotal}）。请院方审定。`,
        }
      ]
    };

    onUpdateOrder(updated);
    onToast('报价单及零配件明细已成功报送医院医学工程科！已进入多科室联合审价流程。', 'success');
  };

  // 响应议价函并二次调价
  const handleVendorSubmitCounterOffer = () => {
    if (!selectedOrder) return;
    if (!counterPrice || counterPrice <= 0) {
      onToast('请输入调整后的报价金额', 'warning');
      return;
    }

    const existingRounds = [...(selectedOrder.negotiationRounds || [])];
    if (existingRounds.length > 0) {
      existingRounds[existingRounds.length - 1] = {
        ...existingRounds[existingRounds.length - 1],
        vendorResponseAt: new Date().toLocaleString(),
        vendorResponsePrice: Number(counterPrice),
        vendorNote: counterNote || `我司支持医院预算安排，总价调整为 ¥${counterPrice.toLocaleString()}，并保证原厂服务质保。`,
        vendorDecision: 'COUNTER_OFFER',
      };
    }

    const savings = Math.max(0, selectedOrder.quoteGrandTotal - Number(counterPrice));
    const rate = selectedOrder.quoteGrandTotal > 0 
      ? parseFloat(((savings / selectedOrder.quoteGrandTotal) * 100).toFixed(2)) 
      : 0;

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      finalNegotiatedPrice: Number(counterPrice),
      savingsAmount: savings,
      savingsRate: rate,
      negotiationRounds: existingRounds,
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'VENDOR',
          senderName: `${currentVendor.contactPerson} (${currentVendor.vendorName})`,
          timestamp: new Date().toLocaleString(),
          content: `【议价回复】我司针对多科室联合议价函作出让利响应：报价调整为 ¥${Number(counterPrice).toLocaleString()}（让利 ¥${savings.toLocaleString()}）。说明：${counterNote || '全力支持医院临床需要。'}`,
        }
      ]
    };

    onUpdateOrder(updated);
    setCounterNote('');
    onToast('议价让利方案已成功反馈医院联合议价小组！', 'success');
  };

  // 提交完工报告
  const handleSubmitCompletion = () => {
    if (!selectedOrder) return;
    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'COMPLETED_PENDING_INVOICE',
      completionReport: {
        engineerName: engName,
        engineerPhone: engPhone,
        serviceStartTime: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString(),
        serviceEndTime: new Date().toLocaleString(),
        faultCauseAnalysis: repAnalysis,
        repairMeasuresSummary: repSummary,
        replacedPartsSummary: `${quoteParts.length} 件原装部件已更换完毕`,
        oldPartsReturned: oldPartsReturnedCheck,
        clinicalAcceptorName: `${selectedOrder.equipmentDept} 护士长/技师长`,
        clinicalAcceptDate: new Date().toLocaleString(),
        clinicalRating: clinicalRating,
        serviceReportFileName: `${currentVendor.vendorName}_完工服务报告单.pdf`,
        onsitePhotos: selectedOrder.faultImages,
      },
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'VENDOR',
          senderName: `${currentVendor.contactPerson} (${currentVendor.vendorName})`,
          timestamp: new Date().toLocaleString(),
          content: '【维修完工】设备维修工作已全部结束，临床试运行合格，旧件已退库。请院方查验，我们将开具增值税发票并上传。',
        }
      ]
    };

    onUpdateOrder(updated);
    onToast('完工报告提交成功！下一步请开具增值税发票并上传发票凭证。', 'success');
  };

  // 提交增值税发票
  const handleSubmitInvoice = () => {
    if (!selectedOrder) return;
    const untaxed = parseFloat((invAmount / (1 + invTaxRate / 100)).toFixed(2));
    const tax = parseFloat((invAmount - untaxed).toFixed(2));

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'INVOICE_UPLOADED',
      invoiceRecord: {
        id: `inv-${Date.now()}`,
        invoiceType: invType,
        invoiceCode: invCode,
        invoiceNo: invNo,
        invoiceAmount: Number(invAmount),
        untaxedAmount: untaxed,
        taxRate: Number(invTaxRate),
        taxAmount: tax,
        invoiceDate: new Date().toISOString().split('T')[0],
        buyerName: '五莲县人民医院 / 五莲县公立医疗集团',
        buyerTaxNo: '12371121493820198X',
        sellerName: currentVendor.vendorName,
        sellerTaxNo: currentVendor.creditCode || '91110000100029381M',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        fileName: invFileName,
        uploadedAt: new Date().toLocaleString(),
        verificationStatus: 'PENDING',
        verificationNote: '发票已成功提交至医院医学工程科，待财务勾稽核验并归档。',
        paymentPlan: 'NET_30',
      },
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'VENDOR',
          senderName: `${currentVendor.contactPerson} (${currentVendor.vendorName})`,
          timestamp: new Date().toLocaleString(),
          content: `【发票已上传】已上传增值税专用发票（发票号：${invNo}，价税合计：¥${Number(invAmount).toLocaleString()}）。文件：${invFileName}。请医工与财务老师审核归档！`,
        }
      ]
    };

    onUpdateOrder(updated);
    onToast('增值税发票凭证已成功上传！医院医工与财务科将进行发票勾稽核验与档案合成。', 'success');
  };

  // 发送即时留言
  const handleSendMessage = () => {
    if (!newMsgText.trim() || !selectedOrder) return;

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'VENDOR',
          senderName: `${currentVendor.contactPerson} (${currentVendor.vendorName})`,
          timestamp: new Date().toLocaleTimeString(),
          content: newMsgText.trim(),
        }
      ]
    };

    onUpdateOrder(updated);
    setNewMsgText('');
  };

  // 过滤工单
  const filteredOrders = effectiveOrders.filter(order => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    if (urgencyFilter !== 'ALL' && order.urgencyLevel !== urgencyFilter) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase().trim();
      return (
        order.id.toLowerCase().includes(q) ||
        order.workOrderId.toLowerCase().includes(q) ||
        order.equipmentName.toLowerCase().includes(q) ||
        order.equipmentModel.toLowerCase().includes(q) ||
        order.equipmentDept.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const grandQuoteTotal = quoteParts.reduce((sum, p) => sum + (p.totalPrice || (p.quantity * p.unitPrice)), 0) + Number(quoteLabor) + Number(quoteTravel);
  const simulatedSavings = Math.max(0, (selectedOrder?.quoteGrandTotal || grandQuoteTotal) - Number(counterPrice));
  const simulatedSavingsRate = (selectedOrder?.quoteGrandTotal || grandQuoteTotal) > 0 
    ? ((simulatedSavings / (selectedOrder?.quoteGrandTotal || grandQuoteTotal)) * 100).toFixed(1)
    : '0';

  return (
    <div id="vendor-special-order-workbench" className="space-y-4">
      {/* 顶部过滤与搜索条 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部工单 ({effectiveOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('MULTI_DEPT_NEGOTIATING')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                statusFilter === 'MULTI_DEPT_NEGOTIATING'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              联合议价中 ({effectiveOrders.filter(o => o.status === 'MULTI_DEPT_NEGOTIATING').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED_REPAIRING')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                statusFilter === 'APPROVED_REPAIRING'
                  ? 'bg-white text-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              施工实施中 ({effectiveOrders.filter(o => o.status === 'APPROVED_REPAIRING').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INVOICE_UPLOADED')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                statusFilter === 'INVOICE_UPLOADED'
                  ? 'bg-white text-sky-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              发票核验中 ({effectiveOrders.filter(o => o.status === 'INVOICE_UPLOADED').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ARCHIVED')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                statusFilter === 'ARCHIVED'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              已归档结案 ({effectiveOrders.filter(o => o.status === 'ARCHIVED').length})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                urgencyFilter === 'ALL' ? 'bg-white text-slate-800 font-bold shadow-2xs' : 'text-slate-500'
              }`}
            >
              不限缓急
            </button>
            <button
              type="button"
              onClick={() => setUrgencyFilter('HIGH')}
              className={`px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                urgencyFilter === 'HIGH' ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200' : 'text-slate-500'
              }`}
            >
              🔥 紧急保修
            </button>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索设备名称、工单号、科室..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400 transition"
          />
        </div>
      </div>

      {/* 主体左右双栏协同工作台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 左侧：外协工单列表 (4列) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>承接外协单列表 ({filteredOrders.length})</span>
            <span className="text-[11px] text-slate-400">点击查看/办理</span>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
                暂无匹配的外协工单
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-600/20' 
                        : 'bg-white hover:bg-slate-50/90 border-slate-200/90 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">{order.id}</span>
                        {order.urgencyLevel === 'HIGH' && (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                            紧急保修
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                        order.status === 'ARCHIVED' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : order.status === 'MULTI_DEPT_NEGOTIATING'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : order.status === 'INVOICE_UPLOADED'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : order.status === 'APPROVED_REPAIRING'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {order.status === 'MULTI_DEPT_NEGOTIATING' && '联合议价中'}
                        {order.status === 'PENDING_QUOTE' && '待提交报价'}
                        {order.status === 'APPROVED_REPAIRING' && '已同意/维修中'}
                        {order.status === 'COMPLETED_PENDING_INVOICE' && '完工待开发票'}
                        {order.status === 'INVOICE_UPLOADED' && '发票核验中'}
                        {order.status === 'ARCHIVED' && '已归档结案'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-1">
                      {order.equipmentName}
                    </h4>

                    <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                      <div className="flex justify-between">
                        <span>报修科室: <strong className="text-slate-700 font-medium">{order.equipmentDept}</strong></span>
                        <span className="font-mono text-[11px] text-slate-400">{order.workOrderId}</span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-[11px] text-slate-400">报价: ¥{order.quoteGrandTotal?.toLocaleString() || '未报'}</span>
                        {order.finalNegotiatedPrice && (
                          <span className="text-xs font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            审定: ¥{order.finalNegotiatedPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 border-t border-slate-100 pt-1.5">
                      <span>对接: {order.vendorContact.split(' ')[0]}</span>
                      <span>{order.createdAt.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧：工单详细工作台 (8列) */}
        {selectedOrder ? (
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col shadow-2xs">
            
            {/* 顶部工单简况头 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                    {selectedOrder.id}
                  </span>
                  <span className="text-xs text-slate-500">关联医院工单: <strong className="font-mono text-slate-800">{selectedOrder.workOrderId}</strong></span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    selectedOrder.urgencyLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {selectedOrder.urgencyLevel === 'HIGH' ? '🔥 临床急重症设备' : '常规大修'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {selectedOrder.equipmentName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  型号：<span className="font-medium text-slate-700">{selectedOrder.equipmentModel}</span> | 序列号：<span className="font-mono text-slate-600">{selectedOrder.equipmentSerialNo}</span> | 所在科室：<span className="font-semibold text-slate-800">{selectedOrder.equipmentDept}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenDossierModal(selectedOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>一案一档归档卷宗</span>
                </button>
              </div>
            </div>

            {/* 六步业务流转进度指示条 */}
            <div className="my-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-[11px] overflow-x-auto gap-2">
              <div className="flex items-center gap-1 shrink-0 font-bold text-blue-700">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>接单勘验</span>
              </div>
              <span className="text-slate-300">➔</span>

              <div className={`flex items-center gap-1 shrink-0 font-medium ${
                selectedOrder.status !== 'PENDING_QUOTE' ? 'text-blue-700 font-bold' : 'text-slate-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  selectedOrder.status !== 'PENDING_QUOTE' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>2</span>
                <span>配件报价</span>
              </div>
              <span className="text-slate-300">➔</span>

              <div className={`flex items-center gap-1 shrink-0 font-medium ${
                selectedOrder.status === 'MULTI_DEPT_NEGOTIATING' ? 'text-amber-700 font-bold' : 
                ['APPROVED_REPAIRING', 'COMPLETED_PENDING_INVOICE', 'INVOICE_UPLOADED', 'ARCHIVED'].includes(selectedOrder.status) ? 'text-blue-700 font-bold' : 'text-slate-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  selectedOrder.status === 'MULTI_DEPT_NEGOTIATING' ? 'bg-amber-600 text-white' :
                  ['APPROVED_REPAIRING', 'COMPLETED_PENDING_INVOICE', 'INVOICE_UPLOADED', 'ARCHIVED'].includes(selectedOrder.status) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>3</span>
                <span>联合议价</span>
              </div>
              <span className="text-slate-300">➔</span>

              <div className={`flex items-center gap-1 shrink-0 font-medium ${
                selectedOrder.status === 'APPROVED_REPAIRING' ? 'text-blue-700 font-bold' :
                ['COMPLETED_PENDING_INVOICE', 'INVOICE_UPLOADED', 'ARCHIVED'].includes(selectedOrder.status) ? 'text-blue-700 font-bold' : 'text-slate-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  ['APPROVED_REPAIRING', 'COMPLETED_PENDING_INVOICE', 'INVOICE_UPLOADED', 'ARCHIVED'].includes(selectedOrder.status) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>4</span>
                <span>维修实施</span>
              </div>
              <span className="text-slate-300">➔</span>

              <div className={`flex items-center gap-1 shrink-0 font-medium ${
                selectedOrder.status === 'INVOICE_UPLOADED' ? 'text-sky-700 font-bold' :
                selectedOrder.status === 'ARCHIVED' ? 'text-blue-700 font-bold' : 'text-slate-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  selectedOrder.status === 'INVOICE_UPLOADED' ? 'bg-sky-600 text-white' :
                  selectedOrder.status === 'ARCHIVED' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>5</span>
                <span>发票开具</span>
              </div>
              <span className="text-slate-300">➔</span>

              <div className={`flex items-center gap-1 shrink-0 font-medium ${
                selectedOrder.status === 'ARCHIVED' ? 'text-emerald-700 font-bold' : 'text-slate-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  selectedOrder.status === 'ARCHIVED' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>6</span>
                <span>归档结案</span>
              </div>
            </div>

            {/* 选项卡导航 */}
            <div className="flex items-center space-x-2 border-b border-slate-200 my-2 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('DETAILS')}
                className={`pb-2 px-3 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'DETAILS' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. 故障勘验与症状
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('QUOTE')}
                className={`pb-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'QUOTE' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                2. 维修配件报价与拆解
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('NEGOTIATION')}
                className={`pb-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'NEGOTIATION' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                3. 多科室联合议价响应
                {selectedOrder.status === 'MULTI_DEPT_NEGOTIATING' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMPLETION')}
                className={`pb-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'COMPLETION' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                4. 完工技术报告与验收
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('INVOICE')}
                className={`pb-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'INVOICE' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                5. 增值税发票凭证
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MESSAGES')}
                className={`pb-2 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  activeTab === 'MESSAGES' ? 'border-blue-600 text-blue-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                6. 沟通留言 ({selectedOrder.messages?.length || 0})
              </button>
            </div>

            {/* TAB 内容 */}
            <div className="flex-1 overflow-y-auto py-2">
              
              {/* TAB 1: 故障勘验 */}
              {activeTab === 'DETAILS' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>临床科室报修故障现象描述</span>
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {selectedOrder.faultDescription}
                    </p>
                  </div>

                  {/* 现场勘验照片预览 */}
                  {selectedOrder.faultImages && selectedOrder.faultImages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-2">现场勘验故障照片 ({selectedOrder.faultImages.length} 张)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {selectedOrder.faultImages.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setPreviewImageUrl(img)}
                            className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer"
                          >
                            <img 
                              src={img} 
                              alt="现场勘验" 
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs gap-1">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>放大</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 报修基本信息 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="text-slate-400">报修时间：</div>
                      <div className="font-medium text-slate-800">{selectedOrder.createdAt}</div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="text-slate-400">责任驻场技术员：</div>
                      <div className="font-medium text-slate-800">{selectedOrder.vendorContact}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 报价明细 */}
              {activeTab === 'QUOTE' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">更换零配件明细清单</h3>
                      <p className="text-[11px] text-slate-500">必须明确原厂/副厂属性、规格型号及质保月数</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPartItem}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加配件</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5">配件名称</th>
                          <th className="p-2.5">规格型号</th>
                          <th className="p-2.5">品牌/原厂</th>
                          <th className="p-2.5">备件编码</th>
                          <th className="p-2.5 w-16 text-center">数量</th>
                          <th className="p-2.5 text-right">单价 (¥)</th>
                          <th className="p-2.5 text-right">小计 (¥)</th>
                          <th className="p-2.5 w-16 text-center">质保</th>
                          <th className="p-2.5 w-12 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {quoteParts.map((part) => (
                          <tr key={part.id} className="hover:bg-slate-50/60">
                            <td className="p-2">
                              <input
                                type="text"
                                value={part.name}
                                onChange={(e) => handleUpdatePartItem(part.id, 'name', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={part.spec}
                                onChange={(e) => handleUpdatePartItem(part.id, 'spec', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={part.brand}
                                onChange={(e) => handleUpdatePartItem(part.id, 'brand', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={part.partNo}
                                onChange={(e) => handleUpdatePartItem(part.id, 'partNo', e.target.value)}
                                className="w-full font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs outline-none focus:bg-white"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min={1}
                                value={part.quantity}
                                onChange={(e) => handleUpdatePartItem(part.id, 'quantity', e.target.value)}
                                className="w-12 text-center bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:bg-white font-mono"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min={0}
                                value={part.unitPrice}
                                onChange={(e) => handleUpdatePartItem(part.id, 'unitPrice', e.target.value)}
                                className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs outline-none focus:bg-white font-mono"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-800">
                              ¥{(part.totalPrice || (part.quantity * part.unitPrice)).toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              <span className="font-mono text-[11px] text-slate-600">{part.warrantyPeriodMonths}月</span>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePartItem(part.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 工时费与差旅费 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">配件费合计 (¥)</label>
                      <div className="font-mono font-bold text-sm text-slate-900">
                        ¥{quoteParts.reduce((sum, p) => sum + (p.totalPrice || (p.quantity * p.unitPrice)), 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">技术工时服务费 (¥)</label>
                      <input
                        type="number"
                        value={quoteLabor}
                        onChange={(e) => setQuoteLabor(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">差旅与专用仪器费 (¥)</label>
                      <input
                        type="number"
                        value={quoteTravel}
                        onChange={(e) => setQuoteTravel(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 报价总计汇总与盖章附件 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <div>
                      <div className="text-[11px] text-blue-700 font-semibold">报价单总计（含税）</div>
                      <div className="text-xl font-black text-blue-900 font-mono">
                        ¥{grandQuoteTotal.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-blue-600/80 mt-0.5">
                        报价有效期至：{quoteValidDate} | 附件：{uploadedQuoteFileName}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitQuote}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>报送正式报价至医院</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: 多科室议价协同 */}
              {activeTab === 'NEGOTIATION' && (
                <div className="space-y-4">
                  {/* 院方四科室会签审定意见展示 */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                      <span>医院多科室联合审价会签表</span>
                      <span className="text-[11px] text-slate-400">医工科 · 临床科室 · 财务科 · 审计办</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(selectedOrder.multiDeptOpinions || []).map((opinion, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{opinion.deptName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              opinion.decision === 'AGREE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              opinion.decision === 'ADVISE_NEGOTIATION' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {opinion.decision === 'AGREE' && '同意方案'}
                              {opinion.decision === 'ADVISE_NEGOTIATION' && '建议再议价'}
                              {opinion.decision === 'REJECT' && '要求重报'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            审核人：{opinion.reviewerName} ({opinion.reviewerTitle})
                          </div>
                          {opinion.suggestedDiscountAmount ? (
                            <div className="text-amber-800 text-[11px] font-medium">
                              建议核减目标：¥{opinion.targetPrice?.toLocaleString()} (让利 ¥{opinion.suggestedDiscountAmount.toLocaleString()})
                            </div>
                          ) : null}
                          <p className="text-slate-600 text-[11.5px] bg-white p-2 rounded border border-slate-100">
                            {opinion.comments}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 议价谈判轮次 */}
                  {selectedOrder.negotiationRounds && selectedOrder.negotiationRounds.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900">议价来往轮次记录</h4>
                      {selectedOrder.negotiationRounds.map((rnd, i) => (
                        <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between text-slate-700 font-semibold">
                            <span>第 {rnd.round} 轮议价函 ({rnd.initiatorDept})</span>
                            <span className="text-amber-700 font-mono font-bold">院方目标价：¥{rnd.demandedPrice.toLocaleString()}</span>
                          </div>
                          <p className="text-slate-500 text-[11px]">{rnd.hospitalNote}</p>
                          {rnd.vendorResponsePrice && (
                            <div className="mt-1 pt-1 border-t border-slate-100 text-blue-700 flex justify-between text-[11px]">
                              <span>供应商调价反馈：¥{rnd.vendorResponsePrice.toLocaleString()}</span>
                              <span>{rnd.vendorResponseAt}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 供应商调价让利反馈箱 */}
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-blue-600" />
                        <span>响应联合议价函 · 提交二次调整报价</span>
                      </h4>
                      <div className="text-xs text-slate-500">
                        初始总报价: <strong className="font-mono text-slate-800">¥{selectedOrder.quoteGrandTotal.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">调整后让利成交价 (¥)</label>
                        <input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono font-bold text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">为医院节约资金</label>
                        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-mono font-bold text-sm">
                          ¥{simulatedSavings.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">让利幅度 (%)</label>
                        <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono font-bold text-sm">
                          {simulatedSavingsRate}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">让利说明与质量保供承诺</label>
                      <textarea
                        rows={2}
                        value={counterNote}
                        onChange={(e) => setCounterNote(e.target.value)}
                        placeholder="例如：我司支持五莲县人民医院重点专科设备保障，同意总价调整为..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:bg-white focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleVendorSubmitCounterOffer}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>确认提交让利方案至联合议价小组</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: 完工技术报告 */}
              {activeTab === 'COMPLETION' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">主修工程师姓名</label>
                      <input
                        type="text"
                        value={engName}
                        onChange={(e) => setEngName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">主修工程师联系电话</label>
                      <input
                        type="text"
                        value={engPhone}
                        onChange={(e) => setEngPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">故障原因深度技术分析</label>
                    <textarea
                      rows={2}
                      value={repAnalysis}
                      onChange={(e) => setRepAnalysis(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1 font-medium">维修处置措施与测试结论</label>
                    <textarea
                      rows={2}
                      value={repSummary}
                      onChange={(e) => setRepSummary(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:bg-white"
                    />
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                    <label className="flex items-center gap-2 text-emerald-900 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={oldPartsReturnedCheck}
                        onChange={(e) => setOldPartsReturnedCheck(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
                      />
                      <span>旧件已按《大型医疗器械以旧换新管理办法》原样交还医院医学工程科仓库 (退库核验完成)</span>
                    </label>

                    <div className="flex items-center gap-2 text-slate-600">
                      <span>临床科室满意度评分：</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setClinicalRating(star)}
                            className="cursor-pointer"
                          >
                            <Star className={`w-4 h-4 ${star <= clinicalRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitCompletion}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>提交完工技术报告并申请发票开具</span>
                  </button>
                </div>
              )}

              {/* TAB 5: 增值税发票凭证 */}
              {activeTab === 'INVOICE' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">发票类型</label>
                      <select
                        value={invType}
                        onChange={(e: any) => setInvType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:bg-white"
                      >
                        <option value="SPECIAL_VAT">增值税专用发票 (13% 医疗器械货物)</option>
                        <option value="NORMAL_VAT">增值税普通发票</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">发票代码</label>
                      <input
                        type="text"
                        value={invCode}
                        onChange={(e) => setInvCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">发票号码</label>
                      <input
                        type="text"
                        value={invNo}
                        onChange={(e) => setInvNo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">价税合计总金额 (¥)</label>
                      <input
                        type="number"
                        value={invAmount}
                        onChange={(e) => setInvAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-mono font-bold text-xs text-slate-900 outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* 购买方与销售方 */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">购买方 (医院):</span>
                      <span className="font-semibold text-slate-800">五莲县人民医院 (纳税人识别号: 12371121493820198X)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">销售方 (供应商):</span>
                      <span className="font-semibold text-slate-800">{currentVendor.vendorName}</span>
                    </div>
                  </div>

                  {/* 四流一致核验状态 */}
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>国家财税与公立医院审计“四流一致”预检核验</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1 text-emerald-700">✓ 合同协议流一致</div>
                      <div className="flex items-center gap-1 text-emerald-700">✓ 派工报修流一致</div>
                      <div className="flex items-center gap-1 text-emerald-700">✓ 零配件实物流一致</div>
                      <div className="flex items-center gap-1 text-emerald-700">✓ 发票回款流一致</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitInvoice}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>上传增值税发票凭证报送医院财务科</span>
                  </button>
                </div>
              )}

              {/* TAB 6: 在线双向沟通 */}
              {activeTab === 'MESSAGES' && (
                <div className="space-y-3 flex flex-col h-[400px]">
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {(selectedOrder.messages || []).map((msg) => {
                      const isVendor = msg.senderType === 'VENDOR';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10.5px] text-slate-400 mb-0.5">
                            {msg.senderName} · {msg.timestamp}
                          </div>
                          <div className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                            isVendor
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      placeholder="输入回复医学工程科或临床科室的留言..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:bg-white focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>发送</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
            请从左侧选择外协工单查看详情
          </div>
        )}
      </div>

      {/* 图片放大预览模态框 */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-xl bg-slate-900 p-2">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 text-white bg-slate-800/80 hover:bg-slate-700 p-1.5 rounded-full z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImageUrl}
              alt="放大勘验"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
