import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Send,
  Check,
  CheckCheck,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Inbox,
  Megaphone,
  AlertTriangle,
  Users,
  Building2,
  FileText
} from 'lucide-react';
import {
  ActiveTab,
  AuthUser,
  HospitalNotice,
  NoticeCategory,
  NoticePriority,
  NoticeTargetScope
} from '../types';
import {
  canBroadcastNotice,
  canAccessTab,
  getUserDepartment
} from '../utils/authUtils';
import {
  ROLE_ARCHETYPE_LABELS,
  RoleArchetype,
  resolveRoleArchetype
} from '../utils/rbacPolicy';
import {
  DEFAULT_SEED_NOTICES,
  NOTICES_LOCAL_CACHE_KEY,
  NOTICE_BROADCAST_TEMPLATES,
  doesNoticeMatchUser,
  formatNoticeScopeLabel,
  hasUserAckNotice,
  hasUserReadNotice
} from '../utils/noticeUtils';

interface RoleNoticeCenterProps {
  currentUser?: AuthUser | null;
  departmentOptions?: string[];
  onNavigateToTab?: (tab: ActiveTab) => void;
  titleOverride?: string;
  compact?: boolean;
}

const PRIORITY_META: Record<NoticePriority, { label: string; textClass: string; badgeClass: string }> = {
  urgent: {
    label: '紧急警示',
    textClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  },
  important: {
    label: '重要通知',
    textClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  normal: {
    label: '常规通告',
    textClass: 'text-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};

const CATEGORIES: NoticeCategory[] = [
  '安全警示',
  '强检召回',
  '维保排期',
  '财务结算',
  '院级通告',
  '工作协同'
];

const TARGET_ROLE_OPTIONS: Array<{ archetype: RoleArchetype; label: string }> = [
  { archetype: 'clinical_nurse', label: '临床护士长/医护' },
  { archetype: 'clinical_director', label: '临床科主任' },
  { archetype: 'engineer', label: '维修工程师' },
  { archetype: 'engineering_supervisor', label: '医工主管/调度员' },
  { archetype: 'financial', label: '财务资产管理员' },
  { archetype: 'executive', label: '分管副院长' },
  { archetype: 'vendor', label: '签约服务商' }
];

const OPTIONAL_LINK_TABS: Array<{ tab: ActiveTab; label: string }> = [
  { tab: 'maintenance', label: '计量与预防维护' },
  { tab: 'emergency_reserve', label: '应急生命支持库' },
  { tab: 'repairs', label: '临床报修处置' },
  { tab: 'dispatch', label: '派工调度中心' },
  { tab: 'approvals', label: '审批流转中心' },
  { tab: 'roi', label: '单机ROI效益分析' },
  { tab: 'accreditation_quality', label: '等级评审与质控' },
  { tab: 'regulations', label: '制度标准库' }
];

export const RoleNoticeCenter: React.FC<RoleNoticeCenterProps> = ({
  currentUser,
  departmentOptions = [],
  onNavigateToTab,
  titleOverride,
  compact = false
}) => {
  const canBroadcast = canBroadcastNotice(currentUser);
  const roleArch = resolveRoleArchetype(currentUser);
  const userDept = getUserDepartment(currentUser);

  const [notices, setNotices] = useState<HospitalNotice[]>(() => {
    try {
      const cached = localStorage.getItem(NOTICES_LOCAL_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore cache parse errors
    }
    return DEFAULT_SEED_NOTICES;
  });
  const [loading, setLoading] = useState(false);

  // 管理科室默认在「下发/追踪」之间切换；接收科室聚焦「收件箱」
  const [activeMode, setActiveMode] = useState<'inbox' | 'compose' | 'sent'>(() =>
    canBroadcast ? 'sent' : 'inbox'
  );
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'need_ack'>('all');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; tone: 'success' | 'error' } | null>(null);

  // 下发表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('安全警示');
  const [formPriority, setFormPriority] = useState<NoticePriority>('important');
  const [formTargetScope, setFormTargetScope] = useState<NoticeTargetScope>('clinical_all');
  const [formTargetDepts, setFormTargetDepts] = useState<string[]>([]);
  const [formTargetRoles, setFormTargetRoles] = useState<string[]>(['clinical_nurse', 'clinical_director']);
  const [formRequireAck, setFormRequireAck] = useState(true);
  const [formTargetTab, setFormTargetTab] = useState<ActiveTab | ''>('');
  const [submitting, setSubmitting] = useState(false);

  // 同步当前角色切换时的视图
  useEffect(() => {
    setActiveMode(canBroadcast ? 'sent' : 'inbox');
  }, [canBroadcast, currentUser?.id, currentUser?.role]);

  const showBanner = (text: string, tone: 'success' | 'error' = 'success') => {
    setFeedbackBanner({ text, tone });
    setTimeout(() => {
      setFeedbackBanner(prev => (prev?.text === text ? null : prev));
    }, 3800);
  };

  const persistLocalCache = (list: HospitalNotice[]) => {
    try {
      localStorage.setItem(NOTICES_LOCAL_CACHE_KEY, JSON.stringify(list));
    } catch {
      // ignore storage quota errors
    }
  };

  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notices');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotices(json.data);
        persistLocalCache(json.data);
      }
    } catch {
      // keep local state if offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
    const handleNoticeUpdated = () => {
      fetchNotices();
    };
    window.addEventListener('hospital_notices_updated', handleNoticeUpdated);
    return () => window.removeEventListener('hospital_notices_updated', handleNoticeUpdated);
  }, [fetchNotices]);

  // 面向当前角色的收件消息
  const inboxNotices = useMemo(() => {
    return notices.filter(n => doesNoticeMatchUser(n, currentUser));
  }, [notices, currentUser]);

  const unreadInboxCount = useMemo(() => {
    return inboxNotices.filter(n => !hasUserReadNotice(n, currentUser)).length;
  }, [inboxNotices, currentUser]);

  const pendingAckCount = useMemo(() => {
    return inboxNotices.filter(n => n.requireAck && !hasUserAckNotice(n, currentUser)).length;
  }, [inboxNotices, currentUser]);

  const filteredInboxNotices = useMemo(() => {
    if (inboxFilter === 'unread') {
      return inboxNotices.filter(n => !hasUserReadNotice(n, currentUser));
    }
    if (inboxFilter === 'need_ack') {
      return inboxNotices.filter(n => n.requireAck && !hasUserAckNotice(n, currentUser));
    }
    return inboxNotices;
  }, [inboxNotices, inboxFilter, currentUser]);

  // 管理科室发件箱（系统管理员及医工主管可查看全院下发记录，其余管理角色看本部门或本人所发及全院通告）
  const managedNotices = useMemo(() => {
    if (!canBroadcast) return [];
    if (roleArch === 'admin' || roleArch === 'engineering_supervisor' || roleArch === 'executive') {
      return notices;
    }
    return notices.filter(
      n => n.senderName === currentUser?.name || n.senderDepartment === currentUser?.departmentName
    );
  }, [notices, canBroadcast, roleArch, currentUser]);

  // 可选临床科室列表（合并主数据与临床常见科室）
  const availableClinicalDepts = useMemo(() => {
    const base = departmentOptions.filter(
      d =>
        d &&
        !d.includes('医疗设备科') &&
        !d.includes('医学工程') &&
        !d.includes('财务') &&
        !d.includes('院长') &&
        !d.includes('信息')
    );
    const fallback = [
      '重症医学科(ICU)',
      '急诊科',
      '麻醉手术科',
      '医学影像科',
      '功能检查科',
      '心血管内科',
      '神经内科',
      '呼吸与危重症医学科',
      '骨科'
    ];
    return Array.from(new Set([...base, ...fallback]));
  }, [departmentOptions]);

  const handleMarkReadOrAck = async (notice: HospitalNotice, acknowledge: boolean) => {
    const readAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const optimisticReceipt = {
      userId: currentUser?.id || currentUser?.employeeNo || 'USER',
      userName: currentUser?.name || '一线人员',
      userRole: currentUser?.role || '临床医护',
      department: currentUser?.departmentName || '临床科室',
      readAt,
      acknowledged: acknowledge
    };

    try {
      const res = await fetch(`/api/notices/${encodeURIComponent(notice.id)}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: optimisticReceipt.userId,
          userName: optimisticReceipt.userName,
          userRole: optimisticReceipt.userRole,
          department: optimisticReceipt.department,
          acknowledged: acknowledge
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const nextList = notices.map(n => (n.id === notice.id ? json.data : n));
        setNotices(nextList);
        persistLocalCache(nextList);
      } else {
        const nextList = notices.map(n =>
          n.id === notice.id
            ? {
                ...n,
                readReceipts: [
                  optimisticReceipt,
                  ...(n.readReceipts || []).filter(r => r.userId !== optimisticReceipt.userId)
                ]
              }
            : n
        );
        setNotices(nextList);
        persistLocalCache(nextList);
      }
      showBanner(acknowledge ? `已确认签收【${notice.title.slice(0, 18)}...】` : '已标记为已读');
    } catch {
      showBanner('签收状态同步失败，请稍后重试', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    const unread = inboxNotices.filter(n => !hasUserReadNotice(n, currentUser));
    if (unread.length === 0) return;
    await Promise.all(unread.map(n => handleMarkReadOrAck(n, false)));
    showBanner(`已将 ${unread.length} 条通知标为已读`);
  };

  const handleApplyTemplate = (tplId: string) => {
    const tpl = NOTICE_BROADCAST_TEMPLATES.find(t => t.id === tplId);
    if (!tpl) return;
    setFormTitle(tpl.title);
    setFormContent(tpl.content);
    setFormCategory(tpl.category);
    setFormPriority(tpl.priority);
    setFormTargetScope(tpl.targetScope);
    setFormRequireAck(tpl.requireAck);
    if (tpl.targetScope === 'department' && formTargetDepts.length === 0) {
      setFormTargetDepts(['重症医学科(ICU)', '医学影像科']);
    }
  };

  const toggleDeptSelection = (dept: string) => {
    setFormTargetDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const toggleRoleSelection = (arch: string) => {
    setFormTargetRoles(prev =>
      prev.includes(arch) ? prev.filter(r => r !== arch) : [...prev, arch]
    );
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBroadcast) {
      showBanner('权限不足：当前岗位无权统一下发全院或跨科通知', 'error');
      return;
    }
    if (!formTitle.trim() || !formContent.trim()) {
      showBanner('请填写通知标题与正文要求', 'error');
      return;
    }
    if (formTargetScope === 'department' && formTargetDepts.length === 0) {
      showBanner('请至少选择一个接收临床科室', 'error');
      return;
    }
    if (formTargetScope === 'role_archetype' && formTargetRoles.length === 0) {
      showBanner('请至少选择一个目标岗位', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
          priority: formPriority,
          targetScope: formTargetScope,
          targetDepartments: formTargetScope === 'department' ? formTargetDepts : undefined,
          targetRoles: formTargetScope === 'role_archetype' ? formTargetRoles : undefined,
          requireAck: formRequireAck,
          targetTab: formTargetTab || undefined,
          senderName: currentUser?.name,
          senderRole: currentUser?.role,
          senderDepartment: currentUser?.departmentName
        })
      });
      const json = await res.json();
      if (res.status === 403 || !json.success) {
        showBanner(json.error || '下发失败，请检查权限或参数', 'error');
        return;
      }
      const nextList = [json.data, ...notices];
      setNotices(nextList);
      persistLocalCache(nextList);
      window.dispatchEvent(new CustomEvent('hospital_notices_updated'));
      setFormTitle('');
      setFormContent('');
      setActiveMode('sent');
      showBanner(`通知【${json.data.id}】已统一下发至目标对象`);
    } catch {
      showBanner('网络请求异常，消息下发失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!canBroadcast) return;
    if (!window.confirm('确定撤回并移除该条通知吗？接收方列表将同步移除。')) return;
    try {
      const res = await fetch(`/api/notices/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showBanner(json.error || '撤回失败', 'error');
        return;
      }
      const nextList = notices.filter(n => n.id !== id);
      setNotices(nextList);
      persistLocalCache(nextList);
      window.dispatchEvent(new CustomEvent('hospital_notices_updated'));
      showBanner('已撤回该通知');
    } catch {
      showBanner('撤回失败，请重试', 'error');
    }
  };

  const headerTitle =
    titleOverride ||
    (canBroadcast
      ? '管理科室统一消息下发与签收追踪中心'
      : userDept && (roleArch === 'clinical_nurse' || roleArch === 'clinical_director')
      ? `【${userDept}】院科消息与管理通知接收区`
      : '工作指令与院内消息接收区');

  return (
    <section
      id="role-notice-center"
      aria-label={headerTitle}
      className="bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden shrink-0"
    >
      {/* 顶部栏 */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {canBroadcast ? (
            <Megaphone className="w-4 h-4 text-slate-700 shrink-0" />
          ) : (
            <Bell className="w-4 h-4 text-slate-700 shrink-0" />
          )}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
            {headerTitle}
          </h3>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap">
            {canBroadcast
              ? `已发 ${managedNotices.length} 条 · 本岗位收件 ${inboxNotices.length} 条`
              : `未读 ${unreadInboxCount} 条 · 待签收 ${pendingAckCount} 条`}
          </span>
          {loading && <span className="text-[11px] text-slate-400">同步中...</span>}
        </div>

        {/* 右侧分段切换与快捷操作 */}
        <div className="flex items-center gap-2 flex-wrap">
          {feedbackBanner && (
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded border whitespace-nowrap ${
                feedbackBanner.tone === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {feedbackBanner.text}
            </span>
          )}

          {canBroadcast ? (
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveMode('compose')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeMode === 'compose'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>统一下发通知</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('sent')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeMode === 'sent'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>下发追踪 ({managedNotices.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('inbox')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeMode === 'inbox'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Inbox className="w-3.5 h-3.5 text-emerald-600" />
                <span>本岗位收件 ({unreadInboxCount > 0 ? `${unreadInboxCount}未读` : inboxNotices.length})</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInboxFilter('all')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    inboxFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  全部 ({inboxNotices.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter('unread')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    inboxFilter === 'unread' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  未读 ({unreadInboxCount})
                </button>
                <button
                  type="button"
                  onClick={() => setInboxFilter('need_ack')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer whitespace-nowrap ${
                    inboxFilter === 'need_ack' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  待签收 ({pendingAckCount})
                </button>
              </div>
              {unreadInboxCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>全部标为已读</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 主体内容 */}
      {canBroadcast && activeMode === 'compose' ? (
        /* ==================== 模式1：管理科室统一下发消息表单 ==================== */
        <form onSubmit={handlePublishNotice} className="p-4 space-y-3 text-xs">
          {/* 快速模板 */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500">常用通告模板：</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {NOTICE_BROADCAST_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition cursor-pointer whitespace-nowrap"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* 左侧表单主字段 (7/12) */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">消息分类</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as NoticeCategory)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">紧急级别</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as NoticePriority)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="urgent">紧急警示 (置顶标红)</option>
                    <option value="important">重要通知 (重点提示)</option>
                    <option value="normal">常规通告 (普通)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">关联直达模块 (可选)</label>
                  <select
                    value={formTargetTab}
                    onChange={e => setFormTargetTab(e.target.value as ActiveTab | '')}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">无快捷跳转模块</option>
                    {OPTIONAL_LINK_TABS.map(item => (
                      <option key={item.tab} value={item.tab}>{item.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">通知标题 *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="例如：关于下周一ICU及急诊科便携呼吸机集中强检通知"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">通知正文与执行要求 *</label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={3}
                  placeholder="请明确接收科室/岗位需要配合的事项、截止时间与联系人..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* 右侧投递范围与签收要求 (5/12) */}
            <div className="md:col-span-5 bg-slate-50/70 border border-slate-200 rounded-lg p-3 flex flex-col justify-between gap-2.5">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">统一下发目标范围 *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'clinical_all', label: '全体临床科室' },
                    { id: 'all', label: '全院所有岗位' },
                    { id: 'department', label: '指定临床科室' },
                    { id: 'role_archetype', label: '指定岗位角色' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormTargetScope(opt.id as NoticeTargetScope)}
                      className={`px-2.5 py-1.5 rounded-md border text-[11px] font-semibold text-left transition cursor-pointer ${
                        formTargetScope === opt.id
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {formTargetScope === 'department' && (
                  <div className="pt-1">
                    <div className="text-[11px] text-slate-500 mb-1">
                      选择接收科室 (已选 {formTargetDepts.length} 个)：
                    </div>
                    <div className="max-h-28 overflow-y-auto grid grid-cols-2 gap-1 pr-1">
                      {availableClinicalDepts.map(dept => {
                        const checked = formTargetDepts.includes(dept);
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleDeptSelection(dept)}
                            className={`px-2 py-1 rounded border text-[11px] text-left truncate cursor-pointer ${
                              checked
                                ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title={dept}
                          >
                            {checked ? '✓ ' : ''}{dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {formTargetScope === 'role_archetype' && (
                  <div className="pt-1">
                    <div className="text-[11px] text-slate-500 mb-1">
                      选择接收岗位 (已选 {formTargetRoles.length} 类)：
                    </div>
                    <div className="max-h-28 overflow-y-auto grid grid-cols-2 gap-1 pr-1">
                      {TARGET_ROLE_OPTIONS.map(opt => {
                        const checked = formTargetRoles.includes(opt.archetype);
                        return (
                          <button
                            key={opt.archetype}
                            type="button"
                            onClick={() => toggleRoleSelection(opt.archetype)}
                            className={`px-2 py-1 rounded border text-[11px] text-left truncate cursor-pointer ${
                              checked
                                ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {checked ? '✓ ' : ''}{opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRequireAck}
                    onChange={e => setFormRequireAck(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>要求接收方点击「确认收到」回执</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? '正在下发...' : '确认统一下发'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : canBroadcast && activeMode === 'sent' ? (
        /* ==================== 模式2：已下发通知与签收追踪列表 ==================== */
        <div className="divide-y divide-slate-100 min-h-[240px] max-h-[60vh] overflow-y-auto overscroll-contain">
          {managedNotices.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">当前暂无已下发的管理通告</p>
              <button
                type="button"
                onClick={() => setActiveMode('compose')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                立即下发第一条通知
              </button>
            </div>
          ) : (
            managedNotices.map(notice => {
              const pMeta = PRIORITY_META[notice.priority] || PRIORITY_META.normal;
              const receipts = notice.readReceipts || [];
              const ackCount = receipts.filter(r => r.acknowledged).length;
              const isExpanded = expandedNoticeId === notice.id;

              return (
                <div key={notice.id} className="px-4 py-3 hover:bg-slate-50/70 transition space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded border text-[10.5px] font-bold shrink-0 ${pMeta.badgeClass}`}>
                          {pMeta.label}
                        </span>
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 truncate">
                          {notice.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap font-mono tabular-nums">
                        <span className="font-sans text-slate-700 font-medium">{notice.category}</span>
                        <span>·</span>
                        <span className="font-sans">范围: <strong className="text-slate-700">{formatNoticeScopeLabel(notice)}</strong></span>
                        <span>·</span>
                        <span className="font-sans">{notice.senderName} ({notice.senderDepartment})</span>
                        <span>·</span>
                        <span>{notice.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                        className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold font-mono tabular-nums flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <span>已读 {receipts.length}{notice.requireAck ? ` / 签收 ${ackCount}` : ''}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition cursor-pointer"
                        title="撤回此条通知"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50/70 rounded-lg p-2.5 text-[11px]">
                      <div className="font-bold text-slate-700 mb-1.5">
                        临床与岗位签收明细 ({receipts.length} 人已阅读)
                      </div>
                      {receipts.length === 0 ? (
                        <div className="text-slate-400">暂无接收人签收或阅读记录，等待科室人员登录工作台确认。</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {receipts.map((r, idx) => (
                            <div
                              key={`${r.userId}-${idx}`}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate">
                                  {r.department} · {r.userName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                                  {r.userRole} · {r.readAt}
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold shrink-0 ${
                                  r.acknowledged ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              >
                                {r.acknowledged ? '已签收 ✓' : '已读'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ==================== 模式3：临床科室/工程师/服务商 消息接收台 ==================== */
        <div className={`divide-y divide-slate-100 overflow-y-auto overscroll-contain ${compact ? 'min-h-[200px] max-h-[45vh]' : 'min-h-[240px] max-h-[60vh]'}`}>
          {filteredInboxNotices.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">
                {inboxFilter === 'all' ? '当前暂无管理科室下发的新通知' : '当前筛选条件下暂无待处理消息'}
              </p>
              <p className="text-[11px] text-slate-400">
                医疗设备科、财务科或院办发布的安全警示、强检计划与督办要求将实时推送至此。
              </p>
            </div>
          ) : (
            filteredInboxNotices.map(notice => {
              const pMeta = PRIORITY_META[notice.priority] || PRIORITY_META.normal;
              const isRead = hasUserReadNotice(notice, currentUser);
              const isAcked = hasUserAckNotice(notice, currentUser);
              const canJumpTab = Boolean(notice.targetTab && onNavigateToTab && canAccessTab(currentUser, notice.targetTab));

              return (
                <div
                  key={notice.id}
                  className={`px-4 py-3 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    !isRead
                      ? notice.priority === 'urgent'
                        ? 'bg-rose-50/45 hover:bg-rose-50/70'
                        : 'bg-blue-50/35 hover:bg-blue-50/60'
                      : 'bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isRead && (
                        <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                          未读新消息
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded border text-[10.5px] font-bold shrink-0 ${pMeta.badgeClass}`}>
                        {pMeta.label}
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-slate-900">
                        {notice.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {notice.content}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap font-mono tabular-nums">
                      <span className="font-sans font-medium text-slate-700">{notice.category}</span>
                      <span>·</span>
                      <span className="font-sans">下发: {notice.senderDepartment} · {notice.senderName}</span>
                      <span>·</span>
                      <span>{notice.createdAt}</span>
                      <span>·</span>
                      <span className="font-sans">范围: {formatNoticeScopeLabel(notice)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {canJumpTab && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isRead) handleMarkReadOrAck(notice, false);
                          onNavigateToTab?.(notice.targetTab!);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <span>前往处置</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {notice.requireAck ? (
                      isAcked ? (
                        <span className="px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          <span>已确认签收</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkReadOrAck(notice, true)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>确认收到回执</span>
                        </button>
                      )
                    ) : !isRead ? (
                      <button
                        type="button"
                        onClick={() => handleMarkReadOrAck(notice, false)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>标为已读</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap px-1.5">
                        已读
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};
