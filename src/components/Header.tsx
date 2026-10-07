import { VendorUserAccount } from "../types/vendorCollaborationTypes";
import { VENDOR_ACCOUNTS } from "../utils/vendorCollaborationData";
import React, { useState } from 'react';
import { ActiveTab } from './Sidebar';
import { AuthUser, StaffPersonMaster } from '../types';
import { UserNavMenu } from './UserNavMenu';
import { isHeadNurse, isDepartmentRestricted, getUserDepartment } from '../utils/authUtils';
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
  Activity
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
  onSwitchToVendorPortal?: (vendor: VendorUserAccount) => void;
  pendingAlertsCount?: number;
  faultCount?: number;
  onRefreshData?: () => void;
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
  onSwitchToVendorPortal,
  pendingAlertsCount = 0,
  faultCount = 0,
  onRefreshData
}) => {
  const userDept = getUserDepartment(currentUser);
  const isDeptScoped = (isHeadNurse(currentUser) || isDepartmentRestricted(currentUser)) && Boolean(userDept);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      case 'analytics':
        return { title: '设备运转效能与质控决策分析', badge: '运转负荷 / MTBF故障率 / 质控达标率大盘', category: '统计决策与效益' };
      case 'roi':
        return { title: '大型医用设备单机效益核算 (ROI)', badge: '单机收支模型 / 成本折旧摊销 / 投资回报分析', category: '统计决策与效益' };
      case 'ai':
        return { title: 'AI 智维专家助手', badge: 'Gemini 智能临床故障诊断与技术评估推演', category: '统计决策与效益' };
      case 'regulations':
        return { title: '医学工程管理规章制度中心', badge: '国家药监法规 · 院级制度 · PM强检规程 · 临床SOP与应急预案', category: '决策与档案' };
      case 'project_concluding':
        return { title: '日照市社会科学专项课题结项专区', badge: '万字实证研究报告 · 仿真结项鉴定书 · 核心论文知网核验', category: '科研成果与鉴定' };
      case 'system_ops':
        return { title: '系统与运维综合管理中心', badge: 'AI 大模型配置 · 数据库安全备份 · 前端 UI 更新 · 草料二维码直通', category: '系统与运维' };
      case 'ai_config':
        return { title: 'AI 智能模型与算法引擎配置', badge: 'Google Gemini / 本地私有化模型 / 专科 Prompt / RAG 知识库', category: '系统与运维' };
      case 'database_backup':
        return { title: '数据安全备份与数据库管理配置', badge: '多源数据库连接池 / 定时冷备份 / 全量快照一键灾难恢复', category: '系统与运维' };
      case 'system_update':
        return { title: '系统更新与前端 UI 视觉设计配置', badge: '主题色板定制 / 院区品牌标识 / 热插拔特性开关 / 在线热更新', category: '系统与运维' };
      case 'caoliao_integration':
        return { title: '草料二维码官方数据库联动接口', badge: '阿里云 RDS · 1602个活码 · 现场扫码与医院工单实时联动', category: '系统与运维' };
      default:
        return { title: '设备资产台账', badge: '全院设备资产全息管理', category: '技术资产与库房' };
    }
  };

  const { title, badge, category } = getTitleInfo();

  return (
    <header className="h-16 flex-none bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-40 shrink-0 gap-3 min-w-0 relative shadow-2xs">
      
      {/* 1. 左侧：三甲医院机构名与当前页面导航定位 (大气尊贵) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="hidden lg:flex flex-col">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>五莲县人民医院</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">{currentUser.organization || '医学工程保障中心'}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate whitespace-nowrap">
              {title}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0 whitespace-nowrap">
              {category}
            </span>
          </div>
        </div>

        {/* 移动端/小屏模式标题 */}
        <div className="lg:hidden flex items-center gap-2">
          <h1 className="text-base font-bold text-slate-900 truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* 2. 中间：全局实用命令检索框 (Command Palette Trigger) */}
      <div className="hidden md:flex items-center max-w-xs lg:max-w-sm w-full mx-2">
        <button
          type="button"
          onClick={onOpenQuickSearch}
          className="w-full h-9 px-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between gap-2 transition cursor-pointer group shadow-2xs"
          title="全局搜索 (Ctrl+K)"
        >
          <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-800 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
            <span className="truncate">全局搜索设备 / 工单 / 科室...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* 3. 右侧：标准系统工具栏与用户身份 */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        
        {/* 待办与系统预警通知铃铛 (标准企业级通知入口) */}
        {onQuickApprovals && (
          <button
            type="button"
            onClick={onQuickApprovals}
            className="w-9 h-9 relative rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition cursor-pointer border border-slate-200 bg-slate-50 shadow-2xs"
            title={pendingAlertsCount > 0 ? `待办与预警提醒 (${pendingAlertsCount}项)` : '待办与预警'}
            aria-label="待办与预警通知"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {pendingAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10.5px] font-mono font-bold flex items-center justify-center shadow-xs">
                {pendingAlertsCount > 99 ? '99+' : pendingAlertsCount}
              </span>
            )}
          </button>
        )}

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
