import React, { useState } from 'react';
import { MedicalEquipment, EquipmentStatus } from '../types';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from '../utils/equipmentUtils';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { resolveMainCategory, resolveLevel1Category } from '../utils/categoryFormatter';
import { LoanCountdownBadge } from './LoanTimeProgressBar';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import {
  Eye,
  Wrench,
  RefreshCw,
  Sparkles,
  QrCode,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Calendar,
  Scale,
  ShieldCheck,
  Smartphone,
  ArrowRightLeft,
  RotateCcw,
  Camera,
  Maximize2
} from 'lucide-react';

interface EquipmentCardGridProps {
  equipmentList: MedicalEquipment[];
  selectedIds: string[];
  currentPage?: number;
  pageSize?: number;
  onToggleSelectRow: (id: string) => void;
  onViewDetails: (item: MedicalEquipment, initialTab?: 'basic' | 'timeline' | 'roi' | 'repairs' | 'cost_analysis' | 'logs' | 'loans' | 'acceptance') => void;
  onAddRepairForDevice: (item: MedicalEquipment) => void;
  onChangeStatusForDevice: (item: MedicalEquipment) => void;
  onEditDevice: (item: MedicalEquipment) => void;
  onDeleteDevice: (id: string) => void;
  onAiDiagnoseDevice: (item: MedicalEquipment) => void;
  onOpenAiDimensionModal?: (item: MedicalEquipment, initialDimension?: string) => void;
  onViewDepartmentDetails?: (departmentName: string) => void;
  onViewAgencyTransactions?: (agencyName: string, item: MedicalEquipment) => void;
  onBorrowEquipment?: (item: MedicalEquipment) => void;
  onReturnEquipment?: (item: MedicalEquipment) => void;
  onNavigateToInspection?: (item: MedicalEquipment) => void;
  onOpenOverdueFiling?: (item: MedicalEquipment) => void;
  onPrintQrLabel?: (item: MedicalEquipment) => void;
  onHealthScoreClick?: (item: MedicalEquipment) => void;
}

