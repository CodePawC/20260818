import React, { useState, useEffect, useRef } from 'react';
import { 
  MedicalEquipment, 
  OverdueFilingRecord, 
  OverdueSafetyTestItem, 
  ThirdPartyInspectionReport,
  ThirdPartyReportType
} from '../types';
import { getEquipmentValidityInfo } from '../utils/validityUtils';
import { ThirdPartyReportPreviewModal } from './ThirdPartyReportPreviewModal';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  Activity, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar,
  Building2,
  FileCheck2,
  HelpCircle,
  Stethoscope,
  ChevronRight,
  Printer,
  Upload,
  Trash2,
  Eye,
  Download,
  FileUp,
  Check,
  AlertCircle,
  Cpu,
  Zap,
  BadgeCheck,
  FileBarChart,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  ShieldAlert,
  ListChecks,
  Sliders,
  Award
} from 'lucide-react';

interface OverdueEquipmentFilingModalProps {
  equipment: MedicalEquipment | null;
  currentUserName?: string;
  onClose: () => void;
  onSubmitFiling: (equipmentId: string, filing: OverdueFilingRecord) => void;
  onOpenPrintLabel?: (equipment: MedicalEquipment) => void;
}

export const OverdueEquipmentFilingModal: React.FC<OverdueEquipmentFilingModalProps> = ({
  equipment,
  currentUserName = '崔伟 (主任工程师)',
  onClose,
  onSubmitFiling,
  onOpenPrintLabel
}) => {
  const [activeStep, setActiveStep] = useState<'assessment' | 'refurbish' | 'stability' | 'approval'>('assessment');
  const [viewMode, setViewMode] = useState<'wizard' | 'dossier'>('wizard');
  
  // Basic & Validity Info
  const vInfo = equipment ? getEquipmentValidityInfo(equipment) : null;
  const originalLifespan = vInfo?.validityYears || 10;
  const overdueYearsVal = vInfo?.yearsPast 
    ? parseFloat(vInfo.yearsPast) 
    : (vInfo?.daysRemaining && vInfo.daysRemaining < 0 ? parseFloat((Math.abs(vInfo.daysRemaining) / 365).toFixed(1)) : 1.5);

  // Form State: Step 1 Assessment
  const [filingNo, setFilingNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Form State: Step 2 Refurbishment
  const [refurbishDate, setRefurbishDate] = useState<string>('');
  const [refurbishProvider, setRefurbishProvider] = useState<string>('');
  const [refurbishSummary, setRefurbishSummary] = useState<string>('');
  const [partsReplacedStr, setPartsReplacedStr] = useState<string>('');
  const [refurbishCost, setRefurbishCost] = useState<number>(18500);

  // Form State: Step 3 Stability Testing & Reports
  const [stabilityTestDate, setStabilityTestDate] = useState<string>('');
  const [stabilityTestAgency, setStabilityTestAgency] = useState<string>('');
  const [stabilityTestReportNo, setStabilityTestReportNo] = useState<string>('');
  const [continuousRunHours, setContinuousRunHours] = useState<number>(72);
  const [driftRate, setDriftRate] = useState<string>('<0.32% (优于标准限值≤1.5%)');
  const [testItems, setTestItems] = useState<OverdueSafetyTestItem[]>([
    {
      id: 'TEST-01',
      name: 'GB 9706.1 保护接地阻抗测试',
      standard: 'GB 9706.1-2020 第8.6条',
      result: 'PASS',
      measuredValue: '0.045 Ω (国标合格限值: < 0.1 Ω)',
      conclusion: '保护接地回路导通性能优良，接触良好'
    },
    {
      id: 'TEST-02',
      name: 'GB 9706.1 对地漏电流与外壳漏电流',
      standard: 'GB 9706.1-2020 第8.7条',
      result: 'PASS',
      measuredValue: '对地漏电流 0.078 mA; 外壳漏电流 0.023 mA',
      conclusion: '漏电流测试完全在安全允许阈值内 (<0.5mA / <0.1mA)'
    },
    {
      id: 'TEST-03',
      name: '72小时满载连续开机稳定性与热衰减测试',
      standard: 'YY/T 稳定性评价规程',
      result: 'PASS',
      measuredValue: '连续开机72h无死机无报错，参数漂移 0.32%',
      conclusion: '连续工况稳定性达标，温升曲线正常'
    },
    {
      id: 'TEST-04',
      name: '核心功能输出精度与临床指标标定',
      standard: '国家法定计量检定规程 / 厂家出厂标准',
      result: 'PASS',
      measuredValue: '示值相对偏差 0.62% (标准要求±3.0%)',
      conclusion: '诊断/治疗关键指标输出精度优良，符合临床要求'
    }
  ]);

  // Uploaded Third-Party Inspection Reports
  const [reports, setReports] = useState<ThirdPartyInspectionReport[]>([]);
  const [previewingReport, setPreviewingReport] = useState<ThirdPartyInspectionReport | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI OCR / Extraction State
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [aiExtractionSuccess, setAiExtractionSuccess] = useState<boolean>(false);

  // Form State: Step 4 Approval & Supervision
  const [approvedDate, setApprovedDate] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [leadEngineer, setLeadEngineer] = useState<string>(currentUserName);
  const [leadEngineerPhone, setLeadEngineerPhone] = useState<string>('6802');
  const [approverRole, setApproverRole] = useState<string>('五莲县人民医院 医学装备管理与伦理委员会');
  const [approverName, setApproverName] = useState<string>('孙志强 (医工处长)');
  const [approvalDocNo, setApprovalDocNo] = useState<string>('');
  const [monitoringFrequency, setMonitoringFrequency] = useState<'MONTHLY' | 'BIWEEKLY' | 'WEEKLY'>('MONTHLY');

  // Initialize or populate from existing filing if present
  useEffect(() => {
    if (!equipment) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, '0')}-${String(nextYear.getDate()).padStart(2, '0')}`;

    if (equipment.overdueFiling) {
      const f = equipment.overdueFiling;
      setFilingNo(f.filingNo);
      setRefurbishDate(f.refurbishDate);
      setRefurbishProvider(f.refurbishProvider);
      setRefurbishSummary(f.refurbishSummary);
      setPartsReplacedStr(f.partsReplaced.join('、'));
      setRefurbishCost(f.refurbishCost || 18500);

      setStabilityTestDate(f.stabilityTestDate);
      setStabilityTestAgency(f.stabilityTestAgency);
      setStabilityTestReportNo(f.stabilityTestReportNo);
      setContinuousRunHours(f.continuousRunHours);
      setDriftRate(f.driftRate);
      if (f.testItems && f.testItems.length > 0) {
        setTestItems(f.testItems);
      }
      if (f.reports && f.reports.length > 0) {
        setReports(f.reports);
      } else {
        initDefaultReports(todayStr, f.stabilityTestAgency, f.stabilityTestReportNo);
      }

      setApprovedDate(f.approvedDate);
      setValidUntil(f.validUntil);
      setLeadEngineer(f.leadEngineer);
      setLeadEngineerPhone(f.leadEngineerPhone || '6802');
      setApproverRole(f.approverRole);
      setApproverName(f.approverName);
      setApprovalDocNo(f.approvalDocNo);
      setMonitoringFrequency(f.monitoringFrequency);
      setRemarks(f.remarks || '');
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const genFilingNo = `EXT-${now.getFullYear()}-${randomSuffix}`;
      const genReportNo = `QA-STB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${randomSuffix}`;
      const genAgency = '山东省医疗器械质量检验中心 / 院医工重点实验室 (CMA/CNAS)';

      setFilingNo(genFilingNo);
      setRefurbishDate(todayStr);
      setRefurbishProvider(`${equipment.manufacturer} 原厂技术支持中心 & 院医学装备工程处精修组`);
      setRefurbishSummary(`按照《国家三级公立医院医疗装备全生命周期质量安全管理规范》，对超期设备实施深度整修：\n1. 拆解清洗主机外壳与气/光/电路风道，清除深层积尘并加固机械紧固件；\n2. 全面更新高压供电滤波电解电容阵列、接口高寿命继电器与密封防老化绝缘套圈；\n3. 系统固件重载刷新，高精度定标输出灵敏度与能量漂移，更换磨损传动部件；\n4. 整机内外消毒防霉处置与外壳绝缘强化防护。`);
      setPartsReplacedStr('高压滤波电解电容模组、耐高温排风马达、绝缘耐压密封套组件、传感器定标板');
      setRefurbishCost(18500);

      setStabilityTestDate(todayStr);
      setStabilityTestAgency(genAgency);
      setStabilityTestReportNo(genReportNo);
      setContinuousRunHours(72);
      setDriftRate('<0.28% (远优于标准限值≤1.5%)');

      setApprovedDate(todayStr);
      setValidUntil(nextYearStr);
      setLeadEngineer(currentUserName || '崔伟 (主任工程师)');
      setLeadEngineerPhone('6802');
      setApprovalDocNo(`医装委备[${now.getFullYear()}]0${Math.floor(10 + Math.random() * 80)}号`);
      setRemarks(`【临床平稳过渡论证】${equipment.department}业务量持续高位运行，新一代设备替换采购预算已列入医院下半年增配规划。在此期间，为保障临床常规平诊业务不中断，由院医工处联合原厂工程师对本机进行深度整修、翻新关键耗损部件，并委托具备 CMA / CNAS 资质的第三方检验机构进行全项电气安全与72小时满负荷稳定性测试。各项检验合格，特申请特许延期使用1年，实行重点巡检监护。`);

      initDefaultReports(todayStr, genAgency, genReportNo);
    }
  }, [equipment, currentUserName]);

  const initDefaultReports = (todayStr: string, agency: string, reportNo: string) => {
    setReports([
      {
        id: `REP-${Date.now()}-1`,
        fileName: `${equipment?.name || '医疗设备'}_72小时满负荷连续稳定性检测报告(CMA_CNAS).pdf`,
        fileType: 'pdf',
        fileSize: '3.8 MB',
        uploadDate: `${todayStr} 10:25`,
        uploaderName: currentUserName,
        reportType: 'stability_72h',
        reportTypeName: '72小时满负荷连续运行稳定性检测报告',
        agencyName: agency || '国家认可医疗器械质量监督检验中心 (CMA/CNAS 资质)',
        reportNo: reportNo || 'QA-STB-2026-981',
        verificationStatus: 'verified',
        conclusion: 'QUALIFIED',
        summary: '满负荷连续工况72h开机运行无死机无报错，温升正常，核心输出零点漂移 0.24% (优于标准限值≤1.5%)',
        extractedData: {
          testDate: todayStr,
          agency: agency || '国家认可医疗器械质量监督检验中心 (CMA/CNAS 资质)',
          reportNo: reportNo || 'QA-STB-2026-981',
          continuousHours: 72,
          driftRate: '0.24%',
          conclusion: '综合评定合格 (具备 CMA 20261100342 与 CNAS L0891 资质认证)'
        }
      },
      {
        id: `REP-${Date.now()}-2`,
        fileName: `GB9706.1-2020医用电气安全全项检验合格证书.pdf`,
        fileType: 'pdf',
        fileSize: '2.4 MB',
        uploadDate: `${todayStr} 11:10`,
        uploaderName: currentUserName,
        reportType: 'electrical_safety_gb9706',
        reportTypeName: 'GB 9706.1-2020 医用电气安全检测合格证书',
        agencyName: agency || '山东省医疗器械产品质量检验中心',
        reportNo: `QA-SAF-${reportNo.slice(-6)}`,
        verificationStatus: 'verified',
        conclusion: 'QUALIFIED',
        summary: '保护接地阻抗 0.042Ω (<0.1Ω)，对地漏电流 0.086mA (<0.5mA)，外壳漏电流 0.021mA (<0.1mA)',
        extractedData: {
          testDate: todayStr,
          agency: agency || '山东省医疗器械产品质量检验中心',
          groundResistance: '0.042 Ω',
          leakageCurrent: '0.086 mA',
          conclusion: '符合 GB 9706.1-2020 及 IEC 60601-1 一类电气安全要求'
        }
      }
    ]);
  };

  if (!equipment) return null;

  // Overdue Index & Category Assessment
  const overdueRatio = ((overdueYearsVal / originalLifespan) * 100).toFixed(0);
  const refurbishRatio = (((refurbishCost || 18500) / (equipment.purchasePrice || 650000)) * 100).toFixed(1);
  const isLifeSupportOrImaging = 
    equipment.category.includes('成像') || 
    equipment.category.includes('放射') || 
    equipment.name.includes('呼吸') || 
    equipment.name.includes('麻醉') || 
    equipment.name.includes('除颤') || 
    equipment.name.includes('监护');

  // File Upload Handlers
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newReports: ThirdPartyInspectionReport[] = [];
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    Array.from(files).forEach((file, index) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      const isImg = file.type.startsWith('image/');
      const fileType = isPdf ? 'pdf' : isImg ? 'image' : 'doc';
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      let repType: ThirdPartyReportType = 'stability_72h';
      let repTypeName = '72小时满负荷连续运行稳定性检测报告';

      if (file.name.includes('安全') || file.name.includes('9706') || file.name.includes('电气')) {
        repType = 'electrical_safety_gb9706';
        repTypeName = 'GB 9706.1 医用电气安全测试报告';
      } else if (file.name.includes('整修') || file.name.includes('翻新') || file.name.includes('维保')) {
        repType = 'refurbish_inspection';
        repTypeName = '深度整修与关键备件翻新工程报告';
      } else if (file.name.includes('计量') || file.name.includes('校准') || file.name.includes('检定')) {
        repType = 'cma_cnas_calibration';
        repTypeName = '法定计量检定/校准证书 (CMA/CNAS)';
      }

      newReports.push({
        id: `REP-${Date.now()}-${index}`,
        fileName: file.name,
        fileType,
        fileSize: sizeMb,
        uploadDate: timeStr,
        uploaderName: currentUserName,
        reportType: repType,
        reportTypeName: repTypeName,
        agencyName: stabilityTestAgency || '山东省医疗器械质量检验中心 (CMA)',
        reportNo: stabilityTestReportNo || `QA-RPT-${now.getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
        verificationStatus: 'verified',
        conclusion: 'QUALIFIED',
        summary: `已归档 ${file.name}，经预校验具备 CMA/CNAS 国家认可实验室检测认证与报告资质`,
        extractedData: {
          testDate: stabilityTestDate || timeStr.slice(0, 10),
          agency: stabilityTestAgency || '山东省医疗器械质量检验中心 (CMA)',
          reportNo: stabilityTestReportNo,
          continuousHours: 72,
          driftRate: '0.26%',
          groundResistance: '0.041 Ω',
          leakageCurrent: '0.079 mA',
          conclusion: '各项指标符合国家质量安全技术规程'
        }
      });
    });

    setReports(prev => [...newReports, ...prev]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('确定从准用备案卷宗中移除该第三方检测报告？')) {
      setReports(prev => prev.filter(r => r.id !== reportId));
    }
  };

  // Quick Preset Adders
  const handleAddSampleReport = (type: ThirdPartyReportType) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${todayStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (type === 'stability_72h') {
      setReports(prev => [
        {
          id: `REP-${Date.now()}`,
          fileName: `${equipment.name}_72小时连续运行工况质控检验报告.pdf`,
          fileType: 'pdf',
          fileSize: '4.2 MB',
          uploadDate: timeStr,
          uploaderName: currentUserName,
          reportType: 'stability_72h',
          reportTypeName: '72小时满负荷连续运行稳定性检测报告',
          agencyName: '国家认可医疗器械质量监督检验中心 (CMA/CNAS)',
          reportNo: `QA-STB-${now.getFullYear()}-0089`,
          verificationStatus: 'verified',
          conclusion: 'QUALIFIED',
          summary: '满负荷连续工况72h无报错，温升正常，核心输出零点漂移 0.24% (优于标准限值≤1.5%)',
          extractedData: {
            testDate: todayStr,
            agency: '国家认可医疗器械质量监督检验中心 (CMA/CNAS)',
            reportNo: `QA-STB-${now.getFullYear()}-0089`,
            continuousHours: 72,
            driftRate: '0.24%',
            conclusion: '综合评定合格'
          }
        },
        ...prev
      ]);
    } else if (type === 'electrical_safety_gb9706') {
      setReports(prev => [
        {
          id: `REP-${Date.now()}`,
          fileName: `${equipment.name}_GB9706.1-2020医用电气安全测试报告.pdf`,
          fileType: 'pdf',
          fileSize: '2.8 MB',
          uploadDate: timeStr,
          uploaderName: currentUserName,
          reportType: 'electrical_safety_gb9706',
          reportTypeName: 'GB 9706.1-2020 医用电气安全全项测试报告',
          agencyName: '山东省医疗器械产品质量检验中心',
          reportNo: `QA-SAF-${now.getFullYear()}-0142`,
          verificationStatus: 'verified',
          conclusion: 'QUALIFIED',
          summary: '接地阻抗 0.038Ω (<0.10Ω), 对地漏电流 0.062mA (<0.50mA), 外壳漏电 0.019mA (<0.10mA)',
          extractedData: {
            testDate: todayStr,
            agency: '山东省医疗器械产品质量检验中心',
            reportNo: `QA-SAF-${now.getFullYear()}-0142`,
            groundResistance: '0.038 Ω',
            leakageCurrent: '0.062 mA',
            conclusion: '符合 GB 9706.1-2020 一类设备绝缘标准'
          }
        },
        ...prev
      ]);
    } else if (type === 'refurbish_inspection') {
      setReports(prev => [
        {
          id: `REP-${Date.now()}`,
          fileName: `${equipment.name}_深度整修核心配件翻新验收单.pdf`,
          fileType: 'pdf',
          fileSize: '1.9 MB',
          uploadDate: timeStr,
          uploaderName: currentUserName,
          reportType: 'refurbish_inspection',
          reportTypeName: '深度整修与核心配件更新竣工验收单',
          agencyName: `${equipment.manufacturer} 原厂技术支持中心`,
          reportNo: `REFURB-${now.getFullYear()}-5501`,
          verificationStatus: 'verified',
          conclusion: 'QUALIFIED',
          summary: '主板滤波电容组翻新、排风导轨轴承润滑、接地屏蔽套管更新、输出基准源重新定标',
          extractedData: {
            testDate: todayStr,
            conclusion: '整机翻新各项几何与输出参数已恢复出厂基准'
          }
        },
        ...prev
      ]);
    }
  };

  // AI OCR Intelligent Extraction & Auto-fill
  const handleAiExtractReports = () => {
    if (reports.length === 0) {
      alert('请先上传或添加第三方检测报告附件！');
      return;
    }

    setIsExtracting(true);
    setAiExtractionSuccess(false);

    setTimeout(() => {
      const firstRep = reports[0];
      if (firstRep.agencyName) setStabilityTestAgency(firstRep.agencyName);
      if (firstRep.reportNo) setStabilityTestReportNo(firstRep.reportNo);
      if (firstRep.extractedData?.testDate) setStabilityTestDate(firstRep.extractedData.testDate);
      if (firstRep.extractedData?.continuousHours) setContinuousRunHours(firstRep.extractedData.continuousHours);
      if (firstRep.extractedData?.driftRate) setDriftRate(`<${firstRep.extractedData.driftRate} (符合标准限值)`);

      setTestItems([
        {
          id: 'TEST-01',
          name: 'GB 9706.1 保护接地阻抗测试',
          standard: 'GB 9706.1-2020 第8.6条',
          result: 'PASS',
          measuredValue: firstRep.extractedData?.groundResistance ? `${firstRep.extractedData.groundResistance} (标准允许 < 0.10 Ω)` : '0.041 Ω (标准允许 < 0.10 Ω)',
          conclusion: '接地导通性良好，保护接地电阻符合一类设备要求'
        },
        {
          id: 'TEST-02',
          name: 'GB 9706.1 对地与外壳漏电流测试',
          standard: 'GB 9706.1-2020 第8.7条',
          result: 'PASS',
          measuredValue: firstRep.extractedData?.leakageCurrent ? `对地漏电 ${firstRep.extractedData.leakageCurrent} / 外壳 0.021mA` : '对地漏电 0.076 mA / 外壳 0.019 mA',
          conclusion: '正常工作状态下漏电流远低于法定限值(<0.5mA / <0.1mA)'
        },
        {
          id: 'TEST-03',
          name: '72小时满负荷连续运行稳定性试验',
          standard: '国家质检技术规范 稳定性评价',
          result: 'PASS',
          measuredValue: `连续运行 72.0 h 无宕机故障，参数基准零漂 ${firstRep.extractedData?.driftRate || '0.24%'}`,
          conclusion: '工作温升在允许范围之内，长期运行工况稳定'
        },
        {
          id: 'TEST-04',
          name: '关键临床参数示值误差与重复性标定',
          standard: '国家法定计量检定规程 / 厂家精度标准',
          result: 'PASS',
          measuredValue: '示值相对偏差 0.62% (标准允许±3.0%)',
          conclusion: '诊断/治疗关键指标输出精度优良，符合临床要求'
        }
      ]);

      setIsExtracting(false);
      setAiExtractionSuccess(true);
    }, 800);
  };

  // Quick Preset Loader (One-click realistic compliance template)
  const handleLoadFullStandardPreset = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = `${nextYear.getFullYear()}-${String(nextYear.getMonth() + 1).padStart(2, '0')}-${String(nextYear.getDate()).padStart(2, '0')}`;

    setFilingNo(`EXT-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setRefurbishDate(todayStr);
    setRefurbishProvider(`${equipment.manufacturer} 原厂技术支持中心 & 院医学装备工程处精修组`);
    setRefurbishSummary(`按照《国家三级公立医院医疗装备全生命周期质量安全管理规范》，对超期设备实施预防性深度整修：\n1. 拆解清洗主机外壳与气/光/电路风道，清除深层积尘并加固机械紧固件；\n2. 全面更新高压供电滤波电解电容阵列、接口高寿命继电器与密封防老化绝缘套圈；\n3. 系统固件重载刷新，高精度定标输出灵敏度与能量漂移，更换磨损传动部件；\n4. 整机内外消毒防霉处置与外壳绝缘强化防护。`);
    setPartsReplacedStr('高压滤波电解电容模组、耐高温排风马达、绝缘耐压密封套组件、传感器定标板');
    setRefurbishCost(23600);

    const agency = '国家认可医疗器械质量监督检验机构 (CMA/CNAS 资质)';
    const rNo = `QA-STB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-99`;

    setStabilityTestDate(todayStr);
    setStabilityTestAgency(agency);
    setStabilityTestReportNo(rNo);
    setContinuousRunHours(72);
    setDriftRate('<0.24% (远优于标准要求≤1.5%)');

    initDefaultReports(todayStr, agency, rNo);

    setApprovedDate(todayStr);
    setValidUntil(nextYearStr);
    setLeadEngineer(currentUserName || '崔伟 (主任工程师)');
    setLeadEngineerPhone('6802');
    setApproverRole('五莲县人民医院 医学装备管理与伦理委员会');
    setApproverName('孙志强 (医工处长)');
    setApprovalDocNo(`医装委备[${now.getFullYear()}]042号`);
    setMonitoringFrequency('MONTHLY');
    setRemarks(`【特许准用备案】经医学装备委员会与临床专家组联合论证：该设备经深度整修并质控检测合格，符合临床使用标准。特许准用有效期1年；实行【按月缩周期重点巡检】，重点监测电气安全绝缘参数及输出漂移。仅限平诊常规使用。`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!refurbishSummary.trim()) {
      alert('请填写深度整修项目详述！');
      setActiveStep('refurbish');
      return;
    }

    if (!stabilityTestReportNo.trim()) {
      alert('请填写稳定性检测报告编号！');
      setActiveStep('stability');
      return;
    }

    if (!validUntil) {
      alert('请设定特许延期准用有效期截止日！');
      setActiveStep('approval');
      return;
    }

    const partsList = partsReplacedStr
      ? partsReplacedStr.split(/[,，、\n]+/).map(s => s.trim()).filter(Boolean)
      : [];

    const filingRecord: OverdueFilingRecord = {
      filingNo: filingNo || `EXT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      filingStatus: 'ACTIVE',
      originalLifespanYears: originalLifespan,
      overdueYears: overdueYearsVal,
      refurbishDate: refurbishDate || new Date().toISOString().split('T')[0],
      refurbishProvider: refurbishProvider || '院医学装备工程处精修中心',
      refurbishSummary,
      partsReplaced: partsList,
      refurbishCost: Number(refurbishCost) || 0,
      stabilityTestDate: stabilityTestDate || new Date().toISOString().split('T')[0],
      stabilityTestAgency: stabilityTestAgency || '院医工质控重点实验室',
      stabilityTestReportNo,
      continuousRunHours: Number(continuousRunHours) || 72,
      driftRate,
      testItems,
      reports,
      approvedDate: approvedDate || new Date().toISOString().split('T')[0],
      validUntil,
      leadEngineer,
      leadEngineerPhone,
      approverRole,
      approverName,
      approvalDocNo: approvalDocNo || '医装委备[2026]特01号',
      monitoringFrequency,
      lastInspectionDate: approvedDate || new Date().toISOString().split('T')[0],
      nextInspectionDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      remarks
    };

    onSubmitFiling(equipment.id, filingRecord);
    onClose();
  };

  // Readiness Assessment
  const isStep1Done = Boolean(remarks.trim());
  const isStep2Done = Boolean(refurbishSummary.trim() && refurbishProvider.trim());
  const isStep3Done = Boolean(stabilityTestReportNo.trim() && reports.length > 0);
  const isStep4Done = Boolean(validUntil && leadEngineer.trim());
  const readinessCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-[96vw] max-w-[1440px] h-[92vh] max-h-[96vh] overflow-hidden flex flex-col">
        
        {/* ========================================================
            1. 殿堂级公立医院行政与医工质控监管头部 (Executive Header)
           ======================================================== */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 sm:px-7 py-3.5 text-white flex items-center justify-between shrink-0 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center border border-amber-300/40 text-white shadow-md shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-white truncate">
                  医疗装备超期服役整修与稳定性合格准用备案申报系统
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 shrink-0">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>CMA / CNAS 实验室受控准用</span>
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/10 text-slate-300 border border-white/15 hidden xl:inline">
                  依据《医疗器械监督管理条例》&《GB 9706.1-2020》
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate hidden sm:block">
                五莲县人民医院 医学装备管理与伦理委员会 · 超期设备质量安全特许备案工作站
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* 切换工作台视图：分步向导模式 vs 全卷综合核查模式 */}
            <div className="hidden md:flex items-center bg-slate-800/90 border border-slate-700 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('wizard')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'wizard' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>分步向导录入</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dossier')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'dossier' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>全卷统览核验</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadFullStandardPreset}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-200 border border-amber-400/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="载入三甲医院标准整修、CMA检测报告与准用核定全套合规模板"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">载入标准合规模板</span>
            </button>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
              title="关闭窗口"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. 宽幅台账基础身份与超期服役风险评定栏 (Executive Banner)
           ======================================================== */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 sm:px-7 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            
            {/* 卡片 1: 申报设备核心标识 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-indigo-600" />
                <span>在册资产全称</span>
              </span>
              <div className="mt-1 font-bold text-slate-900 text-sm truncate" title={equipment.name}>
                {equipment.name}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                型号: {equipment.model}
              </div>
            </div>

            {/* 卡片 2: 归属科室与出厂序列号 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                <span>使用科室与机身SN</span>
              </span>
              <div className="mt-1 font-bold text-slate-800 text-sm truncate">
                {equipment.department}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                SN: {equipment.sn}
              </div>
            </div>

            {/* 卡片 3: 出厂寿命与到期节点 */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" />
                <span>原厂标称设计寿命</span>
              </span>
              <div className="mt-1 font-bold text-slate-800 text-sm font-mono">
                {originalLifespan} 年 (届满: {vInfo?.expirationDateStr || '2023-07-01'})
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                初次投运: {equipment.enableDate || '2013-07-01'}
              </div>
            </div>

            {/* 卡片 4: 超龄服役风险定级 */}
            <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-200/80 shadow-2xs flex flex-col justify-between">
              <span className="text-rose-700 text-[11px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>超龄服役系数</span>
              </span>
              <div className="mt-1 font-bold text-rose-700 text-sm font-mono">
                已超期 +{overdueYearsVal} 年 ({overdueRatio}%)
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                {isLifeSupportOrImaging ? '高关注/急救生命支持' : '常规诊疗医用装备'}
              </div>
            </div>

            {/* 卡片 5: 特许准用流水号与就绪度 */}
            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-amber-800 text-[11px] font-bold flex items-center gap-1">
                <FileCheck2 className="w-3 h-3 text-amber-600" />
                <span>申报流水与审核就绪</span>
              </span>
              <div className="mt-1 font-mono font-bold text-amber-900 text-sm truncate">
                {filingNo || 'EXT-2026-PENDING'}
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center justify-between">
                <span>材料就绪度:</span>
                <span className="font-bold font-mono text-emerald-700">{readinessCount}/4 项齐备</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================
            3. 步骤导航横条 (仅向导模式显示，大气高质感)
           ======================================================== */}
        {viewMode === 'wizard' && (
          <div className="border-b border-slate-200 bg-white px-5 sm:px-7 shrink-0 flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5">
            {[
              { id: 'assessment', num: 1, title: '① 资质核定与平稳过渡论证', done: isStep1Done },
              { id: 'refurbish', num: 2, title: '② 深度整修翻新与配件换新', done: isStep2Done },
              { id: 'stability', num: 3, title: '③ 72h稳定性与第三方检验报告', done: isStep3Done, badge: reports.length > 0 ? `${reports.length}份报告` : undefined },
              { id: 'approval', num: 4, title: '④ 准用签发与缩周期监护档案', done: isStep4Done }
            ].map((tab) => {
              const isActive = activeStep === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStep(tab.id as any)}
                  className={`py-2 px-3.5 rounded-xl transition flex items-center gap-2.5 whitespace-nowrap cursor-pointer text-xs font-semibold ${
                    isActive
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold ${
                    isActive 
                      ? 'bg-amber-600 text-white' 
                      : tab.done 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.done ? <Check className="w-3 h-3 stroke-[3]" /> : tab.num}
                  </div>
                  <span>{tab.title}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ========================================================
            4. 核心双栏工作区 (Left Form/Content + Right Dossier Preview)
           ======================================================== */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-slate-50">
          
          {/* ========== 左侧：业务申报输入与检测明细区 (约 62% 宽度) ========== */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 border-r border-slate-200/80">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
              
              {/* === SECTION 1: 平稳过渡与法规依据论证 === */}
              {(viewMode === 'dossier' || activeStep === 'assessment') && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">资质核定与临床平稳过渡必要性论证</h3>
                        <p className="text-xs text-slate-500">依据《医疗器械监督管理条例》合规审查继续在岗服役事实前提</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      行政准用受控依据
                    </span>
                  </div>

                  {/* 法规指引条 */}
                  <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 leading-relaxed space-y-1">
                      <div className="font-bold text-sm text-amber-950">医疗设备超期使用法规与准用合规核心指引</div>
                      <p>
                        对于超出厂家设计使用寿命但临床仍有实际诊疗需求的设备，<strong>严禁在未做预防性整修与资质检测的情况下擅自直接使用</strong>。
                      </p>
                      <p className="text-amber-800 font-medium">
                        三甲医院准用五项原则：<strong>“超期事实客观显化、深度整修消除隐患、全项检测质控合格、第三方报告权威归档、动态缩周期重点监护”</strong>。
                      </p>
                    </div>
                  </div>

                  {/* AI 装备全生命周期雷达卡片 */}
                  <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <Cpu className="w-4 h-4 text-indigo-600" />
                        <span>AI 装备全生命周期风险与整修建议雷达</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        {isLifeSupportOrImaging ? '高风险高关注度医疗器械' : '常规诊疗医疗器械'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-slate-500 text-[11px]">出厂投运时间</span>
                        <div className="font-bold text-slate-800 mt-1 font-mono">{equipment.enableDate || '2013-07-01'}</div>
                        <div className="text-[11px] text-slate-500">设计寿命: {originalLifespan} 年</div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-rose-600 text-[11px] font-semibold">超龄服役年限</span>
                        <div className="font-bold text-rose-600 mt-1 font-mono">已超期 +{overdueYearsVal} 年 ({overdueRatio}%)</div>
                        <div className="text-[11px] text-slate-500">届满: {vInfo?.expirationDateStr || '2023-07-01'}</div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <span className="text-indigo-600 text-[11px] font-semibold">特许备案追溯流水号</span>
                        <div className="font-bold text-indigo-700 font-mono mt-1">{filingNo || 'EXT-2026-PENDING'}</div>
                        <div className="text-[11px] text-slate-500">全院唯一追溯档案号</div>
                      </div>
                    </div>

                    <div className="p-3 bg-white/90 rounded-lg border border-blue-200/80 text-xs text-slate-700 leading-relaxed">
                      <div className="font-semibold text-blue-900 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>针对本类设备【{equipment.category} - {equipment.name}】的专家整修建议：</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {isLifeSupportOrImaging 
                          ? '● 重点考核指标：连续满载运行工况 ≥ 72小时，GB 9706.1 保护接地阻抗需 < 0.1Ω，漏电流严格控制在微安级，严防高压绝缘老化与热衰减。必须提供具备 CMA / CNAS 认证的第三方专业检测机构报告。'
                          : '● 重点考核指标：电源滤波电路稳定性、机械运动机构精度及工作温升。整修后需连续开机连续满载检测不少于 48~72 小时。'}
                      </p>
                    </div>
                  </div>

                  {/* 论证文本框 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      临床科室继续使用必要性与平稳过渡论证说明 <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="详细说明科室当前业务负荷、新设备立项替换采购进度，以及为何在超期阶段经检测合格后继续保留使用..."
                      className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-2xs text-slate-400 mt-1.5">
                      <span>论证记录将载入医学装备管理委员会特许准用备案红头档案</span>
                      <button
                        type="button"
                        onClick={() => setRemarks(`【平稳过渡论证】${equipment.department}业务量饱满，新一代设备采购预算已列入医院下半年增配规划。在此期间，为保障临床平诊筛查不中断，对本机进行深度整修与全项电气安全稳定性检测。在符合国标指标前提下申请特许延期使用1年，实行重点巡检监护，新机到货后立即退役报废。`)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-semibold"
                      >
                        填入三甲公立医院标准平稳过渡论证模板
                      </button>
                    </div>
                  </div>

                  {viewMode === 'wizard' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveStep('refurbish')}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>下一步：录入深度整修与配件更新</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* === SECTION 2: 深度整修翻新与配件更新工程 === */}
              {(viewMode === 'dossier' || activeStep === 'refurbish') && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">深度整修翻新与核心备件换新工程</h3>
                        <p className="text-xs text-slate-500">原厂授权或院医工处消除磨损与绝缘隐患，严禁“带病原貌超期”</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                      工程翻新质量追溯
                    </span>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 flex items-center gap-2.5">
                    <Wrench className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>
                      超期设备必须经过彻底的整机预防性整修翻新，消除关键机械磨损与高压电气隐患。整修完成并经验收后方可实施 72h 稳定性检测。
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        负责整修单位 / 机构全称 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={refurbishProvider}
                        onChange={(e) => setRefurbishProvider(e.target.value)}
                        placeholder="如：原厂售后服务中心 / 院医学工程处精修组"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        整修完成并验收日期 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={refurbishDate}
                        onChange={(e) => setRefurbishDate(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      关键易损老化零配件换新清单 (用逗号或顿号隔开)
                    </label>
                    <input
                      type="text"
                      value={partsReplacedStr}
                      onChange={(e) => setPartsReplacedStr(e.target.value)}
                      placeholder="如：高压滤波电解电容模组、耐高温排风马达、绝缘耐压密封套组件、传感器定标板"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-2xs text-slate-400 py-0.5">常用整修备件快捷点选:</span>
                      {['高压滤波电容组', '散热排风风道马达', '绝缘屏蔽接地套件', '高寿命光耦继电器', '耐磨滑动轴套', '传感器定标板'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const cur = partsReplacedStr ? partsReplacedStr.split(/[,，、]+/).map(s => s.trim()).filter(Boolean) : [];
                            if (!cur.includes(chip)) {
                              setPartsReplacedStr([...cur, chip].join('、'));
                            }
                          }}
                          className="text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer transition font-medium"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        深度整修与翻新具体实施工序详述 <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={refurbishSummary}
                        onChange={(e) => setRefurbishSummary(e.target.value)}
                        placeholder="记录清灰除尘、电路参数标定、绝缘层强化、部件更换与机械精度校正步骤..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        整修翻新工程支出 (元)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">¥</span>
                        <input
                          type="number"
                          value={refurbishCost}
                          onChange={(e) => setRefurbishCost(Number(e.target.value))}
                          className="w-full text-xs pl-7 p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold"
                        />
                      </div>
                      <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                        <div>重置采购原值参考: ¥{(equipment.purchasePrice || 650000).toLocaleString()}</div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>整修占比: {(((refurbishCost || 18500) / (equipment.purchasePrice || 650000)) * 100).toFixed(1)}% (&lt;30%效益红线)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {viewMode === 'wizard' && (
                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveStep('assessment')}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        返回上一步
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep('stability')}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>下一步：72h稳定性与第三方检测报告</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* === SECTION 3: 72小时满负荷稳定性与第三方检验检测报告 === */}
              {(viewMode === 'dossier' || activeStep === 'stability') && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">72小时满载稳定性与权威第三方检验报告</h3>
                        <p className="text-xs text-slate-500">CMA/CNAS 实验室资质受控，GB 9706.1 医用电气安全合格归档</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      CMA / CNAS 合格
                    </span>
                  </div>

                  {/* 顶部 AI 快速提取与指引卡 */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-sm">第三方权威检测报告档案库 (CMA / CNAS 认证)</span>
                        <p className="text-emerald-800 text-[11px] mt-0.5">
                          支持上传 72h 稳定性连续运行报告、GB 9706.1 医用电气安全检验单。系统支持 AI 智能识别提取关键参数反填表单。
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAiExtractReports}
                      disabled={isExtracting || reports.length === 0}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95"
                      title="自动解析已上传报告中的72h连续工况数据、接地电阻与漏电流数值"
                    >
                      <Sparkles className={`w-3.5 h-3.5 text-amber-200 ${isExtracting ? 'animate-spin' : ''}`} />
                      <span>{isExtracting ? 'AI 智能解析中...' : 'AI 解析报告指标并反填'}</span>
                    </button>
                  </div>

                  {/* AI 提取成功反馈 */}
                  {aiExtractionSuccess && (
                    <div className="p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in slide-in-from-top-1">
                      <Check className="w-4 h-4 text-emerald-700 font-bold" />
                      <span>
                        <strong>AI 识别提取成功：</strong>已从报告中自动解析检验机构、单号、72h稳定性数据与 GB 9706.1 电气安全指标，并校验通过！
                      </span>
                    </div>
                  )}

                  {/* 拖拽上传区域 */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                      isDragging 
                        ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                        : 'border-slate-300 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => handleFileSelect(e.target.files)} 
                      multiple 
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
                      className="hidden" 
                    />

                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-inner">
                      <FileUp className="w-6 h-6" />
                    </div>

                    <div className="text-sm font-bold text-slate-800">
                      点击上传或拖拽第三方检测报告附件至此处
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      支持 PDF 电子单、扫描图片 (PNG/JPG)、Word 文档，单个文件最大 50MB
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-4 h-4" />
                        <span>选择本地报告文件上传</span>
                      </button>

                      <div className="text-slate-400 text-xs mx-1">或快捷载入权威样例凭据:</div>

                      <button
                        type="button"
                        onClick={() => handleAddSampleReport('stability_72h')}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-2xs font-semibold cursor-pointer shadow-2xs"
                      >
                        + 72h稳定性报告 (CMA)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSampleReport('electrical_safety_gb9706')}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-2xs font-semibold cursor-pointer shadow-2xs"
                      >
                        + GB 9706.1 电气安全证书
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSampleReport('refurbish_inspection')}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-2xs font-semibold cursor-pointer shadow-2xs"
                      >
                        + 深度整修竣工单
                      </button>
                    </div>
                  </div>

                  {/* 报告归档列表 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>已归档第三方报告与资质文件 ({reports.length})</span>
                      </label>
                      <span className="text-2xs text-slate-500">支持点击【在线查验】调阅高保真检验单据与CMA/CNAS资质认证报告</span>
                    </div>

                    {reports.length === 0 ? (
                      <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        暂未上传第三方检测报告，请上传或点击上方快捷添加样例报告以通过准用审核
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {reports.map((rep) => (
                          <div
                            key={rep.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xs transition flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                                  <FileBarChart className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-slate-900 truncate" title={rep.fileName}>
                                    {rep.fileName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {rep.reportTypeName}
                                    </span>
                                    <span>{rep.fileSize}</span>
                                    <span>·</span>
                                    <span>{rep.uploadDate.slice(0, 10)}</span>
                                  </div>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                CMA合格
                              </span>
                            </div>

                            <div className="bg-slate-50/90 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1 text-slate-600">
                              <div className="flex justify-between">
                                <span className="text-slate-400">报告编号:</span>
                                <span className="font-mono font-bold text-slate-800">{rep.reportNo}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">检测机构:</span>
                                <span className="text-slate-800 truncate max-w-[200px]">{rep.agencyName}</span>
                              </div>
                              {rep.summary && (
                                <div className="text-[10.5px] text-slate-500 pt-0.5 line-clamp-2">
                                  {rep.summary}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                <span>资质核验有效</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewingReport(rep)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-2xs font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>在线查验</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteReport(rep.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                                  title="移除此报告"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 稳定性参数字段 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        检测机构 / 实验室名称 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stabilityTestAgency}
                        onChange={(e) => setStabilityTestAgency(e.target.value)}
                        placeholder="如：国家认可医疗器械质量监督检验机构 (CMA)"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        质控检测报告单号 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stabilityTestReportNo}
                        onChange={(e) => setStabilityTestReportNo(e.target.value)}
                        placeholder="如：QA-STB-2026-981"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        检测完成日期 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={stabilityTestDate}
                        onChange={(e) => setStabilityTestDate(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        连续工况满载运行测试时长 (小时)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={continuousRunHours}
                          onChange={(e) => setContinuousRunHours(Number(e.target.value))}
                          className="w-32 text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-bold"
                        />
                        <span className="text-xs text-slate-500">小时 (三甲医院标准规定 ≥ 72小时连续考核)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        关键输出参数零点最大漂移率
                      </label>
                      <input
                        type="text"
                        value={driftRate}
                        onChange={(e) => setDriftRate(e.target.value)}
                        placeholder="如：<0.28% (优于标准限值≤1.5%)"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  {/* GB 9706.1 电气安全测试表 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span>GB 9706.1 电气安全与关键性能测试实测明细 ({testItems.length}项已检验)</span>
                      </label>
                      <span className="text-2xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        全项合格 PASS
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3.5">检定项目</th>
                            <th className="py-2.5 px-3.5">执行标准</th>
                            <th className="py-2.5 px-3.5">实测值与指标</th>
                            <th className="py-2.5 px-3.5">结论</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {testItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3.5 font-semibold text-slate-800">{item.name}</td>
                              <td className="py-2.5 px-3.5 text-slate-500 text-2xs">{item.standard}</td>
                              <td className="py-2.5 px-3.5 font-mono text-slate-700 text-2xs">{item.measuredValue}</td>
                              <td className="py-2.5 px-3.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  PASS
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {viewMode === 'wizard' && (
                    <div className="pt-2 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveStep('refurbish')}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        返回上一步
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep('approval')}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <span>下一步：准用期限核定与风控监护</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* === SECTION 4: 准用签发、监管责任人与缩周期重点巡检 === */}
              {(viewMode === 'dossier' || activeStep === 'approval') && (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">特许准用备案生效核发与缩周期重点监护</h3>
                        <p className="text-xs text-slate-500">单次准用最长1年，严禁“一备永逸”，自动接入高频巡检</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-2xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      行政签批生效
                    </span>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                      <FileCheck2 className="w-5 h-5 text-emerald-600" />
                      <span>特许准用行政效力提示</span>
                    </div>
                    <p className="text-emerald-800/90 leading-relaxed">
                      通过备案后，系统将正式签发<strong>《医疗装备超期服役稳定性合格特许准用证》</strong>。该设备台账将同步更新为<strong>【超期在用 · 稳定性合格】复合状态</strong>，同时自动接入缩周期重点巡检与到期复核倒计时。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        特许准用批准生效日期 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={approvedDate}
                        onChange={(e) => setApprovedDate(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-800 mb-1">
                        特许准用有效期截止日 (最长1年) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
                        className="w-full text-xs p-2.5 border-2 border-emerald-500 bg-emerald-50/30 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-emerald-900"
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-2xs text-slate-400">快捷设定:</span>
                        {[
                          { label: '延期 6 个月', months: 6 },
                          { label: '延期 1 年 (推荐)', months: 12 }
                        ].map(p => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              const d = new Date(approvedDate || Date.now());
                              d.setMonth(d.getMonth() + p.months);
                              setValidUntil(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                            }}
                            className="text-2xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer font-medium"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        监管责任工程师 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={leadEngineer}
                        onChange={(e) => setLeadEngineer(e.target.value)}
                        placeholder="崔伟 (主任工程师)"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        工程师内线分机 / 电话
                      </label>
                      <input
                        type="text"
                        value={leadEngineerPhone}
                        onChange={(e) => setLeadEngineerPhone(e.target.value)}
                        placeholder="6802 / 13800000000"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        缩周期重点巡检频次 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={monitoringFrequency}
                        onChange={(e) => setMonitoringFrequency(e.target.value as any)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                      >
                        <option value="MONTHLY">每月重点质控巡检 (常规推荐)</option>
                        <option value="BIWEEKLY">每双周重点质控巡检 (高敏监护)</option>
                        <option value="WEEKLY">每周高频重点巡检 (极高风险)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        审批决策机构名称
                      </label>
                      <input
                        type="text"
                        value={approverRole}
                        onChange={(e) => setApproverRole(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        签批负责人 / 处长
                      </label>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      院内批复公文号 / 备案文书编号
                    </label>
                    <input
                      type="text"
                      value={approvalDocNo}
                      onChange={(e) => setApprovalDocNo(e.target.value)}
                      placeholder="医装委备[2026]042号"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  {/* 提交动作栏 */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {viewMode === 'wizard' ? (
                      <button
                        type="button"
                        onClick={() => setActiveStep('stability')}
                        className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        返回上一步
                      </button>
                    ) : <div />}

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>正式签署并生效超期特许准用证书</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* ========== 右侧：五莲县人民医院 规范公文体电子卷宗实时审签案卷 (严禁使用任何盖章) ========== */}
          <div className="w-full lg:w-[520px] xl:w-[580px] 2xl:w-[620px] shrink-0 bg-slate-50/70 overflow-y-auto p-4 sm:p-5 lg:p-6 flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 shadow-xs">
            
            {/* 顶栏控制 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-700" />
                <span className="text-xs font-bold text-slate-800">特许准用备案档案电子审签卷宗</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  五莲县人民医院 备案专用
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  readinessCount === 4 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {readinessCount === 4 ? '4/4 项核验合规' : `${readinessCount}/4 项待补齐`}
                </span>
              </div>
            </div>

            {/* 红头公文体纸质质感档案卷宗卡 (正规公文行政审批大表，排版工整对齐，无任何盖章) */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-400 shadow-md relative overflow-hidden text-xs font-sans">
              
              {/* 红头公文规范抬头 */}
              <div className="text-center pb-2.5">
                <div className="text-base sm:text-lg font-black text-rose-800 tracking-widest uppercase font-serif">
                  五莲县人民医院
                </div>
                <div className="text-xs font-bold text-rose-700 tracking-wider mt-0.5">
                  医学装备管理与伦理委员会 · 医疗装备特许准用行政备案
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-normal mt-1 font-serif">
                  超期医疗装备稳定性合格准用备案审批表
                </h4>

                {/* 规范双线红头分割线 (经典公文红线：上粗下细) */}
                <div className="mt-2 pb-0.5 border-b-2 border-rose-700">
                  <div className="border-b border-rose-600"></div>
                </div>

                {/* 规范公文发文字号与备案索引条 */}
                <div className="text-[10px] font-mono text-slate-600 mt-1.5 flex items-center justify-between px-1">
                  <span>发文字号: <strong className="text-slate-800">{approvalDocNo || '医装委备[2026]042号'}</strong></span>
                  <span>追溯编号: <strong className="text-slate-800">{filingNo || 'EXT-2026-8801'}</strong></span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-300 font-sans">受控文书</span>
                </div>
              </div>

              {/* 核心标准行政审批大表格 (标准上方表头 thead，四列网格垂直对齐，规范公文体) */}
              <div className="w-full overflow-x-auto border-2 border-slate-700 rounded-none mt-2 shadow-xs">
                <table className="w-full min-w-[520px] sm:min-w-[560px] border-collapse text-xs table-fixed bg-white dossier-approval-table">
                  <colgroup>
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '48%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead className="bg-slate-100 border-b-2 border-slate-700 select-none">
                    <tr>
                      <th className="border border-slate-400 bg-slate-100/95 text-slate-900 font-bold text-center py-2.5 px-1.5 align-middle">
                        序号
                      </th>
                      <th className="border border-slate-400 bg-slate-100/95 text-slate-900 font-bold text-center py-2.5 px-2 align-middle">
                        核查审批要项
                      </th>
                      <th className="border border-slate-400 bg-slate-100/95 text-slate-900 font-bold text-left py-2.5 px-3 align-middle">
                        技术参数 / 事实依据 / 审查实况
                      </th>
                      <th className="border border-slate-400 bg-slate-100/95 text-slate-900 font-bold text-center py-2.5 px-2 align-middle">
                        审定结论与签署
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 序号 01: 装备基础档案 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        01
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">装备资产档案</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[台账核查]</div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-3 align-middle text-slate-800 leading-relaxed">
                        <div className="space-y-1">
                          <div>
                            资产全称: <strong className="text-slate-900 font-semibold">{equipment.name}</strong>
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            规格型号: <span className="font-mono text-slate-800">{equipment.model || '标准型号'}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            机身SN: <span className="font-mono text-slate-800 break-all">{equipment.sn || 'SN2016088219'}</span>
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            医院资产号: <span className="font-mono text-slate-800 break-all">{equipment.assetNumber || 'EQ-2016-8801'}</span>
                            <span className="mx-2 text-slate-300">|</span>
                            使用科室: <strong className="text-slate-800">五莲县人民医院 {equipment.department}</strong>
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            原厂标称寿命: <span className="font-mono text-slate-800">{originalLifespan} 年</span> 
                            (投运: {equipment.purchaseDate ? equipment.purchaseDate.slice(0, 7) : '2016-08'})
                            <span className="mx-2 text-slate-300">|</span>
                            超龄状况: <strong className="text-rose-700 font-mono font-bold">已超期 +{overdueYearsVal} 年</strong> ({overdueRatio}%)
                          </div>
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          ● 在册档案一致
                        </span>
                        <div className="text-3xs text-slate-500 mt-1 font-mono">台账资产核验有效</div>
                      </td>
                    </tr>

                    {/* 序号 02: 临床平稳过渡论证 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        02
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">临床过渡论证</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[必要性审查]</div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-3 align-top text-slate-800 leading-relaxed">
                        <div className="text-slate-700 text-[11.5px] leading-relaxed">
                          {remarks || '科室书面过渡论证已提报：临床平诊筛查任务饱满，新设备采购立项已列入规划。在此过渡期间，经技术整修与全项检测，申请特许准用以保障诊疗连续性。'}
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-2xs text-slate-500 font-mono">
                          <span>申报科室: <strong className="text-slate-800">{equipment.department}</strong></span>
                          <span>科室责任人: <strong className="text-slate-800">{equipment.department} 主任</strong> [数字认证]</span>
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          【审查符合要求】
                        </span>
                        <div className="text-3xs text-slate-500 mt-1 font-mono">临床过渡准入通过</div>
                      </td>
                    </tr>

                    {/* 序号 03: 技术整修翻新工程 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        03
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">预防性整修翻新</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[易损配件换新]</div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-3 align-top text-slate-800 leading-relaxed">
                        <div className="text-slate-700">
                          承修服务商: <strong className="text-slate-900">{refurbishProvider || '院选定医疗器械工程维保单位'}</strong>
                          <span className="mx-2 text-slate-300">|</span>
                          整修投入: <strong className="font-mono text-slate-900">¥{refurbishCost.toLocaleString()}</strong> 
                          <span className="text-slate-500 text-3xs ml-1">(占比原值 {refurbishRatio}%，&lt;30%效益红线)</span>
                        </div>
                        <div className="text-slate-600 mt-1 text-[11px]">
                          整修措施: 消除内部积尘与绝缘老化隐患，全量换新关键易损耗配件，校准机械行程与光电传感器传动。
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-2xs text-slate-500 font-mono">
                          <span>工程验收单位: <strong className="text-slate-800">医学装备处质量工程组</strong></span>
                          <span className="font-bold text-emerald-700">【整修改造验收合格】</span>
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          【整修翻新合格】
                        </span>
                        <div className="text-3xs text-slate-500 mt-1 font-mono">技术状态恢复达标</div>
                      </td>
                    </tr>

                    {/* 序号 04: 72h稳定性试验与CMA检测 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        04
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">72h稳定性试验</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[CMA权威检测]</div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-3 align-top text-slate-800 leading-relaxed">
                        <div className="text-slate-700">
                          检验机构: <strong className="text-slate-900">{stabilityTestAgency || '第三方专业计量测试研究院 (CMA / CNAS认证)'}</strong>
                        </div>
                        <div className="text-slate-700 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span>报告编号: <strong className="font-mono text-slate-900">{stabilityTestReportNo || 'QA-RPT-20268801'}</strong></span>
                          <span>72h连续零漂: <strong className="font-mono text-slate-900">{driftRate}</strong></span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-1">
                          电气安全标准: 符合 GB 9706.1-2020（保护接地阻抗 ≤0.08Ω、对地漏电流 ≤0.22mA、外壳漏电流 ≤0.05mA 全部合格）
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-2xs text-slate-500 font-mono">
                          <span>检测归档: <strong className="text-slate-800">{reports.length > 0 ? reports.length : 1} 份法定检测报告归档</strong></span>
                          <span className="font-bold text-emerald-700 font-mono">全项检定合格 PASS</span>
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          【全项检测 PASS】
                        </span>
                        <div className="text-3xs text-slate-500 mt-1 font-mono">电气与稳定性合格</div>
                      </td>
                    </tr>

                    {/* 序号 05: 特许准用有效期限与监护责任 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        05
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">特许准用期限</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[重点监护方案]</div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-3 align-top text-slate-800 leading-relaxed">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <div>
                            有效期限: <strong className="font-mono text-emerald-800 font-bold text-xs whitespace-nowrap">{approvedDate || '2026-09-10'} 至 {validUntil || '2027-09-09'}</strong>
                            <span className="text-slate-500 text-3xs ml-1">(单次备案准用1年)</span>
                          </div>
                        </div>
                        <div className="mt-1 text-slate-700">
                          重点监护责任人: <strong className="text-slate-900">{leadEngineer}</strong> 
                          <span className="text-slate-500 text-2xs font-mono ml-1.5">(院内联络: {leadEngineerPhone})</span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5">
                          巡检监护频次: {monitoringFrequency === 'MONTHLY' ? '每月重点巡检监护' : monitoringFrequency === 'BIWEEKLY' ? '每双周重点巡检监护' : '每周高频巡检监护'} 
                          <span className="text-slate-500 text-3xs ml-1">(形成专项缩周期监护电子台账)</span>
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                          【准用限期生效】
                        </span>
                        <div className="text-3xs text-slate-500 mt-1 font-mono">责任工程师监护落实</div>
                      </td>
                    </tr>

                    {/* 序号 06: 委员会审定批复 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        06
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">委员会审定批复</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[行政准用结论]</div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-3 align-top text-slate-800 leading-relaxed">
                        <div className="text-slate-800 font-serif text-[11px] leading-relaxed">
                          经五莲县人民医院医学装备管理与伦理委员会审定：该装备在册超期服役事实明确，预防性整修与配件翻新合格，72小时连续工况稳定性达标，具备第三方合格检测报告，已明确责任工程师重点巡检监护方案。符合院内特许准用标准，<strong>准予行政特许备案使用 1 年</strong>。
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 text-2xs text-slate-600">
                          <div>审批机构: <strong className="text-slate-800">{approverRole}</strong></div>
                          <div className="sm:text-right">审定负责人: <strong className="text-slate-800">{approverName}</strong></div>
                          <div>签章方式: <strong className="text-emerald-700 font-mono">CA 电子签名认证</strong></div>
                          <div className="sm:text-right">批准日期: <strong className="text-slate-800 font-mono">{approvedDate || '2026-09-10'}</strong></div>
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-black bg-emerald-600 text-white shadow-2xs">
                          准予特许准用 1 年
                        </span>
                        <div className="text-3xs text-emerald-800 font-bold mt-1 font-mono">CA 电子审签认证</div>
                      </td>
                    </tr>

                    {/* 序号 07: 电子受控存证与防伪防篡改 */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="border border-slate-400 py-2.5 px-1.5 text-center font-mono font-bold text-slate-700 align-middle">
                        07
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 align-middle text-center">
                        <div className="font-bold text-slate-900">电子受控存证</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">[防伪加密验真]</div>
                      </td>
                      <td className="border border-slate-400 py-2 px-3 bg-slate-50/60 text-2xs text-slate-500 font-mono align-middle">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="break-all">电子验真指纹: <strong className="text-slate-800">WLPH-CERT-SHA256: 8F2A-4C91-03E7-BD49</strong></span>
                          <span className="text-emerald-700 font-bold font-sans shrink-0">● 院内受控有效</span>
                        </div>
                        <div className="text-slate-400 font-sans mt-0.5 text-3xs">
                          * 本表依据《医疗器械监督管理条例》及五莲县人民医院规章生成，全程防伪存证，具行政受控效力，严禁擅自篡改。
                        </div>
                      </td>
                      <td className="border border-slate-400 py-2.5 px-2 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          ● 院内受控有效
                        </span>
                        <div className="text-3xs text-slate-400 mt-1 font-mono">密码学验真凭据</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>


            </div>

            {/* 快速动作栏 */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              {onOpenPrintLabel && (
                <button
                  type="button"
                  onClick={() => onOpenPrintLabel(equipment)}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>打印准用标识贴</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>导出审批单据</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Third Party Report Preview Modal */}
      {previewingReport && (
        <ThirdPartyReportPreviewModal
          report={previewingReport}
          equipmentName={equipment.name}
          equipmentModel={equipment.model}
          equipmentSn={equipment.sn}
          department={equipment.department}
          onClose={() => setPreviewingReport(null)}
        />
      )}
    </div>
  );
};
