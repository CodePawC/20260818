import React from 'react';
import { Bot } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { AuthUser, StaffPersonMaster } from '../types';
import { UserNavMenu } from './UserNavMenu';
import { isHeadNurse, getUserDepartment } from '../utils/authUtils';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenAiModal: () => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onSwitchUser: (newUser: AuthUser) => void;
  masterStaff: StaffPersonMaster[];
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenAiModal,
  currentUser,
  onLogout,
  onSwitchUser,
  masterStaff
}) => {
  const isNurse = isHeadNurse(currentUser);
  const userDept = getUserDepartment(currentUser);

  const getTitleInfo = () => {
    if (isNurse && userDept) {
      switch (activeTab) {
        case 'ledger':
          return { title: `【${userDept}】设备台账 Department Ledger`, badge: `${userDept} 在册设备资产专属管理` };
        case 'dashboard':
          return { title: `【${userDept}】工作台概览 Dashboard`, badge: `${userDept} 实时运行与交接点检看板` };
        case 'emergency_reserve':
          return { title: '医疗设备应急库 Emergency Reserve', badge: '全院共享急救生命支持设备借调与周转' };
        case 'maintenance':
          return { title: `【${userDept}】维保与强检计划 Maintenance`, badge: `${userDept} 定期预防性保养与定标` };
        case 'repairs':
          return { title: `【${userDept}】报修与维修记录 Repair Logs`, badge: `${userDept} 设备报修与处理跟踪` };
        case 'ai':
          return { title: 'AI 急救排查专家 AI Assistant', badge: 'Gemini 智能故障诊断与急救支持' };
        default:
          return { title: `【${userDept}】设备台账`, badge: '本科室专属闭环管理' };
      }
    }

    switch (activeTab) {
      case 'ledger':
        return { title: '设备台账 Equipment Ledger', badge: '全院设备资产电子档案' };
      case 'dashboard':
        return { title: '工作台概览 Dashboard', badge: '实时运营数据监测' };
      case 'emergency_reserve':
        return { title: '医疗设备应急库与跨科周转中心 Emergency Reserve', badge: '全院急救与周转设备24H调度' };
      case 'maintenance':
        return { title: '维保计划 Maintenance', badge: '定期预防性保养与定标' };
      case 'repairs':
        return { title: '维修记录 Repair Logs', badge: '全流程维修工单与跟踪' };
      case 'tracking':
        return { title: '状态追踪 Status Track', badge: '设备状态变动轨迹' };
      case 'analytics':
        return { title: '效能分析 Analytics', badge: '设备使用率与费用统计' };
      case 'partners':
        return { title: '往来单位与服务商协同 Partners & Vendors', badge: '法定计量检测机构 / 生产厂家原厂 / 第三方维保公司 / 供货商' };
      case 'master_data':
        return { title: '标准化主数据 Master Data', badge: '院区楼宇 / 科室 / 强检目录 / 分类目录 / 人员干系人' };
      case 'ai':
        return { title: 'AI 维保专家 AI Assistant', badge: 'Gemini 智能故障诊断' };
      default:
        return { title: '设备台账 Ledger', badge: '全院设备资产' };
    }
  };

  const { title, badge } = getTitleInfo();

  return (
    <header className="h-16 flex-none bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-40 shrink-0 gap-3 min-w-0 relative">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight truncate whitespace-nowrap">{title}</h1>
        <span className="hidden 2xl:inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0 whitespace-nowrap">
          {badge}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* 全局智能诊断入口 */}
        <button
          onClick={onOpenAiModal}
          className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white rounded-md text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer hover:shadow-sm"
          title="使用 Gemini 智能诊断与排查医疗设备故障"
        >
          <Bot className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">{isNurse ? 'AI 急救排查' : 'AI 诊断专家'}</span>
        </button>

        {/* User Nav Profile & Switcher */}
        <div className="pl-3 border-l border-slate-200">
          <UserNavMenu
            currentUser={currentUser}
            onLogout={onLogout}
            onSwitchUser={onSwitchUser}
            masterStaff={masterStaff}
          />
        </div>
      </div>
    </header>
  );
};
