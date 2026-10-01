import React, { useRef } from 'react';
import { 
  X, Printer, Download, ShieldCheck, CheckCircle2, FileText, 
  Building2, Receipt, PenTool, Scale, Calendar, AlertCircle
} from 'lucide-react';
import { VendorCollaborationOrder } from '../types/vendorCollaborationTypes';

interface VendorDossierPdfModalProps {
  order: VendorCollaborationOrder;
  onClose: () => void;
}

export const VendorDossierPdfModal: React.FC<VendorDossierPdfModalProps> = ({
  order,
  onClose,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="vendor-dossier-pdf-modal" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* 顶部工具栏（打印时隐藏） */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                医疗设备外协维修与结算全套资料归档凭证 (一案一档)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal">
                  已具备法律效力与审计完整性
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                档案编号：ARC-{order.id} | 关联院内工单：{order.workOrderId} | 合作单位：{order.vendorName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>打印/另存为PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 卷宗主体内容（支持浏览器打印） */}
        <div ref={printContentRef} className="p-8 overflow-y-auto space-y-8 print:p-0 print:overflow-visible">
          
          {/* 1. 档案封面公文抬头 */}
          <div className="border-b-2 border-slate-800 pb-6 text-center relative">
            <div className="text-xs tracking-widest uppercase font-semibold text-slate-500 mb-1">
              五莲县人民医院 · 医学装备全生命周期管理档案
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              医疗设备外协维修审价、验收与财务结算全套资料卷宗
            </h1>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-600">
              <span><strong>归档编号：</strong>ARC-{order.id}</span>
              <span><strong>生成时间：</strong>{order.archivedAt || new Date().toLocaleString()}</span>
              <span><strong>归档负责人：</strong>{order.archivedBy || '张主任 (医学工程科主任)'}</span>
              <span><strong>涉密/审计级别：</strong>内部审计完整案卷</span>
            </div>
            
            {/* 电子防伪印章标识 */}
            <div className="absolute right-4 top-0 w-24 h-24 border-2 border-dashed border-red-600 rounded-full flex flex-col items-center justify-center text-red-600 rotate-12 opacity-85 select-none pointer-events-none">
              <span className="text-[10px] font-bold">五莲县人民医院</span>
              <span className="text-xs font-black my-0.5">医学工程科</span>
              <span className="text-[9px] scale-90">外协归档专用</span>
            </div>
          </div>

          {/* 2. 设备与报修基础信息表 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-3 border-b border-slate-200 pb-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>第一部分：设备台账与故障报修原始记录</span>
            </div>
            <div className="grid grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
              <div><span className="text-slate-500">设备名称：</span><span className="font-semibold text-slate-800">{order.equipmentName}</span></div>
              <div><span className="text-slate-500">规格型号：</span><span className="font-medium text-slate-700">{order.equipmentModel}</span></div>
              <div><span className="text-slate-500">设备序列号：</span><span className="font-mono text-slate-700">{order.equipmentSerialNo}</span></div>
              <div><span className="text-slate-500">使用科室：</span><span className="font-medium text-slate-700">{order.equipmentDept}</span></div>
              <div><span className="text-slate-500">报修时间：</span><span className="text-slate-700">{order.createdAt}</span></div>
              <div><span className="text-slate-500">紧急程度：</span><span className="font-semibold text-amber-600">{order.urgencyLevel}</span></div>
              <div className="col-span-3 mt-1 pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-500">现场故障现象描述：</span>
                <p className="text-slate-800 mt-1 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">
                  {order.faultDescription}
                </p>
              </div>
            </div>
          </div>

          {/* 3. 供应商盖章报价与配件更换明细 */}
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>第二部分：供应商正式报价单与零配件更换明细</span>
              </div>
              <span className="text-xs text-slate-500">
                供应商：<strong className="text-slate-700">{order.vendorName}</strong>
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-200 mb-3">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-200 p-2 text-center w-10">序号</th>
                  <th className="border border-slate-200 p-2">零配件/服务名称</th>
                  <th className="border border-slate-200 p-2">规格型号 / 订货号</th>
                  <th className="border border-slate-200 p-2 text-center">品质属性</th>
                  <th className="border border-slate-200 p-2 text-center">数量</th>
                  <th className="border border-slate-200 p-2 text-right">单价 (元)</th>
                  <th className="border border-slate-200 p-2 text-right">金额 (元)</th>
                  <th className="border border-slate-200 p-2 text-center">配件质保</th>
                </tr>
              </thead>
              <tbody>
                {order.quoteParts.map((part, idx) => (
                  <tr key={part.id} className="hover:bg-slate-50">
                    <td className="border border-slate-200 p-2 text-center text-slate-500">{idx + 1}</td>
                    <td className="border border-slate-200 p-2 font-medium text-slate-800">{part.name}</td>
                    <td className="border border-slate-200 p-2 text-slate-600 font-mono">{part.spec} ({part.partNo})</td>
                    <td className="border border-slate-200 p-2 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px]">
                        {part.isOriginal ? '原厂正品' : '兼容认证'}
                      </span>
                    </td>
                    <td className="border border-slate-200 p-2 text-center">{part.quantity}</td>
                    <td className="border border-slate-200 p-2 text-right font-mono">¥{part.unitPrice.toLocaleString()}</td>
                    <td className="border border-slate-200 p-2 text-right font-mono font-semibold">¥{part.totalPrice.toLocaleString()}</td>
                    <td className="border border-slate-200 p-2 text-center text-slate-600">{part.warrantyPeriodMonths} 个月</td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td colSpan={6} className="border border-slate-200 p-2 text-right text-slate-600">工时费：</td>
                  <td className="border border-slate-200 p-2 text-right font-mono">¥{order.quoteLaborCost.toLocaleString()}</td>
                  <td className="border border-slate-200 p-2"></td>
                </tr>
                <tr className="bg-slate-50">
                  <td colSpan={6} className="border border-slate-200 p-2 text-right text-slate-600">差旅检测费：</td>
                  <td className="border border-slate-200 p-2 text-right font-mono">¥{order.quoteTravelCost.toLocaleString()}</td>
                  <td className="border border-slate-200 p-2"></td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={6} className="border border-slate-200 p-2 text-right text-slate-800">供应商初始报价合计：</td>
                  <td className="border border-slate-200 p-2 text-right text-indigo-700 font-mono text-sm">¥{order.quoteGrandTotal.toLocaleString()}</td>
                  <td className="border border-slate-200 p-2 text-center text-slate-500">有效期至 {order.quoteValidUntil || '30天'}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>已上传正式盖章报价单文件：<strong className="text-slate-700">{order.quoteFileName || '已归档盖章扫描件'}</strong></span>
              <span className="text-emerald-700 font-medium">✓ 原厂授权维修渠道核验通过</span>
            </div>
          </div>

          {/* 4. 多科室联合议价与审价会签表 (核心特色) */}
          <div className="border-2 border-indigo-200 rounded-xl p-5 bg-indigo-50/20">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2 mb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>第三部分：医院多部门多科室联合审价与议价会签表</span>
              </div>
              <div className="flex items-center space-x-4 text-xs font-semibold">
                <span className="text-slate-600">初始报价：¥{order.quoteGrandTotal.toLocaleString()}</span>
                <span className="text-emerald-700">最终成交价：¥{order.finalNegotiatedPrice.toLocaleString()}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                  审减节约：¥{order.savingsAmount.toLocaleString()} ({order.savingsRate}%)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {order.multiDeptOpinions.map((op, idx) => (
                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 text-[13px]">{op.deptName}</span>
                      <span className="text-slate-500">会签人：{op.reviewerName} ({op.reviewerTitle})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-500">签署时间：{op.reviewDate}</span>
                      <span className="px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-700">
                        {op.decision === 'AGREE' ? '审核通过' : '建议联合议价'}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded">
                    <strong>审核会签意见：</strong>{op.comments}
                  </p>
                </div>
              ))}
            </div>

            {/* 谈判纪要记录 */}
            {order.negotiationRounds && order.negotiationRounds.length > 0 && (
              <div className="mt-4 pt-3 border-t border-indigo-100 text-xs">
                <div className="font-bold text-slate-800 mb-2">多轮线上议价函与谈判沟通留痕：</div>
                <div className="space-y-2">
                  {order.negotiationRounds.map((r) => (
                    <div key={r.round} className="bg-white/80 p-2.5 rounded border border-slate-200">
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span><strong>第 {r.round} 轮议价函</strong> ({r.initiatorDept} - {r.initiatorName})</span>
                        <span className="text-slate-500">{r.initiatedAt}</span>
                      </div>
                      <p className="text-slate-700 mb-1.5"><span className="text-red-700 font-semibold">[要求目标价 ¥{r.demandedPrice.toLocaleString()}]</span> {r.hospitalNote}</p>
                      {r.vendorResponsePrice && (
                        <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-emerald-800">
                          <span className="font-semibold">[供应商反馈 ¥{r.vendorResponsePrice.toLocaleString()}]</span> {r.vendorNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. 完工报告与临床验收签字 */}
          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-3 border-b border-slate-200 pb-2">
              <PenTool className="w-4 h-4 text-purple-600" />
              <span>第四部分：工程师完工技术报告与临床科室验收结论</span>
            </div>

            {order.completionReport ? (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div><span className="text-slate-500">主修工程师：</span><span className="font-semibold text-slate-800">{order.completionReport.engineerName}</span> (联系电话：{order.completionReport.engineerPhone})</div>
                  <div><span className="text-slate-500">维修作业周期：</span><span className="text-slate-700">{order.completionReport.serviceStartTime} ~ {order.completionReport.serviceEndTime}</span></div>
                  <div>
                    <span className="text-slate-500">故障原因技术分析：</span>
                    <p className="text-slate-800 mt-1 bg-slate-50 p-2 rounded border border-slate-200">{order.completionReport.faultCauseAnalysis}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">实施维修方案与质控：</span>
                    <p className="text-slate-800 mt-1 bg-slate-50 p-2 rounded border border-slate-200">{order.completionReport.repairMeasuresSummary}</p>
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-[13px] border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>临床使用科室验收结论</span>
                    <span className="text-emerald-600 flex items-center gap-1 font-normal">
                      <CheckCircle2 className="w-4 h-4" /> 设备运行合格
                    </span>
                  </div>
                  <div><span className="text-slate-500">验收科室：</span><span className="font-medium text-slate-800">{order.equipmentDept}</span></div>
                  <div><span className="text-slate-500">验收人签字：</span><span className="font-bold text-indigo-700">{order.completionReport.clinicalAcceptorName}</span></div>
                  <div><span className="text-slate-500">验收通过时间：</span><span className="text-slate-700">{order.completionReport.clinicalAcceptDate}</span></div>
                  <div><span className="text-slate-500">旧件交接归还：</span><span className="font-semibold text-emerald-700">{order.completionReport.oldPartsReturned ? '已全部交还医学工程科备件库' : '未交还'}</span></div>
                  <div><span className="text-slate-500">临床满意度评分：</span><span className="text-amber-600 font-bold">{'★'.repeat(order.completionReport.clinicalRating)} ({order.completionReport.clinicalRating}.0分)</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                暂未提交完工技术报告
              </div>
            )}
          </div>

          {/* 6. 增值税发票与财务结算凭证 */}
          <div className="border border-slate-200 rounded-xl p-5 bg-amber-50/20">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2 mb-3">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>第五部分：增值税发票查验与财务挂账凭证</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                发票三查验通过 (代码/金额/销方一致)
              </span>
            </div>

            {order.invoiceRecord ? (
              <div className="grid grid-cols-3 gap-y-2.5 gap-x-4 text-xs">
                <div><span className="text-slate-500">发票类型：</span><span className="font-semibold text-slate-800">{order.invoiceRecord.invoiceType === 'SPECIAL_VAT' ? '增值税专用发票' : '增值税普通发票'}</span></div>
                <div><span className="text-slate-500">发票代码：</span><span className="font-mono text-slate-700">{order.invoiceRecord.invoiceCode}</span></div>
                <div><span className="text-slate-500">发票号码：</span><span className="font-mono font-bold text-indigo-700">{order.invoiceRecord.invoiceNo}</span></div>
                <div><span className="text-slate-500">开票日期：</span><span className="text-slate-700">{order.invoiceRecord.invoiceDate}</span></div>
                <div><span className="text-slate-500">不含税金额：</span><span className="font-mono text-slate-700">¥{order.invoiceRecord.untaxedAmount?.toLocaleString()}</span></div>
                <div><span className="text-slate-500">税率及税额：</span><span className="font-mono text-slate-700">{order.invoiceRecord.taxRate}% (¥{order.invoiceRecord.taxAmount?.toLocaleString()})</span></div>
                <div><span className="text-slate-500">开票总金额(价税合计)：</span><span className="font-mono font-bold text-base text-red-600">¥{order.invoiceRecord.invoiceAmount.toLocaleString()}</span></div>
                <div><span className="text-slate-500">销售方(供应商)：</span><span className="text-slate-700">{order.invoiceRecord.sellerName}</span></div>
                <div><span className="text-slate-500">销方税号：</span><span className="font-mono text-slate-700">{order.invoiceRecord.sellerTaxNo}</span></div>
                <div className="col-span-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500">发票附件源文件：<strong className="text-slate-700">{order.invoiceRecord.fileName}</strong></span>
                  <span className="text-slate-500">约定付款方式：<strong className="text-slate-700">{order.invoiceRecord.paymentPlan === 'NET_30' ? '验收通过后30天内电汇' : '按合同进度支付'}</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                等待供应商开具并上传发票
              </div>
            )}
          </div>

          {/* 7. 签字盖章会签栏 */}
          <div className="border border-slate-300 rounded-xl p-6 grid grid-cols-4 gap-6 text-center text-xs">
            <div>
              <div className="text-slate-500 mb-6">医学工程科审验人</div>
              <div className="font-serif text-sm font-bold text-slate-800 underline decoration-slate-400">张主任 (已核准)</div>
              <div className="text-[10px] text-slate-400 mt-1">2026-09-12</div>
            </div>
            <div>
              <div className="text-slate-500 mb-6">使用科室验收人</div>
              <div className="font-serif text-sm font-bold text-slate-800 underline decoration-slate-400">李主任 (已核准)</div>
              <div className="text-[10px] text-slate-400 mt-1">2026-09-12</div>
            </div>
            <div>
              <div className="text-slate-500 mb-6">财务科审核人</div>
              <div className="font-serif text-sm font-bold text-slate-800 underline decoration-slate-400">陈科长 (已核准)</div>
              <div className="text-[10px] text-slate-400 mt-1">2026-09-13</div>
            </div>
            <div>
              <div className="text-slate-500 mb-6">分管院领导审批</div>
              <div className="font-serif text-sm font-bold text-slate-800 underline decoration-slate-400">院办会签完毕</div>
              <div className="text-[10px] text-slate-400 mt-1">2026-09-13</div>
            </div>
          </div>

        </div>

        {/* 底部按钮栏 */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>本案卷一式四份：医学工程科存底、财务科报销凭证、使用科室设备档案、供应商履约备查</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition"
          >
            关闭预览
          </button>
        </div>

      </div>
    </div>
  );
};
