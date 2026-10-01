import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Filter, 
  Plus, 
  Printer, 
  Download, 
  Share2, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Tag, 
  ExternalLink, 
  ChevronRight, 
  Layers, 
  Sparkles, 
  FileCheck, 
  X, 
  SlidersHorizontal,
  Bookmark,
  Eye,
  Copy,
  AlertCircle,
  Paperclip,
  ArrowUpRight,
  ListFilter,
  LayoutGrid,
  Columns2,
  Upload,
  Lock,
  GitCommit,
  ArrowRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  History
} from 'lucide-react';
import { 
  RegulationItem, 
  RegulationCategory, 
  RegulationLevel, 
  RegulationStatus, 
  RegulationFilterState 
} from '../types/regulationTypes';
import { 
  getStoredRegulations, 
  saveStoredRegulations, 
  resetStoredRegulations, 
  incrementRegulationReadCount 
} from '../utils/regulationData';
import { AddRegulationModal } from './AddRegulationModal';
import { UploadRegulationPdfModal } from './UploadRegulationPdfModal';
import { RegulationWorkflowViewer } from './RegulationWorkflowViewer';
import { RegulationCompilationPdfModal } from './RegulationCompilationPdfModal';
import { getRegulationWorkflow } from '../utils/regulationWorkflowPresets';
import { ActiveTab, AuthUser } from '../types';
import { getUserDepartment, isHeadNurse, isDepartmentRestricted, canUploadRegulationPdf } from '../utils/authUtils';

interface RegulationsViewProps {
  currentUser?: AuthUser;
  departments?: { name: string }[];
  onNavigateToTab?: (tab: ActiveTab) => void;
  showToast?: (message: string) => void;
}

const CATEGORIES: { id: string; label: string; icon?: string }[] = [
  { id: 'all', label: '全部制度' },
  { id: '法规依据', label: '法规依据' },
  { id: '采购准入', label: '采购准入' },
  { id: '运行维保', label: '运行维保' },
  { id: '计量强检', label: '计量强检' },
  { id: '急救调配', label: '急救调配' },
  { id: '维修闭环', label: '维修闭环' },
  { id: '质控安全', label: '质控安全' },
  { id: '资产处置', label: '资产处置' },
  { id: '外协协同', label: '外协协同' },
  { id: '培训考核', label: '培训考核' },
  { id: '应急预案', label: '应急预案' }
];

