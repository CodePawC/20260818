import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Printer,
  ChevronRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  Wrench,
  Activity,
  Boxes,
  QrCode,
  FileCheck,
  Calculator,
  Sliders,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Users,
  Compass,
  FileText,
  KeyRound,
  Download,
  AlertOctagon,
  TrendingUp,
  Clock,
  RotateCcw,
  ListChecks,
  Table,
  PhoneCall,
  Flame,
  Zap,
  Bookmark,
  Award,
  FileSpreadsheet,
  CheckSquare,
  XSquare,
  PlayCircle,
  Eye,
  GraduationCap,
  ListTree,
  Star,
  Trash2,
  BookmarkCheck,
  ArrowUp
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';
import { OperationalSandbox } from './manual/OperationalSandbox';
import { HospitalAccreditationQuiz } from './manual/HospitalAccreditationQuiz';
import { HospitalStandardFormsModal } from './manual/HospitalStandardFormsModal';
import { ManualCalculatorTools } from './manual/ManualCalculatorTools';
import { ManualVisualDiagrams } from './manual/ManualVisualDiagrams';
import { ManualCaseStudies } from './manual/ManualCaseStudies';
import { ManualLazyImage } from './manual/ManualLazyImage';

export interface ManualFavoriteItem {
  id: string;
  title: string;
  chapterId: string;
  chapterCode: string;
  type: 'chapter' | 'section';
  pinnedAt: number;
}

interface UserManualViewProps {
  currentUser?: AuthUser;
  onNavigateTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
}

export type UserRoleFilter = 'all' | 'clinical' | 'engineer' | 'executive' | 'vendor';

interface ChapterSection {
  id: string;
  title: string;
  roleAudience: UserRoleFilter[];
  content: React.ReactNode;
  directTab?: ActiveTab;
  tabLabel?: string;
}

interface Chapter {
  id: string;
  code: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  roleAudience: UserRoleFilter[];
  summary: string;
  sections: ChapterSection[];
}

