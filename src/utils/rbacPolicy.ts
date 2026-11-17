import type { ActiveTab, StakeholderCluster } from '../types';

export type RoleArchetype =
  | 'admin'
  | 'engineering_supervisor'
  | 'engineer'
  | 'clinical_nurse'
  | 'clinical_director'
  | 'financial'
  | 'executive'
  | 'vendor';

export interface UserIdentityLike {
  id?: string;
  employeeNo?: string;
  name?: string;
  role?: string;
  roles?: string[];
  departmentName?: string;
  organization?: string;
  title?: string;
  stakeholderCategory?: StakeholderCluster | string;
  permissions?: string[];
  isAdmin?: boolean;
}

export const ROLE_ARCHETYPE_LABELS: Record<RoleArchetype, string> = {
  admin: '系统管理员',
  engineering_supervisor: '医工主管/调度员',
  engineer: '维修工程师',
  clinical_nurse: '临床护士长/医护',
  clinical_director: '临床科主任',
  financial: '财务资产管理员',
  executive: '分管副院长',
  vendor: '签约服务商'
};

/**
 * 统一解析当前用户的 7+1 细分岗位原型（前后端共用唯一可信判定逻辑）
 */
export function resolveRoleArchetype(user: UserIdentityLike | null | undefined): RoleArchetype {
  if (!user) return 'clinical_nurse';

  const role = (user.role || '').trim();
  const title = (user.title || '').trim();
  const dept = (user.departmentName || '').trim();
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  const allRoles = [role, ...(Array.isArray(user.roles) ? user.roles : [])].join(' ');

  // 1. 系统管理员
  if (
    user.isAdmin ||
    user.employeeNo === 'ADMIN-001' ||
    role === '系统管理员' ||
    role === '超级管理员' ||
    perms.includes('ALL')
  ) {
    return 'admin';
  }

  // 2. 财务/资产/采购管理
  if (
    role.includes('财务') ||
    role.includes('会计') ||
    role.includes('出纳') ||
    role.includes('资产管理') ||
    role.includes('资产专员') ||
    role.includes('招标采购') ||
    dept.includes('财务科') ||
    dept.includes('财务处') ||
    dept.includes('经济管理')
  ) {
    return 'financial';
  }

  // 3. 院级领导（院长/分管副院长/总会计师/审计）
  if (
    role.includes('院长') ||
    role.includes('副院长') ||
    role.includes('总会计师') ||
    role.includes('审计') ||
    dept.includes('院长办公室') ||
    dept.includes('院领导') ||
    dept.includes('领导办公室')
  ) {
    return 'executive';
  }

  // 4. 外部签约服务商 / 驻场原厂 / 三方 / 法定计量机构
  if (
    user.stakeholderCategory === 'oem_vendor' ||
    user.stakeholderCategory === 'third_party_service' ||
    user.stakeholderCategory === 'metrology_regulatory' ||
    role.includes('原厂') ||
    role.includes('三方') ||
    role.includes('服务商') ||
    role.includes('检定专员')
  ) {
    return 'vendor';
  }

  // 5. 医工主管 / 调度员（与普通维修工程师显式拆分）
  if (
    role === '医工主管/调度员' ||
    role.includes('调度') ||
    role.includes('医工主管') ||
    role.includes('设备科长') ||
    perms.includes('派工调度') ||
    ((dept.includes('医疗设备科') || dept.includes('医学工程') || dept.includes('设备科')) &&
      (title.includes('科长') || title.includes('总监') || allRoles.includes('医工主管')))
  ) {
    return 'engineering_supervisor';
  }

  // 6. 临床科室主任
  if (
    role.includes('科室主任') ||
    role.includes('科主任') ||
    (user.stakeholderCategory === 'hospital_clinical' && role.includes('主任'))
  ) {
    return 'clinical_director';
  }

  // 7. 院内医工保障执行岗位（维修工程师 / 计量管理员 / 质控主管 / 库管员）
  if (
    user.stakeholderCategory === 'hospital_engineering' ||
    dept.includes('医疗设备科') ||
    dept.includes('医学工程') ||
    dept.includes('设备科') ||
    dept.includes('应急库') ||
    role.includes('工程师') ||
    role.includes('计量') ||
    role.includes('质控') ||
    role.includes('库管')
  ) {
    return 'engineer';
  }

  // 8. 临床护士长 / 临床医护 / 科室资产专管员（默认最小权限收敛）
  return 'clinical_nurse';
}

