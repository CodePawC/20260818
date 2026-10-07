import React, { useState } from 'react';
import { 
  Printer, 
  Layers, 
  FileText, 
  Users, 
  Calendar, 
  Coins, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  BookOpen,
  ChevronLeft
} from 'lucide-react';
import { PROJECT_METADATA, RESEARCH_TEAM, ResearchTeamMember } from '../../data/projectConcludingData';

interface ProjectApplicationViewProps {
  isAnonymous: boolean;
  maskText: (text: string) => string;
  teamMembers?: ResearchTeamMember[];
}

export const ProjectApplicationView: React.FC<ProjectApplicationViewProps> = ({
  isAnonymous,
  maskText,
  teamMembers
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'paginated' | 'continuous'>('paginated');

  const handlePrint = () => {
    window.print();
  };

  const currentTeam = teamMembers && teamMembers.length > 0 ? teamMembers : RESEARCH_TEAM;
  const leader = currentTeam[0];
  const members = currentTeam.slice(1);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/90 overflow-y-auto select-text">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-300 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <Layers className="w-3.5 h-3.5 text-indigo-700" />
            课题立项申请书原件
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            100% 对齐官方申报扫描底册 · 真实人员严谨录入（课题组共 9 人）
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 排版模式切换 */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('paginated')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'paginated' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              逐页核验
            </button>
            <button
              onClick={() => setViewMode('continuous')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                viewMode === 'continuous' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              连续通读 (全11页)
            </button>
          </div>

          {/* 页面快速切换控制器 */}
          {viewMode === 'paginated' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                title="上一页"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold text-slate-700 px-1.5">
                第 {currentPage} / 11 页
              </span>
              <button
                disabled={currentPage >= 11}
                onClick={() => setCurrentPage(p => Math.min(11, p + 1))}
                className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                title="下一页"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印申请书原件</span>
          </button>
        </div>
      </div>

      {/* 页面快速导航卡 */}
      <div className="bg-indigo-900 text-indigo-100 px-4 sm:px-8 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">直达原附件章节：</span>
          {[
            { p: 1, label: '封面' },
            { p: 2, label: '申请人承诺' },
            { p: 3, label: '单位承诺' },
            { p: 4, label: '一、课题组基本情况 (重点)' },
            { p: 5, label: '二、设计论证(背景)' },
            { p: 9, label: '阶段性计划' },
            { p: 10, label: '三、经费预算' },
            { p: 11, label: '四、单位审核意见' },
          ].map(item => (
            <button
              key={item.p}
              onClick={() => {
                setCurrentPage(item.p);
                if (viewMode === 'continuous') {
                  document.getElementById(`app-page-${item.p}`)?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`px-2 py-0.5 rounded text-[11px] transition cursor-pointer ${
                currentPage === item.p ? 'bg-white text-indigo-900 font-bold' : 'hover:bg-indigo-800 text-indigo-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] font-mono text-indigo-300">
          课题组成员严格按照申报附件真实名单录入：吴耀宝、严金光、王治权、王方鑫、葛晓燕、王增祝、杨志峰、胡云飞（共8人，含负责人共9人）
        </div>
      </div>

      {/* 文档实际页面呈现区 */}
      <div className="py-8 px-2 sm:px-6 w-full flex flex-col items-center">
        <div className="w-full max-w-[210mm] space-y-8 flex flex-col items-center">

          {/* ============================================================== */}
          {/* Page 1: 申请书封面                                              */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 1) && (
            <div id="app-page-1" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="pt-20 text-center space-y-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-serif tracking-widest">
                  日照市医学卫生类专项研究课题
                </h1>
                <div className="py-2">
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-950 font-serif tracking-[0.4em] inline-block">
                    申 请 书
                  </h2>
                </div>
              </div>

              {/* 核心字段下划线槽（与原件一模一样） */}
              <div className="max-w-md mx-auto w-full my-auto space-y-6 text-base font-serif px-4">
                <div className="flex items-baseline">
                  <span className="w-28 shrink-0 font-bold tracking-wider">课题类别</span>
                  <div className="flex-1 border-b border-slate-900 pb-1 text-center font-bold">
                    数字健康与创新
                  </div>
                </div>

                <div className="flex items-start">
                  <span className="w-28 shrink-0 font-bold tracking-wider pt-1">课题名称</span>
                  <div className="flex-1 border-b border-slate-900 pb-1 text-center font-bold text-sm leading-relaxed">
                    基于主数据治理与人工智能辅助交互的县级医院医学装备全生命周期闭环管理模式研究
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className="w-28 shrink-0 font-bold tracking-wider">课题负责人</span>
                  <div className="flex-1 border-b border-slate-900 pb-1 text-center font-bold">
                    {maskText(PROJECT_METADATA.leader)}
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className="w-28 shrink-0 font-bold tracking-wider">所在单位</span>
                  <div className="flex-1 border-b border-slate-900 pb-1 text-center font-bold">
                    {maskText(PROJECT_METADATA.leaderUnit)}
                  </div>
                </div>

                <div className="flex items-baseline">
                  <span className="w-28 shrink-0 font-bold tracking-wider">填表日期</span>
                  <div className="flex-1 border-b border-slate-900 pb-1 text-center font-bold">
                    2026 年 5 月
                  </div>
                </div>
              </div>

              {/* 底部主办机构与日期 */}
              <div className="text-center pt-16 pb-12 space-y-2 text-slate-800 font-serif">
                <p className="text-lg font-bold tracking-widest">日照市社会科学界联合会</p>
                <p className="text-lg font-bold tracking-widest">日 照 市 医 学 会</p>
                <p className="text-base text-slate-600 pt-1">2026 年 4 月</p>
                <div className="text-xs text-slate-400 font-mono pt-4">- 1 -</div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 2: 课题申请人承诺                                          */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 2) && (
            <div id="app-page-2" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="pt-16 max-w-lg mx-auto w-full space-y-10">
                <h2 className="text-lg font-bold text-slate-950 font-serif">
                  课题申请人承诺：
                </h2>

                <p className="text-base font-serif leading-[2.2] indent-8 text-justify text-slate-800">
                  我对填写的本表各项内容的真实性负责，保证没有知识产权的争议。如获立项，我承诺以本表为有约束力的协议，遵守日照市社会科学研究课题管理的有关规定，按计划认真开展研究工作，取得预期研究成果。日照市社会科学研究课题管理办公室有权使用本课题所有数据和资料。
                </p>

                <div className="pt-32 text-right space-y-3 font-serif pr-8">
                  <div className="text-base">
                    申请人（签字）：<strong className="underline decoration-slate-400 font-sans ml-2 text-lg">{maskText('崔伟')}</strong>
                  </div>
                  <div className="text-base">
                    2026 年 5 月 10 日
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-4">- 2 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 3: 课题负责人所在单位承诺                                  */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 3) && (
            <div id="app-page-3" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif relative">
              <div className="pt-16 max-w-lg mx-auto w-full space-y-10">
                <h2 className="text-lg font-bold text-slate-950 font-serif">
                  课题负责人所在单位承诺：
                </h2>

                <p className="text-base font-serif leading-[2.2] indent-8 text-justify text-slate-800">
                  本单位对申请人填写的各项内容的真实性负责，保证没有知识产权的争议。如获立项，承诺以本表为有约束力的协议，遵守日照市社会科学研究课题管理的有关规定，为本课题研究提供必要的支持，并做好课题研究的协调和管理工作，对本课题的完成提供信誉保证。
                </p>

                <div className="pt-32 text-right space-y-3 font-serif pr-8 relative">
                  <div className="text-base">
                    所在单位（盖章）
                  </div>
                  <div className="text-base">
                    2026 年 5 月 10 日
                  </div>

                  {/* 红色仿真公章 */}
                  <div className="absolute top-24 right-4 w-28 h-28 official-red-stamp pointer-events-none flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[10px] font-bold tracking-tighter leading-none mb-1">五莲县人民医院</span>
                    <span className="text-xl leading-none">★</span>
                    <span className="text-[9px] font-bold tracking-widest leading-none mt-1">公 司 专 用</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-4">- 3 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 4: 一、课题组基本情况 (负责人与前5位成员)                   */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 4) && (
            <div id="app-page-4" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-950 font-serif border-b-2 border-slate-900 pb-2">
                  一、课题组基本情况
                </h2>

                {/* 课题组负责人表 */}
                <div className="border border-slate-900 overflow-hidden text-xs">
                  <div className="bg-slate-100 font-bold text-center py-1.5 border-b border-slate-900 text-sm font-sans">
                    课题组负责人
                  </div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-slate-900">
                        <td className="w-20 bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">姓 名</td>
                        <td className="w-24 p-2 border-r border-slate-900 text-center font-bold font-sans text-sm">{maskText(leader.name)}</td>
                        <td className="w-16 bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">性 别</td>
                        <td className="w-16 p-2 border-r border-slate-900 text-center">{leader.gender}</td>
                        <td className="w-24 bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">出生年月</td>
                        <td className="p-2 text-center font-mono font-bold">{leader.birthDate || '1984.2'}</td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td className="bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">研究专长</td>
                        <td colSpan={3} className="p-2 border-r border-slate-900 leading-relaxed">{leader.expertise}</td>
                        <td className="bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">学 历</td>
                        <td className="p-2 text-center font-bold">本科</td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td className="bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">工作单位<br/>行政职务</td>
                        <td colSpan={3} className="p-2 border-r border-slate-900 font-bold">{maskText(leader.workplace)}</td>
                        <td className="bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">职 称</td>
                        <td className="p-2 text-center font-bold">{leader.position}</td>
                      </tr>
                      <tr className="border-b border-slate-900">
                        <td className="bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">
                          以往承担<br/>相关课题<br/>和研究的<br/>主要情况
                        </td>
                        <td colSpan={5} className="p-2.5 leading-relaxed text-justify indent-6">
                          长期从事医学装备全生命周期管理、设备维修维护、计量监管、医用耗材及供应商管理、医疗设备信息化建设等相关工作；围绕医学装备台账标准化、二维码报修、预防性维护、计量检测、设备档案归集、效益分析、主数据治理和一事一单任务数字化管理开展持续实践，具备本课题所需的实践基础、数据基础和组织协调条件。
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-50 font-bold p-2 border-r border-slate-900 text-center">联系电话</td>
                        <td colSpan={5} className="p-2 font-mono">
                          办公电话：06337991237 &nbsp;&nbsp;&nbsp;&nbsp; 手机：15865997717
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 课题组主要成员（不包含负责人） */}
                <div className="border border-slate-900 overflow-hidden text-xs mt-3">
                  <div className="bg-slate-100 font-bold text-center py-1.5 border-b border-slate-900 text-sm font-sans">
                    课题组主要成员（不包含负责人）
                  </div>
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 font-bold border-b border-slate-900 text-center">
                      <tr>
                        <th className="p-1.5 border-r border-slate-900 w-16">姓名</th>
                        <th className="p-1.5 border-r border-slate-900 w-10">性别</th>
                        <th className="p-1.5 border-r border-slate-900 w-10">年龄</th>
                        <th className="p-1.5 border-r border-slate-900 w-36">研究专长</th>
                        <th className="p-1.5 border-r border-slate-900 w-28">工作单位</th>
                        <th className="p-1.5">职务/职称</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {members.slice(0, 5).map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 border-r border-slate-900 text-center font-bold">{maskText(m.name)}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center">{m.gender}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center font-mono">{m.age}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center">{m.expertise}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center">{maskText(m.workplace)}</td>
                          <td className="p-1.5 text-center">{m.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 4 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 5: 成员续表 (王增祝、杨志峰、胡云飞) + 二、课题设计论证 (背景) */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 5) && (
            <div id="app-page-5" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="space-y-4">
                {/* 成员续表 */}
                <div className="border border-slate-900 overflow-hidden text-xs">
                  <div className="bg-slate-100 font-bold text-center py-1 border-b border-slate-900 text-xs font-sans text-slate-800">
                    课题组主要成员情况（续表）
                  </div>
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-50 font-bold border-b border-slate-900 text-center">
                      <tr>
                        <th className="p-1.5 border-r border-slate-900 w-16">姓名</th>
                        <th className="p-1.5 border-r border-slate-900 w-10">性别</th>
                        <th className="p-1.5 border-r border-slate-900 w-10">年龄</th>
                        <th className="p-1.5 border-r border-slate-900 w-36">研究专长</th>
                        <th className="p-1.5 border-r border-slate-900 w-28">工作单位</th>
                        <th className="p-1.5">职务/职称</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {members.slice(5).map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 border-r border-slate-900 text-center font-bold w-16">{maskText(m.name)}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center w-10">{m.gender}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center font-mono w-10">{m.age}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center w-36">{m.expertise}</td>
                          <td className="p-1.5 border-r border-slate-900 text-center w-28">{maskText(m.workplace)}</td>
                          <td className="p-1.5 text-center">{m.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 二、课题设计论证 */}
                <div className="space-y-3 pt-2">
                  <h2 className="text-base font-bold text-slate-950 font-serif border-b border-slate-900 pb-1">
                    二、课题设计论证（3000 字内，可续页）
                  </h2>

                  <h3 className="font-bold text-sm text-slate-900 font-serif">
                    1.本课题研究涉及的研究背景，研究现状及课题重要性分析。
                  </h3>

                  <div className="text-xs sm:text-sm font-serif leading-relaxed text-justify space-y-2.5 text-slate-800">
                    <p className="indent-6">
                      随着医院高质量发展和智慧医院建设不断推进，医学装备已由传统资产管理对象，逐步转变为影响医疗质量安全、运营效率、成本控制和服务能力的重要资源。县级综合医院医学装备种类多、数量大、更新快，涉及采购论证、验收建档、临床使用、维修维护、预防性保养、计量检测、风险预警、效益分析和报废处置等多个环节，对管理规范化、数据标准化和流程闭环化提出了更高要求。
                    </p>
                    <p className="indent-6">
                      当前，县级医院医学装备管理普遍存在基础数据来源分散、设备名称和分类口径不统一、供应商及厂家信息不规范、维修保养记录碎片化、档案资料归集不完整、计量检测与设备台账脱节、设备效益评价不足等问题，导致管理工作更多停留在台账记录和事后维修层面，难以形成数据驱动的全生命周期闭环管理。
                    </p>
                    <p className="indent-6">
                      与此同时，医学装备科、信息科、后勤保障等部门在日常管理中还面临大量任务碎片化问题。部分工作通过口头交代、电话通知、微信消息或会议安排产生，存在任务来源分散、责任边界不清、过程记录不足、完成情况难以追踪、工作量难以统计、完成质量难以评价等问题。与临床业务相比，后勤保障类工作的过程性价值缺乏量化呈现，不利于管理评价、绩效分析和持续改进。
                    </p>
                    <p className="indent-6">
                      医院主数据管理强调以统一编码、统一标准、统一口径对医院核心数据对象进行治理。将主数据治理引入医学装备运营管理，可从源头解决设备、
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 5 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 6: 论证第2页 (主要观点与研究内容)                         */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 6) && (
            <div id="app-page-6" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="text-xs sm:text-sm font-serif leading-relaxed text-justify space-y-2.5 text-slate-800 pt-4">
                <p>
                  科室、人员、供应商、耗材、医保编码等基础数据不一致问题，为医学装备全生命周期业务闭环提供可信数据底座。近年来，以大语言模型为核心的人工智能辅助交互技术快速发展，为医院管理数字化提供了新的工具。通过人工智能辅助交互，可辅助完成报修申请、巡检记录、领导指示、会议任务、不良事件上报、设备借还等信息采集，经人工确认后生成标准化任务单或业务记录，从而降低系统录入门槛，提高数据采集完整性和业务闭环效率。
                </p>
                <p className="indent-6">
                  本课题立足县级医院医学装备管理实际场景，拟以主数据治理为基础，以人工智能辅助交互为辅助工具，以一事一单任务数字化为管理入口，以医学装备全生命周期闭环管理为主线，探索形成一套可落地、可评价、可复制的医学装备闭环管理模式。该研究对于提升县级医院医学装备管理水平、保障医疗质量安全、促进后勤保障工作量化评价和推动医院数字化转型具有现实意义。
                </p>

                <h3 className="font-bold text-sm text-slate-900 font-serif pt-2">
                  2.本课题研究的基本内容、主要思想或主要观点，研究重点及难点、突破点分析。
                </h3>

                <p className="indent-6">
                  本课题的基本思路是：以医院主数据管理平台为数据底座，以人工智能辅助交互技术为辅助工具，以一事一单任务数字化管理为入口，以医学装备全生命周期闭环管理为主线，构建主数据标准化、业务流程闭环化、任务管理数字化、数据采集便捷化、管理评价指标化的县级医院医学装备闭环管理模式。
                </p>
                <p className="indent-6">
                  主要研究内容包括以下五个方面：
                </p>
                <p className="indent-6">
                  一是开展县级医院医学装备管理现状调查。围绕设备台账、分类编码、供应商信息、维修保养、计量检测、档案归集、效益分析、报废处置等环节，梳理现有管理流程、数据来源、记录方式和关键问题，重点识别基础数据不统一、流程衔接不紧密、任务过程难追踪、管理评价缺少量化依据等现实问题。
                </p>
                <p className="indent-6">
                  二是构建医学装备主数据治理模型。以设备主数据为核心，关联科室主数据、人员主数据、供应商主数据、耗材主数据和医保编码映射等基础数据，明确字段标准、编码规则、数据来源、审核流程、维护机制和更新责任。通过统一设备名称、分类编码、规格型号、生产厂家、供应商、使用科
                </p>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 6 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 7: 论证第3页 (研究内容续、主要观点与突破点)                */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 7) && (
            <div id="app-page-7" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="text-xs sm:text-sm font-serif leading-relaxed text-justify space-y-2.5 text-slate-800 pt-4">
                <p>
                  室、资产编号等关键字段，为医学装备全生命周期闭环管理提供标准化数据基础。
                </p>
                <p className="indent-6">
                  三是设计一事一单任务数字化管理体系。将领导指示、电话安排、微信消息、会议纪要、巡检发现、风险预警、设备报修、不良事件等多来源任务信息，按照“任务产生、责任分派、过程记录、结果验收、资料归档、数据分析”六个环节进行闭环管理。通过任务标准化和过程留痕，实现后勤保障类工作可追踪、可统计、可评价、可沉淀。
                </p>
                <p className="indent-6">
                  四是探索人工智能辅助交互在医学装备管理中的应用。围绕自然语言报修、巡检问题记录、领导指示转任务、会议纪要提取任务、不良事件上报、设备借还记录、跨模块数据查询等典型场景，设计人工智能辅助交互的信息识别、内容提取和字段校验规则。人工智能生成内容经人工确认后进入正式业务流程，确保管理效率提升与质量安全控制相统一。
                </p>
                <p className="indent-6">
                  五是建立医学装备闭环管理评价指标体系。围绕设备主数据规范率、档案资料完整率、报修工单完整率、维修闭环率、预防性维护完成率、计量检测关联率、任务按时完成率、任务闭环率、人工智能辅助生成工单准确率、后勤工作量可视化覆盖率等指标，开展应用效果评价，为持续改进医学装备管理提供依据。
                </p>
                <p className="indent-6">
                  本课题的主要观点是：医学装备数字化管理不能仅停留在软件功能建设，而应首先解决基础数据标准和治理机制问题；一事一单任务数字化是推动后勤保障工作由经验管理向运营管理转变的重要入口；人工智能辅助交互的价值不在于替代人工决策，而在于降低数据采集门槛、辅助信息提取、提升业务闭环效率；主数据治理、人工智能辅助交互和一事一单闭环管理协同应用，能够形成可沉淀、可分析、可评价的医学装备管理数字资产。
                </p>
                <p className="indent-6">
                  本课题研究重点是主数据治理、一事一单任务闭环和人工智能辅助交互三者的融合机制。研究难点在于历史数据不规范、多系统编码口径不一致、非结构化任务信息难以标准化、人工智能识别结果需要人工确认以及使用人员对新型工作方式的适应性。突破点在于以设备唯一标识和主数据编码为基础，以一事一单为管理入口，以人工智能辅助交互为辅助工具，将设备、任务、人员、科室、供应商和费用等信息进行关联，形成县级医院医学装备全生命周期闭环管理的新模式。
                </p>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 7 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 8: 论证第4页 (具体方法)                                    */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 8) && (
            <div id="app-page-8" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="space-y-3 pt-4">
                <h3 className="font-bold text-sm text-slate-900 font-serif">
                  3.本课题研究的具体方法以及研究的阶段性计划。
                </h3>

                <div className="text-xs sm:text-sm font-serif leading-relaxed text-justify space-y-2.5 text-slate-800">
                  <p className="indent-6">
                    本课题采用文献研究、现状调查、流程再造、数据治理、案例研究和指标评价相结合的方法。
                  </p>
                  <p className="indent-6">
                    第一，开展文献与政策研究。梳理医学装备管理、医院信息化、主数据治理、人工智能辅助交互应用、任务数字化管理、医疗质量安全等相关政策、标准和研究成果，为课题研究提供理论和政策依据。
                  </p>
                  <p className="indent-6">
                    第二，开展现状调查。收集医院医学装备台账、维修记录、计量检测记录、档案资料、供应商信息、耗材及医保编码等相关数据，同步调研口头任务、电话任务、微信任务、会议任务等非结构化任务管理现状，分析数据质量问题和流程管理短板。
                  </p>
                  <p className="indent-6">
                    第三，开展流程再造。围绕医学装备申请、论证、采购、验收、建档、使用、报修、维修、保养、计量、风险预警、效益评价和报废处置等环节，设计全生命周期闭环管理流程，明确岗位责任、业务节点、数据字段和资料归档要求。
                  </p>
                  <p className="indent-6">
                    第四，开展主数据建模。建立设备、科室、人员、供应商、耗材等主数据标准，明确字段规范、编码规则、维护流程和审核机制，形成医学装备主数据治理框架。
                  </p>
                  <p className="indent-6">
                    第五，开展人工智能辅助交互应用场景设计。针对自然语言报修、领导指示转任务、会议纪要提取任务、巡检问题记录、不良事件上报、设备借还记录、数据查询等场景，设计提示词规则、字段提取规则和人工确认机制，验证人工智能辅助交互在降低录入门槛和提升数据完整性方面的作用。
                  </p>
                  <p className="indent-6">
                    第六，开展应用验证和指标评价。选择部分医学装备管理场景开展应用验证，对比优化前后在数据完整性、工单闭环率、任务按时完成率、记录规范性和工作量可视化等方面的变化，形成评价结果和改进建议。
                  </p>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 8 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 9: 论证第5页 (阶段性计划)                                  */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 9) && (
            <div id="app-page-9" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="space-y-4 pt-4">
                <h3 className="font-bold text-sm text-slate-900 font-serif">
                  阶段性计划如下：
                </h3>

                <div className="text-xs sm:text-sm font-serif leading-relaxed text-justify space-y-3 text-slate-800">
                  <div className="space-y-1">
                    <strong className="text-slate-950 font-bold block">2026 年 5 月：</strong>
                    <p className="indent-6">
                      完成课题设计、资料收集、现状调查和问题清单梳理；明确研究对象、核心场景、访谈提纲和数据采集口径；初步形成医学装备管理现状问题清单。
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-slate-950 font-bold block">2026 年 6 月：</strong>
                    <p className="indent-6">
                      完成设备主数据模型、业务流程和评价指标体系设计；完成一事一单六阶段闭环流程设计；完成人工智能辅助交互核心场景、字段提取规则和人工确认机制设计。
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-slate-950 font-bold block">2026 年 7 月：</strong>
                    <p className="indent-6">
                      选择核心场景开展应用验证，重点包括设备主数据标准化、自然语言报修转工单、领导指示或会议任务转一事一单、设备档案资料归集、维修保养和计量记录闭环管理等内容；收集应用前后对比数据。
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-slate-950 font-bold block">2026 年 8 月：</strong>
                    <p className="indent-6">
                      开展数据整理和效果评价，围绕设备主数据规范率、报修工单完整率、任务闭环率、任务按时完成率、人工智能辅助生成工单准确率、档案资料完整率等指标进行分析，形成阶段性研究材料。
                    </p>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-slate-950 font-bold block">2026 年 9 月：</strong>
                    <p className="indent-6">
                      完成不低于 1 万字的研究报告、论文初稿、管理流程、指标体系和推广应用建议等成果材料，按要求申请结项。
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 9 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 10: 三、经费预算                                          */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 10) && (
            <div id="app-page-10" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif">
              <div className="space-y-4 pt-4">
                <h2 className="text-base font-bold text-slate-950 font-serif border-b border-slate-900 pb-1">
                  三、经费预算
                </h2>

                <div className="border border-slate-900 overflow-hidden text-xs sm:text-sm">
                  <table className="w-full border-collapse">
                    <thead className="bg-slate-100 font-bold border-b border-slate-900 text-center font-sans">
                      <tr>
                        <th className="p-2 border-r border-slate-900 w-16">序号</th>
                        <th className="p-2 border-r border-slate-900">经费开支科目</th>
                        <th className="p-2 w-32">金 额（元）</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      <tr>
                        <td className="p-2 border-r border-slate-900 text-center font-mono">1</td>
                        <td className="p-2 border-r border-slate-900">资料收集、文献检索及打印装订费</td>
                        <td className="p-2 text-center font-mono font-bold">1000</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-900 text-center font-mono">2</td>
                        <td className="p-2 border-r border-slate-900">调研、数据整理及专家咨询费</td>
                        <td className="p-2 text-center font-mono font-bold">1500</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-900 text-center font-mono">3</td>
                        <td className="p-2 border-r border-slate-900">成果撰写、论文修改及结项材料制作费</td>
                        <td className="p-2 text-center font-mono font-bold">1500</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="p-2 border-r border-slate-900 text-center font-sans">合 计</td>
                        <td className="p-2 text-center font-mono font-bold text-base">4000</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-900 text-center font-bold">备注</td>
                        <td colSpan={2} className="p-2 leading-relaxed text-justify">
                          经费用于课题研究资料整理、调研论证、成果撰写、论文修改和结项材料制作。具体以单位财务制度执行。
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-slate-900 text-center font-bold">经费保障方式</td>
                        <td colSpan={2} className="p-2 font-bold">
                          所在单位资助
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 10 -</div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Page 11: 四、课题负责人所在单位意见                             */}
          {/* ============================================================== */}
          {(viewMode === 'continuous' || currentPage === 11) && (
            <div id="app-page-11" className="doc-appraisal-sheet flex flex-col justify-between text-slate-900 font-serif relative">
              <div className="space-y-6 pt-4 border-2 border-slate-900 p-6 sm:p-10 min-h-[220mm] flex flex-col justify-between">
                <div className="space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-950 font-serif border-b border-slate-900 pb-2">
                    四、课题负责人所在单位意见
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed indent-6 text-justify">
                    申请书所填写的内容是否属实；本课题负责人或参加者的政治业务素质是否适合承担本课题的研究工作；本单位能否提供完成本课题所需的时间和条件；能否给予相应的配套经费；是否同意承担本课题的管理任务和信誉保证。
                  </p>

                  <div className="pt-4 space-y-3 text-xs sm:text-sm leading-relaxed text-justify indent-6 text-slate-800">
                    <p>
                      经审核，申请书所填写内容属实。课题负责人及课题组成员政治业务素质良好，熟悉医院医学装备管理、信息化建设、数据治理、医疗质量安全和后勤保障管理等相关工作，具备承担本课题研究的专业基础和组织实施能力。
                    </p>
                    <p>
                      本课题立足县级医院医学装备管理实际需求，围绕主数据治理、人工智能辅助交互、一事一单任务数字化和医学装备全生命周期闭环管理开展研究，研究方向符合医学卫生类专项研究课题申报要求。课题对于提升医学装备管理规范化、精细化和数字化水平，促进医院运营管理和医疗质量安全持续改进具有现实意义。
                    </p>
                    <p>
                      本单位能够为课题实施提供必要的时间、资料、场景和协调条件，同意承担本课题的管理任务和信誉保证。
                    </p>
                  </div>
                </div>

                {/* 签章区 */}
                <div className="pt-12 text-right space-y-3 font-serif pr-8 relative">
                  <div className="text-sm">
                    单位负责人签字：<strong className="underline decoration-slate-400 font-sans ml-2">{maskText('吴耀宝')}</strong>
                  </div>
                  <div className="text-sm">
                    公 章
                  </div>
                  <div className="text-sm font-mono">
                    2026 年 5 月 10 日
                  </div>

                  {/* 红色仿真公章 */}
                  <div className="absolute bottom-4 right-4 w-28 h-28 official-red-stamp pointer-events-none flex flex-col items-center justify-center p-2 text-center">
                    <span className="text-[10px] font-bold tracking-tighter leading-none mb-1">五莲县人民医院</span>
                    <span className="text-xl leading-none">★</span>
                    <span className="text-[9px] font-bold tracking-widest leading-none mt-1">公 司 专 用</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 font-mono pb-2">- 11 -</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
