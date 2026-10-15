import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  KeyRound, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink, 
  Sliders, 
  Link2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ArrowRight, 
  X, 
  Sparkles, 
  FileText, 
  Download, 
  Upload, 
  RotateCcw,
  Search,
  Tag,
  Building2,
  Workflow,
  Send,
  Radio,
  Terminal,
  Code2,
  Activity,
  CheckCheck,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { CaoliaoSyncConfig, CaoliaoCategoryMappingRule } from '../types';

interface CaoliaoSyncSettingsViewProps {
  onNavigateTab?: (tab: string) => void;
  onOpenLedgerWithCategory?: (categoryNo: string) => void;
}

export const CaoliaoSyncSettingsView: React.FC<CaoliaoSyncSettingsViewProps> = ({
  onNavigateTab,
  onOpenLedgerWithCategory
}) => {
  // 顶层子视图切换：'webhook_hub' (Webhook 回调接收与任务转化中枢) vs 'category_mappings' (22大类映射与OpenAPI)
  const [activeSection, setActiveSection] = useState<'webhook_hub' | 'category_mappings'>('webhook_hub');

  // 核心配置状态
  const [config, setConfig] = useState<CaoliaoSyncConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // API Key 密码显示切换与复制状态
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // 连通性测试报告弹窗/卡片状态
  const [testReport, setTestReport] = useState<any | null>(null);

  // Webhook 状态与数据
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState<string | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [selectedRawLog, setSelectedRawLog] = useState<any | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState<boolean>(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any | null>(null);

  // 预设真实报修用例
  const WEBHOOK_PRESETS = [
    {
      id: 'icu_monitor',
      title: '【重症医学科】迈瑞病人监护仪心电血氧报警',
      deviceTarget: '迈瑞 BeneView T8 (EQ-001) · 急救生命支持组',
      badge: 'P1 特级紧急 · 15分钟限时',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      payload: {
        event: 'form_submitted',
        code_id: '131886095',
        code_name: '重症医学科-迈瑞病人监护仪',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-011`,
        '故障表现_2645349': '病人监护仪心电导联阻抗报警，SpO2血氧探头插头松动无波形显示，危重患者床旁需紧急处置',
        '报修人姓名_2645353': '林瑞芳 (ICU护士长)',
        '报修人手机_2645354': '13863371002',
        '出厂编号_2647283': 'MR-BENEVIEW-T8-001',
        '图片_2645350': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
        '科室名称_2647288': '重症医学科 (ICU)'
      }
    },
    {
      id: 'ct_overload',
      title: '【医学影像科】西门子 64排 CT 机架旋转报警',
      deviceTarget: '西门子 64排CT (EQ-002) · 大型放射影像组',
      badge: 'P2 紧急 · 30分钟限时',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      payload: {
        event: 'form_submitted',
        code_id: '131886096',
        code_name: '医学影像科-西门子64排螺旋CT',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-012`,
        '故障表现_2645349': '机架旋转自检报错 ERR-7402，高压发生器逆变打火，急诊扫描受阻，需工程师进场复位',
        '报修人姓名_2645353': '赵庆华 (放射技师长)',
        '报修人手机_2645354': '13963388112',
        '出厂编号_2647283': 'SOMATOM-DEF-AS-2019-09',
        '图片_2645350': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
        '科室名称_2647288': '医学影像科'
      }
    },
    {
      id: 'er_ventilator',
      title: '【急诊抢救室】迈瑞急救呼吸机呼气阀报警',
      deviceTarget: '迈瑞 SV300 呼吸机 (EQ-004) · 急救生命支持组',
      badge: 'P1 特级紧急 · 15分钟限时',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
      payload: {
        event: 'form_submitted',
        code_id: '131886098',
        code_name: '急诊抢救室-迈瑞急救呼吸机',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-013`,
        '故障表现_2645349': '通气过程中持续报呼气阀阻塞，实测吸气压力峰值偏高，急诊抢救患者待机，紧急报修',
        '报修人姓名_2645353': '刘芳 (急诊值班护士)',
        '报修人手机_2645354': '13706334422',
        '出厂编号_2647283': 'MR-SV300-2022-04',
        '图片_2645350': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
        '科室名称_2647288': '急诊科'
      }
    },
    {
      id: 'endoscope_light',
      title: '【麻醉手术科】奥林巴斯电子胃肠镜冷光源异常',
      deviceTarget: '奥林巴斯 CV-290 (EQ-007) · 腔镜微创手术组',
      badge: 'P2 紧急 · 30分钟限时',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      payload: {
        event: 'form_submitted',
        code_id: '131886101',
        code_name: '手术室-奥林巴斯电子内窥镜',
        '记录编号': `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-014`,
        '故障表现_2645349': '氙气冷光源主机闪烁点不亮，提示灯泡寿命超限需更换，术前紧急备机',
        '报修人姓名_2645353': '孙强 (内镜室技师)',
        '报修人手机_2645354': '13863375533',
        '出厂编号_2647283': 'OLY-CV290-78821',
        '图片_2645350': 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80',
        '科室名称_2647288': '麻醉手术科'
      }
    }
  ];

  const [activePresetId, setActivePresetId] = useState<string>('icu_monitor');
  const [testPayloadStr, setTestPayloadStr] = useState<string>(() => JSON.stringify(WEBHOOK_PRESETS[0].payload, null, 2));

  // 提示信息 (Toast)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 映射规则搜索与筛选
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [ruleFilterStatus, setRuleFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');

  // 新增/编辑映射规则 Modal
  const [editingRule, setEditingRule] = useState<CaoliaoCategoryMappingRule | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 辅助提示
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. 获取初始配置
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/caoliao/sync-settings');
      const json = await res.json();
      if (json.success && json.data) {
        setConfig(json.data);
      }
    } catch (err: any) {
      console.error('Failed to load caoliao sync settings:', err);
      showToast('error', '获取草料同步设置失败，请检查网络');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. 保存配置
  const handleSaveSettings = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/caoliao/sync-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
        showToast('success', json.message || '草料同步设置与设备分类映射规则已成功保存！');
      } else {
        showToast('error', json.error || '保存失败');
      }
    } catch (err: any) {
      showToast('error', '网络异常，保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. 测试 API 接口与密钥有效性
  const handleTestApi = async () => {
    if (!config) return;
    setIsTesting(true);
    setTestReport(null);
    try {
      const res = await fetch('/api/caoliao/test-api-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: config.apiKey,
          corpId: config.corpId,
          apiBaseUrl: config.apiBaseUrl
        })
      });
      const json = await res.json();
      if (json.success) {
        setTestReport(json);
        showToast('success', `接口握手成功！往返时延 ${json.latencyMs}ms，API Key 鉴权有效！`);
        // 更新本地测试状态
        setConfig(prev => prev ? {
          ...prev,
          lastTestTime: json.serverTime,
          lastTestStatus: 'success',
          lastTestMessage: json.message
        } : prev);
      } else {
        setTestReport({ success: false, error: json.error || '接口鉴权失败' });
        showToast('error', json.error || 'API Key 校验失败');
      }
    } catch (err: any) {
      showToast('error', '测试请求超时或连接失败');
    } finally {
      setIsTesting(false);
    }
  };

  // 4. 立即触发一次设备分类映射与数据同频
  const handleTriggerCategorySync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/caoliao/trigger-category-sync', {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || '分类映射同步完成！');
        fetchSettings();
      } else {
        showToast('error', json.error || '分类同步失败');
      }
    } catch (err: any) {
      showToast('error', '网络异常，同步失败');
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. 重置为三甲医院标准分类映射模版
  const handleResetDefaults = async () => {
    if (!window.confirm('确认将设备分类映射规则重置为五莲县人民医院标准 22 大类模版吗？当前自定规则将被覆盖。')) {
      return;
    }
    try {
      const res = await fetch('/api/caoliao/reset-category-mappings', {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
        showToast('success', '已恢复标准分类映射规则模版！');
      }
    } catch (err) {
      showToast('error', '重置失败');
    }
  };

  // 6. 复制 API Key
  const handleCopyKey = () => {
    if (!config?.apiKey) return;
    navigator.clipboard.writeText(config.apiKey);
    setCopiedKey(true);
    showToast('info', 'API Key 已复制到剪贴板');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // 7. 切换单条规则启用状态
  const handleToggleRule = (ruleId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      categoryMappings: config.categoryMappings.map(r => 
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    });
  };

  // 8. 删除单条映射规则
  const handleDeleteRule = (ruleId: string) => {
    if (!config) return;
    if (!window.confirm('确认删除该分类映射规则吗？')) return;
    setConfig({
      ...config,
      categoryMappings: config.categoryMappings.filter(r => r.id !== ruleId)
    });
    showToast('info', '已移除该分类映射规则');
  };

  // 9. 打开新增规则弹窗
  const handleOpenAddModal = () => {
    setEditingRule({
      id: `rule-${Date.now().toString().slice(-4)}`,
      sourceCategoryCode: '07',
      sourceCategoryName: '医用诊察和监护器械',
      targetCaoliaoDirectory: '医用诊察和监护器械',
      targetTemplateId: '131886095',
      targetTemplateName: '医疗设备标准码',
      qrColorTheme: 'emerald',
      labelSpec: '80x50',
      repairFormId: 'table_d233',
      autoSyncRepair: true,
      enabled: true,
      priority: (config?.categoryMappings.length || 0) + 1,
      notes: ''
    });
    setIsModalOpen(true);
  };

  // 10. 打开编辑规则弹窗
  const handleOpenEditModal = (rule: CaoliaoCategoryMappingRule) => {
    setEditingRule({ ...rule });
    setIsModalOpen(true);
  };

  // 11. 保存 Modal 中的规则
  const handleSaveModalRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !editingRule) return;

    const exists = config.categoryMappings.some(r => r.id === editingRule.id);
    let updatedRules: CaoliaoCategoryMappingRule[];
    if (exists) {
      updatedRules = config.categoryMappings.map(r => r.id === editingRule.id ? editingRule : r);
    } else {
      updatedRules = [...config.categoryMappings, editingRule];
    }

    setConfig({
      ...config,
      categoryMappings: updatedRules
    });
    setIsModalOpen(false);
    setEditingRule(null);
    showToast('success', exists ? '已更新分类映射规则' : '已新增分类映射规则');
  };

  // 12. 获取 Webhook 审计日志
  const fetchWebhookLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/caoliao/webhook-logs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWebhookLogs(json.data);
      }
    } catch (e) {
      console.warn('Failed to load webhook logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, []);

  // 13. 清空 Webhook 审计日志
  const handleClearWebhookLogs = async () => {
    if (!window.confirm('确认清空草料二维码 Webhook 历史回调审计日志吗？')) return;
    try {
      const res = await fetch('/api/caoliao/clear-webhook-logs', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setWebhookLogs([]);
        showToast('info', '已清空 Webhook 历史回调审计日志');
      }
    } catch (e) {
      showToast('error', '清空日志失败');
    }
  };

  // 14. 切换预设报修用例
  const handleSelectPreset = (preset: typeof WEBHOOK_PRESETS[0]) => {
    setActivePresetId(preset.id);
    setTestPayloadStr(JSON.stringify(preset.payload, null, 2));
    setWebhookTestResult(null);
  };

  // 15. 发送 Webhook 回调测试数据
  const handleSendWebhookTest = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(testPayloadStr);
    } catch (e: any) {
      showToast('error', 'Payload JSON 格式解析失败，请检查语法');
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await fetch('/api/caoliao/webhook-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: parsed })
      });
      const json = await res.json();
      if (json.success) {
        setWebhookTestResult(json);
        showToast('success', `🎉 报修回调解析成功！已自动转建工单 [${json.workOrderId}] 并关联设备 [${json.equipmentName}]`);
        fetchWebhookLogs();
        window.dispatchEvent(new CustomEvent('work_orders_updated'));
      } else {
        setWebhookTestResult({ error: json.error || '解析转建失败' });
        showToast('error', json.error || 'Webhook 解析转建失败');
      }
    } catch (err: any) {
      showToast('error', '网络请求失败，请检查服务状态');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // 16. 复制 Webhook 端点 URL
  const handleCopyWebhookUrl = (urlPath: string) => {
    const fullUrl = `${window.location.origin}${urlPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedWebhookUrl(urlPath);
    showToast('info', `已复制端点地址：${fullUrl}`);
    setTimeout(() => setCopiedWebhookUrl(null), 2500);
  };

  // 过滤规则列表
  const filteredRules = (config?.categoryMappings || []).filter(rule => {
    const q = ruleSearch.toLowerCase().trim();
    const matchQuery = !q || 
      rule.sourceCategoryCode.toLowerCase().includes(q) ||
      rule.sourceCategoryName.toLowerCase().includes(q) ||
      rule.targetCaoliaoDirectory.toLowerCase().includes(q) ||
      rule.targetTemplateName.toLowerCase().includes(q) ||
      (rule.notes && rule.notes.toLowerCase().includes(q));

    const matchStatus = 
      ruleFilterStatus === 'all' ? true :
      ruleFilterStatus === 'enabled' ? rule.enabled :
      !rule.enabled;

    return matchQuery && matchStatus;
  });

  // 统计覆盖总设备数
  const totalCoveredEquipments = (config?.categoryMappings || []).reduce((sum, r) => sum + (r.matchedCount || 0), 0);
  const enabledRuleCount = (config?.categoryMappings || []).filter(r => r.enabled).length;

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-600 font-medium">正在读取草料二维码同步配置与设备分类映射规则...</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      
      {/* Toast 提示浮窗 */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          toast.type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' :
          'bg-slate-900 text-white border-slate-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> :
           toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> :
           <Zap className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. 顶部控制面板总览条 (Header & Status Dashboard) */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 rounded-2xl border border-emerald-500/30 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 border border-emerald-400/40">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>草料二维码同步与分类映射配置</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>OpenAPI & RDS 双通道</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                录入草料开放平台 API Key 与租户凭据，维护院内医疗器械分类标准与草料活码目录/模板的双向映射规则，实现全院技术台账、设备活码与移动扫码报修闭环管理。
              </p>
            </div>
          </div>

          {/* 顶部动作组 */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleTestApi}
              disabled={isTesting}
              className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="测试当前 API Key 与草料开放平台网关连通性"
            >
              <Zap className={`w-3.5 h-3.5 text-emerald-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? '握手中...' : '测试 API Key 连通性'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerCategorySync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              title="根据当前分类映射规则立即执行一次分类对账"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '正在同频...' : '即时分类对账'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? '正在保存...' : '保存同步设置'}</span>
            </button>
          </div>
        </div>

        {/* 顶部状态微缩指标 */}
        <div className="mt-5 pt-4 border-t border-emerald-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-slate-400 block text-[11px]">API 鉴权凭据</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-emerald-300">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>{config.apiKey ? `${config.apiKey.slice(0, 8)}••••` : '未配置'}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-slate-400 block text-[11px]">生效分类映射规则</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>{enabledRuleCount} / {config.categoryMappings.length} 条已启用</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-slate-400 block text-[11px]">覆盖设备台账规模</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-300 font-mono">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>{totalCoveredEquipments} 台在册设备</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-slate-400 block text-[11px]">定时同频机制</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-white">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{config.autoSyncIntervalMinutes > 0 ? `每 ${config.autoSyncIntervalMinutes} 分钟自动同步` : '手动触发'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 测试报告展开区 */}
      {testReport && (
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs animate-in fade-in duration-150 ${
          testReport.success 
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                testReport.success ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {testReport.success ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {testReport.success ? '草料开放平台 OpenAPI 连通测试通过' : '草料 API 接口连通测试未通过'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">{testReport.message || testReport.error}</p>
              </div>
            </div>
            <button
              onClick={() => setTestReport(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {testReport.success && (
            <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">企业租户:</span>
                <strong className="text-slate-900">{testReport.corpName}</strong> ({testReport.corpId})
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">往返时延:</span>
                <strong className="text-emerald-700 font-mono font-bold">{testReport.latencyMs} ms</strong> (专线响应优异)
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">双向传输通道:</span>
                <span className="font-medium text-slate-800">{testReport.liveDataSnapshot?.databaseTunnel}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. 主体两栏布局：左侧凭据与同频策略，右侧分类映射规则 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ================= 左侧 (4列)：API Key 录入与对接策略 ================= */}
        <div className="lg:col-span-5 space-y-6">

          {/* 卡片 1: 草料开放平台接口凭据 (API Credentials) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">草料开放平台 API 凭据录入</h3>
                  <p className="text-xs text-slate-500">五莲县人民医院官方租户授权 Key</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                OpenAPI v2
              </span>
            </div>

            {/* API Key 核心输入框 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>草料 API Key (接口密钥) <span className="text-rose-500">*</span></span>
                <span className="text-slate-400 font-normal text-[11px]">草料开发者平台分配</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="请输入草料 OpenAPI Key，例如 cli_live_9833874_sec_..."
                  className="w-full pl-3 pr-20 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
                />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    title={showApiKey ? '隐藏 API Key' : '显示完整 API Key'}
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-1 text-slate-400 hover:text-emerald-700 rounded cursor-pointer"
                    title="复制 API Key"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                用于身份鉴权调取草料云端 1,602 个活码数据、拉取扫码故障工单及回写设备在位状态。
              </p>
            </div>

            {/* 企业租户 ID 与 API 端点 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">企业租户 ID (Corp ID)</label>
                <input
                  type="text"
                  value={config.corpId}
                  onChange={(e) => setConfig({ ...config, corpId: e.target.value })}
                  placeholder="cli_9833874"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">OpenAPI 网关地址</label>
                <input
                  type="text"
                  value={config.apiBaseUrl}
                  onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
                  placeholder="https://openapi.clewm.net/v2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 通信架构模式 */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">接口对接模式 (Transport Mode)</label>
              <div className="space-y-2">
                {[
                  {
                    id: 'rds_and_api' as const,
                    title: '单向抽取直通 + OpenAPI 混合模式 (推荐最佳实践)',
                    desc: 'MySQL RDS 只读专线秒级抽取现场报修 + OpenAPI 活码标签批量制作',
                    badge: '生产推荐'
                  },
                  {
                    id: 'api_only' as const,
                    title: '纯 OpenAPI 模式 (cli.im/open-api)',
                    desc: '仅使用草料官方 HTTP REST API，适合批量活码生码与标签制作',
                    badge: '云端接口'
                  },
                  {
                    id: 'rds_direct' as const,
                    title: '阿里云 RDS 只读专线抽取模式 (安全等保合规)',
                    desc: '五莲县医院专用 MySQL 只读从库 (SELECT Only)，毫秒级原生 SQL 增量抽取',
                    badge: '只读安全'
                  }
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      config.connectionMode === mode.id
                        ? 'bg-emerald-50/60 border-emerald-400 text-slate-900 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="connectionMode"
                      checked={config.connectionMode === mode.id}
                      onChange={() => setConfig({ ...config, connectionMode: mode.id })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{mode.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">{mode.badge}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 官方开放平台权威规范提示 (cli.im/open-api) */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>草料开放平台 (cli.im/open-api) 权限与业务边界说明</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                1. <strong>只读从库机制</strong>：草料官方提供的阿里云 RDS 数据库账号为纯只读权限（仅 SELECT），外部系统严禁也无法执行 SQL 写入，保障线上数据不被外部污染。<br />
                2. <strong>单向推送红线</strong>：草料官方明确声明“数据API服务只支持单向推送，暂不支持将外部数据写入草料”。外部系统无法伪造提交或覆写草料表单记录。<br />
                3. <strong>最佳架构实践</strong>：草料二维码仅作为“临床前端报修轻量入口”，院内系统单向出站拉取报修数据并在内网完成闭环流转，全面免去微信端开发与公网暴露风险。
              </p>
            </div>
          </div>

          {/* 卡片 2: 自动化同频策略 (Sync Scheduling & Triggers) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">同步计划与业务同频策略</h3>
                  <p className="text-xs text-slate-500">双向数据触发规则与定时流转</p>
                </div>
              </div>
            </div>

            {/* 定时执行周期 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">自动同步轮询周期</label>
              <select
                value={config.autoSyncIntervalMinutes}
                onChange={(e) => setConfig({ ...config, autoSyncIntervalMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value={0}>仅手动触发 (不执行后台定时轮询)</option>
                <option value={15}>每 15 分钟自动同频 (高频实时推荐)</option>
                <option value={30}>每 30 分钟自动同频 (标准稳定平衡)</option>
                <option value={60}>每 1 小时自动同频</option>
                <option value={1440}>每天凌晨 02:00 全量同步一次</option>
              </select>
            </div>

            {/* 三大自动化业务开关 */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-1">业务双向闭环开关</div>
              
              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableAutoPullRepairs}
                  onChange={(e) => setConfig({ ...config, enableAutoPullRepairs: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">自动拉取现场扫码报修单 (table_d233)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">当临床医护在草料扫码建单时，自动转为院内医工派工流转</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableAutoPushStatus}
                  onChange={(e) => setConfig({ ...config, enableAutoPushStatus: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">自动回写设备在位/维修状态至草料活码</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">设备完成检修或状态变更后，自动更新草料线上活码的状态标识</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableAutoCreateQr}
                  onChange={(e) => setConfig({ ...config, enableAutoCreateQr: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">新验收入库设备自动在草料分配活码 (code_id)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">新设备完成开箱验收后，自动在草料生成专属二维码并生成打印标贴</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ================= 右侧 (7列)：设备分类映射规则维护 ================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            
            {/* 标题与工具栏 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <Workflow className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">设备分类与草料活码目录映射规则</h3>
                    <p className="text-xs text-slate-500">将院内医疗器械大类精准对应至草料活码目录与样式规范</p>
                  </div>
                </div>
              </div>

              {/* 动作按钮 */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  title="重置为国家医疗器械22大类与草料标准映射模版"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>恢复标准模版</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增映射规则</span>
                </button>
              </div>
            </div>

            {/* 搜索过滤栏 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder="搜索院内分类代码、大类名称或草料目录..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 text-xs self-start sm:self-auto">
                <span className="text-slate-400 mr-1 text-[11px]">状态:</span>
                {[
                  { id: 'all' as const, label: '全部' },
                  { id: 'enabled' as const, label: '已启用' },
                  { id: 'disabled' as const, label: '已停用' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRuleFilterStatus(f.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      ruleFilterStatus === f.id
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 分类映射规则卡片列表 */}
            <div className="space-y-3">
              {filteredRules.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  暂无匹配的设备分类映射规则，您可点击上方按钮新增或恢复三甲标准模版。
                </div>
              ) : (
                filteredRules.map((rule) => {
                  const themeColorMap: Record<string, string> = {
                    emerald: 'bg-emerald-500 text-white',
                    blue: 'bg-blue-500 text-white',
                    rose: 'bg-rose-500 text-white',
                    amber: 'bg-amber-500 text-white',
                    purple: 'bg-purple-500 text-white',
                    slate: 'bg-slate-600 text-white'
                  };

                  return (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        rule.enabled 
                          ? 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs' 
                          : 'bg-slate-50/70 border-slate-200 opacity-60'
                      }`}
                    >
                      {/* 规则顶部头 */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 院内大类 */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-xs">
                              [{rule.sourceCategoryCode}]
                            </span>
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {rule.sourceCategoryName}
                            </span>
                          </div>

                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                          {/* 草料对应目录 */}
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-emerald-600" />
                              <span>{rule.targetCaoliaoDirectory}</span>
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                              (模板#{rule.targetTemplateId})
                            </span>
                          </div>
                        </div>

                        {/* 开关与操作 */}
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => handleToggleRule(rule.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{rule.enabled ? '启用' : '停用'}</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(rule)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                            title="编辑映射规则"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="删除规则"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 规则细节标签网格 */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">台账覆盖数量</span>
                          <span className="font-bold text-slate-800 font-mono text-xs">
                            {rule.matchedCount || 0} 台在册
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px]">标贴外观规范</span>
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${themeColorMap[rule.qrColorTheme] || 'bg-slate-400'}`} />
                            <span>{rule.labelSpec}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px]">关联报修表单</span>
                          <span className="font-mono text-slate-700 font-semibold truncate block">
                            {rule.repairFormId || 'table_d233'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px]">报修单拉取</span>
                          <span className={`font-semibold ${rule.autoSyncRepair ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {rule.autoSyncRepair ? '✓ 自动双向' : '人工确认'}
                          </span>
                        </div>
                      </div>

                      {rule.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                          {rule.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 新增 / 编辑映射规则 Modal */}
      {isModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Workflow className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {config.categoryMappings.some(r => r.id === editingRule.id) ? '编辑设备分类映射规则' : '新增设备分类映射规则'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); setEditingRule(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalRule} className="p-5 space-y-4 text-xs">
              
              {/* 院内医疗器械大类选择 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">分类代码 (NMPA)</label>
                  <input
                    type="text"
                    required
                    value={editingRule.sourceCategoryCode}
                    onChange={(e) => setEditingRule({ ...editingRule, sourceCategoryCode: e.target.value })}
                    placeholder="如 07"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-700 block">院内分类名称</label>
                  <input
                    type="text"
                    required
                    value={editingRule.sourceCategoryName}
                    onChange={(e) => setEditingRule({ ...editingRule, sourceCategoryName: e.target.value })}
                    placeholder="如 医用诊察和监护器械"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 草料目标分类目录与模板 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">草料目标分类目录</label>
                  <input
                    type="text"
                    required
                    value={editingRule.targetCaoliaoDirectory}
                    onChange={(e) => setEditingRule({ ...editingRule, targetCaoliaoDirectory: e.target.value })}
                    placeholder="草料目录名称"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">草料模板 ID</label>
                  <input
                    type="text"
                    required
                    value={editingRule.targetTemplateId}
                    onChange={(e) => setEditingRule({ ...editingRule, targetTemplateId: e.target.value })}
                    placeholder="如 131886095"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 外观与表单 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">活码标贴色系规范</label>
                  <select
                    value={editingRule.qrColorTheme}
                    onChange={(e) => setEditingRule({ ...editingRule, qrColorTheme: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="emerald">翡翠绿 (通用监护与诊察)</option>
                    <option value="rose">急救红 (急救与生命支持)</option>
                    <option value="blue">科技蓝 (大型影像与超声)</option>
                    <option value="amber">琥珀橙 (能量与手术室)</option>
                    <option value="purple">专属紫 (微创介入器械)</option>
                    <option value="slate">沉稳灰 (消毒灭菌与物理治疗)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">标贴打印规格</label>
                  <select
                    value={editingRule.labelSpec}
                    onChange={(e) => setEditingRule({ ...editingRule, labelSpec: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  >
                    <option value="80x50">80x50 mm (中型设备标准)</option>
                    <option value="60x40">60x40 mm (小型便携器械)</option>
                    <option value="100x70">100x70 mm (大型影像设备)</option>
                    <option value="compact_round">圆形小标签 (特殊管路)</option>
                  </select>
                </div>
              </div>

              {/* 关联表单 ID */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">关联扫码报修表单路由 (表单 ID)</label>
                <input
                  type="text"
                  value={editingRule.repairFormId}
                  onChange={(e) => setEditingRule({ ...editingRule, repairFormId: e.target.value })}
                  placeholder="table_d233"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* 备注 */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">规则说明与适用设备范围 (选填)</label>
                <input
                  type="text"
                  value={editingRule.notes || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, notes: e.target.value })}
                  placeholder="如：包含全院病人监护仪、心电图机等..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* 开关 */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingRule.autoSyncRepair}
                    onChange={(e) => setEditingRule({ ...editingRule, autoSyncRepair: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>自动拉取该分类扫码工单</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingRule.enabled}
                    onChange={(e) => setEditingRule({ ...editingRule, enabled: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>启用该规则</span>
                </label>
              </div>

              {/* 底部按钮 */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingRule(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  确定保存规则
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
