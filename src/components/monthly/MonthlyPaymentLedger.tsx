import React from 'react';
import { Landmark, Plus, CheckCircle2 } from 'lucide-react';
import { MonthlyFrameworkBatch } from '../../types/vendorCollaborationTypes';

interface MonthlyPaymentLedgerProps {
  batches: MonthlyFrameworkBatch[];
  onOpenPaymentModal: (batch: MonthlyFrameworkBatch) => void;
}

export const MonthlyPaymentLedger: React.FC<MonthlyPaymentLedgerProps> = ({
  batches,
  onOpenPaymentModal,
}) => {
  return (
    <div 
      id="monthly-payment-ledger"
      className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs shrink-0 text-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-700" />
            全院零星维保四阶段回款全景流水台
          </h3>
          <p className="text-[11px] text-blue-900 mt-0.5">
            实时追踪从临床报修、医工会审、发票勾稽到医院财务国库对公电汇的全生命周期轨迹
          </p>
        </div>

        <button
          type="button"
          id="btn-ledger-record-payment"
          onClick={() => {
            const transitBatch = batches.find(b => b.paymentStatus === 'IN_TRANSIT') || batches[0];
            onOpenPaymentModal(transitBatch);
          }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>登记银行到账流水 / 标记已回款</span>
        </button>
      </div>

      <div className="border border-blue-200 rounded-lg overflow-x-auto bg-white shadow-2xs">
        <table className="w-full min-w-[760px] table-fixed text-left text-xs text-slate-700">
          <colgroup>
            <col style={{ width: '16%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="p-2.5">月度结算批次</th>
              <th className="p-2.5 text-right">结算金额</th>
              <th className="p-2.5">增值税发票状态</th>
              <th className="p-2.5">回款到账状态</th>
              <th className="p-2.5">打款银行与电汇凭证</th>
              <th className="p-2.5">到账/排期日期</th>
              <th className="p-2.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {batches.map(b => (
              <tr key={b.id} className="hover:bg-slate-50/80 transition">
                <td className="p-2.5 font-semibold text-slate-900 font-sans">
                  {b.yearMonth} 批次 ({b.itemCount}项)
                </td>
                <td className="p-2.5 font-bold text-slate-900 text-right">
                  ¥{b.totalAmount.toFixed(2)}
                </td>
                <td className="p-2.5 font-sans">
                  {b.invoiceRecord ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      专票 No.{b.invoiceRecord.invoiceNo}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">待开票</span>
                  )}
                </td>
                <td className="p-2.5 font-sans">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    b.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    b.paymentStatus === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {b.paymentStatus === 'PAID' ? '✓ 已电汇到账' :
                     b.paymentStatus === 'IN_TRANSIT' ? '审批在途中' : '待开票请款'}
                  </span>
                </td>
                <td className="p-2.5 text-slate-600 font-sans text-[11px]">
                  {b.paymentVoucherNo ? (
                    <div>
                      <div className="font-mono font-semibold text-slate-800">{b.paymentVoucherNo}</div>
                      <div className="text-[10px] text-slate-400">{b.paymentBank || '中国银行国库集中支付'}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400">待财务排期生成电汇单</span>
                  )}
                </td>
                <td className="p-2.5 text-slate-600 font-sans text-[11px]">
                  {b.paidAt ? `已到账: ${b.paidAt}` : (b.expectedPaymentDate ? `预计: ${b.expectedPaymentDate}` : '-')}
                </td>
                <td className="p-2.5 text-center font-sans">
                  {b.paymentStatus !== 'PAID' ? (
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal(b)}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition cursor-pointer"
                    >
                      标记到账
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-medium text-[11px]">已清结</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
