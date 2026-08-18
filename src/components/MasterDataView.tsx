import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Layers, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Phone, 
  UserCheck, 
  ShieldCheck, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Home,
  DoorOpen,
  Boxes,
  FileSpreadsheet,
  Zap,
  Activity,
  PhoneCall,
  Check,
  Filter,
  Eye,
  ChevronRight,
  Flame,
  Stethoscope,
  Scale
} from 'lucide-react';
import { 
  CampusMaster, 
  BuildingMaster, 
  LocationRoomMaster, 
  DepartmentMaster, 
  StaffPersonMaster, 
  MedicalEquipment,
  MetrologyCatalogueItem,
  NmpaCategoryMasterItem,
  AuthUser
} from '../types';
import { MetrologyCatalogueTab } from './MetrologyCatalogueTab';
import { NmpaCategoryTab } from './NmpaCategoryTab';
import { StaffMasterTab } from './StaffMasterTab';
import { DEFAULT_METROLOGY_CATALOGUE } from '../utils/metrologyCatalogueData';
import { DEFAULT_NMPA_CATEGORY_MASTER } from '../utils/nmpaCategoryData';
import { canManageMasterData } from '../utils/authUtils';

interface MasterDataViewProps {
  campuses: CampusMaster[];
  buildings: BuildingMaster[];
  rooms: LocationRoomMaster[];
  departments: DepartmentMaster[];
  staff: StaffPersonMaster[];
  equipmentList: MedicalEquipment[];
  catalogue?: MetrologyCatalogueItem[];
  categoryMaster?: NmpaCategoryMasterItem[];
  currentUser?: AuthUser;
  onUpdateCampuses: (campuses: CampusMaster[]) => void;
  onUpdateBuildings: (buildings: BuildingMaster[]) => void;
  onUpdateRooms: (rooms: LocationRoomMaster[]) => void;
  onUpdateDepartments: (departments: DepartmentMaster[]) => void;
  onUpdateStaff: (staff: StaffPersonMaster[]) => void;
  onUpdateCatalogue?: (catalogue: MetrologyCatalogueItem[]) => void;
  onUpdateCategoryMaster?: (categories: NmpaCategoryMasterItem[]) => void;
  onUpdateEquipmentList?: (list: MedicalEquipment[]) => void;
  onResetAllMasterData: () => void;
  onResetDefaults?: () => void;
  onNavigateToDepartmentEquipment?: (deptName: string) => void;
}

