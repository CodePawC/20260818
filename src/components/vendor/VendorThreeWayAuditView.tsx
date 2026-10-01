import React, { useState } from 'react';
import { 
  FileCheck2, Search, Filter, AlertTriangle, CheckCircle2, 
  Printer, Download, ShieldAlert, ArrowRight, Eye, RefreshCw,
  Building, FileText, Check, DollarSign, Layers
} from 'lucide-react';
import { ThreeWayAuditRecord, VendorUserAccount } from '../../types/vendorCollaborationTypes';

interface VendorThreeWayAuditViewProps {
  currentVendor: VendorUserAccount;
  records: ThreeWayAuditRecord[];
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorThreeWayAuditView: React.FC<VendorThreeWayAuditViewProps> = ({
  currentVendor,
  records,
  onToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PERFECT_MATCH' | 'MINOR_DISCREPANCY' | 'AUDIT_ALERT'>('ALL');
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<ThreeWayAuditRecord | null>(null);

  const filteredRecords = records.filter(r => {
    const matchSearch = 
      r.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.auditStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const perfectMatchCount = records.filter(r => r.auditStatus === 'PERFECT_MATCH').length;
  const discrepancyCount = records.filter(r => r.auditStatus === 'MINOR_DISCREPANCY').length;
  const alertCount = records.filter(r => r.auditStatus === 'AUDIT_ALERT').length;
  const totalAuditedAmount = records.reduce((acc, cur) => acc + cur.invoiceAmount, 0);

  const handleExportAuditPaper = (record: ThreeWayAuditRecord) => {
    onToast(`已成功导出工单【${record.workOrderId}】的三单交叉勾稽业财审计底稿 (PDF格式)`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">已审定发票总额</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">
            ¥{totalAuditedAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">已全部完成金税控真实性核验</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">三单完全一致</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600">
            {perfectMatchCount} <span className="text-xs font-normal text-slate-500">项合规</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">发票/报价/维修报告 0差额</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">轻微差异/补充签认</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600">
            {discrepancyCount} <span className="text-xs font-normal text-slate-500">项</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">含加急运费/税差补充联签</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">勾稽通过率</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-indigo-600">
            {records.length > 0 ? ((perfectMatchCount / records.length) * 100).toFixed(1) : '100'}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">符合公立医院财务内控审计规范</div>
        </div>
      </div>

      {/* 控制栏 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索设备名称、工单号、发票号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              全部 ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('PERFECT_MATCH')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'PERFECT_MATCH' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              完全一致 ({perfectMatchCount})
            </button>
            <button
              onClick={() => setStatusFilter('MINOR_DISCREPANCY')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'MINOR_DISCREPANCY' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              轻微差异 ({discrepancyCount})
            </button>
          </div>
        </div>
      </div>

      {/* 勾稽卡片网格列表 */}
      <div className="space-y-3.5">
        {filteredRecords.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-4.5 hover:shadow-sm transition"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.auditStatus === 'PERFECT_MATCH' 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{item.equipmentName}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {item.equipmentDept}
                    </span>
                    {item.auditStatus === 'PERFECT_MATCH' ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        三单勾稽一致
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        差异差额: ¥{item.discrepancyAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                    <span>协同单号: {item.orderId}</span>
                    <span>•</span>
                    <span>医院工单: {item.workOrderId}</span>
                    <span>•</span>
                    <span>底稿编号: {item.complianceDocNo}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedAuditRecord(item)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>查看勾稽明细</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportAuditPaper(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>导出审计底稿</span>
                </button>
              </div>
            </div>

            {/* 三单金额对比条 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3.5 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs">
              <div className="flex items-center justify-between sm:border-r sm:border-slate-200 sm:pr-3">
                <span className="text-slate-500">1. 审定报价单总额:</span>
                <span className="font-bold font-mono text-slate-900">
                  ¥{item.quotationAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between sm:border-r sm:border-slate-200 sm:pr-3">
                <span className="text-slate-500">2. 维修报告配件耗材:</span>
                <span className="font-bold font-mono text-slate-900">
                  ¥{item.reportPartsAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">3. 增值税发票价税合计:</span>
                <span className={`font-bold font-mono ${item.discrepancyAmount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  ¥{item.invoiceAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* 核验要素预览 */}
            <div className="space-y-1.5">
              {item.itemsCheck.map((chk, idx) => (
                <div key={idx} className="flex items-start justify-between text-xs py-1 border-b border-dashed border-slate-100 last:border-0">
                  <div className="flex items-center gap-2">
                    {chk.status === 'PASS' ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] shrink-0">!</span>
                    )}
                    <span className="font-medium text-slate-700">{chk.ruleName}</span>
                  </div>
                  <div className="text-right text-slate-500 text-[11px] truncate max-w-[50%]">
                    <span className="font-mono text-slate-700 font-semibold">{chk.actualValue}</span>
                    <span className="text-slate-400 ml-1.5">({chk.remark})</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>核验责任人: <strong className="text-slate-600">{item.auditorName}</strong></span>
              <span>核验时间: {item.auditedAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 详细勾稽模态框 */}
      {selectedAuditRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  三单勾稽详细核验底稿 ({selectedAuditRecord.complianceDocNo})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditRecord(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 space-y-1">
                <div className="font-bold text-blue-900 text-sm">{selectedAuditRecord.equipmentName}</div>
                <div className="text-blue-700 text-xs">
                  使用科室: {selectedAuditRecord.equipmentDept} • 协同工单: {selectedAuditRecord.orderId} • 医院报修号: {selectedAuditRecord.workOrderId}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">业财三大核心单据对照数据</h4>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[11px] text-slate-400">已审定报价单总额</div>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                      ¥{selectedAuditRecord.quotationAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[11px] text-slate-400">现场维修报告核准</div>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-1">
                      ¥{selectedAuditRecord.reportPartsAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="text-[11px] text-slate-400">发票价税合计</div>
                    <div className={`text-sm font-bold font-mono mt-1 ${selectedAuditRecord.discrepancyAmount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      ¥{selectedAuditRecord.invoiceAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">审计指标规则校验清单</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {selectedAuditRecord.itemsCheck.map((chk, i) => (
                    <div key={i} className="p-3 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{chk.ruleName}</span>
                        {chk.status === 'PASS' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">校验一致 PASS</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">补充签认 WARN</span>
                        )}
                      </div>
                      <div className="text-slate-500 flex items-center justify-between text-[11px]">
                        <span>实际记录: <strong className="text-slate-700">{chk.actualValue}</strong></span>
                        <span>标准基准: {chk.standardValue}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] bg-slate-50 p-1.5 rounded">
                        审计意见: {chk.remark}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-slate-400 text-[11px]">
                <span>核验人员: {selectedAuditRecord.auditorName}</span>
                <span>核准时间: {selectedAuditRecord.auditedAt}</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSelectedAuditRecord(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  handleExportAuditPaper(selectedAuditRecord);
                  setSelectedAuditRecord(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>立即打印审计底稿</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
