import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  Sparkles,
  Scissors,
  Receipt,
  PenTool,
  RotateCcw,
  Stamp,
  ExternalLink,
  Sliders,
  QrCode,
  Hash,
  Link2,
  ArrowRightLeft,
  Info
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { resolveHospitalCodingChain, HospitalCodingChain } from '../../utils/hospitalCodingStandard';
import { HospitalCodingStandardModal } from '../common/HospitalCodingStandardModal';

export interface ExpensePreApprovalItem {
  name: string; // 物品名称
  model: string; // 型号（规格）
  supplier: string; // 供货单位
  quantity: number | string; // 数量
  price: number; // 参考金额
  remarks: string; // 备注
}

export interface ExpensePreApprovalData {
  id: string; // 如 "548"
  docNo: string; // 预批单编号
  hospitalName: string; // 五莲县人民医院
  department: string; // 医疗设备科
  items: ExpensePreApprovalItem[];
  totalAmount: number;
  totalAmountUpper: string;
  applicantSign: {
    name: string;
    date: string;
    signed: boolean;
  };
  deptHeadSign: {
    name: string;
    date: string;
    signed: boolean;
    opinion?: string;
  };
  branchLeaderSign: {
    name: string;
    date: string;
    signed: boolean;
    opinion?: string;
  };
  mainLeaderSign: {
    name: string;
    date: string;
    signed: boolean;
    opinion?: string;
  };
  boardResolution: string; // 院长办公会决议
  boardDate?: string;
  invoiceInfo?: {
    code?: string;
    number?: string;
    type?: string;
    amount?: number;
    date?: string;
  };
}

interface ExpensePreApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<ExpensePreApprovalData>;
  showToast?: (message: string) => void;
}

// 金额转大写中文函数 (标准公立医院财务规范)
export function numberToChineseCurrency(money: number): string {
  if (isNaN(money) || money === 0) return '零圆整';
  const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const cnIntRadice = ['', '拾', '佰', '仟'];
  const cnIntUnits = ['', '万', '亿', '兆'];
  const cnDecUnits = ['角', '分'];
  const cnInteger = '整';
  const cnIntLast = '圆';
  const maxNum = 999999999999.99;
  if (money >= maxNum) return '超出最大金额范围';

  const integerNum = Math.floor(money);
  const decimalNum = Math.round((money - integerNum) * 100);

  let chineseStr = '';
  if (integerNum > 0) {
    let zeroCount = 0;
    const intStr = integerNum.toString();
    const intLen = intStr.length;
    for (let i = 0; i < intLen; i++) {
      const n = intStr.charAt(i);
      const p = intLen - i - 1;
      const q = p / 4;
      const m = p % 4;
      if (n === '0') {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          chineseStr += cnNums[0];
        }
        zeroCount = 0;
        chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
      }
      if (m === 0 && zeroCount < 4) {
        chineseStr += cnIntUnits[Math.floor(q)];
      }
    }
    chineseStr += cnIntLast;
  }

  if (decimalNum > 0) {
    const decStr = decimalNum.toString().padStart(2, '0');
    const jiao = parseInt(decStr.charAt(0));
    const fen = parseInt(decStr.charAt(1));
    if (jiao > 0) chineseStr += cnNums[jiao] + cnDecUnits[0];
    if (fen > 0) chineseStr += cnNums[fen] + cnDecUnits[1];
  } else {
    chineseStr += cnInteger;
  }

  return chineseStr || '零圆整';
}

// 医院医疗设备科标准项目台账结构 (ID 号码与申报项目 1 对 1 严格绑定)
export interface HospitalProjectLedgerItem {
  id: string; // 唯一项目ID号码，如 "548", "629", "715", "802", "846", "912"
  docNo: string;
  projectName: string; // 物品名称（项目名称）
  model: string; // 规格型号
  supplier: string; // 供货/检测单位
  quantity: number | string;
  price: number; // 参考金额
  remarks: string;
  department: string;
  category: string;
  invoiceInfo: {
    code: string;
    number: string;
    type: string;
    amount: number;
    date: string;
  };
  applicant: string;
  applicantDate: string;
  deptHead: string;
  deptHeadOpinion: string;
  branchLeader: string;
  branchLeaderOpinion: string;
  mainLeader: string;
  mainLeaderOpinion: string;
  boardResolution: string;
}