// ============================================================================
// 核心业务操作原子权限判定（UI 按钮隐藏 + 后端 API 拦截共同遵循）
// ============================================================================

export function canDispatchWorkOrderByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor';
}

export function canPreDispatchWorkOrderByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor';
}

export function canParticipateDispatchDiscussionByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'engineer';
}

export function canExecuteFieldRepairByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'engineer' || arch === 'vendor';
}

export function canClinicalAcceptWorkOrderByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return (
    arch === 'admin' ||
    arch === 'engineering_supervisor' ||
    arch === 'clinical_nurse' ||
    arch === 'clinical_director'
  );
}

export function canEditRegulationByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor';
}

export function canManageSystemOpsByPolicy(user: UserIdentityLike | null | undefined): boolean {
  return resolveRoleArchetype(user) === 'admin';
}

export function canViewCaoliaoLogsByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor';
}

export function canManageMasterDataByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor';
}

export function canAddEquipmentByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'financial';
}

export function canEditEquipmentByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'financial';
}

export function canDeleteOrScrapEquipmentByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor';
}

export function canChangeEquipmentStatusByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'engineer';
}

export function canManageSparePartsByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'engineer';
}

export function canApproveFinanceOrAuditByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'financial' || arch === 'executive';
}

export function canInitiateRepairByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch !== 'financial';
}

export function canBroadcastNoticeByPolicy(user: UserIdentityLike | null | undefined): boolean {
  const arch = resolveRoleArchetype(user);
  return arch === 'admin' || arch === 'engineering_supervisor' || arch === 'financial' || arch === 'executive';
}

export const PROJECT_LEDGER_PERMISSION = '项目台账管理';

/**
 * 科室/设备项目台账可见性校验：
 * 严禁临床科室（护士长、科主任、临床医护技）及非指定人员查看；
 * 仅允许系统管理员（admin）与医工主管/调度员（engineering_supervisor）查看与操作。
 */
export function canViewProjectLedgerByPolicy(user: UserIdentityLike | null | undefined): boolean {
  if (!user) return false;
  const arch = resolveRoleArchetype(user);
  if (
    arch === 'clinical_nurse' ||
    arch === 'clinical_director' ||
    arch === 'vendor' ||
    (user.stakeholderCategory === 'hospital_clinical' && !user.isAdmin)
  ) {
    return false;
  }
  return canManageMasterDataByPolicy(user);
}

/**
 * 科室/设备项目台账操作校验（下钻、预批单打印、CSV导出等）：仅限系统管理员与医工主管
 */
export function canOperateProjectLedgerByPolicy(user: UserIdentityLike | null | undefined): boolean {
  return canViewProjectLedgerByPolicy(user);
}

// ============================================================================
// Default-Deny 模块菜单访问白名单矩阵
// ============================================================================

