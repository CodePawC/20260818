import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  Search, 
  Plus, 
  ShieldAlert, 
  Coins, 
  UserCheck, 
  ArrowRight, 
  Filter,
  Check,
  Building2,
  DollarSign
} from 'lucide-react';
import { 
  EquipmentScrapOrder, 
  ScrapWorkflowStage, 
  ScrapReasonType 
} from '../../types/scrapTypes';
import { 
  getScrapOrders, 
  saveScrapOrders, 
  createScrapOrderFromEquipment 
} from '../../utils/scrapEquipmentData';
import { MedicalEquipment } from '../../types';
import { ScrapApprovalPrintModal } from './ScrapApprovalPrintModal';

interface EquipmentScrapWorkflowViewProps {
  equipmentList: MedicalEquipment[];
  onEquipmentStatusChange?: (equipmentId: string, newStatus: any) => void;
  currentUser?: any;
}

export const EquipmentScrapWorkflowView: React.FC<EquipmentScrapWorkflowViewProps> = ({
  equipmentList,
  onEquipmentStatusChange,
  currentUser
}) => {
  const [orders, setOrders] = useState<EquipmentScrapOrder[]>(() => getScrapOrders());
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<EquipmentScrapOrder | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // 新建报废申请模态框状态
  const [isNewApplyModalOpen, setIsNewApplyModalOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [applicantName, setApplicantName] = useState('张建军');
  const [applicantPhone, setApplicantPhone] = useState('13863398822');
  const [reasonType, setReasonType] = useState<ScrapReasonType>('exceeded_lifespan');
  const [reasonDetail, setReasonDetail] = useState('');

  // 快捷技术鉴定 / 专家签字模态框
  const [activeSignOrder, setActiveSignOrder] = useState<EquipmentScrapOrder | null>(null);
  const [expertRole, setExpertRole] = useState<'biomedical_engineer' | 'equipment_director' | 'finance_director' | 'vp_medical_technology'>('equipment_director');
  const [signComment, setSignComment] = useState('经审核，符合国有资产处置规定，同意报废。');

  // 财政批复与残值录入模态框
  const [activeFiscalOrder, setActiveFiscalOrder] = useState<EquipmentScrapOrder | null>(null);
  const [fiscalBatchNo, setFiscalBatchNo] = useState('五财资批[2026]88号');
  const [salvageAmount, setSalvageAmount] = useState('35000');
  const [disposalAgency, setDisposalAgency] = useState('五莲县公共资源交易中心再生医疗物资回收专包');

  // 计算统计汇总
  const stats = useMemo(() => {
    const totalCount = orders.length;
    const totalOriginalValue = orders.reduce((sum, o) => sum + o.originalValue, 0);
    const totalSalvage = orders.reduce((sum, o) => sum + (o.salvageAmount || 0), 0);
    const inProgressCount = orders.filter(o => !o.isLedgerDeregistered).length;
    const deregisteredCount = orders.filter(o => o.isLedgerDeregistered).length;
    return {
      totalCount,
      totalOriginalValue,
      totalSalvage,
      inProgressCount,
      deregisteredCount
    };
  }, [orders]);

  // 过滤工单
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch = order.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.applicationNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = stageFilter === 'all' || order.stage === stageFilter;
      return matchSearch && matchStage;
    });
  }, [orders, searchQuery, stageFilter]);

  // 处理新建申请
  const handleCreateApply = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEq = equipmentList.find(e => e.id === selectedEquipmentId);
    if (!targetEq) return;

    const newOrder = createScrapOrderFromEquipment(
      targetEq,
      applicantName,
      applicantPhone,
      reasonType,
      reasonDetail || '设备年限已到，故障频发且配件停产，申请报废。'
    );

    setOrders([newOrder, ...orders.filter(o => o.id !== newOrder.id)]);
    setIsNewApplyModalOpen(false);
    setSelectedEquipmentId('');
    setReasonDetail('');
  };

  // 推进专家签名
  const handleConfirmSignature = () => {
    if (!activeSignOrder) return;
    const nowStr = `${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    
    const nextOrders = orders.map(order => {
      if (order.id !== activeSignOrder.id) return order;
      const nextSigs = order.expertSignatures.map(sig => {
        if (sig.role === expertRole) {
          return {
            ...sig,
            verdict: 'approved' as const,
            comment: signComment,
            signatureDate: nowStr,
            signatureImageBase64: currentUser?.name || sig.userName
          };
        }
        return sig;
      });

      // 检查是否所有专家已联签
      const allSigned = nextSigs.every(s => s.verdict === 'approved');
      let nextStage: ScrapWorkflowStage = order.stage;
      if (allSigned && order.stage === 'expert_committee_review') {
        nextStage = 'fiscal_approval';
      }

      return {
        ...order,
        expertSignatures: nextSigs,
        stage: nextStage,
        updatedAt: nowStr
      };
    });

    setOrders(nextOrders);
    saveScrapOrders(nextOrders);
    setActiveSignOrder(null);
  };

  // 推进财政批复与残值结算
  const handleConfirmFiscalAndDisposal = () => {
    if (!activeFiscalOrder) return;
    const nowStr = `${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;

    const nextOrders = orders.map(order => {
      if (order.id !== activeFiscalOrder.id) return order;
      return {
        ...order,
        stage: 'disposal_auction_destruction' as ScrapWorkflowStage,
        fiscalApprovalBatchNo: fiscalBatchNo,
        approvalDate: new Date().toISOString().split('T')[0],
        salvageAmount: Number(salvageAmount) || 0,
        disposalAgencyName: disposalAgency,
        disposalMethod: 'auction_transfer' as const,
        updatedAt: nowStr
      };
    });

    setOrders(nextOrders);
    saveScrapOrders(nextOrders);
    setActiveFiscalOrder(null);
  };

  // 最终资产台账销账
  const handleFinalDeregister = (order: EquipmentScrapOrder) => {
    const confirmDereg = window.confirm(`确认对设备【${order.equipmentName} (${order.assetNumber})】执行最终固定资产台账核销归档？核销后台账状态将锁定为“已报废”。`);
    if (!confirmDereg) return;

    const nowStr = `${new Date().toLocaleDateString('zh-CN')} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    const nextOrders = orders.map(o => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        stage: 'ledger_deregistered' as ScrapWorkflowStage,
        isLedgerDeregistered: true,
        deregisteredAt: nowStr,
        deregisteredBy: currentUser?.name || '周立新 (固定资产管理员)',
        updatedAt: nowStr
      };
    });

    setOrders(nextOrders);
    saveScrapOrders(nextOrders);

    // 同步修改设备主台账状态为已报废 (decommissioned)
    if (onEquipmentStatusChange) {
      onEquipmentStatusChange(order.equipmentId, 'decommissioned');
    }
  };

  const getStageBadge = (stage: ScrapWorkflowStage) => {
    switch (stage) {
      case 'draft_application':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">科室申请</span>;
      case 'technical_appraisal':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">医工技术鉴定</span>;
      case 'expert_committee_review':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">专家委员会联审</span>;
      case 'environmental_safety_clearance':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200">环保与数据核准</span>;
      case 'fiscal_approval':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">待财政卫健批复</span>;
      case 'disposal_auction_destruction':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-orange-50 text-orange-800 border border-orange-200">残值竞拍与移交</span>;
      case 'ledger_deregistered':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">已销账归档</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 顶部标题栏 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-600 text-white rounded-lg shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">医疗设备报废技术鉴定与资产处置全流程</h1>
            <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded border border-rose-200">
              国有资产闭环合规
            </span>
          </div>
          <p className="text-xs text-slate-500">
            涵盖科室申请、医工技术鉴定评分、院内多方专家联审联签、环保/放射源特殊审批、财政批复与残值竞拍处置，保障账实相符。
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewApplyModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            发起报废技术鉴定申请
          </button>
        </div>
      </div>

      {/* KPI 统计条 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">报废设备累计总台数</span>
          <div className="text-xl font-bold font-mono text-slate-900">{stats.totalCount} 台</div>
          <span className="text-[10px] text-slate-400">含正在审批中工单</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">报废资产总原值</span>
          <div className="text-xl font-bold font-mono text-slate-900">
            ¥{(stats.totalOriginalValue / 10000).toFixed(1)} 万元
          </div>
          <span className="text-[10px] text-slate-400">固定资产账面原值核算</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">已变现回收残值</span>
          <div className="text-xl font-bold font-mono text-emerald-600">
            ¥{stats.totalSalvage.toLocaleString()} 元
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">竞拍回收上缴财政</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">审批推进中工单</span>
          <div className="text-xl font-bold font-mono text-amber-600">{stats.inProgressCount} 项</div>
          <span className="text-[10px] text-amber-700 font-medium">正在联审与批复</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-medium text-slate-500">已完成销账归档</span>
          <div className="text-xl font-bold font-mono text-blue-600">{stats.deregisteredCount} 台</div>
          <span className="text-[10px] text-blue-700 font-medium">台账已彻底销号</span>
        </div>
      </div>

      {/* 工单搜索与表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">报废技术鉴定与处置工单台账</h2>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">
              {filteredOrders.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索设备名称、资产编号或单号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 w-48 sm:w-60"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white text-slate-700"
            >
              <option value="all">全部流程节点</option>
              <option value="draft_application">科室申请</option>
              <option value="technical_appraisal">医工技术鉴定</option>
              <option value="expert_committee_review">专家联审</option>
              <option value="fiscal_approval">待财政批复</option>
              <option value="disposal_auction_destruction">残值竞拍处置</option>
              <option value="ledger_deregistered">已销账归档</option>
            </select>
          </div>
        </div>

        {/* 报废工单列表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3.5 border-b border-slate-200">申请单号</th>
                <th className="py-3 px-3.5 border-b border-slate-200">设备名称与资产编号</th>
                <th className="py-3 px-3.5 border-b border-slate-200">科室 / 购置原值</th>
                <th className="py-3 px-3.5 border-b border-slate-200">使用年限 / 维修占比</th>
                <th className="py-3 px-3.5 border-b border-slate-200">报废主因</th>
                <th className="py-3 px-3.5 border-b border-slate-200">流程进度</th>
                <th className="py-3 px-3.5 border-b border-slate-200 text-right">业务操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900">
                    <div>{order.applicationNo}</div>
                    <span className="text-[10px] text-slate-400 font-sans block">{order.applicationDate}</span>
                  </td>
                  <td className="py-3 px-3.5 font-sans">
                    <div className="font-bold text-slate-900">{order.equipmentName}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {order.assetNumber} · {order.model}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-sans">
                    <div className="font-medium text-slate-800">{order.department}</div>
                    <div className="font-mono text-slate-500 text-[11px]">
                      原值: ¥{order.originalValue.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="text-slate-800 font-medium font-sans">
                      已用 <strong className="font-mono">{order.actualUsageYears}</strong> 年
                    </div>
                    <div className={`text-[11px] font-bold ${
                      order.repairToValueRatio >= 50 ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                      维修比: {order.repairToValueRatio}%
                    </div>
                  </td>
                  <td className="py-3 px-3.5 font-sans text-slate-600 text-[11px] max-w-xs">
                    {order.scrapReasonType === 'exceeded_lifespan' && '超使用年限性能老化'}
                    {order.scrapReasonType === 'maintenance_cost_excessive' && '维修费超原值50%'}
                    {order.scrapReasonType === 'damaged_unrepairable' && '损坏关键件停产'}
                    {order.scrapReasonType === 'safety_environmental_hazard' && '安全隐患检验不合格'}
                    {order.scrapReasonType === 'technology_obsolete' && '技术淘汰'}
                  </td>
                  <td className="py-3 px-3.5 font-sans">
                    {getStageBadge(order.stage)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-sans space-x-1.5 whitespace-nowrap">
                    {/* 查看打印审批表 */}
                    <button
                      onClick={() => {
                        setSelectedOrderForPrint(order);
                        setIsPrintModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3 text-slate-500" />
                      审批表
                    </button>

                    {/* 专家联审签字 */}
                    {order.stage === 'expert_committee_review' && (
                      <button
                        onClick={() => {
                          setActiveSignOrder(order);
                          setSignComment('经审核，符合国有资产处置规定，同意报废。');
                        }}
                        className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        专家联签
                      </button>
                    )}

                    {/* 财政批复与残值录入 */}
                    {order.stage === 'fiscal_approval' && (
                      <button
                        onClick={() => setActiveFiscalOrder(order)}
                        className="px-2.5 py-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Coins className="w-3 h-3" />
                        录入批文与残值
                      </button>
                    )}

                    {/* 最终台账销账 */}
                    {order.stage === 'disposal_auction_destruction' && !order.isLedgerDeregistered && (
                      <button
                        onClick={() => handleFinalDeregister(order)}
                        className="px-2.5 py-1 text-white bg-rose-600 hover:bg-rose-700 rounded text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        确认台账销账
                      </button>
                    )}

                    {order.isLedgerDeregistered && (
                      <span className="text-emerald-700 text-[11px] font-medium">已销账归档</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新建报废申请模态框 */}
      {isNewApplyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">发起医疗设备报废技术鉴定申请</h3>
              <button
                onClick={() => setIsNewApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateApply} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">选择报废目标设备</label>
                <select
                  required
                  value={selectedEquipmentId}
                  onChange={(e) => setSelectedEquipmentId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">-- 请选择全院在用或待修设备 --</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.department}] {eq.name} ({eq.assetNumber || eq.id}) - 原值: ¥{eq.price?.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">申请责任人</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">联系电话</label>
                  <input
                    type="text"
                    required
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">报废主要原因类型</label>
                <select
                  value={reasonType}
                  onChange={(e) => setReasonType(e.target.value as ScrapReasonType)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="exceeded_lifespan">达到或超过国家规定使用年限且性能指标严重老化</option>
                  <option value="maintenance_cost_excessive">累计维修维护费用超过设备原值50%，丧失修复价值</option>
                  <option value="damaged_unrepairable">严重损坏、关键零配件已停产无法修复</option>
                  <option value="safety_environmental_hazard">存在严重电气安全、辐射超标或生物安全隐患</option>
                  <option value="technology_obsolete">国家明令淘汰或落后无法满足基本临床要求</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">详细故障现状阐述与报废事实说明</label>
                <textarea
                  required
                  rows={3}
                  placeholder="说明设备实际运转故障状况、停用原因及零配件短缺事实..."
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewApplyModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-sm"
                >
                  提交医工技术鉴定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 专家联审签字模态框 */}
      {activeSignOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">固定资产处置专家评审委员会联审联签</h3>
              <button
                onClick={() => setActiveSignOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div><strong>报废设备：</strong> {activeSignOrder.equipmentName}</div>
              <div><strong>资产编号：</strong> {activeSignOrder.assetNumber}</div>
              <div><strong>原值：</strong> ¥{activeSignOrder.originalValue.toLocaleString()}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">选择签署身份角色</label>
                <select
                  value={expertRole}
                  onChange={(e: any) => setExpertRole(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="equipment_director">医学装备科科长 (孙建国)</option>
                  <option value="finance_director">财务资产管理科长 (周立新)</option>
                  <option value="vp_medical_technology">分管业务副院长 (崔维)</option>
                  <option value="biomedical_engineer">医工技术鉴定人 (李思齐)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">评审联签意见</label>
                <textarea
                  rows={2}
                  value={signComment}
                  onChange={(e) => setSignComment(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveSignOrder(null)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSignature}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium shadow-sm transition-colors"
              >
                签署同意并加盖电子签章
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 财政批复与处置变现模态框 */}
      {activeFiscalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">录入财政国资批文与残值变现</h3>
              <button
                onClick={() => setActiveFiscalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">财政/卫健国资处置批复文号</label>
                <input
                  type="text"
                  required
                  value={fiscalBatchNo}
                  onChange={(e) => setFiscalBatchNo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">公开竞拍处置成交残值金额 (元)</label>
                <input
                  type="number"
                  required
                  value={salvageAmount}
                  onChange={(e) => setSalvageAmount(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">具备资质的回收承接单位</label>
                <input
                  type="text"
                  required
                  value={disposalAgency}
                  onChange={(e) => setDisposalAgency(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveFiscalOrder(null)}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmFiscalAndDisposal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium shadow-sm transition-colors"
              >
                保存批文并转入移交处置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 报废审批表打印模态框 */}
      <ScrapApprovalPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        order={selectedOrderForPrint}
      />
    </div>
  );
};
