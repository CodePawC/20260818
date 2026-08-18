import { AuthUser, StaffPersonMaster, ActiveTab, StaffRole } from '../types';
import { DEFAULT_STAFF_ROLES, STAKEHOLDER_CLUSTERS, inferStakeholderCluster } from './staffRolesData';

export const AUTH_STORAGE_KEY = 'hospital_medtech_current_user';

/**
 * 根据人员档案和系统角色库，计算并分配权限集合
 */
export function getPermissionsForStaff(staff: StaffPersonMaster): string[] {
  // 超级管理员赋予全权限
  if (staff.employeeNo === 'ADMIN-001' || staff.role === '系统管理员' || staff.role === '超级管理员') {
    return [
      'ALL',
      '台账管理', '新增设备', '编辑设备', '删除设备', '状态变更', '调拨调配', '报废处置',
      '故障报修', '工单维修', '抢修响应', '预防性维护', '配件申领', '停机诊断',
      '强检申报', '计量计划', '法定检定', '证书录入', '定级复核', '溯源档案',
      '质控抽检', '不良事件', '风险预警', '报废鉴定', '巡检监督', '质量月报',
      '往来单位管理', '服务商协同', '合同管理',
      '组织主数据', '强检目录维护', '分类目录维护', '人员角色配置', '系统设置',
      '效能分析', '财务折旧', '成本效益', '数据导出', '批量导入', 'AI诊断'
    ];
  }

  const permissionsSet = new Set<string>();

  // 1. 基础查看与AI诊断权限（全员具备）
  permissionsSet.add('台账查看');
  permissionsSet.add('AI诊断');
  permissionsSet.add('故障报修'); // 全院临床与医工人员皆可发起报修

  // 2. 匹配主角色的权限
  const matchedRole = DEFAULT_STAFF_ROLES.find(r => r.name === staff.role);
  if (matchedRole && matchedRole.permissions) {
    matchedRole.permissions.forEach(p => permissionsSet.add(p));
  }

  // 3. 匹配兼任角色的权限
  if (staff.roles && Array.isArray(staff.roles)) {
    staff.roles.forEach(rName => {
      const extraRole = DEFAULT_STAFF_ROLES.find(r => r.name === rName);
      if (extraRole && extraRole.permissions) {
        extraRole.permissions.forEach(p => permissionsSet.add(p));
      }
    });
  }

  // 4. 根据角色类别与集群进行补充权限扩充
  const cluster = staff.stakeholderCategory || inferStakeholderCluster(staff.role, staff.departmentName, staff.organization);

  if (cluster === 'hospital_engineering') {
    // 院内医工保障集群：拥有设备维保、台账管理与基础主数据权限
    permissionsSet.add('台账管理');
    permissionsSet.add('新增设备');
    permissionsSet.add('编辑设备');
    permissionsSet.add('状态变更');
    permissionsSet.add('调拨调配');
    permissionsSet.add('数据导出');
    permissionsSet.add('批量导入');
    permissionsSet.add('往来单位管理');
    
    if (staff.role === '设备管理员' || staff.role === '质控主管') {
      permissionsSet.add('组织主数据');
      permissionsSet.add('强检目录维护');
      permissionsSet.add('分类目录维护');
      permissionsSet.add('人员角色配置');
      permissionsSet.add('报废处置');
    }
    if (staff.role === '维修工程师') {
      permissionsSet.add('工单维修');
      permissionsSet.add('抢修响应');
      permissionsSet.add('预防性维护');
      permissionsSet.add('配件申领');
    }
    if (staff.role === '计量管理员') {
      permissionsSet.add('强检申报');
      permissionsSet.add('计量计划');
      permissionsSet.add('法定检定');
      permissionsSet.add('证书录入');
      permissionsSet.add('强检目录维护');
    }
  } else if (cluster === 'hospital_administration') {
    // 行政监管集群
    permissionsSet.add('数据导出');
    permissionsSet.add('效能分析');
    if (staff.role === '财务资产管理员') {
      permissionsSet.add('财务折旧');
      permissionsSet.add('成本效益');
      permissionsSet.add('资产建卡');
      permissionsSet.add('编辑设备');
    }
    if (staff.role === '招标采购主管') {
      permissionsSet.add('往来单位管理');
      permissionsSet.add('合同管理');
      permissionsSet.add('新增设备');
    }
  } else if (cluster === 'hospital_clinical') {
    // 临床医护集群
    if (staff.role === '科室主任' || staff.role === '护士长') {
      permissionsSet.add('效能分析');
      permissionsSet.add('应急借用');
      permissionsSet.add('报修协同');
      permissionsSet.add('科室盘点');
    }
  } else if (cluster === 'oem_vendor' || cluster === 'third_party_service') {
    // 外部原厂 / 三方维保
    permissionsSet.add('工单维修');
    permissionsSet.add('预防性维护');
    permissionsSet.add('服务商协同');
  } else if (cluster === 'metrology_regulatory') {
    // 法定计量监管机构
    permissionsSet.add('法定检定');
    permissionsSet.add('证书录入');
    permissionsSet.add('定级复核');
  }

  return Array.from(permissionsSet);
}