const TAB_ALLOWLIST_BY_ROLE: Record<RoleArchetype, ActiveTab[] | 'ALL'> = {
  admin: 'ALL',

  engineering_supervisor: [
    'dashboard',
    'welcome',
    'ledger',
    'project_ledger',
    'mobile_inspection',
    'emergency_reserve',
    'digital_twin_sandbox',
    'parts_inventory',
    'scrap_workflow',
    'repairs',
    'repair_closed_loop',
    'factory_repair_workflow',
    'dispatch',
    'maintenance',
    'adverse_events',
    'approvals',
    'tracking',
    'partners',
    'vendor_collaboration',
    'mobile_collaboration',
    'analytics',
    'roi',
    'drg_cost_audit',
    'accreditation_quality',
    'smart_management',
    'user_manual',
    'regulatory_platforms',
    'regulations',
    'master_data',
    'project_concluding',
    'ai',
    'caoliao_webhook_logs'
  ],

  engineer: [
    'dashboard',
    'welcome',
    'ledger',
    'mobile_inspection',
    'emergency_reserve',
    'parts_inventory',
    'repairs',
    'repair_closed_loop',
    'factory_repair_workflow',
    'dispatch',
    'maintenance',
    'adverse_events',
    'approvals',
    'tracking',
    'mobile_collaboration',
    'user_manual',
    'regulatory_platforms',
    'regulations',
    'ai'
  ],

  clinical_nurse: [
    'dashboard',
    'welcome',
    'ledger',
    'mobile_inspection',
    'emergency_reserve',
    'repairs',
    'repair_closed_loop',
    'factory_repair_workflow',
    'maintenance',
    'adverse_events',
    'approvals',
    'tracking',
    'mobile_collaboration',
    'accreditation_quality',
    'project_concluding',
    'user_manual',
    'regulatory_platforms',
    'regulations',
    'ai'
  ],

  clinical_director: [
    'dashboard',
    'welcome',
    'ledger',
    'mobile_inspection',
    'emergency_reserve',
    'repairs',
    'repair_closed_loop',
    'factory_repair_workflow',
    'maintenance',
    'adverse_events',
    'approvals',
    'tracking',
    'mobile_collaboration',
    'analytics',
    'roi',
    'accreditation_quality',
    'project_concluding',
    'user_manual',
    'regulatory_platforms',
    'regulations',
    'ai'
  ],

  financial: [
    'dashboard',
    'welcome',
    'ledger',
    'scrap_workflow',
    'approvals',
    'partners',
    'vendor_collaboration',
    'analytics',
    'roi',
    'drg_cost_audit',
    'regulations',
    'user_manual',
    'project_concluding',
    'regulatory_platforms',
    'ai'
  ],

  executive: [
    'dashboard',
    'welcome',
    'ledger',
    'scrap_workflow',
    'repairs',
    'repair_closed_loop',
    'factory_repair_workflow',
    'adverse_events',
    'approvals',
    'tracking',
    'partners',
    'vendor_collaboration',
    'mobile_collaboration',
    'analytics',
    'roi',
    'drg_cost_audit',
    'accreditation_quality',
    'smart_management',
    'digital_twin_sandbox',
    'regulations',
    'user_manual',
    'regulatory_platforms',
    'project_concluding',
    'ai'
  ],

  vendor: [
    'dashboard',
    'welcome',
    'ledger',
    'repairs',
    'maintenance',
    'vendor_collaboration',
    'mobile_collaboration',
    'regulations',
    'user_manual',
    'ai'
  ]
};

export function canAccessTabByPolicy(user: UserIdentityLike | null | undefined, tab: ActiveTab): boolean {
  if (!user) return false;
  if (tab === 'project_ledger') {
    return canViewProjectLedgerByPolicy(user);
  }
  const arch = resolveRoleArchetype(user);
  const allowlist = TAB_ALLOWLIST_BY_ROLE[arch];
  if (allowlist === 'ALL') return true;
  return allowlist.includes(tab);
}

export interface RoleMatrixRow {
  archetype: RoleArchetype;
  roleLabel: string;
  typicalPerson: string;
  dataScope: string;
  dispatchCap: '正式派工 + 预派' | '仅讨论 + 接单修' | '仅看进度/验收' | '无';
  equipmentCap: '全院增删改查' | '仅资产建卡/改' | '仅状态变更' | '仅本科室只读';
  regulationCap: '可增删改/归档' | '只读宣贯';
  financeCap: '全权审批/核销' | '本科室ROI' | '无';
  systemCap: '全系统运维配置' | '仅看草料日志' | '完全隐藏';
  hiddenModulesSummary: string;
}

