import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Eye, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  Clock, 
  Building2, 
  Activity, 
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';
import { ClosedLoopRepairTask, OnsiteVerificationRecord } from '../../types/closedLoopRepairTypes';
import { AuthUser } from '../../types';

interface OnsiteVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ClosedLoopRepairTask;
  onConfirmVerification: (taskId: string, verificationData: OnsiteVerificationRecord, needFactoryRepair: boolean) => void;
  currentUser: AuthUser | null;
  onDraftFactoryRepairImmediately?: (task: ClosedLoopRepairTask) => void;
}

export const OnsiteVerificationModal: React.FC<OnsiteVerificationModalProps> = ({
  isOpen,
  onClose,
  task,
  onConfirmVerification,
  currentUser,
  onDraftFactoryRepairImmediately
}) => {
  if (!isOpen) return null;

  // 设备科工程师核验表单数据
  const [verifiedBy, setVerifiedBy] = useState(currentUser?.name || '崔伟');
  const [verifierRole, setVerifierRole] = useState('医疗设备科科长 / 主管工程师');
  const [verifierPhone, setVerifierPhone] = useState('6802 / 13806336802');
  const [verifiedAt, setVerifiedAt] = useState(
    new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-').slice(0, 16)
  );
  const [snMatched, setSnMatched] = useState(true);
  const [verifiedSn, setVerifiedSn] = useState(task.equipmentSn);
  const [locationConfirmed, setLocationConfirmed] = useState(
    task.equipmentLocation || '1号楼 综合楼 8F 麻醉手术科 OR-03手术室'
  );

  // 精密检测指标
  const [opticalTransmittance, setOpticalTransmittance] = useState(
    '41.5% (出厂基准 >= 95%，透光率严重衰减断崖，视场发暗严重起雾)'
  );
  const [airtightnessLeakage, setAirtightnessLeakage] = useState(
    '0.05MPa负压浸水检测持续测漏，蓝宝石保护窗口封胶老化开裂，负压压降 0.025MPa/min，内部腔体受潮进水'
  );
  const [lensGroupCondition, setLensGroupCondition] = useState(
    '第2组 HOPKINS 柱状光学棒镜表面出现贝壳状碎裂应力纹，光轴偏斜 3.8°'
  );
  const [testToolsUsed, setTestToolsUsed] = useState<string[]>([
    '内窥镜光学同轴度投影仪',
    '0.05MPa负压水密封测漏仪',
    '冷光源光纤光通量计',
    '显微目镜微观检查仪'
  ]);

  // 结论判定
  const [conclusionType, setConclusionType] = useState<'factory_repair' | 'inhouse_repair' | 'third_party_repair'>('factory_repair');
  const [technicalAssessment, setTechnicalAssessment] = useState(
    '经设备科工程师携带专业内窥镜检测仪现场实测：该镜蓝宝石前端封胶老化开裂进水受潮，第2组柱镜微裂。该硬镜为高精密激光烧结光学总成，院内及第三方均缺乏百级洁净无尘室、激光光轴干涉准直仪与HOPKINS原厂透镜耗材，强行拆解会导致整镜光通量彻底报废。原厂返厂更换物镜蓝宝石窗与第2组棒镜、重新注氮激光密封并提供12个月保修是唯一技术可行路径。'
  );

  const [signatureText, setSignatureText] = useState(`${verifiedBy} (已电子核验)`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const verificationRecord: OnsiteVerificationRecord = {
      verifiedBy,
      verifierRole,
      verifierPhone,
      verifiedAt,
      snMatched,
      verifiedSn,
      equipmentLocationConfirmed: locationConfirmed,
      opticalTransmittance,
      airtightnessLeakage,
      lensGroupCondition,
      testToolsUsed,
      conclusionType,
      conclusionTitle: conclusionType === 'factory_repair' 
        ? '内部柱镜碎裂进水，院内无修复条件，判定必须原厂返厂大修' 
        : '现场完成调试，转入常规维护',
      technicalAssessment,
      technicianSignature: signatureText
    };

    onConfirmVerification(task.id, verificationRecord, conclusionType === 'factory_repair');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <UserCheck className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">医学设备科 · 现场技术勘查与性能核验</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-400/20 text-blue-200 border border-blue-300/30">
                  闭环第 2 阶
                </span>
              </div>
              <p className="text-xs text-blue-100/80 mt-0.5">
                工程师入室实测设备精密参数，判定是否需要启动外协返厂大修审批流转
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Section 1: Clinical Report Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>关联报修申请与临床资产档案</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                工单号：{task.taskNo}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">设备资产名称</span>
                <span className="font-bold text-slate-800 text-sm">{task.equipmentName}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">{task.equipmentModel}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">资产编号 & SN</span>
                <span className="font-bold text-slate-800">{task.assetNo}</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">SN: {task.equipmentSn}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">报修科室 & 报修人</span>
                <span className="font-bold text-blue-700">{task.department} ({task.reporterName})</span>
                <span className="text-slate-500 block text-[11px] mt-0.5">{task.faultTime} 报修</span>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs text-rose-900">
              <div className="font-semibold flex items-center space-x-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>麻醉科陈述故障现象：【{task.faultType}】</span>
              </div>
              <p className="text-slate-600 text-[11px]">{task.faultDescription}</p>
            </div>
          </div>

          {/* Section 2: Onsite Verification Personnel & Location */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>现场勘查工程师信息与资产核对</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">核验工程师</label>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={e => setVerifiedBy(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">工程师职务</label>
                <input
                  type="text"
                  value={verifierRole}
                  onChange={e => setVerifierRole(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">联系电话</label>
                <input
                  type="text"
                  value={verifierPhone}
                  onChange={e => setVerifierPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">核验时间</label>
                <input
                  type="text"
                  value={verifiedAt}
                  onChange={e => setVerifiedAt(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-3 p-2.5 bg-blue-50/60 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="snMatch"
                  checked={snMatched}
                  onChange={e => setSnMatched(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="snMatch" className="text-xs text-slate-800 font-semibold cursor-pointer">
                  机身钢印与台账SN核对一致：<b className="text-blue-700">{verifiedSn}</b>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">现场实物核对位置</label>
                <input
                  type="text"
                  value={locationConfirmed}
                  onChange={e => setLocationConfirmed(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Precision Instrument Testing Data */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
            <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>现场仪器精密技术指标测试（实测数据）</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                1. 光学透光率与同轴度投影实测 *
              </label>
              <input
                type="text"
                value={opticalTransmittance}
                onChange={e => setOpticalTransmittance(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                2. 负压水密封测漏仪气密性测试 (0.05MPa负压浸水) *
              </label>
              <input
                type="text"
                value={airtightnessLeakage}
                onChange={e => setAirtightnessLeakage(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                3. 光学棒镜（柱状透镜）与目镜显微镜观察 *
              </label>
              <input
                type="text"
                value={lensGroupCondition}
                onChange={e => setLensGroupCondition(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-700"
                required
              />
            </div>
          </div>

          {/* Section 4: Technical Conclusion Decision */}
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              现场核验处置结论判定 *
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setConclusionType('factory_repair')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  conclusionType === 'factory_repair'
                    ? 'border-indigo-600 bg-indigo-50/90 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span>【判定需要返厂维修】(原厂大修)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                    一键流转呈批
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  精密光学元器件（蓝宝石窗/柱状棒镜）受损受潮，院内缺乏百级超净室及激光光轴重调设备，必须返厂由原厂大修。
                </p>
              </div>

              <div
                onClick={() => setConclusionType('inhouse_repair')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  conclusionType === 'inhouse_repair'
                    ? 'border-teal-600 bg-teal-50/90 shadow-sm ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>【院内可自主检修】</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-600 text-white">
                    常规处置
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  外围易损耗材密封圈老化或线缆插头松脱，院内有备件可直接更换排除故障。
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                详细工程勘查结论与技术论证报告 *
              </label>
              <textarea
                rows={3}
                value={technicalAssessment}
                onChange={e => setTechnicalAssessment(e.target.value)}
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">工程师核验签名存证：</span>
              <input
                type="text"
                value={signatureText}
                onChange={e => setSignatureText(e.target.value)}
                className="text-xs font-bold text-blue-900 bg-white border border-blue-300 rounded-lg px-3 py-1.5 w-60 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>核验完成后将锁定技术检测记录，并开放一键起草呈批通道</span>
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
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>确认录入现场核验结论</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
