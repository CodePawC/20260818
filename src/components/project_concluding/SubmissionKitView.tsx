import React, { useState } from 'react';
import { 
  Printer, 
  CheckCircle2, 
  FileText, 
  Layers, 
  Tag, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck, 
  HelpCircle, 
  AlertTriangle,
  Sparkles,
  BookOpen,
  Scissors,
  CheckCheck
} from 'lucide-react';
import { PROJECT_METADATA, RESEARCH_TEAM, ResearchTeamMember } from '../../data/projectConcludingData';

interface SubmissionKitViewProps {
  isAnonymous: boolean;
  onToggleAnonymous: () => void;
  maskText: (text: string) => string;
  teamMembers?: ResearchTeamMember[];
}

export const SubmissionKitView: React.FC<SubmissionKitViewProps> = ({
  isAnonymous,
  onToggleAnonymous,
  maskText,
  teamMembers
}) => {
  const currentTeam = teamMembers && teamMembers.length > 0 ? teamMembers : RESEARCH_TEAM;
  const [coverMode, setCoverMode] = useState<'actual' | 'anonymous'>('actual');
  const [activeSpecTab, setActiveSpecTab] = useState<'physical' | 'cover' | 'envelope' | 'checklist'>('physical');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    'c1': true,
    'c2': true,
    'c3': true,
    'c4': true,
    'c5': true,
    'c6': true,
  });

  const toggleCheck = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allPassed = Object.values(checklist).every(Boolean);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-200/90 overflow-y-auto select-text">
      {/* 顶部控制栏 */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-300 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Tag className="w-3.5 h-3.5 text-blue-700" />
            结项成果装订与报送规范工作台
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            执行标准：《日照市社会科学界联合会结项报送通知附件1、2、3》
          </span>
        </div>

        {/* 顶部导航与快捷操作 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSpecTab('physical')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activeSpecTab === 'physical' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              装订实物仿真
            </button>
            <button
              onClick={() => setActiveSpecTab('cover')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activeSpecTab === 'cover' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              附件1标准封面
            </button>
            <button
              onClick={() => setActiveSpecTab('envelope')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                activeSpecTab === 'envelope' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              档案袋外贴封签
            </button>
            <button
              onClick={() => setActiveSpecTab('checklist')}
              className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                activeSpecTab === 'checklist' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>递交合规绿码通行证</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印当前装订页</span>
          </button>
        </div>
      </div>

      {/* 主工作内容区 */}
      <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-8">

        {/* ============================================================== */}
        {/* 模块 1：装订成品 3D / 拟物化实物展示                            */}
        {/* ============================================================== */}
        {activeSpecTab === 'physical' && (
          <div className="space-y-8">
            {/* 顶栏指南卡 */}
            <div className="bg-white rounded-md border border-slate-300 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                    硬性装订指标
                  </span>
                  <h2 className="text-xl font-black text-slate-900 font-sans mt-1">
                    日照市社科课题全套结项材料实物装订规格
                  </h2>
                </div>
                <div className="text-right text-xs">
                  <span className="text-amber-600 font-bold block">报送截止：2026年9月30日</span>
                  <span className="text-slate-400">报送地点：市级机关办公大楼东区1号楼201室</span>
                </div>
              </div>

              {/* 三大核心装订标准卡 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-sm border-2 border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                    <strong className="text-slate-900 text-sm">研究成果报告装订</strong>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    A4纸正反双面打印，<strong>浅蓝色皮纹纸特种封面无线胶装</strong>成册。内文正文仿宋GB三号、29磅固定行距、三线表规范。提交一式 <strong>2 份</strong>（其中 1 份做匿名盲审擦除）。
                  </p>
                  <div className="text-[11px] text-blue-700 font-mono font-semibold pt-1">
                    份数：实名 1 份 + 匿名 1 份
                  </div>
                </div>

                <div className="p-4 rounded-sm border-2 border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                    <strong className="text-slate-900 text-sm">课题结项鉴定书装订</strong>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    必须使用 <strong>A3 纸正反面双面打印、中缝骑马钉对折装订</strong>成手册（非散装A4夹子）。规范包含封面、表一人员表、表二总结报告与经费决算；按送审规范不臆造专家评审意见。
                  </p>
                  <div className="text-[11px] text-amber-700 font-mono font-semibold pt-1">
                    份数：A3骑马钉版一式 2 份
                  </div>
                </div>

                <div className="p-4 rounded-sm border-2 border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                    <strong className="text-slate-900 text-sm">阶段性成果与档案袋</strong>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    附已公开刊发的学术论文《装备维修技术》期刊原件或复印件、院领导批示公文一式 <strong>2 份</strong>。全部材料统一装入牛皮纸档案袋，外贴附件1封签。
                  </p>
                  <div className="text-[11px] text-emerald-700 font-mono font-semibold pt-1">
                    份数：论文/批示各 2 份 + 封签 1 份
                  </div>
                </div>
              </div>
            </div>

            {/* 拟物化装订实物立体展示 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 实物 1：浅蓝色皮纹纸无线胶装成册样本 */}
              <div className="bg-white rounded-md border border-slate-300 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>实物效果一：浅蓝色无线胶装成果报告</span>
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                    230g特种皮纹纸 · 仿真
                  </span>
                </div>

                {/* 3D立体书籍仿真 */}
                <div className="flex justify-center py-6 bg-slate-100 rounded-sm">
                  <div className="relative w-64 sm:w-72 bg-sky-200 border-2 border-sky-300 rounded-r-md shadow-2xl p-6 flex flex-col justify-between h-96 text-slate-900 font-serif">
                    {/* 深色书脊阴影模拟无线胶装厚度 */}
                    <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-sky-400 to-sky-200 border-r border-sky-400" />
                    
                    {/* 书顶裁切线 */}
                    <div className="absolute -top-1 left-5 right-0 h-1 bg-slate-300/80 rounded-t-xs" />
                    
                    {/* 书侧纸张厚度层叠感 */}
                    <div className="absolute -right-2 top-1 bottom-1 w-2 bg-gradient-to-r from-slate-200 to-slate-400 shadow-md rounded-r-xs" />

                    <div className="pl-4 space-y-2 text-center">
                      <div className="text-[9px] font-mono text-slate-600 text-right">编号：13</div>
                      <div className="text-[11px] font-bold text-slate-900 font-serif tracking-widest pt-2">
                        2026年度日照市社会科学立项课题研究成果
                      </div>
                      <div className="text-[10px] font-bold text-sky-900">
                        课题类别：医学卫生类专项研究课题
                      </div>
                      <div className="text-xs font-black text-slate-950 font-serif py-3 leading-snug border-y border-slate-800/40">
                        基于主数据治理与人工智能辅助交互的县级医院医学装备全生命周期闭环管理模式研究
                      </div>
                    </div>

                    <div className="pl-4 text-[10px] space-y-1 font-serif text-slate-800">
                      <div>课题负责人：<strong>{PROJECT_METADATA.leader}</strong>（{PROJECT_METADATA.leaderTitle}）</div>
                      <div>课题组成员：{currentTeam.slice(1).map(m => m.name).join('、')}</div>
                      <div>成果形式：10000字以上研究报告</div>
                      <div>承担单位：五莲县人民医院</div>
                    </div>

                    <div className="pl-4 text-center text-[9px] font-serif text-slate-600 border-t border-slate-400/40 pt-2">
                      日照市社会科学界联合会制 · 2026年9月
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="font-bold text-slate-800">工艺规范细节：</div>
                  <div>· 封面底纸：精选 230g 浅蓝色皮纹纸或道林卡纸；</div>
                  <div>· 装订工艺：热熔无线胶装（禁止使用简易打孔夹或塑料拉杆夹）；</div>
                  <div>· 内页纸张：80g 纯木浆高白静电复印纸，激光双面高清印刷。</div>
                </div>
              </div>

              {/* 实物 2：A3骑马钉双面折页装订样本 */}
              <div className="bg-white rounded-md border border-slate-300 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-amber-600" />
                    <span>实物效果二：A3中缝骑马钉对折鉴定书</span>
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                    A3双面印刷 · 骑马装订
                  </span>
                </div>

                {/* A3骑马钉对折仿真 */}
                <div className="flex justify-center py-6 bg-slate-100 rounded-sm">
                  <div className="relative w-72 sm:w-80 bg-white border border-slate-300 shadow-xl p-6 flex flex-col justify-between h-96 text-slate-900 font-serif">
                    {/* 左侧中缝对折线与双骑马钉 */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400" />
                    <div className="absolute left-0 top-16 w-1.5 h-6 bg-slate-800 rounded-r-xs shadow-xs" title="装订钉1" />
                    <div className="absolute left-0 bottom-16 w-1.5 h-6 bg-slate-800 rounded-r-xs shadow-xs" title="装订钉2" />

                    <div className="space-y-3 text-center">
                      <div className="text-[10px] text-slate-500 font-mono text-right">编号：（ 13 ）号</div>
                      <div className="text-xs font-bold text-slate-800 tracking-wider">
                        日照市社会科学研究课题
                      </div>
                      <div className="text-2xl font-black font-serif text-slate-950 tracking-[0.4em] py-2 border-y-2 border-slate-900 inline-block">
                        鉴 定 书
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-serif max-w-xs mx-auto w-full px-2">
                      <div className="flex justify-between border-b border-slate-300 pb-0.5">
                        <span className="font-bold">课题类别：</span>
                        <span>专项研究课题</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-300 pb-0.5">
                        <span className="font-bold">立项时间：</span>
                        <span>2025年5月</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-300 pb-0.5">
                        <span className="font-bold">课题负责人：</span>
                        <span>崔伟</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-300 pb-0.5">
                        <span className="font-bold">承担单位：</span>
                        <span>五莲县人民医院</span>
                      </div>
                    </div>

                    <div className="text-center text-[10px] font-serif text-slate-600 border-t border-slate-200 pt-2">
                      日照市社会科学界联合会 印制 · 2026年9月
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded border border-slate-200">
                  <div className="font-bold text-slate-800">骑马钉装订规范：</div>
                  <div>· 纸张尺寸：必须采用标准 A3 规格纸张（420mm × 297mm）；</div>
                  <div>· 印刷顺序：正面印刷第4页（审批表）+ 第1页（封面），背面印刷第2页（人员表）+ 第3页（总结报告）；</div>
                  <div>· 中缝对折：在正中央压痕线处居中对折，打两枚金属骑马装订钉。</div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 模块 2：附件1 官方标准成果封面生成与单独打印                     */}
        {/* ============================================================== */}
        {activeSpecTab === 'cover' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">
                  通知附件 1：2026年度日照市社会科学立项课题成果标准封面
                </h3>
                <p className="text-xs text-slate-500">
                  可在此处切换实名/匿名版并单独打印作为胶装面纸
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCoverMode(coverMode === 'actual' ? 'anonymous' : 'actual')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 cursor-pointer ${
                    coverMode === 'anonymous' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {coverMode === 'anonymous' ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{coverMode === 'anonymous' ? '当前为盲审匿名版' : '当前为实名申报版'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印此标准封面</span>
                </button>
              </div>
            </div>

            {/* 封面实际展示（严格对照浅蓝胶装标准） */}
            <div className="flex justify-center">
              <div className="doc-cover-sheet max-w-[210mm] w-full text-slate-950 font-serif">
                {/* 编号 */}
                <div className="text-right text-xs font-serif pt-2 pb-4">
                  <span>编号：（ </span>
                  <span className="font-mono font-bold px-1">{coverMode === 'anonymous' ? '  ' : PROJECT_METADATA.projectNo}</span>
                  <span> ）号</span>
                </div>

                {/* 成果标题 */}
                <div className="text-center pt-8 pb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-widest">
                    2026年度日照市社会科学立项课题研究成果
                  </h2>
                </div>

                {/* 课题类别 */}
                <div className="text-center py-4">
                  <h3 className="text-xl sm:text-2xl font-bold font-sans tracking-wide">
                    课题类别：医学卫生类专项研究课题
                  </h3>
                </div>

                {/* 课题名称 */}
                <div className="py-8 text-center px-4">
                  <h1 className="text-xl sm:text-2xl font-bold font-sans leading-relaxed max-w-xl mx-auto">
                    课题名称：{coverMode === 'anonymous' ? maskText(PROJECT_METADATA.title) : PROJECT_METADATA.title}
                  </h1>
                </div>

                {/* 申报信息五大项（严格宋体三号与3号仿宋体规范） */}
                <div className="max-w-xl mx-auto space-y-5 text-left font-serif text-base pt-6 px-4">
                  <div className="flex items-baseline">
                    <span className="font-bold tracking-wider w-36 shrink-0">课题负责人：</span>
                    <div className="flex-1 border-b-2 border-slate-950 pb-0.5 text-center font-bold text-lg font-serif">
                      {coverMode === 'anonymous' ? '【已作匿名处理】' : PROJECT_METADATA.leader}
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-bold tracking-wider w-36 shrink-0">课题组成员：</span>
                    <div className="flex-1 border-b-2 border-slate-950 pb-0.5 text-center font-serif text-base">
                      {coverMode === 'anonymous' 
                        ? '【已作匿名处理】' 
                        : currentTeam.slice(1).map(m => m.name).join('  ')}
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-bold tracking-[0.25em] w-36 shrink-0">成果形式：</span>
                    <div className="flex-1 border-b-2 border-slate-950 pb-0.5 text-center font-bold font-serif">
                      研究报告
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-bold tracking-wider w-36 shrink-0">立项时间：</span>
                    <div className="flex-1 border-b-2 border-slate-950 pb-0.5 text-center font-bold font-serif">
                      2025年5月
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-bold tracking-[0.25em] w-36 shrink-0">承担单位：</span>
                    <div className="flex-1 border-b-2 border-slate-950 pb-0.5 text-center font-bold font-serif">
                      {coverMode === 'anonymous' ? '【已作匿名处理】' : PROJECT_METADATA.leaderUnit}
                    </div>
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-bold tracking-wider w-36 shrink-0">报送日期：</span>
                    <div className="flex-1 border-b-2 border-slate-950 pb-0.5 text-center font-mono font-bold">
                      2026年9月30日
                    </div>
                  </div>
                </div>

                {/* 底部落款 */}
                <div className="pt-24 space-y-2 text-center text-slate-900 font-serif">
                  <p className="font-sans font-bold tracking-widest text-base">中国·山东·日照</p>
                  <p className="font-sans font-bold text-base">2026年9月</p>
                  <p className="pt-2 tracking-[0.2em] font-bold text-lg">日照市社会科学界联合会制</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 模块 3：统一报送档案袋外贴封签（即打即贴）                       */}
        {/* ============================================================== */}
        {activeSpecTab === 'envelope' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-md border border-slate-300 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">
                  结项档案袋外贴专用标签（A4即打即贴至牛皮纸袋）
                </h3>
                <p className="text-xs text-slate-500">
                  通知硬性要求：所有结项材料统一存装于同一档案袋，正面张贴注明
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>单独打印档案袋封面</span>
              </button>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-[210mm] bg-amber-50/70 border-4 border-slate-900 rounded-sm p-8 sm:p-12 space-y-6 font-serif text-slate-900 shadow-xl">
                {/* 顶部档案袋条形码与编号 */}
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
                  <span className="text-xs font-bold font-sans px-2 py-0.5 bg-slate-900 text-white">
                    结项档案专用袋
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-sm">档案编号：</span>
                    <strong className="font-mono text-base underline decoration-slate-400 px-2">{PROJECT_METADATA.projectNo}</strong>
                  </div>
                </div>

                {/* 档案袋大标题 */}
                <div className="text-center space-y-2 py-2">
                  <h1 className="text-2xl sm:text-3xl font-black font-sans tracking-wider text-slate-950">
                    日照市 2026 年度社会科学研究课题结项材料
                  </h1>
                  <p className="text-sm font-bold text-blue-900 font-sans tracking-wide">
                    【 医学卫生类专项研究课题结项归档总档案袋 】
                  </p>
                </div>

                {/* 项目基本信息核验区 */}
                <div className="border-2 border-slate-900 p-5 space-y-3 bg-white text-xs sm:text-sm">
                  <div className="flex items-start">
                    <span className="font-bold w-28 shrink-0">课题名称：</span>
                    <strong className="text-slate-950 text-justify">{PROJECT_METADATA.title}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div><span className="font-bold text-slate-700">课题类别：</span>{PROJECT_METADATA.category}（医学卫生专项）</div>
                    <div><span className="font-bold text-slate-700">立项时间：</span>2025年5月</div>
                    <div><span className="font-bold text-slate-700">课题负责人：</span><strong>{PROJECT_METADATA.leader}</strong>（{PROJECT_METADATA.leaderTitle}）</div>
                    <div><span className="font-bold text-slate-700">课题组人数：</span>共 8 人（含负责人）</div>
                    <div className="sm:col-span-2"><span className="font-bold text-slate-700">所在单位：</span><strong>{PROJECT_METADATA.leaderUnit}</strong></div>
                    <div className="sm:col-span-2"><span className="font-bold text-slate-700">联系电话：</span>0633-7991237 / 15865997717</div>
                  </div>
                </div>

                {/* 袋内实物清单严格对标表 */}
                <div className="border-2 border-slate-900 p-5 bg-white space-y-3">
                  <h3 className="font-bold text-slate-950 text-sm font-sans flex items-center justify-between border-b border-slate-300 pb-2">
                    <span>【袋内结项材料清点明细核验表】</span>
                    <span className="text-xs text-emerald-700 font-normal">（报送前逐项核对勾选）</span>
                  </h3>

                  <div className="space-y-2 text-xs font-serif text-slate-800">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 w-6">01.</span>
                      <span className="flex-1">最终研究成果报告（浅蓝色特种皮纹纸无线胶装·实名申报版）</span>
                      <strong className="text-blue-900 px-2">1 份</strong>
                      <span className="text-emerald-600 font-bold">☑ 已装入</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 w-6">02.</span>
                      <span className="flex-1">最终研究成果报告（浅蓝色特种皮纹纸无线胶装·匿名盲审处理版）</span>
                      <strong className="text-blue-900 px-2">1 份</strong>
                      <span className="text-emerald-600 font-bold">☑ 已装入</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 w-6">03.</span>
                      <span className="flex-1">课题结项鉴定书（A3双面正反打印·中缝骑马钉对折成册）</span>
                      <strong className="text-blue-900 px-2">2 份</strong>
                      <span className="text-emerald-600 font-bold">☑ 已装入</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 w-6">04.</span>
                      <span className="flex-1">阶段性成果证明：已公开刊发论文《装备维修技术》期刊原件及复印件</span>
                      <strong className="text-blue-900 px-2">2 份</strong>
                      <span className="text-emerald-600 font-bold">☑ 已装入</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 w-6">05.</span>
                      <span className="flex-1">单位主要领导及分管领导成果批示文件（含一份匿名版）</span>
                      <strong className="text-blue-900 px-2">2 份</strong>
                      <span className="text-emerald-600 font-bold">☑ 已装入</span>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200">
                      <span className="font-mono font-bold text-blue-700 w-6">06.</span>
                      <span className="flex-1">全套电子版资料U盘（含Word、高清PDF及系统演示文档）</span>
                      <strong className="text-blue-900 px-2">1 个</strong>
                      <span className="text-emerald-600 font-bold">☑ 已装入</span>
                    </div>
                  </div>
                </div>

                {/* 报送投递地址栏 */}
                <div className="border border-slate-400 p-4 bg-slate-50 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span><strong>报送收件：</strong>日照市社会科学界联合会综合业务科（收）</span>
                    <span className="font-mono text-slate-500">邮编：276800</span>
                  </div>
                  <div><strong>送达地址：</strong>日照市市级机关办公大楼东区1号楼201室</div>
                  <div><strong>联络电话：</strong>0633-7985195 | <strong>官方邮箱：</strong>rzskl@rz.shandong.cn</div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
                    <span>报送单位：五莲县人民医院 医工科/课题组</span>
                    <span>报送日期：2026年9月30日</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 模块 4：结项递交合规绿码通行证 (Checklist)                      */}
        {/* ============================================================== */}
        {activeSpecTab === 'checklist' && (
          <div className="bg-white rounded-md border border-slate-300 p-6 sm:p-10 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                  报送前质量控制
                </span>
                <h2 className="text-xl font-black text-slate-900 font-sans mt-1">
                  社科课题结项装订与报送 6 项合规自检核验
                </h2>
              </div>

              {allPassed ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500 text-white font-bold text-xs shadow-xs animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>已获【结项递交合规绿码通行证】</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500 text-white font-bold text-xs shadow-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>尚有未核验装订项</span>
                </div>
              )}
            </div>

            {/* 6大检查项 */}
            <div className="space-y-3">
              {[
                { id: 'c1', title: '1. 封面底色合规性：研究报告是否严格采用浅蓝色皮纹纸特种封面胶装成册？', desc: '通知附件1明确规定：不得采用普通白色复印纸或透明塑料夹，必须采用浅蓝色封面胶装成册。' },
                { id: 'c2', title: '2. 印刷双面合规性：10000字最终研究报告正文是否采用正反双面打印？', desc: '通知附件2学术规范规定：除封面与附件3声明页单面外，万字正文必须双面印刷，节约纸张。' },
                { id: 'c3', title: '3. 盲审匿名处理合规性：是否递交实名版1份与匿名盲审版1份？', desc: '通知附件1明确规定：必须提供1份匿名成果供专家盲审，封面与正文所有作者姓名、单位名称均已打码隐去。' },
                { id: 'c4', title: '4. 鉴定书装订合规性：课题结项鉴定书是否采用A3纸双面打印、骑马钉对折装订？', desc: '通知附件1明确规定：鉴定书必须为A3中缝骑马订装订版，一式2份，严禁采用A4单页简单装订。' },
                { id: 'c5', title: '5. 单位审核与印章合规性：鉴定书是否已加盖五莲县人民医院红色公章与法定代表人签章？', desc: '通知结项必备要件：单位初审意见栏必须加盖公章并经主要领导签字确认。' },
                { id: 'c6', title: '6. 档案袋密封与封签：是否将全部材料装入档案袋并张贴封签？', desc: '将实名成果、匿名成果、鉴定书2份、论文与批示、U盘全部入袋，正面贴好标准封签。' },
              ].map(item => (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-sm border transition cursor-pointer flex items-start gap-3.5 ${
                    checklist[item.id]
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                      : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.id]}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <strong className="text-sm font-sans block">{item.title}</strong>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 绿码通行证证书框 */}
            {allPassed && (
              <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-sm text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-base">日照市社科课题结项报送材料：6/6项物理质检全达标</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    全套成果报告（浅蓝胶装实名+匿名）、鉴定书（A3骑马订2份）、论文批示原件已就绪，可随时递交市社科联！
                  </p>
                </div>

                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shrink-0 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印整套报送装订档案</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
