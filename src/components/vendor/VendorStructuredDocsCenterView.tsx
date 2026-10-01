import React, { useState } from 'react';
import { 
  FileSpreadsheet, Upload, Search, Filter, CheckCircle2, 
  AlertTriangle, FileText, Download, Eye, Plus, Trash2, 
  Sparkles, Check, X, Calendar, DollarSign, Building, 
  Wrench, ShieldCheck, Tag, ArrowRight, Layers, Receipt, 
  Maximize2, Printer, Star
} from 'lucide-react';
import { 
  StructuredDocumentRecord, 
  DocumentType, 
  VendorUserAccount, 
  VendorCollaborationOrder 
} from '../../types/vendorCollaborationTypes';

interface VendorStructuredDocsCenterViewProps {
  currentVendor: VendorUserAccount;
  structuredDocs: StructuredDocumentRecord[];
  orders: VendorCollaborationOrder[];
  onAddOrUpdateDoc: (doc: StructuredDocumentRecord) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
  initialUploadType?: 'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION' | null;
}

export const VendorStructuredDocsCenterView: React.FC<VendorStructuredDocsCenterViewProps> = ({
  currentVendor,
  structuredDocs,
  orders,
  onAddOrUpdateDoc,
  onToast,
  initialUploadType = null,
}) => {
  // 选中的上传类型 (发票 / 维修报告 / 报价单)
  const [activeUploadTab, setActiveUploadTab] = useState<'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION'>(
    initialUploadType || 'INVOICE'
  );

  // 统一台账筛选
  const [filterDocType, setFilterDocType] = useState<DocumentType | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDocDetail, setSelectedDocDetail] = useState<StructuredDocumentRecord | null>(null);

  // 上传模态框状态
  const [showUploadModal, setShowUploadModal] = useState<boolean>(Boolean(initialUploadType));

  // ==================== 发票上传表单状态 ====================
  const [invOrderId, setInvOrderId] = useState<string>(orders[0]?.id || 'EXT-202609-001');
  const [invType, setInvType] = useState<'增值税专用发票' | '增值税普通发票' | '数电专用发票'>('增值税专用发票');
  const [invCode, setInvCode] = useState('033002200111');
  const [invNo, setInvNo] = useState(`9982${Math.floor(1000 + Math.random() * 9000)}`);
  const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [invAmount, setInvAmount] = useState<number>(32000);
  const [invTaxRate, setInvTaxRate] = useState<number>(13);
  const [invGoodsName, setInvGoodsName] = useState('医疗设备修理费*磁共振射频驱动组件');
  const [invFileName, setInvFileName] = useState('增值税专用发票_原件扫描.pdf');
  const [invCheckCode, setInvCheckCode] = useState('82103 49021 78401 22904');

  // ==================== 维修报告上传表单状态 ====================
  const [repOrderId, setRepOrderId] = useState<string>(orders[0]?.id || 'EXT-202609-001');
  const [repReportNo, setRepReportNo] = useState(`FSR-${new Date().getFullYear()}09-${Math.floor(100 + Math.random() * 900)}`);
  const [repEngineerName, setRepEngineerName] = useState(currentVendor.contactPerson || '陈伟民');
  const [repEngineerPhone, setRepEngineerPhone] = useState(currentVendor.phone || '13812345678');
  const [repStartTime, setRepStartTime] = useState('2026-09-10 09:00');
  const [repEndTime, setRepEndTime] = useState('2026-09-12 16:30');
  const [repFaultAnalysis, setRepFaultAnalysis] = useState('射频功放驱动模块高压电容受潮击穿，导致输出脉冲幅度失真及过流连锁保护报错 ERR-RF-402。');
  const [repMeasures, setRepMeasures] = useState('更换原厂全新射频放大驱动总成，重新调谐高频信噪比，上机试运行24小时正常接诊。');
  const [repPartName, setRepPartName] = useState('原厂射频驱动组件 (PT-88902)');
  const [repOldPartsReturned, setRepOldPartsReturned] = useState(true);
  const [repSignee, setRepSignee] = useState('影像科高主任 (技师长)');
  const [repRating, setRepRating] = useState(5);
  const [repFileName, setRepFileName] = useState('现场工程技术维保完工服务报告单.pdf');

  // ==================== 报价单上传表单状态 ====================
  const [quoOrderId, setQuoOrderId] = useState<string>(orders[0]?.id || 'EXT-202609-001');
  const [quoNo, setQuoNo] = useState(`QUO-${new Date().getFullYear()}09-${Math.floor(10 + Math.random() * 90)}`);
  const [quoLabor, setQuoLabor] = useState<number>(3000);
  const [quoTravel, setQuoTravel] = useState<number>(1000);
  const [quoParts, setQuoParts] = useState([
    { id: '1', name: '原厂射频驱动组件', spec: 'ORIG-SPEC-001', quantity: 1, unitPrice: 28000, warrantyMonths: 12 }
  ]);
  const [quoValidUntil, setQuoValidUntil] = useState('2026-10-31');
  const [quoFileName, setQuoFileName] = useState('盖章医疗设备专项大修详细报价单.pdf');

  // 模拟文件拖拽/选择上传并自动提取结构化数据
  const handleSimulateFileSelect = (file: File, type: 'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION') => {
    if (type === 'INVOICE') {
      setInvFileName(file.name);
      onToast(`已上传发票文件【${file.name}】，AI自动结构化提取完成！`, 'success');
    } else if (type === 'REPAIR_REPORT') {
      setRepFileName(file.name);
      onToast(`已上传服务报告【${file.name}】，AI自动结构化提取完成！`, 'success');
    } else {
      setQuoFileName(file.name);
      onToast(`已上传报价单【${file.name}】，AI自动结构化提取完成！`, 'success');
    }
  };

  // 1. 保存结构化发票
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const untaxed = parseFloat((invAmount / (1 + invTaxRate / 100)).toFixed(2));
    const tax = parseFloat((invAmount - untaxed).toFixed(2));
    const targetOrder = orders.find(o => o.id === invOrderId);

    const newDoc: StructuredDocumentRecord = {
      id: `DOC-INV-${Date.now()}`,
      docType: 'INVOICE',
      docName: `${invType}（${targetOrder?.equipmentName || '维保专项结算'}）`,
      docCode: `${invCode}-${invNo}`,
      associatedOrderId: invOrderId,
      associatedEquipmentName: targetOrder?.equipmentName || '3.0T 超导磁共振系统',
      vendorId: currentVendor.vendorId,
      vendorName: currentVendor.vendorName,
      amount: invAmount,
      parsedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      fileUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&auto=format&fit=crop&q=80',
      fileName: invFileName,
      status: 'VERIFIED',
      summaryTags: [invType, `税率${invTaxRate}%`, `价税合计¥${invAmount.toLocaleString()}`, '查验一致'],
      structuredPayload: {
        invoiceType: invType,
        invoiceCode: invCode,
        invoiceNo: invNo,
        invoiceDate: invDate,
        buyerName: '五莲县人民医院',
        buyerTaxNo: '12371121494532100X',
        sellerName: currentVendor.vendorName,
        sellerTaxNo: currentVendor.creditCode || '91320200607908821B',
        untaxedAmount: untaxed,
        taxRate: invTaxRate,
        taxAmount: tax,
        totalAmount: invAmount,
        checkCode: invCheckCode,
        goodsItems: [
          { name: invGoodsName, spec: '原厂合格品', unit: '项', quantity: 1, unitPrice: untaxed, amount: untaxed, taxRate: `${invTaxRate}%` }
        ],
        verificationStatus: 'VERIFIED',
        verificationMessage: '国家税务总局全国增值税发票查验平台核验：发票代码与号码完全相符，发票真实合法有效。'
      }
    };

    onAddOrUpdateDoc(newDoc);
    setShowUploadModal(false);
    onToast(`✅ 发票【${invNo}】已完成结构化解析并统一归档入库！`, 'success');
  };

  // 2. 保存结构化维修报告
  const handleSaveRepairReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orders.find(o => o.id === repOrderId);

    const newDoc: StructuredDocumentRecord = {
      id: `DOC-REP-${Date.now()}`,
      docType: 'REPAIR_REPORT',
      docName: `现场工程技术维保完工报告（${targetOrder?.equipmentName || '大修设备'}）`,
      docCode: repReportNo,
      associatedOrderId: repOrderId,
      associatedEquipmentName: targetOrder?.equipmentName || '3.0T 超导型超导磁共振系统',
      vendorId: currentVendor.vendorId,
      vendorName: currentVendor.vendorName,
      parsedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
      fileName: repFileName,
      status: 'VERIFIED',
      summaryTags: [`工程师: ${repEngineerName}`, `满意度${repRating}星`, repOldPartsReturned ? '旧件已退库' : '无旧件', '已签字验收'],
      structuredPayload: {
        reportNo: repReportNo,
        engineerName: repEngineerName,
        engineerPhone: repEngineerPhone,
        serviceStartTime: repStartTime,
        serviceEndTime: repEndTime,
        faultPhenomenon: '设备无法正常接诊，报错连锁停机。',
        rootCauseAnalysis: repFaultAnalysis,
        repairMeasures: repMeasures,
        replacedParts: [
          { name: repPartName, quantity: 1, isOriginal: true, returnedOldPart: repOldPartsReturned, warrantyMonths: 12 }
        ],
        oldPartsReturned: repOldPartsReturned,
        clinicalAcceptance: {
          signeeName: repSignee,
          signDate: new Date().toISOString().split('T')[0],
          satisfactionRating: repRating,
          clinicalComment: '工程师现场排查彻底，配件更换后设备参数全部达标，临床接诊恢复正常。'
        }
      }
    };

    onAddOrUpdateDoc(newDoc);
    setShowUploadModal(false);
    onToast(`✅ 现场维保完工报告【${repReportNo}】已完成结构化解析并入库！`, 'success');
  };

  // 3. 保存结构化报价单
  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const partsTotal = quoParts.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0);
    const grandTotal = partsTotal + quoLabor + quoTravel;
    const targetOrder = orders.find(o => o.id === quoOrderId);

    const newDoc: StructuredDocumentRecord = {
      id: `DOC-QUO-${Date.now()}`,
      docType: 'QUOTATION',
      docName: `专项大修盖章明细报价单（${targetOrder?.equipmentName || '大修项目'}）`,
      docCode: quoNo,
      associatedOrderId: quoOrderId,
      associatedEquipmentName: targetOrder?.equipmentName || '3.0T 超导型超导磁共振系统',
      vendorId: currentVendor.vendorId,
      vendorName: currentVendor.vendorName,
      amount: grandTotal,
      parsedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
      fileName: quoFileName,
      status: 'VERIFIED',
      summaryTags: [`总报价¥${grandTotal.toLocaleString()}`, `工时¥${quoLabor}`, `备件${quoParts.length}项`, '盖章正本'],
      structuredPayload: {
        quotationNo: quoNo,
        equipmentName: targetOrder?.equipmentName || '3.0T 超导型超导磁共振系统',
        equipmentSn: targetOrder?.equipmentSerialNo || 'GE-MR-9882103',
        laborCost: quoLabor,
        travelAndTestingCost: quoTravel,
        partsTotal: partsTotal,
        grandTotal: grandTotal,
        validUntil: quoValidUntil,
        partsBreakdown: quoParts,
        terms: '报价含13%增值税与原厂保修期，质保期内备件故障免费调换。'
      }
    };

    onAddOrUpdateDoc(newDoc);
    setShowUploadModal(false);
    onToast(`✅ 维修报价单【${quoNo}】已完成结构化解析并入库！`, 'success');
  };

  // 统一台账数据过滤
  const filteredDocs = structuredDocs.filter(d => {
    const matchesType = filterDocType === 'ALL' || d.docType === filterDocType;
    const matchesKeyword = 
      !searchKeyword ||
      d.docName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      d.docCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (d.associatedOrderId && d.associatedOrderId.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (d.associatedEquipmentName && d.associatedEquipmentName.toLowerCase().includes(searchKeyword.toLowerCase()));

    return matchesType && matchesKeyword;
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 顶部工具栏与统一整理操作 */}
      <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h1 className="text-base font-bold text-slate-900">
              单据上传与结构化数据整理中心
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {structuredDocs.length} 份结构化单据
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            支持发票、维修报告、报价单在线上传与自动解析，所有关键字段统一结构化整理成表
          </p>
        </div>

        {/* 快速上传三类单据按钮群 */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveUploadTab('QUOTATION');
              setShowUploadModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>上传报价单</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveUploadTab('REPAIR_REPORT');
              setShowUploadModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>上传维修完工报告</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveUploadTab('INVOICE');
              setShowUploadModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>上传增值税发票</span>
          </button>
        </div>
      </div>

      {/* 搜索与多维度单据筛选栏 */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索单据名称、编号、关联工单、设备..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            {[
              { id: 'ALL', label: '全部单据' },
              { id: 'INVOICE', label: '增值税发票' },
              { id: 'REPAIR_REPORT', label: '维修报告' },
              { id: 'QUOTATION', label: '报价单' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterDocType(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterDocType === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>共找到 <strong className="font-mono text-slate-800">{filteredDocs.length}</strong> 条结构化记录</span>
          <button
            type="button"
            onClick={() => onToast('已导出当前结构化单据台账为 Excel/CSV 报表！')}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>导出结构化台账</span>
          </button>
        </div>
      </div>

      {/* 结构化统一台账表格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">单据类型</th>
                  <th className="py-3 px-4 font-semibold">单据名称 / 编号</th>
                  <th className="py-3 px-4 font-semibold">关联工单与设备</th>
                  <th className="py-3 px-4 font-semibold">结构化金额 / 核心信息</th>
                  <th className="py-3 px-4 font-semibold">特征标签</th>
                  <th className="py-3 px-4 font-semibold">录入时间</th>
                  <th className="py-3 px-4 font-semibold">查验状态</th>
                  <th className="py-3 px-4 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      无匹配的结构化单据记录，点击上方按钮即可上传并自动结构化解析
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map(doc => {
                    const isInv = doc.docType === 'INVOICE';
                    const isRep = doc.docType === 'REPAIR_REPORT';
                    const isQuo = doc.docType === 'QUOTATION';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition group">
                        
                        {/* 1. 单据类型 */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                            isInv ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            isRep ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isInv && <Receipt className="w-3.5 h-3.5" />}
                            {isRep && <Wrench className="w-3.5 h-3.5" />}
                            {isQuo && <DollarSign className="w-3.5 h-3.5" />}
                            <span>{isInv ? '增值税发票' : isRep ? '现场维修报告' : '盖章报价单'}</span>
                          </span>
                        </td>

                        {/* 2. 单据名称与编号 */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {doc.docName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            编码: {doc.docCode}
                          </div>
                        </td>

                        {/* 3. 关联工单与设备 */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {doc.associatedEquipmentName || '全院设备'}
                          </div>
                          {doc.associatedOrderId && (
                            <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                              {doc.associatedOrderId}
                            </span>
                          )}
                        </td>

                        {/* 4. 结构化金额 / 核心信息 */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {doc.amount !== undefined ? (
                            <div>
                              <span className="font-mono font-bold text-sm text-slate-900">
                                ¥{doc.amount.toLocaleString()}
                              </span>
                              {isInv && (
                                <div className="text-[10px] text-slate-400">
                                  税额: ¥{doc.structuredPayload.taxAmount?.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-600">
                              <span>工程师: {doc.structuredPayload.engineerName || '已指派'}</span>
                              <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{doc.structuredPayload.clinicalAcceptance?.satisfactionRating || 5}星好评</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 5. 特征标签 */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {doc.summaryTags.map((tag, idx) => (
                              <span key={idx} className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 6. 录入时间 */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {doc.parsedAt}
                        </td>

                        {/* 7. 查验状态 */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>核对一致</span>
                          </span>
                        </td>

                        {/* 8. 操作 */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedDocDetail(doc)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition cursor-pointer"
                          >
                            查看结构化详情
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 单据结构化详情模态框 */}
      {selectedDocDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedDocDetail.docType === 'INVOICE' ? '发票结构化详情' :
                   selectedDocDetail.docType === 'REPAIR_REPORT' ? '维修报告结构化详情' : '报价单结构化详情'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                  {selectedDocDetail.docName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* 核心编号与关联关系 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400">单据识别编码:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedDocDetail.docCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">关联外协工单:</span>
                  <div className="font-mono font-bold text-blue-700 mt-0.5">
                    {selectedDocDetail.associatedOrderId || '全院框架'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">关联标的设备:</span>
                  <div className="font-bold text-slate-900 mt-0.5 truncate">
                    {selectedDocDetail.associatedEquipmentName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">入库与结构化时间:</span>
                  <div className="font-mono text-slate-700 mt-0.5">
                    {selectedDocDetail.parsedAt}
                  </div>
                </div>
              </div>

              {/* 结构化完整字段渲染 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2 font-bold text-slate-700 text-xs flex items-center justify-between">
                  <span>结构化要素解析明细表</span>
                  <span className="text-[10px] text-emerald-600 font-normal">已校验入库</span>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  {selectedDocDetail.docType === 'INVOICE' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><span className="text-slate-400">购买方名称：</span><strong className="text-slate-800">{selectedDocDetail.structuredPayload.buyerName}</strong></div>
                      <div><span className="text-slate-400">购买方税号：</span><strong className="font-mono text-slate-800">{selectedDocDetail.structuredPayload.buyerTaxNo}</strong></div>
                      <div><span className="text-slate-400">销售方名称：</span><strong className="text-slate-800">{selectedDocDetail.structuredPayload.sellerName}</strong></div>
                      <div><span className="text-slate-400">销售方税号：</span><strong className="font-mono text-slate-800">{selectedDocDetail.structuredPayload.sellerTaxNo}</strong></div>
                      <div><span className="text-slate-400">价税合计 (元)：</span><strong className="font-mono text-base text-blue-700">¥{selectedDocDetail.structuredPayload.totalAmount?.toLocaleString()}</strong></div>
                      <div><span className="text-slate-400">不含税金额：</span><strong className="font-mono text-slate-800">¥{selectedDocDetail.structuredPayload.untaxedAmount?.toLocaleString()}</strong></div>
                      <div><span className="text-slate-400">增值税税率与税额：</span><strong className="font-mono text-slate-800">{selectedDocDetail.structuredPayload.taxRate}% (¥{selectedDocDetail.structuredPayload.taxAmount?.toLocaleString()})</strong></div>
                      <div><span className="text-slate-400">金税防伪校验码：</span><strong className="font-mono text-slate-800">{selectedDocDetail.structuredPayload.checkCode}</strong></div>
                    </div>
                  )}

                  {selectedDocDetail.docType === 'REPAIR_REPORT' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-slate-400">施工工程师：</span><strong>{selectedDocDetail.structuredPayload.engineerName}</strong> ({selectedDocDetail.structuredPayload.engineerPhone})</div>
                        <div><span className="text-slate-400">施工时间：</span><strong className="font-mono">{selectedDocDetail.structuredPayload.serviceStartTime} ~ {selectedDocDetail.structuredPayload.serviceEndTime}</strong></div>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 font-bold block mb-1">故障原因诊断：</span>
                        <p className="text-slate-700">{selectedDocDetail.structuredPayload.rootCauseAnalysis}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 font-bold block mb-1">修复实施过程与换件总结：</span>
                        <p className="text-slate-700">{selectedDocDetail.structuredPayload.repairMeasures}</p>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-900">临床使用科室验收签字：</span>
                          <span className="text-emerald-800 ml-1">{selectedDocDetail.structuredPayload.clinicalAcceptance?.signeeName}</span>
                        </div>
                        <span className="font-bold text-emerald-700">满意度评分: 5.0分 (满分)</span>
                      </div>
                    </div>
                  )}

                  {selectedDocDetail.docType === 'QUOTATION' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg">
                        <div><span className="text-slate-400">工时检测费：</span><strong className="font-mono">¥{selectedDocDetail.structuredPayload.laborCost?.toLocaleString()}</strong></div>
                        <div><span className="text-slate-400">差旅调试费：</span><strong className="font-mono">¥{selectedDocDetail.structuredPayload.travelAndTestingCost?.toLocaleString()}</strong></div>
                        <div><span className="text-slate-400">报价总合计：</span><strong className="font-mono text-base text-blue-700">¥{selectedDocDetail.structuredPayload.grandTotal?.toLocaleString()}</strong></div>
                      </div>
                      <div className="font-bold text-slate-700">换件备件明细拆解表：</div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b">
                            <th className="py-2 px-2">配件名称</th>
                            <th className="py-2 px-2">型号</th>
                            <th className="py-2 px-2">数量</th>
                            <th className="py-2 px-2">单价</th>
                            <th className="py-2 px-2">小计</th>
                            <th className="py-2 px-2">质保期</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedDocDetail.structuredPayload.partsBreakdown || []).map((p: any, idx: number) => (
                            <tr key={idx}>
                              <td className="py-2 px-2 font-bold text-slate-800">{p.name}</td>
                              <td className="py-2 px-2 font-mono text-slate-600">{p.spec || p.partNo}</td>
                              <td className="py-2 px-2 font-mono">{p.quantity}</td>
                              <td className="py-2 px-2 font-mono">¥{Number(p.unitPrice).toLocaleString()}</td>
                              <td className="py-2 px-2 font-mono font-bold text-blue-700">¥{Number((p.unitPrice || 0) * (p.quantity || 1)).toLocaleString()}</td>
                              <td className="py-2 px-2">{p.warrantyMonths || 12}个月</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 原始文件下载 */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>原始归档凭证：{selectedDocDetail.fileName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onToast(`已下载原始凭证: ${selectedDocDetail.fileName}`)}
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>下载原始附件</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">五莲县人民医院外协服务商数字档案库统一整理</span>
              <button
                type="button"
                onClick={() => setSelectedDocDetail(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 上传新单据模态框 (包含发票、维修报告、报价单三种类型) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">上传单据并形成结构化数据</h3>
                <p className="text-xs text-slate-500 mt-0.5">上传文件后系统自动提取结构化数据，核对无误后入库</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 三类单据上传Tab切换 */}
            <div className="flex border-b border-slate-200 px-5 pt-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setActiveUploadTab('INVOICE')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeUploadTab === 'INVOICE'
                    ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>1. 增值税发票上传</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveUploadTab('REPAIR_REPORT')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeUploadTab === 'REPAIR_REPORT'
                    ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>2. 现场维修报告上传</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveUploadTab('QUOTATION')}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  activeUploadTab === 'QUOTATION'
                    ? 'border-amber-600 text-amber-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>3. 维修报价单上传</span>
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-5 overflow-y-auto flex-1 text-xs">
              
              {/* 1. 增值税发票上传表单 */}
              {activeUploadTab === 'INVOICE' && (
                <form onSubmit={handleSaveInvoice} className="space-y-4">
                  {/* 文件拖拽上传区 */}
                  <div className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                    <div className="text-slate-700 font-semibold text-xs">
                      拖拽发票文件（PDF / 扫描件）至此，或点击本地选择
                    </div>
                    <p className="text-[11px] text-slate-400">
                      已选文件：<strong className="text-blue-700 font-mono">{invFileName}</strong>
                    </p>
                    <label className="inline-block px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold text-xs shadow-2xs cursor-pointer hover:bg-blue-50">
                      选择发票文件
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleSimulateFileSelect(e.target.files[0], 'INVOICE');
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* 结构化提取表单校验 */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>自动提取的结构化发票要素（可人工校对）：</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">税局查验一致</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">关联工单</label>
                        <select
                          value={invOrderId}
                          onChange={(e) => setInvOrderId(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        >
                          {orders.map(o => (
                            <option key={o.id} value={o.id}>
                              {o.id} - {o.equipmentName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-medium mb-1">发票类型</label>
                        <select
                          value={invType}
                          onChange={(e) => setInvType(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="增值税专用发票">增值税专用发票 (进项可抵扣)</option>
                          <option value="数电专用发票">全电专用发票 (电子专票)</option>
                          <option value="增值税普通发票">增值税普通发票</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">发票代码</label>
                        <input
                          type="text"
                          required
                          value={invCode}
                          onChange={(e) => setInvCode(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">发票号码</label>
                        <input
                          type="text"
                          required
                          value={invNo}
                          onChange={(e) => setInvNo(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs font-bold text-blue-700"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">开票日期</label>
                        <input
                          type="date"
                          required
                          value={invDate}
                          onChange={(e) => setInvDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">价税合计 (元)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={invAmount}
                          onChange={(e) => setInvAmount(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">增值税税率 (%)</label>
                        <select
                          value={invTaxRate}
                          onChange={(e) => setInvTaxRate(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        >
                          <option value={13}>13% (修理修配劳务/备件销售)</option>
                          <option value={6}>6% (现代技术服务/维保运行)</option>
                          <option value={3}>3% (简易征收)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">货物或应税劳务名称</label>
                      <input
                        type="text"
                        value={invGoodsName}
                        onChange={(e) => setInvGoodsName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>确认解析并入库发票</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 2. 现场维修报告上传表单 */}
              {activeUploadTab === 'REPAIR_REPORT' && (
                <form onSubmit={handleSaveRepairReport} className="space-y-4">
                  <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/40 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-emerald-600 mx-auto" />
                    <div className="text-slate-700 font-semibold text-xs">
                      拖拽现场工程师维修服务报告单（PDF / 照片）至此
                    </div>
                    <p className="text-[11px] text-slate-400">
                      已选文件：<strong className="text-emerald-700 font-mono">{repFileName}</strong>
                    </p>
                    <label className="inline-block px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 font-bold text-xs shadow-2xs cursor-pointer hover:bg-emerald-50">
                      选择报告文件
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleSimulateFileSelect(e.target.files[0], 'REPAIR_REPORT');
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">报告单编号</label>
                        <input
                          type="text"
                          required
                          value={repReportNo}
                          onChange={(e) => setRepReportNo(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">施工工程师姓名</label>
                        <input
                          type="text"
                          required
                          value={repEngineerName}
                          onChange={(e) => setRepEngineerName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">联系电话</label>
                        <input
                          type="text"
                          value={repEngineerPhone}
                          onChange={(e) => setRepEngineerPhone(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">故障根本原因排查与分析</label>
                      <textarea
                        rows={2}
                        value={repFaultAnalysis}
                        onChange={(e) => setRepFaultAnalysis(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">维修处理措施与校准调试总结</label>
                      <textarea
                        rows={2}
                        value={repMeasures}
                        onChange={(e) => setRepMeasures(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">更换备件名称与规格</label>
                        <input
                          type="text"
                          value={repPartName}
                          onChange={(e) => setRepPartName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">科室签字验收人</label>
                        <input
                          type="text"
                          value={repSignee}
                          onChange={(e) => setRepSignee(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={repOldPartsReturned}
                          onChange={(e) => setRepOldPartsReturned(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="font-semibold text-slate-700">旧件已如数交还医院医学装备科监管入库</span>
                      </label>

                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <span>满意度:</span>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            onClick={() => setRepRating(star)}
                            className={`w-4 h-4 cursor-pointer ${star <= repRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>确认解析并入库维修报告</span>
                    </button>
                  </div>
                </form>
              )}

              {/* 3. 维修报价单上传表单 */}
              {activeUploadTab === 'QUOTATION' && (
                <form onSubmit={handleSaveQuotation} className="space-y-4">
                  <div className="border-2 border-dashed border-amber-200 bg-amber-50/40 rounded-xl p-4 text-center space-y-2">
                    <Upload className="w-6 h-6 text-amber-600 mx-auto" />
                    <div className="text-slate-700 font-semibold text-xs">
                      拖拽盖章维修报价单（PDF / 扫描件）至此
                    </div>
                    <p className="text-[11px] text-slate-400">
                      已选文件：<strong className="text-amber-700 font-mono">{quoFileName}</strong>
                    </p>
                    <label className="inline-block px-3 py-1.5 rounded-lg bg-white border border-amber-200 text-amber-700 font-bold text-xs shadow-2xs cursor-pointer hover:bg-amber-50">
                      选择报价文件
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleSimulateFileSelect(e.target.files[0], 'QUOTATION');
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">报价单单号</label>
                        <input
                          type="text"
                          required
                          value={quoNo}
                          onChange={(e) => setQuoNo(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">报价有效期至</label>
                        <input
                          type="date"
                          value={quoValidUntil}
                          onChange={(e) => setQuoValidUntil(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">工时服务费 (元)</label>
                        <input
                          type="number"
                          value={quoLabor}
                          onChange={(e) => setQuoLabor(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">差旅与检测费 (元)</label>
                        <input
                          type="number"
                          value={quoTravel}
                          onChange={(e) => setQuoTravel(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* 配件明细拆解 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">拟更换备件明细列表：</span>
                        <button
                          type="button"
                          onClick={() => {
                            setQuoParts(prev => [
                              ...prev,
                              { id: String(Date.now()), name: '补充配件', spec: 'SPEC-NEW', quantity: 1, unitPrice: 2000, warrantyMonths: 12 }
                            ]);
                          }}
                          className="text-blue-600 hover:underline text-[11px] font-semibold cursor-pointer"
                        >
                          + 添加备件行
                        </button>
                      </div>

                      {quoParts.map((part, index) => (
                        <div key={part.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg">
                          <input
                            type="text"
                            placeholder="配件名称"
                            value={part.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuoParts(prev => prev.map((p, i) => i === index ? { ...p, name: val } : p));
                            }}
                            className="col-span-4 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="型号规格"
                            value={part.spec}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuoParts(prev => prev.map((p, i) => i === index ? { ...p, spec: val } : p));
                            }}
                            className="col-span-3 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                          <input
                            type="number"
                            placeholder="单价"
                            value={part.unitPrice}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setQuoParts(prev => prev.map((p, i) => i === index ? { ...p, unitPrice: val } : p));
                            }}
                            className="col-span-4 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                          />
                          {quoParts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setQuoParts(prev => prev.filter((_, i) => i !== index))}
                              className="col-span-1 text-slate-400 hover:text-red-500 cursor-pointer p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                      <span className="text-amber-900 font-medium">结构化计算总报价：</span>
                      <span className="font-mono font-bold text-amber-800 text-sm">
                        ¥{(quoParts.reduce((s, p) => s + p.unitPrice * p.quantity, 0) + quoLabor + quoTravel).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>确认解析并入库报价单</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
