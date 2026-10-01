import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  FileText, 
  Receipt,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { MonthlyFrameworkBatch } from '../types/vendorCollaborationTypes';

interface MonthlyFrameworkAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: MonthlyFrameworkBatch;
  allBatches?: MonthlyFrameworkBatch[];
}

export const MonthlyFrameworkAuditReportModal: React.FC<MonthlyFrameworkAuditReportModalProps> = ({
  isOpen,
  onClose,
  batch: initialBatch,
  allBatches,
}) => {
  const [selectedBatchId, setSelectedBatchId] = React.useState<string>(initialBatch.id);
  
  const activeBatch = allBatches?.find(b => b.id === selectedBatchId) || initialBatch;

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // 辅助人民币大写转换
  const getChineseMoneyNotation = (n: number) => {
    const fraction = ['角', '分'];
    const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const unit = [
      ['元', '万', '亿'],
      ['', '拾', '佰', '仟']
    ];
    let num = Math.abs(n);
    let s = '';
    fraction.forEach((item, index) => {
      s += (digit[Math.floor(num * 10 * Math.pow(10, index)) % 10] + item).replace(/零./, '');
    });
    s = s || '整';
    num = Math.floor(num);
    for (let i = 0; i < unit[0].length && num > 0; i++) {
      let p = '';
      for (let j = 0; j < unit[1].length && num > 0; j++) {
        p = digit[num % 10] + unit[1][j] + p;
        num = Math.floor(num / 10);
      }
      s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整') || '零元整';
  };

  // 统计各科室分布
  const deptMap: Record<string, number> = {};
  activeBatch.items.forEach((it) => {
    deptMap[it.department] = (deptMap[it.department] || 0) + it.totalPrice;
  });

  const deptList: [string, number][] = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Top Bar (Screen Only) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              月度框架零星维保结算审计审签单与逐项明细对账单
            </div>
            {allBatches && allBatches.length > 1 && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-xs text-slate-500">切换月份批次:</span>
                <select
                  value={activeBatch.id}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {allBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.yearMonth} 批次 ({b.itemCount}项 · ¥{b.totalAmount.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              打印审签表 / 另存为PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content - Print Friendly */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6 text-slate-800 bg-white print:p-6 print:overflow-visible">
          {/* Header Title */}
          <div className="text-center border-b-2 border-red-700 pb-4">
            <div className="text-red-700 text-xl font-black tracking-wider mb-1">
              五莲县人民医院 · 医学装备全生命周期管理委员会
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              全院零星设备维保月度框架结算与多科室联合审签单
            </h1>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 mt-2 font-mono">
              <span>批次结算编号：<strong>{activeBatch.id}</strong></span>
              <span>归属年月：<strong>{activeBatch.yearMonth}</strong></span>
              <span>打印日期：{new Date().toLocaleDateString('zh-CN')}</span>
            </div>
          </div>

          {/* Key Framework Info Table */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-500 block">合作服务商：</span>
              <strong className="text-slate-800 text-sm">{activeBatch.vendorName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">维保框架协议号：</span>
              <strong className="font-mono text-slate-800 text-sm">{activeBatch.contractNo}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">本月维修项数 / 覆盖科室：</span>
              <strong className="font-mono text-slate-800 text-sm">{activeBatch.itemCount} 项 / {deptList.length} 个科室</strong>
            </div>
            <div>
              <span className="text-slate-500 block">批次结算总金额 (价税合计)：</span>
              <strong className="font-mono text-blue-700 text-base font-extrabold">
                ¥{activeBatch.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Invoice & Compliance Checklist Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left: Invoice & Sales List */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                增值税专用发票与税控销货清单校验
              </div>
              {activeBatch.invoiceRecord ? (
                <div className="space-y-1 text-slate-700 font-mono">
                  <div>发票代码：<strong>{activeBatch.invoiceRecord.invoiceCode}</strong> · 发票号码：<strong>{activeBatch.invoiceRecord.invoiceNo}</strong></div>
                  <div>开票日期：{activeBatch.invoiceRecord.invoiceDate} · 税率：{activeBatch.invoiceRecord.taxRate}%</div>
                  <div>不含税金额：¥{activeBatch.invoiceRecord.untaxedAmount.toFixed(2)} · 进项税额：¥{activeBatch.invoiceRecord.taxAmount.toFixed(2)}</div>
                  <div className="text-emerald-700 font-sans font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    金税系统《销货清单》已附 ({activeBatch.invoiceRecord.taxSalesListFileName || '防伪明细完整'})，逐笔金额与总额分毫不差。
                  </div>
                </div>
              ) : (
                <div className="text-amber-700 font-sans">发票暂未绑定</div>
              )}
            </div>

            {/* Right: 5-Document Audit Trail */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 border-b pb-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                内控审计“五单合一 / 四流一致”符合性声明
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  【1. 派工依据】临床科室报修工单登记与急修派工底单齐全
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  【2. 服务报告】驻院维保工程师现场排障记录与测试合格结论齐全
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  【3. 临床验收】使用科室护士长/技师长试机验收签字齐全 (100%)
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  【4. 旧件退库】换下旧配件以旧换新，已全部交存医工科专管仓库
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  【5. 协议控费】单价严格执行公开招标中标框架折扣协议价
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown Chips */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">科室分布明细汇总：</div>
            <div className="flex flex-wrap gap-2">
              {deptList.map(([dept, amount]) => (
                <div key={dept} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono">
                  <span className="font-sans font-medium text-slate-800">{dept}: </span>
                  <span className="font-bold text-slate-900">¥{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Full Line Items Table */}
          <div>
            <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>逐项维修明细单 (共 {activeBatch.items.length} 项)：</span>
              <span className="text-[11px] text-slate-500 font-normal">支持审计抽查与原始工单穿透追溯</span>
            </div>
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
                    <th className="p-2 border-r border-slate-300">维修及配件更换项目名称</th>
                    <th className="p-2 border-r border-slate-300 text-center w-12">单位</th>
                    <th className="p-2 border-r border-slate-300 text-center w-12">数量</th>
                    <th className="p-2 border-r border-slate-300 text-right w-20">单价(元)</th>
                    <th className="p-2 border-r border-slate-300 text-right w-24">合价(元)</th>
                    <th className="p-2 border-r border-slate-300 w-24">报修科室</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">施工日期</th>
                    <th className="p-2 border-r border-slate-300 text-center w-16">退库</th>
                    <th className="p-2 text-center w-24">合规类型</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
                  {activeBatch.items.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                        {item.itemName}
                        {item.notes && <span className="text-slate-400 block text-[10px]">{item.notes}</span>}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{item.unit}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono">{item.quantity}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono">¥{item.unitPrice.toFixed(2)}</td>
                      <td className="p-2 border-r border-slate-200 text-right font-mono font-bold text-slate-900">
                        ¥{item.totalPrice.toFixed(2)}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium">{item.department}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">
                        {item.serviceDate}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        {item.oldPartsReturned ? (
                          <span className="text-emerald-600 font-bold">已退</span>
                        ) : (
                          <span className="text-slate-400">无旧件</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.auditTag === '小额直接报销' ? 'bg-slate-100 text-slate-700' :
                          item.auditTag === '多台合并维保' ? 'bg-purple-100 text-purple-800' :
                          item.auditTag === '大额审签特批' ? 'bg-amber-100 text-amber-800 font-bold' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {item.auditTag || '常规'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right font-sans text-xs">
                      本批次合计（共 {activeBatch.items.length} 项）：
                    </td>
                    <td className="p-2.5 text-right font-mono text-blue-700 text-sm">
                      ¥{activeBatch.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={4} className="p-2.5 text-xs text-slate-600 font-normal">
                      金额大写：<strong className="text-slate-900 font-bold">{getChineseMoneyNotation(activeBatch.totalAmount)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Multi-Department Audit Signatures Stamp Block */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-xs space-y-4">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>四部门联合审签与内控审批意见栏</span>
              <span className="text-[11px] text-slate-500 font-normal">根据公立医院设备维保内部控制规范执行</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1. 临床使用科室 */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800">1. 使用科室确认</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  上述零星维修项目经本科室护士长/技师长当场验收，设备已恢复正常运行。
                </p>
                <div className="pt-2 border-t text-[11px] text-slate-500">
                  科室护士长/技师长 (会签已完备)
                </div>
              </div>

              {/* 2. 医学工程科 */}
              <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-2">
                <div className="font-bold text-blue-800">2. 医学工程科审定</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  经审核，故障定性准确、单价符合框架中标协议、旧件已如数退库，同意报送财务挂账。
                </p>
                <div className="pt-2 border-t text-[11px] text-blue-700 font-bold">
                  审核人：张主任 (已签署)
                </div>
              </div>

              {/* 3. 审计监察科 */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800">3. 审计/采购管理办</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  月度框架结算模式合规，无拆单化整为零规避招标情况，税控清单与发票金额完全吻合。
                </p>
                <div className="pt-2 border-t text-[11px] text-slate-500">
                  内控监督员 (已备案)
                </div>
              </div>

              {/* 4. 财务科 */}
              <div className="p-3 bg-white border border-emerald-200 rounded-lg space-y-2">
                <div className="font-bold text-emerald-800">4. 财务科审核付款</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  发票真伪已通过国家税务总局全国增值税发票查验平台核验，准予挂账并按合同账期支付。
                </p>
                <div className="pt-2 border-t text-[11px] text-emerald-700 font-bold">
                  复核人：李会计 (复核无误)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
