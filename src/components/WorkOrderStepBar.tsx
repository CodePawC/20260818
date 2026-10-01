import React from 'react';
import { WorkOrderStatus } from '../types/dispatchTypes';
import { Check, Clock, ChevronRight, AlertCircle, Wrench, UserCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';

export type FlowStage = 'pending_dispatch' | 'in_repair' | 'pending_acceptance' | 'completed';

export interface StageInfo {
  stage: FlowStage;
  stepIndex: number; // 0: 待分配, 1: 维修中, 2: 待验收, 3: 已完成
  stageLabel: string;
  subStatusLabel: string;
  colorClass: string;
}

export const WORK_ORDER_FLOW_STEPS: {
  stage: FlowStage;
  label: string;
  shortDesc: string;
  stepNumber: number;
}[] = [
  { stage: 'pending_dispatch', label: '待分配', shortDesc: '调度指派', stepNumber: 1 },
  { stage: 'in_repair', label: '维修中', shortDesc: '排查作业', stepNumber: 2 },
  { stage: 'pending_acceptance', label: '待验收', shortDesc: '临床试机', stepNumber: 3 },
  { stage: 'completed', label: '已完成', shortDesc: '闭环归档', stepNumber: 4 }
];

export function getWorkOrderFlowStage(status: WorkOrderStatus): StageInfo {
  switch (status) {
    case 'pending_dispatch':
      return {
        stage: 'pending_dispatch',
        stepIndex: 0,
        stageLabel: '待分配',
        subStatusLabel: '调度待指派',
        colorClass: 'rose'
      };
    case 'dispatched':
      return {
        stage: 'in_repair',
        stepIndex: 1,
        stageLabel: '维修中',
        subStatusLabel: '已派待接单',
        colorClass: 'indigo'
      };
    case 'accepted':
      return {
        stage: 'in_repair',
        stepIndex: 1,
        stageLabel: '维修中',
        subStatusLabel: '工程师在途',
        colorClass: 'blue'
      };
    case 'arrived_inspecting':
      return {
        stage: 'in_repair',
        stepIndex: 1,
        stageLabel: '维修中',
        subStatusLabel: '现场排查中',
        colorClass: 'amber'
      };
    case 'waiting_parts':
      return {
        stage: 'in_repair',
        stepIndex: 1,
        stageLabel: '维修中',
        subStatusLabel: '挂起待配件',
        colorClass: 'purple'
      };
    case 'repaired_pending_acceptance':
      return {
        stage: 'pending_acceptance',
        stepIndex: 2,
        stageLabel: '待验收',
        subStatusLabel: '完工待科室验收',
        colorClass: 'cyan'
      };
    case 'closed':
      return {
        stage: 'completed',
        stepIndex: 3,
        stageLabel: '已完成',
        subStatusLabel: '临床验收已闭环',
        colorClass: 'emerald'
      };
    default:
      return {
        stage: 'pending_dispatch',
        stepIndex: 0,
        stageLabel: '待分配',
        subStatusLabel: '处理中',
        colorClass: 'slate'
      };
  }
}

interface WorkOrderStepBarProps {
  status: WorkOrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showSubStatus?: boolean;
  onStepClick?: (stage: FlowStage) => void;
  className?: string;
}

export const WorkOrderStepBar: React.FC<WorkOrderStepBarProps> = ({
  status,
  size = 'sm',
  showSubStatus = true,
  onStepClick,
  className = ''
}) => {
  const currentInfo = getWorkOrderFlowStage(status);
  const currentStep = currentInfo.stepIndex;

  if (size === 'sm') {
    return (
      <div className={`w-full ${className}`}>
        {/* Simple 4-Step Bar: 待分配 -> 维修中 -> 待验收 -> 已完成 */}
        <div className="flex items-center justify-between gap-1 w-full text-2xs select-none">
          {WORK_ORDER_FLOW_STEPS.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;
            const isFuture = currentStep < idx;

            return (
              <React.Fragment key={step.stage}>
                <div
                  onClick={() => onStepClick && onStepClick(step.stage)}
                  className={`flex items-center gap-1 py-1 px-1.5 rounded transition-all ${
                    onStepClick ? 'cursor-pointer hover:bg-slate-100' : ''
                  } ${
                    isCurrent
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                      : isCompleted
                      ? 'text-emerald-700 font-medium'
                      : 'text-slate-400 font-normal'
                  }`}
                  title={`${step.label} (${step.shortDesc})`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-transform ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : step.stepNumber}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>
                </div>

                {idx < WORK_ORDER_FLOW_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] min-w-[10px] max-w-[28px] transition-colors rounded-full ${
                      currentStep > idx
                        ? 'bg-emerald-500'
                        : currentStep === idx
                        ? 'bg-gradient-to-r from-indigo-500 to-slate-200'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Optional sub-status badge on current step */}
        {showSubStatus && (
          <div className="flex items-center justify-between mt-1 text-[11px] px-0.5">
            <span className="text-slate-400">当前流转状态:</span>
            <span
              className={`font-semibold px-1.5 py-0.2 rounded text-[10px] border ${
                currentInfo.colorClass === 'rose'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : currentInfo.colorClass === 'indigo'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : currentInfo.colorClass === 'blue'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : currentInfo.colorClass === 'amber'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : currentInfo.colorClass === 'purple'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : currentInfo.colorClass === 'cyan'
                  ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              ● {currentInfo.subStatusLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Medium and Large size for headers, tracking banners and modals
  return (
    <div className={`w-full bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 ${className}`}>
      <div className="flex items-center justify-between relative">
        {WORK_ORDER_FLOW_STEPS.map((step, idx) => {
          const isCompleted = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isFuture = currentStep < idx;

          return (
            <React.Fragment key={step.stage}>
              <div
                onClick={() => onStepClick && onStepClick(step.stage)}
                className={`flex flex-col items-center text-center z-10 transition-all ${
                  onStepClick ? 'cursor-pointer group' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-sm'
                      : 'bg-white border-2 border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                </div>

                <div className="mt-1.5">
                  <div
                    className={`text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-indigo-900'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 whitespace-nowrap ${
                      isCurrent
                        ? 'text-indigo-600 font-semibold'
                        : isCompleted
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {isCurrent ? currentInfo.subStatusLabel : step.shortDesc}
                  </div>
                </div>
              </div>

              {idx < WORK_ORDER_FLOW_STEPS.length - 1 && (
                <div className="flex-1 px-2 mb-6">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      currentStep > idx
                        ? 'bg-emerald-500'
                        : currentStep === idx
                        ? 'bg-gradient-to-r from-indigo-500 via-indigo-300 to-slate-200'
                        : 'bg-slate-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
