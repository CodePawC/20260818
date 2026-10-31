import React, { useState } from 'react';
import {
  X,
  Wrench,
  Clock,
  Building2,
  User,
  Phone,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bot,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  Sparkles,
  Camera,
  ChevronRight,
  Stethoscope,
  Layers,
  MapPin,
  Calendar,
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { MedicalEquipment } from '../types';

export interface RepairReportDetailData {
  id?: string;
  workOrderId?: string;
  recordNo?: string;
  recordId?: string | number;
  timestamp?: string;
  faultDate?: string;
  equipmentId?: string | null;
  equipmentName?: string;
  equipmentSn?: string;
  model?: string;
  category?: string;
  department?: string;
  location?: string;
  reporterName?: string;
  reporterPhone?: string;
  faultDescription?: string;
  photoUrl?: string;
  videoUrl?: string;
  urgency?: 'P1' | 'P2' | 'P3';
  source?: string;
  status?: string;
  technician?: string;
  cost?: number;
  partsReplaced?: string;
  resolution?: string;
  matchStrategy?: string;
  errorMessage?: string | null;
  rawPayload?: any;
}

interface RepairReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RepairReportDetailData | null;
  onFastDispatch?: (device?: MedicalEquipment) => void;
  onViewEquipmentDetail?: (device: MedicalEquipment) => void;
  onViewRawPayload?: (payload: any) => void;
  equipmentList?: MedicalEquipment[];
}

