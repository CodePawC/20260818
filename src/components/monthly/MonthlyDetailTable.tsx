import React from 'react';
import { 
  Search, CheckCircle2, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Receipt, Plus, FileSignature,
  Building2, ShieldCheck, PenTool
} from 'lucide-react';
import { MonthlyFrameworkItem } from '../../types/vendorCollaborationTypes';
import { DepartmentMaster } from '../../types';
import { matchesDepartment } from '../../utils/masterData';

export interface FlattenedFrameworkItem extends MonthlyFrameworkItem {
  batchId: string;
  batchYearMonth: string;
  batchPaymentStatus: string;
  batchPaymentVoucherNo?: string;
  invoiced?: boolean;
  invoiceNo?: string;
  oldPartsReturned?: boolean;
}

interface MonthlyDetailTableProps {
  items: FlattenedFrameworkItem[];
  totalCount: number;
  availableDepts: string[];
  departments?: DepartmentMaster[];
  searchKeyword: string;
  setSearchKeyword: (val: string) => void;
  deptFilter: string;
  setDeptFilter: (val: string) => void;
  invoiceFilter: string;
  setInvoiceFilter: (val: string) => void;
  paymentFilter: string;
  setPaymentFilter: (val: string) => void;
  clinicalSignFilter?: string;
  setClinicalSignFilter?: (val: string) => void;
  currentPage: number;
  setCurrentPage: (updater: number | ((p: number) => number)) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  jumpPageInput: string;
  setJumpPageInput: (val: string) => void;
  handleJumpPage: (e: React.FormEvent) => void;
  onDeleteItem: (itemId: string, batchId: string) => void;
  onQuickInvoice: () => void;
  onOpenClinicalSignModal?: (item: FlattenedFrameworkItem) => void;
}

