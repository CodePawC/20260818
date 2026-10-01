import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Receipt, 
  Sparkles, 
  Building2, 
  Calendar, 
  DollarSign, 
  HelpCircle,
  FileCheck,
  ShieldCheck,
  Upload
} from 'lucide-react';
import { 
  MonthlyFrameworkBatch, 
  MonthlyFrameworkItem, 
  FrameworkBatchInvoice 
} from '../types/vendorCollaborationTypes';
import { parseTsvFrameworkItems, recalculateBatchTotals } from '../utils/monthlyFrameworkData';

interface MonthlyFrameworkBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch?: MonthlyFrameworkBatch;
  currentBatch?: MonthlyFrameworkBatch;
  onSaveBatch: (updatedBatch: MonthlyFrameworkBatch) => void;
  mode?: 'TSV_IMPORT' | 'SINGLE_ITEM' | 'INVOICE_BINDING';
  initialMode?: 'TSV_IMPORT' | 'SINGLE_ITEM' | 'INVOICE_BINDING';
}

const COMMON_DEPARTMENTS = [
  '麻醉手术科', '动力设备层', '影像科', '消毒供应室', '急救站', 
  '急诊监护室', '彩超科', '彩超室', '财务科', '康复科', 
  '口腔科', '高压氧舱', '骨一科', '内分泌科', '普外一科', 
  '医用气站', '气站', '创伤外科', '妇产科', '作风办'
];

