import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Send, 
  FileText, 
  Building2, 
  Activity, 
  Layers, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Stethoscope,
  Wrench,
  Sparkles,
  BarChart3,
  Flame,
  PieChart
} from 'lucide-react';
import { 
  AdverseEventRecord, 
  AdverseEventSeverity, 
  AdverseEventStatus,
  CausalityConclusion 
} from '../types/adverseEventTypes';
import { MedicalEquipment } from '../types';
import { 
  loadStoredAdverseEvents, 
  saveStoredAdverseEvents, 
  calculateAdverseEventMetrics,
  getSeverityConfig,
  getStatusConfig,
  getCausalityConfig,
  generateNmpaXmlReport,
  reportEventToNmpa
} from '../utils/adverseEventData';
import { NewAdverseEventModal } from './NewAdverseEventModal';
import { AdverseEventDetailModal } from './AdverseEventDetailModal';
import { Pagination } from './Pagination';

interface AdverseEventReportingViewProps {
  equipmentList: MedicalEquipment[];
  currentUserName?: string;
  initialEquipmentForReport?: MedicalEquipment | null;
  onNavigateToWorkOrder?: (workOrderId?: string) => void;
  onNavigateToEquipment?: (equipmentId: string) => void;
}

export const AdverseEventReportingView: React.FC<AdverseEventReportingViewProps> = ({
  equipmentList = [],
  currentUserName = '崔工',
  initialEquipmentForReport,
  onNavigateToWorkOrder,
  onNavigateToEquipment
}) => {
  // 核心数据集
  const [events, setEvents] = useState<AdverseEventRecord[]>(() => loadStoredAdverseEvents());

  // 从后端API获取最新不良事件列表
  useEffect(() => {
    fetch('/api/adverse-events')
      .then(res => res.json())
      .then(json => {
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEvents(json.data);
          saveStoredAdverseEvents(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // 选中的模态框
  const [isNewModalOpen, setIsNewModalOpen] = useState(!!initialEquipmentForReport);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<AdverseEventRecord | null>(null);

  // 导航标签页: 'pool' | 'sandbox' | 'analytics' | 'nmpa_hub'
  const [viewTab, setViewTab] = useState<'pool' | 'sandbox' | 'analytics' | 'nmpa_hub'>('pool');

  // 筛选与搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [onlyKeyDept, setOnlyKeyDept] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, severityFilter, statusFilter, departmentFilter, onlyKeyDept, viewTab]);

  // 统计指标
  const metrics = useMemo(() => calculateAdverseEventMetrics(events), [events]);

  // 更新存储
  const handleUpdateEvent = (updated: AdverseEventRecord) => {
    const next = events.map(e => e.id === updated.id ? updated : e);
    setEvents(next);
    saveStoredAdverseEvents(next);
    setSelectedEventForDetail(updated);
  };

  // 新增直报单
  const handleCreateEvent = (newRecord: AdverseEventRecord) => {
    const next = [newRecord, ...events];
    setEvents(next);
    saveStoredAdverseEvents(next);
    setSelectedEventForDetail(newRecord);
  };

  // 列表筛选过滤
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // 搜索匹配
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (
          e.id.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.equipmentName.toLowerCase().includes(q) ||
          e.equipmentSn.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.reporterName.toLowerCase().includes(q) ||
          (e.nmpaReceiptNo && e.nmpaReceiptNo.toLowerCase().includes(q))
        );
        if (!matchText) return false;
      }

      // 严重程度
      if (severityFilter !== 'all' && e.severity !== severityFilter) {
        return false;
      }

      // 状态
      if (statusFilter !== 'all' && e.status !== statusFilter) {
        return false;
      }

      // 科室
      if (departmentFilter !== 'all' && e.department !== departmentFilter) {
        return false;
      }

      // 重点监测科室
      if (onlyKeyDept && !e.isAdverseKeyDepartment) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, severityFilter, statusFilter, departmentFilter, onlyKeyDept]);

  // 当前分页事件列表
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, currentPage, pageSize]);

  // 科室去重列表
  const uniqueDepartments = useMemo(() => {
    const set = new Set(events.map(e => e.department));
    return Array.from(set);
  }, [events]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-2.5">
      {/* 顶部主横幅与快速操作 */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-3.5 sm:p-4 text-white shadow-sm border border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                医疗器械不良事件（MDR）监测与警戒直报系统
              </h1>
              <span className="px-2 py-0.5 rounded text-2xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium">
                国家药品监督管理局 (NMPA) 直连标准
              </span>
            </div>
            <p className="text-2xs text-slate-300 leading-relaxed">
              严格遵从《医疗器械不良事件监测和再评价管理办法》，提供临床一线初报、医工技术排查、五项准则因果评价、国家监测网标准化直报与院内 CAPA 纠偏闭环。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-900/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新增不良事件直报 (初报)</span>
            </button>
          </div>
        </div>

        {/* 关键监测指标看板 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-2.5 pt-2.5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
            <div className="text-3xs text-slate-400 font-bold uppercase">本年度不良事件总数</div>
            <div className="text-lg font-extrabold text-white mt-0.5 font-mono">{metrics.totalReports}</div>
            <div className="text-3xs text-slate-400 mt-0.5 truncate">全院各病区及医技科室</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-2 border border-rose-900/40">
            <div className="text-3xs text-rose-300 font-bold uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>严重伤害 / 死亡</span>
            </div>
            <div className="text-lg font-extrabold text-rose-400 mt-0.5 font-mono">
              {metrics.severeCount}
            </div>
            <div className="text-3xs text-rose-200/80 mt-0.5 truncate">
              {metrics.deathCount > 0 ? `死亡 ${metrics.deathCount} 起 (24H红线)` : '无死亡事件记录'}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-2 border border-amber-900/40">
            <div className="text-3xs text-amber-300 font-bold uppercase">险失事件 (Near-Miss)</div>
            <div className="text-lg font-extrabold text-amber-400 mt-0.5 font-mono">
              {metrics.potentialHarmCount}
            </div>
            <div className="text-3xs text-amber-200/80 mt-0.5 truncate">潜在严重伤害，及时干预</div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-2 border border-emerald-900/40">
            <div className="text-3xs text-emerald-300 font-bold uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>国家监测网直报率</span>
            </div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5 font-mono">
              {metrics.nmpaReportingRate}%
            </div>
            <div className="text-3xs text-emerald-200/80 mt-0.5 truncate">
              已直报 {metrics.nmpaReportedCount} / {metrics.totalReports} 起
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50 col-span-2 sm:col-span-1">
            <div className="text-3xs text-indigo-300 font-bold uppercase">重点科室报告达标率</div>
            <div className="text-lg font-extrabold text-indigo-400 mt-0.5 font-mono">
              {metrics.keyDeptComplianceRate}%
            </div>
            <div className="text-3xs text-indigo-200/80 mt-0.5 truncate">ICU/手术/血透/急诊监测</div>
          </div>
        </div>
      </div>

      {/* 主导航 Tab 条 */}
      <div className="bg-white rounded-t-xl border-x border-t border-slate-200 px-4 pt-1 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-1">
          {[
            { key: 'pool', label: '不良事件直报池', count: filteredEvents.length, icon: Layers },
            { key: 'sandbox', label: '因果关系评定沙盘', icon: Sparkles },
            { key: 'analytics', label: '全院警戒与多发预警', icon: BarChart3 },
            { key: 'nmpa_hub', label: '国家监测网数据交换中心', icon: ExternalLink }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = viewTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setViewTab(tab.key as any)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-2xs font-mono ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 py-1">
          <button
            onClick={() => {
              const fresh = loadStoredAdverseEvents();
              setEvents(fresh);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="刷新数据"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 视图 1: 不良事件直报池 (Event Pool) */}
      {viewTab === 'pool' && (
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* 筛选与搜索工具条 */}
          <div className="p-3 border-b border-slate-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="搜索事件单号、设备名称、SN、科室、报告人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="all">全部严重程度</option>
                <option value="death">死亡事件 (极高危)</option>
                <option value="serious_injury">严重伤害 (高危)</option>
                <option value="potential_serious_harm">可能导致严重伤害 (Near-Miss)</option>
                <option value="other">其他不良事件</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="all">全部流转状态</option>
                <option value="pending_review">待医工审核</option>
                <option value="investigating">现场调查中</option>
                <option value="evaluated">已完成评价</option>
                <option value="nmpa_reported">已直报国家网</option>
                <option value="capa_tracking">CAPA预防追踪</option>
                <option value="closed">已结案归档</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="all">全部发生科室</option>
                {uniqueDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyKeyDept}
                  onChange={(e) => setOnlyKeyDept(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>仅看重点科室</span>
              </label>
            </div>
          </div>

          {/* 表格视图 */}
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-3xs uppercase font-bold">
                  <th className="py-2.5 px-3">直报单号 / 标题</th>
                  <th className="py-2.5 px-3">严重等级</th>
                  <th className="py-2.5 px-3">涉及医疗器械</th>
                  <th className="py-2.5 px-3">发生科室 / 报告人</th>
                  <th className="py-2.5 px-3">因果关系评价</th>
                  <th className="py-2.5 px-3">国家直报状态</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      未查询到符合条件的不良事件报告记录
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map(event => {
                    const sev = getSeverityConfig(event.severity);
                    const sta = getStatusConfig(event.status);
                    const cau = getCausalityConfig(event.causalityConclusion);

                    return (
                      <tr 
                        key={event.id}
                        className="hover:bg-indigo-50/30 transition cursor-pointer"
                        onClick={() => setSelectedEventForDetail(event)}
                      >
                        {/* 直报单号 / 标题 */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="font-mono text-3xs font-bold text-slate-400">{event.id}</div>
                            <div className="font-bold text-slate-900 line-clamp-1 max-w-xs">{event.title}</div>
                            <div className="text-3xs text-slate-400 flex items-center gap-2">
                              <span>发生: {event.occurredAt}</span>
                              {event.statutoryDeadline && (
                                <span className="text-rose-600 font-mono">截止: {event.statutoryDeadline.slice(5, 10)}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 严重程度 */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold ${sev.badgeBg}`}>
                            {sev.label}
                          </span>
                        </td>

                        {/* 涉及器械 */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{event.equipmentName}</span>
                              <span className="text-3xs font-mono px-1 rounded bg-slate-100 text-slate-600">
                                {event.deviceRiskClass}类
                              </span>
                            </div>
                            <div className="text-3xs text-slate-500">
                              SN: <span className="font-mono text-slate-700">{event.equipmentSn}</span> | {event.equipmentModel}
                            </div>
                            <div className="text-3xs text-slate-400 truncate max-w-xs">
                              {event.manufacturer}
                            </div>
                          </div>
                        </td>

                        {/* 发生科室 / 报告人 */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <span>{event.department}</span>
                              {event.isAdverseKeyDepartment && (
                                <span className="text-3xs px-1 rounded bg-amber-100 text-amber-800 font-bold">
                                  重点科室
                                </span>
                              )}
                            </div>
                            <div className="text-3xs text-slate-500">
                              {event.reporterName} ({event.reporterProfession === 'nurse' ? '护士' : event.reporterProfession === 'physician' ? '医师' : '医工'})
                            </div>
                          </div>
                        </td>

                        {/* 因果关系评价 */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-2xs border ${cau.badge}`}>
                            {cau.label}
                          </span>
                        </td>

                        {/* 国家直报状态 */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-2xs font-bold border ${sta.color}`}>
                              {sta.label}
                            </span>
                            {event.nmpaReceiptNo && (
                              <div className="text-3xs font-mono text-emerald-700 truncate max-w-[130px]" title={event.nmpaReceiptNo}>
                                {event.nmpaReceiptNo}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 操作 */}
                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {event.status !== 'nmpa_reported' && event.status !== 'closed' ? (
                              <button
                                onClick={() => {
                                  const { updatedEvent, receiptNo } = reportEventToNmpa(event, currentUserName);
                                  handleUpdateEvent(updatedEvent);
                                  alert(`直报成功！国家回执：\n${receiptNo}`);
                                }}
                                className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-3xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="一键直报国家监测网"
                              >
                                <Send className="w-3 h-3" />
                                <span>直报</span>
                              </button>
                            ) : (
                              <span className="text-3xs text-emerald-600 font-mono font-bold">已直报</span>
                            )}

                            <button
                              onClick={() => setSelectedEventForDetail(event)}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-3xs font-bold transition cursor-pointer"
                            >
                              详情
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 表格固定底部单屏分页器 */}
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={filteredEvents.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* 视图 2: 因果关系评定沙盘 (Causality Sandbox) */}
      {viewTab === 'sandbox' && (
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 shadow-2xs flex-1 min-h-0 overflow-auto p-4 space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>国家医疗器械不良事件因果关系评价决策树与辅助研判沙盘</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              基于国家药监局经典五项评判法（时间相关性、已知风险说明、去激发试验、再激发试验、其他因素排除），模拟多学科专家评审与科学定级。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 左侧：五项法则交互推演 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="font-bold text-slate-800 text-xs">五项准则因果关系研判推演</div>

              <div className="space-y-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">准则一：时间顺序关联性</div>
                  <p className="text-3xs text-slate-500">
                    器械使用（包括植入或通电运行）是否确实发生于不良事件出现之前？
                  </p>
                  <div className="flex gap-4 pt-1 font-medium">
                    <span className="text-emerald-700 font-bold">√ 符合时间顺序 (必须满足)</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">准则二：说明书已知不良反应与风险文献</div>
                  <p className="text-3xs text-slate-500">
                    是否属于产品说明书警示范围、国家不良事件监测通报、同品类文献报道的已知故障模式？
                  </p>
                  <div className="flex gap-4 pt-1 font-medium">
                    <span className="text-indigo-700 font-bold">√ 说明书记载或已知技术局限</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">准则三：去激发试验 (Dechallenge)</div>
                  <p className="text-3xs text-slate-500">
                    停用该可疑器械或换用备机后，患者异常症状是否好转或消失？
                  </p>
                  <div className="flex gap-4 pt-1 font-medium">
                    <span className="text-emerald-700 font-bold">√ 脱机更换后生命体征平稳</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">准则四：再激发试验 (Rechallenge)</div>
                  <p className="text-3xs text-slate-500">
                    再次使用同类器械或重新上机，是否再次激发同类不良表现？(高危器械伦理限制通常不主动再次使用)
                  </p>
                  <div className="flex gap-4 pt-1 font-medium">
                    <span className="text-slate-500 font-mono">未再次激发试验 (避免二次伤害)</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">准则五：排除自身病情与误操作</div>
                  <p className="text-3xs text-slate-500">
                    能否明确排除原发疾病恶化、合并用药并发症，或纯粹的医护人员违反操作规范？
                  </p>
                  <div className="flex gap-4 pt-1 font-medium">
                    <span className="text-rose-700 font-bold">√ 已排除操作与药物原因，确系硬件/耗材缺陷</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：六级判定等级参考体系 */}
            <div className="space-y-4">
              <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-indigo-950 text-xs">国家标准不良事件因果关系六级评定基准</div>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white rounded border border-rose-200">
                    <div className="font-bold text-rose-700">1. 肯定相关 (Definite)</div>
                    <div className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                      用械与事件时间顺序合理；符合已知反应类型；停用后反应改善；再次使用后再次出现；不能由患者病情或药物解释。
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-orange-200">
                    <div className="font-bold text-orange-700">2. 很可能相关 (Probable)</div>
                    <div className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                      时间顺序合理；符合已知反应类型；停用后反应改善；未再次使用；基本排除自身病情与药物解释。
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-amber-200">
                    <div className="font-bold text-amber-700">3. 可能相关 (Possible)</div>
                    <div className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                      时间顺序合理；虽符合已知反应类型，但患者自身病情进展或合并药物也可能导致该反应。
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-emerald-200">
                    <div className="font-bold text-emerald-700">4. 可能无关 (Unlikely)</div>
                    <div className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                      事件与器械使用无时间逻辑，或有明确其他直接诱因（如原发休克、大出血、用药禁忌等）。
                    </div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <div className="font-bold text-slate-700">5. 待评价 (Pending) / 无法评价 (Unclassifiable)</div>
                    <div className="text-3xs text-slate-600 mt-0.5 leading-relaxed">
                      资料不齐全，或有待原厂技术专家完成拆机实验分析后二次评定。
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg text-3xs text-slate-600 leading-relaxed">
                医学装备科建议：对于评定为<strong>「肯定相关」</strong>或<strong>「很可能相关」</strong>的高风险 III 类设备不良事件，应第一时间上报主管副院长及国家医疗器械不良事件监测信息系统，并启动全院同型号设备隐患普查。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 视图 3: 全院警戒与多发预警 (Vigilance Analytics & Alerts) */}
      {viewTab === 'analytics' && (
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 shadow-2xs flex-1 min-h-0 overflow-auto p-4 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>全院医疗器械不良事件警戒分析与多发品类预警看板</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                追踪高频故障器械品牌、型号多发聚集性隐患，防范系统性医疗设备安全事故
              </p>
            </div>
            <span className="text-2xs px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
              实时监测中
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 多发设备品类预警卡 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>涉事设备多发集中度</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { name: '有创/无创呼吸机', count: 2, share: 40, risk: '高压报警/膜片老化' },
                  { name: '高频电刀与中性极板', count: 1, share: 20, risk: '负极板阻抗与灼伤' },
                  { name: '双通道微量注射泵', count: 1, share: 20, risk: '按键抖动流速跳档' },
                  { name: '血液透析滤过机', count: 1, share: 20, risk: '电导率电极结垢假警' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className="font-mono font-bold text-slate-800">{item.count} 起 ({item.share}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full" 
                        style={{ width: `${item.share}%` }} 
                      />
                    </div>
                    <div className="text-3xs text-slate-400">警示风险点：{item.risk}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 重点科室报告活跃度与“零报告”警示 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>临床科室报告活跃度与警戒排查</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">重症医学科 (ICU)</div>
                    <div className="text-3xs text-emerald-600">报告达标 · 监测机制健全</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-2xs bg-emerald-100 text-emerald-800 font-mono font-bold">1 起</span>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">麻醉手术科</div>
                    <div className="text-3xs text-emerald-600">报告达标 · 配合医工调查</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-2xs bg-emerald-100 text-emerald-800 font-mono font-bold">1 起</span>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">血液透析室</div>
                    <div className="text-3xs text-emerald-600">报告达标 · 闭环维护完成</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-2xs bg-emerald-100 text-emerald-800 font-mono font-bold">1 起</span>
                </div>

                <div className="p-2 bg-rose-50/60 rounded border border-rose-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-rose-900">新生儿科 / 儿科病区</div>
                    <div className="text-3xs text-rose-600">连续 180 天“零报告”隐患预警</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-2xs bg-rose-200 text-rose-800 font-bold">应查未报</span>
                </div>
              </div>
            </div>

            {/* 厂家安全警示与全院 CAPA 闭环 */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>警戒纠偏与厂家召回 (CAPA)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>呼吸机呼气阀防冷凝水排查</span>
                    <span className="text-3xs text-amber-600 font-bold">推进中</span>
                  </div>
                  <p className="text-3xs text-slate-500">全院54台呼吸机专项管路与积水杯巡检</p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>手术室电外科极板贴敷规范</span>
                    <span className="text-3xs text-emerald-600 font-bold">已完成</span>
                  </div>
                  <p className="text-3xs text-slate-500">手术室全员电外科防灼伤操作规范考核通过</p>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>除颤仪电池脱机自检SOP修订</span>
                    <span className="text-3xs text-emerald-600 font-bold">已完成</span>
                  </div>
                  <p className="text-3xs text-slate-500">更新全院晨班急救交接班电池容量测试流程</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 视图 4: 国家监测网数据交换中心 (NMPA Hub) */}
      {viewTab === 'nmpa_hub' && (
        <div className="bg-white rounded-b-xl border-x border-b border-slate-200 shadow-2xs flex-1 min-h-0 overflow-auto p-4 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>国家医疗器械不良事件监测信息系统直报数据交换中心</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                支持批量组包、生成国家药监局标准 XML / JSON 报文包，提供接口直报日志与国家回执审计
              </p>
            </div>
            <button
              onClick={() => {
                // 批量打包下载全部 XML
                const allXml = events.map(e => generateNmpaXmlReport(e)).join('\n\n<!-- NEXT RECORD -->\n\n');
                const blob = new Blob([allXml], { type: 'application/xml;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `ALL_NMPA_MDR_REPORTS_${new Date().toISOString().slice(0, 10)}.xml`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>一键导出全院已报数据包 (XML)</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>直报对接网关状态：<strong className="text-emerald-700">在线通畅 (HTTP 200 OK)</strong></span>
              </div>
              <div className="text-3xs text-slate-500 font-mono">
                对接端点: https://mdr.nmpa.gov.cn/api/v2/gateway/hospital/370102
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-3xs uppercase font-bold">
                    <th className="py-2.5 px-3">国家直报回执编号</th>
                    <th className="py-2.5 px-3">直报时间</th>
                    <th className="py-2.5 px-3">本院单号</th>
                    <th className="py-2.5 px-3">器械名称</th>
                    <th className="py-2.5 px-3">生产企业</th>
                    <th className="py-2.5 px-3">数据格式</th>
                    <th className="py-2.5 px-3 text-right">报文操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-2xs">
                  {events.filter(e => e.nmpaReceiptNo).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-emerald-800">{e.nmpaReceiptNo}</td>
                      <td className="py-2.5 px-3 text-slate-500">{e.nmpaReportedAt || e.reportedAt}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{e.id}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-800">{e.equipmentName}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">{e.manufacturer}</td>
                      <td className="py-2.5 px-3 text-indigo-600">NMPA_XML_2.0</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            const xmlContent = generateNmpaXmlReport(e);
                            const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `${e.id}_NMPA.xml`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-sans text-3xs cursor-pointer"
                        >
                          下载XML
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 新建不良事件模态框 */}
      <NewAdverseEventModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        equipmentList={equipmentList}
        currentUserName={currentUserName}
        defaultEquipment={initialEquipmentForReport}
        onSubmit={handleCreateEvent}
      />

      {/* 详情与审核直报模态框 */}
      <AdverseEventDetailModal
        isOpen={!!selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        event={selectedEventForDetail}
        currentUserName={currentUserName}
        onUpdateEvent={handleUpdateEvent}
      />
    </div>
  );
};
