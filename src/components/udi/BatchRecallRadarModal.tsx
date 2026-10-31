import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  X, 
  FileText, 
  Lock, 
  Building2, 
  Cpu, 
  Activity, 
  Printer, 
  Share2, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { BatchRecallAlert, HostConsumableBindingRecord } from '../../types/udiTypes';
import { INITIAL_BATCH_RECALL_ALERTS, INITIAL_HOST_CONSUMABLE_BINDINGS } from '../../utils/udiData';
import { MedicalEquipment } from '../../types';

interface BatchRecallRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: MedicalEquipment[];
  initialLotNumber?: string;
  onLockEquipment?: (equipmentId: string, reason: string) => void;
}

export const BatchRecallRadarModal: React.FC<BatchRecallRadarModalProps> = ({
  isOpen,
  onClose,
  equipments,
  initialLotNumber = '',
  onLockEquipment
}) => {
  const [alerts, setAlerts] = useState<BatchRecallAlert[]>(INITIAL_BATCH_RECALL_ALERTS);
  const [activeAlertId, setActiveAlertId] = useState<string>(alerts[0]?.id || '');
  const [searchLotInput, setSearchLotInput] = useState<string>(initialLotNumber);
  const [isSearching, setIsSearching] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 全院在机专耗数据镜像
  const [allBindings, setAllBindings] = useState<HostConsumableBindingRecord[]>(INITIAL_HOST_CONSUMABLE_BINDINGS);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedAlert = useMemo(() => {
    return alerts.find(a => a.id === activeAlertId) || alerts[0];
  }, [alerts, activeAlertId]);

  // 根据当前激活的警报或用户输入的批号，动态穿透全院绑定记录
  const penetrationResult = useMemo(() => {
    const lotToSearch = (searchLotInput || selectedAlert?.targetLotNumber || '').trim();
    if (!lotToSearch) {
      return {
        lot: '',
        activeInUse: [],
        consumed: [],
        affectedEquipmentCount: 0,
        departments: []
      };
    }

    const matchedBindings = allBindings.filter(b => 
      b.lotNumber.toLowerCase().includes(lotToSearch.toLowerCase())
    );

    const activeInUse = matchedBindings.filter(b => b.status === 'in_use' || b.status === 'recalled');
    const consumed = matchedBindings.filter(b => b.status === 'consumed');
    const depts = Array.from(new Set(matchedBindings.map(b => b.department)));

    return {
      lot: lotToSearch,
      activeInUse,
      consumed,
      affectedEquipmentCount: activeInUse.length,
      departments: depts
    };
  }, [searchLotInput, selectedAlert, allBindings]);

  if (!isOpen) return null;

  // 执行批次穿透搜索
  const handleTriggerPenetrationSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      showToast('success', `全院穿透排查完成！检出批号 [${searchLotInput || selectedAlert?.targetLotNumber}] 关联记录。`);
    }, 400);
  };

  // 一键全院紧急锁定在机主机与耗材
  const handleLockAllInUse = () => {
    const inUseItems = penetrationResult.activeInUse;
    if (inUseItems.length === 0) {
      showToast('error', '当前全院未发现运行中的涉险主机，无需锁定。');
      return;
    }

    // 更新绑定记录状态为 recalled
    setAllBindings(prev => prev.map(b => {
      if (inUseItems.some(item => item.id === b.id)) {
        return {
          ...b,
          status: 'recalled',
          recallFlag: true,
          recallDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
          recallActionNote: `依据 ${selectedAlert?.recallNoticeNo || '药监紧急通告'}，启动设备与耗材物理锁定`
        };
      }
      return b;
    }));

    // 若有回调，将涉及的主机状态转为停用/待检
    inUseItems.forEach(item => {
      if (onLockEquipment) {
        onLockEquipment(item.equipmentId, `【药监召回阻断】涉嫌批号 ${item.lotNumber} 专耗排查`);
      }
    });

    showToast('success', `已成功阻断并物理锁定 ${inUseItems.length} 台涉险在机设备，已向科室发送紧急停机令！`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 rounded-none">
        
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-950 border border-rose-500/50 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-wide text-white">
                  国家药监局 UDI 批次不良召回排查雷达 (Batch Recall Radar)
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800">
                  重大风险应急处置中心
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                实时对接国家与省药监局医疗器械召回公告 · 秒级穿透全院在册主机、在用耗材与已消耗病案
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 提示条 */}
        {toastMessage && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}>
            <span className="flex items-center gap-2">
              {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {toastMessage.text}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50">
          
          {/* 上方：批号输入检索与官方召回库快选 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-4 space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                输入或扫描待排查的 UDI 生产批次号 (LOT Number)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchLotInput}
                    onChange={(e) => setSearchLotInput(e.target.value)}
                    placeholder="如: LOT202607A 或 LOT202608B..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 text-slate-100 focus:border-rose-500 focus:outline-hidden rounded-none"
                  />
                </div>
                <button
                  onClick={handleTriggerPenetrationSearch}
                  disabled={isSearching}
                  className="px-4 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-600 text-white border border-rose-500 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Radio className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                  全院秒级穿透
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                算法将并发扫描全院 22 大类在册设备、临床已挂靠在机专耗、中央耗材库以及 HIS/EMR 病案核销记录
              </p>
            </div>

            <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>国家药监局官方召回函列表</span>
                <span className="text-[10px] text-rose-400 font-mono">LIVE SYNC</span>
              </div>
              <div className="space-y-1.5">
                {alerts.map(a => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setActiveAlertId(a.id);
                      setSearchLotInput(a.targetLotNumber);
                    }}
                    className={`p-2 border text-xs cursor-pointer transition-colors ${
                      activeAlertId === a.id
                        ? 'bg-rose-950/60 border-rose-700 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold text-rose-300">{a.targetLotNumber}</span>
                      <span className="text-[10px] text-slate-500">{a.publishDate}</span>
                    </div>
                    <div className="truncate text-slate-300 mt-0.5">{a.consumableName}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 选中的召回公文详情 */}
          {selectedAlert && (
            <div className="p-4 bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                    {selectedAlert.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    文号: {selectedAlert.recallNoticeNo}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  发布来源: <span className="text-slate-200">{selectedAlert.alertSource}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">召回目标品类:</span>
                  <span className="text-slate-200 font-medium">{selectedAlert.consumableName}</span>
                </div>
                <div className="bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">生产企业:</span>
                  <span className="text-slate-200 font-medium">{selectedAlert.manufacturer}</span>
                </div>
                <div className="bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">目标 DI 编码:</span>
                  <span className="text-cyan-300 font-mono font-semibold">{selectedAlert.targetDi}</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/80 p-3 border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  召回原因与临床安全隐患:
                </div>
                <p className="text-slate-300 leading-relaxed">{selectedAlert.recallReason}</p>
                <div className="pt-1.5 text-slate-400 border-t border-slate-800/80">
                  <span className="text-amber-400 font-medium">处置指引: </span>
                  {selectedAlert.actionRequired}
                </div>
              </div>
            </div>
          )}

          {/* 全院穿透雷达统计与结果看板 */}
          <div className="space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">在机挂靠 (急需阻断)</span>
                  <span className={`text-xl font-bold font-mono ${penetrationResult.activeInUse.length > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {penetrationResult.activeInUse.length} 台
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">波及临床科室</span>
                  <span className="text-xl font-bold font-mono text-slate-200">
                    {penetrationResult.departments.length} 个
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-800"></div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">病案历史消耗</span>
                  <span className="text-xl font-bold font-mono text-slate-400">
                    {penetrationResult.consumed.length} 例
                  </span>
                </div>
              </div>

              <button
                onClick={handleLockAllInUse}
                disabled={penetrationResult.activeInUse.length === 0}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white border border-rose-400 disabled:border-slate-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                一键下发紧急停用令并锁定在机设备
              </button>
            </div>

            {/* 详细穿透清单 */}
            <div className="border border-slate-800">
              <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>穿透结果明细 (批号: {penetrationResult.lot || '未选择'})</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  共计检出 {penetrationResult.activeInUse.length + penetrationResult.consumed.length} 条关联记录
                </span>
              </div>

              {penetrationResult.activeInUse.length === 0 && penetrationResult.consumed.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  当前全院未检索到批次号 [{penetrationResult.lot}] 的在机挂靠或消耗记录，状态安全。
                </div>
              ) : (
                <div className="divide-y divide-slate-800 bg-slate-950 font-sans text-xs">
                  {penetrationResult.activeInUse.map(item => (
                    <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-900/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold ${
                            item.status === 'recalled' 
                              ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                              : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                          }`}>
                            {item.status === 'recalled' ? '已执行物理锁定' : '在机急需停机'}
                          </span>
                          <span className="font-semibold text-slate-100">{item.equipmentName}</span>
                          <span className="text-slate-400 font-mono">({item.equipmentModel})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                          <span>科室: <strong className="text-slate-200 font-sans">{item.department}</strong></span>
                          <span>在机专耗: {item.consumableName}</span>
                          <span>批号: <strong className="text-rose-400">{item.lotNumber}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-mono">上机: {item.bindingTime}</span>
                        {item.status !== 'recalled' && (
                          <button
                            onClick={() => {
                              setAllBindings(prev => prev.map(b => b.id === item.id ? { ...b, status: 'recalled' } : b));
                              if (onLockEquipment) {
                                onLockEquipment(item.equipmentId, `【药监单机紧急召回】批号 ${item.lotNumber}`);
                              }
                              showToast('success', `已单台锁定设备【${item.equipmentName}】！`);
                            }}
                            className="px-2.5 py-1 text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors cursor-pointer"
                          >
                            立即锁定停机
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {penetrationResult.consumed.map(item => (
                    <div key={item.id} className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            病案已核销
                          </span>
                          <span className="text-slate-300">{item.consumableName}</span>
                          <span className="text-slate-500 font-mono">[{item.lotNumber}]</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          使用患者: <strong className="text-slate-200 font-sans">{item.patientName}</strong> (住院号: {item.patientId}) · 病案号: {item.caseNo}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        消耗时间: {item.consumedTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* 底部按钮栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs">
          <div className="text-slate-400 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            国家药监局 UDI 批次追溯平台数据同步正常
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            关闭雷达
          </button>
        </div>

      </div>
    </div>
  );
};
