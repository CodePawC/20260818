import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Scale, FileText, CheckCircle2, Clock, AlertTriangle, 
  Send, ShieldCheck, Printer, Eye, TrendingDown, ArrowRight, 
  Receipt, MessageSquare, Plus, RefreshCw, Check, X, FileSpreadsheet,
  ExternalLink, UserCheck, ChevronRight, Coins
} from 'lucide-react';
import { 
  VendorCollaborationOrder, 
  DepartmentNegotiationOpinion, 
  VendorCollabStatus,
  VendorUserAccount 
} from '../types/vendorCollaborationTypes';
import { DepartmentMaster, AuthUser } from '../types';
import { VendorDossierPdfModal } from './VendorDossierPdfModal';
import { VendorMonthlyQuoteReportModal } from './VendorMonthlyQuoteReportModal';
import { MonthlyFrameworkAuditReportModal } from './MonthlyFrameworkAuditReportModal';
import { MonthlyFrameworkWorkspace } from './MonthlyFrameworkWorkspace';
import { getMonthlyFrameworkBatches } from '../utils/monthlyFrameworkData';
import { VENDOR_ACCOUNTS } from '../utils/vendorCollaborationData';
import { getUserDepartment } from '../utils/authUtils';
import { DEFAULT_DEPARTMENTS, resolveMasterDepartment, matchesDepartment } from '../utils/masterData';

interface VendorCollaborationHospitalViewProps {
  orders: VendorCollaborationOrder[];
  currentUser?: AuthUser | null;
  departments?: DepartmentMaster[];
  onUpdateOrder: (updatedOrder: VendorCollaborationOrder) => void;
  onArchiveOrder: (order: VendorCollaborationOrder) => void;
  onSwitchToVendorPortal?: (vendorAccount: VendorUserAccount) => void;
}

