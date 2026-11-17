export interface RegulatoryPlatform {
  id: number;
  superiorMinistry: string; // 隶属机关 (e.g. 中华人民共和国生态环境部, 国家市场监督管理总局)
  affiliationRelation: string; // 隶属关系 (同一部门, 直属, 隶属, 业务指导等)
  managingAuthority: string; // 管理机关 (e.g. 中华人民共和国生态环境部, 山东省市场监督管理局, 日照市市场监督管理局)
  platformName: string; // 平台名称
  username: string; // 用户名 / 统一社会信用代码 / 手机号
  password: string; // 密码
  url: string; // 链接
  remarks: string; // 备注 (e.g. 放射源转移纸质材料邮寄地址、联系方式、环评验收用途等)
  category: 'radiation' | 'special_equipment' | 'medical_device' | 'metrology' | 'occupational_health' | 'environmental' | 'other';
  systemLevel: '国家级' | '省级' | '市级';
  lastLoginDate?: string;
  totalLogins?: number;
  docCount?: number;
}

export interface RegulatoryDocument {
  id: string;
  platformId: number;
  platformName: string;
  managingAuthority: string;
  docTitle: string;
  docNumber: string; // 官方文号 / 备案号 / 许可证编号 (如 鲁环审[2024]xx号, 鲁特登xx, 鲁食药监械xx)
  docCategory: '许可证照' | '批复批文' | '备案凭证' | '检验报告' | '政策法规' | '整改通报' | '其他文件';
  issueDate: string;
  expiryDate?: string; // 有效截止日期（如有）
  fileType: 'pdf' | 'doc' | 'image' | 'zip';
  fileSize: string;
  uploader: string;
  uploadDate: string;
  summary: string;
  tags: string[];
}

export interface PlatformAccessLog {
  id: string;
  platformId: number;
  platformName: string;
  accessTime: string; // YYYY-MM-DD HH:mm
  operator: string; // 经办人
  department: string; // 经办科室 (医学工程科 / 放射科 / 环评安全办等)
  actionType: '例行申报' | '定期自查' | '年度校验' | '许可延续' | '不良事件上报' | '报检预约' | '账号密码更新' | '其他经办';
  businessSummary: string; // 本次登录处理的具体业务事项
  resultReceiptNo?: string; // 申报成功凭证号 / 受理号 / 回执流水号
  status: '办理完成' | '审核中' | '需补充纸质材料' | '待进一步处理';
  nextFollowUpDate?: string; // 下次需登录或随访时间
  remarks?: string;
}
