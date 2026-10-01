import React, { useState } from 'react';
import { 
  X, 
  FileSignature, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  Download, 
  Printer,
  Stamp
} from 'lucide-react';
import { ReturnFactoryRepairOrder, OnlineRepairContract } from '../../types/factoryRepairTypes';

interface ContractSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReturnFactoryRepairOrder;
  onConfirmSignPartyA: () => void;
  onConfirmSignPartyB: () => void;
}

export const ContractSigningModal: React.FC<ContractSigningModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmSignPartyA,
  onConfirmSignPartyB
}) => {
  const contract = order.contract;
  const [activeTab, setActiveTab] = useState<'preview' | 'audit'>('preview');

  if (!isOpen) return null;

  const isFullySigned = contract.status === 'fully_signed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部标题栏 */}
        <div className="px-8 py-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold shadow-xs">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-indigo-700 tracking-wider font-mono">
                合同编号: {contract.contractNo}
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {contract.contractTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 合同正文 */}
        <div className="p-8 space-y-6 text-xs text-slate-800 max-h-[72vh] overflow-y-auto font-sans leading-relaxed">
          {/* 合同双方 */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-slate-500 text-[11px]">甲方 (发包与使用方)</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{contract.partyA}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                法定代表人/授权代表：刘志刚 (院长) / 崔伟 (设备科)
              </div>
              <div className="text-[11px] text-slate-500">使用科室：麻醉手术科 (黄晓彤 护士长)</div>
            </div>

            <div>
              <div className="font-bold text-slate-500 text-[11px]">乙方 (技术维修服务方)</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{contract.partyB}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                华东技术服务中心 · 原厂资深工程师：李海明
              </div>
              <div className="text-[11px] text-slate-500">服务资质：原厂医疗器械维修许可认证 (Wolf-Cert-2026)</div>
            </div>
          </div>

          {/* 合同核心条款 */}
          <div className="space-y-4 border-t border-b border-slate-200 py-4">
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">第一条 服务标的与维修范围</h4>
              <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded border border-slate-100">
                1.1 维修标的：{contract.equipmentSubject}。<br />
                1.2 技术指标：依据甲乙双方平台联合议价结果，乙方负责实施：{contract.repairScopeSummary}，修复后光学分辨率、光轴同轴度、耐134℃高温灭菌气密性完全达到德国原厂出厂标准。
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">第二条 合同价款与支付结算规程</h4>
              <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded border border-slate-100">
                2.1 经四方透明共同议价定标，本合同大修总包干费用为：
                <span className="font-bold text-rose-700 font-mono text-sm px-1.5">
                  ¥{contract.agreedAmount.toLocaleString()}.00 元
                </span>
                （人民币大写：壹万肆仟贰佰元整），费用已包含全部原装进口配件费、工时费、往返特快保价物流及13%增值税专用发票。<br />
                2.2 支付结算条件：{contract.paymentTermClause}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-1">第三条 质量保证与售后承诺</h4>
              <p className="text-slate-600 bg-slate-50/50 p-2.5 rounded border border-slate-100">
                3.1 质保期限：{contract.warrantyPeriodClause}<br />
                3.2 质保期内如因正常高温灭菌或手术使用发生透镜渗水、发雾或胶层脱落，乙方提供免费再次翻修或整镜置换，并承担往返物流费用。
              </p>
            </div>
          </div>

          {/* 双方法人电子签章区 */}
          <div className="grid grid-cols-2 gap-8 pt-2">
            {/* 甲方签章 */}
            <div className="relative p-5 rounded-xl border border-slate-200 bg-slate-50/30 text-center">
              <div className="text-xs font-bold text-slate-700 mb-2">甲方电子印鉴与签批</div>
              
              {contract.partyASigned ? (
                <div className="relative py-4 flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-2 border-rose-600 flex items-center justify-center text-rose-600 font-bold text-xs p-2 text-center rotate-[-8deg] shadow-xs select-none">
                    <div>
                      <div className="text-[10px] leading-tight font-serif">五莲县人民医院</div>
                      <div className="text-[14px] my-0.5">★</div>
                      <div className="text-[9px] leading-tight">合同专用章 (电子)</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">
                    签署时间: {contract.partyASignatureDate || '2026-09-23 09:30'}
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <button
                    type="button"
                    onClick={onConfirmSignPartyA}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 mx-auto"
                  >
                    <Stamp className="w-4 h-4" />
                    <span>加盖医院合同公章 (甲方)</span>
                  </button>
                </div>
              )}
            </div>

            {/* 乙方签章 */}
            <div className="relative p-5 rounded-xl border border-slate-200 bg-slate-50/30 text-center">
              <div className="text-xs font-bold text-slate-700 mb-2">乙方电子印鉴与签批</div>
              
              {contract.partyBSigned ? (
                <div className="relative py-4 flex flex-col items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-2 border-rose-700 flex items-center justify-center text-rose-700 font-bold text-xs p-2 text-center rotate-[6deg] shadow-xs select-none">
                    <div>
                      <div className="text-[10px] leading-tight font-serif">德国狼牌技术服务中心</div>
                      <div className="text-[14px] my-0.5">★</div>
                      <div className="text-[9px] leading-tight">技术维保专用章</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-2">
                    签署时间: {contract.partyBSignatureDate || '2026-09-23 09:45'}
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <button
                    type="button"
                    onClick={onConfirmSignPartyB}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 mx-auto"
                  >
                    <Stamp className="w-4 h-4" />
                    <span>加盖厂家印章 (乙方)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {isFullySigned ? (
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                双方法定电子签章已完成，合同具有完全法律约束力，厂家正式进入大修作业
              </span>
            ) : (
              <span>等待双方法人电子签章完成...</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
