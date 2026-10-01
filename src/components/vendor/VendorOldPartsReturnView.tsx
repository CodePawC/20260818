import React, { useState } from 'react';
import { 
  Package, Search, Filter, QrCode, CheckCircle2, 
  Clock, AlertCircle, Printer, Download, Plus, Check,
  ShieldCheck, ArrowRight, Barcode, Warehouse, Eye
} from 'lucide-react';
import { OldPartReturnRecord, VendorUserAccount } from '../../types/vendorCollaborationTypes';

interface VendorOldPartsReturnViewProps {
  currentVendor: VendorUserAccount;
  records: OldPartReturnRecord[];
  onUpdateRecords: (records: OldPartReturnRecord[]) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorOldPartsReturnView: React.FC<VendorOldPartsReturnViewProps> = ({
  currentVendor,
  records,
  onUpdateRecords,
  onToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_RETURN' | 'WAREHOUSE_RECEIVED'>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<OldPartReturnRecord | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturnItem, setActiveReturnItem] = useState<OldPartReturnRecord | null>(null);
  const [receiverName, setReceiverName] = useState('医院器材科仓管员');
  const [shelfLoc, setShelfLoc] = useState('A区旧件库-02架');

  const filteredRecords = records.filter(r => {
    const matchSearch = 
      r.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.oldPartBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.returnStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = records.filter(r => r.returnStatus === 'PENDING_RETURN').length;
  const receivedCount = records.filter(r => r.returnStatus === 'WAREHOUSE_RECEIVED').length;

  const handleConfirmReturn = () => {
    if (!activeReturnItem) return;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const updated = records.map(item => {
      if (item.id === activeReturnItem.id) {
        return {
          ...item,
          returnStatus: 'WAREHOUSE_RECEIVED' as const,
          returnDate: formattedDate,
          receiverStaffName: receiverName,
          shelfLocation: shelfLoc
        };
      }
      return item;
    });

    onUpdateRecords(updated);
    setShowReturnModal(false);
    setActiveReturnItem(null);
    onToast(`旧件条码【${activeReturnItem.oldPartBarcode}】已成功交接验收入库！`, 'success');
  };

  const handlePrintBarcodeTag = (record: OldPartReturnRecord) => {
    onToast(`已发送打印指令：打印旧件铅封防伪条形码【${record.oldPartBarcode}】`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">已登记旧件总数</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900">
            {records.length} <span className="text-xs font-normal text-slate-500">件</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">大修换件一律实行100%原样退库</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">已入库铅封留存</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600">
            {receivedCount} <span className="text-xs font-normal text-slate-500">件</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">已通过仓管员条码实物核销</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">待现场交接退库</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600">
            {pendingCount} <span className="text-xs font-normal text-slate-500">件待办</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">维保完工48小时内须完成退库</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">防伪铅封合规率</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-indigo-600">
            100%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">一机一码，防止配件流失</div>
        </div>
      </div>

      {/* 搜索与过滤工具栏 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索设备、旧件名称、条形码、序列号..."
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
              onClick={() => setStatusFilter('PENDING_RETURN')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'PENDING_RETURN' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              待退库 ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('WAREHOUSE_RECEIVED')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'WAREHOUSE_RECEIVED' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              已验收入库 ({receivedCount})
            </button>
          </div>
        </div>
      </div>

      {/* 旧件卡片列表 */}
      <div className="space-y-3.5">
        {filteredRecords.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-4.5 hover:shadow-sm transition"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.returnStatus === 'WAREHOUSE_RECEIVED'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{item.partName}</h3>
                    {item.returnStatus === 'WAREHOUSE_RECEIVED' ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        已验收入库
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        待现场退库
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    对应维修设备: <strong className="text-slate-700">{item.equipmentName}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintBarcodeTag(item)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Barcode className="w-3.5 h-3.5 text-blue-600" />
                  <span>打印防伪条码</span>
                </button>
                {item.returnStatus === 'PENDING_RETURN' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReturnItem(item);
                      setShowReturnModal(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>办理交接退库</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>入库凭证</span>
                  </button>
                )}
              </div>
            </div>

            {/* 条码与入库详细数据 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">旧件防伪条形码</span>
                <span className="font-bold text-slate-800">{item.oldPartBarcode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">出厂原序列号 (SN)</span>
                <span className="font-bold text-slate-800">{item.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">铅封编码</span>
                <span className="font-bold text-slate-800">{item.securitySealCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">更换下线日期</span>
                <span className="font-bold text-slate-800">{item.replacedDate}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-white border border-dashed border-slate-200 p-2.5 rounded-lg">
              <span className="font-semibold text-slate-700">损坏下线原因/检测表象: </span>
              {item.faultSymptom}
            </div>

            {item.returnStatus === 'WAREHOUSE_RECEIVED' && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                <span>入库仓库: <strong className="text-slate-700">{item.receivedWarehouse}</strong></span>
                <span>货位位置: <strong className="text-slate-700">{item.shelfLocation}</strong></span>
                <span>签收经办: <strong className="text-slate-700">{item.receiverStaffName}</strong></span>
                <span>退库时间: {item.returnDate}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 办理退库模态框 */}
      {showReturnModal && activeReturnItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">旧件扫码退库交接确认</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                <div className="font-bold text-blue-900">{activeReturnItem.partName}</div>
                <div className="text-blue-700 font-mono text-[11px]">
                  条形码: {activeReturnItem.oldPartBarcode} • SN: {activeReturnItem.serialNumber}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">接收仓库</label>
                <input
                  type="text"
                  disabled
                  value={activeReturnItem.receivedWarehouse}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">存放货位/封存区</label>
                <input
                  type="text"
                  value={shelfLoc}
                  onChange={(e) => setShelfLoc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">医院签收仓管/经办人</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
                根据公立医院设备管理规定，旧配件核验无误入库后，自动与外协工单结算流程勾稽，方可进入财务请款审批阶段。
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-100 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>确认入库并生成签收单</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
