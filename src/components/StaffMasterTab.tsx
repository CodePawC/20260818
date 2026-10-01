import React, { useState, useMemo, useEffect } from 'react';
import { StaffPersonMaster, DepartmentMaster, StaffRoleDefinition, StakeholderCluster } from '../types';
import { 
  DEFAULT_STAFF_ROLES, 
  STAKEHOLDER_CLUSTERS, 
  StakeholderClusterDefinition,
  SPECIALTY_DOMAIN_OPTIONS,
  inferStakeholderCluster,
  getRoleBadgeStyle,
  getEmergencyTierBadgeStyle
} from '../utils/staffRolesData';
import { StaffRoleConfigModal } from './StaffRoleConfigModal';
import { StakeholderClusterConfigModal } from './StakeholderClusterConfigModal';
import { StaffBatchEditModal } from './StaffBatchEditModal';
import { StaffBatchImportModal } from './StaffBatchImportModal';
import { Pagination } from './Pagination';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Upload, 
  Download, 
  Settings2, 
  SlidersHorizontal, 
  Trash2, 
  UserCheck, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Star, 
  Award, 
  Tag, 
  Wrench, 
  Activity, 
  FileText, 
  Check, 
  Eye, 
  Layers, 
  Briefcase, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';

interface StaffMasterTabProps {
  staff: StaffPersonMaster[];
  departments: DepartmentMaster[];
  onUpdateStaff: (staff: StaffPersonMaster[]) => void;
}

