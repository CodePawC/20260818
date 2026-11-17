import React, { useState } from 'react';
import { X, Calendar, User, FileText, CheckCircle2, Clock, ShieldCheck, Hash } from 'lucide-react';
import { RegulatoryPlatform, PlatformAccessLog } from '../../types/regulatoryPlatformTypes';

interface NewPlatformLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: RegulatoryPlatform[];
  defaultPlatformId?: number;
  onSaveLog: (log: PlatformAccessLog) => void;
}

export const NewPlatformLogModal: React.FC<NewPlatformLogModalProps> = ({
  isOpen,
  onClose,
  platforms,
  defaultPlatformId,
  onSaveLog
}) => {
  const [platformId, setPlatformId] = useState<number>(defaultPlatformId || (platforms[0]?.id || 1));
  const [operator, setOperator] = useState<string>('崔伟');
  const [department, setDepartment] = useState<string>('医学工程科');
  const [actionType, setActionType] = useState<PlatformAccessLog['actionType']>('例行申报');
  const [businessSummary, setBusinessSummary] = useState<string>('');
  const [resultReceiptNo, setResultReceiptNo] = useState<string>('');
  const [status, setStatus] = useState<PlatformAccessLog['status']>('办理完成');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessSummary.trim()) {
      alert('请填写本次登录经办的业务内容');
      return;
    }

    const selectedPlat = platforms.find(p => p.id === Number(platformId));
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const accessTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const logId = `LOG-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLog: PlatformAccessLog = {
      id: logId,
      platformId: Number(platformId),
      platformName: selectedPlat?.platformName || '监管平台',
      accessTime,
      operator: operator.trim() || '经办人',
      department: department.trim() || '医学工程科',
      actionType,
      businessSummary: businessSummary.trim(),
      resultReceiptNo: resultReceiptNo.trim() || undefined,
      status,
      nextFollowUpDate: nextFollowUpDate || undefined,
      remarks: remarks.trim() || undefined
    };

    onSaveLog(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Clock className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">登记国家/省市监管平台登录与经办记录</h3>
              <p className="text-xs text-blue-200 mt-0.5">记录每次登录监管系统办理的具体事项、回执单号及后续随访节点</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-700">
          {/* Target Platform */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>登录的监管平台 <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {platforms.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.id}] {p.platformName} ({p.managingAuthority || p.superiorMinistry})
                </option>
              ))}
            </select>
          </div>

          {/* Row: Operator & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-slate-400" />
                <span>经办人 <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="例如：崔伟"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">经办科室</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="例如：医学工程科 / 放射科"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row: Action Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">经办业务类型</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as PlatformAccessLog['actionType'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="例行申报">例行申报</option>
                <option value="定期自查">定期自查</option>
                <option value="年度校验">年度校验</option>
                <option value="许可延续">许可延续</option>
                <option value="不良事件上报">不良事件上报</option>
                <option value="报检预约">报检预约</option>
                <option value="账号密码更新">账号密码更新</option>
                <option value="其他经办">其他经办</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">办理结果状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlatformAccessLog['status'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="办理完成">办理完成（系统已受理并办结）</option>
                <option value="审核中">审核中（正等待监管机构审批）</option>
                <option value="需补充纸质材料">需补充纸质材料（如窗口邮寄）</option>
                <option value="待进一步处理">待进一步处理（需跟进整改）</option>
              </select>
            </div>
          </div>

          {/* Business Summary */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>本次登录办理具体事项 <span className="text-rose-500">*</span></span>
            </label>
            <textarea
              rows={3}
              value={businessSummary}
              onChange={(e) => setBusinessSummary(e.target.value)}
              placeholder="详细描述本次进入平台所做的工作，如：上报10月份CT/MRI大型设备使用机时数据；提交安全阀检验申请并生成二维条码；提交辐射安全许可证延续申请等..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* Row: Receipt No & Next follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1 flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-slate-400" />
                <span>申报回执号 / 受理单号</span>
              </label>
              <input
                type="text"
                value={resultReceiptNo}
                onChange={(e) => setResultReceiptNo(e.target.value)}
                placeholder="例如：MDR-SUB-20261108-8831"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>下一次需登录/随访提醒日期</span>
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">补充备忘 / 纸质邮寄窗口等信息</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="例如：材料已顺丰寄送至政务大厅C10窗口；单号SF1928374..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>保存记录</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
