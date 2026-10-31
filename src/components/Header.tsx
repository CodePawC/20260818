import { VendorUserAccount } from "../types/vendorCollaborationTypes";
import { VENDOR_ACCOUNTS } from "../utils/vendorCollaborationData";
import React, { useState } from 'react';
import { ActiveTab } from './Sidebar';
import { AuthUser, StaffPersonMaster } from '../types';
import { UserNavMenu } from './UserNavMenu';
import { isHeadNurse, isDepartmentRestricted, getUserDepartment } from '../utils/authUtils';
import { FontScale, FONT_SCALE_OPTIONS, getStoredFontScale, applyFontScale } from '../utils/fontSizeScale';
import { 
  Search, 
  Wrench, 
  Boxes, 
  Bell, 
  RefreshCw, 
  Building2, 
  ShieldCheck, 
  Command,
  ChevronRight,
  Activity,
  Type,
  Check,
  Zap,
  Barcode,
  AlertTriangle,
  Layers
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenAiModal?: () => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onSwitchUser: (newUser: AuthUser) => void;
  masterStaff: StaffPersonMaster[];
  onOpenQuickSearch?: () => void;
  onQuickRepair?: () => void;
  onQuickEmergency?: () => void;
  onQuickApprovals?: () => void;
  onOpenMobileNotifications?: () => void;
  onSwitchToVendorPortal?: (vendor: VendorUserAccount) => void;
  pendingAlertsCount?: number;
  faultCount?: number;
  onRefreshData?: () => void;
  isClinicalQuickMode?: boolean;
  onToggleDualTrackMode?: () => void;
  onOpenUdiModal?: () => void;
  onOpenBatchRecallRadar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenAiModal,
  currentUser,
  onLogout,
  onSwitchUser,
  masterStaff,
  onOpenQuickSearch,
  onQuickRepair,
  onQuickEmergency,
  onQuickApprovals,
  onOpenMobileNotifications,
  onSwitchToVendorPortal,
  pendingAlertsCount = 0,
  faultCount = 0,
  onRefreshData,
  isClinicalQuickMode = false,
  onToggleDualTrackMode,
  onOpenUdiModal,
  onOpenBatchRecallRadar
}) => {
  const userDept = getUserDepartment(currentUser);
  const isDeptScoped = (isHeadNurse(currentUser) || isDepartmentRestricted(currentUser)) && Boolean(userDept);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fontScale, setFontScale] = useState<FontScale>(() => getStoredFontScale());
  const [showFontMenu, setShowFontMenu] = useState(false);

  const handleSelectFontScale = (scale: FontScale) => {
    setFontScale(scale);
    applyFontScale(scale);
    setShowFontMenu(false);
  };

  const handleRefresh = () => {
    if (onRefreshData) {
      setIsRefreshing(true);
      onRefreshData();
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const getTitleInfo = () => {
    if (isDeptScoped && userDept) {
      switch (activeTab) {
        case 'dashboard':
          return { title: `【${userDept}】科室工作台`, badge: `${userDept} 运行监测与晨间点检`, category: '工作台概览' };
        case 'ledger':
          return { title: `【${userDept}】科室设备技术台账`, badge: `${userDept} 在册技术档案与生命周期动态`, category: '科室资产与库房' };
        case 'mobile_inspection':
          return { title: `【${userDept}】移动巡检盘点`, badge: 'PDA现场扫码在位核实与点检', category: '科室资产与库房' };
        case 'emergency_reserve':
          return { title: '应急调配中心', badge: '全院急救与生命支持机具借调共享', category: '科室资产与库房' };
        case 'repairs':
          return { title: `【${userDept}】科室报修跟踪`, badge: '报修发起与技术维修进度追踪', category: '运维调度与质控' };
        case 'maintenance':
          return { title: `【${userDept}】维保强检计划`, badge: `${userDept} 预防性维护与计量强检计划`, category: '运维调度与质控' };
        case 'adverse_events':
          return { title: '不良事件监测', badge: '医疗器械警戒直报与临床初报', category: '运维调度与质控' };
        case 'approvals':
          return { title: `【${userDept}】业务审批中心`, badge: '科室设备立项申请与报废呈报', category: '业务流转与协同' };
        case 'tracking':
          return { title: '设备运行轨迹', badge: '科室设备动态调拨与变动日志', category: '业务流转与协同' };
        case 'ai':
          return { title: 'AI 智维助手', badge: 'Gemini 智能故障诊断与排查', category: '统计决策与效益' };
        case 'vendor_collaboration':
          return { 
            title: `【${userDept}】外协维修协同`, 
            badge: `${userDept} 外协零星工单查验 · 配件更换核签 · 四流合规凭证`, 
            category: '业务流转与协同' 
          };
        case 'regulations':
          return { 
            title: `【${userDept}】管理规章制度汇编`, 
            badge: `${userDept} 临床医疗设备管理制度 · 操作SOP · 应急预案`, 
            category: '决策与档案' 
          };
        default:
          return { title: `【${userDept}】资产管理`, badge: '科室专属运维协同', category: '工作台概览' };
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return { title: '全院设备运营总览看板', badge: '全院资产运营大盘与预警调度中心', category: '工作台概览' };
      case 'ledger':
        return { title: '设备全景技术资产台账', badge: '国家药监22大类 · 全生命周期技术主数据', category: '技术资产与库房' };
      case 'mobile_inspection':
        return { title: '移动巡检与PDA实物盘点', badge: '现场扫码打卡 / 在位核实纠偏 / 现场即时报修', category: '技术资产与库房' };
      case 'emergency_reserve':
        return { title: '急救生命支持应急调配中心', badge: '全院重症急救设备24H应急借调与跨科周转', category: '技术资产与库房' };
      case 'parts_inventory':
        return { title: '医学工程备品配件仓库', badge: '核心配件出入库核销 / 安全库存动态警戒', category: '技术资产与库房' };
      case 'repairs':
        return { title: '全院临床报修与处置记录', badge: '全流程维修工单跟踪与故障处置复盘', category: '运维调度与质控' };
      case 'dispatch':
        return { title: '医工智能派工与SLA履约调度', badge: '工单调度大厅 / 响应时效SLA / 维修工单全闭环', category: '运维调度与质控' };
      case 'maintenance':
        return { title: '预防性维护(PM)与法定计量强检', badge: '计量强检检定排程 / PM计划与超期防范', category: '运维调度与质控' };
      case 'adverse_events':
        return { title: '医疗器械不良事件警戒直报 (MDR)', badge: '不良事件(MDR)初报直报 / 国家直报协同', category: '运维调度与质控' };
      case 'approvals':
        return { title: '医学装备业务审批与技术论证', badge: '采购立项论证 / 跨科调拨 / 超期准用 / 报废技术鉴定', category: '业务流转与协同' };
      case 'tracking':
        return { title: '设备全生命周期变动履历', badge: '状态全流程审计 / 动态轨迹溯源', category: '业务流转与协同' };
      case 'partners':
        return { title: '往来协同服务单位档案', badge: '生产原厂 / 第三方维保供应商 / 法定计量机构', category: '业务流转与协同' };
      case 'master_data':
        return { title: '医学工程系统基础主数据', badge: '院区楼宇 / 科室组织架构 / 强检目录 / 医工人才矩阵', category: '系统主数据管理' };
      case 'drg_cost_audit':
        return { title: '医保DRG病组专耗钩稽核算', badge: '病组设备折旧摊销 · 耗材与检查收费联动核查', category: '决策与评审' };
      case 'accreditation_quality':
        return { title: '三甲复审与公立医院国考质控', badge: '第四篇医疗装备指标动态自评 · 国考质控达标看板', category: '决策与评审' };
      case 'analytics':
        return { title: '设备运转效能与质控决策分析', badge: '运转负荷 / MTBF故障率 / 质控达标率大盘', category: '决策与评审' };
      case 'roi':
        return { title: '大型医用设备单机效益核算 (ROI)', badge: '单机收支模型 / 成本折旧摊销 / 投资回报分析', category: '决策与评审' };
      case 'smart_management':
        return { title: '国家卫健委医院智慧管理分级评估与HIS/PACS互联专区', badge: '1-5级指标自评体系 · HIS计费与PACS影像实时对齐 · 漏费拦截', category: '决策与评审' };
      case 'digital_twin_sandbox':
        return { title: '全院设备空间数字孪生模拟沙盘与应急调度中心', badge: '多建筑楼层空间热力 · 实时负荷感知 · 突发抢救应急动员演练', category: '资产与库房' };
      case 'regulations':
        return { title: '医学工程管理规章制度中心', badge: '国家药监法规 · 院级制度 · PM强检规程 · 临床SOP与应急预案', category: '档案与系统' };
      case 'diagnostics':
        return { title: '系统体检与自动化自检工作台', badge: '全流程业务闭环测试 · 跨表数据一致性审计 · 渲染压测基准', category: '档案与系统' };
      case 'project_concluding':
        return { title: '日照市社会科学专项课题结项专区', badge: '万字实证研究报告 · 仿真结项鉴定书 · 核心论文知网核验', category: '档案与系统' };
      case 'system_ops':
        return { title: '系统与运维综合管理中心', badge: 'AI 大模型配置 · 数据库安全备份 · 前端 UI 更新 · 草料二维码直通', category: '档案与系统' };
      case 'ai_config':
        return { title: 'AI 智能模型与算法引擎配置', badge: 'Google Gemini / 本地私有化模型 / 专科 Prompt / RAG 知识库', category: '档案与系统' };
      case 'database_backup':
        return { title: '数据安全备份与数据库管理配置', badge: '多源数据库连接池 / 定时冷备份 / 全量快照一键灾难恢复', category: '档案与系统' };
      case 'system_update':
        return { title: '系统更新与前端 UI 视觉设计配置', badge: '主题色板定制 / 院区品牌标识 / 热插拔特性开关 / 在线热更新', category: '档案与系统' };
      case 'caoliao_integration':
        return { title: '草料二维码官方数据库联动接口', badge: '阿里云 RDS · 1602个活码 · 现场扫码与医院工单实时联动', category: '档案与系统' };
      case 'caoliao_sync_settings':
        return { title: '草料二维码同步设置', badge: 'OpenAPI 凭据 · API Key · 分类目录映射规则 · 双向闭环', category: '档案与系统' };
      default:
        return { title: '设备资产台账', badge: '全院设备资产全息管理', category: '技术资产与库房' };
    }
  };

  const { title, badge, category } = getTitleInfo();

  return (
    <header className="h-16 flex-none bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 gap-3 min-w-0 relative shadow-2xs">
      {/* 顶部微细分割质感线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent pointer-events-none" />
      
      {/* 1. 左侧：三甲医院机构名与当前页面导航定位 (层次分明、设计感强) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="hidden lg:flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 tracking-tight">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-700">五莲县人民医院</span>
            <span className="text-slate-300">/</span>
            <span>{isDeptScoped && userDept ? userDept : '医学工程保障中心'}</span>
            <span className="text-slate-300">/</span>
            <span className="text-blue-600 font-mono text-[11px] font-bold">MED-TECH OS</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate whitespace-nowrap">
              {title}
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 shrink-0 whitespace-nowrap">
              {category}
            </span>
            {badge && (
              <span className="text-xs text-slate-400 truncate hidden xl:inline max-w-sm font-normal">
                · {badge}
              </span>
            )}
          </div>
        </div>

        {/* 移动端/小屏模式标题 */}
        <div className="lg:hidden flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <h1 className="text-base font-bold text-slate-900 truncate">
            {title}
          </h1>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 shrink-0">
            {category}
          </span>
        </div>
      </div>

      {/* 2. 中间：全局实用命令检索框 (Command Palette Trigger) */}
      <div className="hidden md:flex items-center max-w-xs lg:max-w-sm w-full mx-2">
        <button
          type="button"
          onClick={onOpenQuickSearch}
          className="w-full h-9 px-3 bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-blue-400/80 rounded-lg text-xs text-slate-500 flex items-center justify-between gap-2 transition cursor-pointer group shadow-2xs hover:shadow-xs"
          title="全局搜索设备 / 工单 / 规章 / 科室 (Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
            <span className="truncate">全局搜索设备 / 工单 / 科室...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* 3. 右侧：标准系统工具栏与用户身份 */}
      <div className="flex items-center gap-2 shrink-0">
        
        {/* 临床极简极速 vs 医工全能双轨模式切换器 */}
        {onToggleDualTrackMode && (
          <button
            type="button"
            onClick={onToggleDualTrackMode}
            className={`h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold transition cursor-pointer border shadow-2xs ${
              isClinicalQuickMode 
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100' 
                : 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100'
            }`}
            title="切换【医工全能台账】与【临床极简极速】双轨交互模式"
          >
            {isClinicalQuickMode ? (
              <>
                <Layers className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">切至医工全能台账</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-700 animate-pulse" />
                <span className="hidden sm:inline">临床10秒极速流</span>
              </>
            )}
          </button>
        )}

        {/* UDI 专机专耗闭环工作台 */}
        {onOpenUdiModal && (
          <button
            type="button"
            onClick={onOpenUdiModal}
            className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 transition cursor-pointer shadow-2xs"
            title="打开国家 UDI 编码解析与专机专耗挂靠工作台"
          >
            <Barcode className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xl:inline">UDI 专机专耗</span>
          </button>
        )}

        {/* 国家药监不良召回排查雷达 */}
        {onOpenBatchRecallRadar && (
          <button
            type="button"
            onClick={onOpenBatchRecallRadar}
            className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shadow-2xs"
            title="国家药监局医疗器械 UDI 批次不良召回排查雷达"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span className="hidden xl:inline">召回雷达</span>
          </button>
        )}

        {/* 数据即时同步刷新 */}
        {onRefreshData && (
          <button
            type="button"
            onClick={handleRefresh}
            className="w-9 h-9 relative rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border border-slate-200/90 bg-slate-50/80 shadow-2xs"
            title="即时同步全院设备与工单数据"
            aria-label="刷新数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          </button>
        )}

        {/* 移动协同待办与系统预警通知铃铛 */}
        {(onOpenMobileNotifications || onQuickApprovals) && (
          <button
            type="button"
            onClick={onOpenMobileNotifications || onQuickApprovals}
            className="w-9 h-9 relative rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer border border-slate-200/90 bg-slate-50/80 shadow-2xs"
            title={pendingAlertsCount > 0 ? `企业微信/钉钉/PDA即时协同通知 (${pendingAlertsCount}项)` : '全院移动协同通知中心'}
            aria-label="待办与移动协同通知"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {pendingAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                {pendingAlertsCount > 99 ? '99+' : pendingAlertsCount}
              </span>
            )}
          </button>
        )}

        {/* 系统字号随心调节 (解决字号过小无法正常浏览痛点，支持标准、大字号与特大关怀模式) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFontMenu(!showFontMenu)}
            className={`h-9.5 px-3 rounded-xl flex items-center gap-1.5 text-sm font-bold transition cursor-pointer border shadow-2xs ${
              fontScale !== 'standard' 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="调节系统字号：标准 (16.5px) / 大字号 (18px) / 特大号 (20px)"
            aria-label="调节系统显示字号"
          >
            <Type className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="hidden sm:inline">
              {fontScale === 'extra_large' ? '特大号 (20px)' : fontScale === 'large' ? '大字号 (18px)' : '标准 (16.5px)'}
            </span>
          </button>

          {showFontMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowFontMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>系统显示字号调节</span>
                    <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">即时生效</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">全站字号等比缩放，告别眯眼阅读</p>
                </div>
                <div className="space-y-1">
                  {FONT_SCALE_OPTIONS.map((opt) => {
                    const isSelected = fontScale === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectFontScale(opt.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{opt.label}</span>
                            {opt.id === 'large' && (
                              <span className={`text-xs px-1 rounded ${isSelected ? 'bg-indigo-500 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                推荐
                              </span>
                            )}
                          </div>
                          <div className={`text-xs mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {opt.desc}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

        {/* 4. 用户登录身份与多角色切换 */}
        <UserNavMenu
          currentUser={currentUser}
          onLogout={onLogout}
          onSwitchUser={onSwitchUser}
          masterStaff={masterStaff}
        />
      </div>
    </header>
  );
};