export const StaffMasterTab: React.FC<StaffMasterTabProps> = ({
  staff,
  departments,
  onUpdateStaff
}) => {
  // 1. Roles Definition state (stored in localStorage)
  const [roles, setRoles] = useState<StaffRoleDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('hospital-staff-roles-v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STAFF_ROLES;
  });

  const handleUpdateRoles = (newRoles: StaffRoleDefinition[]) => {
    setRoles(newRoles);
    localStorage.setItem('hospital-staff-roles-v2', JSON.stringify(newRoles));
  };

  // 1.1 Stakeholder Clusters state (stored in localStorage)
  const [clusters, setClusters] = useState<StakeholderClusterDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('hospital-stakeholder-clusters-v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return STAKEHOLDER_CLUSTERS;
  });

  const handleUpdateClusters = (newClusters: StakeholderClusterDefinition[]) => {
    setClusters(newClusters);
    localStorage.setItem('hospital-stakeholder-clusters-v1', JSON.stringify(newClusters));
  };

  // 2. Filters state
  const [selectedCluster, setSelectedCluster] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedOrg, setSelectedOrg] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // 3. Selection state for batch actions
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // 4. Modals state
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffPersonMaster | null>(null);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      // 1. Cluster match
      if (selectedCluster !== 'ALL') {
        const cluster = member.stakeholderCategory || inferStakeholderCluster(member.role, member.departmentName, member.organization);
        if (cluster !== selectedCluster) return false;
      }

      // 2. Role match
      if (selectedRole !== 'ALL') {
        if (member.role !== selectedRole && !(member.roles && member.roles.includes(selectedRole))) {
          return false;
        }
      }

      // 3. Department match
      if (selectedDept !== 'ALL') {
        if (member.departmentId !== selectedDept && member.departmentName !== selectedDept) {
          return false;
        }
      }

      // 4. Organization match
      if (selectedOrg !== 'ALL') {
        const org = member.organization || '五莲县人民医院';
        if (org !== selectedOrg) return false;
      }

      // 5. Emergency Tier match
      if (selectedTier !== 'ALL') {
        const tier = member.emergencyTier || 'none';
        if (tier !== selectedTier) return false;
      }

      // 6. Status match
      if (selectedStatus !== 'ALL') {
        if (member.status !== selectedStatus) {
          return false;
        }
      }

      // 7. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = member.name.toLowerCase().includes(q);
        const matchesEmp = member.employeeNo.toLowerCase().includes(q);
        const matchesOrg = member.organization ? member.organization.toLowerCase().includes(q) : false;
        const matchesDept = member.departmentName.toLowerCase().includes(q);
        const matchesPhone = member.phone.includes(q);
        const matchesRole = member.role.toLowerCase().includes(q);
        const matchesTitle = member.title ? member.title.toLowerCase().includes(q) : false;
        const matchesContract = member.serviceContractNo ? member.serviceContractNo.toLowerCase().includes(q) : false;
        const matchesSpecialty = member.specialties ? member.specialties.some(s => s.toLowerCase().includes(q)) : false;
        const matchesScope = member.serviceScope ? member.serviceScope.toLowerCase().includes(q) : false;

        return matchesName || matchesEmp || matchesOrg || matchesDept || matchesPhone || matchesRole || matchesTitle || matchesContract || matchesSpecialty || matchesScope;
      }

      return true;
    });
  }, [staff, selectedCluster, selectedRole, selectedDept, selectedOrg, selectedTier, selectedStatus, searchQuery]);

  // 重置分页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCluster, selectedRole, selectedDept, selectedOrg, selectedTier, selectedStatus, searchQuery]);

  const paginatedStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStaff.slice(startIndex, startIndex + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  // Distinct organizations for filter dropdown
  const uniqueOrgs = useMemo(() => {
    const orgs = new Set<string>();
    staff.forEach(s => {
      if (s.organization) orgs.add(s.organization.trim());
    });
    return Array.from(orgs);
  }, [staff]);

  // Statistics by Stakeholder Clusters
  const stats = useMemo(() => {
    const total = staff.length;
    const active = staff.filter(s => s.status === 'active').length;
    
    // Dynamic Cluster counts
    const clusterCounts: Record<string, number> = {};
    clusters.forEach(c => {
      clusterCounts[c.id] = 0;
    });

    staff.forEach(s => {
      const c = s.stakeholderCategory || inferStakeholderCluster(s.role, s.departmentName, s.organization);
      clusterCounts[c] = (clusterCounts[c] || 0) + 1;
    });

    const l1Count = staff.filter(s => s.emergencyTier === 'L1').length;
    const primaryCount = staff.filter(s => s.isPrimaryContact).length;

    return { total, active, clusterCounts, l1Count, primaryCount };
  }, [staff, clusters]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedStaffIds.length === filteredStaff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredStaff.map(s => s.id));
    }
  };

  const toggleSelectStaff = (id: string) => {
    if (selectedStaffIds.includes(id)) {
      setSelectedStaffIds(selectedStaffIds.filter(item => item !== id));
    } else {
      setSelectedStaffIds([...selectedStaffIds, id]);
    }
  };

  const handleBatchDelete = () => {
    if (selectedStaffIds.length === 0) return;
    if (confirm(`确定批量删除已选中的 ${selectedStaffIds.length} 位干系人记录吗？`)) {
      const remaining = staff.filter(s => !selectedStaffIds.includes(s.id));
      onUpdateStaff(remaining);
      setSelectedStaffIds([]);
    }
  };

  const handleBatchSetStatus = (newStatus: 'active' | 'inactive' | 'on_leave') => {
    if (selectedStaffIds.length === 0) return;
    const updated = staff.map(s => {
      if (selectedStaffIds.includes(s.id)) {
        return { ...s, status: newStatus };
      }
      return s;
    });
    onUpdateStaff(updated);
  };

  const handleExportSelected = () => {
    const targetStaff = selectedStaffIds.length > 0
      ? staff.filter(s => selectedStaffIds.includes(s.id))
      : filteredStaff;

    const headers = [
      '编号/工号', 
      '姓名', 
      '所属单位/机构', 
      '干系人类型', 
      '所属科室', 
      '角色职责', 
      '联系电话/热线', 
      '业务职称/职务', 
      '电子邮箱', 
      '应急梯队', 
      '服务产品线/专长', 
      '维保合同/协议号', 
      '是否首选责任人', 
      '在职状态', 
      '备注'
    ];
    
    const rows = targetStaff.map(s => {
      const cluster = s.stakeholderCategory || inferStakeholderCluster(s.role, s.departmentName, s.organization);
      const clusterLabel = clusters.find(c => c.id === cluster)?.name || '院内医工';
      return [
        s.employeeNo,
        s.name,
        s.organization || '五莲县人民医院',
        clusterLabel,
        s.departmentName,
        s.role,
        s.phone,
        s.title || '',
        s.email || '',
        s.emergencyTier || 'none',
        s.serviceScope || (s.specialties ? s.specialties.join(';') : ''),
        s.serviceContractNo || '',
        s.isPrimaryContact ? '是' : '否',
        s.status === 'active' ? '在职' : s.status === 'on_leave' ? '休假' : '离职',
        s.notes || ''
      ];
    });

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob(['\uFEFF' + tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `全域设备干系人与工程师主数据名册_${new Date().toISOString().slice(0, 10)}.tsv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveSingleStaff = (staffMember: StaffPersonMaster) => {
    const idx = staff.findIndex(s => s.id === staffMember.id);
    let nextStaffList: StaffPersonMaster[] = [];
    if (idx !== -1) {
      nextStaffList = [...staff];
      nextStaffList[idx] = staffMember;
    } else {
      nextStaffList = [staffMember, ...staff];
    }
    onUpdateStaff(nextStaffList);
    setIsSingleModalOpen(false);
    setEditingStaff(null);
  };

  const handleDeleteSingleStaff = (id: string, name: string) => {
    if (confirm(`确定删除人员/专家 "${name}" 的主数据档案吗？`)) {
      onUpdateStaff(staff.filter(s => s.id !== id));
      setSelectedStaffIds(prev => prev.filter(item => item !== id));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-100/60">
      
      {/* 1. Top Stakeholder Cluster Cards */}
      <div className="p-3.5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">全域医疗设备干系人矩阵 (Stakeholder Ecosystem Hub)</span>
            <span className="text-[11px] text-slate-500 font-mono">共入库 {stats.total} 位干系人</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">L1急救一线响应: <strong className="text-rose-600 font-mono font-bold">{stats.l1Count}</strong> 人</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">在职率: <strong className="text-emerald-600 font-mono font-bold">{stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%</strong></span>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setIsClusterModalOpen(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer hover:underline"
              title="配置干系人群体分类、新增自定义部门分类"
            >
              <Settings2 className="w-3 h-3" />
              <span>管理矩阵分类</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {/* ALL Cluster Button */}
          <button
            onClick={() => setSelectedCluster('ALL')}
            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
              selectedCluster === 'ALL'
                ? 'bg-slate-900 border-slate-900 text-white shadow-xs ring-2 ring-slate-900/20'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold">全域所有干系人</span>
              <Users className={`w-3.5 h-3.5 ${selectedCluster === 'ALL' ? 'text-indigo-400' : 'text-slate-400'}`} />
            </div>
            <div className="mt-1 text-lg font-bold font-mono">
              {stats.total} <span className="text-[10px] font-normal opacity-80">人</span>
            </div>
          </button>

          {/* Dynamic Clusters */}
          {clusters.map(cluster => {
            const count = stats.clusterCounts[cluster.id] || 0;
            const isSelected = selectedCluster === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => setSelectedCluster(cluster.id)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20'
                    : `${cluster.bgColor || 'bg-slate-50'} ${cluster.borderColor || 'border-slate-200'} text-slate-800 hover:brightness-95`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : cluster.textColor || 'text-slate-900'}`}>
                    {cluster.shortName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                    {cluster.id === 'hospital_engineering' ? '医工' : cluster.id === 'hospital_clinical' ? '临床' : cluster.id === 'hospital_administration' ? '行政' : cluster.id === 'oem_vendor' ? '原厂' : cluster.id === 'third_party_service' ? '三方' : cluster.id === 'metrology_regulatory' ? '计量' : '自定义'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono">
                    {count} <span className="text-[10px] font-normal opacity-80">人</span>
                  </span>
                  <span className={`text-[10px] truncate max-w-[85px] opacity-75`}>
                    {cluster.description || cluster.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Advanced Multi-dimension Filter & Action Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
          
          {/* Search Box */}
          <div className="relative min-w-[200px] max-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索姓名、工号、机构、专长、合同..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Org Filter */}
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">全部所属单位 ({uniqueOrgs.length + 1})</option>
            <option value="五莲县人民医院">五莲县人民医院 (院内)</option>
            {uniqueOrgs.filter(o => o !== '五莲县人民医院').map(org => (
              <option key={org} value={org}>{org}</option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">全部角色职责 ({roles.length})</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name} ({r.categoryLabel})</option>
            ))}
          </select>

          {/* Dept Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">全部科室 ({departments.length})</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Emergency Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">全部应急响应梯队</option>
            <option value="L1">L1 一线现场抢修 (急救支持)</option>
            <option value="L2">L2 院内医工保障 (专机主管)</option>
            <option value="L3">L3 原厂专家支持 (原厂专修)</option>
            <option value="none">无应急级别 (销售/常规)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium cursor-pointer"
          >
            <option value="ALL">全部状态</option>
            <option value="active">在职 / 有效</option>
            <option value="on_leave">休假中</option>
            <option value="inactive">离职 / 停用</option>
          </select>

          {(selectedCluster !== 'ALL' || selectedRole !== 'ALL' || selectedDept !== 'ALL' || selectedOrg !== 'ALL' || selectedTier !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCluster('ALL');
                setSelectedRole('ALL');
                setSelectedDept('ALL');
                setSelectedOrg('ALL');
                setSelectedTier('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
            >
              重置筛选
            </button>
          )}
        </div>

        {/* Right: Master Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition text-xs"
            title="支持批量复制粘贴 TSV/CSV 或上传 Excel 数据"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>批量导入</span>
          </button>

          <button
            onClick={handleExportSelected}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition text-xs"
            title="导出当前筛选干系人名册为 TSV 电子表格"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出名册</span>
          </button>

          <button
            onClick={() => setIsClusterModalOpen(true)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition text-xs"
            title="配置与新增干系人群体分类 (医工/临床/行政/原厂/三方/计量/自定义)"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>群体分类</span>
          </button>

          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition text-xs"
            title="设定角色定义、职责说明与权限"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>角色字典</span>
          </button>

          <button
            onClick={() => {
              setEditingStaff({
                id: `STAFF-${Date.now().toString().slice(-4)}`,
                employeeNo: `EMP-${7000 + staff.length + 1}`,
                name: '',
                stakeholderCategory: 'hospital_engineering',
                organization: '五莲县人民医院',
                departmentId: departments[0]?.id || '303',
                departmentName: departments[0]?.name || '医疗设备科',
                role: '维修工程师',
                phone: '',
                title: '',
                email: '',
                emergencyTier: 'L2',
                isPrimaryContact: false,
                specialties: [],
                status: 'active'
              });
              setIsSingleModalOpen(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs cursor-pointer transition text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增干系人</span>
          </button>
        </div>

      </div>

      {/* 3. Batch Action Bar (Visible when rows selected) */}
      {selectedStaffIds.length > 0 && (
        <div className="px-4 py-2 bg-indigo-900 text-white flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              已选择 <strong className="text-amber-300 font-mono text-sm">{selectedStaffIds.length}</strong> 位人员/干系人
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchEditModalOpen(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>批量修改属性 (单位/角色/梯队/科室)</span>
            </button>

            <button
              onClick={() => handleBatchSetStatus('active')}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-medium cursor-pointer"
            >
              设为在职
            </button>

            <button
              onClick={() => handleBatchSetStatus('on_leave')}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-medium cursor-pointer"
            >
              设为休假
            </button>

            <button
              onClick={handleBatchDelete}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>批量删除</span>
            </button>

            <button
              onClick={() => setSelectedStaffIds([])}
              className="text-slate-300 hover:text-white underline ml-2 cursor-pointer"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Data Table View */}
      <div className="flex-1 overflow-auto p-4">
        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
            <Users className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="text-base font-bold text-slate-700">暂无匹配的人员或干系人档案</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              未找到符合当前集群、角色或关键词的干系人记录。您可以尝试重置筛选条件，或使用上方“批量导入”快速导入名册。
            </p>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedCluster('ALL');
                  setSelectedRole('ALL');
                  setSelectedDept('ALL');
                  setSelectedOrg('ALL');
                  setSelectedTier('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                清空所有筛选
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>批量导入人员名册</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            {/* 表格顶部数据统计栏 */}
            <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>人员与责任工程师档案</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 text-[11px]">
                  共 {filteredStaff.length} 人
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] select-none">
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.length === paginatedStaff.length && paginatedStaff.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">人员 / 专家姓名</th>
                    <th className="py-2.5 px-3">干系人群体 / 所属机构</th>
                    <th className="py-2.5 px-3">角色职责 / 科室</th>
                    <th className="py-2.5 px-3">应急响应梯队</th>
                    <th className="py-2.5 px-3">负责产品线 / 专长领域</th>
                    <th className="py-2.5 px-3">联系方式 / 24H热线</th>
                    <th className="py-2.5 px-3">资质证书 / 授权</th>
                    <th className="py-2.5 px-3 text-center">状态</th>
                    <th className="py-2.5 px-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {paginatedStaff.map((member) => {
                    const isSelected = selectedStaffIds.includes(member.id);
                    const cluster = member.stakeholderCategory || inferStakeholderCluster(member.role, member.departmentName, member.organization);
                    const clusterDef = STAKEHOLDER_CLUSTERS.find(c => c.id === cluster);
                    const roleBadgeClass = getRoleBadgeStyle(member.role);
                    const tierBadgeClass = getEmergencyTierBadgeStyle(member.emergencyTier);

                    return (
                      <tr 
                        key={member.id}
                        className={`hover:bg-indigo-50/30 transition group ${
                          isSelected ? 'bg-indigo-50/50' : member.status === 'inactive' ? 'opacity-60 bg-slate-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStaff(member.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Name & ID */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                              {member.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm">{member.name}</span>
                                {member.isPrimaryContact && (
                                  <span 
                                    className="px-1.5 py-0.2 rounded bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold flex items-center gap-0.5"
                                    title="本科室首选设备管理责任人"
                                  >
                                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                                    <span>首选责任人</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">
                                {member.employeeNo}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cluster & Organization */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${clusterDef?.bgColor} ${clusterDef?.borderColor} ${clusterDef?.textColor}`}>
                                {clusterDef?.shortName || '院内保障'}
                              </span>
                            </div>
                            <div className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]" title={member.organization || '五莲县人民医院'}>
                                {member.organization || '五莲县人民医院'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role & Dept */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${roleBadgeClass}`}>
                                {member.role}
                              </span>
                              {member.title && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({member.title})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {member.departmentName}
                            </div>
                          </div>
                        </td>

                        {/* Emergency Tier */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] border inline-flex items-center gap-1 ${tierBadgeClass}`}>
                            <Activity className="w-3 h-3" />
                            {member.emergencyTier === 'L1' 
                              ? 'L1 一线现场抢修' 
                              : member.emergencyTier === 'L2' 
                              ? 'L2 院内医工主管' 
                              : member.emergencyTier === 'L3' 
                              ? 'L3 原厂专家支持' 
                              : '常规/无紧急梯队'}
                          </span>
                          {member.serviceContractNo && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5" title="关联服务合同编号">
                              合同: {member.serviceContractNo}
                            </div>
                          )}
                        </td>

                        {/* Service Scope & Specialties */}
                        <td className="py-3 px-3 max-w-[240px]">
                          {member.serviceScope ? (
                            <div className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed" title={member.serviceScope}>
                              {member.serviceScope}
                            </div>
                          ) : member.specialties && member.specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.specialties.map(s => (
                                <span key={s} className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium">
                                  {s.split(' ')[0]}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">全科常规设备</span>
                          )}
                        </td>

                        {/* Contact details */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-mono font-bold text-slate-800 text-xs">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{member.phone}</span>
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                                <Mail className="w-3 h-3 text-slate-300" />
                                <span className="truncate max-w-[130px]">{member.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Certifications & Credentials */}
                        <td className="py-3 px-3 max-w-[180px]">
                          {member.credentials && member.credentials.length > 0 ? (
                            <div className="space-y-1">
                              {member.credentials.map((c, i) => (
                                <div key={i} className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded truncate" title={`${c.certName} (有效期至: ${c.expireDate || '长期'})`}>
                                  <ShieldCheck className="w-3 h-3 shrink-0 text-emerald-600" />
                                  <span className="truncate">{c.certName}</span>
                                </div>
                              ))}
                            </div>
                          ) : member.certifications && member.certifications.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.certifications.map((c, i) => (
                                <span key={i} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] truncate max-w-[150px]">
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">已审核上岗</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            member.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : member.status === 'on_leave'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}>
                            {member.status === 'active' ? '在职' : member.status === 'on_leave' ? '休假' : '停用'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingStaff(member);
                                setIsSingleModalOpen(true);
                              }}
                              className="px-2 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded font-bold text-xs cursor-pointer transition"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteSingleStaff(member.id, member.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition"
                              title="删除此档案"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Complete Pagination */}
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={filteredStaff.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* 5. Stakeholder Cluster Config Modal */}
      <StakeholderClusterConfigModal
        isOpen={isClusterModalOpen}
        onClose={() => setIsClusterModalOpen(false)}
        clusters={clusters}
        onUpdateClusters={handleUpdateClusters}
      />

      {/* 6. Batch Import Modal */}
      <StaffBatchImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        departments={departments}
        existingStaff={staff}
        onImportSuccess={(newStaffList, mode) => {
          onUpdateStaff(newStaffList);
          alert(`成功${mode === 'overwrite' ? '全量覆盖导入' : '增量合并导入'}干系人名册，共 ${newStaffList.length} 条记录！`);
        }}
      />

      {/* 7. Role Definition Config Modal */}
      <StaffRoleConfigModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        roles={roles}
        onUpdateRoles={handleUpdateRoles}
      />

      {/* 8. Batch Edit Modal */}
      <StaffBatchEditModal
        isOpen={isBatchEditModalOpen}
        onClose={() => setIsBatchEditModalOpen(false)}
        selectedStaffIds={selectedStaffIds}
        allStaff={staff}
        departments={departments}
        roles={roles}
        clusters={clusters}
        onBatchUpdate={(updatedList) => {
          onUpdateStaff(updatedList);
          setSelectedStaffIds([]);
          alert('批量修改成功！');
        }}
      />

      {/* 9. Single Staff Edit/Create Modal */}
      {isSingleModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">
                  {staff.some(s => s.id === editingStaff.id) ? '编辑医疗设备干系人档案' : '录入新设备干系人 / 工程师主数据'}
                </h3>
              </div>
              <button 
                onClick={() => setIsSingleModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingStaff.name.trim()) {
                  alert('请填写干系人姓名！');
                  return;
                }
                handleSaveSingleStaff(editingStaff);
              }}
              className="p-6 space-y-3.5 text-xs flex-1 overflow-y-auto"
            >
              {/* Cluster & Organization */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                <div>
                  <label className="block font-bold text-indigo-950 mb-1">干系人群体分类 <span className="text-rose-500">*</span></label>
                  <select
                    value={editingStaff.stakeholderCategory || 'hospital_engineering'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, stakeholderCategory: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded font-bold text-indigo-800 text-xs"
                  >
                    {clusters.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.shortName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-indigo-950 mb-1">所属单位 / 企业机构 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：五莲县人民医院 / 通用电气医疗 / 深圳迈瑞"
                    value={editingStaff.organization || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, organization: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded text-xs font-medium"
                  />
                </div>
              </div>

              {/* ID and Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">员工工号 / 专家编号 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingStaff.employeeNo}
                    onChange={(e) => setEditingStaff({ ...editingStaff, employeeNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">人员 / 专家姓名 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：崔伟 / 杜工 / 王建国"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                  />
                </div>
              </div>

              {/* Dept and Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">对口科室 / 部门</label>
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
                  <label className="block font-bold text-slate-700 mb-1">主要角色职责 <span className="text-rose-500">*</span></label>
                  <select
                    value={editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold text-indigo-700"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name} ({r.categoryLabel})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Phone and Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">联系电话 / 24H服务热线 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="例：7991237 / 138-0000-0000"
                    value={editingStaff.phone}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">专业职称 / 业务头衔</label>
                  <input
                    type="text"
                    placeholder="例：高级现场服务工程师 (FSE-L4) / 主管技师"
                    value={editingStaff.title || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, title: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Email and Emergency Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">应急响应梯队</label>
                  <select
                    value={editingStaff.emergencyTier || 'none'}
                    onChange={(e) => setEditingStaff({ ...editingStaff, emergencyTier: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                  >
                    <option value="L1">L1 一线现场快速响应 (急救生命支持第一责任人)</option>
                    <option value="L2">L2 院内医工专业保障 (维修主管/质控/大型设备)</option>
                    <option value="L3">L3 原厂专家/24H专机技术支持 (原厂CT/MRI专机)</option>
                    <option value="none">无应急响应级别 (常规/销售/商务)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">服务合同 / 检定协议编号</label>
                  <input
                    type="text"
                    placeholder="例：HT-2025-GE-001"
                    value={editingStaff.serviceContractNo || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, serviceContractNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs"
                  />
                </div>
              </div>

              {/* Service Scope Text */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">负责服务范围 / 分管品牌产品线</label>
                <input
                  type="text"
                  placeholder="例：GE Revolution CT、1.5T MR专机维保与远程TAC支持；迈瑞全线监护呼吸设备"
                  value={editingStaff.serviceScope || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, serviceScope: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                />
              </div>

              {/* Specialties Multiselect */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">专长领域 (标准分类标签)</label>
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                  {SPECIALTY_DOMAIN_OPTIONS.map(opt => {
                    const current = editingStaff.specialties || [];
                    const isSelected = current.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditingStaff({
                              ...editingStaff,
                              specialties: current.filter(s => s !== opt)
                            });
                          } else {
                            setEditingStaff({
                              ...editingStaff,
                              specialties: [...current, opt]
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded text-[11px] text-left border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <Check className="w-3 h-3 text-purple-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status & Primary Check */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">在职/合作状态</label>
                  <select
                    value={editingStaff.status}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value as any })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                  >
                    <option value="active">在职 / 正常指派 (Active)</option>
                    <option value="on_leave">休假中 / 临时暂停 (On Leave)</option>
                    <option value="inactive">离职 / 停用 (Inactive)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingStaff.isPrimaryContact}
                      onChange={(e) => setEditingStaff({ ...editingStaff, isPrimaryContact: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>本科室首要对接责任人 (优先指派)</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-xs cursor-pointer"
                >
                  保存干系人主数据
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
