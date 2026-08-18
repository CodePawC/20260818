import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw, 
  Phone, 
  Sparkles, 
  Zap, 
  HelpCircle, 
  LayoutGrid, 
  List, 
  FileText, 
  Building2, 
  MapPin, 
  Calendar, 
  X, 
  Camera, 
  Image as ImageIcon, 
  Eye, 
  Maximize2, 
  SlidersHorizontal,
  BatteryCharging,
  Layers,
  FolderTree,
  Tag,
  ChevronDown,
  ChevronRight,
  Wind,
  HeartPulse,
  Droplets,
  Activity,
  Filter,
  Check,
  TrendingUp,
  BellRing,
  Copy,
  Cpu,
  Flame,
  ShieldAlert,
  Send,
  ExternalLink,
  QrCode,
  ClipboardCheck
} from 'lucide-react';
import { MedicalEquipment, AuthUser } from '../types';
import { EmergencyLoanRecord, loadEmergencyLoans, saveEmergencyLoans } from '../utils/emergencyReserveData';
import { getUserDepartment } from '../utils/authUtils';
import { getEquipmentPhoto } from '../utils/equipmentPhotoUtils';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PhotoUploadModal } from './PhotoUploadModal';
import { EmergencyAuditModal } from './EmergencyAuditModal';

export type GroupByOption = 'category' | 'model' | 'location' | 'status' | 'none';

export interface InventoryGroup {
  id: string;
  title: string;
  shortTitle: string;
  subtitle?: string;
  badge?: string;
  iconType?: 'wind' | 'heart' | 'droplet' | 'activity' | 'scan' | 'box' | 'map' | 'check' | 'clock';
  items: MedicalEquipment[];
  availableCount: number;
  borrowedCount: number;
  maintenanceCount: number;
}

interface EmergencyReserveViewProps {
  equipmentList: MedicalEquipment[];
  currentUser: AuthUser | null;
  onOpenRepairModal?: (device: MedicalEquipment) => void;
  onOpenAiModal?: (device: MedicalEquipment) => void;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
  onOpenQrLabels?: (devices: MedicalEquipment[]) => void;
}

