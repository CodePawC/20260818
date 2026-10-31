import React from 'react';
import { 
  HeartPulse, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Wrench, 
  Boxes, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt,
  FileCheck2
} from 'lucide-react';
import { ActiveTab, MedicalEquipment } from '../types';

interface ExecutiveQualityKpiStripProps {
  equipmentList: MedicalEquipment[];
  monthlyRepairCost?: number;
  isDeptView?: boolean;
  userDept?: string;
  pendingDeptSignoffsCount?: number;
  urgentReconcileCount?: number;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onFilterByStatus?: (status: string) => void;
  onNavigateToLedger?: (statusFilter?: string, departmentFilter?: string) => void;
  onScrollToActions?: () => void;
}

export const ExecutiveQualityKpiStrip: React.FC<ExecutiveQualityKpiStripProps> = ({
  equipmentList = [],
  monthlyRepairCost = 12480,
  isDeptView = false,
  userDept,
  pendingDeptSignoffsCount = 0,
  urgentReconcileCount = 0,
  onNavigateToTab,
  onNavigateToLedger,
  onScrollToActions
}) => {
  // 1. 生命支持设备在位完好率统计
  const keywords = ['呼吸机', '除颤', '麻醉机', '麻醉系统', '透析', '血液净化', 'ECMO', '监护仪', '心电图机'];
  const lifeSupportDevices = equipmentList.filter(eq => {
    const name = eq.name || '';
    const cat = eq.category || '';
    return keywords.some(k => name.includes(k) || cat.includes(k));
  });

  const lsTotal = lifeSupportDevices.length;
  const lsFaulty = lifeSupportDevices.filter(eq => eq.status === '故障待修' || eq.status === '维护保养中').length;
  const lsLoaned = lifeSupportDevices.filter(eq => eq.currentLoan && eq.currentLoan.loanStatus !== 'returned').length;
  const lsReady = Math.max(0, lsTotal - lsFaulty - lsLoaned);
  const lsRate = lsTotal > 0 ? Math.round(((lsTotal - lsFaulty) / lsTotal) * 1000) / 10 : 100;

  // 2. 全院总体设备健康度
  const totalCount = equipmentList.length;
  const normalCount = equipmentList.filter(e => e.status === '正常运行').length;
  const faultCount = equipmentList.filter(e => e.status === '故障待修' || e.status === '维护保养中').length;
  const overallHealthRate = totalCount > 0 ? Math.round((normalCount / totalCount) * 1000) / 10 : 100;

  // 3. 强检计量 30天内急需定标统计
  const baseTime = new Date('2026-08-17T00:00:00').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const due30Count = equipmentList.filter(eq => {
    const dStr = eq.nextCalibrationDate || eq.nextMaintenanceDate;
    if (!dStr) return false;
    const diff = Math.ceil((new Date(dStr.replace(/\//g, '-')).getTime() - baseTime) / dayMs);
    return diff >= 0 && diff <= 30;
  }).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
      
      {/* KPI 1: 生命支持设备在位可用率 (三甲国家评审红线) */}
      <div 
        onClick={() => onNavigateToTab?.('emergency_reserve')}
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-emerald-400/80 transition-all p-3.5 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>生命支持在位可用率</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              三甲基准 ≥95%
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {lsRate}%
              </span>
              <span className="text-xs text-emerald-600 font-bold">达标在岗</span>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              在位 <strong className="text-slate-800">{lsReady + lsLoaned}</strong> / {lsTotal}台
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>在借: <strong className="text-cyan-700 font-mono">{lsLoaned}</strong></span>
            <span>·</span>
            <span>报修: <strong className={lsFaulty > 0 ? "text-rose-600 font-mono" : "text-slate-600 font-mono"}>{lsFaulty}</strong></span>
          </div>
          <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>应急保障池</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* KPI 2: 临床报修 15 分钟到场响应率 (SLA时效防线) */}
      <div 
        onClick={() => onNavigateToTab?.('repair_closed_loop')}
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-blue-400/80 transition-all p-3.5 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>15min 到场响应达标率</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              平均 11.6分钟
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                98.2%
              </span>
              <span className="text-xs text-blue-600 font-bold">时效受控</span>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              MTTR 修复 <strong>2.6h</strong>
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>近7日出清闭环: <strong className="text-slate-800 font-mono">92.5%</strong></span>
          </div>
          <span className="text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>闭环流转</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* KPI 3: 国家法定计量强检受检履约率 (法律法规红线) */}
      <div 
        onClick={() => onNavigateToTab?.('maintenance')}
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-purple-400/80 transition-all p-3.5 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600"></div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>法定计量强检受检率</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              法定零超期
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                100%
              </span>
              <span className="text-xs text-purple-600 font-bold">在期有效</span>
            </div>
            <div className="text-right text-xs text-amber-600 font-mono font-bold">
              {due30Count > 0 ? `≤30天到期 ${due30Count}台` : '本月无超期'}
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <span>机构: 山东省计量院 / 日照计量所</span>
          </div>
          <span className="text-purple-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
            <span>强检计划</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* KPI 4: 全院在册设备技术运行完好率 */}
      <div 
        onClick={() => onNavigateToLedger?.('正常运行', isDeptView ? userDept : undefined)}
        className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-400 transition-all p-3.5 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700"></div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold flex items-center gap-1.5 text-slate-700">
              <Activity className="w-4 h-4 text-slate-700" />
              <span>{isDeptView ? `【${userDept}】设备完好率` : '全院在册设备完好率'}</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              在册 {totalCount}台
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-slate-900">
                {overallHealthRate}%
              </span>
              <span className="text-xs text-slate-600 font-bold">完好在册</span>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              正常 <strong className="text-emerald-700">{normalCount}</strong> / 故障 <strong className={faultCount > 0 ? "text-rose-600" : "text-slate-600"}>{faultCount}</strong>
            </div>
          </div>
        </div>

        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>月度维修: <strong className="text-slate-800 font-mono">¥{monthlyRepairCost.toLocaleString()}</strong></span>
          </div>
          <span className="text-slate-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            <span>查看台账</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

    </div>
  );
};
