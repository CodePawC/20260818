import React, { useState } from 'react';
import { 
  ReturnFactoryRepairOrder, 
  WorkflowRole, 
  DialogueMessage 
} from '../../types/factoryRepairTypes';
import { 
  Scale, 
  DollarSign, 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  FileSpreadsheet, 
  User, 
  Eye, 
  Lock, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  Building2,
  FileCheck
} from 'lucide-react';

interface JointNegotiationWorkspaceProps {
  order: ReturnFactoryRepairOrder;
  currentRole: WorkflowRole;
  onSendMessage: (content: string) => void;
  onSubmitClinicalOpinion: (opinion: string, budgetCeiling: number) => void;
  onSubmitLeadershipGuidance: (limit: number, instruction: string) => void;
  onSubmitHospitalCounterOffer: (amount: number, remark: string) => void;
  onSubmitVendorCounterResponse: (amount: number, reason: string) => void;
  onCloseNegotiationAndLockPrice: (finalPrice: number, warrantyMonths: number) => void;
}

export const JointNegotiationWorkspace: React.FC<JointNegotiationWorkspaceProps> = ({
  order,
  currentRole,
  onSendMessage,
  onSubmitClinicalOpinion,
  onSubmitLeadershipGuidance,
  onSubmitHospitalCounterOffer,
  onSubmitVendorCounterResponse,
  onCloseNegotiationAndLockPrice
}) => {
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'quote' | 'negotiate' | 'dialogue'>('negotiate');

  // 科室意见输入
  const [clinicalOpinionText, setClinicalOpinionText] = useState(
    order.jointNegotiation.clinicalDeptOpinion?.opinion || 
    '科室已查看厂家拆检图片，认可换件方案，建议严格索要原厂备件海关报关单与质检单；希望价格能控制在14,500元以内，并保持12个月质保期。'
  );
  const [clinicalBudgetCeiling, setClinicalBudgetCeiling] = useState(
    order.jointNegotiation.clinicalDeptOpinion?.willingBudgetCeiling || 14500
  );

  // 院长批示输入
  const [presidentLimit, setPresidentLimit] = useState(
    order.jointNegotiation.leadershipGuidance?.targetPriceLimit || 14200
  );
  const [presidentInstruction, setPresidentInstruction] = useState(
    order.jointNegotiation.leadershipGuidance?.instruction || 
    '经对比省立医院近期同型号狼牌输尿管镜大修历史中标均价(约1.38~1.45万元)，该报价16,500元偏高。指示设备科下发议价函，力争压降至14,200元包干并确保12个月整机质保，方可签署合同。'
  );

  // 设备科议价输入
  const [counterOfferAmount, setCounterOfferAmount] = useState(14200);
  const [counterOfferRemark, setCounterOfferRemark] = useState(
    '根据刘院长批示及麻醉手术科核验意见，要求价格控制在14,200元包干，含13%专票与往返保价物流，提供12个月免费质保。'
  );

  // 厂家答复输入
  const [vendorOfferAmount, setVendorOfferAmount] = useState(14200);
  const [vendorDiscountReason, setVendorDiscountReason] = useState(
    '经请示德国狼牌大区经理特批，同意以14,200元包干成交，承诺原装配件与12个月整机质保。'
  );

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const isAgreed = order.jointNegotiation.isAgreed;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 头部状态条 */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                四方全透明共同议价协同中心
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {isAgreed ? '议价达成·价格已锁定' : '多方在线磋商中'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              麻醉手术科（临床需求）· 医疗设备科（技术控费）· 院领导（定调决策）· 狼牌厂家（透明让利）
            </p>
          </div>
        </div>

        {/* 顶部标签切换 */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('negotiate')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'negotiate' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            三方联合议价台
          </button>
          <button
            onClick={() => setActiveTab('quote')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              activeTab === 'quote' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            厂家拆检与明细报价单
          </button>
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'dialogue' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>实时留言板 ({order.dialogueMessages.length})</span>
          </button>
        </div>
      </div>

      {/* 选项卡1：三方联合议价台 */}
      {activeTab === 'negotiate' && (
        <div className="p-6 space-y-6">
          {/* 金额概览条 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">厂家初始总报价</div>
              <div className="text-base font-bold text-slate-800 mt-1 font-mono">
                ¥{order.vendorInspectionQuote.totalQuotePrice.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">含4套核心光学配件及工时</div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-[11px] text-emerald-700 font-medium">麻醉手术科期望预算上限</div>
              <div className="text-base font-bold text-emerald-800 mt-1 font-mono">
                ¥{order.jointNegotiation.clinicalDeptOpinion?.willingBudgetCeiling?.toLocaleString() || '14,500'}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">护士长与主刀医师签署建议</div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
              <div className="text-[11px] text-purple-700 font-medium">刘院长批示控制目标线</div>
              <div className="text-base font-bold text-purple-800 mt-1 font-mono">
                ¥{order.jointNegotiation.leadershipGuidance?.targetPriceLimit?.toLocaleString() || '14,200'}
              </div>
              <div className="text-[10px] text-purple-600 mt-0.5">行业同机型集采中标锚定价</div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="text-[11px] text-indigo-700 font-medium flex items-center justify-between">
                <span>最终定标成交价</span>
                {isAgreed && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
              </div>
              <div className="text-base font-bold text-indigo-900 mt-1 font-mono">
                ¥{order.jointNegotiation.finalAgreedPrice?.toLocaleString() || '14,200'}
              </div>
              <div className="text-[10px] text-indigo-600 mt-0.5">
                累计让利优惠 ¥{(order.vendorInspectionQuote.totalQuotePrice - (order.jointNegotiation.finalAgreedPrice || 14200)).toLocaleString()} 元 (核减14%)
              </div>
            </div>
          </div>

          {/* 议价各方视角卡片 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 1. 麻醉手术科临床意见卡片 */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    护
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">麻醉手术科 · 临床查验与议价意见</h4>
                    <span className="text-[11px] text-slate-500">
                      填报人: {order.jointNegotiation.clinicalDeptOpinion?.authorName || '黄晓彤 护士长'}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-100">
                  科室穿透透明可见
                </span>
              </div>

              {currentRole === 'clinical_anesthesia' && !isAgreed ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={clinicalOpinionText}
                    onChange={(e) => setClinicalOpinionText(e.target.value)}
                    className="w-full p-2.5 text-xs border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="请输入科室使用意见及预算期望..."
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span>期望最高预算: ¥</span>
                      <input
                        type="number"
                        value={clinicalBudgetCeiling}
                        onChange={(e) => setClinicalBudgetCeiling(Number(e.target.value))}
                        className="w-24 p-1 text-xs border border-slate-300 rounded font-bold font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSubmitClinicalOpinion(clinicalOpinionText, clinicalBudgetCeiling)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                    >
                      更新科室意见
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-emerald-100 text-xs text-slate-700 space-y-1">
                  <p className="leading-relaxed">
                    "{order.jointNegotiation.clinicalDeptOpinion?.opinion || clinicalOpinionText}"
                  </p>
                  <div className="text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>科室接受最高预算上限: ¥{order.jointNegotiation.clinicalDeptOpinion?.willingBudgetCeiling?.toLocaleString()}</span>
                    <span>提交时间: {order.jointNegotiation.clinicalDeptOpinion?.submittedAt || '2026-09-22 20:15'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. 院长审阅与控价指导批示卡片 */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    院
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">院长办公室 · 目标控价批示指示</h4>
                    <span className="text-[11px] text-slate-500">
                      批示领导: {order.jointNegotiation.leadershipGuidance?.leaderName || '刘志刚'} (院长)
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-purple-700 font-bold px-2 py-0.5 rounded bg-purple-100">
                  院长穿透透明批示
                </span>
              </div>

              {currentRole === 'president' && !isAgreed ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={presidentInstruction}
                    onChange={(e) => setPresidentInstruction(e.target.value)}
                    className="w-full p-2.5 text-xs border border-purple-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500/20"
                    placeholder="请输入院领导批示控价要求..."
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700">
                      <span>批示控制上限: ¥</span>
                      <input
                        type="number"
                        value={presidentLimit}
                        onChange={(e) => setPresidentLimit(Number(e.target.value))}
                        className="w-24 p-1 text-xs border border-slate-300 rounded font-bold font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => onSubmitLeadershipGuidance(presidentLimit, presidentInstruction)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition"
                    >
                      发布领导控价指示
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-700 space-y-1">
                  <p className="leading-relaxed">
                    "{order.jointNegotiation.leadershipGuidance?.instruction || presidentInstruction}"
                  </p>
                  <div className="text-[11px] text-purple-700 font-semibold pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>院长批示控制红线: ¥{order.jointNegotiation.leadershipGuidance?.targetPriceLimit?.toLocaleString()}</span>
                    <span>签署时间: {order.jointNegotiation.leadershipGuidance?.submittedAt || '2026-09-22 21:00'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 议价多轮博弈记录流水 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800">平台在线议价让利轮次记录</span>
              <span className="text-[11px] text-slate-500 font-mono">
                已进行 {order.jointNegotiation.negotiationRounds.length} 轮在线磋商
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-2">
              {order.jointNegotiation.negotiationRounds.map((rnd) => (
                <div key={rnd.round} className="p-3 flex items-start justify-between gap-4 text-xs">
                  <div className="w-16 shrink-0 font-bold text-slate-700">
                    第 {rnd.round} 轮
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700">院方还价函: ¥{rnd.hospitalCounterOffer.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({rnd.timestamp})</span>
                    </div>
                    <p className="text-slate-600 text-[11px] bg-blue-50/50 p-1.5 rounded">
                      {rnd.hospitalRemark}
                    </p>
                  </div>

                  <div className="flex items-center text-slate-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700">厂家让利答复: ¥{rnd.vendorResponseOffer.toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] bg-amber-50/50 p-1.5 rounded">
                      {rnd.vendorDiscountReason}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* 新增议价互动入口 (未锁定时) */}
            {!isAgreed && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">模拟下达议价或厂家答复:</span>
                  <button
                    type="button"
                    onClick={() => onSubmitHospitalCounterOffer(14200, counterOfferRemark)}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                  >
                    院方设备科下发议价函 (¥14,200)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitVendorCounterResponse(14200, vendorDiscountReason)}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                  >
                    狼牌厂家同意让利答复 (¥14,200)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onCloseNegotiationAndLockPrice(14200, 12)}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>锁定定标价 ¥14,200 · 推进签署合同</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 选项卡2：厂家拆检与明细报价单 */}
      {activeTab === 'quote' && (
        <div className="p-6 space-y-6">
          {/* 拆检说明与高清照片 */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  德国狼牌百级无尘拆检技术报告 ({order.vendorInspectionQuote.vendorReportNo})
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                主检工程师: {order.vendorInspectionQuote.inspectionEngineer} · {order.vendorInspectionQuote.receivedAt}
              </span>
            </div>

            <div className="text-xs text-slate-700 whitespace-pre-line bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
              {order.vendorInspectionQuote.detailedFindings}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {order.vendorInspectionQuote.findingsPhotos.map((p, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="h-36 overflow-hidden bg-slate-100 relative">
                    <img 
                      src={p.url} 
                      alt={p.title}
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      电子显微检测存证
                    </span>
                  </div>
                  <div className="p-2.5 text-xs">
                    <div className="font-bold text-slate-800">{p.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{p.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 零配件与人工明细报价表 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <th className="p-3">序号</th>
                  <th className="p-3">拟换零配件/服务名称</th>
                  <th className="p-3">规格型号</th>
                  <th className="p-3 text-center">数量</th>
                  <th className="p-3 text-right">单价 (元)</th>
                  <th className="p-3 text-right">小计 (元)</th>
                  <th className="p-3 text-center">质保期</th>
                  <th className="p-3 text-center">备件属性</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {order.vendorInspectionQuote.quoteItems.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.partName}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{item.specModel}</td>
                    <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                    <td className="p-3 text-right font-mono">¥{item.unitPrice.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">¥{item.totalPrice.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        {item.warrantyMonths}个月
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                        原装进口
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-slate-900">
                  <td colSpan={5} className="p-3 text-right">
                    总报价合计 (含13%增值税专用发票及顺丰保价快递):
                  </td>
                  <td className="p-3 text-right text-rose-700 font-mono text-sm">
                    ¥{order.vendorInspectionQuote.totalQuotePrice.toLocaleString()}
                  </td>
                  <td colSpan={2} className="p-3 text-center text-xs text-slate-500">
                    预计维修修复工期: {order.vendorInspectionQuote.expectedRepairDays} 个工作日
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 选项卡3：实时沟通留言板 */}
      {activeTab === 'dialogue' && (
        <div className="p-6 space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
            <span>
              双向即时沟通板：麻醉手术科、设备科工程师、分管副院长、院长及德国狼牌工程师均可在此对话。
            </span>
            <span className="text-[11px] text-blue-600 font-medium">全院加密留痕存证</span>
          </div>

          {/* 消息滚动列表 */}
          <div className="h-80 overflow-y-auto border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/30">
            {order.dialogueMessages.map((msg) => {
              const isVendor = msg.senderRoleKey === 'vendor_oem';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[80%] ${isVendor ? 'ml-auto flex-row-reverse text-right' : 'mr-auto'}`}
                >
                  <div className={`w-8 h-8 rounded-full ${msg.senderAvatar} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                    {msg.senderName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-slate-800">{msg.senderName}</span>
                      <span>({msg.senderRole})</span>
                      <span className="text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed text-left ${
                      isVendor
                        ? 'bg-amber-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 输入框 */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="在此输入沟通或议价意见，各角色实时同步可见..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>发送留言</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
