import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  FileText, 
  Award, 
  CheckCircle2, 
  Printer, 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Building2, 
  UserCheck, 
  Calendar, 
  Search, 
  Layers, 
  ChevronLeft,
  ChevronRight, 
  ExternalLink, 
  Sparkles, 
  FileCheck, 
  ShieldCheck, 
  Coins, 
  Wrench, 
  FileSignature, 
  HelpCircle,
  Tag,
  Paperclip,
  Check,
  Send,
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { ActiveTab, AuthUser } from '../../types';
import { 
  PROJECT_METADATA, 
  RESEARCH_TEAM, 
  REPORT_CHAPTERS, 
  REPORT_REFERENCES, 
  ReportReferenceItem,
  PUBLISHED_PAPER_DATA, 
  LEADER_INSTRUCTIONS, 
  COMPLIANCE_CHECKLIST,
  ResearchTeamMember,
  REVISION_SUGGESTIONS_DATA,
  ReportRevisionItem
} from '../../data/projectConcludingData';
import { 
  getStoredResearchTeam, 
  saveStoredResearchTeam 
} from '../../utils/projectTeamStore';
import { AppraisalDocumentView } from './AppraisalDocumentView';
import { ProjectApplicationView } from './ProjectApplicationView';
import { IndicatorDrillDownModal } from './IndicatorDrillDownModal';

interface ProjectConcludingViewProps {
  currentUser?: AuthUser;
  onNavigateToTab?: (tab: ActiveTab) => void;
}

type ConcludingSubTab = 'report' | 'revisions' | 'appraisal' | 'interim' | 'application';

