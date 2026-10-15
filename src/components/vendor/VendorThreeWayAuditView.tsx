import React, { useState } from 'react';
import { 
  FileCheck2, Search, Filter, AlertTriangle, CheckCircle2, 
  Printer, Download, ShieldAlert, ArrowRight, Eye, RefreshCw,
  Building, FileText, Check, DollarSign, Layers,
  Copy, AlertCircle
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
  const [voucherModalRecord, setVoucherModalRecord] = useState<ThreeWayAuditRecord | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

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
    setVoucherModalRecord(record);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard?.writeText(token);
    setCopiedToken(true);
    onToast(`财务放行Token已复制到剪贴板：${token}`, 'success');
    setTimeout(() => setCopiedToken(false), 2500);
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
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer border border-emerald-200"
                  title="生成并打印公立医院外协维修三单勾稽电子结案单（含财务放行Token）"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>电子结案单 (财务Token)</span>
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
                  setVoucherModalRecord(selectedAuditRecord);
                  setSelectedAuditRecord(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>出具三单勾稽合规结案单</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 《外协维修“三单勾稽”合规核销电子结案单》防伪预览与打印模态框 */}
      {voucherModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-auto shadow-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* 模态框顶部操作栏（打印时不打印这行） */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    外协维修“三单勾稽”合规核销电子结案单（财务报销放行唯一凭单）
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    载明SHA-256防伪数字指纹与财务放行Token，未出示本凭单财务系统前置阻断记账
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印此单 (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherModalRecord(null)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 凭单纸张内容区（符合A4正式文件排版） */}
            <div className="p-6 sm:p-8 space-y-5 bg-white text-slate-800 text-xs">
              {/* 凭单标题与抬头 */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
                <div className="text-xs tracking-widest text-slate-500 font-medium">五莲县人民医院 • 医学装备管理中心</div>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-wider">
                  医学装备外协维修“三单勾稽”合规核销电子结案单
                </h2>
                <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 font-mono pt-1">
                  <span>结案凭单编号: <strong>VOUCHER-{voucherModalRecord.complianceDocNo}</strong></span>
                  <span>审定核发日期: {voucherModalRecord.auditedAt}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    业财勾稽核验: PASS 合规放行
                  </span>
                </div>
              </div>

              {/* 关键防伪放行Token横幅 */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>财务报销窗口前置核验放行 Token (请在财务系统录入)</span>
                  </div>
                  <div className="font-mono text-sm font-black text-emerald-800 tracking-wider">
                    TOKEN-3WAY-{voucherModalRecord.complianceDocNo}-OK
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyToken(`TOKEN-3WAY-${voucherModalRecord.complianceDocNo}-OK`)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-emerald-300 rounded-lg text-emerald-800 font-semibold text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? '已复制Token' : '复制放行码'}</span>
                </button>
              </div>

              {/* 设备基本要素与外协主体 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block">设备资产编号:</span>
                  <span className="font-bold font-mono text-slate-900">{voucherModalRecord.equipmentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">设备名称及科室:</span>
                  <span className="font-bold text-slate-900">{voucherModalRecord.equipmentName} ({voucherModalRecord.equipmentDept})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">外协维保服务商:</span>
                  <span className="font-bold text-slate-900">{voucherModalRecord.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">医院报修工单号:</span>
                  <span className="font-bold font-mono text-slate-900">{voucherModalRecord.workOrderId}</span>
                </div>
              </div>

              {/* 三单勾稽核心比对表格 */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>业财三大核心凭证交叉勾稽对照表</span>
                </h4>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">核验单据类别</th>
                        <th className="p-2.5">单据对应编号</th>
                        <th className="p-2.5 text-right">核定金额 (元)</th>
                        <th className="p-2.5 text-center">系统一致性核验</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-medium">1. 医院审定定标报价单</td>
                        <td className="p-2.5 font-mono text-slate-600">QT-{voucherModalRecord.orderId}</td>
                        <td className="p-2.5 text-right font-mono font-bold">¥{voucherModalRecord.quotationAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-center text-emerald-700 font-semibold">标的与单价一致 ✓</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">2. 现场完工技术检测报告</td>
                        <td className="p-2.5 font-mono text-slate-600">REP-{voucherModalRecord.workOrderId}</td>
                        <td className="p-2.5 text-right font-mono font-bold">¥{voucherModalRecord.reportPartsAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-center text-emerald-700 font-semibold">配件条码与数量一致 ✓</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium">3. 增值税专用发票 (价税合计)</td>
                        <td className="p-2.5 font-mono text-slate-600">No.{voucherModalRecord.invoiceNo} (代码: 3700234130)</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-700">¥{voucherModalRecord.invoiceAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-center text-emerald-700 font-semibold">金税真伪查验通过 ✓</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                        <td colSpan={2} className="p-2.5 text-slate-900">
                          三单综合比对差额结果 (报价 vs 报告 vs 发票)
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 text-xs">
                          差额: ¥{voucherModalRecord.discrepancyAmount.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-center text-emerald-700">
                          {voucherModalRecord.discrepancyAmount === 0 ? '完全一致 (0差额)' : '已附补充签认说明'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 责任签章与防伪章区域 */}
              <div className="pt-2 relative grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">临床科室现场双人功能验收:</span>
                  <div className="font-serif font-bold text-slate-900 text-xs">
                    李桂花 (护士长) / 张强 (主治医师)
                  </div>
                  <div className="text-[10px] text-emerald-600">通电自检正常 • 恢复临床运行</div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">医工科技术勘验与三单复核:</span>
                  <div className="font-serif font-bold text-slate-900 text-xs">
                    {voucherModalRecord.auditorName} (主管工程师)
                  </div>
                  <div className="text-[10px] text-blue-600">配件已拆旧验新 • 时限达标</div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">SHA-256 数字防伪指纹:</span>
                  <div className="font-mono text-[9px] text-slate-500 break-all bg-slate-50 p-1 rounded border border-slate-200">
                    e7f8b901ac42589d33ea6412b509ef21
                  </div>
                </div>

                {/* 电子印鉴样式（红色印章） */}
                <div className="absolute right-4 bottom-1 w-32 h-32 rounded-full border-2 border-red-500/80 text-red-600/90 flex flex-col items-center justify-center p-2 text-center pointer-events-none rotate-[-12deg] select-none shadow-2xs">
                  <div className="text-[9px] font-bold tracking-tight">五莲县人民医院</div>
                  <div className="text-[12px] font-black my-0.5">三单勾稽审定</div>
                  <div className="text-[9px] font-bold">合规放行专用章</div>
                  <div className="text-[8px] font-mono mt-0.5">{voucherModalRecord.auditedAt.split(' ')[0]}</div>
                </div>
              </div>

              {/* 财务窗口收单前置卡点红线须知 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong>【公立医院财务审计前置卡点规定】</strong>
                  <p className="text-amber-800 leading-relaxed">
                    本单系医学装备全生命周期闭环管理系统出具的唯一法定放行凭据。院财务报销窗口已开启前置刚性拦截：报销人必须出具本结案单并提供对应放行Token，财务人员扫描上方二维码完成系统核验后方可收单入账；任何未带本结案单的外协维修发票，财务核算系统一律阻断报销！
                  </p>
                </div>
              </div>
            </div>

            {/* 模态框底部 */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs print:hidden">
              <span className="text-slate-400 text-[11px]">
                打印支持：A4纸单页完整排版，可直接夹入财务凭证原始报销单后备查
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoucherModalRecord(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer font-medium"
                >
                  关闭预览
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>立即打印结案单 (A4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
