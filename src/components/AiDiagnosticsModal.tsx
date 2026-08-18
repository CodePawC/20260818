import React, { useState, useEffect } from 'react';
import { MedicalEquipment } from '../types';
import { X, Bot, Sparkles, Loader2, Wrench, ShieldAlert, CheckCircle } from 'lucide-react';

interface AiDiagnosticsModalProps {
  isOpen: boolean;
  equipmentList: MedicalEquipment[];
  preSelectedDevice?: MedicalEquipment | null;
  onClose: () => void;
}

export const AiDiagnosticsModal: React.FC<AiDiagnosticsModalProps> = ({
  isOpen,
  equipmentList,
  preSelectedDevice,
  onClose,
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [faultDescription, setFaultDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (preSelectedDevice) {
      setSelectedEquipmentId(preSelectedDevice.id);
      setEquipmentName(preSelectedDevice.name);
      setModel(preSelectedDevice.model);
      setDepartment(preSelectedDevice.department);
      const latestRepair = preSelectedDevice.repairRecords[0];
      setFaultDescription(latestRepair ? latestRepair.faultDescription : '设备运行异常，需排查故障原因。');
    } else if (equipmentList.length > 0 && !selectedEquipmentId) {
      const first = equipmentList[0];
      setSelectedEquipmentId(first.id);
      setEquipmentName(first.name);
      setModel(first.model);
      setDepartment(first.department);
      setFaultDescription('设备无法正常开机，提示电源模块过热或传感器数据超出标定范围。');
    }
  }, [preSelectedDevice, equipmentList, isOpen]);

  const handleDeviceSelectChange = (id: string) => {
    setSelectedEquipmentId(id);
    const equip = equipmentList.find(e => e.id === id);
    if (equip) {
      setEquipmentName(equip.name);
      setModel(equip.model);
      setDepartment(equip.department);
      const latestRepair = equip.repairRecords[0];
      setFaultDescription(latestRepair ? latestRepair.faultDescription : '设备自检报警，需工程排查。');
    }
  };

  if (!isOpen) return null;

  const handleRunAiDiagnosis = async () => {
    if (!equipmentName.trim() || !faultDescription.trim()) {
      alert('请补充设备名称与故障现象描述！');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setAnalysisResult('');

    try {
      const response = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName,
          model,
          department,
          faultDescription
        })
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        setErrorMsg(data.error || '诊断请求失败');
      }
    } catch (err: any) {
      setErrorMsg(`网络通讯失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                AI 医疗设备故障智能诊断与排查助手
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Gemini Powered
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                结合临床工程(Clinical Engineering)标准与设备运维专家知识库
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Form */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">选择台账已有设备</label>
                <select
                  value={selectedEquipmentId}
                  onChange={(e) => handleDeviceSelectChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {equipmentList.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} [{e.sn}] - {e.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">规格型号</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">故障现象与临床报修描述</label>
              <textarea
                rows={2}
                value={faultDescription}
                onChange={(e) => setFaultDescription(e.target.value)}
                placeholder="例如：多参数监护仪心电模组干扰较大，自检报错Code C-302，或呼吸机通气气路压力漂移..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                disabled={loading}
                onClick={handleRunAiDiagnosis}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 正在分析医疗设备排查方案...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    生成专业 AI 维保排查指导
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results section */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-none mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">诊断请求遇到问题</p>
                <p className="text-xs mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {analysisResult && (
            <div className="bg-white p-5 rounded-lg border border-cyan-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-cyan-800 font-bold border-b border-cyan-100 pb-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <h3>Gemini AI 维保排查与风险评估结论</h3>
              </div>

              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-sans text-sm space-y-2">
                {analysisResult}
              </div>
            </div>
          )}

          {!analysisResult && !loading && !errorMsg && (
            <div className="p-8 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
              <Bot className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">点击“生成专业 AI 维保排查指导”开始智能分析</p>
              <p className="text-xs text-slate-400 mt-1">
                系统将基于医学工程规范提供核心原因排查、零部件建议、临床应急替代措施及预防保养提醒。
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition"
          >
            关闭视窗
          </button>
        </div>
      </div>
    </div>
  );
};
