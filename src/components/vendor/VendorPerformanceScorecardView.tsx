import React from 'react';
import { 
  Award, Trophy, Star, CheckCircle2, ShieldCheck, 
  TrendingUp, Download, Printer, Clock, FileText, Check
} from 'lucide-react';
import { VendorQuarterlyEvaluation, VendorUserAccount } from '../../types/vendorCollaborationTypes';

interface VendorPerformanceScorecardViewProps {
  currentVendor: VendorUserAccount;
  evaluation: VendorQuarterlyEvaluation;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorPerformanceScorecardView: React.FC<VendorPerformanceScorecardViewProps> = ({
  currentVendor,
  evaluation,
  onToast
}) => {
  const handlePrintScorecard = () => {
    onToast(`已导出【${evaluation.quarter}】医院医学装备处官方考评证书 (PDF)`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* 顶部荣耀评级与综合得分看板 */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs backdrop-blur-xs font-medium border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>五莲县人民医院医学装备处 • 季度绩效考评</span>
              <span className="text-white/60">|</span>
              <span className="text-amber-200 font-bold">{evaluation.quarter}</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
              <span>{currentVendor.vendorName}</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold shadow-xs">
                等级：{evaluation.ratingGrade} 卓越级
              </span>
            </h2>
            
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              根据《公立医院大型医用设备外协维修维保服务商全生命周期考核评定细则》，综合考量响应时限、修复质量、旧件退库、三单核验与临床满意度。
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-white/10 p-4 rounded-xl backdrop-blur-xs border border-white/10">
            <div className="text-center">
              <div className="text-[11px] text-blue-200">综合考评分</div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300">
                {evaluation.overallScore}
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">满分 100 分</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <div className="text-[11px] text-blue-200">全院供应商排名</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                第 {evaluation.rank} <span className="text-xs font-normal text-blue-200">名</span>
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">参评共 {evaluation.totalVendors} 家</div>
            </div>
          </div>
        </div>
      </div>

      {/* 激励特权卡片 */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4.5 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-emerald-900">
              AAA级优质服务商专属激励特权
            </div>
            <div className="text-xs text-emerald-800 mt-0.5 font-medium">
              {evaluation.biddingPrivilege}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintScorecard}
          className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-emerald-700" />
          <span>导出考评红头证书</span>
        </button>
      </div>

      {/* 五大核心考核维度得分明细 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>五维量化考核指标细项与履约表现</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">考评核签: {evaluation.verifiedAt}</span>
        </div>

        <div className="space-y-4">
          {evaluation.dimensions.map((dim, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-800">{dim.dimension}</span>
                  <span className="text-[11px] text-slate-400 font-mono">(权重 {dim.weight})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">实得分:</span>
                  <span className="text-sm font-black font-mono text-blue-600">{dim.score}</span>
                  <span className="text-slate-400 text-xs font-mono">/ {dim.fullScore} 分</span>
                </div>
              </div>

              {/* 得分进度条 */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${(dim.score / dim.fullScore) * 100}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>考核实绩: {dim.evaluationDetail}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
          <div className="font-bold text-blue-900">医院医学装备委员会评定总评</div>
          <div className="text-blue-800 leading-relaxed">
            {evaluation.hospitalAuditSummary}
          </div>
        </div>
      </div>
    </div>
  );
};
