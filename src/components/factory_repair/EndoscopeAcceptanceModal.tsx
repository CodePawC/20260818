import React, { useState } from 'react';
import { 
  X, 
  ClipboardCheck, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Activity, 
  Clock, 
  PenTool, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ReturnFactoryRepairOrder, OnsiteAcceptanceAndTrial } from '../../types/factoryRepairTypes';

interface EndoscopeAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReturnFactoryRepairOrder;
  onConfirmAcceptance: (acceptance: OnsiteAcceptanceAndTrial) => void;
  onSettleProject: (surgeries: number, observation: string) => void;
}

export const EndoscopeAcceptanceModal: React.FC<EndoscopeAcceptanceModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmAcceptance,
  onSettleProject
}) => {
  const acceptance = order.acceptanceTrial;
  const [testItems, setTestItems] = useState(acceptance.testItems);
  const [surgeriesCount, setSurgeriesCount] = useState(acceptance.trialSurgeriesCount || 6);
  const [observations, setObservations] = useState(
    acceptance.trialObservations || 
    '在麻醉手术科与泌尿外科联合开展的6台输尿管硬镜碎石取石手术中全流程跟台试用：视野图像极其锐利明亮，红蓝色彩还原极佳，连续手术3小时无起雾渗漏，耐高温高压洗消性能达标。'
  );

  if (!isOpen) return null;

  const isSettled = acceptance.trialStatus === 'settled_qualified';

  const handleToggleTestResult = (index: number) => {
    const updated = [...testItems];
    updated[index].result = updated[index].result === 'pass' ? 'fail' : 'pass';
    setTestItems(updated);
  };

  const handleSaveAcceptance = () => {
    const updated: OnsiteAcceptanceAndTrial = {
      ...acceptance,
      testItems,
      acceptanceConclusion: testItems.every(t => t.result === 'pass') ? 'qualified' : 'unqualified',
      acceptanceDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    onConfirmAcceptance(updated);
  };

  const handleSettle = () => {
    onSettleProject(Number(surgeriesCount), observations);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                输尿管镜现场开箱技术验收与1周临床试用结项
              </h3>
              <p className="text-xs text-slate-500">
                双人技术验收核准 · 7天临床手术实战试用 · 严谨结项开票
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
          {/* 第一阶段：现场开箱检测核验 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-800">
                1. 现场开箱性能实测 (设备科: 崔伟 & 麻醉手术科: 黄晓彤 双人现场验收)
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                检测结论：综合合格
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {testItems.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50">
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{item.item}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.requirement}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">{item.note}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTestResult(idx)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition ${
                        item.result === 'pass'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {item.result === 'pass' ? '✓ 合格' : '✕ 不合格'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-4">
                <span>医工签字: <strong className="text-slate-800">崔伟 (已签)</strong></span>
                <span>科室护士长签字: <strong className="text-slate-800">黄晓彤 (已签)</strong></span>
              </div>
              <span className="text-slate-400 font-mono">验收时间: {acceptance.acceptanceDate}</span>
            </div>
          </div>

          {/* 第二阶段：1周临床试用跟踪卡片 */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-xs">
                  2. 临床手术跟台试用机制 (核心内控：试用满1周且无异常方可结项)
                </h4>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                isSettled ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isSettled ? '已满1周·验收合格结项' : '7天试用观察期中'}
              </span>
            </div>

            {/* 试用进度信息 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">试用开始时间</div>
                <div className="font-bold text-slate-800 mt-0.5 font-mono text-[11px]">
                  {acceptance.trialStartDate}
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">满1周达标结项时间</div>
                <div className="font-bold text-indigo-700 mt-0.5 font-mono text-[11px]">
                  {acceptance.trialEndDate}
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-500">试用期间实际跟台手术</div>
                <div className="font-bold text-slate-800 mt-0.5 font-mono">
                  {surgeriesCount} 台碎石术
                </div>
              </div>
            </div>

            {/* 试用观察记录 */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                临床术中实际观察评价记录 (麻醉手术科 & 泌尿外科使用医生):
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="请输入跟台试用实际表现..."
              />
            </div>

            {/* 结项按钮 */}
            {!isSettled ? (
              <div className="pt-2 flex items-center justify-between border-t border-indigo-100">
                <div className="text-[11px] text-slate-500">
                  确认无任何水雾、透光减退或光轴偏移故障后，点击结项。
                </div>
                <button
                  type="button"
                  onClick={handleSettle}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>临床试用满1周无异常 · 正式结项</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  本科目已于 {acceptance.settledAt} 完成正式结项。厂家端已自动解锁发票上传入口！
                </span>
                <span className="font-mono text-emerald-600">经手人: {acceptance.settledSignee}</span>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