export const ROLE_PERMISSION_MATRIX: RoleMatrixRow[] = [
  {
    archetype: 'admin',
    roleLabel: '系统管理员',
    typicalPerson: '崔伟 (ADMIN-001)',
    dataScope: '全院全局',
    dispatchCap: '正式派工 + 预派',
    equipmentCap: '全院增删改查',
    regulationCap: '可增删改/归档',
    financeCap: '全权审批/核销',
    systemCap: '全系统运维配置',
    hiddenModulesSummary: '无限制 (全模块开放)'
  },
  {
    archetype: 'engineering_supervisor',
    roleLabel: '医工主管/调度员',
    typicalPerson: '张志远 (EMP-8000)',
    dataScope: '全院统筹',
    dispatchCap: '正式派工 + 预派',
    equipmentCap: '全院增删改查',
    regulationCap: '可增删改/归档',
    financeCap: '无',
    systemCap: '仅看草料日志',
    hiddenModulesSummary: '隐藏系统底层运维、AI密钥、数据库灾备、草料接口配置'
  },
  {
    archetype: 'engineer',
    roleLabel: '维修工程师',
    typicalPerson: '孙志强 (EMP-8002)',
    dataScope: '全院工单',
    dispatchCap: '仅讨论 + 接单修',
    equipmentCap: '仅状态变更',
    regulationCap: '只读宣贯',
    financeCap: '无',
    systemCap: '完全隐藏',
    hiddenModulesSummary: '隐藏设备/科室项目台账、派工调度、备件库、外协单位、主数据、DRG、数字孪生、系统运维'
  },
  {
    archetype: 'clinical_nurse',
    roleLabel: '临床护士长/医护',
    typicalPerson: '范丽华 (EMP-3042)',
    dataScope: '仅限本科室',
    dispatchCap: '仅看进度/验收',
    equipmentCap: '仅本科室只读',
    regulationCap: '只读宣贯',
    financeCap: '无',
    systemCap: '完全隐藏',
    hiddenModulesSummary: '隐藏设备/科室项目台账、派工调度、备件库、外协单位、主数据、DRG、数字孪生、系统运维'
  },
  {
    archetype: 'clinical_director',
    roleLabel: '临床科主任',
    typicalPerson: '刘振国 (EMP-3081)',
    dataScope: '仅限本科室',
    dispatchCap: '仅看进度/验收',
    equipmentCap: '仅本科室只读',
    regulationCap: '只读宣贯',
    financeCap: '本科室ROI',
    systemCap: '完全隐藏',
    hiddenModulesSummary: '隐藏设备/科室项目台账、派工调度、备件库、外协单位、主数据、DRG、数字孪生、系统运维'
  },
  {
    archetype: 'financial',
    roleLabel: '财务资产管理员',
    typicalPerson: '杨世杰 (EMP-3191)',
    dataScope: '全院财务/资产',
    dispatchCap: '无',
    equipmentCap: '仅资产建卡/改',
    regulationCap: '只读宣贯',
    financeCap: '全权审批/核销',
    systemCap: '完全隐藏',
    hiddenModulesSummary: '隐藏设备/科室项目台账、派工调度、现场抢修、备件库、巡检、主数据、系统运维'
  },
  {
    archetype: 'executive',
    roleLabel: '分管副院长',
    typicalPerson: '郑海清 (EMP-0002)',
    dataScope: '全院宏观决策',
    dispatchCap: '无',
    equipmentCap: '仅本科室只读',
    regulationCap: '只读宣贯',
    financeCap: '全权审批/核销',
    systemCap: '完全隐藏',
    hiddenModulesSummary: '隐藏设备/科室项目台账、底层派工指派、备件库、扫码巡检、主数据修改、系统运维'
  },
  {
    archetype: 'vendor',
    roleLabel: '签约服务商',
    typicalPerson: '赵建国 (OEM-SN-01)',
    dataScope: '仅承接外协工单',
    dispatchCap: '无',
    equipmentCap: '仅本科室只读',
    regulationCap: '只读宣贯',
    financeCap: '无',
    systemCap: '完全隐藏',
    hiddenModulesSummary: '隐藏设备/科室项目台账、院内派工大厅、备件库、主数据、全院财务审计、系统运维'
  }
];
