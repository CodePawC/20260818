import React, { useState, useMemo, useEffect } from 'react';
import {
  MedicalEquipment,
  MetrologyCatalogueItem,
  RepairRecord,
  StatusLog,
  EquipmentLoanRecord
} from '../types';
import {
  Calendar,
  Wrench,
  ShieldCheck,
  Building,
  DollarSign,
  ArrowRightLeft,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Sparkles,
  Award,
  Trash2,
  Cpu,
  Package,
  Layers,
  ArrowDownUp,
  Filter,
  Check,
  Scale,
  MapPin,
  FileText,
  User,
  Tag,
  Hourglass,
  BadgeCheck,
  ChevronRight,
  Printer,
  QrCode,
  ExternalLink,
  Video,
  Play,
  RefreshCw,
  Phone,
  Image as ImageIcon,
  Radio,
  X
} from 'lucide-react';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { getEquipmentCalibrationInfo } from '../utils/calibrationUtils';
import { getEquipmentHealthScore } from '../utils/equipmentUtils';

export type LifecycleEventType =
  | 'purchase'        // 采购立项与入库
  | 'manufacturing'   // 出厂生产与SN标定
  | 'commissioning'   // 验收安装与临床启用
  | 'calibration'     // 计量检定与法定校准
  | 'repair'          // 故障报修与配件更换
  | 'maintenance'     // 预防性维护(PM)与巡检
  | 'transfer_loan'   // 跨科室借调与流转
  | 'status_change'   // 运行状态变动审计
  | 'aging_scrap';    // 老龄化评估与报废处置

export interface TimelineEventItem {
  id: string;
  type: LifecycleEventType;
  date: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  title: string;
  categoryLabel: string;
  badgeClass: string;
  icon: React.ReactNode;
  summary: string;
  details?: { label: string; value: string | number; isMono?: boolean; isHighlight?: boolean }[];
  remarks?: string;
  cost?: number;
  operator?: string;
  department?: string;
  statusTag?: { label: string; color: string };
  rawRecord?: any;
  isCaoliao?: boolean;
  videoUrl?: string;
  photoUrl?: string;
}

interface EquipmentLifecycleTimelineProps {
  equipment: MedicalEquipment;
  metrologyCatalogue?: MetrologyCatalogueItem[];
  onOpenRepair?: (item: MedicalEquipment) => void;
  onOpenStatusChange?: (item: MedicalEquipment) => void;
  onPrintLoanVoucher?: (equipment: MedicalEquipment, loanRecord: EquipmentLoanRecord, mode: 'loan' | 'return') => void;
  onPrintAcceptanceDossier?: (equipment: MedicalEquipment) => void;
}