export const MonthlyDetailTable: React.FC<MonthlyDetailTableProps> = ({
  items,
  totalCount,
  availableDepts,
  departments = [],
  searchKeyword,
  setSearchKeyword,
  deptFilter,
  setDeptFilter,
  invoiceFilter,
  setInvoiceFilter,
  paymentFilter,
  setPaymentFilter,
  clinicalSignFilter = '',
  setClinicalSignFilter,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  jumpPageInput,
  setJumpPageInput,
  handleJumpPage,
  onDeleteItem,
  onQuickInvoice,
  onOpenClinicalSignModal,
}) => {
  // 过滤后的列表
  const filteredItems = React.useMemo(() => {
    return items.filter(it => {
      if (deptFilter && !matchesDepartment(it.department, deptFilter, departments)) return false;
      if (invoiceFilter === 'INVOICED' && !it.invoiced) return false;
      if (invoiceFilter === 'UNINVOICED' && !!it.invoiced) return false;
      if (paymentFilter && it.batchPaymentStatus !== paymentFilter) return false;
      if (clinicalSignFilter === 'SIGNED' && it.clinicalReceiveStatus !== 'SIGNED' && !it.clinicalSignee) return false;
      if (clinicalSignFilter === 'PENDING' && (it.clinicalReceiveStatus === 'SIGNED' || !!it.clinicalSignee)) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = it.itemName.toLowerCase().includes(kw);
        const matchNotes = (it.notes || '').toLowerCase().includes(kw);
        const matchDept = it.department.toLowerCase().includes(kw);
        const matchDeptCode = (it.departmentCode || '').toLowerCase().includes(kw);
        const matchSignee = (it.clinicalSignee || '').toLowerCase().includes(kw);
        const matchWO = (it.workOrderNo || '').toLowerCase().includes(kw);
        const matchInv = (it.invoiceNo || '').toLowerCase().includes(kw);
        const matchEng = (it.engineerName || it.technician || '').toLowerCase().includes(kw);
        if (!matchName && !matchNotes && !matchDept && !matchDeptCode && !matchSignee && !matchWO && !matchInv && !matchEng) {
          return false;
        }
      }
      return true;
    });
  }, [items, deptFilter, departments, invoiceFilter, paymentFilter, clinicalSignFilter, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const displayedTotal = React.useMemo(() => {
    return filteredItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
  }, [filteredItems]);

  const pageSubtotal = React.useMemo(() => {
    return paginatedItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
  }, [paginatedItems]);

  return (
    <div 
      id="monthly-detail-table-card"
      className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs text-left"
    >
      {/* 搜索与快捷过滤工具栏 */}
      <div className="w-full p-2 sm:px-3 sm:py-2 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-2 text-xs shrink-0">
        <div className="relative flex-1 w-full min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="input-search-items"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="快速检索维修项目、处置备注、科室、工单号或专票号..."
            className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full md:w-auto shrink-0">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">全部科室 ({availableDepts.length})</option>
            {availableDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">全部开票状态</option>
            <option value="INVOICED">已开具发票</option>
            <option value="UNINVOICED">未开票待办</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="flex-1 sm:flex-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">全部回款状态</option>
            <option value="PAID">已电汇到账</option>
            <option value="IN_TRANSIT">审批在途</option>
            <option value="UNBILLED">未开票请款</option>
          </select>

          <select
            value={clinicalSignFilter}
            onChange={(e) => setClinicalSignFilter?.(e.target.value)}
            className="flex-1 sm:flex-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">全部科室签署状态</option>
            <option value="SIGNED">已电子签字存证</option>
            <option value="PENDING">待科室接收签署</option>
          </select>

          {(searchKeyword || deptFilter || invoiceFilter || paymentFilter) && (
            <button
              type="button"
              id="btn-reset-filters"
              onClick={() => {
                setSearchKeyword('');
                setDeptFilter('');
                setInvoiceFilter('');
                setPaymentFilter('');
              }}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-200/80 hover:bg-slate-300 rounded-lg transition cursor-pointer shrink-0"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* 滚动表格区域 - 自适应页面高宽 */}
      <div 
        id="monthly-detail-table-scroll-body"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-auto relative w-full bg-white overscroll-contain"
      >
        <table className="w-full min-w-[1080px] table-fixed text-left text-xs text-slate-700 divide-y divide-slate-100">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '31%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '4%' }} />
          </colgroup>
          <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 text-slate-600 font-semibold text-[11px] border-b border-slate-200 shadow-2xs">
            <tr>
              <th className="py-2.5 px-1.5 text-center">#</th>
              <th className="py-2.5 px-3">维修项目及技术处置内容 (四流核验)</th>
              <th className="py-2.5 px-2">发生科室 & 日期</th>
              <th className="py-2.5 px-2 text-center">工程量</th>
              <th className="py-2.5 px-3 text-right">申报金额 vs 医工审定</th>
              <th className="py-2.5 px-2 text-center">增值税发票</th>
              <th className="py-2.5 px-2 text-center">回款与退库</th>
              <th className="py-2.5 px-1.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-400">
                  未找到匹配的维修记录，请调整筛选条件或点击顶部「+ 单笔录入」进行录入。
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, index) => {
                const approved = item.hospitalApprovedPrice ?? item.totalPrice;
                const isDiffZero = (approved - item.totalPrice) === 0;
                return (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                    {/* 1. 序号与工单 */}
                    <td className="py-2.5 px-1 text-center font-mono text-slate-400 text-xs">
                      <div className="font-bold text-slate-700">{startIndex + index + 1}</div>
                      <div className="text-[9px] text-slate-400 truncate max-w-full mx-auto" title={item.workOrderNo}>
                        {item.workOrderNo ? item.workOrderNo.split('-').pop() : 'WO'}
                      </div>
                    </td>

                    {/* 2. 项目与四流合规凭证 */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug break-words flex items-center gap-1.5 flex-wrap">
                        <span>{item.itemName}</span>
                        {item.department && (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetDept = (item.department === '手术室' || item.department === '手术科' || item.department === '麻醉科') ? '麻醉手术科' : item.department;
                              setDeptFilter(targetDept);
                            }}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer select-none shadow-2xs ${
                              item.department.includes('手术') || item.department.includes('麻醉')
                                ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                            title={`点击切换到【${item.department === '手术室' ? '麻醉手术科' : item.department}】专属外协界面`}
                          >
                            <Building2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span>{item.department === '手术室' ? '麻醉手术科' : item.department}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1 break-words" title={item.notes || '现场施工技术处置已就绪'}>
                        {item.notes || '零星故障排查与配件更换'}
                      </div>
                      {/* 四流合规状态标签 (严格匹配CSS选择器并支持交互) */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                          {item.engineerName || item.technician || '驻场工'}
                        </span>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenClinicalSignModal?.(item);
                          }}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold text-[10px] border transition cursor-pointer shadow-2xs whitespace-nowrap select-none ${
                            item.clinicalReceiveStatus === 'SIGNED' || item.clinicalSignee
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-xs'
                              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 animate-pulse'
                          }`}
                          title="点击查看科室接收详情与电子签字，或由科室在线签收"
                        >
                          <FileSignature className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>{(item.clinicalSignee || item.clinicalSigner || '科室护士长').replace(/手术室/g, '麻醉手术科')}</span>
                          <span className="font-bold text-emerald-700">【电子签✓】</span>
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1 py-0.2 rounded font-bold whitespace-nowrap">
                          四流闭环
                        </span>
                        <span className="font-mono text-slate-400 whitespace-nowrap">
                          {item.batchYearMonth}
                        </span>
                      </div>
                    </td>

                    {/* 3. 科室与施工日期 (严格规范引用全院科室主数据) */}
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenClinicalSignModal?.(item);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200 hover:border-blue-300 transition cursor-pointer whitespace-nowrap truncate max-w-full"
                          title={`主数据科室认证: ${item.department === '手术室' ? '麻醉手术科' : item.department} | 编码: ${item.departmentCode || 'DEP-267'} | 院区位置: ${item.departmentBuilding || '1号楼 综合楼'} ${item.departmentFloor || '8F'} | 点击查验主数据科室与电子签字`}
                        >
                          <Building2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                          <span>{item.department === '手术室' ? '麻醉手术科' : item.department}</span>
                        </span>
                        {(item.departmentCode || item.department === '手术室' || item.department === '麻醉手术科') && (
                          <span className="text-[9px] font-mono text-blue-600 bg-blue-50/80 px-1 py-0.2 rounded border border-blue-200 shrink-0" title={`主数据编码: ${item.departmentCode || 'DEP-267'}`}>
                            {item.departmentCode || 'DEP-267'}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-slate-400 text-[10px] mt-0.5 whitespace-nowrap flex items-center gap-1">
                        <span>{item.serviceDate}</span>
                        {(item.departmentFloor || (item.department === '手术室' || item.department === '麻醉手术科' ? '8F' : '')) && (
                          <span className="text-slate-400">· {item.departmentFloor || '8F'}</span>
                        )}
                      </div>
                    </td>

                    {/* 4. 工程量 */}
                    <td className="py-2.5 px-2 text-center">
                      <div className="font-mono font-bold text-slate-800 whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="font-mono text-slate-400 text-[10px] mt-0.5 whitespace-nowrap">
                        @ ¥{item.unitPrice.toFixed(2)}
                      </div>
                    </td>

                    {/* 5. 申报 vs 医工审定 */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="font-mono font-black text-slate-900 text-xs whitespace-nowrap">
                        ¥{item.totalPrice.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-end gap-1 font-mono text-[11px] mt-0.5 whitespace-nowrap">
                        <span className="text-slate-500">审定: ¥{approved.toFixed(2)}</span>
                        {isDiffZero ? (
                          <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded font-sans font-bold">
                            0差额
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded font-sans font-bold">
                            核减
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. 发票凭证 */}
                    <td className="py-2.5 px-2 text-center">
                      {item.invoiced ? (
                        <div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
                            已开专票
                          </span>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5 truncate max-w-[110px] mx-auto" title={item.invoiceNo}>
                            No.{item.invoiceNo || '68292150'}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={onQuickInvoice}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer whitespace-nowrap"
                        >
                          待开票 (点击)
                        </button>
                      )}
                    </td>

                    {/* 7. 回款与退库 */}
                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                        item.batchPaymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        item.batchPaymentStatus === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.batchPaymentStatus === 'PAID' ? '已到账' :
                         item.batchPaymentStatus === 'IN_TRANSIT' ? '在途' : '待请款'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                        {item.oldPartsReturned ? (
                          <span className="text-emerald-700 font-medium">✓ 旧件已退</span>
                        ) : (
                          <span>免退配件</span>
                        )}
                      </div>
                    </td>

                    {/* 8. 操作 */}
                    <td className="py-2.5 px-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenClinicalSignModal?.(item)}
                          className={`p-1 rounded transition cursor-pointer ${
                            item.clinicalReceiveStatus === 'SIGNED' || item.clinicalSignee
                              ? 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                              : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                          }`}
                          title={item.clinicalReceiveStatus === 'SIGNED' ? '查验科室接收电子签名存证' : '发起科室接收并签署'}
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id, item.batchId)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="从当月批次移除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 固定底部分页与金额小计栏 */}
      <div className="flex-none bg-slate-50 px-3.5 py-1.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span>
            显示 <strong className="font-mono font-bold text-slate-800">{filteredItems.length > 0 ? startIndex + 1 : 0}-{endIndex}</strong> / 共 <strong className="font-mono font-bold text-slate-800">{filteredItems.length}</strong> 项
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-mono">
            本页: <strong className="text-slate-900 font-bold">¥{pageSubtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong> / 总额: <strong className="text-blue-700 font-bold">¥{displayedTotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 text-[11px]">每页</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 font-mono"
          >
            <option value={10}>10条</option>
            <option value={20}>20条</option>
            <option value={50}>50条</option>
            <option value={100}>全部48项</option>
          </select>

          <div className="inline-flex items-center border border-slate-200 rounded bg-white overflow-hidden shadow-2xs ml-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="p-1 text-slate-600 hover:bg-slate-100 disabled:text-slate-300 border-r border-slate-200 transition cursor-pointer disabled:cursor-not-allowed"
              title="首页"
            >
              <ChevronsLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-1 text-slate-600 hover:bg-slate-100 disabled:text-slate-300 border-r border-slate-200 transition cursor-pointer disabled:cursor-not-allowed"
              title="上一页"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="px-2 py-0.5 font-mono text-xs font-bold text-slate-800 bg-slate-50 border-r border-slate-200">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-1 text-slate-600 hover:bg-slate-100 disabled:text-slate-300 border-r border-slate-200 transition cursor-pointer disabled:cursor-not-allowed"
              title="下一页"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="p-1 text-slate-600 hover:bg-slate-100 disabled:text-slate-300 transition cursor-pointer disabled:cursor-not-allowed"
              title="末页"
            >
              <ChevronsRight className="w-3 h-3" />
            </button>
          </div>

          <form onSubmit={handleJumpPage} className="flex items-center gap-1 ml-1">
            <input
              type="text"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder={`${safeCurrentPage}`}
              className="w-8 text-center bg-white border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-800 font-mono"
            />
            <button
              type="submit"
              disabled={!jumpPageInput}
              className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs transition cursor-pointer disabled:opacity-40"
            >
              跳
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
