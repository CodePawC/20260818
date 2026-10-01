import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Upload, 
  FileText, 
  Building2, 
  CreditCard, 
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ReturnFactoryRepairOrder, InvoiceAndPaymentTrack, WorkflowRole } from '../../types/factoryRepairTypes';

interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReturnFactoryRepairOrder;
  currentRole: WorkflowRole;
  onUploadInvoice: (invoiceData: any) => void;
  onAdvancePaymentNode: (nodeId: string) => void;
}

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  currentRole,
  onUploadInvoice,
  onAdvancePaymentNode
}) => {
  const isSettled = order.acceptanceTrial.trialStatus === 'settled_qualified';
  const invoiceData = order.invoicePayment.invoiceRecord;
  const paymentNodes = order.invoicePayment.paymentNodes;

  const [invoiceCode, setInvoiceCode] = useState(invoiceData?.invoiceCode || '037002300111');
  const [invoiceNumber, setInvoiceNumber] = useState(invoiceData?.invoiceNumber || '2637481920');
  const [amount, setAmount] = useState(invoiceData?.amount || 14200);
  const [taxRate, setTaxRate] = useState(invoiceData?.taxRate || 13);
  const [invoiceType, setInvoiceType] = useState(invoiceData?.invoiceType || '增值税专用发票');

  if (!isOpen) return null;

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUploadInvoice({
      invoiceCode,
      invoiceNumber,
      amount: Number(amount),
      taxRate: Number(taxRate),
      invoiceType,
      issuedDate: new Date().toISOString().split('T')[0],
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      verificationStatus: 'verified_authentic'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部标题栏 */}
        <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-emerald-800 tracking-wider">
                结项结算协同中心 · 财税与对公电汇打款流水
              </div>
              <h2 className="text-base font-bold text-slate-900">
                厂家发票上传与全流程实时付款进度看板
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
          {/* 未结项内控提示 */}
          {!isSettled ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-xs">
                  内控安全锁已启用：未结项前禁止上传发票与申请付款
                </h4>
                <p className="text-amber-700 text-[11px] mt-1 leading-relaxed">
                  根据公立医院内控管理及合同约定：输尿管镜必须完成现场开箱外观与气密性双签验收，且在麻醉手术科临床实际手术跟台试用满 1 周无任何异常后，由科室与设备科正式确认结项，系统方会自动解锁发票上传入口。
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-950">
                  临床1周试用合格，已于 {order.acceptanceTrial.settledAt} 完成正式结项！已开启发票挂账通道。
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                合同总额: ¥14,200.00
              </span>
            </div>
          )}

          {/* 厂家发票信息区 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <h4 className="font-bold text-slate-900 text-xs">增值税专用发票信息</h4>
              </div>
              {invoiceData && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  ✓ 税局真伪查验一致
                </span>
              )}
            </div>

            {invoiceData ? (
              <div className="grid grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">发票类型</span>
                  <span className="font-bold text-slate-800">{invoiceData.invoiceType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">发票代码 / 号码</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {invoiceData.invoiceCode} / {invoiceData.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">价税合计金额</span>
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    ¥{invoiceData.amount.toLocaleString()}.00
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">上传与验真时间</span>
                  <span className="font-mono text-slate-600 text-[11px]">{invoiceData.uploadedAt}</span>
                </div>
              </div>
            ) : isSettled ? (
              <form onSubmit={handleUploadSubmit} className="space-y-3 bg-white p-4 rounded-lg border border-slate-200">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">发票代码</label>
                    <input
                      type="text"
                      value={invoiceCode}
                      onChange={(e) => setInvoiceCode(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">发票号码</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">开票金额 (元)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-rose-700"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>上传并提交全国税局查验平台</span>
                  </button>
                </div>
              </form>
            ) : null}
          </div>

          {/* 全流程实时付款进度流转链 */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                全景付款审批与银行出纳实时进度流水
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                各方实时同步更新透明可查
              </span>
            </div>

            <div className="divide-y divide-slate-100 p-4 space-y-4">
              {paymentNodes.map((node, index) => {
                const isCompleted = node.status === 'completed';
                const isCurrent = node.status === 'in_progress';

                return (
                  <div key={node.id} className="flex items-start gap-4 text-xs">
                    {/* 节点图标 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      {index < paymentNodes.length - 1 && (
                        <div className={`w-0.5 h-10 ${isCompleted ? 'bg-emerald-300' : 'bg-slate-200'} mt-1`} />
                      )}
                    </div>

                    {/* 节点详情 */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                          {node.nodeName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {node.completedAt || '待流转'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCurrent
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {isCompleted ? '已完成' : isCurrent ? '处理中' : '等待'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>责任部门: {node.department}</span>
                        <span>经手人: {node.responsiblePerson}</span>
                      </div>

                      {node.remarks && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                          {node.remarks}
                          {node.transactionVoucherNo && (
                            <span className="block text-indigo-700 font-mono font-bold mt-0.5">
                              业务流水号: {node.transactionVoucherNo}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>厂家李海明与麻醉手术科均可在工作台实时查阅上述打款流水与回执</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
