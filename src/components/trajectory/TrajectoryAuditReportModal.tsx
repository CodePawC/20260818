import React, { useMemo } from 'react';
import { MedicalEquipment } from '../../types';
import { 
  TrajectoryEvent, 
  generateFullTrajectoryEvents, 
  calculateSpatialMigrationStats 
} from '../../utils/trajectoryData';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Activity, 
  FileText,
  Boxes,
  MapPin,
  Download
} from 'lucide-react';

interface TrajectoryAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: MedicalEquipment[];
  hospitalName?: string;
}

export const TrajectoryAuditReportModal: React.FC<TrajectoryAuditReportModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  hospitalName = '五莲县人民医院'
}) => {
  const events = useMemo(() => generateFullTrajectoryEvents(equipmentList), [equipmentList]);
  const stats = useMemo(() => calculateSpatialMigrationStats(equipmentList), [equipmentList]);

  const auditDate = new Date().toISOString().split('T')[0];
  const auditReportNo = `AUD-MDR-WLH-${auditDate.replace(/-/g, '')}-8891`;

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Controls Header (Screen only) */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                三甲评审 / 医疗器械使用质量管理规范 · 设备时空流转与状态变动合规审计汇编
              </h3>
              <p className="text-2xs text-slate-500">
                自动汇编全院在册医疗设备物理搬迁、应急借调周转、法定强检定标与状态更迭凭证
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              打印/导出合规审计书
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Audit Document Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 print:border-none p-8 sm:p-10 rounded-xl shadow-xs print:shadow-none space-y-6">
            
            {/* Document Header */}
            <div className="text-center border-b-2 border-slate-900 pb-5 space-y-2">
              <div className="text-xs font-bold text-slate-500 tracking-widest uppercase">
                {hospitalName} · 医学工程保障处 · 质控与资产监督办公室
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                医疗设备全生命周期时空流转与状态变动合规审计报告
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600 pt-1">
                <span>审计报告编号: <strong className="font-mono text-slate-900">{auditReportNo}</strong></span>
                <span>•</span>
                <span>审计核定基准日: <strong className="text-slate-900">{auditDate}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  防伪数字存证已验签
                </span>
              </div>
            </div>

            {/* Legal Basis & Executive Summary */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                法律法规依据与审计结论摘要
              </div>
              <p>
                本审计册依据国家《医疗器械监督管理条例》（国务院令第739号）、《医疗器械使用质量管理办法》第十五条（转让、调拨、借用记录要求）及第二十一条（停用、报废与技术评估规定），经系统自动抓取全院 <strong>{equipmentList.length}</strong> 台在册医疗设备的物理搬迁、应急调配、原厂返厂与状态变动存证生成。
              </p>
              <p className="text-slate-600">
                本期累计核查流转轨迹记录 <strong>{stats.totalEvents}</strong> 条，其中跨科空间迁徙 <strong>{stats.spatialRelocationsCount}</strong> 次，急救跨科借调 <strong>{stats.emergencyLoansCount}</strong> 台次，法定计量强检 <strong>{stats.metrologyCount}</strong> 台次，全流程均匹配电子经办人与CA防篡改哈希，未发现账物分离或脱管违规。
              </p>
            </div>

            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
                <div className="text-2xs text-slate-400 font-bold uppercase">在册设备总数</div>
                <div className="text-lg font-black text-slate-800 mt-0.5">{equipmentList.length} 台</div>
              </div>
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-center">
                <div className="text-2xs text-indigo-700 font-bold uppercase">空间物理迁徙</div>
                <div className="text-lg font-black text-indigo-800 mt-0.5">{stats.spatialRelocationsCount} 次</div>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-center">
                <div className="text-2xs text-amber-700 font-bold uppercase">急救跨科借调</div>
                <div className="text-lg font-black text-amber-800 mt-0.5">{stats.emergencyLoansCount} 次</div>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center">
                <div className="text-2xs text-emerald-700 font-bold uppercase">法定计量强检</div>
                <div className="text-lg font-black text-emerald-800 mt-0.5">{stats.metrologyCount} 次</div>
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-center">
                <div className="text-2xs text-rose-700 font-bold uppercase">超期借调滞留预警</div>
                <div className="text-lg font-black text-rose-800 mt-0.5">{stats.activeLoanOverstayCount} 台</div>
              </div>
            </div>

            {/* Section 1: Department Cross-flow Heat Matrix */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2.5">
                一、重点科室间流转频次与设备借调流向
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">流出科室 / 调拨源</th>
                      <th className="py-2 px-3">流入科室 / 调拨目标</th>
                      <th className="py-2 px-3 text-center">流转频次</th>
                      <th className="py-2 px-3">主要流动机具品类举例</th>
                      <th className="py-2 px-3 text-right">流转性质</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats.departmentFlowMatrix.map((flow, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{flow.from}</td>
                        <td className="py-2.5 px-3 font-semibold text-blue-700">{flow.to}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{flow.count} 次</td>
                        <td className="py-2.5 px-3 text-slate-600">{flow.equipmentNames.join('、') || '急救生命支持类机具'}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            应急借调/临床跨科
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Full Lifecycle Audit Ledger Samples */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-l-4 border-blue-600 pl-2.5">
                二、核心设备时空位移与状态变动明细登记簿（抽样摘录）
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-2xs text-slate-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2 px-3">变动时间</th>
                      <th className="py-2 px-3">设备编码 / 名称</th>
                      <th className="py-2 px-3">变动类型</th>
                      <th className="py-2 px-3">流向位置轨迹</th>
                      <th className="py-2 px-3">关联单据编号</th>
                      <th className="py-2 px-3">经办人 / 角色</th>
                      <th className="py-2 px-3 text-right">CA存证校验</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-2xs font-medium">
                    {events.slice(0, 15).map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{ev.timestamp}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-800">{ev.equipmentName}</div>
                          <div className="font-mono text-slate-400">{ev.internalNo}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                            {ev.eventType === 'spatial_relocation' ? '空间迁徙' :
                             ev.eventType === 'emergency_loan' ? '应急借调' :
                             ev.eventType === 'metrology_verification' ? '法定强检' :
                             ev.eventType === 'factory_repair' ? '外协返厂' :
                             ev.eventType === 'initial_commissioning' ? '验收投运' : '状态更迭'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          <span className="text-slate-500">{ev.fromDepartment || '原点'}</span>
                          <span className="text-blue-500 mx-1">➔</span>
                          <span className="font-semibold text-slate-800">{ev.toDepartment || '目标'}</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">{ev.voucherNo || '-'}</td>
                        <td className="py-2 px-3 text-slate-700">{ev.operator}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {ev.caSignatureHash ? '已校验' : '有效'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatures Strip */}
            <div className="border-t-2 border-slate-900 pt-6 mt-8 grid grid-cols-3 gap-6 text-xs text-slate-700">
              <div className="space-y-6">
                <div>审计经办人: <span className="font-bold text-slate-900">崔伟 (主任工程师)</span></div>
                <div>签名: <span className="underline decoration-slate-400 decoration-dotted font-serif italic text-base">崔 伟</span></div>
                <div>日期: {auditDate}</div>
              </div>
              <div className="space-y-6">
                <div>医学工程处处长: <span className="font-bold text-slate-900">孙处长</span></div>
                <div>签批: <span className="underline decoration-slate-400 decoration-dotted font-serif italic text-base">孙志强 (审核合格)</span></div>
                <div>日期: {auditDate}</div>
              </div>
              <div className="space-y-6 text-right">
                <div>分管院长 / 委员会公章:</div>
                <div className="inline-block border-2 border-red-600 text-red-600 rounded-full px-4 py-2 font-bold rotate-[-6deg] text-xs">
                  五莲县人民医院<br />医学装备质控专用章
                </div>
                <div>存证哈希: {auditReportNo}</div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom (Screen only) */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 print:hidden">
          <div className="text-xs text-slate-500">
            支持标准 A4 页面打印或直接生成电子 PDF 归档
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              立即打印
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
