import React, { useState } from 'react';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { AuthUser } from '../types';
import {
  X,
  CheckCircle2,
  Star,
  ShieldCheck,
  Wrench,
  Clock,
  FileCheck,
  User,
  AlertCircle
} from 'lucide-react';

interface ClinicalAcceptanceModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder | null;
  currentUser?: AuthUser;
  onClose: () => void;
  onConfirmAcceptance: (
    workOrderId: string,
    ratingData: {
      ratingScore: number;
      ratingTimeliness: number;
      ratingQuality: number;
      ratingAttitude: number;
      clinicalFeedback: string;
      acceptanceStaffName: string;
      acceptanceStaffRole: string;
      acceptanceSignature: string;
    }
  ) => void;
}

export const ClinicalAcceptanceModal: React.FC<ClinicalAcceptanceModalProps> = ({
  isOpen,
  workOrder,
  currentUser,
  onClose,
  onConfirmAcceptance
}) => {
  if (!isOpen || !workOrder) return null;

  const [ratingTimeliness, setRatingTimeliness] = useState<number>(5);
  const [ratingQuality, setRatingQuality] = useState<number>(5);
  const [ratingAttitude, setRatingAttitude] = useState<number>(5);
  const [clinicalFeedback, setClinicalFeedback] = useState<string>(
    '工程师现场排查彻底，更换配件后经试机运行平稳，电气安全自检通过，设备已恢复临床正常使用。'
  );

  const [checkAppearance, setCheckAppearance] = useState<boolean>(true);
  const [checkSelfTest, setCheckSelfTest] = useState<boolean>(true);
  const [checkClinicalTrial, setCheckClinicalTrial] = useState<boolean>(true);

  const defaultSignerName = currentUser?.name || workOrder.reporterName || '临床护士长';
  const defaultSignerRole = currentUser?.role || '科室护士长 / 责任人';
  const [signerName, setSignerName] = useState<string>(defaultSignerName);
  const [signerRole, setSignerRole] = useState<string>(defaultSignerRole);

  const avgRating = Number(
    ((ratingTimeliness + ratingQuality + ratingAttitude) / 3).toFixed(1)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAppearance || !checkSelfTest || !checkClinicalTrial) {
      alert('请完成全部临床验证核查项确认！');
      return;
    }

    const signature = `【电子签名】${signerName} · ${signerRole} (身份认证与时间戳存证: ${new Date().toLocaleString()})`;

    onConfirmAcceptance(workOrder.id, {
      ratingScore: avgRating,
      ratingTimeliness,
      ratingQuality,
      ratingAttitude,
      clinicalFeedback: clinicalFeedback.trim() || '临床验收合格，准予恢复使用。',
      acceptanceStaffName: signerName,
      acceptanceStaffRole: signerRole,
      acceptanceSignature: signature
    });
  };

  const renderStars = (
    value: number,
    onChange: (val: number) => void,
    label: string
  ) => {
    return (
      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 hover:scale-110 transition cursor-pointer text-amber-400"
            >
              <Star
                className={`w-4 h-4 ${
                  star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                }`}
              />
            </button>
          ))}
          <span className="text-xs font-bold font-mono text-amber-600 ml-1.5 w-6">
            {value}.0
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold shrink-0">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">临床科室现场验收与服务满意度评价</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white font-mono">
                  {workOrder.id}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                医学工程科抢修工单闭环凭单 · 临床试机合格签字归档
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Work Summary Ribbon */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <strong className="text-emerald-950 text-sm">{workOrder.equipmentName}</strong>
                <span className="text-emerald-800 font-mono text-2xs">SN: {workOrder.equipmentSn}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xs border border-emerald-300">
                ● 现场抢修完成 · 待临床签字
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700 text-2xs border-t border-emerald-200/60 pt-2">
              <div>
                <span className="text-slate-500">使用科室：</span>
                <span className="font-semibold">{workOrder.department}</span>
              </div>
              <div>
                <span className="text-slate-500">负责工程师：</span>
                <span className="font-semibold text-indigo-700">{workOrder.assignedEngineerName}</span>
              </div>
              <div>
                <span className="text-slate-500">停机修复耗时：</span>
                <span className="font-bold text-emerald-700 font-mono">{workOrder.totalDowntimeHours} 小时</span>
              </div>
              <div>
                <span className="text-slate-500">维修费用：</span>
                <span className="font-bold text-rose-600 font-mono">￥{workOrder.totalRepairCost.toLocaleString()}</span>
              </div>
            </div>

            {/* Repair details */}
            {workOrder.repairAction && (
              <div className="bg-white/80 p-2.5 rounded border border-emerald-100 text-slate-700 space-y-1">
                <div className="text-2xs font-bold text-emerald-900 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-emerald-600" />
                  <span>工程师采取的处置工艺与修复措施：</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-2xs">{workOrder.repairAction}</p>
                {workOrder.partsReplaced && workOrder.partsReplaced.length > 0 && (
                  <div className="text-2xs text-slate-500 pt-1">
                    更换配件：{workOrder.partsReplaced.map(p => `${p.partName} x${p.quantity}`).join('、')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clinical Verification Checklist */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>三甲评审标准 · 临床科室现场试机验证核对</span>
            </span>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200/80 cursor-pointer hover:bg-slate-50 text-slate-800">
                <input
                  type="checkbox"
                  checked={checkAppearance}
                  onChange={(e) => setCheckAppearance(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>1. 设备外观洁净完整，各功能按键、管路接头及探头导联连接牢靠无松动</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200/80 cursor-pointer hover:bg-slate-50 text-slate-800">
                <input
                  type="checkbox"
                  checked={checkSelfTest}
                  onChange={(e) => setCheckSelfTest(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>2. 现场通电开机自检通过，声光报警指示灯正常，原报错代码已彻底消除</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200/80 cursor-pointer hover:bg-slate-50 text-slate-800">
                <input
                  type="checkbox"
                  checked={checkClinicalTrial}
                  onChange={(e) => setCheckClinicalTrial(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>3. 实际模拟试运行良好，输出参数及波形符合临床规范，准予重新投入使用</span>
              </label>
            </div>
          </div>

          {/* 3-dimension 5-Star Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">临床对本次抢修服务评价打分</span>
              <span className="text-2xs text-slate-500">综合平均得分：<strong className="text-amber-600 text-sm font-mono">{avgRating}</strong> 分</span>
            </div>

            <div className="space-y-1.5">
              {renderStars(ratingTimeliness, setRatingTimeliness, '1. 派工响应与到场时效性')}
              {renderStars(ratingQuality, setRatingQuality, '2. 故障排除彻底度与修复质量')}
              {renderStars(ratingAttitude, setRatingAttitude, '3. 工程师服务沟通与规范穿戴态度')}
            </div>
          </div>

          {/* Clinical Feedback Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              临床意见与试机反馈建议
            </label>
            <textarea
              value={clinicalFeedback}
              onChange={(e) => setClinicalFeedback(e.target.value)}
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="请输入临床科室对本次设备抢修、备件质量或日常预防性维护的建议..."
            />
          </div>

          {/* Signer Info & Digital Signature */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
              验收人身份核验与电子签名存证
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs text-slate-500 mb-0.5">验收签字人</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block text-2xs text-slate-500 mb-0.5">科室角色/职务</label>
                <input
                  type="text"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="w-full p-1.5 text-xs bg-white border border-slate-200 rounded"
                />
              </div>
            </div>
            <div className="text-2xs text-slate-400 bg-white p-2 rounded border border-slate-200/60 font-mono">
              签名防伪存证：【电子存证】{signerName} · {signerRole} · 时间：{new Date().toLocaleString()}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              暂不验收
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>确认验收合格 · 设备恢复在用 (闭环归档)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
