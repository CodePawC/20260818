import React from 'react';
import { 
  FactoryRepairStage, 
  WorkflowRole 
} from '../../types/factoryRepairTypes';
import { STAGE_CONFIGS, WORKFLOW_ACTORS } from '../../utils/factoryRepairData';
import { 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  Search, 
  PenTool, 
  Truck, 
  FileSpreadsheet, 
  Scale, 
  FileSignature, 
  RotateCcw, 
  ClipboardCheck, 
  Receipt,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

interface FactoryRepairFlowchartProps {
  currentStage: FactoryRepairStage;
  selectedStage: FactoryRepairStage;
  onSelectStage: (stage: FactoryRepairStage) => void;
  currentRole: WorkflowRole;
  onChangeRole: (role: WorkflowRole) => void;
  isCompact?: boolean;
}

export const FactoryRepairFlowchart: React.FC<FactoryRepairFlowchartProps> = ({
  currentStage,
  selectedStage,
  onSelectStage,
  currentRole,
  onChangeRole,
  isCompact = false
}) => {
  const currentStageIndex = STAGE_CONFIGS.findIndex(s => s.key === currentStage);

  // 阶段图标映射
  const getStageIcon = (key: FactoryRepairStage, className = "w-4 h-4") => {
    switch (key) {
      case 'DEPARTMENT_REPORT': return <FileText className={className} />;
      case 'ONSITE_CHECK_DRAFT': return <Search className={className} />;
      case 'MULTI_LEVEL_APPROVAL': return <PenTool className={className} />;
      case 'DISPATCH_EXPRESS': return <Truck className={className} />;
      case 'VENDOR_INSPECT_QUOTE': return <FileSpreadsheet className={className} />;
      case 'JOINT_NEGOTIATION': return <Scale className={className} />;
      case 'CONTRACT_SIGNING': return <FileSignature className={className} />;
      case 'VENDOR_REPAIR_RETURN': return <RotateCcw className={className} />;
      case 'ACCEPTANCE_TRIAL_SETTLE': return <ClipboardCheck className={className} />;
      case 'INVOICE_PAYMENT_TRACK': return <Receipt className={className} />;
    }
  };

  // 角色背景色映射
  const getRoleBadge = (roleKey: WorkflowRole) => {
    switch (roleKey) {
      case 'clinical_anesthesia':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: '麻醉手术科' };
      case 'equipment_engineer':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: '医疗设备科' };
      case 'vp_medical':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: '分管院长' };
      case 'president':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: '院领导' };
      case 'vendor_oem':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: '狼牌厂家' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 流程图头部栏 */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                输尿管镜精密器械返厂大修·十阶端到端闭环流程图
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium">
                麻醉手术科 ↔ 设备科 ↔ 院领导 ↔ 厂家
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              遵循公立医院医疗装备全生命周期与大修内控规程，点击任意节点可穿透查阅该阶段单据明细与会签留痕
            </p>
          </div>
        </div>

        {/* 角色视角快速切换器 */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
            <span>当前视角:</span>
          </span>
          {(Object.keys(WORKFLOW_ACTORS) as WorkflowRole[]).map((roleKey) => {
            const actor = WORKFLOW_ACTORS[roleKey];
            const isCurrent = currentRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => onChangeRole(roleKey)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  isCurrent 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={`切换为【${actor.roleTitle}】身份查看`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white' : actor.avatarColor}`} />
                <span>{actor.name}</span>
                <span className={`text-[10px] hidden md:inline ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                  ({actor.roleKey === 'clinical_anesthesia' ? '麻醉科' : actor.roleKey === 'equipment_engineer' ? '设备科' : actor.roleKey === 'vp_medical' ? '分管院长' : actor.roleKey === 'president' ? '院长' : '厂家'})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 流程图主轨道 */}
      <div className="p-5 overflow-x-auto">
        <div className="min-w-[1020px]">
          {/* 阶段连线卡片网格 (两排5个 或 单行滚动) */}
          <div className="grid grid-cols-5 gap-3">
            {STAGE_CONFIGS.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isSelected = stage.key === selectedStage;
              const roleBadge = getRoleBadge(stage.roleKey);

              return (
                <div
                  key={stage.key}
                  onClick={() => onSelectStage(stage.key)}
                  className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/40 shadow-sm'
                      : isCurrent
                      ? 'border-blue-500 bg-blue-50/30 shadow-xs'
                      : isPast
                      ? 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
                      : 'border-slate-200/70 bg-white opacity-70 hover:opacity-100 hover:border-slate-300'
                  }`}
                >
                  {/* 顶部序号与状态 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isPast
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isPast ? '✓' : stage.index}
                      </span>
                      <span className={`text-[11px] font-medium border px-1.5 py-0.2 rounded ${roleBadge.bg}`}>
                        {stage.leadRole}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {isPast && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> 已达成
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[11px] text-blue-600 font-bold flex items-center gap-0.5">
                          <Clock className="w-3 h-3 animate-spin" /> 进行中
                        </span>
                      )}
                      {!isPast && !isCurrent && (
                        <span className="text-[11px] text-slate-400">待流转</span>
                      )}
                    </div>
                  </div>

                  {/* 标题与图标 */}
                  <div className="flex items-start gap-2 mb-1.5">
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : isCurrent 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getStageIcon(stage.key, "w-3.5 h-3.5")}
                    </div>
                    <div>
                      <h3 className={`text-xs font-bold leading-tight ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {stage.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {/* 选中高亮底标 */}
                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-indigo-200/60 flex items-center justify-between text-[11px] font-semibold text-indigo-700">
                      <span>当前选中查看</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}

                  {/* 连接箭头 (非每排最后一个节点时) */}
                  {idx % 5 !== 4 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden xl:flex items-center justify-center w-4 h-4 rounded-full bg-white border border-slate-300 text-slate-400 shadow-2xs">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部业务规则与权限说明条 */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>核心内控准则：</span>
          </span>
          <span className="text-slate-500">
            ① 现场检查起草后麻醉手术科全程穿透可见
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            ② 分管院长签字后由院长终审签字方可寄出实施
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            ③ 厂家拆检报价由科室与院长透明共同议价
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">
            ④ 到货验收并经临床手术试用满1周方可结项开票
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
          <span>总进度:</span>
          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(((currentStageIndex + 1) / STAGE_CONFIGS.length) * 100)}%` }}
            />
          </div>
          <span className="font-bold text-slate-700">
            {Math.round(((currentStageIndex + 1) / STAGE_CONFIGS.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