/**
 * 将 StaffPersonMaster 转换为 AuthUser
 */
export function createAuthUserFromStaff(staff: StaffPersonMaster, isAdmin = false): AuthUser {
  const permissions = isAdmin ? ['ALL'] : getPermissionsForStaff(staff);
  return {
    id: staff.id,
    employeeNo: staff.employeeNo,
    name: staff.name,
    role: staff.role,
    roles: staff.roles,
    departmentId: staff.departmentId,
    departmentName: staff.departmentName,
    organization: staff.organization || '五莲县人民医院',
    title: staff.title,
    phone: staff.phone,
    email: staff.email,
    stakeholderCategory: staff.stakeholderCategory || (inferStakeholderCluster(staff.role, staff.departmentName, staff.organization) as any),
    permissions,
    isAdmin: isAdmin || staff.employeeNo === 'ADMIN-001' || staff.role === '系统管理员',
    loginAt: new Date().toISOString()
  };
}

/**
 * 超级管理员预设账号
 */
export const SUPER_ADMIN_USER: AuthUser = {
  id: 'STAFF-ADMIN',
  employeeNo: 'ADMIN-001',
  name: '系统总管 (管理员)',
  role: '系统管理员',
  departmentId: '303',
  departmentName: '医学工程保障中心 / 信息科',
  organization: '五莲县人民医院 (总院)',
  title: '系统总架构师 / 医工总监',
  phone: '0633-7991000',
  email: 'admin@hospital.wl.cn',
  stakeholderCategory: 'hospital_engineering',
  permissions: ['ALL'],
  isAdmin: true,
  loginAt: new Date().toISOString()
};

/**
 * 权限核查核心函数
 */
export function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.isAdmin || user.permissions.includes('ALL')) return true;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: AuthUser | null | undefined, permissions: string[]): boolean {
  if (!user) return false;
  if (user.isAdmin || user.permissions.includes('ALL')) return true;
  return permissions.some(p => user.permissions.includes(p));
}

/**
 * 检查当前角色是否可以访问指定侧边栏 Tab 模块
 */
export function canAccessTab(user: AuthUser | null | undefined, tab: ActiveTab): boolean {
  if (!user) return false;
  if (user.isAdmin || user.permissions.includes('ALL')) return true;

  // 护士长角色专属菜单：包含工作台概览、科室设备台账、医疗设备应急库(全院共享)、维保与强检、维修记录、AI智能专家
  if (isHeadNurse(user)) {
    const nurseAllowedTabs: ActiveTab[] = ['dashboard', 'ledger', 'emergency_reserve', 'maintenance', 'repairs', 'ai'];
    return nurseAllowedTabs.includes(tab);
  }

  switch (tab) {
    case 'dashboard':
      // 工作台概览：全员可用
      return true;

    case 'ledger':
      // 设备台账：全员可浏览
      return true;

    case 'emergency_reserve':
      // 医疗设备应急库：全院所有科室、护士长、医生、工程师等均可查看库存并申请借调
      return true;

    case 'maintenance':
      // 维保计划 & 强检：医工、计量、质控、管理层、外部服务商、特检机构
      return hasAnyPermission(user, ['预防性维护', '强检申报', '计量计划', '法定检定', '日常巡检', '台账管理', '灭菌质控']);

    case 'repairs':
      // 维修记录：全员可用（临床报修、工程师修、服务商处理）
      return true;

    case 'tracking':
      // 状态追踪轨迹：医工保障、设备管理
      return hasAnyPermission(user, ['台账管理', '工单维修', '状态变更', '状态追踪']);

    case 'partners':
      // 往来单位与服务商协同：医工保障、采购招标、财务、管理层、合作商
      return hasAnyPermission(user, ['往来单位管理', '服务商协同', '商务合同', '招投标管理', '台账管理']);

    case 'master_data':
      // 组织与空间主数据、强检目录、分类目录、人员角色：需要医工管理、计量或系统管理权限
      return hasAnyPermission(user, ['组织主数据', '强检目录维护', '分类目录维护', '人员角色配置', '台账管理', '质控抽检']);

    case 'analytics':
      // 效能与成本分析：医工主管、科主任、财务、医务、审计、采购等
      return hasAnyPermission(user, ['效能分析', '财务折旧', '成本效益', '质量月报', '预算审批', '绩效考核', '采购审计']);

    case 'ai':
      // AI 智能诊断：全员可用
      return true;

    default:
      return true;
  }
}

