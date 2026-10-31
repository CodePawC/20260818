// 医疗设备报废技术鉴定与处置全生命周期闭环类型定义

export type ScrapReasonType = 
  | 'exceeded_lifespan' // 达到或超过国家规定使用年限且性能指标严重劣化
  | 'damaged_unrepairable' // 严重损坏、关键零配件停产无法修复
  | 'maintenance_cost_excessive' // 累计维修成本超过设备原值50%，无继续使用经济价值
  | 'safety_environmental_hazard' // 存在严重电气安全、辐射超标或生物安全隐患经检定不合格
  | 'technology_obsolete'; // 国家明令淘汰或严重落后无法满足临床基本诊疗要求

export type ScrapWorkflowStage = 
  | 'draft_application' // 1. 临床科室报废申请
  | 'technical_appraisal' // 2. 医学工程部技术鉴定
  | 'expert_committee_review' // 3. 医院专家评审委员会联审
  | 'environmental_safety_clearance' // 4. 环保/放射源特殊前置安全核准
  | 'fiscal_approval' // 5. 财政与卫健主管部门批复
  | 'disposal_auction_destruction' // 6. 残值拍卖/环保无害化销毁移交
  | 'ledger_deregistered'; // 7. 资产台账销账完成归档

export interface ScrapExpertSignature {
  role: 'clinical_director' | 'biomedical_engineer' | 'equipment_director' | 'finance_director' | 'vp_medical_technology';
  roleTitle: string; // 如 "临床使用科室主任", "医工鉴定工程师", "医学装备科科长", "财务资产科长", "分管院长"
  userName: string;
  verdict: 'approved' | 'rejected' | 'pending';
  comment: string;
  signatureDate?: string;
  signatureImageBase64?: string; // 电子手写签字
}

export interface ScrapSpecialHazardClearance {
  hasRadiationSource: boolean; // 是否含放射源/射线装置
  radiationTransferPermitNo?: string; // 放射性同位素转让/收贮许可批文
  hasHeavyMetalsOrMercury: boolean; // 是否含汞、铅、冷却液等有毒有害重金属
  heavyMetalRecycleAgency?: string; // 环保资质专业处置移交机构
  dataSecuritySanitized: boolean; // 存储介质与患者隐私数据是否彻底物理销毁/脱敏
  sanitizerEngineer?: string; // 数据擦除责任医工
}

export interface EquipmentScrapOrder {
  id: string; // SCRAP-2026-001
  applicationNo: string;
  equipmentId: string; // 关联系统设备 ID
  assetNumber: string; // 院内资产编号
  equipmentName: string; // 设备名称
  model: string; // 型号规格
  department: string; // 所在科室
  purchaseDate: string; // 购入日期
  originalValue: number; // 设备原值 (元)
  netBookValue: number; // 账面净值 (元)
  accumulatedDepreciation: number; // 累计折旧 (元)
  accumulatedRepairCost: number; // 历史累计维修费用 (元)
  repairToValueRatio: number; // 维修原值占比 (%)
  actualUsageYears: number; // 实际使用年限
  ratedLifespanYears: number; // 国家推荐折旧年限
  
  // 报废初审
  applicantName: string; // 申请人
  applicantPhone: string;
  scrapReasonType: ScrapReasonType;
  scrapReasonDetail: string; // 申请理由详情
  applicationDate: string;

  // 医工技术鉴定
  stage: ScrapWorkflowStage;
  technicalAppraisalNotes?: string; // 医工技术鉴定意见
  appraiserEngineer?: string; // 鉴定医工
  appraisalDate?: string;
  appraisalRating: 'scrap_mandatory' | 'degrade_use' | 'repair_viable'; // 鉴定结论: 建议报废 | 降级使用 | 建议修复

  // 专家联审签名集
  expertSignatures: ScrapExpertSignature[];

  // 环保与特殊危害处置
  hazardClearance: ScrapSpecialHazardClearance;

  // 财政/卫健批复信息
  fiscalApprovalBatchNo?: string; // 财政/卫健国资处置批复文号
  approvalDate?: string;

  // 处置执行与残值结算
  disposalMethod?: 'auction_transfer' | 'eco_destruction' | 'manufacturer_trade_in'; // 处置方式: 残值公开竞价拍卖 | 环保拆解销毁 | 厂家以旧换新
  disposalAgencyName?: string; // 处置成交单位/回收资质公司
  disposalContractNo?: string; // 处置协议编号
  salvageAmount?: number; // 实际变现残值金额 (元)
  disposalDate?: string;
  disposalCertificateUrl?: string; // 处置移交凭证回执

  // 归档标记
  isLedgerDeregistered: boolean; // 是否已完成资产台账核销
  deregisteredAt?: string;
  deregisteredBy?: string;
  createdAt: string;
  updatedAt: string;
}