// 官方标准台账库：ID 与项目名称一一对应档案
export const HOSPITAL_PROJECT_LEDGER: Record<string, HospitalProjectLedgerItem> = {
  '548': {
    id: '548',
    docNo: '548',
    projectName: '特种设备安全阀定期校验',
    model: 'A48Y-16C / DN50',
    supplier: '日照市特种设备检验科学研究院',
    quantity: 1,
    price: 960.00,
    remarks: '合格证有效',
    department: '医疗设备科',
    category: '特种设备年检 (原件复刻)',
    invoiceInfo: {
      code: '037002300111',
      number: '2637481920',
      type: '增值税电子普通发票',
      amount: 960.00,
      date: '2026-11-03'
    },
    applicant: '崔伟',
    applicantDate: '2026-11-04',
    deptHead: '赵文博',
    deptHeadOpinion: '符合特种设备年检规程，拟同意申报预批',
    branchLeader: '张明理',
    branchLeaderOpinion: '同意在设备维保预算内列支',
    mainLeader: '同意批复',
    mainLeaderOpinion: '准予依规结算',
    boardResolution: '经院长办公会决议：同意按法定特种设备检测费办理费用预批及报销。'
  },
  '629': {
    id: '629',
    docNo: '629',
    projectName: '医用电子内窥镜（输尿管镜）返厂物镜与光束精密置换',
    model: 'URF-V / 330mm',
    supplier: '上海成运医疗器械技术服务有限公司',
    quantity: 1,
    price: 14200.00,
    remarks: '临床试用合格',
    department: '医疗设备科',
    category: '高精内镜返厂大修',
    invoiceInfo: {
      code: '037002300889',
      number: '9928172635',
      type: '增值税专用发票',
      amount: 14200.00,
      date: '2026-10-27'
    },
    applicant: '李明',
    applicantDate: '2026-10-28',
    deptHead: '赵文博',
    deptHeadOpinion: '开箱气密性及临床跟台试用满1周均达标，核对无误',
    branchLeader: '张明理',
    branchLeaderOpinion: '已联合议价核销，同意预批',
    mainLeader: '已核准',
    mainLeaderOpinion: '按三单勾稽结案单核付',
    boardResolution: '经院长办公会议通过：大额高值配件外协维修三单勾稽一致，同意出纳电汇付款。'
  },
  '715': {
    id: '715',
    docNo: '715',
    projectName: '急救生命支持类设备（除颤仪/呼吸机/监护仪）强检定标校验',
    model: 'BeneHeart D6 / Evita V300',
    supplier: '山东省计量科学研究院',
    quantity: 8,
    price: 3600.00,
    remarks: '8台检定合格标',
    department: '医疗设备科',
    category: '法定强检定标',
    invoiceInfo: {
      code: '037002300552',
      number: '1827364529',
      type: '增值税电子普通发票',
      amount: 3600.00,
      date: '2026-10-14'
    },
    applicant: '崔伟',
    applicantDate: '2026-10-15',
    deptHead: '赵文博',
    deptHeadOpinion: '属国家法定强检定标，报告齐全，拟预批',
    branchLeader: '张明理',
    branchLeaderOpinion: '保障生命急救安全，同意拨付',
    mainLeader: '同意',
    mainLeaderOpinion: '同意依规拨付',
    boardResolution: '经院务审核：属三级医院达标必备计量检验费用，准予核销。'
  },
  '802': {
    id: '802',
    docNo: '802',
    projectName: '超导磁共振（西门子 1.5T Aera）射频功放模块置换外协维修',
    model: 'MAGNETOM Aera 1.5T / SP-RFPA-01',
    supplier: '西门子医疗系统有限公司',
    quantity: 1,
    price: 168000.00,
    remarks: '联合谈判降价56.4%',
    department: '医疗设备科',
    category: '大型设备外协大修',
    invoiceInfo: {
      code: '037002300991',
      number: '8819203912',
      type: '增值税专用发票',
      amount: 168000.00,
      date: '2026-10-26'
    },
    applicant: '赵文博',
    applicantDate: '2026-10-26',
    deptHead: '赵文博',
    deptHeadOpinion: '已由纪委监督完成四方联合议价，原厂保税件已完成现场安装调试并试运行合格',
    branchLeader: '张明理',
    branchLeaderOpinion: '大幅压降节约预算，同意提报院长办公会审议',
    mainLeader: '刘志刚',
    mainLeaderOpinion: '同意依规付款',
    boardResolution: '经院长办公会议专项纪要审定：西门子磁共振射频功放模块置换三单合一核验无误，同意财务科电汇出纳拨付。'
  },
  '846': {
    id: '846',
    docNo: '846',
    projectName: '脉动真空压力蒸汽灭菌器（特种承压设备）年度全面检验',
    model: 'CSSD-ST-1200L / 快开门安全联锁',
    supplier: '日照市特种设备检验科学研究院',
    quantity: 2,
    price: 2400.00,
    remarks: '探伤与联锁合格',
    department: '医疗设备科',
    category: '特种承压设备年检',
    invoiceInfo: {
      code: '037002300663',
      number: '3491827019',
      type: '增值税电子普通发票',
      amount: 2400.00,
      date: '2026-10-20'
    },
    applicant: '崔伟',
    applicantDate: '2026-10-21',
    deptHead: '赵文博',
    deptHeadOpinion: '消毒供应中心高压承压设备检验合格报告齐备，符合院感与特种设备安全规范',
    branchLeader: '张明理',
    branchLeaderOpinion: '同意预算内列支',
    mainLeader: '同意',
    mainLeaderOpinion: '准予报销',
    boardResolution: '经院务审核：属特种压力容器法定定检必要支出，准予按规报销结案。'
  },
  '912': {
    id: '912',
    docNo: '912',
    projectName: '奥林巴斯 CV-290 电子胃肠镜弯曲管及CCD图像总成精密置换',
    model: 'GIF-HQ290 / CF-HQ290',
    supplier: '奥林巴斯贸易（上海）有限公司',
    quantity: 1,
    price: 28500.00,
    remarks: '气密测漏合格',
    department: '医疗设备科',
    category: '软式内镜原厂维保',
    invoiceInfo: {
      code: '037002300778',
      number: '5561928374',
      type: '增值税专用发票',
      amount: 28500.00,
      date: '2026-10-18'
    },
    applicant: '李明',
    applicantDate: '2026-10-19',
    deptHead: '赵文博',
    deptHeadOpinion: '消化内镜中心实机试用20例无异常，弯曲角度达标，同意预批',
    branchLeader: '张明理',
    branchLeaderOpinion: '同意预批拨付',
    mainLeader: '同意',
    mainLeaderOpinion: '同意结算',
    boardResolution: '经院长办公会决议：同意按原厂技术维保合同予以报销付款。'
  },
  '3212': {
    id: '3212',
    docNo: '3212',
    projectName: '麻醉手术室生命支持监护设备现场急修与应急配件更换',
    model: 'BeneVision N17 / A7',
    supplier: '山东医疗器械维修保障服务中心',
    quantity: 1,
    price: 3200.00,
    remarks: '抢修现场复核合格',
    department: '麻醉手术科',
    category: '现场紧急抢修 (请示单联动)',
    invoiceInfo: {
      code: '037002300996',
      number: '3829104756',
      type: '增值税电子普通发票',
      amount: 3200.00,
      date: '2026-11-09'
    },
    applicant: '崔伟',
    applicantDate: '2026-11-09',
    deptHead: '赵文博',
    deptHeadOpinion: '现场应急抢修配件更换完毕，设备自检合格准予投入急诊手术，拟同意费用预批',
    branchLeader: '张明理',
    branchLeaderOpinion: '经核查属急诊抢救应急抢修，符合绿色通道议价流程，同意预批',
    mainLeader: '同意批复',
    mainLeaderOpinion: '准予依规结算报销',
    boardResolution: '经院长办公会紧急议事决议：特准工单 NO. WO-REP-2026-3212 现场急修按《费用预批单》流程报销核付。'
  }
};

