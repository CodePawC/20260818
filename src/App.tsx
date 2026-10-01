import { VendorPortalView } from "./components/VendorPortalView";
import { VendorCollaborationHospitalView } from "./components/VendorCollaborationHospitalView";
import { VendorCollaborationOrder, VendorUserAccount } from "./types/vendorCollaborationTypes";
import { 
  getVendorCollaborationOrders, 
  saveVendorCollaborationOrders, 
  syncVendorCollaborationToPartner, 
  VENDOR_ACCOUNTS 
} from "./utils/vendorCollaborationData";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  MedicalEquipment, 
  EquipmentFilterState, 
  SystemStats, 
  EquipmentStatus, 
  SortField, 
  SortOrder, 
  ColumnVisibility, 
  DEFAULT_COLUMN_VISIBILITY, 
  PartnerOrganization,
  CampusMaster,
  BuildingMaster,
  LocationRoomMaster,
  DepartmentMaster,
  StaffPersonMaster,
  NmpaCategoryMasterItem,
  AuthUser,
  OverdueFilingRecord,
  EquipmentViewMode
} from './types';
import { DEFAULT_NMPA_CATEGORY_MASTER } from './utils/nmpaCategoryData';
import { INITIAL_EQUIPMENT } from './mockData';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { EquipmentFilterBar } from './components/EquipmentFilterBar';
import { EquipmentTable } from './components/EquipmentTable';
import { Pagination } from './components/Pagination';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { OverdueEquipmentFilingModal } from './components/OverdueEquipmentFilingModal';
import { GlobalQuickSearchModal } from './components/GlobalQuickSearchModal';
import { AddEquipmentModal } from './components/AddEquipmentModal';
import { AddRepairModal } from './components/AddRepairModal';
import { StatusChangeModal } from './components/StatusChangeModal';
import { AiDiagnosticsModal } from './components/AiDiagnosticsModal';
import { AiDimensionAnalysisModal } from './components/AiDimensionAnalysisModal';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { QrLabelModal } from './components/QrLabelModal';
import { BatchTransferModal } from './components/BatchTransferModal';
import { CalibrationAgencyModal } from './components/CalibrationAgencyModal';
import { DepartmentDetailModal } from './components/DepartmentDetailModal';
import { MaintenancePlansView } from './components/MaintenancePlansView';
import { RepairLogsView } from './components/RepairLogsView';
import { DispatchWorkOrderView } from './components/DispatchWorkOrderView';
import { SparePartsWarehouseView } from './components/SparePartsWarehouseView';
import { AdverseEventReportingView } from './components/AdverseEventReportingView';
import { TrackingView } from './components/TrackingView';
import { AnalyticsView } from './components/AnalyticsView';
import { RoiAnalyticsView } from './components/RoiAnalyticsView';
import { DashboardView } from './components/DashboardView';
import { StatusBar } from './components/StatusBar';
import { PartnerManagementView } from './components/PartnerManagementView';
import { PartnerDetailModal } from './components/PartnerDetailModal';
import { AddPartnerModal } from './components/AddPartnerModal';
import { MasterDataView } from './components/MasterDataView';
import { EmergencyReserveView } from './components/EmergencyReserveView';
import { MobileInspectionView } from './components/MobileInspectionView';
import { ApprovalsView } from './components/ApprovalsView';
import { LoginPage } from './components/LoginPage';
import { FactoryRepairWorkflowView } from './components/factory_repair/FactoryRepairWorkflowView';
import { RepairClosedLoopView } from './components/RepairClosedLoopView';
import { RegulationsView } from './components/RegulationsView';
import { ProjectConcludingView } from './components/project_concluding/ProjectConcludingView';
import { BorrowEquipmentModal } from './components/BorrowEquipmentModal';
import { ReturnEquipmentModal } from './components/ReturnEquipmentModal';
import { LoanVoucherPrintModal } from './components/LoanVoucherPrintModal';
import { INITIAL_EMERGENCY_EQUIPMENT } from './utils/emergencyReserveData';
import { ApprovalApplication } from './types/approvalTypes';
import { INITIAL_APPROVAL_APPLICATIONS } from './utils/approvalMockData';
import { EquipmentLoanRecord } from './types';
import { CheckCircle2 } from 'lucide-react';

