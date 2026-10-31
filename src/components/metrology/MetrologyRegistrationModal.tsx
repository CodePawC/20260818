import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Scale, 
  Building, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  DollarSign, 
  AlertTriangle 
} from 'lucide-react';
import { MedicalEquipment } from '../../types';
import { getEquipmentCalibrationInfo } from '../../utils/calibrationUtils';

interface MetrologyRegistrationModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  onClose: () => void;
  onSubmit: (equipmentId: string, calibrationData: {
    certificateNo: string;
    agency: string;
    lastDate: string;
    nextDate: string;
    conclusion: '合格' | '准用' | '不合格';
    fee: number;
    inspector: string;
    notes: string;
  }) => void;
}

const COMMON_AGENCIES = [
  '山东省计量科学研究院',
  '日照市检验检测中心 (法定计量所)',
  '五莲县综合检验检测中心 (计量股)',
  '中国计量科学研究院',
  '山东省医疗器械和药品包装检验研究院',
  '通标标准技术服务有限公司 (SGS医疗校准部)',
  '广州广电计量检测股份有限公司 (济南分公司)'
];

export const MetrologyRegistrationModal: React.FC<MetrologyRegistrationModalProps> = ({
  isOpen,
  equipment,
  onClose,
  onSubmit
}) => {
  const calInfo = equipment ? getEquipmentCalibrationInfo(equipment) : { isMandatory: false, agency: '' };
  const isMandatory = calInfo.isMandatory;

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  const defaultCertNo = equipment?.calibrationCertificateNo || `SDJL-${isMandatory ? 'QJ' : 'JZ'}-${new Date().getFullYear()}-${equipment ? equipment.id.slice(-4) : '0000'}`;

  const [certificateNo, setCertificateNo] = useState(defaultCertNo);
  const [agency, setAgency] = useState(equipment?.calibrationUnit || calInfo.agency || COMMON_AGENCIES[0]);
  const [lastDate, setLastDate] = useState(todayStr);
  const [nextDate, setNextDate] = useState(nextYearStr);
  const [periodMonths, setPeriodMonths] = useState(12);
  const [conclusion, setConclusion] = useState<'合格' | '准用' | '不合格'>('合格');
  const [fee, setFee] = useState(isMandatory ? 0 : 350);
  const [inspector, setInspector] = useState('张立峰');
  const [notes, setNotes] = useState('经计量标准器现场检定，示值误差、抗电强度与漏电流符合规程技术指标。');

  const handlePeriodChange = (months: number) => {
    setPeriodMonths(months);
    const start = new Date(lastDate || todayStr);
    start.setMonth(start.getMonth() + months);
    setNextDate(start.toISOString().split('T')[0]);
  };

  const handleLastDateChange = (val: string) => {
    setLastDate(val);
    const start = new Date(val);
    if (!isNaN(start.getTime())) {
      start.setMonth(start.getMonth() + periodMonths);
      setNextDate(start.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateNo.trim()) return;

    onSubmit(equipment.id, {
      certificateNo: certificateNo.trim(),
      agency,
      lastDate,
      nextDate,
      conclusion,
      fee: Number(fee) || 0,
      inspector: inspector.trim(),
      notes: notes.trim()
    });
    onClose();
  };

  if (!isOpen || !equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">登记计量检定 / 校准检验结果</h3>
              <p className="text-[11px] text-slate-300">
                更新设备法定溯源证书档案与下周期到期倒计时
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Target Equipment Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">{equipment.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isMandatory 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-sky-50 text-sky-700 border-sky-300'
              }`}>
                {isMandatory ? '国家法定强检 · 免费' : '自费定期校准'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              编号: {equipment.assetNo || equipment.id} ｜ SN: {equipment.sn || '-'} ｜ 科室: {equipment.department}
            </div>
          </div>

          {/* Certificate No & Agency */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">检定/校准证书编号 *</label>
            <input
              type="text"
              required
              value={certificateNo}
              onChange={(e) => setCertificateNo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500"
              placeholder="如：SDJL-QJ-2025-0812"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">法定检定 / 校准机构</label>
            <select
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {COMMON_AGENCIES.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Period & Dates */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">检定周期</label>
              <select
                value={periodMonths}
                onChange={(e) => handlePeriodChange(Number(e.target.value))}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value={6}>6 个月 (重点监护)</option>
                <option value={12}>12 个月 (标准年度)</option>
                <option value={24}>24 个月 (低频辅助)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">本次检定日期 *</label>
              <input
                type="date"
                required
                value={lastDate}
                onChange={(e) => handleLastDateChange(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block text-indigo-700">下次到期日期 *</label>
              <input
                type="date"
                required
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full px-2 py-2 bg-indigo-50/60 border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-900"
              />
            </div>
          </div>

          {/* Conclusion & Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">检定结论 *</label>
              <div className="flex gap-1.5">
                {(['合格', '准用', '不合格'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConclusion(c)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      conclusion === c
                        ? c === '合格'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : c === '准用'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">
                {isMandatory ? '法定强检收费 (免征政策)' : '实际检定费用 (元)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  disabled={isMandatory}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg text-xs font-mono font-bold ${
                    isMandatory 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 cursor-not-allowed' 
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                />
                {isMandatory && (
                  <span className="absolute right-2 top-2 text-[10px] text-emerald-700 font-bold">
                    财税〔2017〕20号免征
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Inspector & Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">检定员姓名 / 工号</label>
            <input
              type="text"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              placeholder="张立峰 (高级计量检定员)"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">校准检测参数与附注</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              placeholder="填写关键技术参数与现场检定记录..."
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>保存检定结果并更新台账</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
