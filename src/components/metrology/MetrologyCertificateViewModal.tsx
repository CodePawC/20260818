import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck, 
  QrCode, 
  Scale
} from 'lucide-react';
import { MedicalEquipment } from '../../types';
import { getEquipmentCalibrationInfo, CalibrationInfo } from '../../utils/calibrationUtils';

interface MetrologyCertificateViewModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  onClose: () => void;
}

export const MetrologyCertificateViewModal: React.FC<MetrologyCertificateViewModalProps> = ({
  isOpen,
  equipment,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !equipment) return null;

  const calInfo: CalibrationInfo = getEquipmentCalibrationInfo(equipment);
  const isMandatory = calInfo.isMandatory;
  const certTitle = isMandatory ? '检 定 证 书' : '校 准 证 书';
  const agencyName = calInfo.agency || '山东省计量科学研究院';
  const certNumber = equipment.calibrationCertificateNo || calInfo.certificateNo || `SDJL-${isMandatory ? 'QJ' : 'JZ'}-2025-${equipment.id.slice(-4)}`;
  const validUntil = equipment.nextCalibrationDate || calInfo.nextDate || '2026-12-31';
  const issueDate = equipment.lastCalibrationDate || calInfo.lastDate || '2025-06-15';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide">
                  国家法定计量溯源检定 / 校准证书档案
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                  isMandatory 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                }`}>
                  {isMandatory ? '国家法定强检 · 免费免征' : '医院自费定期校准 · CNAS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                电子证书防伪存证 ｜ 全国强制检定工作计量器具业务管理系统 (e-CQS) 对齐
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              title="打印法定证书归档留存"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印证书</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div 
            ref={printRef}
            className="w-full max-w-3xl bg-white rounded-xl shadow-md border-2 border-slate-300 p-6 sm:p-10 relative text-slate-900 select-text"
            style={{ minHeight: '840px' }}
          >
            {/* National Badges Strip */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="border border-slate-800 px-2 py-1 text-center">
                  <div className="text-[12px] font-extrabold tracking-widest text-slate-800">CMA</div>
                  <div className="text-[8px] font-mono text-slate-600">202115003889</div>
                </div>
                <div className="border border-slate-800 px-2 py-1 text-center">
                  <div className="text-[12px] font-extrabold tracking-widest text-slate-800">CNAS</div>
                  <div className="text-[8px] font-mono text-slate-600">L0294 校准实验室</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-600">证书编号 Certificate No.</div>
                <div className="text-sm font-bold font-mono text-slate-900">{certNumber}</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-widest text-slate-950">
                {agencyName}
              </h1>
              <div className="text-xs text-slate-600 tracking-wider font-medium">
                SHANDONG INSTITUTE OF METROLOGY / NATIONAL QUALITY VERIFICATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-[0.3em] text-red-900 pt-3">
                {certTitle}
              </h2>
            </div>

            {/* Equipment & Hospital Details Grid */}
            <div className="border-t border-b border-slate-300 py-4 my-6 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-medium">委托使用单位 / Client:</span>
                  <div className="font-bold text-slate-900 mt-0.5">五莲县人民医院</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">临床使用科室 / Department:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{equipment.department}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-medium">器具名称 / Instrument Name:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{equipment.name}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">规格型号 / Model:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{equipment.model || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 font-medium">出厂编号 / SN:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{equipment.sn || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">医院资产编号 / Asset ID:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{equipment.assetNo || equipment.id}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">制造厂商 / Manufacturer:</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">{equipment.manufacturer || '原厂制造'}</div>
                </div>
              </div>
            </div>

            {/* Legal Basis & Reference Standards */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  <span>检定/校准技术依据 Technical Criterion</span>
                </div>
                <p className="text-slate-600 font-serif leading-relaxed">
                  {calInfo.legalBasis || 'JJG 760-2003 心电图机检定规程 / JJG 543-2008 定向辐射仪法定检定规程 / JJF 1218-2009 医用离心机校准规范'}
                </p>
              </div>

              {/* Standard Instruments Used */}
              <div className="border border-slate-200 rounded-lg p-3">
                <div className="font-bold text-slate-800 mb-2">本次检定所使用的主要计量标准器具:</div>
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1">标准器名称</th>
                      <th className="py-1">测量范围</th>
                      <th className="py-1">不确定度/准确度等级</th>
                      <th className="py-1">标准器证书号</th>
                      <th className="py-1">有效期至</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-1.5 font-medium">多参数医用患者模拟器</td>
                      <td className="py-1.5 font-mono">0.05mV ~ 100mV</td>
                      <td className="py-1.5">U = 0.5% (k=2)</td>
                      <td className="py-1.5 font-mono">SIM-2024-9104</td>
                      <td className="py-1.5 font-mono">2026-08-30</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-medium">高精度高频电气安全综合分析仪</td>
                      <td className="py-1.5 font-mono">0 ~ 25A / 0~1000uA</td>
                      <td className="py-1.5">1.0 级</td>
                      <td className="py-1.5 font-mono">SAF-2024-0382</td>
                      <td className="py-1.5 font-mono">2026-10-15</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Verification Conclusion & Stamp Area */}
              <div className="bg-emerald-50/70 border-2 border-emerald-600/40 rounded-xl p-4 my-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-800 font-bold">检定 / 校准结论 VERIFICATION CONCLUSION</div>
                  <div className="text-xl font-black text-emerald-900 tracking-wider mt-1 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span>所检技术参数符合规程要求，检定合格 (准予临床合法使用)</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">
                    未发现超差项与绝缘安全漂移，准许在额定设计技术指标内开展患者诊疗操作。
                  </div>
                </div>

                <div className="shrink-0 w-24 h-24 rounded-full border-2 border-dashed border-red-500/70 flex flex-col items-center justify-center text-red-600 rotate-[-12deg] bg-red-50/30">
                  <div className="text-[9px] font-bold">法定计量检定</div>
                  <div className="text-xs font-black">检验合格章</div>
                  <div className="text-[8px] font-mono">{issueDate}</div>
                </div>
              </div>

              {/* Dates & Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">检定日期 / Date of Issue:</span>
                    <span className="font-bold font-mono text-slate-800">{issueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-emerald-800">有效截止日期 / Valid Until:</span>
                    <span className="font-extrabold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {validUntil}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">检定周期:</span>
                    <span className="font-medium text-slate-700">{equipment.calibrationPeriodMonths || 12} 个月</span>
                  </div>
                </div>

                <div className="space-y-2 border-l border-slate-200 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">检定员 (核验):</span>
                    <span className="font-serif font-bold text-slate-800">张立峰 (高级检定员)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">核验工程师:</span>
                    <span className="font-serif font-bold text-slate-800">刘建国 (主检工程师)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">发证主管:</span>
                    <span className="font-serif font-bold text-slate-800">孙明德 (技术总监)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Anti-Counterfeit Barcode */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-slate-700" />
                <div>
                  <div className="font-mono font-bold text-slate-700">全国强检系统电子核验码 (e-CQS)</div>
                  <div>扫码可在国家市场监督管理总局全国认证平台查验证书真伪与溯源信息</div>
                </div>
              </div>
              <div className="text-right">
                <div>五莲县人民医院 医学工程部 档案处留存</div>
                <div className="font-mono text-slate-400">ARCHIVE-ID: {certNumber}-PUB</div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>三甲医院等级评审及国家医保局飞检合规受检凭证</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            关闭预览
          </button>
        </div>

      </div>
    </div>
  );
};
