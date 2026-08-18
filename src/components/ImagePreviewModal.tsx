import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Camera, Download, ExternalLink, ShieldCheck, MapPin, Building2, BatteryCharging, CheckCircle2, ArrowRightLeft } from 'lucide-react';
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

  if (!isOpen || !equipment) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
              {equipment.id}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
                <span>{equipment.name}</span>
                <span className="text-xs text-slate-400 font-normal font-mono">({equipment.model})</span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {equipment.manufacturer} · SN: {equipment.sn}
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleZoomIn}
              title="放大 (+)"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title="缩小 (-)"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              title="旋转 90°"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-xs"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="重置缩放"
              className="px-2 py-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-[11px]"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            {onOpenEditPhoto && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditPhoto();
                }}
                className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 transition shadow-xs cursor-pointer ml-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>更换实物照</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Image Canvas */}
        <div className="flex-1 min-h-[320px] max-h-[60vh] bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
          <div 
            className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
            }}
          >
            <img
              src={photoUrl}
              alt={equipment.name}
              className="max-w-full max-h-[55vh] object-contain rounded-lg shadow-2xl border border-slate-800"
            />
          </div>

          {/* Photo Overlays: status and metadata tags */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
            {isLoaned ? (
              <div className="px-2.5 py-1 rounded-md bg-amber-500/90 backdrop-blur-md text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>借调在用: {borrowDept || '急救临床科室'}</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-md bg-emerald-500/90 backdrop-blur-md text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-900 animate-pulse" />
                <span>应急库房待命 (现货可调拨)</span>
              </div>
            )}

            <div className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>{equipment.location || '1号楼1F 医工应急周转库'}</span>
            </div>
          </div>

          {equipment.calibration && equipment.nextCalibrationDate && (
            <div className="absolute bottom-4 right-4 pointer-events-none">
              <div className="px-2.5 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>强检绿标有效至: {equipment.nextCalibrationDate}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Details Footer */}
        <div className="px-4 py-3 bg-slate-900/95 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div>
              <span className="text-slate-500">设备类别:</span> <span className="text-slate-200 font-medium">{equipment.category}</span>
            </div>
            <div>
              <span className="text-slate-500">责任工程师:</span> <span className="text-slate-200 font-medium">{equipment.manager || '李强 (应急库管员)'}</span>
            </div>
            <div>
              <span className="text-slate-500">出库自检:</span> <span className="text-emerald-400 font-medium">通电自检通过 / 电池满电</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>查看原始大图</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