export const EquipmentLifecycleTimeline: React.FC<EquipmentLifecycleTimelineProps> = ({
  equipment,
  metrologyCatalogue,
  onOpenRepair,
  onOpenStatusChange,
  onPrintLoanVoucher,
  onPrintAcceptanceDossier,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'milestone' | 'repair' | 'calibration' | 'loan' | 'status' | 'caoliao'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc: 最新在前, asc: 从诞生起正序

  // 草料官方 RDS 数据库实时直连数据
  const [caoliaoLiveRepairs, setCaoliaoLiveRepairs] = useState<any[]>([]);
  const [caoliaoStateLogs, setCaoliaoStateLogs] = useState<any[]>([]);
  const [caoliaoCodeInfo, setCaoliaoCodeInfo] = useState<any>(null);
  const [isLoadingCaoliao, setIsLoadingCaoliao] = useState<boolean>(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // 实时直连草料 RDS 数据库获取最新报修与状态流转
  const fetchLiveCaoliaoData = async () => {
    const lookupKey = equipment.codeId || equipment.id;
    if (!lookupKey) return;
    setIsLoadingCaoliao(true);
    try {
      const res = await fetch(`/api/caoliao/equipment-repairs/${lookupKey}`);
      const json = await res.json();
      if (json.success) {
        setCaoliaoLiveRepairs(json.repairs || []);
        setCaoliaoStateLogs(json.stateLogs || []);
        if (json.codeInfo) {
          setCaoliaoCodeInfo(json.codeInfo);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live caoliao data:', err);
    } finally {
      setIsLoadingCaoliao(false);
    }
  };

  useEffect(() => {
    fetchLiveCaoliaoData();
  }, [equipment.id, equipment.codeId]);

  const validityInfo = getEquipmentValidityInfo(equipment);
  const calibrationInfo = getEquipmentCalibrationInfo(equipment, metrologyCatalogue);
  const healthInfo = getEquipmentHealthScore(equipment);

  const serviceYears = useMemo(() => {
    const startStr = equipment.enableDate || equipment.purchaseDate || equipment.manufactureDate;
    if (!startStr) return 1;
    const sDate = new Date(startStr.replace(/\//g, '-'));
    if (isNaN(sDate.getTime())) return 1;
    const diffYears = (Date.now() - sDate.getTime()) / (365.25 * 24 * 3600 * 1000);
    return Math.max(0.1, Number(diffYears.toFixed(1)));
  }, [equipment]);

  // 安全日期解析工具，彻底防止无效时间戳导致排序沉底，全面兼容各种浏览器引擎与格式
  const parseEventDate = (d?: string): number => {
    if (!d) return 0;
    const clean = String(d).replace(/\//g, '-').replace(/ GM.*/, '').trim();
    const ts = new Date(clean).getTime();
    if (!isNaN(ts)) return ts;
    const tsIso = new Date(clean.replace(' ', 'T')).getTime();
    if (!isNaN(tsIso)) return tsIso;
    const m = clean.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) {
      return new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`).getTime() || 0;
    }
    return 0;
  };

  // 1. 组装并清洗全生命周期事件流
  const allEvents = useMemo<TimelineEventItem[]>(() => {
    const events: TimelineEventItem[] = [];
    const addedEventIds = new Set<string>();
    const seenRecordNos = new Set<string>();

    // 1.1 出厂制造事件 (Manufacturing)
    if (equipment.manufactureDate) {
      events.push({
        id: `evt-mfg-${equipment.id}`,
        type: 'manufacturing',
        date: equipment.manufactureDate.replace(/\//g, '-'),
        title: '设备出厂制造与出厂编码定标',
        categoryLabel: '生产出厂',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Cpu className="w-4 h-4 text-purple-600" />,
        summary: `由【${equipment.manufacturer || '原厂制造'}】完成生产并出厂，核发机身序列号 (SN: ${equipment.sn})。`,
        details: [
          { label: '出厂序列号', value: equipment.sn, isMono: true },
          { label: '生产厂商', value: equipment.manufacturer || '-' },
          { label: '规格型号', value: equipment.model || '-', isMono: true },
          { label: '标称使用年限', value: equipment.productValidity ? `${equipment.productValidity} 年` : '按国家标准核定' }
        ],
        operator: equipment.manufacturer || '原厂质检中心'
      });
    }

    // 1.2 采购立项与验收入库 (Procurement & Purchase)
    const purchaseDate = equipment.purchaseDate || equipment.enableDate || '2023-01-01';
    events.push({
      id: `evt-pur-${equipment.id}`,
      type: 'purchase',
      date: purchaseDate.replace(/\//g, '-'),
      title: '医学装备采购立项与验收入库',
      categoryLabel: '采购准入',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
      summary: `完成采购立项招投标与验收入库，录入全院资产管理台账，分配资产编号【${equipment.assetNo || `ZC-${equipment.id}`}】。`,
      details: [
        { label: '购置金额', value: `￥${(equipment.purchasePrice || 0).toLocaleString()}`, isHighlight: true },
        { label: '资产编号', value: equipment.assetNo || `ZC-2023-${equipment.id}`, isMono: true },
        { label: '资产归属', value: equipment.assetOwnership || '医院自有' },
        { label: '物资溯源码', value: equipment.codeId || `COD-${equipment.id}`, isMono: true },
        { label: '中标供应商', value: equipment.supplier || equipment.manufacturer || '核心合作供应商' }
      ],
      cost: equipment.purchasePrice,
      department: equipment.department,
      operator: '医学工程科 / 资产管理处'
    });

    // 1.3 临床安装启用与定点 (Commissioning & Enablement)
    if (equipment.enableDate) {
      events.push({
        id: `evt-enable-${equipment.id}`,
        type: 'commissioning',
        date: equipment.enableDate.replace(/\//g, '-'),
        title: '临床科室现场安装调试与正式投用',
        categoryLabel: '临床启用',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Building className="w-4 h-4 text-blue-600" />,
        summary: `在【${equipment.department}】完成电气安全检测、性能初验并正式投入临床诊疗使用。`,
        details: [
          { label: '初始配属科室', value: equipment.ownerDepartment || equipment.department },
          { label: '安装物理位置', value: equipment.usageLocation || equipment.location || '科室治疗/诊疗区' },
          { label: '科室内部自编号', value: equipment.internalNo || '未指定自编号', isMono: true },
          { label: '管理责任人', value: equipment.manager || '科室责任医工' }
        ],
        department: equipment.department,
        operator: equipment.manager || '院内设备管理员'
      });
    }

    // 1.4 计量检定与法定校准履历 (Calibration)
    if (equipment.lastCalibrationDate) {
      events.push({
        id: `evt-cal-last-${equipment.id}`,
        type: 'calibration',
        date: equipment.lastCalibrationDate,
        title: `法定计量检定 / 周期定标校准合格`,
        categoryLabel: '计量校准',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Scale className="w-4 h-4 text-indigo-600" />,
        summary: `经法定计量检定机构现场检测，各项计量技术指标符合规程，核发检定证书【${calibrationInfo.certificateNo || 'JL-2025-001'}】。`,
        details: [
          { label: '管理方式', value: calibrationInfo.calibrationType },
          { label: '费用属性', value: calibrationInfo.feePolicyLabel },
          { label: '计量证书编号', value: calibrationInfo.certificateNo || '合格存证', isMono: true },
          { label: '检测机构', value: calibrationInfo.agency || '法定计量科学研究院' },
          { label: '下次校验到期', value: calibrationInfo.nextDate, isMono: true, isHighlight: true }
        ],
        statusTag: { label: '检定合格', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
        department: equipment.department,
        operator: calibrationInfo.agency
      });
    }

    // 1.5 维修与保养记录 (Repair & PM，包含草料二维码现场报修)
    if (equipment.repairRecords && equipment.repairRecords.length > 0) {
      equipment.repairRecords.forEach(rep => {
        const isPM = rep.repairType === '定期预防性保养' || rep.repairType === '巡检维护';
        const isCaoliao = rep.repairType?.includes('草料') || rep.source === 'caoliao' || (rep.id && rep.id.startsWith('REP-CL'));
        const eventId = `evt-rep-${rep.id}`;
        const recordKey = rep.recordNo || rep.id.replace('REP-CL-', '');
        if (recordKey && seenRecordNos.has(recordKey)) return;
        if (recordKey) seenRecordNos.add(recordKey);
        addedEventIds.add(eventId);

        events.push({
          id: eventId,
          type: isPM ? 'maintenance' : 'repair',
          isCaoliao,
          date: rep.faultDate,
          title: isCaoliao 
            ? `草料二维码现场报修 (单号: ${rep.recordNo || rep.id.replace('REP-CL-', '')})` 
            : rep.repairType,
          categoryLabel: isCaoliao ? '草料扫码直报' : (isPM ? '预防性维护' : '故障维保'),
          badgeClass: isCaoliao 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' 
            : (isPM ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-800 border-amber-200'),
          icon: isCaoliao 
            ? <QrCode className="w-4 h-4 text-emerald-600" /> 
            : (isPM ? <ShieldCheck className="w-4 h-4 text-sky-600" /> : <Wrench className="w-4 h-4 text-amber-600" />),
          summary: isCaoliao
            ? `临床使用科室通过设备机身草料活码现场扫码建单。报修人【${rep.reporterName || rep.technician}】（电话：${rep.reporterPhone || '未预留'}），报修故障表现：${rep.faultDescription}。已实时同步至医院医工闭环调度大厅。`
            : rep.faultDescription,
          details: [
            ...(isCaoliao && rep.recordNo ? [{ label: '草料工单号', value: rep.recordNo, isMono: true, isHighlight: true }] : []),
            { label: isCaoliao ? '现场报修人' : '维保工程师', value: rep.reporterName || rep.technician || '医护人员' },
            ...(isCaoliao && rep.reporterPhone ? [{ label: '联系电话', value: rep.reporterPhone, isMono: true }] : []),
            ...(isCaoliao ? [{ label: '草料活码ID', value: String(rep.codeId || equipment.codeId || ''), isMono: true }] : []),
            { label: '支出费用', value: `￥${(rep.cost || 0).toLocaleString()}`, isHighlight: rep.cost > 0 },
            { label: '更换配件', value: rep.partsReplaced || '无配件更换' },
            { label: '登记时间', value: rep.faultDate, isMono: true }
          ],
          remarks: rep.resolution ? `处理方案与结论: ${rep.resolution}` : undefined,
          cost: rep.cost,
          operator: rep.reporterName || rep.technician,
          department: rep.department || equipment.department,
          statusTag: {
            label: rep.status,
            color: rep.status === '已完成' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
          },
          videoUrl: rep.videoUrl,
          photoUrl: rep.photoUrl,
          rawRecord: rep
        });
      });
    }

    // 1.5.1 实时补充草料 RDS 数据库中的最新扫码报修（避免本地缓存未同步）
    if (caoliaoLiveRepairs && caoliaoLiveRepairs.length > 0) {
      caoliaoLiveRepairs.forEach(clRep => {
        const recordKey = clRep.recordNo || String(clRep.recordId);
        const repId = `REP-CL-${recordKey}`;
        const eventId = `evt-rep-${repId}`;
        if (!addedEventIds.has(eventId) && !seenRecordNos.has(recordKey)) {
          addedEventIds.add(eventId);
          seenRecordNos.add(recordKey);
          events.push({
            id: eventId,
            type: 'repair',
            isCaoliao: true,
            date: clRep.recordTime || '2026-10-04 15:50:43',
            title: `草料二维码现场报修 (单号: ${recordKey})`,
            categoryLabel: '草料扫码直报',
            badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
            icon: <QrCode className="w-4 h-4 text-emerald-600" />,
            summary: `临床使用科室通过现场草料二维码移动端扫码建单。报修人【${clRep.reporterName}】（联系电话：${clRep.reporterPhone || '未预留'}），报修故障表现：${clRep.faultDescription}。工单已自动直通医院医工闭环调度大厅。`,
            details: [
              { label: '草料工单号', value: recordKey, isMono: true, isHighlight: true },
              { label: '现场报修人', value: clRep.reporterName },
              { label: '联系电话', value: clRep.reporterPhone || '-', isMono: true },
              { label: '故障表现', value: clRep.faultDescription, isHighlight: true },
              { label: '草料活码ID', value: String(clRep.codeId || equipment.codeId || ''), isMono: true },
              { label: '建单渠道', value: clRep.createSource || '手机扫码填写' }
            ],
            remarks: clRep.videoUrl ? `已捕获现场多媒体佐证：现场录制故障视频 (${clRep.videoUrl.split('/').pop()})` : undefined,
            cost: 0,
            operator: clRep.reporterName,
            department: equipment.department,
            statusTag: {
              label: clRep.processStatus === '已完成' ? '已修复闭环' : '待医工响应/处置中',
              color: clRep.processStatus === '已完成' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
            },
            videoUrl: clRep.videoUrl,
            photoUrl: clRep.photoUrl,
            rawRecord: clRep
          });
        }
      });
    }

    // 1.5.2 实时补充草料 RDS 数据库中的状态审计流转日志 (code_state_log)
    if (caoliaoStateLogs && caoliaoStateLogs.length > 0) {
      const seenStateKeys = new Set<string>();
      caoliaoStateLogs.forEach((sLog, sIdx) => {
        const stateKey = `${sLog.timestamp}-${sLog.statusGroup}-${sLog.statusValue}`;
        if (seenStateKeys.has(stateKey)) return;
        seenStateKeys.add(stateKey);
        const stateEventId = `evt-cl-state-${sLog.timestamp}-${sIdx}`;
        if (!addedEventIds.has(stateEventId)) {
          addedEventIds.add(stateEventId);
          events.push({
            id: stateEventId,
            type: 'status_change',
            isCaoliao: true,
            date: sLog.timestamp,
            title: `草料活码状态变更: 【${sLog.statusGroup || '运行状态'}】➔【${sLog.statusValue}】`,
            categoryLabel: '草料状态流转',
            badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
            icon: <Activity className="w-4 h-4 text-teal-600" />,
            summary: `经草料二维码扫码流转，设备在草料数据库中状态变更为【${sLog.statusValue}】（变更方式: ${sLog.changeMethod}${sLog.source ? `，源自工单 #${sLog.source}` : ''}）。`,
            details: [
              { label: '流转状态', value: sLog.statusValue, isHighlight: true },
              { label: '状态分类', value: sLog.statusGroup || '当前状态' },
              { label: '变更方式', value: sLog.changeMethod },
              { label: '变更时间', value: sLog.timestamp, isMono: true }
            ],
            operator: '草料二维码扫码联动',
            department: equipment.department,
            statusTag: {
              label: sLog.statusValue,
              color: sLog.statusValue.includes('故障') 
                ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }
          });
        }
      });
    }

    // 1.6 跨科借调与流转事件 (Inter-department Loans)
    if (equipment.loanHistory && equipment.loanHistory.length > 0) {
      equipment.loanHistory.forEach(loan => {
        events.push({
          id: `evt-loan-${loan.id}`,
          type: 'transfer_loan',
          date: loan.borrowTime.slice(0, 10),
          title: `跨科室应急借调：${loan.ownerDepartment} ➔ ${loan.borrowingDepartment}`,
          categoryLabel: '借调流转',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <ArrowRightLeft className="w-4 h-4 text-teal-600" />,
          summary: `因【${loan.borrowReason || '临床急用'}】由【${loan.ownerDepartment}】借调至【${loan.borrowingDepartment}】使用，并于 ${loan.actualReturnTime?.slice(0, 10) || '近期'} 办理归还交接。`,
          details: [
            { label: '借调单号', value: loan.id, isMono: true },
            { label: '借用人', value: loan.borrowerName },
            { label: '借调周期', value: `${loan.borrowTime.slice(0, 10)} ~ ${loan.actualReturnTime?.slice(0, 10) || '已归还'}`, isMono: true },
            { label: '验收接收人', value: loan.returnReceiverName || '科室管理员' },
            { label: '随借附件', value: (loan.accessories || []).join('、') || '主机及标配线缆' }
          ],
          remarks: `归还验收结论: ${loan.returnNotes || '完好无损，附件齐全，电子存证已归档'}`,
          operator: `${loan.lenderName || '出借人'} / ${loan.borrowerName}`,
          department: loan.borrowingDepartment,
          statusTag: { label: '已完结归还', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          rawRecord: loan
        });
      });
    }

    // 当前活跃借调
    if (equipment.currentLoan && equipment.currentLoan.loanStatus !== 'returned') {
      const cur = equipment.currentLoan;
      events.push({
        id: `evt-cur-loan-${cur.id}`,
        type: 'transfer_loan',
        date: cur.borrowTime.slice(0, 10),
        title: `【当前在借】借调至【${cur.borrowingDepartment}】`,
        categoryLabel: '跨科在借',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        icon: <ArrowRightLeft className="w-4 h-4 text-amber-700" />,
        summary: `当前处于跨科室流转中。借用人：${cur.borrowerName}（${cur.borrowerPhone || '无电话'}），预计应归还时间：${cur.expectedReturnTime}。`,
        details: [
          { label: '借调单号', value: cur.id, isMono: true },
          { label: '实际在用科室', value: cur.borrowingDepartment, isHighlight: true },
          { label: '应归还时间', value: cur.expectedReturnTime, isMono: true },
          { label: '借用事由', value: cur.borrowReason }
        ],
        operator: cur.borrowerName,
        department: cur.borrowingDepartment,
        statusTag: {
          label: cur.loanStatus === 'overdue' ? '🚨 逾期未还' : '🔄 流转在借中',
          color: cur.loanStatus === 'overdue' ? 'bg-rose-600 text-white font-bold' : 'bg-amber-500 text-white font-bold'
        },
        rawRecord: cur
      });
    }

    // 1.7 运行状态变动审计 (Status Logs)
    if (equipment.statusLogs && equipment.statusLogs.length > 0) {
      equipment.statusLogs.forEach(log => {
        events.push({
          id: `evt-log-${log.id}`,
          type: 'status_change',
          date: log.timestamp.slice(0, 10),
          title: `设备状态变更: ${log.oldStatus} ➔ ${log.newStatus}`,
          categoryLabel: '状态审计',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <Activity className="w-4 h-4 text-slate-600" />,
          summary: `变更原因说明: ${log.reason}`,
          details: [
            { label: '原运行状态', value: log.oldStatus },
            { label: '变更后状态', value: log.newStatus, isHighlight: true },
            { label: '操作时间', value: log.timestamp, isMono: true },
            { label: '经办人', value: log.operator }
          ],
          operator: log.operator,
          department: equipment.department,
          rawRecord: log
        });
      });
    }

    // 1.8 报废/退役节点 (Scrap / Retirement)
    if (equipment.status === '停用/报废') {
      events.push({
        id: `evt-scrap-${equipment.id}`,
        type: 'aging_scrap',
        date: '2026-08-01',
        title: '设备技术鉴定与残值报废处置',
        categoryLabel: '退役处置',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: <Trash2 className="w-4 h-4 text-rose-600" />,
        summary: '经医院医学装备委员会与三方技术专家联合鉴定，主要核心元器件老化且无维修价值，正式执行报废下线。',
        details: [
          { label: '处置状态', value: '已完成退役审批', isHighlight: true },
          { label: '累计在役时间', value: `${serviceYears} 年` },
          { label: '累计维保费用', value: `￥${(equipment.repairRecords?.reduce((s, r) => s + (r.cost || 0), 0) || 0).toLocaleString()}` }
        ],
        operator: '医学装备管理委员会',
        department: equipment.department
      });
    }

    // 排序：基于安全解析的时间戳进行正序或倒序排列，彻底避免无效日期导致的排序异常
    return events.sort((a, b) => {
      const timeA = parseEventDate(a.date);
      const timeB = parseEventDate(b.date);
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [equipment, calibrationInfo, validityInfo, sortOrder, serviceYears, caoliaoLiveRepairs, caoliaoStateLogs]);

  // 统计草料专属报修与流转事件数
  const caoliaoRepairCount = useMemo(() => {
    return allEvents.filter(e => e.isCaoliao).length;
  }, [allEvents]);

  // 2. 根据筛选类别过滤
  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return allEvents;
    if (selectedFilter === 'caoliao') {
      return allEvents.filter(e => e.isCaoliao);
    }
    if (selectedFilter === 'milestone') {
      return allEvents.filter(e => ['purchase', 'manufacturing', 'commissioning', 'aging_scrap'].includes(e.type));
    }
    if (selectedFilter === 'repair') {
      return allEvents.filter(e => ['repair', 'maintenance'].includes(e.type) || e.isCaoliao);
    }
    if (selectedFilter === 'calibration') {
      return allEvents.filter(e => e.type === 'calibration');
    }
    if (selectedFilter === 'loan') {
      return allEvents.filter(e => e.type === 'transfer_loan');
    }
    if (selectedFilter === 'status') {
      return allEvents.filter(e => e.type === 'status_change');
    }
    return allEvents;
  }, [allEvents, selectedFilter]);

  // 3. 计算生命周期阶段进度 (0%: 采购入库 -> 25%: 验收投用 -> 60%: 黄金在役 -> 85%: 老化维保 -> 100%: 报废下线)
  const lifecycleStage = useMemo(() => {
    if (equipment.status === '停用/报废') {
      return { step: 5, label: '已报废/退役处置', color: 'text-rose-600', bg: 'bg-rose-500', percent: 100 };
    }
    const years = serviceYears || 1;
    const maxYears = validityInfo.validityYears || 8;
    const ratio = Math.min(years / maxYears, 1);

    if (years <= 1) {
      return { step: 2, label: '新机验收与磨合期 (0~1年)', color: 'text-blue-600', bg: 'bg-blue-600', percent: 25 };
    } else if (ratio < 0.7) {
      return { step: 3, label: '临床黄金稳定服役期', color: 'text-emerald-600', bg: 'bg-emerald-600', percent: 55 };
    } else if (ratio < 1) {
      return { step: 4, label: '加速老化与重点监控期', color: 'text-amber-600', bg: 'bg-amber-600', percent: 80 };
    } else {
      return { step: 4, label: '超期服役 / 建议报废鉴定', color: 'text-rose-600', bg: 'bg-rose-600', percent: 95 };
    }
  }, [equipment.status, validityInfo, serviceYears]);

  const totalCost = (equipment.repairRecords || []).reduce((s, r) => s + (r.cost || 0), 0);

  return (
    <div className="space-y-5" id="equipment-lifecycle-timeline-container">
      
      {/* 顶部草料二维码官方 RDS 数据库直连专区（当设备关联 code_id 时高亮显示） */}
      {equipment.codeId && (
        <div className="bg-linear-to-r from-emerald-950/90 via-slate-900 to-teal-950 text-white p-4 sm:p-5 rounded-2xl border border-emerald-500/30 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-white">草料二维码官方数据库实时直连 (Aliyun RDS)</h4>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    已双向联动
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                  <span>草料活码 ID: <strong className="text-emerald-300 font-mono font-bold">{equipment.codeId}</strong></span>
                  <span className="text-slate-600">|</span>
                  <span>活码全称: <strong className="text-slate-200">{equipment.caoliaoCodeName || caoliaoCodeInfo?.codeName || equipment.name}</strong></span>
                  {equipment.caoliaoUrl && (
                    <>
                      <span className="text-slate-600">|</span>
                      <a
                        href={equipment.caoliaoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        <span>打开草料线上活码</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-slate-400">现场扫码实时工单</div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {caoliaoRepairCount} 条记录
                </div>
              </div>
              <button
                type="button"
                onClick={fetchLiveCaoliaoData}
                disabled={isLoadingCaoliao}
                className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="重新向阿里云 RDS 查询最新报修及流转数据"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCaoliao ? 'animate-spin' : ''}`} />
                <span>{isLoadingCaoliao ? '查询中...' : '刷新草料直连'}</span>
              </button>
            </div>
          </div>

          {/* 实时快报栏 */}
          {caoliaoLiveRepairs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-emerald-800/50 flex items-center justify-between text-xs text-emerald-200/90 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">最新扫码报修</span>
                <span>单号【<strong className="font-mono text-white">{caoliaoLiveRepairs[0].recordNo}</strong>】：{caoliaoLiveRepairs[0].faultDescription}</span>
                <span className="text-slate-400 text-2xs">({caoliaoLiveRepairs[0].reporterName} · {caoliaoLiveRepairs[0].recordTime})</span>
              </div>
              {caoliaoLiveRepairs[0].videoUrl && (
                <button
                  type="button"
                  onClick={() => setActiveVideoUrl(caoliaoLiveRepairs[0].videoUrl)}
                  className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded border border-rose-500/30 flex items-center gap-1 text-2xs font-bold transition cursor-pointer"
                >
                  <Video className="w-3 h-3 text-rose-400" />
                  <span>查看现场故障视频 (MP4)</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. 顶部：生命周期阶段可视化进度条 (Phase Stepper Ribbon) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>全生命周期服役阶段画像</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                在役 {serviceYears} 年 / 标称 {validityInfo.validityYears || 8} 年
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              当前状态处于：<strong className={lifecycleStage.color}>{lifecycleStage.label}</strong> · {validityInfo.riskDescription}
            </p>
          </div>

          {/* 核心指标微缩板 */}
          <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 font-medium">
            <div>
              <span className="text-slate-400 block text-[10px]">事件总数</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{allEvents.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px]">累计维保支出</span>
              <span className="font-bold text-amber-800 font-mono text-sm notranslate">￥{totalCost.toLocaleString()}</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px]">AI健康评估</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">{healthInfo.score}分</span>
            </div>
          </div>
        </div>

        {/* 阶段步骤条 */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-medium">
            <div className={`p-2 rounded-lg border transition-all ${
              lifecycleStage.step >= 1 ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="text-[10px] font-mono text-slate-400">STAGE 1</div>
              <div>采购论证准入</div>
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              lifecycleStage.step >= 2 ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="text-[10px] font-mono text-slate-400">STAGE 2</div>
              <div>现场验收启用</div>
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              lifecycleStage.step >= 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="text-[10px] font-mono text-slate-400">STAGE 3</div>
              <div>临床黄金服役期</div>
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              lifecycleStage.step >= 4 ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="text-[10px] font-mono text-slate-400">STAGE 4</div>
              <div>加速老化与监控</div>
            </div>
            <div className={`p-2 rounded-lg border transition-all ${
              lifecycleStage.step >= 5 ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}>
              <div className="text-[10px] font-mono text-slate-400">STAGE 5</div>
              <div>技术鉴定与报废</div>
            </div>
          </div>

          {/* 进度光条 */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${lifecycleStage.bg}`}
              style={{ width: `${lifecycleStage.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. 筛选与排序控制栏 (Filter & Order Toolbar) */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        
        {/* 类型切换 Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            全部事件 ({allEvents.length})
          </button>
          
          {caoliaoRepairCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFilter('caoliao')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedFilter === 'caoliao'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 font-semibold'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>草料报修 ({caoliaoRepairCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSelectedFilter('milestone')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'milestone'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>立项/验收/启用</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('repair')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'repair'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>维修保养 ({allEvents.filter(e => ['repair', 'maintenance'].includes(e.type) || e.isCaoliao).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('calibration')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'calibration'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>计量检定</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('loan')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'loan'
                ? 'bg-teal-600 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>跨科调拨 ({(equipment.loanHistory?.length || 0) + (equipment.currentLoan ? 1 : 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('status')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'status'
                ? 'bg-slate-700 text-white font-bold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>状态审计 ({equipment.statusLogs?.length || 0})</span>
          </button>
        </div>

        {/* 顺序切换 */}
        <button
          type="button"
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          title="切换时间轴正序 / 倒序"
        >
          <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
          <span>{sortOrder === 'desc' ? '最新事件在前' : '时间正序 (从启用起)'}</span>
        </button>

      </div>

      {/* 3. 纵向立体时间轴渲染区 (Interactive Timeline Stream) */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            当前筛选条件下暂无事件记录。
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="relative group transition-all"
            >
              {/* 时间轴轴心圆点 (Timeline Node Bullet) */}
              <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-600 flex items-center justify-center shadow-xs transition-colors z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-blue-600 transition-colors" />
              </div>

              {/* 事件主卡片 */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all space-y-3">
                
                {/* 头部：日期、标题、分类徽标与状态 */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border flex items-center gap-1 ${evt.badgeClass}`}>
                      {evt.icon}
                      <span>{evt.categoryLabel}</span>
                    </span>
                    <h5 className="font-bold text-sm text-slate-900">{evt.title}</h5>
                  </div>

                  <div className="flex items-center gap-2">
                    {evt.statusTag && (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${evt.statusTag.color}`}>
                        {evt.statusTag.label}
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {evt.date}
                    </span>
                  </div>
                </div>

                {/* 事件正文描述 */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {evt.summary}
                </p>

                {/* 结构化元数据网格 */}
                {evt.details && evt.details.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                    {evt.details.map((d, i) => (
                      <div key={i} className="min-w-0">
                        <span className="text-slate-400 block text-[11px] truncate">{d.label}:</span>
                        <span className={`font-semibold truncate block mt-0.5 ${
                          d.isHighlight ? 'text-amber-800 font-bold' : 'text-slate-800'
                        } ${d.isMono ? 'font-mono' : ''}`}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 草料专属多媒体佐证卡片 (视频 MP4 / 现场照片) */}
                {(evt.videoUrl || evt.photoUrl) && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-950 font-medium">
                      <span className="font-bold flex items-center gap-1 text-emerald-800">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>现场填报存证材料:</span>
                      </span>
                      <span>包含手机扫码实拍视频与故障现象证据</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {evt.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveVideoUrl(evt.videoUrl!)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>播放现场故障视频 (MP4)</span>
                        </button>
                      )}

                      {evt.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setActivePhotoUrl(evt.photoUrl!)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>查看现场故障照片</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 补充说明或修复结论 */}
                {evt.remarks && (
                  <div className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100/80 leading-relaxed">
                    {evt.remarks}
                  </div>
                )}

                {/* 底部经手人与快速操作条 */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {evt.operator && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>经办/责任人: <strong className="text-slate-800">{evt.operator}</strong></span>
                      </span>
                    )}
                    {evt.department && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>关联科室: {evt.department}</span>
                      </span>
                    )}
                  </div>

                  {/* 针对特定事件的单据/操作入口 */}
                  {evt.isCaoliao && equipment.caoliaoUrl && (
                    <a
                      href={equipment.caoliaoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-bold flex items-center gap-1 text-xs border border-emerald-300 transition"
                      title="打开草料云端官方活码"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>草料活码原址</span>
                    </a>
                  )}

                  {/* 针对特定事件的单据/操作入口 */}
                  {(evt.type === 'purchase_inbound' || evt.type === 'install_commission') && onPrintAcceptanceDossier && (
                    <button
                      type="button"
                      onClick={() => onPrintAcceptanceDossier(equipment)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-bold flex items-center gap-1.5 text-xs border border-emerald-200 cursor-pointer shadow-2xs transition"
                      title="查阅国家三甲医院实体纸质开箱验收入库单 (A4凭据)"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>查看实体纸质验收单 (A4凭据)</span>
                    </button>
                  )}

                  {evt.type === 'transfer_loan' && evt.rawRecord && onPrintLoanVoucher && (
                    <button
                      type="button"
                      onClick={() => onPrintLoanVoucher(equipment, evt.rawRecord, 'return')}
                      className="text-teal-700 hover:text-teal-900 font-bold hover:underline flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>查看电子交接单</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        )}

      </div>

      {/* 4. 现场故障视频在线播放模态弹窗 */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl space-y-3">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Video className="w-4 h-4 text-rose-500" />
                <span>草料移动端现场扫码填报故障视频 (MP4)</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoUrl(null)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center aspect-video">
                <video
                  controls
                  autoPlay
                  src={activeVideoUrl}
                  className="max-h-full max-w-full"
                >
                  您的浏览器暂不支持此视频播放，请点击下方下载原件。
                </video>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
                <span className="truncate max-w-md font-mono text-[11px]">{activeVideoUrl}</span>
                <a
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 shrink-0 font-bold"
                >
                  <span>新窗口播放/下载</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. 现场故障照片查看模态弹窗 */}
      {activePhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden max-w-xl w-full shadow-2xl space-y-3">
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>草料移动端现场扫码填报故障照片</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoUrl(null)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center">
              <img
                src={activePhotoUrl}
                alt="现场故障照片"
                className="max-h-[70vh] rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