// 空间与院区层级前置 + 强检目录 + 医疗器械22大类分类目录主数据
type SubTab = 'space' | 'workplaces' | 'matrix' | 'departments' | 'staff' | 'category_master' | 'metrology_catalogue';

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  campuses,
  buildings,
  rooms,
  departments,
  staff,
  equipmentList,
  catalogue: externalCatalogue,
  categoryMaster: externalCategoryMaster,
  currentUser,
  onUpdateCampuses,
  onUpdateBuildings,
  onUpdateRooms,
  onUpdateDepartments,
  onUpdateStaff,
  onUpdateCatalogue: externalOnUpdateCatalogue,
  onUpdateCategoryMaster: externalOnUpdateCategoryMaster,
  onUpdateEquipmentList,
  onResetAllMasterData,
  onResetDefaults,
  onNavigateToDepartmentEquipment
}) => {
  const isMasterDataAdmin = canManageMasterData(currentUser);
  // 分类目录主数据持久化
  const [internalCategoryMaster, setInternalCategoryMaster] = useState<NmpaCategoryMasterItem[]>(() => {
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

  const activeCategoryMaster = externalCategoryMaster || internalCategoryMaster;

  const handleUpdateCategoryMaster = (newCategories: NmpaCategoryMasterItem[]) => {
    setInternalCategoryMaster(newCategories);
    try {
      localStorage.setItem('hospital-nmpa-category-master', JSON.stringify(newCategories));
    } catch (e) {
      console.warn('Failed to save nmpa category master to storage', e);
    }
    if (externalOnUpdateCategoryMaster) {
      externalOnUpdateCategoryMaster(newCategories);
    }
  };

  // 计量目录持久化内部或外部联动
  const [internalCatalogue, setInternalCatalogue] = useState<MetrologyCatalogueItem[]>(() => {
    try {
      const saved = localStorage.getItem('hospital-metrology-catalogue');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse metrology catalogue from storage', e);
    }
    return DEFAULT_METROLOGY_CATALOGUE;
  });

  const activeCatalogue = externalCatalogue || internalCatalogue;

  const handleUpdateCatalogue = (newCatalogue: MetrologyCatalogueItem[]) => {
    setInternalCatalogue(newCatalogue);
    try {
      localStorage.setItem('hospital-metrology-catalogue', JSON.stringify(newCatalogue));
    } catch (e) {
      console.warn('Failed to save metrology catalogue to storage', e);
    }
    if (externalOnUpdateCatalogue) {
      externalOnUpdateCatalogue(newCatalogue);
    }
  };

  const handleResetCatalogue = () => {
    setInternalCatalogue(DEFAULT_METROLOGY_CATALOGUE);
    try {
      localStorage.setItem('hospital-metrology-catalogue', JSON.stringify(DEFAULT_METROLOGY_CATALOGUE));
    } catch (e) {
      console.warn('Failed to reset metrology catalogue storage', e);
    }
    if (externalOnUpdateCatalogue) {
      externalOnUpdateCatalogue(DEFAULT_METROLOGY_CATALOGUE);
    }
  };

  // 默认进入第一顺位：院区与实体楼宇空间
  const [subTab, setSubTab] = useState<SubTab>('space');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 空间层级选择
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('all');
  const [selectedWorkplaceDept, setSelectedWorkplaceDept] = useState<string>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState<boolean>(false);

  // 科室层级筛选
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState<string>('all');
  const [selectedDeptCategory, setSelectedDeptCategory] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedEngineerFilter, setSelectedEngineerFilter] = useState<string>('all');
  const [onlyAdverseReport, setOnlyAdverseReport] = useState<boolean>(false);
  const [onlyEmergencyDeploy, setOnlyEmergencyDeploy] = useState<boolean>(false);

  // 人员层级筛选
  const [selectedStaffRole, setSelectedStaffRole] = useState<string>('all');

  // 弹窗状态
  const [editingDept, setEditingDept] = useState<DepartmentMaster | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  const [editingCampus, setEditingCampus] = useState<CampusMaster | null>(null);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  const [editingBuilding, setEditingBuilding] = useState<BuildingMaster | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);

  const [editingRoom, setEditingRoom] = useState<LocationRoomMaster | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const [editingStaff, setEditingStaff] = useState<StaffPersonMaster | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 设备在各科室的实际数量统计
  const deptEquipmentStats = useMemo(() => {
    const counts: Record<string, { count: number; value: number; normal: number }> = {};
    equipmentList.forEach(eq => {
      const deptName = eq.department || '未分配';
      if (!counts[deptName]) {
        counts[deptName] = { count: 0, value: 0, normal: 0 };
      }
      counts[deptName].count += 1;
      counts[deptName].value += eq.purchasePrice || 0;
      if (eq.status === '正常运行') {
        counts[deptName].normal += 1;
      }
    });
    return counts;
  }, [equipmentList]);

  // 学科分类字典列表
  const disciplineList = useMemo(() => {
    const set = new Set<string>();
    departments.forEach(d => {
      if (d.disciplineCategory) set.add(d.disciplineCategory);
    });
    return Array.from(set);
  }, [departments]);

  // 责任工程师字典列表
  const engineerList = useMemo(() => {
    const set = new Set<string>();
    departments.forEach(d => {
      if (d.defaultManager) set.add(d.defaultManager);
    });
    return Array.from(set);
  }, [departments]);

  // 过滤科室列表
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      // 搜索词
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.buildingName.toLowerCase().includes(q) ||
        (d.defaultFloor && d.defaultFloor.toLowerCase().includes(q)) ||
        (d.nursePhone && d.nursePhone.includes(q)) ||
        (d.disciplineCategory && d.disciplineCategory.toLowerCase().includes(q)) ||
        (d.hospitalName && d.hospitalName.toLowerCase().includes(q)) ||
        d.defaultManager.toLowerCase().includes(q);

      // 医院机构
      const matchHospital = selectedHospitalFilter === 'all' || 
        (d.hospitalName && d.hospitalName === selectedHospitalFilter) ||
        d.campusName === selectedHospitalFilter;

      // 楼号
      const matchBuilding = selectedBuildingId === 'all' || 
        d.buildingId === selectedBuildingId || 
        d.buildingName === selectedBuildingId;

      // 功能类别
      const matchCategory = selectedDeptCategory === 'all' || 
        d.category === selectedDeptCategory || 
        d.functionType === selectedDeptCategory;

      // 学科分类
      const matchDiscipline = selectedDiscipline === 'all' || d.disciplineCategory === selectedDiscipline;

      // 责任工程师
      const matchEngineer = selectedEngineerFilter === 'all' || d.defaultManager === selectedEngineerFilter;

      // 不良事件报告
      const matchAdverse = !onlyAdverseReport || !!d.adverseEventReporting;

      // 应急调配
      const matchEmergency = !onlyEmergencyDeploy || !!d.emergencyDeployment;

      return matchSearch && matchHospital && matchBuilding && matchCategory && matchDiscipline && matchEngineer && matchAdverse && matchEmergency;
    });
  }, [
    departments, 
    searchQuery, 
    selectedHospitalFilter, 
    selectedBuildingId, 
    selectedDeptCategory, 
    selectedDiscipline, 
    selectedEngineerFilter, 
    onlyAdverseReport, 
    onlyEmergencyDeploy
  ]);

  // 过滤人员
  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        s.name.toLowerCase().includes(q) ||
        s.employeeNo.toLowerCase().includes(q) ||
        s.departmentName.toLowerCase().includes(q) ||
        s.phone.includes(q);
      const matchRole = selectedStaffRole === 'all' || s.role === selectedStaffRole;
      return matchSearch && matchRole;
    });
  }, [staff, searchQuery, selectedStaffRole]);

  // 过滤空间/房间
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        r.roomName.toLowerCase().includes(q) ||
        r.roomCode.toLowerCase().includes(q) ||
        (r.workplaceId && r.workplaceId.toLowerCase().includes(q)) ||
        (r.departmentName && r.departmentName.toLowerCase().includes(q)) ||
        (r.officePhone && r.officePhone.toLowerCase().includes(q)) ||
        (r.shortPhone && r.shortPhone.toLowerCase().includes(q)) ||
        r.buildingName.toLowerCase().includes(q) ||
        r.floor.toLowerCase().includes(q) ||
        r.fullLocationPath.toLowerCase().includes(q);
      const matchCampus = selectedCampusId === 'all' || r.campusId === selectedCampusId;
      const matchBuilding = selectedBuildingId === 'all' || r.buildingId === selectedBuildingId || r.buildingName === selectedBuildingId;
      return matchSearch && matchCampus && matchBuilding;
    });
  }, [rooms, searchQuery, selectedCampusId, selectedBuildingId]);

  // 过滤具体工作场所与安装点名录 (Workplaces)
  const filteredWorkplaces = useMemo(() => {
    return rooms.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        r.roomName.toLowerCase().includes(q) ||
        r.roomCode.toLowerCase().includes(q) ||
        (r.workplaceId && r.workplaceId.toLowerCase().includes(q)) ||
        (r.departmentName && r.departmentName.toLowerCase().includes(q)) ||
        (r.officePhone && r.officePhone.toLowerCase().includes(q)) ||
        (r.shortPhone && r.shortPhone.toLowerCase().includes(q)) ||
        r.buildingName.toLowerCase().includes(q) ||
        r.floor.toLowerCase().includes(q) ||
        r.fullLocationPath.toLowerCase().includes(q);
        
      const matchCampus = selectedCampusId === 'all' || r.campusId === selectedCampusId;
      const matchBuilding = selectedBuildingId === 'all' || r.buildingId === selectedBuildingId || r.buildingName === selectedBuildingId;
      const matchFloor = selectedFloorFilter === 'all' || r.floor === selectedFloorFilter;
      const matchType = selectedRoomType === 'all' || r.roomType === selectedRoomType;
      const matchDept = selectedWorkplaceDept === 'all' || r.departmentName === selectedWorkplaceDept;
      const matchPhone = !hasPhoneOnly || Boolean(r.officePhone || r.shortPhone);

      return matchSearch && matchCampus && matchBuilding && matchFloor && matchType && matchDept && matchPhone;
    });
  }, [rooms, searchQuery, selectedCampusId, selectedBuildingId, selectedFloorFilter, selectedRoomType, selectedWorkplaceDept, hasPhoneOnly]);

  // 工作场所关联设备数统计
  const workplaceEquipmentCount = useMemo(() => {
    const counts: Record<string, number> = {};
    equipmentList.forEach(eq => {
      const loc = (eq.location || '').toLowerCase();
      rooms.forEach(r => {
        const rName = r.roomName.toLowerCase();
        const rCode = r.roomCode.toLowerCase();
        const wId = r.workplaceId ? r.workplaceId.toLowerCase() : '';
        if (
          (rName && loc.includes(rName)) || 
          (rCode && loc.includes(rCode)) ||
          (wId && loc.includes(wId))
        ) {
          counts[r.id] = (counts[r.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [equipmentList, rooms]);

  // 场所类型列表
  const roomTypesList = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => {
      if (r.roomType) set.add(r.roomType);
    });
    return Array.from(set);
  }, [rooms]);

  // 楼宇层级分布映射 (楼宇 -> 楼层 -> 科室列表)
  const buildingFloorDeptTree = useMemo(() => {
    const targetCampusBuildings = buildings.filter(b => selectedCampusId === 'all' || b.campusId === selectedCampusId);
    
    return targetCampusBuildings.map(b => {
      const floorsMap: Record<string, DepartmentMaster[]> = {};
      b.floors.forEach(f => {
        floorsMap[f] = [];
      });

      departments.forEach(dept => {
        if (dept.buildingId === b.id || dept.buildingName === b.name) {
          // 标准化楼层匹配
          const cleanDeptFloor = dept.defaultFloor.toUpperCase().replace('F', '') + 'F';
          const matchedFloorKey = b.floors.find(f => f.toUpperCase().replace('F', '') === dept.defaultFloor.toUpperCase().replace('F', '')) || dept.defaultFloor;
          if (!floorsMap[matchedFloorKey]) {
            floorsMap[matchedFloorKey] = [];
          }
          floorsMap[matchedFloorKey].push(dept);
        }
      });

      return {
        building: b,
        floorsMap
      };
    });
  }, [buildings, departments, selectedCampusId]);

  // 保存/删除科室
  const handleSaveDepartment = (dept: DepartmentMaster) => {
    const exists = departments.some(d => d.id === dept.id);
    if (exists) {
      onUpdateDepartments(departments.map(d => d.id === dept.id ? dept : d));
    } else {
      onUpdateDepartments([...departments, dept]);
    }
    setIsDeptModalOpen(false);
    setEditingDept(null);
  };

  const handleDeleteDepartment = (id: string, name: string) => {
    const count = deptEquipmentStats[name]?.count || 0;
    if (count > 0) {
      if (!window.confirm(`⚠️ 科室「${name}」名下目前登记有 ${count} 台医疗设备！删除后可能影响设备科室归属。确定继续删除吗？`)) {
        return;
      }
    } else {
      if (!window.confirm(`确定删除科室「${name}」的主数据吗？`)) return;
    }
    onUpdateDepartments(departments.filter(d => d.id !== id));
  };

  // 保存/删除人员
  const handleSaveStaff = (member: StaffPersonMaster) => {
    const exists = staff.some(s => s.id === member.id);
    if (exists) {
      onUpdateStaff(staff.map(s => s.id === member.id ? member : s));
    } else {
      onUpdateStaff([...staff, member]);
    }
    setIsStaffModalOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`确定删除人员「${name}」的主数据吗？`)) {
      onUpdateStaff(staff.filter(s => s.id !== id));
    }
  };

  // 保存/删除房间
  const handleSaveRoom = (room: LocationRoomMaster) => {
    const exists = rooms.some(r => r.id === room.id);
    if (exists) {
      onUpdateRooms(rooms.map(r => r.id === room.id ? room : r));
    } else {
      onUpdateRooms([...rooms, room]);
    }
    setIsRoomModalOpen(false);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (id: string, name: string) => {
    if (window.confirm(`确定删除空间房间「${name}」吗？`)) {
      onUpdateRooms(rooms.filter(r => r.id !== id));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 gap-3">
      {/* 1. Header Banner & Global KPI */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">组织与空间主数据中心 (Master Data Hub)</h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200">
                层级主数据 · 空间前置
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              按照<strong>「院区机构 → 实体楼宇 → 楼层空间 → 归属科室 → 责任工程师」</strong>标准层级构建，赋能设备录入、级联调拨、应急调配与不良事件报告。
            </p>
          </div>
        </div>

        {/* Global Statistics Chips */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2">
            <Home className="w-4 h-4 text-indigo-600" />
            <span className="text-indigo-900 font-medium">院区机构:</span>
            <strong className="font-mono text-indigo-700 text-sm">{campuses.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-blue-900 font-medium">实体楼宇:</span>
            <strong className="font-mono text-blue-700 text-sm">{buildings.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-900 font-medium">标准科室:</span>
            <strong className="font-mono text-emerald-700 text-sm">{departments.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span className="text-amber-900 font-medium">在册责任人:</span>
            <strong className="font-mono text-amber-700 text-sm">{staff.length}</strong>
          </div>
          <button
            onClick={() => {
              if (window.confirm('确定将所有主数据重置为五莲县人民医院与皮肤病医院完整标准字典模板吗？')) {
                onResetAllMasterData();
              }
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center gap-1 cursor-pointer transition text-xs font-medium"
            title="重置为主数据标准模板"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            恢复默认
          </button>
        </div>
      </div>

      {/* 2. SubTabs Navigation & Action Toolbar (空间与院区置于第一位) */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {/* TAB 1: 院区与楼宇空间 (首位) */}
          <button
            onClick={() => setSubTab('space')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'space' 
                ? 'bg-white text-indigo-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>1. 院区与楼宇 ({buildings.length}楼 / {campuses.length}院区)</span>
          </button>

          {/* TAB 2: 具体工作场所与安装点名录 */}
          <button
            onClick={() => setSubTab('workplaces')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'workplaces' 
                ? 'bg-white text-indigo-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DoorOpen className="w-4 h-4 text-emerald-600" />
            <span>2. 场所与安装点名录 ({rooms.length})</span>
          </button>

          {/* TAB 3: 空间资产分布拓扑 */}
          <button
            onClick={() => setSubTab('matrix')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'matrix' 
                ? 'bg-white text-indigo-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-4 h-4 text-blue-600" />
            <span>3. 空间资产拓扑</span>
          </button>

          {/* TAB 4: 科室主数据字典 */}
          <button
            onClick={() => setSubTab('departments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'departments' 
                ? 'bg-white text-indigo-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>4. 科室主数据字典 ({departments.length})</span>
          </button>

          {/* TAB 5: 人员与责任工程师名册 */}
          <button
            onClick={() => setSubTab('staff')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'staff' 
                ? 'bg-white text-indigo-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>5. 人员与工程师 ({staff.length})</span>
          </button>

          {/* TAB 6: 医疗器械分类目录主数据 (NMPA 22大类) */}
          <button
            onClick={() => setSubTab('category_master')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'category_master' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            <Tag className="w-4 h-4 text-blue-500" />
            <span>6. 医疗器械分类目录 ({activeCategoryMaster.length})</span>
          </button>

          {/* TAB 7: 国家强检目录与政策管理库 (全新政策级主数据) */}
          <button
            onClick={() => setSubTab('metrology_catalogue')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
              subTab === 'metrology_catalogue' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-500" />
            <span>7. 国家强检目录与政策 ({activeCatalogue.length})</span>
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 flex-1 justify-end max-w-md">
          {subTab !== 'metrology_catalogue' && subTab !== 'category_master' && subTab !== 'staff' && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  subTab === 'space' ? '搜索楼宇、楼层、房间、全路径...' :
                  subTab === 'workplaces' ? '搜索场所ID、科室、名称、电话、短号...' :
                  subTab === 'departments' ? '搜索科室名、ID、电话、工程师、学科...' :
                  '搜索空间资产拓扑...'
                }
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Quick Add Buttons */}
          {(subTab === 'space' || subTab === 'workplaces') && (
            <button
              onClick={() => {
                const nextId = `${(rooms.length + 300)}`;
                setEditingRoom({
                  id: `ROOM-${Date.now().toString().slice(-4)}`,
                  workplaceId: nextId,
                  campusId: campuses[0]?.id || 'CAMPUS-01',
                  campusName: campuses[0]?.name || '五莲县人民医院',
                  buildingId: buildings[0]?.id || 'BLD-01',
                  buildingName: buildings[0]?.name || '1号楼 综合楼',
                  floor: '1F',
                  roomCode: `WP-${nextId}`,
                  roomName: '',
                  officePhone: '',
                  shortPhone: '',
                  roomType: '诊室',
                  departmentName: departments[0]?.name || '急诊科',
                  fullLocationPath: ''
                });
                setIsRoomModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>新建工作场所/安装点</span>
            </button>
          )}

          {subTab === 'departments' && (
            <button
              onClick={() => {
                setEditingDept({
                  id: `${(departments.length + 370)}`,
                  code: `DEP-${(departments.length + 370)}`,
                  name: '',
                  hospitalName: campuses[0]?.name || '五莲县人民医院',
                  disciplineCategory: '内科科',
                  category: '临床病区',
                  functionType: '临床病区',
                  campusId: campuses[0]?.id || 'CAMPUS-01',
                  campusName: campuses[0]?.name || '五莲县人民医院',
                  buildingId: buildings[0]?.id || 'BLD-01',
                  buildingName: buildings[0]?.name || '1号楼 综合楼',
                  defaultFloor: '1F',
                  nursePhone: '7991000',
                  adverseEventReporting: true,
                  emergencyDeployment: true,
                  defaultManager: staff[0]?.name || '崔伟',
                  status: 'active'
                });
                setIsDeptModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>新建科室</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Content Workspace */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        
        {/* ==================== TAB 1: 院区与实体楼宇空间 (前置首位) ==================== */}
        {subTab === 'space' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Campus Selector & Spatial Breadcrumb */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold shrink-0">院区机构筛选:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedCampusId('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedCampusId === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    全部机构 ({campuses.length})
                  </button>
                  {campuses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCampusId(c.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        selectedCampusId === c.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                标准空间层级定义：<code className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">[院区机构] &gt; [实体楼宇] &gt; [物理楼层] &gt; [标准科室/房间]</code>
              </div>
            </div>

            {/* Space Hierarchy Display: Campuses -> Buildings -> Floors -> Departments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* 1. 院区概况卡片 */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4 text-indigo-600" />
                  <span>在册院区与医疗机构 ({campuses.length} 所)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {campuses
                    .filter(c => selectedCampusId === 'all' || c.id === selectedCampusId)
                    .map(c => {
                      const campusBuildings = buildings.filter(b => b.campusId === c.id);
                      const campusDepts = departments.filter(d => d.campusId === c.id || d.hospitalName === c.name);
                      return (
                        <div key={c.id} className="p-4 rounded-xl border border-indigo-100 bg-linear-to-br from-indigo-50/40 to-white shadow-2xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold">
                                  {c.code}
                                </span>
                                <h4 className="font-bold text-base text-slate-900">{c.name}</h4>
                                <span className="text-xs text-slate-500 font-normal">({c.shortName})</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{c.address}</span>
                              </p>
                              {c.contactPhone && (
                                <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-mono">{c.contactPhone}</span>
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold text-xs block">
                                {campusBuildings.length} 栋楼宇 · {campusDepts.length} 个科室
                              </span>
                            </div>
                          </div>
                          {c.description && (
                            <p className="mt-2 text-xs text-slate-500 bg-white/80 p-2 rounded-lg border border-slate-100">
                              {c.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 2. 实体楼宇与楼层-科室空间层级树 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>实体楼宇与楼层科室空间全貌 ({buildings.filter(b => selectedCampusId === 'all' || b.campusId === selectedCampusId).length} 栋楼宇)</span>
                  </h3>
                  <span className="text-xs text-slate-500">点击科室可直接查看或配置属性</span>
                </div>

                <div className="space-y-4">
                  {buildingFloorDeptTree.map(({ building: b, floorsMap }) => {
                    const totalDeptsInBuilding = Object.values(floorsMap).flat().length;
                    return (
                      <div key={b.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                        {/* Building Header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200">
                              {b.code}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                            <span className="text-xs text-slate-500 font-medium">({b.campusName})</span>
                            <span className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              覆盖 {b.floors.length} 个楼层 · 容纳 {totalDeptsInBuilding} 个科室/部门
                            </span>
                          </div>
                          {b.description && (
                            <span className="text-xs text-slate-500 max-w-xl truncate" title={b.description}>
                              {b.description}
                            </span>
                          )}
                        </div>

                        {/* Floor-by-Floor Department Matrix */}
                        <div className="p-4 divide-y divide-slate-100 space-y-3">
                          {b.floors
                            .slice()
                            .reverse()
                            .map(floor => {
                              const deptsOnFloor = floorsMap[floor] || [];
                              return (
                                <div key={floor} className="pt-2 first:pt-0 flex flex-col md:flex-row md:items-start gap-3">
                                  {/* Floor Badge */}
                                  <div className="w-16 shrink-0 pt-1">
                                    <span className="inline-flex items-center justify-center w-12 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
                                      {floor}
                                    </span>
                                  </div>

                                  {/* Departments located on this floor */}
                                  <div className="flex-1 flex flex-wrap items-center gap-2">
                                    {deptsOnFloor.length === 0 ? (
                                      <span className="text-slate-400 text-xs italic">暂未分配主要科室</span>
                                    ) : (
                                      deptsOnFloor.map(dept => (
                                        <div
                                          key={dept.id}
                                          onClick={() => {
                                            setEditingDept(dept);
                                            setIsDeptModalOpen(true);
                                          }}
                                          className="group px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 bg-slate-50 transition cursor-pointer flex items-center gap-2 text-xs shadow-2xs"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-800 group-hover:text-indigo-700">
                                              {dept.name}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                                              {dept.functionType || dept.category}
                                            </span>
                                            {dept.disciplineCategory && (
                                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium">
                                                {dept.disciplineCategory}
                                              </span>
                                            )}
                                            {dept.adverseEventReporting && (
                                              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold" title="不良事件报告科室">
                                                报告
                                              </span>
                                            )}
                                            {dept.emergencyDeployment && (
                                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold" title="应急调配科室">
                                                应急
                                              </span>
                                            )}
                                          </div>
                                          {dept.defaultManager && (
                                            <span className="text-[11px] text-slate-500 font-medium pl-1 border-l border-slate-200 flex items-center gap-0.5">
                                              <UserCheck className="w-3 h-3 text-emerald-600" />
                                              {dept.defaultManager}
                                            </span>
                                          )}
                                          {dept.nursePhone && (
                                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-0.5">
                                              <Phone className="w-3 h-3 text-slate-400" />
                                              {dept.nursePhone}
                                            </span>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. 标准空间房间与精准定位 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-emerald-600" />
                    <span>重点精密设备空间定位点 ({filteredRooms.length} 处)</span>
                  </h3>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">空间编码</th>
                        <th className="py-2.5 px-3">房间/安装点名称</th>
                        <th className="py-2.5 px-3">空间类型</th>
                        <th className="py-2.5 px-3">所属院区与楼宇</th>
                        <th className="py-2.5 px-3">楼层</th>
                        <th className="py-2.5 px-3">归属科室</th>
                        <th className="py-2.5 px-3">标准全路径定位</th>
                        <th className="py-2.5 px-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRooms.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.roomCode}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{r.roomName}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                              {r.roomType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{r.campusName} · {r.buildingName}</td>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">{r.floor}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{r.departmentName || '-'}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] text-slate-600 truncate max-w-xs">{r.fullLocationPath}</span>
                              <button
                                onClick={() => handleCopy(r.fullLocationPath)}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded"
                                title="复制全路径定位"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => {
                                setEditingRoom(r);
                                setIsRoomModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                              title="编辑房间"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(r.id, r.roomName)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer ml-1"
                              title="删除房间"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: 具体工作场所与安装点名录 (160+ 点位) ==================== */}
        {subTab === 'workplaces' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* 1. KPI Metric Summary Bar */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">在册场所/安装点</span>
                <span className="font-mono font-bold text-base text-slate-900">{rooms.length} <span className="text-xs font-normal text-slate-500">处</span></span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">当前筛选匹配</span>
                <span className="font-mono font-bold text-base text-emerald-600">{filteredWorkplaces.length} <span className="text-xs font-normal text-slate-500">处</span></span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">五莲县人民医院</span>
                <span className="font-mono font-bold text-base text-indigo-700">
                  {rooms.filter(r => r.campusName.includes('人民医院') || r.campusId === 'CAMPUS-01').length} <span className="text-xs font-normal text-slate-500">处</span>
                </span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">五莲县皮肤病医院</span>
                <span className="font-mono font-bold text-base text-purple-700">
                  {rooms.filter(r => r.campusName.includes('皮肤病') || r.campusId === 'CAMPUS-02').length} <span className="text-xs font-normal text-slate-500">处</span>
                </span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">电话/短号配置率</span>
                <span className="font-mono font-bold text-base text-blue-600">
                  {rooms.length > 0 ? Math.round((rooms.filter(r => r.officePhone || r.shortPhone).length / rooms.length) * 100) : 0}%
                </span>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">关联运行设备</span>
                <span className="font-mono font-bold text-base text-amber-600">
                  {(Object.values(workplaceEquipmentCount) as number[]).reduce((a: number, b: number) => a + b, 0)} <span className="text-xs font-normal text-slate-500">台</span>
                </span>
              </div>
            </div>

            {/* 2. Multi-dimensional Filter Toolbar */}
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* 院区 */}
                <select
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部院区机构</option>
                  {campuses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* 楼宇 */}
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部实体楼宇</option>
                  {buildings
                    .filter(b => selectedCampusId === 'all' || b.campusId === selectedCampusId)
                    .map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                {/* 空间类型 */}
                <select
                  value={selectedRoomType}
                  onChange={(e) => setSelectedRoomType(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部功能类型</option>
                  {roomTypesList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                {/* 归属科室 */}
                <select
                  value={selectedWorkplaceDept}
                  onChange={(e) => setSelectedWorkplaceDept(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium max-w-[160px] truncate"
                >
                  <option value="all">全部归属科室</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                {/* 仅看有电话 */}
                <button
                  type="button"
                  onClick={() => setHasPhoneOnly(!hasPhoneOnly)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    hasPhoneOnly 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                  <span>含办公电话/短号</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                标准数据结构：<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono">ID_场所信息 | ID_科室信息 | 名称 | 办公电话 | 短号</code>
              </div>
            </div>

            {/* 3. Workplace Data Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-3 w-28">ID_场所信息</th>
                      <th className="py-2.5 px-3 w-40">ID_科室信息</th>
                      <th className="py-2.5 px-3">工作场所/安装点名称</th>
                      <th className="py-2.5 px-3 w-32">办公电话</th>
                      <th className="py-2.5 px-3 w-24">短号</th>
                      <th className="py-2.5 px-3">所在空间路径</th>
                      <th className="py-2.5 px-3 w-24">空间类型</th>
                      <th className="py-2.5 px-3 w-20 text-center">承载设备</th>
                      <th className="py-2.5 px-3 text-right w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredWorkplaces.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <DoorOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-medium text-xs">未找到符合条件的工作场所或安装点</p>
                          <p className="text-[11px] text-slate-400 mt-1">请尝试调整搜索关键词或重置筛选条件</p>
                        </td>
                      </tr>
                    ) : (
                      filteredWorkplaces.map(w => {
                        const eqCount = workplaceEquipmentCount[w.id] || 0;
                        return (
                          <tr key={w.id} className="hover:bg-indigo-50/30 transition group">
                            {/* ID_场所信息 */}
                            <td className="py-2 px-3">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {w.workplaceId || w.roomCode || w.id}
                              </span>
                            </td>

                            {/* ID_科室信息 */}
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-800 truncate max-w-[150px]" title={w.departmentName}>
                                {w.departmentName || '-'}
                              </div>
                            </td>

                            {/* 名称 */}
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
                                  {w.roomName}
                                </span>
                              </div>
                            </td>

                            {/* 办公电话 */}
                            <td className="py-2 px-3">
                              {w.officePhone ? (
                                <div className="flex items-center gap-1 font-mono text-slate-700">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{w.officePhone}</span>
                                  <button
                                    onClick={() => handleCopy(w.officePhone!)}
                                    className="text-slate-300 hover:text-indigo-600 p-0.5 rounded"
                                    title="复制办公电话"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* 短号 */}
                            <td className="py-2 px-3">
                              {w.shortPhone ? (
                                <div className="flex items-center gap-1 font-mono font-bold text-emerald-700">
                                  <span className="bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[11px]">
                                    {w.shortPhone}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(w.shortPhone!)}
                                    className="text-slate-300 hover:text-emerald-600 p-0.5 rounded"
                                    title="复制短号"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* 所在空间路径 */}
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] text-slate-600 truncate max-w-xs" title={w.fullLocationPath}>
                                  {w.campusName} &gt; {w.buildingName} &gt; {w.floor}
                                </span>
                                <button
                                  onClick={() => handleCopy(w.fullLocationPath)}
                                  className="text-slate-300 hover:text-indigo-600 p-0.5 rounded"
                                  title="复制全路径定位"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* 空间类型 */}
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[10px] border border-slate-200 whitespace-nowrap">
                                {w.roomType}
                              </span>
                            </td>

                            {/* 承载设备 */}
                            <td className="py-2 px-3 text-center">
                              {eqCount > 0 ? (
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                                  {eqCount}台
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-[11px]">0</span>
                              )}
                            </td>

                            {/* 操作 */}
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingRoom(w);
                                    setIsRoomModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                                  title="编辑场所信息"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRoom(w.id, w.roomName)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                  title="删除场所"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            </div>
          </div>
        )}

        {/* ==================== TAB 3: 空间资产分布拓扑 ==================== */}
        {subTab === 'matrix' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <span className="text-blue-900 font-medium">
                  空间资产分布拓扑实时贯通全院设备台账，展示各院区、楼宇、楼层实际承载的资产总量与运行状态。
                </span>
              </div>
              <span className="font-mono font-bold text-blue-800">
                总在册设备: {equipmentList.length} 台
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {buildings.map(b => {
                const bDepts = departments.filter(d => d.buildingId === b.id || d.buildingName === b.name);
                let totalEquip = 0;
                let totalVal = 0;
                bDepts.forEach(d => {
                  const stat = deptEquipmentStats[d.name];
                  if (stat) {
                    totalEquip += stat.count;
                    totalVal += stat.value;
                  }
                });

                return (
                  <div key={b.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
                    <div className="flex items-start justify-between mb-3 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                            {b.campusName} · {b.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{b.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">包含 {b.floors.length} 个楼层 · 容纳 {bDepts.length} 个科室</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-indigo-700 text-sm">{totalEquip} 台设备</div>
                        <div className="text-[11px] text-slate-500 font-mono">¥{(totalVal / 10000).toFixed(1)} 万元</div>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {bDepts.map(dept => {
                        const stat = deptEquipmentStats[dept.name] || { count: 0, value: 0, normal: 0 };
                        return (
                          <div key={dept.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 font-mono text-[10px] border border-slate-200">
                                {dept.defaultFloor}
                              </span>
                              <span className="font-bold text-slate-800">{dept.name}</span>
                              <span className="text-[10px] text-slate-500">({dept.defaultManager})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-slate-700">{stat.count} 台</span>
                              <span className="text-[11px] text-emerald-600 font-mono">{stat.normal} 正常</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: 科室主数据字典 (全字段展示) ==================== */}
        {subTab === 'departments' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Filter Bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* 医院筛选 */}
                <select
                  value={selectedHospitalFilter}
                  onChange={(e) => setSelectedHospitalFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部医院/院区</option>
                  <option value="五莲县人民医院">五莲县人民医院</option>
                  <option value="五莲县皮肤病医院">五莲县皮肤病医院</option>
                </select>

                {/* 楼宇筛选 */}
                <select
                  value={selectedBuildingId}
                  onChange={(e) => setSelectedBuildingId(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部楼号</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>

                {/* 功能类别 */}
                <select
                  value={selectedDeptCategory}
                  onChange={(e) => setSelectedDeptCategory(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部功能类别</option>
                  <option value="临床病区">临床病区</option>
                  <option value="临床">临床</option>
                  <option value="医技">医技</option>
                  <option value="行管后勤">行管后勤</option>
                  <option value="特殊">特殊</option>
                </select>

                {/* 学科分类 */}
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部学科分类</option>
                  {disciplineList.map(disc => (
                    <option key={disc} value={disc}>{disc}</option>
                  ))}
                </select>

                {/* 责任工程师 */}
                <select
                  value={selectedEngineerFilter}
                  onChange={(e) => setSelectedEngineerFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="all">全部责任工程师</option>
                  {engineerList.map(eng => (
                    <option key={eng} value={eng}>{eng}</option>
                  ))}
                </select>

                {/* 快捷开关 */}
                <button
                  type="button"
                  onClick={() => setOnlyAdverseReport(!onlyAdverseReport)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    onlyAdverseReport 
                      ? 'bg-emerald-600 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>不良事件报告科室</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyEmergencyDeploy(!onlyEmergencyDeploy)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    onlyEmergencyDeploy 
                      ? 'bg-amber-600 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>应急调配科室</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                当前筛选匹配: <strong className="font-mono text-indigo-700 text-sm">{filteredDepartments.length}</strong> / {departments.length} 个科室
              </div>
            </div>

            {/* Department Table with All User Columns */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ID_科室</th>
                    <th className="py-2.5 px-3">ID_医院信息</th>
                    <th className="py-2.5 px-3">ID_学科分类</th>
                    <th className="py-2.5 px-3">科室名称</th>
                    <th className="py-2.5 px-3">楼号</th>
                    <th className="py-2.5 px-3">楼层</th>
                    <th className="py-2.5 px-3">功能分类</th>
                    <th className="py-2.5 px-3 text-center">不良事件报告</th>
                    <th className="py-2.5 px-3">护士站电话</th>
                    <th className="py-2.5 px-3 text-center">应急调配</th>
                    <th className="py-2.5 px-3">责任工程师</th>
                    <th className="py-2.5 px-3 text-center">设备数</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDepartments.map(dept => {
                    const stats = deptEquipmentStats[dept.name] || { count: 0, value: 0 };
                    return (
                      <tr key={dept.id} className="hover:bg-indigo-50/30 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{dept.id}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium">{dept.hospitalName || dept.campusName}</td>
                        <td className="py-2.5 px-3">
                          {dept.disciplineCategory ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px] border border-blue-200">
                              {dept.disciplineCategory}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 text-sm">
                          {dept.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{dept.buildingName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{dept.defaultFloor}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            dept.category === '临床病区' ? 'bg-indigo-100 text-indigo-800' :
                            dept.category === '临床' ? 'bg-sky-100 text-sky-800' :
                            dept.category === '医技' ? 'bg-teal-100 text-teal-800' :
                            dept.category === '行管后勤' ? 'bg-slate-100 text-slate-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {dept.functionType || dept.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {dept.adverseEventReporting ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {dept.nursePhone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{dept.nursePhone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {dept.emergencyDeployment ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                              No
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {dept.defaultManager ? (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{dept.defaultManager}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {stats.count > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                              {stats.count}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setEditingDept(dept);
                              setIsDeptModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="编辑科室"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer ml-1"
                            title="删除科室"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: 人员与责任工程师名册 (支持批量导入/批量修改/角色设定) ==================== */}
        {subTab === 'staff' && (
          <StaffMasterTab
            staff={staff}
            departments={departments}
            onUpdateStaff={onUpdateStaff}
            onResetDefaults={onResetDefaults || onResetAllMasterData}
          />
        )}

        {/* ==================== SUBTAB 6: 医疗器械分类目录主数据中心 ==================== */}
        {subTab === 'category_master' && (
          <NmpaCategoryTab
            categoryMaster={activeCategoryMaster}
            equipmentList={equipmentList}
            onUpdateCategoryMaster={handleUpdateCategoryMaster}
            onResetDefaults={() => handleUpdateCategoryMaster(DEFAULT_NMPA_CATEGORY_MASTER)}
          />
        )}

        {/* ==================== SUBTAB 7: 国家强检目录与政策管理中心 ==================== */}
        {subTab === 'metrology_catalogue' && (
          <MetrologyCatalogueTab
            catalogue={activeCatalogue}
            equipmentList={equipmentList}
            onUpdateCatalogue={handleUpdateCatalogue}
            onUpdateEquipmentList={onUpdateEquipmentList}
            onResetCatalogueToDefault={handleResetCatalogue}
          />
        )}
      </div>

      {/* ==================== 模态弹窗：科室编辑/新建 ==================== */}
      {isDeptModalOpen && editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {departments.some(d => d.id === editingDept.id) ? '编辑科室主数据' : '新建标准化科室'}
              </h3>
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingDept.name.trim()) {
                  alert('请填写科室名称！');
                  return;
                }
                handleSaveDepartment(editingDept);
              }}
              className="p-6 space-y-3.5 text-xs flex-1 overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID_科室编码 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingDept.id}
                    onChange={(e) => setEditingDept({ ...editingDept, id: e.target.value, code: `DEP-${e.target.value}` })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">科室名称 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：内分泌风湿肾病科"
                    value={editingDept.name}
                    onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">所属医院/机构 <span className="text-rose-500">*</span></label>
                  <select
                    value={editingDept.campusId}
                    onChange={(e) => {
                      const c = campuses.find(item => item.id === e.target.value);
                      const matchingBld = buildings.find(b => b.campusId === e.target.value);
                      setEditingDept({
                        ...editingDept,
                        campusId: e.target.value,
                        campusName: c?.name || '',
                        hospitalName: c?.name || '',
                        buildingId: matchingBld?.id || editingDept.buildingId,
                        buildingName: matchingBld?.name || editingDept.buildingName
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {campuses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID_学科分类</label>
                  <input
                    type="text"
                    placeholder="例：内科科 / 外科科 / 妇产科"
                    value={editingDept.disciplineCategory || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, disciplineCategory: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">功能分类</label>
                  <select
                    value={editingDept.category}
                    onChange={(e) => setEditingDept({ ...editingDept, category: e.target.value, functionType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="临床病区">临床病区</option>
                    <option value="临床">临床</option>
                    <option value="医技">医技</option>
                    <option value="行管后勤">行管后勤</option>
                    <option value="特殊">特殊</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">责任工程师 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：崔伟 / 孙志强"
                    value={editingDept.defaultManager}
                    onChange={(e) => setEditingDept({ ...editingDept, defaultManager: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">所在楼宇</label>
                  <select
                    value={editingDept.buildingId}
                    onChange={(e) => {
                      const b = buildings.find(item => item.id === e.target.value);
                      setEditingDept({
                        ...editingDept,
                        buildingId: e.target.value,
                        buildingName: b?.name || ''
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    {buildings
                      .filter(b => b.campusId === editingDept.campusId)
                      .map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">楼层 (例: 16F, 1F, -1F)</label>
                  <input
                    type="text"
                    value={editingDept.defaultFloor}
                    onChange={(e) => setEditingDept({ ...editingDept, defaultFloor: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">护士站电话</label>
                  <input
                    type="text"
                    placeholder="例：7991438"
                    value={editingDept.nursePhone}
                    onChange={(e) => setEditingDept({ ...editingDept, nursePhone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">医生办公室电话</label>
                  <input
                    type="text"
                    placeholder="选填"
                    value={editingDept.doctorOfficePhone || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, doctorOfficePhone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">值班电话</label>
                  <input
                    type="text"
                    placeholder="选填"
                    value={editingDept.dutyPhone || ''}
                    onChange={(e) => setEditingDept({ ...editingDept, dutyPhone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingDept.adverseEventReporting || false}
                    onChange={(e) => setEditingDept({ ...editingDept, adverseEventReporting: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-800">不良事件报告科室 (Yes)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingDept.emergencyDeployment || false}
                    onChange={(e) => setEditingDept({ ...editingDept, emergencyDeployment: e.target.checked })}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-slate-800">应急调配科室 (Yes)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs cursor-pointer"
                >
                  保存科室主数据
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 模态弹窗：工作场所/空间房间编辑与新建 ==================== */}
      {isRoomModalOpen && editingRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-emerald-600" />
                <span>{rooms.some(r => r.id === editingRoom.id) ? '编辑工作场所 / 安装点' : '新建工作场所 / 安装点'}</span>
              </h3>
              <button 
                onClick={() => setIsRoomModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingRoom.roomName.trim()) {
                  alert('请填写工作场所/安装点名称！');
                  return;
                }
                const fullPath = `${editingRoom.campusName} > ${editingRoom.buildingName} > ${editingRoom.floor} > ${editingRoom.roomName}`;
                handleSaveRoom({ ...editingRoom, fullLocationPath: fullPath });
              }}
              className="p-6 space-y-3.5 text-xs flex-1 overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID_场所信息 (场所编码) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例：300 / 696"
                    value={editingRoom.workplaceId || editingRoom.roomCode}
                    onChange={(e) => setEditingRoom({ 
                      ...editingRoom, 
                      workplaceId: e.target.value,
                      roomCode: editingRoom.roomCode || `WP-${e.target.value}` 
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs font-bold text-indigo-700"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    场所 / 安装点名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例：麻醉手术科手术1间 / 皮防站办公室"
                    value={editingRoom.roomName}
                    onChange={(e) => setEditingRoom({ ...editingRoom, roomName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ID_科室信息 (归属科室) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingRoom.departmentName}
                  onChange={(e) => {
                    const dept = departments.find(d => d.name === e.target.value);
                    setEditingRoom({ 
                      ...editingRoom, 
                      departmentName: e.target.value,
                      buildingName: dept?.buildingName || editingRoom.buildingName,
                      buildingId: dept?.buildingId || editingRoom.buildingId,
                      floor: dept?.defaultFloor || editingRoom.floor,
                      campusName: dept?.hospitalName || dept?.campusName || editingRoom.campusName
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.hospitalName || d.campusName} · {d.buildingName} {d.defaultFloor})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">办公电话</label>
                  <input
                    type="text"
                    placeholder="例：7991000 / 7961100"
                    value={editingRoom.officePhone || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, officePhone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">内网短号</label>
                  <input
                    type="text"
                    placeholder="例：56000 / 53100"
                    value={editingRoom.shortPhone || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, shortPhone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs text-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">所属院区</label>
                  <select
                    value={editingRoom.campusId}
                    onChange={(e) => {
                      const c = campuses.find(item => item.id === e.target.value);
                      setEditingRoom({
                        ...editingRoom,
                        campusId: e.target.value,
                        campusName: c?.name || ''
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  >
                    {campuses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">所在楼宇</label>
                  <select
                    value={editingRoom.buildingId}
                    onChange={(e) => {
                      const b = buildings.find(item => item.id === e.target.value);
                      setEditingRoom({
                        ...editingRoom,
                        buildingId: e.target.value,
                        buildingName: b?.name || ''
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">楼层 (例: 1F, 4F, 16F, -1F)</label>
                  <input
                    type="text"
                    required
                    value={editingRoom.floor}
                    onChange={(e) => setEditingRoom({ ...editingRoom, floor: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">空间功能类型</label>
                  <select
                    value={editingRoom.roomType}
                    onChange={(e) => setEditingRoom({ ...editingRoom, roomType: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  >
                    <option value="诊室">诊室</option>
                    <option value="手术室">手术室</option>
                    <option value="抢救室">抢救室</option>
                    <option value="病房">病房</option>
                    <option value="医技检查室">医技检查室</option>
                    <option value="检验中心">检验中心</option>
                    <option value="设备库房">设备库房</option>
                    <option value="机房动力">机房动力</option>
                    <option value="治疗室">治疗室</option>
                    <option value="办公区">办公区</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <span>生成定位预览：</span>
                <strong className="font-mono block text-indigo-700 mt-0.5">
                  {editingRoom.campusName} &gt; {editingRoom.buildingName} &gt; {editingRoom.floor} &gt; {editingRoom.roomName || '未命名'}
                </strong>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-xs cursor-pointer"
                >
                  保存工作场所主数据
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 模态弹窗：人员编辑/新建 ==================== */}
      {isStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {staff.some(s => s.id === editingStaff.id) ? '编辑人员名册' : '录入新人员主数据'}
              </h3>
              <button 
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingStaff.name.trim()) {
                  alert('请填写人员姓名！');
                  return;
                }
                handleSaveStaff(editingStaff);
              }}
              className="p-6 space-y-3.5 text-xs flex-1 overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">员工工号 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingStaff.employeeNo}
                    onChange={(e) => setEditingStaff({ ...editingStaff, employeeNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">人员姓名 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：崔伟 / 孙志强"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">所属科室</label>
                  <select
                    value={editingStaff.departmentName}
                    onChange={(e) => {
                      const d = departments.find(item => item.name === e.target.value);
                      setEditingStaff({
                        ...editingStaff,
                        departmentId: d?.id || '',
                        departmentName: e.target.value
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">角色职责</label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  >
                    <option value="设备管理员">设备管理员</option>
                    <option value="维修工程师">维修工程师</option>
                    <option value="护士长">护士长</option>
                    <option value="科室责任人">科室责任人</option>
                    <option value="科室主任">科室主任</option>
                    <option value="库管员">库管员</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">联系电话 / 分机 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：7991237"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">专业职称 / 职务</label>
                  <input
                    type="text"
                    placeholder="例：主管工程师 / 责任工程师"
                    value={editingStaff.title || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, title: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">电子邮箱</label>
                <input
                  type="email"
                  placeholder="例：cuiwei@hospital.wl.cn"
                  value={editingStaff.email || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContactCheck"
                  checked={editingStaff.isPrimaryContact}
                  onChange={(e) => setEditingStaff({ ...editingStaff, isPrimaryContact: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="primaryContactCheck" className="text-slate-700 font-medium cursor-pointer select-none">
                  设为本科室首要设备管理责任人 (自动推荐填入新设备表单)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs cursor-pointer"
                >
                  保存人员主数据
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
