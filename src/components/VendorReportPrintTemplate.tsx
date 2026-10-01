import React from 'react';
import { 
  VendorCollaborationOrder 
} from '../types/vendorCollaborationTypes';
import { 
  VendorQuoteStats, 
  VendorSummaryItem, 
  DeptSummaryItem 
} from '../utils/vendorQuoteReportUtils';
import { PrintScope } from './VendorReportPrintDialog';
import { extractOrderDate } from '../utils/vendorQuoteReportUtils';

interface VendorReportPrintTemplateProps {
  orders: VendorCollaborationOrder[];
  filteredOrders: VendorCollaborationOrder[];
  stats: VendorQuoteStats;
  vendorSummary: VendorSummaryItem[];
  deptSummary: DeptSummaryItem[];
  periodLabel: string;
  scope: PrintScope;
  orientation: 'portrait' | 'landscape';
  isExporting: boolean;
}

export const VendorReportPrintTemplate: React.FC<VendorReportPrintTemplateProps> = ({
  orders,
  filteredOrders,
  stats,
  vendorSummary,
  deptSummary,
  periodLabel,
  scope,
  orientation,
  isExporting,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const totalPartsCount = filteredOrders.reduce((sum, o) => sum + (o.quoteParts?.length || 0), 0);

  // 科室分摊表 A4 分页 (每页10个科室)
  const deptPageSize = 10;
  const deptPagesCount = Math.max(1, Math.ceil(deptSummary.length / deptPageSize));
  const deptPages = Array.from({ length: deptPagesCount }, (_, i) => 
    deptSummary.slice(i * deptPageSize, (i + 1) * deptPageSize)
  );

  // 外协服务商 A4 分页 (每页12家)
  const vendorPageSize = 12;
  const vendorPagesCount = Math.max(1, Math.ceil(vendorSummary.length / vendorPageSize));
  const vendorPages = Array.from({ length: vendorPagesCount }, (_, i) => 
    vendorSummary.slice(i * vendorPageSize, (i + 1) * vendorPageSize)
  );

  // 逐笔明细台账 A4 分页 (横向排版每页8笔)
  const ledgerPageSize = 8;
  const ledgerPagesCount = Math.max(1, Math.ceil(filteredOrders.length / ledgerPageSize));
  const ledgerPages = Array.from({ length: ledgerPagesCount }, (_, i) => 
    filteredOrders.slice(i * ledgerPageSize, (i + 1) * ledgerPageSize)
  );

  const shouldRenderDept = scope === 'DEPT_BREAKDOWN' || scope === 'FULL_BUNDLE';
  const shouldRenderOfficial = scope === 'OFFICIAL_REPORT' || scope === 'FULL_BUNDLE';
  const shouldRenderVendor = scope === 'VENDOR_ANALYSIS' || (scope === 'FULL_BUNDLE' && !shouldRenderOfficial);
  const shouldRenderLedger = scope === 'LEDGER_DETAIL' || scope === 'FULL_BUNDLE';

  return (
    <div
      id="vendor-report-print-container"
      className={
        isExporting
          ? 'fixed top-0 left-0 -z-50 pointer-events-none overflow-hidden bg-white'
          : 'hidden print:block'
      }
      style={{
        width: orientation === 'landscape' ? '297mm' : '210mm',
        backgroundColor: '#ffffff',
      }}
    >
      {/* ========================================================================= */}
      {/* 模块 1: 各临床科室维修申报分摊表 (标准 A4 幅面，含具体维修项目列) */}
      {/* ========================================================================= */}
      {shouldRenderDept && (
        <div className="dept-breakdown-print-section">
          {deptPages.map((pageDepts, pIndex) => {
            const pageNum = pIndex + 1;
            const isLastPage = pageNum === deptPagesCount;

            return (
              <div
                key={`dept-page-${pageNum}`}
                className="a4-print-page bg-white p-8 text-slate-900 flex flex-col justify-between"
                style={{
                  width: '210mm',
                  minHeight: '275mm',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  {/* 页眉 */}
                  {pageNum === 1 ? (
                    <div className="text-center space-y-2 pb-4 border-b-2 border-slate-900 mb-4">
                      <div className="text-[11px] tracking-widest text-slate-500 font-serif">
                        五莲县人民医院 · 设备科公文沟通附件
                      </div>
                      <h1 className="text-xl font-bold text-slate-900 tracking-normal">
                        五莲县人民医院 各临床科室维修申报分摊表 (议价前)
                      </h1>
                      <div className="flex items-center justify-center space-x-6 text-xs text-slate-600 pt-1">
                        <div>呈报部门：<strong className="text-slate-800">设备科</strong></div>
                        <div>统计周期：<strong className="text-indigo-700 font-mono">{periodLabel}</strong></div>
                        <div>印发日期：<strong className="text-slate-800 font-mono">{today}</strong></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 mb-3 text-xs">
                      <div className="font-bold text-slate-900">
                        五莲县人民医院 · 各临床科室维修申报分摊表 (议价前 · 续表)
                      </div>
                      <div className="text-slate-600 font-mono">
                        统计周期: {periodLabel}
                      </div>
                    </div>
                  )}

                  {/* 表格主体 */}
                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-2 text-center w-10 border-r border-slate-300">序号</th>
                          <th className="py-2 px-3 border-r border-slate-300 w-24">临床科室</th>
                          <th className="py-2 px-3 border-r border-slate-300">具体维修项目 (涉及设备与拟换配件)</th>
                          <th className="py-2 px-2 text-center w-20 border-r border-slate-300">申报工单</th>
                          <th className="py-2 px-2 text-center w-20 border-r border-slate-300">拟换配件</th>
                          <th className="py-2 px-3 text-right border-r border-slate-300 font-bold w-28">申报总额</th>
                          <th className="py-2 px-2.5 text-center w-20">全院占比</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pageDepts.map((d, idx) => {
                          const globalIdx = pIndex * deptPageSize + idx + 1;
                          return (
                            <tr key={d.deptName} className="even:bg-slate-50/40">
                              <td className="py-2 px-2 text-center text-slate-500 font-mono border-r border-slate-200">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200 whitespace-nowrap">
                                {d.deptName}
                              </td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="space-y-1">
                                  {d.projects && d.projects.length > 0 ? (
                                    d.projects.map((proj, pIdx) => (
                                      <div
                                        key={proj.orderId || pIdx}
                                        className="text-xs text-slate-800 leading-snug flex items-start justify-between gap-1"
                                      >
                                        <div>
                                          <span className="font-semibold text-slate-900">{proj.cleanEquipmentName}</span>
                                          <span className="text-slate-600 ml-1">【{proj.partsSummary}】</span>
                                        </div>
                                        {d.projects.length > 1 && (
                                          <span className="font-mono text-slate-500 text-[10px] shrink-0">
                                            ￥{proj.initialQuote.toLocaleString()}
                                          </span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-slate-400">常规维修项目</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2.5 text-center font-semibold font-mono text-slate-700 border-r border-slate-200">
                                {d.orderCount} 笔
                              </td>
                              <td className="py-2 px-2.5 text-center font-mono text-slate-600 border-r border-slate-200">
                                {d.partsCount} 件
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                                ￥{d.initialQuote.toLocaleString()}
                              </td>
                              <td className="py-2 px-2.5 text-center font-mono font-medium text-slate-800">
                                {d.pctOfHospital}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {isLastPage && (
                        <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-300">
                              全院临床科室申报汇总合计 ({deptSummary.length} 个科室)
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">
                              {stats.totalCount} 笔
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black border-r border-slate-300">
                              {totalPartsCount} 件
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-slate-300">
                              ￥{stats.initialQuoteGrandTotal.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2.5 text-center font-mono font-black">
                              100.0%
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* 沟通类表格说明 */}
                  <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                    注：本表用于全院各临床业务科室维修申报沟通核对，所列金额为各科室设备报修时的议价前申报总额，包含外协维保与设备科自主采购配件维修，无需签字盖章。
                  </div>
                </div>

                {/* 极简页脚 */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
                  <div>呈报部门：设备科</div>
                  <div className="font-mono font-medium text-slate-700">
                    — 第 {pageNum} 页 / 共 {deptPagesCount} 页 —
                  </div>
                  <div>沟通核对件 · 印发日期：{today}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 模块 2: 官方月度公文呈报单 (A4 Sheet 1: 正文与核心指标 + Sheet 2: 供应商表) */}
      {/* ========================================================================= */}
      {shouldRenderOfficial && (
        <div className="official-report-print-section">
          {/* Sheet 1: 正文与四大经济指标 */}
          <div
            className="a4-print-page bg-white p-8 sm:p-11 text-slate-900 flex flex-col justify-between"
            style={{
              width: '210mm',
              minHeight: '275mm',
              boxSizing: 'border-box',
            }}
          >
            <div className="space-y-5">
              {/* 公文红头 */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1.5">
                <div className="text-xs tracking-widest text-slate-500 font-serif">
                  五莲县人民医院 · 医学装备管理与外协维保呈批件
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-wide">
                  医学装备维修月度申报汇总呈报表
                </h1>
                <div className="flex items-center justify-center space-x-6 text-xs text-slate-600 pt-1">
                  <div>呈报部门：<strong className="text-slate-800">设备科</strong></div>
                  <div>呈报日期：<strong className="text-slate-800 font-mono">{today}</strong></div>
                  <div>统计周期：<strong className="text-indigo-700 font-mono">{periodLabel}</strong></div>
                </div>
              </div>

              {/* 四大核心经济指标概览 */}
              <div className="grid grid-cols-4 gap-3 text-xs">
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/60">
                  <div className="text-slate-500 text-[11px]">议价前申报总额</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    ￥{stats.initialQuoteGrandTotal.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">厂商原始申报口径</div>
                </div>
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/60">
                  <div className="text-slate-500 text-[11px]">申报工单总量</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {stats.totalCount} 笔
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">涉及全院重点临床科室</div>
                </div>
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/60">
                  <div className="text-slate-500 text-[11px]">拟换配件项数</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {totalPartsCount} 件
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">已核验配件型号与公允性</div>
                </div>
                <div className="border border-indigo-200 rounded p-2.5 bg-indigo-50/40">
                  <div className="text-indigo-900 font-bold text-[11px]">涉及临床科室</div>
                  <div className="font-mono font-bold text-indigo-950 text-sm mt-0.5">
                    {deptSummary.length} 个科室
                  </div>
                  <div className="text-[10px] text-indigo-700 mt-0.5">已完成科室间申报分摊</div>
                </div>
              </div>

              {/* 公文正文阐述 */}
              <div className="border border-slate-200 rounded p-3.5 bg-white text-xs leading-relaxed space-y-2 text-slate-800">
                <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                  呈报简述与审核说明：
                </div>
                <p>
                  为保障全院各临床及医技科室医疗业务顺利开展，设备科对【{periodLabel}】全院医疗设备故障报修及配件更换申报进行了全面汇总与技术核验。
                  本期涉及全院 <strong>{deptSummary.length}</strong> 个临床科室、共计 <strong>{stats.totalCount}</strong> 笔维修工单，拟换配件 <strong>{totalPartsCount}</strong> 件，
                  议价前申报总额为 <strong>￥{stats.initialQuoteGrandTotal.toLocaleString()}</strong> 元。
                </p>
                <p>
                  所涉及维修项目已通过专业工程技术人员进行故障复核与配件公允性核查，相关报表已按科室分摊形成沟通件供各临床科室核对。
                </p>
              </div>

              {/* 部门呈报说明 */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
                <div>呈报部门：<strong>设备科</strong> · 负责全院医疗装备日常维保、外协协同与配件核验</div>
                <div className="font-mono text-[11px] text-slate-500">呈报日期：{today}</div>
              </div>
            </div>

            {/* 页脚 */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
              <div>呈报部门：设备科</div>
              <div className="font-mono font-bold text-slate-700">— 第 1 页 / 共 2 页 —</div>
              <div>归档备查件 · 印发日期：{today}</div>
            </div>
          </div>

          {/* Sheet 2: 外协服务商报价汇总附表 */}
          <div
            className="a4-print-page bg-white p-8 sm:p-11 text-slate-900 flex flex-col justify-between"
            style={{
              width: '210mm',
              minHeight: '275mm',
              boxSizing: 'border-box',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-slate-800 text-xs">
                <div className="font-bold text-slate-900">
                  五莲县人民医院 · 医学装备维修申报汇总（附表：外协服务商申报汇总）
                </div>
                <div className="text-slate-600 font-mono">
                  统计周期: {periodLabel}
                </div>
              </div>

              <div className="border border-slate-300 rounded-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-2 text-center w-10 border-r border-slate-300">序号</th>
                      <th className="py-2 px-3 border-r border-slate-300">服务商名称</th>
                      <th className="py-2 px-3 border-r border-slate-300 w-28">业务联系人</th>
                      <th className="py-2 px-2 text-center w-16 border-r border-slate-300">工单数</th>
                      <th className="py-2 px-2 text-center w-16 border-r border-slate-300">配件数</th>
                      <th className="py-2 px-3 text-right border-r border-slate-300 font-bold w-28">申报总额</th>
                      <th className="py-2 px-2.5 text-center w-16">占比</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vendorSummary.map((v, idx) => (
                      <tr key={v.vendorName} className="even:bg-slate-50/40">
                        <td className="py-2 px-2 text-center text-slate-500 font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">{v.vendorName}</td>
                        <td className="py-2 px-3 text-slate-600 border-r border-slate-200">{v.contactPerson}</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-200">{v.orderCount} 笔</td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200">{v.partsCount} 件</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-200">￥{v.initialQuote.toLocaleString()}</td>
                        <td className="py-2 px-2.5 text-center font-mono text-slate-700">{v.pctOfTotal}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-300">全院外协服务商申报总计</td>
                      <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300">{stats.totalCount} 笔</td>
                      <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300">{totalPartsCount} 件</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 border-r border-slate-300">￥{stats.initialQuoteGrandTotal.toLocaleString()}</td>
                      <td className="py-2.5 px-2.5 text-center font-mono font-black">100.0%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
              <div>呈报部门：设备科</div>
              <div className="font-mono font-bold text-slate-700">— 第 2 页 / 共 2 页 —</div>
              <div>归档备查件 · 印发日期：{today}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 模块 3: 外协服务商报价汇总表 (独立 A4 模式) */}
      {/* ========================================================================= */}
      {shouldRenderVendor && (
        <div className="vendor-analysis-print-section">
          {vendorPages.map((pageVendors, vIdx) => {
            const pageNum = vIdx + 1;
            const isLastPage = pageNum === vendorPagesCount;

            return (
              <div
                key={`vendor-print-page-${pageNum}`}
                className="a4-print-page bg-white p-8 text-slate-900 flex flex-col justify-between"
                style={{
                  width: '210mm',
                  minHeight: '275mm',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div className="text-center space-y-2 pb-4 border-b-2 border-slate-900 mb-4">
                    <h1 className="text-xl font-bold text-slate-900">
                      五莲县人民医院 外协服务商月度申报报价汇总表 (议价前)
                    </h1>
                    <div className="flex items-center justify-center space-x-6 text-xs text-slate-600">
                      <div>呈报部门：<strong className="text-slate-800">设备科</strong></div>
                      <div>统计周期：<strong className="text-indigo-700 font-mono">{periodLabel}</strong></div>
                      <div>印发日期：<strong className="text-slate-800 font-mono">{today}</strong></div>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-2 text-center w-10 border-r border-slate-300">序号</th>
                          <th className="py-2 px-3 border-r border-slate-300">供应商名称</th>
                          <th className="py-2 px-3 border-r border-slate-300">对接人 / 电话</th>
                          <th className="py-2 px-2 text-center w-16 border-r border-slate-300">申报工单</th>
                          <th className="py-2 px-2 text-center w-16 border-r border-slate-300">配件数</th>
                          <th className="py-2 px-3 text-right border-r border-slate-300">配件小计</th>
                          <th className="py-2 px-3 text-right border-r border-slate-300">工时差旅</th>
                          <th className="py-2 px-3 text-right border-r border-slate-300 font-bold">申报总额</th>
                          <th className="py-2 px-2 text-center w-16">占比</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pageVendors.map((v, idx) => (
                          <tr key={v.vendorName} className="even:bg-slate-50/40">
                            <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">
                              {vIdx * vendorPageSize + idx + 1}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-200">
                              {v.vendorName}
                            </td>
                            <td className="py-2 px-3 text-slate-600 border-r border-slate-200">
                              {v.contactPerson} ({v.phone})
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-700 border-r border-slate-200">
                              {v.orderCount} 笔
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600 border-r border-slate-200">
                              {v.partsCount} 件
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                              ￥{v.partsTotal.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 border-r border-slate-200">
                              ￥{v.laborAndTravel.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-950 border-r border-slate-200">
                              ￥{v.initialQuote.toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-700">
                              {v.pctOfTotal}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {isLastPage && (
                        <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-300">全院外协服务商总计</td>
                            <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300">{stats.totalCount} 笔</td>
                            <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300">{totalPartsCount} 件</td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">￥{stats.quotePartsTotal.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">￥{(stats.quoteLaborCost + stats.quoteTravelCost).toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-black border-r border-slate-300">￥{stats.initialQuoteGrandTotal.toLocaleString()}</td>
                            <td className="py-2.5 px-2 text-center font-mono">100.0%</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
                  <div>呈报部门：设备科</div>
                  <div className="font-mono font-medium text-slate-700">— 第 {pageNum} 页 / 共 {vendorPagesCount} 页 —</div>
                  <div>归档备查件 · 印发日期：{today}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 模块 4: 外协维修报价逐笔明细对账台账 (横向 A4 幅面) */}
      {/* ========================================================================= */}
      {shouldRenderLedger && (
        <div className="ledger-detail-print-section">
          {ledgerPages.map((pageOrders, lIdx) => {
            const pageNum = lIdx + 1;
            const isLastPage = pageNum === ledgerPagesCount;

            return (
              <div
                key={`ledger-print-page-${pageNum}`}
                className="a4-print-page-landscape bg-white p-6 sm:p-8 text-slate-900 flex flex-col justify-between"
                style={{
                  width: '297mm',
                  minHeight: '195mm',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div className="text-center space-y-1.5 pb-3 border-b-2 border-slate-900 mb-3">
                    <h1 className="text-lg font-bold text-slate-900">
                      五莲县人民医院 外协维修报价逐笔明细对账台账
                    </h1>
                    <div className="flex items-center justify-center space-x-6 text-xs text-slate-600">
                      <div>呈报部门：<strong className="text-slate-800">设备科</strong></div>
                      <div>统计周期：<strong className="text-indigo-700 font-mono">{periodLabel}</strong></div>
                      <div>全量工单：<strong className="text-slate-800 font-mono">{filteredOrders.length} 笔</strong></div>
                      <div>印发日期：<strong className="text-slate-800 font-mono">{today}</strong></div>
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="py-2 px-2 text-center w-10 border-r border-slate-300">序号</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 w-24">工单编号</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 w-20">报修日期</th>
                          <th className="py-2 px-3 border-r border-slate-300">涉及设备与规格型号</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 w-24">临床科室</th>
                          <th className="py-2 px-3 border-r border-slate-300 w-32">外协服务商</th>
                          <th className="py-2 px-3 border-r border-slate-300">拟换配件与故障简述</th>
                          <th className="py-2 px-2.5 text-right border-r border-slate-300 font-bold w-24">申报报价</th>
                          <th className="py-2 px-2.5 text-right border-r border-slate-300 font-bold w-24">最终审定价</th>
                          <th className="py-2 px-2 text-center w-20">发票凭据</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {pageOrders.map((o, idx) => {
                          const globalIdx = lIdx * ledgerPageSize + idx + 1;
                          const partsNames = (o.quoteParts || []).map(p => `${p.name}*${p.quantity}`).join(', ') || '无拟换配件';
                          return (
                            <tr key={o.id} className="even:bg-slate-50/40">
                              <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-200">{globalIdx}</td>
                              <td className="py-2 px-2.5 font-mono text-slate-700 border-r border-slate-200 whitespace-nowrap">{o.workOrderId}</td>
                              <td className="py-2 px-2.5 font-mono text-slate-600 border-r border-slate-200 whitespace-nowrap">{extractOrderDate(o)}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                                {o.equipmentName} <span className="font-normal text-slate-500 font-mono">({o.equipmentModel})</span>
                              </td>
                              <td className="py-2 px-2.5 font-medium text-slate-800 border-r border-slate-200 whitespace-nowrap">{o.department}</td>
                              <td className="py-2 px-3 text-slate-700 border-r border-slate-200">{o.vendorName}</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="line-clamp-1 text-slate-800 font-medium">配件: {partsNames}</div>
                                <div className="line-clamp-1 text-slate-500 text-[10px]">故障: {o.faultDescription}</div>
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono text-slate-800 border-r border-slate-200">
                                ￥{o.quoteGrandTotal.toLocaleString()}
                              </td>
                              <td className="py-2 px-2.5 text-right font-mono font-bold text-emerald-800 border-r border-slate-200">
                                ￥{(o.finalPrice || o.quoteGrandTotal).toLocaleString()}
                              </td>
                              <td className="py-2 px-2 text-center text-slate-600 text-[11px]">
                                {o.invoiceInfo?.invoiceNumber ? '已验真入账' : '待开具'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {isLastPage && (
                        <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-900">
                          <tr>
                            <td colSpan={7} className="py-2 px-3 text-center border-r border-slate-300">
                              全量外协工单申报合计 ({filteredOrders.length} 笔)
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-black border-r border-slate-300">
                              ￥{stats.initialQuoteGrandTotal.toLocaleString()}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-900 border-r border-slate-300">
                              ￥{stats.finalNegotiatedTotal.toLocaleString()}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-[11px]">
                              一案一档
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-sans mt-auto">
                  <div>呈报部门：设备科</div>
                  <div className="font-mono font-medium text-slate-700">— 第 {pageNum} 页 / 共 {ledgerPagesCount} 页 —</div>
                  <div>对账归档件 · 印发日期：{today}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
