import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  History, 
  Activity, 
  Bot, 
  PieChart, 
  ShieldCheck,
  Building2,
  Boxes
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';
import { canAccessTab, isHeadNurse, getUserDepartment } from '../utils/authUtils';

export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  faultyCount: number;
  maintenanceCount: number;
  emergencyReserveCount?: number;
  partnerCount?: number;
  departmentCount?: number;
  currentUser?: AuthUser;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  faultyCount,
  maintenanceCount,
  emergencyReserveCount,
  partnerCount,
  departmentCount,
  currentUser
}) => {
  const canAccess = (tab: ActiveTab) => {
    if (!currentUser) return true;
    return canAccessTab(currentUser, tab);
  };

  const isNurse = isHeadNurse(currentUser);
  const userDept = getUserDepartment(currentUser);

  // 检查各个分区是否有至少一个可访问的菜单
  const hasAssetSection = canAccess('ledger') || canAccess('emergency_reserve') || canAccess('maintenance') || canAccess('repairs') || canAccess('tracking');
  const hasPartnerSection = canAccess('partners');
  const hasMasterDataSection = canAccess('master_data');
  const hasAiAssistantSection = canAccess('ai') || canAccess('analytics');

  return (
    <aside className="w-64 flex-none bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-full shrink-0 select-none z-20 overflow-hidden">
      {/* System Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-950/60 gap-2.5 shrink-0 min-w-0 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-base font-bold text-white tracking-tight block truncate whitespace-nowrap">MED-TECH Ledger</span>
          <span className="text-xs text-slate-300 font-medium block -mt-0.5 truncate">
            {isNurse && userDept ? `${userDept} · 护士长工作台` : '医疗设备资产管理系统'}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* 工作台概览 */}
        {canAccess('dashboard') && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-4.5 h-4.5" />
              </div>
              <span className="truncate">{isNurse ? '科室工作台' : '工作台概览'}</span>
            </div>
          </button>
        )}

        {/* 资产与台账分区 */}
        {hasAssetSection && (
          <>
            <div className="pt-3.5 pb-1 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{isNurse ? '科室资产台账' : '资产运维管理'}</span>
            </div>

            {canAccess('ledger') && (
              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate">{isNurse ? '科室设备台账' : '设备资产台账'}</span>
                </div>
              </button>
            )}

            {canAccess('emergency_reserve') && (
              <button
                onClick={() => setActiveTab('emergency_reserve')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'emergency_reserve'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Boxes className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <span className="truncate">{isNurse ? '应急储备库' : '应急调配库'}</span>
                </div>
                {emergencyReserveCount !== undefined && emergencyReserveCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shrink-0 font-mono">
                    {emergencyReserveCount}台
                  </span>
                )}
              </button>
            )}

            {canAccess('maintenance') && (
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'maintenance'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Wrench className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate">维保强检计划</span>
                </div>
                {maintenanceCount > 0 && (
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-amber-500 text-slate-950 font-bold shrink-0 font-mono">
                    {maintenanceCount}
                  </span>
                )}
              </button>
            )}

            {canAccess('repairs') && (
              <button
                onClick={() => setActiveTab('repairs')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'repairs'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <History className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate">维修报修记录</span>
                </div>
                {faultyCount > 0 && (
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-rose-500 text-white font-bold animate-pulse shrink-0 font-mono">
                    {faultyCount}
                  </span>
                )}
              </button>
            )}

            {canAccess('tracking') && (
              <button
                onClick={() => setActiveTab('tracking')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'tracking'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Activity className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate">设备状态追踪</span>
                </div>
              </button>
            )}
          </>
        )}

        {/* 供应商与服务商协同分区 */}
        {hasPartnerSection && (
          <>
            <div className="pt-3.5 pb-1 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              协同网络
            </div>

            {canAccess('partners') && (
              <button
                onClick={() => setActiveTab('partners')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'partners'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Building2 className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <span className="truncate">协同往来单位</span>
                </div>
                {partnerCount !== undefined && partnerCount > 0 && (
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 shrink-0 font-mono">
                    {partnerCount}
                  </span>
                )}
              </button>
            )}
          </>
        )}

        {/* 标准化主数据分区 */}
        {hasMasterDataSection && (
          <>
            <div className="pt-3.5 pb-1 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              主数据中心
            </div>

            {canAccess('master_data') && (
              <button
                onClick={() => setActiveTab('master_data')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'master_data'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Boxes className="w-4.5 h-4.5 text-indigo-400" />
                  </div>
                  <span className="truncate">空间与组织数据</span>
                </div>
                {departmentCount !== undefined && departmentCount > 0 && (
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shrink-0 font-mono">
                    {departmentCount}科
                  </span>
                )}
              </button>
            )}
          </>
        )}

        {/* 智能工程助手分区 */}
        {hasAiAssistantSection && (
          <>
            <div className="pt-3.5 pb-1 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isNurse ? '智能急救支持' : '智能与决策'}
            </div>

            {canAccess('ai') && (
              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'ai'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <Bot className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <span className="truncate">{isNurse ? 'AI 急救诊断' : 'AI 智能诊断'}</span>
                </div>
              </button>
            )}

            {canAccess('analytics') && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full h-11 flex items-center justify-between px-3 rounded-lg text-left text-sm transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <PieChart className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate">效能决策看板</span>
                </div>
              </button>
            )}
          </>
        )}
      </nav>

      {/* 底部当前登录角色状态栏 */}
      {currentUser && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser.isAdmin ? '管' : currentUser.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">{currentUser.name}</span>
                <span className="text-xs text-slate-400 font-mono">({currentUser.employeeNo})</span>
              </div>
              <div className="text-xs text-indigo-300 truncate font-medium">
                {currentUser.role} · {currentUser.departmentName}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
