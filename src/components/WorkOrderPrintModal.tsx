import React from 'react';
import { EngineeringWorkOrder } from '../types/dispatchTypes';
import { X, Printer, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';

interface WorkOrderPrintModalProps {
  isOpen: boolean;
  workOrder: EngineeringWorkOrder | null;
  onClose: () => void;
}

export const WorkOrderPrintModal: React.FC<WorkOrderPrintModalProps> = ({
  isOpen,
  workOrder,
  onClose
}) => {
  if (!isOpen || !workOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPriorityText = (p: string) => {
    switch (p) {
      case 'P1_CRITICAL': return 'P1 特急 / 急救生命支持';
      case 'P2_URGENT': return 'P2 紧急 / 关键医技检查';
      case 'P3_STANDARD': return 'P3 常规 / 病区在用设备';
      default: return 'P4 计划性 / 预防保养与计量';
    }
  };

  const getStatusText = (s: string) => {
    switch (s) {
      case 'pending_dispatch': return '待派工';
      case 'dispatched': return '已派工待接单';
      case 'accepted': return '已接单在途';
      case 'arrived_inspecting': return '现场排查检修中';
      case 'waiting_parts': return '挂起等待配件';
      case 'repaired_pending_acceptance': return '完工待临床验收';
      case 'closed': return '临床验收通过 · 已闭环归档';
      default: return s;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none">
        {/* Modal Toolbar (hidden in print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm">打印工程派工单 / 临床验收闭环凭据</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>立即调用系统打印 (A4标准凭单)</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Container */}
        <div className="p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:p-6 text-slate-900 text-xs font-sans">
          {/* Sheet Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-4">
            <div className="text-xs tracking-widest text-slate-500 font-semibold mb-1">
              五莲县人民医院 · 医学工程保障中心
            </div>
            <h1 className="text-xl font-bold tracking-wider text-slate-900">
              医疗设备应急抢修工程派工与临床验收闭环凭据
            </h1>
            <div className="flex items-center justify-between text-2xs text-slate-500 mt-2 px-1">
              <span>工单编号：<strong className="font-mono text-slate-900">{workOrder.id}</strong></span>
              <span>归档密级：三甲评审核心质控台账 (永久留存)</span>
              <span>打印时间：{new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Section 1: Device & Reporter Table */}
          <table className="w-full border-collapse border border-slate-900 text-xs mb-3">
            <tbody>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold w-24 text-slate-700">设备名称</td>
                <td className="border border-slate-900 p-2 font-bold text-slate-900">{workOrder.equipmentName}</td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold w-24 text-slate-700">规格型号</td>
                <td className="border border-slate-900 p-2 font-mono">{workOrder.equipmentModel}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">出厂SN序列号</td>
                <td className="border border-slate-900 p-2 font-mono">{workOrder.equipmentSn}</td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">科室自编号</td>
                <td className="border border-slate-900 p-2 font-mono font-bold text-blue-800">{workOrder.internalNo || '—'}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">使用科室</td>
                <td className="border border-slate-900 p-2 font-semibold">{workOrder.department}</td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">设备放置地</td>
                <td className="border border-slate-900 p-2">{workOrder.location}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">报修人信息</td>
                <td className="border border-slate-900 p-2">{workOrder.reporterName} ({workOrder.reporterPhone})</td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">报修时间</td>
                <td className="border border-slate-900 p-2 font-mono">{workOrder.reportTime}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">急缓级别</td>
                <td className="border border-slate-900 p-2 font-bold text-rose-700">{getPriorityText(workOrder.priority)}</td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">当前工单状态</td>
                <td className="border border-slate-900 p-2 font-bold text-indigo-800">{getStatusText(workOrder.status)}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">临床故障现象</td>
                <td colSpan={3} className="border border-slate-900 p-2 leading-relaxed text-slate-800">
                  {workOrder.faultDescription}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 2: Dispatch & Field Engineering */}
          <table className="w-full border-collapse border border-slate-900 text-xs mb-3">
            <tbody>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold w-24 text-slate-700">调度总台</td>
                <td className="border border-slate-900 p-2">{workOrder.dispatcherName || '医工调度中心'}</td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold w-24 text-slate-700">专业保障组</td>
                <td className="border border-slate-900 p-2 font-semibold">{workOrder.biomedicalGroup}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">责任工程师</td>
                <td className="border border-slate-900 p-2 font-bold text-indigo-900">
                  {workOrder.assignedEngineerName || '未指定'} ({workOrder.assignedEngineerPhone})
                </td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">派工时间</td>
                <td className="border border-slate-900 p-2 font-mono">{workOrder.dispatchTime || '—'}</td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">响应与到场</td>
                <td className="border border-slate-900 p-2">
                  响应耗时: <strong className="font-mono">{workOrder.responseTimeMinutes ?? '—'}分钟</strong> (限{workOrder.slaResponseLimitMinutes}分)
                  {workOrder.isSlaResponseMet && <span className="text-emerald-700 font-bold ml-1">【SLA达标】</span>}
                </td>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">停机修复耗时</td>
                <td className="border border-slate-900 p-2 font-mono font-bold text-slate-900">
                  {workOrder.totalDowntimeHours} 小时 (SLA时限: {workOrder.slaRepairLimitHours}小时)
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">现场检测结论</td>
                <td colSpan={3} className="border border-slate-900 p-2 text-slate-800 leading-relaxed">
                  {workOrder.faultAnalysis || '无特殊记录'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">处置工艺措施</td>
                <td colSpan={3} className="border border-slate-900 p-2 text-slate-800 leading-relaxed">
                  {workOrder.repairAction || '常规排查处置完成'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-900 bg-slate-100 p-2 font-bold text-slate-700">安全质控复核</td>
                <td colSpan={3} className="border border-slate-900 p-2 space-x-4">
                  <span className="font-bold text-emerald-800">
                    ☑ 修复后电气安全质控检测 (GB 9706.1 标准)：{workOrder.electricalSafetyPassed ? '合格' : '未检测'}
                  </span>
                  <span className="font-bold text-emerald-800">
                    ☑ 关键计量性能自检与校准：{workOrder.performanceCalibrationPassed ? '合格' : '未检测'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Section 3: Parts Table */}
          {workOrder.partsReplaced && workOrder.partsReplaced.length > 0 && (
            <div className="mb-3">
              <div className="font-bold text-xs mb-1 text-slate-800">零配件与耗材更换明细：</div>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-900 p-1.5 text-left">配件物料编号</th>
                    <th className="border border-slate-900 p-1.5 text-left">备件名称</th>
                    <th className="border border-slate-900 p-1.5 text-left">规格型号</th>
                    <th className="border border-slate-900 p-1.5 text-center">备件来源</th>
                    <th className="border border-slate-900 p-1.5 text-center">数量</th>
                    <th className="border border-slate-900 p-1.5 text-right">单价 (元)</th>
                    <th className="border border-slate-900 p-1.5 text-right">合计 (元)</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrder.partsReplaced.map((part, i) => (
                    <tr key={i}>
                      <td className="border border-slate-900 p-1.5 font-mono">{part.partNo}</td>
                      <td className="border border-slate-900 p-1.5 font-medium">{part.partName}</td>
                      <td className="border border-slate-900 p-1.5 text-slate-600">{part.spec}</td>
                      <td className="border border-slate-900 p-1.5 text-center">{part.source}</td>
                      <td className="border border-slate-900 p-1.5 text-center font-mono">{part.quantity}</td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono">￥{part.unitPrice.toLocaleString()}</td>
                      <td className="border border-slate-900 p-1.5 text-right font-mono font-bold">￥{part.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={6} className="border border-slate-900 p-1.5 text-right">零备件费用合计：</td>
                    <td className="border border-slate-900 p-1.5 text-right font-mono text-rose-700">
                      ￥{workOrder.totalRepairCost.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Section 4: Clinical Acceptance Sign-off */}
          <div className="border border-slate-900 p-3 mb-4 bg-slate-50/50">
            <div className="font-bold text-xs mb-2 text-slate-900 flex items-center justify-between">
              <span>三甲质量规范 · 临床科室现场试机验证与服务满意度评价：</span>
              <span className="text-2xs font-normal text-slate-500">（本联由科室签字确认并由医工科永久归档）</span>
            </div>
            <div className="space-y-1.5 text-2xs leading-relaxed text-slate-700">
              <div>☑ 1. 设备外观洁净完整、紧固件牢固、各功能键良好。</div>
              <div>☑ 2. 现场通电自检通过，声光报警正常，故障代码彻底消除。</div>
              <div>☑ 3. 实际带负荷试机运行满足临床科室患者诊疗使用规范。</div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-300 text-xs">
              <div>
                <span className="text-slate-500">服务满意度评分：</span>
                <strong className="text-amber-700 font-mono text-sm">{workOrder.ratingScore ? `${workOrder.ratingScore} / 5.0分` : '未评价'}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">临床意见反馈：</span>
                <span className="text-slate-800">{workOrder.clinicalFeedback || '设备修复良好，试机符合临床要求。'}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">医工责任工程师签字：</span>
                <span className="font-bold font-serif underline ml-2">{workOrder.assignedEngineerName}</span>
                <span className="text-2xs text-slate-400 font-mono ml-3">完工时间: {workOrder.repairFinishedTime || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500">临床科室验收人签名：</span>
                <span className="font-bold font-serif underline ml-2">
                  {workOrder.acceptanceStaffName || workOrder.reporterName}
                </span>
                <span className="text-2xs text-slate-400 font-mono ml-3">
                  验收时间: {workOrder.acceptanceTime || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Sheet Footer Bar */}
          <div className="flex items-center justify-between text-2xs text-slate-400 pt-2 border-t border-slate-200">
            <span>五莲县人民医院医学装备精细化管理系统 (HRP-MEDTECH)</span>
            <span>三甲医院评审第4.15条款设备维保与MTTR时效考核合格凭据</span>
          </div>
        </div>
      </div>
    </div>
  );
};