import { getEquipmentValidityInfo } from './utils/validityUtils';
import { getEquipmentCalibrationInfo } from './utils/calibrationUtils';
import { getEquipmentHealthScore } from './utils/equipmentUtils';
import { DEFAULT_PARTNERS, findOrCreatePartnerProfile } from './utils/partnerData';
import { 
  loadSavedUser, 
  saveUserToStorage, 
  canAccessTab, 
  canManageEquipment, 
  canManageMasterData,
  createAuthUserFromStaff,
  isHeadNurse,
  isClinicalStaff,
  isHospitalWidePerspective,
  canViewAllEquipment,
  isDepartmentRestricted,
  isEquipmentBelongingToDepartment,
  getUserDepartment,
  SUPER_ADMIN_USER
} from './utils/authUtils';
import { 
  loadMasterData, 
  saveMasterData, 
  DEFAULT_CAMPUSES, 
  DEFAULT_BUILDINGS, 
  DEFAULT_DEPARTMENTS, 
  DEFAULT_STAFF, 
  DEFAULT_ROOMS,
  MASTER_DATA_STORAGE_KEYS,
  enrichEquipmentWithMasterData
} from './utils/masterData';
import { batchAssignPureNumericInternalNos } from './utils/internalNoGenerator';
import { Lock, ShieldAlert, ArrowRight, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function App() {
  const [currentVendor, setCurrentVendor] = useState<VendorUserAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem("active_vendor_account");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [vendorCollabOrders, setVendorCollabOrders] = useState<VendorCollaborationOrder[]>(() => {
    return getVendorCollaborationOrders();
  });

  const handleUpdateVendorOrder = (updatedOrder: VendorCollaborationOrder) => {
    const nextOrders = vendorCollabOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setVendorCollabOrders(nextOrders);
    saveVendorCollaborationOrders(nextOrders);
  };

  const handleArchiveVendorOrder = (archivedOrder: VendorCollaborationOrder) => {
    const nextOrders = vendorCollabOrders.map(o => o.id === archivedOrder.id ? archivedOrder : o);
    setVendorCollabOrders(nextOrders);
    saveVendorCollaborationOrders(nextOrders);
    // 自动双向同步至往来合作单位
    syncVendorCollaborationToPartner(archivedOrder);
  };

  const handleLoginAsVendor = (vendor: VendorUserAccount) => {
    setCurrentVendor(vendor);
    sessionStorage.setItem("active_vendor_account", JSON.stringify(vendor));
  };

  const handleLogoutVendor = () => {
    setCurrentVendor(null);
    sessionStorage.removeItem("active_vendor_account");
  };

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return loadSavedUser();
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [equipmentList, setEquipmentList] = useState<MedicalEquipment[]>(() => {
    // 确保医疗设备应急库的设备全部加载到全院台账中
    const existingIds = new Set(INITIAL_EQUIPMENT.map(e => e.id));
    const merged = [...INITIAL_EQUIPMENT];
    INITIAL_EMERGENCY_EQUIPMENT.forEach(item => {
      if (!existingIds.has(item.id)) {
        merged.push(item);
        existingIds.add(item.id);
      }
    });
    // 全量按照「科室 + 二级品目」纯数字自增规则赋予内部编号
    const enriched = merged.map(item => enrichEquipmentWithMasterData(item));
    return batchAssignPureNumericInternalNos(enriched);
  });
  
  // Partners & External Collaborators state
  const [partners, setPartners] = useState<PartnerOrganization[]>(() => {
    try {
      const saved = localStorage.getItem('hospital-partner-organizations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to load partners from storage', err);
    }
    return DEFAULT_PARTNERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hospital-partner-organizations', JSON.stringify(partners));
    } catch (err) {
      console.warn('Failed to persist partners', err);
    }
  }, [partners]);

  // ==================== 组织与空间主数据 (Master Data) ====================
  const [campuses, setCampuses] = useState<CampusMaster[]>(() => {
    return loadMasterData().campuses;
  });
  const [buildings, setBuildings] = useState<BuildingMaster[]>(() => {
    return loadMasterData().buildings;
  });
  const [rooms, setRooms] = useState<LocationRoomMaster[]>(() => {
    return loadMasterData().rooms;
  });
  const [departments, setDepartments] = useState<DepartmentMaster[]>(() => {
    return loadMasterData().departments;
  });
  const [staff, setStaff] = useState<StaffPersonMaster[]>(() => {
    return loadMasterData().staff;
  });

  // NMPA 22大类医疗器械分类目录主数据
  const [categoryMaster, setCategoryMaster] = useState<NmpaCategoryMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem('hospital-nmpa-category-master');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse nmpa category master from storage', e);
    }
    return DEFAULT_NMPA_CATEGORY_MASTER;
  });

  // ==================== 业务审批流与立项流转数据 (Approval Hub Applications) ====================
  const [approvalApplications, setApprovalApplications] = useState<ApprovalApplication[]>(() => {
    try {
      const saved = localStorage.getItem('hospital-approval-applications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load approvals from storage', e);
    }
    return INITIAL_APPROVAL_APPLICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hospital-approval-applications', JSON.stringify(approvalApplications));
    } catch (e) {
      console.warn('Failed to persist approvals', e);
    }
  }, [approvalApplications]);

  const [initialApprovalData, setInitialApprovalData] = useState<Partial<ApprovalApplication> | null>(null);

  const pendingApprovalCount = useMemo(() => {
    return approvalApplications.filter(a => a.status.startsWith('pending_')).length;
  }, [approvalApplications]);

  const handleNavigateToApprovals = (data: Partial<ApprovalApplication>) => {
    setInitialApprovalData(data);
    setActiveTab('approvals');
  };

  // 不良事件 (MDR) 直报联动选定设备
  const [initialAdverseEventEquipment, setInitialAdverseEventEquipment] = useState<MedicalEquipment | null>(null);

  // 全局交互操作反馈通知 (Toast)
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => prev?.text === text ? null : prev);
    }, 4500);
  };

  const handleNavigateToAdverseEvent = (eq?: MedicalEquipment) => {
    setInitialAdverseEventEquipment(eq || null);
    setActiveTab('adverse_events');
  };

  // 从后端API获取最新的分类目录主数据
  useEffect(() => {
    fetch('/api/nmpa-categories')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategoryMaster(json.data);
          try {
            localStorage.setItem('hospital-nmpa-category-master', JSON.stringify(json.data));
          } catch (e) {}
        }
      })
      .catch(err => {
        console.warn('Could not fetch nmpa categories from server', err);
      });

    // 从后端API获取人员与工程师最新数据
    fetch('/api/staff')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStaff(json.data);
          saveMasterData(undefined, undefined, undefined, undefined, json.data);
        }
      })
      .catch(err => {
        console.warn('Could not fetch staff from server', err);
      });
  }, []);

  const handleUpdateStaff = async (newStaff: StaffPersonMaster[]) => {
    setStaff(newStaff);
    saveMasterData(undefined, undefined, undefined, undefined, newStaff);
    try {
      await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });
    } catch (err) {
      console.error('Failed to sync staff to backend', err);
    }
  };

  const handleUpdateCategoryMaster = async (newCategories: NmpaCategoryMasterItem[]) => {
    setCategoryMaster(newCategories);
    try {
      localStorage.setItem('hospital-nmpa-category-master', JSON.stringify(newCategories));
    } catch (e) {}
    try {
      await fetch('/api/nmpa-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories)
      });
    } catch (err) {
      console.error('Failed to sync nmpa categories to backend', err);
    }
  };

  useEffect(() => {
    saveMasterData(campuses, buildings, rooms, departments, staff);
  }, [campuses, buildings, rooms, departments, staff]);

  const handleResetAllMasterData = () => {
    setCampuses(DEFAULT_CAMPUSES);
    setBuildings(DEFAULT_BUILDINGS);
    setRooms(DEFAULT_ROOMS);
    setDepartments(DEFAULT_DEPARTMENTS);
    setStaff(DEFAULT_STAFF);
    saveMasterData(DEFAULT_CAMPUSES, DEFAULT_BUILDINGS, DEFAULT_ROOMS, DEFAULT_DEPARTMENTS, DEFAULT_STAFF);
  };

  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<PartnerOrganization | null>(null);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState<boolean>(false);
  const [editingPartner, setEditingPartner] = useState<PartnerOrganization | null>(null);

  const [stats, setStats] = useState<SystemStats>({
    totalCount: INITIAL_EQUIPMENT.length,
    normalCount: INITIAL_EQUIPMENT.filter(e => e.status === '正常运行').length,
    maintenanceCount: INITIAL_EQUIPMENT.filter(e => e.status === '维护保养中').length,
    faultCount: INITIAL_EQUIPMENT.filter(e => e.status === '故障待修').length,
    decommissionedCount: INITIAL_EQUIPMENT.filter(e => e.status === '停用/报废').length,
    totalValue: INITIAL_EQUIPMENT.reduce((s, e) => s + e.purchasePrice, 0),
    monthlyRepairCost: INITIAL_EQUIPMENT.reduce((s, e) => s + (e.repairRecords || []).reduce((rs, r) => rs + (r.cost || 0), 0), 0)
  });

  // Filters state
  const [filterState, setFilterState] = useState<EquipmentFilterState>({
    keyword: '',
    department: '',
    status: '',
    category: '',
    sortField: 'categoryNo',
    sortOrder: 'asc'
  });

  // Table selection & pagination & density & split columns & column visibility
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [tableDensity, setTableDensity] = useState<'default' | 'compact'>('default');

  // 台账视图模式：紧凑表格 | 大卡片平铺 | 设备照片流
  const [viewMode, setViewMode] = useState<EquipmentViewMode>(() => {
    try {
      const saved = localStorage.getItem('equipment-ledger-view-mode');
      if (saved === 'compact_table' || saved === 'card_grid' || saved === 'photo_stream') {
        return saved as EquipmentViewMode;
      }
    } catch (err) {
      console.warn('Failed to load view mode', err);
    }
    return 'compact_table';
  });

  const handleViewModeChange = (newMode: EquipmentViewMode) => {
    setViewMode(newMode);
    try {
      localStorage.setItem('equipment-ledger-view-mode', newMode);
    } catch (err) {
      console.warn('Failed to save view mode', err);
    }
  };

  const [splitCategories, setSplitCategories] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('equipment-table-split-categories');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.warn('Failed to load split categories setting', err);
    }
    return false; // 默认使用分类合并模式
  });

  useEffect(() => {
    try {
      localStorage.setItem('equipment-table-split-categories', JSON.stringify(splitCategories));
    } catch (err) {
      console.warn('Failed to save split categories setting', err);
    }
  }, [splitCategories]);

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem('equipment-table-column-visibility');
      if (saved) {
        return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(saved) };
      }
    } catch (err) {
      console.warn('Failed to load column visibility settings', err);
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('equipment-table-column-visibility', JSON.stringify(columnVisibility));
    } catch (err) {
      console.warn('Failed to save column visibility settings', err);
    }
  }, [columnVisibility]);

  const handleToggleColumn = (key: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetColumns = () => {
    setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
  };

  // Modals
  const [detailDevice, setDetailDevice] = useState<MedicalEquipment | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'basic' | 'timeline' | 'roi' | 'repairs' | 'cost_analysis' | 'logs' | 'loans' | 'acceptance' | undefined>(undefined);

  const handleUpdateEquipmentDirectly = (updatedItem: MedicalEquipment) => {
    setEquipmentList(prev => prev.map(e => e.id === updatedItem.id ? updatedItem : e));
    if (detailDevice && detailDevice.id === updatedItem.id) {
      setDetailDevice(updatedItem);
    }
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<MedicalEquipment | null>(null);

  const [isRepairModalOpen, setIsRepairModalOpen] = useState<boolean>(false);
  const [repairPreSelectedDevice, setRepairPreSelectedDevice] = useState<MedicalEquipment | null>(null);

  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState<boolean>(false);
  const [statusChangeDevice, setStatusChangeDevice] = useState<MedicalEquipment | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiPreSelectedDevice, setAiPreSelectedDevice] = useState<MedicalEquipment | null>(null);

  // 全局智慧命令盘搜索模态框状态与快捷键
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 超期服役稳定性检测与备案申报模态框状态
  const [overdueFilingDevice, setOverdueFilingDevice] = useState<MedicalEquipment | null>(null);

  // 保存超期服役稳定性检测备案，并自动关联审批流与建立台账复合标识
  const handleSaveOverdueFiling = (equipmentId: string, filing: OverdueFilingRecord) => {
    // 1. 同步更新设备台账中的 overdueFiling 信息
    setEquipmentList(prev => prev.map(eq => {
      if (eq.id === equipmentId) {
        return {
          ...eq,
          overdueFiling: filing,
          notes: `${eq.notes ? eq.notes + ' | ' : ''}超期服役稳定性检测备案生效 (备案号: ${filing.filingNo}, 准用至: ${filing.validUntil})`
        };
      }
      return eq;
    }));

    // 2. 自动生成并在审批流中归档超期准用审批单
    const targetEq = equipmentList.find(e => e.id === equipmentId);
    const eqName = targetEq?.name || '申报设备';
    const deptName = targetEq?.department || currentUser?.departmentName || '医学工程保障中心';
    const newApprovalId = `APP-EXT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const newApprovalApp: ApprovalApplication = {
      id: newApprovalId,
      type: 'overdue_filing',
      title: `超期服役稳定性检测与准用备案: ${eqName} (超期+${filing.overdueYears}年)`,
      applicantId: currentUser?.id || 'STAFF-1002',
      applicantName: filing.leadEngineer || currentUser?.name || '崔伟',
      applicantDepartment: deptName,
      applicantPhone: filing.leadEngineerPhone || currentUser?.phone || '6802',
      urgency: 'high',
      status: 'approved',
      currentApprovalNode: '审批通过 · 准予实施与备案生效',
      nextApproverRole: '归档实施',
      createdAt: new Date().toLocaleString('zh-CN').slice(0, 16),
      updatedAt: new Date().toLocaleString('zh-CN').slice(0, 16),
      equipmentId: equipmentId,
      equipmentName: eqName,
      equipmentModel: targetEq?.model || '标准型',
      originalLifespanYears: filing.originalLifespanYears,
      overdueYears: filing.overdueYears,
      filingNo: filing.filingNo,
      refurbishDate: filing.refurbishDate,
      refurbishProvider: filing.refurbishProvider,
      refurbishCost: filing.refurbishCost,
      refurbishSummary: filing.refurbishSummary,
      partsReplacedList: filing.partsReplaced,
      stabilityTestDate: filing.stabilityTestDate,
      stabilityTestAgency: filing.stabilityTestAgency,
      stabilityTestReportNo: filing.stabilityTestReportNo,
      continuousRunHours: filing.continuousRunHours,
      extendedValidUntil: filing.validUntil,
      monitoringFrequency: filing.monitoringFrequency,
      technicalAssessment: `【72h稳定性测试与电气安全鉴定】\n检测机构: ${filing.stabilityTestAgency}\n检测报告号: ${filing.stabilityTestReportNo}\n连续满载运转工况: 满负荷连续运行 ${filing.continuousRunHours} 小时无故障，核心参数最大漂移率 ${filing.driftRate}\n医用电气安全（GB 9706.1）: 合格 (漏电流及保护接地阻抗符合国家标准)\n核定准用有效期限: 至 ${filing.validUntil}\n整修实施单位: ${filing.refurbishProvider} (支出 ¥${filing.refurbishCost.toLocaleString()})`,
      auditLogs: [
        {
          id: `LOG-APPLY-${Date.now()}`,
          nodeName: '临床使用科室 · 备案申报发起',
          operatorName: filing.leadEngineer || currentUser?.name || '崔伟',
          operatorRole: '主任工程师 / 申报科室负责人',
          operatorDept: deptName,
          action: 'agreed',
          comment: `设备经深度翻新整修并完成权威机构 72h 满负荷稳定性测试及 GB 9706.1 安全检验，测试数据全部达标，呈报备案。`,
          signatureUrl: `${filing.leadEngineer || '崔伟'}_signature`,
          operatedAt: new Date().toLocaleString('zh-CN')
        },
        {
          id: `LOG-COMMITTEE-${Date.now() + 1}`,
          nodeName: '医学装备管理委员会 · 特许准用终审',
          operatorName: filing.approverName || '张明理',
          operatorRole: filing.approverRole || '医学装备管理委员会主任 / 分管副院长',
          operatorDept: '院领导 / 医学装备管理委员会',
          action: 'agreed',
          comment: `准予备案生效。核发备案编号【${filing.filingNo}】，特许准用有效期至 ${filing.validUntil}。责令医学工程处严格落实【${filing.monitoringFrequency === 'MONTHLY' ? '按月缩周期重点质控巡检' : '按季度重点巡检'}】制度，并附贴专属绿色准用标识。`,
          signatureUrl: `${filing.approverName || '张明理'}_signature`,
          operatedAt: new Date().toLocaleString('zh-CN')
        }
      ]
    };

    setApprovalApplications(prev => [newApprovalApp, ...prev]);

    // 3. 弹出 Toast 提示
    showToast(`✅ 超期服役准用备案【${filing.filingNo}】已生效！台账已建立复合标识与专属准用标签。`);

    // 4. 同步更新当前打开的详情弹窗
    if (detailDevice && detailDevice.id === equipmentId) {
      setDetailDevice(prev => prev ? ({ ...prev, overdueFiling: filing }) : null);
    }
  };

  // AI 多维交互研判状态
  const [isAiDimensionModalOpen, setIsAiDimensionModalOpen] = useState<boolean>(false);
  const [aiDimensionSelectedDevice, setAiDimensionSelectedDevice] = useState<MedicalEquipment | null>(null);
  const [aiDimensionInitialDim, setAiDimensionInitialDim] = useState<any>(undefined);

  // 移动扫码巡检快捷联动设备
  const [preSelectedInspectionDeviceId, setPreSelectedInspectionDeviceId] = useState<string | null>(null);
  const handleNavigateToInspection = (device: MedicalEquipment) => {
    setDetailDevice(null);
    setPreSelectedInspectionDeviceId(device.id);
    setActiveTab('mobile_inspection');
  };

  const handleOpenAiDimensionModal = (device?: MedicalEquipment | any, initialDimension?: string) => {
    const isValidDevice = device && typeof device === 'object' && typeof device.id === 'string' && typeof device.name === 'string';
    const chosenDevice = isValidDevice
      ? device
      : (selectedIds.length === 1 ? (equipmentList.find(e => selectedIds.includes(e.id)) || equipmentList[0]) : null);

    const validDim = (typeof initialDimension === 'string' && initialDimension !== 'roi' 
      ? initialDimension 
      : (initialDimension === 'roi' ? 'roi_cost' : undefined));

    setAiDimensionSelectedDevice(chosenDevice);
    setAiDimensionInitialDim(validDim);
    setIsAiDimensionModalOpen(true);
  };

  // ROI Dashboard Selected Device State
  const [selectedRoiEquipmentId, setSelectedRoiEquipmentId] = useState<string | undefined>(undefined);

  // Agency Modal State
  const [agencyModalName, setAgencyModalName] = useState<string | null>(null);

  // Department Detail Modal State
  const [departmentModalName, setDepartmentModalName] = useState<string | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // QR Label Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrModalEquipment, setQrModalEquipment] = useState<MedicalEquipment[]>([]);

  // Inter-Department Loan / Borrowing Modals State
  const [borrowModalEquipment, setBorrowModalEquipment] = useState<MedicalEquipment | null>(null);
  const [returnModalEquipment, setReturnModalEquipment] = useState<MedicalEquipment | null>(null);
  const [printVoucherModalData, setPrintVoucherModalData] = useState<{
    equipment: MedicalEquipment;
    loanRecord: EquipmentLoanRecord;
    mode: 'loan' | 'return';
  } | null>(null);

  const handleConfirmBorrow = (
    equipmentId: string,
    loanRecord: EquipmentLoanRecord,
    shouldPrint?: boolean
  ) => {
    let targetEquipment: MedicalEquipment | null = null;

    setEquipmentList(prev => prev.map(item => {
      if (item.id === equipmentId) {
        const updated = {
          ...item,
          ownerDepartment: item.ownerDepartment || item.department,
          currentLoan: loanRecord
        };
        targetEquipment = updated;
        return updated;
      }
      return item;
    }));

    setDetailDevice(prev => {
      if (prev && prev.id === equipmentId) {
        return {
          ...prev,
          ownerDepartment: prev.ownerDepartment || prev.department,
          currentLoan: loanRecord
        };
      }
      return prev;
    });

    setBorrowModalEquipment(null);

    if (shouldPrint) {
      const eq = equipmentList.find(e => e.id === equipmentId);
      if (eq) {
        setPrintVoucherModalData({
          equipment: { ...eq, currentLoan: loanRecord },
          loanRecord,
          mode: 'loan'
        });
      }
    }
  };

  const handleConfirmReturn = (
    equipmentId: string,
    returnDetails: {
      actualReturnTime: string;
      returnReceiverName: string;
      returnNotes: string;
      equipmentStatusAfterReturn: '正常运行' | '维护保养中' | '故障待修';
    },
    shouldPrint?: boolean
  ) => {
    let completedRecord: EquipmentLoanRecord | null = null;
    let targetEquipment: MedicalEquipment | null = null;

    setEquipmentList(prev => prev.map(item => {
      if (item.id === equipmentId && item.currentLoan) {
        completedRecord = {
          ...item.currentLoan,
          loanStatus: 'returned',
          actualReturnTime: returnDetails.actualReturnTime,
          returnReceiverName: returnDetails.returnReceiverName,
          returnNotes: returnDetails.returnNotes
        };
        const updated: MedicalEquipment = {
          ...item,
          status: returnDetails.equipmentStatusAfterReturn,
          currentLoan: undefined,
          loanHistory: [completedRecord, ...(item.loanHistory || [])]
        };
        targetEquipment = updated;
        return updated;
      }
      return item;
    }));

    setDetailDevice(prev => {
      if (prev && prev.id === equipmentId && prev.currentLoan) {
        const completed: EquipmentLoanRecord = {
          ...prev.currentLoan,
          loanStatus: 'returned',
          actualReturnTime: returnDetails.actualReturnTime,
          returnReceiverName: returnDetails.returnReceiverName,
          returnNotes: returnDetails.returnNotes
        };
        return {
          ...prev,
          status: returnDetails.equipmentStatusAfterReturn,
          currentLoan: undefined,
          loanHistory: [completed, ...(prev.loanHistory || [])]
        };
      }
      return prev;
    });

    setReturnModalEquipment(null);

    if (shouldPrint) {
      const eq = equipmentList.find(e => e.id === equipmentId);
      if (eq && eq.currentLoan) {
        const rec: EquipmentLoanRecord = {
          ...eq.currentLoan,
          loanStatus: 'returned',
          actualReturnTime: returnDetails.actualReturnTime,
          returnReceiverName: returnDetails.returnReceiverName,
          returnNotes: returnDetails.returnNotes
        };
        setPrintVoucherModalData({
          equipment: eq,
          loanRecord: rec,
          mode: 'return'
        });
      }
    }
  };

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferEquipmentList, setTransferEquipmentList] = useState<MedicalEquipment[]>([]);

  const handleOpenQrModal = (specificItems?: MedicalEquipment[]) => {
    if (specificItems && specificItems.length > 0) {
      setQrModalEquipment(specificItems);
    } else {
      const selected = equipmentList.filter((eq) => selectedIds.includes(eq.id));
      setQrModalEquipment(selected.length > 0 ? selected : equipmentList.slice(0, 10));
    }
    setIsQrModalOpen(true);
  };

  const handleOpenTransferModal = () => {
    const selected = equipmentList.filter((eq) => selectedIds.includes(eq.id));
    if (selected.length === 0) {
      alert('请先勾选需要进行科室调拨的设备！');
      return;
    }
    setTransferEquipmentList(selected);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async (
    ids: string[],
    newDept: string,
    newBuilding: string,
    newFloor: string,
    newPhone: string,
    newManager: string,
    reason: string
  ) => {
    const locationStr = `${newBuilding} ${newFloor}F`;
    const updated = equipmentList.map((eq) => {
      if (ids.includes(eq.id)) {
        return {
          ...eq,
          department: newDept,
          location: locationStr,
          building: newBuilding,
          floor: newFloor,
          nursePhone: newPhone,
          departmentPhone: newPhone,
          manager: newManager,
          notes: `${eq.notes ? eq.notes + ' | ' : ''}科室调拨: ${eq.department} -> ${newDept} (${reason})`
        };
      }
      return eq;
    });

    setEquipmentList(updated);

    // Save to backend
    try {
      const itemsToUpdate = updated.filter((eq) => ids.includes(eq.id));
      await fetch('/api/equipment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToUpdate, overwrite: false })
      });
    } catch (err) {
      console.warn('Failed to save batch transfer to server', err);
    }
  };

  const handleBatchImport = async (importedItems: MedicalEquipment[], overwrite: boolean) => {
    try {
      const res = await fetch('/api/equipment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importedItems, overwrite })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEquipmentList(json.data);
      } else {
        if (overwrite) {
          setEquipmentList(importedItems);
        } else {
          const incomingIds = new Set(importedItems.map(i => i.id));
          setEquipmentList(prev => [...importedItems, ...prev.filter(e => !incomingIds.has(e.id))]);
        }
      }
    } catch {
      if (overwrite) {
        setEquipmentList(importedItems);
      } else {
        const incomingIds = new Set(importedItems.map(i => i.id));
        setEquipmentList(prev => [...importedItems, ...prev.filter(e => !incomingIds.has(e.id))]);
      }
    }
  };

  // Fetch data from server on boot
  const fetchEquipmentData = async () => {
    try {
      const res = await fetch('/api/equipment');
      const json = await res.json();
      if (json.success && json.data) {
        setEquipmentList(json.data);
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.warn('API connection failed, falling back to local memory store', err);
    }
  };

  useEffect(() => {
    fetchEquipmentData();
  }, []);

  // Recalculate stats whenever equipmentList changes locally
  useEffect(() => {
    const userDept = getUserDepartment(currentUser);
    const isRestricted = isDepartmentRestricted(currentUser);
    const targetList = (isRestricted && userDept)
      ? equipmentList.filter(e => isEquipmentBelongingToDepartment(e, userDept))
      : equipmentList;

    const totalCount = targetList.length;
    const normalCount = targetList.filter(e => e.status === '正常运行').length;
    const maintenanceCount = targetList.filter(e => e.status === '维护保养中').length;
    const faultCount = targetList.filter(e => e.status === '故障待修').length;
    const decommissionedCount = targetList.filter(e => e.status === '停用/报废').length;
    const totalValue = targetList.reduce((sum, e) => sum + e.purchasePrice, 0);

    let monthlyRepairCost = 0;
    targetList.forEach(e => {
      (e.repairRecords || []).forEach(r => {
        monthlyRepairCost += r.cost || 0;
      });
    });

    setStats({
      totalCount,
      normalCount,
      maintenanceCount,
      faultCount,
      decommissionedCount,
      totalValue,
      monthlyRepairCost
    });
  }, [equipmentList, currentUser]);

  // 科室专属技术台账数据范围严格隔离：不同科室只能查看自己科室的设备（含在册自有资产及从应急库借调在用的机具）
  const userAccessibleEquipment = useMemo(() => {
    const userDept = getUserDepartment(currentUser);
    if (isDepartmentRestricted(currentUser) && userDept) {
      return equipmentList.filter(e => isEquipmentBelongingToDepartment(e, userDept));
    }
    return equipmentList;
  }, [equipmentList, currentUser]);

  // Filtered and Sorted Equipment List
  const filteredEquipment = useMemo(() => {
    const list = userAccessibleEquipment.filter((item) => {
      const kw = filterState.keyword.toLowerCase().trim();
      const ownerDept = item.ownerDepartment || item.department;
      const isCurrentlyBorrowed = Boolean(item.currentLoan && item.currentLoan.loanStatus !== 'returned');
      const borrowingDept = item.currentLoan?.borrowingDepartment;

      const matchesKeyword =
        !kw ||
        item.id.toLowerCase().includes(kw) ||
        item.name.toLowerCase().includes(kw) ||
        item.sn.toLowerCase().includes(kw) ||
        item.model.toLowerCase().includes(kw) ||
        (item.internalNo && item.internalNo.toLowerCase().includes(kw)) ||
        (item.assetNo && item.assetNo.toLowerCase().includes(kw)) ||
        (item.assetOwnership && item.assetOwnership.toLowerCase().includes(kw)) ||
        (item.codeId && item.codeId.toLowerCase().includes(kw)) ||
        (item.usageLocation && item.usageLocation.toLowerCase().includes(kw)) ||
        item.manufacturer.toLowerCase().includes(kw) ||
        item.category.toLowerCase().includes(kw) ||
        (item.level1Category && item.level1Category.toLowerCase().includes(kw)) ||
        (item.level2Category && item.level2Category.toLowerCase().includes(kw)) ||
        (item.building && item.building.toLowerCase().includes(kw)) ||
        (item.floor && item.floor.toLowerCase().includes(kw)) ||
        (item.calibrationUnit && item.calibrationUnit.toLowerCase().includes(kw)) ||
        (item.calibrationCertificateNo && item.calibrationCertificateNo.toLowerCase().includes(kw)) ||
        (ownerDept && ownerDept.toLowerCase().includes(kw)) ||
        (borrowingDept && borrowingDept.toLowerCase().includes(kw)) ||
        (item.currentLoan?.borrowerName && item.currentLoan.borrowerName.toLowerCase().includes(kw)) ||
        (item.nursePhone && item.nursePhone.toLowerCase().includes(kw));

      let matchesDept = true;
      if (filterState.department) {
        if (filterState.deptScopeMode === 'in_use') {
          matchesDept = (!isCurrentlyBorrowed && ownerDept === filterState.department) || (isCurrentlyBorrowed && borrowingDept === filterState.department);
        } else {
          matchesDept = (ownerDept === filterState.department) || (isCurrentlyBorrowed && borrowingDept === filterState.department);
        }
      }

      let matchesLoan = true;
      if (filterState.loanStatus) {
        if (filterState.loanStatus === 'self_use') {
          matchesLoan = !isCurrentlyBorrowed;
        } else if (filterState.loanStatus === 'lent_out') {
          matchesLoan = isCurrentlyBorrowed;
        } else if (filterState.loanStatus === 'borrowed_in') {
          if (filterState.department) {
            matchesLoan = isCurrentlyBorrowed && borrowingDept === filterState.department;
          } else {
            matchesLoan = isCurrentlyBorrowed;
          }
        } else if (filterState.loanStatus === 'overdue') {
          matchesLoan = isCurrentlyBorrowed && item.currentLoan?.loanStatus === 'overdue';
        }
      }

      const matchesStatus = !filterState.status || item.status === filterState.status;
      
      const matchesCategory = (() => {
        if (!filterState.category) return true;
        const sel = filterState.category.trim();
        const selCodeMatch = sel.match(/^(\d{2})/);
        const selCode = selCodeMatch ? selCodeMatch[1] : '';
        const selClean = sel.replace(/^\d{2}\s*/, '').trim();

        // 1. Match by 2-digit categoryNo
        if (selCode && item.categoryNo === selCode) return true;

        // 2. Match by category name
        if (item.category === sel) return true;
        if (item.category) {
          const itemClean = item.category.replace(/^\d{2}\s*/, '').trim();
          if (itemClean === selClean) return true;
          if (selClean && (itemClean.includes(selClean) || selClean.includes(itemClean))) return true;
          if (item.category.includes(sel) || sel.includes(item.category)) return true;
        }
        return false;
      })();

      const matchesLevel1 = (() => {
        if (!filterState.level1Category) return true;
        const selL1 = filterState.level1Category.trim();
        const selL1CodeMatch = selL1.match(/^(\d{2}-\d{2})/);
        const selL1Code = selL1CodeMatch ? selL1CodeMatch[1] : '';
        const selL1Clean = selL1.replace(/^\d{2}-\d{2}\s*/, '').trim();

        if (selL1Code && (item.level1No === selL1Code || (item.categoryNo ? `${item.categoryNo}-${item.level1No}` === selL1Code : false))) return true;
        if (item.level1Category === selL1) return true;
        if (item.level1Category && selL1Clean && (item.level1Category.includes(selL1Clean) || selL1Clean.includes(item.level1Category))) return true;
        return false;
      })();

      let matchesValidity = true;
      if (filterState.validityRisk) {
        const vInfo = getEquipmentValidityInfo(item);
        if (filterState.validityRisk === 'high') {
          matchesValidity = vInfo.riskLevel === 'high';
        } else if (filterState.validityRisk === 'medium') {
          matchesValidity = vInfo.riskLevel === 'medium';
        } else if (filterState.validityRisk === 'low') {
          matchesValidity = vInfo.riskLevel === 'low';
        } else if (filterState.validityRisk === 'warning') {
          matchesValidity = vInfo.riskLevel === 'high' || vInfo.riskLevel === 'medium';
        }
      }

      let matchesCalibration = true;
      if (filterState.calibrationStatus) {
        const calInfo = getEquipmentCalibrationInfo(item);
        if (filterState.calibrationStatus === 'valid') {
          matchesCalibration = calInfo.statusType === 'valid';
        } else if (filterState.calibrationStatus === 'due_soon') {
          matchesCalibration = calInfo.statusType === 'due_soon';
        } else if (filterState.calibrationStatus === 'overdue') {
          matchesCalibration = calInfo.statusType === 'overdue';
        } else if (filterState.calibrationStatus === 'exempt') {
          matchesCalibration = calInfo.statusType === 'exempt';
        } else if (filterState.calibrationStatus === 'warning') {
          matchesCalibration = calInfo.statusType === 'due_soon' || calInfo.statusType === 'overdue';
        }
      }

      let matchesOverdue = true;
      if (filterState.overdueStatus) {
        const vInfo = getEquipmentValidityInfo(item);
        if (filterState.overdueStatus === 'all_overdue') {
          matchesOverdue = vInfo.isExpired;
        } else if (filterState.overdueStatus === 'filed_permitted') {
          matchesOverdue = vInfo.isExpired && vInfo.isFilingActive;
        } else if (filterState.overdueStatus === 'unfiled_pending') {
          matchesOverdue = vInfo.isExpired && !vInfo.isFilingActive;
        } else if (filterState.overdueStatus === 'near_expiry') {
          matchesOverdue = !vInfo.isExpired && vInfo.isExpiringSoon;
        }
      }

      // 视图模式专属一键快速筛选过滤 (例如：待维修、高价值、有照片、低健康分、计量待校准等)
      let matchesQuickFilter = true;
      if (filterState.quickFilter && filterState.quickFilter !== 'all') {
        const qKey = filterState.quickFilter;
        if (qKey === 'pending_repair') {
          // 待维修：故障待修 或 维护保养中
          matchesQuickFilter = item.status === '故障待修' || item.status === '维护保养中';
        } else if (qKey === 'high_value') {
          // 高价值设备：原值 >= 50万元
          matchesQuickFilter = (item.purchasePrice || 0) >= 500000;
        } else if (qKey === 'with_real_photo') {
          // 有实物照片
          matchesQuickFilter = Boolean(item.photoUrl || (item.devicePhotos && item.devicePhotos.length > 0));
        } else if (qKey === 'overdue_service') {
          // 超期/近失效
          const vInfo = getEquipmentValidityInfo(item);
          matchesQuickFilter = vInfo.isExpired || vInfo.isExpiringSoon || vInfo.isFilingActive;
        } else if (qKey === 'low_health') {
          // 健康评分预警 (<80分)
          const health = getEquipmentHealthScore(item);
          matchesQuickFilter = health.score < 80;
        } else if (qKey === 'calibration_due') {
          // 计量待校准 (到期或临期)
          const calInfo = getEquipmentCalibrationInfo(item);
          matchesQuickFilter = calInfo.statusType === 'due_soon' || calInfo.statusType === 'overdue';
        } else if (qKey === 'in_loan') {
          // 借调流转中
          matchesQuickFilter = Boolean(item.currentLoan && item.currentLoan.loanStatus !== 'returned');
        }
      }

      return matchesKeyword && matchesDept && matchesLoan && matchesStatus && matchesCategory && matchesLevel1 && matchesValidity && matchesCalibration && matchesOverdue && matchesQuickFilter;
    });

    const field = filterState.sortField;
    const order = filterState.sortOrder || 'asc';
    const mult = order === 'asc' ? 1 : -1;

    if (!field) return list;

    return [...list].sort((a, b) => {
      if (field === 'id') {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return (numA - numB) * mult;
        }
        return a.id.localeCompare(b.id, 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'categoryNo') {
        const cA = a.categoryNo || '';
        const cB = b.categoryNo || '';
        if (cA !== cB) return cA.localeCompare(cB, 'zh-CN', { numeric: true }) * mult;
        const l1A = a.level1No || '';
        const l1B = b.level1No || '';
        if (l1A !== l1B) return l1A.localeCompare(l1B, 'zh-CN', { numeric: true }) * mult;
        return (a.level2No || '').localeCompare(b.level2No || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'level1No') {
        const l1A = a.level1No || '';
        const l1B = b.level1No || '';
        if (l1A !== l1B) return l1A.localeCompare(l1B, 'zh-CN', { numeric: true }) * mult;
        return (a.level2No || '').localeCompare(b.level2No || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'level2No') {
        return (a.level2No || '').localeCompare(b.level2No || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'category') {
        return (a.category || '').localeCompare(b.category || '', 'zh-CN') * mult;
      }
      if (field === 'level1Category') {
        return (a.level1Category || '').localeCompare(b.level1Category || '', 'zh-CN') * mult;
      }
      if (field === 'level2Category') {
        return (a.level2Category || '').localeCompare(b.level2Category || '', 'zh-CN') * mult;
      }
      if (field === 'enableDate') {
        const tA = new Date(a.enableDate || '1970/1/1').getTime();
        const tB = new Date(b.enableDate || '1970/1/1').getTime();
        return (tA - tB) * mult;
      }
      if (field === 'manufactureDate') {
        const tA = new Date(a.manufactureDate || '1970/1/1').getTime();
        const tB = new Date(b.manufactureDate || '1970/1/1').getTime();
        return (tA - tB) * mult;
      }
      if (field === 'name') {
        return (a.name || '').localeCompare(b.name || '', 'zh-CN') * mult;
      }
      if (field === 'sn') {
        return (a.sn || '').localeCompare(b.sn || '', 'zh-CN') * mult;
      }
      if (field === 'department') {
        return (a.department || '').localeCompare(b.department || '', 'zh-CN') * mult;
      }
      if (field === 'building') {
        return (a.building || '').localeCompare(b.building || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'floor') {
        const fA = parseFloat(a.floor || '0');
        const fB = parseFloat(b.floor || '0');
        if (!isNaN(fA) && !isNaN(fB)) {
          return (fA - fB) * mult;
        }
        return (a.floor || '').localeCompare(b.floor || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'purchasePrice') {
        const pA = a.purchasePrice ?? 0;
        const pB = b.purchasePrice ?? 0;
        return (pA - pB) * mult;
      }
      if (field === 'repairCount') {
        const countA = a.repairRecords?.length || a.repairCount || 0;
        const countB = b.repairRecords?.length || b.repairCount || 0;
        return (countA - countB) * mult;
      }
      if (field === 'repairCost') {
        const costA = a.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
        const costB = b.repairRecords?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0;
        return (costA - costB) * mult;
      }
      if (field === 'status') {
        return (a.status || '').localeCompare(b.status || '', 'zh-CN') * mult;
      }
      if (field === 'internalNo') {
        return (a.internalNo || '').localeCompare(b.internalNo || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'assetNo') {
        return (a.assetNo || '').localeCompare(b.assetNo || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'codeId') {
        return (a.codeId || '').localeCompare(b.codeId || '', 'zh-CN', { numeric: true }) * mult;
      }
      if (field === 'assetOwnership') {
        return (a.assetOwnership || '').localeCompare(b.assetOwnership || '', 'zh-CN') * mult;
      }
      if (field === 'usageLocation') {
        return (a.usageLocation || '').localeCompare(b.usageLocation || '', 'zh-CN') * mult;
      }

      return 0;
    });
  }, [userAccessibleEquipment, filterState]);

  // Dynamically calculate stats based on current filtered equipment
  const filteredStats = useMemo(() => {
    const totalCount = filteredEquipment.length;
    const normalCount = filteredEquipment.filter(e => e.status === '正常运行').length;
    const maintenanceCount = filteredEquipment.filter(e => e.status === '维护保养中').length;
    const faultCount = filteredEquipment.filter(e => e.status === '故障待修').length;
    const decommissionedCount = filteredEquipment.filter(e => e.status === '停用/报废').length;
    const totalValue = filteredEquipment.reduce((sum, e) => sum + e.purchasePrice, 0);

    let monthlyRepairCost = 0;
    filteredEquipment.forEach(e => {
      e.repairRecords?.forEach(r => {
        monthlyRepairCost += r.cost || 0;
      });
    });

    return {
      totalCount,
      normalCount,
      maintenanceCount,
      faultCount,
      decommissionedCount,
      totalValue,
      monthlyRepairCost
    };
  }, [filteredEquipment]);

  // Paginated equipment list
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEquipment.slice(start, start + pageSize);
  }, [filteredEquipment, currentPage, pageSize]);

  // Handlers
  const handleSortFieldChange = (field: SortField) => {
    setFilterState(prev => {
      if (prev.sortField === field) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          ...prev,
          sortField: field,
          sortOrder: 'asc'
        };
      }
    });
  };

  const handleResetFilters = () => {
    const userDept = getUserDepartment(currentUser);
    const isRestricted = isDepartmentRestricted(currentUser);
    setFilterState({
      keyword: '',
      department: isRestricted && userDept ? userDept : '',
      status: '',
      category: '',
      level1Category: '',
      quickFilter: 'all',
      sortField: 'categoryNo',
      sortOrder: 'asc'
    });
    setCurrentPage(1);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedEquipment.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedEquipment.map(item => item.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Add / Edit Equipment
  const handleSaveEquipment = async (data: Partial<MedicalEquipment>) => {
    if (editingDevice) {
      // Edit
      try {
        const res = await fetch(`/api/equipment/${editingDevice.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success && json.data) {
          setEquipmentList(prev => prev.map(e => e.id === editingDevice.id ? json.data : e));
        } else {
          setEquipmentList(prev => prev.map(e => e.id === editingDevice.id ? { ...e, ...data } as MedicalEquipment : e));
        }
      } catch (err) {
        setEquipmentList(prev => prev.map(e => e.id === editingDevice.id ? { ...e, ...data } as MedicalEquipment : e));
      }
    } else {
      // Add
      try {
        const res = await fetch('/api/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success && json.data) {
          setEquipmentList(prev => [json.data, ...prev]);
        } else {
          fetchEquipmentData();
        }
      } catch (err) {
        fetchEquipmentData();
      }
    }
    setEditingDevice(null);
  };

  // Delete Equipment
  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm('确定将该设备从台账中永久移除吗？此操作不可撤销。')) {
      try {
        await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
        setEquipmentList(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        setEquipmentList(prev => prev.filter(e => e.id !== id));
      }
    }
  };

  // Submit Repair Record
  const handleSubmitRepair = async (repairData: any) => {
    try {
      const res = await fetch(`/api/equipment/${repairData.equipmentId}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repairData)
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEquipmentList(prev => prev.map(e => e.id === repairData.equipmentId ? json.data : e));
      } else {
        fetchEquipmentData();
      }
    } catch (err) {
      fetchEquipmentData();
    }
  };

  // Partner Handlers
  const handleOpenPartnerByName = (partnerName: string) => {
    if (!partnerName || partnerName === '-' || partnerName === '免检') return;
    const profile = findOrCreatePartnerProfile(partnerName, partners, userAccessibleEquipment);
    setSelectedPartnerDetail(profile);
  };

  const handleSavePartner = (partner: PartnerOrganization) => {
    setPartners(prev => {
      const idx = prev.findIndex(p => p.id === partner.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = partner;
        return next;
      }
      return [partner, ...prev];
    });
    setIsAddPartnerModalOpen(false);
    setEditingPartner(null);
  };

  const handleDeletePartner = (partnerId: string) => {
    if (window.confirm('确定要删除该往来单位档案吗？')) {
      setPartners(prev => prev.filter(p => p.id !== partnerId));
      if (selectedPartnerDetail?.id === partnerId) {
        setSelectedPartnerDetail(null);
      }
    }
  };

  // Status Change
  const handleSubmitStatusChange = async (id: string, newStatus: EquipmentStatus, reason: string, operator: string) => {
    try {
      const res = await fetch(`/api/equipment/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, reason, operator })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEquipmentList(prev => prev.map(e => e.id === id ? json.data : e));
        if (detailDevice && detailDevice.id === id) {
          setDetailDevice(json.data);
        }
        showToast(
          newStatus === '正常运行'
            ? `✅ 设备【${json.data.name}】已成功排除故障，恢复正常运行！`
            : `设备【${json.data.name}】状态已更新为【${newStatus}】`
        );
        fetchEquipmentData();
      } else {
        fetchEquipmentData();
      }
    } catch (err) {
      fetchEquipmentData();
    }
  };

  // Batch Actions
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 台设备台账记录吗？`)) {
      setEquipmentList(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const handleBatchStatusChange = async (newStatus: EquipmentStatus) => {
    if (selectedIds.length === 0) return;
    const targetIds = [...selectedIds];
    setEquipmentList(prev =>
      prev.map(item => (targetIds.includes(item.id) ? { ...item, status: newStatus, lastFaultReason: newStatus === '正常运行' ? undefined : item.lastFaultReason } : item))
    );
    try {
      await Promise.all(
        targetIds.map(id => 
          fetch(`/api/equipment/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              newStatus, 
              reason: newStatus === '正常运行' ? '批量故障排除并恢复正常运行' : `批量状态调整为${newStatus}`,
              operator: currentUser?.name || '医工工程师'
            })
          })
        )
      );
      showToast(
        newStatus === '正常运行'
          ? `✅ 选中的 ${targetIds.length} 台设备故障已全部修复并恢复正常运行！`
          : `已批量将 ${targetIds.length} 台设备状态更新为【${newStatus}】`
      );
      fetchEquipmentData();
    } catch (e) {
      console.error('Batch status change sync failed', e);
      fetchEquipmentData();
    }
  };

  const handleBatchExport = () => {
    setIsExportModalOpen(true);
  };

  // CSV Export
  const handleExportCsv = () => {
    setIsExportModalOpen(true);
  };

  // 认证与切换登录人员处理
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    saveUserToStorage(user);
    const dept = getUserDepartment(user);
    if (isDepartmentRestricted(user) && dept) {
      setFilterState(prev => ({ ...prev, department: dept }));
    } else {
      // 医疗设备科、工程师、院级管理员、外部维保/特检等一律重置为全院视角
      setFilterState(prev => ({ ...prev, department: '' }));
    }
    setCurrentPage(1);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveUserToStorage(null);
  };

  const handleSwitchUser = (newUser: AuthUser) => {
    setCurrentUser(newUser);
    saveUserToStorage(newUser);
    const dept = getUserDepartment(newUser);
    if (isDepartmentRestricted(newUser) && dept) {
      setFilterState(prev => ({ ...prev, department: dept }));
    } else {
      // 医疗设备科、工程师、院级管理员、外部维保/特检等一律重置为全院视角
      setFilterState(prev => ({ ...prev, department: '' }));
    }
    setCurrentPage(1);
    if (!canAccessTab(newUser, activeTab)) {
      setActiveTab('dashboard');
    }
  };

  // 如果未登录，展示医疗系统登录及主数据角色矩阵授权页面
  
  // 若已登录供应商身份，直接渲染专属供应商协同门户
  if (currentVendor) {
    return (
      <VendorPortalView
        currentVendor={currentVendor}
        orders={vendorCollabOrders}
        onUpdateOrder={handleUpdateVendorOrder}
        onLogout={handleLogoutVendor}
        onSwitchVendor={handleLoginAsVendor}
      />
    );
  }
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onLoginAsVendor={handleLoginAsVendor}
        masterStaff={staff}
      />
    );
  }

  // 检查当前Tab对于当前用户的访问权限
  const isCurrentTabRestricted = !canAccessTab(currentUser, activeTab);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        faultyCount={stats.faultCount}
        maintenanceCount={stats.maintenanceCount}
        emergencyReserveCount={equipmentList.filter(e => e.department === '医疗设备应急库' || e.department.includes('应急') || e.id.startsWith('EMG-')).length}
        partnerCount={partners.length}
        departmentCount={departments.length}
        pendingApprovalCount={pendingApprovalCount}
        currentUser={currentUser}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header (Clean Global Bar) */}
        <Header
          activeTab={activeTab}
          onOpenAiModal={() => {
            setAiPreSelectedDevice(null);
            setIsAiModalOpen(true);
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
          masterStaff={staff}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
          onQuickRepair={() => {
            setRepairPreSelectedDevice(null);
            setIsRepairModalOpen(true);
          }}
          onQuickEmergency={() => setActiveTab('emergency_reserve')}
          onQuickApprovals={() => setActiveTab('approvals')}
          onSwitchToVendorPortal={handleLoginAsVendor}
          pendingAlertsCount={stats.faultCount + pendingApprovalCount}
          faultCount={stats.faultCount}
          onRefreshData={fetchEquipmentData}
        />

        {/* Main Workspace Body */}
        <main className={`flex-1 min-h-0 flex flex-col ${
          activeTab === 'vendor_collaboration' || activeTab === 'dispatch'
            ? 'p-2 sm:p-2.5 gap-2 overflow-hidden bg-slate-100/70' 
            : activeTab === 'roi' || activeTab === 'master_data' || activeTab === 'partners' || activeTab === 'regulations'
            ? 'p-3 sm:p-3.5 lg:p-4 overflow-y-auto gap-3.5 bg-slate-100/70'
            : 'p-3 sm:p-3.5 lg:p-4 overflow-y-auto gap-3.5 bg-slate-100/70'
        }`}>
          {isCurrentTabRestricted ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto max-w-xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800">功能模块访问受限 (Permission Required)</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  当前登录身份 <strong className="text-slate-800 font-semibold">【{currentUser.name} ({currentUser.role})】</strong> 尚未分配此功能模块的管理权限。
                </p>
                <div className="mt-3 p-3.5 bg-slate-50 rounded-lg text-xs text-left text-slate-600 space-y-1.5 border border-slate-100">
                  <div>· 所属单位: <span className="font-semibold text-slate-700">{currentUser.organization}</span></div>
                  <div>· 归属部门: <span className="font-semibold text-slate-700">{currentUser.departmentName}</span></div>
                  <div>· 已获授权: <span className="font-semibold text-indigo-600">{currentUser.permissions.join('、') || '基础查阅'}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>返回工作台概览</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard View */}
              {activeTab === 'dashboard' && (
                 <DashboardView
                   stats={stats}
                   equipmentList={userAccessibleEquipment}
                   allEquipmentList={equipmentList}
                   currentUser={currentUser}
                   approvalApplications={approvalApplications}
                   onNavigateToTab={setActiveTab}
                   onNavigateToApprovals={handleNavigateToApprovals}
                   onBorrowEquipment={(item) => setBorrowModalEquipment(item)}
                   onReturnEquipment={(item) => setReturnModalEquipment(item)}
                   onNavigateToLedger={(statusFilter, departmentFilter) => {
                     setFilterState(prev => ({
                       ...prev,
                       ...(statusFilter !== undefined ? { status: statusFilter } : {}),
                       ...(departmentFilter !== undefined ? { department: departmentFilter } : {})
                     }));
                     setActiveTab('ledger');
                   }}
                   onOpenAddModal={() => {
                     setEditingDevice(null);
                     setIsAddModalOpen(true);
                   }}
                   onOpenRepairModal={(device) => {
                     setRepairPreSelectedDevice(device || null);
                     setIsRepairModalOpen(true);
                   }}
                   onOpenAiModal={(device) => {
                     setAiPreSelectedDevice(device || null);
                     setIsAiModalOpen(true);
                   }}
                   onOpenStatusModal={(device) => {
                     setStatusChangeDevice(device);
                     setIsStatusChangeModalOpen(true);
                   }}
                   onSelectDeviceDetail={(device) => setDetailDevice(device)}
                 />
               )}


           {/* Equipment Ledger View */}
           {activeTab === 'ledger' && (
             <>
               <StatsOverview
                 stats={filteredStats}
                 equipmentList={filteredEquipment}
                 activeStatusFilter={filterState.status}
                 onFilterByStatus={(status) => setFilterState(prev => ({ ...prev, status }))}
               />

               <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs">
                 {/* Segment 1: Filter Bar with Dedicated Ledger Actions */}
                 <EquipmentFilterBar
                   filterState={filterState}
                   setFilterState={setFilterState}
                   onReset={handleResetFilters}
                   totalFilteredCount={filteredEquipment.length}
                   departmentOptions={departments.map(d => d.name)}
                   categoryMaster={categoryMaster}
                   density={tableDensity}
                   onToggleDensity={() => setTableDensity(d => d === 'default' ? 'compact' : 'default')}
                   splitCategories={splitCategories}
                   onToggleSplitCategories={() => setSplitCategories(s => !s)}
                   columnVisibility={columnVisibility}
                   onToggleColumn={handleToggleColumn}
                   onResetColumnVisibility={handleResetColumns}
                   viewMode={viewMode}
                   onChangeViewMode={handleViewModeChange}
                   currentUser={currentUser}
                   onOpenAddModal={() => {
                     setEditingDevice(null);
                     setIsAddModalOpen(true);
                   }}
                   onOpenImportModal={() => setIsImportModalOpen(true)}
                   onOpenQrModal={() => handleOpenQrModal()}
                   onExportCsv={handleExportCsv}
                   onOpenAiDimensionModal={() => handleOpenAiDimensionModal()}
                 />

                 {/* Segment 2: Data Table */}
                 <EquipmentTable
                   equipmentList={paginatedEquipment}
                   filteredEquipment={filteredEquipment}
                   selectedIds={selectedIds}
                   currentPage={currentPage}
                   pageSize={pageSize}
                   sortField={filterState.sortField}
                   sortOrder={filterState.sortOrder}
                   density={tableDensity}
                   splitCategories={splitCategories}
                   columnVisibility={columnVisibility}
                   viewMode={viewMode}
                   onChangeViewMode={handleViewModeChange}
                   activeQuickFilter={filterState.quickFilter || 'all'}
                   onSelectQuickFilter={(quickKey) => {
                     setFilterState((prev) => ({
                       ...prev,
                       quickFilter: quickKey,
                     }));
                   }}
                   onSortFieldChange={handleSortFieldChange}
                   onToggleSelectAll={handleToggleSelectAll}
                   onToggleSelectRow={handleToggleSelectRow}
                   onViewDetails={(item, initialTab) => {
                     setDetailDevice(item);
                     setDetailInitialTab(initialTab);
                   }}
                   onAddRepairForDevice={(item) => {
                     setRepairPreSelectedDevice(item);
                     setIsRepairModalOpen(true);
                   }}
                   onChangeStatusForDevice={(item) => {
                     setStatusChangeDevice(item);
                     setIsStatusChangeModalOpen(true);
                   }}
                   onEditDevice={(item) => {
                     setEditingDevice(item);
                     setIsAddModalOpen(true);
                   }}
                   onDeleteDevice={handleDeleteEquipment}
                   onAiDiagnoseDevice={(item) => {
                     setAiPreSelectedDevice(item);
                     setIsAiModalOpen(true);
                   }}
                   onOpenAiDimensionModal={(device, dim) => {
                     handleOpenAiDimensionModal(device, dim);
                   }}
                   onViewDepartmentDetails={(deptName) => {
                     setDepartmentModalName(deptName);
                   }}
                   onViewAgencyTransactions={(agencyName) => {
                     handleOpenPartnerByName(agencyName);
                   }}
                   onBorrowEquipment={(item) => setBorrowModalEquipment(item)}
                   onReturnEquipment={(item) => setReturnModalEquipment(item)}
                   onBatchDelete={handleBatchDelete}
                   onBatchStatusChange={handleBatchStatusChange}
                   onBatchExport={handleBatchExport}
                   onBatchTransfer={handleOpenTransferModal}
                   onBatchQrPrint={handleOpenQrModal}
                   onClearSelection={() => setSelectedIds([])}
                   onNavigateToInspection={handleNavigateToInspection}
                   onPrintQrLabel={(device) => handleOpenQrModal([device])}
                   onOpenOverdueFiling={(device) => setOverdueFilingDevice(device)}
                 />

                 {/* Segment 3: Fixed Footer Pagination */}
                 <Pagination
                   currentPage={currentPage}
                   pageSize={pageSize}
                   totalCount={filteredEquipment.length}
                   onPageChange={setCurrentPage}
                   onPageSizeChange={(size) => {
                     setPageSize(size);
                     setCurrentPage(1);
                   }}
                 />
               </div>
             </>
           )}

           {activeTab === 'emergency_reserve' && (
             <EmergencyReserveView
               equipmentList={equipmentList}
               currentUser={currentUser}
               departments={departments}
               staff={staff}
               onConfirmBorrow={handleConfirmBorrow}
               onConfirmReturn={handleConfirmReturn}
               onOpenRepairModal={(device) => {
                 setRepairPreSelectedDevice(device);
                 setIsRepairModalOpen(true);
               }}
               onOpenAiModal={(device) => {
                 setAiPreSelectedDevice(device);
                 setIsAiModalOpen(true);
               }}
               onViewDeviceDetail={(device) => setDetailDevice(device)}
               onNavigateToApprovals={handleNavigateToApprovals}
             />
           )}

           {activeTab === 'approvals' && (
             <ApprovalsView
               applications={approvalApplications}
               onUpdateApplications={setApprovalApplications}
               equipmentList={equipmentList}
               currentUser={currentUser}
               initialCreateData={initialApprovalData}
               onClearInitialCreateData={() => setInitialApprovalData(null)}
               onUpdateEquipmentStatus={(eqId, status, reason) => {
                 handleSubmitStatusChange(eqId, status as EquipmentStatus, reason, currentUser?.name || '审批流联动执行');
               }}
               onUpdateEquipmentFiling={handleSaveOverdueFiling}
               onOpenPrintLabel={(eq) => handleOpenQrModal([eq])}
               onOpenOverdueFilingModal={(eq) => setOverdueFilingDevice(eq)}
             />
           )}

           {activeTab === 'maintenance' && (
             <MaintenancePlansView
               equipmentList={userAccessibleEquipment}
               currentUser={currentUser}
               onOpenRepairModalForDevice={(device) => {
                 setRepairPreSelectedDevice(device);
                 setIsRepairModalOpen(true);
               }}
             />
           )}

           {activeTab === 'repairs' && (
             <RepairLogsView
               equipmentList={userAccessibleEquipment}
               currentUser={currentUser}
               onOpenRepairModal={() => {
                 setRepairPreSelectedDevice(null);
                 setIsRepairModalOpen(true);
               }}
               onOpenAiDiagnose={(device) => {
                 setAiPreSelectedDevice(device);
                 setIsAiModalOpen(true);
               }}
               onViewPartner={handleOpenPartnerByName}
               onNavigateToApprovals={handleNavigateToApprovals}
               onOpenStatusChange={(device) => setStatusChangeDevice(device)}
             />
           )}

           {activeTab === 'dispatch' && (
             <DispatchWorkOrderView
               equipmentList={userAccessibleEquipment}
               currentUser={currentUser}
               onEquipmentUpdated={(updated) => {
                 setEquipmentList(prev => prev.map(e => e.id === updated.id ? updated : e));
               }}
             />
           )}

           {activeTab === 'parts_inventory' && (
             <SparePartsWarehouseView
               currentUserName={currentUser?.name}
               onNavigateToWorkOrder={() => {
                 setActiveTab('dispatch');
               }}
             />
           )}

           {activeTab === 'adverse_events' && (
             <AdverseEventReportingView
               equipmentList={userAccessibleEquipment}
               currentUserName={currentUser?.name}
               initialEquipmentForReport={initialAdverseEventEquipment}
               onNavigateToWorkOrder={() => {
                 setActiveTab('dispatch');
               }}
               onNavigateToEquipment={(eqId) => {
                 const target = equipmentList.find(e => e.id === eqId);
                 if (target) {
                   setDetailDevice(target);
                 }
               }}
             />
           )}

           {activeTab === 'tracking' && (
             <TrackingView
               equipmentList={userAccessibleEquipment}
               onOpenStatusChange={(device) => {
                 setStatusChangeDevice(device);
                 setIsStatusChangeModalOpen(true);
               }}
             />
           )}

           {activeTab === 'mobile_inspection' && (
             <MobileInspectionView
               equipmentList={userAccessibleEquipment}
               currentUser={currentUser}
               departments={departments}
               campuses={campuses}
               buildings={buildings}
               rooms={rooms}
               staff={staff}
               preSelectedEquipmentId={preSelectedInspectionDeviceId}
               onClearPreSelectedEquipment={() => setPreSelectedInspectionDeviceId(null)}
               onOpenQrModal={(list) => {
                 setQrModalEquipment(list);
                 setIsQrModalOpen(true);
               }}
               onUpdateEquipmentLocation={(id, newLocation, newBuilding, newFloor, newDept) => {
                 setEquipmentList(prev => prev.map(e => {
                   if (e.id === id) {
                     return {
                       ...e,
                       location: newLocation,
                       building: newBuilding || e.building,
                       floor: newFloor || e.floor,
                       department: newDept || e.department,
                       notes: `${e.notes ? e.notes + ' | ' : ''}移动盘点校准: ${newLocation}`
                     };
                   }
                   return e;
                 }));
               }}
               onSubmitStatusChange={handleSubmitStatusChange}
               onSubmitRepair={handleSubmitRepair}
               onViewDeviceDetail={(device) => setDetailDevice(device)}
             />
           )}

           {activeTab === 'analytics' && (
             <AnalyticsView
               equipmentList={userAccessibleEquipment}
               onViewDeviceDetail={(device) => setDetailDevice(device)}
               onNavigateToApprovals={handleNavigateToApprovals}
             />
           )}

           {activeTab === 'roi' && (
             <RoiAnalyticsView
               equipmentList={userAccessibleEquipment}
               initialSelectedEquipmentId={selectedRoiEquipmentId}
               onViewDeviceDetails={(device) => setDetailDevice(device)}
               onOpenAiDimensionModal={(device, dim) => handleOpenAiDimensionModal(device, dim)}
               onNavigateToTab={(tab) => setActiveTab(tab)}
             />
           )}

          {activeTab === "vendor_collaboration" && (
            <VendorCollaborationHospitalView
              orders={vendorCollabOrders}
              currentUser={currentUser}
              departments={departments}
              onUpdateOrder={handleUpdateVendorOrder}
              onArchiveOrder={handleArchiveVendorOrder}
              onSwitchToVendorPortal={handleLoginAsVendor}
            />
          )}

          {activeTab === 'factory_repair_workflow' && (
            <FactoryRepairWorkflowView currentUser={currentUser} />
          )}

          {activeTab === 'repair_closed_loop' && (
            <RepairClosedLoopView
              currentUser={currentUser}
              equipmentList={equipmentList}
              onUpdateEquipmentStatus={handleSubmitStatusChange}
              onNavigateToFactoryWorkflow={() => setActiveTab('factory_repair_workflow')}
              onNavigateToApprovals={() => setActiveTab('approvals')}
              approvalApplications={approvalApplications}
              onUpdateApprovalApplications={setApprovalApplications}
              showToast={showToast}
            />
          )}

          {activeTab === 'partners' && (
            <PartnerManagementView
              partners={partners}
              equipmentList={equipmentList}
              onOpenPartnerDetail={(partner) => setSelectedPartnerDetail(partner)}
              onOpenAddPartnerModal={() => {
                setEditingPartner(null);
                setIsAddPartnerModalOpen(true);
              }}
              onEditPartner={(partner) => {
                setEditingPartner(partner);
                setIsAddPartnerModalOpen(true);
              }}
              onDeletePartner={handleDeletePartner}
              onNavigateToEquipmentLedger={(partnerName) => {
                setFilterState((prev) => ({ ...prev, keyword: partnerName }));
                setActiveTab('ledger');
                setCurrentPage(1);
              }}
            />
          )}

          {activeTab === 'regulations' && (
            <RegulationsView
              currentUser={currentUser}
              departments={departments}
              onNavigateToTab={(tab) => {
                setActiveTab(tab);
              }}
              showToast={(msg) => {
                showToast(msg);
              }}
            />
          )}

          {activeTab === 'master_data' && (
            <MasterDataView
              campuses={campuses}
              buildings={buildings}
              rooms={rooms}
              departments={departments}
              staff={staff}
              equipmentList={equipmentList}
              categoryMaster={categoryMaster}
              currentUser={currentUser}
              onUpdateCampuses={setCampuses}
              onUpdateBuildings={setBuildings}
              onUpdateRooms={setRooms}
              onUpdateDepartments={setDepartments}
              onUpdateStaff={handleUpdateStaff}
              onUpdateCategoryMaster={handleUpdateCategoryMaster}
              onUpdateEquipmentList={setEquipmentList}
              onResetAllMasterData={handleResetAllMasterData}
              onResetDefaults={handleResetAllMasterData}
              onNavigateToDepartmentEquipment={(deptName) => {
                setFilterState(prev => ({ ...prev, department: deptName, keyword: '' }));
                setActiveTab('ledger');
                setCurrentPage(1);
              }}
            />
          )}

          {activeTab === 'project_concluding' && (
            <ProjectConcludingView
              currentUser={currentUser}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
            </>
          )}
        </main>

        {/* 3. Bottom Status Bar */}
        <StatusBar />
      </div>

      {/* Modals */}
      <EquipmentDetailModal
        equipment={detailDevice}
        allEquipment={userAccessibleEquipment}
        initialTab={detailInitialTab}
        onSaveEquipment={handleUpdateEquipmentDirectly}
        currentUser={currentUser}
        onClose={() => {
          setDetailDevice(null);
          setDetailInitialTab(undefined);
        }}
        onOpenRepairForDevice={(device) => {
          setDetailDevice(null);
          setRepairPreSelectedDevice(device);
          setIsRepairModalOpen(true);
        }}
        onOpenStatusChange={(device) => {
          setDetailDevice(null);
          setStatusChangeDevice(device);
          setIsStatusChangeModalOpen(true);
        }}
        onViewDepartmentDetails={(deptName) => {
          setDetailDevice(null);
          setDepartmentModalName(deptName);
        }}
        onViewAgencyTransactions={(agency) => {
          handleOpenPartnerByName(agency);
        }}
        onNavigateToApprovals={handleNavigateToApprovals}
        onNavigateToInspection={handleNavigateToInspection}
        onReportAdverseEvent={(device) => {
          setDetailDevice(null);
          handleNavigateToAdverseEvent(device);
        }}
        onBorrowEquipment={(item) => setBorrowModalEquipment(item)}
        onReturnEquipment={(item) => setReturnModalEquipment(item)}
        onNavigateToRoi={(eqId) => {
          setSelectedRoiEquipmentId(eqId);
          setActiveTab('roi');
        }}
        onOpenAiDimensionModal={(device, dim) => {
          handleOpenAiDimensionModal(device, dim);
        }}
        onPrintLoanVoucher={(eq, rec, mode) => {
          setPrintVoucherModalData({
            equipment: eq,
            loanRecord: rec,
            mode
          });
        }}
        onOpenOverdueFiling={(device) => {
          setDetailDevice(null);
          setOverdueFilingDevice(device);
        }}
        onPrintQrLabel={(device) => {
          handleOpenQrModal([device]);
        }}
      />

      {/* Department Detail Dossier Modal */}
      <DepartmentDetailModal
        isOpen={!!departmentModalName}
        departmentName={departmentModalName}
        allEquipment={userAccessibleEquipment}
        currentUser={currentUser}
        customDepartments={departments}
        customStaff={staff}
        customRooms={rooms}
        onClose={() => setDepartmentModalName(null)}
        onFilterByDepartment={(dept) => {
          setDepartmentModalName(null);
          setFilterState((prev) => ({
            ...prev,
            department: dept
          }));
          setActiveTab('ledger');
          setCurrentPage(1);
        }}
        onViewEquipmentDetail={(eq) => {
          setDepartmentModalName(null);
          setDetailDevice(eq);
        }}
        onAddRepairForEquipment={(eq) => {
          setDepartmentModalName(null);
          setRepairPreSelectedDevice(eq);
          setIsRepairModalOpen(true);
        }}
        onAddEquipmentForDepartment={(dept) => {
          setDepartmentModalName(null);
          setEditingDevice({
            id: '',
            name: '',
            categoryNo: '06',
            category: '医用成像器械',
            department: dept,
            status: '正常运行',
            calibration: 'No',
            repairRecords: []
          } as any);
          setIsAddModalOpen(true);
        }}
      />

      <CalibrationAgencyModal
        isOpen={!!agencyModalName}
        agencyName={agencyModalName}
        allEquipment={userAccessibleEquipment}
        currentUser={currentUser}
        onClose={() => setAgencyModalName(null)}
        onFilterByAgency={(agency) => {
          setAgencyModalName(null);
          const dept = getUserDepartment(currentUser);
          setFilterState((prev) => ({
            ...prev,
            keyword: agency,
            ...(isDepartmentRestricted(currentUser) && dept ? { department: dept } : {})
          }));
          setActiveTab('ledger');
          setCurrentPage(1);
        }}
        onViewEquipmentDetail={(eq) => {
          setAgencyModalName(null);
          setDetailDevice(eq);
        }}
        onAddRepairForEquipment={(eq) => {
          setAgencyModalName(null);
          setRepairPreSelectedDevice(eq);
          setIsRepairModalOpen(true);
        }}
      />

      {/* Partner Organization Detail Dossier Modal */}
      <PartnerDetailModal
        isOpen={!!selectedPartnerDetail}
        partner={selectedPartnerDetail}
        allEquipment={userAccessibleEquipment}
        currentUser={currentUser}
        onClose={() => setSelectedPartnerDetail(null)}
        onEditPartner={(partner) => {
          setSelectedPartnerDetail(null);
          setEditingPartner(partner);
          setIsAddPartnerModalOpen(true);
        }}
        onFilterByPartner={(partnerName) => {
          setSelectedPartnerDetail(null);
          const dept = getUserDepartment(currentUser);
          setFilterState((prev) => ({
            ...prev,
            keyword: partnerName,
            ...(isDepartmentRestricted(currentUser) && dept ? { department: dept } : {})
          }));
          setActiveTab('ledger');
          setCurrentPage(1);
        }}
        onAddRepairForEquipment={(eq) => {
          setSelectedPartnerDetail(null);
          if (eq) {
            setRepairPreSelectedDevice(eq);
          }
          setIsRepairModalOpen(true);
        }}
        onViewEquipmentDetail={(eq) => {
          setSelectedPartnerDetail(null);
          setDetailDevice(eq);
        }}
      />

      {/* Add / Edit Partner Modal */}
      <AddPartnerModal
        isOpen={isAddPartnerModalOpen}
        editingPartner={editingPartner}
        onClose={() => {
          setIsAddPartnerModalOpen(false);
          setEditingPartner(null);
        }}
        onSubmit={handleSavePartner}
      />

      <AddEquipmentModal
        isOpen={isAddModalOpen}
        editingEquipment={editingDevice}
        departments={departments}
        staff={staff}
        rooms={rooms}
        buildings={buildings}
        campuses={campuses}
        categoryMaster={categoryMaster}
        allEquipment={equipmentList}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDevice(null);
        }}
        onSubmit={handleSaveEquipment}
      />

      <AddRepairModal
        isOpen={isRepairModalOpen}
        equipmentList={equipmentList}
        preSelectedDevice={repairPreSelectedDevice}
        currentUser={currentUser}
        onClose={() => {
          setIsRepairModalOpen(false);
          setRepairPreSelectedDevice(null);
        }}
        onSubmitRepair={handleSubmitRepair}
        onNavigateToApprovals={handleNavigateToApprovals}
      />

      <StatusChangeModal
        equipment={statusChangeDevice}
        onClose={() => setStatusChangeDevice(null)}
        onSubmitStatusChange={handleSubmitStatusChange}
      />

      <AiDiagnosticsModal
        isOpen={isAiModalOpen}
        equipmentList={equipmentList}
        preSelectedDevice={aiPreSelectedDevice}
        onClose={() => {
          setIsAiModalOpen(false);
          setAiPreSelectedDevice(null);
        }}
        onOpenRepairModalWithData={(device, initialDesc, initialResolution) => {
          setRepairPreSelectedDevice(device);
          setIsRepairModalOpen(true);
        }}
        onOpenStatusChange={(device) => setStatusChangeDevice(device)}
      />

      <AiDimensionAnalysisModal
        isOpen={isAiDimensionModalOpen}
        onClose={() => {
          setIsAiDimensionModalOpen(false);
          setAiDimensionSelectedDevice(null);
          setAiDimensionInitialDim(undefined);
        }}
        equipmentList={equipmentList}
        preSelectedDevice={aiDimensionSelectedDevice}
        selectedIds={selectedIds}
        initialDimension={aiDimensionInitialDim}
        onOpenRepairModal={(device) => {
          setIsAiDimensionModalOpen(false);
          setRepairPreSelectedDevice(device);
          setIsRepairModalOpen(true);
        }}
        onOpenRepairModalWithData={(device, initialDesc, initialResolution) => {
          setIsAiDimensionModalOpen(false);
          setRepairPreSelectedDevice(device);
          setIsRepairModalOpen(true);
        }}
        onChangeStatusForDevice={(device) => {
          setIsAiDimensionModalOpen(false);
          setStatusChangeDevice(device);
          setIsStatusChangeModalOpen(true);
        }}
        onOpenRoiDashboard={(equipmentId) => {
          setIsAiDimensionModalOpen(false);
          setSelectedRoiEquipmentId(equipmentId);
          setActiveTab('roi');
        }}
        onOpenDetailsModal={(device) => {
          setIsAiDimensionModalOpen(false);
          setDetailDevice(device);
        }}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBatchImport}
        existingEquipment={equipmentList}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allEquipment={userAccessibleEquipment}
        filteredEquipment={filteredEquipment}
        selectedEquipment={userAccessibleEquipment.filter(e => selectedIds.includes(e.id))}
      />

      <QrLabelModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        equipmentList={qrModalEquipment}
      />

      {/* 全局智慧命令盘与设备/科室/SN全局速搜 (Ctrl+K) */}
      <GlobalQuickSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        equipmentList={userAccessibleEquipment}
        onSelectEquipment={(eq) => {
          setIsQuickSearchOpen(false);
          setDetailDevice(eq);
        }}
        onNavigateTab={(tab) => {
          setIsQuickSearchOpen(false);
          setActiveTab(tab);
        }}
      />

      {/* 超期服役稳定性检测与准用备案档案申报办理模态框 */}
      <OverdueEquipmentFilingModal
        equipment={overdueFilingDevice}
        currentUserName={currentUser?.name}
        onClose={() => setOverdueFilingDevice(null)}
        onSubmitFiling={handleSaveOverdueFiling}
        onOpenPrintLabel={(eq) => {
          setOverdueFilingDevice(null);
          handleOpenQrModal([eq]);
        }}
      />

      <BatchTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        selectedEquipment={transferEquipmentList}
        departments={departments}
        staff={staff}
        campuses={campuses}
        buildings={buildings}
        rooms={rooms}
        onConfirmTransfer={handleConfirmTransfer}
      />

      {/* 跨科室借用/调配出借登记弹窗 (主数据科室与人员调用、动态配件匹配) */}
      <BorrowEquipmentModal
        isOpen={!!borrowModalEquipment}
        equipment={borrowModalEquipment}
        onClose={() => setBorrowModalEquipment(null)}
        departments={departments}
        staff={staff}
        currentUser={currentUser}
        onConfirm={handleConfirmBorrow}
      />

      {/* 借用设备归还验收交接弹窗 (主数据人员核验、配件清点) */}
      <ReturnEquipmentModal
        isOpen={!!returnModalEquipment}
        equipment={returnModalEquipment}
        onClose={() => setReturnModalEquipment(null)}
        departments={departments}
        staff={staff}
        currentUser={currentUser}
        onConfirm={handleConfirmReturn}
      />

      {/* 纸质借还交接单据打印预览弹窗 (双联签字、归档留底) */}
      <LoanVoucherPrintModal
        isOpen={!!printVoucherModalData}
        equipment={printVoucherModalData?.equipment || null}
        loanRecord={printVoucherModalData?.loanRecord || null}
        mode={printVoucherModalData?.mode || 'loan'}
        onClose={() => setPrintVoucherModalData(null)}
      />

      {/* 全局操作交互反馈 (Toast Banner) */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/80 flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
