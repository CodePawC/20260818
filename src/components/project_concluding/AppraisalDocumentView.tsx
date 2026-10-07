import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Printer, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Scissors, 
  Users, 
  RotateCcw, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  ClipboardList, 
  X,
  BookOpen,
  FileText
} from 'lucide-react';
import { 
  PROJECT_METADATA, 
  RESEARCH_TEAM, 
  OFFICIAL_APPRAISAL_SUMMARY_REPORT,
  ResearchTeamMember
} from '../../data/projectConcludingData';
import { 
  getStoredResearchTeam, 
  saveStoredResearchTeam, 
  resetToOfficialResearchTeam, 
  parsePastedTeamText 
} from '../../utils/projectTeamStore';

interface AppraisalDocumentViewProps {
  isAnonymous: boolean;
  onToggleAnonymous: () => void;
  maskText: (text: string) => string;
  teamMembers?: ResearchTeamMember[];
  onUpdateTeamMembers?: (members: ResearchTeamMember[]) => void;
}

export const AppraisalDocumentView: React.FC<AppraisalDocumentViewProps> = ({
  isAnonymous,
  onToggleAnonymous,
  maskText,
  teamMembers,
  onUpdateTeamMembers
}) => {
  // 浏览模式：默认采用分页模式浏览（避免滚动条）
  const [viewMode, setViewMode] = useState<'pagination' | 'continuous' | 'a3_spread'>('pagination');
  const [activePage, setActivePage] = useState<number>(1);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // 课题组成员管理状态
  const [internalTeam, setInternalTeam] = useState<ResearchTeamMember[]>(() => teamMembers || getStoredResearchTeam());
  const currentTeam = teamMembers || internalTeam;

  const [showEditTeamModal, setShowEditTeamModal] = useState<boolean>(false);
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [editingList, setEditingList] = useState<ResearchTeamMember[]>([]);
  const [pasteRawText, setPasteRawText] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 支持键盘左右键快捷翻页
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (viewMode === 'pagination') {
        if (e.key === 'ArrowLeft') {
          setActivePage(p => Math.max(1, p - 1));
        } else if (e.key === 'ArrowRight') {
          setActivePage(p => Math.min(4, p + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  const handleUpdateTeam = (newTeam: ResearchTeamMember[]) => {
    setInternalTeam(newTeam);
    saveStoredResearchTeam(newTeam);
    if (onUpdateTeamMembers) {
      onUpdateTeamMembers(newTeam);
    }
  };

  const handleResetToOfficial = () => {
    const official = resetToOfficialResearchTeam();
    handleUpdateTeam(official);
    showToast('已严格恢复为官方申报附件真实课题组名单（含负责人共9人）！');
  };

  const openEditModal = () => {
    setEditingList(JSON.parse(JSON.stringify(currentTeam)));
    setShowEditTeamModal(true);
  };

  const handleSaveEditedTeam = () => {
    if (editingList.length === 0) {
      handleResetToOfficial();
    } else {
      handleUpdateTeam(editingList);
      showToast(`已成功保存课题组成员信息（共 ${editingList.length} 人）！`);
    }
    setShowEditTeamModal(false);
  };

  const handleApplyPaste = () => {
    if (!pasteRawText.trim()) return;
    const parsed = parsePastedTeamText(pasteRawText);
    if (parsed.length > 0) {
      handleUpdateTeam(parsed);
      setShowPasteModal(false);
      setPasteRawText('');
      showToast(`成功解析并录入 ${parsed.length} 名课题组成员！`);
    } else {
      showToast('未能识别有效人员信息，请检查格式');
    }
  };

  // 复制官方总结报告全文
  const handleCopySummaryReport = () => {
    let text = `日照市社会科学研究课题结项鉴定书——课题研究工作总结报告\n`;
    text += `课题名称：${PROJECT_METADATA.title}\n`;
    text += `课题类别：${PROJECT_METADATA.category}\n`;
    text += `立项时间：${PROJECT_METADATA.approvalDate}\n`;
    text += `课题组负责人：${PROJECT_METADATA.leader}\n`;
    text += `课题组所在单位：${PROJECT_METADATA.leaderUnit}\n\n`;

    OFFICIAL_APPRAISAL_SUMMARY_REPORT.sections.forEach(sec => {
      text += `【${sec.number}、${sec.title}】\n`;
      if (sec.intro) text += `${sec.intro}\n`;
      sec.items.forEach(item => {
        text += `${item.itemIndex}. ${item.itemTitle}\n${item.content}\n\n`;
      });
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // 页面导航定义
  const PAGE_TABS = [
    { page: 1, label: '第1页 封面' },
    { page: 2, label: '第2页 表一 课题组人员' },
    { page: 3, label: '第3页 表二 总结报告(上)' },
    { page: 4, label: '第4页 表二 总结报告与决算(下)' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/90 select-text overflow-y-auto">
      {/* 顶部公文工具控制栏 */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-300 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            官方制式结项鉴定书
          </span>
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-mono">
            <span>编号：<strong>{isAnonymous ? '【保密编号】' : PROJECT_METADATA.projectNo}</strong></span>
            <span>·</span>
            <span>立项：<strong>{PROJECT_METADATA.approvalDate}</strong></span>
            <span>·</span>
            <span>结项：<strong>{PROJECT_METADATA.concludingDate}</strong></span>
          </div>
        </div>

        {/* 模式切换与操作 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 排版浏览模式切换 */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('pagination')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'pagination'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="采用无滚动条单页分页模式浏览"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>分页浏览模式</span>
            </button>
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'continuous'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="A4四页顺序排列打印通读"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4通读排版</span>
            </button>
            <button
              onClick={() => setViewMode('a3_spread')}
              className={`px-3 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'a3_spread'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="模拟通知要求A3正反面双面打印中缝骑马钉对折拼版"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>A3中缝拼版仿真</span>
            </button>
          </div>

          {/* 盲审/实名切换 */}
          <button
            onClick={onToggleAnonymous}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 cursor-pointer transition ${
              isAnonymous 
                ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/30 font-bold' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isAnonymous ? '盲审匿名' : '实名版'}</span>
          </button>

          {/* 成员名单核验 */}
          <button
            onClick={openEditModal}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition"
            title="查验或核准课题组成员信息"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>课题组成员（{currentTeam.length}人）</span>
          </button>

          {/* 复制总结报告 */}
          <button
            onClick={handleCopySummaryReport}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedSummary ? '已复制' : '复制总结报告'}</span>
          </button>

          {/* 打印鉴定书 */}
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印鉴定书</span>
          </button>
        </div>
      </div>

      {/* 分页模式控制条（专用于分页浏览，不使用页面纵向滚动条） */}
      {viewMode === 'pagination' && (
        <div className="sticky top-[49px] z-20 bg-slate-100/95 backdrop-blur-xs border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePage(p => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一页</span>
            </button>
            <button
              onClick={() => setActivePage(p => Math.min(4, p + 1))}
              disabled={activePage === 4}
              className="px-3 py-1 rounded-md text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer shadow-2xs"
            >
              <span>下一页</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-600 ml-2">
              第 {activePage} 页 / 共 4 页
            </span>
          </div>

          <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-200">
            {PAGE_TABS.map(tab => (
              <button
                key={tab.page}
                onClick={() => setActivePage(tab.page)}
                className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                  activePage === tab.page 
                    ? 'bg-blue-600 text-white font-bold shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 font-serif">
            <span>支持键盘</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">→</kbd>
            <span>左右键快捷翻页</span>
          </div>
        </div>
      )}

      {/* 鉴定书页面呈现区 */}
      <div className="py-6 px-2 sm:px-6 w-full flex flex-col items-center">

        {/* ============================================================== */}
        {/* 模式一：分页浏览模式 (Pagination Mode) / 模式二：通读排版 (Continuous) */}
        {/* ============================================================== */}
        {(viewMode === 'pagination' || viewMode === 'continuous') && (
          <div className="w-full max-w-[210mm] space-y-8 flex flex-col items-center">

            {/* -------------------- Page 1: 鉴定书封面 -------------------- */}
            {(viewMode === 'continuous' || activePage === 1) && (
              <div 
                id="appraisal-page-1"
                className="doc-appraisal-sheet flex flex-col justify-between"
              >
                {/* 顶部公文编号 */}
                <div className="flex justify-between items-center text-slate-800 text-sm font-serif pt-2 pb-6 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-serif">
                    日照市社会科学规划课题结项材料
                  </span>
                  <div className="font-serif text-sm">
                    <span>编号：</span>
                    <span className="underline decoration-slate-400 font-bold font-mono px-2">
                      （ {isAnonymous ? '  ' : PROJECT_METADATA.projectNo} ）号
                    </span>
                  </div>
                </div>

                {/* 封面标题区域 */}
                <div className="text-center pt-10 pb-6 space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-[0.25em] font-serif">
                    日照市社会科学研究课题
                  </h2>
                  <div className="py-4">
                    <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-[0.6em] font-serif pl-3 border-y-2 border-slate-900 py-4 inline-block">
                      鉴 定 书
                    </h1>
                  </div>
                </div>

                {/* 核心填报栏 */}
                <div className="max-w-xl mx-auto w-full my-auto space-y-5 text-slate-900 px-4 sm:px-8">
                  {/* 课题类别 */}
                  <div className="flex items-baseline text-base sm:text-lg font-serif">
                    <span className="w-36 shrink-0 font-bold tracking-wider font-serif">
                      课 题 类 别：
                    </span>
                    <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif text-base sm:text-lg">
                      {PROJECT_METADATA.category}（医学卫生专项）
                    </div>
                  </div>

                  {/* 课题名称 */}
                  <div className="flex items-start text-base sm:text-lg font-serif">
                    <span className="w-36 shrink-0 font-bold tracking-wider font-serif pt-1">
                      课 题 名 称：
                    </span>
                    <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif font-bold text-base sm:text-lg leading-relaxed">
                      {maskText(PROJECT_METADATA.title)}
                    </div>
                  </div>

                  {/* 立项时间 */}
                  <div className="flex items-baseline text-base sm:text-lg font-serif">
                    <span className="w-36 shrink-0 font-bold tracking-wider font-serif">
                      立 项 时 间：
                    </span>
                    <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif text-base sm:text-lg font-bold">
                      2025年5月
                    </div>
                  </div>

                  {/* 课题组负责人 */}
                  <div className="flex items-baseline text-base sm:text-lg font-serif">
                    <span className="w-36 shrink-0 font-bold tracking-wider font-serif">
                      课题组负责人：
                    </span>
                    <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif text-base sm:text-lg font-bold">
                      {maskText(PROJECT_METADATA.leader)}
                    </div>
                  </div>

                  {/* 课题组所在单位 */}
                  <div className="flex items-baseline text-base sm:text-lg font-serif">
                    <span className="w-36 shrink-0 font-bold tracking-wider font-serif">
                      课题组所在单位：
                    </span>
                    <div className="flex-1 border-b-2 border-slate-900 pb-1 text-center font-serif text-base sm:text-lg font-bold">
                      {maskText(PROJECT_METADATA.leaderUnit)}
                    </div>
                  </div>
                </div>

                {/* 底部印制与年代落款 */}
                <div className="text-center pt-12 pb-6 space-y-2 border-t border-slate-200 mt-12 text-slate-800">
                  <p className="text-lg font-serif font-bold tracking-[0.3em]">
                    日照市社会科学界联合会 印制
                  </p>
                  <p className="text-sm font-serif text-slate-600">
                    2026 年 9 月
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono pt-1">
                    第 1 页（共 4 页 · 鉴定书封面）
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- Page 2: 表一 课题组基本情况 -------------------- */}
            {(viewMode === 'continuous' || activePage === 2) && (
              <div 
                id="appraisal-page-2"
                className="doc-appraisal-sheet flex flex-col justify-between"
              >
                <div>
                  {/* 页面表头 */}
                  <div className="text-center pb-3 border-b-2 border-slate-900">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-950 tracking-wider">
                      表一 课题组基本情况
                    </h2>
                    <p className="text-xs text-slate-500 font-serif mt-1">
                      注：课题组成员按实际分工与贡献排序，第一行为课题组负责人
                    </p>
                  </div>

                  {/* 课题组主要人员表格 (严格对照官方附件真实名单，一个字不改) */}
                  <div className="mt-4 border-2 border-slate-900 overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse font-serif">
                      <thead className="bg-slate-100 font-sans font-bold text-slate-900 border-b-2 border-slate-900">
                        <tr>
                          <th className="px-2.5 py-2 border-r border-slate-800 text-center w-16">姓名</th>
                          <th className="px-1.5 py-2 border-r border-slate-800 text-center w-10">性别</th>
                          <th className="px-1.5 py-2 border-r border-slate-800 text-center w-10">年龄</th>
                          <th className="px-2.5 py-2 border-r border-slate-800 text-center w-28">职务 / 职称</th>
                          <th className="px-3 py-2 border-r border-slate-800 text-center w-36">研究专长</th>
                          <th className="px-3 py-2 border-r border-slate-800 text-center">工作单位</th>
                          <th className="px-2.5 py-2 text-center w-32">课题内分工</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {currentTeam.map((member, idx) => (
                          <tr key={idx} className={idx === 0 ? 'bg-amber-50/50 font-semibold' : ''}>
                            <td className="px-2 py-2 border-r border-slate-800 text-center font-bold font-sans">
                              {maskText(member.name)}
                              {idx === 0 && <span className="block text-[10px] text-amber-800 font-normal">（负责人）</span>}
                            </td>
                            <td className="px-1.5 py-2 border-r border-slate-800 text-center">{member.gender}</td>
                            <td className="px-1.5 py-2 border-r border-slate-800 text-center font-mono">{member.age}</td>
                            <td className="px-2 py-2 border-r border-slate-800 text-slate-800">{member.position}</td>
                            <td className="px-2 py-2 border-r border-slate-800 text-slate-700 leading-snug">{member.expertise}</td>
                            <td className="px-2.5 py-2 border-r border-slate-800 text-center text-slate-700 text-[11px] leading-snug">
                              {maskText(member.workplace)}
                            </td>
                            <td className="px-2 py-2 text-slate-800 text-[11px] leading-snug text-justify">
                              {maskText(member.roleInProject)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 课题负责人声明及填报说明 */}
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-300 rounded-xs space-y-2 text-xs font-serif text-slate-700">
                    <p className="leading-relaxed text-justify indent-6">
                      <strong>课题负责人承诺：</strong>
                      本课题组成员全部为五莲县人民医院一线医工、临床、医务与信息骨干人员，在课题申报、实地调研、系统自研攻关、全院试运行及结项总结全过程中均做出了实质性研究贡献。所列人员严格依照立项申报附件名单，信息真实有效，无挂名违规及臆造人员现象。
                    </p>
                    <div className="flex justify-between items-center pt-2 font-serif text-xs">
                      <span>课题负责人签名：<strong className="underline decoration-slate-400 font-sans ml-1 text-sm">{maskText(PROJECT_METADATA.leader)}</strong></span>
                      <span>签署日期：2026年9月25日</span>
                    </div>
                  </div>
                </div>

                {/* 页脚 */}
                <div className="text-center text-xs text-slate-400 font-mono pt-4 border-t border-slate-200">
                  第 2 页（共 4 页 · 表一 课题组基本情况）
                </div>
              </div>
            )}

            {/* -------------------- Page 3: 表二 课题研究工作总结报告（上） -------------------- */}
            {(viewMode === 'continuous' || activePage === 3) && (
              <div 
                id="appraisal-page-3"
                className="doc-appraisal-sheet flex flex-col justify-between"
              >
                <div>
                  {/* 页面表头 */}
                  <div className="text-center pb-3 border-b-2 border-slate-900">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-950 tracking-wider">
                      表二 课题研究工作总结报告
                    </h2>
                  </div>

                  {/* 总结报告正文：第一部分至第三部分 */}
                  <div className="mt-4 space-y-4 text-xs font-serif text-slate-800 leading-relaxed text-justify">
                    {OFFICIAL_APPRAISAL_SUMMARY_REPORT.sections.slice(0, 3).map((section, sIdx) => (
                      <div key={sIdx} className="space-y-1.5 pb-2.5 border-b border-slate-100 last:border-b-0">
                        <h3 className="font-bold text-slate-950 font-sans text-sm flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-xs">
                            {section.number}
                          </span>
                          <span>{section.title}</span>
                        </h3>
                        {section.intro && (
                          <p className="indent-6 text-slate-700 leading-relaxed">
                            {maskText(section.intro)}
                          </p>
                        )}
                        <div className="space-y-1.5 pl-2">
                          {section.items.map((item, iIdx) => (
                            <div key={iIdx} className="space-y-0.5">
                              <h4 className="font-bold text-slate-900 font-sans text-xs">
                                {item.itemIndex}. {item.itemTitle}
                              </h4>
                              <p className="indent-6 text-slate-700 leading-relaxed">
                                {maskText(item.content)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 页脚 */}
                <div className="text-center text-xs text-slate-400 font-mono pt-4 border-t border-slate-200">
                  第 3 页（共 4 页 · 表二 总结报告 第 1 页）
                </div>
              </div>
            )}

            {/* -------------------- Page 4: 表二 课题研究工作总结报告（下：应用价值与经费决算） -------------------- */}
            {(viewMode === 'continuous' || activePage === 4) && (
              <div 
                id="appraisal-page-4"
                className="doc-appraisal-sheet flex flex-col justify-between"
              >
                <div>
                  {/* 页面表头 */}
                  <div className="text-center pb-3 border-b-2 border-slate-900">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-950 tracking-wider">
                      表二 课题研究工作总结报告（续）
                    </h2>
                  </div>

                  {/* 总结报告正文：第四、五部分 */}
                  <div className="mt-4 space-y-4 text-xs font-serif text-slate-800 leading-relaxed text-justify">
                    {OFFICIAL_APPRAISAL_SUMMARY_REPORT.sections.slice(3, 5).map((section, sIdx) => (
                      <div key={sIdx} className="space-y-1.5 pb-2 border-b border-slate-100 last:border-b-0">
                        <h3 className="font-bold text-slate-950 font-sans text-sm flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-xs">
                            {section.number}
                          </span>
                          <span>{section.title}</span>
                        </h3>
                        <div className="space-y-1.5 pl-2">
                          {section.items.map((item, iIdx) => (
                            <div key={iIdx} className="space-y-0.5">
                              <h4 className="font-bold text-slate-900 font-sans text-xs">
                                {item.itemIndex}. {item.itemTitle}
                              </h4>
                              <p className="indent-6 text-slate-700 leading-relaxed">
                                {maskText(item.content)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* 课题经费决算执行情况表 */}
                    <div className="pt-2">
                      <h4 className="font-bold text-slate-950 font-sans text-xs mb-1.5">
                        【课题经费收支决算表】（单位：元）
                      </h4>
                      <table className="w-full text-[11px] border border-slate-800 text-left">
                        <thead className="bg-slate-100 font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-1.5 border-r border-slate-800 text-center w-10">序号</th>
                            <th className="p-1.5 border-r border-slate-800">支出科目</th>
                            <th className="p-1.5 border-r border-slate-800 text-right w-20">预算金额</th>
                            <th className="p-1.5 border-r border-slate-800 text-right w-20">决算金额</th>
                            <th className="p-1.5">执行情况与凭据说明</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300">
                          <tr>
                            <td className="p-1.5 border-r border-slate-800 text-center font-mono">1</td>
                            <td className="p-1.5 border-r border-slate-800">文献检索、资料收集与打印装订费</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono">1,000</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono font-bold text-emerald-800">1,000</td>
                            <td className="p-1.5 text-slate-600">知网文献查重、法规汇编印制、浅蓝封面胶装</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r border-slate-800 text-center font-mono">2</td>
                            <td className="p-1.5 border-r border-slate-800">调研摸底、数据清洗及专家咨询费</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono">1,500</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono font-bold text-emerald-800">1,500</td>
                            <td className="p-1.5 text-slate-600">45个科室田野调查、3位同行专家鉴定咨询费</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 border-r border-slate-800 text-center font-mono">3</td>
                            <td className="p-1.5 border-r border-slate-800">成果撰写、论文发表及结项制作费</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono">1,500</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono font-bold text-emerald-800">1,500</td>
                            <td className="p-1.5 text-slate-600">《装备维修技术》论文版面发表、档案袋制作</td>
                          </tr>
                          <tr className="bg-slate-100 font-bold">
                            <td colSpan={2} className="p-1.5 border-r border-slate-800 text-right">合 计</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono">4,000</td>
                            <td className="p-1.5 border-r border-slate-800 text-right font-mono text-emerald-800">4,000</td>
                            <td className="p-1.5 text-emerald-800">执行率100%，结余0元，资金来源：单位资助</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* 页脚 */}
                <div className="text-center text-xs text-slate-400 font-mono pt-4 border-t border-slate-200">
                  第 4 页（共 4 页 · 表二 总结报告与决算 第 2 页）
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* 模式三：A3中缝骑马钉双面拼版仿真 (A3 Saddle Stitch Spread)     */}
        {/* ============================================================== */}
        {viewMode === 'a3_spread' && (
          <div className="w-full space-y-12 flex flex-col items-center">
            
            {/* 拼版印张一 说明 */}
            <div className="max-w-[420mm] w-full text-center space-y-1">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs">
                A3外印张（封底留白待评 · 封面）
              </span>
            </div>

            {/* A3 印张 1：封底 (留白) + P1 (封面) */}
            <div className="doc-a3-spread-sheet">
              {/* 中缝折线与骑马订 */}
              <div className="doc-a3-fold-line" />
              <div className="doc-a3-staple-top" title="骑马订上装订钉位" />
              <div className="doc-a3-staple-bottom" title="骑马订下装订钉位" />

              {/* 左半页：封底（依规留白，不臆造专家评审意见） */}
              <div className="w-1/2 p-10 border-r border-slate-300 flex flex-col justify-between text-xs bg-slate-50/20">
                <div className="my-auto text-center space-y-4 text-slate-400 font-serif">
                  <div className="w-16 h-0.5 bg-slate-300 mx-auto" />
                  <p className="text-sm font-bold tracking-widest text-slate-400 font-serif">（ 封 底 ）</p>
                  <p className="text-[11px] leading-relaxed max-w-xs mx-auto text-slate-400">
                    按照社科规划课题结项送审规范，申报送审材料不臆造专家评审意见与管理审批表。
                  </p>
                  <div className="w-16 h-0.5 bg-slate-300 mx-auto" />
                </div>
                <div className="text-center text-[10px] text-slate-400 font-mono">
                  封底
                </div>
              </div>

              {/* 右半页：第 1 页（封面） */}
              <div className="w-1/2 p-10 flex flex-col justify-between text-center">
                <div className="text-right text-[11px] font-mono text-slate-700">
                  编号：（ {isAnonymous ? '  ' : PROJECT_METADATA.projectNo} ）号
                </div>

                <div className="my-auto space-y-5">
                  <h2 className="text-xl font-bold font-serif text-slate-900 tracking-widest">
                    日照市社会科学研究课题
                  </h2>
                  <div className="py-2">
                    <h1 className="text-3xl font-black font-serif text-slate-950 tracking-[0.4em] border-y-2 border-slate-900 py-3 inline-block">
                      鉴 定 书
                    </h1>
                  </div>

                  <div className="max-w-xs mx-auto text-left text-xs font-serif space-y-2.5 pt-4">
                    <div className="flex border-b border-slate-800 pb-1">
                      <span className="w-24 shrink-0 font-bold">课题类别：</span>
                      <span className="font-bold">{PROJECT_METADATA.category}</span>
                    </div>
                    <div className="flex border-b border-slate-800 pb-1">
                      <span className="w-24 shrink-0 font-bold">立项时间：</span>
                      <span className="font-bold">2025年5月</span>
                    </div>
                    <div className="flex border-b border-slate-800 pb-1">
                      <span className="w-24 shrink-0 font-bold">课题负责人：</span>
                      <span className="font-bold">{maskText(PROJECT_METADATA.leader)}</span>
                    </div>
                    <div className="flex border-b border-slate-800 pb-1">
                      <span className="w-24 shrink-0 font-bold">所在单位：</span>
                      <span className="font-bold">{maskText(PROJECT_METADATA.leaderUnit)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-serif space-y-1">
                  <p className="font-bold tracking-widest">日照市社会科学界联合会 印制</p>
                  <p className="text-slate-500 font-mono text-[10px]">2026年9月 · 第 1 页（封面）</p>
                </div>
              </div>
            </div>

            {/* 拼版印张二 说明 */}
            <div className="max-w-[420mm] w-full text-center space-y-1 pt-6">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 font-bold text-xs">
                A3内印张（表一 课题组人员 · 表二 总结报告与决算）
              </span>
            </div>

            {/* A3 印张 2：P2 (人员表) + P3 (总结报告) */}
            <div className="doc-a3-spread-sheet">
              {/* 中缝折线与骑马订 */}
              <div className="doc-a3-fold-line" />
              <div className="doc-a3-staple-top" title="骑马订上装订钉位" />
              <div className="doc-a3-staple-bottom" title="骑马订下装订钉位" />

              {/* 左半页：第 2 页（人员表） */}
              <div className="w-1/2 p-8 border-r border-slate-300 flex flex-col justify-between text-xs">
                <div>
                  <div className="text-center font-bold text-xs border-b-2 border-slate-900 pb-1.5 mb-2 font-serif">
                    表一 课题组基本情况
                  </div>
                  <table className="w-full text-[10px] border border-slate-800 text-left">
                    <thead className="bg-slate-100 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-1 border-r border-slate-800 text-center">姓名</th>
                        <th className="p-1 border-r border-slate-800 text-center">职务/职称</th>
                        <th className="p-1 border-r border-slate-800 text-center">研究专长</th>
                        <th className="p-1 text-center">工作单位</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {currentTeam.map((m, idx) => (
                        <tr key={idx} className={idx === 0 ? 'bg-amber-50/60 font-semibold' : ''}>
                          <td className="p-1 border-r border-slate-800 text-center font-bold">{maskText(m.name)}</td>
                          <td className="p-1 border-r border-slate-800 text-slate-700">{m.position}</td>
                          <td className="p-1 border-r border-slate-800 text-[9px] text-slate-600 truncate max-w-[120px]">{m.expertise}</td>
                          <td className="p-1 text-center text-[9px]">{maskText(m.workplace)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-2 bg-slate-50 border border-slate-200 text-[10px] leading-relaxed">
                    <strong>课题负责人声明：</strong>
                    团队成员均为五莲县人民医院骨干，真实承担课题研究与闭环管理攻坚任务，严格遵照申报附件名单录入，无挂名违规现象。
                  </div>
                </div>
                <div className="text-center text-[10px] text-slate-400">
                  第 2 页（内页左半）
                </div>
              </div>

              {/* 右半页：第 3 页（总结报告与决算） */}
              <div className="w-1/2 p-8 flex flex-col justify-between text-xs">
                <div>
                  <div className="text-center font-bold text-xs border-b-2 border-slate-900 pb-1.5 mb-2 font-serif">
                    表二 课题研究工作总结报告与经费决算
                  </div>
                  <div className="space-y-2 text-[10px] text-justify leading-relaxed">
                    {OFFICIAL_APPRAISAL_SUMMARY_REPORT.sections.slice(0, 4).map((sec, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-1">
                        <strong className="text-slate-900">{sec.number}、{sec.title}：</strong>
                        <span className="text-slate-700">{maskText(sec.items[0]?.content || '')}</span>
                      </div>
                    ))}
                    <div className="p-1.5 bg-slate-50 border border-slate-200 mt-2">
                      <div className="font-bold text-[10px] mb-0.5">【经费决算】：</div>
                      <div className="flex justify-between text-[9px]">
                        <span>总预算：4,000元</span>
                        <span>决算开支：4,000元</span>
                        <span className="text-emerald-700 font-bold">结余：0元 (单位资助到位)</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center text-[10px] text-slate-400">
                  第 3-4 页（内页右半）
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 成员在线查看与核准弹窗 */}
      {showEditTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-sans">课题组成员信息查看与核准</h3>
                <span className="text-xs text-slate-300 font-mono">（严格按照官方真实名单输入，一个字不改）</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditTeamModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions bar inside modal */}
            <div className="bg-amber-50 px-6 py-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-amber-900 font-bold">
                当前成员数：{editingList.length} 人（负责人 1 人 + 课题组成员 {editingList.length - 1} 人）
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingList(JSON.parse(JSON.stringify(RESEARCH_TEAM)))}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  <span>恢复真实名单（含负责人共9人）</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingList([
                      ...editingList,
                      {
                        name: '',
                        gender: '男',
                        age: 38,
                        workplace: '五莲县人民医院',
                        position: '主管人员',
                        expertise: '医疗设备与信息化管理',
                        roleInProject: '课题组成员，负责业务流程与实证'
                      }
                    ]);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加成员</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-16 text-center">序号</th>
                      <th className="p-2 w-24">姓名</th>
                      <th className="p-2 w-16 text-center">性别</th>
                      <th className="p-2 w-16 text-center">年龄</th>
                      <th className="p-2 w-32">职务/职称</th>
                      <th className="p-2 w-36">研究专长</th>
                      <th className="p-2">工作单位</th>
                      <th className="p-2 w-32">课题内分工</th>
                      <th className="p-2 w-12 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {editingList.map((item, idx) => (
                      <tr key={idx} className={idx === 0 ? 'bg-amber-50/40' : ''}>
                        <td className="p-2 text-center font-bold text-slate-500">
                          {idx === 0 ? '负责人' : idx + 1}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].name = e.target.value;
                              setEditingList(updated);
                            }}
                            placeholder="姓名"
                            className="w-full p-1 border border-slate-300 rounded text-xs font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={item.gender}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].gender = e.target.value;
                              setEditingList(updated);
                            }}
                            className="p-1 border border-slate-300 rounded text-xs"
                          >
                            <option value="男">男</option>
                            <option value="女">女</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={item.age}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].age = parseInt(e.target.value, 10) || 0;
                              setEditingList(updated);
                            }}
                            className="w-14 p-1 border border-slate-300 rounded text-xs text-center font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.position}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].position = e.target.value;
                              setEditingList(updated);
                            }}
                            placeholder="职务/职称"
                            className="w-full p-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.expertise}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].expertise = e.target.value;
                              setEditingList(updated);
                            }}
                            placeholder="研究专长"
                            className="w-full p-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.workplace}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].workplace = e.target.value;
                              setEditingList(updated);
                            }}
                            placeholder="工作单位"
                            className="w-full p-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.roleInProject}
                            onChange={(e) => {
                              const updated = [...editingList];
                              updated[idx].roleInProject = e.target.value;
                              setEditingList(updated);
                            }}
                            placeholder="课题内分工"
                            className="w-full p-1 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingList(editingList.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="删除此行"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                保存后将自动同步至：《鉴定书》表一、立项申请书原件、结项报告封面及装订报送包。
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditTeamModal(false)}
                  className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedTeam}
                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存并同步</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量粘贴名单解析弹窗 */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base font-sans">从文本/附件批量粘贴录入名单</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                请直接复制您手头附件中的人员名单并粘贴在下方，系统将自动识别解析：
              </p>
              <textarea
                value={pasteRawText}
                onChange={(e) => setPasteRawText(e.target.value)}
                rows={6}
                placeholder="示例格式：&#10;吴耀宝 男 55 临床、医疗设备管理 五莲县人民医院 院长/主任医师&#10;严金光 男 46 临床、信息化 五莲县人民医院 党委委员副院长/副主任医师"
                className="w-full p-3 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-1.5 border border-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleApplyPaste}
                disabled={!pasteRawText.trim()}
                className="px-5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>立即解析并应用</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 浮动提示 Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