export const EquipmentCardGrid: React.FC<EquipmentCardGridProps> = ({
  equipmentList,
  selectedIds,
  currentPage = 1,
  pageSize = 20,
  onToggleSelectRow,
  onViewDetails,
  onAddRepairForDevice,
  onChangeStatusForDevice,
  onEditDevice,
  onDeleteDevice,
  onAiDiagnoseDevice,
  onOpenAiDimensionModal,
  onViewDepartmentDetails,
  onViewAgencyTransactions,
  onBorrowEquipment,
  onReturnEquipment,
  onNavigateToInspection,
  onOpenOverdueFiling,
  onPrintQrLabel,
  onHealthScoreClick,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<MedicalEquipment | null>(null);
  const [uploadDevice, setUploadDevice] = useState<MedicalEquipment | null>(null);

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderStatusBadge = (status: EquipmentStatus, item: MedicalEquipment) => {
    switch (status) {
      case '正常运行':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs"></span>
            正常运行
          </span>
        );
      case '维护保养中':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-xs"></span>
            维护保养中
          </span>
        );
      case '故障待修':
        return (
          <div className="inline-flex items-center gap-1 shrink-0">
            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-xs"></span>
              故障待修
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeStatusForDevice(item);
              }}
              className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold inline-flex items-center gap-0.5 shadow-2xs transition cursor-pointer"
              title="快速标记故障已排除并恢复正常运行"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>修复</span>
            </button>
          </div>
        );
      case '停用/报废':
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[11px] font-bold inline-flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            停用/报废
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold shrink-0">
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
    <div className="p-3 sm:p-4 bg-slate-50/60 overflow-y-auto flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
        {equipmentList.map((item, index) => {
          const isSelected = selectedIds.includes(item.id);
          const photoUrl = getEquipmentPhoto(item);
          const health = getEquipmentHealthScore(item);
          const validity = getEquipmentValidityInfo(item);
          const calInfo = getEquipmentCalibrationInfo(item);
          const mNode = getEquipmentMaintenanceNode(item);
          const rowIndex = (currentPage - 1) * pageSize + index + 1;
          const mainCategory = resolveMainCategory(item.category);
          const level1Category = resolveLevel1Category(item.level1Category || item.category);
          const isLoaned = item.currentLoan?.status === 'ACTIVE';

          return (
            <div
              key={item.id}
              onClick={() => onViewDetails(item)}
              className={`bg-white rounded-xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden cursor-pointer relative group ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50/20'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* 卡片顶部：勾选、编号、状态与AI健康分 */}
              <div
                className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-150 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectRow(item.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 w-3.5 h-3.5"
                    title={isSelected ? '取消选中' : '选中本设备'}
                  />
                  <span className="text-2xs font-mono font-bold text-slate-400 shrink-0">
                    #{rowIndex}
                  </span>
                  {item.internalNo ? (
                    <span className="px-1.5 py-0.2 rounded text-2xs font-bold bg-amber-50 text-amber-800 border border-amber-200 truncate" title={`临床自编号: ${item.internalNo}`}>
                      {item.internalNo}
                    </span>
                  ) : (
                    <span className="text-2xs font-mono text-slate-500 truncate" title={item.id}>
                      {item.id}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* 状态徽章 */}
                  {renderStatusBadge(item.status, item)}

                  {/* AI健康得分 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onHealthScoreClick) onHealthScoreClick(item);
                    }}
                    className={`px-1.5 py-0.5 rounded text-2xs font-bold border inline-flex items-center gap-0.5 transition cursor-pointer hover:scale-105 ${health.badgeBg}`}
                    title={`AI健康评估: ${health.score}分 (${health.label})，点击查看扣分归因`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-600 shrink-0" />
                    <span>{health.score}分</span>
                  </button>
                </div>
              </div>

              {/* 卡片主体：图片 + 核心规格 */}
              <div className="p-3.5 space-y-3 flex-1">
                {/* 顶部横排：缩略图 + 标题型号 */}
                <div className="flex items-start gap-3">
                  {/* 缩略图（带悬停大图入口与修改入口） */}
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 group/img">
                    <img
                      src={photoUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDevice(item);
                        }}
                        className="p-1 rounded bg-white/90 text-slate-800 hover:bg-white transition cursor-pointer shadow-xs"
                        title="查看实物高清大图"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadDevice(item);
                        }}
                        className="p-1 rounded bg-white/90 text-slate-800 hover:bg-white transition cursor-pointer shadow-xs"
                        title="更换/上传实物照片"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 设备名称与分类 */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1"
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                    <p className="text-2xs font-mono font-medium text-slate-600 mt-0.5 line-clamp-1" title={item.model}>
                      型号: {item.model || '未标注'}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {mainCategory.name}
                      </span>
                      {level1Category && level1Category.name !== mainCategory.name && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {level1Category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 借调流转徽章 */}
                {isLoaned && item.currentLoan && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between text-2xs">
                    <div className="flex items-center gap-1 text-amber-900 font-bold">
                      <ArrowRightLeft className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>借调在用: {item.currentLoan.borrowerDept}</span>
                    </div>
                    <LoanCountdownBadge loan={item.currentLoan} />
                  </div>
                )}

                {/* 关键信息矩阵栅格 (2列紧凑排布) */}
                <div className="grid grid-cols-2 gap-2 text-2xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-150">
                  {/* 科室与地点 */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-slate-400" />
                      使用科室
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewDepartmentDetails) onViewDepartmentDetails(item.department);
                      }}
                      className="font-bold text-slate-800 hover:text-blue-600 text-left truncate block w-full cursor-pointer"
                      title={item.department}
                    >
                      {item.department}
                    </button>
                  </div>

                  {/* 存放场所 */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      安装场所
                    </span>
                    <span className="text-slate-700 font-medium truncate block" title={item.usageLocation || item.location || '科室现场'}>
                      {item.usageLocation || item.location || (item.building ? `${item.building} ${item.floor || ''}` : '科室现场')}
                    </span>
                  </div>

                  {/* 资产编号 / SN */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-slate-400 font-medium flex items-center justify-between">
                      <span>出厂编号 (SN)</span>
                      {item.sn && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(item.sn, `sn-${item.id}`, e)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="复制SN号"
                        >
                          {copiedId === `sn-${item.id}` ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                        </button>
                      )}
                    </span>
                    <span className="font-mono text-slate-800 font-semibold truncate block" title={item.sn || '-'}>
                      {item.sn || '-'}
                    </span>
                  </div>

                  {/* 厂家 */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-slate-400 font-medium">生产厂家</span>
                    <span className="text-slate-700 font-medium truncate block" title={item.manufacturer || '-'}>
                      {item.manufacturer || '-'}
                    </span>
                  </div>

                  {/* 投用与寿命 */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      投用时间
                    </span>
                    <span className="font-mono text-slate-800 font-medium truncate block">
                      {item.enableDate || '-'}
                    </span>
                  </div>

                  {/* 计量检定 */}
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Scale className="w-2.5 h-2.5 text-slate-400" />
                      计量属性
                    </span>
                    <span className={`text-[10px] font-bold truncate block ${calInfo.badgeClass.replace('border', '')}`}>
                      {calInfo.calibrationType}
                    </span>
                  </div>
                </div>

                {/* 寿命或超期备案状态提醒 */}
                {validity.isExpired && (
                  <div className="bg-rose-50 border border-rose-200 rounded p-1.5 flex items-center justify-between text-2xs">
                    <span className="text-rose-800 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-rose-600" />
                      已超设计寿命
                    </span>
                    {item.overdueFiling?.filingStatus === 'ACTIVE' ? (
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-1 py-0.2 rounded text-[10px]">
                        准用备案中
                      </span>
                    ) : onOpenOverdueFiling ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenOverdueFiling(item);
                        }}
                        className="text-rose-700 hover:text-rose-900 underline font-bold cursor-pointer"
                      >
                        申请特许备案
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              {/* 卡片底部操作栏 */}
              <div
                className="px-3 py-2 bg-slate-50 border-t border-slate-150 flex items-center justify-between gap-1 text-2xs"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewDetails(item)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="查看设备全生命周期档案"
                  >
                    <Eye className="w-3 h-3 text-blue-600" />
                    <span>档案</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddRepairForDevice(item)}
                    className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 font-semibold border border-rose-200 rounded-md transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="发起报修工单"
                  >
                    <Wrench className="w-3 h-3 text-rose-600" />
                    <span>报修</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeStatusForDevice(item)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="变更运行状态"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-600" />
                    <span className="hidden sm:inline">状态</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 relative">
                  <button
                    type="button"
                    onClick={() => onAiDiagnoseDevice(item)}
                    className="p-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md transition cursor-pointer shadow-2xs"
                    title="智算诊断与维护画像"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  {onPrintQrLabel && (
                    <button
                      type="button"
                      onClick={() => onPrintQrLabel(item)}
                      className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition cursor-pointer shadow-2xs"
                      title="打印设备专属二维码标签"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* 更多操作弹窗 */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      className="p-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-md transition cursor-pointer shadow-2xs"
                      title="更多业务操作"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuId === item.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20 cursor-default"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 bottom-8 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-30 text-xs">
                          {onNavigateToInspection && (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToInspection(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                              <span>现场移动巡检</span>
                            </button>
                          )}

                          {!isLoaned && onBorrowEquipment && item.status === '正常运行' && (
                            <button
                              type="button"
                              onClick={() => {
                                onBorrowEquipment(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                              <span>科室借调出库</span>
                            </button>
                          )}

                          {isLoaned && onReturnEquipment && (
                            <button
                              type="button"
                              onClick={() => {
                                onReturnEquipment(item);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-amber-700 hover:bg-amber-50 font-medium flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>归还入库核收</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onEditDevice(item);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                            <span>编辑设备信息</span>
                          </button>

                          <div className="border-t border-slate-100 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              onDeleteDevice(item.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>删除设备条目</span>
                          </button>
                        </div>
                      </>
                    )}
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
