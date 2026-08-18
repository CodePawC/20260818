import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  KeyRound, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Wrench, 
  Activity, 
  FileText, 
  Award, 
  Layers, 
  ArrowRight,
  Shield,
  Info,
  ChevronRight,
  Lock,
  Stethoscope
} from 'lucide-react';
import { AuthUser, StaffPersonMaster, StakeholderCluster } from '../types';
import { 
  createAuthUserFromStaff, 
  SUPER_ADMIN_USER, 
  getPermissionsForStaff 
} from '../utils/authUtils';
import { 
  STAKEHOLDER_CLUSTERS, 
  getRoleBadgeStyle, 
  getEmergencyTierBadgeStyle,
  inferStakeholderCluster
} from '../utils/staffRolesData';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
  masterStaff: StaffPersonMaster[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, masterStaff }) => {
  const [activeMode, setActiveMode] = useState<'persona' | 'form'>('persona');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>('all');
  
  // 表单登录字段
  const [inputAccount, setInputAccount] = useState<string>('EMP-7001'); // 默认崔工
  const [inputPassword, setInputPassword] = useState<string>('123456');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 识别输入的账号对应的人员
  const matchedStaffByInput = useMemo(() => {
    if (!inputAccount.trim()) return null;
    const query = inputAccount.trim().toLowerCase();
    return masterStaff.find(s => 
      s.employeeNo.toLowerCase() === query || 
      s.name.toLowerCase() === query ||
      s.phone?.includes(query) ||
      s.id.toLowerCase() === query
    ) || null;
  }, [inputAccount, masterStaff]);

  // 过滤展示的干系人角色清单
  const filteredStaffList = useMemo(() => {
    if (selectedClusterFilter === 'all') return masterStaff;
    if (selectedClusterFilter === 'admin') return [];
    return masterStaff.filter(s => {
      const cluster = s.stakeholderCategory || inferStakeholderCluster(s.role, s.departmentName, s.organization);
      return cluster === selectedClusterFilter;
    });
  }, [masterStaff, selectedClusterFilter]);

  // 处理快捷角色一键登录
  const handlePersonaLogin = (staff: StaffPersonMaster) => {
    setIsLoading(true);
    setTimeout(() => {
      const authUser = createAuthUserFromStaff(staff);
      onLogin(authUser);
    }, 200);
  };

  // 处理超级管理员一键登录
  const handleSuperAdminLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin(SUPER_ADMIN_USER);
    }, 200);
  };

  // 处理表单提交登录
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!inputAccount.trim()) {
      setFormError('请输入工号、姓名或手机号');
      return;
    }

    // 检查超级管理员快捷输入
    if (inputAccount.trim().toLowerCase() === 'admin' || inputAccount.trim() === 'ADMIN-001') {
      setIsLoading(true);
      setTimeout(() => {
        onLogin(SUPER_ADMIN_USER);
      }, 250);
      return;
    }

    if (matchedStaffByInput) {
      setIsLoading(true);
      setTimeout(() => {
        const authUser = createAuthUserFromStaff(matchedStaffByInput);
        onLogin(authUser);
      }, 250);
    } else {
      // 允许输入自定义姓名临时登录（按设备管理员角色权限赋予）
      setIsLoading(true);
      setTimeout(() => {
        const customStaff: StaffPersonMaster = {
          id: `STAFF-CUSTOM-${Date.now()}`,
          employeeNo: inputAccount.trim(),
          name: inputAccount.trim(),
          role: '设备管理员',
          departmentId: '303',
          departmentName: '临床综合科室',
          organization: '五莲县人民医院',
          phone: '7991000',
          title: '责任工程师',
          isPrimaryContact: true,
          status: 'active'
        };
        const authUser = createAuthUserFromStaff(customStaff);
        onLogin(authUser);
      }, 250);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* 顶部环境与品牌状态条 */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>五莲县公立医疗集团</span>
              <span className="text-xs font-normal text-slate-400">|</span>
              <span className="text-xs md:text-sm font-semibold text-indigo-300">医疗设备资产全生命周期智慧管理平台</span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              国家计量强检规范 (JJG/JJF) · 医疗器械唯一标识 (UDI) · 医院等级评审标杆系统
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            系统运行正常 · RBAC权限就绪
          </span>
        </div>
      </div>

      {/* 主体交互区域 */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-7xl w-full mx-auto">
        <div className="w-full max-w-5xl bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* 模式切换选项卡 */}
          <div className="bg-slate-900/90 border-b border-slate-700/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">用户身份验证与角色授权 (Role-Based Access Control)</h2>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveMode('persona')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'persona'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>主数据角色一键体验</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/40 text-indigo-100 ml-0.5">推荐</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('form')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'form'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>工号 / 密码标准登录</span>
              </button>
            </div>
          </div>

          {/* 选项卡 1：主数据干系人角色矩阵一键登录 */}
          {activeMode === 'persona' && (
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>选择预设主数据干系人身份直接登录</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    系统根据《组织人员与干系人主数据》中分配的岗位角色，动态载入对应的菜单权限、强检申报、维修派单及台账管理范围。
                  </p>
                </div>

                {/* 集群筛选按钮组 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedClusterFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      selectedClusterFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    全部 ({masterStaff.length + 1})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClusterFilter('hospital_engineering')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      selectedClusterFilter === 'hospital_engineering'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    院内医工保障
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClusterFilter('hospital_clinical')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      selectedClusterFilter === 'hospital_clinical'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    临床医护
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClusterFilter('hospital_administration')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      selectedClusterFilter === 'hospital_administration'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    行政监管
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClusterFilter('oem_vendor')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      selectedClusterFilter === 'oem_vendor'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    原厂/三方
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedClusterFilter('admin')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      selectedClusterFilter === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-950/40 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60'
                    }`}
                  >
                    超级管理员
                  </button>
                </div>
              </div>

              {/* 超级管理员置顶推荐卡片 */}
              {(selectedClusterFilter === 'all' || selectedClusterFilter === 'admin') && (
                <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-600/20 shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-base font-bold text-white">系统总管 / 超级管理员</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          全模块最高控制权 (ALL PERMISSIONS)
                        </span>
                        <span className="font-mono text-xs text-slate-400">ADMIN-001</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        具备台账管理、强检申报、维修审核、主数据重构、人员赋权、往来单位与财务折旧全量权限。
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSuperAdminLogin}
                    disabled={isLoading}
                    className="w-full md:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
                  >
                    <span>以超管身份进入</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 主数据干系人员工卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredStaffList.map((person) => {
                  const permissions = getPermissionsForStaff(person);
                  const cluster = person.stakeholderCategory || inferStakeholderCluster(person.role, person.departmentName, person.organization);
                  const clusterDef = STAKEHOLDER_CLUSTERS.find(c => c.id === cluster);

                  return (
                    <div
                      key={person.id}
                      className="bg-slate-900/80 border border-slate-700/70 hover:border-indigo-500/60 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-lg group"
                    >
                      <div>
                        {/* Header: Name & Role Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                                {person.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ({person.employeeNo})
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{person.departmentName}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${getRoleBadgeStyle(person.role)}`}>
                              {person.role}
                            </span>
                            {person.role === '护士长' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/80">
                                🏥 {person.departmentName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Specialties */}
                        {person.title && (
                          <div className="text-[11px] text-indigo-300/90 font-medium mt-1.5 line-clamp-1">
                            {person.title}
                          </div>
                        )}

                        {/* Permissions Tags */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                          {person.role === '护士长' && (
                            <span className="px-1.5 py-0.5 bg-rose-900/40 text-rose-200 rounded text-[10px] border border-rose-700/60 font-semibold">
                              ★ 专属管理: {person.departmentName}
                            </span>
                          )}
                          {permissions.slice(0, 4).map(perm => (
                            <span key={perm} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-700/60">
                              ✓ {perm}
                            </span>
                          ))}
                          {permissions.length > 4 && (
                            <span className="px-1 py-0.5 text-slate-500 text-[10px]">
                              +{permissions.length - 4}项
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handlePersonaLogin(person)}
                        disabled={isLoading}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/80 group-hover:border-indigo-500/40"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>以 {person.name} ({person.role}) 登录</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 选项卡 2：标准表单工号登录 */}
          {activeMode === 'form' && (
            <div className="p-6 md:p-10 max-w-lg mx-auto">
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white">医疗业务系统账号凭据登录</h3>
                  <p className="text-xs text-slate-400">
                    支持输入院内工号 (如 EMP-7001)、姓名、或统一认证口令
                  </p>
                </div>

                {formError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 识别提示框 */}
                {matchedStaffByInput && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                        {matchedStaffByInput.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{matchedStaffByInput.name}</span>
                          <span className="text-[10px] text-slate-400">({matchedStaffByInput.employeeNo})</span>
                        </div>
                        <div className="text-[11px] text-indigo-300">
                          {matchedStaffByInput.departmentName} · {matchedStaffByInput.title || matchedStaffByInput.role}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeStyle(matchedStaffByInput.role)}`}>
                      {matchedStaffByInput.role}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      员工工号 / 登录账号 / 姓名
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={inputAccount}
                        onChange={(e) => setInputAccount(e.target.value)}
                        placeholder="请输入工号 (如 EMP-7001 或 admin)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      密码 / 动态授权码
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="请输入密码 (演示环境默认 123456)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>保持当前登录会话 (Remember session)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setInputAccount('ADMIN-001')}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                    >
                      填入管理员
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? '正在验证身份与权限...' : '登录进入医疗设备管理系统'}</span>
                </button>
              </form>
            </div>
          )}

          {/* 底部权限说明条 */}
          <div className="bg-slate-950/60 border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>权限范围严格受控于《国家卫健委医疗卫生机构仪器设备管理办法》</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>版本: v4.2.0-Enterprise</span>
              <span>日照市五莲县人民医院 / 皮肤病医院</span>
            </div>
          </div>

        </div>
      </main>

      {/* 底部版权信息 */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-800/60 bg-slate-950/40">
        <p>© 2026 五莲县人民医院 医学工程科 / 医疗设备资产全生命周期管理系统 · 保留所有权利</p>
      </footer>
    </div>
  );
};
