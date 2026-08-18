import React, { useRef } from 'react';
import { X, Printer, QrCode, Building, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { MedicalEquipment } from '../types';

interface QrLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: MedicalEquipment[];
}

export const QrLabelModal: React.FC<QrLabelModalProps> = ({
  isOpen,
  onClose,
  equipmentList
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || equipmentList.length === 0) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>医疗设备资产标签贴 - 打印</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: sans-serif; }
              .no-print { display: none !important; }
              .page-break { page-break-after: always; }
            }
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #1e293b; }
            .label-card {
              border: 2px solid #0f172a;
              border-radius: 8px;
              padding: 12px;
              width: 320px;
              margin: 10px;
              display: inline-block;
              box-sizing: border-box;
              background: #ffffff;
            }
            .label-header {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 6px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .hospital-title {
              font-size: 13px;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .tag-type {
              font-size: 9px;
              font-weight: 700;
              background: #0f172a;
              color: #fff;
              padding: 2px 5px;
              border-radius: 3px;
            }
            .label-body {
              display: flex;
              gap: 10px;
              align-items: center;
            }
            .qr-placeholder {
              width: 76px;
              height: 76px;
              border: 1.5px solid #0f172a;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              border-radius: 4px;
            }
            .qr-code-img {
              width: 68px;
              height: 68px;
            }
            .info-grid {
              flex: 1;
              font-size: 11px;
              line-height: 1.4;
            }
            .info-row {
              display: flex;
              margin-bottom: 2px;
            }
            .info-label {
              font-weight: 700;
              color: #475569;
              width: 62px;
              shrink: 0;
            }
            .info-value {
              font-weight: 600;
              color: #0f172a;
              word-break: break-all;
            }
            .label-footer {
              margin-top: 8px;
              padding-top: 4px;
              border-top: 1px dashed #cbd5e1;
              font-size: 9px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div style="display: flex; flex-wrap: wrap; justify-content: flex-start;">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                医疗设备资产二维码二维码标签 (共 {equipmentList.length} 张)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                标准的院级三联医疗设备固定资产标识贴，包含资产编号、归属科室、出厂SN及扫描校验二维码
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action toolbar */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold">
              规格: 80mm x 50mm
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">双码对齐（编号二维码 + 国标SN）</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>调用系统打印机制卡贴</span>
            </button>
          </div>
        </div>

        {/* Labels Preview Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div ref={printRef} className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
            {equipmentList.map((eq) => {
              // Generate mock QR code SVG url
              const qrText = encodeURIComponent(`ID:${eq.id}|SN:${eq.sn}|DEPT:${eq.department}`);
              const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrText}`;

              return (
                <div
                  key={eq.id}
                  className="bg-white border-2 border-slate-900 rounded-lg p-3.5 w-full max-w-[340px] shadow-sm flex flex-col justify-between hover:border-blue-600 transition"
                >
                  {/* Label Header */}
                  <div className="border-b-2 border-slate-900 pb-2 mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-800 shrink-0" />
                      <span className="font-extrabold text-xs tracking-tight text-slate-900">三甲综合医院 • 资产装备处</span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                      医疗设备标识卡
                    </span>
                  </div>

                  {/* Label Body */}
                  <div className="flex gap-3 items-center">
                    {/* QR code */}
                    <div className="shrink-0 flex flex-col items-center justify-center p-1 bg-slate-50 border border-slate-300 rounded text-center">
                      <img
                        src={qrSvgUrl}
                        alt="QR Code"
                        className="w-16 h-16 object-contain"
                        loading="lazy"
                      />
                      <span className="text-[9px] font-mono font-bold text-slate-700 mt-1">扫码报修/查验</span>
                    </div>

                    {/* Field Specs */}
                    <div className="flex-1 min-w-0 text-[11px] leading-tight space-y-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-500 shrink-0">设备名称:</span>
                        <span className="font-bold text-slate-900 truncate" title={eq.name}>{eq.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-500 shrink-0">资产编号:</span>
                        <span className="font-mono font-extrabold text-blue-700">{eq.id}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-500 shrink-0">规格型号:</span>
                        <span className="font-mono text-slate-800 truncate">{eq.model || '-'}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-500 shrink-0">使用科室:</span>
                        <span className="font-bold text-slate-800 truncate">{eq.department}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-500 shrink-0">出厂编号:</span>
                        <span className="font-mono text-slate-700 truncate">{eq.sn || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Label Footer */}
                  <div className="mt-2.5 pt-1.5 border-t border-dashed border-slate-300 text-[9px] text-slate-500 flex items-center justify-between">
                    <span>启用日期: {eq.enableDate || '-'}</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      计量校准: {eq.calibration === 'Yes' ? '已校准(有效)' : '常规校准'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>已生成 {equipmentList.length} 张合规标签贴，适用于斑马(Zebra)及热敏标签打印机</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
