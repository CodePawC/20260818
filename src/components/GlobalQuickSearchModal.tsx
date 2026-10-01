import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  X, 
  Layers, 
  Wrench, 
  FileText, 
  ArrowRight, 
  Building2, 
  Tag, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Boxes,
  ExternalLink,
  Command
} from 'lucide-react';
import { MedicalEquipment } from '../types';

interface GlobalQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: MedicalEquipment[];
  onSelectDevice: (device: MedicalEquipment) => void;
  onOpenRepair?: (device: MedicalEquipment) => void;
  onBorrowDevice?: (device: MedicalEquipment) => void;
}

export const GlobalQuickSearchModal: React.FC<GlobalQuickSearchModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  onSelectDevice,
  onOpenRepair,
  onBorrowDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // 按ESC退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 搜索过滤
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // 默认推荐：高危/急救/重点设备前8台
      return equipmentList
        .filter(eq => eq.status === '故障待修' || eq.department === '医疗设备应急库' || eq.category.includes('生命支持') || eq.category.includes('急救'))
        .slice(0, 8);
    }

    return equipmentList.filter(item => {
      const matchText = 
        item.name.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.sn.toLowerCase().includes(query) ||
        item.model.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query) ||
        (item.internalNo && item.internalNo.toLowerCase().includes(query)) ||
        (item.assetNo && item.assetNo.toLowerCase().includes(query)) ||
        (item.usageLocation && item.usageLocation.toLowerCase().includes(query)) ||
        item.manufacturer.toLowerCase().includes(query);

      if (!matchText) return false;
      if (selectedCategory === 'fault' && item.status !== '故障待修') return false;
      if (selectedCategory === 'emergency' && item.department !== '医疗设备应急库' && !item.id.startsWith('EMG-')) return false;
      return true;
    }).slice(0, 15);
  }, [equipmentList, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部搜索输入框 */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50 gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="输入设备名称、SN编号、自编号(如8号机)、科室、型号..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ESC 退出
            </kbd>
          )}
        </div>

        {/* 快捷过滤药丸 */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] shrink-0">快捷定位:</span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部设备
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('fault')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedCategory === 'fault'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>急需抢修机具</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('emergency')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedCategory === 'emergency'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Boxes className="w-3 h-3" />
            <span>应急储备中心机</span>
          </button>
        </div>

        {/* 搜索结果列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/60">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <div className="text-sm font-medium text-slate-600">未找到匹配的医疗设备</div>
              <div className="text-xs text-slate-400 mt-1">请尝试更换名称、型号、出厂编号或科室关键词</div>
            </div>
          ) : (
            searchResults.map((device) => {
              const isFault = device.status === '故障待修';
              const isEmergency = device.department === '医疗设备应急库' || device.id.startsWith('EMG-');

              return (
                <div
                  key={device.id}
                  onClick={() => {
                    onSelectDevice(device);
                    onClose();
                  }}
                  className="p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                        {device.name}
                      </span>
                      {device.internalNo && (
                        <span className="px-1.5 py-0.2 rounded text-[11px] font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200">
                          {device.internalNo}
                        </span>
                      )}
                      <span className={`px-2 py-0.2 rounded-full text-[11px] font-bold ${
                        device.status === '正常运行'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : device.status === '故障待修'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {device.status}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="font-mono text-slate-600">型号: {device.model}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-500 truncate">SN: {device.sn}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{device.department}</span>
                      </span>
                      {device.usageLocation && (
                        <span className="text-slate-400">({device.usageLocation})</span>
                      )}
                    </div>
                  </div>

                  {/* 快捷操作动作 */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    {onOpenRepair && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenRepair(device);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 bg-rose-50 border border-rose-200 cursor-pointer"
                        title="立即发起抢修工单"
                      >
                        <Wrench className="w-3 h-3" />
                        <span className="hidden sm:inline">报修</span>
                      </button>
                    )}

                    {isEmergency && onBorrowDevice && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBorrowDevice(device);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 bg-indigo-50 border border-indigo-200 cursor-pointer"
                        title="立即发起应急借调"
                      >
                        <Boxes className="w-3 h-3" />
                        <span className="hidden sm:inline">借调</span>
                      </button>
                    )}

                    <div className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-400 flex items-center justify-center transition">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 底部快捷提示栏 */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>支持全院设备智能模糊检索</span>
            <span>·</span>
            <span className="text-slate-400 font-mono">共 {equipmentList.length} 台在册设备</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span>回车打开详情</span>
          </div>
        </div>
      </div>
    </div>
  );
};