// 将台账条目转换为预批单完整数据格式
export function ledgerItemToApprovalData(item: HospitalProjectLedgerItem): ExpensePreApprovalData {
  return {
    id: item.id,
    docNo: item.docNo,
    hospitalName: '五莲县人民医院',
    department: item.department,
    items: [
      {
        name: item.projectName,
        model: item.model,
        supplier: item.supplier,
        quantity: item.quantity,
        price: item.price,
        remarks: item.remarks
      }
    ],
    totalAmount: item.price,
    totalAmountUpper: numberToChineseCurrency(item.price),
    applicantSign: {
      name: item.applicant,
      date: item.applicantDate,
      signed: true
    },
    deptHeadSign: {
      name: item.deptHead,
      date: item.applicantDate,
      signed: true,
      opinion: item.deptHeadOpinion
    },
    branchLeaderSign: {
      name: item.branchLeader,
      date: item.applicantDate,
      signed: true,
      opinion: item.branchLeaderOpinion
    },
    mainLeaderSign: {
      name: item.mainLeader,
      date: item.applicantDate,
      signed: true,
      opinion: item.mainLeaderOpinion
    },
    boardResolution: item.boardResolution,
    invoiceInfo: item.invoiceInfo
  };
}

// 预设样本：通过项目台账统一驱动，确保 ID 与项目绝对一对一对应
export const PRESET_SAMPLES: Record<string, ExpensePreApprovalData> = {
  pdfSample: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['548']),
  woRep3212: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['3212']),
  endoscopeRepair: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['629']),
  metrologyCalibration: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['715']),
  mriRepair: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['802']),
  sterilizerCheck: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['846']),
  gastroscopeRepair: ledgerItemToApprovalData(HOSPITAL_PROJECT_LEDGER['912'])
};

