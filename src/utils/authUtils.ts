import { AuthUser, StaffPersonMaster, ActiveTab, StaffRole, StakeholderCluster } from '../types';
import { DEFAULT_STAFF_ROLES, STAKEHOLDER_CLUSTERS, inferStakeholderCluster } from './staffRolesData';
import { matchesDepartment } from './masterData';
import { setAuthFetchUser } from './authFetch';
import {
  RoleArchetype,
  resolveRoleArchetype,
  canAccessTabByPolicy,
  canDispatchWorkOrderByPolicy,
  canPreDispatchWorkOrderByPolicy,
  canParticipateDispatchDiscussionByPolicy,
  canExecuteFieldRepairByPolicy,
  canClinicalAcceptWorkOrderByPolicy,
  canEditRegulationByPolicy,
  canManageSystemOpsByPolicy,
  canViewCaoliaoLogsByPolicy,
  canManageMasterDataByPolicy,
  canAddEquipmentByPolicy,
  canEditEquipmentByPolicy,
  canDeleteOrScrapEquipmentByPolicy,
  canChangeEquipmentStatusByPolicy,
  canManageSparePartsByPolicy,
  canApproveFinanceOrAuditByPolicy,
  canInitiateRepairByPolicy,
  canBroadcastNoticeByPolicy,
  PROJECT_LEDGER_PERMISSION,
  canViewProjectLedgerByPolicy,
  canOperateProjectLedgerByPolicy
} from './rbacPolicy';

export type { RoleArchetype };
export const AUTH_STORAGE_KEY = 'hospital_medtech_current_user';

/**
 * 根据人员档案和系统角色库，计算并分配权限集合
 */