export const RepairReportDetailModal: React.FC<RepairReportDetailModalProps> = ({
  isOpen,
  onClose,
  data,
  onFastDispatch,
  onViewEquipmentDetail,
  onViewRawPayload,
  equipmentList = []
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedWorkOrder, setCopiedWorkOrder] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  // 寻找匹配的在册设备
  const matchedDevice = equipmentList.find(e => 
    (data.equipmentId && e.id === data.equipmentId) ||
    (data.equipmentSn && e.sn && e.sn.toLowerCase() === data.equipmentSn.toLowerCase()) ||
    (data.equipmentName && e.name.includes(data.equipmentName.replace(/^[^-]+-/, '')))
  ) || null;

  const displayWorkOrder = data.workOrderId || data.id || `WO-CL-${Date.now().toString().slice(-6)}`;
  const displayRecordNo = data.recordNo || `REC-${Date.now().toString().slice(-8)}`;
  const displayTime = data.timestamp || data.faultDate || new Date().toISOString().replace('T', ' ').slice(0, 19);
  const urgency = data.urgency || (data.faultDescription?.includes('报警') || data.faultDescription?.includes('ICU') ? 'P1' : 'P2');
  const isP1 = urgency === 'P1';

  // AI 智能初判与排查建议推导
  const aiInsights = (() => {
    const desc = (data.faultDescription || '').toLowerCase();
    if (desc.includes('血氧') || desc.includes('spo2') || desc.includes('导联') || desc.includes('心电') || desc.includes('探头')) {
      return {
        type: '传感器接插件与信号采集通道异常',
        advice: [
          '1. 请首先检查 SpO2 探头金手指接头是否有氧化或松动，重新插拔并按紧锁扣',
          '2. 使用万用表排查 5 导联心电电缆内部线芯是否存在折断断路（阻抗超限报警常见诱因）',
          '3. 临床危重患者床旁紧急处置：请立即启用科室备用病人监护仪或从应急储备库借调'
        ],
        parts: '迈瑞原厂成人/小儿血氧探头、5导联一体化心电电缆',
        slaMinutes: 15
      };
    }
    if (desc.includes('ct') || desc.includes('机架') || desc.includes('逆变') || desc.includes('打火') || desc.includes('高压')) {
      return {
        type: '高压发生器逆变打火及机架旋转通讯总线自检受阻',
        advice: [
          '1. 请进场工程师切断系统主动力高压，执行机架滑环碳刷磨损与粉尘清洁',
          '2. 调阅后台服务软件 ERR-7402 错误码堆栈，复位高压发生器逆变驱动模块',
          '3. 若打火重复出现，需测量球管灯丝发射特性及逆变板 IGBT 击穿电阻'
        ],
        parts: '西门子原厂逆变板驱动组件、机架碳刷套件',
        slaMinutes: 30
      };
    }
    if (desc.includes('光源') || desc.includes('内窥镜') || desc.includes('镜体') || desc.includes('氙气')) {
      return {
        type: '内窥镜冷光源照明系统与高压点火触发器寿命预警',
        advice: [
          '1. 检查冷光源氙灯计时器是否已超过 500 小时额定工作寿命',
          '2. 检查内镜主机光纤插孔是否有异物或透镜油污遮挡，使用无水乙醇清洁端面',
          '3. 手术室术前备机：立即从外协备用机库调用奥林巴斯 CV-290 备用主机'
        ],
        parts: '奥林巴斯 MD-631 300W 专用氙气灯泡、冷光源聚光透镜',
        slaMinutes: 30
      };
    }
    return {
      type: '设备电气控制与常规机械磨损故障',
      advice: [
        '1. 到场后首先核对出厂编号与安全接地状态，测量工作供电电压是否在 220V±10% 范围',
        '2. 检查外接电源适配器与保险丝熔断状态，排查现场误操作与参数设置漂移',
        '3. 排除故障后需进行电气安全检测与现场试机方可交付临床科室验签销单'
      ],
      parts: '原厂标准检修备品与易损易耗件',
      slaMinutes: 60
    };
  })();

  const handleCopyPhone = () => {
    if (data.reporterPhone) {
      navigator.clipboard.writeText(data.reporterPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleCopyWorkOrder = () => {
    navigator.clipboard.writeText(displayWorkOrder);
    setCopiedWorkOrder(true);
    setTimeout(() => setCopiedWorkOrder(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* ================= 1. 顶部工单状态横幅 (Header) ================= */}
        <div className={`px-5 py-4 flex items-center justify-between text-white shrink-0 ${
          isP1 
            ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 border-b border-rose-700/50' 
            : 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border-b border-teal-700/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isP1 ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' : 'bg-teal-500/20 text-teal-300 border-teal-400/40'
            }`}>
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                  <span>现场报修单据详情</span>
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${
                  isP1 
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400/50' 
                    : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                }`}>
                  {urgency} 响应 · 限时 {aiInsights.slaMinutes} 分钟
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>草料二维码扫码直达</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-300 font-mono flex-wrap">
                <span className="flex items-center gap-1">
                  <span>工单号:</span>
                  <strong className="text-teal-300 font-bold">{displayWorkOrder}</strong>
                  <button
                    type="button"
                    onClick={handleCopyWorkOrder}
                    className="p-0.5 text-slate-400 hover:text-white cursor-pointer"
                    title="复制工单号"
                  >
                    {copiedWorkOrder ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
                <span>·</span>
                <span>草料单号: {displayRecordNo}</span>
                <span>·</span>
                <span>填报时间: {displayTime}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= 2. 主体信息滚动区 (Body) ================= */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* A. 核心信息矩阵 (报修机具 / 科室 / 现场报修人) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* 报修机具卡片 */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  <span>报修机具</span>
                </span>
                {matchedDevice ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    台账精准命中
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    待人工关联
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900 leading-snug">
                  {data.equipmentName || matchedDevice?.name || '未知医疗设备'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  出厂SN: <strong className="text-slate-800">{data.equipmentSn || matchedDevice?.sn || '未提供'}</strong>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  资产编号: <strong className="text-indigo-700">{matchedDevice?.id || data.equipmentId || '--'}</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  型号: {matchedDevice?.model || data.model || '常规标准机型'}
                </div>
              </div>
            </div>

            {/* 报修科室与地点 */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>报修科室与地点</span>
                </span>
                <span className="text-2xs text-slate-400">现场扫码上报</span>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-1">
                  <span>{data.department || matchedDevice?.department || '临床科室'}</span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{data.location || (matchedDevice ? `${matchedDevice.building || '综合楼'} · ${matchedDevice.floor || '3'}层` : '科室现场')}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  机构: 五莲县人民医院
                </div>
                <div className="text-[11px] text-slate-500">
                  管理人员: {matchedDevice?.manager || '科室护士长 / 设备责任人'}
                </div>
              </div>
            </div>

            {/* 现场报修人联系方式 */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-rose-600" />
                  <span>现场报修人员</span>
                </span>
                <span className="text-2xs text-slate-400 font-mono">微信扫码身份</span>
              </div>
              <div className="space-y-1.5">
                <div className="font-bold text-sm text-slate-900">
                  {data.reporterName || '医护人员'}
                </div>
                {data.reporterPhone ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {data.reporterPhone}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPhone ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs">未留手机号码</div>
                )}
                <div className="text-[10px] text-slate-500 leading-tight">
                  发生故障时第一时间使用手机扫码发起，请工程师立即电话联系确认故障现场情况。
                </div>
              </div>
            </div>

          </div>

          {/* B. 故障现象与现场主诉 (突出显示) */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>现场故障表现与医护主诉</span>
              </span>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                {urgency === 'P1' ? '特级高危 · 立即到场' : '紧急抢修'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed bg-white/90 p-3 rounded-lg border border-rose-200/80 shadow-2xs">
              {data.faultDescription || '设备发生故障异常，扫码直接报修。'}
            </p>

            {/* 现场拍摄照片 */}
            {data.photoUrl && (
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>现场拍照存证凭据:</span>
                </span>
                <div className="inline-block relative rounded-xl overflow-hidden border border-slate-300 shadow-xs group cursor-pointer" onClick={() => setActivePhotoModal(data.photoUrl!)}>
                  <img
                    src={data.photoUrl}
                    alt="现场故障照片"
                    className="w-48 h-32 object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Eye className="w-4 h-4" />
                    <span>点击放大照片</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* C. AI 智能辅助分诊与排查指导 */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-indigo-950">
                  AI 智能分诊诊断与医学工程处置建议
                </span>
              </div>
              <span className="text-2xs font-bold font-mono text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                {aiInsights.type}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              {aiInsights.advice.map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-1.5 border-t border-indigo-100 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
              <div>
                <span className="text-slate-400">预估所需配件: </span>
                <strong className="text-indigo-900 font-semibold">{aiInsights.parts}</strong>
              </div>
              <div>
                <span className="text-slate-400">建议派工组: </span>
                <span className="font-semibold text-slate-800">
                  {data.department?.includes('重症') || data.department?.includes('ICU') ? '急救生命支持医工组' : '常规医疗器械保障组'}
                </span>
              </div>
            </div>
          </div>

          {/* D. 报修流转全时序闭环追踪 (5步流程) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                <span>草料扫码轻量化报修至院内工单全时序闭环</span>
              </span>
              <span className="text-2xs text-slate-400 font-mono">
                公有云活码前端 + 阿里云专线数据直通 + 院内主数据映射
              </span>
            </div>

            {/* 步骤条 */}
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {/* 节点 1 */}
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                  ✓
                </div>
                <div className="text-[11px] font-bold text-emerald-900">1. 扫码填报</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{displayTime.slice(11, 16)}</div>
              </div>

              {/* 节点 2 */}
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-300">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                  ✓
                </div>
                <div className="text-[11px] font-bold text-emerald-900">2. 专线入库对账</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">+38ms</div>
              </div>

              {/* 节点 3 */}
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-400 ring-1 ring-indigo-300">
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mx-auto mb-1 animate-pulse">
                  3
                </div>
                <div className="text-[11px] font-bold text-indigo-900">3. 派工响应</div>
                <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">待接单</div>
              </div>

              {/* 节点 4 */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 opacity-60">
                <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                  4
                </div>
                <div className="text-[11px] font-bold text-slate-700">4. 现场检修试机</div>
                <div className="text-[10px] text-slate-400 mt-0.5">待处置</div>
              </div>

              {/* 节点 5 */}
              <div className="p-2 rounded-lg bg-white border border-slate-200 opacity-60">
                <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center justify-center mx-auto mb-1">
                  5
                </div>
                <div className="text-[11px] font-bold text-slate-700">5. 临床验签销单</div>
                <div className="text-[10px] text-slate-400 mt-0.5">待验签</div>
              </div>
            </div>
          </div>

        </div>

        {/* ================= 3. 底部快捷操作条 (Footer) ================= */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {data.rawPayload && onViewRawPayload && (
              <button
                type="button"
                onClick={() => onViewRawPayload(data.rawPayload)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                title="查看原始 JSON 报文"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>查看原始报文</span>
              </button>
            )}

            {matchedDevice && onViewEquipmentDetail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewEquipmentDetail(matchedDevice);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>查看设备台账档案</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
            >
              关闭
            </button>

            {onFastDispatch && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFastDispatch(matchedDevice || undefined);
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>立即派工抢修</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 放大照片弹窗 */}
      {activePhotoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-60 animate-in fade-in" onClick={() => setActivePhotoModal(null)}>
          <div className="relative max-w-2xl max-h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={activePhotoModal} alt="放大照片" className="w-full h-auto max-h-[85vh] object-contain" />
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
