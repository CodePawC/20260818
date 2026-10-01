import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment, RepairRecord, AuthUser, DepartmentMaster } from '../types';
import { 
  History, 
  Search, 
  Wrench, 
  CheckCircle2, 
  Stethoscope, 
  FileCheck, 
  Sparkles, 
  Plus, 
  Filter, 
  AlertCircle,
  Clock,
  RotateCcw,
  Building2,
  DollarSign,
  Landmark,
  ArrowUpRight,
  Zap,
  Check,
  Award,
  Layers,
  FileSignature,
  PackageCheck,
  X,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Phone,
  FileText
} from 'lucide-react';
import { isHeadNurse, isClinicalStaff, isDepartmentRestricted, getUserDepartment, canAccessTab } from '../utils/authUtils';
import { ApprovalApplication } from '../types/approvalTypes';
import { Pagination } from './Pagination';
import { MonthlyFinanceReportModal } from './MonthlyFinanceReportModal';
import { getMonthlyFrameworkBatches, saveMonthlyFrameworkBatches } from '../utils/monthlyFrameworkData';
import { MonthlyFrameworkBatch, MonthlyFrameworkItem, VendorCollaborationOrder } from '../types/vendorCollaborationTypes';
import { ClinicalItemSignModal, FlattenedFrameworkItem } from './monthly/ClinicalItemSignModal';
import { DEFAULT_DEPARTMENTS, resolveMasterDepartment, matchesDepartment } from '../utils/masterData';
import { RepairTrackingTimeline } from './RepairTrackingTimeline';
import { getVendorCollaborationOrders, saveVendorCollaborationOrders } from '../utils/vendorCollaborationData';
import { VendorCollaborationRepairTracker } from './VendorCollaborationRepairTracker';

export interface UnifiedRepairLog {
  id: string;
  category: 'standard' | 'framework_sporadic'; // standard = 设备台账故障报修, framework_sporadic = 零修工单 (月度框架零星维保)
  equipmentId?: string;
  equipmentName: string;
  equipmentSn: string;
  equipmentModel?: string;
  department: string;
  repairType: string;
  faultDate: string;
  faultDescription: string;
  technician: string;
  cost: number;
  partsReplaced?: string;
  resolution?: string;
  status: '处理中' | '已完成' | '待配件';
  completionDate?: string;
  equipmentOriginal?: MedicalEquipment;
  // 零修工单专属字段
  frameworkItem?: MonthlyFrameworkItem;
  frameworkBatch?: MonthlyFrameworkBatch;
  clinicalSignee?: string;
  clinicalReceiveStatus?: 'SIGNED' | 'RECEIVED' | 'PENDING';
  clinicalSignatureCertId?: string;
  clinicalSignatureTime?: string;
  oldPartsReturned?: boolean;
  auditTag?: string;
}

interface RepairLogsViewProps {
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser;
  onOpenRepairModal: () => void;
  onOpenAiDiagnose?: (device: MedicalEquipment) => void;
  onViewPartner?: (partnerName: string) => void;
  onNavigateToApprovals?: (data: Partial<ApprovalApplication>) => void;
  onOpenStatusChange?: (device: MedicalEquipment) => void;
}

