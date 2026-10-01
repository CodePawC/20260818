import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Camera, ExternalLink, ShieldCheck, MapPin, ArrowRightLeft, Maximize2, Smartphone } from 'lucide-react';
import { MedicalEquipment } from '../types';

interface ImagePreviewModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  photoUrl: string;
  isLoaned?: boolean;
  borrowDept?: string;
  onClose: () => void;
  onOpenEditPhoto?: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  equipment,
  photoUrl,
  isLoaned,
  borrowDept,
  onClose,
  onOpenEditPhoto,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectFitMode, setAspectFitMode] = useState<'auto' | 'phone_portrait' | 'phone_landscape'>('auto');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !equipment) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden text-slate-100 relative max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 font-mono text-xs font-bold border border-teal-500/30 shrink-0">
              {equipment.id}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>{equipment.name}</span>
                {equipment.model && (
                  <span className="text-xs text-slate-400 font-normal font-mono">({equipment.model})</span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {equipment.manufacturer || '原厂设备'} {equipment.sn ? `· SN: ${equipment.sn}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 手机拍摄比例标准切换 (3:4 竖拍 / 4:3 横拍 / 自动适配) */}
            <div className="hidden md:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 mr-1 text-[11px]">
              <button
                type="button"
                onClick={() => setAspectFitMode('auto')}
                className={`px-2 py-1 rounded transition font-medium cursor-pointer ${
                  aspectFitMode === 'auto' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="自然尺寸完整呈现"
              >
                自然尺寸
              </button>
              <button
                type="button"
                onClick={() => setAspectFitMode('phone_portrait')}
                className={`px-2 py-1 rounded transition font-medium cursor-pointer flex items-center gap-1 ${
                  aspectFitMode === 'phone_portrait' ? 'bg-slate-700 text-teal-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="标准手机竖拍比例 (3:4)"
              >
                <Smartphone className="w-3 h-3" />
                <span>3:4 竖拍</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectFitMode('phone_landscape')}
                className={`px-2 py-1 rounded transition font-medium cursor-pointer ${
                  aspectFitMode === 'phone_landscape' ? 'bg-slate-700 text-teal-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="标准手机横拍比例 (4:3)"
              >
                4:3 横拍
              </button>
            </div>

            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
              <button
                type="button"
                onClick={handleZoomOut}
                title="缩小 (-)"
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="重置缩放"
                className="px-2 py-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs font-mono font-medium"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                title="放大 (+)"
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleRotate}
              title="顺时针旋转 90°"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {onOpenEditPhoto && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditPhoto();
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer ml-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">更换照片</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer ml-1"
              title="关闭 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Image Canvas with Harmonious Viewport Proportions */}
        <div className="flex-1 min-h-[380px] sm:min-h-[460px] max-h-[66vh] bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,0.6)_0%,rgba(2,6,23,0.95)_100%)] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative group">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Photo Frame */}
          <div 
            className={`transition-all duration-200 ease-out flex items-center justify-center max-w-full max-h-full ${
              aspectFitMode === 'phone_portrait' ? 'aspect-[3/4] h-[58vh] max-w-[72vw]' :
              aspectFitMode === 'phone_landscape' ? 'aspect-[4/3] max-h-[58vh] max-w-[85vw]' :
              ''
            }`}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={photoUrl}
              alt={equipment.name}
              className="max-w-full max-h-[58vh] sm:max-h-[60vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/15 drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
            />
          </div>

          {/* Photo Overlays: status and location tags */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
            {isLoaned ? (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/95 backdrop-blur-md text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-lg border border-amber-400">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>借调在用: {borrowDept || '急救临床科室'}</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/95 backdrop-blur-md text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-lg border border-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-950 animate-pulse" />
                <span>正常在册 · 现货可借调</span>
              </div>
            )}

            <div className="px-2.5 py-1 rounded-md bg-slate-900/85 backdrop-blur-md text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700/80 shadow-md">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>{equipment.location || `${equipment.building || '1号楼'} ${equipment.floor ? equipment.floor + 'F' : ''}`}</span>
            </div>
          </div>

          {equipment.calibration && equipment.nextCalibrationDate && (
            <div className="absolute bottom-4 right-4 pointer-events-none z-10">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>计量检定有效至: {equipment.nextCalibrationDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Details Footer */}
        <div className="px-5 py-3 bg-slate-900/95 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500">设备类别:</span> <span className="text-slate-200 font-medium">{equipment.category || '医疗专用设备'}</span>
            </div>
            <div>
              <span className="text-slate-500">产权归属:</span> <span className="text-teal-400 font-medium">{equipment.ownerDepartment || equipment.department}</span>
            </div>
            <div>
              <span className="text-slate-500">技术状态:</span> <span className="text-emerald-400 font-medium">通电自检通过 · 功能完好</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>查看原始大图</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

