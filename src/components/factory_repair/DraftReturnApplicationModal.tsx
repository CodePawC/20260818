import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Send, 
  Building2, 
  ShieldAlert, 
  Printer, 
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import { ReturnFactoryRepairOrder, WorkflowRole } from '../../types/factoryRepairTypes';

interface DraftReturnApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ReturnFactoryRepairOrder;
  currentRole: WorkflowRole;
  onConfirmDraftAndPush?: (updatedDraft: any) => void;
}

export const DraftReturnApplicationModal: React.FC<DraftReturnApplicationModalProps> = ({
  isOpen,
  onClose,
  order,
  currentRole,
  onConfirmDraftAndPush
}) => {
  const [title, setTitle] = useState(order.onsiteDraft.draftApplicationTitle);
  const [necessity, setNecessity] = useState(order.onsiteDraft.draftReasonAndNecessity);
  const [vendorName, setVendorName] = useState(order.onsiteDraft.targetVendorName);
  const [vendorContact, setVendorContact] = useState(order.onsiteDraft.targetVendorContact);
  const [costRange, setCostRange] = useState(order.onsiteDraft.estimatedCostRange);
  const [hasPushed, setHasPushed] = useState(order.onsiteDraft.pushedToDepartmentView);

  if (!isOpen) return null;

  const isEditable = currentRole === 'equipment_engineer' && order.currentStage === 'ONSITE_CHECK_DRAFT';

  const handlePushToRoles = () => {
    if (onConfirmDraftAndPush) {
      onConfirmDraftAndPush({
        ...order.onsiteDraft,
        draftApplicationTitle: title,
        draftReasonAndNecessity: necessity,
        targetVendorName: vendorName,
        targetVendorContact: vendorContact,
        estimatedCostRange: costRange,
        pushedToDepartmentView: true
      });
    }
    setHasPushed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部红头公文样式头 */}
        <div className="px-8 pt-6 pb-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-700 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-800 tracking-wider">
                五莲县人民医院 · 医学装备管理呈批公文 [2026] 087号
              </div>
              <h2 className="text-base font-bold text-slate-900">
                医疗器械外协返厂大修呈批报告
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

        {/* 报告正文 (仿真公文纸) */}
        <div className="p-8 space-y-6 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
          {/* 科室同步阅读高亮横幅 */}
          {currentRole === 'clinical_anesthesia' ? (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900 text-xs">
                  麻醉手术科专属通报视角：设备科已完成现场技术勘查并起草返厂申请
                </div>
                <div className="text-emerald-700 text-[11px] mt-0.5">
                  您可以在此完整查看设备科工程师填报的光学损坏技术参数、返厂必要性陈述、选定厂商及预估费用。此呈批件已同步推送给分管院长与刘院长审批。
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-blue-900 text-xs">
                  全流程信息透明共享机制
                </div>
                <div className="text-blue-700 text-[11px] mt-0.5">
                  一键起草后，麻醉手术科（申请科室）、设备科主管、业务分管院长、刘院长四方端均可实时穿透阅读呈批内容。
                </div>
              </div>
            </div>
          )}

          {/* 公文主体信息卡片 */}
          <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-200 bg-white">
            {/* 第一行 */}
            <div className="grid grid-cols-4 divide-x divide-slate-200 bg-slate-50/50">
              <div className="p-2.5 font-bold text-slate-600 bg-slate-100/60">申请科室</div>
              <div className="p-2.5 font-semibold text-slate-900">{order.initialFault.department}</div>
              <div className="p-2.5 font-bold text-slate-600 bg-slate-100/60">报修人/护士长</div>
              <div className="p-2.5 text-slate-800">{order.initialFault.reporterName}</div>
            </div>

            {/* 第二行 */}
            <div className="grid grid-cols-4 divide-x divide-slate-200">
              <div className="p-2.5 font-bold text-slate-600 bg-slate-100/60">设备名称</div>
              <div className="p-2.5 font-bold text-slate-900">{order.initialFault.equipmentName}</div>
              <div className="p-2.5 font-bold text-slate-600 bg-slate-100/60">规格型号</div>
              <div className="p-2.5 text-slate-800 font-mono text-[11px]">{order.initialFault.equipmentModel}</div>
            </div>

            {/* 第三行 */}
            <div className="grid grid-cols-4 divide-x divide-slate-200">
              <div className="p-2.5 font-bold text-slate-600 bg-slate-100/60">机身序列号/资产号</div>
              <div className="p-2.5 text-slate-800 font-mono text-[11px]">
                {order.initialFault.equipmentSn} / {order.initialFault.assetNo}
              </div>
              <div className="p-2.5 font-bold text-slate-600 bg-slate-100/60">原值 / 启用日期</div>
              <div className="p-2.5 text-slate-800">¥168,000.00 / 2023年05月</div>
            </div>

            {/* 呈批标题 */}
            <div className="p-3 bg-slate-50/30">
              <div className="font-bold text-slate-700 mb-1">呈批报告标题</div>
              {isEditable ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <div className="font-bold text-slate-900 text-sm">{title}</div>
              )}
            </div>

            {/* 现场技术检查结论 */}
            <div className="p-3 space-y-2 bg-white">
              <div className="font-bold text-slate-700 flex items-center justify-between">
                <span>现场医工专项技术勘查结果 (设备科: {order.onsiteDraft.inspectorName} {order.onsiteDraft.inspectedAt})</span>
                <span className="text-[11px] font-bold text-rose-700 px-2 py-0.5 rounded bg-rose-50 border border-rose-200">
                  判定结论：无法院内自修 · 须返厂原厂大修
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500">透镜清晰度/视场状态:</span>
                  <span className="font-bold text-rose-700 ml-1.5">严重雾化、进水脱胶、视场泛白</span>
                </div>
                <div>
                  <span className="text-slate-500">冷光源导光束透光率:</span>
                  <span className="font-bold text-amber-700 ml-1.5">实测 38% (断丝率超 30%)</span>
                </div>
                <div>
                  <span className="text-slate-500">内部光学棒镜状态:</span>
                  <span className="font-bold text-rose-700 ml-1.5">HOPKINS柱状棒镜应力性断裂崩口</span>
                </div>
                <div>
                  <span className="text-slate-500">镜鞘与工作通道:</span>
                  <span className="font-bold text-emerald-700 ml-1.5">通畅完好，无形变，可保留外壳</span>
                </div>
              </div>
            </div>

            {/* 返厂必要性与理由 */}
            <div className="p-3 bg-white">
              <div className="font-bold text-slate-700 mb-1">返厂大修必要性与临床紧迫性论证</div>
              {isEditable ? (
                <textarea
                  rows={4}
                  value={necessity}
                  onChange={(e) => setNecessity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                />
              ) : (
                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-2.5 rounded border border-slate-100">
                  {necessity}
                </p>
              )}
            </div>

            {/* 拟选厂商与预估费用 */}
            <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50/50">
              <div className="p-3">
                <div className="font-bold text-slate-700 mb-1">拟定返厂服务商 (原厂授权技术中心)</div>
                {isEditable ? (
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs"
                  />
                ) : (
                  <div className="font-bold text-indigo-900">{vendorName}</div>
                )}
                <div className="text-[11px] text-slate-500 mt-0.5">对接人: {vendorContact}</div>
              </div>

              <div className="p-3">
                <div className="font-bold text-slate-700 mb-1">预估维修费用区间与质保期要求</div>
                {isEditable ? (
                  <input
                    type="text"
                    value={costRange}
                    onChange={(e) => setCostRange(e.target.value)}
                    className="w-full px-2.5 py-1 border border-slate-300 rounded text-xs"
                  />
                ) : (
                  <div className="font-bold text-rose-700 text-sm">{costRange}</div>
                )}
                <div className="text-[11px] text-slate-500 mt-0.5">要求原厂正品配件，整机质保不少于12个月</div>
              </div>
            </div>

            {/* 审批签署链条留痕 (四级会签印章) */}
            <div className="p-4 bg-white">
              <div className="font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>呈批审批会签与印鉴留痕</span>
                <span className="text-[11px] text-slate-400">已完整记录入全院审计台账</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {order.approvalChain.map((node) => (
                  <div
                    key={node.level}
                    className={`p-3 rounded-lg border text-left ${
                      node.status === 'approved' 
                        ? 'bg-emerald-50/40 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-slate-600 mb-1">
                      第{node.level}级 · {node.nodeName}
                    </div>
                    <div className="font-semibold text-slate-800 text-xs">
                      {node.approverName} ({node.approverRole.split('/')[0]})
                    </div>
                    {node.status === 'approved' ? (
                      <div className="mt-2 pt-2 border-t border-emerald-200/60">
                        <div className="text-[11px] text-emerald-800 italic">
                          "{node.approvalOpinion || '同意返厂实施'}"
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-1 font-mono">
                          ✓ 已签署 {node.signedAt?.split(' ')[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-amber-600 font-semibold">
                        ⏳ 待签批
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>麻醉手术科全透明同步已开启，单据哈希已加密存证</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
            >
              关闭
            </button>

            {isEditable && (
              <button
                type="button"
                onClick={handlePushToRoles}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>一键起草并推送到麻醉手术科与院领导处</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
