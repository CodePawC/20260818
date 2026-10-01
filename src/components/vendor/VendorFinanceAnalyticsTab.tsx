import React, { useState } from 'react';
import { 
  Wallet, Receipt, TrendingUp, CheckCircle2, Clock, Landmark, 
  Download, Printer, FileSpreadsheet, ShieldCheck, ArrowUpRight, 
  Coins, FileText, Search, Filter, Check, ExternalLink 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend 
} from 'recharts';
import { VendorUserAccount } from '../../types/vendorCollaborationTypes';

interface VendorFinanceAnalyticsTabProps {
  currentVendor: VendorUserAccount;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorFinanceAnalyticsTab: React.FC<VendorFinanceAnalyticsTabProps> = ({
  currentVendor,
  onToast,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PAID' | 'IN_TRANSIT' | 'UNBILLED'>('ALL');
  const [searchKw, setSearchKw] = useState('');

  // 结算月度趋势图表数据
  const monthlyChartData = [
    { month: '2026-05', 申报金额: 58000, 实际到账: 58000, 议价让利: 6200 },
    { month: '2026-06', 申报金额: 74200, 实际到账: 74200, 议价让利: 8100 },
    { month: '2026-07', 申报金额: 92600, 实际到账: 92600, 议价让利: 9500 },
    { month: '2026-08', 申报金额: 114500, 实际到账: 114500, 议价让利: 11200 },
    { month: '2026-09', 申报金额: 146400, 实际到账: 93300, 议价让利: 11800 },
  ];

  // 往来款项台账明细
  const [ledgerEntries] = useState([
    {
      id: 'PAY-2026-0901',
      title: '2026年09月第一批次零星维保框架进度款',
      type: '月度框架维保',
      contractNo: currentVendor.contractNo || 'SINOPHARM-2026-TOTAL',
      invoiceNo: '68294109',
      invoiceAmount: 38200,
      untaxedAmount: 33805.31,
      taxAmount: 4394.69,
      taxRate: '13%',
      paymentStatus: 'IN_TRANSIT',
      payerBank: '中国银行国库集中支付账户 (4580***192)',
      voucherNo: 'VCH-20260918-042',
      date: '2026-09-18',
    },
    {
      id: 'PAY-2026-0902',
      title: '3.0T 超导磁共振系统射频功放板专项大修',
      type: '单台专项大修',
      contractNo: 'EXT-202609-001',
      invoiceNo: '99823019',
      invoiceAmount: 55100,
      untaxedAmount: 48761.06,
      taxAmount: 6338.94,
      taxRate: '13%',
      paymentStatus: 'IN_TRANSIT',
      payerBank: '中国工商银行五莲支行账户 (1602***901)',
      voucherNo: 'VCH-20260916-018',
      date: '2026-09-16',
    },
    {
      id: 'PAY-2026-0801',
      title: '2026年08月全院零星设备维保框架结算',
      type: '月度框架维保',
      contractNo: currentVendor.contractNo || 'SINOPHARM-2026-TOTAL',
      invoiceNo: '67401928',
      invoiceAmount: 114500,
      untaxedAmount: 101327.43,
      taxAmount: 13172.57,
      taxRate: '13%',
      paymentStatus: 'PAID',
      payerBank: '中国建设银行日照分行直通账户 (4420***881)',
      voucherNo: 'VCH-20260828-099',
      date: '2026-08-28',
    },
    {
      id: 'PAY-2026-0701',
      title: '2026年07月全院零星设备维保框架结算',
      type: '月度框架维保',
      contractNo: currentVendor.contractNo || 'SINOPHARM-2026-TOTAL',
      invoiceNo: '66102938',
      invoiceAmount: 92600,
      untaxedAmount: 81946.90,
      taxAmount: 10653.10,
      taxRate: '13%',
      paymentStatus: 'PAID',
      payerBank: '招商银行对公电汇 (1219***801)',
      voucherNo: 'VCH-20260730-055',
      date: '2026-07-30',
    },
    {
      id: 'PAY-2026-0903',
      title: '2026年09月第二批次手术室微创镜及气动系统维保',
      type: '月度框架维保',
      contractNo: currentVendor.contractNo || 'SINOPHARM-2026-TOTAL',
      invoiceNo: '待开具',
      invoiceAmount: 53100,
      untaxedAmount: 46991.15,
      taxAmount: 6108.85,
      taxRate: '13%',
      paymentStatus: 'UNBILLED',
      payerBank: '待开票后流转财务科安排',
      voucherNo: '待生成',
      date: '2026-09-15',
    }
  ]);

  const filteredEntries = ledgerEntries.filter(entry => {
    if (selectedStatusFilter !== 'ALL' && entry.paymentStatus !== selectedStatusFilter) return false;
    if (searchKw.trim()) {
      const q = searchKw.toLowerCase().trim();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.invoiceNo.toLowerCase().includes(q) ||
        entry.contractNo.toLowerCase().includes(q) ||
        entry.voucherNo.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRevenue = ledgerEntries.reduce((sum, e) => sum + e.invoiceAmount, 0);
  const totalPaid = ledgerEntries.filter(e => e.paymentStatus === 'PAID').reduce((sum, e) => sum + e.invoiceAmount, 0);
  const totalInTransit = ledgerEntries.filter(e => e.paymentStatus === 'IN_TRANSIT').reduce((sum, e) => sum + e.invoiceAmount, 0);
  const totalUnbilled = ledgerEntries.filter(e => e.paymentStatus === 'UNBILLED').reduce((sum, e) => sum + e.invoiceAmount, 0);

  return (
    <div id="vendor-finance-analytics-tab" className="space-y-4">
      {/* 财务核心指标 Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
            <span>合作累计业务产值</span>
            <span className="text-slate-400">含税合计</span>
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            ¥{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            累计结算工单 5 笔 | 履约平稳
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 mb-1 flex items-center justify-between">
            <span>医院已结清回款</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            ¥{totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1">
            银行对公电汇到账率 {((totalPaid / totalRevenue) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-blue-600 mb-1 flex items-center justify-between">
            <span>医院财务在途电汇</span>
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          </div>
          <div className="text-xl font-black text-blue-700 font-mono">
            ¥{totalInTransit.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-1">
            已过医工与财务联审，预计2-3工作日到账
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 mb-1 flex items-center justify-between">
            <span>待开票申报款项</span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            ¥{totalUnbilled.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">
            附带金税盘销货清单后可请款
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-semibold text-indigo-600 mb-1 flex items-center justify-between">
            <span>累计让利医院贡献</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-200">9.8% 节资</span>
          </div>
          <div className="text-xl font-black text-indigo-700 font-mono">
            ¥46,800
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            多科室联合议价降本增效成果
          </div>
        </div>
      </div>

      {/* 结算趋势图表与税控销项分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 左侧：月度结算与到账走势 */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                月度产值申报与实际到账回款走势 (2026年5月 - 9月)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                金额单位：人民币 (元) | 数据来源：金税发票及医院财务国库支付回执
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
              履约稳定 A+
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `¥${(val / 1000)}k`} />
                <Tooltip 
                  formatter={(val: number) => [`¥${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="申报金额" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="实际到账" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="议价让利" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：开户行与税务合规资质 */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Landmark className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                供应商签约收款账户与发票资质
              </h4>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5">
                <div className="text-[11px] text-slate-400">签约收款企业全称：</div>
                <div className="font-bold text-slate-900">{currentVendor.vendorName}</div>
                <div className="text-[11px] text-slate-400 mt-1">开户银行：</div>
                <div className="font-medium text-slate-800">{currentVendor.bankName || '招商银行上海分行营业部'}</div>
                <div className="text-[11px] text-slate-400 mt-1">对公银行账号：</div>
                <div className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {currentVendor.bankAccount || '1219 0823 4810 801'}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">纳税人识别号:</span>
                  <span className="font-mono font-medium text-slate-800">{currentVendor.creditCode || '91320200607908821B'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">发票开具类别:</span>
                  <span className="font-medium text-slate-800">增值税专用发票 (13% 货物 / 6% 技术服务)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">账期结算约定:</span>
                  <span className="font-medium text-slate-800">验收发票送达后 NET 30天</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToast('已向医院医学工程科与财务科导出最新财务对账对公凭条！', 'success')}
            className="mt-3 w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>导出本期企业往来财务对账单</span>
          </button>
        </div>
      </div>

      {/* 往来款项明细台账 */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              结算批次与发票收款明细台账 ({filteredEntries.length} 笔)
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('ALL')}
                className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                  selectedStatusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('PAID')}
                className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                  selectedStatusFilter === 'PAID'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                已结清
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('IN_TRANSIT')}
                className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                  selectedStatusFilter === 'IN_TRANSIT'
                    ? 'bg-white text-blue-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                在途电汇
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('UNBILLED')}
                className={`px-2 py-1 rounded-md font-bold transition cursor-pointer ${
                  selectedStatusFilter === 'UNBILLED'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                待开票
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchKw}
                onChange={(e) => setSearchKw(e.target.value)}
                placeholder="搜索标题、发票号或凭证号..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400 transition"
              />
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3 whitespace-nowrap">款项凭单编号</th>
                <th className="py-2.5 px-3">维保事项 / 结算标题</th>
                <th className="py-2.5 px-3 whitespace-nowrap">业务类型</th>
                <th className="py-2.5 px-3 whitespace-nowrap">增值税发票号</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">含税结算金额</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-right">不含税金额</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">状态</th>
                <th className="py-2.5 px-3 whitespace-nowrap">付款方/转账银行</th>
                <th className="py-2.5 px-3 whitespace-nowrap">归档日期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {entry.voucherNo}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 line-clamp-1">{entry.title}</div>
                    <div className="text-[10.5px] text-slate-400 font-mono">{entry.contractNo}</div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                    <span className="px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {entry.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 whitespace-nowrap">
                    {entry.invoiceNo === '待开具' ? (
                      <span className="text-amber-600 font-sans text-xs">待开具</span>
                    ) : (
                      <span className="text-blue-700 font-bold">№ {entry.invoiceNo}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-right">
                    ¥{entry.invoiceAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-right">
                    ¥{entry.untaxedAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                      entry.paymentStatus === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : entry.paymentStatus === 'IN_TRANSIT'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {entry.paymentStatus === 'PAID' && '✓ 已结清到账'}
                      {entry.paymentStatus === 'IN_TRANSIT' && '⏳ 财务在途电汇'}
                      {entry.paymentStatus === 'UNBILLED' && '● 待开票请款'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[200px] truncate">
                    {entry.payerBank}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                    {entry.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
