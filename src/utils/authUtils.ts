import { AuthUser, StaffPersonMaster, ActiveTab, StaffRole, StakeholderCluster } from '../types';
import { DEFAULT_STAFF_ROLES, STAKEHOLDER_CLUSTERS, inferStakeholderCluster } from './staffRolesData';
import { matchesDepartment } from './masterData';

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

  // 护士长角色专属菜单：包含工作台概览、科室设备台账、移动扫码巡检盘点、医疗设备应急库(全院共享)、维保与强检、维修记录(科室报修跟踪及外协零修验收签单)、不良事件直报、业务审批、AI智能专家
  // 临床科室不需要看到科室常用备件耗材、不需要看到医工调度中心、不要有独立的外协维修协同菜单（外协零修进度及复核验收签字在科室报修跟踪中呈现）
  if (isHeadNurse(user)) {
    const nurseAllowedTabs: ActiveTab[] = ['dashboard', 'ledger', 'mobile_inspection', 'emergency_reserve', 'maintenance', 'repairs', 'adverse_events', 'approvals', 'ai', 'regulations', 'project_concluding'];
    return nurseAllowedTabs.includes(tab);
  }

  switch (tab) {
    case 'project_concluding':
      // 日照市2026年度社会科学专项课题结项专区：全院职工、管理层、专家及评审人员均可查阅
      return true;

    case 'regulations':
      // 医学装备管理规章制度库：全院所有岗位均可查阅检索、学习宣贯
      return true;

    case 'dashboard':
      // 工作台概览：全员可用
      return true;

    case 'adverse_events':
      // 医疗器械不良事件（MDR）监测与警戒直报：全院临床医护初报、医工技术调查、质量管理部门与不良事件监测员直报
      return true;

    case 'parts_inventory':
      // 维修备品配件耗材库：仅医学工程、设备科、工程维修人员、库管及第三方服务商可用；临床科室不需要看到科室常用备件耗材
      if (isHeadNurse(user) || isClinicalStaff(user) || isDepartmentRestricted(user)) {
        return false;
      }
      return true;

    case 'dispatch':
      // 智能派工调度 / 医工调度中心：仅医学工程、设备科、调度员、工程师与外部服务商可用；临床科室不需要看到医工调度中心
      if (isHeadNurse(user) || isClinicalStaff(user) || isDepartmentRestricted(user)) {
        return false;
      }
      return true;

    case 'mobile_inspection':
      // 移动端扫码巡检与快速盘点：全员可用（临床科室日常盘点、工程师现场巡检、质控核验）
      return true;

    case 'approvals':
      // 业务审批与单据中心：全院临床申报、工程师技术鉴定、管理层审批
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
      // 临床科室不应该看到往来合作单位（原厂供应商、第三方维保与检测机构档案）
      if (
        isHeadNurse(user) ||
        isClinicalStaff(user) ||
        isDepartmentRestricted(user) ||
        isClinicalDepartmentUser(user) ||
        isClinicalDepartment(user?.departmentName)
      ) {
        return false;
      }
      // 往来单位与服务商协同：仅限院级医工保障、采购招标、财务资产、院领导或系统管理
      return hasAnyPermission(user, ['往来单位管理', '服务商协同', '商务合同', '招投标管理']);

    case 'vendor_collaboration':
      // 临床科室视角中不要有外协协同菜单：外协零修内容在科室报修跟踪中呈现进度与复核验收签字
      if (
        isHeadNurse(user) ||
        isClinicalStaff(user) ||
        isDepartmentRestricted(user) ||
        isClinicalDepartmentUser(user) ||
        isClinicalDepartment(user?.departmentName)
      ) {
        return false;
      }
      // 外协维修协同（报价议价、维保协同、发票审计）：仅限医工、采购、财务、审计等职能管理角色
      return hasAnyPermission(user, ['往来单位管理', '服务商协同', '商务合同', '招投标管理', '台账管理', '工单维修', '预算审批', '采购审计', '报修协同']);

    case 'factory_repair_workflow':
    case 'repair_closed_loop':
      // 维修闭环管理视图：麻醉手术科（临床使用科室）、医疗设备科（技术勘查）、院领导（分管院长/主管终审）均可访问协同
      return true;

    case 'master_data':
      // 组织与空间主数据、强检目录、分类目录、人员角色：需要医工管理、计量或系统管理权限
      return hasAnyPermission(user, ['组织主数据', '强检目录维护', '分类目录维护', '人员角色配置', '台账管理', '质控抽检']);

    case 'analytics':
    case 'roi':
      // 效能、单机成本效益与ROI决策分析：医工主管、科主任、财务、医务、审计、采购等
      return hasAnyPermission(user, ['效能分析', '财务折旧', '成本效益', '质量月报', '预算审批', '绩效考核', '采购审计', '台账管理', '工单维修']);

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

/**
 * 检查规章制度归档与上传权限 (仅管理员或具备全权/制度维护权限的医工主管)
 */
export function canUploadRegulationPdf(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return Boolean(
    user.isAdmin || 
    user.employeeNo === 'ADMIN-001' || 
    user.role === '系统管理员' || 
    user.permissions.includes('ALL') ||
    user.permissions.includes('制度管理') ||
    user.permissions.includes('组织主数据')
  );
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

export type RoleArchetype = 'admin' | 'financial' | 'clinical' | 'engineering' | 'executive' | 'vendor';

/**
 * 智能判定当前用户的核心角色原型，用于驱动差异化工作台首屏与业务功能呈现
 */
export function getUserRoleArchetype(user: AuthUser | null | undefined): RoleArchetype {
  if (!user || user.isAdmin || user.employeeNo === 'ADMIN-001') {
    return 'admin';
  }
  if (isFinancialStaff(user)) {
    return 'financial';
  }
  if (isExecutiveLeader(user)) {
    return 'executive';
  }
  if (isVendorStaff(user)) {
    return 'vendor';
  }
  if (isClinicalDepartmentUser(user)) {
    return 'clinical';
  }
  if (isMedicalEngineeringStaff(user)) {
    return 'engineering';
  }
  return 'admin';
}

/**
 * 预设快速切换的 7 类典型医院干系人角色模型
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
    description: '全院设备主数据与调配总管 · 全功能控制权限',
    badge: '系统总管',
    badgeColor: 'purple',
    archetype: 'admin'
  },
  {
    id: 'ROLE_PERSONA_FINANCE',
    name: '杨世杰',
    employeeNo: 'EMP-3191',
    role: '财务资产管理员',
    departmentName: '财务科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_administration',
    description: '资金付款请款审核 · 服务商电汇结算 · 全成本分摊',
    badge: '财务资产',
    badgeColor: 'amber',
    archetype: 'financial'
  },
  {
    id: 'ROLE_PERSONA_NURSE',
    name: '范丽华',
    employeeNo: 'EMP-3042',
    role: '护士长',
    departmentName: '重症医学科(ICU)',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_clinical',
    description: '病区急救设备晨间交接盘点 · 故障急速报修跟踪',
    badge: '临床护士长',
    badgeColor: 'rose',
    archetype: 'clinical'
  },
  {
    id: 'ROLE_PERSONA_DIRECTOR',
    name: '刘振国',
    employeeNo: 'EMP-3081',
    role: '科室主任',
    departmentName: '医学影像科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_clinical',
    description: '大型放疗影像设备立项论证 · 单机保本点效益评估',
    badge: '临床科主任',
    badgeColor: 'emerald',
    archetype: 'clinical'
  },
  {
    id: 'ROLE_PERSONA_ENGINEER',
    name: '孙志强',
    employeeNo: 'EMP-8002',
    role: '维修工程师',
    departmentName: '医疗设备科',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_engineering',
    description: '派工抢修现场处置 · 备件申领 · 强检法定计量保障',
    badge: '医工工程师',
    badgeColor: 'sky',
    archetype: 'engineering'
  },
  {
    id: 'ROLE_PERSONA_EXECUTIVE',
    name: '郑海清',
    employeeNo: 'EMP-0002',
    role: '分管副院长',
    departmentName: '院长办公室',
    organization: '五莲县人民医院',
    stakeholderCategory: 'hospital_administration',
    description: '全院宏观设备运行与投资回报 · 单笔≥5千大额签批',
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
