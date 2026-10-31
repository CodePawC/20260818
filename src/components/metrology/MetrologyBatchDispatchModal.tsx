import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  Printer, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Scale, 
  Clock, 
  UserCheck, 
  QrCode,
  FileText
} from 'lucide-react';
import { MedicalEquipment } from '../../types';
import { getEquipmentCalibrationInfo } from '../../utils/calibrationUtils';

interface MetrologyBatchDispatchModalProps {
  isOpen: boolean;
  equipments: MedicalEquipment[];
  onClose: () => void;
  onDispatchSuccess: (dispatchedCount: number, agency: string, batchNo: string) => void;
}

const DISPATCH_AGENCIES = [
  '山东省计量科学研究院',
  '日照市检验检测中心 (法定计量所)',
  '五莲县综合检验检测中心 (计量股)',
  '中国计量科学研究院',
  '山东省医疗器械和药品包装检验研究院',
  '广州广电计量检测股份有限公司 (济南分部)'
];

export const MetrologyBatchDispatchModal: React.FC<MetrologyBatchDispatchModalProps> = ({
  isOpen,
  equipments,
  onClose,
  onDispatchSuccess
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // 默认选择临期或已超期的设备
    return equipments
      .filter(eq => {
        const cal = getEquipmentCalibrationInfo(eq);
        return cal.statusType === 'due_soon' || cal.statusType === 'overdue';
      })
      .map(eq => eq.id);
  });

  const [agency, setAgency] = useState<string>(DISPATCH_AGENCIES[0]);
  const [plannedDate, setPlannedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [escortEngineer, setEscortEngineer] = useState<string>('王维波 (医工主管)');
  const [escortPhone, setEscortPhone] = useState<string>('13863388102');
  const [notes, setNotes] = useState<string>('请携带医用患者模拟器现场检定心电与生命体征监护参数，需重点出具法定检定合格证。');
  const [isPrintPreview, setIsPrintPreview] = useState<boolean>(false);

  const batchNo = useMemo(() => {
    return `DISP-CAL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
  }, []);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === equipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(equipments.map(e => e.id));
    }
  };

  const selectedEquipments = equipments.filter(e => selectedIds.includes(e.id));

  const handleConfirmDispatch = () => {
    if (selectedIds.length === 0) return;
    onDispatchSuccess(selectedIds.length, agency, batchNo);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">批量委托送检 / 现场检定派工单生成</h3>
                <span className="font-mono text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                  批次: {batchNo}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                向具备法定资质计量院所下发检定委托任务，打印送检清单交接表
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintPreview(!isPrintPreview)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isPrintPreview ? '返回派工配置' : '预览送检交接单'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
          {!isPrintPreview ? (
            <div className="space-y-4">
              {/* Form Options */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">受托法定计量检定机构 *</label>
                  <select
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {DISPATCH_AGENCIES.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">计划检定实施日期 *</label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">院方交接陪同工程师</label>
                  <input
                    type="text"
                    value={escortEngineer}
                    onChange={(e) => setEscortEngineer(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="工程师姓名及职务"
                  />
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-slate-700 block">特别送检要求 / 附注说明</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    placeholder="如：要求提供电子检定证书，并在主机背面张贴合格绿色准用标牌"
                  />
                </div>
              </div>

              {/* Equipment Selection Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                    >
                      {selectedIds.length === equipments.length ? '取消全选' : '全选所有待检'}
                    </button>
                    <span className="text-slate-600">
                      已选中 <strong className="text-indigo-600 font-bold">{selectedIds.length}</strong> / {equipments.length} 台设备
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    已勾选将自动编入此派工批次
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {equipments.map(eq => {
                    const cal = getEquipmentCalibrationInfo(eq);
                    const isSelected = selectedIds.includes(eq.id);
                    return (
                      <div 
                        key={eq.id}
                        onClick={() => toggleSelect(eq.id)}
                        className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent onClick
                            className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate flex items-center gap-2">
                              <span>{eq.name}</span>
                              <span className="text-[10px] font-normal text-slate-500">{eq.model || '-'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              资产编号: {eq.assetNo || eq.id} ｜ SN: {eq.sn || '-'} ｜ 科室: {eq.department}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cal.feePolicyBadgeClass}`}>
                            {cal.calibrationType}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${cal.badgeClass}`}>
                            {cal.statusLabel} ({cal.daysRemaining !== null ? `${cal.daysRemaining}天` : '-'})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Printable Handover Sheet */
            <div className="bg-white p-8 rounded-xl shadow-md border-2 border-slate-300 text-slate-900 text-xs space-y-4 max-w-3xl mx-auto">
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <div className="text-xs text-slate-500 tracking-wider">五莲县人民医院 医学工程部</div>
                <h2 className="text-xl font-bold tracking-wider mt-0.5">
                  医学装备法定计量检定 / 校准送检委托交接单
                </h2>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2">
                  <span>委托批次: <strong>{batchNo}</strong></span>
                  <span>送检机构: <strong>{agency}</strong></span>
                  <span>交接日期: <strong>{plannedDate}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                <div>院方联系人: {escortEngineer} ({escortPhone})</div>
                <div>检定方式: 现场检定 / 送实验室检定</div>
                <div className="col-span-2">送检附注: {notes}</div>
              </div>

              <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300">序号</th>
                    <th className="p-1.5 border-r border-slate-300">设备名称</th>
                    <th className="p-1.5 border-r border-slate-300">规格型号</th>
                    <th className="p-1.5 border-r border-slate-300">出厂SN</th>
                    <th className="p-1.5 border-r border-slate-300">科室</th>
                    <th className="p-1.5 border-r border-slate-300">检定性质</th>
                    <th className="p-1.5">检定结论 (机构签章)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedEquipments.map((eq, i) => (
                    <tr key={eq.id}>
                      <td className="p-1.5 border-r border-slate-200 font-mono">{i + 1}</td>
                      <td className="p-1.5 border-r border-slate-200 font-bold">{eq.name}</td>
                      <td className="p-1.5 border-r border-slate-200">{eq.model || '-'}</td>
                      <td className="p-1.5 border-r border-slate-200 font-mono">{eq.sn || '-'}</td>
                      <td className="p-1.5 border-r border-slate-200">{eq.department}</td>
                      <td className="p-1.5 border-r border-slate-200">
                        {getEquipmentCalibrationInfo(eq).calibrationType}
                      </td>
                      <td className="p-1.5 text-slate-400 font-mono">[  ] 合格  [  ] 准用</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-6 grid grid-cols-2 gap-8 text-[11px] border-t border-slate-300 mt-6">
                <div>
                  <div>送检经办人 (医院工程师签字): ____________________</div>
                  <div className="mt-2 text-slate-500">交出日期: {plannedDate}</div>
                </div>
                <div>
                  <div>检定受托机构 (接收检定员签字): ____________________</div>
                  <div className="mt-2 text-slate-500">接收日期: ______年___月___日 (加盖检定业务公章)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            已选定 <strong className="text-indigo-600">{selectedIds.length}</strong> 台设备待派工
          </div>

          <div className="flex items-center gap-2">
            {isPrintPreview && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>立即打印此交接单</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleConfirmDispatch}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                selectedIds.length > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>确认下发派工任务 ({selectedIds.length}台)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
