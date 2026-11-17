import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Landmark,
  Layers,
  Copy,
  Check,
  Sparkles,
  Info,
  Hash,
  HelpCircle,
  Link2
} from 'lucide-react';
import {
  resolveHospitalCodingChain,
  HOSPITAL_CODING_RULES_SPEC,
  HospitalCodingChain
} from '../../utils/hospitalCodingStandard';

interface HospitalCodingStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onJumpToProject?: (id: string) => void;
}

export const HospitalCodingStandardModal: React.FC<HospitalCodingStandardModalProps> = ({
  isOpen,
  onClose,
  initialCode = '3212',
  onJumpToProject
}) => {
  const [testInput, setTestInput] = useState<string>(initialCode);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentChain: HospitalCodingChain = resolveHospitalCodingChain(testInput);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold shadow-inner">
              <Hash className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  全院单据与项目编码统一规范及钩稽中枢
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono">
                  v2.4 规范
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                理顺请示报告 (WO-) · 项目总台账 (PRJ-) · 费用预批单 (YP-) · 增值税发票 (FP-) 业务逻辑
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800">
          {/* Section 1: 核心疑问权威解答 (Direct Answer to User's Core Question) */}
          <div className="p-4 sm:p-5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                  <span>问：预批单编号与台账ID，是否需要与请示报告中的 NO. WO-REP-2026-3212 强行改成同一个字符串？</span>
                </h4>
                <div className="text-xs text-slate-700 leading-relaxed mt-1.5 space-y-2">
                  <p>
                    <strong>答：业务属性不同，不应混为同一纯文本，但流水号必须 100% 严格对应、一脉相承！</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>
                      <strong>《设备维修请示报告》（WO-: Work Order）</strong>：代表临床科室发起的工程维修申请公文，按业务性质分为 
                      <span className="text-amber-700 font-mono font-semibold"> WO-REP </span>(现场急修)、
                      <span className="text-purple-700 font-mono font-semibold"> WO-FAC </span>(返厂大修)、
                      <span className="text-blue-700 font-mono font-semibold"> WO-PRT </span>(配件置换) 等。
                    </li>
                    <li>
                      <strong>《全院设备项目总台账》（PRJ-: Project）</strong>：代表医院全生命周期立项预算条目，主键是 
                      <span className="text-slate-900 font-mono font-semibold"> ID_项目: 3212 </span>(全量规范码为 <code>PRJ-2026-3212</code>)。
                    </li>
                    <li>
                      <strong>《费用预批单》（YP-: 预批）</strong>：代表收到增值税发票后由经办人、科室主任、分管院长、主要负责人联签的财务支出凭据。红头原件印制格式为：
                      <span className="text-red-700 font-serif font-bold"> 费用预批单（编号：3212）</span>，规范财务全码为 <code>YP-2026-3212</code>。
                    </li>
                  </ul>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                    <span>
                      💡 <strong>核心逻辑</strong>：以<strong>年度基准流水号 (如 3212 或 0548)</strong> 为全局锚点，工单是 <code>WO-REP-2026-3212</code>，项目是 <code>ID: 3212</code>，预批单是 <code>编号：3212</code>，做到“一单立项、全链贯通、无缝穿透”！
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: 实时交互式编码链条解析器 (Interactive Code Resolver) */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>交互式六码贯通测试演算器</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  输入任意工单号、项目ID或预批单号，系统自动解析并映射全生命周期单据
                </p>
              </div>

              {/* Quick sample pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400">试试填入:</span>
                <button
                  onClick={() => setTestInput('3212')}
                  className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-mono font-bold hover:bg-blue-200 cursor-pointer"
                >
                  3212 (急修请示)
                </button>
                <button
                  onClick={() => setTestInput('WO-REP-2026-3212')}
                  className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-mono font-bold hover:bg-amber-200 cursor-pointer"
                >
                  WO-REP-2026-3212
                </button>
                <button
                  onClick={() => setTestInput('548')}
                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-mono font-bold hover:bg-emerald-200 cursor-pointer"
                >
                  548 (特检院安全阀)
                </button>
                <button
                  onClick={() => setTestInput('629')}
                  className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-xs font-mono font-bold hover:bg-purple-200 cursor-pointer"
                >
                  629 (输尿管镜大修)
                </button>
              </div>
            </div>

            {/* Input field */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="输入如 3212、WO-REP-2026-3212 或 YP-2026-0548..."
                  className="w-full h-10 px-3 pl-9 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-xs text-slate-500 font-medium shrink-0">
                基准流水号: <strong className="text-blue-600 font-mono text-sm font-bold">#{currentChain.sequenceNumber}</strong>
              </span>
            </div>

            {/* 6-Card Linked Chain Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Node 1: 工单/请示报告 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-blue-400 transition">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. 维修工单 / 请示报告</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                    {currentChain.workOrder.typeLabel}
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  {currentChain.workOrder.fullCode}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
                  <span>纸质公文: {currentChain.workOrder.paperDocNo}</span>
                  <button
                    onClick={() => handleCopy(currentChain.workOrder.fullCode, 'wo')}
                    className="text-blue-600 hover:text-blue-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedKey === 'wo' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>复制</span>
                  </button>
                </div>
              </div>

              {/* Node 2: 设备项目台账 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-400 transition">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>2. 设备项目总台账</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                    台账主键
                  </span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>ID: {currentChain.projectLedger.id}</span>
                  <span className="text-xs text-slate-400 font-normal">({currentChain.projectLedger.fullCode})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
                  <span>台账序列: 第 {currentChain.sequenceNumber} 项</span>
                  <button
                    onClick={() => handleCopy(currentChain.projectLedger.id, 'prj')}
                    className="text-emerald-600 hover:text-emerald-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedKey === 'prj' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>复制</span>
                  </button>
                </div>
              </div>

              {/* Node 3: 费用预批单 */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-red-400 transition">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-red-600" />
                    <span>3. 费用预批单 (发票后)</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-50 text-red-700 border border-red-200">
                    一式两联
                  </span>
                </div>
                <div className="font-mono font-bold text-red-950 text-sm flex items-center gap-2">
                  <span>编号：{currentChain.preApproval.docNo}</span>
                  <span className="text-xs text-slate-400 font-normal">({currentChain.preApproval.standardVoucherNo})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">
                  <span>正本联 + 存根联红头</span>
                  <button
                    onClick={() => handleCopy(currentChain.preApproval.docNo, 'yp')}
                    className="text-red-600 hover:text-red-800 text-[10px] flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedKey === 'yp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>复制</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 全流程编码钩稽规范矩阵表格 */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              <span>五莲县人民医院 医学装备全生命周期单据编码规则表</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">业务环节与单据</th>
                    <th className="py-2.5 px-3 font-mono">标准全码格式</th>
                    <th className="py-2.5 px-3">纸质单印制 / 简短显示</th>
                    <th className="py-2.5 px-3">业务说明与钩稽责任</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {HOSPITAL_CODING_RULES_SPEC.map((spec, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {spec.step}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-700 font-medium">
                        {spec.example}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-mono font-bold">
                        {spec.paperFormat}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] leading-relaxed">
                        {spec.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>系统已全面支持按工单号、项目ID、预批单号多向模糊穿透检索</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            我已知晓并遵循
          </button>
        </div>
      </div>
    </div>
  );
};
