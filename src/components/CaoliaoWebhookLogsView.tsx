import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Zap,
  Trash2,
  Eye,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Send,
  X,
  Copy,
  Check,
  Building2,
  Wrench,
  Sliders,
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { ActiveTab, MedicalEquipment } from '../types';
import { RepairReportDetailModal, RepairReportDetailData } from './RepairReportDetailModal';

export interface CaoliaoWebhookLogItem {
  id: string;
  timestamp: string;
  source: string;
  endpoint: string;
  event: string;
  codeId: string;
  codeName: string;
  recordNo: string;
  reporterName: string;
  reporterPhone: string;
  sn: string;
  department: string;
  faultDescription: string;
  photoUrl?: string;
  matchedEquipmentId: string | null;
  matchedEquipmentName: string;
  matchedDepartment: string;
  matchStrategy?: string;
  parseStatus: 'success' | 'device_not_found' | 'invalid_payload';
  urgency: 'P1' | 'P2' | 'P3';
  responseTimeMs: number;
  createdWorkOrderId: string;
  errorMessage: string | null;
  rawPayload: any;
}

interface CaoliaoWebhookLogsViewProps {
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenRepairModal?: (device?: MedicalEquipment) => void;
  equipmentList?: MedicalEquipment[];
}

export const CaoliaoWebhookLogsView: React.FC<CaoliaoWebhookLogsViewProps> = ({
  onNavigateTab,
  onOpenRepairModal,
  equipmentList = []
}) => {
  const [logs, setLogs] = useState<CaoliaoWebhookLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'device_not_found' | 'invalid_payload'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');
  const [selectedRawLog, setSelectedRawLog] = useState<CaoliaoWebhookLogItem | null>(null);
  const [selectedRepairDetail, setSelectedRepairDetail] = useState<RepairReportDetailData | null>(null);
  const [isCopiedRaw, setIsCopiedRaw] = useState<boolean>(false);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);

  // 模拟发送弹窗
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [simulateToast, setSimulateToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 手动关联设备弹窗
  const [manualLinkLog, setManualLinkLog] = useState<CaoliaoWebhookLogItem | null>(null);
  const [selectedEquipIdToLink, setSelectedEquipIdToLink] = useState<string>('');

  const SIMULATION_PRESETS = [
    {
      title: '【重症医学科】迈瑞病人监护仪心电血氧报警',
      payload: {
        event: 'form_submitted',
        code_id: '131886095',
        code_name: '重症医学科-迈瑞病人监护仪',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-101`,
        '故障表现_2645349': '病人监护仪心电导联阻抗报警，SpO2血氧探头插头松动无波形显示，危重患者床旁需紧急处置',
        '报修人姓名_2645353': '林瑞芳 (ICU护士长)',
        '报修人手机_2645354': '13863371002',
        '出厂编号_2647283': 'MR-BENEVIEW-T8-001',
        '科室名称_2647288': '重症医学科 (ICU)'
      }
    },
    {
      title: '【医学影像科】西门子 64排螺旋CT机架旋转报警',
      payload: {
        event: 'form_submitted',
        code_id: '131886096',
        code_name: '医学影像科-西门子64排螺旋CT',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-102`,
        '故障表现_2645349': '机架旋转自检报错 ERR-7402，高压发生器逆变打火，急诊扫描受阻，需工程师进场复位',
        '报修人姓名_2645353': '赵庆华 (放射技师长)',
        '报修人手机_2645354': '13963388112',
        '出厂编号_2647283': 'SOMATOM-DEF-AS-2019-09',
        '科室名称_2647288': '医学影像科'
      }
    },
    {
      title: '【急诊科】未知转运除颤仪关联错误模拟用例',
      payload: {
        event: 'form_submitted',
        code_id: '131889988',
        code_name: '急诊科-未知车载除颤仪',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-103`,
        '故障表现_2645349': '救护车转运车载除颤仪无法充放电，手柄导联线接触不良，急需现场排查',
        '报修人姓名_2645353': '陈志远 (急诊科主治)',
        '报修人手机_2645354': '13763366888',
        '出厂编号_2647283': 'SN-UNMATCHED-DEF-99',
        '科室名称_2647288': '急诊科'
      }
    }
  ];

  // 获取审计日志
  const fetchLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/caoliao/webhook-logs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (e) {
      console.warn('Failed to load webhook logs:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 自动轮询
  useEffect(() => {
    if (!isAutoRefresh) return;
    const timer = setInterval(() => {
      fetchLogs(true);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoRefresh]);

  // 清空日志
  const handleClearLogs = async () => {
    if (!window.confirm('确认清空全部草料二维码 Webhook 接口报修日志吗？此操作无法撤销。')) return;
    try {
      const res = await fetch('/api/caoliao/clear-webhook-logs', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setLogs([]);
      }
    } catch (e) {
      alert('清空日志失败');
    }
  };

  // 触发模拟发送
  const handleTriggerSimulate = async () => {
    setIsSimulating(true);
    try {
      const payload = SIMULATION_PRESETS[selectedPresetIndex].payload;
      const res = await fetch('/api/caoliao/webhook-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload })
      });
      const json = await res.json();
      if (json.success) {
        setSimulateToast({ type: 'success', message: `模拟回调已成功入库！已生成工单 ${json.workOrderId}，关联设备: ${json.equipmentName}` });
        fetchLogs(true);
        // 触发全局报修提醒广播
        window.dispatchEvent(new CustomEvent('caoliao_repair_received', { detail: json }));
        setTimeout(() => setIsSimulateModalOpen(false), 1200);
      } else {
        setSimulateToast({ type: 'error', message: json.error || '模拟发送失败' });
      }
    } catch (e: any) {
      setSimulateToast({ type: 'error', message: '网络请求异常' });
    } finally {
      setIsSimulating(false);
    }
  };

  // 统计指标
  const stats = useMemo(() => {
    const total = logs.length;
    const successCount = logs.filter(l => l.parseStatus === 'success').length;
    const deviceErrorCount = logs.filter(l => l.parseStatus === 'device_not_found').length;
    const p1Count = logs.filter(l => l.urgency === 'P1').length;
    const avgLatency = total > 0 
      ? Math.round(logs.reduce((sum, l) => sum + (l.responseTimeMs || 35), 0) / total) 
      : 0;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;

    return {
      total,
      successCount,
      deviceErrorCount,
      p1Count,
      avgLatency,
      successRate
    };
  }, [logs]);

  // 过滤后的日志列表
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      // 状态筛选
      if (statusFilter !== 'all' && l.parseStatus !== statusFilter) return false;
      // 紧急度筛选
      if (urgencyFilter !== 'all' && l.urgency !== urgencyFilter) return false;
      // 搜索关键字
      if (keyword.trim()) {
        const kw = keyword.toLowerCase().trim();
        const matches = 
          (l.codeName && l.codeName.toLowerCase().includes(kw)) ||
          (l.matchedEquipmentName && l.matchedEquipmentName.toLowerCase().includes(kw)) ||
          (l.recordNo && l.recordNo.toLowerCase().includes(kw)) ||
          (l.reporterName && l.reporterName.toLowerCase().includes(kw)) ||
          (l.reporterPhone && l.reporterPhone.toLowerCase().includes(kw)) ||
          (l.department && l.department.toLowerCase().includes(kw)) ||
          (l.faultDescription && l.faultDescription.toLowerCase().includes(kw)) ||
          (l.sn && l.sn.toLowerCase().includes(kw)) ||
          (l.createdWorkOrderId && l.createdWorkOrderId.toLowerCase().includes(kw)) ||
          (l.errorMessage && l.errorMessage.toLowerCase().includes(kw));
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, statusFilter, urgencyFilter, keyword]);

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      
      {/* 1. 顶部控制条与统计指示 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-5 rounded-2xl border border-slate-700/80 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>草料二维码 API 接口报修日志</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono">
                  /api/caoliao/webhook
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>实时监听中</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                实时展示草料开放平台 OpenAPI 扫码报修 Webhook 回调数据、智能意图解析结果、设备主数据关联状态与异常告警日志，支持运维人员快速定位排查故障。
              </p>
            </div>
          </div>

          {/* 快捷动作 */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="模拟草料二维码扫码发送一条报修回调请求"
            >
              <Send className="w-3.5 h-3.5" />
              <span>模拟接收报修回调</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                isAutoRefresh
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isAutoRefresh ? '每4秒自动拉取最新回调日志' : '已暂停自动刷新'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              <span>{isAutoRefresh ? '4s 自动轮询' : '暂停轮询'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchLogs()}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>

            <button
              type="button"
              onClick={handleClearLogs}
              className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="清空日志"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空</span>
            </button>
          </div>
        </div>

        {/* 四大核心运维指标 */}
        <div className="mt-4 pt-3.5 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[11px]">累计接收回调</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong className="text-base font-bold font-mono text-white">{stats.total}</strong>
              <span className="text-[10px] text-slate-400">次报修推送</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[11px]">解析与建单成功率</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong className="text-base font-bold font-mono text-emerald-400">{stats.successRate}%</strong>
              <span className="text-[10px] text-emerald-300/80">({stats.successCount}/{stats.total})</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[11px]">设备关联异常 / 待核验</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong className={`text-base font-bold font-mono ${stats.deviceErrorCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {stats.deviceErrorCount}
              </strong>
              <span className="text-[10px] text-slate-400">起未匹配记录</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[11px]">平均接口处理耗时</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <strong className="text-base font-bold font-mono text-teal-300">{stats.avgLatency}</strong>
              <span className="text-[10px] text-teal-400/80">ms (毫秒级响应)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 筛选与搜索工具栏 */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* 状态与紧急度过滤 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部状态 ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('success')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'success' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>解析成功 ({stats.successCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('device_not_found')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'device_not_found' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>设备未匹配 ({stats.deviceErrorCount})</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* 紧急度 */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">紧急度:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">全部级别</option>
              <option value="P1">P1 特级紧急</option>
              <option value="P2">P2 紧急</option>
              <option value="P3">P3 常规</option>
            </select>
          </div>
        </div>

        {/* 关键字搜索框 */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索设备、出厂SN、报修人、单号或错误..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-teal-500"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. 日志列表表格 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <QrCode className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">未找到匹配的草料接口报修日志</p>
            <p className="text-[11px] text-slate-400">可点击上方“模拟接收报修回调”按钮发送一条测试用例。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3 whitespace-nowrap">时间 / 单号</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">草料活码信息</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">系统匹配设备</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">报修人 / 科室</th>
                  <th className="py-2.5 px-3 min-w-[220px]">故障表现与详情</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">解析状态</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isSuccess = log.parseStatus === 'success';
                  const isDeviceNotFound = log.parseStatus === 'device_not_found';

                  return (
                    <tr 
                      key={log.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDeviceNotFound ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* 时间与单号 */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-500">{log.timestamp}</div>
                        <div className="font-mono font-bold text-slate-800 mt-0.5">{log.recordNo}</div>
                        <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.urgency === 'P1' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          log.urgency === 'P2' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.urgency} 响应
                        </span>
                      </td>

                      {/* 草料活码信息 */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-bold text-slate-900">{log.codeName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          code_id: {log.codeId || '未知'}
                        </div>
                        {log.sn && (
                          <div className="text-[11px] text-slate-600 font-mono">
                            SN: {log.sn}
                          </div>
                        )}
                      </td>

                      {/* 系统匹配设备 */}
                      <td className="py-2.5 px-3 align-top">
                        {isSuccess ? (
                          <div>
                            <div className="font-bold text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{log.matchedEquipmentName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ID: {log.matchedEquipmentId} · {log.matchedDepartment}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              匹配策略: {log.matchStrategy === 'sn_exact' ? '出厂SN严格命中' : log.matchStrategy === 'code_id' ? '草料活码ID命中' : '品名科室智能命中'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>未匹配台账在册机具</span>
                            </div>
                            <p className="text-[11px] text-rose-600 mt-0.5 leading-snug max-w-xs">
                              {log.errorMessage || '未能命中系统设备'}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 报修人 / 科室 */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <div className="font-bold text-slate-800">{log.reporterName || '医护人员'}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {log.reporterPhone || '未留电话'}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{log.department || '临床科室'}</span>
                        </div>
                      </td>

                      {/* 故障表现与工单 */}
                      <td className="py-2.5 px-3 align-top">
                        <p className="text-xs text-slate-800 line-clamp-2" title={log.faultDescription}>
                          {log.faultDescription}
                        </p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="text-slate-500">转化工单:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRepairDetail({
                                id: log.createdWorkOrderId || `WO-CL-${log.id}`,
                                workOrderId: log.createdWorkOrderId || `WO-CL-${log.id}`,
                                recordNo: log.recordNo || `REC-${log.id}`,
                                recordId: log.recordNo || log.id,
                                timestamp: log.timestamp,
                                equipmentId: log.matchedEquipmentId,
                                equipmentName: log.matchedEquipmentName || log.codeName,
                                equipmentSn: log.sn,
                                department: log.matchedDepartment || log.department,
                                reporterName: log.reporterName,
                                reporterPhone: log.reporterPhone,
                                faultDescription: log.faultDescription,
                                photoUrl: log.photoUrl,
                                urgency: log.urgency,
                                source: 'caoliao',
                                matchStrategy: log.matchStrategy,
                                errorMessage: log.errorMessage,
                                rawPayload: log.rawPayload
                              });
                            }}
                            className="font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.2 rounded border border-indigo-200 cursor-pointer font-bold hover:underline flex items-center gap-1"
                            title="点击直接查看报修单据详情"
                          >
                            <span>{log.createdWorkOrderId}</span>
                            <Eye className="w-2.5 h-2.5 text-indigo-500" />
                          </button>
                          <span className="text-slate-400">· 耗时: {log.responseTimeMs}ms</span>
                        </div>
                      </td>

                      {/* 解析状态 */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>解析并建单成功</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>设备未精准匹配</span>
                          </span>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRepairDetail({
                                id: log.createdWorkOrderId || `WO-CL-${log.id}`,
                                workOrderId: log.createdWorkOrderId || `WO-CL-${log.id}`,
                                recordNo: log.recordNo || `REC-${log.id}`,
                                recordId: log.recordNo || log.id,
                                timestamp: log.timestamp,
                                equipmentId: log.matchedEquipmentId,
                                equipmentName: log.matchedEquipmentName || log.codeName,
                                equipmentSn: log.sn,
                                department: log.matchedDepartment || log.department,
                                reporterName: log.reporterName,
                                reporterPhone: log.reporterPhone,
                                faultDescription: log.faultDescription,
                                photoUrl: log.photoUrl,
                                urgency: log.urgency,
                                source: 'caoliao',
                                matchStrategy: log.matchStrategy,
                                errorMessage: log.errorMessage,
                                rawPayload: log.rawPayload
                              });
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="查看工单报修完整详情、现场图片与AI初判排查建议"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>报修详情</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedRawLog(log)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                            title="查看原始 Webhook 回调 JSON"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>查看报文</span>
                          </button>

                          {isSuccess && onOpenRepairModal && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = equipmentList.find(e => e.id === log.matchedEquipmentId);
                                onOpenRepairModal(target);
                              }}
                              className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              title="立即接单派工"
                            >
                              <Wrench className="w-3 h-3 text-teal-600" />
                              <span>派工</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. 原始 JSON 报文弹窗 */}
      {selectedRawLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm">草料二维码 Webhook 原始回调报文</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {selectedRawLog.recordNo} · {selectedRawLog.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRawLog(null)}
                className="text-slate-400 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">接收端点:</span>
                  <span className="font-mono text-slate-900 font-bold">{selectedRawLog.endpoint}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">解析结果:</span>
                  <span className={`font-bold ${selectedRawLog.parseStatus === 'success' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedRawLog.parseStatus === 'success' ? '解析成功 · 已自动建单' : '设备未匹配 · 人工介入'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">自动生成工单号:</span>
                  <span className="font-mono text-indigo-700 font-bold">{selectedRawLog.createdWorkOrderId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">接口往返耗时:</span>
                  <span className="font-mono text-teal-700 font-bold">{selectedRawLog.responseTimeMs} ms</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-700">Payload 原始 JSON 结构</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedRawLog.rawPayload, null, 2));
                      setIsCopiedRaw(true);
                      setTimeout(() => setIsCopiedRaw(false), 2000);
                    }}
                    className="text-xs text-teal-700 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    {isCopiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedRaw ? '已复制' : '复制报文'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 text-teal-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed max-h-72 border border-slate-800">
                  {JSON.stringify(selectedRawLog.rawPayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRawLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 模拟发送 Webhook 弹窗 */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4.5 h-4.5 text-teal-400" />
                <h3 className="font-bold text-sm">草料二维码扫码报修 Webhook 模拟器</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">选择预设真实报修用例:</label>
                <div className="space-y-2">
                  {SIMULATION_PRESETS.map((preset, idx) => (
                    <label
                      key={preset.title}
                      className={`block p-2.5 rounded-xl border transition cursor-pointer ${
                        selectedPresetIndex === idx
                          ? 'bg-teal-50/80 border-teal-400 ring-1 ring-teal-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="preset"
                          checked={selectedPresetIndex === idx}
                          onChange={() => setSelectedPresetIndex(idx)}
                          className="text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-bold text-slate-900">{preset.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 pl-5">
                        {preset.payload['故障表现_2645349']}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              {simulateToast && (
                <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                  simulateToast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {simulateToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{simulateToast.message}</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleTriggerSimulate}
                disabled={isSimulating}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? '正在推送...' : '立即模拟发送 Webhook'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 报修工单完整详情模态框 */}
      <RepairReportDetailModal
        isOpen={!!selectedRepairDetail}
        onClose={() => setSelectedRepairDetail(null)}
        data={selectedRepairDetail}
        equipmentList={equipmentList}
        onFastDispatch={(device) => {
          setSelectedRepairDetail(null);
          onOpenRepairModal?.(device);
        }}
        onViewRawPayload={(payload) => {
          setSelectedRepairDetail(null);
          const found = logs.find(l => l.rawPayload === payload);
          if (found) setSelectedRawLog(found);
        }}
      />

    </div>
  );
};
