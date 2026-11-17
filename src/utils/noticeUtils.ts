import { HospitalNotice, NoticeCategory, NoticePriority } from '../types';
import { resolveRoleArchetype, UserIdentityLike, ROLE_ARCHETYPE_LABELS, RoleArchetype } from './rbacPolicy';
import { matchesDepartment } from './masterData';

export const NOTICES_LOCAL_CACHE_KEY = 'hospital_medtech_notices_cache_v1';

export const DEFAULT_SEED_NOTICES: HospitalNotice[] = [
  {
    id: 'NTC-20261113-001',
    title: '【安全警示】全院急救呼吸机与监护仪氧电池、电源模块专项排查与强检送检通知',
    content:
      '接省药监与医院质控办安全提示：请各临床使用科室重点核查在用有创/无创呼吸机、多参数监护仪备用电池蓄电时长及氧传感器失效告警情况；临近强检有效期设备请于本周五前配合计量组完成上门定标。发现异常请立即登记故障并借用应急库备用机。',
    category: '安全警示',
    priority: 'urgent',
    senderName: '张志远',
    senderRole: '医工主管/调度员',
    senderDepartment: '医疗设备科',
    senderArchetype: 'engineering_supervisor',
    targetScope: 'clinical_all',
    requireAck: true,
    targetTab: 'maintenance',
    createdAt: '2026-11-13 08:30',
    readReceipts: [
      {
        userId: 'STAFF-3011',
        userName: '陈晓梅',
        userRole: '护士长',
        department: '麻醉手术科',
        readAt: '2026-11-13 08:45',
        acknowledged: true
      }
    ]
  },
  {
    id: 'NTC-20261113-002',
    title: '2026年11月省计量院联合上门法定强检检定时间排期表（重症/影像/功能检查科）',
    content:
      '省计量科学研究院工程师定于 11月15日（周六）08:30-17:00 进驻医院开展 B 类与生命支持类医疗器具法定强检。请重症医学科(ICU)、医学影像科、功能检查科提前预留诊疗窗口期，确保监护仪、除颤仪、肌电图及射线辐射剂量仪处于可检定状态。',
    category: '强检召回',
    priority: 'important',
    senderName: '张志远',
    senderRole: '医工主管/调度员',
    senderDepartment: '医疗设备科',
    senderArchetype: 'engineering_supervisor',
    targetScope: 'department',
    targetDepartments: ['重症医学科(ICU)', '医学影像科', '功能检查科', '急诊科'],
    requireAck: true,
    targetTab: 'maintenance',
    createdAt: '2026-11-12 16:20',
    readReceipts: []
  },
  {
    id: 'NTC-20261113-003',
    title: '【工程技术交底】草料扫码报修工单 L12238 同类线束故障排查与备件领用规范',
    content:
      '近期临床频发音频耳机及传感器接口接触不良（如功能检查科肌电图诱发电位仪 L12238 工单）。请维修工程师在预派工内部讨论中确认携带万用表及替换导联线束出诊，修复后务必回填故障代码并通知临床护士长验收。',
    category: '工作协同',
    priority: 'important',
    senderName: '张志远',
    senderRole: '医工主管/调度员',
    senderDepartment: '医疗设备科',
    senderArchetype: 'engineering_supervisor',
    targetScope: 'role_archetype',
    targetRoles: ['engineer', 'engineering_supervisor'],
    requireAck: true,
    targetTab: 'dispatch',
    createdAt: '2026-11-12 15:10',
    readReceipts: []
  },
  {
    id: 'NTC-20261113-004',
    title: '关于 2026 年 Q4 大型设备单机 ROI 核算与零星外协维保月度对账截止通知',
    content:
      '本月外协零修框架批次核减差额及未开票明细已同步至财务对账驾驶舱。请相关临床科主任核对本科室大型设备收入产出与单机成本，请财务及医工审核人员于本月 25 日前完成三单匹配核销。',
    category: '财务结算',
    priority: 'normal',
    senderName: '杨世杰',
    senderRole: '财务资产管理员',
    senderDepartment: '财务科',
    senderArchetype: 'financial',
    targetScope: 'role_archetype',
    targetRoles: ['clinical_director', 'financial', 'executive', 'engineering_supervisor'],
    requireAck: false,
    targetTab: 'roi',
    createdAt: '2026-11-12 11:00',
    readReceipts: []
  },
  {
    id: 'NTC-20261113-005',
    title: '【院级通告】迎接三甲复审医疗器械临床使用安全管理专项督查工作部署',
    content:
      '下周将开展全院医疗器械闭环管理迎检督查，重点查验：1）急救生命支持设备晨间交接点检记录；2）应急借用超期归还管理；3）强检计量标识张贴与制度合规归档。请全院各科室对照整改落实。',
    category: '院级通告',
    priority: 'important',
    senderName: '郑海清',
    senderRole: '分管副院长',
    senderDepartment: '院长办公室',
    senderArchetype: 'executive',
    targetScope: 'all',
    requireAck: true,
    targetTab: 'accreditation_quality',
    createdAt: '2026-11-11 09:15',
    readReceipts: [
      {
        userId: 'STAFF-ADMIN',
        userName: '崔伟 (管理员)',
        userRole: '系统管理员',
        department: '医疗设备科',
        readAt: '2026-11-11 09:30',
        acknowledged: true
      }
    ]
  }
];