const LEVEL_MAP: Record<RegulationLevel, { label: string; color: string }> = {
  national: { label: '国家法规', color: 'bg-red-50 text-red-700 border-red-200' },
  hospital: { label: '院级制度', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  departmental: { label: '科级细则', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  sop: { label: '操作SOP', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  emergency: { label: '应急预案', color: 'bg-amber-50 text-amber-800 border-amber-200' }
};

const STATUS_MAP: Record<RegulationStatus, { label: string; color: string; dot: string }> = {
  active: { label: '现行有效', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  trial: { label: '试行', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  reviewing: { label: '修订中', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  obsolete: { label: '已废止', color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400' }
};

export const RegulationsView: React.FC<RegulationsViewProps> = ({
  currentUser,
  departments = [],
  onNavigateToTab,
  showToast
}) => {
  const userDept = getUserDepartment(currentUser);
  const isNurse = isHeadNurse(currentUser) || isDepartmentRestricted(currentUser);

  // 制度数据集 (持久化存储)
  const [regulations, setRegulations] = useState<RegulationItem[]>(() => {
    return getStoredRegulations();
  });

  // 选中当前阅读查看的制度
  const [selectedRegulationId, setSelectedRegulationId] = useState<string>(() => {
    const list = getStoredRegulations();
    return list[0]?.id || '';
  });

  // 视图模式: 'split' (左右分屏精读) vs 'grid' (卡片平铺)
  const [viewMode, setViewMode] = useState<'split' | 'grid'>('split');

  // 筛选与检索状态
  const [filters, setFilters] = useState<RegulationFilterState>({
    keyword: '',
    category: 'all',
    level: 'all',
    status: 'all',
    department: 'all',
    mustReadAccreditationOnly: false,
    sortBy: 'effectiveDate',
    sortOrder: 'desc'
  });

  // 模态框控制
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState<RegulationItem | null>(null);

  // 管理员权限判断 (允许具备管理员权限的用户上传 PDF 格式的规章制度文件并归档)
  const isAdmin = canUploadRegulationPdf(currentUser);
  const [isUploadPdfModalOpen, setIsUploadPdfModalOpen] = useState(false);
  const [isCompilationPdfModalOpen, setIsCompilationPdfModalOpen] = useState(false);
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState(true);
  const [filterPdfOnly, setFilterPdfOnly] = useState(false);

  // 公文阅读模式: 'text' (规章制度正文) | 'workflow' (配套业务执行流程 SOP)
  const [readerActiveTab, setReaderActiveTab] = useState<'text' | 'workflow'>('text');

  // 是否折叠左侧检索目录栏（进入全宽专注精读模式，防止窄屏或分栏下右侧内容显示不全）
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // 阅读视窗滚动引用与上下滑动快捷控制
  const readerContainerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const handleReaderScroll = () => {
    if (readerContainerRef.current) {
      const { scrollHeight, clientHeight } = readerContainerRef.current;
      setCanScroll(scrollHeight > clientHeight + 20);
    }
  };

  const handleScrollToTop = () => {
    if (readerContainerRef.current) {
      readerContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollToBottom = () => {
    if (readerContainerRef.current) {
      readerContainerRef.current.scrollTo({
        top: readerContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // 监听内容高度变化，自适应激活上下滑动控制条
  useEffect(() => {
    const checkScroll = () => {
      if (readerContainerRef.current) {
        const { scrollHeight, clientHeight } = readerContainerRef.current;
        setCanScroll(scrollHeight > clientHeight + 20);
      }
    };
    const timer = setTimeout(checkScroll, 150);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [selectedRegulationId, readerActiveTab, isListCollapsed]);

  // 学习确认 / 已读打卡记数
  const [studyAcknowledgedIds, setStudyAcknowledgedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('hospital_study_acknowledged_regulations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // 提示信息内部Toast
  const [internalToast, setInternalToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    if (showToast) {
      showToast(msg);
    } else {
      setInternalToast(msg);
      setTimeout(() => setInternalToast(null), 3000);
    }
  };

  // 过滤后的制度列表
  const filteredRegulations = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();

    return regulations.filter(item => {
      // 1. 关键词全文检索
      if (kw) {
        const inTitle = item.title.toLowerCase().includes(kw);
        const inCode = item.code.toLowerCase().includes(kw);
        const inDocNo = item.docNumber.toLowerCase().includes(kw);
        const inKeywords = item.keywords.some(k => k.toLowerCase().includes(kw));
        const inDept = item.applicableDepartments.some(d => d.toLowerCase().includes(kw));
        const inSignatory = item.signatory.toLowerCase().includes(kw);
        const inSummary = item.summary.toLowerCase().includes(kw);
        const inContent = item.content.toLowerCase().includes(kw);

        if (!inTitle && !inCode && !inDocNo && !inKeywords && !inDept && !inSignatory && !inSummary && !inContent) {
          return false;
        }
      }

      // 2. 业务分类过滤
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // 3. 制度层级过滤
      if (filters.level !== 'all' && item.level !== filters.level) {
        return false;
      }

      // 4. 状态过滤
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // 5. 科室适用范围过滤
      if (filters.department !== 'all') {
        const matchDept = item.applicableDepartments.some(d => 
          d.includes(filters.department) || d === '全院临床科室' || d === '全院所有科室'
        );
        if (!matchDept) return false;
      }

      // 6. 仅看等级评审核心
      if (filters.mustReadAccreditationOnly && !item.isMustReadForHospitalAccreditation) {
        return false;
      }

      // 7. 仅看 PDF 归档原件
      if (filterPdfOnly && !item.isArchivedPdf) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'readCount') {
        return (b.readCount || 0) - (a.readCount || 0);
      }
      if (filters.sortBy === 'code') {
        return a.code.localeCompare(b.code);
      }
      if (filters.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // 默认按实施生效时间倒序
      return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
    });
  }, [regulations, filters]);

  // 当前激活的制度详情
  const currentRegulation = useMemo(() => {
    return regulations.find(r => r.id === selectedRegulationId) || filteredRegulations[0] || null;
  }, [regulations, selectedRegulationId, filteredRegulations]);

  // 当选择制度时自动更新阅读热度
  const handleSelectRegulation = (reg: RegulationItem) => {
    setSelectedRegulationId(reg.id);
    const updated = incrementRegulationReadCount(reg.id);
    setRegulations(updated);
    setTimeout(() => {
      if (readerContainerRef.current) {
        readerContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
        const { scrollHeight, clientHeight } = readerContainerRef.current;
        setCanScroll(scrollHeight > clientHeight + 20);
      }
    }, 50);
  };

  // 归档上传 PDF 规章制度文件
  const handleArchivePdfRegulation = (archivedItem: RegulationItem) => {
    const updated = [archivedItem, ...regulations];
    setRegulations(updated);
    saveStoredRegulations(updated);
    setSelectedRegulationId(archivedItem.id);
    triggerToast(`PDF 规章制度《${archivedItem.title.replace(/[《》]/g, '')}》已成功归档并存入制度库！`);
  };

  // 学习签署确认打卡
  const handleToggleStudyAck = (regId: string) => {
    setStudyAcknowledgedIds(prev => {
      const next = new Set(prev);
      if (next.has(regId)) {
        next.delete(regId);
        triggerToast('已取消此制度的学习确认');
      } else {
        next.add(regId);
        triggerToast('已完成制度学习确认！已记入三甲质控宣贯档案');
      }
      try {
        localStorage.setItem('hospital_study_acknowledged_regulations', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // 复制制度正文
  const handleCopyContent = (item: RegulationItem) => {
    const textToCopy = `${item.title}\n发文字号：${item.docNumber} (${item.code})\n发布部门：${item.issuedBy}\n生效施行：${item.effectiveDate}\n\n${item.content}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      triggerToast('制度正文已复制到剪贴板！');
    }).catch(() => {
      triggerToast('复制失败，请手动选择复制');
    });
  };

  // 打印制度公文
  const handlePrintRegulation = (item: RegulationItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      triggerToast('请允许浏览器弹出窗口以打印制度');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${item.title}</title>
          <style>
            body { font-family: "SimSun", "STSong", serif; padding: 40px; color: #111; line-height: 1.8; }
            .redhead { text-align: center; color: #c00; font-size: 26px; font-weight: bold; letter-spacing: 2px; border-bottom: 2px solid #c00; padding-bottom: 12px; margin-bottom: 15px; }
            .doc-info { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 25px; color: #333; }
            .title { text-align: center; font-size: 22px; font-weight: bold; margin: 25px 0; }
            .summary { background: #f9f9f9; border-left: 4px solid #c00; padding: 10px 15px; font-size: 13px; margin-bottom: 25px; }
            .content { font-size: 15px; white-space: pre-wrap; word-break: break-all; }
            .footer { margin-top: 50px; border-top: 1px dashed #999; padding-top: 15px; font-size: 13px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="redhead">五莲县人民医院文件</div>
          <div class="doc-info">
            <span>发文字号：${item.docNumber}</span>
            <span>签发人：${item.signatory}</span>
          </div>
          <div class="title">${item.title}</div>
          <div class="summary"><strong>【核心摘要】</strong>${item.summary}</div>
          <div class="content">${item.content.replace(/### /g, '\n\n■ ').replace(/\*\*/g, '')}</div>
          <div class="footer">
            <span>主送：${item.applicableDepartments.join('、')}</span>
            <span>生效日期：${item.effectiveDate} (版本号 ${item.version})</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // 打开修订制度弹窗
  const handleOpenEditModal = (item: RegulationItem) => {
    setEditingRegulation(item);
    setIsAddModalOpen(true);
  };

  // 保存新增或修订制度
  const handleSaveRegulation = (savedItem: RegulationItem) => {
    let updated: RegulationItem[];
    const exists = regulations.some(r => r.id === savedItem.id);
    if (exists) {
      updated = regulations.map(r => r.id === savedItem.id ? savedItem : r);
      triggerToast(`制度《${savedItem.title.replace(/[《》]/g, '')}》修订已保存`);
    } else {
      updated = [savedItem, ...regulations];
      triggerToast(`新规章制度《${savedItem.title.replace(/[《》]/g, '')}》已存入制度库`);
    }
    setRegulations(updated);
    saveStoredRegulations(updated);
    setSelectedRegulationId(savedItem.id);
  };

  // 删除制度
  const handleDeleteRegulation = (id: string, title: string) => {
    if (!window.confirm(`确认要删除制度《${title.replace(/[《》]/g, '')}》吗？此操作不可撤销。`)) {
      return;
    }
    const next = regulations.filter(r => r.id !== id);
    setRegulations(next);
    saveStoredRegulations(next);
    triggerToast('制度档案已移除');
    if (selectedRegulationId === id && next.length > 0) {
      setSelectedRegulationId(next[0].id);
    }
  };

  // 恢复默认初始制度库
  const handleResetToDefault = () => {
    if (window.confirm('确认要重置恢复为医院标准18项核心制度库吗？自定义新增的制度将被初始化覆盖。')) {
      const defs = resetStoredRegulations();
      setRegulations(defs);
      setSelectedRegulationId(defs[0]?.id || '');
      triggerToast('已恢复为三甲医院标准18项管理规章制度库！');
    }
  };

  // 导出全院制度汇编清单
  const handleExportCatalogue = () => {
    const rows = [
      ['序号', '制度编码', '发文字号', '制度全称', '业务分类', '制度层级', '执行状态', '生效施行日期', '签发审批人', '等级评审核心', '适用科室']
    ];
    filteredRegulations.forEach((r, idx) => {
      rows.push([
        String(idx + 1),
        r.code,
        r.docNumber,
        r.title,
        r.category,
        LEVEL_MAP[r.level]?.label || r.level,
        STATUS_MAP[r.status]?.label || r.status,
        r.effectiveDate,
        r.signatory,
        r.isMustReadForHospitalAccreditation ? '是' : '否',
        r.applicableDepartments.join(';')
      ]);
    });

    const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `五莲县人民医院_医学装备管理规章制度总目录_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast('已成功导出制度总目录清单！');
  };

  // 统计指标
  const stats = useMemo(() => {
    const total = regulations.length;
    const activeCount = regulations.filter(r => r.status === 'active').length;
    const mustReadCount = regulations.filter(r => r.isMustReadForHospitalAccreditation).length;
    const pdfCount = regulations.filter(r => r.isArchivedPdf).length;
    const emergencyCount = regulations.filter(r => r.level === 'emergency' || r.category === '急救调配' || r.category === '应急预案').length;
    const completedAckCount = regulations.filter(r => studyAcknowledgedIds.has(r.id)).length;
    return {
      total,
      activeCount,
      mustReadCount,
      pdfCount,
      emergencyCount,
      completedAckCount,
      ackRate: total > 0 ? Math.round((completedAckCount / total) * 100) : 0
    };
  }, [regulations, studyAcknowledgedIds]);

  // 平滑滚动到正文章节 (适配右侧精读滚动视窗)
  const scrollToChapter = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el && readerContainerRef.current) {
      const containerRect = readerContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetTop = elRect.top - containerRect.top + readerContainerRef.current.scrollTop - 24;
      readerContainerRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' });
    } else if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 关键词高亮渲染助手兼 Markdown ** 格式清理转换
  const renderHighlightedText = (text: string, kw: string) => {
    // 首先处理 Markdown 粗体 **内容**
    const formatBoldAndKw = (chunk: string) => {
      if (!chunk.includes('**')) {
        return highlightKw(chunk, kw);
      }
      const boldSegments = chunk.split(/(\*\*[^*]+\*\*)/g);
      return (
        <>
          {boldSegments.map((seg, sIdx) => {
            if (seg.startsWith('**') && seg.endsWith('**')) {
              const pure = seg.slice(2, -2);
              return (
                <strong key={sIdx} className="font-bold text-slate-900 tracking-tight">
                  {highlightKw(pure, kw)}
                </strong>
              );
            }
            return <React.Fragment key={sIdx}>{highlightKw(seg, kw)}</React.Fragment>;
          })}
        </>
      );
    };

    const highlightKw = (content: string, keyword: string) => {
      if (!keyword.trim()) return content;
      const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = content.split(regex);
      return (
        <>
          {parts.map((part, i) => 
            regex.test(part) ? (
              <mark key={i} className="bg-amber-200 text-amber-900 rounded-xs px-0.5 font-bold">
                {part}
              </mark>
            ) : part
          )}
        </>
      );
    };

    return formatBoldAndKw(text);
  };

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col h-full bg-slate-100/70 overflow-hidden">
      {/* 顶部醒目统计看板与操作 Bar */}
      <div className="bg-white border-b border-slate-200/90 px-5 py-3.5 shrink-0 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 左侧概览指示 */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900">
                    {isNurse && userDept ? `【${userDept}】医学装备管理制度与规程` : '医学装备管理规章制度中心'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    全院技术法治标准
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  覆盖国家药监法规、院级规程、PM强检细则、不良事件警戒与急救调配SOP，支持一键全文检索与业务互通
                </p>
              </div>
            </div>

            {/* KPI 统计指标 Pills */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
                <span className="text-slate-500">在册制度:</span>
                <span className="font-bold text-slate-900">{stats.total}</span>
                <span className="text-[10px] text-emerald-600 font-semibold">({stats.activeCount}项现行有效)</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-800">等级评审核心:</span>
                <span className="font-bold text-amber-900">{stats.mustReadCount} 项</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-red-50/70 border border-red-200/80 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-800">PDF归档:</span>
                <span className="font-bold text-red-900">{stats.pdfCount} 份</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-indigo-800">学习确认:</span>
                <span className="font-bold text-indigo-900">{stats.completedAckCount} 项</span>
                <span className="text-[10px] text-indigo-600 font-semibold">({stats.ackRate}%)</span>
              </div>
            </div>
          </div>

          {/* 右侧操作按钮群 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 视图切换 */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'split' 
                    ? 'bg-white text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="双屏分栏精读模式 (左侧检索，右侧全文)"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>精读分栏</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-700 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="网格卡片视图模式"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>卡片全览</span>
              </button>
            </div>

            {/* 一键整理全套制度为标准规范 PDF 汇编册 */}
            <button
              type="button"
              onClick={() => setIsCompilationPdfModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ring-1 ring-blue-500/50 cursor-pointer"
              title="一键将全院制度整理汇编为符合三甲规范的完整 PDF 电子文集，含红头、目录、正文与SOP流程"
            >
              <FileText className="w-3.5 h-3.5 text-blue-200" />
              <span>制度汇编 PDF</span>
            </button>

            {/* 导出汇编总目录 */}
            <button
              type="button"
              onClick={handleExportCatalogue}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="导出当前筛选制度目录CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">导出目录</span>
            </button>

            {/* 重置初始库 (系统管理) */}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs transition-colors shadow-2xs"
              title="恢复为标准三甲制度库"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* 管理员专属：上传 PDF 格式规章制度文件归档 */}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsUploadPdfModalOpen(true)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ring-1 ring-red-400/40"
                title="具备管理员权限：上传 PDF 格式规章制度文件，录入标题、适用部门和发布日期进行正式归档"
              >
                <Upload className="w-4 h-4" />
                <span>归档 PDF 制度</span>
              </button>
            ) : (
              <div 
                className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs flex items-center gap-1 cursor-not-allowed select-none"
                title="仅具备管理员权限的用户方可上传并归档 PDF 格式制度文件"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">PDF归档(限管理员)</span>
              </div>
            )}

            {/* 存放新制度 / 录入制度按钮 */}
            <button
              type="button"
              onClick={() => {
                setEditingRegulation(null);
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>存放 / 录入新制度</span>
            </button>
          </div>
        </div>

        {/* 综合多维搜索与筛选控制台 */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* 实时全局关键词输入框 */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.keyword}
              onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              placeholder="智能检索制度名称、发文字号、条款正文、适用科室或签发人..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-300/90 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
            />
            {filters.keyword && (
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, keyword: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 筛选下拉群 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* 制度层级 */}
            <select
              value={filters.level}
              onChange={e => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
            >
              <option value="all">全部层级</option>
              <option value="national">国家法规准则</option>
              <option value="hospital">院级规章制度</option>
              <option value="departmental">医工科级细则</option>
              <option value="sop">临床操作SOP</option>
              <option value="emergency">应急突发预案</option>
            </select>

            {/* 状态筛选 */}
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
            >
              <option value="all">全部状态</option>
              <option value="active">现行有效</option>
              <option value="trial">试行中</option>
              <option value="reviewing">修订研讨中</option>
              <option value="obsolete">已废止</option>
            </select>

            {/* 适用科室筛选 */}
            <select
              value={filters.department}
              onChange={e => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
            >
              <option value="all">全部责任科室</option>
              <option value="医学工程保障中心">医学工程保障中心</option>
              <option value="全院临床科室">全院临床科室</option>
              <option value="急诊重症监护室">急危重症监护中心</option>
              <option value="手术麻醉中心">手术麻醉中心</option>
              <option value="医学影像科">医学影像科</option>
              <option value="检验科">医学检验中心</option>
              <option value="财务科">财务资产部门</option>
              <option value="招标采购办公室">招标采购管理</option>
            </select>

            {/* 排序方式 */}
            <select
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs"
            >
              <option value="effectiveDate">按施行时间排序</option>
              <option value="readCount">按查阅热度排序</option>
              <option value="code">按编号顺序排序</option>
              <option value="title">按制度字顺排序</option>
            </select>

            {/* 快捷按钮：等级评审核心 */}
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, mustReadAccreditationOnly: !prev.mustReadAccreditationOnly }))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all border ${
                filters.mustReadAccreditationOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50 shadow-2xs'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>等级评审核心 ({stats.mustReadCount})</span>
            </button>

            {/* 快捷按钮：PDF 归档原件 */}
            <button
              type="button"
              onClick={() => setFilterPdfOnly(!filterPdfOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all border ${
                filterPdfOnly
                  ? 'bg-red-600 text-white border-red-700 shadow-xs'
                  : 'bg-white text-red-700 border-red-200 hover:bg-red-50 shadow-2xs'
              }`}
              title="快速筛选已归档的 PDF 格式规章制度文件"
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              <span>PDF原件 ({stats.pdfCount})</span>
            </button>
          </div>
        </div>

        {/* 分类切换 Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto mt-2.5 pt-1 no-scrollbar text-xs">
          {CATEGORIES.map(cat => {
            const isSelected = filters.category === cat.id;
            const count = cat.id === 'all' 
              ? regulations.length 
              : regulations.filter(r => r.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, category: cat.id }))}
                className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 主展示区 */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
        {viewMode === 'split' ? (
          /* ================= 双屏分栏精读模式 ================= */
          <div className="flex-1 min-h-0 min-w-0 flex w-full h-full overflow-hidden">
            {/* 左栏：检索列表 (固定宽度或响应式) */}
            <div className={`${isListCollapsed ? 'hidden' : 'flex'} ${
              currentRegulation ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 lg:w-[380px] xl:w-[420px] bg-white border-r border-slate-200/90 flex-col shrink-0 h-full min-h-0 overflow-hidden transition-all`}>
              {/* 列表头部检索结果统计 */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                <span>
                  共匹配到 <strong className="text-slate-800 font-bold">{filteredRegulations.length}</strong> 项制度规程
                </span>
                {filters.keyword && (
                  <span className="text-blue-600 font-medium truncate max-w-[150px]">
                    检索: "{filters.keyword}"
                  </span>
                )}
              </div>

              {/* 制度卡片列表 */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5 custom-scrollbar">
                {filteredRegulations.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 px-4">
                    <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">未检索到匹配的制度</p>
                    <p className="text-[11px] text-slate-400 mt-1">请尝试更换检索关键词或清空分类筛选条件</p>
                    <button
                      type="button"
                      onClick={() => setFilters({
                        keyword: '',
                        category: 'all',
                        level: 'all',
                        status: 'all',
                        department: 'all',
                        mustReadAccreditationOnly: false,
                        sortBy: 'effectiveDate',
                        sortOrder: 'desc'
                      })}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      清空所有筛选
                    </button>
                  </div>
                ) : (
                  filteredRegulations.map(reg => {
                    const isSelected = reg.id === currentRegulation?.id;
                    const levelMeta = LEVEL_MAP[reg.level] || { label: reg.level, color: 'bg-slate-50 text-slate-700' };
                    const statusMeta = STATUS_MAP[reg.status] || { label: reg.status, color: 'bg-slate-50 text-slate-700', dot: 'bg-slate-400' };
                    const isAcked = studyAcknowledgedIds.has(reg.id);

                    return (
                      <div
                        key={reg.id}
                        onClick={() => handleSelectRegulation(reg)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-400/90 shadow-sm ring-1 ring-blue-400/50'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 shadow-2xs'
                        }`}
                      >
                        {/* 顶栏徽章 */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-500">
                              {reg.code}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${levelMeta.color}`}>
                              {levelMeta.label}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${statusMeta.color} flex items-center gap-1`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                              {statusMeta.label}
                            </span>
                            {reg.isArchivedPdf && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5 shrink-0">
                                <FileText className="w-2.5 h-2.5" />
                                <span>PDF</span>
                              </span>
                            )}
                            <span 
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5 shrink-0"
                              title={`配套 ${getRegulationWorkflow(reg).steps.length} 个闭环执行环节SOP`}
                            >
                              <GitCommit className="w-2.5 h-2.5" />
                              <span>SOP流程</span>
                            </span>
                          </div>

                          {reg.isMustReadForHospitalAccreditation && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                              等级评审核心
                            </span>
                          )}
                        </div>

                        {/* 标题 */}
                        <h3 className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isSelected ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-600'
                        }`}>
                          {renderHighlightedText(reg.title, filters.keyword)}
                        </h3>

                        {/* 摘要 */}
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {renderHighlightedText(reg.summary, filters.keyword)}
                        </p>

                        {/* 关键词与底部指标 */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-500 font-medium">{reg.docNumber}</span>
                            <span>·</span>
                            <span>{reg.effectiveDate}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isAcked && (
                              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>已学</span>
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3" />
                              <span>{reg.readCount}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(reg);
                              }}
                              className="px-2 py-0.5 rounded text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="编辑修改制度全项信息"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>编辑</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 右栏：红头标准公文精读窗口 (支持自适应全宽、窄屏折叠与横向无截断滚动) */}
            <div 
              ref={readerContainerRef}
              onScroll={handleReaderScroll}
              className={`flex-1 min-w-0 w-full h-full min-h-0 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-2 sm:p-4 lg:p-6 flex flex-col items-center transition-all regulation-reader-scroll relative ${
                !currentRegulation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {currentRegulation ? (
                <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden flex flex-col min-w-0 shrink-0 mb-12">
                  {/* 公文顶部工具栏 (自适应换行，避免窄屏按钮溢出截断) */}
                  <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 flex-wrap">
                      {/* 移动端返回目录 */}
                      <button
                        type="button"
                        onClick={() => setSelectedRegulationId('')}
                        className="md:hidden px-2.5 py-1 bg-slate-200/90 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="返回制度检索目录"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>目录</span>
                      </button>

                      {/* 宽屏/专注精读切换 */}
                      <button
                        type="button"
                        onClick={() => setIsListCollapsed(prev => !prev)}
                        className="hidden md:flex px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium items-center gap-1.5 transition-colors shadow-2xs"
                        title={isListCollapsed ? '展开左侧制度目录列表' : '收起左侧列表，全宽专注精读'}
                      >
                        {isListCollapsed ? (
                          <>
                            <PanelLeftOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-blue-700 font-semibold">展开目录</span>
                          </>
                        ) : (
                          <>
                            <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />
                            <span>全宽阅读</span>
                          </>
                        )}
                      </button>

                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-800">{currentRegulation.code}</span>
                      <span className="text-slate-300 hidden sm:inline">|</span>
                      <span className="hidden sm:inline">版本: <strong className="font-semibold text-slate-800">{currentRegulation.version}</strong></span>
                      <span className="text-slate-300 hidden md:inline">|</span>
                      <span className="hidden md:inline">最近修订: {currentRegulation.revisionDate || currentRegulation.effectiveDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 学习打卡 */}
                      <button
                        type="button"
                        onClick={() => handleToggleStudyAck(currentRegulation.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors border ${
                          studyAcknowledgedIds.has(currentRegulation.id)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        title="标记此制度为本科室已宣贯学习"
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${studyAcknowledgedIds.has(currentRegulation.id) ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{studyAcknowledgedIds.has(currentRegulation.id) ? '已宣贯学习' : '学习确认打卡'}</span>
                      </button>

                      {/* 复制 */}
                      <button
                        type="button"
                        onClick={() => handleCopyContent(currentRegulation)}
                        className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors"
                        title="复制全文"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* 打印 */}
                      <button
                        type="button"
                        onClick={() => handlePrintRegulation(currentRegulation)}
                        className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors"
                        title="打印红头公文样式"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* 核心动作：编辑/修订此制度 */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(currentRegulation)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs"
                        title="编辑修改制度全称、发文字号、条款正文、适用科室与版本记录"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>编辑此制度</span>
                      </button>

                      {/* 删除 */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRegulation(currentRegulation.id, currentRegulation.title)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="废止/删除此制度"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 模式选择：【制度正文公文】 vs 【配套执行流程 (SOP)】 */}
                  <div className="px-6 py-2.5 bg-gradient-to-r from-slate-100 via-slate-50 to-blue-50/50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
                    <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs">
                      <button
                        type="button"
                        onClick={() => setReaderActiveTab('text')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                          readerActiveTab === 'text'
                            ? 'bg-white text-blue-700 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>制度公文正文</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReaderActiveTab('workflow')}
                        className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                          readerActiveTab === 'workflow'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>配套业务执行流程 (SOP)</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-400 text-slate-950 font-bold">
                          {getRegulationWorkflow(currentRegulation).steps.length} 环节
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="hidden sm:inline">三甲评审标准：</span>
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        制度立规 · 流程导引 · 表单留痕
                      </span>
                    </div>
                  </div>

                  {/* 模式渲染分发：配套业务流程 SOP vs 制度正文公文 */}
                  {readerActiveTab === 'workflow' ? (
                    <div className="p-3 sm:p-6 lg:p-8 min-w-0 w-full">
                      <RegulationWorkflowViewer
                        regulation={currentRegulation}
                        onNavigateToTab={onNavigateToTab}
                        showToast={triggerToast}
                      />
                    </div>
                  ) : (
                    <>
                      {/* 官方标准红头文头 */}
                      <div className="p-4 sm:p-8 lg:p-10 border-b border-slate-100 min-w-0">
                    <div className="text-center pb-5 border-b-2 border-red-600">
                      <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-widest text-red-600">
                        五莲县人民医院文件
                      </h2>
                      <div className="mt-3 flex items-center justify-between text-xs font-serif text-slate-700 flex-wrap gap-2">
                        <span className="font-semibold">发文字号：{currentRegulation.docNumber}</span>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>签发审批人：</span>
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {currentRegulation.signatory}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(currentRegulation)}
                            className="text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 ml-1 cursor-pointer font-sans font-semibold flex items-center gap-1 transition-colors"
                            title="修改签发审批人、发文字号与制度各项属性"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>修改</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 制度主标题与属性 */}
                    <div className="mt-8 text-center">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                        {renderHighlightedText(currentRegulation.title, filters.keyword)}
                      </h1>
                      
                      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${LEVEL_MAP[currentRegulation.level]?.color}`}>
                          {LEVEL_MAP[currentRegulation.level]?.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          分类：{currentRegulation.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold border ${STATUS_MAP[currentRegulation.status]?.color}`}>
                          {STATUS_MAP[currentRegulation.status]?.label}
                        </span>
                        {currentRegulation.isMustReadForHospitalAccreditation && (
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            三甲综合医院评审核心必查
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 核心制度摘要框 */}
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 text-xs leading-relaxed">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span>核心制度要义与执行摘要</span>
                      </div>
                      <p className="text-slate-700">
                        {renderHighlightedText(currentRegulation.summary, filters.keyword)}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-blue-200/50 flex items-center justify-between text-[11px] text-slate-500">
                        <span>发布机构：{currentRegulation.issuedBy}</span>
                        <span>施行生效日期：{currentRegulation.effectiveDate}</span>
                      </div>
                    </div>

                    {/* 配套标准化执行流程 (SOP) 快速导引卡片 */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <GitCommit className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">
                              配套业务标准化流转流程 (SOP)
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                              三甲互证闭环
                            </span>
                          </div>
                          <p className="text-blue-700 text-[11px] mt-0.5">
                            已明确 <strong>{getRegulationWorkflow(currentRegulation).steps.length} 个岗位责任流转环节</strong>、基准 SLA 时限及法定留痕制式表单
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReaderActiveTab('workflow')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                      >
                        <span>查看配套流程图</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 适用科室范围 */}
                    <div className="mt-4 flex items-start gap-2 text-xs">
                      <span className="font-bold text-slate-700 shrink-0 mt-0.5">适用责任范围：</span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentRegulation.applicableDepartments.map((dept, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* PDF 归档件专属查阅横幅与嵌入式阅读器 */}
                    {currentRegulation.isArchivedPdf && (
                      <div className="mt-5 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50/70 to-slate-50 border border-red-200/80 p-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                              PDF
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">
                                  {currentRegulation.pdfFileName || `${currentRegulation.title}.pdf`}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  官方PDF归档件
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                归档大小: <strong className="text-slate-700">{currentRegulation.pdfFileSize || '2.8 MB'}</strong> · 具备医院官方正式红头红印与发文效力
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {currentRegulation.pdfFileUrl && (
                              <button
                                type="button"
                                onClick={() => setShowEmbeddedPdf(!showEmbeddedPdf)}
                                className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{showEmbeddedPdf ? '收起在线PDF' : '在线查阅PDF'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (currentRegulation.pdfFileUrl) {
                                  const link = document.createElement('a');
                                  link.href = currentRegulation.pdfFileUrl;
                                  link.download = currentRegulation.pdfFileName || `${currentRegulation.title}.pdf`;
                                  link.click();
                                  triggerToast(`已下载官方 PDF 规章制度原件: ${currentRegulation.pdfFileName || currentRegulation.title}`);
                                } else {
                                  triggerToast(`已下载官方 PDF 规章制度原件: ${currentRegulation.pdfFileName || currentRegulation.title}`);
                                }
                              }}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>下载PDF原件</span>
                            </button>
                          </div>
                        </div>

                        {/* 嵌入式 PDF 在线查阅视窗 */}
                        {showEmbeddedPdf && currentRegulation.pdfFileUrl && (
                          <div className="mt-4 border border-red-200/90 rounded-xl overflow-hidden bg-slate-900 shadow-md">
                            <div className="px-4 py-2 bg-slate-800 text-slate-300 text-xs flex items-center justify-between border-b border-slate-700">
                              <span className="flex items-center gap-2 font-medium">
                                <FileText className="w-3.5 h-3.5 text-red-400" />
                                <span>PDF 官方原件高清阅读器</span>
                              </span>
                              <a
                                href={currentRegulation.pdfFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                              >
                                <span>全屏新标签页打开</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <iframe
                              src={currentRegulation.pdfFileUrl}
                              title="PDF Viewer"
                              className="w-full h-[640px] sm:h-[720px] lg:h-[800px] border-0 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 关联系统模块高亮跳转卡片 */}
                    {currentRegulation.linkedSystemTab && (
                      <div className="mt-5 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                              <span>联动系统功能：【{currentRegulation.linkedSystemTab.label}】</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-900 font-normal">
                                在线闭环执行
                              </span>
                            </div>
                            <p className="text-emerald-700 text-[11px] mt-0.5">
                              {currentRegulation.linkedSystemTab.description}
                            </p>
                          </div>
                        </div>

                        {onNavigateToTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab(currentRegulation.linkedSystemTab!.tab)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs shrink-0"
                          >
                            <span>前往办理</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 章节目录快捷锚点导航 (若有多章节) - 增大高度与内边距，消除窄高与溢出截断 */}
                  {currentRegulation.tableOfContents && currentRegulation.tableOfContents.length > 1 && (
                    <div className="px-4 sm:px-8 lg:px-10 py-3.5 sm:py-4 bg-slate-50 border-b border-slate-200/90 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs min-h-[58px] transition-all">
                      <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                        <span>章节导航:</span>
                      </span>
                      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        {currentRegulation.tableOfContents.map((toc, idx) => (
                          <button
                            key={toc.id || idx}
                            type="button"
                            onClick={() => scrollToChapter(`chap-${idx}`)}
                            className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-lg text-slate-700 hover:text-blue-700 font-medium text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 inline-block" />
                            <span>{toc.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 正文条款全文 - 增加充足阅读高度与舒适行距 */}
                  <div className="p-6 sm:p-10 lg:p-12 flex-1 min-h-[480px] space-y-6 text-sm text-slate-800 leading-loose font-normal break-words min-w-0">
                    {currentRegulation.content.split('\n\n').map((block, idx) => {
                      const trimmed = block.trim();
                      if (trimmed.startsWith('### ')) {
                        const headingText = trimmed.replace('### ', '');
                        return (
                          <div 
                            key={idx} 
                            id={`chap-${idx}`} 
                            className="pt-4 border-t border-slate-100 first:pt-0 first:border-0"
                          >
                            <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
                              <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
                              <span>{renderHighlightedText(headingText, filters.keyword)}</span>
                            </h3>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-justify text-slate-700 leading-relaxed indent-7">
                          {renderHighlightedText(trimmed, filters.keyword)}
                        </p>
                      );
                    })}
                  </div>

                  {/* 正文文末修订与维护提示条 */}
                  <div className="mx-6 sm:mx-10 lg:mx-12 mb-6 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          本制度现行有效（当前版本：{currentRegulation.version || 'v1.0'}）
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          若工作流程变动、法规更新或责任科室调整，可随时编辑正文条款并自动归档修订版本台账
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(currentRegulation)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
                      title="进入制度编辑窗口，修改正文或添加修订记录"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>修订制度正文与版本</span>
                    </button>
                  </div>

                  {/* 附件与配套表单下载区 */}
                  {currentRegulation.attachments && currentRegulation.attachments.length > 0 && (
                    <div className="p-4 sm:p-8 lg:p-10 bg-slate-50/70 border-t border-slate-200 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-blue-600" />
                          <span>配套执行表单 / 附件规范 (点击下载或打印)</span>
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          共 {currentRegulation.attachments.length} 份标准附件
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentRegulation.attachments.map(att => (
                          <div
                            key={att.id}
                            className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:border-blue-300 transition-colors shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] uppercase shrink-0 border border-blue-100">
                                {att.type}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                  {att.name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  文件大小: {att.size}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => triggerToast(`正在下载表单模板: ${att.name}`)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                            >
                              <Download className="w-3 h-3" />
                              <span>下载</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 制度修订记录与版本台账 (支持历次审批签发与要点查看) */}
                  <div className="p-4 sm:p-8 lg:p-10 bg-slate-50/50 border-t border-slate-200 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        <span>制度修订记录与版本沿革台账</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(currentRegulation)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                      >
                        编辑/新增修订记录
                      </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3.5 w-18">版本</th>
                            <th className="py-2.5 px-3.5 w-28">修订生效日期</th>
                            <th className="py-2.5 px-3.5 w-32">签发审批人</th>
                            <th className="py-2.5 px-3.5">主要修订变更内容与说明</th>
                            <th className="py-2.5 px-3.5 w-24 text-center">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(currentRegulation.revisionHistory && currentRegulation.revisionHistory.length > 0
                            ? currentRegulation.revisionHistory
                            : [
                                {
                                  version: currentRegulation.version || 'v1.0',
                                  date: currentRegulation.revisionDate || currentRegulation.effectiveDate || '2026-01-01',
                                  approver: currentRegulation.signatory || '主管业务副院长',
                                  author: currentRegulation.issuedBy || '医学工程保障中心',
                                  summary: '制度初始发布施行，经院医工管理委员会审议通过。'
                                }
                              ]
                          ).map((rev, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3.5 font-mono font-bold text-blue-700">{rev.version}</td>
                              <td className="py-2.5 px-3.5 text-slate-600 font-mono">{rev.date}</td>
                              <td className="py-2.5 px-3.5 font-medium text-slate-800">{rev.approver || '-'}</td>
                              <td className="py-2.5 px-3.5 text-slate-600 leading-relaxed">{rev.summary}</td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  有效
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 公文落款 */}
                  <div className="p-4 sm:p-8 lg:p-10 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 min-w-0">
                    <div>
                      <p>主办责任科室：{currentRegulation.issuedBy}</p>
                      <p className="mt-0.5">送达范围：全院各病区、门急诊、医技科室及医学工程科全员遵照执行</p>
                    </div>
                    <div className="text-right sm:text-right font-serif">
                      <p className="font-bold text-slate-800">五莲县人民医院</p>
                      <p className="mt-0.5">{currentRegulation.effectiveDate}</p>
                    </div>
                  </div>
                  </>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 p-6 text-center">
                  <div>
                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">请选择左侧制度卡片查看详细公文内容</p>
                    <p className="text-xs text-slate-400 mt-1">支持正文精读、配套执行流转SOP与法定表单规范查阅</p>
                    {isListCollapsed && (
                      <button
                        type="button"
                        onClick={() => setIsListCollapsed(false)}
                        className="mt-3.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <PanelLeftOpen className="w-3.5 h-3.5" />
                        <span>展开制度目录列表</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 浮动上下滑动便捷操作条 (一键直达公文顶部/底部，解决长文档滚动浏览痛点) */}
              {currentRegulation && canScroll && (
                <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 flex flex-col gap-1.5 shadow-lg rounded-full bg-white/95 p-1.5 border border-slate-300/80 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={handleScrollToTop}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center group"
                    title="滑动回公文顶部"
                  >
                    <ArrowUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                  </button>
                  <div className="w-4 h-[1px] bg-slate-200 mx-auto" />
                  <button
                    type="button"
                    onClick={handleScrollToBottom}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center group"
                    title="滑动到公文底部"
                  >
                    <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= 网格卡片全览模式 ================= */
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  共呈现 <strong className="text-slate-800 font-bold">{filteredRegulations.length}</strong> 项规章制度
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRegulations.map(reg => {
                  const levelMeta = LEVEL_MAP[reg.level] || { label: reg.level, color: 'bg-slate-50 text-slate-700' };
                  const statusMeta = STATUS_MAP[reg.status] || { label: reg.status, color: 'bg-slate-50 text-slate-700', dot: 'bg-slate-400' };
                  const isAcked = studyAcknowledgedIds.has(reg.id);

                  return (
                    <div
                      key={reg.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all p-5 flex flex-col justify-between group"
                    >
                      <div>
                        {/* 顶栏徽章 */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {reg.code}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${levelMeta.color}`}>
                              {levelMeta.label}
                            </span>
                            {reg.isArchivedPdf && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                                <FileText className="w-2.5 h-2.5" />
                                <span>PDF</span>
                              </span>
                            )}
                            {reg.isMustReadForHospitalAccreditation && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                等级评审核心
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 制度标题 */}
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                          {renderHighlightedText(reg.title, filters.keyword)}
                        </h3>

                        {/* 发文字号与生效日期 */}
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>{reg.docNumber}</span>
                          <span>·</span>
                          <span>生效: {reg.effectiveDate}</span>
                        </p>

                        {/* 核心摘要 */}
                        <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                          {renderHighlightedText(reg.summary, filters.keyword)}
                        </p>

                        {/* 标签 */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {reg.keywords.slice(0, 3).map((kw, i) => (
                            <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 底部操作区 */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {isAcked ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              已学
                            </span>
                          ) : (
                            <span>未打卡</span>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            {reg.readCount}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegulationId(reg.id);
                              setViewMode('split');
                              setReaderActiveTab('workflow');
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            title="查看配套 SOP 流转流程图与岗位矩阵"
                          >
                            <GitCommit className="w-3.5 h-3.5" />
                            <span>流程图</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRegulationId(reg.id);
                              setViewMode('split');
                              setReaderActiveTab('text');
                            }}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <span>阅读正文</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 存放新制度 / 修订制度模态框 */}
      <AddRegulationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRegulation(null);
        }}
        onSave={handleSaveRegulation}
        initialData={editingRegulation}
      />

      {/* 管理员专属：上传 PDF 格式规章制度文件归档模态框 */}
      <UploadRegulationPdfModal
        isOpen={isUploadPdfModalOpen}
        onClose={() => setIsUploadPdfModalOpen(false)}
        onArchive={handleArchivePdfRegulation}
        isAdmin={isAdmin}
        departments={departments}
      />

      {/* 一键全套规章制度与标准SOP PDF 汇编导出模态框 */}
      <RegulationCompilationPdfModal
        isOpen={isCompilationPdfModalOpen}
        onClose={() => setIsCompilationPdfModalOpen(false)}
        regulations={regulations}
      />

      {/* 内部 Toast 提示 */}
      {internalToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/90 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 backdrop-blur-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{internalToast}</span>
        </div>
      )}
    </div>
  );
};
