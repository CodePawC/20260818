import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Wrench,
  X,
  Phone,
  User,
  Building2,
  Clock,
  ArrowRight,
  Volume2,
  VolumeX,
  CheckCircle2,
  FileText,
  Flame,
  QrCode,
  Eye
} from 'lucide-react';
import { MedicalEquipment } from '../types';

export interface RepairAlertData {
  id: string;
  timestamp: string;
  workOrderId: string;
  equipmentId: string;
  equipmentName: string;
  department: string;
  sn?: string;
  reporterName: string;
  reporterPhone: string;
  faultDescription: string;
  urgency: 'P1' | 'P2' | 'P3';
  source: string;
  isRead: boolean;
  rawRecordNo?: string;
  photoUrl?: string;
}

interface RepairAlertPopupModalProps {
  alert: RepairAlertData | null;
  onClose: () => void;
  onFastDispatch: (device?: MedicalEquipment) => void;
  onViewLogs: () => void;
  onViewEquipmentDetail?: (device: MedicalEquipment) => void;
  onViewRepairDetail?: (alert: RepairAlertData) => void;
  equipmentList?: MedicalEquipment[];
}

export const RepairAlertPopupModal: React.FC<RepairAlertPopupModalProps> = ({
  alert,
  onClose,
  onFastDispatch,
  onViewLogs,
  onViewEquipmentDetail,
  onViewRepairDetail,
  equipmentList = []
}) => {
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // 播放医院终端提示音 (Web Audio API 合成，无需外部音频文件)
  const playAlertChime = () => {
    if (isSoundMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;

      // 音调 1: 880Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // 音调 2: 1320Hz (E6) 延迟 0.12s
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      gain2.gain.setValueAtTime(0.22, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      // 忽略音频自动播放策略拦截
    }
  };

  useEffect(() => {
    if (alert && !alert.isRead) {
      playAlertChime();
    }
  }, [alert?.id]);

  if (!alert) return null;

  const matchedDevice = equipmentList.find(e => e.id === alert.equipmentId);
  const isP1 = alert.urgency === 'P1';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[440px] animate-in slide-in-from-top-4 fade-in duration-300 drop-shadow-2xl">
      <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-all ${
        isP1 
          ? 'bg-slate-900 border-rose-500 ring-2 ring-rose-500/30' 
          : 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/30'
      }`}>
        
        {/* 顶部警报状态横幅条 */}
        <div className={`px-4 py-2.5 flex items-center justify-between text-white ${
          isP1 ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-red-700' : 'bg-gradient-to-r from-amber-600 to-orange-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-1.5 font-bold text-xs tracking-wide">
              <QrCode className="w-3.5 h-3.5" />
              <span>【新报修提醒】收到草料二维码现场报修！</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="p-1 text-white/80 hover:text-white rounded transition cursor-pointer"
              title={isSoundMuted ? '已静音' : '声音提醒已开启'}
            >
              {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded transition cursor-pointer"
              title="关闭提醒"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容主体区 */}
        <div className="p-4 text-xs text-slate-200 space-y-3">
          
          {/* 标题与单号 */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-white tracking-tight">
                  {alert.equipmentName}
                </h4>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                  isP1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {alert.urgency} · {isP1 ? '特急 15分钟' : '紧急 30分钟'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                <span>工单号: <strong className="text-teal-300">{alert.workOrderId}</strong></span>
                <span>·</span>
                <span>草料单号: {alert.rawRecordNo || '扫码直报'}</span>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 shrink-0 font-medium bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
              {alert.timestamp}
            </span>
          </div>

          {/* 科室与报修人信息 */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px]">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[10px]">报修科室:</span>
              <div className="font-bold text-slate-200 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-teal-400" />
                <span className="truncate">{alert.department}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[10px]">现场报修人员:</span>
              <div className="font-bold text-slate-200 flex items-center gap-1">
                <User className="w-3 h-3 text-indigo-400" />
                <span className="truncate">{alert.reporterName || '医护人员'}</span>
                {alert.reporterPhone && (
                  <span className="font-mono text-[10px] text-slate-400 ml-1">({alert.reporterPhone})</span>
                )}
              </div>
            </div>
          </div>

          {/* 故障现象描述 */}
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] font-semibold block">故障现象表现:</span>
            <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-200 text-xs leading-relaxed font-medium">
              {alert.faultDescription}
            </div>
          </div>

          {/* 台账匹配状态提示 */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-1.5">
              {matchedDevice ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">台账已精准关联: {matchedDevice.id}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300 font-medium">设备待人工核验关联</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onViewLogs}
              className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5 cursor-pointer hover:underline text-[11px]"
            >
              <span>查看接口日志</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        {/* 底部动作操作栏 */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            稍后处置
          </button>

          <div className="flex items-center gap-2">
            {onViewRepairDetail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewRepairDetail(alert);
                }}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                title="查看报修工单完整详情、排查建议与现场报修凭据"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>报修详情</span>
              </button>
            )}

            {matchedDevice && onViewEquipmentDetail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewEquipmentDetail(matchedDevice);
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-slate-400" />
                <span>设备档案</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onFastDispatch(matchedDevice);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>立即派工抢修</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
