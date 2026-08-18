import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Building2,
  Tag,
  ShieldCheck,
  Printer,
  Download,
  Flame,
  Clock,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  FileSpreadsheet
} from 'lucide-react';
import { MedicalEquipment, AuthUser } from '../types';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';

export interface AuditRecordItem {
  equipmentId: string;
  equipmentName: string;
  model: string;
  sn: string;
  assetNumber: string;
  category: string;
  location: string;
  expectedStatus: 'available' | 'borrowed' | 'maintenance';
  actualStatus: 'available' | 'borrowed' | 'maintenance' | 'loss' | 'relocated';
  auditState: 'audited' | 'unaudited' | 'abnormal'; // 已盘 / 未盘 / 异常盘点
  auditedAt?: string;
  auditor?: string;
  abnormalNote?: string;
  borrowDept?: string;
}

interface EmergencyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryList: MedicalEquipment[];
  currentUser: AuthUser | null;
  onPrintQrLabels?: (devices: MedicalEquipment[]) => void;
}

export const EmergencyAuditModal: React.FC<EmergencyAuditModalProps> = ({
  isOpen,
  onClose,
  inventoryList,
  currentUser,
  onPrintQrLabels
}) => {
  // 盘点会话状态
  const [auditItems, setAuditItems] = useState<AuditRecordItem[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'audited' | 'unaudited' | 'abnormal'>('all');
  const [searchKey, setSearchKey] = useState('');
  const [selectedPartition, setSelectedPartition] = useState('全部货区');

  // 扫码输入与模拟摄像头
  const [scanInput, setScanInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScannedItem, setRecentScannedItem] = useState<{
    item: AuditRecordItem;
    status: 'success' | 'warning' | 'already';
    msg: string;
  } | null>(null);

  // 异常标记弹窗/抽屉
  const [abnormalModalItem, setAbnormalModalItem] = useState<AuditRecordItem | null>(null);
  const [abnormalNoteInput, setAbnormalNoteInput] = useState('');
  const [abnormalStatusSelected, setAbnormalStatusSelected] = useState<AuditRecordItem['actualStatus']>('abnormal' as any);

  // 快速连续扫码 input ref
  const scanInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 初始化盘点数据（可从 localStorage 恢复本次未完成的盘点，或重新构建）
  useEffect(() => {
    if (!isOpen) return;

    const storageKey = 'hospital_emergency_audit_session';
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAuditItems(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse saved audit session', e);
      }
    }

    // 默认生成全新盘点单
    const initialItems: AuditRecordItem[] = inventoryList.map(eq => {
      const expStatus: 'available' | 'borrowed' | 'maintenance' = 
        eq.status === 'borrowed' ? 'borrowed' : eq.status === 'maintenance' ? 'maintenance' : 'available';

      return {
        equipmentId: eq.id,
        equipmentName: eq.name,
        model: eq.model,
        sn: eq.serialNumber,
        assetNumber: eq.assetNumber || eq.id,
        category: eq.category,
        location: eq.location || '应急库 A区',
        expectedStatus: expStatus,
        actualStatus: expStatus,
        auditState: 'unaudited',
        borrowDept: eq.department !== '医学工程保障中心' ? eq.department : undefined
      };
    });

    setAuditItems(initialItems);
  }, [isOpen, inventoryList]);

  // 保存盘点会话进度到本地
  const saveAuditSession = (items: AuditRecordItem[]) => {
    setAuditItems(items);
    localStorage.setItem('hospital_emergency_audit_session', JSON.stringify(items));
  };

  // 播放提示音 (Web Audio API)
  const playBeep = (type: 'success' | 'warn') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Ignore audio error
    }
  };

  // 执行核心扫码/核销逻辑
  const processBarcodeScan = (code: string) => {
    const raw = code.trim();
    if (!raw) return;

    // 支持扫描二维码 URL、JSON、资产编号或SN
    let matchedId = raw;
    if (raw.includes('eq=')) {
      matchedId = raw.split('eq=')[1]?.split('&')[0] || raw;
    } else if (raw.includes('id=')) {
      matchedId = raw.split('id=')[1]?.split('&')[0] || raw;
    }

    const itemIndex = auditItems.findIndex(
      item =>
        item.equipmentId.toLowerCase() === matchedId.toLowerCase() ||
        item.sn.toLowerCase() === raw.toLowerCase() ||
        item.assetNumber.toLowerCase() === raw.toLowerCase() ||
        (matchedId.length >= 4 && item.equipmentId.toLowerCase().includes(matchedId.toLowerCase()))
    );

    if (itemIndex === -1) {
      playBeep('warn');
      setRecentScannedItem({
        item: {
          equipmentId: 'UNKNOWN',
          equipmentName: `未知设备 (${raw})`,
          model: '未知规格',
          sn: raw,
          assetNumber: raw,
          category: '未识别',
          location: '待核验',
          expectedStatus: 'available',
          actualStatus: 'available',
          auditState: 'abnormal'
        },
        status: 'warning',
        msg: `⚠️ 未在应急库在册底册中匹配到条码/SN【${raw}】！可能属于科室自有设备或非应急资产。`
      });
      return;
    }

    const currentItem = auditItems[itemIndex];
    const isAlreadyAudited = currentItem.auditState === 'audited';

    const updated = [...auditItems];
    updated[itemIndex] = {
      ...currentItem,
      auditState: 'audited',
      auditedAt: new Date().toLocaleString('zh-CN'),
      auditor: currentUser?.name || '崔工'
    };

    saveAuditSession(updated);

    if (isAlreadyAudited) {
      playBeep('success');
      setRecentScannedItem({
        item: updated[itemIndex],
        status: 'already',
        msg: `ℹ️ 设备【${currentItem.equipmentName}】已在 ${currentItem.auditedAt || '此前'} 盘点过，已刷新最新核验时间！`
      });
    } else {
      playBeep('success');
      setRecentScannedItem({
        item: updated[itemIndex],
        status: 'success',
        msg: `✅ 盘点核销成功！【${currentItem.equipmentName}】(${currentItem.model}) 状态正常在库，存放于 ${currentItem.location}`
      });
    }

    setScanInput('');
    if (scanInputRef.current) {
      scanInputRef.current.focus();
    }
  };

  // 处理手工扫码表单提交
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeScan(scanInput);
  };

  // 一键标记正常在库
  const handleQuickMarkNormal = (item: AuditRecordItem) => {
    const updated = auditItems.map(i =>
      i.equipmentId === item.equipmentId
        ? {
            ...i,
            auditState: 'audited' as const,
            actualStatus: i.expectedStatus,
            auditedAt: new Date().toLocaleString('zh-CN'),
            auditor: currentUser?.name || '崔工'
          }
        : i
    );
    saveAuditSession(updated);
    playBeep('success');
  };

  // 保存异常标记
  const handleSaveAbnormal = () => {
    if (!abnormalModalItem) return;
    const updated = auditItems.map(i =>
      i.equipmentId === abnormalModalItem.equipmentId
        ? {
            ...i,
            auditState: 'abnormal' as const,
            actualStatus: abnormalStatusSelected,
            abnormalNote: abnormalNoteInput.trim() || '实物盘点异常：未在原货位找到或外观损坏',
            auditedAt: new Date().toLocaleString('zh-CN'),
            auditor: currentUser?.name || '崔工'
          }
        : i
    );
    saveAuditSession(updated);
    setAbnormalModalItem(null);
    setAbnormalNoteInput('');
  };

  // 重置盘点会话
  const handleResetSession = () => {
    if (window.confirm('确定要清空当前盘点进度并重新开始全库盘点吗？')) {
      localStorage.removeItem('hospital_emergency_audit_session');
      const resetItems: AuditRecordItem[] = inventoryList.map(eq => ({
        equipmentId: eq.id,
        equipmentName: eq.name,
        model: eq.model,
        sn: eq.serialNumber,
        assetNumber: eq.assetNumber || eq.id,
        category: eq.category,
        location: eq.location || '应急库 A区',
        expectedStatus: eq.status === 'borrowed' ? 'borrowed' : eq.status === 'maintenance' ? 'maintenance' : 'available',
        actualStatus: eq.status === 'borrowed' ? 'borrowed' : eq.status === 'maintenance' ? 'maintenance' : 'available',
        auditState: 'unaudited',
        borrowDept: eq.department !== '医学工程保障中心' ? eq.department : undefined
      }));
      setAuditItems(resetItems);
      setRecentScannedItem(null);
    }
  };

  // 导出盘点差异报表 (TSV / CSV 格式)
  const handleExportAuditReport = () => {
    const totalCount = auditItems.length;
    const auditedCount = auditItems.filter(i => i.auditState === 'audited').length;
    const abnormalCount = auditItems.filter(i => i.auditState === 'abnormal').length;
    const unauditedCount = auditItems.filter(i => i.auditState === 'unaudited').length;

    const headers = [
      '资产编码',
      '设备名称',
      '规格型号',
      '序列号(SN)',
      '设备类别',
      '所属/借用科室',
      '应急库货位',
      '账面状态',
      '盘点结果',
      '核验时间',
      '盘点人',
      '异常备注说明'
    ];

    const rows = auditItems.map(item => {
      const stateText =
        item.auditState === 'audited'
          ? '✅ 盘点正常'
          : item.auditState === 'abnormal'
          ? '🔴 盘点异常'
          : '⚪ 未盘/待查';

      const statusMap = {
        available: '待命在库',
        borrowed: '借出在用',
        maintenance: '质控维护',
        loss: '疑似盘亏',
        relocated: '位置偏移'
      };

      return [
        item.assetNumber,
        item.equipmentName,
        item.model,
        item.sn,
        item.category,
        item.borrowDept || '医学工程保障中心',
        item.location,
        statusMap[item.expectedStatus] || item.expectedStatus,
        stateText,
        item.auditedAt || '未盘',
        item.auditor || '-',
        item.abnormalNote || '-'
      ].join('\t');
    });

    const summary = `# 应急医疗设备储备库盘点清册与差异分析表
# 盘点时间：${new Date().toLocaleString('zh-CN')}
# 盘点总数：${totalCount} 台 | 已盘正常：${auditedCount} 台 | 盘点异常：${abnormalCount} 台 | 待盘漏盘：${unauditedCount} 台
# 盘点人：${currentUser?.name || '医学工程保障中心值班组'}
`;

    const blob = new Blob([summary + '\n' + headers.join('\t') + '\n' + rows.join('\n')], {
      type: 'text/tab-separated-values;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `应急库实物盘点报表_${new Date().toISOString().slice(0, 10)}.tsv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 统计数据
  const totalCount = auditItems.length;
  const auditedCount = auditItems.filter(i => i.auditState === 'audited').length;
  const abnormalCount = auditItems.filter(i => i.auditState === 'abnormal').length;
  const unauditedCount = auditItems.filter(i => i.auditState === 'unaudited').length;
  const progressPercent = totalCount > 0 ? Math.round(((auditedCount + abnormalCount) / totalCount) * 100) : 0;

  // 货区分组
  const partitions = ['全部货区', ...Array.from(new Set(auditItems.map(i => i.location)))];

  // 筛选过滤
  const filteredList = auditItems.filter(item => {
    if (filterMode !== 'all' && item.auditState !== filterMode) return false;
    if (selectedPartition !== '全部货区' && item.location !== selectedPartition) return false;
    if (searchKey.trim()) {
      const q = searchKey.toLowerCase();
      return (
        item.equipmentName.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.sn.toLowerCase().includes(q) ||
        item.assetNumber.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 md:p-5">
      <div className="bg-white rounded-xl max-w-6xl w-full h-[92vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col border border-slate-200">
        
        {/* 1. 顶部 Header */}
        <div className="p-3.5 md:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm md:text-base text-white tracking-tight flex items-center gap-2">
                  <span>应急储备库实物扫码盘点工作站</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    24H 动态账实核对
                  </span>
                </h3>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                支持手机/扫码枪连续扫码、PDA扫描枪直连、货位批量对账及差异异常标记
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-md transition cursor-pointer text-xs flex items-center gap-1 ${
                soundEnabled ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
              }`}
              title={soundEnabled ? '已开启扫码提示音' : '已静音'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-300" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleExportAuditReport}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">导出盘点清册</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md hover:bg-white/20 flex items-center justify-center text-white text-lg cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. 扫码录入与即时核对看板 (核心交互区) */}
        <div className="bg-slate-900 px-4 py-3.5 border-b border-slate-800 text-white shrink-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            
            {/* 扫码输入框与触发器 */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <form onSubmit={handleScanSubmit} className="flex-1 relative flex items-center">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="👉 请用扫码枪直接扫码，或输入SN/资产编号按回车 (如: MED-2026-EMG-01)..."
                  className="w-full pl-9 pr-20 py-2 bg-slate-800 border border-cyan-500/50 rounded-lg text-xs font-mono text-cyan-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition"
                  autoFocus
                />
                <QrCode className="w-4 h-4 text-cyan-400 absolute left-3 pointer-events-none" />
                <button
                  type="submit"
                  className="absolute right-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-bold transition cursor-pointer"
                >
                  确认核验
                </button>
              </form>

              {/* 模拟摄像头扫码开关 */}
              <button
                type="button"
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border ${
                  isCameraActive
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-cyan-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>{isCameraActive ? '关闭摄像头' : '手机/网页扫码'}</span>
              </button>
            </div>

            {/* 盘点进度指标条 */}
            <div className="lg:col-span-5 flex items-center justify-between gap-3 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    <span>盘点完成度:</span>
                    <strong className="text-cyan-300 font-mono text-sm">{progressPercent}%</strong>
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    已核验 <strong className="text-emerald-400">{auditedCount + abnormalCount}</strong> / {totalCount} 台
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetSession}
                className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                title="重新开始盘点"
              >
                <RefreshCw className="w-3 h-3" />
                <span>重置</span>
              </button>
            </div>

          </div>

          {/* 模拟摄像头取景框 */}
          {isCameraActive && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 flex flex-col md:flex-row items-center gap-4 animate-in fade-in duration-150">
              <div className="relative w-48 h-36 bg-slate-900 rounded-md border-2 border-dashed border-cyan-500 flex items-center justify-center overflow-hidden shrink-0">
                <div className="absolute inset-x-0 h-0.5 bg-cyan-400 animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-cyan-500" />
                <div className="text-center p-2 text-slate-400 text-[11px]">
                  <Camera className="w-8 h-8 text-cyan-400/60 mx-auto mb-1 animate-bounce" />
                  <span>摄像头对准设备二维码</span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 text-xs text-slate-300">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>快捷扫码模拟器（支持点击快速核销）:</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  可在下方列表中直接点击某台设备的【扫码核销】或直接使用外接 USB/蓝牙扫码枪对准设备机身贴纸。
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {auditItems.filter(i => i.auditState === 'unaudited').slice(0, 4).map(item => (
                    <button
                      key={item.equipmentId}
                      type="button"
                      onClick={() => processBarcodeScan(item.assetNumber)}
                      className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-200 rounded text-[11px] font-mono transition cursor-pointer flex items-center gap-1"
                    >
                      <span>模拟扫码: {item.equipmentName.slice(0, 6)}..</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 最新扫码核销反馈卡片 */}
          {recentScannedItem && (
            <div className={`mt-2.5 p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150 ${
              recentScannedItem.status === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                : recentScannedItem.status === 'already'
                ? 'bg-blue-950/80 border-blue-500/80 text-blue-200'
                : 'bg-rose-950/80 border-rose-500/80 text-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                {recentScannedItem.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : recentScannedItem.status === 'already' ? (
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">{recentScannedItem.msg}</span>
                  <span className="ml-2 font-mono text-[11px] opacity-80">
                    SN: {recentScannedItem.item.sn} | 编号: {recentScannedItem.item.assetNumber}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRecentScannedItem(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 3. 筛选与状态统计切换栏 */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          {/* 状态分类标签 */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>全部在册清单</span>
              <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-800">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('audited')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'audited'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>✅ 已核验正常</span>
              <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                {auditedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('unaudited')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'unaudited'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>⏳ 待核验 (未盘)</span>
              <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                {unauditedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('abnormal')}
              className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'abnormal'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>🔴 盘点异常</span>
              <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                {abnormalCount}
              </span>
            </button>
          </div>

          {/* 右侧货区筛选与关键字搜索 */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPartition}
              onChange={(e) => setSelectedPartition(e.target.value)}
              className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-100 cursor-pointer"
            >
              {partitions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="搜索名称/型号/SN..."
                className="pl-8 pr-6 py-1.5 bg-white border border-slate-200 rounded-md text-xs w-40 sm:w-48 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-100"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              {searchKey && (
                <button
                  onClick={() => setSearchKey('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* 4. 盘点清单数据表格 */}
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-slate-50/50 scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px] font-semibold sticky top-0 z-10 shadow-2xs select-none">
              <tr>
                <th className="py-2.5 px-3 min-w-[220px]">设备名称 / 规格型号 / SN</th>
                <th className="py-2.5 px-3 min-w-[120px]">库房货位 / 分区</th>
                <th className="py-2.5 px-3 min-w-[130px]">账面状态 / 所属</th>
                <th className="py-2.5 px-3 min-w-[140px]">盘点状态</th>
                <th className="py-2.5 px-3 min-w-[160px]">核验时间 / 盘点人</th>
                <th className="py-2.5 px-3 text-right min-w-[180px]">盘点核销操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <QrCode className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <div className="text-xs font-semibold text-slate-600">未检索到匹配的应急库在册设备</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">请更换筛选条件或扫码新增</div>
                  </td>
                </tr>
              ) : (
                filteredList.map(item => {
                  const equip = inventoryList.find(e => e.id === item.equipmentId);

                  return (
                    <tr
                      key={item.equipmentId}
                      className={`hover:bg-slate-50 transition ${
                        item.auditState === 'audited'
                          ? 'bg-emerald-50/30'
                          : item.auditState === 'abnormal'
                          ? 'bg-rose-50/40'
                          : ''
                      }`}
                    >
                      {/* 设备名称与缩略图 */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded bg-slate-900 overflow-hidden shrink-0 border border-slate-200">
                            <img
                              src={getEquipmentPhoto(equip)}
                              alt={item.equipmentName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{item.equipmentName}</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-normal">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              型号: {item.model} · SN: {item.sn}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              资产编码: {item.assetNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 库房货位 */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1 font-semibold text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 w-fit">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          <span>{item.location}</span>
                        </div>
                      </td>

                      {/* 账面状态 */}
                      <td className="py-2 px-3">
                        <div className="space-y-0.5">
                          {item.expectedStatus === 'available' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                              🟢 库房待命 (现货)
                            </span>
                          ) : item.expectedStatus === 'borrowed' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 inline-block">
                              🟡 借出在用 ({item.borrowDept || '临床科室'})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 inline-block">
                              🟣 维护质控中
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 盘点状态 */}
                      <td className="py-2 px-3">
                        {item.auditState === 'audited' ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>已盘正常</span>
                          </div>
                        ) : item.auditState === 'abnormal' ? (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[11px] shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>盘点异常</span>
                            </div>
                            {item.abnormalNote && (
                              <div className="text-[10px] text-rose-700 font-medium truncate max-w-[150px]" title={item.abnormalNote}>
                                {item.abnormalNote}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[11px] border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>待核验 (未盘)</span>
                          </div>
                        )}
                      </td>

                      {/* 核验时间与盘点人 */}
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {item.auditedAt ? (
                          <div>
                            <div className="text-slate-800 font-semibold">{item.auditedAt}</div>
                            <div className="text-[10px] text-slate-400 font-sans">核验人: {item.auditor}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 盘点操作区 */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 快速扫码核销按钮 */}
                          <button
                            type="button"
                            onClick={() => processBarcodeScan(item.assetNumber)}
                            className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="模拟扫码核销"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>扫码核对</span>
                          </button>

                          {/* 快速标为正常 */}
                          <button
                            type="button"
                            onClick={() => handleQuickMarkNormal(item)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium transition cursor-pointer"
                            title="手动确认正常"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                          </button>

                          {/* 异常登记 */}
                          <button
                            type="button"
                            onClick={() => {
                              setAbnormalModalItem(item);
                              setAbnormalNoteInput(item.abnormalNote || '');
                              setAbnormalStatusSelected(item.actualStatus);
                            }}
                            className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-medium transition cursor-pointer"
                            title="登记账实不符/损坏等异常"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. 底部总结与快捷标签打印区 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-600 flex items-center gap-2">
            <span>💡 <strong>高效盘点技巧</strong>：将外接扫码枪插入电脑 USB，点击顶部输入框后连续扫描机身标签即可实现全自动秒级过机对账！</span>
          </div>

          <div className="flex items-center gap-2">
            {onPrintQrLabels && (
              <button
                type="button"
                onClick={() => onPrintQrLabels(inventoryList)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>批量补打应急设备资产标签</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition cursor-pointer"
            >
              完成盘点
            </button>
          </div>
        </div>

      </div>

      {/* 异常标记弹窗 */}
      {abnormalModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-4 space-y-3 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>登记盘点异常 · 账实差异</span>
              </h4>
              <button onClick={() => setAbnormalModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>设备名称：<strong className="text-slate-900">{abnormalModalItem.equipmentName}</strong></div>
              <div>型号/SN：<span className="font-mono">{abnormalModalItem.model} ({abnormalModalItem.sn})</span></div>
              <div>原定货位：<span className="font-mono text-blue-800">{abnormalModalItem.location}</span></div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">异常原因分类:</label>
              <select
                value={abnormalStatusSelected}
                onChange={(e) => setAbnormalStatusSelected(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="loss">🔴 实物缺失 / 疑似盘亏</option>
                <option value="relocated">🟡 存放位置偏移 (不在原货区)</option>
                <option value="maintenance">🟣 设备故障/外观破损待送修</option>
                <option value="borrowed">🔵 账面在库但实物已借出(补办手续)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">详细异常情况说明:</label>
              <textarea
                rows={3}
                value={abnormalNoteInput}
                onChange={(e) => setAbnormalNoteInput(e.target.value)}
                placeholder="例如：原定A区货架未找到主机，现场护士反馈紧急借至发热门诊使用尚未补单..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAbnormalModalItem(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAbnormal}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold"
              >
                保存异常记录
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