export function getPermissionsForStaff(staff: StaffPersonMaster): string[] {
  // 超级管理员赋予全权限
  if (staff.employeeNo === 'ADMIN-001' || staff.role === '系统管理员' || staff.role === '超级管理员') {
    return [
      'ALL',
      '台账管理', '项目台账管理', '新增设备', '编辑设备', '删除设备', '状态变更', '调拨调配', '报废处置',
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

  // 4. 根据岗位角色精细收敛权限（杜绝向普通工程师、临床科室过度授权）
  const cluster = staff.stakeholderCategory || inferStakeholderCluster(staff.role, staff.departmentName, staff.organization);
  const roleStr = (staff.role || '').trim();
  const isSupervisor =
    roleStr === '医工主管/调度员' ||
    roleStr.includes('调度') ||
    roleStr.includes('医工主管') ||
    roleStr.includes('设备科长') ||
    (staff.title && (staff.title.includes('科长') || staff.title.includes('总监')));

  if (cluster === 'hospital_engineering') {
    permissionsSet.add('数据导出');

    if (isSupervisor) {
      permissionsSet.add('派工调度');
      permissionsSet.add('预派工管理');
      permissionsSet.add('制度管理');
      permissionsSet.add('台账管理');
      permissionsSet.add(PROJECT_LEDGER_PERMISSION);
      permissionsSet.add('新增设备');
      permissionsSet.add('编辑设备');
      permissionsSet.add('删除设备');
      permissionsSet.add('状态变更');
      permissionsSet.add('调拨调配');
      permissionsSet.add('报废处置');
      permissionsSet.add('批量导入');
      permissionsSet.add('往来单位管理');
      permissionsSet.add('服务商协同');
      permissionsSet.add('组织主数据');
      permissionsSet.add('强检目录维护');
      permissionsSet.add('分类目录维护');
      permissionsSet.add('人员角色配置');
      permissionsSet.add('工单维修');
      permissionsSet.add('抢修响应');
      permissionsSet.add('预防性维护');
    } else if (roleStr === '质控主管') {
      permissionsSet.add('质控抽检');
      permissionsSet.add('不良事件');
      permissionsSet.add('风险预警');
      permissionsSet.add('巡检监督');
      permissionsSet.add('质量月报');
    } else if (roleStr === '计量管理员') {
      permissionsSet.add('强检申报');
      permissionsSet.add('计量计划');
      permissionsSet.add('法定检定');
      permissionsSet.add('证书录入');
      permissionsSet.add('强检目录维护');
      permissionsSet.add('状态变更');
    } else if (roleStr === '库管员') {
      permissionsSet.add('应急库管理');
      permissionsSet.add('备用机借调');
      permissionsSet.add('备件进销存');
    } else {
      // 维修工程师：仅负责现场维修、内部技术讨论、备件申领与状态回写，不具备派工/增删台账/改制度权限
      permissionsSet.add('工单维修');
      permissionsSet.add('抢修响应');
      permissionsSet.add('预防性维护');
      permissionsSet.add('配件申领');
      permissionsSet.add('停机诊断');
      permissionsSet.add('状态变更');
    }
  } else if (cluster === 'hospital_administration') {
    permissionsSet.add('数据导出');
    permissionsSet.add('效能分析');
    if (roleStr === '财务资产管理员') {
      permissionsSet.add('财务折旧');
      permissionsSet.add('成本效益');
      permissionsSet.add('资产建卡');
      permissionsSet.add('新增设备');
      permissionsSet.add('编辑设备');
      permissionsSet.add('往来单位管理');
      permissionsSet.add('服务商协同');
    }
    if (roleStr === '招标采购主管') {
      permissionsSet.add('往来单位管理');
      permissionsSet.add('合同管理');
      permissionsSet.add('新增设备');
    }
  } else if (cluster === 'hospital_clinical') {
    if (roleStr.includes('主任')) {
      permissionsSet.add('效能分析');
      permissionsSet.add('成本效益');
      permissionsSet.add('应急借用');
      permissionsSet.add('报修协同');
      permissionsSet.add('科室盘点');
      permissionsSet.add('数据导出');
    } else if (roleStr.includes('护士长')) {
      permissionsSet.add('应急借用');
      permissionsSet.add('报修协同');
      permissionsSet.add('科室盘点');
    }
  } else if (cluster === 'oem_vendor' || cluster === 'third_party_service') {
    permissionsSet.add('工单维修');
    permissionsSet.add('预防性维护');
    permissionsSet.add('服务商协同');
  } else if (cluster === 'metrology_regulatory') {
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
 * 检查当前角色是否可以访问指定侧边栏 Tab 模块（采用 Default-Deny 白名单策略）
 */
export function canAccessTab(user: AuthUser | null | undefined, tab: ActiveTab): boolean {
  return canAccessTabByPolicy(user, tab);
}

/**
 * 检查关键业务操作权限（基于 7+1 细分岗位原型与 RBAC 策略矩阵）
 */
export function canDispatchWorkOrder(user: AuthUser | null | undefined): boolean {
  return canDispatchWorkOrderByPolicy(user);
}

export function canPreDispatchWorkOrder(user: AuthUser | null | undefined): boolean {
  return canPreDispatchWorkOrderByPolicy(user);
}

export function canParticipateDispatchDiscussion(user: AuthUser | null | undefined): boolean {
  return canParticipateDispatchDiscussionByPolicy(user);
}

export function canExecuteFieldRepair(user: AuthUser | null | undefined): boolean {
  return canExecuteFieldRepairByPolicy(user);
}

export function canClinicalAcceptWorkOrder(user: AuthUser | null | undefined): boolean {
  return canClinicalAcceptWorkOrderByPolicy(user);
}

export function canEditRegulation(user: AuthUser | null | undefined): boolean {
  return canEditRegulationByPolicy(user);
}

export function canManageSystemOps(user: AuthUser | null | undefined): boolean {
  return canManageSystemOpsByPolicy(user);
}

export function canViewCaoliaoLogs(user: AuthUser | null | undefined): boolean {
  return canViewCaoliaoLogsByPolicy(user);
}

export function canManageEquipment(user: AuthUser | null | undefined): boolean {
  return canEditEquipmentByPolicy(user);
}

export function canAddEquipment(user: AuthUser | null | undefined): boolean {
  return canAddEquipmentByPolicy(user);
}

export function canEditEquipment(user: AuthUser | null | undefined): boolean {
  return canEditEquipmentByPolicy(user);
}

export function canDeleteEquipment(user: AuthUser | null | undefined): boolean {
  return canDeleteOrScrapEquipmentByPolicy(user);
}

export function canChangeEquipmentStatus(user: AuthUser | null | undefined): boolean {
  return canChangeEquipmentStatusByPolicy(user);
}

export function canManageMasterData(user: AuthUser | null | undefined): boolean {
  return canManageMasterDataByPolicy(user);
}

export function canManageSpareParts(user: AuthUser | null | undefined): boolean {
  return canManageSparePartsByPolicy(user);
}

export function canApproveFinanceOrAudit(user: AuthUser | null | undefined): boolean {
  return canApproveFinanceOrAuditByPolicy(user);
}

/**
 * 检查规章制度编辑、修订、删除与 PDF 归档权限（仅系统管理员与医工主管/调度员）
 */
export function canUploadRegulationPdf(user: AuthUser | null | undefined): boolean {
  return canEditRegulationByPolicy(user);
}

export function canManageMetrology(user: AuthUser | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || hasAnyPermission(user, ['强检申报', '计量计划', '法定检定', '证书录入', '强检目录维护']);
}

export function canInitiateRepair(user: AuthUser | null | undefined): boolean {
  return canInitiateRepairByPolicy(user);
}

export function canBroadcastNotice(user: AuthUser | null | undefined): boolean {
  return canBroadcastNoticeByPolicy(user);
}

export function canViewProjectLedger(user: AuthUser | null | undefined): boolean {
  return canViewProjectLedgerByPolicy(user);
}

export function canOperateProjectLedger(user: AuthUser | null | undefined): boolean {
  return canOperateProjectLedgerByPolicy(user);
}

export function canHandleRepair(user: AuthUser | null | undefined): boolean {
  return canExecuteFieldRepairByPolicy(user);
}

export function canExportData(user: AuthUser | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return ['admin', 'engineering_supervisor', 'engineer', 'financial', 'executive', 'clinical_director'].includes(arch);
}

export function canImportData(user: AuthUser | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return ['admin', 'engineering_supervisor', 'financial'].includes(arch);
}

/**
 * 判断用户是否具备全院设备台账统管/巡视视角
 * 仅系统超级管理员、院级医疗设备科/医学工程保障中心人员、院领导以及外部全院巡检/特检服务商具备全院视角
 * 其余各临床科室及使用部门均严格限定只能查看本部门/科室的技术台账
 */
export function canViewAllEquipment(user: AuthUser | null | undefined): boolean {
  if (!user) return false;

  // 1. 超级管理员 / 系统管理员
  if (user.isAdmin || user.employeeNo === 'ADMIN-001' || user.role === '系统管理员' || user.role === '超级管理员') {
    return true;
  }

  // 2. 具备全局 ALL 权限
  if (user.permissions && user.permissions.includes('ALL')) {
    return true;
  }

  // 3. 院级医疗设备科 / 医学工程保障中心 / 医疗设备应急库（院级设备统管与应急调配部门）
  const dept = (user.departmentName || '').trim();
  if (
    dept.includes('医疗设备科') || 
    dept.includes('医学工程') || 
    dept.includes('设备科') || 
    dept.includes('医疗设备应急库')
  ) {
    return true;
  }

  // 4. 院级领导层（院长、分管副院长、院办）
  const role = user.role || '';
  if (
    role.includes('院长') || 
    role.includes('分管副院长') || 
    dept.includes('院长办公室') || 
    dept.includes('领导办公室')
  ) {
    return true;
  }

  // 5. 外部全院法定计量/第三方维保机构/原厂驻场服务商（需跨科室作业）
  if (
    user.stakeholderCategory === 'oem_vendor' || 
    user.stakeholderCategory === 'third_party_service' || 
    user.stakeholderCategory === 'metrology_regulatory'
  ) {
    return true;
  }

  // 6. 其他所有角色（各临床科室主任、护士长、医生、护士、技师、科室资产专管员等）均受限于本科室
  return false;
}

/**
 * 判断当前用户是否受限于其所属科室（不同科室只能查看自己科室的设备技术台账）
 */
export function isDepartmentRestricted(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const userDept = getUserDepartment(user);
  if (!userDept) return false;
  return !canViewAllEquipment(user);
}

/**
 * 判断设备是否属于该科室在册资产，或正被该科室借调使用
 */
export function isEquipmentBelongingToDepartment(
  eq: { department?: string; ownerDepartment?: string; currentLoan?: { loanStatus?: string; borrowingDepartment?: string } },
  userDept: string
): boolean {
  if (!userDept) return true;
  const cleanUser = userDept.trim();

  // 1. 本科室自有/在册管理设备（支持别名与主数据归一化匹配，如“手术室”与“麻醉手术科”）
  if (eq.department && (eq.department === cleanUser || eq.department.trim() === cleanUser || matchesDepartment(eq.department, cleanUser))) {
    return true;
  }
  if (eq.ownerDepartment && (eq.ownerDepartment === cleanUser || eq.ownerDepartment.trim() === cleanUser || matchesDepartment(eq.ownerDepartment, cleanUser))) {
    return true;
  }

  // 2. 借入到本科室且当前正在临床使用的应急借调机具
  if (
    eq.currentLoan && 
    eq.currentLoan.loanStatus !== 'returned' && 
    eq.currentLoan.borrowingDepartment && 
    (
      eq.currentLoan.borrowingDepartment === cleanUser || 
      eq.currentLoan.borrowingDepartment.trim() === cleanUser ||
      eq.currentLoan.borrowingDepartment.includes(cleanUser) ||
      matchesDepartment(eq.currentLoan.borrowingDepartment, cleanUser)
    )
  ) {
    return true;
  }

  return false;
}

/**
 * 全院与科室视角判定（兼容向后调用）
 */
export function isHospitalWidePerspective(user: AuthUser | null | undefined): boolean {
  return canViewAllEquipment(user);
}

/**
 * 判断科室名称是否属于临床业务科室（含各临床病区、手术室、ICU、门急诊、医技等一线业务使用部门）
 */
export function isClinicalDepartment(departmentName?: string): boolean {
  if (!departmentName) return false;
  const dept = departmentName.trim();
  if (
    dept.includes('医疗设备科') ||
    dept.includes('医学工程') ||
    dept.includes('设备科') ||
    dept.includes('器械') ||
    dept.includes('医疗设备应急库') ||
    dept.includes('招标') ||
    dept.includes('采购') ||
    dept.includes('财务') ||
    dept.includes('经济管理') ||
    dept.includes('院长') ||
    dept.includes('院办') ||
    dept.includes('院领导') ||
    dept.includes('原厂') ||
    dept.includes('维保') ||
    dept.includes('计量') ||
    dept.includes('售后') ||
    dept.includes('第三方')
  ) {
    return false;
  }
  return true;
}

/**
 * 判断当前用户是否属于临床科室人员（各临床病区主任、护士长、医生、护士、技师、科室设备管理员等）
 */
export function isClinicalDepartmentUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  // 超级管理员/系统管理员具备全系统管理权限
  if (user.isAdmin || user.employeeNo === 'ADMIN-001' || user.role === '系统管理员' || user.role === '超级管理员') {
    return false;
  }
  // 外部原厂/第三方维保机构属于服务商，非院内临床科室
  if (
    user.stakeholderCategory === 'oem_vendor' ||
    user.stakeholderCategory === 'third_party_service' ||
    user.stakeholderCategory === 'metrology_regulatory'
  ) {
    return false;
  }
  // 干系人分类标注为临床
  if (user.stakeholderCategory === 'hospital_clinical') {
    return true;
  }
  // 护士长或临床医护
  if (isHeadNurse(user) || isClinicalStaff(user)) {
    return true;
  }
  // 按照科室名称判定属于临床科室
  if (isClinicalDepartment(user.departmentName)) {
    return true;
  }
  return false;
}

export function isClinicalStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const dept = user.departmentName || '';
  if (dept.includes('医疗设备科') || dept.includes('医学工程') || dept.includes('设备科') || dept.includes('器械') || dept.includes('应急库')) {
    return false;
  }
  if (user.stakeholderCategory === 'hospital_engineering' || user.stakeholderCategory === 'hospital_administration') {
    return false;
  }
  if (user.stakeholderCategory === 'hospital_clinical') return true;
  const clinicalRoles = ['护士长', '护师', '护士', '科室责任人', '科室主任', '医生', '医师', '技师', '科室设备管理员', '资产专管员'];
  if (clinicalRoles.some(r => user.role?.includes(r))) return true;
  return isClinicalDepartment(dept);
}

export function isHeadNurse(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const role = user.role || '';
  return role.includes('护士长') || role.includes('护士总长');
}

/**
 * 判断当前用户是否属于财务/资产/经济核算管理人员
 */
export function isFinancialStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isAdmin) return false;
  const role = user.role || '';
  const dept = user.departmentName || '';
  if (
    role.includes('财务') || 
    role.includes('会计') || 
    role.includes('出纳') || 
    role.includes('资产管理') || 
    role.includes('资产专员') ||
    dept.includes('财务科') || 
    dept.includes('财务处') || 
    dept.includes('资产管理') ||
    dept.includes('经济管理')
  ) {
    return true;
  }
  return false;
}