export const MonthlyFrameworkBatchModal: React.FC<MonthlyFrameworkBatchModalProps> = ({
  isOpen,
  onClose,
  batch: propBatch,
  currentBatch: propCurrentBatch,
  onSaveBatch,
  mode,
  initialMode
}) => {
  const batch = propBatch || propCurrentBatch;
  const effectiveMode = mode || initialMode || 'TSV_IMPORT';
  const [activeTab, setActiveTab] = useState<'TSV_IMPORT' | 'SINGLE_ITEM' | 'INVOICE_BINDING'>(effectiveMode);

  // 当打开弹窗或传入模式改变时，同步当前激活 Tab
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(effectiveMode);
    }
  }, [effectiveMode, isOpen]);

  // 1. 批量文本 / TSV 导入状态
  const [tsvText, setTsvText] = useState('');
  const [previewItems, setPreviewItems] = useState<MonthlyFrameworkItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsed, setParsed] = useState(false);

  // 2. 单笔项目表单状态
  const [singleItemName, setSingleItemName] = useState('');
  const [singleUnit, setSingleUnit] = useState('台');
  const [singleQuantity, setSingleQuantity] = useState(1);
  const [singleUnitPrice, setSingleUnitPrice] = useState<number>(200);
  const [singleDept, setSingleDept] = useState('麻醉手术科');
  const [singleDate, setSingleDate] = useState(() => 
    batch ? `${batch.yearMonth.replace('-', '/')}/15` : '2026/08/15'
  );
  const [singleEngineer, setSingleEngineer] = useState('驻场维保工程师');
  const [singleSignee, setSingleSignee] = useState('科室护士长/技师长');
  const [singleOldPartsReturned, setSingleOldPartsReturned] = useState(true);
  const [singleNotes, setSingleNotes] = useState('');
  const [singleSavedSuccessTip, setSingleSavedSuccessTip] = useState(false);

  // 同步批次日期
  React.useEffect(() => {
    if (batch?.yearMonth) {
      setSingleDate(`${batch.yearMonth.replace('-', '/')}/15`);
    }
  }, [batch?.yearMonth, isOpen]);

  // 3. 发票与金税销货清单绑定状态
  const [invType, setInvType] = useState<'SPECIAL_VAT' | 'NORMAL_VAT' | 'ELECTRONIC_VAT'>(
    batch?.invoiceRecord?.invoiceType || 'SPECIAL_VAT'
  );
  const [invCode, setInvCode] = useState(batch?.invoiceRecord?.invoiceCode || '044002200111');
  const [invNo, setInvNo] = useState(batch?.invoiceRecord?.invoiceNo || '6829' + Math.floor(1000 + Math.random() * 9000));
  const [invAmount, setInvAmount] = useState<number>(batch?.invoiceRecord?.invoiceAmount || batch?.totalAmount || 0);
  const [invTaxRate, setInvTaxRate] = useState<number>(batch?.invoiceRecord?.taxRate || 13);
  const [invDate, setInvDate] = useState(batch?.invoiceRecord?.invoiceDate || (batch ? `${batch.yearMonth}-28` : '2026-08-28'));
  const [hasTaxSalesList, setHasTaxSalesList] = useState(batch?.invoiceRecord?.hasTaxSalesList ?? true);
  const [taxSalesFileName, setTaxSalesFileName] = useState(
    batch?.invoiceRecord?.taxSalesListFileName || (batch ? `金税税控销货清单_${batch.yearMonth.replace('-', '')}批次_${batch.itemCount}项明细.pdf` : '金税税控销货清单.pdf')
  );
  const [invoiceFileName, setInvoiceFileName] = useState(
    batch?.invoiceRecord?.invoiceFileName || `增值税专用发票_${invNo}.pdf`
  );

  if (!isOpen || !batch) return null;

  // 试算不含税金额与税额
  const untaxedAmount = parseFloat((invAmount / (1 + invTaxRate / 100)).toFixed(2));
  const taxAmount = parseFloat((invAmount - untaxedAmount).toFixed(2));
  const isAmountMatch = Math.abs(invAmount - batch.totalAmount) < 0.01;

  // 执行文本解析
  const handleParseTsv = () => {
    if (!tsvText.trim()) {
      setParseErrors(['请先粘贴维修项目文本']);
      return;
    }
    const result = parseTsvFrameworkItems(tsvText);
    setPreviewItems(result.items);
    setParseErrors(result.errors);
    setParsed(true);
  };

  // 确认导入批量项目
  const handleConfirmImport = () => {
    if (previewItems.length === 0) return;
    const nextItems = [...batch.items, ...previewItems];
    const updated = recalculateBatchTotals({
      ...batch,
      items: nextItems,
    });
    onSaveBatch(updated);
    onClose();
  };

  // 保存单笔新增项目
  const handleSaveSingleItem = (e: React.FormEvent, andContinue: boolean = false) => {
    e.preventDefault();
    if (!singleItemName.trim()) {
      alert('请填写维修项目名称');
      return;
    }

    const qty = Math.max(1, Number(singleQuantity) || 1);
    const price = Math.max(0, Number(singleUnitPrice) || 0);
    const total = parseFloat((qty * price).toFixed(2));
    
    let auditTag: MonthlyFrameworkItem['auditTag'] = '常规零星维修';
    if (total < 1000) auditTag = '小额直接报销';
    else if (qty > 1) auditTag = '多台合并维保';
    else if (total >= 5000) auditTag = '大额审签特批';

    const cleanDept = singleDept.trim() || '通用科室';
    const cleanEngineer = singleEngineer.trim() || '驻场维保工程师';
    const cleanSigner = singleSignee.trim() || '科室护士长';

    const newItem: MonthlyFrameworkItem = {
      id: `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemName: singleItemName.trim(),
      unit: singleUnit || '台',
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
      department: cleanDept,
      serviceDate: singleDate.trim() || `${batch.yearMonth.replace('-', '/')}/15`,
      status: 'COMPLETED',
      technician: cleanEngineer,
      engineerName: cleanEngineer,
      clinicalSigner: cleanSigner,
      clinicalSignee: cleanSigner,
      workOrderNo: `WO-${batch.yearMonth.replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      oldPartsReturned: singleOldPartsReturned,
      auditTag,
      notes: singleNotes.trim() || '维修方协同门户手工单笔补录'
    };

    const nextItems = [...batch.items, newItem];
    const updated = recalculateBatchTotals({
      ...batch,
      items: nextItems,
    });
    onSaveBatch(updated);

    if (andContinue) {
      // 连续录入模式：重置品名与备注，保留科室/日期/工程师/验收人
      setSingleItemName('');
      setSingleNotes('');
      setSingleUnitPrice(200);
      setSingleQuantity(1);
      setSingleSavedSuccessTip(true);
      setTimeout(() => setSingleSavedSuccessTip(false), 3000);
    } else {
      onClose();
    }
  };

  // 保存发票信息
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceRecord: FrameworkBatchInvoice = {
      invoiceType: invType,
      invoiceCode: invCode.trim(),
      invoiceNo: invNo.trim(),
      invoiceAmount: parseFloat(invAmount.toFixed(2)),
      untaxedAmount,
      taxRate: invTaxRate,
      taxAmount,
      invoiceDate: invDate,
      hasTaxSalesList,
      taxSalesListFileName: taxSalesFileName,
      invoiceFileName: invoiceFileName,
      verificationStatus: isAmountMatch ? 'VERIFIED' : 'DISCREPANCY',
      buyerName: '五莲县人民医院',
      buyerTaxNo: '12371121493820198X',
      sellerName: batch.vendorName,
      sellerTaxNo: '91440101718166542G',
    };

    const updated: MonthlyFrameworkBatch = {
      ...batch,
      invoiceRecord,
    };
    onSaveBatch(updated);
    onClose();
  };

  // 示例TSV快速填入
  const handleInsertSampleTsv = () => {
    const sample = `创伤外科红外特定电磁波治疗仪供电线路检修 项 1 200.00 200.00 创伤外科 2026/9/14
神经外科高速开颅钻微型电机总成抢修 台 1 1800.00 1800.00 麻醉手术科 2026/9/14
洁净手术室排风/回风通道过滤网拆装深层清洗 项 1 280.00 280.00 麻醉手术科 2026/9/12`;
    setTsvText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                月度框架零星维保批次补录与发票绑定
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                  {batch.yearMonth} 批次
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                服务商: {batch.vendorName} · 当前已有 {batch.itemCount} 项维修记录 (¥{batch.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('TSV_IMPORT')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'TSV_IMPORT'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            批量文本 / TSV导入
          </button>
          <button
            onClick={() => setActiveTab('SINGLE_ITEM')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'SINGLE_ITEM'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            单笔维修手工录入
          </button>
          <button
            onClick={() => setActiveTab('INVOICE_BINDING')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'INVOICE_BINDING'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            增值税发票与税控销货清单
            {batch.invoiceRecord ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            ) : null}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TSV BATCH IMPORT */}
          {activeTab === 'TSV_IMPORT' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold mb-1">支持直接粘贴 Excel 表格列或纯文本记录：</div>
                  <p className="text-blue-800">
                    单行格式范例：<code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-blue-900">财务专用工作站主板硬件更换与系统恢复 台 1 190.00 190.00 财务科 2026/8/18</code>
                  </p>
                  <p className="mt-1 text-blue-700">
                    系统将全自动提取项目名称、计量单位、数量、单价、合价、所属使用科室与施工日期，并校验算术乘积是否一致。
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    粘贴待补录数据行（多行支持）：
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertSampleTsv}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    插入范例数据测试
                  </button>
                </div>
                <textarea
                  value={tsvText}
                  onChange={(e) => {
                    setTsvText(e.target.value);
                    setParsed(false);
                  }}
                  rows={6}
                  placeholder={`在此粘贴从Excel或表格复制的数据行，每行一条...\n例如:\n财务专用凭证装订机打孔传动机构维保 台 1 168.00 168.00 财务科 2026/9/2\n创伤外科红外特定电磁波治疗仪供电线路检修 项 1 200.00 200.00 创伤外科 2026/9/14`}
                  className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {tsvText ? `已输入 ${tsvText.split('\n').filter(l => l.trim()).length} 行文本` : '支持制表符 \\t 或多空格分隔'}
                </div>
                <button
                  type="button"
                  onClick={handleParseTsv}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  智能解析校验
                </button>
              </div>

              {parseErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    解析异常提示：
                  </div>
                  {parseErrors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}

              {parsed && previewItems.length > 0 && (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      解析成功！共识别到 {previewItems.length} 项维修记录，合计金额：
                      <span className="text-emerald-700 font-mono text-sm font-extrabold">
                        ¥{previewItems.reduce((s, it) => s + it.totalPrice, 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2 border-b">#</th>
                          <th className="p-2 border-b">项目名称</th>
                          <th className="p-2 border-b">单位</th>
                          <th className="p-2 border-b">数量</th>
                          <th className="p-2 border-b">单价(元)</th>
                          <th className="p-2 border-b">总金额(元)</th>
                          <th className="p-2 border-b">报修科室</th>
                          <th className="p-2 border-b">施工日期</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                        {previewItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-400">{index + 1}</td>
                            <td className="p-2 font-sans font-medium text-slate-800">{item.itemName}</td>
                            <td className="p-2">{item.unit}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2">¥{item.unitPrice.toFixed(2)}</td>
                            <td className="p-2 font-bold text-blue-600">¥{item.totalPrice.toFixed(2)}</td>
                            <td className="p-2 font-sans">{item.department}</td>
                            <td className="p-2 text-slate-500">{item.serviceDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      确认导入到 {batch.yearMonth} 月度框架批次
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SINGLE ITEM MANUAL ENTRY */}
          {activeTab === 'SINGLE_ITEM' && (
            <form onSubmit={(e) => handleSaveSingleItem(e, false)} className="space-y-4">
              {singleSavedSuccessTip && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>已成功新增并归档1笔维修项目！</strong>您可以继续录入下一笔，或点击完成退出。</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium font-mono">
                    当前批次已有 {batch.items.length} 项
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    维修及配件更换项目名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={singleItemName}
                    onChange={(e) => setSingleItemName(e.target.value)}
                    placeholder="例如：腹腔镜气腹机供气回路探漏与维保 / 监护仪主板芯片级维修 / 超声探头声透镜修补"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    报修/使用科室 <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={COMMON_DEPARTMENTS.includes(singleDept) ? singleDept : ''}
                      onChange={(e) => {
                        if (e.target.value) setSingleDept(e.target.value);
                      }}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">快速选择预设科室...</option>
                      {COMMON_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={singleDept}
                      onChange={(e) => setSingleDept(e.target.value)}
                      placeholder="或在此手动输入科室"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    维修施工完成日期 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    placeholder="2026/8/18"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">单位</label>
                    <select
                      value={singleUnit}
                      onChange={(e) => setSingleUnit(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                    >
                      <option value="台">台</option>
                      <option value="项">项</option>
                      <option value="批">批</option>
                      <option value="套">套</option>
                      <option value="次">次</option>
                      <option value="个">个</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">数量</label>
                    <input
                      type="number"
                      min={1}
                      value={singleQuantity}
                      onChange={(e) => setSingleQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">单价 (元)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={singleUnitPrice}
                      onChange={(e) => setSingleUnitPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">计算合计金额 (元)</label>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 font-mono font-bold text-sm flex items-center justify-between">
                    <span>¥{(singleQuantity * singleUnitPrice).toFixed(2)} 元</span>
                    <span className="text-[11px] font-normal text-blue-600">
                      {(singleQuantity * singleUnitPrice) < 1000 ? '小额直接报销' : (singleQuantity * singleUnitPrice) >= 5000 ? '大额审签特批' : '常规零星维修'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">施工服务工程师</label>
                  <input
                    type="text"
                    value={singleEngineer}
                    onChange={(e) => setSingleEngineer(e.target.value)}
                    placeholder="如：张工 / 驻场工程师"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">临床科室试机验收签字人</label>
                  <input
                    type="text"
                    value={singleSignee}
                    onChange={(e) => setSingleSignee(e.target.value)}
                    placeholder="如：李护士长 / 王主任"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="singleOldPartsReturned"
                    checked={singleOldPartsReturned}
                    onChange={(e) => setSingleOldPartsReturned(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="singleOldPartsReturned" className="text-xs text-slate-700 cursor-pointer select-none">
                    <span className="font-bold text-slate-900">换下旧配件原样退库</span>（旧主板、坏损探头、阀门等已交还医工科备件库，满足审计“以旧换新”要求）
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">故障及技术处置备注 (选填)</label>
                  <textarea
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    rows={2}
                    placeholder="简述故障排查方法与更换原配件情况，例如：清洗气路并更换密封O型圈，通气打压测试通过..."
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <div className="text-[11px] text-slate-400">
                  录入后将自动更新当月批次合计金额与项数，并同步核验限价合规。
                </div>
                <div className="flex items-center gap-2 self-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveSingleItem(e, true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200"
                  >
                    保存并继续录入下一笔
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    保存并完成
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: INVOICE & TAX CONTROL SALES LIST BINDING */}
          {activeTab === 'INVOICE_BINDING' && (
            <form onSubmit={handleSaveInvoice} className="space-y-5">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isAmountMatch 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                {isAmountMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-xs mb-1">
                    {isAmountMatch ? '金税防伪销货清单与结算总额校验匹配通过' : '发票金额与本月批次项目总额不一致警告'}
                  </div>
                  <div className="text-xs opacity-90 leading-relaxed">
                    本批次维修项目合计：<span className="font-mono font-bold">¥{batch.totalAmount.toFixed(2)}</span> · 
                    当前发票价税合计：<span className="font-mono font-bold">¥{invAmount.toFixed(2)}</span>
                    {!isAmountMatch && (
                      <span className="ml-2 font-bold text-amber-800">
                        (相差 ¥{Math.abs(invAmount - batch.totalAmount).toFixed(2)} 元，审计要求必须分毫不差)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">发票种类</label>
                  <select
                    value={invType}
                    onChange={(e) => setInvType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="SPECIAL_VAT">增值税专用发票 (可抵扣进项税)</option>
                    <option value="NORMAL_VAT">增值税普通发票</option>
                    <option value="ELECTRONIC_VAT">增值税电子专用发票</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">开票日期</label>
                  <input
                    type="date"
                    required
                    value={invDate}
                    onChange={(e) => setInvDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">发票代码 (12位)</label>
                  <input
                    type="text"
                    required
                    value={invCode}
                    onChange={(e) => setInvCode(e.target.value)}
                    placeholder="044002200111"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">发票号码 (8位)</label>
                  <input
                    type="text"
                    required
                    value={invNo}
                    onChange={(e) => setInvNo(e.target.value)}
                    placeholder="68291044"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">价税合计金额 (元)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={invAmount}
                      onChange={(e) => setInvAmount(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono font-bold text-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setInvAmount(batch.totalAmount)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl whitespace-nowrap"
                    >
                      同批次合计
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">适用增值税税率</label>
                  <select
                    value={invTaxRate}
                    onChange={(e) => setInvTaxRate(parseInt(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                  >
                    <option value={13}>13% (维修备件及安装施工标准税率)</option>
                    <option value={6}>6% (纯现代技术服务业简易征收)</option>
                    <option value={9}>9% (建筑安装简易征收)</option>
                    <option value={0}>0% (免税)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 mb-0.5">不含税金额 (计入医疗成本)</div>
                  <div className="text-sm font-mono font-bold text-slate-800">¥{untaxedAmount.toFixed(2)}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 mb-0.5">应税增值税额 (进项税额)</div>
                  <div className="text-sm font-mono font-bold text-slate-800">¥{taxAmount.toFixed(2)}</div>
                </div>

                <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasTaxSalesList"
                      checked={hasTaxSalesList}
                      onChange={(e) => setHasTaxSalesList(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="hasTaxSalesList" className="text-xs font-bold text-slate-800 cursor-pointer">
                      随票附带由税控金税盘直接打印的《销售货物或者提供应税劳务清单》（含防伪码与逐项明细）
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 ml-7">
                    合规内控要求：因单张发票承载 {batch.itemCount} 项零星维修，发票货物名称打印为“*现代服务*技术服务费(详见销货清单)”，必须附带税务局金税系统直出的清单盖章件，否则财务科不予挂账。
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">发票扫描件文件名</label>
                  <input
                    type="text"
                    value={invoiceFileName}
                    onChange={(e) => setInvoiceFileName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">税控清单扫描件文件名</label>
                  <input
                    type="text"
                    value={taxSalesFileName}
                    onChange={(e) => setTaxSalesFileName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  保存发票与销货清单绑定
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