export const VendorCollaborationHospitalView: React.FC<VendorCollaborationHospitalViewProps> = ({
  orders,
  currentUser,
  departments,
  onUpdateOrder,
  onArchiveOrder,
  onSwitchToVendorPortal,
}) => {
  // 解析并规范化当前登录用户所属科室（如“手术室”->“麻醉手术科”）
  const userDept = getUserDepartment(currentUser);
  const effectiveUserDept = useMemo(() => {
    if (!userDept) return '';
    if (userDept.includes('手术') || userDept.includes('麻醉')) return '麻醉手术科';
    const matched = resolveMasterDepartment(userDept, departments || DEFAULT_DEPARTMENTS);
    return matched ? matched.name : userDept;
  }, [userDept, departments]);

  // 单台专项大修科室筛选
  const [orderDeptFilter, setOrderDeptFilter] = useState<string>(() => effectiveUserDept || '');
  const [orderScopeMode, setOrderScopeMode] = useState<'DEPT' | 'ALL'>(() => effectiveUserDept ? 'DEPT' : 'ALL');

  useEffect(() => {
    if (effectiveUserDept) {
      setOrderDeptFilter(effectiveUserDept);
      setOrderScopeMode('DEPT');
    }
  }, [effectiveUserDept]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MULTI_DEPT_NEGOTIATION' | 'INVOICE_AUDIT' | 'COMMUNICATION'>('OVERVIEW');
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showMonthlyQuoteReportModal, setShowMonthlyQuoteReportModal] = useState(false);
  const [showFrameworkAuditModal, setShowFrameworkAuditModal] = useState(false);
  const [hospitalCollabMode, setHospitalCollabMode] = useState<'MONTHLY_FRAMEWORK' | 'SPECIAL_ORDERS'>('MONTHLY_FRAMEWORK');
  const frameworkBatches = getMonthlyFrameworkBatches();

  // 统计各科室包含的专项大修订单数
  const availableOrderDepts = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const d = (o.equipmentDept === '手术室' || o.equipmentDept === '手术科') ? '麻醉手术科' : o.equipmentDept;
      map.set(d, (map.get(d) || 0) + 1);
    });
    return Array.from(map.entries()).map(([dept, count]) => ({ dept, count }));
  }, [orders]);

  // 过滤工单 (联动状态与科室范围)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterStatus === 'NEGOTIATING' && o.status !== 'MULTI_DEPT_NEGOTIATING') return false;
      if (filterStatus === 'INVOICING' && o.status !== 'COMPLETED_PENDING_INVOICE' && o.status !== 'INVOICE_UPLOADED') return false;
      if (filterStatus === 'ARCHIVED' && o.status !== 'ARCHIVED') return false;

      if (orderScopeMode === 'DEPT' && effectiveUserDept) {
        if (!matchesDepartment(o.equipmentDept, effectiveUserDept, departments)) return false;
      } else if (orderDeptFilter) {
        if (!matchesDepartment(o.equipmentDept, orderDeptFilter, departments)) return false;
      }
      return true;
    });
  }, [orders, filterStatus, orderScopeMode, effectiveUserDept, orderDeptFilter, departments]);

  // 当筛选列表变化时，自动将选中的订单定位在有效列表内
  useEffect(() => {
    if (filteredOrders.length > 0 && !filteredOrders.some(o => o.id === selectedOrderId)) {
      setSelectedOrderId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedOrderId]);

  // 选中的外协单
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || filteredOrders[0] || orders[0];

  // 院方在线沟通留言
  const [hospitalMsg, setHospitalMsg] = useState('');

  // 议价函发起表单
  const [negotiationTargetPrice, setNegotiationTargetPrice] = useState<number>(
    selectedOrder?.finalNegotiatedPrice || selectedOrder?.quoteGrandTotal || 45000
  );
  const [negotiationDemandNote, setNegotiationDemandNote] = useState('');

  // 多科室会签编辑状态
  const [editingDept, setEditingDept] = useState<'BIOMEDICAL' | 'CLINICAL' | 'FINANCE' | 'AUDIT_PROCUREMENT'>('BIOMEDICAL');
  const [deptComment, setDeptComment] = useState('');
  const [deptDiscount, setDeptDiscount] = useState<number>(5000);
  const [deptDecision, setDeptDecision] = useState<'AGREE' | 'ADVISE_NEGOTIATION' | 'REJECT'>('ADVISE_NEGOTIATION');

  // 友好内置消息通知（替代浏览器原生 alert 以免在 iframe 中受阻）
  const [notifyMsg, setNotifyMsg] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotifyMsg({ text, type });
    setTimeout(() => {
      setNotifyMsg(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // 切换工单时的表单同步
  const handleSelectOrder = (order: VendorCollaborationOrder) => {
    setSelectedOrderId(order.id);
    setNegotiationTargetPrice(order.finalNegotiatedPrice || order.quoteGrandTotal || 0);
  };

  // 院方发送沟通留言
  const handleSendHospitalMessage = () => {
    if (!hospitalMsg.trim() || !selectedOrder) return;

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'HOSPITAL',
          senderName: '医学工程科 (张工)',
          senderDept: '医学工程科',
          timestamp: new Date().toLocaleTimeString(),
          content: hospitalMsg.trim(),
        }
      ]
    };

    onUpdateOrder(updated);
    setHospitalMsg('');
  };

  // 保存/更新某个科室的联合审价意见
  const handleSaveDeptOpinion = () => {
    if (!selectedOrder) return;

    const deptMap: Record<string, string> = {
      BIOMEDICAL: '医学工程科',
      CLINICAL: `${selectedOrder.equipmentDept || '使用科室'} (使用科室)`,
      FINANCE: '财务科 / 预算处',
      AUDIT_PROCUREMENT: '采招办 / 审计监察室',
    };

    const newOpinion: DepartmentNegotiationOpinion = {
      deptKey: editingDept,
      deptName: deptMap[editingDept],
      reviewerName: editingDept === 'BIOMEDICAL' ? '张主任 (高级工程师)' : editingDept === 'CLINICAL' ? `${selectedOrder.equipmentDept || '使用科室'}护士长 / 科主任` : '财务审核员',
      reviewerTitle: '科室负责人',
      suggestedDiscountAmount: Number(deptDiscount),
      targetPrice: Math.max(0, selectedOrder.quoteGrandTotal - Number(deptDiscount)),
      decision: deptDecision,
      comments: deptComment || '经会审，同意按照此建议核减价格发起联合议价。',
      reviewDate: new Date().toLocaleString(),
      status: 'SUBMITTED',
    };

    const existingOpinions = selectedOrder.multiDeptOpinions.filter(o => o.deptKey !== editingDept);
    const updatedOpinions = [...existingOpinions, newOpinion];

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      multiDeptOpinions: updatedOpinions,
    };

    onUpdateOrder(updated);
    setDeptComment('');
    showToast(`已更新【${deptMap[editingDept]}】的审价会签结论！`, 'success');
  };

  // 发起/推送线上多科室联合议价函
  const handleSendNegotiationLetter = () => {
    if (!selectedOrder) return;
    if (!negotiationTargetPrice || negotiationTargetPrice <= 0) {
      showToast('请设定多科室联合议价目标价格！', 'warning');
      return;
    }

    const nextRound = (selectedOrder.negotiationRounds?.length || 0) + 1;
    const newRound = {
      round: nextRound,
      initiatedAt: new Date().toLocaleString(),
      initiatorDept: '医学工程科、临床使用科室、财务科联合审价小组',
      initiatorName: '张主任 (联合代表)',
      demandedPrice: Number(negotiationTargetPrice),
      hospitalNote: negotiationDemandNote || `经医学工程科、使用科室与财务科联合评审，该设备故障零配件与工时总报价偏高。现结合同类设备历史集采维修价格，要求整体优惠让利至 ¥${Number(negotiationTargetPrice).toLocaleString()}，并延长原厂质保。请供应商尽快复核并更新报价。`,
    };

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'MULTI_DEPT_NEGOTIATING',
      negotiationRounds: [...(selectedOrder.negotiationRounds || []), newRound],
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'HOSPITAL',
          senderName: '医学工程科联合议价小组',
          senderDept: '医学工程科',
          timestamp: new Date().toLocaleString(),
          content: `【多科室议价函发出】要求供应商将总报价下调至 ¥${Number(negotiationTargetPrice).toLocaleString()}。说明：${negotiationDemandNote || '多部门联合核减建议'}。`,
        }
      ]
    };

    onUpdateOrder(updated);
    setNegotiationDemandNote('');
    showToast('已成功向供应商发送第 ' + nextRound + ' 轮《多科室联合议价函》！供应商门户将同步收到议价通知。', 'success');
  };

  // 院方同意并定标（结束议价，进入维修实施）
  const handleApproveFinalPrice = () => {
    if (!selectedOrder) return;
    const finalPrice = selectedOrder.finalNegotiatedPrice || selectedOrder.quoteGrandTotal;
    const savings = Math.max(0, selectedOrder.quoteGrandTotal - finalPrice);
    const rate = selectedOrder.quoteGrandTotal > 0 ? parseFloat(((savings / selectedOrder.quoteGrandTotal) * 100).toFixed(2)) : 0;

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'APPROVED_REPAIRING',
      finalNegotiatedPrice: finalPrice,
      savingsAmount: savings,
      savingsRate: rate,
      approvedAt: new Date().toLocaleString(),
      approvedBy: '张主任 (医学工程科主任)',
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'HOSPITAL',
          senderName: '医学工程科-审批专员',
          senderDept: '医学工程科',
          timestamp: new Date().toLocaleString(),
          content: `【定标同意】多科室联合审价通过！最终成交价格确定为 ¥${finalPrice.toLocaleString()}（节约资金 ¥${savings.toLocaleString()}，节资率 ${rate}%）。已授权供应商立即带件入室维修！`,
        }
      ]
    };

    onUpdateOrder(updated);
    showToast('已完成多科室议价定标审批！已通知供应商立即实施上门维修。', 'success');
  };

  // 发票核验通过并完成全套归档
  const handleVerifyInvoiceAndArchive = () => {
    if (!selectedOrder) return;
    if (!selectedOrder.invoiceRecord) {
      showToast('供应商尚未上传增值税发票，无法完成归档！', 'warning');
      return;
    }

    const updated: VendorCollaborationOrder = {
      ...selectedOrder,
      status: 'ARCHIVED',
      isDossierArchived: true,
      archivedAt: new Date().toLocaleString(),
      archivedBy: '张主任 (医学工程科主任)',
      invoiceRecord: {
        ...selectedOrder.invoiceRecord,
        verificationStatus: 'VERIFIED',
        verificationNote: `发票三单核验一致（报价审定价 ¥${selectedOrder.finalNegotiatedPrice} = 发票金额 ¥${selectedOrder.invoiceRecord.invoiceAmount} = 验收单合格），已由财务科登账归档。`,
      },
      messages: [
        ...selectedOrder.messages,
        {
          id: `msg-${Date.now()}`,
          senderType: 'HOSPITAL',
          senderName: '财务科 & 医学工程科',
          senderDept: '管理联合体',
          timestamp: new Date().toLocaleString(),
          content: `【发票核验通过并全套归档】发票三单一致性校验合格，生成公文级《医疗设备外协维修全套档案 (一案一档)》，自动同步往来合作单位信用与台账！`,
        }
      ]
    };

    // 触发归档，并自动双向同步更新【往来合作单位】
    onArchiveOrder(updated);
    showToast('恭喜！全套外协维修资料已通过发票与资质核验，成功合成【一案一档完整卷宗】，并已自动同步更新至【往来合作单位】台账！', 'success');
  };

  return (
    <div 
      id="vendor-collaboration-hospital-view" 
      className={`w-full text-left relative ${
        hospitalCollabMode === 'MONTHLY_FRAMEWORK' 
          ? 'h-full flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden' 
          : 'h-full flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-1'
      }`}
    >
      {/* 顶部轻量浮动消息提示 */}
      {notifyMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
          notifyMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : notifyMsg.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border-amber-300'
            : 'bg-blue-50 text-blue-800 border-blue-300'
        }`}>
          <span>{notifyMsg.text}</span>
          <button 
            type="button" 
            onClick={() => setNotifyMsg(null)}
            className="text-slate-400 hover:text-slate-600 ml-2"
          >
            ×
          </button>
        </div>
      )}
      
      {/* 顶部单层统一导航栏：模式切换、核心报表与服务商模拟入口 */}
      <div className="bg-white rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-left shrink-0">
        {/* 左侧：系统名称与业务双通道切换 (Segmented Control) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 hidden sm:flex">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
              协同
            </div>
            <div>
              <h1 className="text-xs font-bold text-slate-900 leading-tight">
                外协与零星维保协同
              </h1>
              <p className="text-[10px] text-slate-500">一案一档 · 联合审价对账</p>
            </div>
          </div>

          {/* 业务模式切换胶囊 */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              id="tab-monthly-framework"
              onClick={() => setHospitalCollabMode('MONTHLY_FRAMEWORK')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                hospitalCollabMode === 'MONTHLY_FRAMEWORK'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>月度零星框架对账 (48项)</span>
            </button>

            <button
              type="button"
              id="tab-special-orders"
              onClick={() => setHospitalCollabMode('SPECIAL_ORDERS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                hospitalCollabMode === 'SPECIAL_ORDERS'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>单台大型专项大修 ({orders.length}台)</span>
            </button>
          </div>
        </div>

        {/* 右侧：报表与服务商模拟工具 */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            id="btn-open-audit-report-top"
            onClick={() => setShowFrameworkAuditModal(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="查看48项零星维保月度框架批次、四流一致核验与四方联合审签单"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>四方联合审签单</span>
          </button>

          <button
            type="button"
            id="btn-open-quote-report-top"
            onClick={() => setShowMonthlyQuoteReportModal(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
            title="生成外协维修报价、审定价与财务结算月报"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>外协报价月报</span>
          </button>

          {/* 快捷模拟供应商 */}
          {onSwitchToVendorPortal && (
            <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-500" />
                模拟商:
              </span>
              <select
                id="select-simulate-vendor"
                onChange={(e) => {
                  const acc = VENDOR_ACCOUNTS.find(a => a.vendorId === e.target.value);
                  if (acc) onSwitchToVendorPortal(acc);
                }}
                className="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium focus:ring-1 focus:ring-slate-400 focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>选择供应商...</option>
                {VENDOR_ACCOUNTS.map(acc => (
                  <option key={acc.vendorId} value={acc.vendorId}>
                    {acc.vendorName.slice(0, 8)}... ({acc.contactPerson})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {hospitalCollabMode === 'MONTHLY_FRAMEWORK' ? (
        <MonthlyFrameworkWorkspace 
          currentVendor={VENDOR_ACCOUNTS[0]}
          currentUser={currentUser}
          departments={departments}
          isHospitalView={true}
          onSwitchToSpecialOrders={() => setHospitalCollabMode('SPECIAL_ORDERS')}
        />
      ) : (
        <>
      {/* 单台大型专项外协协同 · 科室视角与筛选栏 */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2 flex-wrap">
              <span>单台大型专项大修 · 科室视角:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                {orderDeptFilter ? orderDeptFilter : '全院所有科室'}
              </span>
              {effectiveUserDept && (
                <span className="text-[11px] text-slate-500 font-normal">
                  (当前登录科室：{effectiveUserDept})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
              {orderDeptFilter
                ? `已聚焦展示【${orderDeptFilter}】名下单台大型设备专项外协大修项目（原厂检修、四方会签等），共 ${filteredOrders.length} 台。`
                : `展示全院各科室单台大型设备外协大修联合审价与发票核验档案，共 ${orders.length} 台。`}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end md:self-auto">
          {effectiveUserDept && (
            <button
              type="button"
              id="btn-special-orders-user-dept"
              onClick={() => {
                setOrderScopeMode('DEPT');
                setOrderDeptFilter(effectiveUserDept);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                orderDeptFilter === effectiveUserDept
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>{effectiveUserDept}</span>
              <span className={`text-[10px] px-1 rounded ${orderDeptFilter === effectiveUserDept ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {orders.filter(o => matchesDepartment(o.equipmentDept, effectiveUserDept, departments)).length}
              </span>
            </button>
          )}

          <button
            type="button"
            id="btn-special-orders-all-depts"
            onClick={() => {
              setOrderScopeMode('ALL');
              setOrderDeptFilter('');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              !orderDeptFilter
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>全院设备</span>
            <span className={`text-[10px] px-1 rounded ${!orderDeptFilter ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {orders.length}
            </span>
          </button>

          <select
            id="select-special-orders-dept"
            value={orderDeptFilter}
            onChange={(e) => {
              setOrderDeptFilter(e.target.value);
              setOrderScopeMode(e.target.value === effectiveUserDept ? 'DEPT' : 'ALL');
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="">全部科室 ({availableOrderDepts.length})</option>
            {availableOrderDepts.map(item => (
              <option key={item.dept} value={item.dept}>
                {item.dept} ({item.count}台) {item.dept === effectiveUserDept ? '(当前科室)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 外协维修报价月度报表业务说明横幅 (简洁中性卡片) */}
      <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-2xs shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              外协维修报价月度报表与审价结算分析
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                按月归集 · 一案一档
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              支持按月份（如2026年9月、8月、7月等）一键生成外协厂商原始报价拆解、多科室审定成交价、审减节资率及已开专票对账单，支持导出 Excel 及直接打印公文。
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowMonthlyQuoteReportModal(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <Coins className="w-3.5 h-3.5 text-slate-600" />
            <span>生成外协报价月报</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4个核心流程状态统计 (简洁中性卡片) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setFilterStatus('ALL')}
          className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
            filterStatus === 'ALL' 
              ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-500 mb-1">外协协同工单总计</div>
          <div className="text-xl font-bold text-slate-900">{orders.length}</div>
        </div>

        <div 
          onClick={() => setFilterStatus('NEGOTIATING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
            filterStatus === 'NEGOTIATING' 
              ? 'bg-amber-50/50 border-amber-600 ring-1 ring-amber-600 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-600 mb-1 flex items-center justify-between">
            <span>多科室联合议价中</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {orders.filter(o => o.status === 'MULTI_DEPT_NEGOTIATING').length}
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus('INVOICING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
            filterStatus === 'INVOICING' 
              ? 'bg-sky-50/50 border-sky-600 ring-1 ring-sky-600 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-600 mb-1">待发票上传与核验</div>
          <div className="text-xl font-bold text-slate-900">
            {orders.filter(o => o.status === 'COMPLETED_PENDING_INVOICE' || o.status === 'INVOICE_UPLOADED').length}
          </div>
        </div>

        <div 
          onClick={() => setFilterStatus('ARCHIVED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
            filterStatus === 'ARCHIVED' 
              ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600 shadow-xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-xs text-slate-600 mb-1">一案一档已完全归档</div>
          <div className="text-xl font-bold text-slate-900">
            {orders.filter(o => o.status === 'ARCHIVED').length}
          </div>
        </div>
      </div>

      {/* 主工作区：左侧工单列表 + 右侧协同与议价工作台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左侧：外协工单列表 (4列) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-600">
            <span>外协任务列表 ({filteredOrders.length})</span>
            <span className="text-[11px] text-slate-400">点击查看详细材料</span>
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredOrders.map(order => {
              const isSelected = order.id === selectedOrder?.id;
              return (
                <div
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-xs' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold text-slate-800">{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                      order.status === 'ARCHIVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'MULTI_DEPT_NEGOTIATING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : order.status === 'INVOICE_UPLOADED'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {order.status === 'MULTI_DEPT_NEGOTIATING' && '多科室议价中'}
                      {order.status === 'PENDING_QUOTE' && '待报送报价'}
                      {order.status === 'APPROVED_REPAIRING' && '已同意/维修中'}
                      {order.status === 'COMPLETED_PENDING_INVOICE' && '完工待开发票'}
                      {order.status === 'INVOICE_UPLOADED' && '发票待查验'}
                      {order.status === 'ARCHIVED' && '已全套归档'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {order.equipmentName}
                  </h4>

                  <div className="text-xs text-slate-500 space-y-0.5 mb-2">
                    <div>合作单位：<strong className="text-slate-700 font-medium">{order.vendorName}</strong></div>
                    <div>
                      报价：<span className="font-mono text-slate-800 font-semibold">¥{order.quoteGrandTotal.toLocaleString()}</span>
                      {order.finalNegotiatedPrice && order.finalNegotiatedPrice !== order.quoteGrandTotal && (
                        <span className="text-emerald-700 font-medium ml-1.5">➔ 审定: ¥{order.finalNegotiatedPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                    <span>科室: {order.equipmentDept}</span>
                    <span>{order.createdAt.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右侧：工单详细与多科室联合议价操作区 (8列) */}
        {selectedOrder && (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            
            {/* 顶部单头信息与一案一档导出按钮 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                    {selectedOrder.id}
                  </span>
                  <span className="text-xs text-slate-500">院内工单: {selectedOrder.workOrderId}</span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-medium text-slate-700">供应商: {selectedOrder.vendorName}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedOrder.equipmentName}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  型号：{selectedOrder.equipmentModel} | 序列号：{selectedOrder.equipmentSerialNo} | 科室：{selectedOrder.equipmentDept}
                </div>
              </div>

              {/* 核心操作：查看/打印全套卷宗 */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowDossierModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>预览一案一档卷宗 (全套PDF)</span>
                </button>
              </div>
            </div>

            {/* 导航选项卡 */}
            <div className="flex items-center space-x-4 border-b border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('OVERVIEW')}
                className={`pb-2.5 px-1 border-b-2 transition ${
                  activeTab === 'OVERVIEW' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. 故障与供应商报价明细
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('MULTI_DEPT_NEGOTIATION')}
                className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'MULTI_DEPT_NEGOTIATION' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                2. 多科室联合议价工作台
                {selectedOrder.status === 'MULTI_DEPT_NEGOTIATING' && (
                  <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-medium">
                    进行中
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('INVOICE_AUDIT')}
                className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'INVOICE_AUDIT' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                3. 发票核验与归档
                {selectedOrder.status === 'INVOICE_UPLOADED' && (
                  <span className="px-1.5 py-0.2 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[10px] font-medium">
                    待核验
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMMUNICATION')}
                className={`pb-2.5 px-1 border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'COMMUNICATION' ? 'border-slate-900 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                4. 在线即时沟通 ({selectedOrder.messages.length})
              </button>
            </div>

            {/* TAB 1: 故障与报价拆解 */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-4 text-xs">
                {/* 故障现象 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-semibold mb-1">报修故障现象：</div>
                  <p className="text-slate-800 leading-relaxed">{selectedOrder.faultDescription}</p>
                </div>

                {/* 供应商报价总览 */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-800 text-sm">
                      供应商盖章报价明细 ({selectedOrder.vendorName})
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      附件：<strong className="text-indigo-600">{selectedOrder.quoteFileName || '正式盖章报价单.pdf'}</strong>
                    </span>
                  </div>

                  <table className="w-full text-left border-collapse border border-slate-200 mb-3">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="p-2 border border-slate-200">更换配件/服务项</th>
                        <th className="p-2 border border-slate-200">规格型号</th>
                        <th className="p-2 border border-slate-200 text-center">数量</th>
                        <th className="p-2 border border-slate-200 text-right">单价(元)</th>
                        <th className="p-2 border border-slate-200 text-right">小计(元)</th>
                        <th className="p-2 border border-slate-200 text-center">质保期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.quoteParts.map(part => (
                        <tr key={part.id}>
                          <td className="p-2 border border-slate-200 font-medium text-slate-800">{part.name}</td>
                          <td className="p-2 border border-slate-200 text-slate-600 font-mono">{part.spec}</td>
                          <td className="p-2 border border-slate-200 text-center">{part.quantity}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono">¥{part.unitPrice.toLocaleString()}</td>
                          <td className="p-2 border border-slate-200 text-right font-mono font-semibold">¥{part.totalPrice.toLocaleString()}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{part.warrantyPeriodMonths}个月</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="p-2 border border-slate-200 text-right text-slate-600">工时费：</td>
                        <td className="p-2 border border-slate-200 text-right font-mono">¥{selectedOrder.quoteLaborCost.toLocaleString()}</td>
                        <td className="p-2 border border-slate-200"></td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="p-2 border border-slate-200 text-right text-slate-600">差旅检测费：</td>
                        <td className="p-2 border border-slate-200 text-right font-mono">¥{selectedOrder.quoteTravelCost.toLocaleString()}</td>
                        <td className="p-2 border border-slate-200"></td>
                      </tr>
                      <tr className="bg-slate-100/70 font-bold">
                        <td colSpan={4} className="p-2 border border-slate-200 text-right text-slate-900">供应商报价合计：</td>
                        <td className="p-2 border border-slate-200 text-right text-slate-900 font-mono text-sm">¥{selectedOrder.quoteGrandTotal.toLocaleString()}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-500">有效期至 {selectedOrder.quoteValidUntil}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveTab('MULTI_DEPT_NEGOTIATION')}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <span>进入多科室联合议价审价</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 多科室联合议价工作台 (核心特色) */}
            {activeTab === 'MULTI_DEPT_NEGOTIATION' && (
              <div className="space-y-4 text-xs">
                
                {/* 议价总览指标条 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-slate-500 font-medium">初始供应商报价</div>
                    <div className="text-base font-bold text-slate-800 font-mono">¥{selectedOrder.quoteGrandTotal.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-700 font-medium">当前议价审定价</div>
                    <div className="text-base font-bold text-slate-900 font-mono">¥{selectedOrder.finalNegotiatedPrice?.toLocaleString() || selectedOrder.quoteGrandTotal.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-emerald-700 font-medium">预计审减资金</div>
                    <div className="text-base font-bold text-emerald-700 font-mono">
                      ¥{((selectedOrder.quoteGrandTotal - (selectedOrder.finalNegotiatedPrice || selectedOrder.quoteGrandTotal))).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedOrder.status === 'MULTI_DEPT_NEGOTIATING' && (
                      <button
                        type="button"
                        onClick={handleApproveFinalPrice}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>确认按此价格定标实施维修</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. 各科室联合会审意见卡片 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-xs">医院各部门联合会审会签记录：</span>
                    <span className="text-[11px] text-slate-500">必须医工、临床、财务三方完成会签</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedOrder.multiDeptOpinions.map((op, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{op.deptName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {op.decision === 'AGREE' ? '同意实施' : '建议联合议价'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          会签人：<strong className="text-slate-700">{op.reviewerName}</strong> ({op.reviewerTitle})
                        </div>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded text-xs leading-relaxed border border-slate-100">
                          {op.comments}
                        </p>
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>建议核减: <strong className="text-amber-700 font-mono">¥{op.suggestedDiscountAmount?.toLocaleString() || 0}</strong></span>
                          <span>建议目标价: <strong className="text-slate-800 font-mono">¥{op.targetPrice?.toLocaleString() || '面议'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. 录入/补充某个科室的审价意见 */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-bold text-slate-800 text-xs">更新/补充科室联合会审意见：</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-500 block mb-1 text-[11px]">会审科室：</label>
                      <select
                        value={editingDept}
                        onChange={(e: any) => setEditingDept(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      >
                        <option value="BIOMEDICAL">医学工程科</option>
                        <option value="CLINICAL">医学影像科 (使用科室)</option>
                        <option value="FINANCE">财务科 / 预算处</option>
                        <option value="AUDIT_PROCUREMENT">采招办 / 审计监察室</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 text-[11px]">建议核减金额(元)：</label>
                      <input
                        type="number"
                        value={deptDiscount}
                        onChange={(e) => setDeptDiscount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 text-[11px]">会审决策：</label>
                      <select
                        value={deptDecision}
                        onChange={(e: any) => setDeptDecision(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
                      >
                        <option value="ADVISE_NEGOTIATION">建议发起联合议价</option>
                        <option value="AGREE">同意报价方案</option>
                        <option value="REJECT">直接驳回重新报价</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-500 block mb-1 text-[11px]">会审意见及审计/临床要求：</label>
                    <input
                      type="text"
                      value={deptComment}
                      onChange={(e) => setDeptComment(e.target.value)}
                      placeholder="输入该科室专业意见，如：要求延保、免收差旅、旧件回收或必须开具13%专票..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:ring-1 focus:ring-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveDeptOpinion}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      保存科室会审意见
                    </button>
                  </div>
                </div>

                {/* 3. 向供应商正式发出线上《多科室联合议价函》 */}
                <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
                  <div className="font-bold text-amber-900 flex items-center justify-between text-xs">
                    <span>向供应商发出《多科室线上议价函》：</span>
                    <span className="text-[11px] text-amber-700 font-normal">
                      供应商将在其门户端收到并提交二次让利调价
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 block mb-1 text-[11px]">多科室联合建议目标价 (元)：</label>
                      <input
                        type="number"
                        value={negotiationTargetPrice}
                        onChange={(e) => setNegotiationTargetPrice(Number(e.target.value))}
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 block mb-1 text-[11px]">议价函补充说明：</label>
                      <input
                        type="text"
                        value={negotiationDemandNote}
                        onChange={(e) => setNegotiationDemandNote(e.target.value)}
                        placeholder="如：要求差旅全免，总价降至46000元，质保延长至18个月"
                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSendNegotiationLetter}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>正式推送议价函至供应商门户</span>
                    </button>
                  </div>
                </div>

                {/* 4. 历次谈判轮次记录 */}
                {selectedOrder.negotiationRounds?.length > 0 && (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="font-bold text-slate-800 text-xs">多轮议价谈判轨迹留痕：</div>
                    {selectedOrder.negotiationRounds.map(r => (
                      <div key={r.round} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex justify-between text-slate-600 mb-1">
                          <span><strong>第 {r.round} 轮议价</strong> ({r.initiatorDept})</span>
                          <span>{r.initiatedAt}</span>
                        </div>
                        <p className="text-slate-800 mb-1.5">
                          <strong className="text-red-600">[要求目标价 ¥{r.demandedPrice.toLocaleString()}]</strong> {r.hospitalNote}
                        </p>
                        {r.vendorResponsePrice && (
                          <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 mt-1">
                            <strong>供应商让利反馈：</strong>降至 ¥{r.vendorResponsePrice.toLocaleString()} ({r.vendorNote})
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* TAB 3: 发票核验与一案一档归档 */}
            {activeTab === 'INVOICE_AUDIT' && (
              <div className="space-y-4 text-xs">
                {selectedOrder.invoiceRecord ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 text-xs">
                          供应商提交的增值税发票凭证：
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[10px]">
                          {selectedOrder.invoiceRecord.verificationStatus === 'VERIFIED' ? '发票已核对' : '待医工财务联合复核'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-slate-500 text-[11px]">发票种类：</span>
                          <div className="font-medium text-slate-800">
                            {selectedOrder.invoiceRecord.invoiceType === 'SPECIAL_VAT' ? '增值税专用发票' : '普通发票'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">发票代码：</span>
                          <div className="font-mono text-slate-700">{selectedOrder.invoiceRecord.invoiceCode}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">发票号码：</span>
                          <div className="font-mono font-semibold text-slate-900">{selectedOrder.invoiceRecord.invoiceNo}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[11px]">发票金额(价税合计)：</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            ¥{selectedOrder.invoiceRecord.invoiceAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span>发票附件：<strong className="text-slate-700">{selectedOrder.invoiceRecord.fileName}</strong></span>
                        <span className="text-slate-500">销售方：{selectedOrder.invoiceRecord.sellerName}</span>
                      </div>
                    </div>

                    {/* 三单核验结论 */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-800 text-xs">三单勾稽核对结论 (内控关键控制点)：</div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-slate-500 text-[11px]">1. 多科室审定价</div>
                          <div className="font-bold font-mono text-slate-800 text-sm">
                            ¥{(selectedOrder.finalNegotiatedPrice || selectedOrder.quoteGrandTotal).toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-slate-500 text-[11px]">2. 增值税发票金额</div>
                          <div className="font-bold font-mono text-slate-900 text-sm">
                            ¥{selectedOrder.invoiceRecord.invoiceAmount.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                          <div className="text-slate-500 text-[11px]">3. 临床验收结果</div>
                          <div className="font-bold text-emerald-700 text-sm">
                            合格通过 (已签字)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 归档操作 */}
                    <div className="flex justify-end pt-2">
                      {selectedOrder.status !== 'ARCHIVED' ? (
                        <button
                          type="button"
                          onClick={handleVerifyInvoiceAndArchive}
                          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>发票核对无误，一键合成【一案一档】并归档</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>该外协工单已于 {selectedOrder.archivedAt} 完成全套归档入库！</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-medium">供应商尚未上传发票凭证</p>
                    <p className="text-[11px] text-slate-400 mt-1">维修完成后，供应商将在其专属门户端录入发票代码、号码并上传原件。</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: 在线双向沟通留言 */}
            {activeTab === 'COMMUNICATION' && (
              <div className="flex flex-col h-[450px] bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                  {selectedOrder.messages.map(msg => {
                    const isHospital = msg.senderType === 'HOSPITAL';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isHospital ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1">
                          <span className="font-medium text-slate-700">{msg.senderName}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                            isHospital
                              ? 'bg-slate-900 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center space-x-2">
                  <input
                    type="text"
                    value={hospitalMsg}
                    onChange={(e) => setHospitalMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendHospitalMessage()}
                    placeholder="给供应商技术主管留言沟通..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleSendHospitalMessage}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
      </>
      )}

      {/* 完整一案一档 PDF 预览弹窗 */}
      {showDossierModal && selectedOrder && (
        <VendorDossierPdfModal
          order={selectedOrder}
          onClose={() => setShowDossierModal(false)}
        />
      )}

      {/* 外协维修报价月度报表与审价分析弹窗 */}
      {showMonthlyQuoteReportModal && (
        <VendorMonthlyQuoteReportModal
          orders={orders}
          onClose={() => setShowMonthlyQuoteReportModal(false)}
          onSelectOrder={(order) => {
            setSelectedOrderId(order.id);
            setShowMonthlyQuoteReportModal(false);
          }}
        />
      )}

      {/* 月度框架零星维保审签单与逐项明细对账表 */}
      {showFrameworkAuditModal && (
        <MonthlyFrameworkAuditReportModal
          isOpen={showFrameworkAuditModal}
          onClose={() => setShowFrameworkAuditModal(false)}
          batch={frameworkBatches.find(b => b.id === 'BATCH-2026-08') || frameworkBatches[0]}
          allBatches={frameworkBatches}
        />
      )}
    </div>
  );
};