/**
 * 判断当前用户是否属于院级领导层（院长、分管副院长、总会计师等）或监察审计
 */
export function isExecutiveLeader(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isAdmin) return false;
  const role = user.role || '';
  const dept = user.departmentName || '';
  if (
    role.includes('院长') || 
    role.includes('副院长') || 
    role.includes('总会计师') || 
    role.includes('书记') ||
    role.includes('审计') ||
    dept.includes('院长办公室') || 
    dept.includes('院领导') || 
    dept.includes('领导办公室') ||
    dept.includes('审计')
  ) {
    return true;
  }
  return false;
}

/**
 * 判断当前用户是否属于医学装备保障与工程技术人员（工程师、计量主管、质控主管、库管员等）
 */
export function isMedicalEngineeringStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  if (user.stakeholderCategory === 'hospital_engineering') return true;
  const dept = user.departmentName || '';
  const role = user.role || '';
  if (
    dept.includes('医疗设备科') || 
    dept.includes('医学工程') || 
    dept.includes('设备科') || 
    dept.includes('应急库') ||
    role.includes('工程师') ||
    role.includes('计量') ||
    role.includes('质控') ||
    role.includes('库管')
  ) {
    return true;
  }
  return false;
}

/**
 * 判断当前用户是否属于外部供应商或维保服务商
 */