/**
 * 检查关键业务操作权限
 */
export function canManageEquipment(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['台账管理', '新增设备', '编辑设备', '状态变更', '调拨调配']);
}

export function canAddEquipment(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['新增设备', '台账管理', '资产建卡']);
}

export function canDeleteEquipment(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['删除设备', '报废处置']) || (user?.isAdmin ?? false);
}

export function canManageMasterData(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['组织主数据', '强检目录维护', '分类目录维护', '人员角色配置']) || (user?.isAdmin ?? false);
}

export function canManageMetrology(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['强检申报', '计量计划', '法定检定', '证书录入', '强检目录维护']);
}

export function canInitiateRepair(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['故障报修', '报修协同', '工单维修', '台账管理']);
}

export function canHandleRepair(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['工单维修', '抢修响应', '预防性维护', '停机诊断', '配件申领']);
}

export function canExportData(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['数据导出', '台账管理', '效能分析', '财务折旧']);
}

export function canImportData(user: AuthUser | null | undefined): boolean {
  return hasAnyPermission(user, ['批量导入', '台账管理', '组织主数据']);
}

/**
 * 临床医护人员与护士长角色判定
 */
export function isHospitalWidePerspective(user: AuthUser | null | undefined): boolean {
  if (!user) return true;
  if (user.isAdmin || user.employeeNo === 'ADMIN-001' || user.role === '系统管理员' || user.role === '超级管理员') return true;
  
  const dept = user.departmentName || '';
  if (dept.includes('设备') || dept.includes('工程') || dept.includes('器械') || dept.includes('应急库')) {
    return true;
  }
  
  if (
    user.stakeholderCategory === 'hospital_engineering' || 
    user.stakeholderCategory === 'hospital_administration' || 
    user.stakeholderCategory === 'oem_vendor' || 
    user.stakeholderCategory === 'third_party_service' || 
    user.stakeholderCategory === 'metrology_regulatory'
  ) {
    return true;
  }
  
  const engRoles = ['工程师', '维修', '计量', '质控', '库管', '资产', '采购', '财务', '院长', '安全员', '专管员'];
  if (engRoles.some(r => user.role?.includes(r))) {
    return true;
  }
  
  return false;
}

export function isClinicalStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const dept = user.departmentName || '';
  if (dept.includes('设备') || dept.includes('工程') || dept.includes('器械') || dept.includes('应急库')) {
    return false;
  }
  if (user.stakeholderCategory === 'hospital_engineering' || user.stakeholderCategory === 'hospital_administration') {
    return false;
  }
  if (user.stakeholderCategory === 'hospital_clinical') return true;
  const clinicalRoles = ['护士长', '科室责任人', '科室主任', '医生', '护士', '技师'];
  return clinicalRoles.some(r => user.role?.includes(r));
}

export function isHeadNurse(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return (user.role?.includes('护士长') || false) && user.stakeholderCategory === 'hospital_clinical';
}

export function getUserDepartment(user: AuthUser | null | undefined): string {
  if (!user || !user.departmentName) return '';
  return user.departmentName;
}

/**
 * 本地存储读写
 */
export function loadSavedUser(): AuthUser | null {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.name && parsed.role) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load authenticated user from localStorage', err);
  }
  return null;
}

export function saveUserToStorage(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Failed to persist authenticated user to localStorage', err);
  }
}
