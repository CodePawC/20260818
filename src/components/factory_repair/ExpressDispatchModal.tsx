import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  ShieldCheck, 
  Send, 
  Package, 
  Check, 
  Camera, 
  MapPin, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { ReturnFactoryRepairOrder, OutboundLogistics } from '../../types/factoryRepairTypes';

interface ExpressDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReturnFactoryRepairOrder;
  onConfirmDispatch: (logistics: OutboundLogistics) => void;
}

export const ExpressDispatchModal: React.FC<ExpressDispatchModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmDispatch
}) => {
  const [courier, setCourier] = useState(order.outboundLogistics.courierCompany || '顺丰速运 (特快特规专递)');
  const [trackingNo, setTrackingNo] = useState(order.outboundLogistics.trackingNumber || 'SF139820491823');
  const [insuredValue, setInsuredValue] = useState(order.outboundLogistics.insuredValue || 20000);
  const [snMatch, setSnMatch] = useState(order.outboundLogistics.serialNumberMatch);
  const [packagingCondition, setPackagingCondition] = useState(
    order.outboundLogistics.packagingCondition || 
    '专用防震内窥镜消毒盒 + 内置高弹硅胶卡槽 + 外层加厚气泡气柱双瓦楞缓冲箱，已贴贵重精密医疗器械警示标识'
  );
  const [verifierName, setVerifierName] = useState('崔伟 / 孙志强 (医疗设备科)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: OutboundLogistics = {
      ...order.outboundLogistics,
      verifierName,
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      serialNumberMatch: snMatch,
      packagingCondition,
      courierCompany: courier,
      trackingNumber: trackingNo,
      insuredValue: Number(insuredValue),
      shippingDate: new Date().toISOString().split('T')[0],
      status: 'in_transit'
    };
    onConfirmDispatch(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                现场核验取件与一键发送快递
              </h3>
              <p className="text-xs text-slate-500">
                麻醉手术科现场清点封箱 · 顺丰特快一键通知德国狼牌技术中心
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 取件设备快照 */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
            <div>
              <div className="font-bold text-slate-800 text-xs">
                {order.initialFault.equipmentName} ({order.initialFault.equipmentModel})
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                机身钢印号: <span className="font-mono font-semibold text-slate-700">{order.initialFault.equipmentSn}</span> | 资产卡号: <span className="font-mono text-slate-700">{order.initialFault.assetNo}</span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                取件地点: 麻醉手术科 1号楼综合楼8F手术室护士站 (交接人: 黄晓彤 护士长)
              </div>
            </div>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
              院长审批已过
            </span>
          </div>

          {/* 现场核验项 */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">现场防损核验记录</label>
            <div className="p-3 border border-slate-200 rounded-lg space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snMatch}
                  onChange={(e) => setSnMatch(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">
                  实物机身钢印编号与系统台账一致 (RW-20230415-87035)
                </span>
              </label>

              <div>
                <span className="text-slate-500 block mb-1">包装防护规格及封箱状态:</span>
                <textarea
                  rows={2}
                  value={packagingCondition}
                  onChange={(e) => setPackagingCondition(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <span className="text-slate-500 block mb-1">现场交接核验人:</span>
                <input
                  type="text"
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 快递信息 */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">发运快递与保价信息</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block mb-1">承运物流公司</span>
                <input
                  type="text"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold text-slate-800"
                />
              </div>

              <div>
                <span className="text-slate-500 block mb-1">特快快递运单号</span>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-blue-700"
                  placeholder="例如: SF139820491823"
                  required
                />
              </div>

              <div>
                <span className="text-slate-500 block mb-1">精密光学器械保价金额 (元)</span>
                <input
                  type="number"
                  value={insuredValue}
                  onChange={(e) => setInsuredValue(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-bold text-emerald-700"
                />
              </div>

              <div>
                <span className="text-slate-500 block mb-1">厂家收件技术中心</span>
                <div className="p-2 bg-slate-100 rounded text-slate-700 font-semibold truncate">
                  德国狼牌医疗技术服务中心 (李海明)
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>点击“一键发送快递”后，系统将即时向德国狼牌厂家协同工作台推送收件指令与物流单号。</span>
          </div>

          {/* 底部操作 */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>一键发送快递信息并推送厂家</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