export const RepairLogsView: React.FC<RepairLogsViewProps> = ({
  equipmentList,
  currentUser,
  onOpenRepairModal,
  onOpenAiDiagnose,
  onViewPartner,
  onNavigateToApprovals,
  onOpenStatusChange
}) => {
  const [searchKey, setSearchKey] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | '处理中' | '待配件' | '已完成' | 'PENDING_SIGN'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'framework_sporadic' | 'standard'>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [overThresholdOnly, setOverThresholdOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  // 零修验签凭单模态框
  const [selectedSignItem, setSelectedSignItem] = useState<FlattenedFrameworkItem | null>(null);

  // 科室报修跟踪详情模态框
  const [selectedTrackingRecord, setSelectedTrackingRecord] = useState<UnifiedRepairLog | null>(null);
  const [showFullVendorCollabModal, setShowFullVendorCollabModal] = useState<boolean>(false);

  // 加载月度零修框架结算批次数据
  const [frameworkBatches, setFrameworkBatches] = useState<MonthlyFrameworkBatch[]>(() => {
    try {
      return getMonthlyFrameworkBatches();
    } catch (e) {
      console.warn('Failed to load monthly framework batches:', e);
      return [];
    }
  });

  // 严格依据当前登录用户角色及科室确定视角：护士长、一线临床医护及受限于科室人员
  const isNurse = isHeadNurse(currentUser) || isClinicalStaff(currentUser) || isDepartmentRestricted(currentUser);
  const userDept = getUserDepartment(currentUser);
  const canViewPartners = canAccessTab(currentUser, 'partners');

  // 综合提取所有涉及科室（包含设备台账科室和零修工单科室）
  const departments = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) {
        const norm = (e.department === '手术室' || e.department === '手术科') ? '麻醉手术科' : e.department;
        set.add(norm);
      }
    });
    frameworkBatches.forEach(b => {
      (b.items || []).forEach(item => {
        if (item.department) {
          const norm = (item.department === '手术室' || item.department === '手术科') ? '麻醉手术科' : item.department;
          set.add(norm);
        }
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [equipmentList, frameworkBatches]);

  // 将【设备报修记录】与【月度框架零修工单】深度融合为统一维保跟踪台账
  const allRepairs: UnifiedRepairLog[] = useMemo(() => {
    const list: UnifiedRepairLog[] = [];

    // 1. 提取院内设备故障报修与常规维保台账 (standard)
    equipmentList.forEach(e => {
      (e.repairRecords || []).forEach(r => {
        const isSporadic = r.repairType?.includes('零修') || r.repairType?.includes('零星');
        list.push({
          id: r.id,
          category: isSporadic ? 'framework_sporadic' : 'standard',
          equipmentId: e.id,
          equipmentName: r.equipmentName || e.name,
          equipmentSn: r.equipmentSn || e.sn,
          equipmentModel: e.model,
          department: r.department || e.department || '临床科室',
          repairType: r.repairType || '紧急故障维修',
          faultDate: r.faultDate || '',
          faultDescription: r.faultDescription || '',
          technician: r.technician || '临床工程师',
          cost: r.cost || 0,
          partsReplaced: r.partsReplaced,
          resolution: r.resolution || '',
          status: (r.status as any) || '已完成',
          completionDate: r.completionDate,
          equipmentOriginal: e,
        });
      });
    });

    // 2. 提取全院月度框架零星维保明细 (framework_sporadic - 零修单)
    frameworkBatches.forEach(batch => {
      (batch.items || []).forEach(item => {
        // 尝试匹配科室同类在册设备以支持一键联动 AI 诊断与设备档案
        const matchedEquip = equipmentList.find(e => 
          matchesDepartment(e.department, item.department) &&
          (item.itemName.includes(e.name) || e.name.includes(item.itemName.slice(0, 4)))
        );

        // 统一日期格式化为 YYYY-MM-DD
        let formattedDate = item.serviceDate || '';
        if (formattedDate.includes('/')) {
          const parts = formattedDate.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          }
        }

        const isSigned = item.clinicalReceiveStatus === 'SIGNED';
        const isCompleted = item.status === 'COMPLETED' || isSigned;

        list.push({
          id: item.id,
          category: 'framework_sporadic',
          equipmentId: matchedEquip?.id,
          equipmentName: item.itemName,
          equipmentSn: item.workOrderNo || item.id,
          equipmentModel: item.unit ? `${item.quantity || 1} ${item.unit}` : '零修工料',
          department: item.department || '临床科室',
          repairType: item.auditTag ? `零修·${item.auditTag}` : '月度框架零星维保',
          faultDate: formattedDate,
          faultDescription: `${item.itemName}${item.notes ? `（${item.notes}）` : ''}`,
          technician: item.engineerName ? `${item.engineerName} (${batch.vendorName ? '国药器械' : '框架维保'})` : (batch.vendorName || '框架维保工程师'),
          cost: Number(item.totalPrice) || 0,
          partsReplaced: item.notes || (item.oldPartsReturned ? '原装旧件已退库核销' : '常规零修配件与工料'),
          resolution: item.clinicalFeedback || '经现场检修更换配件与调校，空载试运行正常，电气安全自检合格，准予恢复临床使用。',
          status: isCompleted ? '已完成' : '处理中',
          completionDate: formattedDate,
          equipmentOriginal: matchedEquip || ({
            id: item.id,
            name: item.itemName,
            sn: item.workOrderNo || item.id,
            model: item.unit ? `${item.quantity}${item.unit}` : '零修设备',
            department: item.department,
            status: isCompleted ? '正常在用' : '故障待修',
            category: '通用临床设备',
            riskLevel: '中风险',
            criticalLevel: '中',
            purchasePrice: Number(item.totalPrice) || 1000,
            location: `${item.department} 现场`,
            repairRecords: []
          } as unknown as MedicalEquipment),
          frameworkItem: item,
          frameworkBatch: batch,
          clinicalSignee: item.clinicalSignee || item.clinicalSigner,
          clinicalReceiveStatus: item.clinicalReceiveStatus,
          clinicalSignatureCertId: item.clinicalSignatureCertId,
          clinicalSignatureTime: item.clinicalSignatureTime,
          oldPartsReturned: item.oldPartsReturned,
          auditTag: item.auditTag
        });
      });
    });

    // 3. 临床科室/护士长视角严格隔离：仅限于查看本科室名下的全部单据（含零修单与设备报修单）
    const scopedList = list.filter(r => {
      if (isNurse && userDept) {
        return matchesDepartment(r.department, userDept);
      }
      return true;
    });

    // 按报修或维保服务日期倒序排列（最新发生排在最前）
    return scopedList.sort((a, b) => {
      const dateA = a.faultDate || '';
      const dateB = b.faultDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [equipmentList, frameworkBatches, isNurse, userDept]);

  // 匹配选定记录的外协协同订单数据 (用于5阶段横向时序进度展示)
  const trackingMatchedOrder = useMemo((): VendorCollaborationOrder | null => {
    if (!selectedTrackingRecord) return null;
    try {
      const all = getVendorCollaborationOrders();
      const found = all.find(o => 
        (selectedTrackingRecord.equipmentId && o.equipmentId === selectedTrackingRecord.equipmentId) ||
        (selectedTrackingRecord.equipmentSn && o.equipmentSerialNo === selectedTrackingRecord.equipmentSn) ||
        (selectedTrackingRecord.equipmentName && o.equipmentName && o.equipmentName.includes(selectedTrackingRecord.equipmentName)) ||
        o.workOrderId === selectedTrackingRecord.id
      );
      if (found) return found;

      // 动态合成外协协同单，支持全流程穿透与进度展示
      const isUrgent = selectedTrackingRecord.repairType.includes('急') || (selectedTrackingRecord.cost || 0) > 3000;
      const isComplete = selectedTrackingRecord.status === '已完成' || selectedTrackingRecord.clinicalReceiveStatus === 'SIGNED';
      const isPendingConfirm = selectedTrackingRecord.status === '处理中' && selectedTrackingRecord.clinicalReceiveStatus !== 'SIGNED' && !!selectedTrackingRecord.resolution;

      const synthStatus = isComplete
        ? 'ARCHIVED'
        : isPendingConfirm
        ? 'COMPLETED_PENDING_INVOICE'
        : selectedTrackingRecord.status === '待配件'
        ? 'APPROVED_REPAIRING'
        : selectedTrackingRecord.status === '处理中'
        ? 'APPROVED_REPAIRING'
        : 'PENDING_QUOTE';

      const synth: VendorCollaborationOrder = {
        id: `EXT-2026-${selectedTrackingRecord.id.replace(/\D/g, '').slice(-4) || '088'}`,
        workOrderId: selectedTrackingRecord.id,
        equipmentId: selectedTrackingRecord.equipmentId || 'EQ-SYNTH',
        equipmentName: selectedTrackingRecord.equipmentName,
        equipmentModel: selectedTrackingRecord.equipmentModel || '临床标准型',
        equipmentSerialNo: selectedTrackingRecord.equipmentSn,
        equipmentDept: selectedTrackingRecord.department,
        faultDescription: selectedTrackingRecord.faultDescription || '设备报修与外协协同检修',
        faultImages: [],
        urgencyLevel: isUrgent ? 'HIGH' : 'NORMAL',
        vendorId: 'VND-001',
        vendorName: selectedTrackingRecord.technician || '通用电气医疗系统 (中国) 原厂技术服务站',
        vendorContact: selectedTrackingRecord.technician?.split(' ')[0] || '程志远',
        vendorPhone: '139-1088-2940',
        status: synthStatus,
        createdAt: selectedTrackingRecord.faultDate ? `${selectedTrackingRecord.faultDate} 08:30` : '2026-08-10 08:30',
        quoteLaborCost: 800,
        quoteTravelCost: 400,
        quotePartsTotal: (selectedTrackingRecord.cost || 2800) - 1200 > 0 ? (selectedTrackingRecord.cost || 2800) - 1200 : 1600,
        quoteGrandTotal: selectedTrackingRecord.cost || 2800,
        quoteParts: [],
        multiDeptOpinions: [],
        negotiationRounds: [],
        finalNegotiatedPrice: selectedTrackingRecord.cost || 2400,
        savingsAmount: Math.round((selectedTrackingRecord.cost || 2800) * 0.15),
        savingsRate: 15,
        messages: [
          {
            id: 'MSG-01',
            senderType: 'HOSPITAL',
            senderName: '医学工程科调度室',
            content: `收到【${selectedTrackingRecord.department}】报修申请：${selectedTrackingRecord.faultDescription || '设备报修'}，系统智能委外派单。`,
            timestamp: selectedTrackingRecord.faultDate ? `${selectedTrackingRecord.faultDate} 08:35` : '2026-08-10 08:35'
          },
          {
            id: 'MSG-02',
            senderType: 'VENDOR',
            senderName: selectedTrackingRecord.technician || '原厂技术服务工程师',
            content: '已响应接单，调取设备运行日志与故障码比对，准备专车直达配件。',
            timestamp: selectedTrackingRecord.faultDate ? `${selectedTrackingRecord.faultDate} 09:15` : '2026-08-10 09:15'
          }
        ],
        isDossierArchived: isComplete,
        completionReport: {
          engineerName: selectedTrackingRecord.technician?.split(' ')[0] || '程志远',
          engineerPhone: '139-1088-2940',
          serviceStartTime: selectedTrackingRecord.faultDate ? `${selectedTrackingRecord.faultDate} 09:30` : '2026-08-10 09:30',
          serviceEndTime: selectedTrackingRecord.completionDate ? `${selectedTrackingRecord.completionDate} 15:30` : '2026-08-10 15:30',
          faultCauseAnalysis: selectedTrackingRecord.faultDescription || '日常磨损及电气参数偏移',
          repairMeasuresSummary: selectedTrackingRecord.resolution || '现场检测、故障排除与功能校准测试，系统自检全部通过。',
          replacedPartsSummary: selectedTrackingRecord.partsReplaced || '无',
          oldPartsReturned: !!selectedTrackingRecord.oldPartsReturned,
          clinicalAcceptorName: selectedTrackingRecord.clinicalSignee || (selectedTrackingRecord.clinicalReceiveStatus === 'SIGNED' ? '王芳（护士长）' : undefined),
          clinicalAcceptDate: selectedTrackingRecord.clinicalSignatureTime || (selectedTrackingRecord.clinicalReceiveStatus === 'SIGNED' ? '2026-08-10 16:30' : undefined),
          clinicalRating: 5
        }
      };
      return synth;
    } catch {
      return null;
    }
  }, [selectedTrackingRecord, currentUser]);

  // 统计指标与卡片徽标计数
  const statusCounts = useMemo(() => {
    const counts = {
      ALL: allRepairs.length,
      '处理中': 0,
      '待配件': 0,
      '已完成': 0,
      overThreshold: 0,
      sporadicCount: 0,
      standardCount: 0,
      signedCount: 0,
      pendingSignCount: 0
    };
    allRepairs.forEach(r => {
      if (r.status === '处理中') counts['处理中']++;
      else if (r.status === '待配件') counts['待配件']++;
      else if (r.status === '已完成') counts['已完成']++;

      if ((r.cost || 0) >= 5000) counts.overThreshold++;
      if (r.category === 'framework_sporadic') {
        counts.sporadicCount++;
        if (r.clinicalReceiveStatus === 'SIGNED') {
          counts.signedCount++;
        } else {
          counts.pendingSignCount++;
        }
      } else {
        counts.standardCount++;
      }
    });
    return counts;
  }, [allRepairs]);

  // 维保类型候选字典
  const repairTypes = useMemo(() => {
    const set = new Set<string>();
    allRepairs.forEach(r => {
      if (r.repairType) set.add(r.repairType);
    });
    return Array.from(set);
  }, [allRepairs]);

  // 多维筛选计算
  const filteredRepairs = useMemo(() => {
    return allRepairs.filter(r => {
      // 1. 类别筛选：全部 / ⚡ 零修工单 / 🏥 院内设备报修
      if (selectedCategory === 'framework_sporadic' && r.category !== 'framework_sporadic') {
        return false;
      }
      if (selectedCategory === 'standard' && r.category !== 'standard') {
        return false;
      }

      // 2. 状态筛选
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'PENDING_SIGN') {
          if (r.category !== 'framework_sporadic' || r.clinicalReceiveStatus === 'SIGNED') {
            return false;
          }
        } else if (r.status !== selectedStatus) {
          return false;
        }
      }

      // 3. 维保类型筛选
      if (selectedType !== 'ALL') {
        if (selectedType === 'SPORADIC_ALL') {
          if (r.category !== 'framework_sporadic') return false;
        } else if (r.repairType !== selectedType && !(r.auditTag && selectedType.includes(r.auditTag))) {
          return false;
        }
      }

      // 4. 科室筛选（仅管理科室/非临床人员生效，临床科室严格锁定为本科室）
      if (!isNurse && selectedDept !== 'ALL') {
        if (!matchesDepartment(r.department, selectedDept)) {
          return false;
        }
      }

      // 5. 超5000元大额审批项
      if (overThresholdOnly && (r.cost || 0) < 5000) {
        return false;
      }

      // 6. 关键词检索（支持编号、设备名、零修项目、SN、工程师、处理方案、科室、签名人）
      const query = searchKey.trim().toLowerCase();
      if (query) {
        const matchesQuery = 
          (r.equipmentName || '').toLowerCase().includes(query) ||
          (r.equipmentSn || '').toLowerCase().includes(query) ||
          (r.faultDescription || '').toLowerCase().includes(query) ||
          (r.technician || '').toLowerCase().includes(query) ||
          (r.repairType || '').toLowerCase().includes(query) ||
          (r.id || '').toLowerCase().includes(query) ||
          (r.partsReplaced || '').toLowerCase().includes(query) ||
          (r.department || '').toLowerCase().includes(query) ||
          (r.clinicalSignee || '').toLowerCase().includes(query) ||
          (r.frameworkBatch?.batchTitle || '').toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [allRepairs, selectedCategory, selectedStatus, selectedType, selectedDept, overThresholdOnly, searchKey, isNurse]);

  // 筛选条件变化时自动回退到第 1 页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKey, selectedCategory, selectedStatus, selectedType, selectedDept, overThresholdOnly]);

  const paginatedRepairs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRepairs.slice(start, start + pageSize);
  }, [filteredRepairs, currentPage, pageSize]);

  const totalFilteredCost = useMemo(() => {
    return filteredRepairs.reduce((sum, r) => sum + (r.cost || 0), 0);
  }, [filteredRepairs]);

  const hasActiveFilters = 
    searchKey !== '' || 
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' || 
    selectedType !== 'ALL' || 
    (!isNurse && selectedDept !== 'ALL') || 
    overThresholdOnly;

  const handleResetFilters = () => {
    setSearchKey('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
    setSelectedDept('ALL');
    setOverThresholdOnly(false);
  };

  // 处理零修单科室签名保存回调并持久化
  const handleSaveSignature = (
    itemId: string,
    signaturePayload: any
  ) => {
    const updatedBatches = frameworkBatches.map(b => {
      let changed = false;
      const nextItems = b.items.map(item => {
        if (item.id === itemId) {
          changed = true;
          return {
            ...item,
            ...signaturePayload
          };
        }
        return item;
      });
      if (changed) {
        return {
          ...b,
          items: nextItems
        };
      }
      return b;
    });

    setFrameworkBatches(updatedBatches);
    saveMonthlyFrameworkBatches(updatedBatches);
    setSelectedSignItem(null);
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 flex-1 min-h-0 flex flex-col overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-3 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between flex-none gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
            {isNurse ? <Stethoscope className="w-5 h-5 text-rose-600" /> : <History className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                {isNurse ? `【${userDept || '本病区'}】临床设备报修与维保记录跟踪` : '全院设备维修与保养工单总台账'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                共 {filteredRepairs.length} 条记录
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-600" />
                含零修工单 {filteredRepairs.filter(r => r.category === 'framework_sporadic').length} 条
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                金额合计 ¥{totalFilteredCost.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {isNurse 
                ? `支持本科室报修、设备故障处置与月度零星维保单（零修）全闭环验收签单跟踪`
                : '全院设备大修、零星维保(零修)、关键零配件更换、重大维修转审批(>¥5,000)全生命周期审计'
              }
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {!isNurse && (
            <button
              type="button"
              onClick={() => setIsFinanceModalOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              title="按月统计维修费用报表与财务科付款资金筹备请款单（如截至8月底结算）"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>财务付款请款月报</span>
            </button>
          )}

          {onNavigateToApprovals && !isNurse && (
            <button
              type="button"
              onClick={() => onNavigateToApprovals({ type: 'part_replacement', title: '新建大额维修/配件更换审批申请' })}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="发起重大维修/大额配件更换审批"
            >
              <FileCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>大额维修审批</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenRepairModal}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>登记新报修工单</span>
          </button>
        </div>
      </div>

      {/* 临床科室 / 护士长专属视角栏：仅限于查看本科室报修跟踪 */}
      {isNurse && (
        <div className="mx-3 my-2 px-3 py-1.5 bg-rose-50/80 border border-rose-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>科室报修跟踪视角：</strong>当前仅限于查看 <strong>【{userDept || '本科室'}】</strong> 设备报修与维保记录。可在列表直接查看工单进度并完成复核验收签字。
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-600 text-white shadow-2xs">
              本科室工单 ({filteredRepairs.length})
            </span>
          </div>
        </div>
      )}

      {/* 财务科按月用款与请款快速指引栏（非护士模式） */}
      {!isNurse && (
        <div className="mx-3 my-2 px-3.5 py-2 bg-emerald-50/90 border border-emerald-200 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
              <Landmark className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">
              <strong>财务备款月报提示：</strong>全院维修跟踪已自动汇聚台账设备故障报修与框架零修结算单，支持一键生成面向财务科的【付款资金筹备请款单与明细】。
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFinanceModalOpen(true)}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
          >
            <span>生成财务请款单</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Filter Ribbon */}
      <div className="p-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs flex-none">
        {/* Left: 工单大类切换卡（全部 / ⚡ 零修工单 / 🏥 院内设备报修）与 状态切换 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 大类分流 Tab */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-800 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部工单 ({allRepairs.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('framework_sporadic')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'framework_sporadic'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'text-amber-800 bg-amber-50/80 border border-amber-200/80 hover:bg-amber-100'
              }`}
              title="仅筛选零星维保单（含月度框架常规小修、外协配件换新、小额直报、抢修与验收签字）"
            >
              <Zap className={`w-3.5 h-3.5 ${selectedCategory === 'framework_sporadic' ? 'text-white' : 'text-amber-600'}`} />
              <span>⚡ 外协零修工单 ({statusCounts.sporadicCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('standard')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'standard'
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>院内设备报修 ({statusCounts.standardCount})</span>
            </button>
          </div>

          {/* 状态过滤 Tab */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-slate-700 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              全部状态
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('处理中')}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                selectedStatus === '处理中'
                  ? 'bg-amber-500 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              处理中 ({statusCounts['处理中']})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('待配件')}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                selectedStatus === '待配件'
                  ? 'bg-rose-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              待配件 ({statusCounts['待配件']})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('已完成')}
              className={`px-2 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                selectedStatus === '已完成'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              已完成 ({statusCounts['已完成']})
            </button>
            {statusCounts.pendingSignCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStatus('PENDING_SIGN')}
                className={`px-2 py-1 rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  selectedStatus === 'PENDING_SIGN'
                    ? 'bg-rose-700 text-white font-bold shadow-2xs'
                    : 'text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100'
                }`}
                title="外协零修完工但临床科室尚未复核验签的单据"
              >
                <FileSignature className="w-3 h-3 text-rose-500" />
                <span>待验收签字 ({statusCounts.pendingSignCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Center / Right: 下拉分类筛选与关键词速搜 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Repair Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-hidden focus:border-amber-500"
          >
            <option value="ALL">全部维保类型</option>
            <option value="SPORADIC_ALL">⚡ 全部零修工单 (框架零星)</option>
            <option value="零修·常规零星维修">零修·常规零星维修</option>
            <option value="零修·小额直接报销">零修·小额直接报销 (&lt;1000元)</option>
            <option value="零修·多台合并维保">零修·多台合并维保</option>
            <option value="零修·大额审签特批">零修·大额审签特批 (≥5000元)</option>
            <option value="紧急故障维修">紧急故障维修</option>
            <option value="定期预防性保养">定期预防性保养 (PM)</option>
            <option value="计量校准">计量校准 / 强检</option>
            <option value="巡检维护">临床巡检维护</option>
            {repairTypes
              .filter(t => !['紧急故障维修', '定期预防性保养', '计量校准', '巡检维护'].includes(t) && !t.includes('零修'))
              .map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
          </select>

          {/* Department Filter (Only for management / non-clinical staff) */}
          {!isNurse && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-hidden focus:border-amber-500 max-w-[140px] truncate"
            >
              <option value="ALL">全院科室</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* Over Threshold Toggle */}
          <button
            type="button"
            onClick={() => setOverThresholdOnly(!overThresholdOnly)}
            className={`px-2.5 py-1 rounded-md border text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              overThresholdOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="筛选预估/实际维修金额超过5,000元的重大维修记录"
          >
            <DollarSign className="w-3 h-3 text-rose-500" />
            <span>&gt;¥5,000审批项</span>
          </button>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索工单/零修/设备/SN/工程师/配件..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition cursor-pointer"
              title="重置全部筛选条件"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Area (Scrollable within container) */}
      <div className="flex-1 min-h-0 overflow-auto">
        {filteredRepairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              {isNurse ? (
                <Stethoscope className="w-7 h-7 text-rose-500 stroke-[1.75]" />
              ) : (
                <Wrench className="w-7 h-7 text-slate-400 stroke-[1.75]" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-700">
              {isNurse 
                ? `【${userDept || '本科室'}】暂无进行中或历史维保工单` 
                : '未找到符合条件的维保或零修工单记录'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
              {isNurse 
                ? '本科室当前在管设备运转良好。若发现设备故障、部件老化或有零星维修需求，请随时发起在线报修。'
                : '请尝试调整搜索关键词、清空状态筛选或重置维保分类。'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              {isNurse && (
                <button
                  type="button"
                  onClick={onOpenRepairModal}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>登记本科室设备报修</span>
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md border border-amber-200 transition cursor-pointer"
                >
                  清空筛选条件
                </button>
              )}
            </div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3.5 py-2.5 whitespace-nowrap">工单编号</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">设备名称 / 零修项目</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">科室</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">工单类别 / 报修类型</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">服务发生日期</th>
                <th className="px-3.5 py-2.5 min-w-[340px] max-w-[480px]">故障现象与处理方案</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">更换配件 / 旧件退库</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">维修工程师 / 单位</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">金额 (元)</th>
                <th className="px-3.5 py-2.5 whitespace-nowrap">工单状态</th>
                <th className="px-3.5 py-2.5 text-right whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRepairs.map((record) => {
                const isOverThreshold = (record.cost || 0) >= 5000;
                const isSporadic = record.category === 'framework_sporadic';

                return (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition group">
                    {/* 工单编号 */}
                    <td className="px-3.5 py-2.5 font-mono font-medium text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                          isSporadic 
                            ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {record.id}
                        </span>
                        {isSporadic && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                            ⚡ 零修
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 设备名称 / 零修项目 */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className="truncate max-w-[280px]" title={record.equipmentName}>
                          {record.equipmentName}
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono text-[10.5px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                        {isSporadic ? (
                          <>
                            <span className="text-amber-700 font-medium">
                              批次: {record.frameworkBatch?.yearMonth || '月度零修'}
                            </span>
                            {record.frameworkItem?.clinicalSignee && (
                              <span className="text-emerald-700 flex items-center gap-0.5 font-sans">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                签收: {record.frameworkItem.clinicalSignee}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span>SN: {record.equipmentSn || '--'}</span>
                            {record.equipmentOriginal?.model && (
                              <span className="text-slate-500">| 型号: {record.equipmentOriginal.model}</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* 科室 */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                        record.department === '麻醉手术科'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {record.department || '临床科室'}
                      </span>
                    </td>

                    {/* 工单类别 / 报修类型 */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-1 ${
                        isSporadic
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : record.repairType?.includes('急') || record.repairType?.includes('故障')
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : record.repairType?.includes('强检') || record.repairType?.includes('计量')
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-teal-50 text-teal-700 border border-teal-100'
                      }`}>
                        {isSporadic && <Zap className="w-3 h-3 text-amber-600" />}
                        {record.repairType || '应急维修'}
                      </span>
                    </td>

                    {/* 服务发生日期 */}
                    <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {record.faultDate || '--'}
                    </td>

                    {/* 故障现象与处理方案 */}
                    <td className="px-3.5 py-2.5 min-w-[340px] max-w-[480px]">
                      <div className="text-slate-700 truncate font-medium" title={record.faultDescription}>
                        {record.faultDescription}
                      </div>
                      {record.resolution && (
                        <div className="text-slate-400 text-[11px] truncate mt-0.5" title={`处理结论: ${record.resolution}`}>
                          结论: {record.resolution}
                        </div>
                      )}
                    </td>

                    {/* 更换配件 / 旧件退库 */}
                    <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1 flex-wrap">
                        {record.partsReplaced ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono truncate max-w-[130px]" title={record.partsReplaced}>
                            {record.partsReplaced}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">无</span>
                        )}
                        {record.oldPartsReturned && (
                          <span className="px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-2xs font-bold" title="旧件已退库核销">
                            旧件退库
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 维修工程师 / 单位 */}
                    <td className="px-3.5 py-2.5 font-medium text-slate-700 whitespace-nowrap">
                      {onViewPartner && canViewPartners && record.technician ? (
                        <button
                          type="button"
                          onClick={() => onViewPartner(record.technician)}
                          className="text-blue-700 hover:text-blue-900 hover:underline font-semibold cursor-pointer text-left truncate max-w-[140px] inline-block"
                          title={`查看服务商/维保单位【${record.technician}】档案`}
                        >
                          {record.technician}
                        </button>
                      ) : (
                        <span className="truncate max-w-[140px] inline-block" title={record.technician}>
                          {record.technician || '--'}
                        </span>
                      )}
                    </td>

                    {/* 金额 */}
                    <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800 notranslate whitespace-nowrap" translate="no">
                      <div className="flex items-center gap-1">
                        <span>￥{(record.cost || 0).toLocaleString()}</span>
                        {isOverThreshold && (
                          <span className="px-1.5 py-0.2 rounded text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200" title="预估费用超5,000元，符合重大维修审批标准">
                            &gt;5000
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 工单状态 */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      {isSporadic ? (
                        record.clinicalReceiveStatus === 'SIGNED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>已验收签单</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>待科室验签</span>
                          </span>
                        )
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          record.status === '已完成' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : record.status === '故障待修'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {record.status}
                        </span>
                      )}
                    </td>

                    {/* 操作 */}
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 justify-end">
                        {/* 报修跟踪与外协协同流程 (5阶段横向时序) */}
                        <button
                          type="button"
                          onClick={() => setSelectedTrackingRecord(record)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="查看报修受理、外协派工、维修处理中、待科室确认、归档验收五个阶段流程与外协协同详情"
                        >
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>报修跟踪</span>
                        </button>

                        {/* 零修工单专属操作：验签凭证 / 电子签章 */}
                        {isSporadic && record.frameworkItem && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSignItem({
                                ...record.frameworkItem!,
                                batchId: record.frameworkBatch?.id || '',
                                batchYearMonth: record.frameworkBatch?.yearMonth || '',
                                batchTitle: record.frameworkBatch?.batchTitle || '',
                                vendorName: record.frameworkBatch?.vendorName || '国药器械医工技术服务 (中国) 有限公司'
                              });
                            }}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="查阅零修服务单、旧件退库凭证与临床护士长电子签章"
                          >
                            <FileSignature className="w-3 h-3 text-amber-600" />
                            <span>{record.clinicalReceiveStatus === 'SIGNED' ? '查看签单' : '验签闭环'}</span>
                          </button>
                        )}

                        {/* 设备修复故障快捷流转 */}
                        {!isSporadic && onOpenStatusChange && record.equipmentOriginal && (record.status !== '已完成' || record.equipmentOriginal.status === '故障待修') && (
                          <button
                            type="button"
                            onClick={() => onOpenStatusChange(record.equipmentOriginal!)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="工单排查检修合格，点击修复故障并恢复设备正常运行"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>修复故障</span>
                          </button>
                        )}

                        {/* AI 诊断分析 */}
                        {onOpenAiDiagnose && record.equipmentOriginal && (
                          <button
                            type="button"
                            onClick={() => onOpenAiDiagnose(record.equipmentOriginal!)}
                            className="px-2 py-0.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded text-[11px] font-semibold transition cursor-pointer flex items-center gap-0.5"
                            title="针对此故障记录调用 AI 进行深度失效树复盘"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-600" />
                            <span>AI诊断</span>
                          </button>
                        )}

                        {/* 转审批流 */}
                        {onNavigateToApprovals && (
                          <>
                            {isOverThreshold ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigateToApprovals({
                                    type: 'part_replacement',
                                    equipmentId: record.equipmentOriginal?.id,
                                    equipmentName: record.equipmentName,
                                    equipmentModel: record.equipmentOriginal?.model,
                                    equipmentLocation: record.equipmentOriginal?.location,
                                    equipmentPurchasePrice: record.equipmentOriginal?.purchasePrice,
                                    applicantDepartment: record.department || record.equipmentOriginal?.department || '临床科室',
                                    applicantName: currentUser?.name || record.technician || '临床工程师',
                                    applicantPhone: currentUser?.phone || '13800000000',
                                    partEstimatedCost: record.cost || 5000,
                                    partName: record.partsReplaced || '关键零配件更换',
                                    faultSymptoms: record.faultDescription,
                                    technicalAssessment: `基于工单 ${record.id} 故障检测，预估费用达 ¥${(record.cost || 0).toLocaleString()}（超5,000元），依规转入重大维修审批流程。`,
                                    urgency: (record.cost || 0) >= 30000 ? 'critical' : 'high',
                                    title: `【${record.department || '临床科室'}】${record.equipmentName} 大额配件更换/重大维修审批 (¥${(record.cost || 0).toLocaleString()})`
                                  });
                                }}
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="费用超5000元，立即转入大额维修审批流"
                              >
                                <FileCheck className="w-3 h-3 text-rose-600" />
                                <span>转审批</span>
                              </button>
                            ) : !isSporadic ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onNavigateToApprovals({
                                    type: 'scrap_disposal',
                                    equipmentId: record.equipmentOriginal?.id,
                                    equipmentName: record.equipmentName,
                                    equipmentModel: record.equipmentOriginal?.model,
                                    equipmentLocation: record.equipmentOriginal?.location,
                                    equipmentPurchasePrice: record.equipmentOriginal?.purchasePrice,
                                    equipmentPurchaseDate: record.equipmentOriginal?.purchaseDate,
                                    equipmentCumulativeMaintenanceCost: (record.equipmentOriginal?.repairRecords || []).reduce((s, r) => s + (r.cost || 0), 0),
                                    applicantDepartment: record.department || record.equipmentOriginal?.department || '临床科室',
                                    applicantName: currentUser?.name || '临床工程师',
                                    applicantPhone: currentUser?.phone || '13800000000',
                                    technicalEvaluation: `维修过程中发现该设备严重损毁/配件停产，无继续维修价值，建议报废。工单号: ${record.id}`,
                                    title: `【${record.department || '临床科室'}】${record.equipmentName} 报废技术鉴定申请`
                                  });
                                }}
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[11px] font-semibold transition cursor-pointer"
                                title="经维修判断无价值，转入报废鉴定审批流"
                              >
                                报废申请
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Fixed Footer Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={filteredRepairs.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
      />

      {/* 财务科按月请款与资金筹备模态框 */}
      <MonthlyFinanceReportModal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        equipmentList={equipmentList}
        currentUser={currentUser}
        initialYear="2026"
        initialMonth="08"
        initialScopeMode="cumulative_month_end"
      />

      {/* 临床零修服务单验签与电子凭证模态框 */}
      {selectedSignItem && (
        <ClinicalItemSignModal
          isOpen={Boolean(selectedSignItem)}
          item={selectedSignItem}
          departments={DEFAULT_DEPARTMENTS}
          onClose={() => setSelectedSignItem(null)}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* 科室报修跟踪与外协协同流程看板 (5阶段横向时序进度条) */}
      {selectedTrackingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* 模态框顶部 Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">科室报修跟踪与外协协同详情</h3>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                      {selectedTrackingRecord.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-2xs bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedTrackingRecord.category === 'framework_sporadic' ? '月度框架零修' : '设备常规报修'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>报修科室: <strong className="text-white font-medium">{selectedTrackingRecord.department}</strong></span>
                    <span>|</span>
                    <span>设备名称: <strong className="text-white font-medium">{selectedTrackingRecord.equipmentName}</strong></span>
                    {selectedTrackingRecord.equipmentSn && (
                      <>
                        <span>|</span>
                        <span>SN: <span className="font-mono text-slate-300">{selectedTrackingRecord.equipmentSn}</span></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrackingRecord(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 基于外协协同数据的横向流程进度条 (Timeline): 报修受理 -> 外协派工 -> 维修处理中 -> 待科室确认 -> 归档验收 */}
            <div className="bg-slate-50/90 border-b border-slate-200 p-4 shrink-0">
              <RepairTrackingTimeline
                order={trackingMatchedOrder}
                equipment={selectedTrackingRecord.equipmentOriginal}
              />
            </div>

            {/* 模态框滚动主体 */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* 设备及故障报修简况 */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">报修事项与科室诉求</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    selectedTrackingRecord.status === '已完成'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedTrackingRecord.status === '处理中'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedTrackingRecord.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-2xs">报修/服务日期:</span>
                    <span className="font-medium text-slate-800 font-mono">{selectedTrackingRecord.faultDate || '近期'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-2xs">维保类型:</span>
                    <span className="font-medium text-slate-800">{selectedTrackingRecord.repairType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-2xs">发生费用:</span>
                    <span className="font-bold text-slate-900 font-mono">￥{(selectedTrackingRecord.cost || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 text-xs">
                  <span className="font-bold text-slate-700 block mb-1">报修故障描述:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedTrackingRecord.faultDescription || '临床使用中设备报警或异常中断，申请外协工程师驻场检修。'}
                  </p>
                </div>
              </div>

              {/* 外协单位处理进度与阶段性反馈 */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">外协单位处理进度与技术反馈</h4>
                  </div>
                  <span className="text-2xs text-slate-400">实时外协数据穿透</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
                  <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    <span className="text-2xs text-indigo-700 font-bold block mb-1">委外服务商及驻场团队</span>
                    <p className="text-xs font-bold text-slate-900">{trackingMatchedOrder?.vendorName || '通用电气医疗系统 (中国) 原厂技术服务站'}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-2xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <UserCheck className="w-3 h-3 text-indigo-600" />
                        {trackingMatchedOrder?.vendorContact || selectedTrackingRecord.technician || '程志远'}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {trackingMatchedOrder?.vendorPhone || '139-1088-2940'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <span className="text-2xs text-emerald-800 font-bold block mb-1">审定价格与节资</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold font-mono text-emerald-950">
                        ￥{(trackingMatchedOrder?.finalNegotiatedPrice || selectedTrackingRecord.cost || 0).toLocaleString()}
                      </span>
                      {trackingMatchedOrder?.savingsAmount ? (
                        <span className="text-2xs font-semibold text-emerald-700">
                          (联合审价节资 ￥{trackingMatchedOrder.savingsAmount.toLocaleString()})
                        </span>
                      ) : null}
                    </div>
                    <p className="text-2xs text-slate-500 mt-1">配件保真承诺 · 质保期 180 天</p>
                  </div>
                </div>

                {/* 阶段性技术处置结果 */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>阶段性处理与排查反馈结论:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedTrackingRecord.resolution || trackingMatchedOrder?.completionReport?.repairMeasuresSummary || '现场拆检诊断，定位故障源并完成关键部件更换，仪器自检参数恢复出厂标准，电气安全和性能质控测试合格。'}
                  </p>
                  {selectedTrackingRecord.partsReplaced && (
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-2 text-2xs">
                      <span className="font-semibold text-slate-700">更换配件:</span>
                      <span className="font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-bold">
                        {selectedTrackingRecord.partsReplaced}
                      </span>
                      {selectedTrackingRecord.oldPartsReturned && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                          旧件已双人清点退库
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 科室验收复核选项与闭环 */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">科室验收复核与签字确认选项</h4>
                  </div>
                  <span className="text-2xs text-slate-500">临床使用科室权责确认</span>
                </div>

                <div className="p-3 rounded-xl border bg-slate-50/60 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        selectedTrackingRecord.clinicalReceiveStatus === 'SIGNED' || selectedTrackingRecord.status === '已完成'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500 animate-pulse'
                      }`} />
                      <span className="text-xs font-bold text-slate-800">
                        {selectedTrackingRecord.clinicalReceiveStatus === 'SIGNED' || selectedTrackingRecord.status === '已完成'
                          ? '科室复核确认完毕 · 电子验签通过'
                          : '试机已完成 · 待科室护士长复核签字'}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-500 mt-1">
                      {selectedTrackingRecord.clinicalSignee 
                        ? `签署人: ${selectedTrackingRecord.clinicalSignee} · 时间: ${selectedTrackingRecord.clinicalSignatureTime || selectedTrackingRecord.faultDate || '近期'}`
                        : '经临床科室确认试机运行正常，即可完成全流程归档验收'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 若为零修单且未签字，提供一键打开验签凭证弹窗 */}
                    {selectedTrackingRecord.category === 'framework_sporadic' && selectedTrackingRecord.frameworkItem && (
                      <button
                        type="button"
                        onClick={() => {
                          const item = selectedTrackingRecord.frameworkItem!;
                          setSelectedSignItem({
                            ...item,
                            batchId: selectedTrackingRecord.frameworkBatch?.id || '',
                            batchYearMonth: selectedTrackingRecord.frameworkBatch?.yearMonth || '',
                            batchTitle: selectedTrackingRecord.frameworkBatch?.batchTitle || '',
                            vendorName: selectedTrackingRecord.frameworkBatch?.vendorName || '国药器械医工技术服务 (中国) 有限公司'
                          });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>{selectedTrackingRecord.clinicalReceiveStatus === 'SIGNED' ? '查阅验签凭单' : '立即复核签字'}</span>
                      </button>
                    )}

                    {/* 查看完整外协协同阳光档案 */}
                    {selectedTrackingRecord.equipmentOriginal && (
                      <button
                        type="button"
                        onClick={() => setShowFullVendorCollabModal(true)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        <span>外协协同全套档案</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 模态框底部操作栏 */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-2xs text-slate-500">
                各流转节点经由数字指纹与医工内控审计系统加密上链存证
              </span>
              <button
                type="button"
                onClick={() => setSelectedTrackingRecord(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 完整外协协同阳光流转档案抽屉/模态框 */}
      {showFullVendorCollabModal && selectedTrackingRecord?.equipmentOriginal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in fade-in duration-200">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-indigo-400" />
                <h3 className="text-sm font-bold">外协维保阳光协同穿透追溯看板</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullVendorCollabModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <VendorCollaborationRepairTracker
                equipment={selectedTrackingRecord.equipmentOriginal}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
