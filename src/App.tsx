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
  AuthUser
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
import { AddEquipmentModal } from './components/AddEquipmentModal';
import { AddRepairModal } from './components/AddRepairModal';
import { StatusChangeModal } from './components/StatusChangeModal';
import { AiDiagnosticsModal } from './components/AiDiagnosticsModal';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { QrLabelModal } from './components/QrLabelModal';
import { BatchTransferModal } from './components/BatchTransferModal';
import { CalibrationAgencyModal } from './components/CalibrationAgencyModal';
import { MaintenancePlansView } from './components/MaintenancePlansView';
import { RepairLogsView } from './components/RepairLogsView';
import { TrackingView } from './components/TrackingView';
import { AnalyticsView } from './components/AnalyticsView';
import { DashboardView } from './components/DashboardView';
import { StatusBar } from './components/StatusBar';
import { PartnerManagementView } from './components/PartnerManagementView';
import { PartnerDetailModal } from './components/PartnerDetailModal';
import { AddPartnerModal } from './components/AddPartnerModal';
import { MasterDataView } from './components/MasterDataView';
import { EmergencyReserveView } from './components/EmergencyReserveView';
import { LoginPage } from './components/LoginPage';
import { INITIAL_EMERGENCY_EQUIPMENT } from './utils/emergencyReserveData';

