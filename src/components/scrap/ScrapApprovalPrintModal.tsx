import React from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { EquipmentScrapOrder } from '../../types/scrapTypes';

interface ScrapApprovalPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EquipmentScrapOrder | null;
}

export const ScrapApprovalPrintModal: React.FC<ScrapApprovalPrintModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* 顶部操作条（打印时不显示） */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">固定资产（医疗设备）报废技术鉴定与处置审批表</h2>
              <p className="text-xs text-slate-500">符合公立医院国有资产管理办法及卫生健康主管部门规范</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              打印/导出审批表
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 打印表单正文 */}
        <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible print:p-0 space-y-6 font-sans text-slate-800">
          {/* 红头公文抬头 */}
          <div className="text-center border-b-2 border-red-700 pb-5 space-y-2">
            <div className="text-red-700 font-bold tracking-widest text-xl uppercase">
              五莲县人民医院 · 国有资产管理专用
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              医疗设备报废技术鉴定与资产处置审批表
            </h1>
            <div className="flex items-center justify-center gap-8 text-xs text-slate-500 pt-1 font-mono">
              <span>申请流水单号: {order.applicationNo}</span>
              <span>填报日期: {order.applicationDate}</span>
              <span>归档密级: 国有资产法定审批凭证</span>
            </div>
          </div>

          {/* 设备固定资产基础信息表格 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300">
              一、报废设备基本台账信息
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-300 border-b border-slate-300">
              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">设备名称</div>
              <div className="p-2.5 font-bold text-slate-900 col-span-1">{order.equipmentName}</div>
              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">规格型号</div>
              <div className="p-2.5 font-mono text-slate-800">{order.model}</div>

              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">院内资产编号</div>
              <div className="p-2.5 font-mono font-bold text-blue-800">{order.assetNumber}</div>
              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">使用科室</div>
              <div className="p-2.5 font-bold text-slate-900">{order.department}</div>

              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">购置日期</div>
              <div className="p-2.5 font-mono text-slate-800">{order.purchaseDate}</div>
              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">实际使用年限</div>
              <div className="p-2.5 font-mono text-slate-900 font-bold">
                {order.actualUsageYears} 年 (国家推荐折旧 {order.ratedLifespanYears} 年)
              </div>

              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">设备原值 (元)</div>
              <div className="p-2.5 font-mono text-slate-900 font-bold">
                ¥{order.originalValue.toLocaleString()}
              </div>
              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">账面净值 (元)</div>
              <div className="p-2.5 font-mono text-slate-900 font-bold">
                ¥{order.netBookValue.toLocaleString()}
              </div>

              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">累计维修费用 (元)</div>
              <div className="p-2.5 font-mono text-rose-700 font-bold">
                ¥{order.accumulatedRepairCost.toLocaleString()}
              </div>
              <div className="p-2.5 bg-slate-50 font-medium text-slate-600">维修原值占比 (%)</div>
              <div className="p-2.5 font-mono text-rose-700 font-bold">
                {order.repairToValueRatio}% {order.repairToValueRatio >= 50 && '(超50%经济红线)'}
              </div>
            </div>
          </div>

          {/* 二、申请科室理由 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 flex items-center justify-between">
              <span>二、临床使用科室申请理由及现状</span>
              <span className="font-mono text-slate-500">申请人: {order.applicantName} ({order.applicantPhone})</span>
            </div>
            <div className="p-4 space-y-2 leading-relaxed text-slate-700">
              <p><strong>报废主因分类：</strong> 
                <span className="text-rose-700 font-semibold ml-1">
                  {order.scrapReasonType === 'exceeded_lifespan' && '达到或超过规定使用年限且性能严重老化'}
                  {order.scrapReasonType === 'maintenance_cost_excessive' && '累计维修费用过高超过原值50%，丧失经济修复价值'}
                  {order.scrapReasonType === 'damaged_unrepairable' && '核心部件损坏停产无法修复'}
                  {order.scrapReasonType === 'safety_environmental_hazard' && '存在严重电气/辐射安全隐患经检定不合格'}
                  {order.scrapReasonType === 'technology_obsolete' && '国家明令淘汰或严重落后'}
                </span>
              </p>
              <p className="bg-slate-50 p-2.5 rounded border border-slate-200">
                <strong>现场事实阐明：</strong>{order.scrapReasonDetail}
              </p>
            </div>
          </div>

          {/* 三、医学工程部专业技术鉴定 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300 flex items-center justify-between">
              <span>三、医学工程科专业技术鉴定结论</span>
              <span className="font-mono text-slate-500">鉴定工程师: {order.appraiserEngineer} ({order.appraisalDate || '2026-10-15'})</span>
            </div>
            <div className="p-4 space-y-3 leading-relaxed text-slate-700">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">技术结论评定：</span>
                <span className="px-2.5 py-0.5 rounded font-bold text-white bg-rose-600 font-mono">
                  建议报废 (不可逆损坏/无修复价值)
                </span>
              </div>
              <p className="bg-rose-50/50 p-3 rounded border border-rose-100 text-rose-950">
                {order.technicalAppraisalNotes || '经查验，该设备主要部件严重磨损老化，多次发生故障，原厂已停产核心配件，继续使用存在医疗安全隐患，建议准予报废。'}
              </p>
            </div>
          </div>

          {/* 四、环保、辐射安全与数据安全特别前置审批 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300">
              四、环保合规、辐射安全与患者隐私数据擦除前置销号审查
            </div>
            <div className="p-4 space-y-2.5 text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>射线装置/放射源处置：</strong>
                    <p className="text-slate-600 text-[11px]">
                      {order.hazardClearance.hasRadiationSource 
                        ? `已取得生态环境部门批复: ${order.hazardClearance.radiationTransferPermitNo || '已备案注销'}`
                        : '经核验无放射源及射线发生装置。'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>患者隐私与电子数据擦除：</strong>
                    <p className="text-slate-600 text-[11px]">
                      {order.hazardClearance.dataSecuritySanitized
                        ? `存储介质已由医工工程师 (${order.hazardClearance.sanitizerEngineer || '陈伟'}) 执行物理消磁与覆写清空。`
                        : '不含独立硬盘存储组件。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 五、院内专家评审委员会联审联签 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-300">
              五、医院固定资产处置专家评审委员会联审联签
            </div>
            <div className="divide-y divide-slate-200">
              {order.expertSignatures.map((sig, idx) => (
                <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{sig.roleTitle}：</span>
                      <span className="font-medium text-slate-800">{sig.userName}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        sig.verdict === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sig.verdict === 'approved' ? '同意报废' : '待签署'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] italic">“{sig.comment}”</p>
                  </div>

                  <div className="text-right shrink-0">
                    {sig.signatureDate && (
                      <div className="font-mono text-slate-400 text-[11px]">
                        签署时间: {sig.signatureDate}
                      </div>
                    )}
                    {sig.verdict === 'approved' && (
                      <span className="inline-block font-serif text-blue-900 font-bold border-b border-blue-900 px-2 py-0.5 mt-1 tracking-widest text-sm">
                        {sig.userName} (已电子签章)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 六、财政批复与处置变现归档 */}
          <div className="border border-slate-300 rounded-lg p-4 bg-slate-50 text-xs space-y-2 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong>财政及卫健委批文：</strong>
                <span className="font-mono text-blue-800 font-bold ml-1">
                  {order.fiscalApprovalBatchNo || '已呈报县财政国资科批复中'}
                </span>
              </div>
              <div>
                <strong>处置回收残值入账：</strong>
                <span className="font-mono text-emerald-700 font-bold text-sm ml-1">
                  {order.salvageAmount ? `¥${order.salvageAmount.toLocaleString()}` : '待残值公开竞拍结算'}
                </span>
              </div>
            </div>
            <div className="text-slate-500 text-[11px] font-mono">
              处置承接单位: {order.disposalAgencyName || '五莲县公共资源交易中心医疗设备竞价回收专包'}
            </div>

            {/* 防伪公章模拟印模 */}
            <div className="absolute top-2 right-6 w-28 h-28 rounded-full border-2 border-red-600/80 text-red-600 flex flex-col items-center justify-center p-2 text-center transform -rotate-12 pointer-events-none select-none">
              <span className="text-[10px] font-bold tracking-tight">五莲县人民医院</span>
              <span className="text-[9px] font-black tracking-widest my-0.5">★ 国有资产处置专用章 ★</span>
              <span className="text-[8px] font-mono">已完成技术鉴定</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
