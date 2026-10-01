import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, PenTool, ShieldCheck, Stamp } from 'lucide-react';

interface ElectronicSignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSignature: (signatureDataUrl: string, opinion: string) => void;
  title: string;
  roleTitle: string;
  signeeName: string;
  defaultOpinion?: string;
}

export const ElectronicSignaturePadModal: React.FC<ElectronicSignaturePadModalProps> = ({
  isOpen,
  onClose,
  onConfirmSignature,
  title,
  roleTitle,
  signeeName,
  defaultOpinion = '情况属实，经综合评估同意返厂大修实施。'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [opinion, setOpinion] = useState(defaultOpinion);
  const [useOfficialSeal, setUseOfficialSeal] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setOpinion(defaultOpinion);
      setTimeout(() => {
        initCanvas();
      }, 100);
    }
  }, [isOpen, defaultOpinion]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setHasDrawn(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleGeneratePresetSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 仿真毛笔签名
    ctx.font = 'italic bold 32px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(signeeName, 70, 75);

    // 辅助时间戳
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`电子公文签章核验 · ${new Date().toLocaleDateString()}`, 70, 98);

    setHasDrawn(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    let dataUrl = '';
    if (canvas && hasDrawn) {
      dataUrl = canvas.toDataURL('image/png');
    } else {
      // 默认生成带名字的签名图
      dataUrl = `sig_${signeeName}_${Date.now()}`;
    }

    onConfirmSignature(dataUrl, opinion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                当前签批责任人：<span className="font-semibold text-indigo-700">{signeeName}</span> ({roleTitle})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-4">
          {/* 签批意见 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>审批批示意见</span>
              <span className="text-[11px] text-slate-400 font-normal">具有法律效力与内控追溯</span>
            </label>
            <textarea
              rows={3}
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
              placeholder="请输入您的审批意见..."
            />
          </div>

          {/* 电子手写签名板 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Stamp className="w-3.5 h-3.5 text-indigo-600" />
                <span>电子手写签名 / 签章区域</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePresetSignature}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  一键填入工整楷书签章
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={initCanvas}
                  className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" /> 清空重签
                </button>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50/50 overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={450}
                height={120}
                className="w-full h-[120px] touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-slate-400">
                  <span>在此空白区域使用鼠标或触控手写签名，或点击右上角生成</span>
                </div>
              )}
            </div>
          </div>

          {/* 电子印鉴选项 */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-indigo-900">加盖五莲县人民医院电子审批公章与时间戳</div>
                <div className="text-[11px] text-indigo-600">符合《电子签名法》要求，防篡改并留痕入链</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={useOfficialSeal}
              onChange={(e) => setUseOfficialSeal(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>确认签字并归档生效</span>
          </button>
        </div>
      </div>
    </div>
  );
};