import { getEquipmentValidityInfo } from './utils/validityUtils';
import { getEquipmentCalibrationInfo } from './utils/calibrationUtils';
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
  MASTER_DATA_STORAGE_KEYS
} from './utils/masterData';
import { Lock, ShieldAlert, ArrowRight, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function App() {
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
    return merged;
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
        }
      })
      .catch(err => {
        console.warn('Could not fetch staff from server', err);
      });
  }, []);

  const handleUpdateStaff = async (newStaff: StaffPersonMaster[]) => {
    setStaff(newStaff);
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
    monthlyRepairCost: INITIAL_EQUIPMENT.reduce((s, e) => s + e.repairRecords.reduce((rs, r) => rs + (r.cost || 0), 0), 0)
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
  const [splitCategories, setSplitCategories] = useState<boolean>(true);

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
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<MedicalEquipment | null>(null);

  const [isRepairModalOpen, setIsRepairModalOpen] = useState<boolean>(false);
  const [repairPreSelectedDevice, setRepairPreSelectedDevice] = useState<MedicalEquipment | null>(null);

  const [isStatusChangeModalOpen, setIsStatusChangeModalOpen] = useState<boolean>(false);
  const [statusChangeDevice, setStatusChangeDevice] = useState<MedicalEquipment | null>(null);

  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiPreSelectedDevice, setAiPreSelectedDevice] = useState<MedicalEquipment | null>(null);

  // Agency Modal State
  const [agencyModalName, setAgencyModalName] = useState<string | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // QR Label Modal State
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrModalEquipment, setQrModalEquipment] = useState<MedicalEquipment[]>([]);

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
      if (json.success) {
        if (overwrite) {
          setEquipmentList(importedItems);
        } else {
          setEquipmentList(prev => [...importedItems, ...prev]);
        }
      } else {
        setEquipmentList(prev => overwrite ? importedItems : [...importedItems, ...prev]);
      }
    } catch {
      setEquipmentList(prev => overwrite ? importedItems : [...importedItems, ...prev]);
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
    const targetList = (isHeadNurse(currentUser) && userDept)
      ? equipmentList.filter(e => e.department === userDept)
      : equipmentList;

    const totalCount = targetList.length;
    const normalCount = targetList.filter(e => e.status === '正常运行').length;
    const maintenanceCount = targetList.filter(e => e.status === '维护保养中').length;
    const faultCount = targetList.filter(e => e.status === '故障待修').length;
    const decommissionedCount = targetList.filter(e => e.status === '停用/报废').length;
    const totalValue = targetList.reduce((sum, e) => sum + e.purchasePrice, 0);

    let monthlyRepairCost = 0;
    targetList.forEach(e => {
      e.repairRecords.forEach(r => {
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

  // 护士长专属科室数据范围严格隔离：护士长仅可查看其所属科室的设备台账与相关记录
  const userAccessibleEquipment = useMemo(() => {
    const userDept = getUserDepartment(currentUser);
    if (isHeadNurse(currentUser) && userDept) {
      return equipmentList.filter(e => e.department === userDept);
    }
    return equipmentList;
  }, [equipmentList, currentUser]);

  // Filtered and Sorted Equipment List
  const filteredEquipment = useMemo(() => {
    const list = userAccessibleEquipment.filter((item) => {
      const kw = filterState.keyword.toLowerCase().trim();
      const matchesKeyword =
        !kw ||
        item.id.toLowerCase().includes(kw) ||
        item.name.toLowerCase().includes(kw) ||
        item.sn.toLowerCase().includes(kw) ||
        item.model.toLowerCase().includes(kw) ||
        item.manufacturer.toLowerCase().includes(kw) ||
        item.category.toLowerCase().includes(kw) ||
        (item.level1Category && item.level1Category.toLowerCase().includes(kw)) ||
        (item.level2Category && item.level2Category.toLowerCase().includes(kw)) ||
        (item.building && item.building.toLowerCase().includes(kw)) ||
        (item.floor && item.floor.toLowerCase().includes(kw)) ||
        (item.calibrationUnit && item.calibrationUnit.toLowerCase().includes(kw)) ||
        (item.calibrationCertificateNo && item.calibrationCertificateNo.toLowerCase().includes(kw)) ||
        (item.nursePhone && item.nursePhone.toLowerCase().includes(kw));

      const matchesDept = !filterState.department || item.department === filterState.department;
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

      return matchesKeyword && matchesDept && matchesStatus && matchesCategory && matchesLevel1 && matchesValidity && matchesCalibration;
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
    setFilterState({
      keyword: '',
      department: '',
      status: '',
      category: '',
      level1Category: '',
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

  const handleBatchStatusChange = (newStatus: EquipmentStatus) => {
    if (selectedIds.length === 0) return;
    setEquipmentList(prev =>
      prev.map(item => (selectedIds.includes(item.id) ? { ...item, status: newStatus } : item))
    );
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
    if (isHeadNurse(user) && dept) {
      setFilterState(prev => ({ ...prev, department: dept }));
    } else if (isClinicalStaff(user) && dept && !isHospitalWidePerspective(user)) {
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
    if (isHeadNurse(newUser) && dept) {
      setFilterState(prev => ({ ...prev, department: dept }));
    } else if (isClinicalStaff(newUser) && dept && !isHospitalWidePerspective(newUser)) {
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
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
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
        />

        {/* Main Workspace Body */}
        <main className="flex-1 p-3.5 overflow-hidden flex flex-col gap-3 bg-slate-50">
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
                   currentUser={currentUser}
                   onNavigateToTab={setActiveTab}
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
                   currentUser={currentUser}
                   onOpenAddModal={() => {
                     setEditingDevice(null);
                     setIsAddModalOpen(true);
                   }}
                   onOpenImportModal={() => setIsImportModalOpen(true)}
                   onOpenQrModal={() => handleOpenQrModal()}
                   onExportCsv={handleExportCsv}
                 />

                 {/* Segment 2: Data Table */}
                 <EquipmentTable
                   equipmentList={paginatedEquipment}
                   selectedIds={selectedIds}
                   currentPage={currentPage}
                   pageSize={pageSize}
                   sortField={filterState.sortField}
                   sortOrder={filterState.sortOrder}
                   density={tableDensity}
                   splitCategories={splitCategories}
                   columnVisibility={columnVisibility}
                   onSortFieldChange={handleSortFieldChange}
                   onToggleSelectAll={handleToggleSelectAll}
                   onToggleSelectRow={handleToggleSelectRow}
                   onViewDetails={(item) => setDetailDevice(item)}
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
                   onViewAgencyTransactions={(agencyName) => {
                     handleOpenPartnerByName(agencyName);
                   }}
                   onBatchDelete={handleBatchDelete}
                   onBatchStatusChange={handleBatchStatusChange}
                   onBatchExport={handleBatchExport}
                   onBatchTransfer={handleOpenTransferModal}
                   onBatchQrPrint={handleOpenQrModal}
                   onClearSelection={() => setSelectedIds([])}
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
               onOpenRepairModal={(device) => {
                 setRepairPreSelectedDevice(device);
                 setIsRepairModalOpen(true);
               }}
               onOpenAiModal={(device) => {
                 setAiPreSelectedDevice(device);
                 setIsAiModalOpen(true);
               }}
               onViewDeviceDetail={(device) => setDetailDevice(device)}
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
               onViewPartner={handleOpenPartnerByName}
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

           {activeTab === 'analytics' && (
             <AnalyticsView equipmentList={userAccessibleEquipment} />
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

          {activeTab === 'ai' && (
            <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs p-6">
              <div className="max-w-2xl mx-auto text-center space-y-4 my-auto">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <span className="font-bold text-xl">AI</span>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Gemini 医疗设备智能诊断与维保智库</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  为全院多参数监护仪、便携超声、双相除颤仪、重症呼吸机、CT/MRI等高精尖医学装备提供核心故障排查、零部件匹配及急救临床替代风险评估。
                </p>
                <button
                  onClick={() => {
                    setAiPreSelectedDevice(null);
                    setIsAiModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-md font-bold text-sm shadow-xs transition cursor-pointer"
                >
                  🚀 启动 Gemini 智能排查视窗
                </button>
              </div>
            </div>
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
        onClose={() => setDetailDevice(null)}
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
        onViewAgencyTransactions={(agency) => {
          handleOpenPartnerByName(agency);
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
            ...(isHeadNurse(currentUser) && dept ? { department: dept } : {})
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
            ...(isHeadNurse(currentUser) && dept ? { department: dept } : {})
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
        onClose={() => {
          setIsRepairModalOpen(false);
          setRepairPreSelectedDevice(null);
        }}
        onSubmitRepair={handleSubmitRepair}
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
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBatchImport}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allEquipment={equipmentList}
        filteredEquipment={filteredEquipment}
        selectedEquipment={equipmentList.filter(e => selectedIds.includes(e.id))}
      />

      <QrLabelModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        equipmentList={qrModalEquipment}
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
    </div>
  );
}
