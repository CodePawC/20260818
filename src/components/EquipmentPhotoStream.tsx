import React, { useState } from 'react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { getEquipmentHealthScore } from '../utils/equipmentUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import {
  Eye,
  Wrench,
  Sparkles,
  QrCode,
  Camera,
  Maximize2,
  Building2,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface EquipmentPhotoStreamProps {
  equipmentList: MedicalEquipment[];
  selectedIds: string[];
  currentPage?: number;
  pageSize?: number;
  onToggleSelectRow: (id: string) => void;
  onViewDetails: (item: MedicalEquipment, initialTab?: 'basic' | 'timeline' | 'roi' | 'repairs' | 'cost_analysis' | 'logs' | 'loans' | 'acceptance') => void;
  onAddRepairForDevice: (item: MedicalEquipment) => void;
  onChangeStatusForDevice: (item: MedicalEquipment) => void;
  onAiDiagnoseDevice: (item: MedicalEquipment) => void;
  onPrintQrLabel?: (item: MedicalEquipment) => void;
  onHealthScoreClick?: (item: MedicalEquipment) => void;
}

export const EquipmentPhotoStream: React.FC<EquipmentPhotoStreamProps> = ({
  equipmentList,
  selectedIds,
  currentPage = 1,
  pageSize = 20,
  onToggleSelectRow,
  onViewDetails,
  onAddRepairForDevice,
  onChangeStatusForDevice,
  onAiDiagnoseDevice,
  onPrintQrLabel,
  onHealthScoreClick,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<MedicalEquipment | null>(null);
  const [uploadDevice, setUploadDevice] = useState<MedicalEquipment | null>(null);

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case '正常运行':
        return (
          <span className="px-2 py-0.5 bg-emerald-900/80 backdrop-blur-xs text-emerald-200 border border-emerald-400/50 rounded-md text-[10px] font-bold shadow-xs">
            正常运行
          </span>
        );
      case '维护保养中':
        return (
          <span className="px-2 py-0.5 bg-amber-900/80 backdrop-blur-xs text-amber-200 border border-amber-400/50 rounded-md text-[10px] font-bold shadow-xs">
            维保中
          </span>
        );
      case '故障待修':
        return (
          <span className="px-2 py-0.5 bg-rose-900/90 backdrop-blur-xs text-rose-200 border border-rose-400/60 rounded-md text-[10px] font-bold animate-pulse shadow-xs">
            故障待修
          </span>
        );
      case '停用/报废':
        return (
          <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-slate-300 border border-slate-500/50 rounded-md text-[10px] font-bold shadow-xs">
            已停用
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-800/80 backdrop-blur-xs text-slate-200 rounded-md text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  if (equipmentList.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 my-auto">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-base font-semibold text-slate-700">未找到符合条件的设备记录</p>
        <p className="text-xs text-slate-400 mt-1">请尝试修改关键字、科室或运行状态筛选条件</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-slate-100/70 overflow-y-auto flex-1">
      {/* 顶部引导提示条 */}
      <div className="mb-3 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span className="font-semibold text-slate-800">设备实物照片流模式</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">
            聚焦临床现场外观、铭牌标识与实物影像核查。悬停照片可快速放大或更新照片。
          </span>
        </div>
        <span className="text-2xs font-mono font-bold text-slate-500">
          共 {equipmentList.length} 台设备
        </span>
      </div>

      {/* 照片画廊网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5">
        {equipmentList.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const photoUrl = getEquipmentPhoto(item);
          const health = getEquipmentHealthScore(item);
          const rowIndex = (currentPage - 1) * pageSize + index + 1;

          return (
            <div
              key={item.id}
              onClick={() => onViewDetails(item)}
              className={`bg-white rounded-xl border overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group relative ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-400/50 bg-blue-50/20'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* 照片主视觉区 (4:3 高清比例) */}
              <div className="relative aspect-4/3 bg-slate-900 overflow-hidden select-none">
                <img
                  src={photoUrl}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* 遮罩渐变：保证文字和图标无论底图颜色都极致清晰 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

                {/* 照片顶部浮动操作：勾选框 + 序号 + 运行状态 */}
                <div
                  className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-white/20">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectRow(item.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      title={isSelected ? '取消勾选' : '勾选本台设备'}
                    />
                    <span className="text-[10px] font-mono font-bold text-white/90">
                      #{rowIndex}
                    </span>
                  </div>

                  {renderStatusBadge(item.status)}
                </div>

                {/* 照片底部浮层：科室与安装场所 */}
                <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1 z-10">
                  <div className="min-w-0 pr-1 text-white">
                    <div className="text-[11px] font-bold flex items-center gap-1 drop-shadow-md truncate">
                      <Building2 className="w-3 h-3 text-cyan-300 shrink-0" />
                      <span className="truncate">{item.department}</span>
                    </div>
                    {(item.usageLocation || item.location) && (
                      <div className="text-[9.5px] text-white/80 flex items-center gap-0.5 drop-shadow-md truncate mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-white/70 shrink-0" />
                        <span className="truncate">{item.usageLocation || item.location}</span>
                      </div>
                    )}
                  </div>

                  {/* 快捷查看大图与换图按钮 */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewDevice(item)}
                      className="p-1 rounded-md bg-white/90 hover:bg-white text-slate-800 transition cursor-pointer shadow-xs"
                      title="放大全屏预览实物照片"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadDevice(item)}
                      className="p-1 rounded-md bg-white/90 hover:bg-white text-slate-800 transition cursor-pointer shadow-xs"
                      title="上传或更换现场实拍照片"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 照片卡片信息底座 */}
              <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4
                    className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                    title={item.name}
                  >
                    {item.name}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-0.5">
                    <span className="truncate" title={item.model}>
                      {item.model || '标准型号'}
                    </span>
                    {item.internalNo && (
                      <span className="px-1 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        {item.internalNo}
                      </span>
                    )}
                  </div>

                  {/* 出厂编号与资产ID */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1 pt-1 border-t border-slate-100">
                    <span className="truncate" title={`SN: ${item.sn || '-'}`}>
                      SN: {item.sn ? item.sn.slice(0, 14) : '-'}
                    </span>
                    {item.sn && (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(item.sn, `sn-stream-${item.id}`, e)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                        title="复制SN号"
                      >
                        {copiedId === `sn-stream-${item.id}` ? (
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* 底部操作与AI健康分 */}
                <div
                  className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onHealthScoreClick) onHealthScoreClick(item);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-0.5 transition cursor-pointer hover:scale-105 ${health.badgeBg}`}
                    title={`AI健康评估: ${health.score}分 (${health.label})`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-600 shrink-0" />
                    <span>{health.score}分</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onAddRepairForDevice(item)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded transition cursor-pointer"
                      title="发起报修"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                    </button>

                    {onPrintQrLabel && (
                      <button
                        type="button"
                        onClick={() => onPrintQrLabel(item)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded transition cursor-pointer"
                        title="打印二维码标签"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onViewDetails(item)}
                      className="p-1 hover:bg-blue-50 text-blue-600 rounded transition cursor-pointer"
                      title="查看全生命周期档案"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图片全屏大图预览弹窗 */}
      <ImagePreviewModal
        isOpen={!!previewDevice}
        equipment={previewDevice}
        photoUrl={previewDevice ? getEquipmentPhoto(previewDevice) : ''}
        onClose={() => setPreviewDevice(null)}
        onOpenEditPhoto={() => {
          const dev = previewDevice;
          setPreviewDevice(null);
          setUploadDevice(dev);
        }}
      />

      {/* 图片上传/更换弹窗 */}
      <PhotoUploadModal
        isOpen={!!uploadDevice}
        equipment={uploadDevice}
        currentPhotoUrl={uploadDevice ? getEquipmentPhoto(uploadDevice) : ''}
        onClose={() => setUploadDevice(null)}
        onPhotoUpdated={() => {
          setUploadDevice(null);
        }}
      />
    </div>
  );
};
