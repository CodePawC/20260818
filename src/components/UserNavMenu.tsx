import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Shield, 
  ChevronDown, 
  Building2, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Wrench, 
  Activity, 
  FileText,
  UserCheck,
  RefreshCw,
  Award,
  ChevronRight,
  Phone,
  Search,
  BadgeCheck,
  CheckCircle2,
  Users,
  Briefcase,
  X,
  CreditCard,
  Layers,
  Sparkle
} from 'lucide-react';
import { AuthUser, StaffPersonMaster } from '../types';
import { getRoleBadgeStyle, inferStakeholderCluster, STAKEHOLDER_CLUSTERS } from '../utils/staffRolesData';
import { SUPER_ADMIN_USER, createAuthUserFromStaff } from '../utils/authUtils';

interface UserNavMenuProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onSwitchUser: (newUser: AuthUser) => void;
  masterStaff: StaffPersonMaster[];
}

export const UserNavMenu: React.FC<UserNavMenuProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  masterStaff
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('all');
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPersona = (staff: StaffPersonMaster) => {
    const authUser = createAuthUserFromStaff(staff);
    onSwitchUser(authUser);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelectAdmin = () => {
    onSwitchUser(SUPER_ADMIN_USER);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 获取当前用户的干系人集群信息
  const currentCluster = currentUser.isAdmin 
    ? '系统管理中心' 
    : (STAKEHOLDER_CLUSTERS.find(c => c.id === inferStakeholderCluster(currentUser.role, currentUser.departmentName, currentUser.organization))?.name || '业务干系人');

  // 过滤干系人列表
  const filteredStaff = masterStaff.filter(s => {
    if (selectedClusterFilter !== 'all') {
      const cluster = s.stakeholderCategory || inferStakeholderCluster(s.role, s.departmentName, s.organization);
      if (cluster !== selectedClusterFilter) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.employeeNo.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.departmentName.toLowerCase().includes(q) ||
      (s.title && s.title.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* 顶部触发胶囊按钮 */}
      <button
        type="button"
        id="user-profile-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs group select-none"
        title="点击查看当前登录身份与切换角色"
      >
        {/* 头像 */}
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white">
          {currentUser.isAdmin ? '管' : (currentUser.name ? currentUser.name[0] : '用')}
        </div>

        {/* 姓名与角色信息 */}
        <div className="text-left hidden sm:block max-w-[130px]">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">
              {currentUser.name}
            </span>
          </div>
          <div className="text-[10.5px] text-slate-500 mt-1 leading-none truncate">
            {currentUser.role}
          </div>
        </div>

        {/* 科室/机构徽标 */}
        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
          <Building2 className="w-3 h-3 text-slate-400" />
          <span className="truncate max-w-[90px]">{currentUser.departmentName || currentUser.organization}</span>
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </button>

      {/* 统一重构后的专业卡片式下拉面板 */}
      {isOpen && (
        <div 
          id="user-profile-dropdown-panel"
          className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-[480px] md:w-[520px] max-w-[min(540px,calc(100vw-1rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden text-xs text-slate-800 flex flex-col max-h-[min(640px,calc(100vh-4.5rem))] animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-900/5"
        >
          {/* 1. 顶部当前身份名片卡 */}
          <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-white relative overflow-hidden shrink-0 border-b border-slate-800 w-full">
            {/* 背景微光装饰 */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* 顶栏：头像 + 姓名 + 在线状态 */}
            <div className="flex items-start justify-between gap-3 relative z-10 w-full">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-white font-bold text-base flex items-center justify-center shadow-lg shrink-0 border border-white/20 ${
                  currentUser.isAdmin 
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-400/30' 
                    : 'bg-gradient-to-tr from-indigo-500 to-blue-600 ring-2 ring-indigo-400/30'
                }`}>
                  {currentUser.isAdmin ? '管' : (currentUser.name ? currentUser.name[0] : '用')}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[140px]">
                      {currentUser.name}
                    </span>
                    {currentUser.isAdmin ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/40 text-[10.5px] font-bold shrink-0 flex items-center gap-1">
                        <Sparkle className="w-2.5 h-2.5 fill-purple-300 text-purple-300" />
                        系统超级管理员
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 text-[10.5px] font-medium shrink-0">
                        {currentUser.role}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2 min-w-0 truncate">
                    <span className="text-indigo-300/90 font-medium truncate">{currentCluster}</span>
                  </div>
                </div>
              </div>

              {/* 实时状态胶囊 */}
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium shrink-0 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>在线运行</span>
              </div>
            </div>

            {/* 详细信息 2x2 结构化排版卡片 */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] w-full">
              <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 flex flex-col justify-center min-w-0">
                <span className="text-slate-400 text-[10px] flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                  机构 / 部门科室
                </span>
                <span className="text-slate-200 font-medium truncate mt-0.5" title={`${currentUser.organization} · ${currentUser.departmentName}`}>
                  {currentUser.departmentName ? `${currentUser.departmentName} (${currentUser.organization})` : currentUser.organization}
                </span>
              </div>

              <div className="bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 flex flex-col justify-center min-w-0">
                <span className="text-slate-400 text-[10px] flex items-center gap-1 truncate">
                  <CreditCard className="w-3 h-3 text-indigo-400 shrink-0" />
                  人员工号 / 职务
                </span>
                <span className="text-slate-200 font-mono font-medium truncate mt-0.5">
                  {currentUser.employeeNo} {currentUser.title ? `(${currentUser.title})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 授权状态与权限范围简报 */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-[11px] shrink-0 w-full min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">当前已授予功能特权</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono text-indigo-700 font-bold bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200 text-[10.5px]">
                {currentUser.isAdmin ? '全局控制 (Full Access)' : `${(currentUser.permissions || []).length} 项权限已激活`}
              </span>
            </div>
          </div>

          {/* 3. 快速切换角色与干系人视角 */}
          <div className="p-3.5 space-y-2.5 flex-1 min-h-0 overflow-hidden flex flex-col bg-white w-full">
            {/* 栏目标题与提示 */}
            <div className="flex items-center justify-between gap-2 shrink-0 w-full min-w-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 tracking-tight truncate">快速切换干系人视角</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-medium shrink-0">即点即切 无缝协同</span>
            </div>

            {/* 搜索框 */}
            <div className="relative shrink-0 w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索姓名、工号、角色、科室或职务..."
                className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 集群快速过滤 Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10.5px] shrink-0 w-full scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedClusterFilter('all')}
                className={`px-2.5 py-0.5 rounded-md font-bold shrink-0 cursor-pointer transition border ${
                  selectedClusterFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                全部 ({masterStaff.length + 1})
              </button>
              {STAKEHOLDER_CLUSTERS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClusterFilter(c.id)}
                  className={`px-2.5 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition border ${
                    selectedClusterFilter === c.id
                      ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {c.shortName}
                </button>
              ))}
            </div>

            {/* 可切换的人员角色列表 */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5 border border-slate-200/70 rounded-xl p-1.5 bg-slate-50/40 w-full">
              {/* 超级管理员选项 */}
              {(selectedClusterFilter === 'all' || selectedClusterFilter === 'admin') && !searchQuery && (
                <div
                  onClick={handleSelectAdmin}
                  className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition group w-full min-w-0 ${
                    currentUser.isAdmin 
                      ? 'bg-purple-50/90 border-purple-300 text-purple-900 font-bold shadow-xs' 
                      : 'bg-white hover:bg-purple-50/40 border-slate-200/80 hover:border-purple-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs shrink-0">
                      管
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="font-bold text-slate-900 truncate">系统总管 · 超级管理员</span>
                        <span className="text-[9px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-bold shrink-0">ALL</span>
                      </div>
                      <div className="text-[10.5px] sm:text-[11px] text-slate-500 truncate">
                        医学装备全业务控制权限 · 系统全功能
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 pl-1 flex items-center">
                    {currentUser.isAdmin ? (
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md font-semibold group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600 transition shadow-2xs">
                        切换
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 业务干系人人员列表 */}
              {filteredStaff.map(s => {
                const isCurrent = currentUser.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelectPersona(s)}
                    className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-center justify-between gap-3 cursor-pointer transition group w-full min-w-0 ${
                      isCurrent 
                        ? 'bg-indigo-50/90 border-indigo-300 text-indigo-900 font-bold shadow-xs' 
                        : 'bg-white hover:bg-indigo-50/40 border-slate-200/80 hover:border-indigo-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700'
                      }`}>
                        {s.name[0]}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-bold text-slate-900 truncate">{s.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">#{s.employeeNo}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getRoleBadgeStyle(s.role)}`}>
                            {s.role}
                          </span>
                          {s.title && (
                            <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                              {s.title}
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] sm:text-[11px] text-slate-500 truncate" title={`${s.organization} · ${s.departmentName}`}>
                          {s.departmentName} <span className="text-slate-300">·</span> {s.organization}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center pl-1">
                      {isCurrent ? (
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md font-semibold group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition shadow-2xs">
                          切换
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredStaff.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-1.5 w-full">
                  <Search className="w-5 h-5 text-slate-300" />
                  <span>未找到匹配的人员或角色视角</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. 底部状态与操作栏 */}
          <div className="p-3 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0 min-w-0 w-full">
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 min-w-0 flex-1 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">当前所属主体: <strong className="text-slate-700 font-medium">{currentUser.organization}</strong></span>
            </div>
            <button
              type="button"
              id="logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 font-bold text-xs transition cursor-pointer border border-rose-200 hover:border-rose-600 bg-white shadow-2xs shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
