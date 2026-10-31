import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Wrench, 
  Activity, 
  PieChart, 
  ShieldCheck,
  Building2, Scale,
  Boxes,
  FileCheck,
  Coins,
  QrCode,
  Send,
  Package,
  ShieldAlert,
  Database,
  Search,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  DollarSign,
  RotateCcw,
  GitMerge,
  BookOpen,
  GraduationCap,
  Bot,
  HardDrive,
  Palette,
  Sliders,
  ChevronDown,
  Calculator,
  Smartphone,
  Award,
  Trash2,
  Radio,
  Network
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';
import { canAccessTab, isHeadNurse, isDepartmentRestricted, getUserDepartment } from '../utils/authUtils';
import { MedTechLogo } from './MedTechLogo';

export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  faultyCount: number;
  maintenanceCount: number;
  emergencyReserveCount?: number;
  pendingApprovalCount?: number;
  partnerCount?: number;
  departmentCount?: number;
  currentUser?: AuthUser;
}

interface NavItemConfig {
  key: ActiveTab;
  label: string;
  nurseLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavGroupConfig {
  id: string;
  title: string;
  items: NavItemConfig[];
}

const GROUP_THEMES: Record<string, { dot: string; border: string; bg: string; text: string; headerBg: string }> = {
  workspace: { 
    dot: 'bg-blue-400', 
    border: 'border-blue-500/30', 
    bg: 'bg-blue-950/25', 
    text: 'text-blue-400',
    headerBg: 'bg-blue-900/40 hover:bg-blue-900/60'
  },
  assets: { 
    dot: 'bg-emerald-400', 
    border: 'border-emerald-500/30', 
    bg: 'bg-emerald-950/25', 
    text: 'text-emerald-400',
    headerBg: 'bg-emerald-900/40 hover:bg-emerald-900/60'
  },
  operations: { 
    dot: 'bg-amber-400', 
    border: 'border-amber-500/30', 
    bg: 'bg-amber-950/25', 
    text: 'text-amber-400',
    headerBg: 'bg-amber-900/40 hover:bg-amber-900/60'
  },
  workflow: { 
    dot: 'bg-purple-400', 
    border: 'border-purple-500/30', 
    bg: 'bg-purple-950/25', 
    text: 'text-purple-400',
    headerBg: 'bg-purple-900/40 hover:bg-purple-900/60'
  },
  analytics: { 
    dot: 'bg-cyan-400', 
    border: 'border-cyan-500/30', 
    bg: 'bg-cyan-950/25', 
    text: 'text-cyan-400',
    headerBg: 'bg-cyan-900/40 hover:bg-cyan-900/60'
  },
  standards_system: { 
    dot: 'bg-indigo-400', 
    border: 'border-indigo-500/30', 
    bg: 'bg-indigo-950/25', 
    text: 'text-indigo-400',
    headerBg: 'bg-indigo-900/40 hover:bg-indigo-900/60'
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  faultyCount,
  maintenanceCount,
  pendingApprovalCount = 0,
  currentUser
}) => {
  const isNurse = isHeadNurse(currentUser) || isDepartmentRestricted(currentUser);
  const userDept = getUserDepartment(currentUser);

  // 侧边栏收起/展开状态 (持久化存储)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('med_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('med_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // 菜单搜索过滤
  const [searchQuery, setSearchQuery] = useState('');

  // 折叠分组状态管理 (支持各业务模块独立折叠，持久化存储)
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('med_sidebar_collapsed_groups');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds(prev => {
      const updated = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('med_sidebar_collapsed_groups', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 待办/预警徽标快速检索
  const getItemBadge = (key: ActiveTab) => {
    if (key === 'repairs' && faultyCount > 0) {
      return { count: faultyCount, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    }
    if (key === 'maintenance' && maintenanceCount > 0) {
      return { count: maintenanceCount, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
    if (key === 'approvals' && pendingApprovalCount > 0) {
      return { count: pendingApprovalCount, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
    return null;
  };

  const canAccess = (tab: ActiveTab) => {
    if (!currentUser) return true;
    return canAccessTab(currentUser, tab);
  };

  // 规范化 5 大核心业务模块体系 (分类名称统一定为 5 字，子菜单项严格统一定为 6 字，严禁省略号)
  const navGroups: NavGroupConfig[] = useMemo(() => [
    {
      id: 'workspace',
      title: '综合工作台',
      items: [
        {
          key: 'dashboard',
          label: '综合监控大盘',
          nurseLabel: '科室运行大盘',
          icon: LayoutDashboard,
          description: isNurse ? '科室在册设备晨间核查与状态看板' : '全院设备运行负荷与监控大盘'
        }
      ]
    },
    {
      id: 'assets',
      title: '资产与库房',
      items: [
        {
          key: 'ledger',
          label: '设备技术台账',
          nurseLabel: '科室设备台账',
          icon: FileText,
          description: '全生命周期设备技术档案与动态'
        },
        {
          key: 'mobile_inspection',
          label: '移动巡检盘点',
          nurseLabel: '移动巡检盘点',
          icon: QrCode,
          description: '扫码核验、在位纠偏与即时盘点'
        },
        {
          key: 'emergency_reserve',
          label: '应急调配中心',
          nurseLabel: '急救调配中心',
          icon: Boxes,
          description: '急救生命支持机具全院应急借调共享'
        },
        {
          key: 'digital_twin_sandbox',
          label: '数字孪生沙盘',
          nurseLabel: '设备孪生沙盘',
          icon: Radio,
          description: '全院建筑空间设备运行态势与应急调度推演'
        },
        {
          key: 'parts_inventory',
          label: '备品备件库存',
          nurseLabel: '备品备件库存',
          icon: Package,
          description: '维修配件库存管理与出入库核销'
        },
        {
          key: 'scrap_workflow',
          label: '设备报废处置',
          nurseLabel: '设备报废申请',
          icon: Trash2,
          description: '国有资产报废技术鉴定、多方联签与环保处置'
        }
      ]
    },
    {
      id: 'operations',
      title: '运维与质控',
      items: [
        {
          key: 'repairs',
          label: '临床报修处置',
          nurseLabel: '科室报修跟踪',
          icon: Wrench,
          description: isNurse ? '科室报修跟踪、外协零修进度与复核验收签字' : '临床报修发起与维修闭环处置'
        },
        {
          key: 'repair_closed_loop',
          label: '维修闭环管理',
          nurseLabel: '科室维修闭环',
          icon: GitMerge,
          description: '麻醉手术科报修·现场核验·返厂审批闭环'
        },
        {
          key: 'dispatch',
          label: '智能派工调度',
          nurseLabel: '智能派工调度',
          icon: Send,
          description: '工单调度分配与响应时效管控'
        },
        {
          key: 'maintenance',
          label: '维保强检计划',
          nurseLabel: '科室维保计划',
          icon: ShieldCheck,
          description: '法定强检定标与预防性维护PM排程'
        },
        {
          key: 'adverse_events',
          label: '不良事件监测',
          nurseLabel: '不良事件监测',
          icon: ShieldAlert,
          description: '医疗器械不良事件警戒监测与报告'
        }
      ]
    },
    {
      id: 'workflow',
      title: '审批与协同',
      items: [
        {
          key: 'approvals',
          label: '业务审批中心',
          nurseLabel: '科室审批中心',
          icon: FileCheck,
          description: '采购论证、借调、调拨与报废流转审批'
        },
        {
          key: 'tracking',
          label: '设备变动轨迹',
          nurseLabel: '设备流转轨迹',
          icon: Activity,
          description: '在院设备位置迁徙与变动时间轴'
        },
        {
          key: 'partners',
          label: '往来合作单位',
          nurseLabel: '往来合作单位',
          icon: Building2,
          description: '原厂供应商、第三方维保与检测机构'
        },
        {
          key: 'vendor_collaboration',
          label: '外协维修协同',
          nurseLabel: '科室外协协同',
          icon: Scale,
          description: isNurse ? '本科室外协零修工单、换件查验与电子签字' : '供应商报价、多科室联合议价、发票与一案一档归档'
        },
        {
          key: 'mobile_collaboration',
          label: '移动协同推送',
          nurseLabel: '移动协同推送',
          icon: Smartphone,
          description: '企业微信·钉钉·移动PDA即时协同与卡片推送'
        }
      ]
    },
    {
      id: 'analytics',
      title: '决策与评审',
      items: [
        {
          key: 'analytics',
          label: '效能决策分析',
          nurseLabel: '科室效能分析',
          icon: PieChart,
          description: '设备完好率、故障率与维保达标分析'
        },
        {
          key: 'roi',
          label: '单机效益核算',
          nurseLabel: '成本效益核算',
          icon: Coins,
          description: '大型高价值设备单机保本点与ROI测算'
        },
        {
          key: 'drg_cost_audit',
          label: '医保专耗核算',
          nurseLabel: '科室专耗核算',
          icon: Calculator,
          description: '医保DRG病组设备折旧与专机专耗钩稽核算'
        },
        {
          key: 'accreditation_quality',
          label: '三甲国考质控',
          nurseLabel: '三甲国考质控',
          icon: Award,
          description: '第四篇医疗装备评审标准动态自评与国考指标'
        },
        {
          key: 'smart_management',
          label: '智慧管理评级',
          nurseLabel: '智慧管理评级',
          icon: Network,
          description: '国家卫健委智慧管理1-5级自评与HIS/PACS接口钩稽'
        }
      ]
    },
    {
      id: 'standards_system',
      title: '档案与系统',
      items: [
        {
          key: 'regulations',
          label: '医工规章制度',
          nurseLabel: '科室规章制度',
          icon: BookOpen,
          description: '全院医疗设备管理制度汇编与全文检索'
        },
        {
          key: 'master_data',
          label: '系统基础档案',
          nurseLabel: '基础档案数据',
          icon: Database,
          description: '院区、科室、空间位置与基础参数配置'
        },
        {
          key: 'project_concluding',
          label: '课题结项评审',
          nurseLabel: '课题结项报告',
          icon: GraduationCap,
          description: '日照市2026年社科专项课题结项万字报告与鉴定成果'
        },
        {
          key: 'system_ops',
          label: '系统运维中心',
          nurseLabel: '系统运维中心',
          icon: Sliders,
          description: '系统健康体检、业务闭环测试、AI大模型配置、数据库灾备管理与性能优化'
        },
        {
          key: 'caoliao_webhook_logs',
          label: '草料报修日志',
          nurseLabel: '草料报修日志',
          icon: QrCode,
          description: '草料二维码API接口报修回调与关联审计日志'
        }
      ]
    }
  ], [
    isNurse,
    userDept
  ]);

  // 根据用户权限及搜索过滤
  const filteredGroups = useMemo(() => {
    return navGroups.map(group => {
      const authorizedItems = group.items.filter(item => canAccess(item.key));
      if (!searchQuery.trim()) {
        return { ...group, items: authorizedItems };
      }
      const query = searchQuery.trim().toLowerCase();
      const matchedItems = authorizedItems.filter(item => {
        const title = (isNurse && item.nurseLabel ? item.nurseLabel : item.label).toLowerCase();
        const desc = item.description.toLowerCase();
        return title.includes(query) || desc.includes(query);
      });
      return { ...group, items: matchedItems };
    }).filter(group => group.items.length > 0);
  }, [navGroups, currentUser, searchQuery, isNurse]);

  return (
    <aside 
      className={`flex-none bg-slate-900 text-slate-300 border-r border-slate-800/90 flex flex-col h-full shrink-0 select-none z-20 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      aria-label="系统主导航菜单"
    >
      {/* 1. 统一 64px 高度品牌区：高级大气、严密防溢出 */}
      <div className="h-16 flex items-center px-3.5 border-b border-slate-800/90 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shrink-0 relative overflow-hidden select-none">
        {/* 顶部微光光晕修饰线 */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500/70 via-cyan-400/50 to-transparent pointer-events-none" />

        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center min-w-0 cursor-pointer hover:opacity-90 transition-opacity w-full"
          title="MED-TECH OS 医学装备全生命周期闭环管理系统"
        >
          {isCollapsed ? (
            <div className="mx-auto flex items-center justify-center p-1">
              <MedTechLogo size="md" variant="icon" />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0 w-full overflow-hidden">
              <div className="shrink-0">
                <MedTechLogo size="md" variant="icon" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-black font-sans tracking-wide text-white text-[14px] leading-tight whitespace-nowrap">
                    MED-TECH OS
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-400/30 shrink-0 leading-tight">
                    v2.4
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium tracking-tight mt-0.5 min-w-0">
                  <span className="truncate">医学装备闭环管理系统</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" title="系统正常在线" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. 紧凑型快捷搜索框 (高度压至 32px，快速过滤) */}
      {!isCollapsed && (
        <div className="px-2.5 py-1.5 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="快速查找菜单..."
              className="w-full h-8 pl-8 pr-7 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                title="清空搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. 紧凑型分组导航列表 (彻底去除滚动条，垂直间距极度集约，支持分组折叠) */}
      <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5 sidebar-no-scrollbar select-none">
        {filteredGroups.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 px-3">
            未找到匹配的功能模块
          </div>
        ) : (
          filteredGroups.map((group) => {
            const containsActive = group.items.some(it => it.key === activeTab);
            const isGroupCollapsed = !searchQuery.trim() && Boolean(collapsedGroupIds[group.id]);
            const theme = GROUP_THEMES[group.id] || { 
              dot: 'bg-blue-400', 
              border: 'border-slate-800', 
              bg: 'bg-slate-900/30', 
              text: 'text-slate-300', 
              headerBg: 'bg-slate-800/60 hover:bg-slate-800' 
            };

            // 紧凑图标模式 (Rail mode)
            if (isCollapsed) {
              return (
                <div key={group.id} className="py-2 border-b border-slate-800/80 last:border-b-0 flex flex-col items-center">
                  <div className={`w-5 h-1 rounded-full ${theme.dot} opacity-70 mb-2`} title={group.title} />
                  <div className="space-y-1 w-full flex flex-col items-center">
                    {group.items.map(item => {
                      const isActive = activeTab === item.key;
                      const Icon = item.icon;
                      const displayLabel = isNurse && item.nurseLabel ? item.nurseLabel : item.label;
                      const badge = getItemBadge(item.key);

                      return (
                        <div key={item.key} className="relative group flex justify-center">
                          <button
                            type="button"
                            onClick={() => setActiveTab(item.key)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition cursor-pointer relative ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60 ring-2 ring-blue-400/40'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title={`${displayLabel} - ${item.description}`}
                          >
                            <Icon className="w-4.5 h-4.5" />
                            {badge && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
                            )}
                          </button>

                          {/* 紧凑悬浮浮窗 Tooltip */}
                          <div className="fixed left-18 ml-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-44 whitespace-nowrap">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-bold text-white whitespace-nowrap">{displayLabel}</span>
                              {badge && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                                  {badge.count}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-300 mt-0.5 leading-snug whitespace-normal">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // 完整紧凑模式 (分组独立容器化、带视觉色彩标示、层次显著、可折叠)
            return (
              <div 
                key={group.id} 
                className={`rounded-xl border ${theme.border} ${theme.bg} p-1 mb-2.5 transition-all shadow-xs`}
              >
                {/* 显著可折叠分类栏标题 (带有色标识条、5字分类名称、项数徽章) */}
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(group.id)}
                  className={`w-full px-2 py-1.5 flex items-center justify-between rounded-lg ${theme.headerBg} text-slate-200 transition-colors cursor-pointer select-none group/hdr`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-3.5 rounded-full ${theme.dot} shrink-0`} />
                    <span className="font-bold text-xs tracking-wider text-slate-100">{group.title}</span>
                    {containsActive && isGroupCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0 animate-pulse" title="当前激活项在此分类中" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 group-hover/hdr:text-slate-200 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950/80 text-slate-300 font-mono border border-slate-800">
                      {group.items.length}项
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isGroupCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* 分组内菜单项列表 (带左侧引导线连接) */}
                {!isGroupCollapsed && (
                  <div className="mt-1 space-y-0.5 pl-1.5 border-l-2 border-slate-800/80 ml-2">
                    {group.items.map(item => {
                      const isActive = activeTab === item.key;
                      const Icon = item.icon;
                      const displayLabel = isNurse && item.nurseLabel ? item.nurseLabel : item.label;
                      const badge = getItemBadge(item.key);

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setActiveTab(item.key)}
                          className={`group w-full h-8 flex items-center px-2 rounded-lg text-left text-[13px] transition cursor-pointer relative ${
                            isActive
                              ? 'bg-blue-600 text-white font-medium shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          }`}
                          title={item.description}
                        >
                          {/* 激活指示白条 */}
                          {isActive && (
                            <span className="absolute left-1 top-2 bottom-2 w-1 bg-white rounded-full" />
                          )}

                          <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <Icon 
                                className={`w-4 h-4 transition-colors ${
                                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
                                }`} 
                              />
                            </div>
                            <span className="truncate select-none font-medium tracking-tight">{displayLabel}</span>
                            {badge && (
                              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${badge.color}`}>
                                {badge.count}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* 底部折叠/展开操作栏 (极度扁平集约，高度压至 36px) */}
      <div className="p-1.5 border-t border-slate-800/80 bg-slate-950/60 shrink-0">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer text-xs font-medium ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title={isCollapsed ? '展开完整导航菜单' : '收起导航菜单为图标模式'}
          aria-label={isCollapsed ? '展开完整导航菜单' : '收起导航菜单为图标模式'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4.5 h-4.5 text-blue-400" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 text-slate-400" />
              <span>收起侧边菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