export interface NoticeBroadcastTemplate {
  id: string;
  label: string;
  category: NoticeCategory;
  priority: NoticePriority;
  targetScope: HospitalNotice['targetScope'];
  requireAck: boolean;
  title: string;
  content: string;
}

export const NOTICE_BROADCAST_TEMPLATES: NoticeBroadcastTemplate[] = [
  {
    id: 'tpl-safety',
    label: '急救设备安全排查',
    category: '安全警示',
    priority: 'urgent',
    targetScope: 'clinical_all',
    requireAck: true,
    title: '【安全警示】急救生命支持设备蓄电池与告警功能自检通知',
    content: '请各临床病区护士长组织当班人员立即核查本科室除颤仪、呼吸机及监护仪供电电池与报警阈值，确保处于战备完好状态；如有异常请即刻通过系统“紧急报修”上报并申领应急备机。'
  },
  {
    id: 'tpl-calibration',
    label: '强检上门检定通知',
    category: '强检召回',
    priority: 'important',
    targetScope: 'department',
    requireAck: true,
    title: '法定强检医疗计量器具集中上门检定通知',
    content: '计量检定人员将于近期下沉相关临床科室开展强检设备检定，请科室提前安排好设备轮替时段，备齐设备清单与上期检定证书。'
  },
  {
    id: 'tpl-maintenance',
    label: '停机预防性维护告知',
    category: '维保排期',
    priority: 'important',
    targetScope: 'department',
    requireAck: true,
    title: '大型医用设备计划性预防维护 (PM) 停机窗口期告知',
    content: '为保障大型影像/生命支持设备核心部件寿命，医学工程科拟联合原厂工程师开展计划性PM保养，请使用科室提前协调患者检查预约窗口。'
  },
  {
    id: 'tpl-finance',
    label: '财务结算/资产盘点',
    category: '财务结算',
    priority: 'normal',
    targetScope: 'all',
    requireAck: false,
    title: '固定资产年度盘点与月度外协维保对账截止提示',
    content: '请各科室资产专管员核对本科室在位设备账实一致情况，并在规定时限前完成待签收外协工单的电子确认，以便财务科办理统一核销结算。'
  }
];

/**
 * 判断一条通知是否面向当前登录用户（临床按科室与范围精准投递）
 */
export function doesNoticeMatchUser(
  notice: HospitalNotice,
  user: UserIdentityLike | null | undefined
): boolean {
  if (!user) return false;
  const arch = resolveRoleArchetype(user);

  // 系统管理员与院领导可统览全局通知
  if (arch === 'admin') return true;

  if (notice.targetScope === 'all') {
    return true;
  }

  if (notice.targetScope === 'clinical_all') {
    return arch === 'clinical_nurse' || arch === 'clinical_director';
  }

  if (notice.targetScope === 'department') {
    const userDept = (user.departmentName || '').trim();
    if (!userDept || !notice.targetDepartments || notice.targetDepartments.length === 0) {
      return false;
    }
    return notice.targetDepartments.some(
      td => td === userDept || matchesDepartment(td, userDept) || matchesDepartment(userDept, td)
    );
  }

  if (notice.targetScope === 'role_archetype') {
    if (!notice.targetRoles || notice.targetRoles.length === 0) return false;
    return notice.targetRoles.includes(arch);
  }

  return false;
}

export function getUserReceiptForNotice(
  notice: HospitalNotice,
  user: UserIdentityLike | null | undefined
) {
  if (!user) return undefined;
  return (notice.readReceipts || []).find(
    r =>
      (user.id && r.userId === user.id) ||
      (r.userName === user.name && r.department === (user.departmentName || ''))
  );
}

export function hasUserReadNotice(
  notice: HospitalNotice,
  user: UserIdentityLike | null | undefined
): boolean {
  return Boolean(getUserReceiptForNotice(notice, user));
}

export function hasUserAckNotice(
  notice: HospitalNotice,
  user: UserIdentityLike | null | undefined
): boolean {
  const receipt = getUserReceiptForNotice(notice, user);
  return Boolean(receipt?.acknowledged);
}

export function formatNoticeScopeLabel(notice: HospitalNotice): string {
  switch (notice.targetScope) {
    case 'all':
      return '全院全员';
    case 'clinical_all':
      return '全体临床科室';
    case 'department':
      return notice.targetDepartments && notice.targetDepartments.length > 0
        ? notice.targetDepartments.join('、')
        : '指定科室';
    case 'role_archetype':
      return notice.targetRoles && notice.targetRoles.length > 0
        ? notice.targetRoles.map(r => ROLE_ARCHETYPE_LABELS[r as RoleArchetype] || r).join('、')
        : '指定岗位';
    default:
      return '全院';
  }
}
