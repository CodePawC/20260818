import React, { useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, FileSpreadsheet, 
  Wrench, ShieldCheck, Clock, CheckCircle2, AlertTriangle, 
  FileText, Upload, ArrowRight, Layers, Coins, Award, 
  Calendar, Check, AlertCircle, Sparkles, Building2
} from 'lucide-react';
import { 
  VendorCollaborationOrder, 
  VendorUserAccount, 
  BiddingProject,
  CorporateQualification,
  StructuredDocumentRecord 
} from '../../types/vendorCollaborationTypes';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface VendorHomeAnalyticsViewProps {
  currentVendor: VendorUserAccount;
  orders: VendorCollaborationOrder[];
  biddingProjects: BiddingProject[];
  qualifications: CorporateQualification[];
  structuredDocs: StructuredDocumentRecord[];
  onNavigateTab: (tabKey: any) => void;
  onOpenQuickUpload: (docType: 'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION') => void;
}

export const VendorHomeAnalyticsView: React.FC<VendorHomeAnalyticsViewProps> = ({
  currentVendor,
  orders,
  biddingProjects,
  qualifications,
  structuredDocs,
  onNavigateTab,
  onOpenQuickUpload,
}) => {
  // 过滤本供应商数据
  const vendorOrders = orders.filter(o => o.vendorId === currentVendor.vendorId);
  const effectiveOrders = vendorOrders.length > 0 ? vendorOrders : orders;

  // 1. 核心指标统计
  const metrics = useMemo(() => {
    // 竞价统计
    const openBiddings = biddingProjects.filter(b => b.status === 'OPEN').length;
    const myActiveBids = biddingProjects.filter(b => b.status === 'BIDDED' || b.mySubmission).length;
    const wonBids = biddingProjects.filter(b => b.status === 'WON' || b.mySubmission?.status === 'ACCEPTED').length;

    // 议价统计
    const negotiatingOrders = effectiveOrders.filter(o => o.status === 'MULTI_DEPT_NEGOTIATING').length;
    const totalSavings = effectiveOrders.reduce((sum, o) => sum + (o.savingsAmount || 0), 0);
    const totalOrderAmount = effectiveOrders.reduce((sum, o) => sum + (o.finalNegotiatedPrice || o.quoteGrandTotal || 0), 0);

    // 单据与发票
    const totalInvoices = structuredDocs.filter(d => d.docType === 'INVOICE');
    const totalInvoicedAmount = totalInvoices.reduce((sum, d) => sum + (d.amount || 0), 0);
    const pendingInvoices = effectiveOrders.filter(o => o.status === 'COMPLETED_PENDING_INVOICE').length;

    // 资质合规
    const validQuals = qualifications.filter(q => q.status === 'VALID').length;
    const expiringQuals = qualifications.filter(q => q.status === 'EXPIRING_SOON').length;
    const expiredQuals = qualifications.filter(q => q.status === 'EXPIRED').length;

    return {
      openBiddings,
      myActiveBids,
      wonBids,
      negotiatingOrders,
      totalSavings,
      totalOrderAmount,
      totalInvoicedAmount,
      pendingInvoices,
      totalDocs: structuredDocs.length,
      validQuals,
      expiringQuals,
      expiredQuals,
      completedOrders: effectiveOrders.filter(o => o.status === 'ARCHIVED' || o.status === 'INVOICE_UPLOADED').length,
    };
  }, [biddingProjects, effectiveOrders, structuredDocs, qualifications]);

  // 2. 业务类型与收入构成分布数据 (Pie Chart)
  const categoryData = useMemo(() => [
    { name: '大型影像大修', value: 185000, color: '#2563eb' },
    { name: '零星维保框架', value: 51200, color: '#059669' },
    { name: '生命支持耗件', value: 38000, color: '#f59e0b' },
    { name: '第三方计量检测', value: 78000, color: '#7c3aed' },
  ], []);

  // 3. 近6个月结算与议价降幅对比数据 (Bar Chart)
  const monthlyTrendsData = useMemo(() => [
    { month: '4月', initialQuote: 82000, finalPrice: 74000, savings: 8000 },
    { month: '5月', initialQuote: 96000, finalPrice: 85000, savings: 11000 },
    { month: '6月', initialQuote: 120000, finalPrice: 106000, savings: 14000 },
    { month: '7月', initialQuote: 110000, finalPrice: 98000, savings: 12000 },
    { month: '8月', initialQuote: 145000, finalPrice: 129200, savings: 15800 },
    { month: '9月(实时)', initialQuote: 98000, finalPrice: 86000, savings: 12000 },
  ], []);

  // 4. 工单履约时效与SLA达标趋势 (Line Chart)
  const slaTrendData = useMemo(() => [
    { month: '4月', responseRate: 98.2, completionRate: 96.0 },
    { month: '5月', responseRate: 99.0, completionRate: 97.5 },
    { month: '6月', responseRate: 97.8, completionRate: 98.0 },
    { month: '7月', responseRate: 99.5, completionRate: 98.8 },
    { month: '8月', responseRate: 100.0, completionRate: 99.2 },
    { month: '9月', responseRate: 99.6, completionRate: 99.0 },
  ], []);

  return (
    <div className="w-full h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
      
      {/* 顶部欢迎横幅与协同身份摘要 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                {currentVendor.vendorName}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                {currentVendor.category}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                系统互联认证合作商
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span>统一社会信用代码: <strong className="font-mono text-slate-700">{currentVendor.creditCode || '91320200607908821B'}</strong></span>
              <span>•</span>
              <span>框架合同: <strong className="font-mono text-slate-700">{currentVendor.contractNo || 'FW-2026-SERVICE'}</strong></span>
              <span>•</span>
              <span>驻场范围: <span className="text-slate-700">{currentVendor.frameworkScope || '全院大型医疗设备与重点保障'}</span></span>
            </p>
          </div>
        </div>

        {/* 快捷上传触发群组 */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onOpenQuickUpload('QUOTATION')}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap flex-1 sm:flex-initial"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>上传报价单</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickUpload('REPAIR_REPORT')}
            className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap flex-1 sm:flex-initial"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>上传维修报告</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickUpload('INVOICE')}
            className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap flex-1 sm:flex-initial"
          >
            <Upload className="w-3.5 h-3.5 text-white shrink-0" />
            <span>上传增值税发票</span>
          </button>
        </div>
      </div>

      {/* 核心指标统计卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. 待响应公开竞价 */}
        <div 
          onClick={() => onNavigateTab('BIDDING')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">待参与竞价</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">{metrics.openBiddings}</span>
            <span className="text-xs text-slate-400">个开放中</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 font-medium flex items-center gap-0.5">
            <span>我的投标: {metrics.myActiveBids}项</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* 2. 多科室联合议价中 */}
        <div 
          onClick={() => onNavigateTab('NEGOTIATION')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-amber-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">联合议价中</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-600">{metrics.negotiatingOrders}</span>
            <span className="text-xs text-slate-400">单磋商中</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium flex items-center gap-0.5">
            <span>需调价确认</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* 3. 待开票/上传发票 */}
        <div 
          onClick={() => onNavigateTab('STRUCTURED_DOCS')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">待上传发票</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">{metrics.pendingInvoices}</span>
            <span className="text-xs text-slate-400">单完工待传</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-medium flex items-center gap-0.5">
            <span>已验票: ¥{(metrics.totalInvoicedAmount / 10000).toFixed(1)}万</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* 4. 结构化单据总库 */}
        <div 
          onClick={() => onNavigateTab('STRUCTURED_DOCS')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">结构化单据</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-emerald-600">{metrics.totalDocs}</span>
            <span className="text-xs text-slate-400">件已入库</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
            <span>报价/报告/发票</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* 5. 企业资质合规率 */}
        <div 
          onClick={() => onNavigateTab('QUALIFICATIONS')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-teal-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">企业资质状态</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-teal-600">{metrics.validQuals}</span>
            <span className="text-xs text-slate-400">项有效</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600 font-medium flex items-center gap-1">
            {metrics.expiringQuals > 0 ? (
              <span className="flex items-center gap-0.5 text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                {metrics.expiringQuals}项临期预警
              </span>
            ) : (
              <span className="text-emerald-600">全项合规准入</span>
            )}
            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

        {/* 6. 议价累计节约与履约 */}
        <div 
          onClick={() => onNavigateTab('FINANCE_ANALYTICS')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">累计让利与成效</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-purple-600">
              ¥{(metrics.totalSavings / 10000).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">万元</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-600 font-medium flex items-center gap-0.5">
            <span>降幅达成率 100%</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>

      </div>

      {/* 关键业务预警与待办事项 */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-900">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold">实时协同待办提醒：</span>
            <span className="text-amber-800 ml-1">
              【竞价】生化分析仪抢修项目已截止出价，进入拟定标；【议价】3.0T超导磁共振大修医院提出建议目标价 ¥32,000，等待您的二次确认。
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('NEGOTIATION')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition cursor-pointer shadow-2xs"
          >
            立即响应议价
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('BIDDING')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 font-semibold transition cursor-pointer"
          >
            查看竞价动态
          </button>
        </div>
      </div>

      {/* 核心数据分析图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左侧2列：议价前后价格对比与节资成效 (柱状堆叠对比图) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                月度维保申报金额与议价审定成效分析
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                反映供应商初始报价、多科室会签审定成交价及累计节约资金走势
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                初始报价
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                审定成交价
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                节约让利
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `¥${val/1000}k`} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    const label = name === 'initialQuote' ? '初始报价' : name === 'finalPrice' ? '审定成交价' : '让利金额';
                    return [`¥${Number(val).toLocaleString()}`, label];
                  }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="initialQuote" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="finalPrice" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="savings" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧1列：维保业务类型构成分布 (饼环图) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              维保协同业务形态分布
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              本单位承接医院各维保与检测项目金额占比
            </p>
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, '业务金额']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400">总业务量</span>
              <span className="text-base font-bold font-mono text-slate-800">¥35.2万</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100 text-[11px]">
            {categoryData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}</span>
                <span className="font-mono font-semibold text-slate-900 ml-auto">
                  {(item.value / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 下方分栏：SLA履约率趋势与最新结构化单据动态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SLA响应与完工达标走势 (折线图) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                服务SLA时效与质控达标走势
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                紧急响应达标率与现场修复首派解决率对比
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              综合质控 99.4%
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(val: any, name: any) => [
                    `${val}%`, 
                    name === 'responseRate' ? '紧急响应达标率' : '现场修复完工率'
                  ]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="responseRate" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="completionRate" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-1 rounded bg-blue-600" />
              2小时紧急响应到场率
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-1 rounded bg-emerald-600" />
              修复验收一次性达标率
            </span>
          </div>
        </div>

        {/* 最近已录入的结构化单据台账列表预览 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                最新结构化上传单据 (发票/报告/报价)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                已自动提取关键结构化字段并核对入库
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('STRUCTURED_DOCS')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>查看全部</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-56 pr-1 space-y-1">
            {structuredDocs.slice(0, 4).map(doc => (
              <div key={doc.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    doc.docType === 'INVOICE' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : doc.docType === 'REPAIR_REPORT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {doc.docType === 'INVOICE' ? '发票' : doc.docType === 'REPAIR_REPORT' ? '维修报告' : '报价单'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {doc.docName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      <span>单号: {doc.docCode}</span>
                      <span>•</span>
                      <span>{doc.parsedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {doc.amount !== undefined && (
                    <div className="font-mono font-bold text-slate-900">
                      ¥{doc.amount.toLocaleString()}
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    已结构化
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>支持结构化自动比对税票及现场签字凭单</span>
            <button
              type="button"
              onClick={() => onNavigateTab('STRUCTURED_DOCS')}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              + 录入新单据
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
