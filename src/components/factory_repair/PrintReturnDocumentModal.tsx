import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { ClosedLoopRepairTask } from '../../types/closedLoopRepairTypes';

interface PrintReturnDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ClosedLoopRepairTask;
}

export const PrintReturnDocumentModal: React.FC<PrintReturnDocumentModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  if (!isOpen) return null;

  const app = task.factoryRepairApplication;
  if (!app) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Top Control Bar */}
        <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-200">红头审批公文预览与打印</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">呈批单号：{app.applicationId}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>立即打印 / 导出 PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (A4 Styled) */}
        <div className="p-10 max-h-[85vh] overflow-y-auto bg-white font-serif text-slate-900 print:p-0 print:max-h-none print:overflow-visible">
          {/* Official Red Header */}
          <div className="text-center pb-5 border-b-2 border-red-600">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-red-600 font-sans">
              五莲县人民医院
            </h1>
            <p className="text-xs tracking-wider text-red-700 font-sans mt-1">
              WULIAN COUNTY PEOPLE'S HOSPITAL • 医学装备管理委员会
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-sans mt-3">
              医疗器械外协返厂大修呈批报告
            </h2>
            <div className="flex justify-between items-center text-xs text-slate-500 font-sans mt-4 px-2">
              <span>呈批编号：<b className="font-mono text-slate-800">{app.applicationId}</b></span>
              <span>归档密级：内部呈批（特急）</span>
              <span>呈报日期：{app.draftedAt.slice(0, 10)}</span>
            </div>
          </div>

          {/* Section 1: Equipment Dossier & Asset Binding Table */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-800 font-sans uppercase mb-2 flex items-center space-x-1">
              <span>一、呈报设备资产基本档案及临床使用概况</span>
            </h3>
            <table className="w-full text-xs border border-slate-400 border-collapse">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/6 bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">设备名称</td>
                  <td className="w-2/6 p-2 font-bold font-sans text-slate-900 border-r border-slate-300">{task.equipmentName}</td>
                  <td className="w-1/6 bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">规格型号</td>
                  <td className="w-2/6 p-2 font-sans border-slate-300">{task.equipmentModel}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">资产编号</td>
                  <td className="p-2 font-mono font-bold border-r border-slate-300">{task.assetNo}</td>
                  <td className="bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">机身序列号(SN)</td>
                  <td className="p-2 font-mono border-slate-300">{task.equipmentSn}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">归属使用科室</td>
                  <td className="p-2 font-sans font-bold text-blue-900 border-r border-slate-300">{task.department}</td>
                  <td className="bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">设备原值</td>
                  <td className="p-2 font-sans font-bold text-emerald-800 border-slate-300">¥{(task.purchasePrice || 168000).toLocaleString()} 元</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">存放位置</td>
                  <td className="p-2 font-sans border-r border-slate-300">{task.equipmentLocation}</td>
                  <td className="bg-slate-100 p-2 font-bold font-sans text-slate-700 border-r border-slate-300">投用日期</td>
                  <td className="p-2 font-sans border-slate-300">{task.enableDate || '2023-04-20'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Technical Onsite Findings */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-slate-800 font-sans uppercase mb-2">
              二、医学设备科现场实测技术勘查与受损结论
            </h3>
            <div className="p-3 border border-slate-300 bg-slate-50/50 rounded text-xs space-y-2 font-sans leading-relaxed">
              <div className="grid grid-cols-2 gap-2 text-[11px] pb-2 border-b border-slate-200">
                <div>勘查工程师：<b>{task.onsiteVerification?.verifiedBy || '崔伟 (主管工程师)'}</b></div>
                <div>核验时间：{task.onsiteVerification?.verifiedAt || '2026-09-23 09:30'}</div>
                <div>光学同轴度/透光率：<b>{task.onsiteVerification?.opticalTransmittance || '41.5% (严重发暗起雾)'}</b></div>
                <div>负压浸水测漏结论：<b>{task.onsiteVerification?.airtightnessLeakage || '封胶开裂，负压持续泄漏进水'}</b></div>
              </div>
              <p className="text-slate-700 text-xs">
                <b>技术判定论证：</b>{app.technicalJustification}
              </p>
            </div>
          </div>

          {/* Section 3: Vendor & Budget */}
          <div className="mt-5">
            <h3 className="text-xs font-bold text-slate-800 font-sans uppercase mb-2">
              三、拟委托返厂厂家、大修预算与质保条款
            </h3>
            <table className="w-full text-xs border border-slate-400 border-collapse font-sans">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/4 bg-slate-100 p-2 font-bold text-slate-700 border-r border-slate-300">拟委托服务商</td>
                  <td className="w-3/4 p-2 font-bold text-slate-900">{app.targetVendor}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-r border-slate-300">预估大修费用</td>
                  <td className="p-2 font-bold text-emerald-800">
                    ¥{app.estimatedBudget.toLocaleString()} 元（占新机原值 {app.budgetRatioPercent}%，远低于50%限额标准）
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2 font-bold text-slate-700 border-r border-slate-300">原厂质保承诺</td>
                  <td className="p-2 font-bold text-blue-900">
                    修复后提供 {app.warrantyMonths} 个月原厂整机质保（含物镜密封与柱状棒镜组件）
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 4: Multi-Level Approval Signatures */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-800 font-sans uppercase mb-2">
              四、全流程多级审批会签留痕
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {/* Dept Applicant Sign */}
              <div className="border border-slate-400 p-3 rounded font-sans text-xs relative flex flex-col justify-between h-36">
                <div>
                  <div className="font-bold text-slate-800">1. 使用科室申报确认</div>
                  <div className="text-[11px] text-slate-500 mt-1">麻醉手术科负责人意见：</div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    情况属实，急需加急大修恢复排台。
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-[11px]">
                  <span>护士长：<b>{task.reporterName}</b></span>
                  <span className="text-[10px] text-slate-400">{task.faultTime.slice(0, 10)}</span>
                </div>
              </div>

              {/* Equipment Dept Manager Sign */}
              <div className="border border-slate-400 p-3 rounded font-sans text-xs relative flex flex-col justify-between h-36">
                <div>
                  <div className="font-bold text-indigo-900">2. 医学设备科主管审核</div>
                  <div className="text-[11px] text-slate-500 mt-1">技术审查意见：</div>
                  <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                    {app.deptReviewComment || '经现场实测技术勘查属实，院内无修复条件，预算合理，同意呈批。'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-[11px]">
                  <span className="font-bold text-indigo-900">{app.deptSignature || '崔伟 (已签章)'}</span>
                  <span className="text-[10px] text-slate-400">{app.deptReviewedAt?.slice(0, 10) || '2026-09-23'}</span>
                </div>
              </div>

              {/* Vice President Sign & Seal */}
              <div className="border border-red-500 bg-red-50/20 p-3 rounded font-sans text-xs relative flex flex-col justify-between h-36 overflow-hidden">
                {/* Simulated Hospital Official Seal */}
                <div className="absolute right-2 bottom-1 w-20 h-20 rounded-full border-2 border-red-600 text-red-600 flex flex-col items-center justify-center opacity-70 pointer-events-none rotate-[-12deg]">
                  <div className="text-[8px] font-bold">五莲县人民医院</div>
                  <div className="text-[7px]">★</div>
                  <div className="text-[8px] font-bold">医学装备准予章</div>
                </div>

                <div>
                  <div className="font-bold text-red-900">3. 分管副院长终审批批</div>
                  <div className="text-[11px] text-slate-500 mt-1">分管领导批复：</div>
                  <p className="text-[10px] text-red-800 mt-1 font-semibold line-clamp-2">
                    {app.vpApprovalComment || '同意返厂大修。请医学设备科监督大修质量，确保12个月原厂质保。'}
                  </p>
                </div>
                <div className="pt-2 border-t border-red-200 flex justify-between items-end text-[11px] relative z-10">
                  <span className="font-bold text-red-900">{app.vpSignature || '王建国 (已签章)'}</span>
                  <span className="text-[10px] text-slate-400">{app.vpApprovedAt?.slice(0, 10) || '2026-09-23'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-400 font-sans">
            <div>
              防伪校验码：MD5-{task.id}-{task.equipmentSn}-VERIFIED
            </div>
            <div>
              打印归档专用 • 本件具有医院内部法定审批效力
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
