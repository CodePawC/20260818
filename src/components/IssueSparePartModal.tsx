import React, { useState, useMemo } from 'react';
import { SparePartItem } from '../types/sparePartsTypes';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  Info
} from 'lucide-react';

interface IssueSparePartModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder;
  availableParts: SparePartItem[];
  currentUserName?: string;
  onClose: () => void;
  onConfirmIssue: (part: SparePartItem, quantity: number) => void;
  onMarkWaitingParts?: (missingPartName: string) => void;
}

export const IssueSparePartModal: React.FC<IssueSparePartModalProps> = ({
  isOpen,
  workOrder,
  availableParts,
  currentUserName = '工程技术员',
  onClose,
  onConfirmIssue,
  onMarkWaitingParts
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [issueQuantity, setIssueQuantity] = useState<number>(1);
  const [showWaitingPartsConfirm, setShowWaitingPartsConfirm] = useState(false);
  const [missingReason, setMissingReason] = useState('');

  // Determine matching recommendation score for the work order's equipment
  const scoredParts = useMemo(() => {
    const eqNameLower = (workOrder?.equipmentName || '').toLowerCase();
    const catLower = (workOrder?.category || '').toLowerCase();
    const safeParts = Array.isArray(availableParts) ? availableParts : [];

    return safeParts.map(part => {
      let isRecommended = false;
      const appTypes = Array.isArray(part.applicableEquipmentTypes) ? part.applicableEquipmentTypes : [];
      // Check applicableEquipmentTypes
      if (
        appTypes.some(
          t => t && (eqNameLower.includes(t.toLowerCase()) || catLower.includes(t.toLowerCase()))
        )
      ) {
        isRecommended = true;
      }

      // Check brand match
      if (part.brand && eqNameLower.includes(part.brand.toLowerCase())) {
        isRecommended = true;
      }

      return {
        ...part,
        isRecommended
      };
    });
  }, [availableParts, workOrder]);

  // Filter parts based on search & category
  const filteredParts = useMemo(() => {
    return scoredParts.filter(part => {
      if (selectedCategory !== 'all' && part.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (part.name || '').toLowerCase().includes(q) ||
          (part.partNo || '').toLowerCase().includes(q) ||
          (part.spec || '').toLowerCase().includes(q) ||
          (part.brand || '').toLowerCase().includes(q) ||
          (part.warehouseLocation || '').toLowerCase().includes(q) ||
          (part.applicableEquipmentTypes || []).some(t => (t || '').toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize recommended first, then stock availability
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return (b.currentStock || 0) - (a.currentStock || 0);
    });
  }, [scoredParts, selectedCategory, searchQuery]);

  const selectedPart = (Array.isArray(availableParts) ? availableParts : []).find(p => p.id === selectedPartId);

  const handleSelectPart = (part: SparePartItem) => {
    setSelectedPartId(part.id);
    setIssueQuantity(1);
  };

  const handleConfirm = () => {
    if (!selectedPart) return;
    if (issueQuantity <= 0 || issueQuantity > selectedPart.currentStock) {
      alert(`领料数量必须在 1 至在库最大可用数 (${selectedPart.currentStock}) 之间`);
      return;
    }
    onConfirmIssue(selectedPart, issueQuantity);
  };

  const handleRequestUrgentOutsource = () => {
    if (!selectedPart) return;
    if (onMarkWaitingParts) {
      onMarkWaitingParts(
        missingReason.trim() || `备件【${selectedPart.name} (${selectedPart.partNo})】在库缺货，申请原厂紧急调配采购`
      );
    }
    setShowWaitingPartsConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  医工备品备件库 · 现场领料出库
                </h3>
                <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  工单领料联动
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                关联工单：<span className="font-mono font-bold text-slate-700">{workOrder.id}</span> | 待修设备：
                <span className="font-semibold text-indigo-700">{workOrder.equipmentName}</span> (SN: {workOrder.equipmentSn})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Part Search & Catalog List */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/40">
            {/* Search and Category Filter */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索备件名称、原厂编码、规格、货位、适用设备..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-2xs scrollbar-none">
                {[
                  { id: 'all', label: '全部备件' },
                  { id: 'life_support', label: '急救生命支持' },
                  { id: 'imaging_radiology', label: '放射影像' },
                  { id: 'lab_biochemical', label: '生化临检' },
                  { id: 'endoscopy_surgery', label: '腔镜手术' },
                  { id: 'ultrasound_diagnostics', label: '超声电生理' },
                  { id: 'general_consumables', label: '通用机电' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredParts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>未找到符合条件的备件或耗材</p>
                </div>
              ) : (
                filteredParts.map(part => {
                  const isSelected = part.id === selectedPartId;
                  const isOutOfStock = part.currentStock <= 0;
                  const isLowStock = part.currentStock > 0 && part.currentStock <= part.minSafeStock;

                  return (
                    <div
                      key={part.id}
                      onClick={() => handleSelectPart(part)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {part.isRecommended && (
                              <span className="px-1.5 py-0.2 rounded text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>机型适配推荐</span>
                              </span>
                            )}
                            <span className="font-mono text-2xs font-bold text-slate-500">
                              {part.partNo}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-xs leading-snug">
                            {part.name}
                          </h4>
                          <p className="text-2xs text-slate-500 line-clamp-1">
                            {part.spec} · {part.brand}
                          </p>
                        </div>

                        {/* Stock status badge */}
                        <div className="text-right shrink-0">
                          <div className="font-mono text-sm font-bold text-slate-900">
                            ￥{part.unitCost}
                          </div>
                          <div className="mt-1">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                缺货 (0)
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                库存偏低 ({part.currentStock}{part.unit})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                在库充足 ({part.currentStock}{part.unit})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-2xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{part.warehouseLocation}</span>
                        </span>
                        <span>
                          批次: <span className="font-mono">{part.batchNo}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Part Details & Requisition Execution */}
          <div className="w-full md:w-80 lg:w-96 p-4 flex flex-col justify-between bg-white shrink-0">
            {selectedPart ? (
              <div className="space-y-4">
                <div>
                  <div className="text-2xs font-bold text-indigo-600 uppercase tracking-wide">
                    已选定备件出库明细
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {selectedPart.name}
                  </h3>
                  <div className="font-mono text-2xs text-slate-500 mt-0.5">
                    零件号: {selectedPart.partNo}
                  </div>
                </div>

                {/* Specs Box */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">规格型号:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[65%]">
                      {selectedPart.spec}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">生产厂家:</span>
                    <span className="font-medium text-slate-800">{selectedPart.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">存放货位:</span>
                    <span className="font-medium text-slate-800">{selectedPart.warehouseLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">在库实物结存:</span>
                    <span className={`font-mono font-bold ${
                      selectedPart.currentStock === 0
                        ? 'text-rose-600'
                        : selectedPart.currentStock <= selectedPart.minSafeStock
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {selectedPart.currentStock} {selectedPart.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">单价成本:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ￥{selectedPart.unitCost} / {selectedPart.unit}
                    </span>
                  </div>
                </div>

                {/* Requisition Quantity Counter */}
                {selectedPart.currentStock > 0 ? (
                  <div className="space-y-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      领料出库数量 ({selectedPart.unit})：
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIssueQuantity(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-center text-sm"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={selectedPart.currentStock}
                        value={issueQuantity}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          setIssueQuantity(Math.min(selectedPart.currentStock, Math.max(1, val)));
                        }}
                        className="w-20 text-center font-mono font-bold text-sm py-1 border border-slate-300 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIssueQuantity(prev => Math.min(selectedPart.currentStock, prev + 1))
                        }
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-center text-sm"
                      >
                        +
                      </button>
                      <span className="text-2xs text-slate-500">
                        最大可用: {selectedPart.currentStock} {selectedPart.unit}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600">本次领料金额：</span>
                      <span className="text-base font-bold font-mono text-indigo-700">
                        ￥{(issueQuantity * selectedPart.unitCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>该备件当前库存已耗尽 (0{selectedPart.unit})</span>
                    </div>
                    <p className="text-2xs text-rose-600 leading-relaxed">
                      无法执行院内即时出库。如现场必须更换该配件，可一键将工单标记为【挂起待件 (waiting_parts)】并向原厂/采购组发起紧急调配申请。
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowWaitingPartsConfirm(true)}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-2xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>挂起工单并申请原厂紧急调配</span>
                    </button>
                  </div>
                )}

                {/* Info Note */}
                <div className="text-2xs text-slate-400 leading-relaxed flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    点击“确认出库领料”后，系统将自动从备品备件库扣减当前实物库存，生成出库流水台账，并计入本工单的维修备件成本中。
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <Package className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs">请在左侧列表中点击选择需要领料的备件</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                取消
              </button>

              {selectedPart && selectedPart.currentStock > 0 && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>确认领料出库 ({issueQuantity}{selectedPart.unit})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Mark Work Order as Waiting Parts */}
        {showWaitingPartsConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>工单挂起待件与紧急配件调配申请</span>
                </div>
                <button
                  onClick={() => setShowWaitingPartsConfirm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  待调配件：<strong className="text-slate-900">{selectedPart?.name}</strong> ({selectedPart?.partNo})
                </p>
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    挂起原因与调配说明：
                  </label>
                  <textarea
                    rows={3}
                    value={missingReason}
                    onChange={e => setMissingReason(e.target.value)}
                    placeholder="请输入向原厂或采购中心紧急调配备件的说明..."
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowWaitingPartsConfirm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleRequestUrgentOutsource}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  确认挂起工单 (转为待配件)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