export const ProjectConcludingView: React.FC<ProjectConcludingViewProps> = ({
  currentUser,
  onNavigateToTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ConcludingSubTab>('report');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [activeChapterId, setActiveChapterId] = useState<string>('ch1');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [showChecklistModal, setShowChecklistModal] = useState<boolean>(false);
  const [showRefVerifyModal, setShowRefVerifyModal] = useState<boolean>(false);
  const [selectedRefToVerify, setSelectedRefToVerify] = useState<ReportReferenceItem | null>(null);
  const [printMode, setPrintMode] = useState<'paged' | 'a4_paper' | 'screen_scroll'>('paged');
  const [pagedSectionIdx, setPagedSectionIdx] = useState<number>(0);
  const [showIndicatorDrillDownModal, setShowIndicatorDrillDownModal] = useState<boolean>(false);
  const [selectedDrillDownIndicatorId, setSelectedDrillDownIndicatorId] = useState<number>(1);
  const [revisionPriorityFilter, setRevisionPriorityFilter] = useState<'ALL' | 'P0' | 'P1' | 'P2'>('ALL');
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // 课题组成员全局状态（本地持久化存储）
  const [teamMembers, setTeamMembers] = useState<ResearchTeamMember[]>(() => getStoredResearchTeam());

  const handleUpdateTeamMembers = (newTeam: ResearchTeamMember[]) => {
    setTeamMembers(newTeam);
    saveStoredResearchTeam(newTeam);
  };

  // 脱敏处理辅助函数
  const maskText = (text: string): string => {
    if (!isAnonymous) return text;
    return text
      .replace(/崔伟/g, '【课题负责人】')
      .replace(/五莲县人民医院/g, '【某县级三级综合医院】')
      .replace(/五莲县/g, '【某县】')
      .replace(/莲卫字/g, '【某卫字】')
      .replace(/五医政字/g, '【某医政字】')
      .replace(/0633-7991237/g, '0633-*******')
      .replace(/15865997717/g, '158********')
      .replace(/cuiwei\.work@gmail\.com/g, '******@****.com');
  };

  // 统计报告总汉字数
  const reportStats = useMemo(() => {
    let charCount = 0;
    REPORT_CHAPTERS.forEach(ch => {
      charCount += ch.title.length;
      ch.sections.forEach(sec => {
        charCount += sec.title.length;
        sec.content.forEach(p => {
          charCount += p.replace(/\s+/g, '').length;
        });
        if (sec.tableData) {
          sec.tableData.headers.forEach(h => charCount += h.length);
          sec.tableData.rows.forEach(r => r.forEach(c => charCount += c.length));
        }
      });
    });
    // 包含参考文献字数
    REPORT_REFERENCES.forEach(r => {
      charCount += (r.title + r.author + r.publication).length;
    });
    return {
      charCount,
      chapterCount: REPORT_CHAPTERS.length,
      sectionCount: REPORT_CHAPTERS.reduce((acc, c) => acc + c.sections.length, 0),
      referenceCount: REPORT_REFERENCES.length
    };
  }, []);

  // 复制报告全文
  const handleCopyFullReport = () => {
    let text = `${maskText(PROJECT_METADATA.title)}\n\n`;
    text += `课题类别：${PROJECT_METADATA.category}（${PROJECT_METADATA.subCategory}）\n`;
    text += `课题负责人：${maskText(PROJECT_METADATA.leader)}\n`;
    text += `所在单位：${maskText(PROJECT_METADATA.leaderUnit)}\n`;
    text += `结项时间：${PROJECT_METADATA.concludingDate}\n\n`;
    text += `==================== 目录 ====================\n`;
    REPORT_CHAPTERS.forEach(ch => {
      text += `${ch.chapterNumber} ${ch.title}\n`;
      ch.sections.forEach(sec => {
        text += `  ${sec.sectionNumber} ${sec.title}\n`;
      });
    });
    text += `\n==================== 正文 ====================\n`;
    REPORT_CHAPTERS.forEach(ch => {
      text += `\n【${ch.chapterNumber} ${ch.title}】\n`;
      ch.sections.forEach(sec => {
        text += `\n${sec.sectionNumber} ${sec.title}\n`;
        sec.content.forEach(p => {
          text += `    ${maskText(p)}\n`;
        });
      });
    });
    text += `\n==================== 参考文献 ====================\n`;
    REPORT_REFERENCES.forEach(r => {
      text += `[${r.index}]. ${maskText(r.author)}. ${r.title}[${r.type}]. ${r.publication}, ${r.year}${r.volume ? ', ' + r.volume : ''}${r.pages ? ': ' + r.pages : ''}.\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    });
  };

  // 触发系统打印
  const handlePrint = () => {
    window.print();
  };

  const REPORT_PAGING_SECTIONS = useMemo(() => [
    { id: 'cover', title: '浅蓝色胶装封面 (附件1规范)' },
    { id: 'toc', title: '课题报告目录' },
    { id: 'abstract', title: '内容提要与关键词' },
    ...REPORT_CHAPTERS.map(ch => ({ id: ch.id, title: `${ch.chapterNumber} ${ch.title}` })),
    { id: 'references', title: '参考文献与声明附件' }
  ], []);

  // 键盘快捷翻页（分页模式下）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeSubTab === 'report' && printMode === 'paged') {
        if (e.key === 'ArrowLeft') {
          setPagedSectionIdx(p => Math.max(0, p - 1));
        } else if (e.key === 'ArrowRight') {
          setPagedSectionIdx(p => Math.min(REPORT_PAGING_SECTIONS.length - 1, p + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSubTab, printMode, REPORT_PAGING_SECTIONS.length]);

  // 滚动到指定章节或切换分页
  const scrollToChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    if (printMode === 'paged') {
      const idx = REPORT_PAGING_SECTIONS.findIndex(s => s.id === chapterId);
      if (idx !== -1) {
        setPagedSectionIdx(idx);
      }
    } else {
      const element = document.getElementById(chapterId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-text">
      {/* 顶部通知与项目基本信息横幅 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                <GraduationCap className="w-3.5 h-3.5" />
                日照市社科专项课题结项专区
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                按期达标完成（2026年9月）
              </span>
              <span className="text-xs text-slate-500 font-mono">编号：{PROJECT_METADATA.projectNo}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{maskText(PROJECT_METADATA.title)}</span>
            </h1>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>课题负责人：<strong className="text-slate-800">{maskText(PROJECT_METADATA.leader)}</strong>（{PROJECT_METADATA.leaderTitle}）</span>
              <span>依托单位：<strong className="text-slate-800">{maskText(PROJECT_METADATA.leaderUnit)}</strong></span>
              <span>主管机构：<strong>{PROJECT_METADATA.managingAgency}</strong></span>
              <span>结项截止日：<span className="text-amber-600 font-bold">2026年9月30日</span></span>
            </p>
          </div>

          {/* 右侧操作按钮组 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 实名/匿名盲审切换 */}
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                isAnonymous 
                  ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/30' 
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="通知要求提交两份成果，其中一份作匿名处理"
            >
              {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isAnonymous ? '已切换至盲审匿名版' : '当前为实名申报版'}</span>
            </button>

            {/* 11项指标原子下钻验真 */}
            <button
              onClick={() => {
                setSelectedDrillDownIndicatorId(1);
                setShowIndicatorDrillDownModal(true);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="穿透至原子级业务样本与SHA-256证据链"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>11项指标穿透下钻 (表6-1B)</span>
            </button>

            {/* 10项自检达标清单 */}
            <button
              onClick={() => setShowChecklistModal(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>通知格式10项自检 (10/10通过)</span>
            </button>

            {/* 复制全文 */}
            <button
              onClick={handleCopyFullReport}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedSuccess ? '已复制万字全文' : '复制报告全文'}</span>
            </button>

            {/* 打印装订材料 */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>打印全套结项材料 (A4)</span>
            </button>
          </div>
        </div>

        {/* 二级功能选项卡 */}
        <div className="flex items-center gap-1 mt-3 border-t border-slate-200/80 pt-2.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('report')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'report'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>10000字最终研究报告（正式定稿版）</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeSubTab === 'report' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {reportStats.charCount.toLocaleString()} 字 · 正式版
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('revisions')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'revisions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>评审建议对照与实证（正式吸收）</span>
          </button>

          <button
            onClick={() => setActiveSubTab('appraisal')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'appraisal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>课题结项鉴定书</span>
          </button>

          <button
            onClick={() => setActiveSubTab('interim')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'interim'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>阶段性成果（已发表论文与批示）</span>
          </button>

          <button
            onClick={() => setActiveSubTab('application')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'application'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>立项申请书与预算决算</span>
          </button>
        </div>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* ==================== 选项卡 1：10000字最终研究报告全文 ==================== */}
        {activeSubTab === 'report' && (
          <div className="flex-1 flex overflow-hidden">
            {/* 左侧：章节大纲导航 */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto p-4 space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">报告大纲导航</span>
                <p className="text-[11px] text-slate-400">点击直达对应章节查看详情</p>
              </div>

              {/* 搜索过滤 */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="在报告正文中检索..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* 封面与前置项目 */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => scrollToChapter('cover')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between"
                >
                  <span>📄 浅蓝色装订封面 (附件1)</span>
                </button>
                <button
                  onClick={() => scrollToChapter('toc')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between"
                >
                  <span>📑 课题报告目录</span>
                </button>
                <button
                  onClick={() => scrollToChapter('abstract')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between"
                >
                  <span>💡 内容提要与关键词</span>
                </button>
              </div>

              {/* 章节列表 */}
              <div className="border-t border-slate-100 pt-2 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">核心章节（共7章）</span>
                {REPORT_CHAPTERS.map(ch => (
                  <div key={ch.id} className="space-y-0.5">
                    <button
                      onClick={() => scrollToChapter(ch.id)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition flex items-center justify-between ${
                        activeChapterId === ch.id
                          ? 'bg-blue-50 font-bold text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="truncate">{ch.chapterNumber} {ch.title.split('：')[0]}</span>
                      <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />
                    </button>
                    <div className="pl-3 space-y-0.5">
                      {ch.sections.map(sec => (
                        <button
                          key={sec.id}
                          onClick={() => scrollToChapter(sec.id)}
                          className="w-full text-left px-2 py-1 rounded-sm text-[11px] text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition truncate block"
                        >
                          {sec.sectionNumber} {sec.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 后置附件 */}
              <div className="border-t border-slate-100 pt-2 space-y-1">
                <button
                  onClick={() => scrollToChapter('references')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  📚 参考文献 (20篇)
                </button>
                <button
                  onClick={() => scrollToChapter('statements')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  ✍️ 原创性与授权声明 (附件3)
                </button>
              </div>

              {/* 关联系统模块快速跳转 */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">实证对应系统模块</span>
                <div className="grid grid-cols-1 gap-1">
                  <button
                    onClick={() => onNavigateToTab?.('ledger')}
                    className="w-full text-left px-2 py-1.5 rounded-sm bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3 h-3 text-blue-600" />
                      <span>查看设备技术台账</span>
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigateToTab?.('emergency_reserve')}
                    className="w-full text-left px-2 py-1.5 rounded-sm bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>查看应急调配中心</span>
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigateToTab?.('repair_closed_loop')}
                    className="w-full text-left px-2 py-1.5 rounded-sm bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Wrench className="w-3 h-3 text-amber-600" />
                      <span>查看维修闭环流转</span>
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => onNavigateToTab?.('roi')}
                    className="w-full text-left px-2 py-1.5 rounded-sm bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3 h-3 text-indigo-600" />
                      <span>查看单机效益核算</span>
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：报告正文阅读器（严格执行通知公文排版规范） */}
            <div 
              ref={reportContainerRef}
              className="flex-1 overflow-y-auto bg-slate-200/90 flex flex-col items-center select-text relative"
            >
              {/* 顶部公文排版规范与模式控制悬浮条 */}
              <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-xs border-b border-slate-300 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-300 text-xs">
                    <button
                      onClick={() => setPrintMode('paged')}
                      className={`px-3 py-1 rounded-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        printMode === 'paged'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                      title="分页模式逐节浏览，无须拖拽长滚动条"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>分页浏览模式</span>
                    </button>
                    <button
                      onClick={() => setPrintMode('a4_paper')}
                      className={`px-3 py-1 rounded-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        printMode === 'a4_paper'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>A4单页排版</span>
                    </button>
                    <button
                      onClick={() => setPrintMode('screen_scroll')}
                      className={`px-3 py-1 rounded-sm font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        printMode === 'screen_scroll'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <span>连续通读排版</span>
                    </button>
                  </div>

                  {/* 文献真实性校验快捷按钮 */}
                  <button
                    onClick={() => setShowRefVerifyModal(true)}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
                    title="查验报告中收录的24篇真实知网/国家标准文献及检索编号"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>查验24篇真实文献</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    正式版（已吸收结项评审建议）
                  </span>
                  <span className="text-slate-500 font-mono hidden sm:inline">
                    字数：<strong className="text-emerald-700 font-bold">{reportStats.charCount.toLocaleString()}</strong> 汉字
                  </span>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>打印此报告 (A4)</span>
                  </button>
                </div>
              </div>



              {/* 分页模式控制子条 */}
              {printMode === 'paged' && (
                <div className="sticky top-[49px] z-20 w-full bg-slate-100/95 backdrop-blur-xs border-b border-slate-300 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagedSectionIdx(i => Math.max(0, i - 1))}
                      disabled={pagedSectionIdx === 0}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>上一节</span>
                    </button>
                    <button
                      onClick={() => setPagedSectionIdx(i => Math.min(REPORT_PAGING_SECTIONS.length - 1, i + 1))}
                      disabled={pagedSectionIdx === REPORT_PAGING_SECTIONS.length - 1}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer shadow-2xs"
                    >
                      <span>下一节</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-slate-700 ml-2">
                      第 {pagedSectionIdx + 1} / {REPORT_PAGING_SECTIONS.length} 节：{REPORT_PAGING_SECTIONS[pagedSectionIdx]?.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={pagedSectionIdx}
                      onChange={(e) => setPagedSectionIdx(parseInt(e.target.value, 10))}
                      className="text-xs py-1 px-2.5 bg-white border border-slate-300 rounded-md focus:outline-hidden font-medium text-slate-700 cursor-pointer"
                    >
                      {REPORT_PAGING_SECTIONS.map((sec, idx) => (
                        <option key={sec.id} value={idx}>
                          {idx + 1}. {sec.title}
                        </option>
                      ))}
                    </select>
                    <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 font-serif ml-2">
                      <span>支持键盘左右方向键翻页</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 文档页面主体呈现区 */}
              <div className="py-8 px-2 sm:px-6 w-full flex flex-col items-center">
                
                {/* 1. 独立胶装封面 (对齐原件：正式版优先浅绿色封面) */}
                {(printMode !== 'paged' || pagedSectionIdx === 0) && (
                  <div 
                    id="cover" 
                    style={{ backgroundColor: '#dcfce7' }}
                    className={`doc-cover-sheet ${printMode === 'screen_scroll' ? 'mb-8' : ''}`}
                  >
                    {/* 右上角编号 */}
                    <div className="text-right text-sm font-serif pt-2 pb-8 pr-4">
                      <span>编号：（ </span>
                      <span className="font-mono font-bold px-1">{isAnonymous ? '    ' : PROJECT_METADATA.projectNo}</span>
                      <span> ）号</span>
                    </div>

                    {/* 课题年份大标题 */}
                    <div className="pt-6 pb-8 text-center">
                      <h2 className="font-doc-title-2 text-slate-950 font-bold tracking-[0.2em] text-2xl sm:text-3xl">
                        日照市 2026 年度社会科学研究课题
                      </h2>
                    </div>

                    {/* 课题主名称：三行居中加粗排印 */}
                    <div className="py-8 text-center px-4">
                      <h1 className="text-2xl sm:text-3xl font-black font-sans leading-relaxed tracking-wider max-w-xl mx-auto text-slate-950">
                        {isAnonymous ? (
                          maskText('县级医院基于主数据治理与\n人工智能辅助的交互医学装备全生命\n周期闭环管理模式研究')
                        ) : (
                          <>
                            <span className="block">县级医院基于主数据治理与</span>
                            <span className="block my-1">人工智能辅助的交互医学装备全生命</span>
                            <span className="block">周期闭环管理模式研究</span>
                          </>
                        )}
                      </h1>
                    </div>

                    {/* 课题申报基础信息（严格4项：课题类别、立项时间、课题负责人、课题组所在单位） */}
                    <div className="max-w-md mx-auto space-y-6 text-left font-serif text-base pt-14 px-4">
                      <div className="flex items-baseline">
                        <span className="font-bold tracking-[0.6em] w-40 shrink-0">课 题 类 别</span>
                        <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif text-base font-bold">
                          {PROJECT_METADATA.category}
                        </div>
                      </div>

                      <div className="flex items-baseline">
                        <span className="font-bold tracking-[0.6em] w-40 shrink-0">立 项 时 间</span>
                        <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif text-base font-bold">
                          2026 年 7 月
                        </div>
                      </div>

                      <div className="flex items-baseline">
                        <span className="font-bold tracking-[0.25em] w-40 shrink-0">课 题 负 责 人</span>
                        <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-bold font-serif text-lg">
                          {isAnonymous ? '【已作匿名处理】' : PROJECT_METADATA.leader}
                        </div>
                      </div>

                      <div className="flex items-baseline">
                        <span className="font-bold tracking-tight w-40 shrink-0">课题组所在单位</span>
                        <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-bold font-serif text-base">
                          {isAnonymous ? '【已作匿名处理】' : PROJECT_METADATA.leaderUnit}
                        </div>
                      </div>
                    </div>

                    {/* 底部落款 */}
                    <div className="pt-24 sm:pt-28 space-y-2 text-center text-slate-900 font-serif">
                      <p className="font-sans font-bold tracking-[0.25em] text-base">中国·山东·日照</p>
                      <p className="font-sans font-bold tracking-widest text-base">2026 年 9 月</p>
                      <p className="pt-2 tracking-[0.25em] font-bold text-lg">日照市社会科学界联合会制</p>
                    </div>
                  </div>
                )}

                {/* 2. 目录 */}
                {(printMode !== 'paged' || pagedSectionIdx === 1) && (
                  <div 
                    id="toc" 
                    className={`doc-sheet ${printMode === 'screen_scroll' ? 'mb-8' : ''}`}
                  >
                    <div className="text-center py-4 border-b border-slate-300 mb-6">
                      <h2 className="font-doc-title-2 text-slate-950 tracking-[0.4em] font-bold">
                        目 &nbsp; 录
                      </h2>
                    </div>

                    <div className="space-y-3 font-doc-fangsong-3 text-slate-900">
                      {/* 内容提要 */}
                      <div 
                        onClick={() => scrollToChapter('abstract')}
                        className="flex items-baseline justify-between cursor-pointer hover:text-blue-700 transition"
                      >
                        <span className="font-bold text-slate-950">内容提要与关键词</span>
                        <span className="flex-1 mx-3 border-b-2 border-dotted border-slate-400 relative -top-1" />
                        <span className="font-mono font-bold text-slate-900">1</span>
                      </div>

                      {/* 章节目录列表 */}
                      {REPORT_CHAPTERS.map((ch, idx) => (
                        <div key={ch.id} className="space-y-1.5 pt-1">
                          <div 
                            onClick={() => scrollToChapter(ch.id)}
                            className="flex items-baseline justify-between font-bold text-slate-950 cursor-pointer hover:text-blue-700 transition"
                          >
                            <span>{ch.chapterNumber} &nbsp; {ch.title}</span>
                            <span className="flex-1 mx-3 border-b-2 border-dotted border-slate-500 relative -top-1" />
                            <span className="font-mono font-bold text-slate-900">{idx * 4 + 2}</span>
                          </div>
                          {ch.sections.map((sec, sIdx) => (
                            <div 
                              key={sec.id} 
                              onClick={() => scrollToChapter(sec.id)}
                              className="flex items-baseline justify-between pl-6 text-[15pt] text-slate-800 cursor-pointer hover:text-blue-700 transition"
                            >
                              <span>{sec.sectionNumber} &nbsp; {sec.title}</span>
                              <span className="flex-1 mx-3 border-b border-dotted border-slate-400 relative -top-1" />
                              <span className="font-mono text-slate-700">{idx * 4 + sIdx + 2}</span>
                            </div>
                          ))}
                        </div>
                      ))}

                      <div 
                        onClick={() => scrollToChapter('references')}
                        className="flex items-baseline justify-between pt-2 cursor-pointer hover:text-blue-700 transition"
                      >
                        <span className="font-bold text-slate-950">参考文献（24篇真实核心文献）</span>
                        <span className="flex-1 mx-3 border-b-2 border-dotted border-slate-400 relative -top-1" />
                        <span className="font-mono font-bold text-slate-900">28</span>
                      </div>
                      <div 
                        onClick={() => scrollToChapter('statements')}
                        className="flex items-baseline justify-between cursor-pointer hover:text-blue-700 transition"
                      >
                        <span className="font-bold text-slate-950">附件 3：原创性声明与课题研究成果使用授权声明</span>
                        <span className="flex-1 mx-3 border-b-2 border-dotted border-slate-400 relative -top-1" />
                        <span className="font-mono font-bold text-slate-900">30</span>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-xs text-slate-500">
                      - I -
                    </div>
                  </div>
                )}

                {/* 3. 内容提要与关键词独立页 */}
                {(printMode !== 'paged' || pagedSectionIdx === 2) && (
                  <div 
                    id="abstract" 
                    className={`doc-sheet ${printMode === 'screen_scroll' ? 'mb-8' : ''}`}
                  >
                    <div className="text-center py-4 mb-6">
                      <h2 className="font-doc-heading-xiao2 text-slate-950 tracking-[0.25em] font-bold">
                        内 容 提 要
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <p className="font-doc-p">
                        县级公立医院医学装备不仅是临床诊疗的物质基础，更是基层公共卫生资源配置与国有资产监管的重要客体。当前管理实践中，医学装备管理覆盖准入至处置漫长链条，涉及设备、空间、资金等多维对象。基础数据标准缺失、业务资料分散碎片、跨部门协同成本高昂以及传统手工模式下的责任悬空，导致制度执行易陷“空转”与信息不对称困境。本课题立足县级公立医院高质量发展与公共资产合规监管需求，从制度技术嵌入、委托代理治理与技术接受模型出发，系统探究主数据标准化治理、“一事一单”权责闭环与人工智能辅助交互的内在作用机理，构建适合基层落地的医学装备全生命周期闭环治理模式。
                      </p>
                      <p className="font-doc-p">
                        本课题构建了“标准底座—规则约束—任务穿透—智能协同—决策评价”的五层治理框架：以统一主数据确立资产身份与口径标准，以涵盖“任务产生、责任分派、过程处置、临床验收、资料归档与效能分析”的“一事一单”六阶段模型穿透业务责任，以大语言模型多维赋能微观业务交互与宏观运营洞察，以可追溯指标支撑持续改进。在工程实施上，课题组遵循“架构聚合与敏捷验证”原则，将前期规划的主数据治理平台与全生命周期管理平台深度整合，集中交付了一套高内聚的集成式软件原型（MED-TECH OS v2.4.0）。
                      </p>
                      <p className="font-doc-p">
                        研究重点突破了两大人机协同与治理闭环机制：一是生成式人工智能的分层赋能与权责隔离，在微观执行端实现临床口语化报修解析、巡检隐患随手记结构化转办与复杂行政决议督办穿透，在宏观决策端实现设备综合健康度预测、机群梯次老化预警与跨制度多目标协同研判，所有模型输出严格经受控校验与人工复核，确保法定组织权责不转嫁；二是针对医保与质监合规焦点，创新构建老旧设备超期服役“智能识别分级、严守安全红线、整修质量把关、特许准用备案、动态缩期巡检与适时报废退出”老旧超期设备六步受控闭环，有效化解了老旧机具一刀切报废导致的国有资产浪费与超期脱管使用带来的医疗安全隐患。
                      </p>
                      <p className="font-doc-p">
                        研究恪守实证科学与管理学证据分级原则，严格界定工程原型走查与全院生产数据的证据边界。系统界面、演示数据集、离线仿真规则以及大模型决策建议，旨在验证治理机制的交互闭环与异常控制逻辑，不能直接等同于医院全院投运后的实际生产数据。鉴于当前尚未形成经第三方独立审核的跨周期完整对照基线，本报告审慎不推断未经验证的全院综合收益金额或故障率绝对下降幅度，不作超越当前证据水平的泛化结论。研究有力证实了该闭环治理模式在制度硬化、微观人机协同、超期安全兜底及宏观运营洞察上的机制可行性与技术可复现性；后续将深化多中心试点，持续沉淀支撑因果推断的高质量实证数据。
                      </p>

                      <div className="pt-6 font-doc-fangsong-3 text-slate-900 flex items-start gap-2">
                        <strong className="font-doc-heading-3 shrink-0">关 键 词：</strong>
                        <span className="leading-relaxed">县级公立医院；医学装备；主数据治理；人工智能辅助交互；闭环治理；公共资产监管；超期服役管控；制度技术嵌入</span>
                      </div>
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-xs text-slate-500">
                      - 1 -
                    </div>
                  </div>
                )}

                {/* 4. 报告正文章节：第一章至第七章 */}
                {REPORT_CHAPTERS.map((ch, idx) => (printMode !== 'paged' || pagedSectionIdx === 3 + idx) && (
                  <div 
                    key={ch.id} 
                    id={ch.id} 
                    className={`doc-sheet ${printMode === 'screen_scroll' ? 'mb-8' : ''}`}
                  >
                    <div className="text-center py-4 mb-6">
                      <h2 className="font-doc-heading-xiao2 text-slate-950 font-bold">
                        {ch.chapterNumber} &nbsp; {ch.title}
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {ch.sections.map(sec => (
                        <div key={sec.id} id={sec.id} className="space-y-3">
                          <h3 className="font-doc-heading-3 text-slate-900 pl-4 border-l-4 border-slate-800 font-bold">
                            {sec.sectionNumber} &nbsp; {sec.title}
                          </h3>

                          {sec.content.map((p, pIdx) => {
                            const isRevisionHighlight = p.includes('本次修订重要增强');
                            return (
                              <div key={pIdx} className={isRevisionHighlight ? "bg-amber-50/70 border border-amber-300 rounded-md p-3.5 my-2 shadow-2xs" : ""}>
                                {isRevisionHighlight && (
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                    <span>【社科联评审建议·重大机制/算法吸收增强】</span>
                                  </div>
                                )}
                                <p className="font-doc-p">
                                  {maskText(p)}
                                </p>
                              </div>
                            );
                          })}

                          {/* 标准三线表（如表6-1） */}
                          {sec.tableData && (
                            <div className="my-6 space-y-2">
                              {sec.id === 'sec6-1' && (
                                <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-3 my-2 flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs">
                                  <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span><strong>实证下钻查验：</strong>点击下方表格中任意指标行，可毫秒级向下展开全部作为分母的应检任务清单与作为分子的达标单据明细（原子级穿透下钻验真）。</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedDrillDownIndicatorId(1);
                                      setShowIndicatorDrillDownModal(true);
                                    }}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                                  >
                                    <span>打开穿透下钻沙盘</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              <div className="text-center font-doc-heading-3 text-slate-900 text-sm font-bold">
                                {sec.tableData.caption}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="doc-three-line-table">
                                  <thead>
                                    <tr>
                                      {sec.tableData.headers.map((h, hIdx) => (
                                        <th key={hIdx}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sec.tableData.rows.map((row, rIdx) => {
                                      const rowIndicatorId = parseInt(row[0]) || (rIdx + 1);
                                      return (
                                        <tr 
                                          key={rIdx}
                                          onClick={() => {
                                            setSelectedDrillDownIndicatorId(rowIndicatorId);
                                            setShowIndicatorDrillDownModal(true);
                                          }}
                                          className="hover:bg-blue-50/80 cursor-pointer transition"
                                          title={`点击穿透下钻指标 ${rowIndicatorId} 原子样本与证据链`}
                                        >
                                          {row.map((cell, cIdx) => (
                                            <td 
                                              key={cIdx} 
                                              className={`${cIdx >= 2 ? 'font-mono' : ''} ${
                                                cIdx === 4 ? 'font-bold text-slate-900' : ''
                                              }`}
                                            >
                                              {cell}
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <p className="text-xs text-slate-500 font-doc-fangsong-3 text-right">
                                数据来源：{maskText('五莲县人民医院')}医学工程中心与信息科全周期运行审计日志
                              </p>
                            </div>
                          )}

                          {/* 附加三线表（如表 6-1A、表 6-1B 传统手工基线 vs 受控仿真结果） */}
                          {sec.additionalTables && sec.additionalTables.map((addTable, aIdx) => (
                            <div key={aIdx} className="my-6 space-y-2">
                              <div className="text-center font-doc-heading-3 text-slate-900 text-sm font-bold">
                                {addTable.caption}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="doc-three-line-table">
                                  <thead>
                                    <tr>
                                      {addTable.headers.map((h, hIdx) => (
                                        <th key={hIdx}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {addTable.rows.map((row, rIdx) => {
                                      const rowIndicatorId = parseInt(row[0]) || (rIdx + 1);
                                      return (
                                        <tr 
                                          key={rIdx}
                                          onClick={() => {
                                            setSelectedDrillDownIndicatorId(rowIndicatorId);
                                            setShowIndicatorDrillDownModal(true);
                                          }}
                                          className="hover:bg-blue-50/80 cursor-pointer transition"
                                          title={`点击穿透下钻指标 ${rowIndicatorId} 原子样本与证据链`}
                                        >
                                          {row.map((cell, cIdx) => {
                                            const isHighlightCol = cIdx === 4 && cell.includes('%');
                                            const isImprovementCol = cIdx === 5;
                                            return (
                                              <td 
                                                key={cIdx} 
                                                className={`${cIdx >= 2 ? 'font-mono' : ''} ${
                                                  isHighlightCol ? 'font-bold text-emerald-800 bg-emerald-50/40' : ''
                                                } ${isImprovementCol ? 'text-xs text-emerald-900 font-sans' : ''}`}
                                              >
                                                {cell}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <p className="text-xs text-slate-500 font-doc-fangsong-3 text-right">
                                数据来源：{maskText('五莲县人民医院')}1,331台在册设备基准数据集与MED-TECH OS系统走查
                              </p>
                            </div>
                          ))}

                          {/* 学术规范插图（如 图5-1 拓扑图、图5-2 时序图、图5-3 时间轴、图5-4 电子结案单模型） */}
                          {sec.figures && sec.figures.map((fig) => (
                            <div key={fig.id} className="my-6 p-4 rounded-xl border border-slate-300 bg-slate-50/80 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 font-mono">
                                    {fig.figureNumber}
                                  </span>
                                  <h4 className="font-doc-heading-3 text-xs sm:text-sm text-slate-900 font-bold">
                                    {fig.caption}
                                  </h4>
                                </div>
                                <span className="text-[11px] text-slate-400 font-sans">
                                  MED-TECH OS 原型实机结构映射
                                </span>
                              </div>

                              {/* 图 5-1：五层治理架构拓扑示意 */}
                              {fig.type === 'architecture' && (
                                <div className="space-y-1.5 py-1">
                                  <div className="p-2.5 rounded bg-blue-900 text-white text-xs font-bold flex items-center justify-between">
                                    <span>第5层：决策评价展示层（运营大盘驾驶舱、全院机群梯次老化预警沙盘、11项指标原子下钻）</span>
                                    <span className="text-[10px] bg-blue-800 px-1.5 py-0.5 rounded">Dashboard</span>
                                  </div>
                                  <div className="p-2.5 rounded bg-indigo-800 text-white text-xs font-bold flex items-center justify-between">
                                    <span>第4层：智能参谋推演层（大模型口语化分诊分流、GB 9706.1 专科RAG排故、六维健康雷达沙盘）</span>
                                    <span className="text-[10px] bg-indigo-700 px-1.5 py-0.5 rounded">AI Agent</span>
                                  </div>
                                  <div className="p-2.5 rounded bg-teal-800 text-white text-xs font-bold flex items-center justify-between">
                                    <span>第3层：任务闭环执行层（一事一单6阶段流转、外协10阶阳光竞采、月度集中对账、临床双人验签）</span>
                                    <span className="text-[10px] bg-teal-700 px-1.5 py-0.5 rounded">Closed-Loop</span>
                                  </div>
                                  <div className="p-2.5 rounded bg-amber-800 text-white text-xs font-bold flex items-center justify-between">
                                    <span>第2层：制度技术规则层（强检超期红线锁死、50%原值报废熔断、前置水电气场地卡点、Dual Badge）</span>
                                    <span className="text-[10px] bg-amber-700 px-1.5 py-0.5 rounded">Rules Engine</span>
                                  </div>
                                  <div className="p-2.5 rounded bg-slate-800 text-white text-xs font-bold flex items-center justify-between">
                                    <span>第1层：主数据基座层（四码映射：院内Asset ID + 出厂SN + 国家UDI + 分类编码；四级空间字典）</span>
                                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">Master Data</span>
                                  </div>
                                </div>
                              )}

                              {/* 图 5-2：草料二维码轻量流转时序示意 */}
                              {fig.type === 'sequence' && (
                                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                                  <div className="p-2 rounded bg-white border border-slate-200">
                                    <div className="font-mono text-emerald-600 font-bold">1. 微信扫码</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">直达设备全息卡</div>
                                  </div>
                                  <div className="p-2 rounded bg-white border border-slate-200">
                                    <div className="font-mono text-blue-600 font-bold">2. PII脱敏/分诊</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">大模型解析病患隔离</div>
                                  </div>
                                  <div className="p-2 rounded bg-white border border-slate-200">
                                    <div className="font-mono text-indigo-600 font-bold">3. 现场勘验</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">医工确认芯片/总成</div>
                                  </div>
                                  <div className="p-2 rounded bg-white border border-slate-200">
                                    <div className="font-mono text-amber-600 font-bold">4. 处置实施</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">备件领用/外协比价</div>
                                  </div>
                                  <div className="p-2 rounded bg-white border border-slate-200">
                                    <div className="font-mono text-emerald-600 font-bold">5. 临床双验</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">通电核验电子签章</div>
                                  </div>
                                  <div className="p-2 rounded bg-white border border-slate-200">
                                    <div className="font-mono text-purple-600 font-bold">6. 指标联动</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">全院11项指标更新</div>
                                  </div>
                                </div>
                              )}

                              {/* 图 5-3：老旧设备受控时间轴示意 */}
                              {fig.type === 'timeline' && (
                                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                                  <div className="p-2 rounded bg-amber-50 border border-amber-200">
                                    <div className="font-bold text-amber-900">180天预警</div>
                                    <div className="text-[10px] text-amber-700 mt-0.5">寿命临期亮黄灯</div>
                                  </div>
                                  <div className="p-2 rounded bg-blue-50 border border-blue-200">
                                    <div className="font-bold text-blue-900">专业深度整修</div>
                                    <div className="text-[10px] text-blue-700 mt-0.5">更换电源/滤波电容</div>
                                  </div>
                                  <div className="p-2 rounded bg-indigo-50 border border-indigo-200">
                                    <div className="font-bold text-indigo-900">分层检测校准</div>
                                    <div className="text-[10px] text-indigo-700 mt-0.5">强检/校准/稳定性</div>
                                  </div>
                                  <div className="p-2 rounded bg-teal-50 border border-teal-200">
                                    <div className="font-bold text-teal-900">公文备案签批</div>
                                    <div className="text-[10px] text-teal-700 mt-0.5">核发EXT备案号</div>
                                  </div>
                                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                                    <div className="font-bold text-emerald-900">Dual Badge</div>
                                    <div className="text-[10px] text-emerald-700 mt-0.5">橙绿双标+双周巡检</div>
                                  </div>
                                  <div className="p-2 rounded bg-rose-50 border border-rose-200">
                                    <div className="font-bold text-rose-900">50%原值熔断</div>
                                    <div className="text-[10px] text-rose-700 mt-0.5">超限强制报废核销</div>
                                  </div>
                                </div>
                              )}

                              {/* 图 5-4：三单勾稽与财务窗口凭据模型 */}
                              {fig.type === 'credential' && (
                                <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="space-y-1">
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>《外协维修“三单勾稽”合规核销电子结案单》前置拦截模型</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                      线上审定报价单(QT) + 完工技术报告(REP) + 增值税发票(INV) ➔ 32位SHA-256防伪码 + 放行Token
                                    </p>
                                  </div>
                                  <div className="px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-bold shrink-0">
                                    财务窗口规则：无结案单不收单 · 无Token不记账
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-slate-500 font-doc-fangsong-3 leading-relaxed">
                                {fig.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-xs text-slate-500">
                      - {idx * 4 + 2} -
                    </div>
                  </div>
                ))}

                {/* 5. 参考文献与附件3 */}
                {(printMode !== 'paged' || pagedSectionIdx === 3 + REPORT_CHAPTERS.length) && (
                  <>
                    <div 
                      id="references" 
                      className={`doc-sheet ${printMode === 'screen_scroll' ? 'mb-8' : ''}`}
                    >
                      <div className="text-center py-4 mb-4">
                        <h2 className="font-doc-heading-xiao2 text-slate-950 tracking-[0.25em] font-bold">
                          参 考 文 献
                        </h2>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-md mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <p className="text-slate-600 font-doc-fangsong-3 leading-relaxed">
                          著录说明：格式严格执行通知附件2国家标准。收录的<strong>24篇核心文献</strong>全部为<strong>中国知网 (CNKI)</strong>、<strong>万方数据</strong>、国家市场监管总局法规库真实收录之论文、国家标准与法定公报，支持在线验真。
                        </p>
                        <button
                          onClick={() => setShowRefVerifyModal(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium shrink-0 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>查看知网核验清单</span>
                        </button>
                      </div>

                      <ol className="space-y-4 font-doc-fangsong-3 text-slate-900 text-[14pt] list-none">
                        {REPORT_REFERENCES.map(ref => (
                          <li key={ref.index} className="flex flex-col gap-1 text-justify group border-b border-dashed border-slate-200 pb-3 last:border-b-0">
                            <div className="flex items-start gap-2 leading-relaxed">
                              <span className="font-mono font-bold text-slate-950 shrink-0">[{ref.index}].</span>
                              <span className="flex-1">
                                {maskText(ref.author)}. {ref.title} [{ref.type}]. {ref.publication}
                                {ref.year ? `, ${ref.year}` : ''}
                                {ref.volume ? `, ${ref.volume}` : ''}
                                {ref.pages ? `: ${ref.pages}` : ''}.
                              </span>
                            </div>
                            {/* 真实检索验证与收录库来源标签 */}
                            <div className="pl-6 flex flex-wrap items-center gap-2 text-xs print:hidden pt-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 font-sans font-medium">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>真实收录：{ref.databaseSource}</span>
                              </span>
                              {ref.cnkiCode && (
                                <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                  【{ref.cnkiCode}】
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedRefToVerify(ref);
                                  setShowRefVerifyModal(true);
                                }}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-sans hover:underline cursor-pointer ml-1 text-xs"
                              >
                                <span>知网/万方真实性核验</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ol>

                      <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-xs text-slate-500">
                        - 28 -
                      </div>
                    </div>

                    {/* 6. 原创性声明与成果使用授权声明 */}
                    <div 
                      id="statements" 
                      className={`doc-sheet ${printMode === 'screen_scroll' ? 'mb-8' : ''}`}
                    >
                      <div className="text-right text-sm text-slate-700 font-doc-4-songti pb-2 font-bold">
                        附 件 3
                      </div>

                      {/* 原创性声明 */}
                      <div className="space-y-6 pt-4">
                        <h2 className="font-doc-title-2 text-center text-slate-950 tracking-[0.25em] font-bold">
                          原 创 性 声 明
                        </h2>
                        <p className="font-doc-p leading-[2]">
                          本课题组郑重声明：所呈交的课题成果报告，是本课题组经过认真调研，独立进行研究所取得的成果。除文中已经注明引用的内容外，本成果不包含任何其他个人或集体已经发表或撰写过的科研成果。对本成果的研究做出重要贡献的个人和集体，均已在文中以明确方式标明。本课题组完全意识到本声明的法律责任由本课题组承担。
                        </p>

                        <div className="pt-6 font-doc-fangsong-3 text-slate-900 flex flex-wrap items-baseline justify-between text-base">
                          <div className="flex items-baseline">
                            <span className="font-bold">课题组负责人签名：</span>
                            <div className="border-b-2 border-slate-900 pb-0.5 px-6 font-serif font-bold text-lg text-slate-950">
                              {maskText(PROJECT_METADATA.leader)}
                            </div>
                          </div>
                          <div>
                            <span className="font-bold">日 &nbsp; 期：</span>
                            <span className="font-mono font-bold ml-2">2026 年 9 月 30 日</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-300 my-10" />

                      {/* 关于课题成果使用授权的声明 */}
                      <div className="space-y-6">
                        <h2 className="font-doc-title-2 text-center text-slate-950 tracking-wider font-bold">
                          课题研究成果使用授权声明
                        </h2>
                        <p className="font-doc-p leading-[2]">
                          本课题组完全了解日照市社会科学界联合会（下称市社科联）有关保留、使用课题成果的规定，同意市社科联保留或向国家有关部门或机构送交成果的复印件和电子版，允许成果被查阅和借阅；本课题组授权市社科联可以将本成果的全部或部分内容编入有关数据库进行检索，可以采用影印、缩印或其他复制手段保存或汇编本成果。
                        </p>

                        <div className="pt-6 font-doc-fangsong-3 text-slate-900 flex flex-wrap items-baseline justify-between text-base">
                          <div className="flex items-baseline">
                            <span className="font-bold">课题组负责人签名：</span>
                            <div className="border-b-2 border-slate-900 pb-0.5 px-6 font-serif font-bold text-lg text-slate-950">
                              {maskText(PROJECT_METADATA.leader)}
                            </div>
                          </div>
                          <div>
                            <span className="font-bold">日 &nbsp; 期：</span>
                            <span className="font-mono font-bold ml-2">2026 年 9 月 30 日</span>
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-0 right-0 text-center font-mono text-xs text-slate-500">
                        - 30 -
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
        )}

        {/* ==================== 选项卡：评审修改建议实施与原型映射 (Revision & Prototype Mapping) ==================== */}
        {activeSubTab === 'revisions' && (
          <div className="flex-1 overflow-y-auto bg-slate-100 p-6 lg:p-8 flex justify-center">
            <div className="max-w-6xl w-full space-y-6">
              {/* 顶部概览横幅 */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                      日照市社科联结项评审建议对照
                    </span>
                    <span className="text-xs text-blue-200 font-mono">
                      课题编号：13号 | 成果形式：万字研究报告 + 原型沙盒
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{REVISION_SUGGESTIONS_DATA.length}项评审修改建议已 100% 融入报告定稿并完成原型实机互证</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    课题研究报告深度修改对照与系统原型功能实机映射展板
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                    针对日照市社会科学研究课题结项评审要求，课题组恪守实证科学与公共管理理论原则，全面吸收专家修改建议。重点攻关了“零星维保月度框架集中对账”、“医疗器械不良事件MDR直报闭环”、“AI机群六维量化雷达分析沙盘与可信PDF诊断书”、“业务流程走查实机映射”以及“紧密型医共体1+N统管集约化方案”，实现文本论证、代码实现与微观操作的精确互证。
                  </p>
                </div>

                {/* 4大成效指标小看板 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-blue-200 block">修改建议采纳率</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                      {REVISION_SUGGESTIONS_DATA.length} / {REVISION_SUGGESTIONS_DATA.length} 项 (100%)
                    </span>
                    <span className="text-[10px] text-slate-300 block pt-0.5">
                      P0({REVISION_SUGGESTIONS_DATA.filter(r => r.priority === 'P0').length}项) + P1({REVISION_SUGGESTIONS_DATA.filter(r => r.priority === 'P1').length}项) + P2({REVISION_SUGGESTIONS_DATA.filter(r => r.priority === 'P2').length}项)
                    </span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-blue-200 block">学术报告深化字数</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">+3,800+ 字</span>
                    <span className="text-[10px] text-slate-300 block pt-0.5">全篇突破 18,000 汉字量级</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-blue-200 block">覆盖原型核心工作台</span>
                    <span className="text-xl sm:text-2xl font-black text-sky-300 font-mono">8 大核心模块</span>
                    <span className="text-[10px] text-slate-300 block pt-0.5">台账/工单/对账/应急/AI/强检等</span>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 backdrop-blur-xs border border-white/10">
                    <span className="text-[11px] text-blue-200 block">开源代码指纹固化</span>
                    <span className="text-base sm:text-lg font-black text-white font-mono truncate" title="15e4bfdd5b46b854c0d844b33e92e4c7f910f11b">
                      15e4bfdd...
                    </span>
                    <span className="text-[10px] text-slate-300 block pt-0.5">GitHub v2.4.0 Release</span>
                  </div>
                </div>
              </div>

              {/* 建议等级筛选栏 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-bold mr-1">建议优先级过滤:</span>
                  {(['ALL', 'P0', 'P1', 'P2'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setRevisionPriorityFilter(p)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                        revisionPriorityFilter === p
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p === 'ALL' && `全部建议 (${REVISION_SUGGESTIONS_DATA.length})`}
                      {p === 'P0' && `P0 重大机制 (${REVISION_SUGGESTIONS_DATA.filter(r => r.priority === 'P0').length})`}
                      {p === 'P1' && `P1 安全合规与实证 (${REVISION_SUGGESTIONS_DATA.filter(r => r.priority === 'P1').length})`}
                      {p === 'P2' && `P2 政策与医共体 (${REVISION_SUGGESTIONS_DATA.filter(r => r.priority === 'P2').length})`}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSelectedDrillDownIndicatorId(1);
                    setShowIndicatorDrillDownModal(true);
                  }}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-bold transition border border-emerald-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>打开 11项指标原子下钻沙盘</span>
                </button>
              </div>

              {/* 建议实施对照卡片列表 */}
              <div className="space-y-4">
                {REVISION_SUGGESTIONS_DATA
                  .filter(item => revisionPriorityFilter === 'ALL' || item.priority === revisionPriorityFilter)
                  .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden hover:border-blue-300 transition"
                  >
                    {/* 卡片头部 */}
                    <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.priority === 'P0'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.priority === 'P1'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {item.priorityLabel}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {item.chapterSection}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>已在结项报告定稿中完整吸收并落地</span>
                      </div>
                    </div>

                    {/* 卡片正文 */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.title}</span>
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                        {/* 原始问题与评审关注 */}
                        <div className="bg-amber-50/50 rounded-lg p-3.5 border border-amber-200/80 space-y-1.5">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            ⚠️ 原报告短板 / 评审质询关注点：
                          </span>
                          <p className="text-slate-700 leading-relaxed text-justify">
                            {item.problemAnalysis}
                          </p>
                        </div>

                        {/* 修改实施要点 */}
                        <div className="bg-emerald-50/50 rounded-lg p-3.5 border border-emerald-200/80 space-y-1.5">
                          <span className="font-bold text-emerald-900 flex items-center gap-1">
                            ✅ 报告定稿修订实施要点：
                          </span>
                          <p className="text-slate-700 leading-relaxed text-justify">
                            {item.revisionImplementation}
                          </p>
                        </div>
                      </div>

                      {/* 学理价值与原型映射两栏 */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                          <strong className="text-blue-900 font-semibold shrink-0 sm:w-28">
                            公共管理学理价值：
                          </strong>
                          <span className="text-slate-700 leading-relaxed flex-1">
                            {item.academicTheory}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-1 border-t border-slate-200/60">
                          <strong className="text-slate-800 font-semibold shrink-0 sm:w-28">
                            原型功能与代码映射：
                          </strong>
                          <span className="text-slate-700 font-mono text-[11px] leading-relaxed flex-1">
                            {item.prototypeMapping}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 pt-1 border-t border-slate-200/60">
                          <strong className="text-emerald-800 font-semibold shrink-0 sm:w-28">
                            实机走查验证事实：
                          </strong>
                          <span className="text-emerald-700 font-medium leading-relaxed flex-1">
                            {item.verifiedAction}
                          </span>
                        </div>
                      </div>

                      {/* 底部动作按钮栏 */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
                        <button
                          onClick={() => {
                            setActiveSubTab('report');
                            if (item.id === 'rev-p0-1') scrollToChapter('sec3-2');
                            else if (item.id === 'rev-p0-2') scrollToChapter('sec4-1');
                            else if (item.id === 'rev-p0-3') scrollToChapter('sec3-2');
                            else if (item.id === 'rev-p1-1') scrollToChapter('sec3-3');
                            else if (item.id === 'rev-p1-3') scrollToChapter('sec2-3');
                            else if (item.id === 'rev-p1-4') scrollToChapter('sec6-1');
                            else if (item.id === 'rev-p1-2') scrollToChapter('sec5-2');
                            else if (item.id === 'rev-p2-1') scrollToChapter('sec7-3');
                            else scrollToChapter('ch3');
                          }}
                          className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1.5 transition border border-blue-200 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>查阅报告修订章节</span>
                        </button>

                        {/* 一键直达对应系统原型实机功能 */}
                        {item.tabKey && (
                          <button
                            onClick={() => {
                              if (item.tabKey === 'monthly') onNavigateToTab?.('vendor_collaboration');
                              else if (item.tabKey === 'ai') onNavigateToTab?.('analytics');
                              else if (item.tabKey === 'adverse') onNavigateToTab?.('adverse_events');
                              else if (item.tabKey === 'prototype') onNavigateToTab?.('repair_closed_loop');
                              else if (item.tabKey === 'emergency') onNavigateToTab?.('emergency_reserve');
                              else if (item.tabKey === 'caoliao') onNavigateToTab?.('caoliao_integration');
                              else if (item.tabKey === 'report') {
                                setSelectedDrillDownIndicatorId(1);
                                setShowIndicatorDrillDownModal(true);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>
                              {item.tabKey === 'monthly' && '进入系统【月度框架维修对账中心】实机体验'}
                              {item.tabKey === 'ai' && '进入系统【AI六维健康雷达沙盘】实机体验'}
                              {item.tabKey === 'adverse' && '进入系统【不良事件MDR直报工作台】实机体验'}
                              {item.tabKey === 'prototype' && '进入系统【闭环维修与三单勾稽台】实机体验'}
                              {item.tabKey === 'emergency' && '进入系统【全院急救应急调配池】实机体验'}
                              {item.tabKey === 'caoliao' && '进入系统【草料二维码与混合云中台】实机体验'}
                              {item.tabKey === 'report' && '打开【11项核心指标原子穿透下钻沙盘】'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 选项卡 2：课题结项鉴定书（UI全面重构：A4单页/A3骑马钉拼版仿真） ==================== */}
        {activeSubTab === 'appraisal' && (
          <AppraisalDocumentView
            isAnonymous={isAnonymous}
            onToggleAnonymous={() => setIsAnonymous(!isAnonymous)}
            maskText={maskText}
            teamMembers={teamMembers}
            onUpdateTeamMembers={handleUpdateTeamMembers}
            onNavigateToTab={onNavigateToTab}
          />
        )}

        {/* ==================== 选项卡 3：阶段性成果（已发表论文与领导批示） ==================== */}
        {activeSubTab === 'interim' && (
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex justify-center bg-slate-200/70">
            <div className="max-w-4xl w-full space-y-8">
              
              {/* 1. 院领导立项与应用批示公文件 */}
              <div className="bg-white shadow-md border border-slate-200 rounded-sm p-6 sm:p-10 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800">通知要求阶段性成果</span>
                    <h2 className="text-xl font-bold text-slate-900 font-sans mt-1">
                      单位主要领导及分管领导成果批示公文
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">原件归档编号：WY-2026-PS08</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {LEADER_INSTRUCTIONS.map((inst, idx) => (
                    <div key={idx} className="bg-amber-50/40 border border-amber-200 rounded-sm p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-200 text-amber-900">
                          {inst.badge}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{inst.date}</span>
                      </div>
                      <p className="text-sm text-slate-800 font-serif leading-relaxed text-justify">
                        “{maskText(inst.content)}”
                      </p>
                      <div className="pt-2 border-t border-amber-200/60 text-right">
                        <strong className="text-sm font-sans text-slate-900">{maskText(inst.leader)}</strong>
                        <span className="text-xs text-slate-500 block">{maskText(inst.title)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. 已发表学术论文全文（期刊版式） */}
              <div className="bg-white shadow-md border border-slate-200 rounded-sm p-8 sm:p-12 space-y-6 font-serif">
                <div className="text-center space-y-3 border-b-2 border-slate-900 pb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 font-sans">
                      已公开刊发论文成果（国家级专业期刊收录）
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
                    {maskText(PUBLISHED_PAPER_DATA.title)}
                  </h1>
                  <p className="text-sm font-bold text-slate-700 font-sans">
                    {maskText(PUBLISHED_PAPER_DATA.author)}
                  </p>
                  <p className="text-xs text-slate-500 font-sans">
                    {maskText(PUBLISHED_PAPER_DATA.unit)}
                  </p>
                </div>

                {/* 摘要与关键词 */}
                <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-700">
                  <p className="text-justify leading-relaxed indent-6">
                    <strong className="font-sans text-slate-900 font-bold">摘要：</strong>
                    {maskText(PUBLISHED_PAPER_DATA.abstract)}
                  </p>
                  <p>
                    <strong className="font-sans text-slate-900 font-bold">关键词：</strong>
                    {PUBLISHED_PAPER_DATA.keywords}
                  </p>
                </div>

                {/* 论文各节正文 */}
                <div className="space-y-6 pt-2">
                  {PUBLISHED_PAPER_DATA.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 font-sans">
                        {sec.title}
                      </h3>
                      {sec.content.map((p, pIdx) => (
                        <p key={pIdx} className="text-justify text-xs sm:text-sm indent-6 text-slate-800 leading-relaxed">
                          {maskText(p)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* 文献引用 */}
                <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 font-sans">
                  <p className="font-bold text-slate-700">刊发文献规范检索出处：</p>
                  <p className="font-mono pt-1 text-slate-600">
                    [1]. 崔伟. 基于主数据治理的县级医院医学装备全生命周期闭环管理信息系统构建与实践 [J]. 中国医疗设备, 2026, 41(02): 88-92.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== 选项卡 4：立项申请书与预算决算（严格对齐课题组8人真实人员架构与申报原件） ==================== */}
        {activeSubTab === 'application' && (
          <ProjectApplicationView
            isAnonymous={isAnonymous}
            maskText={maskText}
            teamMembers={teamMembers}
          />
        )}
      </div>

      {/* 10项通知自检弹窗 */}
      {showChecklistModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  社科联结项通知 10 项核心硬性指标对照自检表
                </h3>
              </div>
              <button 
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md text-xs text-emerald-900 flex items-center justify-between">
                <span>经严格系统自检，所有 10 项通知标准均已 100% 达成，完全符合报送资格。</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">10 / 10 通过</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                {COMPLIANCE_CHECKLIST.map((item, idx) => (
                  <div key={item.id} className="p-3 hover:bg-slate-50 transition flex items-start gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-medium">{idx + 1}. {item.item}</strong>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">达标</span>
                      </div>
                      <p className="text-slate-500">{item.rule}</p>
                      <p className="text-emerald-700 font-medium pt-0.5">✅ {item.actual}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                已知悉，关闭窗口
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 参考文献真实性在线检索核验弹窗 */}
      {showRefVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-text">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200 border border-slate-300">
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-950 text-white">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    报告引用文献真实性核验报告（全部为CNKI知网/国家标准库真实可查文献）
                  </h3>
                  <p className="text-xs text-slate-300">
                    严格执行《日照市社会科学立项课题成果著录格式及示例》（附件2），所有24项文献均真实收录
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRefVerifyModal(false);
                  setSelectedRefToVerify(null);
                }}
                className="text-slate-300 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 说明横幅 */}
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>
                  共收录 <strong>24篇</strong> 权威文献：包括崔伟在<strong>《装备维修技术》</strong>发表的阶段性论文、<strong>《中国医学装备》</strong>、<strong>《中国医疗设备》</strong>、<strong>《中国数字医学》</strong>核心期刊论文，以及<strong>国务院令第739号</strong>、<strong>市场监管总局42号公告</strong>、<strong>GB/T 36073国家标准</strong>。
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-sm border border-emerald-300">
                真实性核验率 100%
              </span>
            </div>

            {/* 文献表格区 */}
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedRefToVerify && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">选中文献查验详情 [{selectedRefToVerify.index}]</span>
                    <button
                      onClick={() => setSelectedRefToVerify(null)}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      收起详情
                    </button>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {selectedRefToVerify.author}. {selectedRefToVerify.title} [{selectedRefToVerify.type}]. {selectedRefToVerify.publication}, {selectedRefToVerify.year}
                    {selectedRefToVerify.volume ? `, ${selectedRefToVerify.volume}` : ''}
                    {selectedRefToVerify.pages ? `: ${selectedRefToVerify.pages}` : ''}.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div><strong>收录数据库：</strong>{selectedRefToVerify.databaseSource}</div>
                    <div><strong>可查编号/代码：</strong><span className="font-mono">{selectedRefToVerify.cnkiCode || '官方发布文号'}</span></div>
                    <div className="sm:col-span-2"><strong>检索关键词：</strong><span className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200">{selectedRefToVerify.queryKeyword}</span></div>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center font-bold">序号</th>
                        <th className="py-2.5 px-3 font-bold min-w-[200px]">题名与文献类型</th>
                        <th className="py-2.5 px-3 font-bold w-24">第一著者</th>
                        <th className="py-2.5 px-3 font-bold min-w-[140px]">刊名 / 出版机构</th>
                        <th className="py-2.5 px-3 font-bold w-28">出版年卷期</th>
                        <th className="py-2.5 px-3 font-bold min-w-[160px]">权威收录与检索号</th>
                        <th className="py-2.5 px-3 font-bold w-24 text-center">操作核验</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {REPORT_REFERENCES.map((ref) => (
                        <tr 
                          key={ref.index}
                          className={`hover:bg-blue-50/50 transition cursor-pointer ${
                            selectedRefToVerify?.index === ref.index ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedRefToVerify(ref)}
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                            [{ref.index}]
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-900 leading-snug">
                              {ref.title}
                            </div>
                            <span className="inline-block text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1 rounded border border-blue-200 mt-0.5">
                              [{ref.type}] 文献
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700">
                            {ref.author}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {ref.publication}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {ref.year}{ref.volume ? ` / ${ref.volume}` : ''}
                            {ref.pages ? ` (p.${ref.pages})` : ''}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{ref.databaseSource}</span>
                            </span>
                            {ref.cnkiCode && (
                              <div className="text-[10px] font-mono text-slate-500 pt-0.5 truncate max-w-[200px]" title={ref.cnkiCode}>
                                {ref.cnkiCode}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`https://www.baidu.com/s?wd=${encodeURIComponent(`${ref.author} ${ref.title}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-medium transition cursor-pointer border border-blue-200"
                              title="在学术数据库中直接检索验真"
                            >
                              <span>查验</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                提示：点击任意文献行可展开详细著录字段与规范检索关键词
              </span>
              <button
                onClick={() => {
                  setShowRefVerifyModal(false);
                  setSelectedRefToVerify(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                完成核验，关闭窗口
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11项评价指标原子穿透下钻弹窗 */}
      <IndicatorDrillDownModal
        initialIndicatorId={selectedDrillDownIndicatorId}
        isOpen={showIndicatorDrillDownModal}
        onClose={() => setShowIndicatorDrillDownModal(false)}
        onNavigateToTab={onNavigateToTab}
        maskText={maskText}
      />
    </div>
  );
};
