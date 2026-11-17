import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckSquare,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Plus,
  QrCode,
  RotateCcw,
  Server,
  ShieldCheck,
  Sliders,
  Square,
  Wrench
} from 'lucide-react';
import { RoleHomepageCommonProps } from './RoleHomeSharedTypes';
import { RoleNoticeCenter } from '../RoleNoticeCenter';
import { WorkOrderStepBar } from '../WorkOrderStepBar';
import { MeaningfulExecutiveCharts } from '../MeaningfulExecutiveCharts';

export const SystemAdminHomeView: React.FC<RoleHomepageCommonProps> = ({
  currentUser,
  userDept,
  stats,
  equipmentList,
  allEquipmentList,
  liveWorkOrders,
  borrowedEmergencyDevices,
  scheduleItems,
  onNavigateToTab,
  onNavigateToLedger,
  onOpenAddModal,
  onSelectDeviceDetail,
  onDirectDispatch,
  onOpenScheduleAdd,
  onToggleScheduleStatus,
  onOpenRepairDetail
}) => {
  const pendingOrders = useMemo(
    () => liveWorkOrders.filter(o => o.status === 'pending_dispatch' || o.status === 'pre_dispatched'),
    [liveWorkOrders]
  );

  const caoliaoLiveCount = useMemo(
    () => liveWorkOrders.filter(o => o.source === 'caoliao').length,
    [liveWorkOrders]
  );

  const healthRate = useMemo(() => {
    const total = stats.totalCount || equipmentList.length || 1;
    const normal = stats.normalCount || equipmentList.filter(e => e.status === '正常运行').length;
    return Math.round((normal / total) * 100);
  }, [stats, equipmentList]);

  const upcomingSchedule = useMemo(() => {
    const today = '2026-08-17';
    return scheduleItems.filter(s => s.date >= today).slice(0, 20);
  }, [scheduleItems]);

  const governanceModules = [
    {
      tab: 'system_ops' as const,
      title: '系统运维与审计日志',
      desc: 'API 接口健康监控、RBAC 角色拦截审计与服务状态检查',
      icon: Server,
      tone: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    },
    {
      tab: 'caoliao_webhook_logs' as const,
      title: '草料扫码 Webhook 日志',
      desc: `实时接入临床扫码报修报文（已同步 ${caoliaoLiveCount} 笔草料工单）`,
      icon: QrCode,
      tone: 'text-cyan-700 bg-cyan-50 border-cyan-200'
    },
    {
      tab: 'caoliao_sync_settings' as const,
      title: '草料接口同步与映射配置',
      desc: '配置二维码模板字段映射、回调密钥与自动建单规则',
      icon: Sliders,
      tone: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
      tab: 'database_backup' as const,
      title: '数据快照备份与灾难恢复',
      desc: '台账快照导出、定时归档策略与增量备份校验',
      icon: Database,
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      tab: 'ai_config' as const,
      title: 'AI 诊断引擎与模型配置',
      desc: '故障预判模型参数、知识库向量索引与合规脱敏',
      icon: Bot,
      tone: 'text-violet-700 bg-violet-50 border-violet-200'
    },
    {
      tab: 'master_data' as const,
      title: '全院组织与主数据治理',
      desc: '科室编码映射、院区楼宇字典与人员岗位权限绑定',
      icon: Layers,
      tone: 'text-amber-700 bg-amber-50 border-amber-200'
    }
  ];

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-h-0">
      {/* 1. 系统管理员专属 4 格核心 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <div
          onClick={() => onNavigateToLedger('')}
          className="bg-white rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">全院纳管医疗资产</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-slate-900">
            {stats.totalCount} <span className="text-xs font-medium text-slate-500">台</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            完好率 {healthRate}% · 总值 ¥{((stats.totalValue || 0) / 10000).toFixed(0)} 万
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('dispatch')}
          className="bg-white rounded-xl border border-rose-200 p-3.5 hover:border-rose-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">全院待调度工单</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-rose-700">
            {pendingOrders.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-600">
            故障停机 {stats.faultCount} 台 · 支持一键兜底派工
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('caoliao_webhook_logs')}
          className="bg-white rounded-xl border border-cyan-200 p-3.5 hover:border-cyan-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">网关与扫码实时接入</span>
            <QrCode className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-cyan-700">
            {caoliaoLiveCount} <span className="text-xs font-medium text-slate-500">单</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            草料 Webhook 实时在线 · 字段自动匹配正常
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab?.('system_ops')}
          className="bg-white rounded-xl border border-emerald-200 p-3.5 hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">7+1 RBAC 权限治理</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-black font-mono tabular-nums text-emerald-700">
            100%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            前后端同步鉴权激活 · 跨科调配 {borrowedEmergencyDevices.length} 台
          </div>
        </div>
      </div>

      {/* 2. 全院统一通告下发与回执追踪中心 */}
      <RoleNoticeCenter
        currentUser={currentUser}
        departmentOptions={allEquipmentList.map(e => e.department).filter(Boolean)}
        onNavigateToTab={onNavigateToTab}
        onNavigateToLedger={onNavigateToLedger}
        titleOverride="全院制度公告统一下发与各岗位签收追踪台"
      />

      {/* 3. 系统管理员双主工作区：系统治理枢纽 + 全院调度巡检 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* 左侧 (7/12)：系统运维与接口治理枢纽 + 全院待调度工单流水 */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* 系统治理直达矩阵 */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">系统核心运维、接口网关与主数据治理中心</h3>
              </div>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>设备建卡</span>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {governanceModules.map(mod => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.tab}
                    type="button"
                    onClick={() => onNavigateToTab?.(mod.tab)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white text-left transition flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${mod.tone}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 flex items-center justify-between">
                        <span className="truncate">{mod.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{mod.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 全院优先级待调度与应急报修工单 */}
          <div id="urgent-dispatch-section" className="bg-white rounded-xl border border-slate-200 p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">全院紧急报修与调度兜底监视流</h3>
                <span className="text-xs font-mono tabular-nums text-slate-500">({liveWorkOrders.length} 笔)</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('dispatch')}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>全院派工总台</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2.5 space-y-2 min-h-[260px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {liveWorkOrders.slice(0, 20).map(order => (
                <div
                  key={order.id}
                  onClick={() => {
                    const matched = allEquipmentList.find(e => e.id === order.equipmentId || e.sn === order.equipmentSn);
                    if (matched) onSelectDeviceDetail(matched);
                  }}
                  className="p-3 rounded-lg border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-white transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {order.equipmentName}
                        <span className="ml-2 font-mono text-[11px] font-medium text-slate-500">
                          {order.caoliaoRecordNo ? `草料 ${order.caoliaoRecordNo}` : order.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{order.department}</span>
                        <span>·</span>
                        <span>报修人 {order.reporterName}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{order.reportTime}</span>
                      </div>
                      {order.faultDescription && (
                        <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                          {order.faultDescription}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() =>
                          onOpenRepairDetail({
                            id: order.id,
                            workOrderId: order.id,
                            recordNo: order.caoliaoRecordNo,
                            timestamp: order.reportTime,
                            equipmentId: order.equipmentId,
                            equipmentName: order.equipmentName,
                            equipmentSn: order.equipmentSn,
                            department: order.department,
                            reporterName: order.reporterName,
                            reporterPhone: order.reporterPhone,
                            faultDescription: order.faultDescription,
                            photoUrl: order.photoUrl,
                            urgency: order.priority === 'P1_CRITICAL' ? 'P1' : 'P2',
                            source: order.source === 'caoliao' ? '草料二维码' : '系统报修'
                          })
                        }
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        详情
                      </button>
                      <button
                        type="button"
                        onClick={() => onDirectDispatch?.(order)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{order.status === 'pending_dispatch' ? '调度派工' : '讨论/改派'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-100">
                    <WorkOrderStepBar
                      status={order.status}
                      size="sm"
                      showSubStatus
                      proposedEngineerName={order.proposedEngineerName}
                      assignedEngineerName={order.assignedEngineerName}
                      discussionCount={order.internalDiscussions?.length || 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧 (5/12)：巡检与值班日程 + 跨科在借监控 */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">全院巡检计划与运维日程</h3>
              </div>
              <button
                type="button"
                onClick={onOpenScheduleAdd}
                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>加日程</span>
              </button>
            </div>

            <div className="mt-2.5 space-y-2 min-h-[240px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {upcomingSchedule.map(task => {
                const isDone = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    onClick={() => onToggleScheduleStatus(task.id)}
                    className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition ${
                      isDone ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                        {task.date} {task.timeRange} · {task.assignedStaff}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">全院应急备用设备调拨监控</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab?.('emergency_reserve')}
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 cursor-pointer whitespace-nowrap shrink-0"
              >
                调拨中心 →
              </button>
            </div>
            <div className="mt-2.5 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
              {borrowedEmergencyDevices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">当前无应急库设备外借中</div>
              ) : (
                borrowedEmergencyDevices.map(({ device, loan, daysElapsed, isOverdue, daysOverdue, daysRemaining }) => (
                  <div
                    key={device.id}
                    onClick={() => onSelectDeviceDetail(device)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:border-cyan-300 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{device.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {loan.borrowingDepartment || device.department} · 已借 {daysElapsed} 天
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold font-mono tabular-nums shrink-0 ${
                        isOverdue ? 'text-rose-700' : 'text-slate-600'
                      }`}
                    >
                      {isOverdue ? `超期 ${daysOverdue}d` : `余 ${daysRemaining}d`}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">管理直达：</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('regulations')}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>规章制度管理</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => onNavigateToLedger('')}
                  className="text-slate-700 hover:text-slate-900 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  全院台账
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 全院质控红线态势分析 */}
      <MeaningfulExecutiveCharts
        equipmentList={allEquipmentList || equipmentList}
        userDept={userDept}
        isDeptView={false}
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToTab={onNavigateToTab}
        onSelectDeviceDetail={onSelectDeviceDetail}
      />
    </div>
  );
};