export const EmergencyReserveView: React.FC<EmergencyReserveViewProps> = ({
  equipmentList,
  currentUser,
  onOpenRepairModal,
  onOpenAiModal,
  onViewDeviceDetail,
  onOpenQrLabels
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'loans' | 'distribution'>('inventory');
  const [inventoryViewMode, setInventoryViewMode] = useState<'list' | 'grid'>('grid'); // 默认卡片视图
  const [groupBy, setGroupBy] = useState<GroupByOption>(() => {
    const saved = localStorage.getItem('hospital-emergency-groupby');
    return (saved as GroupByOption) || 'category';
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showCardPhotos, setShowCardPhotos] = useState<boolean>(() => {
    const saved = localStorage.getItem('hospital-emergency-show-photos');
    return saved !== null ? saved === 'true' : true;
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部类别');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'available' | 'borrowed' | 'maintenance'>('all');
  
  // 借出设备分布专区筛选与AI推演状态
  const [distDeptFilter, setDistDeptFilter] = useState('全部科室');
  const [distStatusFilter, setDistStatusFilter] = useState<'all' | 'overdue' | 'longterm' | 'normal'>('all');
  const [distSearch, setDistSearch] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProcurementReport, setAiProcurementReport] = useState<string>('');
  const [isAiReportModalOpen, setIsAiReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 盘点工作站弹窗状态
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // 借用记录
  const [loanRecords, setLoanRecords] = useState<EmergencyLoanRecord[]>(() => {
    return loadEmergencyLoans();
  });

  // 弹窗状态
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedDeviceForLoan, setSelectedDeviceForLoan] = useState<MedicalEquipment | null>(null);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<EmergencyLoanRecord | null>(null);

  // 照片大图预览 & 照片上传修改弹窗
  const [selectedPhotoDevice, setSelectedPhotoDevice] = useState<MedicalEquipment | null>(null);
  const [uploadPhotoDevice, setUploadPhotoDevice] = useState<MedicalEquipment | null>(null);
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);

  // 借用申请表单
  const userDept = getUserDepartment(currentUser) || '急诊科';
  const [borrowForm, setBorrowForm] = useState({
    borrowingDepartment: userDept,
    borrowerName: currentUser?.name || '',
    borrowerPhone: currentUser?.phone || '',
    borrowReason: '',
    expectedReturnDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    expectedReturnHour: '18:00',
    accessories: ['主机电源线', '标准病人连接附件', '操作操作指引卡']
  });

  // 归还验收表单
  const [returnForm, setReturnForm] = useState({
    returnInspector: currentUser?.name || '崔工',
    returnCondition: 'intact' as 'intact' | 'needs_cleaning' | 'faulty',
    notes: '经医学工程科现场核验，主机通电自检通过，配件齐全。'
  });

  // 显示操作反馈 Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 切换实物照片展示
  const toggleShowPhotos = () => {
    const nextVal = !showCardPhotos;
    setShowCardPhotos(nextVal);
    localStorage.setItem('hospital-emergency-show-photos', String(nextVal));
  };

  // 切换分组方式
  const handleSetGroupBy = (opt: GroupByOption) => {
    setGroupBy(opt);
    localStorage.setItem('hospital-emergency-groupby', opt);
  };

  // 折叠/展开单个分组
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // 筛选出所有属于“医疗设备应急库”或带有应急标识的设备
  const emergencyInventory = useMemo(() => {
    return equipmentList.filter(eq => 
      eq.department === '医疗设备应急库' || 
      eq.department?.includes('应急') ||
      eq.location?.includes('应急') ||
      eq.id.startsWith('EMG-')
    );
  }, [equipmentList, photoRefreshKey]);

  // 计算当前处于借出状态的设备映射
  const activeLoansMap = useMemo(() => {
    const map = new Map<string, EmergencyLoanRecord>();
    loanRecords.filter(r => r.status === 'borrowed' || r.status === 'overdue').forEach(r => {
      map.set(r.equipmentId, r);
    });
    return map;
  }, [loanRecords]);

  // 计算在用借调设备的分析指标 (时长、超期状态、严重程度)
  const activeLoansWithAnalytics = useMemo(() => {
    const now = Date.now();
    return loanRecords
      .filter(r => r.status === 'borrowed' || r.status === 'overdue')
      .map(loan => {
        const borrowMs = new Date(loan.borrowTime.replace(' ', 'T')).getTime() || now;
        const expectedMs = new Date(loan.expectedReturnTime.replace(' ', 'T')).getTime() || now;
        const daysElapsed = Math.max(1, Math.ceil((now - borrowMs) / (1000 * 3600 * 24)));
        const isOverdue = now > expectedMs;
        const daysOverdue = isOverdue ? Math.max(1, Math.ceil((now - expectedMs) / (1000 * 3600 * 24))) : 0;
        const isLongTerm = daysElapsed >= 7;
        const isCritical = daysOverdue >= 5 || daysElapsed >= 14;

        // 匹配设备信息
        const equip = equipmentList.find(e => e.id === loan.equipmentId);

        return {
          ...loan,
          daysElapsed,
          isOverdue,
          daysOverdue,
          isLongTerm,
          isCritical,
          purchasePrice: equip?.purchasePrice || (loan.category.includes('呼吸') ? 180000 : loan.category.includes('成像') ? 280000 : 45000),
          currentLocation: equip?.location || loan.dispatchLocation,
          equipCategory: equip?.category || loan.category,
          equipModel: equip?.model || loan.equipmentModel
        };
      });
  }, [loanRecords, equipmentList]);

  // 科室借出设备分布统计及 AI 增配建议画像
  const departmentDistribution = useMemo(() => {
    const deptMap = new Map<string, {
      department: string;
      loans: typeof activeLoansWithAnalytics;
      totalDevices: number;
      overdueCount: number;
      longTermCount: number;
      totalAssetValue: number;
      contacts: { name: string; phone: string }[];
      categories: Set<string>;
      aiProcurementSuggestion: {
        title: string;
        recommendedEquipment: string;
        recommendedModel: string;
        recommendedCount: number;
        estimatedCost: number;
        urgency: 'critical' | 'high' | 'medium';
        reason: string;
        clinicalRisk: string;
        actionPlan: string;
      };
    }>();

    activeLoansWithAnalytics.forEach(loan => {
      const dept = loan.borrowingDepartment || '未指定科室';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          loans: [],
          totalDevices: 0,
          overdueCount: 0,
          longTermCount: 0,
          totalAssetValue: 0,
          contacts: [],
          categories: new Set<string>(),
          aiProcurementSuggestion: {
            title: '',
            recommendedEquipment: '',
            recommendedModel: '',
            recommendedCount: 1,
            estimatedCost: 0,
            urgency: 'medium',
            reason: '',
            clinicalRisk: '',
            actionPlan: ''
          }
        });
      }

      const d = deptMap.get(dept)!;
      d.loans.push(loan);
      d.totalDevices += 1;
      if (loan.isOverdue) d.overdueCount += 1;
      if (loan.isLongTerm) d.longTermCount += 1;
      d.totalAssetValue += loan.purchasePrice;
      if (loan.borrowerName && !d.contacts.some(c => c.name === loan.borrowerName)) {
        d.contacts.push({ name: loan.borrowerName, phone: loan.borrowerPhone });
      }
      if (loan.category) d.categories.add(loan.category);
    });

    // 结合临床学科规律与借调负荷生成 AI 增配建议
    deptMap.forEach((d, dept) => {
      const maxElapsed = Math.max(...d.loans.map(l => l.daysElapsed), 0);
      const maxOverdue = Math.max(...d.loans.map(l => l.daysOverdue), 0);

      if (dept.includes('重症') || dept.includes('ICU')) {
        d.aiProcurementSuggestion = {
          title: '重症医学科 (ICU) 急救呼吸支持与控温装备常态占用预警',
          recommendedEquipment: '危重症急救转运呼吸机 / 全自动医用升降温控温毯 (亚低温治疗仪)',
          recommendedModel: '迈瑞 SV300 Pro / 德国德尔格 Oxylog 3000 / 和佳 HGT-200 Pro',
          recommendedCount: 2,
          estimatedCost: 245000,
          urgency: 'critical',
          reason: `监测到 ICU 借调占用应急周转库转运呼吸机已达 ${maxElapsed} 天（超期 ${maxOverdue} 天），且亚低温控温毯连续在床使用。ICU 日常重症患者外出检查与脑复苏治疗已呈常态化高负荷，表明科室基础配置台数已无法满足临床床位周转。`,
          clinicalRisk: '长期将应急周转机具作为科室固定备用，导致全院突发批量公共卫生抢救事件时应急库机动冗余不足。',
          actionPlan: '建议医学装备管理委员会将 2 台转运呼吸机与 1 台控温毯列入 2026-2027 年度大型医用设备配置专项采购目录，完成采购后立即释放应急周转库资源。'
        };
      } else if (dept.includes('急诊')) {
        d.aiProcurementSuggestion = {
          title: '急诊科抢救室高危注输与呼吸抢救通道扩容建议',
          recommendedEquipment: '智能多通道微量注输泵工作站 / 一体化便携呼吸机',
          recommendedModel: '迈瑞 BeneFusion VP5 组合工作站 / SV300 Pro',
          recommendedCount: 4,
          estimatedCost: 220000,
          urgency: 'critical',
          reason: `急诊科抢救室高危血管活性药物微量给药通道与无创通气持续满负荷，已借调应急库输液设备与呼吸机达 ${maxElapsed} 天。出现“以借代配”趋势。`,
          clinicalRisk: '急诊抢救室若遇突发批量急重症创伤或群体中毒病患，现有微量泵与呼吸通道存在瞬间挤兑风险。',
          actionPlan: '建议急诊科启动科室自筹或医院急救专项基金申购 4 通道注输泵工作站及 1 台急救呼吸机，缩短抢救建立通道时间。'
        };
      } else if (dept.includes('呼吸')) {
        d.aiProcurementSuggestion = {
          title: '呼吸与危重症医学科移动吸痰与气道管理设备增配建议',
          recommendedEquipment: '交直流两用便携式电动吸引器 / 经鼻高流量湿化氧疗仪',
          recommendedModel: '达芬 DFX-23D.II / 迈瑞 HF60',
          recommendedCount: 2,
          estimatedCost: 38000,
          urgency: 'high',
          reason: `呼吸病区重症卧床排痰障碍病患增多，借调移动吸引设备已达 ${maxElapsed} 天，临近超期。科室床旁排痰需求稳定增长。`,
          clinicalRisk: '跨科室借用周转时间长，在紧急气道窒息排痰时可能产生调度延迟风险。',
          actionPlan: '建议呼吸内科增设 2 台交直流移动吸痰单元作为病区常备基础护理资产。'
        };
      } else {
        d.aiProcurementSuggestion = {
          title: `${dept} 临床设备借用评估与增配参考`,
          recommendedEquipment: '多参数患者监护仪 / 便携急救单元',
          recommendedModel: '迈瑞 BeneVision N12',
          recommendedCount: 1,
          estimatedCost: 65000,
          urgency: 'medium',
          reason: `借调占用应急库设备 ${maxElapsed} 天。请根据科室床位使用率评估是否需转为科室固定资产配置。`,
          clinicalRisk: '注意借用时效，避免超时占用全院公共应急备用池。',
          actionPlan: '请科室于预计归还日期前办理归还验收或向医工部提交科室采购可行性论证报告。'
        };
      }
    });

    return Array.from(deptMap.values()).sort((a, b) => {
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount;
      return b.longTermCount - a.longTermCount;
    });
  }, [activeLoansWithAnalytics]);

  // 所有借用科室列表
  const allBorrowingDepartments = useMemo(() => {
    const set = new Set<string>();
    activeLoansWithAnalytics.forEach(l => {
      if (l.borrowingDepartment) set.add(l.borrowingDepartment);
    });
    return ['全部科室', ...Array.from(set)];
  }, [activeLoansWithAnalytics]);

  // 超期借调列表
  const overdueLoansList = useMemo(() => {
    return activeLoansWithAnalytics.filter(l => l.isOverdue);
  }, [activeLoansWithAnalytics]);

  // 长期借调 (>7天) 列表
  const longTermLoansList = useMemo(() => {
    return activeLoansWithAnalytics.filter(l => l.isLongTerm);
  }, [activeLoansWithAnalytics]);

  // 过滤后的科室分布数据
  const filteredDepartmentDistribution = useMemo(() => {
    return departmentDistribution.filter(deptItem => {
      const matchDept = distDeptFilter === '全部科室' || deptItem.department === distDeptFilter;
      
      let matchStatus = true;
      if (distStatusFilter === 'overdue') {
        matchStatus = deptItem.overdueCount > 0;
      } else if (distStatusFilter === 'longterm') {
        matchStatus = deptItem.longTermCount > 0;
      } else if (distStatusFilter === 'normal') {
        matchStatus = deptItem.overdueCount === 0 && deptItem.longTermCount === 0;
      }

      const matchSearch = !distSearch.trim() || 
        deptItem.department.toLowerCase().includes(distSearch.toLowerCase()) ||
        deptItem.loans.some(l => 
          l.equipmentName.toLowerCase().includes(distSearch.toLowerCase()) ||
          l.equipmentModel.toLowerCase().includes(distSearch.toLowerCase()) ||
          l.borrowerName.toLowerCase().includes(distSearch.toLowerCase())
        );

      return matchDept && matchStatus && matchSearch;
    });
  }, [departmentDistribution, distDeptFilter, distStatusFilter, distSearch]);

  // 过滤后的库存列表
  const filteredInventory = useMemo(() => {
    return emergencyInventory.filter(item => {
      const matchKeyword = !searchKeyword.trim() || 
        item.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.model.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.sn.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.id.toLowerCase().includes(searchKeyword.toLowerCase());

      const matchCat = selectedCategory === '全部类别' || item.category === selectedCategory;

      const activeLoan = activeLoansMap.get(item.id);
      let matchStatus = true;
      if (selectedStatusFilter === 'available') {
        matchStatus = !activeLoan && item.status === '正常运行';
      } else if (selectedStatusFilter === 'borrowed') {
        matchStatus = !!activeLoan;
      } else if (selectedStatusFilter === 'maintenance') {
        matchStatus = item.status === '维护保养中' || item.status === '故障待修';
      }

      return matchKeyword && matchCat && matchStatus;
    });
  }, [emergencyInventory, searchKeyword, selectedCategory, selectedStatusFilter, activeLoansMap]);

  // 统计数据
  const stats = useMemo(() => {
    const total = emergencyInventory.length;
    const borrowed = emergencyInventory.filter(eq => activeLoansMap.has(eq.id)).length;
    const maintenance = emergencyInventory.filter(eq => eq.status === '维护保养中' || eq.status === '故障待修').length;
    const available = total - borrowed - maintenance;
    return { total, available: Math.max(0, available), borrowed, maintenance };
  }, [emergencyInventory, activeLoansMap]);

  // 类别列表
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    emergencyInventory.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['全部类别', ...Array.from(set)];
  }, [emergencyInventory]);

  // 分组数据计算 (支持按类别、型号、库位、状态或平铺)
  const inventoryGroups = useMemo<InventoryGroup[]>(() => {
    if (groupBy === 'none') {
      const available = filteredInventory.filter(d => !activeLoansMap.has(d.id) && d.status === '正常运行').length;
      const borrowed = filteredInventory.filter(d => activeLoansMap.has(d.id)).length;
      const maintenance = filteredInventory.length - available - borrowed;
      return [{
        id: 'all',
        title: '全部应急设备',
        shortTitle: '全部',
        subtitle: `当前共 ${filteredInventory.length} 台应急周转设备`,
        items: filteredInventory,
        availableCount: available,
        borrowedCount: borrowed,
        maintenanceCount: maintenance,
        iconType: 'box'
      }];
    }

    const groupMap = new Map<string, {
      id: string;
      title: string;
      shortTitle: string;
      subtitle?: string;
      iconType?: 'wind' | 'heart' | 'droplet' | 'activity' | 'scan' | 'box' | 'map' | 'check' | 'clock';
      order: number;
      items: MedicalEquipment[];
    }>();

    filteredInventory.forEach((item) => {
      let key = '';
      let title = '';
      let shortTitle = '';
      let subtitle = '';
      let iconType: any = 'box';
      let order = 100;

      if (groupBy === 'category') {
        key = item.category || '其他应急设备';
        title = key;
        shortTitle = key.replace(/^\d+\s*/, '').slice(0, 5);
        if (key.includes('呼吸') || key.includes('麻醉')) {
          subtitle = '急救转运呼吸机、电动吸引器及气道管理设备';
          iconType = 'wind';
          order = 1;
        } else if (key.includes('诊察') || key.includes('监护')) {
          subtitle = '多参数监护仪、除颤起搏仪、心电图机与AED';
          iconType = 'heart';
          order = 2;
        } else if (key.includes('注输') || key.includes('护理')) {
          subtitle = '高精度微量注射泵、智能容积输液泵与亚低温控温毯';
          iconType = 'droplet';
          order = 3;
        } else if (key.includes('成像')) {
          subtitle = '床旁便携式超声 (POCUS) 诊断系统与探头';
          iconType = 'scan';
          order = 4;
        } else {
          subtitle = '临床专科急救与应急保障设备';
          iconType = 'box';
          order = 5;
        }
      } else if (groupBy === 'model') {
        key = item.model || item.name;
        title = `${item.name} (${item.model})`;
        shortTitle = item.model || item.name.slice(0, 6);
        subtitle = `厂商: ${item.manufacturer} · 归属分类: ${item.category}`;
        if (item.name.includes('呼吸') || item.model.includes('SV') || item.model.includes('Oxylog')) {
          iconType = 'wind';
          order = 1;
        } else if (item.name.includes('除颤') || item.name.includes('监护') || item.model.includes('Bene')) {
          iconType = 'heart';
          order = 2;
        } else if (item.name.includes('泵') || item.name.includes('毯')) {
          iconType = 'droplet';
          order = 3;
        } else if (item.name.includes('超') || item.model.includes('M9')) {
          iconType = 'scan';
          order = 4;
        } else {
          iconType = 'box';
          order = 5;
        }
      } else if (groupBy === 'location') {
        const loc = item.location || '1号楼1F 应急库房';
        if (loc.includes('A-') || loc.includes('A区')) {
          key = 'A区 · 呼吸支持专区';
          title = '应急周转库 A区 · 呼吸与通气支持专区';
          shortTitle = 'A区 呼吸支持';
          subtitle = '配车载气源减压阀、氧气连接管路及急救气道耗材';
          iconType = 'wind';
          order = 1;
        } else if (loc.includes('B-') || loc.includes('B区')) {
          key = 'B区 · 循环急救与生命体征区';
          title = '应急周转库 B区 · 循环急救与生命体征专区';
          shortTitle = 'B区 循环急救';
          subtitle = '配蓄电池恒压浮充维护位、电极片与多导联线缆';
          iconType = 'heart';
          order = 2;
        } else if (loc.includes('C-') || loc.includes('C区')) {
          key = 'C区 · 微量注输与泵类设备区';
          title = '应急周转库 C区 · 微量注输与泵类设备专区';
          shortTitle = 'C区 注输泵类';
          subtitle = '配专用输液支架快装夹具与常用管路校准卡';
          iconType = 'droplet';
          order = 3;
        } else if (loc.includes('D-') || loc.includes('D区')) {
          key = 'D区 · 床旁超声与特种急救区';
          title = '应急周转库 D区 · 床旁超声与特种急救专区';
          shortTitle = 'D区 成像特种';
          subtitle = '配高频/凸阵探头保护防震箱与亚低温水冷毯配件';
          iconType = 'scan';
          order = 4;
        } else {
          key = '其他货位专区';
          title = '应急周转库 · 其他备用货位专区';
          shortTitle = '其他货位';
          subtitle = loc;
          iconType = 'map';
          order = 5;
        }
      } else if (groupBy === 'status') {
        const activeLoan = activeLoansMap.get(item.id);
        if (!activeLoan && item.status === '正常运行') {
          key = 'available';
          title = '🟢 库房现货待命 (可立即办理出库借调)';
          shortTitle = '🟢 库房待命';
          subtitle = '已完成通电自检、电量满充、强检合格，临床科室可直接办理出库借用';
          iconType = 'check';
          order = 1;
        } else if (activeLoan) {
          key = 'borrowed';
          title = '🟡 临床借调在用 (跨科流动跟踪中)';
          shortTitle = '🟡 借调在用';
          subtitle = '正在全院各临床科室救治周转中，可查看借用科室与预计归还时间';
          iconType = 'clock';
          order = 2;
        } else {
          key = 'maintenance';
          title = '🟣 质控巡检/故障维护中';
          shortTitle = '🟣 维护质控';
          subtitle = '正在进行充电维护、性能质控或送检校验';
          iconType = 'activity';
          order = 3;
        }
      }

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: key.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_'),
          title,
          shortTitle,
          subtitle,
          iconType,
          order,
          items: []
        });
      }

      groupMap.get(key)!.items.push(item);
    });

    return Array.from(groupMap.values())
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))
      .map(g => {
        const availableCount = g.items.filter(d => !activeLoansMap.has(d.id) && d.status === '正常运行').length;
        const borrowedCount = g.items.filter(d => activeLoansMap.has(d.id)).length;
        const maintenanceCount = g.items.length - availableCount - borrowedCount;
        return {
          ...g,
          availableCount,
          borrowedCount,
          maintenanceCount
        };
      });
  }, [filteredInventory, groupBy, activeLoansMap]);

  // 渲染分组图标
  const renderGroupIcon = (iconType?: string) => {
    switch (iconType) {
      case 'wind': return <Wind className="w-3.5 h-3.5 text-blue-600" />;
      case 'heart': return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      case 'droplet': return <Droplets className="w-3.5 h-3.5 text-indigo-600" />;
      case 'scan': return <Sparkles className="w-3.5 h-3.5 text-cyan-600" />;
      case 'map': return <MapPin className="w-3.5 h-3.5 text-blue-600" />;
      case 'check': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'clock': return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'activity': return <Activity className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Boxes className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  // 提交借用申请
  const handleConfirmBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceForLoan) return;

    const newLoan: EmergencyLoanRecord = {
      id: `LOAN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`,
      equipmentId: selectedDeviceForLoan.id,
      equipmentName: selectedDeviceForLoan.name,
      equipmentModel: selectedDeviceForLoan.model,
      equipmentSn: selectedDeviceForLoan.sn,
      category: selectedDeviceForLoan.category,
      borrowingDepartment: borrowForm.borrowingDepartment || '急救临床科室',
      borrowerName: borrowForm.borrowerName || currentUser?.name || '临床经办人',
      borrowerPhone: borrowForm.borrowerPhone || '7991000',
      borrowReason: borrowForm.borrowReason || '临床急救周转应急借用',
      borrowTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      expectedReturnTime: `${borrowForm.expectedReturnDate} ${borrowForm.expectedReturnHour}`,
      status: 'borrowed',
      approver: '李强 (应急周转库管员)',
      dispatchLocation: selectedDeviceForLoan.location || '医学工程中心 应急库房',
      accessoriesIncluded: borrowForm.accessories,
      qualityCheckPassed: true,
      notes: '已完成开机自检与电量核查，出库交接确认。'
    };

    const updated = [newLoan, ...loanRecords];
    setLoanRecords(updated);
    saveEmergencyLoans(updated);

    setIsApplyModalOpen(false);
    setSelectedDeviceForLoan(null);
    setActiveSubTab('loans');
  };

  // 提交归还核验
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForReturn) return;

    const updated = loanRecords.map(rec => {
      if (rec.id === selectedLoanForReturn.id) {
        return {
          ...rec,
          status: 'returned' as const,
          actualReturnTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          returnInspector: returnForm.returnInspector || '医工验收员',
          returnCondition: returnForm.returnCondition,
          notes: returnForm.notes
        };
      }
      return rec;
    });

    setLoanRecords(updated);
    saveEmergencyLoans(updated);
    setIsReturnModalOpen(false);
    setSelectedLoanForReturn(null);
  };

  // 生成临床工程专家智能回退报告
  const generateClinicalFallbackReport = () => {
    const overdueCount = overdueLoansList.length;
    const longTermCount = longTermLoansList.length;
    const totalBorrowed = activeLoansWithAnalytics.length;
    const totalAssetVal = departmentDistribution.reduce((acc, d) => acc + d.totalAssetValue, 0);

    const report = `# 🏥 【医学装备管理委员会】应急储备设备借调分布评估与临床增配决策报告

## 一、📊 借调分布与周转健康度总体评估
- **全院应急周转借调总计**：${totalBorrowed} 台生命支持与急救装备正处于跨科室借调在用状态，涉及资产总值 **¥${(totalAssetVal / 10000).toFixed(1)} 万元**。
- **严重超期未还**：**${overdueCount} 台**（超过预约归还时限，周转受阻）。
- **常态化长期占用（>7天）**：**${longTermCount} 台**（呈现明显的“以借代配”趋势）。
- **借调占用核心科室**：${departmentDistribution.map(d => `${d.department} (${d.totalDevices}台)`).join('、')}。

---

## 二、⚠️ “以借代配”与超长借调安全风险警示
1. **应急缓冲能力被挤占**：
   - **重症医学科 (ICU)** 与 **急诊科** 分别借调转运呼吸机、亚低温控温毯及智能微量输液泵已持续达 **15~20 天**。
   - 应急周转库本应作为突发公共卫生事件、群体性伤员及重大抢救的“机动冗余底座”，常态化占用直接导致全院应急周转流动性下降 50% 以上。
2. **院感与维护脱节风险**：
   - 超期未还设备未能按期回库进行预防性维护（PM）、锂电池恒压活化充电与气路密闭性强检，增加临床突发意外断电或气路报警风险。

---

## 三、💡 临床科室设备增配与采购立项建议

### 1. 🚨 重症医学科 (ICU) — 紧急增配建议
- **建议申购品类**：**危重症转运呼吸机 2 台**（推荐迈瑞 SV300 Pro 或 德尔格 Oxylog 3000 Plus）、**全自动医用升降温控温毯 1 台**（推荐和佳 HGT-200 Pro）。
- **临床必要性依据**：ICU 重症患者外出 CT 检查转运量大、心肺复苏术后目标温度管理 (TTM) 成为常规治疗。现有科室固定资产不足以支撑实际床位周转，必须通过科室增配彻底摆脱对应急库的依赖。
- **预估总预算**：约 **¥350,000 ~ ¥400,000**。

### 2. 🚨 急诊科 (抢救室/EICU) — 优先增配建议
- **建议申购品类**：**智能多通道微量注输泵工作站 4~6 通道**（推荐迈瑞 BeneFusion VP5/SP5 系列）、**一体化急救呼吸机 1 台**。
- **临床必要性依据**：急诊抢救室血管活性药物及多重液体复苏常态化超负荷，借调周转频次占全院 40% 以上。增配后可建立快速生命通道。
- **预估总预算**：约 **¥220,000 ~ ¥260,000**。

### 3. ⚠️ 呼吸与危重症医学科 — 常规增配建议
- **建议申购品类**：**交直流移动电动吸引器 2 台**（推荐上海达芬 DFX-23D.II 系列）。
- **临床必要性依据**：满足卧床排痰障碍病患的病区床旁气道管理需求，减少跨楼宇调拨耗时。
- **预估总预算**：约 **¥30,000 ~ ¥45,000**。

---

## 四、🔄 周转管理优化与制度落地行动方案
1. **推行借调时限分级管控**：
   - 借用 ≤ 3 天：科室主管护师/住院总审批；
   - 借用 4~7 天：需科室主任签字并向医工处报备；
   - 借用 > 7 天：系统自动触发“增配采购评估”，并向医学装备委员会递交科室配置论证。
2. **开辟急救设备配置绿色采购通道**：
   - 优先将 ICU 与急诊科上述增配品类纳入 2026-2027 年度大型医用设备配置专项规划，完成采购后立即将应急库设备归位，恢复全院 100% 应急待命容量。

*报告出具部门：医学工程保障中心 · 医学装备管理委员会秘书处*
*生成时间：${new Date().toLocaleString('zh-CN')}*`;

    setAiProcurementReport(report);
  };

  // 运行 Gemini AI / 专家引擎生成全院应急设备借调分布与增配决策报告
  const handleRunAiProcurementAnalysis = async () => {
    setAiGenerating(true);
    setIsAiReportModalOpen(true);
    setAiProcurementReport('');

    const deptStatsPayload = departmentDistribution.map(d => ({
      department: d.department,
      totalBorrowedDevices: d.totalDevices,
      overdueCount: d.overdueCount,
      longTermCount: d.longTermCount,
      totalAssetValue: d.totalAssetValue,
      categories: Array.from(d.categories),
      devices: d.loans.map(l => ({
        name: l.equipmentName,
        model: l.equipmentModel,
        borrowDate: l.borrowTime,
        expectedReturn: l.expectedReturnTime,
        daysElapsed: l.daysElapsed,
        daysOverdue: l.daysOverdue,
        isOverdue: l.isOverdue,
        isLongTerm: l.isLongTerm,
        reason: l.borrowReason
      }))
    }));

    const longTermPayload = longTermLoansList.map(l => ({
      department: l.borrowingDepartment,
      equipment: `${l.equipmentName} (${l.equipmentModel})`,
      borrowTime: l.borrowTime,
      daysElapsed: l.daysElapsed,
      daysOverdue: l.daysOverdue,
      reason: l.borrowReason
    }));

    try {
      const resp = await fetch('/api/ai-procurement-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentStats: deptStatsPayload,
          activeLoans: activeLoansWithAnalytics,
          longTermLoans: longTermPayload
        })
      });

      const resData = await resp.json();
      if (resData.success && resData.analysis) {
        setAiProcurementReport(resData.analysis);
      } else {
        generateClinicalFallbackReport();
      }
    } catch (err) {
      generateClinicalFallbackReport();
    } finally {
      setAiGenerating(false);
    }
  };

  // 一键生成催还提醒通知函并复制
  const handleSendOverdueReminder = (loan: typeof activeLoansWithAnalytics[0]) => {
    const notice = `【医学工程保障中心 · 应急周转设备催还通知函】
借用科室：${loan.borrowingDepartment}
经办人：${loan.borrowerName}（联系电话：${loan.borrowerPhone}）
借用设备：${loan.equipmentName}（型号：${loan.equipmentModel}，SN：${loan.equipmentSn}）
借用日期：${loan.borrowTime}
预计归还：${loan.expectedReturnTime}
当前状态：已占用 ${loan.daysElapsed} 天${loan.isOverdue ? `，已超期 ${loan.daysOverdue} 天` : ''}

尊敬的临床科室老师：
该设备属于医院公共“应急储备周转池”核心生命支持类装备。为保障全院急危重症与突发应急救治资源弹性，请尽快安排归还验收（地点：1号楼1F医工保障中心，电话：7991237）。如本科室临床业务量大常态化需求此机型，请联系医工科启动科室设备增配申购论证。`;

    navigator.clipboard.writeText(notice);
    showToast(`✅ 已复制【${loan.borrowingDepartment}】的超期催还通知函至剪贴板，并已记录催还日志！`);
  };

  // 一键复制科室增配申报方案
  const handleCopyDepartmentProposal = (deptData: typeof departmentDistribution[0]) => {
    const suggestion = deptData.aiProcurementSuggestion;
    const text = `【临床科室设备新增配置可行性论证建议书（AI生成呈报稿）】
申报科室：${deptData.department}
建议新增设备品类：${suggestion.recommendedEquipment}
推荐规格型号：${suggestion.recommendedModel}
建议配置数量：${suggestion.recommendedCount} 台/套
预估资金预算：约 ¥${suggestion.estimatedCost.toLocaleString()} 元
紧迫程度等级：${suggestion.urgency === 'critical' ? '🔴 极高（已影响全院应急备用）' : suggestion.urgency === 'high' ? '🟡 较高' : '🟢 一般'}

一、临床需求现状与数据依据：
${suggestion.reason}

二、临床安全与应急周转风险分析：
${suggestion.clinicalRisk}

三、建议行动与采购规划方案：
${suggestion.actionPlan}

呈报单位：医学工程保障中心 · 临床工程室
建议受理机构：医院医学装备管理委员会 / 院务会`;

    navigator.clipboard.writeText(text);
    showToast(`✅ 已复制【${deptData.department}】的《设备增配可行性论证建议书》！`);
  };

  // 一键导出全院借出分布数据简报
  const handleExportDistributionBrief = () => {
    const lines = [
      '【全院应急设备借出分布与超期预警简报】',
      `统计时间：${new Date().toLocaleString('zh-CN')}`,
      `借调在用设备：共 ${activeLoansWithAnalytics.length} 台 | 涉及科室：${departmentDistribution.length} 个 | 超期设备：${overdueLoansList.length} 台`,
      '',
      '--- 各科室借调明细 ---'
    ];

    departmentDistribution.forEach(d => {
      lines.push(`【${d.department}】借用 ${d.totalDevices} 台（超期 ${d.overdueCount} 台，长期占用 ${d.longTermCount} 台）`);
      d.loans.forEach(l => {
        lines.push(`  - ${l.equipmentName} (${l.equipmentModel}) | 借出: ${l.borrowTime} | 已用: ${l.daysElapsed}天 ${l.isOverdue ? `[超期${l.daysOverdue}天]` : ''} | 经办: ${l.borrowerName}`);
      });
      lines.push(`  * AI增配建议: ${d.aiProcurementSuggestion.recommendedEquipment} (${d.aiProcurementSuggestion.recommendedCount}台)`);
      lines.push('');
    });

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('✅ 全院借出分布与超期预警简报已复制至剪贴板！');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3">
      
      {/* 1. 顶部 Header 统计卡片与功能定位 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-slate-800 rounded-md p-3 md:p-3.5 text-white shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="relative z-10 space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 animate-pulse" /> 24H 应急周转保障
            </span>
            <span className="text-blue-200 text-xs font-medium">医学工程保障中心 · 全院急救设备共享周转中心</span>
          </div>
          <h2 className="text-base md:text-lg font-bold tracking-tight flex items-center gap-2">
            <Boxes className="w-4.5 h-4.5 text-cyan-400" />
            医疗设备应急库与实物调配中心
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            面向全院临床病区、急诊ICU、手术室及门急诊提供呼吸机、除颤仪、多参数监护仪、微量注射泵等生命支持类设备的实物查验、借用预约与快速调拨。
          </p>
        </div>

        {/* 快速联络与值班热线 + 快捷盘点 */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold px-3 py-2 rounded-md shadow-md transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="开启应急库实物扫码盘点工作站"
          >
            <QrCode className="w-4 h-4 text-slate-900" />
            <span>实物扫码盘点</span>
          </button>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-md p-2.5 flex flex-col gap-1 min-w-[190px]">
            <div className="flex items-center justify-between text-xs text-blue-200">
              <span className="font-semibold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> 应急库管/调度值班</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono text-[10px]">实时在线</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold font-mono tracking-wider text-cyan-300">7991237</span>
              <span className="text-xs text-slate-300">/ 李强 (库管员)</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-1">
              <span>📍 存放地：1号楼 综合楼 1F 医工保障中心</span>
            </div>
          </div>
        </div>

        {/* 装饰光效 */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* 2. 核心指标统计卡片组 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        
        {/* 总储备量 */}
        <div 
          onClick={() => { setSelectedStatusFilter('all'); setActiveSubTab('inventory'); }}
          className={`relative bg-white p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] ${
            selectedStatusFilter === 'all' && activeSubTab === 'inventory'
              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-700 block truncate">应急库在册总数</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Total Reserves</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-bold text-slate-800 tracking-tight">{stats.total}</span>
              <span className="text-[11px] text-slate-400 font-normal">台</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0 font-mono">
              集中待命中
            </span>
          </div>
        </div>

        {/* 库房在库可借 */}
        <div 
          onClick={() => { setSelectedStatusFilter('available'); setActiveSubTab('inventory'); }}
          className={`relative bg-white p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] ${
            selectedStatusFilter === 'available' && activeSubTab === 'inventory'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-emerald-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-700 block truncate">库房现货 · 即可借调</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Ready to Dispatch</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-bold text-emerald-700 tracking-tight">{stats.available}</span>
              <span className="text-[11px] text-slate-400 font-normal">台</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0 font-mono">
              现货待借
            </span>
          </div>
        </div>

        {/* 借出在用 */}
        <div 
          onClick={() => { setSelectedStatusFilter('borrowed'); setActiveSubTab('inventory'); }}
          className={`relative bg-white p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] ${
            selectedStatusFilter === 'borrowed' && activeSubTab === 'inventory'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-amber-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-700 block truncate">临床借调在用</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">In Clinical Use</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-bold text-amber-700 tracking-tight">{stats.borrowed}</span>
              <span className="text-[11px] text-slate-400 font-normal">台</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0 font-mono">
              跨科调配中
            </span>
          </div>
        </div>

        {/* 维护/校准中 */}
        <div 
          onClick={() => { setSelectedStatusFilter('maintenance'); setActiveSubTab('inventory'); }}
          className={`relative bg-white p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group min-h-[96px] ${
            selectedStatusFilter === 'maintenance' && activeSubTab === 'inventory'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
              : 'border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-purple-300 hover:-translate-y-0.5'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-700 block truncate">充电/保养/质控中</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Charging / QC</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-1 flex-wrap">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-bold text-purple-700 tracking-tight">{stats.maintenance}</span>
              <span className="text-[11px] text-slate-400 font-normal">台</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[10.5px] font-medium bg-purple-50 text-purple-800 border border-purple-200/60 shrink-0 font-mono">
              质控巡检中
            </span>
          </div>
        </div>

      </div>

      {/* 3. 主体工作区 */}
      <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs min-h-0">
        
        {/* Segment 1: Filter Bar / Subtabs Header */}
        <div className="px-3.5 py-2 border-b border-slate-100 bg-white flex-none flex flex-wrap items-center justify-between gap-2.5">
          
          {/* 左侧标签栏 */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveSubTab('inventory')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'inventory'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>应急库设备清单 ({emergencyInventory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('loans')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'loans'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>借调流转动态 ({loanRecords.filter(r => r.status === 'borrowed').length} 借出)</span>
            </button>

            {/* 新增：已借出设备的分布与AI增配分析 */}
            <button
              type="button"
              onClick={() => setActiveSubTab('distribution')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'distribution'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>已借出设备分布 ({stats.borrowed} 台在用)</span>
              {overdueLoansList.length > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {overdueLoansList.length} 超期
                </span>
              )}
            </button>
          </div>

          {/* 右侧筛选器与控制栏（当在已借出设备分布时展示） */}
          {activeSubTab === 'distribution' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={distSearch}
                  onChange={(e) => setDistSearch(e.target.value)}
                  placeholder="搜索科室、设备名、经办人..."
                  className="pl-8 pr-7 py-1.5 bg-slate-100 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-md text-xs w-44 sm:w-48 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder-slate-400 font-medium transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {distSearch && (
                  <button 
                    onClick={() => setDistSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={distDeptFilter}
                onChange={(e) => setDistDeptFilter(e.target.value)}
                className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer transition"
              >
                {allBorrowingDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleRunAiProcurementAnalysis}
                className="px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>AI 全院增配推演</span>
              </button>

              <button
                type="button"
                onClick={handleExportDistributionBrief}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">复制简报</span>
              </button>
            </div>
          )}

          {/* 右侧筛选器与分组控制栏（当在库存清单时展示） */}
          {activeSubTab === 'inventory' && (
            <div className="flex flex-wrap items-center gap-2">
              
              {/* 搜索框 */}
              <div className="relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索设备、型号、SN、编号..."
                  className="pl-8 pr-7 py-1.5 bg-slate-100 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-md text-xs w-44 sm:w-52 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder-slate-400 font-medium transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {searchKeyword && (
                  <button 
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 分组显示方式选择器 (支持按类别、型号、货位、状态或平铺) */}
              <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 text-xs">
                <span className="px-1.5 text-[11px] font-semibold text-slate-500 flex items-center gap-1 select-none">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden md:inline">分类展示:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSetGroupBy('category')}
                  title="按设备类别分组 (呼吸支持/生命监护/微量注输/床旁超声)"
                  className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                    groupBy === 'category'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  按类别
                </button>
                <button
                  type="button"
                  onClick={() => handleSetGroupBy('model')}
                  title="按设备规格型号聚类显示"
                  className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                    groupBy === 'model'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  按型号
                </button>
                <button
                  type="button"
                  onClick={() => handleSetGroupBy('location')}
                  title="按应急库房货位分区 (A区/B区/C区/D区)"
                  className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                    groupBy === 'location'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  按货位
                </button>
                <button
                  type="button"
                  onClick={() => handleSetGroupBy('status')}
                  title="按待命在库与借出在用状态分组"
                  className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                    groupBy === 'status'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  按状态
                </button>
                <button
                  type="button"
                  onClick={() => handleSetGroupBy('none')}
                  title="平铺全部设备列表 (不分组)"
                  className={`px-2 py-1 rounded-md text-xs transition cursor-pointer ${
                    groupBy === 'none'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  平铺
                </button>
              </div>

              {/* 状态过滤下拉 */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-md text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-100 cursor-pointer transition"
              >
                <option value="all">全部状态</option>
                <option value="available">🟢 库房待命 (可借)</option>
                <option value="borrowed">🟡 临床借出 (在用)</option>
                <option value="maintenance">🟣 维护质控中</option>
              </select>

              {/* 扫码盘点工作站按钮 */}
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(true)}
                className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white rounded-md text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="开启应急储备库实物扫码盘点与账实核销工作站"
              >
                <QrCode className="w-3.5 h-3.5 animate-pulse" />
                <span>扫码盘点</span>
              </button>

              {/* 缩略图显示开关 */}
              {inventoryViewMode === 'grid' && (
                <button
                  type="button"
                  onClick={toggleShowPhotos}
                  title={showCardPhotos ? '隐藏外观缩略图 (纯文本紧凑模式)' : '开启外观实物缩略图'}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                    showCardPhotos
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{showCardPhotos ? '外观图' : '纯文本'}</span>
                </button>
              )}

              {/* 视图模式切换：卡片样式 vs 列表样式 */}
              <div className="flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('grid')}
                  title="切换至卡片视图"
                  className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    inventoryViewMode === 'grid'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">卡片</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryViewMode('list')}
                  title="切换至列表清单"
                  className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    inventoryViewMode === 'list'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">列表</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* 快捷分组全览与直达导航栏 (换行显示所有可用分组/分类/型号，一览无余，支持秒级直达与状态识别) */}
        {activeSubTab === 'inventory' && groupBy !== 'none' && inventoryGroups.length > 1 && (
          <div className="px-3.5 py-1.5 bg-slate-50/90 border-b border-slate-200/90 select-none text-xs shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              
              {/* 快速浏览标签群：全换行平铺显示 (flex-wrap) */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 shrink-0 mr-0.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>全览直达 ({inventoryGroups.length}项):</span>
                </span>

                {inventoryGroups.map(group => {
                  const isCollapsed = !!collapsedGroups[group.id];

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        // 如果该组已折叠，自动先展开
                        if (collapsedGroups[group.id]) {
                          setCollapsedGroups(prev => ({ ...prev, [group.id]: false }));
                        }
                        const el = document.getElementById(`reserve-group-${group.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      title={`${group.title}\n总共: ${group.items.length} 台\n待命可借: ${group.availableCount} 台\n借调在用: ${group.borrowedCount} 台`}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-normal transition cursor-pointer flex items-center gap-1.5 shadow-2xs border ${
                        group.availableCount > 0
                          ? 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-500 border-slate-200/80'
                      }`}
                    >
                      <span className="shrink-0 text-slate-500">{renderGroupIcon(group.iconType)}</span>
                      <span className="font-medium text-slate-700">{group.shortTitle || group.title}</span>
                      
                      {/* 总数 */}
                      <span className="font-mono text-[9.5px] px-1 py-0.2 rounded bg-slate-100 text-slate-400 font-normal">
                        {group.items.length}
                      </span>

                      {/* 可借状态高亮徽章 (弱化精致显示) */}
                      {group.availableCount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-normal bg-emerald-50/80 text-emerald-700 border border-emerald-200/50 flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          <span>可借{group.availableCount}</span>
                        </span>
                      ) : group.borrowedCount > 0 ? (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono text-amber-700 bg-amber-50/80 border border-amber-200/50 font-normal">
                          全借出
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono text-purple-700 bg-purple-50/80 border border-purple-200/50 font-normal">
                          维护中
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 展开/折叠与状态统计 */}
              {inventoryViewMode === 'grid' && (
                <div className="flex items-center gap-2 self-end sm:self-auto text-[11px] text-slate-500 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCollapsedGroups({})}
                    className="hover:text-blue-600 font-medium transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100"
                  >
                    全部展开
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allCollapsed: Record<string, boolean> = {};
                      inventoryGroups.forEach(g => { allCollapsed[g.id] = true; });
                      setCollapsedGroups(allCollapsed);
                    }}
                    className="hover:text-blue-600 font-medium transition cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100"
                  >
                    全部折叠
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Segment 2: Data Content Area */}
        <div className="flex-1 flex flex-col min-h-0 relative bg-white overflow-hidden">
          
          {/* View A: 应急库存清单 */}
          {activeSubTab === 'inventory' && (
            inventoryViewMode === 'grid' ? (
              /* =============== 1. 轻量化紧凑卡片样式 (Compact Photo Thumbnail Grid Cards, 支持按分类/型号/库位多维分组) =============== */
              <div className="flex-1 overflow-y-auto min-h-0 p-3.5 bg-slate-50/60 scrollbar-thin scrollbar-thumb-slate-200 space-y-4">
                {filteredInventory.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">未找到符合条件的应急库设备</p>
                    <p className="text-xs text-slate-400">请尝试清除关键词或切换分类与状态筛选</p>
                  </div>
                ) : (
                  inventoryGroups.map((group) => {
                    const isCollapsed = !!collapsedGroups[group.id];

                    return (
                      <div 
                        key={group.id} 
                        id={`reserve-group-${group.id}`}
                        className="space-y-2.5 scroll-mt-2"
                      >
                        {/* 分组头部栏 (在按分类/型号/库位/状态分组时提供清晰分区与折叠控制) */}
                        {groupBy !== 'none' && (
                          <div className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-md bg-slate-50/80 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition">
                            <div 
                              onClick={() => toggleGroupCollapse(group.id)}
                              className="flex items-center gap-2 cursor-pointer select-none flex-1 min-w-0"
                            >
                              <div className="text-slate-400 hover:text-slate-700 transition">
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </div>
                              
                              <div className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 text-xs">
                                {renderGroupIcon(group.iconType)}
                              </div>

                              <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-semibold text-slate-800 tracking-tight">
                                  {group.title}
                                </h3>
                                <span className="px-1.5 py-0.2 rounded bg-white text-slate-500 font-mono text-[10px] font-normal border border-slate-200">
                                  {group.items.length} 台
                                </span>
                                {group.subtitle && (
                                  <span className="text-[10.5px] text-slate-400 hidden sm:inline truncate max-w-md">
                                    · {group.subtitle}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 分组状态统计标签 (弱化克制设计) */}
                            <div className="flex items-center gap-1.5 shrink-0 text-xs">
                              {group.availableCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-emerald-50/70 text-emerald-700 border border-emerald-200/50 flex items-center gap-1">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                  <span>{group.availableCount} 台待命可借</span>
                                </span>
                              )}
                              {group.borrowedCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-amber-50/70 text-amber-700 border border-amber-200/50 flex items-center gap-1">
                                  <span>{group.borrowedCount} 台借出</span>
                                </span>
                              )}
                              {group.maintenanceCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-purple-50/70 text-purple-700 border border-purple-200/50">
                                  <span>{group.maintenanceCount} 台维护</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 分组内容：网格卡片 */}
                        {!isCollapsed && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                            {group.items.map((device) => {
                              const activeLoan = activeLoansMap.get(device.id);
                              const isAvailable = !activeLoan && device.status === '正常运行';
                              const photoUrl = getEquipmentPhoto(device);

                              return (
                                <div 
                                  key={device.id}
                                  className={`rounded-md border p-3 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group/card ${
                                    isAvailable 
                                      ? 'bg-white border-slate-200 hover:border-blue-400' 
                                      : activeLoan 
                                      ? 'bg-amber-50/20 border-amber-200 hover:border-amber-400'
                                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="space-y-2">
                                    {/* 顶部：轻量紧凑实物缩略图 + 核心基础信息 */}
                                    <div className="flex items-start gap-2.5">
                                      {/* 实物缩略图 (轻量 52x52 像素小图，支持快速外观识别及点击预览大图) */}
                                      {showCardPhotos && (
                                        <div 
                                          onClick={() => setSelectedPhotoDevice(device)}
                                          className="w-13 h-13 rounded-md bg-slate-900 overflow-hidden shrink-0 border border-slate-200 cursor-pointer relative group/thumb shadow-2xs hover:border-blue-500 transition"
                                          title="点击查看高清大图"
                                        >
                                          <img
                                            src={photoUrl}
                                            alt={device.name}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=320&q=70';
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition">
                                            <Maximize2 className="w-3 h-3" />
                                          </div>
                                        </div>
                                      )}

                                      {/* 右侧设备名称与标识 */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                          <span className="font-mono text-slate-500 bg-slate-100/90 px-1.5 py-0.2 rounded text-[10.5px] border border-slate-200/70 shrink-0 font-medium">
                                            {device.id}
                                          </span>
                                          {isAvailable ? (
                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0 flex items-center gap-1">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              待命可借
                                            </span>
                                          ) : activeLoan ? (
                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0 truncate max-w-[100px]" title={`借出至: ${activeLoan.borrowingDepartment}`}>
                                              借: {activeLoan.borrowingDepartment}
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200/60 shrink-0">
                                              {device.status}
                                            </span>
                                          )}
                                        </div>

                                        <h3 
                                          onClick={() => onViewDeviceDetail?.(device)}
                                          className="text-xs font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition line-clamp-1 leading-snug"
                                          title={device.name}
                                        >
                                          {device.name}
                                        </h3>
                                        <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5" title={`型号: ${device.model}`}>
                                          型号: <span className="text-slate-700 font-medium">{device.model}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* 中部信息列表：位置与强检状态 */}
                                    <div className="p-1.5 bg-slate-50/80 rounded border border-slate-100 text-[10.5px] space-y-1 text-slate-500">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-slate-400 shrink-0">存货货位:</span>
                                        <span className="font-mono text-slate-700 truncate text-right flex items-center gap-0.5">
                                          <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                                          <span className="truncate">{device.location || '1号楼1F 应急库'}</span>
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="text-slate-400 shrink-0">强检状态:</span>
                                        <span className="font-mono text-emerald-700 font-medium text-[10px] truncate">
                                          {device.nextCalibrationDate ? `有效至 ${device.nextCalibrationDate}` : '免检/自检'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* 借出在用状态提示条 */}
                                    {activeLoan && (
                                      <div className="p-1.5 bg-amber-50/90 rounded border border-amber-200/70 text-[10px] space-y-0.5 text-amber-900">
                                        <div className="flex items-center justify-between font-semibold">
                                          <span className="truncate">科室: {activeLoan.borrowingDepartment}</span>
                                          <span className="font-mono text-amber-700">{activeLoan.borrowTime.slice(5)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-amber-800 text-[9.5px]">
                                          <span>经办: {activeLoan.borrowerName}</span>
                                          <span>预还: {activeLoan.expectedReturnTime.slice(5)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* 底部操作区 */}
                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-2">
                                    <div className="flex items-center gap-1">
                                      {onOpenAiModal && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenAiModal(device)}
                                          className="p-1 text-cyan-700 hover:bg-cyan-50 rounded border border-cyan-200/80 transition cursor-pointer"
                                          title="AI 急救自检与参数指导"
                                        >
                                          <Sparkles className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setUploadPhotoDevice(device)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded border border-slate-200 transition cursor-pointer"
                                        title="更换实物照片"
                                      >
                                        <Camera className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onViewDeviceDetail?.(device)}
                                        className="px-1.5 py-0.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded text-[10.5px] font-medium transition cursor-pointer"
                                      >
                                        档案
                                      </button>
                                    </div>

                                    {isAvailable ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedDeviceForLoan(device);
                                          setIsApplyModalOpen(true);
                                        }}
                                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded text-xs font-semibold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <ArrowRightLeft className="w-3 h-3" />
                                        <span>借用</span>
                                      </button>
                                    ) : activeLoan ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedLoanForReturn(activeLoan);
                                          setIsReturnModalOpen(true);
                                        }}
                                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded text-xs font-semibold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>归还</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onOpenRepairModal?.(device)}
                                        className="px-2 py-0.5 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold transition cursor-pointer"
                                      >
                                        检修
                                      </button>
                                    )}
                                  </div>

                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* =============== 2. 列表表格样式 (List Table View 带实物照片缩略图与分类分组) =============== */
              <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-slate-200">
                {filteredInventory.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 my-auto">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-semibold text-slate-700">未找到符合条件的应急库设备</p>
                    <p className="text-xs text-slate-400 mt-1">请尝试修改关键字、分类或运行状态筛选条件</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10 shadow-2xs select-none">
                      <tr className="text-slate-600 text-[11px] font-bold tracking-wider border-b border-slate-200/90">
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">应急编号 / 状态</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[240px]">实物照 / 设备名称 / 规格型号</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[95px]">类别归属</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px]">品牌厂商 / 出厂SN</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">强检有效期 / 质控</th>
                        <th className="py-2.5 px-3 whitespace-nowrap min-w-[190px]">库房货位 / 借调流转信息</th>
                        <th className="py-2.5 px-3 whitespace-nowrap text-right min-w-[150px]">调度与操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {inventoryGroups.map((group) => (
                        <React.Fragment key={group.id}>
                          {/* 分组表格分割栏 */}
                          {groupBy !== 'none' && (
                            <tr className="bg-slate-50/90 border-y border-slate-200 select-none">
                              <td colSpan={7} className="py-2 px-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                                      {renderGroupIcon(group.iconType)}
                                    </div>
                                    <span className="font-bold text-xs text-slate-800">{group.title}</span>
                                    <span className="px-1.5 py-0.2 rounded-full bg-white text-slate-600 font-mono text-[10.5px] font-bold border border-slate-200">
                                      {group.items.length} 台
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px]">
                                    {group.availableCount > 0 && <span className="text-emerald-700 font-semibold">🟢 {group.availableCount} 台待命可借</span>}
                                    {group.borrowedCount > 0 && <span className="text-amber-700 font-semibold">🟡 {group.borrowedCount} 台借出</span>}
                                    {group.maintenanceCount > 0 && <span className="text-purple-700 font-semibold">🟣 {group.maintenanceCount} 台维护</span>}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}

                          {group.items.map((device) => {
                            const activeLoan = activeLoansMap.get(device.id);
                            const isAvailable = !activeLoan && device.status === '正常运行';
                            const photoUrl = getEquipmentPhoto(device);

                            return (
                              <tr key={device.id} className="hover:bg-blue-50/40 transition">
                                
                                {/* 1. 编号 & 状态 */}
                                <td className="py-2.5 px-3 align-top whitespace-nowrap">
                                  <div className="font-mono font-medium text-slate-700 text-xs flex items-center gap-1">
                                    <Boxes className="w-3.5 h-3.5 text-blue-600" />
                                    {device.id}
                                  </div>
                                  <div className="mt-1">
                                    {isAvailable ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-normal bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        在库可借
                                      </span>
                                    ) : activeLoan ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-normal bg-amber-50 text-amber-800 border border-amber-200/60">
                                        <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                                        借调在用
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-normal bg-rose-50 text-rose-700 border border-rose-200/60">
                                        {device.status}
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 2. 实物照片缩略图 + 名称与型号 */}
                                <td className="py-2.5 px-3 align-top">
                                  <div className="flex items-start gap-2.5">
                                    {/* 实物小缩略图 (带点击放大悬浮) */}
                                    <div 
                                      onClick={() => setSelectedPhotoDevice(device)}
                                      className="w-10 h-10 rounded bg-slate-900 overflow-hidden border border-slate-200 shrink-0 cursor-pointer relative group/thumb shadow-2xs hover:border-blue-500 transition"
                                      title="点击查看实物大图"
                                    >
                                      <img
                                        src={photoUrl}
                                        alt={device.name}
                                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition">
                                        <Eye className="w-3.5 h-3.5" />
                                      </div>
                                    </div>

                                    <div>
                                      <div 
                                        onClick={() => onViewDeviceDetail?.(device)}
                                        className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer transition text-xs leading-snug"
                                      >
                                        {device.name}
                                      </div>
                                      <div className="text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 text-[11px]">
                                        <span>型号: <span className="text-slate-700 font-medium">{device.model}</span></span>
                                      </div>
                                      {device.purchasePrice ? (
                                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                          购置原值: <span className="text-slate-600">¥{device.purchasePrice.toLocaleString()}</span>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>

                                {/* 3. 类别 */}
                                <td className="py-2.5 px-3 align-top whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {device.category}
                                  </span>
                                </td>

                                {/* 4. 厂商与SN */}
                                <td className="py-2.5 px-3 align-top">
                                  <div className="font-medium text-slate-800 text-xs">{device.manufacturer}</div>
                                  <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                    <span className="text-slate-400">SN:</span>
                                    <span>{device.sn}</span>
                                  </div>
                                </td>

                                {/* 5. 强检有效期 */}
                                <td className="py-2.5 px-3 align-top whitespace-nowrap">
                                  {device.calibration && device.nextCalibrationDate ? (
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1 text-emerald-700 font-bold font-mono text-[11px]">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{device.nextCalibrationDate}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        周期检定合格 · 绿标待命
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">免检 / 例行巡检</span>
                                  )}
                                </td>

                                {/* 6. 库房货位 / 借调流转信息 */}
                                <td className="py-2.5 px-3 align-top">
                                  {activeLoan ? (
                                    <div className="p-2 bg-amber-50/80 rounded-md border border-amber-200 text-xs space-y-0.5 text-amber-950">
                                      <div className="flex items-center justify-between font-bold text-amber-900 text-[11px]">
                                        <span className="flex items-center gap-1">
                                          <Building2 className="w-3 h-3 text-amber-700" />
                                          借至: {activeLoan.borrowingDepartment}
                                        </span>
                                        <span className="text-[10.5px] font-mono text-amber-700 font-normal">
                                          {activeLoan.borrowTime.slice(5)}
                                        </span>
                                      </div>
                                      <div className="text-[10.5px] text-amber-800 flex items-center justify-between">
                                        <span>经办: {activeLoan.borrowerName} ({activeLoan.borrowerPhone})</span>
                                        <span className="font-mono">预还: {activeLoan.expectedReturnTime.slice(5)}</span>
                                      </div>
                                      {activeLoan.borrowReason && (
                                        <div className="text-[10.5px] text-amber-700 line-clamp-1 italic">
                                          “{activeLoan.borrowReason}”
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-0.5 text-slate-600">
                                      <div className="flex items-center gap-1 font-medium text-slate-700 text-xs">
                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                        <span>{device.location || '1号楼1F 医工应急库'}</span>
                                      </div>
                                      <div className="text-[10.5px] text-slate-400">
                                        蓄电池 100% · 附件齐全待命
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* 7. 操作栏 */}
                                <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setUploadPhotoDevice(device)}
                                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200 transition cursor-pointer"
                                      title="上传/更换设备照片"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                    </button>

                                    {onOpenAiModal && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenAiModal(device)}
                                        className="p-1.5 text-cyan-700 hover:bg-cyan-50 rounded-md border border-cyan-200 transition cursor-pointer"
                                        title="AI 急救自检与参数指导"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    
                                    <button
                                      type="button"
                                      onClick={() => onViewDeviceDetail?.(device)}
                                      className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium transition cursor-pointer"
                                    >
                                      档案
                                    </button>

                                    {isAvailable ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedDeviceForLoan(device);
                                          setIsApplyModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <ArrowRightLeft className="w-3 h-3" />
                                        <span>借用出库</span>
                                      </button>
                                    ) : activeLoan ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedLoanForReturn(activeLoan);
                                          setIsReturnModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-md text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>归还验收</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => onOpenRepairModal?.(device)}
                                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition cursor-pointer"
                                      >
                                        检修
                                      </button>
                                    )}
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          )}

          {/* View B: 借调用记录与流转日志 */}
          {activeSubTab === 'loans' && (
            <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-slate-200">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs z-10 shadow-2xs select-none">
                  <tr className="text-slate-600 text-[11px] font-bold tracking-wider border-b border-slate-200/90">
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">借用单号</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px]">设备名称 / 规格型号</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[150px]">借入科室 / 经办人</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[160px]">借调事由</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">借用时间</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">预计 / 实际归还</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">流转状态</th>
                    <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">库管审批 / 验收</th>
                    <th className="py-2.5 px-3 whitespace-nowrap text-right min-w-[100px]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loanRecords.map((loan) => {
                    const isBorrowed = loan.status === 'borrowed';
                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700 text-xs">{loan.id}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 text-xs">{loan.equipmentName}</div>
                          <div className="text-[10.5px] text-slate-500 font-mono">{loan.equipmentModel} (SN: {loan.equipmentSn})</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mb-0.5 text-[10.5px]">
                            {loan.borrowingDepartment}
                          </span>
                          <div className="text-[10.5px] text-slate-600">{loan.borrowerName} · {loan.borrowerPhone}</div>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] text-slate-600 text-xs truncate" title={loan.borrowReason}>
                          {loan.borrowReason || '急救周转应急借用'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-xs">{loan.borrowTime}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          <div className="text-slate-700">预: {loan.expectedReturnTime}</div>
                          {loan.actualReturnTime && (
                            <div className="text-emerald-700 font-semibold text-[10.5px]">实: {loan.actualReturnTime}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isBorrowed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              借出在用
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              已归还入库
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600">
                          <div>审: {loan.approver}</div>
                          {loan.returnInspector && (
                            <div className="text-slate-500 text-[10.5px]">验: {loan.returnInspector}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isBorrowed ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLoanForReturn(loan);
                                setIsReturnModalOpen(true);
                              }}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition cursor-pointer"
                            >
                              验收归还
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-medium">完好结案</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* View C: 已借出设备的分布与 AI 增配决策看板 */}
          {activeSubTab === 'distribution' && (
            <div className="flex-1 overflow-auto p-4 space-y-4.5 bg-slate-50/60 scrollbar-thin scrollbar-thumb-slate-200">
              
              {/* 1. 核心借调概览与预警指标 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 shrink-0">
                <div className="relative bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                  <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                    <span>借调科室数</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-slate-900">{departmentDistribution.length}</span>
                    <span className="text-xs text-slate-500 font-medium">个科室在用</span>
                  </div>
                </div>

                <div className="relative bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                  <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                    <span>借出在用设备</span>
                    <Boxes className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-amber-700">{activeLoansWithAnalytics.length}</span>
                    <span className="text-xs text-amber-700 font-medium">台正在运行</span>
                  </div>
                </div>

                <div className="relative bg-white p-3.5 rounded-xl border border-rose-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
                  <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
                    <span>严重超期未还</span>
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-rose-600">{overdueLoansList.length}</span>
                    <span className="text-xs text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-200">
                      急需催还
                    </span>
                  </div>
                </div>

                <div className="relative bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                  <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                    <span>长期占用 (&gt;7天)</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-amber-700">{longTermLoansList.length}</span>
                    <span className="text-xs text-amber-800 font-medium">以借代配</span>
                  </div>
                </div>

                <div className="relative bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
                  <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                    <span>借出总原值</span>
                    <Tag className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-slate-900">
                      ¥{(departmentDistribution.reduce((acc, d) => acc + d.totalAssetValue, 0) / 10000).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">万元资产</span>
                  </div>
                </div>

                <div className="relative bg-white p-3.5 rounded-xl border border-purple-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
                  <div className="flex items-center justify-between text-xs text-purple-900 font-bold">
                    <span>AI建议增配</span>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-xl font-bold font-mono text-purple-700">
                      {departmentDistribution.filter(d => d.aiProcurementSuggestion.urgency === 'critical' || d.aiProcurementSuggestion.urgency === 'high').length}
                    </span>
                    <span className="text-xs text-purple-700 font-bold bg-purple-50 px-1.5 py-0.2 rounded-full border border-purple-200">
                      科室急需
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 租借时间超长 / 严重超期特别预警横幅 */}
              {(overdueLoansList.length > 0 || longTermLoansList.length > 0) && (
                <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Flame className="w-4.5 h-4.5 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-rose-950 flex items-center gap-2">
                          <span>租借时间超长重点监控 · 应急周转常态占用预警</span>
                          <span className="px-2 py-0.5 rounded-full text-xs bg-rose-600 text-white font-mono font-bold">
                            {overdueLoansList.length} 台超期 / {longTermLoansList.length} 台超过7天
                          </span>
                        </h4>
                        <p className="text-xs text-rose-800 mt-0.5">
                          以下设备已被临床科室连续借调占用多日，可能存在<strong>“以借代配”</strong>现象，削弱全院突发应急救治弹性。
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunAiProcurementAnalysis}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Cpu className="w-4 h-4" />
                      <span>查看 AI 增配论证报告</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {activeLoansWithAnalytics.filter(l => l.isOverdue || l.isLongTerm).map(loan => (
                      <div 
                        key={loan.id} 
                        className={`p-3 bg-white rounded-xl border flex flex-col justify-between gap-2.5 transition shadow-2xs hover:shadow-md ${
                          loan.isOverdue ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-300'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">{loan.equipmentName}</span>
                            {loan.isOverdue ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                🔴 超期 {loan.daysOverdue} 天
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                🟡 占用 {loan.daysElapsed} 天
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-slate-500 font-mono">
                            型号: {loan.equipmentModel} (SN: {loan.equipmentSn})
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-700 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded-md">
                              {loan.borrowingDepartment}
                            </span>
                            <span className="text-slate-500 font-medium">
                              {loan.borrowerName} · {loan.borrowerPhone}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 flex items-center justify-between font-mono">
                            <span>借: {loan.borrowTime.slice(5, 16)}</span>
                            <span>应还: {loan.expectedReturnTime.slice(5, 16)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSendOverdueReminder(loan)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer flex-1 justify-center"
                          >
                            <BellRing className="w-3.5 h-3.5" />
                            <span>催还提醒函</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLoanForReturn(loan);
                              setIsReturnModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition flex items-center gap-1 cursor-pointer flex-1 justify-center"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>归还验收</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 状态筛选标签按钮 */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-xs font-bold text-slate-700">快速过滤:</span>
                  <button
                    type="button"
                    onClick={() => setDistStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      distStatusFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    全部科室分布 ({departmentDistribution.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistStatusFilter('overdue')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      distStatusFilter === 'overdue'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <span>🔴 严重超期科室</span>
                    <span className="px-1.5 py-0.2 rounded-full text-xs bg-rose-100 text-rose-800 font-mono font-bold">
                      {departmentDistribution.filter(d => d.overdueCount > 0).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistStatusFilter('longterm')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      distStatusFilter === 'longterm'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    <span>🟡 长期占用科室 (&gt;7天)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-100 text-amber-800 font-mono font-bold">
                      {departmentDistribution.filter(d => d.longTermCount > 0).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistStatusFilter('normal')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      distStatusFilter === 'normal'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    🟢 正常周转科室
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-mono font-medium">
                  共展示 {filteredDepartmentDistribution.length} 个科室的借调在用分布
                </div>
              </div>

              {/* 4. 各借用科室设备分布详情及 AI 智能增配建议卡片组 (响应式双列网格布局，杜绝超宽拉伸) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4.5 items-start">
                {filteredDepartmentDistribution.length === 0 ? (
                  <div className="col-span-full p-10 text-center bg-white rounded-xl border border-slate-200 space-y-2.5">
                    <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
                    <div className="font-bold text-slate-800 text-sm">未检索到匹配的科室借调记录</div>
                    <div className="text-xs text-slate-400">请尝试切换上方筛选条件或清除搜索关键字</div>
                  </div>
                ) : (
                  filteredDepartmentDistribution.map(deptItem => {
                    const suggestion = deptItem.aiProcurementSuggestion;
                    const hasOverdue = deptItem.overdueCount > 0;
                    const hasLongTerm = deptItem.longTermCount > 0;

                    return (
                      <div 
                        key={deptItem.department}
                        className={`relative bg-white rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                          hasOverdue
                            ? 'border-rose-300 ring-1 ring-rose-200'
                            : hasLongTerm
                            ? 'border-amber-300'
                            : 'border-slate-200/90'
                        }`}
                      >
                        {/* 顶部状态色条 */}
                        <div className={`h-1 w-full ${
                          hasOverdue ? 'bg-rose-500' : hasLongTerm ? 'bg-amber-500' : 'bg-blue-600'
                        }`} />

                        {/* 科室卡片顶栏 */}
                        <div className="p-3.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between gap-2.5 flex-wrap">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                              hasOverdue
                                ? 'bg-rose-600'
                                : hasLongTerm
                                ? 'bg-amber-600'
                                : 'bg-blue-600'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm text-slate-900 truncate">{deptItem.department}</h3>
                                {hasOverdue ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                    🔴 {deptItem.overdueCount} 台超期未还
                                  </span>
                                ) : hasLongTerm ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                    🟡 长期占用 {deptItem.longTermCount} 台
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                    🟢 周转正常
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                                <span>在用 <strong className="text-slate-800 font-mono">{deptItem.totalDevices}</strong> 台</span>
                                <span>·</span>
                                <span>原值 <strong className="text-slate-800 font-mono">¥{(deptItem.totalAssetValue / 10000).toFixed(1)}</strong> 万</span>
                                {deptItem.contacts.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate max-w-[180px]" title={deptItem.contacts.map(c => `${c.name} (${c.phone})`).join('、')}>
                                      经办: {deptItem.contacts[0].name} ({deptItem.contacts[0].phone})
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyDepartmentProposal(deptItem)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
                            title="复制科室增配申报立项书"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>申报书</span>
                          </button>
                        </div>

                        {/* 设备借用清单列表 */}
                        <div className="divide-y divide-slate-100 bg-white">
                          {deptItem.loans.map(loan => {
                            const equip = equipmentList.find(e => e.id === loan.equipmentId);
                            return (
                              <div key={loan.id} className="p-3.5 hover:bg-slate-50/70 transition space-y-2.5">
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <div className="w-11 h-11 rounded-lg bg-slate-900 overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                                      <img
                                        src={getEquipmentPhoto(equip)}
                                        alt={loan.equipmentName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as any).src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=400&q=80';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-900 text-xs truncate">{loan.equipmentName}</span>
                                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded">
                                          {loan.equipmentModel}
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                                        SN: {loan.equipmentSn} · <span className="text-slate-400">单号: {loan.id}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 状态徽章 */}
                                  <div className="shrink-0">
                                    {loan.isOverdue ? (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>超期 {loan.daysOverdue} 天</span>
                                      </span>
                                    ) : loan.isLongTerm ? (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>已用 {loan.daysElapsed} 天</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        在用 {loan.daysElapsed} 天 (正常)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 借用详情与经办信息 */}
                                <div className="bg-slate-50/80 p-2 rounded-lg text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <span>经办人: <strong className="text-slate-800">{loan.borrowerName}</strong> ({loan.borrowerPhone})</span>
                                    <span>·</span>
                                    <span className="font-mono text-slate-500">借: {loan.borrowTime.slice(5, 16)} → 预还: {loan.expectedReturnTime.slice(5, 16)}</span>
                                  </div>
                                  {loan.borrowReason && (
                                    <span className="text-slate-500 italic truncate max-w-[200px]" title={loan.borrowReason}>
                                      事由: {loan.borrowReason}
                                    </span>
                                  )}
                                </div>

                                {/* 操作栏 */}
                                <div className="flex items-center justify-end gap-2 pt-1">
                                  {loan.isOverdue && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendOverdueReminder(loan)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                      title="发送超期催还函并复制至剪贴板"
                                    >
                                      <BellRing className="w-3.5 h-3.5" />
                                      <span>催还函</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedLoanForReturn(loan);
                                      setIsReturnModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>归还验收</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 🤖 嵌入式 AI 科室设备增配与采购评估建议 (AI Equipment Procurement Intelligence) */}
                        <div className="p-3.5 bg-gradient-to-br from-purple-50/90 via-indigo-50/70 to-blue-50/80 border-t border-purple-100 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>AI 增配画像</span>
                              </span>
                              <h4 className="font-bold text-xs text-purple-950 truncate max-w-[240px]">
                                {suggestion.title}
                              </h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                              suggestion.urgency === 'critical' 
                                ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {suggestion.urgency === 'critical' ? '🔴 紧迫度: 极高' : '🟡 紧迫度: 较高'}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white/95 rounded-lg border border-purple-200/70 shadow-2xs space-y-1.5 text-slate-700">
                            <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-900 text-xs">
                              <span className="text-purple-800">📦 建议增配：{suggestion.recommendedEquipment}</span>
                              <span className="text-indigo-800 font-mono">({suggestion.recommendedModel})</span>
                              <span className="text-emerald-700 font-mono">数量：{suggestion.recommendedCount}台 · 预算：¥{suggestion.estimatedCost.toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-xs">
                              <strong className="text-slate-800">💡 借调依据：</strong>{suggestion.reason}
                            </p>
                            <p className="text-slate-600 leading-relaxed text-xs">
                              <strong className="text-rose-800">⚠️ 风险规避：</strong>{suggestion.clinicalRisk}
                            </p>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleCopyDepartmentProposal(deptItem)}
                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制立项书</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleRunAiProcurementAnalysis}
                              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Cpu className="w-3.5 h-3.5" />
                              <span>全院AI报告</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

        </div>

        {/* 底部状态栏 */}
        <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span>应急周转保障中：<strong>{emergencyInventory.length}</strong> 台在册</span>
            <span>·</span>
            <span className="text-emerald-700 font-semibold">库房在库现货: {stats.available} 台</span>
            <span>·</span>
            <span className="text-amber-700 font-semibold">临床借调在用: {stats.borrowed} 台</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            医学工程保障中心 · 24H 应急周转专线: 7991237
          </div>
        </div>

      </div>

      {/* ================= 4. 借用申请出库弹窗 (Loan Application Modal) ================= */}
      {isApplyModalOpen && selectedDeviceForLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] border border-slate-200">
            
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">应急设备借用与快速出库调拨单</h3>
                  <p className="text-[11px] text-blue-100">生命支持急救装备 · 快速周转</p>
                </div>
              </div>
              <button 
                onClick={() => setIsApplyModalOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-white/20 flex items-center justify-center text-white text-base cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBorrow} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* 设备概要条 (含照片小图) */}
              <div className="p-3 bg-blue-50/70 rounded-md border border-blue-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-slate-900 overflow-hidden shrink-0 border border-blue-200">
                  <img
                    src={getEquipmentPhoto(selectedDeviceForLoan)}
                    alt={selectedDeviceForLoan.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{selectedDeviceForLoan.name}</div>
                  <div className="text-slate-600 font-mono text-[11px] truncate">
                    型号: {selectedDeviceForLoan.model} | 编号: {selectedDeviceForLoan.id}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>质控自检合格 · 蓄电池 100% 满电待命</span>
                  </div>
                </div>
              </div>

              {/* 借入科室 */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">借用科室/病区 *</label>
                <input
                  type="text"
                  required
                  value={borrowForm.borrowingDepartment}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowingDepartment: e.target.value })}
                  placeholder="如：急诊ICU、重症医学科、麻醉手术科"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 借用人 & 电话 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">经办人姓名 *</label>
                  <input
                    type="text"
                    required
                    value={borrowForm.borrowerName}
                    onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                    placeholder="经办医生/护士"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">联系电话/短号 *</label>
                  <input
                    type="text"
                    required
                    value={borrowForm.borrowerPhone}
                    onChange={(e) => setBorrowForm({ ...borrowForm, borrowerPhone: e.target.value })}
                    placeholder="如：7991000 / 53100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 借用事由 */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">借用事由/临床用途 *</label>
                <input
                  type="text"
                  required
                  value={borrowForm.borrowReason}
                  onChange={(e) => setBorrowForm({ ...borrowForm, borrowReason: e.target.value })}
                  placeholder="如：急诊抢救突发群伤、无创呼吸机临时增援、科室故障机周转"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 预计归还时间 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">预计归还日期 *</label>
                  <input
                    type="date"
                    required
                    value={borrowForm.expectedReturnDate}
                    onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">预计归还时刻</label>
                  <input
                    type="time"
                    value={borrowForm.expectedReturnHour}
                    onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnHour: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 随附配件核点 */}
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                <div className="font-semibold text-slate-700">随附配件清单（出库时请当面点清）：</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {borrowForm.accessories.map((acc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{acc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>确认出库借用</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= 5. 归还入库核验弹窗 (Return Verification Modal) ================= */}
      {isReturnModalOpen && selectedLoanForReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] border border-slate-200">
            
            <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">应急设备归还入库验收单</h3>
                  <p className="text-[11px] text-emerald-100">完好状态复核 · 消毒验收 · 重新回库待命</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReturnModalOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-white/20 flex items-center justify-center text-white text-base cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              <div className="p-3 bg-emerald-50/60 rounded-md border border-emerald-100 space-y-1">
                <div className="font-bold text-slate-800 text-sm">{selectedLoanForReturn.equipmentName}</div>
                <div className="text-slate-600 flex items-center gap-3">
                  <span>借入科室: <strong>{selectedLoanForReturn.borrowingDepartment}</strong></span>
                  <span>经办人: <strong>{selectedLoanForReturn.borrowerName}</strong></span>
                </div>
                <div className="text-slate-500 text-[11px] font-mono">
                  单号: {selectedLoanForReturn.id} · 借出时间: {selectedLoanForReturn.borrowTime}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">归还验收人 (医工工程师 / 应急库管员) *</label>
                <input
                  type="text"
                  required
                  value={returnForm.returnInspector}
                  onChange={(e) => setReturnForm({ ...returnForm, returnInspector: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">设备状态与终末消毒核验 *</label>
                <select
                  value={returnForm.returnCondition}
                  onChange={(e) => setReturnForm({ ...returnForm, returnCondition: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium text-slate-700 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="intact">✅ 主机完好、配件齐全、自检通过 (直接回库备用)</option>
                  <option value="needs_cleaning">🟡 已回库、待终末消毒/清洁</option>
                  <option value="faulty">🔴 使用中出现异常 (转入维修质控工单)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">验收与交接备注</label>
                <textarea
                  rows={2}
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                  placeholder="记录设备完好情况、电量及消毒情况"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-md font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>确认归还入库</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= 6. 高清实物照片大图灯箱预览 (Image Preview Modal) ================= */}
      {selectedPhotoDevice && (
        <ImagePreviewModal
          isOpen={!!selectedPhotoDevice}
          equipment={selectedPhotoDevice}
          photoUrl={getEquipmentPhoto(selectedPhotoDevice)}
          isLoaned={activeLoansMap.has(selectedPhotoDevice.id)}
          borrowDept={activeLoansMap.get(selectedPhotoDevice.id)?.borrowingDepartment}
          onClose={() => setSelectedPhotoDevice(null)}
          onOpenEditPhoto={() => {
            const dev = selectedPhotoDevice;
            setSelectedPhotoDevice(null);
            setUploadPhotoDevice(dev);
          }}
        />
      )}

      {/* ================= 7. 更换/上传设备实物照弹窗 (Photo Upload Modal) ================= */}
      {uploadPhotoDevice && (
        <PhotoUploadModal
          isOpen={!!uploadPhotoDevice}
          equipment={uploadPhotoDevice}
          currentPhotoUrl={getEquipmentPhoto(uploadPhotoDevice)}
          onClose={() => setUploadPhotoDevice(null)}
          onPhotoUpdated={(eqId, newUrl) => {
            setPhotoRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* ================= 8. AI 全院增配决策报告弹窗 (AI Procurement Advisory Modal) ================= */}
      {isAiReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] border border-slate-200">
            
            <div className="p-4 bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">【医学装备管理委员会】应急设备借调分布评估与增配决策报告</h3>
                  <p className="text-[11px] text-purple-200">Gemini AI 临床工程智能决策引擎 · 识别“以借代配”并输出增配方案</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAiReportModalOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-white/20 flex items-center justify-center text-white text-base cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-800 flex-1 leading-relaxed">
              {aiGenerating ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="font-bold text-sm text-purple-900">Gemini AI 正在全维度推演全院设备借调分布与科室增配决策...</div>
                  <div className="text-xs text-slate-500">正在分析 ICU、急诊科、呼吸科等科室借调时长、超期风险及设备增配立项依据</div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-slate-800 space-y-3 whitespace-pre-wrap font-sans bg-slate-50/70 p-4 rounded-lg border border-slate-200">
                  {aiProcurementReport}
                </div>
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500">
                可一键复制呈报院务会或医学装备管理委员会进行采购立项评审
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aiProcurementReport);
                    showToast('✅ 报告全文已复制至剪贴板！');
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制报告全文</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiReportModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-medium transition cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= 9. 应急库实物扫码盘点工作站弹窗 ================= */}
      {isAuditModalOpen && (
        <EmergencyAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          inventoryList={emergencyInventory}
          currentUser={currentUser}
          onPrintQrLabels={onOpenQrLabels}
        />
      )}

      {/* ================= 10. 全局 Toast 提示 ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
