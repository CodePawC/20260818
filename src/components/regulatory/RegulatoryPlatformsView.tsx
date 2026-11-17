import React, { useState } from 'react';
import {
  Globe,
  Key,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Download,
  Building,
  Check,
  Phone,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  FileCheck2,
  FolderOpen,
  Activity,
  History,
  Table as TableIcon,
  LayoutGrid,
  Edit2,
  Trash2,
  Sparkles,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { RegulatoryPlatform, RegulatoryDocument, PlatformAccessLog } from '../../types/regulatoryPlatformTypes';
import {
  getStoredPlatforms,
  saveStoredPlatforms,
  getStoredDocs,
  saveStoredDocs,
  getStoredLogs,
  saveStoredLogs
} from '../../utils/regulatoryPlatformData';
import { NewPlatformLogModal } from './NewPlatformLogModal';
import { NewPlatformDocModal } from './NewPlatformDocModal';
import { NewPlatformUnitModal } from './NewPlatformUnitModal';

type SubTab = 'platforms' | 'documents' | 'logs';
type DisplayMode = 'table' | 'cards';

export const RegulatoryPlatformsView: React.FC = () => {
  const [platforms, setPlatforms] = useState<RegulatoryPlatform[]>(() => getStoredPlatforms());
  const [documents, setDocuments] = useState<RegulatoryDocument[]>(() => getStoredDocs());
  const [logs, setLogs] = useState<PlatformAccessLog[]>(() => getStoredLogs());

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('platforms');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('table'); // Table view is default for executive ledger clarity
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAuthorityFilter, setSelectedAuthorityFilter] = useState<string>('all');
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('all');
  const [selectedLogStatus, setSelectedLogStatus] = useState<string>('all');

  // Password visibility states (keyed by platform ID)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState<boolean>(false);
  const [selectedPlatformForModal, setSelectedPlatformForModal] = useState<number | undefined>(undefined);
  const [editingPlatform, setEditingPlatform] = useState<RegulatoryPlatform | null>(null);

  // Expanded row details for remarks
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const copyToClipboard = (text: string, label: string, keyId: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    showToast(`已复制${label}: ${text}`);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleToggleShowAllPasswords = () => {
    const nextState = !showAllPasswords;
    setShowAllPasswords(nextState);
    const newVis: Record<number, boolean> = {};
    platforms.forEach(p => {
      newVis[p.id] = nextState;
    });
    setVisiblePasswords(newVis);
    showToast(nextState ? '已明文显示全部密码' : '已掩码保护全部密码');
  };

  // Unit creation / edit handler
  const handleSaveUnit = (platformData: RegulatoryPlatform) => {
    const exists = platforms.some(p => p.id === platformData.id);
    let updated: RegulatoryPlatform[];
    if (exists) {
      updated = platforms.map(p => (p.id === platformData.id ? platformData : p));
      showToast(`档案单位【${platformData.platformName}】已更新！`);
    } else {
      updated = [...platforms, platformData];
      showToast(`新档案单位【${platformData.platformName}】已录入入库！`);
    }
    setPlatforms(updated);
    saveStoredPlatforms(updated);
    setEditingPlatform(null);
  };

  const handleDeleteUnit = (id: number, name: string) => {
    if (window.confirm(`确认要删除监管档案单位【${name}】及其关联凭据吗？此操作不可逆。`)) {
      const updated = platforms.filter(p => p.id !== id);
      setPlatforms(updated);
      saveStoredPlatforms(updated);
      showToast(`已删除档案单位【${name}】`);
    }
  };

  // Add Log handler
  const handleSaveLog = (newLog: PlatformAccessLog) => {
    const updated = [newLog, ...logs];
    setLogs(updated);
    saveStoredLogs(updated);

    const updatedPlatforms = platforms.map(p => {
      if (p.id === newLog.platformId) {
        return {
          ...p,
          lastLoginDate: newLog.accessTime.split(' ')[0],
          totalLogins: (p.totalLogins || 0) + 1
        };
      }
      return p;
    });
    setPlatforms(updatedPlatforms);
    saveStoredPlatforms(updatedPlatforms);

    showToast('登录与经办记录保存成功！');
  };

  // Add Doc handler
  const handleSaveDoc = (newDoc: RegulatoryDocument) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveStoredDocs(updated);

    const updatedPlatforms = platforms.map(p => {
      if (p.id === newDoc.platformId) {
        return {
          ...p,
          docCount: (p.docCount || 0) + 1
        };
      }
      return p;
    });
    setPlatforms(updatedPlatforms);
    saveStoredPlatforms(updatedPlatforms);

    showToast(`公文《${newDoc.docTitle}》已归档入库！`);
  };

  // Modal open helpers
  const handleOpenLogModal = (platId?: number) => {
    setSelectedPlatformForModal(platId);
    setIsLogModalOpen(true);
  };

  const handleOpenDocModal = (platId?: number) => {
    setSelectedPlatformForModal(platId);
    setIsDocModalOpen(true);
  };

  const handleOpenAddUnitModal = () => {
    setEditingPlatform(null);
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnitModal = (plat: RegulatoryPlatform) => {
    setEditingPlatform(plat);
    setIsUnitModalOpen(true);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', '隶属机关', '隶属关系', '管理机关', '平台名称', '用户名', '密码', '链接', '系统层级', '备注与办事指南'];
    const rows = platforms.map(p => [
      p.id,
      `"${p.superiorMinistry || ''}"`,
      `"${p.affiliationRelation || ''}"`,
      `"${p.managingAuthority || ''}"`,
      `"${p.platformName || ''}"`,
      `"${p.username || ''}"`,
      `"${p.password || ''}"`,
      `"${p.url || ''}"`,
      `"${p.systemLevel || ''}"`,
      `"${(p.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `五莲县人民医院_国家与省市监管平台总台账_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('已导出监管平台档案总台账 CSV');
  };

  // Filtered platforms
  const filteredPlatforms = platforms.filter(p => {
    const matchSearch =
      p.platformName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.managingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.superiorMinistry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.remarks.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.id) === searchQuery.trim();

    if (!matchSearch) return false;

    if (selectedAuthorityFilter === 'all') return true;
    if (selectedAuthorityFilter === 'mee') return p.superiorMinistry.includes('生态环境') || p.managingAuthority.includes('生态环境');
    if (selectedAuthorityFilter === 'samr') return p.superiorMinistry.includes('市场监督') || p.managingAuthority.includes('市场监督') || p.managingAuthority.includes('特检');
    if (selectedAuthorityFilter === 'nhc') return p.superiorMinistry.includes('卫生健康') || p.managingAuthority.includes('卫生健康') || p.category === 'occupational_health';
    if (selectedAuthorityFilter === 'rizhao') return p.managingAuthority.includes('日照') || p.superiorMinistry.includes('日照');
    return true;
  });

  // Filtered documents
  const filteredDocuments = documents.filter(d => {
    const matchSearch =
      d.docTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.managingAuthority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (selectedDocCategory === 'all') return true;
    return d.docCategory === selectedDocCategory;
  });

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    const matchSearch =
      l.platformName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.businessSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.resultReceiptNo && l.resultReceiptNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.remarks && l.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (selectedLogStatus === 'all') return true;
    return l.status === selectedLogStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Hero Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Shield className="w-96 h-96 text-white" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                <span>国家与省市监管平台档案库 · 结构化全景台账专区</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">监管平台档案</h1>
              <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
                集中统一归档中华人民共和国生态环境部、国家市场监督管理总局、国家卫生健康委员会、山东省特检院、日照市市场监督管理局等官方监管系统全景台账、账号密码保险箱，保存国家机构下发的各项行政许可、批复与检定公文，并常态化记录每次登录经办业务与回执流水。
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenAddUnitModal}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center space-x-2 transition-all transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>录入新档案单位</span>
              </button>
              <button
                onClick={() => handleOpenLogModal()}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Clock className="w-4 h-4 text-blue-300" />
                <span>登记本次登录</span>
              </button>
              <button
                onClick={() => handleOpenDocModal()}
                className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-emerald-600/20"
              >
                <FolderOpen className="w-4 h-4" />
                <span>归档下发文件</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10 text-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">在册监管档案单位</p>
                <p className="text-xl font-bold text-white">{platforms.length} <span className="text-xs text-blue-300 font-normal">个官方系统</span></p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">有效账号密码凭证</p>
                <p className="text-xl font-bold text-white">{platforms.filter(p => p.username && !p.username.includes('自主登录')).length} <span className="text-xs text-emerald-300 font-normal">套在用账号</span></p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">机构下发公文证照</p>
                <p className="text-xl font-bold text-white">{documents.length} <span className="text-xs text-amber-300 font-normal">件官方批件</span></p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">累计登录经办流水</p>
                <p className="text-xl font-bold text-white">{logs.length} <span className="text-xs text-purple-300 font-normal">次登录记录</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('platforms')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              activeSubTab === 'platforms'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>国家/省市监管平台总台账</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-bold">
              {platforms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              activeSubTab === 'documents'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>机构下发公文与资料库</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 font-bold">
              {documents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              activeSubTab === 'logs'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>登录经办与巡检日志</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700 font-bold">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Global Search inside current tab */}
        <div className="relative w-72 pb-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'platforms'
                ? '搜索平台名称、部委、账号、备注...'
                : activeSubTab === 'documents'
                ? '搜索公文标题、文号、标签...'
                : '搜索经办人、业务事项、单号...'
            }
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: PLATFORMS EXECUTIVE LEDGER (TABLE & CARDS VIEW)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'platforms' && (
        <div className="space-y-4">
          {/* Controls Bar: Authority Filters, View Switcher, Password Toggle, Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 flex items-center mr-1">
                <Filter className="w-3.5 h-3.5 mr-1" />
                体系筛选:
              </span>
              {[
                { id: 'all', label: `全部系统 (${platforms.length})` },
                { id: 'mee', label: '生态环境部' },
                { id: 'samr', label: '市场监管/特检' },
                { id: 'nhc', label: '卫健委/疾控' },
                { id: 'rizhao', label: '日照属地专管' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedAuthorityFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedAuthorityFilter === f.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Right Tools: Master Password Eye, Add Unit, Export, View Toggle */}
            <div className="flex items-center space-x-2">
              {/* Show/Hide All Passwords */}
              <button
                onClick={handleToggleShowAllPasswords}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
                title={showAllPasswords ? '一键掩码所有密码' : '一键明文显示所有密码'}
              >
                {showAllPasswords ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                    <span>全部掩码</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>全部明文</span>
                  </>
                )}
              </button>

              {/* Export to CSV */}
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
                title="导出台账为 CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>导出台账</span>
              </button>

              {/* Add New Unit Button */}
              <button
                onClick={handleOpenAddUnitModal}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>录入新单位</span>
              </button>

              {/* View Toggle (Table vs Cards) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setDisplayMode('table')}
                  className={`p-1.5 rounded-md flex items-center space-x-1 transition-colors ${
                    displayMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="台账表格视图（高清晰度推荐）"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">表格台账</span>
                </button>
                <button
                  onClick={() => setDisplayMode('cards')}
                  className={`p-1.5 rounded-md flex items-center space-x-1 transition-colors ${
                    displayMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="卡片矩阵视图"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">卡片矩阵</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. TABLE VIEW (DEFAULT & DIRECT MATCH TO ADMINISTRATIVE DATA) */}
          {displayMode === 'table' ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800 text-white font-semibold tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">ID</th>
                      <th className="py-3 px-3 min-w-[150px]">隶属机关</th>
                      <th className="py-3 px-2 w-20 text-center">隶属关系</th>
                      <th className="py-3 px-3 min-w-[160px]">管理机关</th>
                      <th className="py-3 px-4 min-w-[200px]">平台名称</th>
                      <th className="py-3 px-3 min-w-[150px]">用户名 / 统一代码</th>
                      <th className="py-3 px-3 min-w-[130px]">登录密码</th>
                      <th className="py-3 px-3 min-w-[140px]">链接与直通</th>
                      <th className="py-3 px-4 min-w-[240px]">备注 / 办事指南</th>
                      <th className="py-3 px-3 min-w-[120px] text-center sticky right-0 bg-slate-800 shadow-l">经办操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredPlatforms.map((plat, idx) => {
                      const isPwdVisible = !!visiblePasswords[plat.id];
                      const isExpanded = expandedRowId === plat.id;
                      const hasMailingInfo = plat.remarks && (plat.remarks.includes('邮寄') || plat.remarks.includes('0531') || plat.remarks.includes('窗口'));

                      return (
                        <tr
                          key={plat.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                          }`}
                        >
                          {/* 1. ID */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs">
                              {plat.id}
                            </span>
                          </td>

                          {/* 2. 隶属机关 */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {plat.superiorMinistry || '—'}
                            </div>
                            <div className="mt-1 flex items-center space-x-1.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                  plat.systemLevel === '国家级'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : plat.systemLevel === '省级'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {plat.systemLevel}
                              </span>
                            </div>
                          </td>

                          {/* 3. 隶属关系 */}
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            {plat.affiliationRelation ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                                {plat.affiliationRelation}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* 4. 管理机关 */}
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-medium leading-tight">
                              {plat.managingAuthority || plat.superiorMinistry || '—'}
                            </div>
                          </td>

                          {/* 5. 平台名称 */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 leading-snug">
                              {plat.platformName}
                            </div>
                            <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                              <span>公文: <strong className="text-slate-600">{documents.filter(d => d.platformId === plat.id).length}</strong></span>
                              <span>·</span>
                              <span>登录: <strong className="text-slate-600">{logs.filter(l => l.platformId === plat.id).length}</strong>次</span>
                            </div>
                          </td>

                          {/* 6. 用户名 */}
                          <td className="py-3 px-3 font-mono">
                            {plat.username ? (
                              <div className="flex items-center justify-between space-x-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <span className="font-semibold text-slate-800 select-all truncate max-w-[110px]" title={plat.username}>
                                  {plat.username}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(plat.username, '用户名', `u-${plat.id}`)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                  title="复制用户名"
                                >
                                  {copiedKey === `u-${plat.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">（自主登录）</span>
                            )}
                          </td>

                          {/* 7. 密码 */}
                          <td className="py-3 px-3 font-mono">
                            {plat.password ? (
                              <div className="flex items-center justify-between space-x-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                <span className="font-semibold text-slate-800 select-all truncate max-w-[85px]">
                                  {isPwdVisible ? plat.password : '••••••'}
                                </span>
                                <div className="flex items-center space-x-0.5">
                                  <button
                                    onClick={() => togglePasswordVisibility(plat.id)}
                                    className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                                    title={isPwdVisible ? '隐藏密码' : '显示密码'}
                                  >
                                    {isPwdVisible ? (
                                      <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(plat.password, '密码', `p-${plat.id}`)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                                    title="复制密码"
                                  >
                                    {copiedKey === `p-${plat.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">（无需密码）</span>
                            )}
                          </td>

                          {/* 8. 链接 */}
                          <td className="py-3 px-3 font-mono text-[11px]">
                            {plat.url && plat.url !== '#' ? (
                              <div className="flex items-center space-x-1.5">
                                <a
                                  href={plat.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 truncate max-w-[110px]"
                                  title={plat.url}
                                >
                                  <Globe className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                                  <span className="truncate">{plat.url.replace(/^https?:\/\//, '')}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                                <button
                                  onClick={() => copyToClipboard(plat.url, '网址链接', `url-${plat.id}`)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                                  title="复制链接"
                                >
                                  {copiedKey === `url-${plat.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400">内部政务网</span>
                            )}
                          </td>

                          {/* 9. 备注与办事指南 */}
                          <td className="py-3 px-4">
                            {plat.remarks ? (
                              <div>
                                <p className="text-slate-700 leading-relaxed text-[11px] line-clamp-2" title={plat.remarks}>
                                  {plat.remarks}
                                </p>
                                {hasMailingInfo && (
                                  <div className="mt-1 flex items-center space-x-2 text-[10px] text-amber-800 font-medium">
                                    <span className="inline-flex items-center space-x-0.5 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>济南市站前路9号C10窗口</span>
                                    </span>
                                    <span className="inline-flex items-center space-x-0.5 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                      <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span>0531-82083225</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* 10. 经办操作 (Sticky Column) */}
                          <td className="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur-xs shadow-l">
                            <div className="flex items-center justify-center space-x-1.5">
                              {/* 登记登录 */}
                              <button
                                onClick={() => handleOpenLogModal(plat.id)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold flex items-center space-x-0.5 transition-colors"
                                title="登记本次登录经办事项"
                              >
                                <Clock className="w-3 h-3" />
                                <span>登门记录</span>
                              </button>

                              {/* 归档公文 */}
                              <button
                                onClick={() => handleOpenDocModal(plat.id)}
                                className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="归档该机构下发公文/证书"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                              </button>

                              {/* 编辑档案单位 */}
                              <button
                                onClick={() => handleOpenEditUnitModal(plat)}
                                className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                                title="修改单位信息与账号密码"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* 删除 */}
                              <button
                                onClick={() => handleDeleteUnit(plat.id, plat.platformName)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="删除档案单位"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 2. CARD VIEW (ALTERNATIVE) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPlatforms.map((plat) => {
                const isPwdVisible = !!visiblePasswords[plat.id];
                const relatedDocs = documents.filter(d => d.platformId === plat.id);
                const relatedLogs = logs.filter(l => l.platformId === plat.id);

                return (
                  <div
                    key={plat.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Header: ID, Level Badge, Ministry, Actions */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold font-mono">
                            {plat.id}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                              plat.systemLevel === '国家级'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : plat.systemLevel === '省级'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {plat.systemLevel}
                          </span>
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]" title={plat.superiorMinistry}>
                            {plat.superiorMinistry || '主管部门'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {plat.affiliationRelation && (
                            <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {plat.affiliationRelation}
                            </span>
                          )}
                          <button
                            onClick={() => handleOpenEditUnitModal(plat)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                            title="编辑档案单位"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Platform Title */}
                      <div className="mt-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                          <span>{plat.platformName}</span>
                        </h3>
                        {plat.managingAuthority && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>管理机关: {plat.managingAuthority}</span>
                          </p>
                        )}
                      </div>

                      {/* Credential Box (Vault) */}
                      <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        {/* Username Row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center space-x-1 w-20 shrink-0">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>登录账号:</span>
                          </span>
                          <div className="flex items-center space-x-2 flex-1 justify-end font-mono">
                            <span className="font-semibold text-slate-800 select-all truncate max-w-[240px]">
                              {plat.username || '（无固定登录名）'}
                            </span>
                            {plat.username && (
                              <button
                                onClick={() => copyToClipboard(plat.username, '用户名', `user-${plat.id}`)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                title="复制账号"
                              >
                                {copiedKey === `user-${plat.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Password Row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center space-x-1 w-20 shrink-0">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                            <span>登录密码:</span>
                          </span>
                          <div className="flex items-center space-x-2 flex-1 justify-end font-mono">
                            {plat.password ? (
                              <>
                                <span className="font-semibold text-slate-800 select-all">
                                  {isPwdVisible ? plat.password : '••••••••••••'}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(plat.id)}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                  title={isPwdVisible ? '隐藏密码' : '显示密码'}
                                >
                                  {isPwdVisible ? (
                                    <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(plat.password, '密码', `pwd-${plat.id}`)}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                                  title="复制密码"
                                >
                                  {copiedKey === `pwd-${plat.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 italic">（无需密码 / 统一认证）</span>
                            )}
                          </div>
                        </div>

                        {/* URL Row */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 flex items-center space-x-1 w-20 shrink-0">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span>系统网址:</span>
                          </span>
                          <div className="flex items-center space-x-2 flex-1 justify-end font-mono text-[11px] truncate">
                            <a
                              href={plat.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate max-w-[260px] flex items-center space-x-1"
                              title={plat.url}
                            >
                              <span className="truncate">{plat.url.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                            <button
                              onClick={() => copyToClipboard(plat.url, '网址', `url-${plat.id}`)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                              title="复制网址"
                            >
                              {copiedKey === `url-${plat.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Remarks & Special instructions */}
                      {plat.remarks && (
                        <div className="mt-3 text-xs text-slate-600 bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 leading-relaxed">
                          <div className="flex items-start space-x-1.5">
                            <span className="font-semibold text-amber-800 shrink-0">业务指南/备忘:</span>
                            <span className="text-slate-700">{plat.remarks}</span>
                          </div>
                          {plat.remarks.includes('0531') && (
                            <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 flex items-center space-x-3 text-[11px] text-amber-900 font-medium">
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-amber-700" />
                                <span>济南市中区站前路9号C10窗口</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-amber-700" />
                                <span>0531-82083225</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Metadata & Quick Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-3">
                        <span>已归档公文: <strong className="text-slate-700">{relatedDocs.length}</strong></span>
                        <span>经办记录: <strong className="text-slate-700">{relatedLogs.length}</strong></span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenLogModal(plat.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-medium text-xs flex items-center space-x-1 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>记录本次登录</span>
                        </button>
                        <button
                          onClick={() => handleOpenDocModal(plat.id)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-medium text-xs flex items-center space-x-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>归档文件</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: REGULATORY DOCUMENTS ARCHIVE                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'documents' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1" />
                公文性质筛选:
              </span>
              {[
                { id: 'all', label: '全部公文' },
                { id: '许可证照', label: '许可证照' },
                { id: '批复批文', label: '批复批文' },
                { id: '检验报告', label: '检验报告' },
                { id: '备案凭证', label: '备案凭证' },
                { id: '政策法规', label: '政策法规' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedDocCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDocCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleOpenDocModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>归档新公文/许可证照</span>
            </button>
          </div>

          {/* Document Cards List */}
          <div className="space-y-3">
            {filteredDocuments.map(doc => {
              const matchedPlat = platforms.find(p => p.id === doc.platformId);

              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        doc.fileType === 'pdf'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            doc.docCategory === '许可证照'
                              ? 'bg-amber-100 text-amber-800'
                              : doc.docCategory === '批复批文'
                              ? 'bg-indigo-100 text-indigo-800'
                              : doc.docCategory === '检验报告'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {doc.docCategory}
                        </span>
                        <span className="font-mono text-xs text-slate-500 font-semibold">
                          {doc.docNumber}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          发文单位: {doc.managingAuthority}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {doc.docTitle}
                      </h4>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {doc.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                        <span>核发日期: <strong className="text-slate-700">{doc.issueDate}</strong></span>
                        {doc.expiryDate && (
                          <span>有效期至: <strong className="text-emerald-700">{doc.expiryDate}</strong></span>
                        )}
                        <span>归档人: {doc.uploader} ({doc.uploadDate})</span>
                        {matchedPlat && (
                          <span className="text-blue-600">关联平台: {matchedPlat.platformName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Doc Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => showToast(`已启动公文《${doc.docTitle}》(${doc.fileSize}) 下载`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>下载文件 ({doc.fileSize})</span>
                    </button>
                    <button
                      onClick={() => showToast(`已生成公文查阅凭证: ${doc.docNumber}`)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <span>在线查阅</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: ACCESS & OPERATION LOGS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Log Filters & Register Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1" />
                办理状态筛选:
              </span>
              {[
                { id: 'all', label: '全部状态' },
                { id: '办理完成', label: '办理完成' },
                { id: '审核中', label: '审核中' },
                { id: '需补充纸质材料', label: '需补充纸质材料' },
                { id: '待进一步处理', label: '待跟进' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedLogStatus(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedLogStatus === s.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleOpenLogModal()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center space-x-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>登记新的登录经办记录</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-800 text-white font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">登录时间与经办人</th>
                    <th className="py-3 px-4">经办监管平台</th>
                    <th className="py-3 px-4">业务类型</th>
                    <th className="py-3 px-4">经办事项具体内容</th>
                    <th className="py-3 px-4">受理/回执单号</th>
                    <th className="py-3 px-4">办理状态</th>
                    <th className="py-3 px-4">下次跟进/提醒</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => {
                    const matchedPlat = platforms.find(p => p.id === log.platformId);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800">{log.accessTime}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{log.operator}</span>
                            <span className="text-slate-300">·</span>
                            <span>{log.department}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.platformName}</div>
                          {matchedPlat && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {matchedPlat.managingAuthority || matchedPlat.superiorMinistry}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                            {log.actionType}
                          </span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {log.businessSummary}
                          </p>
                          {log.remarks && (
                            <p className="text-[11px] text-amber-700 mt-1 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/50">
                              备忘: {log.remarks}
                            </p>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                          {log.resultReceiptNo ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              {log.resultReceiptNo}
                            </span>
                          ) : (
                            <span className="text-slate-400">（无独立单号）</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              log.status === '办理完成'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === '审核中'
                                ? 'bg-blue-100 text-blue-800'
                                : log.status === '需补充纸质材料'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {log.nextFollowUpDate ? (
                            <div className="flex items-center space-x-1 font-medium text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              <span>{log.nextFollowUpDate}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">日常维护</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New / Edit Unit Modal */}
      <NewPlatformUnitModal
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          setEditingPlatform(null);
        }}
        onSave={handleSaveUnit}
        editingPlatform={editingPlatform}
        existingPlatforms={platforms}
      />

      {/* Log Modal */}
      <NewPlatformLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        platforms={platforms}
        defaultPlatformId={selectedPlatformForModal}
        onSaveLog={handleSaveLog}
      />

      {/* Doc Modal */}
      <NewPlatformDocModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        platforms={platforms}
        defaultPlatformId={selectedPlatformForModal}
        onSaveDoc={handleSaveDoc}
      />
    </div>
  );
};
