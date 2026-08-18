import { StaffPersonMaster, DepartmentMaster, StakeholderCluster } from '../types';
import { inferStakeholderCluster } from './staffRolesData';

export interface StaffImportRowParsed {
  raw: Record<string, string>;
  rowNumber: number;
  item: StaffPersonMaster;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  isDuplicateInInput: boolean;
  isExistingInDatabase: boolean;
}

export interface StaffImportValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newCount: number;
  updateCount: number;
  rows: StaffImportRowParsed[];
}

/**
 * 智能解析全域干系人与工程师 TSV / CSV 文本
 */
export function parseStaffImportText(
  rawText: string,
  departments: DepartmentMaster[],
  existingStaff: StaffPersonMaster[]
): StaffImportValidationResult {
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!cleanText) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      newCount: 0,
      updateCount: 0,
      rows: []
    };
  }

  const lines = cleanText.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      newCount: 0,
      updateCount: 0,
      rows: []
    };
  }

  // Detect delimiter (Tab or Comma or Semicolon)
  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(',')) {
    delimiter = ',';
  } else if (firstLine.includes(';')) {
    delimiter = ';';
  }

  const splitLine = (line: string): string[] => {
    if (delimiter === '\t') {
      return line.split('\t').map(s => s.trim().replace(/^["']|["']$/g, ''));
    }
    // Simple CSV parser for quoted strings
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const rawHeader = splitLine(lines[0]);
  const isHeaderRow = rawHeader.some(h => 
    /工号|姓名|人员|单位|机构|厂商|厂家|科室|部门|角色|职务|电话|手机|职称|邮箱|专长|产品线|品牌|梯队|合同|状态/i.test(h)
  );

  const headerIndices: Record<string, number> = {};
  let startIndex = 0;

  if (isHeaderRow) {
    startIndex = 1;
    rawHeader.forEach((h, idx) => {
      const norm = h.trim().toLowerCase();
      if (/工号|员工号|employee|id|编号|专家号/i.test(norm) && !headerIndices.employeeNo) headerIndices.employeeNo = idx;
      else if (/姓名|人员|工程师|专家|名字|name/i.test(norm) && !headerIndices.name) headerIndices.name = idx;
      else if (/单位|机构|企业|公司|组织|organization|company/i.test(norm) && !headerIndices.organization) headerIndices.organization = idx;
      else if (/干系人类型|群体|集群|cluster|category/i.test(norm) && !headerIndices.stakeholderCategory) headerIndices.stakeholderCategory = idx;
      else if (/科室|部门|department|所属/i.test(norm) && !headerIndices.department) headerIndices.department = idx;
      else if (/角色|岗位|职责|职务|role/i.test(norm) && !headerIndices.role) headerIndices.role = idx;
      else if (/电话|手机|分机|短号|热线|phone|mobile|tel/i.test(norm) && !headerIndices.phone) headerIndices.phone = idx;
      else if (/职称|业务头衔|title/i.test(norm) && !headerIndices.title) headerIndices.title = idx;
      else if (/邮箱|email|mail/i.test(norm) && !headerIndices.email) headerIndices.email = idx;
      else if (/首选|首要|默认|主要责任人|primary/i.test(norm) && !headerIndices.isPrimary) headerIndices.isPrimary = idx;
      else if (/产品线|服务范围|服务品牌|专长|分管|领域|方向|技能|scope|special/i.test(norm) && !headerIndices.specialties) headerIndices.specialties = idx;
      else if (/应急|梯队|响应级别|tier|level/i.test(norm) && !headerIndices.emergencyTier) headerIndices.emergencyTier = idx;
      else if (/合同|协议|维保号|contract/i.test(norm) && !headerIndices.serviceContractNo) headerIndices.serviceContractNo = idx;
      else if (/证书|资质|cert/i.test(norm) && !headerIndices.certifications) headerIndices.certifications = idx;
      else if (/状态|在职|status/i.test(norm) && !headerIndices.status) headerIndices.status = idx;
      else if (/备注|说明|notes/i.test(norm) && !headerIndices.notes) headerIndices.notes = idx;
    });
  } else {
    // Default column order fallback
    headerIndices.employeeNo = 0;
    headerIndices.name = 1;
    headerIndices.department = 2;
    headerIndices.role = 3;
    headerIndices.phone = 4;
    headerIndices.title = 5;
    headerIndices.organization = 6;
  }

  // Pre-build department lookup map
  const deptMap = new Map<string, DepartmentMaster>();
  departments.forEach(d => {
    deptMap.set(d.name.trim().toLowerCase(), d);
    deptMap.set(d.id.trim().toLowerCase(), d);
    if (d.code) deptMap.set(d.code.trim().toLowerCase(), d);
  });

  // Existing staff lookup map (by employeeNo and name)
  const existingMap = new Map<string, StaffPersonMaster>();
  existingStaff.forEach(s => {
    if (s.employeeNo) existingMap.set(s.employeeNo.trim().toUpperCase(), s);
    if (s.name) existingMap.set(s.name.trim().toLowerCase(), s);
  });

  const parsedRows: StaffImportRowParsed[] = [];
  const seenEmpNos = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length === 0 || cols.every(c => !c)) continue;

    const rowNum = i + 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    const getCol = (key: string): string => {
      const idx = headerIndices[key];
      return idx !== undefined && cols[idx] !== undefined ? cols[idx].trim() : '';
    };

    let employeeNo = getCol('employeeNo');
    const name = getCol('name');
    const orgInput = getCol('organization');
    const categoryInput = getCol('stakeholderCategory');
    const deptNameInput = getCol('department') || '医疗设备科';
    const roleInput = getCol('role') || '设备管理员';
    const phoneInput = getCol('phone') || '';
    const titleInput = getCol('title') || '';
    const emailInput = getCol('email') || '';
    const isPrimaryInput = getCol('isPrimary');
    const specialtiesInput = getCol('specialties');
    const emergencyTierInput = getCol('emergencyTier');
    const contractNoInput = getCol('serviceContractNo');
    const certificationsInput = getCol('certifications');
    const statusInput = getCol('status');
    const notesInput = getCol('notes');

    if (!name) {
      errors.push('干系人姓名不能为空');
    }

    if (!employeeNo) {
      employeeNo = `EMP-${7000 + existingStaff.length + parsedRows.length + 1}`;
      warnings.push(`未提供工号/编号，已自动生成: ${employeeNo}`);
    }

    const empUpper = employeeNo.toUpperCase();
    let isDuplicateInInput = false;
    if (seenEmpNos.has(empUpper)) {
      isDuplicateInInput = true;
      warnings.push(`编号 ${employeeNo} 在本次导入表格中出现多次`);
    } else {
      seenEmpNos.add(empUpper);
    }

    // Match department
    let matchedDept: DepartmentMaster | undefined = deptMap.get(deptNameInput.toLowerCase());
    if (!matchedDept) {
      // Fuzzy substring matching
      matchedDept = departments.find(d => 
        d.name.includes(deptNameInput) || deptNameInput.includes(d.name)
      );
    }
    const finalDeptId = matchedDept ? matchedDept.id : (departments[0]?.id || '303');
    const finalDeptName = matchedDept ? matchedDept.name : deptNameInput;
    if (!matchedDept && deptNameInput) {
      warnings.push(`科室 "${deptNameInput}" 未完全匹配标准科室字典，将保留原名`);
    }

    // Match role
    let role = roleInput;
    if (!role) {
      role = '设备管理员';
    }

    // Determine Stakeholder Cluster
    let stakeholderCategory: string = 'hospital_engineering';
    if (categoryInput) {
      if (/医工|保障|工程/i.test(categoryInput)) stakeholderCategory = 'hospital_engineering';
      else if (/临床|医护|护士|病区|门诊/i.test(categoryInput)) stakeholderCategory = 'hospital_clinical';
      else if (/行政|职能|医务|院感|财务|资产|采购|招标|保卫|消防|信息|医保|审计|院办/i.test(categoryInput)) stakeholderCategory = 'hospital_administration';
      else if (/原厂|厂商|厂家|销售|fas/i.test(categoryInput)) stakeholderCategory = 'oem_vendor';
      else if (/三方|第三方|托管|服务商/i.test(categoryInput)) stakeholderCategory = 'third_party_service';
      else if (/计量|特检|质检|特种/i.test(categoryInput)) stakeholderCategory = 'metrology_regulatory';
      else stakeholderCategory = categoryInput;
    } else {
      stakeholderCategory = inferStakeholderCluster(role, finalDeptName, orgInput);
    }

    // Determine Organization
    let organization = orgInput;
    if (!organization) {
      if (stakeholderCategory === 'hospital_engineering' || stakeholderCategory === 'hospital_clinical' || stakeholderCategory === 'hospital_administration') {
        organization = '五莲县人民医院';
      } else if (stakeholderCategory === 'oem_vendor') {
        organization = '医疗设备原厂制造企业';
      } else if (stakeholderCategory === 'third_party_service') {
        organization = '第三方维保托管服务商';
      } else if (stakeholderCategory === 'metrology_regulatory') {
        organization = '市级法定计量测试所 / 特检院';
      }
    }

    // Emergency Tier
    let emergencyTier: 'L1' | 'L2' | 'L3' | 'none' = 'none';
    if (emergencyTierInput) {
      if (/L1|一级|抢修|一线/i.test(emergencyTierInput)) emergencyTier = 'L1';
      else if (/L2|二级|医工/i.test(emergencyTierInput)) emergencyTier = 'L2';
      else if (/L3|三级|原厂|专家/i.test(emergencyTierInput)) emergencyTier = 'L3';
    } else if (role.includes('抢修') || role.includes('护士长')) {
      emergencyTier = 'L1';
    } else if (role.includes('维修工程师') || role.includes('主管工程师')) {
      emergencyTier = 'L2';
    } else if (role.includes('原厂工程师')) {
      emergencyTier = 'L3';
    }

    // Primary contact boolean
    let isPrimaryContact = false;
    if (isPrimaryInput) {
      isPrimaryContact = /是|yes|true|1|首选|主要/i.test(isPrimaryInput);
    }

    // Specialties array
    let specialties: string[] | undefined = undefined;
    if (specialtiesInput) {
      specialties = specialtiesInput.split(/[,;，；|]/).map(s => s.trim()).filter(Boolean);
    }

    // Certifications array
    let certifications: string[] | undefined = undefined;
    if (certificationsInput) {
      certifications = certificationsInput.split(/[,;，；|]/).map(s => s.trim()).filter(Boolean);
    }

    // Status
    let status: 'active' | 'inactive' | 'on_leave' = 'active';
    if (statusInput) {
      if (/离职|停用|inactive|false|0/i.test(statusInput)) {
        status = 'inactive';
      } else if (/休假|请假|leave/i.test(statusInput)) {
        status = 'on_leave';
      }
    }

    if (!phoneInput) {
      warnings.push('未提供联系电话或24H热线');
    }

    const isExisting = existingMap.has(empUpper) || (name ? existingMap.has(name.toLowerCase()) : false);

    const item: StaffPersonMaster = {
      id: existingMap.get(empUpper)?.id || `STAFF-${Date.now().toString().slice(-4)}-${parsedRows.length + 1}`,
      employeeNo,
      name,
      stakeholderCategory,
      organization,
      departmentId: finalDeptId,
      departmentName: finalDeptName,
      role,
      phone: phoneInput || '7991237',
      email: emailInput || undefined,
      title: titleInput || undefined,
      isPrimaryContact,
      specialties,
      serviceScope: specialtiesInput || undefined,
      emergencyTier,
      serviceContractNo: contractNoInput || undefined,
      certifications,
      status,
      notes: notesInput || undefined
    };

    const rawObj: Record<string, string> = {
      employeeNo,
      name,
      organization: organization || '',
      category: stakeholderCategory,
      department: finalDeptName,
      role,
      phone: phoneInput,
      title: titleInput,
      email: emailInput,
      isPrimary: isPrimaryContact ? '是' : '否',
      specialties: specialties ? specialties.join(', ') : '',
      emergencyTier,
      contractNo: contractNoInput || '',
      status: status === 'active' ? '在职' : status === 'on_leave' ? '休假' : '离职/停用'
    };

    parsedRows.push({
      raw: rawObj,
      rowNumber: rowNum,
      item,
      isValid: errors.length === 0,
      errors,
      warnings,
      isDuplicateInInput,
      isExistingInDatabase: isExisting
    });
  }

  const validRows = parsedRows.filter(r => r.isValid).length;
  const invalidRows = parsedRows.filter(r => !r.isValid).length;
  const newCount = parsedRows.filter(r => r.isValid && !r.isExistingInDatabase).length;
  const updateCount = parsedRows.filter(r => r.isValid && r.isExistingInDatabase).length;

  return {
    totalRows: parsedRows.length,
    validRows,
    invalidRows,
    newCount,
    updateCount,
    rows: parsedRows
  };
}

/**
 * 生成全域干系人导入标准 TSV 模板 (涵盖5大集群典型范例)
 */
export function generateStaffTemplateTsv(): string {
  return [
    ['编号/工号', '姓名', '所属单位/机构', '干系人类型', '所属科室', '角色岗位', '联系电话/热线', '业务职称/头衔', '电子邮箱', '应急响应梯队', '负责服务产品线/专长', '维保合同/协议号', '是否首选责任人', '在职状态'].join('\t'),
    ['EMP-7001', '崔伟', '五莲县人民医院', '院内医工', '医疗设备科', '维修工程师', '7991237', '主管工程师', 'cuiwei@hospital.wl.cn', 'L2', '放射影像 (CT/MRI/DR/DSA)', '', '是', '在职'].join('\t'),
    ['EMP-7002', '孙志强', '五莲县人民医院', '院内医工', '医疗设备科', '维修工程师', '7991237', '抢修响应工程师', 'sunzhiqiang@hospital.wl.cn', 'L1', '急救生命支持, 手术麻醉, 血液净化', '', '是', '在职'].join('\t'),
    ['EMP-7003', '赵敏', '五莲县人民医院', '院内医工', '医疗设备科', '计量管理员', '7991237', '法定计量专员', 'zhaomin@hospital.wl.cn', 'L2', '强检计量申报, 定级复核', '', '是', '在职'].join('\t'),
    ['EMP-8001', '王建国', '五莲县人民医院', '临床医护', '重症医学科', '科室主任', '7991278', '主任医师 / 科主任', 'wangjianguo@hospital.wl.cn', 'L1', 'ICU急救重症监护设备管理', '', '是', '在职'].join('\t'),
    ['EMP-8002', '张敏敏', '五莲县人民医院', '临床医护', '重症医学科', '护士长', '7991278', '副主任护师 / 护士长', '', 'L1', '急救设备保管与交接班', '', '是', '在职'].join('\t'),
    // 院内行政职能部门范例
    ['EMP-ADM-01', '李科长', '五莲县人民医院', '行政职能', '医务科', '医务质控专员', '7991112', '医务科科长', 'ywk@hospital.wl.cn', 'L1', '医务质控与临床新技术准入', '', '是', '在职'].join('\t'),
    ['EMP-ADM-02', '高主任', '五莲县人民医院', '行政职能', '感染管理科', '院感监测专员', '7991215', '院感科主任', 'ygk@hospital.wl.cn', 'L2', '院感洗消与灭菌过程监测', '', '是', '在职'].join('\t'),
    ['EMP-ADM-03', '周会计', '五莲县人民医院', '行政职能', '财务科', '财务资产管理员', '7991025', '固定资产主管会计', 'cwk@hospital.wl.cn', 'none', '固定资产账务、折旧与清查', '', '是', '在职'].join('\t'),
    ['EMP-ADM-04', '吴主管', '五莲县人民医院', '行政职能', '招标采购科', '招标采购主管', '7991396', '采购办主管', 'cgb@hospital.wl.cn', 'none', '医疗设备招投标与采购商务', '', '是', '在职'].join('\t'),
    ['EMP-ADM-05', '刘工', '五莲县人民医院', '行政职能', '信息科', '信息网络安全员', '7991230', '高级网络安全工程师', 'xxk@hospital.wl.cn', 'L2', '医疗物联网安全与PACS/DICOM接口', '', '是', '在职'].join('\t'),
    ['EMP-ADM-06', '孙队长', '五莲县人民医院', '行政职能', '保卫科', '消防安保负责人', '7991110', '保卫科消防队长', 'bwk@hospital.wl.cn', 'L1', '消防安保与放射源安全管理', '', '是', '在职'].join('\t'),
    // 外部原厂与维保机构
    ['OEM-GE-01', '杜工', '通用电气医疗系统 (GE)', '原厂售后/销售', '医疗设备科', '驻场原厂工程师', '13853218899', '高级现场工程师 (FSE-L4)', 'du@ge.com', 'L3', 'GE CT/MRI 全线保修与深度大修', 'HT-2025-GE-001', '是', '在职'].join('\t'),
    ['OEM-GE-02', '陈经理', '通用电气医疗系统 (GE)', '原厂售后/销售', '医疗设备科', '原厂售后/销售专员', '13964205566', '大区售后服务经理 (CSM)', 'chen@ge.com', 'none', '维保合同续约、原厂备件采购', 'HT-2025-GE-001', '否', '在职'].join('\t'),
    ['OEM-MR-01', '郑工', '深圳迈瑞生物医疗', '原厂售后/销售', '医疗设备科', '驻场原厂工程师', '18669881234', '驻点技术工程师 (FSE)', 'zheng@mindray.com', 'L3', '全院迈瑞监护仪、呼吸机、除颤仪', 'HT-2025-MR-002', '是', '在职'].join('\t'),
    ['EXT-GY-01', '钱经理', '国药器械托管服务部', '三方维保托管', '医疗设备科', '三方维保工程师', '13705326688', '驻场项目经理', 'qian@sinopharm.com', 'L2', '全院常规类设备PM保养与备用机调度', 'HT-2025-SINO', '是', '在职'].join('\t'),
    ['REG-JL-01', '严工', '日照市质量技术监督评价所', '计量与特检机构', '医疗设备科', '法定计量检定专员', '0633-8772155', '医疗强检主任检定员', 'yan@quality.gov.cn', 'none', '心电图机、监护仪、除颤仪法定强检', '', '是', '在职'].join('\t')
  ].join('\n');
}
