import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  category: 'clinical' | 'engineer' | 'quality' | 'leadership';
  categoryLabel: string;
  question: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
  lawCitation: string;
}

export const HospitalAccreditationQuiz: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const questions: QuizQuestion[] = [
    {
      id: 1,
      category: 'clinical',
      categoryLabel: '临床护理必知',
      question: '国家三甲医院评审标准中，临床科室急救与生命支持类设备（除颤仪、呼吸机等）完好率的达标底线指标是多少？',
      options: [
        { key: 'A', text: '不低于 85%' },
        { key: 'B', text: '不低于 90%' },
        { key: 'C', text: '不低于 95%' },
        { key: 'D', text: '必须达到 100% 随时处于备用应急状态' }
      ],
      correctKey: 'D',
      explanation: '急救与生命支持类设备直接关乎患者生命安全，三甲评审第四篇明确规定急救设备完好率必须达到100%，实行每日晨间交接点检与定点定人放置。',
      lawCitation: '《三级医院评审标准（2020年版）》第4.8.4条；《医疗质量安全核心制度》'
    },
    {
      id: 2,
      category: 'clinical',
      categoryLabel: '不良事件警戒',
      question: '使用医疗器械发生导致患者死亡的突发严重不良事件，临床科室与医院必须在多长时间内向药品监督管理部门报告？',
      options: [
        { key: 'A', text: '3 个工作日内' },
        { key: 'B', text: '7 个工作日内' },
        { key: 'C', text: '10 个工作日内' },
        { key: 'D', text: '15 个自然日内' }
      ],
      correctKey: 'A',
      explanation: '导致患者死亡的恶性不良事件，必须在3个工作日内直报国家不良事件监测网；导致严重伤害或永久器官机能损害的，在10个工作日内报告。',
      lawCitation: '《医疗器械不良事件监测和再评价管理办法》（国家市场监管总局令第1号）第三十三条'
    },
    {
      id: 3,
      category: 'engineer',
      categoryLabel: '法制计量检定',
      question: '根据国家发改委、财政部及市场监管总局现行财税政策，公立医院医用强检计量器具（如心电图、除颤仪、超声诊断仪）送检的收费政策为？',
      options: [
        { key: 'A', text: '按原省物价局标准半价收取' },
        { key: 'B', text: '属于国家法制计量停征项目，全额免收检定费' },
        { key: 'C', text: '由第三方检测公司自主市场化定价' },
        { key: 'D', text: '只有新购第一年免征，后续逐年收费' }
      ],
      correctKey: 'B',
      explanation: '自2017年4月1日起，国家已全面停征强制检定收费。公立医疗机构在e-CQS平台如实申报的强检器具，法定计量检定机构一律免费检定。',
      lawCitation: '财政部、国家发改委《关于清理规范一批行政事业性收费有关政策的通知》（财税〔2017〕20号）'
    },
    {
      id: 4,
      category: 'clinical',
      categoryLabel: '设备日常保养',
      question: '临床护士长带领责任护士交接除颤监护仪时，关于机身蓄电池浮充与指示灯的日常规范描述正确的是？',
      options: [
        { key: 'A', text: '为了省电，白天平时可拔掉除颤仪交流电源插头' },
        { key: 'B', text: '除颤仪必须24小时常态连接医用交流电保持浮充，确保绿色AC指示灯常亮' },
        { key: 'C', text: '只要开机屏幕能亮，电池指示灯是黄色也无需理会' },
        { key: 'D', text: '除颤仪每月通电一次即可满足备用要求' }
      ],
      correctKey: 'B',
      explanation: '除颤仪电池若未长期处于浮充状态，可能导致抢救患者室颤时放电电量不足或骤然关机。规范要求7×24小时接通交流电源，绿灯常亮。',
      lawCitation: '中华医学会重症医学分会《ICU急救装备管理专家共识》；JJG 768《除颤器检定规程》'
    },
    {
      id: 5,
      category: 'engineer',
      categoryLabel: '超期设备准用',
      question: '医疗设备已达到厂家设计的推荐使用寿命年限（如8年），但科室提出仍需继续服役使用，合规合法的前置程序是？',
      options: [
        { key: 'A', text: '科室主任口头同意即可继续使用' },
        { key: 'B', text: '必须经医学工程科开展性能与电气安全稳定性检测，并报医院医学装备管理委员会特许准用备案' },
        { key: 'C', text: '只要设备没冒烟坏掉，无需任何备案程序' },
        { key: 'D', text: '由厂家销售员手写一份合格证明即可' }
      ],
      correctKey: 'B',
      explanation: '超期服役设备必须严格执行“技术评定+电气安全复核+管理委员会备案”流程，由分管院长终审批准，且列入高频巡检名单，方可特许准用。',
      lawCitation: '《医疗器械使用质量监督管理办法》第十七条；国家卫健委《大型医用设备配置与使用监督管理办法》'
    },
    {
      id: 6,
      category: 'clinical',
      categoryLabel: '维修闭环验收',
      question: '医学工程工程师在病区现场修复一台故障多参数监护仪后，以下哪项操作符合闭环验收规范？',
      options: [
        { key: 'A', text: '工程师自己拿护士长工号在电脑上代签验收' },
        { key: 'B', text: '护士长在电话里口头答复“修好了就行，不用试了”' },
        { key: 'C', text: '当班医护当面通电试机，验证各参数监测正常后，在系统终端手写签名确认' },
        { key: 'D', text: '直接将设备推回库房，不需要任何人签名' }
      ],
      correctKey: 'C',
      explanation: '闭环验收的核心防线在于“临床实机通电复核”。严禁工程师代签或电话口头授权，必须由当班护士或护士长在试机正常后电子手写签名。',
      lawCitation: '五莲县人民医院《医学装备全生命周期闭环管理实施细则（2026版）》第三章第8条'
    },
    {
      id: 7,
      category: 'clinical',
      categoryLabel: '手术安全防护',
      question: '手术室使用高频电刀时，关于负极板（回路极板）粘贴防灼伤的操作，最关键的要求是？',
      options: [
        { key: 'A', text: '可以贴在骨骼突起处，只要粘紧即可' },
        { key: 'B', text: '必须粘贴在肌肉丰厚、血供良好且平整的皮肤部位，严禁翘边和重叠' },
        { key: 'C', text: '患者出汗较多时直接贴上去不用擦干' },
        { key: 'D', text: '同一片一次性负极板可在连台手术中重复使用' }
      ],
      correctKey: 'B',
      explanation: '负极板接触面积不足或翘边会导致接触电阻剧增，引发高频电流局部集中造成患者严重灼伤。必须贴于肌肉丰厚平整处，一人一换，严禁重复使用。',
      lawCitation: '国家卫健委《手术室护理实践指南》；GB 9706.4《高频手术设备安全专用要求》'
    },
    {
      id: 8,
      category: 'leadership',
      categoryLabel: '财务资产审计',
      question: '公立医院原值在多少万元以上的医疗设备，应依法开展单机成本效益核算（ROI）与DRG专机折旧分摊测算？',
      options: [
        { key: 'A', text: '10 万元及以上' },
        { key: 'B', text: '50 万元及以上' },
        { key: 'C', text: '200 万元及以上' },
        { key: 'D', text: '500 万元及以上' }
      ],
      correctKey: 'B',
      explanation: '原值 50 万元及以上的大型医用设备，公立医院必须建立单机效益核算档案，监控保本点开机率、检查人次成本分摊及投资回收周期。',
      lawCitation: '国家卫健委《公立医院成本核算规范》（国卫财务发〔2021〕4号）'
    },
    {
      id: 9,
      category: 'engineer',
      categoryLabel: '电气安全检测',
      question: '按照国家标准 GB 9706.1 医用电气安全通用要求，I 类医疗设备的保护接地阻抗（带不可拆卸电源线）不得超过？',
      options: [
        { key: 'A', text: '0.1 Ω' },
        { key: 'B', text: '0.2 Ω' },
        { key: 'C', text: '0.5 Ω' },
        { key: 'D', text: '1.0 Ω' }
      ],
      correctKey: 'B',
      explanation: 'GB 9706.1 强制标准规定，保护接地阻抗必须小于或等于 0.2 Ω（带可拆卸电源线插头小于0.1Ω，加不可拆卸电源线小于0.2Ω），确保漏电时迅速接地保护。',
      lawCitation: 'GB 9706.1-2020《医用电气设备 第1部分：基本安全和基本性能的通用要求》第8.6.4条'
    },
    {
      id: 10,
      category: 'leadership',
      categoryLabel: '国有资产处置',
      question: '县级公立医院医疗设备资产报废处置，必须履行的法定审批四级闭环流程包括？',
      options: [
        { key: 'A', text: '仅科室主任签字即可自行卖给废品站' },
        { key: 'B', text: '医工科确认坏了即可直接扔掉' },
        { key: 'C', text: '临床申请 &rarr; 医工技术鉴定 &rarr; 资产财务审核 &rarr; 院长办公会批准并报卫健/财政局批复下账' },
        { key: 'D', text: '外协维修商出具一份报废说明后直接拉走' }
      ],
      correctKey: 'C',
      explanation: '医疗设备属于国有资产，严禁私自处置变卖。必须经过严格的四级技术鉴定会签，并报财政国资管理部门审批下发处置批复后，方可公开拍卖变现与系统下账。',
      lawCitation: '财政部《行政事业性国有资产管理条例》（国务院令第738号）；公立医院国有资产管理办法'
    }
  ];

  const filteredQuestions = useMemo(() => {
    if (filterCategory === 'all') return questions;
    return questions.filter(q => q.category === filterCategory);
  }, [questions, filterCategory]);

  const handleSelectOption = (questionId: number, optionKey: string) => {
    if (showResults) return; // 已经交卷后锁定选择
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setShowResults(false);
  };

  // 成绩测算
  const scoreResults = useMemo(() => {
    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctKey) {
        correctCount += 1;
      }
    });
    const totalCount = questions.length;
    const score = Math.round((correctCount / totalCount) * 100);

    let rankLabel = '未及格·需加紧学习';
    let rankColor = 'text-rose-700 bg-rose-50 border-rose-200';
    if (score === 100) {
      rankLabel = '卓越满分·三甲评审专家级标兵';
      rankColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
    } else if (score >= 80) {
      rankLabel = '优良达标·符合三甲公立医院飞检规范';
      rankColor = 'text-blue-700 bg-blue-50 border-blue-300';
    } else if (score >= 60) {
      rankLabel = '基本合格·建议重点复习易错章节';
      rankColor = 'text-amber-700 bg-amber-50 border-amber-300';
    }

    return {
      correctCount,
      totalCount,
      score,
      rankLabel,
      rankColor
    };
  }, [questions, selectedAnswers]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-6">
      {/* 题库顶栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Award className="w-3 h-3 text-blue-600" />
            <span>三甲公立医院评审与现场飞检自查题库</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>医学装备管理应知应会闯关自测 (10道精选考题)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            由医院质量评价办公室与医学工程科联合拟定，覆盖临床急救完好率、不良事件时限、强检免征政策与电气安全强制规程。
          </p>
        </div>

        {/* 类别筛选 */}
        <div className="flex items-center gap-1.5 overflow-x-auto self-start sm:self-center">
          {[
            { key: 'all', label: '全量题库 (10题)' },
            { key: 'clinical', label: '临床护士长' },
            { key: 'engineer', label: '医工工程师' },
            { key: 'leadership', label: '院领导财务' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterCategory(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                filterCategory === tab.key
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 成绩卡片 (交卷后展示) */}
      {showResults && (
        <div className={`p-5 rounded-xl border ${scoreResults.rankColor} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all animate-fadeIn`}>
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-current" />
              <div className="text-lg font-bold">自测综合得分：{scoreResults.score} 分</div>
            </div>
            <div className="text-xs mt-1">
              答对 {scoreResults.correctCount} / {scoreResults.totalCount} 题 · 评定等级：<strong>{scoreResults.rankLabel}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetQuiz}
            className="px-4 py-2 bg-white text-slate-800 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-center shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>清空作答并重新自测</span>
          </button>
        </div>
      )}

      {/* 试题列表 */}
      <div className="space-y-6">
        {filteredQuestions.map((q, qIndex) => {
          const userChoice = selectedAnswers[q.id];
          const isAnswered = !!userChoice;
          const isCorrect = userChoice === q.correctKey;

          return (
            <div
              key={q.id}
              className={`p-5 rounded-xl border transition-all ${
                showResults
                  ? isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-rose-50/40 border-rose-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* 题干顶行 */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {q.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-600">
                    {q.categoryLabel}
                  </span>
                </div>
                {showResults && (
                  <div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>回答正确</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-800">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>回答错误 (正确答案: {q.correctKey})</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 题干文本 */}
              <h3 className="text-sm font-bold text-slate-900 leading-snug mb-3.5">
                {q.question}
              </h3>

              {/* 选项组 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map(opt => {
                  const isSelected = userChoice === opt.key;
                  let optStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';

                  if (showResults) {
                    if (opt.key === q.correctKey) {
                      optStyle = 'bg-emerald-100/80 border-emerald-400 text-emerald-900 font-bold';
                    } else if (isSelected && !isCorrect) {
                      optStyle = 'bg-rose-100/80 border-rose-300 text-rose-900 line-through';
                    } else {
                      optStyle = 'bg-white border-slate-200 text-slate-400 opacity-60';
                    }
                  } else if (isSelected) {
                    optStyle = 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs';
                  }

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={showResults}
                      onClick={() => handleSelectOption(q.id, opt.key)}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${optStyle}`}
                    >
                      <span className={`w-5 h-5 rounded-full text-2xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
                      }`}>
                        {opt.key}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* 考点剖析与法律依据 (交卷后呈现) */}
              {showResults && (
                <div className="mt-4 p-3 bg-white/90 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-2xs uppercase">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>专家解析与依据：</span>
                  </div>
                  <p className="text-2xs leading-relaxed text-slate-600">
                    {q.explanation}
                  </p>
                  <div className="text-2xs text-blue-700 font-mono pt-1 border-t border-slate-100">
                    法规条文依据：{q.lawCitation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部提交交卷栏 */}
      <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          已作答 <strong className="text-blue-700 font-mono">{Object.keys(selectedAnswers).length}</strong> / {questions.length} 题
        </div>

        <div className="flex items-center gap-3">
          {!showResults ? (
            <button
              type="button"
              onClick={() => setShowResults(true)}
              disabled={Object.keys(selectedAnswers).length === 0}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                Object.keys(selectedAnswers).length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>提交试卷并查看评分</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetQuiz}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新作答</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
