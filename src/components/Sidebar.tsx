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
  GraduationCap
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../types';
import { canAccessTab, isHeadNurse, isDepartmentRestricted, getUserDepartment } from '../utils/authUtils';

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
          key: 'parts_inventory',
          label: '备品备件库存',
          nurseLabel: '备品备件库存',
          icon: Package,
          description: '维修配件库存管理与出入库核销'
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
          icon: Building2,
          description: '原厂供应商、第三方维保与检测机构'
        },
        {
          key: 'vendor_collaboration',
          label: '外协维修协同',
          nurseLabel: userDept ? `【${userDept}】外协协同` : '科室外协协同',
          icon: Scale,
          description: isNurse ? '本科室外协零修工单、换件查验与电子签字' : '供应商报价、多科室联合议价、发票与一案一档归档'
        }
      ]
    },
    {
      id: 'analytics',
      title: '决策与档案',
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
        isCollapsed ? 'w-18' : 'w-64'
      }`}
      aria-label="系统主导航菜单"
    >
      {/* 1. 规范化系统品牌区 (规范名称，去除冗余版本号与闪烁点) */}
      <div className="h-16 flex items-center px-3.5 border-b border-slate-800 bg-slate-950/90 gap-2.5 shrink-0 overflow-hidden justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-950/50 shrink-0 border border-blue-400/30 cursor-pointer hover:opacity-90 transition"
            title="返回工作台监控大盘"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white tracking-tight whitespace-nowrap leading-tight">
                医学装备管理系统
              </div>
            </div>
          )}
        </div>

        {/* 折叠/展开快捷按钮 */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0 ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? '展开完整菜单栏' : '收起菜单栏为图标模式'}
          aria-label={isCollapsed ? '展开完整菜单栏' : '收起菜单栏为图标模式'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-blue-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-white" />
          )}
        </button>
      </div>

      {/* 2. 规范快捷搜索框 (仅在展开时显示，去除了无效的多余展开/收起按钮行) */}
      {!isCollapsed && (
        <div className="p-2.5 pb-1 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索功能..."
              className="w-full h-8 pl-8 pr-7 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                title="清空搜索"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. 规范化分组导航列表 (清晰、平整、无冗余外边框和层级嵌套) */}
      <nav className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-500 scrollbar-track-slate-950/60">
        {filteredGroups.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 px-3">
            未找到匹配的功能模块
          </div>
        ) : (
          filteredGroups.map((group) => {
            // 紧凑模式 (Rail mode)
            if (isCollapsed) {
              return (
                <div key={group.id} className="space-y-1.5 py-1 border-b border-slate-800/40 last:border-b-0">
                  {group.items.map(item => {
                    const isActive = activeTab === item.key;
                    const Icon = item.icon;
                    const displayLabel = isNurse && item.nurseLabel ? item.nurseLabel : item.label;

                    return (
                      <div key={item.key} className="relative group flex justify-center">
                        <button
                          type="button"
                          onClick={() => setActiveTab(item.key)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/60 ring-2 ring-blue-400/40'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={`${displayLabel} - ${item.description}`}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </button>

                        {/* 紧凑悬浮浮窗 Tooltip */}
                        <div className="fixed left-18 ml-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl shadow-xl text-left pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-44 whitespace-nowrap">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-white whitespace-nowrap">{displayLabel}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 leading-snug whitespace-normal">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // 完整模式 (规范扁平结构，无嵌套卡片，清晰优雅)
            return (
              <div key={group.id} className="space-y-1">
                {/* 规范分类标题栏 (统一 5 个字) */}
                <div className="px-2.5 pt-1 pb-0.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase whitespace-nowrap">
                  {group.title}
                </div>

                {/* 分组内菜单项 (严格统一 6 个字，禁止省略号) */}
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const isActive = activeTab === item.key;
                    const Icon = item.icon;
                    const displayLabel = isNurse && item.nurseLabel ? item.nurseLabel : item.label;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveTab(item.key)}
                        className={`group w-full h-9 flex items-center px-2.5 rounded-lg text-left text-[12.5px] transition cursor-pointer relative ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-normal'
                        }`}
                        title={item.description}
                      >
                        {/* 激活指示蓝标 */}
                        {isActive && (
                          <span className="absolute left-1 top-2 bottom-2 w-0.5 bg-blue-200 rounded-full" />
                        )}

                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
                          <div className="w-4.5 h-4.5 flex items-center justify-center shrink-0">
                            <Icon 
                              className={`w-4 h-4 transition-colors ${
                                isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-300'
                              }`} 
                            />
                          </div>
                          <span className="whitespace-nowrap select-none">{displayLabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* 底部已根据需求完全移除：
          1. 删除了「7×24H 医工急救热线」卡片
          2. 删除了与右上角完全重复的「当前登录人员」信息卡片
          3. 使得菜单栏回归纯粹、规范、专注的导航体验
      */}
    </aside>
  );
};