export function isVendorStaff(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (
    user.stakeholderCategory === 'oem_vendor' || 
    user.stakeholderCategory === 'third_party_service' || 
    user.stakeholderCategory === 'metrology_regulatory'
  ) {
    return true;
  }
  const role = user.role || '';
  return role.includes('原厂') || role.includes('三方') || role.includes('服务商') || role.includes('检定员');
}

/**
 * 智能判定当前用户的 7+1 细分角色原型，用于驱动差异化工作台、按钮权限与数据范围
 */
export function getUserRoleArchetype(user: AuthUser | null | undefined): RoleArchetype {
  return resolveRoleArchetype(user);
}

/**
 * 预设快速切换的 7+1 类典型医院干系人角色模型（含医工主管/调度员与维修工程师区分）
 */
export interface QuickRolePreset {
  id: string;
  name: string;
  employeeNo: string;
  role: string;
  departmentName: string;
  organization: string;
  stakeholderCategory: StakeholderCluster;
  description: string;
  badge: string;
  badgeColor: string;
  archetype: RoleArchetype;
}

export const PRESET_ROLE_PERSONAS: QuickRolePreset[] = [
  {
    id: 'ROLE_PERSONA_ADMIN',
    name: '崔伟',
    employeeNo: 'ADMIN-001',
    role: '系统管理员',
    departmentName: '医疗设备科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_engineering',
    description: '全院设备主数据与系统运维总管 · 全功能控制权限',
    badge: '系统总管',
    badgeColor: 'purple',
    archetype: 'admin'
  },
  {
    id: 'ROLE_PERSONA_DISPATCHER',
    name: '张志远',
    employeeNo: 'EMP-8000',
    role: '医工主管/调度员',
    departmentName: '医疗设备科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_engineering',
    description: '工单预派工拟定与正式派工签发 · 规章制度维护 · 全院台账统筹',
    badge: '医工调度',
    badgeColor: 'violet',
    archetype: 'engineering_supervisor'
  },
  {
    id: 'ROLE_PERSONA_ENGINEER',
    name: '孙志强',
    employeeNo: 'EMP-8002',
    role: '维修工程师',
    departmentName: '医疗设备科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_engineering',
    description: '参与派前技术讨论 · 接单现场抢修 · 备件申领与状态回写',
    badge: '维修工程师',
    badgeColor: 'sky',
    archetype: 'engineer'
  },
  {
    id: 'ROLE_PERSONA_NURSE',
    name: '范丽华',
    employeeNo: 'EMP-3042',
    role: '护士长',
    departmentName: '重症医学科(ICU)',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_clinical',
    description: '仅限本科室台账查阅 · 晨间巡检盘点 · 故障报修与临床验收',
    badge: '临床护士长',
    badgeColor: 'rose',
    archetype: 'clinical_nurse'
  },
  {
    id: 'ROLE_PERSONA_DIRECTOR',
    name: '刘振国',
    employeeNo: 'EMP-3081',
    role: '科室主任',
    departmentName: '医学影像科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_clinical',
    description: '仅限本科室台账查阅 · 立项论证审批 · 本科室单机ROI效益评估',
    badge: '临床科主任',
    badgeColor: 'emerald',
    archetype: 'clinical_director'
  },
  {
    id: 'ROLE_PERSONA_FINANCE',
    name: '杨世杰',
    employeeNo: 'EMP-3191',
    role: '财务资产管理员',
    departmentName: '财务科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_administration',
    description: '固定资产建卡 · 资金请款与服务商结算 · DRG专耗核算',
    badge: '财务资产',
    badgeColor: 'amber',
    archetype: 'financial'
  },
  {
    id: 'ROLE_PERSONA_EXECUTIVE',
    name: '郑海清',
    employeeNo: 'EMP-0002',
    role: '分管副院长',
    departmentName: '院长办公室',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_administration',
    description: '全院宏观设备运行与投资回报 · 大额维修审批与合规监管',
    badge: '分管副院长',
    badgeColor: 'indigo',
    archetype: 'executive'
  },
  {
    id: 'ROLE_PERSONA_VENDOR',
    name: '赵建国',
    employeeNo: 'OEM-SN-01',
    role: '驻场原厂工程师',
    departmentName: '国药器械技术服务部',
    organization: '国药器械医工技术服务 (中国) 有限公司',
    stakeholderCategory: 'oem_vendor',
    description: '外协大修与巡检工单履约 · 配件报价申报 · 专票上传',
    badge: '签约服务商',
    badgeColor: 'teal',
    archetype: 'vendor'
  }
];

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
        setAuthFetchUser(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load authenticated user from localStorage', err);
  }
  return null;
}

export function saveUserToStorage(user: AuthUser | null): void {
  setAuthFetchUser(user);
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
