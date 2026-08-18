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
  Award
} from 'lucide-react';
import { AuthUser, StaffPersonMaster } from '../types';
import { getRoleBadgeStyle, inferStakeholderCluster } from '../utils/staffRolesData';
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
  const [isSwitchingOpen, setIsSwitchingOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSwitchingOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPersona = (staff: StaffPersonMaster) => {
    const authUser = createAuthUserFromStaff(staff);
    onSwitchUser(authUser);
    setIsOpen(false);
    setIsSwitchingOpen(false);
  };

  const handleSelectAdmin = () => {
    onSwitchUser(SUPER_ADMIN_USER);
    setIsOpen(false);
    setIsSwitchingOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 顶部触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-1 px-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition cursor-pointer shadow-2xs group"
        title="点击查看当前登录身份与切换权限角色"
      >
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
          {currentUser.isAdmin ? '管' : currentUser.name[0]}
        </div>

        <div className="text-left hidden md:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {currentUser.employeeNo}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 leading-none truncate max-w-[130px]">
            {currentUser.departmentName}
          </div>
        </div>

        <span className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeStyle(currentUser.role)}`}>
          {currentUser.role}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 弹出菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          
          {/* 用户概览头部 */}
          <div className="p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-white/20 flex items-center justify-center font-bold text-sm text-white shadow-sm">
                  {currentUser.isAdmin ? '管' : currentUser.name[0]}
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.isAdmin && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-500 text-[10px] font-bold text-white">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                    工号: {currentUser.employeeNo}
                  </div>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeStyle(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span className="truncate">{currentUser.organization} · {currentUser.departmentName}</span>
              </div>
              {currentUser.title && (
                <div className="text-indigo-200 font-medium pl-5 truncate">
                  职称/职能: {currentUser.title}
                </div>
              )}
            </div>
          </div>

          {/* 权限清单展示 */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>当前角色已授权操作权限</span>
              </span>
              <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 text-[10px]">
                {currentUser.isAdmin ? '全权限 (ALL)' : `${currentUser.permissions.length} 项`}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
              {currentUser.isAdmin ? (
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                  ✓ 拥有全院设备台账、强检申报、维修派工、主数据及系统管理全权限
                </span>
              ) : (
                currentUser.permissions.map(perm => (
                  <span key={perm} className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-medium">
                    ✓ {perm}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 快速切换身份 */}
          <div className="p-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsSwitchingOpen(!isSwitchingOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-indigo-600 ${isSwitchingOpen ? 'rotate-180' : ''} transition-transform`} />
                <span>切换其他角色身份 (快速测试权限)</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSwitchingOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSwitchingOpen && (
              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto pl-1 pr-1 py-1 bg-slate-50 rounded-lg border border-slate-200">
                {/* 超级管理员 */}
                <button
                  type="button"
                  onClick={handleSelectAdmin}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition cursor-pointer ${
                    currentUser.isAdmin ? 'bg-purple-100 text-purple-800 font-bold' : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>系统总管 / 超管</span>
                  </div>
                  <span className="text-[10px] bg-purple-200 text-purple-800 px-1 rounded">ADMIN</span>
                </button>

                {/* 主数据干系人 */}
                {masterStaff.map(s => {
                  const isCurrent = currentUser.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectPersona(s)}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition cursor-pointer ${
                        isCurrent ? 'bg-indigo-100 text-indigo-800 font-bold' : 'hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold truncate">{s.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({s.departmentName})</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getRoleBadgeStyle(s.role)}`}>
                        {s.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 退出登录 */}
          <div className="p-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer border border-rose-100"
            >
              <LogOut className="w-4 h-4" />
              <span>退出当前登录会话</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
