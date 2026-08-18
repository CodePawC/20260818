import React, { useState } from 'react';
import { MedicalEquipment, MetrologyCatalogueItem } from '../types';
import { X, Wrench, ShieldCheck, Calendar, MapPin, DollarSign, Building, AlertCircle, AlertTriangle, CheckCircle2, FileText, Activity, Sparkles, TrendingUp, Scale, Hourglass, Phone, Eye } from 'lucide-react';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentHealthScore, getEquipmentMaintenanceNode } from '../utils/equipmentUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { getDepartmentMasterInfo } from '../utils/masterData';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import { HealthScoreDetailModal } from './HealthScoreDetailModal';

interface EquipmentDetailModalProps {
  equipment: MedicalEquipment | null;
  metrologyCatalogue?: MetrologyCatalogueItem[];
  onClose: () => void;
  onOpenRepairForDevice: (item: MedicalEquipment) => void;
  onOpenStatusChange: (item: MedicalEquipment) => void;
  onViewAgencyTransactions?: (agencyName: string, item: MedicalEquipment) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  equipment,
  metrologyCatalogue,
  onClose,
  onOpenRepairForDevice,
  onOpenStatusChange,
  onViewAgencyTransactions,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'repairs' | 'logs' | 'pm'>('basic');
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);

  if (!equipment) return null;

  const photoUrl = getEquipmentPhoto(equipment);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setShowPhotoPreview(true)}
              className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 cursor-pointer relative group/p shadow-2xs hover:border-blue-500 transition"
              title="点击查看高清实物照片"
            >
              <img
                src={photoUrl}
                alt={equipment.name}
                className="w-full h-full object-cover group-hover/p:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/p:opacity-100 flex items-center justify-center text-white transition">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{equipment.name}</h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  {equipment.sn}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  equipment.status === '正常运行' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  equipment.status === '维护保养中' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  equipment.status === '故障待修' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {equipment.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-mono font-medium">
                  [{equipment.categoryNo || '06'}] {equipment.category}
                </span>
                <span className="text-slate-300">›</span>
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                  [{equipment.level1No || '01'}] {equipment.level1Category || '-'}
                </span>
                <span className="text-slate-300">›</span>
                <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-medium border border-emerald-200">
                  [{equipment.level2No || '01'}] {equipment.level2Category || '-'}
                </span>
                <span className="text-slate-400">|</span>
                <span>型号: <strong className="text-slate-700 font-mono">{equipment.model}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRepairForDevice(equipment)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition flex items-center gap-1 shadow-sm"
            >
              <Wrench className="w-4 h-4" />
              登记维修工单
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Header */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('basic')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'basic'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            基本台账档案
          </button>
          <button
            onClick={() => setActiveTab('repairs')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'repairs'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>维修保养记录</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-600">
              {equipment.repairRecords.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>状态变更履历</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-slate-100 text-slate-600">
              {equipment.statusLogs.length}
            </span>
          </button>
        </div>

        {/* Modal Body content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Asset & Key Indicators Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* 1. 科室与位置 */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-700 flex items-center gap-1 font-bold">
                    <Building className="w-3.5 h-3.5 text-blue-600" /> 使用科室与位置
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1 truncate">{equipment.department}</p>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 truncate font-medium">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" /> {equipment.location}
                  </p>
                </div>

                {/* 2. 购置原值与累计维修支出 */}
                {(() => {
                  const repairCount = equipment.repairRecords?.length || equipment.repairCount || 0;
                  const totalCost = equipment.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
                  return (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-xs text-slate-700 flex items-center gap-1 font-bold">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> 原值与累计维保
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1 font-mono notranslate" translate="no">
                        ￥{equipment.purchasePrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-800 mt-0.5 font-bold flex items-center justify-between">
                        <span>累计维修: {repairCount} 次</span>
                        <strong className="font-mono notranslate" translate="no">￥{totalCost.toLocaleString()}</strong>
                      </p>
                    </div>
                  );
                })()}

                {/* 3. AI健康评估得分 */}
                {(() => {
                  const hInfo = getEquipmentHealthScore(equipment);
                  return (
                    <div
                      onClick={() => setShowHealthModal(true)}
                      className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                      title="点击查看健康得分剖析与扣分归因明细卡片"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-700 flex items-center gap-1 font-bold group-hover:text-blue-600 transition-colors">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" /> AI健康评估得分
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          🔍 扣分明细
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${hInfo.badgeBg}`}>
                          {hInfo.score} 分 ({hInfo.label})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (满分 100)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 truncate font-medium">
                        {hInfo.deductions.length > 0
                          ? `首要扣分项: ${hInfo.deductions[0].reason}`
                          : '各项合规指标正常'}
                      </p>
                    </div>
                  );
                })()}

                {/* 4. 保养节点与状态 */}
                {(() => {
                  const mNode = getEquipmentMaintenanceNode(equipment);
                  return (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-xs text-slate-700 flex items-center gap-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" /> 保养节点与状态
                      </span>
                      <p className="text-sm font-bold text-slate-900 mt-1 font-mono">{mNode.nextDate}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] border ${mNode.badgeClass}`}>
                          {mNode.statusTag}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Validity & Risk Assessment Card */}
              {(() => {
                const vInfo = getEquipmentValidityInfo(equipment);
                return (
                  <div className={`p-4 rounded-lg border flex flex-col gap-2.5 transition-all ${
                    vInfo.riskLevel === 'high' ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-2xs' :
                    vInfo.riskLevel === 'medium' ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-2xs' :
                    vInfo.riskLevel === 'low' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs' :
                    'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${
                          vInfo.riskLevel === 'high' ? 'bg-amber-200 text-amber-900' :
                          vInfo.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800' :
                          vInfo.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          <Hourglass className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">⏳ 出厂设计寿命与老龄化评估 Product Lifespan & Aging</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-900 font-bold border border-amber-200">
                              原厂机械/物理寿命
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">按生产厂家标称的设计使用年限核算（判定老旧超龄服役，用于资产折旧、报废论证或特批延寿）</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        vInfo.riskLevel === 'high' ? 'bg-amber-700 text-white shadow-2xs' :
                        vInfo.riskLevel === 'medium' ? 'bg-amber-600 text-white shadow-2xs' :
                        vInfo.riskLevel === 'low' ? 'bg-emerald-600 text-white shadow-2xs' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {vInfo.riskLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-y border-black/10 text-xs">
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">生产日期 (出厂基准):</span>
                        <span className="font-mono font-bold text-sm text-slate-900">{vInfo.manufactureDateStr}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">标称设计使用年限:</span>
                        <span className="font-mono font-bold text-sm text-slate-900">{vInfo.validityYears ? `${vInfo.validityYears} 年` : '未登记'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">设计到期截止时间:</span>
                        <span className="font-mono font-bold text-sm text-slate-900">{vInfo.expirationDateStr}</span>
                      </div>
                    </div>

                    <p className="text-xs font-medium leading-relaxed text-slate-800">
                      {vInfo.riskDescription}
                    </p>

                    <div className="mt-0.5 pt-1.5 border-t border-black/10 text-[11px] text-slate-600 flex items-center justify-between gap-2 flex-wrap">
                      <span className="italic">💡 概念说明：产品设计寿命由原厂标称，属于物理机械及元器件的生命周期；与定期由质监部门开展的“周期计量强检”相互独立。</span>
                      {vInfo.riskLevel === 'high' && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStatusChange(equipment);
                          }}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-md font-medium text-xs shadow-2xs cursor-pointer transition shrink-0"
                        >
                          申请老旧设备性能评估 / 报废处置
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Metrology & Calibration File Card */}
              {(() => {
                const calInfo = getEquipmentCalibrationInfo(equipment, metrologyCatalogue);
                const isMandatory = calInfo.managementType === 'mandatory';
                const isPeriodic = calInfo.managementType === 'periodic_calibration';
                return (
                  <div className={`p-4 rounded-lg border flex flex-col gap-2.5 transition-all ${
                    calInfo.statusType === 'overdue' ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-2xs' :
                    calInfo.statusType === 'due_soon' ? 'bg-purple-50/90 border-purple-200 text-purple-950 shadow-2xs' :
                    calInfo.statusType === 'valid' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-2xs' :
                    'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${
                          calInfo.statusType === 'overdue' ? 'bg-rose-200 text-rose-900' :
                          calInfo.statusType === 'due_soon' ? 'bg-purple-200 text-purple-900' :
                          calInfo.statusType === 'valid' ? 'bg-emerald-200 text-emerald-900' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          <Scale className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">⚖️ 计量检定/校准与政策档案 Metrology & Calibration File</h4>
                            {isMandatory ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                ⚖️ 国家法定强制检定 (国家免费 · 0元)
                              </span>
                            ) : isPeriodic ? (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                                📐 医院定期校准 (自费检验 · 商业收费)
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-300">
                                ⚪ 免计量设备 (常规巡检)
                              </span>
                            )}
                            {calInfo.catalogueCode && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-white text-slate-800 font-mono font-bold border border-slate-300">
                                目录代码: {calInfo.catalogueCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-medium">
                            {isMandatory 
                              ? '纳入国家市场监管总局强检目录，依据财税〔2017〕20号由国家财政全额保障免征强检费，超期脱检严禁用于临床！'
                              : isPeriodic 
                              ? '不属于国家强检免征目录，由医院根据临床质控规范与等级评审要求，自主委托具备CNAS/CMA资质机构自费校准。'
                              : '普通非计量医疗装备，无需法定强制检定或周期校准，执行常规预防性维护(PM)。'
                            }
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${calInfo.badgeClass}`}>
                        {calInfo.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-black/10 text-xs">
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">计量管理性质:</span>
                        <span className="font-bold text-slate-900">{calInfo.calibrationType}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">费用政策属性:</span>
                        <span className={`font-bold ${isMandatory ? 'text-emerald-700' : isPeriodic ? 'text-amber-800' : 'text-slate-700'}`}>
                          {calInfo.feePolicyLabel}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">出具法定凭证:</span>
                        <span className="font-bold text-slate-900">{calInfo.certificateType || '检定证书/校准报告'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">法定证书编号:</span>
                        <span className="font-mono font-bold text-slate-900">{calInfo.certificateNo}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">检定/校准机构:</span>
                        {calInfo.agency && calInfo.agency !== '-' && calInfo.agency !== '免检' ? (
                          <button
                            type="button"
                            onClick={() => {
                              onViewAgencyTransactions?.(calInfo.agency, equipment);
                            }}
                            className="font-semibold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 text-left truncate cursor-pointer mt-0.5 group/ag"
                            title={`查看与【${calInfo.agency}】的往来档案与全部业务`}
                          >
                            <span className="truncate">{calInfo.agency}</span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-normal shrink-0">往来档案 ↗</span>
                          </button>
                        ) : (
                          <span className="font-semibold text-slate-900 truncate block" title={calInfo.agency}>{calInfo.agency}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">前次定标日期:</span>
                        <span className="font-mono font-bold text-slate-900">{calInfo.lastDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 font-semibold block text-[11px]">到期截止日期:</span>
                        <span className="font-mono font-bold text-slate-900">{calInfo.nextDate}</span>
                      </div>
                    </div>

                    <p className="text-xs font-medium leading-relaxed text-slate-800">
                      {calInfo.description}
                    </p>

                    {calInfo.legalBasis && (
                      <div className="p-2 bg-black/5 rounded text-[11px] text-slate-700 space-y-0.5">
                        <div className="font-bold flex items-center gap-1 text-slate-900">
                          <span>📜 法规与技术规程依据：</span>
                        </div>
                        <p>{calInfo.legalBasis}</p>
                      </div>
                    )}

                    <div className="mt-0.5 pt-1.5 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="italic text-[11px] text-slate-600">
                        {isMandatory 
                          ? '💡 提示：心电图机、脑电图、彩超、CT等属于国家法定强检目录，可通过全国 e-CQS 强检平台申报 0元免费检定。'
                          : '💡 提示：输液泵、呼吸机、高频电刀等定期校准需由医院自费支付第三方校准费用。'
                        }
                      </span>
                      <div className="flex items-center gap-2">
                        {calInfo.isMandatory && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenRepairForDevice(equipment);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            登记送检 / 录入新证书
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed Grid */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> 设备完整台账明细
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">ID (系统号):</span>
                    <span className="font-mono font-bold text-slate-900">{equipment.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">出厂编号 (SN):</span>
                    <span className="font-mono font-bold text-slate-900">{equipment.sn || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">规格型号:</span>
                    <span className="font-semibold text-slate-900">{equipment.model || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">类别 (序号/名称):</span>
                    <span className="text-slate-900 font-semibold">
                      {equipment.categoryNo ? `[${equipment.categoryNo}] ` : ''}{equipment.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">一级类别 (序号/名称):</span>
                    <span className="text-slate-900 font-medium">
                      {equipment.level1No ? `[${equipment.level1No}] ` : ''}{equipment.level1Category || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">二级类别 (序号/名称):</span>
                    <span className="text-slate-900 font-medium">
                      {equipment.level2No ? `[${equipment.level2No}] ` : ''}{equipment.level2Category || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">厂商名称:</span>
                    {equipment.manufacturer && equipment.manufacturer !== '-' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onViewAgencyTransactions?.(equipment.manufacturer, equipment);
                        }}
                        className="text-blue-700 hover:text-blue-900 font-semibold hover:underline flex items-center gap-1 text-left cursor-pointer group/mfr mt-0.5"
                        title={`查看生产厂家【${equipment.manufacturer}】的往来合作档案`}
                      >
                        <span>{equipment.manufacturer}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-normal shrink-0">厂家档案 ↗</span>
                      </button>
                    ) : (
                      <span className="text-slate-900 font-medium">{equipment.manufacturer || '-'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">生产日期:</span>
                    <span className="font-mono text-slate-900 font-semibold">{equipment.manufactureDate || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">产品有效期 (年):</span>
                    <span className="text-slate-900 font-mono font-semibold">{equipment.productValidity ? `${equipment.productValidity} 年` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">投用时间:</span>
                    <span className="font-mono text-slate-900 font-semibold">{equipment.enableDate || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">计量校准状态:</span>
                    <span className="text-slate-900 font-semibold">
                      {equipment.calibration === 'Yes' ? '已计量' : '免计量'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">使用科室:</span>
                    <span className="text-slate-900 font-bold">{equipment.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">护士站电话 / 科室电话:</span>
                    {(() => {
                      const deptMaster = getDepartmentMasterInfo(equipment.department);
                      const phone = equipment.nursePhone || deptMaster.nursePhone;
                      return phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="font-mono text-blue-700 hover:text-blue-900 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                          title={`点击拨打科室护士站电话 ${phone}`}
                        >
                          <Phone className="w-3 h-3 text-blue-600" />
                          <span>{phone}</span>
                          {!equipment.nursePhone && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded font-normal">主数据</span>
                          )}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-500">-</span>
                      );
                    })()}
                  </div>

                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">存放建筑/楼栋:</span>
                    <span className="text-slate-900 font-medium">
                      {equipment.building || getDepartmentMasterInfo(equipment.department).building || '1号楼 综合楼'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">存放楼层:</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {equipment.floor ? `${equipment.floor} 层` : `${getDepartmentMasterInfo(equipment.department).floor} 层`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 font-semibold block text-xs">管理责任人:</span>
                    <span className="text-slate-900 font-semibold">{equipment.manager || getDepartmentMasterInfo(equipment.department).manager || '崔工'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'repairs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">该设备历史报修及保养日志明细：</p>
                <button
                  onClick={() => onOpenRepairForDevice(equipment)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                >
                  + 新增报修工单
                </button>
              </div>

              {equipment.repairRecords.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-400">
                  暂无维修记录，设备运行状况良好。
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.repairRecords.map((record) => (
                    <div key={record.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            record.repairType === '紧急故障维修' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {record.repairType}
                          </span>
                          <span className="font-mono text-xs text-slate-400">{record.id}</span>
                          <span className="text-xs text-slate-500 font-medium">{record.faultDate}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          record.status === '已完成' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {record.status}
                        </span>
                      </div>

                      <p className="text-sm text-slate-800 font-medium">
                        故障现象/事由: <span className="font-normal text-slate-700">{record.faultDescription}</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded">
                        <div>维保工程师/厂商: <strong className="text-slate-800">{record.technician}</strong></div>
                        <div>维修支出: <strong className="text-slate-900 notranslate" translate="no">￥{(record.cost || 0).toLocaleString()}</strong></div>
                        <div>更换配件: <strong className="text-slate-800">{record.partsReplaced || '无'}</strong></div>
                        <div>完成日期: <strong className="text-slate-800">{record.completionDate || '推进中'}</strong></div>
                      </div>

                      <p className="text-xs text-slate-600 pt-1">
                        <strong>修复方案与结论:</strong> {record.resolution}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">运行状态变动审计日志（实时追踪轨迹）：</p>
              {equipment.statusLogs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-400">
                  暂无状态变更履历。
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-200 pl-4 ml-3 space-y-4 py-2">
                  {equipment.statusLogs.map((log) => (
                    <div key={log.id} className="relative bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white"></div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{log.timestamp}</span>
                        <span>操作人: {log.operator}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm font-medium">
                        <span className="text-slate-500">{log.oldStatus}</span>
                        <span className="text-slate-400">➔</span>
                        <span className="text-blue-600 font-bold">{log.newStatus}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        变更原因/工单: {log.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => onOpenStatusChange(equipment)}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm font-medium transition"
          >
            快速变更运行状态
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
          >
            关闭视窗
          </button>
        </div>
      </div>

      <HealthScoreDetailModal
        isOpen={showHealthModal}
        equipment={equipment}
        onClose={() => setShowHealthModal(false)}
        onAddRepairForDevice={onOpenRepairForDevice}
        onChangeStatusForDevice={onOpenStatusChange}
      />

      <ImagePreviewModal
        isOpen={showPhotoPreview}
        equipment={equipment}
        photoUrl={photoUrl}
        onClose={() => setShowPhotoPreview(false)}
      />
    </div>
  );
};