export const UserManualView: React.FC<UserManualViewProps> = ({
  currentUser,
  onNavigateTab,
  showToast
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRoleFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('ch-01');
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'chapters' | 'diagrams' | 'cases' | 'sandbox' | 'quiz' | 'forms' | 'calculators'>('chapters');

  // 交互式索引与常用收藏状态
  const [favorites, setFavorites] = useState<ManualFavoriteItem[]>(() => {
    try {
      const raw = localStorage.getItem('hospital_manual_favorites');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load manual favorites', e);
    }
    // 首次提供生产级高频操作常用收藏默认值
    return [
      { id: 'ch-02', title: 'CH-02 临床一键报修与移动巡检SOP', chapterId: 'ch-02', chapterCode: 'CH-02', type: 'chapter', pinnedAt: 1700000000000 },
      { id: 'sec-04-01', title: '强检计量器具台账建档与检定计划编制', chapterId: 'ch-04', chapterCode: 'CH-04', type: 'section', pinnedAt: 1700000001000 },
      { id: 'ch-07', title: 'CH-07 外协送修全流程与联合谈判', chapterId: 'ch-07', chapterCode: 'CH-07', type: 'chapter', pinnedAt: 1700000002000 },
      { id: 'sec-05-02', title: '急救储备在位状态与蓝牙信标巡更', chapterId: 'ch-05', chapterCode: 'CH-05', type: 'section', pinnedAt: 1700000003000 }
    ];
  });

  const [onlyShowFavorites, setOnlyShowFavorites] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'continuous' | 'single'>('continuous');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [tocTreeSearch, setTocTreeSearch] = useState<string>('');
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState<boolean>(true);

  // 章节子目录展开收起控制
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-01': true,
    'ch-02': true,
    'ch-03': false,
    'ch-04': true,
    'ch-05': false,
    'ch-06': false,
    'ch-07': true,
    'ch-08': false,
    'ch-09': false,
    'ch-10': false,
    'ch-11': false,
    'ch-12': false,
    'ch-13': false,
    'ch-14': false,
    'ch-15': false
  });

  // 监听滚动以控制回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 380);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 判断是否收藏
  const isFavorite = (id: string) => favorites.some(f => f.id === id);

  // 切换收藏
  const toggleFavorite = (item: Omit<ManualFavoriteItem, 'pinnedAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === item.id);
      let updated: ManualFavoriteItem[];
      if (exists) {
        updated = prev.filter(f => f.id !== item.id);
        if (showToast) showToast(`已从常用指南收藏中移除: ${item.title}`);
      } else {
        updated = [{ ...item, pinnedAt: Date.now() }, ...prev];
        if (showToast) showToast(`已收藏至常用操作指南: ${item.title}`);
      }
      try {
        localStorage.setItem('hospital_manual_favorites', JSON.stringify(updated));
      } catch (err) {
        console.error('Save favorites error', err);
      }
      return updated;
    });
  };

  // 清空所有收藏
  const clearAllFavorites = () => {
    if (window.confirm('确定要清空您保存的所有常用操作指南收藏吗？')) {
      setFavorites([]);
      try {
        localStorage.removeItem('hospital_manual_favorites');
      } catch (e) {
        console.error(e);
      }
      if (showToast) showToast('已清空全部常用指南收藏');
    }
  };

  // 全部展开/收起目录树
  const toggleExpandAll = (expand: boolean) => {
    setExpandedChapters(prev => {
      const next: Record<string, boolean> = {};
      Object.keys(prev).forEach(k => {
        next[k] = expand;
      });
      // 保证15个章节都被覆盖
      for (let i = 1; i <= 15; i++) {
        const id = `ch-${String(i).padStart(2, '0')}`;
        next[id] = expand;
      }
      return next;
    });
  };

  // 平滑滚动至目标章节或小节锚点
  const scrollToTarget = (chapterId: string, sectionId?: string) => {
    setActiveChapterId(chapterId);
    // 自动展开目标章节目录
    setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
    
    const targetAnchorId = sectionId || chapterId;

    const performScroll = () => {
      const el = document.getElementById(targetAnchorId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedId(targetAnchorId);
        setTimeout(() => {
          setHighlightedId(prev => (prev === targetAnchorId ? null : prev));
        }, 2200);
      }
    };

    if (viewLayout === 'single' && activeChapterId !== chapterId) {
      setTimeout(performScroll, 90);
    } else {
      performScroll();
    }
  };

  // 演练沙盘状态 (Interactive Sandbox)
  const [sandboxTab, setSandboxTab] = useState<'repair' | 'loan' | 'inspection'>('repair');
  const [sandboxRepairStep, setSandboxRepairStep] = useState<number>(1);
  const [sandboxLoanStep, setSandboxLoanStep] = useState<number>(1);
  const [sandboxInspStep, setSandboxInspStep] = useState<number>(1);

  // 交互式小工具 1: DRG折旧与保本点测算器状态
  const [calcPrice, setCalcPrice] = useState<number>(2800000);
  const [calcYears, setCalcYears] = useState<number>(8);
  const [calcSalvage, setCalcSalvage] = useState<number>(5);
  const [calcMonthlyCases, setCalcMonthlyCases] = useState<number>(650);
  const [calcFeePerCase, setCalcFeePerCase] = useState<number>(260);
  const [calcConsumableCost, setCalcConsumableCost] = useState<number>(45);
  const [calcStaffPowerCost, setCalcStaffPowerCost] = useState<number>(35);

  // 测算结果
  const calcResults = useMemo(() => {
    const totalMonths = Math.max(calcYears * 12, 1);
    const depreciableTotal = calcPrice * (1 - calcSalvage / 100);
    const monthlyDepreciation = depreciableTotal / totalMonths;
    const perCaseDepreciation = calcMonthlyCases > 0 ? monthlyDepreciation / calcMonthlyCases : 0;
    const totalVariableCostPerCase = calcConsumableCost + calcStaffPowerCost;
    const contributionMarginPerCase = Math.max(calcFeePerCase - totalVariableCostPerCase, 0.01);
    const breakEvenMonthlyCases = Math.ceil(monthlyDepreciation / contributionMarginPerCase);
    const monthlyNetIncome = (calcMonthlyCases * calcFeePerCase) - (calcMonthlyCases * totalVariableCostPerCase) - monthlyDepreciation;
    const annualNetIncome = monthlyNetIncome * 12;
    const paybackYears = annualNetIncome > 0 ? (calcPrice / annualNetIncome).toFixed(1) : '无法收回';

    return {
      monthlyDepreciation: Math.round(monthlyDepreciation),
      perCaseDepreciation: perCaseDepreciation.toFixed(1),
      breakEvenMonthlyCases,
      monthlyNetIncome: Math.round(monthlyNetIncome),
      paybackYears
    };
  }, [calcPrice, calcYears, calcSalvage, calcMonthlyCases, calcFeePerCase, calcConsumableCost, calcStaffPowerCost]);

  // 交互式小工具 2: 强检器具智能速查过滤
  const [metroSearch, setMetroSearch] = useState<string>('');
  const metroCatalogues = [
    { name: '心电图机 / 动态心电(Holter)', code: 'QJ-01', period: '12个月', policy: '免征(国家免费)', law: '《中华人民共和国计量法实施细则》第27条', agency: '日照市/省级法定计量检定机构', notes: '开箱后首次投用前必须强制首检，贴绿色合格标签' },
    { name: '医用超声诊断仪 (B超/彩超)', code: 'QJ-02', period: '12个月', policy: '免征(国家免费)', law: 'JJG 639 医用超声源检定规程', agency: '法定计量检定机构', notes: '重点检测轴向分辨力、横向分辨力及探测深度' },
    { name: '除颤仪 / 除颤监护仪', code: 'QJ-03', period: '6个月', policy: '免征(国家免费)', law: 'JJG 768 除颤器及除颤起搏器检定规程', agency: '省级法定计量科学研究院', notes: '生命急救关键设备，严格执行6个月周期，放电能量误差需<15%' },
    { name: '高频电刀 / 能量平台', code: 'QJ-04', period: '12个月', policy: '免征(国家免费)', law: 'JJG 892 高频电刀检定规程', agency: '法定计量检测中心', notes: '手术室高危设备，重点校验高频输出功率及漏电流' },
    { name: '医用输液泵 / 微量注射泵', code: 'QJ-05', period: '12个月', policy: '免征(国家免费)', law: 'JJG 1090 输液泵和微量注射泵检定规程', agency: '法定计量检定机构', notes: '重症监护及儿科常用，流速误差须控制在 ±5% 允许限值内' },
    { name: '多参数监护仪 (生命体征)', code: 'QJ-06', period: '12个月', policy: '免征(国家免费)', law: 'JJG 1163 多参数监护仪检定规程', agency: '法定计量科学研究院', notes: '覆盖心电、无创血压(NIBP)、血氧饱和度(SpO2)多参数联合定标' },
    { name: '医用生化分析仪 / 发光仪', code: 'QJ-07', period: '12个月', policy: '定期校准(自费)', law: 'JJG 464 半自动生化分析仪', agency: '具备CNAS资质的第三方校准实验室', notes: '吸光度准确度、重复性及杂散光系数核验' },
    { name: '灭菌压力蒸汽压力表 / 真空表', code: 'QJ-08', period: '6个月', policy: '免征(国家免费)', law: 'JJG 52 弹性元件式精密压力表和真空表', agency: '法定特种设备计量检验所', notes: '供应室高压灭菌关键安全附件，超期严禁上岗' }
  ];

  const filteredMetroCatalogues = useMemo(() => {
    if (!metroSearch.trim()) return metroCatalogues;
    const q = metroSearch.toLowerCase().trim();
    return metroCatalogues.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.agency.toLowerCase().includes(q));
  }, [metroCatalogues, metroSearch]);

  // 交互式小工具 3: 常见设备报警排除速查
  const [alarmDeviceFilter, setAlarmDeviceFilter] = useState<'all' | 'monitor' | 'defib' | 'electrosurgical' | 'ventilator'>('all');
  const alarmGuideList = [
    { category: 'monitor', device: '多参数心电监护仪', code: 'LEAD OFF / 导联脱落', reason: '电极片干涸、患者皮肤出汗油脂多、电极导联线插头松动', fix: '清洁患者局部皮肤，更换新电极片，加压贴紧并按解剖位置重贴；检查导联电缆卡口锁定' },
    { category: 'monitor', device: '多参数心电监护仪', code: 'SpO2 SENSOR OFF / 探头未检测', reason: '血氧指夹脱落、指甲油遮挡光路、末梢循环灌注极低', fix: '去除指甲油或将指夹换至对侧肢体；保暖肢体改善微循环；检查传感器线缆有无压折断针' },
    { category: 'monitor', device: '多参数心电监护仪', code: 'NIBP CUFF LEAK / 血压袖带漏气', reason: '袖带气囊老化破损、快速接头未卡紧到位、气囊缠绕过松', fix: '更换新袖带，将气管公母接头用力推入听到“咔嗒”声；袖带松紧以容纳一指为宜' },
    { category: 'defib', device: '除颤监护仪', code: 'BATTERY LOW / 电池电量极低', reason: '外接交流电源线脱落、未按规定常态插电浮充、电池组老化', fix: '立即插上机身标配医用电源线；检查后面板绿色交流指示灯是否点亮；浮充不少于4小时' },
    { category: 'defib', device: '除颤监护仪', code: 'DEFIB SELF-TEST FAIL / 自检未通过', reason: '除颤电极板未完全推入底座测试插孔、导电膏残留绝缘', fix: '取下电极板用湿纱布擦净残留导电膏并擦干，重新平稳推入机身插槽直至锁止蜂鸣' },
    { category: 'electrosurgical', device: '高频电火花手术刀', code: 'RETURN FAULT / 负极板回路报警', reason: '双回路负极板与患者肌肉接触不良、贴合面积不足、导线断路', fix: '必须立即暂停电凝！检查负极板是否平整贴在肌肉丰厚无骨突处（如大腿或臀部），严禁翘边' },
    { category: 'ventilator', device: '呼吸机 (德尔格/迈瑞)', code: 'HIGH PRESSURE / 气道高压报警', reason: '患者呼吸道分泌物堵塞、气管插管打折咬管、人机对抗、管路积水', fix: '立即听诊肺部呼吸音并按需吸痰；倾倒集水杯冷凝水；必要时给予镇静或纯氧手动通气过渡' },
    { category: 'ventilator', device: '呼吸机 (德尔格/迈瑞)', code: 'APNEA / 窒息通气触发', reason: '自主呼吸微弱脱离支持阈值、呼气流量传感器受潮失真', fix: '呼吸机已自动切换至安全窒息备用通气模式；评估患者自主意识与呼吸节律；校准呼气流量阀' }
  ];

  const filteredAlarms = useMemo(() => {
    if (alarmDeviceFilter === 'all') return alarmGuideList;
    return alarmGuideList.filter(a => a.category === alarmDeviceFilter);
  }, [alarmGuideList, alarmDeviceFilter]);

  // NMPA 22大类医疗器械分类代码表
  const nmpa22Categories = [
    { code: '01', name: '有源手术器械', examples: '高频电刀、超声手术刀、内窥镜冷光源', risk: 'III/II类', depYears: '6~8年' },
    { code: '02', name: '无源手术器械', examples: '手术刀柄、手术剪、血管钳、骨科手术工具', risk: 'I/II类', depYears: '5年' },
    { code: '03', name: '神经和心血管手术器械', examples: '心血管球囊扩张导管、神经吻合夹', risk: 'III类', depYears: '5~8年' },
    { code: '04', name: '骨科手术器械', examples: '人工关节置入工具、骨钻、骨锯', risk: 'I/II类', depYears: '5~8年' },
    { code: '05', name: '放射治疗器械', examples: '医用直线加速器、钴60治疗机、伽马刀', risk: 'III类', depYears: '10~12年' },
    { code: '06', name: '医用成像器械', examples: 'CT扫描机、磁共振MRI、DSA系统、医用超声', risk: 'III/II类', depYears: '8~10年' },
    { code: '07', name: '医用诊察和监护器械', examples: '多参数监护仪、心电图机、电子体温计、脑电图', risk: 'II类', depYears: '6~8年' },
    { code: '08', name: '呼吸、麻醉和急救器械', examples: '麻醉机、呼吸机、除颤监护仪、微量输液泵', risk: 'III/II类', depYears: '6~8年' },
    { code: '09', name: '物理治疗及康复器械', examples: '超短波治疗仪、体外冲击波碎石机、牵引床', risk: 'II类', depYears: '6~8年' },
    { code: '10', name: '中医器械', examples: '针灸针、中医经络检测仪、熏蒸治疗舱', risk: 'I/II类', depYears: '5~8年' },
    { code: '11', name: '医疗器械消毒灭菌器械', examples: '高压蒸汽灭菌器、过氧化氢低温等离子灭菌舱', risk: 'II类', depYears: '8~10年' },
    { code: '12', name: '有源植入器械', examples: '心脏起搏器、人工耳蜗', risk: 'III类', depYears: '特殊管理' },
    { code: '13', name: '无源植入器械', examples: '心脏支架、人工骨瓣、人工晶状体', risk: 'III类', depYears: '一次性/单耗' },
    { code: '14', name: '注输、护理和防护器械', examples: '注射器、造瘘袋、医用防护服、输血器具', risk: 'I/II/III类', depYears: '低值耗材' },
    { code: '15', name: '患者承载器械', examples: '电动手术床、多功能病床、轮椅、转运推车', risk: 'I/II类', depYears: '8年' },
    { code: '16', name: '眼科器械', examples: '裂隙灯显微镜、超声乳化仪、非接触眼压计', risk: 'II/III类', depYears: '8年' },
    { code: '17', name: '口腔科器械', examples: '牙科综合治疗台、洁牙机、光固化机', risk: 'II类', depYears: '8年' },
    { code: '18', name: '妇产科、辅助生殖器械', examples: '胎儿监护仪、产床、宫腔镜系统', risk: 'II/III类', depYears: '6~8年' },
    { code: '19', name: '医用软件', examples: 'PACS影像归档、移动远程心电诊断平台', risk: 'II/III类', depYears: '3~5年' },
    { code: '20', name: '中医辨证与诊断器械', examples: '舌诊仪、脉诊仪', risk: 'II类', depYears: '6年' },
    { code: '21', name: '医用冷藏与保存设备', examples: '医用血液冷藏箱、超低温冰箱(-86℃)', risk: 'II类', depYears: '8~10年' },
    { code: '22', name: '临床检验器械', examples: '全自动生化分析仪、五分类血球仪、尿沉渣', risk: 'II/III类', depYears: '6~8年' }
  ];

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSectionId(sectionId);
    if (showToast) {
      showToast('已复制该章节操作指引内容至剪贴板');
    }
    setTimeout(() => {
      setCopiedSectionId(null);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 15 大详实篇章
  const chapters: Chapter[] = useMemo(() => [
    {
      id: 'ch-01',
      code: 'CH-01',
      title: '系统架构、三级闭环管理与全员入门',
      icon: Compass,
      roleAudience: ['all', 'clinical', 'engineer', 'executive', 'vendor'],
      summary: '五莲县人民医院三级闭环管理架构、角色权限配置表、登录改密指引与Ctrl+K快捷键。',
      sections: [
        {
          id: 'sec-01-01',
          title: '系统定位与三级公立医院评审达标标准',
          roleAudience: ['all'],
          content: (
            <div className="space-y-3 text-slate-700 leading-relaxed text-xs sm:text-sm">
              <p>
                <strong>五莲县人民医院医学装备全生命周期闭环管理信息系统 (MED-TECH OS)</strong> 是依据《中华人民共和国基本医疗卫生与健康促进法》、国家卫生健康委《医疗器械使用质量监督管理办法》及三甲医院评审标准（第四篇医疗装备管理），结合日照市社科重点课题科研实证构建的数字化医工协同平台。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>一级：临床网格责任制</span>
                  </div>
                  <div className="text-2xs text-blue-800 leading-normal">
                    各临床病区、手术室、ICU、门诊科室护士长及设备专管员负第一责任，执行晨间开机自检、扫码在位纠偏、报修发起与借调签收。
                  </div>
                </div>
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>二级：医学工程技术闭环</span>
                  </div>
                  <div className="text-2xs text-emerald-800 leading-normal">
                    医学工程保障中心工程师执行 7×24H 抢修派工、备件库存管理、法定强检申报、技术预防维护(PM)及外协联合议价。
                  </div>
                </div>
                <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200">
                  <div className="text-xs font-bold text-purple-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>三级：管委会与院领导决策</span>
                  </div>
                  <div className="text-2xs text-purple-800 leading-normal">
                    医学装备管理委员会、分管院长与财务资产科统筹设备准入论证、DRG专机折旧勾稽、投资回报率(ROI)分析与报废销账。
                  </div>
                </div>
              </div>

              {/* 三级闭环管理数字网格架构图解 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>【图解 1-1】五莲县人民医院“三级闭环”数字化数据流转拓扑</span>
                  </div>
                  <span className="text-2xs text-blue-700 font-mono font-bold">闭环率目标: 100%</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                  <div className="p-3 bg-white border-2 border-blue-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-2xs font-bold text-blue-900">
                      <span>一级 · 临床网格应用端</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-3xs">源头</span>
                    </div>
                    <div className="text-2xs text-slate-600 leading-snug">
                      • 晨检开机自查 & 交接登记<br />
                      • 手机/PDA 扫码在位纠偏<br />
                      • P0/P1 极速发起故障报修<br />
                      • 通电试机与手写签字验收
                    </div>
                  </div>

                  <div className="p-3 bg-white border-2 border-emerald-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-2xs font-bold text-emerald-900">
                      <span>二级 · 医学工程技术保障中心</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-3xs">技术枢纽</span>
                    </div>
                    <div className="text-2xs text-slate-600 leading-snug">
                      • 20分钟 SLA 急诊抢修派工<br />
                      • 备品备件库领料与扣减<br />
                      • GB 9706.1 医用电气安全测试<br />
                      • 法定计量强检 e-CQS 申报
                    </div>
                  </div>

                  <div className="p-3 bg-white border-2 border-purple-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-2xs font-bold text-purple-900">
                      <span>三级 · 决策与质控审计层</span>
                      <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-3xs">决策管控</span>
                    </div>
                    <div className="text-2xs text-slate-600 leading-snug">
                      • DRG 专机折旧勾稽与效益测算<br />
                      • 外协维修四方联合谈判议价<br />
                      • 超期服役稳定性特许准用备案<br />
                      • 国有资产四级技术报废下账
                    </div>
                  </div>
                </div>
              </div>

              {/* 规程实景图解（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"
                  alt="五莲县人民医院医学装备指挥中心大屏调度实境"
                  figureNumber="【实景图例 1-1】"
                  caption="医学装备技术保障中心数字化全景指挥台与多维看板"
                  sourceNote="五莲县人民医院医学工程保障中心实拍 · 7×24H 动态三级闭环调度"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        },
        {
          id: 'sec-01-02',
          title: '岗位人员角色全景权限矩阵',
          roleAudience: ['all', 'clinical', 'engineer', 'executive'],
          content: (
            <div className="space-y-3 text-slate-700 leading-relaxed text-xs sm:text-sm">
              <p>系统按医院科室行政编制定制了严谨的角色授权，防止临床医护误触后端派工或敏感财务配置：</p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">岗位角色</th>
                      <th className="px-3 py-2.5">典型代表用户</th>
                      <th className="px-3 py-2.5">可见侧边栏专属模块</th>
                      <th className="px-3 py-2.5">核心业务操作范围</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">临床护士长 / 设备专管员</td>
                      <td className="px-3 py-2">麻醉手术科、急诊科、普外科等护士长</td>
                      <td className="px-3 py-2 text-blue-700 font-medium">科室台账、移动巡检、科室报修、急救调配、审批中心、操作指南</td>
                      <td className="px-3 py-2 text-slate-600">晨间盘点、扫码纠偏、发起报修、借调急救机具、维修完成手写签名确认</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">医学工程维修工程师</td>
                      <td className="px-3 py-2">崔伟 (主任工程师)、李明 (驻点工程师)</td>
                      <td className="px-3 py-2 text-emerald-700 font-medium">设备台账、智能派工、维修闭环、维保强检、备品库存、系统体检</td>
                      <td className="px-3 py-2 text-slate-600">全院设备抢修接单、出库换件、计量送检登记、超期服役稳定性测试申报</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">医学工程科长 / 质控主管</td>
                      <td className="px-3 py-2">赵文博 (医学工程科长)</td>
                      <td className="px-3 py-2 text-indigo-700 font-medium">全院全量菜单、监管平台档案、外协议价中心、报废鉴定审核、不良事件直报</td>
                      <td className="px-3 py-2 text-slate-600">工单质控终审、生态环保与市监特检等监管系统统一运维、外协三方议价审批、规章制度发布</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">财务资产科与分管院领导</td>
                      <td className="px-3 py-2">张明理 (分管副院长)、王淑华 (财务资产科)</td>
                      <td className="px-3 py-2 text-purple-700 font-medium">单机效益ROI、DRG专耗核算、三甲国考质控、课题结项评审</td>
                      <td className="px-3 py-2 text-slate-600">大型设备全生命周期折旧审查、保本点分析、资金请款单审批、报废终审下账</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">外部维保与原厂服务商</td>
                      <td className="px-3 py-2">GE医疗服务工程师、西门子原厂专家</td>
                      <td className="px-3 py-2 text-amber-700 font-medium">供应商专属协同门户、报价中心、工单进度跟踪</td>
                      <td className="px-3 py-2 text-slate-600">手机端查阅外协报修需求、提交零配件明细报价、上传完工检验报告</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        },
        {
          id: 'sec-01-03',
          title: '全局智慧命令盘与高频快捷键速查表',
          roleAudience: ['all'],
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm">
              <p>为了让临床紧急抢救与日常办公提速，系统深度适配键盘快捷操作：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <div className="px-2 py-1 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-blue-700">
                    Ctrl + K / ⌘ + K
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">唤起全局智慧命令盘</div>
                    <div className="text-slate-500 mt-0.5">秒级模糊检索全院 1600+ 台设备、出厂SN号、科室人员、管理制度与操作手册。</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <div className="px-2 py-1 bg-white border border-slate-300 rounded shadow-2xs font-mono font-bold text-blue-700">
                    Esc
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">快速关闭弹出窗口</div>
                    <div className="text-slate-500 mt-0.5">在设备详情、报修弹窗、巡检核验窗口中按下 Esc 键即可即时安全退出。</div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-02',
      code: 'CH-02',
      title: '设备技术台账、NMPA22大类与空间档案',
      icon: Layers,
      roleAudience: ['all', 'clinical', 'engineer', 'executive'],
      summary: '一机一档数字卡片、NMPA22大类交互速查、健康评分模型与草料防水活码标签打印。',
      sections: [
        {
          id: 'sec-02-01',
          title: '新机入库建卡全字段录入标准',
          roleAudience: ['engineer', 'clinical'],
          directTab: 'ledger',
          tabLabel: '设备技术台账',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>
                每台新购或转入设备在投用前，医学工程科须在「设备技术台账」中完成**数字化建卡**。必填与核心字段规范如下：
              </p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
                <table className="w-full text-left divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold">
                    <tr>
                      <th className="px-3 py-2">字段类别</th>
                      <th className="px-3 py-2">具体字段名称</th>
                      <th className="px-3 py-2">填写规范与参考样例</th>
                      <th className="px-3 py-2">系统联动逻辑</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">基础资产标识</td>
                      <td className="px-3 py-2">设备名称、规格型号、出厂编号(SN)</td>
                      <td className="px-3 py-2 text-slate-600">例：西门子64排螺旋CT / SOMATOM go.Top / SN: 104928</td>
                      <td className="px-3 py-2 text-blue-600">作为全局唯一硬件溯源码，扫码时优先依据SN与活码匹配</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">财务价值信息</td>
                      <td className="px-3 py-2">购入原值(元)、启用日期、设计使用年限</td>
                      <td className="px-3 py-2 text-slate-600">例：¥3,850,000 / 2021-06-15 / 设计寿命 8年</td>
                      <td className="px-3 py-2 text-purple-600">联动生成折旧价值衰减曲线与DRG单次检查分摊额</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">空间网格属性</td>
                      <td className="px-3 py-2">院区、楼宇、楼层、安装物理房间</td>
                      <td className="px-3 py-2 text-slate-600">例：总院区 / 1号楼 综合楼 / 3F / 超声诊断1室</td>
                      <td className="px-3 py-2 text-emerald-600">支撑移动巡检“在位纠偏”与数字孪生空间热力渲染</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-900">监管与计量</td>
                      <td className="px-3 py-2">NMPA分类代码、计量类别、强检周期</td>
                      <td className="px-3 py-2 text-slate-600">例：06 医用成像器械 / 周期校准 / 12个月</td>
                      <td className="px-3 py-2 text-amber-600">自动计入法定强检到期倒计时提醒与年度申报台账</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 草料防水活码设备标签实物标样图解 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>【实物图解 2-1】医院草料防水耐候设备标签实物规范 (60mm × 40mm 亚银PET)</span>
                  </div>
                  <span className="text-2xs text-slate-500 font-mono">耐受84含氯消毒擦拭</span>
                </div>

                <div className="max-w-md mx-auto bg-white border-2 border-slate-400 rounded-lg p-3.5 shadow-sm space-y-2 relative overflow-hidden">
                  <div className="bg-blue-700 text-white px-2.5 py-1 rounded text-center text-xs font-bold tracking-wider flex items-center justify-between">
                    <span>五莲县人民医院</span>
                    <span className="text-2xs font-normal">医学装备统一数字标识</span>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center pt-1">
                    {/* 左侧二维码仿真 */}
                    <div className="col-span-4 p-1.5 bg-slate-50 border border-slate-300 rounded flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-900 rounded p-1 flex items-center justify-center relative">
                        <div className="grid grid-cols-5 gap-0.5 w-full h-full p-1 bg-white">
                          <div className="bg-black" /><div className="bg-black" /><div className="bg-black" /><div className="bg-white" /><div className="bg-black" />
                          <div className="bg-black" /><div className="bg-white" /><div className="bg-black" /><div className="bg-black" /><div className="bg-white" />
                          <div className="bg-black" /><div className="bg-black" /><div className="bg-blue-600" /><div className="bg-black" /><div className="bg-black" />
                          <div className="bg-white" /><div className="bg-black" /><div className="bg-black" /><div className="bg-white" /><div className="bg-black" />
                          <div className="bg-black" /><div className="bg-white" /><div className="bg-black" /><div className="bg-black" /><div className="bg-black" />
                        </div>
                      </div>
                      <span className="text-3xs text-slate-500 mt-1 font-mono">微信/PDA扫码</span>
                    </div>

                    {/* 右侧字段信息 */}
                    <div className="col-span-8 space-y-1 text-2xs">
                      <div>
                        <span className="text-slate-400">设备名称:</span>
                        <strong className="text-slate-900 ml-1">西门子 64排螺旋CT</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">规格型号:</span>
                        <span className="font-mono text-slate-700 ml-1">SOMATOM go.Top</span>
                      </div>
                      <div>
                        <span className="text-slate-400">出厂编号:</span>
                        <span className="font-mono font-bold text-blue-700 ml-1">SN: 104928</span>
                      </div>
                      <div>
                        <span className="text-slate-400">资产编码:</span>
                        <span className="font-mono text-slate-700 ml-1">EQ-202106-0042</span>
                      </div>
                      <div>
                        <span className="text-slate-400">物理位置:</span>
                        <span className="text-slate-700 ml-1">综合楼 3F 超声诊断1室</span>
                      </div>
                      <div>
                        <span className="text-slate-400">责任工程师:</span>
                        <span className="text-emerald-700 font-bold ml-1">崔伟 (工号 ET-009)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 text-3xs text-slate-400 flex items-center justify-between">
                    <span>材质: 进口亚银覆哑膜 (防水/防油/撕不烂)</span>
                    <span>日照市社科重点课题科研实证</span>
                  </div>
                </div>
              </div>

              {/* 大型影像设备技术档案高清图解（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80"
                  alt="西门子64排螺旋CT机房与设备数字化建卡实样"
                  figureNumber="【实物图例 2-2】"
                  caption="大型医用成像器械（CT/MRI）设备空间机房与技术台账数字档案"
                  sourceNote="五莲县人民医院影像中心 SOMATOM go.Top 实体设备与铭牌比对"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        },
        {
          id: 'sec-02-02',
          title: '国家药监局 (NMPA) 22大类医疗器械分类标准速查字典',
          roleAudience: ['engineer', 'clinical'],
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm">
              <p>完整收录国家食品药品监督管理总局 2017版《医疗器械分类目录》22大类及推荐折旧年限：</p>
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0 font-semibold">
                    <tr>
                      <th className="px-3 py-2">大类代码</th>
                      <th className="px-3 py-2">分类名称</th>
                      <th className="px-3 py-2">典型代表产品举例</th>
                      <th className="px-3 py-2">管理类别</th>
                      <th className="px-3 py-2">财务推荐折旧</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {nmpa22Categories.map(cat => (
                      <tr key={cat.code} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5 font-mono font-bold text-blue-700">{cat.code}</td>
                        <td className="px-3 py-1.5 font-bold text-slate-900">{cat.name}</td>
                        <td className="px-3 py-1.5 text-slate-600 text-2xs">{cat.examples}</td>
                        <td className="px-3 py-1.5 text-2xs text-slate-500">{cat.risk}</td>
                        <td className="px-3 py-1.5 font-mono text-2xs text-emerald-700">{cat.depYears}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        },
        {
          id: 'sec-02-03',
          title: '动态健康评分 (Health Score) 与三色风险模型',
          roleAudience: ['all'],
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm">
              <p>系统为每台在册设备动态计算 0~100 综合健康指数，三色直观预警设备运行安全度：</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>90~100分：状态极佳 (绿)</span>
                  </div>
                  <div className="text-emerald-800 text-2xs">
                    处于正常服役期，强检定标合格，近6个月内无非计划停机维修记录，建议执行常规巡检。
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                    <span>75~89分：关注运行 (黄)</span>
                  </div>
                  <div className="text-amber-800 text-2xs">
                    强检定标临近到期（60天内）或偶有轻微零星报修，系统建议列入月度重点预防性维护保养（PM）。
                  </div>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>&lt;75分：高危警示 (红)</span>
                  </div>
                  <div className="text-rose-800 text-2xs">
                    计量强检超期、超期服役未备案、处于故障停机待修中。系统锁定借调与调度派工资格。
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-03',
      code: 'CH-03',
      title: '临床故障报修与闭环五步法SOP',
      icon: Wrench,
      roleAudience: ['all', 'clinical', 'engineer', 'vendor'],
      summary: '临床扫码即报、紧急度SLA响应标准、现场维修、手写签字验收与护士长晨检表。',
      sections: [
        {
          id: 'sec-03-01',
          title: '报修闭环五步标准化流转规范',
          roleAudience: ['all'],
          directTab: 'repairs',
          tabLabel: '临床报修处置',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900">
                <span className="font-bold block mb-1">闭环铁律：</span>
                未经临床使用科室责任医师或护士长手写签字复核并提交满意度评价的工单，系统严禁强行结案！
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">1</span>
                  <div>
                    <div className="font-bold text-slate-900">临床报修发起（4种极速通道）</div>
                    <div className="text-slate-600 mt-0.5">
                      <strong>通道A (推荐)</strong>：手机微信/钉钉扫机身活码秒级直报；<strong>通道B</strong>：移动护理PDA现场报修；<strong>通道C</strong>：PC端台账列表行内点击“报修”；<strong>通道D</strong>：工作台快捷报修入口。
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">2</span>
                  <div>
                    <div className="font-bold text-slate-900">医工智能派工与备件预占（响应 SLA 时效）</div>
                    <div className="text-slate-600 mt-0.5">
                      调度中心指派责任工程师。<strong>P0 抢救紧急</strong>：20分钟内到场抢修；<strong>P1 重要平诊</strong>：2小时内响应处置；<strong>P2 常规维保</strong>：24小时内办结。
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">3</span>
                  <div>
                    <div className="font-bold text-slate-900">工程师现场维修与更换零配件</div>
                    <div className="text-slate-600 mt-0.5">
                      工程师排查电路、清洁光路或换件，在工单中录入故障原因、更换零部件编码及支出工时费。
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">4</span>
                  <div>
                    <div className="font-bold text-slate-900">临床使用科室实机通电复核与验收</div>
                    <div className="text-slate-600 mt-0.5">
                      临床科室接机后试运行，确认各项参数输出正常，在移动端或电脑端手写电子签名并给出 1~5 星服务评价。
                    </div>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-2xs shrink-0 mt-0.5">5</span>
                  <div>
                    <div className="font-bold text-slate-900">结案归档与知识库沉淀</div>
                    <div className="text-slate-600 mt-0.5">
                      系统自动将设备状态从“故障待修”回滚恢复为“正常运行”，扣减备品库库存，并将典型排查经验沉淀至 AI 维保知识库。
                    </div>
                  </div>
                </div>
              </div>

              {/* 临床抢修实况规程图解（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=1200&q=80"
                  alt="临床报修现场多参数监护仪与工程师精密检修流程"
                  figureNumber="【实物图例 3-1】"
                  caption="医学装备技术工程师携带便携检测设备进入临床科室现场处置"
                  sourceNote="五莲县人民医院临床现场抢修闭环规程 · P0级应急 20分钟 SLA 响应"
                  aspectRatio="16/10"
                />
              </div>

              {/* 沙盘演练直达卡片 */}
              <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>【免损仿真】临床抢修闭环实操演练沙盘已上线</span>
                  </div>
                  <div className="text-2xs text-blue-700 mt-0.5">
                    支持在沙盘中自由体验扫码直报、紧急度SLA响应、备件领料、电气安全测试与手写签名闭环全过程。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('sandbox')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>立即进入抢修沙盘</span>
                </button>
              </div>
            </div>
          )
        },
        {
          id: 'sec-03-02',
          title: '避坑红黄牌：临床与医工报修 4 大禁忌',
          roleAudience: ['clinical', 'engineer'],
          content: (
            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-1">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <XSquare className="w-4 h-4 text-rose-600" />
                  <span>严禁未经通电试机擅自签名</span>
                </div>
                <div className="text-2xs text-rose-800">
                  临床护士长必须在病区当面确认设备开机自检正常、参数测量准确后再签字，严禁电话口头授权工程师代签！
                </div>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>严禁将常规维保伪报为“抢救紧急”</span>
                </div>
                <div className="text-2xs text-amber-800">
                  P0 级紧急抢修仅限急诊室、ICU、手术室危及患者生命的关键机具，非紧急故障恶意占用资源将计入科室考核。
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-04',
      code: 'CH-04',
      title: '法定计量强检、预防维护与超期特许备案',
      icon: ShieldCheck,
      roleAudience: ['all', 'engineer', 'clinical'],
      summary: '国家e-CQS免征强检申报、PM维护规程、超期72h满负荷检测与特许准用备案申报。',
      sections: [
        {
          id: 'sec-04-01',
          title: '国家免征强检器具目录速查表 (实时检索工具)',
          roleAudience: ['engineer', 'clinical'],
          directTab: 'maintenance',
          tabLabel: '维保强检计划',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm">
              <p>在下方搜索框中输入器具名称，即时查询国家法定强检周期与免费免征政策：</p>
              
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={metroSearch}
                  onChange={(e) => setMetroSearch(e.target.value)}
                  placeholder="检索器具名 (如除颤、电刀、心电图、压力表)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0 font-semibold">
                    <tr>
                      <th className="px-3 py-2">器具类别与名称</th>
                      <th className="px-3 py-2">强检代码</th>
                      <th className="px-3 py-2">强制周期</th>
                      <th className="px-3 py-2">国家费用政策</th>
                      <th className="px-3 py-2">检测机构与注意事项</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredMetroCatalogues.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-900">{item.name}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{item.code}</td>
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">{item.period}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.policy.includes('免征') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                            {item.policy}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-2xs text-slate-500">{item.agency} · {item.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 国家法定计量检定合格证实物图解 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>【实物图解 4-1】国家法定计量检定合格证 (绿色合格标) 规范标样与张贴要求</span>
                  </div>
                  <span className="text-2xs text-emerald-700 font-mono font-bold">三甲复审重点必查项</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* 仿真绿色圆形检定标 */}
                  <div className="sm:col-span-5 p-4 bg-emerald-50/80 border-2 border-emerald-400 rounded-xl flex flex-col items-center justify-center text-center shadow-2xs relative">
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-600 flex flex-col items-center justify-center bg-white p-2 shadow-inner">
                      <div className="text-3xs font-bold text-emerald-800 tracking-wider">法定计量检定</div>
                      <div className="text-xs font-black text-emerald-700 my-0.5">合 格</div>
                      <div className="text-4xs text-slate-500 font-mono">2026.10-2027.04</div>
                    </div>
                    <div className="mt-2 text-2xs font-bold text-emerald-900">
                      日照市法定计量检定所
                    </div>
                    <div className="text-3xs text-emerald-700 font-mono">证号: JL-2026-RZ-0891 (检定员08印)</div>
                  </div>

                  {/* 规范说明文字 */}
                  <div className="sm:col-span-7 space-y-1.5 text-2xs text-slate-700">
                    <div className="font-bold text-slate-900 text-xs">护士长与工程师张贴及巡检核对规范：</div>
                    <p className="leading-relaxed">
                      1. <strong>张贴位置</strong>：必须端正粘贴在设备操作面板正面右上角或主屏下方显眼平整处；<br />
                      2. <strong>防遮挡红线</strong>：严禁遮挡机身后部散热进出风口、严禁遮挡机身出厂SN号金属铭牌；<br />
                      3. <strong>超期即报停</strong>：当班护士若发现标签有效期已过当日，必须立即在系统报修并暂停投用，严禁无合格标上岗！
                    </p>
                  </div>
                </div>
              </div>

              {/* 法定计量检定现场实景（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80"
                  alt="国家法定计量定标台与医用生命监护仪检定实况"
                  figureNumber="【实物图例 4-2】"
                  caption="法定计量检定机构专业人员使用标准源进行临床设备定标"
                  sourceNote="日照市法定计量检定机构检定现场 · 强制检定周期严格受控"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        },
        {
          id: 'sec-04-02',
          title: '超期服役稳定性检测与特许准用备案申报SOP',
          roleAudience: ['engineer', 'executive'],
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-bold block mb-1">合规警示：</span>
                医疗设备达到厂家标称设计使用寿命后，严禁无备案盲目继续使用！必须严格通过四大关口并持有公文批号方可特许延期。
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-blue-800">关口 1: 翻新深度整修</div>
                  <div className="text-2xs text-slate-600 mt-1">更换老化易损部件、清洁散热风道、重新做绝缘加固处理。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-indigo-800">关口 2: 72小时连续稳定性测试</div>
                  <div className="text-2xs text-slate-600 mt-1">满负荷连续运行72小时零故障，关键电气参数漂移率 &lt; 0.5%，出具正式检测报告。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-purple-800">关口 3: GB 9706.1 安全检验</div>
                  <div className="text-2xs text-slate-600 mt-1">检验对地漏电流、外壳漏电流、患者漏电流及保护接地阻抗必须全面优于国家标准限值。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-emerald-800">关口 4: 委员会审查并核发批号</div>
                  <div className="text-2xs text-slate-600 mt-1">医学装备委员会形成审议决议，生成备案号（如 EXT-2026-0819），贴附特许准用绿标。</div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-05',
      code: 'CH-05',
      title: '急救生命支持机具全院应急借调与共享',
      icon: Boxes,
      roleAudience: ['all', 'clinical', 'engineer'],
      summary: '除颤仪/呼吸机全院共享池、在线借调申请、倒计时进度条与多联借还凭单打印。',
      sections: [
        {
          id: 'sec-05-01',
          title: '急救调配中心运作机制与随借附件核验',
          roleAudience: ['all'],
          directTab: 'emergency_reserve',
          tabLabel: '应急调配中心',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>
                医院设立「全院急救生命支持设备共享调配中心」，将分布在库的除颤监护仪、转运呼吸机、高流量输液泵进行数字化全院调配：
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-900">借用流转操作步骤：</div>
                <div className="text-2xs text-slate-700 space-y-1">
                  <div>1. <strong>查阅空闲机具</strong>：在「应急调配中心」查看处于“在库就绪”状态的机具。</div>
                  <div>2. <strong>提交借用登记</strong>：点击“借调申请”，选择使用科室、经手护士及预计归还时间（系统实时校验最长借用周期）。</div>
                  <div>3. <strong>随借附件逐项点验</strong>：系统弹出附件清单（如除颤仪导联线、成人电极板、充电底座），双方责任人核对无误后勾选。</div>
                  <div>4. <strong>打印交接多联凭条</strong>：支持一键打印带有防伪条形码的三联交接凭证（白联留装备科、红联借入病区、黄联出借备查）。</div>
                  <div>5. <strong>到期归还与验收</strong>：归还时由护士长实机通电复测，无破损后在线点击“归还入库”，机具自动恢复为可借状态。</div>
                </div>
              </div>

              {/* 急救机库共享调配流转图解 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>【图解 5-1】全院急救机库在位雷达与 4 大随借附件出库查验</span>
                  </div>
                  <span className="text-2xs text-emerald-700 font-mono font-bold">倒计时 24:00 监控</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-blue-900">① 5导心电电缆</div>
                    <div className="text-slate-500">外观无破皮、插头卡口卡紧完好，导联脱落报警正常。</div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-emerald-900">② 除颤电极板</div>
                    <div className="text-slate-500">成人/儿童二合一除颤板，极板表面光洁无干涸凝胶。</div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-amber-900">③ 满充锂电池组</div>
                    <div className="text-slate-500">电量指示灯 100% 满格，机内自检放电通过。</div>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="font-bold text-purple-900">④ 配套导电膏</div>
                    <div className="text-slate-500">有效期内全新医用导电膏，严禁以生理盐水或凡士林代用。</div>
                  </div>
                </div>
              </div>

              {/* 急救机库储备专区实景（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80"
                  alt="医院应急机库便携转运呼吸机与除颤监护仪储备专区"
                  figureNumber="【实物图例 5-2】"
                  caption="急救生命支持装备全院共享储备库与随借附件标准化配置台"
                  sourceNote="五莲县人民医院急救储备中心实拍 · 7×24H 快速响应临床紧急借调"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-06',
      code: 'CH-06',
      title: '移动扫码巡检与空间在位动态纠偏',
      icon: QrCode,
      roleAudience: ['all', 'clinical', 'engineer'],
      summary: '手机微信/PDA扫码即盘、在位物理房间纠偏与隐患拍照现场联动报修指南。',
      sections: [
        {
          id: 'sec-06-01',
          title: '现场移动巡检盘点与在位就地纠偏SOP',
          roleAudience: ['all'],
          directTab: 'mobile_inspection',
          tabLabel: '移动巡检盘点',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>
                传统人工纸质清点易导致“账实不符”及“设备推走不知去向”。系统提供手机移动端与专用PDA秒级在位巡检盘点：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-blue-900 mb-1">① 扫码瞬时校验</div>
                  <div className="text-2xs text-slate-600">手持终端扫描机身二维码，系统自动拉取该设备在册的院区、建筑、楼层及房间。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-amber-900 mb-1">② 位置偏差纠偏</div>
                  <div className="text-2xs text-slate-600">若设备由麻醉科临时推至急诊ICU，系统弹出黄色提示，点击“纠偏至当前所在房间”即可秒级修正。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-emerald-900 mb-1">③ 拍照存证直报</div>
                  <div className="text-2xs text-slate-600">发现线路破损或探头磨损，手机即刻拍照上传，勾选“联动报修”即可同步生成工单直派医工。</div>
                </div>
              </div>

              {/* 移动巡检PDA实操仿真界面图解 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>【图解 6-1】手持终端移动盘点与空间在位动态纠偏界面</span>
                  </div>
                  <span className="text-2xs text-blue-700 font-mono">蓝牙空间信标联防</span>
                </div>

                <div className="max-w-md mx-auto bg-white border border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-900">PDA 扫码实时识别结果</span>
                    <span className="px-2 py-0.5 rounded text-3xs font-bold bg-amber-100 text-amber-800">位置发生空间偏离</span>
                  </div>

                  <div className="space-y-1.5 text-2xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">盘点设备:</span>
                      <strong className="text-slate-800">多参数监护仪 uMEC12 (普外-12)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">在册归属位置:</span>
                      <span className="text-slate-600 font-mono">总院区 / 综合楼 / 5F / 普外科 508室</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">实测当前信标位置:</span>
                      <strong className="text-amber-700 font-mono">总院区 / 急诊大楼 / 2F / EICU抢救室</strong>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-3xs text-amber-800 leading-normal">
                    系统检测到该机具已被推至 EICU 抢救使用超过 4 小时，且未作登记。点击下方按钮即可完成在位纠偏入库。
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 py-1.5 bg-blue-600 text-white text-center text-xs font-bold rounded-lg shadow-2xs">
                      就地纠偏至 EICU 抢救室
                    </div>
                    <div className="px-3 py-1.5 bg-slate-100 text-slate-700 text-center text-xs font-semibold rounded-lg">
                      暂不纠偏
                    </div>
                  </div>
                </div>
              </div>

              {/* 移动巡检手持扫码实况（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1200&q=80"
                  alt="临床病区移动终端PDA盘点与防串岗在位纠偏实操"
                  figureNumber="【实物图例 6-2】"
                  caption="临床专管护士与工程师使用移动 PDA 现场感应蓝牙信标并扫码在位纠偏"
                  sourceNote="五莲县人民医院病区现场 · 蓝牙网格实时自动侦测设备物理位置漂移"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-07',
      code: 'CH-07',
      title: '外协维修协同、联合议价与发票三单核销',
      icon: FileCheck,
      roleAudience: ['engineer', 'executive', 'vendor'],
      summary: '原厂/第三方维保在线协同报价、多科室联合议价纪要、旧件回收与发票一案一档。',
      sections: [
        {
          id: 'sec-07-01',
          title: '外协维修五方联签与联合议价纪要规程',
          roleAudience: ['engineer', 'executive', 'vendor'],
          directTab: 'vendor_collaboration',
          tabLabel: '外协维修协同',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>针对需原厂外协更换高值零配件（如球管、探测器、超声探头）的项目，实行阳光透明审批：</p>
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1.5">
                <div>① <strong>服务商在线填报明细</strong>：原厂/第三方服务商在供应商门户录入配件官方原价、折后报价及工时明细；</div>
                <div>② <strong>多科室联合议价会签</strong>：由医学工程科、临床使用科室负责人、财务资产科及纪检监督员在线比价，确认最终协议价并生成《联合议价纪要公文》；</div>
                <div>③ <strong>三单合一严审付款</strong>：维修完毕后必须留存换下旧件实物照片、新换正品合格证明、增值税专用发票三单核验，缺一不可准予付款。</div>
              </div>

              {/* 三单合一核销图解 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-purple-600" />
                    <span>【图解 7-1】大额高值配件外协维修“三单合一”财务资金拨付审核防线</span>
                  </div>
                  <span className="text-2xs text-purple-700 font-mono font-bold">缺一严禁打款</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-2xs">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">凭证 A: 增值税专票</strong>
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-3xs">税务</span>
                    </div>
                    <div className="text-slate-600">服务商合法开具，税号、项目明细、备件编码与联合谈判确认价分文不差。</div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">凭证 B: 新件合格证</strong>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-3xs">质保</span>
                    </div>
                    <div className="text-slate-600">原厂质保卡、报关单复印件或原厂保税件合格证明，质保期不少于 12 个月。</div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">凭证 C: 旧件留存照</strong>
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-3xs">国资</span>
                    </div>
                    <div className="text-slate-600">拆卸后旧件铭牌特写、实物多角度照片及入旧件库登记，严防高值旧件外流。</div>
                  </div>
                  <div className="p-3 bg-red-50/60 border border-red-200 rounded-lg space-y-1 sm:col-span-3">
                    <div className="flex items-center justify-between">
                      <strong className="text-red-950 font-bold flex items-center gap-1.5">
                        <span>凭证 D: 《五莲县人民医院 费用预批单及存根（一式两联）》</span>
                        <span className="px-1.5 py-0.2 rounded bg-red-200 text-red-900 text-3xs font-mono">发票收到后生成</span>
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-3xs">纸质/电子双模</span>
                    </div>
                    <div className="text-slate-700 text-2xs leading-relaxed">
                      收到发票后必须开具《费用预批单》，严格复刻官方红头格式：上半部为<strong>费用预批单</strong>（正本联，报销入账），下半部为<strong>费用预批单存根</strong>（存根联，留存备查），中间贯穿标准裁切线；单据包含物品名称、型号规格、供货单位、数量、参考金额、大写金额（自动智能大写换算）、经办人/科室负责人/分管领导/主要负责人四级联签与院长办公会决议意见。系统同时支持标准 A4 一式两联纸质打印与数字验签电子版。您可在左侧菜单<strong>【设备项目台账】</strong>中随时根据项目ID（如 548 安全阀、629 输尿管镜等）一键下钻经办公司及发票信息，并直接打印对应预批单。
                    </div>
                  </div>

                  {/* 全院单据编码与业务钩稽权威规范 (WO-工单 / PRJ-项目台账 / YP-预批单) */}
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-lg space-y-2 sm:col-span-3 text-slate-800">
                    <div className="flex items-center justify-between">
                      <strong className="text-blue-950 font-bold text-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span>全院单据编号钩稽与逻辑归正（如 NO. WO-REP-2026-3212 与台账ID、预批单编号）</span>
                      </strong>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-3xs font-mono font-bold">六码贯通规范</span>
                    </div>
                    <div className="text-slate-700 text-2xs leading-relaxed space-y-1.5">
                      <p>
                        <strong>核心逻辑定位</strong>：请示报告中的公文编号（如 <code>NO. WO-REP-2026-3212</code>）、全院项目台账中的 <code>ID_项目: 3212</code>、费用预批单中的 <code>编号：3212 (YP-2026-3212)</code>、增值税发票号以及财务记账凭证号，属于不同审计阶段与法律效力的单据，<strong>不应混为同一无前缀字符串，但年度基准序列号（3212）必须 100% 保持一致与一脉相承</strong>：
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-3xs">
                        <div className="p-2 bg-white rounded border border-blue-200">
                          <span className="text-slate-400 block font-sans">1. 维修工单/公文</span>
                          <strong className="text-amber-800 block">WO-REP-2026-3212</strong>
                          <span className="text-slate-500 font-sans block mt-0.5">纸质公文文号：NO. 3212</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-blue-200">
                          <span className="text-slate-400 block font-sans">2. 立项预算总台账</span>
                          <strong className="text-blue-800 block">ID_项目: 3212</strong>
                          <span className="text-slate-500 font-sans block mt-0.5">台账全码：PRJ-2026-3212</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-blue-200">
                          <span className="text-slate-400 block font-sans">3. 费用预批单 (发票后)</span>
                          <strong className="text-red-800 block">费用预批单（编号：3212）</strong>
                          <span className="text-slate-500 font-sans block mt-0.5">财务规范码：YP-2026-3212</span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-3xs">
                        在全院检索栏或台账筛选框中，无论是输入 <code>3212</code>、<code>WO-REP-2026-3212</code> 还是 <code>YP-2026-3212</code>，系统均自动穿透关联，确保“一单立项、全链贯通、国资财务账实相符”。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 外协维修发运与实物查验（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
                  alt="外协原厂高值医疗器械配件检验与包装发运规范"
                  figureNumber="【实物图例 7-2】"
                  caption="外协送修高精密软镜专用防震箱装运、原厂封签与多方交接开箱核验"
                  sourceNote="五莲县人民医院医学装备外协中心 · 增值税发票与新件质保证明三单闭环"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-08',
      code: 'CH-08',
      title: '医保 DRG 专机折旧分摊与单机投资效益(ROI)',
      icon: Calculator,
      roleAudience: ['executive', 'engineer'],
      summary: 'DRG病组成本穿透公式、大型设备ROI模型与内置交互式保本点测算计算器。',
      sections: [
        {
          id: 'sec-08-01',
          title: 'DRG专机折旧与保本点盈亏平衡测算器 (交互式小工具)',
          roleAudience: ['executive', 'engineer'],
          directTab: 'drg_cost_audit',
          tabLabel: '医保专耗核算',
          content: (
            <div className="space-y-4 text-slate-700 text-xs sm:text-sm">
              <p>调整下方参数，即时模拟测算大型高值医疗设备的月度折旧额、单次分摊成本及盈亏平衡人次：</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="text-2xs font-bold text-slate-600 block mb-1">设备购置原值 (元)</label>
                  <input
                    type="number"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold text-slate-600 block mb-1">折旧年限 (年)</label>
                  <input
                    type="number"
                    value={calcYears}
                    onChange={(e) => setCalcYears(Number(e.target.value) || 1)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold text-slate-600 block mb-1">月预计检查人次</label>
                  <input
                    type="number"
                    value={calcMonthlyCases}
                    onChange={(e) => setCalcMonthlyCases(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-2xs font-bold text-slate-600 block mb-1">单次检查收费 (元)</label>
                  <input
                    type="number"
                    value={calcFeePerCase}
                    onChange={(e) => setCalcFeePerCase(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* 测算输出结果条 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200 text-center">
                  <div className="text-2xs text-blue-700 font-medium">月度折旧总额</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-blue-950 mt-0.5">¥{calcResults.monthlyDepreciation.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-200 text-center">
                  <div className="text-2xs text-indigo-700 font-medium">单次检查分摊折旧</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-indigo-950 mt-0.5">¥{calcResults.perCaseDepreciation}</div>
                </div>
                <div className="p-2.5 bg-amber-50/80 rounded-lg border border-amber-200 text-center">
                  <div className="text-2xs text-amber-700 font-medium">月度保本检查量 (BEP)</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-amber-950 mt-0.5">{calcResults.breakEvenMonthlyCases} 人次</div>
                </div>
                <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200 text-center">
                  <div className="text-2xs text-emerald-700 font-medium">预计月净运营结余</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-emerald-950 mt-0.5">¥{calcResults.monthlyNetIncome.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-purple-50/80 rounded-lg border border-purple-200 text-center col-span-2 sm:col-span-1">
                  <div className="text-2xs text-purple-700 font-medium">预估投资回收周期</div>
                  <div className="text-sm sm:text-base font-bold font-mono text-purple-950 mt-0.5">{calcResults.paybackYears} 年</div>
                </div>
              </div>

              {/* 医用电气安全测试实操图解（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1583912267550-d44d95bf0887?auto=format&fit=crop&w=1200&q=80"
                  alt="医用电气设备第一部分安全测试仪与高精度微量注输泵校验"
                  figureNumber="【实物图例 8-1】"
                  caption="工程师使用电气安全测试仪开展 GB 9706.1-2020 保护接地阻抗与漏电流检验"
                  sourceNote="医学工程技术中心 PM 预防性维护与电气安全标准质控"
                  aspectRatio="16/10"
                />
              </div>

              {/* 测算工具箱直达卡片 */}
              <div className="mt-2 p-3 bg-purple-50/80 rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-purple-600" />
                    <span>【独立工具箱】进入四大医院医工智能测算工作台</span>
                  </div>
                  <div className="text-2xs text-purple-700 mt-0.5">
                    包含更详尽的固定/变动成本分摊、国有资产报废残值评估、不良事件法定倒计时及电气安全校验。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('calculators')}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>打开测算工具箱</span>
                </button>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-09',
      code: 'CH-09',
      title: '医疗器械不良事件 (MDR) 警戒监测与直报',
      icon: AlertTriangle,
      roleAudience: ['clinical', 'engineer', 'executive'],
      summary: '严重伤害与死亡事件界定红线、时限要求、院内技术调查与批号召回雷达。',
      sections: [
        {
          id: 'sec-09-01',
          title: '不良事件报告时限与国家监测平台直报规范',
          roleAudience: ['all'],
          directTab: 'adverse_events',
          tabLabel: '不良事件监测',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>根据国家药监局《医疗器械不良事件监测和再评价管理办法》，发生不良事件必须恪守报告时限：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>导致患者死亡的事件：72小时 (3个工作日)</span>
                  </div>
                  <div className="text-rose-800 text-2xs leading-normal">
                    必须在 3 个工作日内向日照市市场监管局、市药监分局及国家医疗器械不良事件直报系统申报，并由医学工程处就地封存实物机具及耗材。
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>严重伤害或群体性可疑不良事件：10个工作日</span>
                  </div>
                  <div className="text-amber-800 text-2xs leading-normal">
                    导致危及生命、机体功能永久性损害或需住院延长救治的，必须在 10 个工作日内提交技术排查初报，30日内补充完整调查报告。
                  </div>
                </div>
              </div>

              {/* 不良事件实机封存隔离现场（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80"
                  alt="医疗器械疑似不良事件实机封存与配件留样隔离"
                  figureNumber="【实物图例 9-1】"
                  caption="临床发生疑似不良事件后立即对涉事设备实施就地防拆封存与实物取证"
                  sourceNote="五莲县人民医院不良事件监测SOP · 严禁擅自通电或破坏涉事原状"
                  aspectRatio="16/10"
                />
              </div>

              {/* 国家药监直报系统账号与经办直达 */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>国家直报系统账号保险箱与上报流水凭证</span>
                  </div>
                  <div className="text-2xs text-blue-700 mt-0.5">
                    本院已接入国家医疗器械不良事件监测信息系统 (MDR)，直报账号、密码及月度零报告回执已在「监管平台档案」保密归档。
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('regulatory_platforms')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                  >
                    <span>查阅监管平台档案</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-10',
      code: 'CH-10',
      title: '国有资产报废技术鉴定与处置闭环',
      icon: RotateCcw,
      roleAudience: ['engineer', 'executive'],
      summary: '法定报废条件、四级专家技术鉴定会签、残值处置与固定资产销账规程。',
      sections: [
        {
          id: 'sec-10-01',
          title: '医疗设备法定报废申报与销账四步法',
          roleAudience: ['engineer', 'executive'],
          directTab: 'scrap_workflow',
          tabLabel: '设备报废处置',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>医疗设备报废处置涉及国有固定资产合规管理，严格遵照“先技术鉴定、后审批下账”原则：</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-900">报废流转法定节点：</div>
                <div className="text-2xs text-slate-700 space-y-1">
                  <div>① <strong>临床科室发起申请</strong>：说明设备使用年限、严重损坏原因及目前使用状态。</div>
                  <div>② <strong>医学工程技术专家鉴定</strong>：组织三位以上资深工程师出具《报废技术鉴定意见书》，出具不可修复或维修经济效益过低的评定结论。</div>
                  <div>③ <strong>财务资产科核算净值</strong>：财务部门审查设备累计折旧额、残值评估报告，确认账目合规。</div>
                  <div>④ <strong>分管院长终审签批</strong>：经医院党委会/院长办公会审议通过后，交由具备资质的环保拆解机构回收，残值变现上缴财政专户，系统物理下账。</div>
                </div>
              </div>

              {/* 固定资产报废现场专家会签（视口懒加载与骨架屏） */}
              <div className="pt-2">
                <ManualLazyImage
                  src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80"
                  alt="大型老旧医疗设备技术鉴定与固定资产报废下账验收"
                  figureNumber="【实物图例 10-1】"
                  caption="三位资深医学工程专家现场实施整机损毁度鉴定与核心配件残值评估"
                  sourceNote="五莲县人民医院国有固定资产处置全流程档案 · 附专家电子签署会签表"
                  aspectRatio="16/10"
                />
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-11',
      code: 'CH-11',
      title: '系统体检、自动化测试与自愈排障',
      icon: Sliders,
      roleAudience: ['all', 'engineer', 'executive'],
      summary: '系统自检工作台15项用例、QPS高压测速与一键自愈修复操作指南。',
      sections: [
        {
          id: 'sec-011-01',
          title: '系统自动化自检与性能高压测速实操',
          roleAudience: ['all'],
          directTab: 'system_ops',
          tabLabel: '系统体检与自检',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>
                在底部状态栏点击「🛡️ 系统体检」或在运维中心进入「系统体检与自动化自检」：
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-blue-900 mb-1">一键全量体检</div>
                  <div className="text-2xs text-slate-600">自动运行 15 项业务逻辑断言，排查工单闭环、强检倒计时与数据数学恒等式，输出健康评分。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-amber-900 mb-1">高压性能测速</div>
                  <div className="text-2xs text-slate-600">在本地执行 1,000 次复合查询压力测试，测算 P95 响应时延与 QPS 吞吐量。</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-emerald-900 mb-1">一键自愈修复</div>
                  <div className="text-2xs text-slate-600">若有超期借调状态未刷新、负数原值舍入误差，点击后系统自动在内存中校准修正。</div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-12',
      code: 'CH-12',
      title: '临床高频设备报警代码速查与应急排除',
      icon: Zap,
      roleAudience: ['clinical', 'engineer'],
      summary: '监护仪、除颤器、高频电刀、呼吸机常见报警原因与护士就地应急排除手册。',
      sections: [
        {
          id: 'sec-12-01',
          title: '常用急救监护与手术设备报警速查表 (多机种速查)',
          roleAudience: ['clinical', 'engineer'],
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm">
              <p>按机型快速检索报警代码与就地排除对策：</p>
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAlarmDeviceFilter('all')}
                  className={`px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer whitespace-nowrap ${
                    alarmDeviceFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  全部设备报警
                </button>
                <button
                  type="button"
                  onClick={() => setAlarmDeviceFilter('monitor')}
                  className={`px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer whitespace-nowrap ${
                    alarmDeviceFilter === 'monitor' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  多参数心电监护仪
                </button>
                <button
                  type="button"
                  onClick={() => setAlarmDeviceFilter('defib')}
                  className={`px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer whitespace-nowrap ${
                    alarmDeviceFilter === 'defib' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  除颤监护仪
                </button>
                <button
                  type="button"
                  onClick={() => setAlarmDeviceFilter('electrosurgical')}
                  className={`px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer whitespace-nowrap ${
                    alarmDeviceFilter === 'electrosurgical' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  高频电刀
                </button>
                <button
                  type="button"
                  onClick={() => setAlarmDeviceFilter('ventilator')}
                  className={`px-2.5 py-1 rounded text-2xs font-semibold cursor-pointer whitespace-nowrap ${
                    alarmDeviceFilter === 'ventilator' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  呼吸机
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50 text-slate-700 font-semibold">
                    <tr>
                      <th className="px-3 py-2">设备类别</th>
                      <th className="px-3 py-2">报警代码与字样</th>
                      <th className="px-3 py-2">常见诱因分析</th>
                      <th className="px-3 py-2">临床现场就地处理对策</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAlarms.map((a, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap">{a.device}</td>
                        <td className="px-3 py-2 font-mono font-bold text-rose-700 whitespace-nowrap">{a.code}</td>
                        <td className="px-3 py-2 text-slate-700">{a.reason}</td>
                        <td className="px-3 py-2 text-slate-600 font-medium">{a.fix}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-13',
      code: 'CH-13',
      title: '高频常见问题与技术支持 (FAQ)',
      icon: HelpCircle,
      roleAudience: ['all', 'clinical', 'engineer', 'vendor'],
      summary: '扫码报错、权限疑难、借调延期、报修撤销等12大高频疑问实战解答。',
      sections: [
        {
          id: 'sec-13-01',
          title: '高频操作疑难问答一览表 (12条全解)',
          roleAudience: ['all'],
          content: (
            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Q1: 扫描设备上的草料二维码提示“未找到设备”怎么处理？</div>
                <div className="text-slate-600"><strong>答</strong>：说明该二维码尚未在台账中绑定。请在「设备技术台账」中搜索该设备的出厂编号(SN)或资产编号，点击“编辑”，在“统一追溯条码 / 草料活码”字段中填入对应活码编号保存即可。</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Q2: 临床护士长发现报修单故障描述或紧急度填错，如何更正？</div>
                <div className="text-slate-600"><strong>答</strong>：若工单处于“待派工”状态，在「临床报修处置」列表找到该单点击“撤回报修”即可重新发起；若工程师已接单，请拨打医工内线电话（6802）或在工单详情中直接添加补充留言。</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Q3: 借调的急救设备使用时间需要延长，如何办理？</div>
                <div className="text-slate-600"><strong>答</strong>：在「应急调配中心」的“当前借入”列表中，点击卡片下方的“申请延期”，输入预计归还新日期并说明临床危重患者救治原因，出借科室责任人在线确认后借用计时进度条将自动重新滚转。</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Q4: 为什么我的护士长账号看不到备件库和调度中心？</div>
                <div className="text-slate-600"><strong>答</strong>：系统为了保证临床操作专注高效，对护士长实施轻量化护航界面，屏蔽了配件出入库、派工后台等纯工程运维菜单；如确实兼任设备科管理员，请联系信息科在「系统基础档案」中调整岗位角色配置。</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Q5: 遇到页面检索慢或卡顿时如何排查？</div>
                <div className="text-slate-600"><strong>答</strong>：在状态栏点击「🛡️ 系统体检」，运行“高压性能测速”，并在“性能优化调优策略”中确保已开启“内存倒排索引”与“长列表虚拟分块渲染”。</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">Q6: 外协供应商如何进入系统进行报价？</div>
                <div className="text-slate-600"><strong>答</strong>：系统为合作供应商提供专属门户通道。在登录页面选择“合作供应商身份登录”，输入供应商认证编号及授权码，即可进入移动端专属报价与一案一档中心。</div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-14',
      code: 'CH-14',
      title: '三甲公立医院评审与现场飞检自查问答大纲',
      icon: Award,
      roleAudience: ['clinical', 'engineer', 'executive'],
      summary: '第四篇医疗装备国家评审要点、专家飞检必查项、护士长应知应会与数据调阅自查表。',
      sections: [
        {
          id: 'sec-14-01',
          title: '评审专家现场飞检 5 大必查场景与应答要点',
          roleAudience: ['all'],
          directTab: 'accreditation_quality',
          tabLabel: '三甲国考质控',
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>根据三级公立医院评审标准，评审专家进行现场核验时，通常直插病区与机房核验以下 5 项：</p>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                  <div className="font-bold text-blue-900">场景 1: 急救除颤仪现场通电与抽测</div>
                  <div className="text-slate-600 mt-1">
                    <strong>专家动作</strong>：随机抽取急诊抢救室除颤仪，要求护士现场演示开机自检与电极板贴合。<br />
                    <strong>应答规范</strong>：立即展示机身绿色检定合格标签（6个月周期内），演示自检通过蜂鸣，并在系统中调阅该设备的动态健康分与晨检交接记录。
                  </div>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
                  <div className="font-bold text-emerald-900">场景 2: 医疗器械不良事件上报时限追溯</div>
                  <div className="text-slate-600 mt-1">
                    <strong>专家动作</strong>：询问临床护士如发生输液泵失控导致的严重伤害或死亡事件，上报时限是几天？<br />
                    <strong>标准答案</strong>：<strong>死亡事件 3个工作日内</strong>直报国家系统；<strong>严重伤害事件 10个工作日内</strong>上报并完成院内封存留样。
                  </div>
                </div>
                <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
                  <div className="font-bold text-purple-900">场景 3: 报修到验收手写签单闭环轨迹</div>
                  <div className="text-slate-600 mt-1">
                    <strong>专家动作</strong>：调取最近一周内完成的抢修工单，检查是否有使用科室的手写电子签名。<br />
                    <strong>系统佐证</strong>：在「维修闭环管理」中调阅带防伪时间戳的手写签名与 1~5 星评价，证明全流程无越权强结。
                  </div>
                </div>
              </div>

              {/* 三甲评审题库直达卡片 */}
              <div className="mt-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>【应知应会】三甲医院评审与现场飞检自查题库已内置</span>
                  </div>
                  <div className="text-2xs text-amber-700 mt-0.5">
                    精选 10 道必考情景模拟试题，包含急救设备完好率、不良事件时限、强检免征及电气安全标准法规条文。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('quiz')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>进入应知应会自测</span>
                </button>
              </div>
            </div>
          )
        }
      ]
    },
    {
      id: 'ch-15',
      code: 'CH-15',
      title: '医院官方标准凭证与多联单据图例规范',
      icon: FileSpreadsheet,
      roleAudience: ['engineer', 'executive', 'clinical'],
      summary: '白联红联黄联三联单、外协议价公文、超期备案证书与报废鉴定意见书图例。',
      sections: [
        {
          id: 'sec-15-01',
          title: '四大核心业务多联凭单格式标准图例',
          roleAudience: ['all'],
          content: (
            <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed">
              <p>系统为医院各类审计与留底需要，定制了国家档案局标准的 A4 / 票据防伪多联打印凭证：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">① 设备验收入库三联单</div>
                  <div className="text-2xs text-slate-600 space-y-0.5">
                    <div>• <strong>白联 (档案归档联)</strong>：医学装备科留存</div>
                    <div>• <strong>红联 (财务入账联)</strong>：财务资产科记账凭据</div>
                    <div>• <strong>黄联 (使用科室联)</strong>：临床病区存查</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">② 外协维修联合议价纪要</div>
                  <div className="text-2xs text-slate-600 space-y-0.5">
                    <div>• 医院公文号：<code>医装议字[2026]第XX号</code></div>
                    <div>• 包含：原厂官方目录价、谈判议定成交价、四方专家签字笔迹及旧件留存说明。</div>
                  </div>
                </div>
              </div>

              {/* 官方标准单据中心直达卡片 */}
              <div className="mt-3 p-3 bg-indigo-50/80 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-indigo-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>【官方单据】全生命周期 8 套标准公文与多联图例</span>
                  </div>
                  <div className="text-2xs text-indigo-700 mt-0.5">
                    支持即时预览并打印验收入库单、维修单、借调单、议价纪要、不良事件报告、报废会签表及费用预批单（附存根双联）。
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('forms')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>进入单据打印中心</span>
                </button>
              </div>
            </div>
          )
        }
      ]
    }
  ], [calcPrice, calcYears, calcSalvage, calcMonthlyCases, calcFeePerCase, calcConsumableCost, calcStaffPowerCost, calcResults, metroSearch, filteredMetroCatalogues, alarmDeviceFilter, filteredAlarms, nmpa22Categories]);

  // 角色与搜索过滤
  const filteredChapters = useMemo(() => {
    return chapters.map(chap => {
      // 角色筛选
      const roleMatch = selectedRole === 'all' || chap.roleAudience.includes(selectedRole);
      if (!roleMatch) return null;

      // 关键字搜索筛选
      if (!searchQuery.trim()) return chap;

      const q = searchQuery.toLowerCase().trim();
      const matchChapTitle = chap.title.toLowerCase().includes(q) || chap.summary.toLowerCase().includes(q);
      const matchedSections = chap.sections.filter(sec => {
        return sec.title.toLowerCase().includes(q);
      });

      if (matchChapTitle || matchedSections.length > 0) {
        return {
          ...chap,
          sections: matchedSections.length > 0 ? matchedSections : chap.sections
        };
      }
      return null;
    }).filter(Boolean) as Chapter[];
  }, [chapters, selectedRole, searchQuery]);

  // 最终呈现篇章列表（包含常用收藏过滤）
  const displayedChapters = useMemo(() => {
    if (!onlyShowFavorites) return filteredChapters;
    const favChapterIds = new Set(favorites.filter(f => f.type === 'chapter').map(f => f.id));
    const favSectionIds = new Set(favorites.filter(f => f.type === 'section').map(f => f.id));
    
    return filteredChapters.map(chap => {
      const isChapFav = favChapterIds.has(chap.id);
      const matchedFavSections = chap.sections.filter(s => favSectionIds.has(s.id));
      if (isChapFav || matchedFavSections.length > 0) {
        return {
          ...chap,
          sections: isChapFav ? chap.sections : matchedFavSections
        };
      }
      return null;
    }).filter(Boolean) as Chapter[];
  }, [filteredChapters, onlyShowFavorites, favorites]);

  // 当前激活章节
  const activeChapter = useMemo(() => {
    return displayedChapters.find(c => c.id === activeChapterId) || displayedChapters[0] || filteredChapters[0] || chapters[0];
  }, [displayedChapters, filteredChapters, activeChapterId, chapters]);

  return (
    <div className="w-full min-h-full bg-slate-50/50 pb-16">
      {/* 打印专属标题头 */}
      <div className="hidden print:block text-center pb-6 border-b border-slate-300">
        <h1 className="text-2xl font-bold text-slate-900">
          五莲县人民医院 医学装备全生命周期管理系统 · 官方操作使用手册 (MED-TECH OS)
        </h1>
        <p className="text-xs text-slate-600 mt-1">版本: v2.4.0 生产环境标准规范 · 2026年度审定版</p>
      </div>

      {/* 顶部主工作台看板条 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  系统使用手册与操作指南
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  15大篇章全覆盖 · 生产级SOP
                </span>
                <span className="hidden md:inline-block text-[11px] font-mono text-slate-500">
                  MED-TECH OS v2.4.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                五莲县人民医院医学装备全生命周期闭环管理系统多角色操作规范、业务流程流转与常见问题解答
              </p>
            </div>
          </div>

          {/* 顶栏快捷操作 */}
          {/* 顶栏快捷操作 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>打印 / 导出手册</span>
            </button>
          </div>
        </div>

        {/* 手册工作台 7 大工作模式切换卡 */}
        <div className="px-4 sm:px-6 lg:px-8 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode('chapters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'chapters'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>标准篇章 SOP (15篇)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('diagrams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'diagrams'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>全景流程图解 (7大流程)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('cases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'cases'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>真实案例复盘 (7大实案)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'sandbox'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>业务实操沙盘 (交互演练)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'quiz'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>三甲评审自测 (10题通关)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('forms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'forms'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
              <span>医院标准单据 (8套图例)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('calculators')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'calculators'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-purple-500" />
              <span>智能测算工具箱 (DRG/残值/时限)</span>
            </button>
          </div>
        </div>

        {/* 仅在标准篇章模式下显示角色切片器与检索栏 */}
        {activeMode === 'chapters' && (
          <div className="px-4 sm:px-6 lg:px-8 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 border-t border-slate-100">
            {/* 角色切片器 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-2xs text-slate-500 font-bold whitespace-nowrap mr-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>适用角色：</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedRole('all')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRole === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                全部综合手册 ({chapters.length}章)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('clinical')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRole === 'clinical'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                临床医护与护士长版
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('engineer')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRole === 'engineer'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                医学工程技术人员版
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('executive')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRole === 'executive'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                院领导与质控审计版
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('vendor')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedRole === 'vendor'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                外部维保合作服务商版
              </button>
            </div>

            {/* 实时搜索 */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索操作章节、关键词或业务SOP..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              />
            </div>
          </div>
        )}
      </div>

      {/* 模式：全景流程图解 */}
      {activeMode === 'diagrams' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <ManualVisualDiagrams onNavigateTab={onNavigateTab} showToast={showToast} />
        </div>
      )}

      {/* 模式：真实案例复盘 */}
      {activeMode === 'cases' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <ManualCaseStudies onNavigateTab={onNavigateTab} showToast={showToast} />
        </div>
      )}

      {/* 模式 1: 实操演练沙盘 */}
      {activeMode === 'sandbox' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <OperationalSandbox onNavigateTab={onNavigateTab} showToast={showToast} />
        </div>
      )}

      {/* 模式 2: 三甲评审自测题库 */}
      {activeMode === 'quiz' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <HospitalAccreditationQuiz />
        </div>
      )}

      {/* 模式 3: 医院标准单据中心 */}
      {activeMode === 'forms' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <HospitalStandardFormsModal />
        </div>
      )}

      {/* 模式 4: 精细化测算工具箱 */}
      {activeMode === 'calculators' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <ManualCalculatorTools />
        </div>
      )}

      {/* 模式 5: 标准规程篇章 (15 篇) */}
      {activeMode === 'chapters' && (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左侧章节目录导航 (占 4 列) - 交互式导航索引 */}
            <div className="lg:col-span-4 print:hidden">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs sticky top-24 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
                {/* 顶栏控制条 */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <ListTree className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">交互式索引</span>
                    <span className="text-2xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">
                      {displayedChapters.length}篇
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleExpandAll(true)}
                      className="text-2xs px-1.5 py-0.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="展开所有小节目录"
                    >
                      全展开
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => toggleExpandAll(false)}
                      className="text-2xs px-1.5 py-0.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="收起所有小节目录"
                    >
                      全收起
                    </button>
                    <span className="text-slate-300">|</span>
                    {/* 视图模式切换 */}
                    <button
                      type="button"
                      onClick={() => setViewLayout(prev => prev === 'continuous' ? 'single' : 'continuous')}
                      className={`text-2xs px-2 py-0.5 rounded font-medium transition-colors ${
                        viewLayout === 'continuous'
                          ? 'bg-blue-100 text-blue-800 font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={viewLayout === 'continuous' ? '当前：连续通读模式（所有章节依次呈现，支持自由平滑滚动）' : '当前：单篇精读模式（单章聚焦呈现）'}
                    >
                      {viewLayout === 'continuous' ? '通读模式' : '单章精读'}
                    </button>
                  </div>
                </div>

                {/* 常用收藏快捷入口卡片 (Pinned Favorites Quick Jump) */}
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowFavoritesDrawer(prev => !prev)}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>常用操作收藏 ({favorites.length})</span>
                      {showFavoritesDrawer ? (
                        <ChevronDown className="w-3 h-3 text-amber-700" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-amber-700" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOnlyShowFavorites(prev => !prev)}
                        className={`text-2xs px-2 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                          onlyShowFavorites
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                        }`}
                        title="只显示已收藏的章节与小节"
                      >
                        {onlyShowFavorites ? '显示全部' : '仅看收藏'}
                      </button>
                      {favorites.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllFavorites}
                          className="text-2xs text-amber-600 hover:text-red-600 p-0.5 rounded"
                          title="清空收藏"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {showFavoritesDrawer && (
                    <div className="space-y-1 pt-1 border-t border-amber-200/50">
                      {favorites.length === 0 ? (
                        <div className="text-2xs text-amber-700/80 py-1 leading-normal">
                          暂无常用收藏。点击任意章节或小节右上角的“★ 收藏”按钮，即可在此快速直达！
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                          {favorites.map((fav) => (
                            <div
                              key={fav.id}
                              className="group flex items-center justify-between gap-1.5 p-1.5 bg-white/90 hover:bg-white rounded border border-amber-200/60 text-2xs text-slate-800 transition-colors shadow-2xs"
                            >
                              <button
                                type="button"
                                onClick={() => scrollToTarget(fav.chapterId, fav.type === 'section' ? fav.id : undefined)}
                                className="flex items-center gap-1.5 min-w-0 text-left flex-1 cursor-pointer hover:text-blue-600"
                              >
                                <span className={`px-1 py-0.2 rounded font-mono font-bold text-3xs shrink-0 ${
                                  fav.type === 'chapter' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {fav.type === 'chapter' ? fav.chapterCode : 'SOP'}
                                </span>
                                <span className="truncate font-medium">{fav.title}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(fav);
                                }}
                                className="text-slate-300 hover:text-red-500 opacity-60 group-hover:opacity-100 p-0.5"
                                title="取消收藏"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 目录节点快速筛选框 */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tocTreeSearch}
                    onChange={(e) => setTocTreeSearch(e.target.value)}
                    placeholder="快速定位目录节点..."
                    className="w-full pl-7 pr-2 py-1 text-2xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                  {tocTreeSearch && (
                    <button
                      type="button"
                      onClick={() => setTocTreeSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-2xs text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* 交互式章节目录树 (Interactive TOC Tree) */}
                <div className="space-y-1.5">
                  {displayedChapters.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                      {onlyShowFavorites ? '暂无匹配的收藏章节' : '未匹配到相关章节，请调整检索词'}
                    </div>
                  ) : (
                    displayedChapters.map((chap) => {
                      const isActive = chap.id === activeChapter.id;
                      const isFav = isFavorite(chap.id);
                      const isExpanded = expandedChapters[chap.id] ?? false;
                      const Icon = chap.icon;

                      // TOC 搜索过滤小节
                      const visibleSections = !tocTreeSearch.trim()
                        ? chap.sections
                        : chap.sections.filter(s => s.title.toLowerCase().includes(tocTreeSearch.toLowerCase().trim()));

                      return (
                        <div key={chap.id} className="rounded-lg border border-slate-100 overflow-hidden bg-white">
                          {/* 章节主行 */}
                          <div
                            className={`flex items-center justify-between p-2 text-xs transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-blue-50/90 text-blue-950 font-bold border-l-3 border-blue-600'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            {/* 展开/收起小节指示按钮 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedChapters(prev => ({ ...prev, [chap.id]: !isExpanded }));
                              }}
                              className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title={isExpanded ? '折叠小节' : '展开小节'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>

                            {/* 章节标题与跳转 */}
                            <button
                              type="button"
                              onClick={() => scrollToTarget(chap.id)}
                              className="flex items-center gap-2 flex-1 min-w-0 text-left px-1 cursor-pointer"
                            >
                              <div className={`p-1 rounded mt-0.5 shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-2xs text-slate-400">{chap.code}</span>
                                  <span className="truncate">{chap.title}</span>
                                </div>
                              </div>
                            </button>

                            {/* 章节收藏按钮 */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite({
                                  id: chap.id,
                                  title: `${chap.code} ${chap.title}`,
                                  chapterId: chap.id,
                                  chapterCode: chap.code,
                                  type: 'chapter'
                                });
                              }}
                              className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-amber-500 transition-colors cursor-pointer shrink-0"
                              title={isFav ? '已收藏此章节，点击取消' : '收藏此章节'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-amber-500'}`} />
                            </button>
                          </div>

                          {/* 章节内部小节树 (Indented Sub-sections) */}
                          {isExpanded && visibleSections.length > 0 && (
                            <div className="pl-6 pr-2 py-1.5 bg-slate-50/70 border-t border-slate-100 space-y-1">
                              {visibleSections.map((sec) => {
                                const isSecFav = isFavorite(sec.id);
                                return (
                                  <div
                                    key={sec.id}
                                    className="group flex items-center justify-between gap-1.5 py-1 px-1.5 rounded hover:bg-white text-2xs text-slate-600 hover:text-blue-900 transition-colors"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => scrollToTarget(chap.id, sec.id)}
                                      className="flex items-center gap-1.5 text-left flex-1 min-w-0 cursor-pointer"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-blue-600 shrink-0" />
                                      <span className="truncate">{sec.title}</span>
                                    </button>

                                    {/* 直达标签提示 */}
                                    {sec.directTab && (
                                      <span className="text-3xs text-blue-600 bg-blue-50 px-1 py-0.2 rounded font-mono shrink-0">
                                        直达
                                      </span>
                                    )}

                                    {/* 小节收藏按钮 */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite({
                                          id: sec.id,
                                          title: sec.title,
                                          chapterId: chap.id,
                                          chapterCode: chap.code,
                                          type: 'section'
                                        });
                                      }}
                                      className="p-0.5 rounded text-slate-300 hover:text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                      title={isSecFav ? '已收藏此小节' : '收藏此小节'}
                                    >
                                      <Star className={`w-3 h-3 ${isSecFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                                    </button>
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
              </div>
            </div>

            {/* 右侧正文呈现区 (占 8 列) - 包含章节平滑滚动与收藏按钮 */}
            <div className="lg:col-span-8 print:col-span-12 space-y-6">
              {/* 遍历章节：连续通读模式下依次呈现所有章节；单篇精读模式下仅呈现 activeChapter */}
              {(viewLayout === 'continuous' ? displayedChapters : [activeChapter]).map((chap) => {
                const isChapFav = isFavorite(chap.id);
                const isChapHighlighted = highlightedId === chap.id;

                return (
                  <div
                    key={chap.id}
                    id={chap.id}
                    className={`bg-white border rounded-xl p-6 sm:p-8 shadow-2xs space-y-8 scroll-mt-24 transition-all duration-500 ${
                      isChapHighlighted
                        ? 'ring-2 ring-blue-500 bg-blue-50/30 border-blue-400 shadow-md'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* 章节顶栏头 */}
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 text-2xs text-blue-600 font-mono font-bold tracking-wider uppercase">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                            {chap.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>五莲县人民医院医学装备精细化管理手册</span>
                        </div>

                        {/* 章节“收藏”按钮与快捷功能 */}
                        <div className="flex items-center gap-2 print:hidden">
                          <button
                            type="button"
                            onClick={() => toggleFavorite({
                              id: chap.id,
                              title: `${chap.code} ${chap.title}`,
                              chapterId: chap.id,
                              chapterCode: chap.code,
                              type: 'chapter'
                            })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                              isChapFav
                                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
                            }`}
                            title={isChapFav ? '已收藏此章节，点击取消收藏' : '收藏此章节至常用指南快捷入口'}
                          >
                            <Star className={`w-3.5 h-3.5 ${isChapFav ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                            <span>{isChapFav ? '已收藏章节' : '收藏章节'}</span>
                          </button>

                          {/* 复制章节索引链接 */}
                          <button
                            type="button"
                            onClick={() => {
                              handleCopyText(`${chap.code} ${chap.title}`, chap.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="复制本章节标题与编号"
                          >
                            {copiedSectionId === chap.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <span>{chap.title}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                        {chap.summary}
                      </p>
                    </div>

                    {/* 章节内小节逐一展开 */}
                    <div className="space-y-8">
                      {chap.sections.map((sec) => {
                        const isSecFav = isFavorite(sec.id);
                        const isSecHighlighted = highlightedId === sec.id;

                        return (
                          <div
                            key={sec.id}
                            id={sec.id}
                            className={`scroll-mt-24 space-y-3 p-3 rounded-xl transition-all duration-500 ${
                              isSecHighlighted
                                ? 'ring-2 ring-blue-500 bg-blue-50/40 shadow-sm'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                                <span>{sec.title}</span>
                              </h3>

                              {/* 快捷跳转与收藏、复制按钮 */}
                              <div className="flex items-center gap-2 print:hidden">
                                {sec.directTab && onNavigateTab && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateTab(sec.directTab!)}
                                    className="px-2.5 py-1 text-2xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>直达{sec.tabLabel || '功能'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}

                                {/* 小节收藏按钮 */}
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite({
                                    id: sec.id,
                                    title: sec.title,
                                    chapterId: chap.id,
                                    chapterCode: chap.code,
                                    type: 'section'
                                  })}
                                  className={`px-2 py-1 text-2xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                                    isSecFav
                                      ? 'text-amber-800 bg-amber-50 border border-amber-300 font-bold'
                                      : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50/50 border border-slate-200'
                                  }`}
                                  title={isSecFav ? '已收藏该小节指南' : '收藏此小节到常用指南'}
                                >
                                  <Star className={`w-3 h-3 ${isSecFav ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                                  <span>{isSecFav ? '已收藏' : '收藏小节'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyText(`${sec.title}\n${sec.id}`, sec.id)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors"
                                  title="复制本节标题"
                                >
                                  {copiedSectionId === sec.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* 正文内容渲染 */}
                            <div className="pt-1">
                              {sec.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 章节底部快捷指引 */}
                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs print:hidden">
                      <div className="text-2xs text-slate-500 flex items-center gap-1.5">
                        <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>已完成本章阅读。如遇技术异议，可随时点击左侧索引跳转其他章节或测算工具。</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-2xs text-slate-500 hover:text-blue-600 font-semibold transition-colors flex items-center gap-1"
                      >
                        <ArrowUp className="w-3 h-3" />
                        <span>回到顶部</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 浮动回到顶部按钮 (Floating Back to Top) */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center group"
          title="平滑返回页面顶部"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
