import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Building2, 
  DollarSign, 
  ShieldCheck, 
  UserCheck, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Award,
  Layers,
  Clock,
  Printer
} from 'lucide-react';
import { ClosedLoopRepairTask, FactoryRepairApplicationForm } from '../../types/closedLoopRepairTypes';
import { AuthUser } from '../../types';

interface DraftReturnRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ClosedLoopRepairTask;
  onSubmitDraft: (taskId: string, application: FactoryRepairApplicationForm) => void;
  currentUser: AuthUser | null;
}

export const DraftReturnRepairModal: React.FC<DraftReturnRepairModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmitDraft,
  currentUser
}) => {
  if (!isOpen) return null;

  const nowYear = new Date().getFullYear();
  const dateNum = `${nowYear}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;
  const defaultAppId = `APP-RET-${dateNum}-${task.id.slice(-4)}`;

  const [applicationId, setApplicationId] = useState(defaultAppId);
  const [title, setTitle] = useState(
    `【${task.department}】${task.equipmentName} (${task.equipmentModel}) 外协返厂大修呈批报告`
  );
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'normal'>('critical');
  const [targetVendor, setTargetVendor] = useState('德国狼牌医疗 (Richard Wolf GmbH) 技术服务中心');
  const [vendorContact, setVendorContact] = useState('李海明 (大区售后技术服务经理)');
  const [vendorPhone, setVendorPhone] = useState('400-820-8703 / 13910878703');
  const [estimatedBudget, setEstimatedBudget] = useState(14200);
  const [originalPrice, setOriginalPrice] = useState(task.purchasePrice || 168000);
  const [warrantyMonths, setWarrantyMonths] = useState(12);

  // 核心公文论证
  const [clinicalNecessityReason, setClinicalNecessityReason] = useState(
    '输尿管镜为泌尿外科微创输尿管碎石取石手术核心生命线器械，术中视野成像要求极高。目前科室仅剩1条备用镜，无法支撑高频接台排期。原厂大修可彻底恢复4K超清视野，确保手术安全。'
  );

  const [technicalJustification, setTechnicalJustification] = useState(
    task.onsiteVerification?.technicalAssessment ||
    '经现场仪器检测：第2组柱镜微裂、蓝宝石密封胶开裂受潮，透光率剧降至41.5%。该镜为激光气密烧结精密光学件，院内及第三方均无百级洁净无尘室与激光同轴干涉校准平台，必须由德国狼牌原厂返厂大修重置光轴。'
  );

  const [clinicalRiskAnalysis, setClinicalRiskAnalysis] = useState(
    '若不及时返厂，术中光轴反光与视场盲区极易引起输尿管穿孔、假道形成及撕脱大出血等严重医疗安全事故；且若拖延不修可能导致全套光学镜组受潮彻底报废（新镜采购单价16.8万元）。'
  );

  const [draftedBy, setDraftedBy] = useState(currentUser?.name || '崔伟');
  const [draftedRole, setDraftedRole] = useState('医疗设备科科长 / 主管工程师');
  const [draftedAt, setDraftedAt] = useState(
    new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
  );

  const budgetRatio = ((estimatedBudget / (originalPrice || 168000)) * 100).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const appForm: FactoryRepairApplicationForm = {
      applicationId,
      title,
      urgency,
      targetVendor,
      vendorContact,
      vendorPhone,
      estimatedBudget,
      originalPrice,
      budgetRatioPercent: parseFloat(budgetRatio),
      warrantyMonths,
      clinicalNecessityReason,
      technicalJustification,
      clinicalRiskAnalysis,
      draftedBy,
      draftedRole,
      draftedAt,
      // 初始进入待设备科主管审核
      deptReviewStatus: 'pending',
      vpApprovalStatus: 'pending',
      finalApprovalStatus: 'pending_dept'
    };

    onSubmitDraft(task.id, appForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Red Header (Hospital Official Document Banner) */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-rose-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <FileText className="w-5 h-5 text-red-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">一键起草 · 医疗器械外协返厂大修呈批报告</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-400/20 text-red-200 border border-red-300/30">
                  闭环第 3 阶
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                已自动关联设备资产档案与设备科现场实测技术勘查，流转至设备科主管及分管院长多级审批
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Associated Equipment Asset Banner */}
          <div className="bg-red-50/60 border border-red-200/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-950 flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-red-600" />
                <span>已自动绑定的全院固定资产台账标的</span>
              </span>
              <span className="text-[11px] font-mono text-red-700 bg-white px-2 py-0.5 rounded border border-red-200 font-semibold">
                公文呈批号：{applicationId}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-red-100">
                <span className="text-slate-400 block text-[10px]">设备资产名称</span>
                <span className="font-bold text-slate-800 text-xs truncate block">{task.equipmentName}</span>
                <span className="text-slate-500 text-[10px] truncate block">{task.equipmentModel}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-red-100">
                <span className="text-slate-400 block text-[10px]">资产编号 & SN</span>
                <span className="font-bold text-slate-800">{task.assetNo}</span>
                <span className="text-slate-500 text-[10px] block">SN: {task.equipmentSn}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-red-100">
                <span className="text-slate-400 block text-[10px]">资产原值 & 维修比</span>
                <span className="font-bold text-emerald-700">¥{(task.purchasePrice || 168000).toLocaleString()}</span>
                <span className="text-red-600 text-[10px] block font-semibold">大修预算占原值 {budgetRatio}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-red-100">
                <span className="text-slate-400 block text-[10px]">产权与存放科室</span>
                <span className="font-bold text-slate-800">{task.department}</span>
                <span className="text-slate-500 text-[10px] block">{task.equipmentLocation || '8F 手术室'}</span>
              </div>
            </div>
          </div>

          {/* Document Title & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">呈批公文标题 *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">审批紧迫等级</label>
              <div className="flex space-x-2">
                {[
                  { key: 'critical', label: '特急 (今日办结)', color: 'bg-red-50 border-red-500 text-red-700' },
                  { key: 'high', label: '急件 (24小时)', color: 'bg-amber-50 border-amber-500 text-amber-700' },
                  { key: 'normal', label: '平件 (3日内)', color: 'bg-slate-50 border-slate-300 text-slate-700' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setUrgency(item.key as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all ${
                      urgency === item.key ? `${item.color} ring-1 ring-red-500/20 shadow-xs` : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor, Budget & Warranty Terms */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>返厂委托厂家、预估大修预算与质保条款</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">拟委托返厂大修服务商 *</label>
                <input
                  type="text"
                  value={targetVendor}
                  onChange={e => setTargetVendor(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">厂家对接人及联系方式</label>
                <input
                  type="text"
                  value={`${vendorContact} / ${vendorPhone}`}
                  onChange={e => setVendorContact(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">预估大修总预算 (元) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">¥</span>
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={e => setEstimatedBudget(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">大修费用占新机原值比例</label>
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-between">
                  <span>{budgetRatio}%</span>
                  <span className="text-[10px] text-emerald-600 font-normal">远低于50%报废警戒线</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">大修承诺原厂整机质保期</label>
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-800 flex items-center justify-between">
                  <span>{warrantyMonths} 个月</span>
                  <span className="text-[10px] text-blue-600 font-normal">含物镜与柱状透镜</span>
                </div>
              </div>
            </div>
          </div>

          {/* Three Key Justifications */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>1. 临床不可替代性与急迫性论证 *</span>
              </label>
              <textarea
                rows={2}
                value={clinicalNecessityReason}
                onChange={e => setClinicalNecessityReason(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>2. 设备科现场实测技术依据与返厂必要性陈述 *</span>
              </label>
              <textarea
                rows={3}
                value={technicalJustification}
                onChange={e => setTechnicalJustification(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>3. 延误大修将导致的医疗安全与经济风险分析 *</span>
              </label>
              <textarea
                rows={2}
                value={clinicalRiskAnalysis}
                onChange={e => setClinicalRiskAnalysis(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Approval Routing Flow Chart Preview */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
            <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>呈批单多级流转节点预设（内控闭环链）</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>第 1 节点 (已发起)</span>
                  <span className="text-emerald-600 font-semibold">起草就绪</span>
                </div>
                <div className="font-bold text-slate-800">{draftedBy}</div>
                <div className="text-[11px] text-slate-500">{draftedRole}</div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between text-indigo-700 text-[11px] mb-1">
                  <span>第 2 节点 (待审核)</span>
                  <span className="text-indigo-600 font-bold">设备科主管审核</span>
                </div>
                <div className="font-bold text-slate-800">崔伟 / 科长</div>
                <div className="text-[11px] text-slate-500">医学设备科技术审查与论证签字</div>
              </div>

              <div className="p-3 bg-red-50/60 rounded-lg border border-red-200">
                <div className="flex items-center justify-between text-red-700 text-[11px] mb-1">
                  <span>第 3 节点 (终审签批)</span>
                  <span className="text-red-600 font-bold">分管副院长审批</span>
                </div>
                <div className="font-bold text-slate-800">王建国 / 业务副院长</div>
                <div className="text-[11px] text-slate-500">医学装备委员会主任终审签批</div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-red-600" />
              <span>起草提交后将自动锁定单据，并在全院审批中枢生成流转待办</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>确认起草并立即流转至设备科主管审核</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
