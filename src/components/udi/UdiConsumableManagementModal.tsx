import React, { useState, useMemo } from 'react';
import { 
  Barcode, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Search, 
  Layers, 
  Cpu, 
  RefreshCw, 
  Filter, 
  FileText, 
  Calendar, 
  UserCheck, 
  Tag, 
  Box, 
  Activity, 
  ArrowRight,
  Database,
  Lock,
  Radio,
  FileCheck2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { MedicalEquipment } from '../../types';
import { 
  DedicatedConsumableMaster, 
  HostConsumableBindingRecord, 
  UdiParsedResult,
  ConsumableBindingStatus 
} from '../../types/udiTypes';
import { 
  DEFAULT_DEDICATED_CONSUMABLES, 
  INITIAL_HOST_CONSUMABLE_BINDINGS 
} from '../../utils/udiData';
import { 
  parseUdiBarcode, 
  verifyConsumableHostCompatibility 
} from '../../utils/udiParser';

interface UdiConsumableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: MedicalEquipment[];
  preselectedEquipment?: MedicalEquipment | null;
  onOpenBatchRecallRadar?: (lot?: string) => void;
}

export const UdiConsumableManagementModal: React.FC<UdiConsumableManagementModalProps> = ({
  isOpen,
  onClose,
  equipments,
  preselectedEquipment,
  onOpenBatchRecallRadar
}) => {
  const [activeTab, setActiveTab] = useState<'scan_mount' | 'active_bindings' | 'consumable_catalog'>('scan_mount');
  const [consumables] = useState<DedicatedConsumableMaster[]>(DEFAULT_DEDICATED_CONSUMABLES);
  const [bindings, setBindings] = useState<HostConsumableBindingRecord[]>(INITIAL_HOST_CONSUMABLE_BINDINGS);

  // 扫码输入状态
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    preselectedEquipment ? preselectedEquipment.id : (equipments[0]?.id || '')
  );
  const [selectedConsumableId, setSelectedConsumableId] = useState<string>(consumables[0]?.id || '');
  const [operatorName, setOperatorName] = useState('李秀华 (主管护师)');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 临床病案核销弹窗
  const [verifyingBinding, setVerifyingBinding] = useState<HostConsumableBindingRecord | null>(null);
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientNameInput, setPatientNameInput] = useState('');
  const [caseNoInput, setCaseNoInput] = useState('');

  // 筛选与搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 选中的目标设备与专用耗材
  const targetEquipment = useMemo(() => {
    return equipments.find(e => e.id === selectedEquipmentId) || equipments[0];
  }, [equipments, selectedEquipmentId]);

  const targetConsumable = useMemo(() => {
    return consumables.find(c => c.id === selectedConsumableId) || consumables[0];
  }, [consumables, selectedConsumableId]);

  // UDI 解析结果
  const parsedUdi = useMemo<UdiParsedResult>(() => {
    return parseUdiBarcode(barcodeInput);
  }, [barcodeInput]);

  // 专机专耗白名单配伍校验
  const compatibility = useMemo(() => {
    if (!targetEquipment || !targetConsumable) {
      return { isCompatible: false, matchType: 'strict_mismatch' as const, message: '请选择完整设备与耗材' };
    }
    return verifyConsumableHostCompatibility(targetEquipment, targetConsumable);
  }, [targetEquipment, targetConsumable]);

  if (!isOpen) return null;

  // 快捷填入典型测试 UDI 码
  const loadPresetBarcode = (type: 'olympus' | 'fmc' | 'mindray' | 'expired' | 'mismatch') => {
    if (type === 'olympus') {
      setSelectedConsumableId('CON-OLY-01');
      const gastro = equipments.find(e => e.name.includes('胃镜') || e.name.includes('内镜') || e.model?.includes('290'));
      if (gastro) setSelectedEquipmentId(gastro.id);
      setBarcodeInput('(01)04547628001293(17)280930(10)LOT202607A(21)SN889210');
      showToast('success', '已载入【奥林巴斯活检钳】官方标准 UDI 码！');
    } else if (type === 'fmc') {
      setSelectedConsumableId('CON-FMC-02');
      const dialyzer = equipments.find(e => e.name.includes('透析') || e.model?.includes('5008'));
      if (dialyzer) setSelectedEquipmentId(dialyzer.id);
      setBarcodeInput('(01)04039361008271(17)281115(10)LOT202608B(21)SN552019');
      showToast('success', '已载入【费森尤斯超高通量透析器】GS1 复合条码！');
    } else if (type === 'mindray') {
      setSelectedConsumableId('CON-MR-03');
      const vent = equipments.find(e => e.name.includes('呼吸机') || e.model?.includes('SV'));
      if (vent) setSelectedEquipmentId(vent.id);
      setBarcodeInput('(01)06921478201944(17)280630(10)LOT202606C(21)SN773911');
      showToast('success', '已载入【迈瑞呼吸机专用呼气回路】国家药监 UDI！');
    } else if (type === 'expired') {
      setSelectedConsumableId('CON-PHI-04');
      setBarcodeInput('(01)00884838012398(17)240101(10)LOT202209X(21)SN100021');
      showToast('error', '已载入【过期耗材测试码 (2024到期)】，触发阻断拦截测试！');
    } else if (type === 'mismatch') {
      setSelectedConsumableId('CON-OLY-01');
      // 故意选择呼吸机或监护仪作为目标
      const mismatchEquip = equipments.find(e => e.name.includes('呼吸机') || e.name.includes('监护仪'));
      if (mismatchEquip) setSelectedEquipmentId(mismatchEquip.id);
      setBarcodeInput('(01)04547628001293(17)280930(10)LOT202607A(21)SN889210');
      showToast('error', '已构造【专机错配违规上机】场景（内镜活检钳混用呼吸机）！');
    }
  };

  // 提交挂靠上机
  const handleConfirmBinding = () => {
    if (!parsedUdi.isValid) {
      showToast('error', '条码未通过合规校验，无法挂靠上机！');
      return;
    }
    if (parsedUdi.isExpired) {
      showToast('error', '耗材已超过有效使用期，系统严禁上机！');
      return;
    }
    if (!compatibility.isCompatible && targetConsumable.mandatoryMatch) {
      showToast('error', `配伍阻断：${compatibility.message}`);
      return;
    }

    const newBinding: HostConsumableBindingRecord = {
      id: `BIND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      equipmentId: targetEquipment.id,
      equipmentName: targetEquipment.name,
      equipmentModel: targetEquipment.model || '标准型号',
      equipmentSn: targetEquipment.sn || 'SN-UNKNOWN',
      equipmentInternalNo: targetEquipment.internalNo,
      department: targetEquipment.department || '临床科室',
      room: targetEquipment.location || '住院部病房',
      consumableId: targetConsumable.id,
      consumableName: targetConsumable.name,
      consumableSpec: targetConsumable.spec,
      consumableBrand: targetConsumable.brand,
      di: parsedUdi.di,
      udiCode: parsedUdi.rawCode,
      lotNumber: parsedUdi.lotNumber || 'LOT-AUTO',
      expirationDate: parsedUdi.expirationDate || '2028-12-31',
      serialNumber: parsedUdi.serialNumber,
      bindingTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      operatorName: operatorName,
      operatorRole: '临床主管/专科护士',
      compatibilityResult: compatibility.isCompatible ? 'matched_verified' : 'cross_model_allowed',
      verificationMessage: compatibility.message,
      status: 'in_use'
    };

    setBindings(prev => [newBinding, ...prev]);
    showToast('success', `成功将专用耗材【${targetConsumable.name}】挂靠至设备【${targetEquipment.name}】！`);
    setActiveTab('active_bindings');
    setBarcodeInput('');
  };

  // 临床病案核销提交
  const handleSavePatientConsumption = () => {
    if (!verifyingBinding) return;
    setBindings(prev => prev.map(b => {
      if (b.id === verifyingBinding.id) {
        return {
          ...b,
          status: 'consumed',
          consumedTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
          patientId: patientIdInput || 'ZY-202610-DEFAULT',
          patientName: patientNameInput || '患者已核销',
          caseNo: caseNoInput || 'EMR-2026-AUTO'
        };
      }
      return b;
    }));
    showToast('success', `已成功核销该专机耗材并与病案号【${caseNoInput || patientIdInput}】建立追溯链！`);
    setVerifyingBinding(null);
    setPatientIdInput('');
    setPatientNameInput('');
    setCaseNoInput('');
  };

  // 过滤后的在机绑定台账
  const filteredBindings = bindings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.equipmentName.toLowerCase().includes(q) ||
        b.consumableName.toLowerCase().includes(q) ||
        b.lotNumber.toLowerCase().includes(q) ||
        b.di.toLowerCase().includes(q) ||
        b.department.toLowerCase().includes(q) ||
        (b.patientName && b.patientName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 rounded-none">
        
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-wide text-white">
                  国家 UDI 编码智能解析与专机专耗闭环追溯中心
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/60">
                  NMPA & GS1 生产级标准
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                五莲县人民医院医学装备全生命周期 · 扫码自动解析、专机白名单防错配、病案关联与不良批次穿透
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBatchRecallRadar && (
              <button
                onClick={() => onOpenBatchRecallRadar()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                国家药监召回排查雷达
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 提示条 */}
        {toastMessage && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}>
            <span className="flex items-center gap-2">
              {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {toastMessage.text}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 导航标签卡 */}
        <div className="flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('scan_mount')}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'scan_mount'
                  ? 'border-cyan-500 text-cyan-300 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Barcode className="w-4 h-4" />
              UDI 扫码解析与专机挂靠
            </button>
            <button
              onClick={() => setActiveTab('active_bindings')}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'active_bindings'
                  ? 'border-cyan-500 text-cyan-300 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              全院在机专耗全景台账
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                {bindings.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('consumable_catalog')}
              className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'consumable_catalog'
                  ? 'border-cyan-500 text-cyan-300 bg-slate-800/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              专机专耗白名单标准库
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                {consumables.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            当前操作责任人: <span className="text-slate-200 font-sans">{operatorName}</span>
          </div>
        </div>

        {/* 内容主体 */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
          {activeTab === 'scan_mount' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 左侧：扫码输入与目标选择 */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 快速预置测试条码 */}
                <div className="p-3.5 bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      扫码枪实景模拟预填 (快速验证解析算法与阻断逻辑)
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">GS1-128 / NMPA UDI</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => loadPresetBarcode('olympus')}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      内镜活检钳 (匹配)
                    </button>
                    <button
                      onClick={() => loadPresetBarcode('fmc')}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      血透滤器 (匹配)
                    </button>
                    <button
                      onClick={() => loadPresetBarcode('mindray')}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      呼吸机回路 (匹配)
                    </button>
                    <button
                      onClick={() => loadPresetBarcode('expired')}
                      className="px-2.5 py-1 text-xs bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                    >
                      过期耗材测试 (阻断)
                    </button>
                    <button
                      onClick={() => loadPresetBarcode('mismatch')}
                      className="px-2.5 py-1 text-xs bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors"
                    >
                      跨机型错配 (拦截)
                    </button>
                  </div>
                </div>

                {/* 扫码输入框 */}
                <div className="p-4 bg-slate-900 border border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Barcode className="w-4 h-4 text-cyan-400" />
                        扫描或输入 UDI 一维/二维码原始字符
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">支持扫码枪连续扫入</span>
                    </label>
                    <textarea
                      rows={2}
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="请将条形码对准扫码枪，或粘贴如: (01)04547628001293(17)280930(10)LOT202607A(21)SN889210"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:outline-hidden text-slate-100 placeholder:text-slate-600 rounded-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 目标设备选择 */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        挂靠目标设备 (在册主机)
                      </label>
                      <select
                        value={selectedEquipmentId}
                        onChange={(e) => setSelectedEquipmentId(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-500 focus:outline-hidden rounded-none"
                      >
                        {equipments.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.department} - {e.name} ({e.model || '无型号'}) [{e.id}]
                          </option>
                        ))}
                      </select>
                      {targetEquipment && (
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                          <span>科室: {targetEquipment.department}</span>
                          <span>序列号: {targetEquipment.sn || '-'}</span>
                        </div>
                      )}
                    </div>

                    {/* 目标专机耗材标准品类 */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        对应专机专耗品类
                      </label>
                      <select
                        value={selectedConsumableId}
                        onChange={(e) => setSelectedConsumableId(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-500 focus:outline-hidden rounded-none"
                      >
                        {consumables.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.spec}) [DI: {c.diCode}]
                          </option>
                        ))}
                      </select>
                      {targetConsumable && (
                        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                          <span>品牌: {targetConsumable.brand}</span>
                          <span className="text-cyan-400">单价: ¥{targetConsumable.unitPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 经手责任人 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      上机操作护士 / 临床工程师姓名
                    </label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:border-cyan-500 focus:outline-hidden rounded-none"
                    />
                  </div>
                </div>

                {/* 提交按钮栏 */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-400">
                    {parsedUdi.isValid ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> UDI 编码解析通过
                      </span>
                    ) : (
                      <span className="text-slate-500">待解析输入条码</span>
                    )}
                  </div>
                  <button
                    disabled={!parsedUdi.isValid || parsedUdi.isExpired}
                    onClick={handleConfirmBinding}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 border border-cyan-400 disabled:border-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    确认核验并通过挂靠上机
                  </button>
                </div>
              </div>

              {/* 右侧：实时解析结构与配伍校验卡片 */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* 配伍校验状态指示牌 */}
                <div className={`p-4 border ${
                  !barcodeInput 
                    ? 'bg-slate-900 border-slate-800 text-slate-400'
                    : parsedUdi.isExpired
                    ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                    : compatibility.isCompatible
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                    : 'bg-amber-950/80 border-amber-700 text-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-black/30 border border-current">
                      {!barcodeInput ? (
                        <Radio className="w-5 h-5 text-slate-500" />
                      ) : parsedUdi.isExpired ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      ) : compatibility.isCompatible ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {!barcodeInput ? '等待扫码解析' : parsedUdi.isExpired ? '效期超限阻断' : compatibility.isCompatible ? '专机专耗合规准用' : '配伍校验告警'}
                      </h4>
                      <p className="text-xs mt-1 leading-relaxed">
                        {!barcodeInput 
                          ? '请在左侧输入或模拟扫入 UDI 条码以触发自动匹配与白名单合规检验。'
                          : parsedUdi.isExpired 
                          ? `该批次耗材已于 ${parsedUdi.expirationDate} 过期，国家医疗器械安全法规禁止上机！` 
                          : compatibility.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* UDI 结构化解析字段明细 */}
                <div className="bg-slate-900 border border-slate-800 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-cyan-400" />
                      UDI 结构化要素 (AI 标识符解构)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700">
                      标准: {parsedUdi.standard}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                      <span className="text-slate-400">(01) DI 器械标识:</span>
                      <span className="text-cyan-300 font-semibold">{parsedUdi.di || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                      <span className="text-slate-400">(10) 生产批号 LOT:</span>
                      <span className="text-slate-200">{parsedUdi.lotNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                      <span className="text-slate-400">(17) 有效期至 EXP:</span>
                      <span className={parsedUdi.isExpired ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                        {parsedUdi.expirationDate || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60 font-mono">
                      <span className="text-slate-400">(21) 单件序列号 SN:</span>
                      <span className="text-slate-200">{parsedUdi.serialNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between py-1 font-mono">
                      <span className="text-slate-400">完整条码校验:</span>
                      <span className={parsedUdi.isValid ? 'text-emerald-400' : 'text-slate-500'}>
                        {parsedUdi.isValid ? '通过 (格式合规)' : '未完整'}
                      </span>
                    </div>
                  </div>

                  {parsedUdi.validationErrors && (
                    <div className="mt-3 p-2 bg-rose-950/40 border border-rose-900/60 text-[11px] text-rose-300">
                      {parsedUdi.validationErrors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 专机耗材配伍白名单规则 */}
                {targetConsumable && (
                  <div className="bg-slate-900 border border-slate-800 p-4 text-xs space-y-2">
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 pb-2 border-b border-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      目标专耗配伍白名单规格
                    </div>
                    <div className="text-slate-400">
                      注册证号: <span className="text-slate-200 font-mono">{targetConsumable.registrationNo}</span>
                    </div>
                    <div className="text-slate-400">
                      灭菌与储存: <span className="text-slate-200">{targetConsumable.sterilizationType} · {targetConsumable.storageRequirement}</span>
                    </div>
                    <div className="text-slate-400">
                      适配型号白名单: 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {targetConsumable.compatibleEquipmentModels.map(m => (
                          <span key={m} className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'active_bindings' && (
            <div className="space-y-4">
              {/* 搜索与状态过滤 */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="按设备名称、专用耗材、批号 LOT、DI 或患者姓名快速穿透检索..."
                    className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden rounded-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-none focus:outline-hidden"
                  >
                    <option value="all">全部挂靠状态</option>
                    <option value="in_use">在机运行中 (待消耗)</option>
                    <option value="consumed">已消耗核销 (病案关联)</option>
                    <option value="recalled">批次召回锁定</option>
                  </select>
                </div>
              </div>

              {/* 在机绑定表格 */}
              <div className="border border-slate-800 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-mono">
                      <th className="py-2.5 px-3">绑定单号</th>
                      <th className="py-2.5 px-3">挂靠设备 / 型号</th>
                      <th className="py-2.5 px-3">在用科室</th>
                      <th className="py-2.5 px-3">专用耗材名称 / 规格</th>
                      <th className="py-2.5 px-3">生产批号 LOT</th>
                      <th className="py-2.5 px-3">有效期至</th>
                      <th className="py-2.5 px-3">状态 / 病案号</th>
                      <th className="py-2.5 px-3">上机时间 / 经手人</th>
                      <th className="py-2.5 px-3 text-right">闭环操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-950/60 font-sans">
                    {filteredBindings.map(b => (
                      <tr key={b.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-cyan-400 font-medium whitespace-nowrap">
                          {b.id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-100">{b.equipmentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">型号: {b.equipmentModel}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                          {b.department}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-100 font-medium">{b.consumableName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">DI: {b.di}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-300 font-semibold whitespace-nowrap">
                          {b.lotNumber}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {b.expirationDate}
                        </td>
                        <td className="py-2.5 px-3">
                          {b.status === 'in_use' && (
                            <span className="px-2 py-0.5 text-[11px] bg-cyan-950/80 text-cyan-300 border border-cyan-800 whitespace-nowrap">
                              在机运行中
                            </span>
                          )}
                          {b.status === 'consumed' && (
                            <div>
                              <span className="px-2 py-0.5 text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 whitespace-nowrap">
                                已核销消耗
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                患者: {b.patientName} ({b.caseNo || b.patientId})
                              </div>
                            </div>
                          )}
                          {b.status === 'recalled' && (
                            <span className="px-2 py-0.5 text-[11px] bg-rose-950/80 text-rose-300 border border-rose-800 whitespace-nowrap animate-pulse">
                              已召回封存
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-300 text-[11px]">{b.operatorName}</div>
                          <div className="text-slate-500 font-mono text-[10px]">{b.bindingTime}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {b.status === 'in_use' ? (
                            <button
                              onClick={() => {
                                setVerifyingBinding(b);
                                setPatientIdInput(b.patientId || '');
                                setPatientNameInput(b.patientName || '');
                                setCaseNoInput(b.caseNo || '');
                              }}
                              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
                            >
                              关联病案核销
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500">已闭环</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'consumable_catalog' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consumables.map(c => (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700">
                          {c.category}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1.5">{c.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">{c.spec}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">¥{c.unitPrice}</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                      <div>DI: <span className="text-slate-200">{c.diCode}</span></div>
                      <div>注册证: <span className="text-slate-200 font-sans">{c.registrationNo}</span></div>
                      <div>库存保有: <span className="text-emerald-400 font-bold">{c.stockCount} {c.unit}</span> (预警水位: {c.warningThreshold})</div>
                    </div>

                    <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                      <div className="font-semibold text-slate-300 mb-1">适配主机白名单:</div>
                      <div className="flex flex-wrap gap-1">
                        {c.compatibleEquipmentModels.map(m => (
                          <span key={m} className="px-1 py-0.2 bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 font-mono">生产企业: {c.brand}</span>
                      <button
                        onClick={() => {
                          setSelectedConsumableId(c.id);
                          setActiveTab('scan_mount');
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        挂靠上机 <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 临床核销病案关联小弹窗 */}
        {verifyingBinding && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  专机耗材临床消耗核销 (病案全闭环)
                </h3>
                <button onClick={() => setVerifyingBinding(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 border border-slate-800 font-mono">
                <div>设备: <span className="text-white font-sans">{verifyingBinding.equipmentName}</span></div>
                <div>耗材: <span className="text-cyan-300 font-sans">{verifyingBinding.consumableName}</span></div>
                <div>批号 LOT: <span className="text-amber-300">{verifyingBinding.lotNumber}</span></div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">患者住院号 / 门诊号 *</label>
                  <input
                    type="text"
                    value={patientIdInput}
                    onChange={(e) => setPatientIdInput(e.target.value)}
                    placeholder="如: ZY202610992"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">患者姓名 (支持脱敏) *</label>
                  <input
                    type="text"
                    value={patientNameInput}
                    onChange={(e) => setPatientNameInput(e.target.value)}
                    placeholder="如: 王*平"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">电子病案单号 / 手术记录号</label>
                  <input
                    type="text"
                    value={caseNoInput}
                    onChange={(e) => setCaseNoInput(e.target.value)}
                    placeholder="如: EMR-2026-8812"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setVerifyingBinding(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700"
                >
                  取消
                </button>
                <button
                  onClick={handleSavePatientConsumption}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 cursor-pointer"
                >
                  确认核销并归档
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              国家药监局 UDI 编码解析引擎已就绪
            </span>
            <span className="font-mono text-slate-500">
              GS1-128 / MA / DataMatrix / 专机防错配
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            关闭工作台
          </button>
        </div>

      </div>
    </div>
  );
};