export const ExpensePreApprovalModal: React.FC<ExpensePreApprovalModalProps> = ({
  isOpen,
  onClose,
  initialData,
  showToast
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);

  // 视图模式：'paper' 纸质版打印双联 | 'electronic' 电子版验签流转 | 'edit' 参数快捷修改
  const [activeViewMode, setActiveViewMode] = useState<'paper' | 'electronic' | 'edit'>('paper');

  // 当前数据状态
  const [formData, setFormData] = useState<ExpensePreApprovalData>(() => {
    if (initialData && initialData.items && initialData.items.length > 0) {
      const amount = initialData.totalAmount || initialData.items[0].price || 960;
      return {
        id: initialData.id || '548',
        docNo: initialData.docNo || '548',
        hospitalName: initialData.hospitalName || '五莲县人民医院',
        department: initialData.department || '医疗设备科',
        items: initialData.items,
        totalAmount: amount,
        totalAmountUpper: initialData.totalAmountUpper || numberToChineseCurrency(amount),
        applicantSign: initialData.applicantSign || { name: '经办人', date: new Date().toISOString().split('T')[0], signed: true },
        deptHeadSign: initialData.deptHeadSign || { name: '赵文博', date: new Date().toISOString().split('T')[0], signed: true },
        branchLeaderSign: initialData.branchLeaderSign || { name: '张明理', date: new Date().toISOString().split('T')[0], signed: true },
        mainLeaderSign: initialData.mainLeaderSign || { name: '主要负责人', date: new Date().toISOString().split('T')[0], signed: true },
        boardResolution: initialData.boardResolution || '经院长办公会决议通过，准予按合同预批核销。',
        invoiceInfo: initialData.invoiceInfo
      };
    }
    return PRESET_SAMPLES.pdfSample;
  });

  // 电子签署状态展示：是否显示印章与真实手写体
  const [isSignaturesActive, setIsSignaturesActive] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  // 全院编码与钩稽规范弹窗
  const [showCodingStandardModal, setShowCodingStandardModal] = useState<boolean>(false);
  // 单据编号展示模式：'simple' (原件纯数字简码如 3212) | 'standard' (规范财务预批码 YP-2026-3212) | 'work_order' (工单联名码 WO-REP-2026-3212)
  const [codeDisplayMode, setCodeDisplayMode] = useState<'simple' | 'standard' | 'work_order'>('simple');

  // 当外部传入新数据时同步
  useEffect(() => {
    if (initialData && initialData.items && initialData.items.length > 0) {
      const amount = initialData.totalAmount || initialData.items[0].price || 960;
      setFormData(prev => ({
        ...prev,
        ...initialData,
        totalAmount: amount,
        totalAmountUpper: initialData.totalAmountUpper || numberToChineseCurrency(amount)
      }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  // 切换预设案例
  const handleSelectPreset = (key: string) => {
    const selected = PRESET_SAMPLES[key];
    if (selected) {
      setFormData({ ...selected });
      if (showToast) showToast(`已载入业务模板: ${selected.items[0]?.name || key}`);
    }
  };

  // 金额变动自动换算中文大写
  const handleItemPriceChange = (index: number, newPrice: number) => {
    const updatedItems = [...formData.items];
    updatedItems[index].price = newPrice;
    const newTotal = updatedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: newTotal,
      totalAmountUpper: numberToChineseCurrency(newTotal)
    }));
  };

  // 打印调用
  const handlePrint = () => {
    window.print();
  };

  // 导出 PDF (基于 A4 纸张比例)
  const handleExportPdf = async () => {
    if (!printSheetRef.current || isExportingPdf) return;
    setIsExportingPdf(true);

    try {
      const element = printSheetRef.current;
      const imgData = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
      });

      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('生成图片失败'));
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (img.naturalHeight * pdfWidth) / img.naturalWidth;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      } else {
        const ratio = pdfHeight / imgHeight;
        const finalWidth = imgWidth * ratio;
        const xOffset = (pdfWidth - finalWidth) / 2;
        pdf.addImage(imgData, 'JPEG', xOffset, 0, finalWidth, pdfHeight);
      }

      const fileName = `五莲县人民医院_费用预批单_${formData.docNo || formData.id}.pdf`;
      pdf.save(fileName);
      if (showToast) showToast(`已成功导出 ${fileName}`);
    } catch (err) {
      console.error('PDF export error:', err);
      if (showToast) showToast('导出 PDF 失败，建议使用浏览器原生打印另存为 PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 复制防伪 Token 链接
  const handleCopyToken = () => {
    const token = `TOKEN-PREAPP-${formData.docNo || formData.id}-202611-WLPH-VERIFIED`;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    if (showToast) showToast('已复制预批单电子验签防伪Token至剪贴板');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // 推进电子签名审批流程模拟
  const handleAdvanceSignatures = () => {
    setFormData(prev => ({
      ...prev,
      applicantSign: { name: '崔伟 (工程师)', date: '2026-11-08', signed: true },
      deptHeadSign: { name: '赵文博 (科长)', date: '2026-11-08', signed: true, opinion: '经核验发票真实、服务已验收，同意列支' },
      branchLeaderSign: { name: '张明理 (副院长)', date: '2026-11-08', signed: true, opinion: '同意预算内列支，请主要负责人审批' },
      mainLeaderSign: { name: '院主要领导', date: '2026-11-08', signed: true, opinion: '同意' },
      boardResolution: '经院长办公会议审议通过：依规核准拨付。'
    }));
    setIsSignaturesActive(true);
    if (showToast) showToast('已成功完成全流程电子联合会签！');
  };

  // 根据项目ID严格切换对应项目
  const handleSelectProjectByLedgerId = (id: string) => {
    const item = HOSPITAL_PROJECT_LEDGER[id];
    if (item) {
      const data = ledgerItemToApprovalData(item);
      setFormData(data);
      if (showToast) showToast(`已严格匹配 ID: ${id} 与项目【${item.projectName}】`);
    }
  };

  // 用户修改 ID 号码时，智能校验与同步项目
  const handleIdInputChange = (newId: string) => {
    const trimmed = newId.trim();
    const matched = HOSPITAL_PROJECT_LEDGER[trimmed];
    if (matched) {
      const data = ledgerItemToApprovalData(matched);
      setFormData(data);
      if (showToast) showToast(`检测到官方台账 ID: ${trimmed}，已自动同步对应项目【${matched.projectName}】`);
    } else {
      setFormData(prev => ({
        ...prev,
        id: newId,
        docNo: newId
      }));
    }
  };

  // 校验当前输入的 ID 是否与台账项目严格对应
  const currentMatchedProject = HOSPITAL_PROJECT_LEDGER[formData.id] || 
    Object.values(HOSPITAL_PROJECT_LEDGER).find(p => p.projectName === formData.items[0]?.name);
  const isStrictlyMatched = Boolean(
    currentMatchedProject && 
    currentMatchedProject.id === formData.id && 
    currentMatchedProject.projectName === formData.items[0]?.name
  );

  // 渲染单一联（用于组合上联“预批单”与下联“预批单存根”）
  const renderSingleVoucher = (isStub: boolean) => {
    const titleText = isStub ? '费用预批单存根' : '费用预批单';
    const firstItem = formData.items[0] || {
      name: '特种设备安全阀定期校验',
      model: '',
      supplier: '日照市特种设备检验科学研究院',
      quantity: 1,
      price: 960.00,
      remarks: ''
    };

    return (
      <div className="w-full text-slate-900 select-none">
        {/* 顶栏 ID 号码（与项目一一对应） */}
        <div className="flex justify-between items-center text-xs font-mono mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-950 text-xs tracking-tight">ID: {formData.id}</span>
            <span className="print:hidden text-[10px] font-sans text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-1 shadow-2xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isStrictlyMatched ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span>对应项目：{firstItem.name}</span>
            </span>
          </div>
          <span className="print:hidden text-[10px] text-slate-400 font-sans">
            {isStub ? '【存根联 · 财务与留底备案】' : '【正本联 · 报销申请主联】'}
          </span>
        </div>

        {/* 居中标题与编号 (支持原件简码/财务全码/工单号灵活切换与钩稽) */}
        {(() => {
          const codingChain = resolveHospitalCodingChain(formData.docNo || formData.id || '548');
          const voucherNumberDisplay = codeDisplayMode === 'standard'
            ? codingChain.preApproval.standardVoucherNo
            : codeDisplayMode === 'work_order'
            ? codingChain.workOrder.fullCode
            : (formData.docNo || formData.id || codingChain.sequenceNumber);

          return (
            <div className="text-center mb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-widest text-slate-900 font-serif">
                {titleText}（编号：<span className="font-mono underline px-3">{voucherNumberDisplay}</span>）
              </h2>
              {/* 六码贯通业务溯源条 (打印时隐藏) */}
              <div className="print:hidden mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-sans text-slate-500">
                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-medium">
                  关联工单: {codingChain.workOrder.fullCode}
                </span>
                <span className="text-slate-300">·</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-medium">
                  项目台账: ID_{codingChain.projectLedger.id}
                </span>
                <span className="text-slate-300">·</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                  财务规范全码: {codingChain.preApproval.standardVoucherNo}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCodingStandardModal(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
                >
                  [查看编码对应逻辑]
                </button>
              </div>
            </div>
          );
        })()}

        {/* 医院名称与科室 */}
        <div className="flex justify-between items-end text-sm font-serif font-bold pb-1.5 px-0.5">
          <span className="text-base tracking-wider">{formData.hospitalName}</span>
          <span className="tracking-wide">
            科室：<span className="font-sans font-semibold underline underline-offset-4">{formData.department}</span>
          </span>
        </div>

        {/* 标准核心表格 (完全复刻用户提供 PDF 真实样式与边框) */}
        <div className="border-2 border-slate-900 overflow-hidden text-xs font-serif">
          {/* 表头 */}
          <div className="grid grid-cols-12 border-b-2 border-slate-900 bg-slate-50/40 text-center font-bold">
            <div className="col-span-3 p-2 border-r border-slate-900 flex items-center justify-center">
              物品名称
            </div>
            <div className="col-span-2 p-2 border-r border-slate-900 flex items-center justify-center">
              型号（规格）
            </div>
            <div className="col-span-3 p-2 border-r border-slate-900 flex items-center justify-center">
              供货单位
            </div>
            <div className="col-span-1 p-2 border-r border-slate-900 flex flex-col items-center justify-center leading-tight text-[11px]">
              <span>数</span>
              <span>量</span>
            </div>
            <div className="col-span-2 p-2 border-r border-slate-900 flex items-center justify-center">
              参考金额
            </div>
            <div className="col-span-1 p-2 flex flex-col items-center justify-center leading-tight text-[11px]">
              <span>备</span>
              <span>注</span>
            </div>
          </div>

          {/* 表体数据行 */}
          <div className="grid grid-cols-12 border-b border-slate-900 min-h-[56px] text-xs">
            <div className="col-span-3 p-2 border-r border-slate-900 flex items-center justify-start text-left leading-relaxed font-sans font-medium">
              {firstItem.name}
            </div>
            <div className="col-span-2 p-2 border-r border-slate-900 flex items-center justify-center text-center font-sans">
              {firstItem.model || '—'}
            </div>
            <div className="col-span-3 p-2 border-r border-slate-900 flex items-center justify-start text-left leading-relaxed font-sans">
              {firstItem.supplier}
            </div>
            <div className="col-span-1 p-2 border-r border-slate-900 flex items-center justify-center font-mono font-bold text-center">
              {firstItem.quantity}
            </div>
            <div className="col-span-2 p-2 border-r border-slate-900 flex items-center justify-end pr-3 font-mono font-bold text-sm">
              ¥{Number(firstItem.price).toFixed(2)}
            </div>
            <div className="col-span-1 p-2 flex items-center justify-center text-center text-slate-500 text-[10px] font-sans">
              {firstItem.remarks || '—'}
            </div>
          </div>

          {/* 合计金额大写行 */}
          <div className="grid grid-cols-12 border-b-2 border-slate-900 bg-slate-50/20">
            <div className="col-span-3 p-2 border-r border-slate-900 font-bold text-center flex items-center justify-center">
              合计金额大写：
            </div>
            <div className="col-span-9 p-2 pl-4 flex items-center justify-between font-bold text-sm tracking-widest font-serif">
              <span>{formData.totalAmountUpper}</span>
              <span className="font-mono text-xs text-slate-500 font-normal pr-3">
                (小写: ¥{Number(formData.totalAmount).toFixed(2)})
              </span>
            </div>
          </div>

          {/* 4 栏审批签字栏 */}
          <div className="grid grid-cols-4 border-b border-slate-900 min-h-[96px] relative">
            {/* 经办人签字 */}
            <div className="p-2.5 border-r border-slate-900 flex flex-col justify-between relative">
              <div className="font-bold">经办人签字：</div>
              <div className="py-2 min-h-[30px] flex items-center justify-center">
                {isSignaturesActive && formData.applicantSign.signed && (
                  <span className="font-serif italic font-bold text-blue-900 text-sm tracking-wider">
                    {formData.applicantSign.name}
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-700">
                日期：{isSignaturesActive ? formData.applicantSign.date : '        年    月    日'}
              </div>
            </div>

            {/* 科室负责人签字 */}
            <div className="p-2.5 border-r border-slate-900 flex flex-col justify-between relative">
              <div className="font-bold">科室负责人签字：</div>
              <div className="py-1 min-h-[30px] flex flex-col items-center justify-center text-center">
                {isSignaturesActive && formData.deptHeadSign.signed && (
                  <>
                    <span className="font-serif italic font-bold text-blue-900 text-sm">
                      {formData.deptHeadSign.name}
                    </span>
                    {formData.deptHeadSign.opinion && (
                      <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                        {formData.deptHeadSign.opinion}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-700">
                日期：{isSignaturesActive ? formData.deptHeadSign.date : '        年    月    日'}
              </div>
            </div>

            {/* 分管领导签批 */}
            <div className="p-2.5 border-r border-slate-900 flex flex-col justify-between relative">
              <div className="font-bold">分管领导签批：</div>
              <div className="py-1 min-h-[30px] flex flex-col items-center justify-center text-center">
                {isSignaturesActive && formData.branchLeaderSign.signed && (
                  <>
                    <span className="font-serif italic font-bold text-blue-900 text-sm">
                      {formData.branchLeaderSign.name}
                    </span>
                    {formData.branchLeaderSign.opinion && (
                      <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                        {formData.branchLeaderSign.opinion}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-700">
                日期：{isSignaturesActive ? formData.branchLeaderSign.date : '        年    月    日'}
              </div>
            </div>

            {/* 主要负责人签批 */}
            <div className="p-2.5 flex flex-col justify-between relative">
              <div className="font-bold">主要负责人签批：</div>
              <div className="py-1 min-h-[30px] flex flex-col items-center justify-center text-center">
                {isSignaturesActive && formData.mainLeaderSign.signed && (
                  <>
                    <span className="font-serif italic font-bold text-blue-900 text-sm">
                      {formData.mainLeaderSign.name}
                    </span>
                    {formData.mainLeaderSign.opinion && (
                      <span className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                        {formData.mainLeaderSign.opinion}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-700">
                日期：{isSignaturesActive ? formData.mainLeaderSign.date : '        年    月    日'}
              </div>

              {/* 电子印章覆盖效果（仅在电子版启用时渲染） */}
              {isSignaturesActive && activeViewMode === 'electronic' && (
                <div className="absolute right-1 -top-1 pointer-events-none opacity-85 scale-90">
                  <div className="w-20 h-20 rounded-full border-2 border-red-600 p-1 flex flex-col items-center justify-center text-center rotate-[-12deg] shadow-xs bg-white/20">
                    <div className="text-[8px] font-bold text-red-600 tracking-tighter">五莲县人民医院</div>
                    <div className="text-[10px] font-black text-red-600 my-0.5">★ 费用预批 ★</div>
                    <div className="text-[7px] text-red-600 font-mono">电子验签放行</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 院长办公会决议 (通栏) */}
          <div className="p-2.5 min-h-[46px] flex flex-col justify-start">
            <div className="font-bold mb-1">院长办公会决议：</div>
            <div className="pl-4 text-xs font-sans text-slate-800 leading-relaxed min-h-[20px]">
              {isSignaturesActive ? (
                <span>{formData.boardResolution}</span>
              ) : (
                <span className="text-slate-300 font-mono">（留白供院长办公会决议公文记录）</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部操作条与模式切换 (打印时隐藏) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  五莲县人民医院 · 费用预批单生成中心
                </h3>
                <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                  原件复刻 1:1 双联
                </span>
              </div>
              <p className="text-2xs text-slate-400 mt-0.5">
                收到发票后发起报销审批 · 支持纸质版双联裁切打印与全流程电子会签
              </p>
            </div>
          </div>

          {/* 视图模式切换卡 */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setActiveViewMode('paper')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                  activeViewMode === 'paper'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                纸质版 (A4双联打印)
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('electronic')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeViewMode === 'electronic'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>电子版 (数字会签)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('edit')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeViewMode === 'edit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>在线编辑</span>
              </button>
            </div>

            {/* 编号规范与钩稽中枢按钮 */}
            <button
              type="button"
              onClick={() => setShowCodingStandardModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="查看请示报告工单号、项目台账ID与预批单编号统一对应规范"
            >
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">编号钩稽中枢</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="关闭 (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 快捷辅助信息与预设选择栏 (打印时隐藏) */}
        <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-2xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
              <Hash className="w-3 h-3 text-indigo-500" />
              <span>载入ID对应项目：</span>
            </span>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('548')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '548'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              [ID: 548] 特种设备安全阀校验 (¥960 原图样例)
            </button>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('3212')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '3212'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-amber-900 hover:bg-amber-50'
              }`}
              title="实证：WO-REP-2026-3212 现场急修请示与费用预批单 1:1 严格联动"
            >
              [ID: 3212] 麻醉急修请示 (WO-REP-2026-3212)
            </button>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('629')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '629'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              [ID: 629] 输尿管镜返厂物镜置换 (¥14,200 发票工单)
            </button>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('715')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '715'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              [ID: 715] 急救设备强检定标 (¥3,600 省计量院)
            </button>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('802')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '802'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              [ID: 802] 1.5T磁共振射频功放置换 (¥168,000)
            </button>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('846')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '846'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              [ID: 846] 承压灭菌器全面定检 (¥2,400)
            </button>
            <button
              type="button"
              onClick={() => handleSelectProjectByLedgerId('912')}
              className={`px-2.5 py-1 rounded-md text-2xs font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                formData.id === '912'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              [ID: 912] 胃肠镜弯曲管及CCD修复 (¥28,500)
            </button>
          </div>

          {/* 电子签署模拟操作 */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-2xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isSignaturesActive}
                onChange={(e) => setIsSignaturesActive(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>套打签名与印章</span>
            </label>

            {activeViewMode === 'electronic' && (
              <button
                type="button"
                onClick={handleAdvanceSignatures}
                className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <PenTool className="w-3 h-3" />
                <span>推进电子会签</span>
              </button>
            )}
          </div>
        </div>

        {/* ID 与项目严格对应信息条 (核验卡片) */}
        <div className="px-5 py-2 bg-slate-900 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono uppercase text-slate-400 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-amber-400" />
              <span>ID与申报项目对应关系:</span>
            </span>
            <span className="font-mono font-black text-amber-300 bg-amber-950/80 border border-amber-600/70 px-2 py-0.5 rounded text-xs shadow-2xs">
              ID: {formData.id}
            </span>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <strong className="text-white font-bold">{formData.items[0]?.name || '未指定项目'}</strong>
            <span className={`px-2 py-0.5 rounded text-3xs font-bold border ${
              isStrictlyMatched
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            }`}>
              {isStrictlyMatched ? '✓ 台账ID已精确匹配对应项目' : '✓ 自定义ID与项目对应绑定'}
            </span>
          </div>
          <div className="text-2xs font-mono text-slate-300 flex items-center gap-2">
            <span>供货单位: {formData.items[0]?.supplier}</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold">¥{Number(formData.totalAmount).toLocaleString()}.00 ({formData.totalAmountUpper})</span>
          </div>
        </div>

        {/* 核心主展示区 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          {/* 编辑模式 */}
          {activeViewMode === 'edit' && (
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>编辑预批单项目与发票关联合同信息</span>
                  </h4>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    修改 ID 号码将自动匹配对应项目，项目变动将实时联动大写金额与双联单据
                  </p>
                </div>
                <span className="text-2xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                  当前 ID: {formData.id}
                </span>
              </div>

              {/* 台账一键对应选择器 */}
              <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    <span>标准项目台账一键对应（ID与申报项目 1 对 1 绑定）</span>
                  </span>
                  <span className="text-3xs text-indigo-700 font-mono">选择后自动锁定 ID 与全套项目参数</span>
                </div>
                <select
                  value={HOSPITAL_PROJECT_LEDGER[formData.id] ? formData.id : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectProjectByLedgerId(e.target.value);
                    }
                  }}
                  className="w-full p-2 bg-white border border-indigo-300 rounded text-xs font-semibold text-slate-800"
                >
                  <option value="">-- 自定义录入 / 点击从下方台账直接匹配 --</option>
                  {Object.values(HOSPITAL_PROJECT_LEDGER).map(p => (
                    <option key={p.id} value={p.id}>
                      【ID: {p.id}】{p.projectName}（{p.supplier} · ¥{p.price.toLocaleString()}.00）
                    </option>
                  ))}
                </select>
              </div>

              {/* ID 状态校验栏 */}
              <div className={`p-2.5 rounded-lg border flex items-center justify-between text-2xs ${
                isStrictlyMatched 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-1.5 font-medium">
                  {isStrictlyMatched ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  <span>
                    {isStrictlyMatched 
                      ? `台账核验一致：当前 ID 号码 [${formData.id}] 与项目名称【${formData.items[0]?.name}】完全对应`
                      : `自定义项目模式：ID 号码 [${formData.id}] 与项目名称【${formData.items[0]?.name || '未填写'}】已绑定对应`
                    }
                  </span>
                </div>
                {currentMatchedProject && !isStrictlyMatched && (
                  <button
                    type="button"
                    onClick={() => handleSelectProjectByLedgerId(currentMatchedProject.id)}
                    className="px-2 py-0.5 bg-white border border-amber-300 rounded text-3xs font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    恢复为 ID: {currentMatchedProject.id} 标准项目
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>项目 ID 号码</span>
                    <span className="text-3xs text-indigo-600 font-mono">对应单据顶栏 ID</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => handleIdInputChange(e.target.value)}
                    placeholder="输入如 548, 629, 715..."
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold text-indigo-900 bg-indigo-50/20"
                  />
                </div>
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1">预批单编号（打印联编号）</label>
                  <input
                    type="text"
                    value={formData.docNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, docNo: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-800 text-2xs">申报项目明细 (与 ID 对应)</h5>
                  <span className="text-3xs text-slate-400 font-mono">科室：{formData.department}</span>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-600 mb-1">物品名称 / 对应项目名称</label>
                  <input
                    type="text"
                    value={formData.items[0]?.name || ''}
                    onChange={(e) => {
                      const updated = [...formData.items];
                      updated[0].name = e.target.value;
                      setFormData(prev => ({ ...prev, items: updated }));
                    }}
                    className="w-full p-2 border border-slate-300 rounded text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">型号（规格）</label>
                    <input
                      type="text"
                      value={formData.items[0]?.model || ''}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[0].model = e.target.value;
                        setFormData(prev => ({ ...prev, items: updated }));
                      }}
                      className="w-full p-2 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">供货 / 检测单位</label>
                    <input
                      type="text"
                      value={formData.items[0]?.supplier || ''}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[0].supplier = e.target.value;
                        setFormData(prev => ({ ...prev, items: updated }));
                      }}
                      className="w-full p-2 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">参考金额 (元)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.items[0]?.price || 0}
                      onChange={(e) => handleItemPriceChange(0, Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold text-rose-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-semibold text-slate-600 mb-1">院长办公会决议意见</label>
                  <textarea
                    rows={2}
                    value={formData.boardResolution}
                    onChange={(e) => setFormData(prev => ({ ...prev, boardResolution: e.target.value }))}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setActiveViewMode('paper');
                    if (showToast) showToast('已保存修改，已切换至纸质双联打印预览');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  完成修改并查看单据
                </button>
              </div>
            </div>
          )}

          {/* 电子版模式专属状态信息条 */}
          {activeViewMode === 'electronic' && (
            <div className="max-w-[760px] mx-auto mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <div className="font-bold text-blue-950 flex items-center gap-1.5">
                    <span>电子预批单放行凭证 · 增值税发票三单勾稽合格</span>
                    <span className="text-3xs font-mono px-1.5 py-0.2 rounded bg-blue-200 text-blue-800 font-bold">
                      CA认证
                    </span>
                  </div>
                  <div className="text-2xs text-blue-700 font-mono mt-0.5">
                    Token: TOKEN-PREAPP-{formData.docNo || formData.id}-202611-WLPH-VERIFIED
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyToken}
                className="px-2.5 py-1.5 bg-white hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-300 font-semibold text-2xs flex items-center gap-1 transition"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? '已复制' : '复制验签Token'}</span>
              </button>
            </div>
          )}

          {/* 打印与导出主体容器：A4标准尺寸，完全复刻原件双联样式 */}
          <div
            id="expense-pre-approval-print-sheet"
            ref={printSheetRef}
            className="max-w-[760px] mx-auto bg-white p-8 sm:p-10 shadow-lg border border-slate-300 rounded-lg print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
            style={{ minHeight: '1020px' }}
          >
            {/* 上半部分：费用预批单 (正本联) */}
            {renderSingleVoucher(false)}

            {/* 中间裁切虚线 (带剪刀裁切指示) */}
            <div className="my-6 relative flex items-center justify-center">
              <div className="w-full border-b-2 border-dashed border-slate-400" />
              <div className="absolute bg-white px-3 text-2xs font-mono text-slate-500 flex items-center gap-1.5 tracking-wider border border-slate-200 rounded-full py-0.5 shadow-2xs">
                <Scissors className="w-3.5 h-3.5 text-slate-600" />
                <span>请沿虚线裁切 · 存根联留存医疗设备科 / 财务资产科备查</span>
              </div>
            </div>

            {/* 下半部分：费用预批单存根 (存根联) */}
            {renderSingleVoucher(true)}
          </div>
        </div>

        {/* 底部按钮控制栏 (打印时隐藏) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex items-center gap-2 text-2xs text-slate-500">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>五莲县人民医院医学装备精细化管理系统 · 财税三单勾稽结案标准单据</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>{isExportingPdf ? '正在生成 PDF...' : '导出电子版 PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>打印纸质版 (A4一式两联)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              关闭
            </button>
          </div>
        </div>

        {/* 全院单据编码与业务钩稽规范弹窗 */}
        <HospitalCodingStandardModal
          isOpen={showCodingStandardModal}
          onClose={() => setShowCodingStandardModal(false)}
          initialCode={formData.docNo || formData.id || '3212'}
        />
      </div>
    </div>
  );
};
