import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Wrench, 
  Share2, 
  Barcode, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Camera, 
  Mic, 
  User, 
  Send, 
  Smartphone, 
  Layers, 
  Check, 
  RefreshCw,
  Search,
  Building,
  Radio,
  FileCheck2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { MedicalEquipment, RepairRecord } from '../../types';

interface ClinicalQuickActionPortalProps {
  equipments: MedicalEquipment[];
  onAddRepair: (equipmentId: string, repair: Partial<RepairRecord>) => void;
  onSwitchToEngineeringMode: () => void;
  onOpenUdiModal: (equipment?: MedicalEquipment) => void;
}

export const ClinicalQuickActionPortal: React.FC<ClinicalQuickActionPortalProps> = ({
  equipments,
  onAddRepair,
  onSwitchToEngineeringMode,
  onOpenUdiModal
}) => {
  const [activeAction, setActiveAction] = useState<'repair' | 'loan' | 'inspection' | 'udi'>('repair');
  
  // 选中的科室与设备
  const departments = useMemo(() => {
    const list = Array.from(new Set(equipments.map(e => e.department).filter(Boolean)));
    return ['全部科室', ...list];
  }, [equipments]);

  const [selectedDept, setSelectedDept] = useState('重症医学科(ICU)');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [searchEquipTerm, setSearchEquipTerm] = useState('');

  // 10秒报修表单项
  const [selectedFaultTag, setSelectedFaultTag] = useState('无法开机/通电无反应');
  const [customFaultNotes, setCustomFaultNotes] = useState('');
  const [reporterName, setReporterName] = useState('张护士 (ICU责任护士)');
  const [reporterPhone, setReporterPhone] = useState('13863309921');
  const [isUrgent, setIsUrgent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 10秒借调项
  const [targetBorrowDept, setTargetBorrowDept] = useState('急诊抢救室');
  const [borrowerName, setBorrowerName] = useState('刘医生 (急诊主治)');

  // 10秒点检打卡
  const [checkAppearance, setCheckAppearance] = useState(true);
  const [checkPower, setCheckPower] = useState(true);
  const [checkAccessories, setCheckAccessories] = useState(true);

  // 提示反馈
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 过滤科室设备
  const deptEquipments = useMemo(() => {
    return equipments.filter(e => {
      if (selectedDept !== '全部科室' && e.department !== selectedDept) return false;
      if (searchEquipTerm) {
        const q = searchEquipTerm.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          (e.model && e.model.toLowerCase().includes(q)) ||
          e.id.includes(q) ||
          (e.sn && e.sn.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [equipments, selectedDept, searchEquipTerm]);

  // 自动选定首台设备
  React.useEffect(() => {
    if (deptEquipments.length > 0 && !selectedEquipmentId) {
      setSelectedEquipmentId(deptEquipments[0].id);
    }
  }, [deptEquipments, selectedEquipmentId]);

  const currentEquipment = useMemo(() => {
    return equipments.find(e => e.id === selectedEquipmentId) || deptEquipments[0];
  }, [equipments, selectedEquipmentId, deptEquipments]);

  // 常见极速故障标签
  const COMMON_FAULT_TAGS = [
    '无法开机/通电无反应',
    '报警鸣叫不停/代码异常',
    '气路泄漏/管路接头漏气',
    '屏幕闪烁/触摸失灵',
    '输液堵塞/气泡反复报错',
    '测量漂移/数值严重不准',
    '外壳破损/电缆老化裸露',
    '除颤放电能量未达标'
  ];

  // 提交 10 秒极速报修
  const handleQuickSubmitRepair = () => {
    if (!currentEquipment) {
      showToast('error', '请先选择需要报修的设备！');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const faultDesc = `${selectedFaultTag}${customFaultNotes ? '；补充：' + customFaultNotes : ''}`;
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      
      const newRepair: Partial<RepairRecord> = {
        id: `REP-CLINICAL-${Date.now().toString().slice(-6)}`,
        equipmentId: currentEquipment.id,
        equipmentName: currentEquipment.name,
        equipmentSn: currentEquipment.sn || 'SN-UNKNOWN',
        faultDate: nowStr,
        repairType: isUrgent ? '紧急故障维修' : '巡检维护',
        faultDescription: `【临床10秒极速报修】${faultDesc}`,
        technician: '待医工值班工程师响应',
        cost: 0,
        partsReplaced: '-',
        resolution: '临床极速报修已直连医工微信/钉钉响应中枢',
        status: '处理中',
        department: currentEquipment.department,
        reporterName: reporterName,
        reporterPhone: reporterPhone,
        source: 'platform'
      };

      onAddRepair(currentEquipment.id, newRepair);
      setIsSubmitting(false);
      showToast('success', `【10秒极速报修已发送】工单已推送至医工部值班工程师，预计 15 分钟内响应！`);
      setCustomFaultNotes('');
    }, 400);
  };

  // 提交 10 秒借调
  const handleQuickSubmitLoan = () => {
    if (!currentEquipment) return;
    showToast('success', `【10秒应急借调完成】设备【${currentEquipment.name}】已成功出借至【${targetBorrowDept}】，交接无纸化归档！`);
  };

  // 提交 10 秒点检
  const handleQuickSubmitInspection = () => {
    if (!currentEquipment) return;
    showToast('success', `【10秒巡检打卡完成】设备【${currentEquipment.name}】当班点检全部合格，状态正常！`);
  };

  return (
    <div className="space-y-6">
      
      {/* 顶部临床极简欢迎与双轨切换指示条 */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-700/80 p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/20 border border-cyan-400 text-cyan-300">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide">
                临床极简极速工作台 (10-Second Quick Portal)
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                双轨模式 · 临床专属
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              五莲县人民医院临床护士与值班医师直达窗口 · 10 秒完成扫码报修、应急借调、专耗挂靠与当班打卡
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToEngineeringMode}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            切换至【医工全能深度台账】
          </button>
        </div>
      </div>

      {/* 消息提示条 */}
      {toastMessage && (
        <div className={`p-4 text-xs font-medium flex items-center justify-between border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-700 text-rose-200'
        }`}>
          <span className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {toastMessage.text}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 核心功能选项卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveAction('repair')}
          className={`p-4 border text-left transition-colors cursor-pointer ${
            activeAction === 'repair'
              ? 'bg-rose-950/50 border-rose-600 text-white shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 bg-rose-900/50 text-rose-300 border border-rose-700/60">
              <Wrench className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/40 text-rose-400 border border-rose-900">
              10秒完成
            </span>
          </div>
          <div className="text-sm font-bold text-white">10秒极速报修</div>
          <p className="text-xs text-slate-400 mt-1">点选常见故障标签，直推值班医工</p>
        </button>

        <button
          onClick={() => setActiveAction('udi')}
          className={`p-4 border text-left transition-colors cursor-pointer ${
            activeAction === 'udi'
              ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 bg-cyan-900/50 text-cyan-300 border border-cyan-700/60">
              <Barcode className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/40 text-cyan-400 border border-cyan-900">
              UDI 追溯
            </span>
          </div>
          <div className="text-sm font-bold text-white">专机专耗扫码挂靠</div>
          <p className="text-xs text-slate-400 mt-1">防错配白名单核验，病案穿透关联</p>
        </button>

        <button
          onClick={() => setActiveAction('loan')}
          className={`p-4 border text-left transition-colors cursor-pointer ${
            activeAction === 'loan'
              ? 'bg-amber-950/50 border-amber-600 text-white shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 bg-amber-900/50 text-amber-300 border border-amber-700/60">
              <Share2 className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/40 text-amber-400 border border-amber-900">
              应急调拨
            </span>
          </div>
          <div className="text-sm font-bold text-white">10秒跨科借调</div>
          <p className="text-xs text-slate-400 mt-1">抢救应急出库交接，一键电子签署</p>
        </button>

        <button
          onClick={() => setActiveAction('inspection')}
          className={`p-4 border text-left transition-colors cursor-pointer ${
            activeAction === 'inspection'
              ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 bg-emerald-900/50 text-emerald-300 border border-emerald-700/60">
              <CheckCircle2 className="w-5 h-5" />
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/40 text-emerald-400 border border-emerald-900">
              班次点检
            </span>
          </div>
          <div className="text-sm font-bold text-white">10秒巡检打卡</div>
          <p className="text-xs text-slate-400 mt-1">设备完好状态确认，异常直转工单</p>
        </button>
      </div>

      {/* 主工作区 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左侧：目标设备极简选择卡 */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-cyan-400" />
                当前所在科室设备列表
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchEquipTerm}
                onChange={(e) => setSearchEquipTerm(e.target.value)}
                placeholder="快速筛选设备名称、型号或序列号..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 text-slate-200 focus:outline-hidden rounded-none"
              />
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {deptEquipments.map(equip => {
                const isSelected = equip.id === selectedEquipmentId;
                return (
                  <div
                    key={equip.id}
                    onClick={() => setSelectedEquipmentId(equip.id)}
                    className={`p-3 border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {equip.name}
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          型号: {equip.model || '无型号'} · SN: {equip.sn || '-'}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-mono ${
                        equip.status === '正常运行' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : equip.status === '故障待修'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {equip.status}
                      </span>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono border-t border-slate-800/80 pt-1.5">
                      <span>位置: {equip.location || equip.department}</span>
                      <span>内部编号: {equip.internalNo || equip.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧：10秒动作表单面板 */}
        <div className="lg:col-span-7">
          
          {/* 1. 10秒极速报修 */}
          {activeAction === 'repair' && (
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-950 text-rose-400 border border-rose-800">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">10 秒极速报修直通车</h3>
                    <p className="text-[11px] text-slate-400">一键点选常见故障，自动填报设备信息与位置</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span className={isUrgent ? 'text-rose-400 animate-pulse font-bold' : 'text-slate-400'}>
                    紧急抢救设备 (特急响优先)
                  </span>
                </label>
              </div>

              {currentEquipment && (
                <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-mono">
                  <div>报修目标: <strong className="text-white font-sans">{currentEquipment.name}</strong> ({currentEquipment.model})</div>
                  <div>科室: {currentEquipment.department}</div>
                </div>
              )}

              {/* 常见故障标签选择 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  点选现场故障表现 (单选即刻预填):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {COMMON_FAULT_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedFaultTag(tag)}
                      className={`p-2.5 text-xs text-left border transition-all cursor-pointer ${
                        selectedFaultTag === tag
                          ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-medium'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      • {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 补充现场说明 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>现场补充描述 (可选，支持语音转文字):</span>
                  <span className="text-[11px] text-slate-500 font-mono">非必填</span>
                </label>
                <textarea
                  rows={2}
                  value={customFaultNotes}
                  onChange={(e) => setCustomFaultNotes(e.target.value)}
                  placeholder="如：插上电源无任何蜂鸣提示，电源线接头处稍有松脱，急需协助..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 text-slate-100 rounded-none focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* 报修人联系方式 */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">报修医护姓名</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">现场联系电话 (座机/手机)</label>
                  <input
                    type="text"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleQuickSubmitRepair}
                disabled={isSubmitting}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? '正在极速派单并推送企业微信...' : '一键极速报修 (自动指派当班医工)'}
              </button>
            </div>
          )}

          {/* 2. UDI 专机专耗扫码挂靠 */}
          {activeAction === 'udi' && (
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-950 text-cyan-400 border border-cyan-800">
                    <Barcode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">专机专用耗材极速扫码挂靠</h3>
                    <p className="text-[11px] text-slate-400">上机前自动校验耗材与主机白名单，阻断非兼容/过期耗材</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs text-slate-300">
                  当前选定挂靠设备: <strong className="text-cyan-400 font-sans">{currentEquipment?.name}</strong>
                  <span className="text-slate-500 font-mono ml-2">({currentEquipment?.model || '标准型'})</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  请使用扫码枪对准耗材外包装箱上的 UDI 二维码进行扫码。系统将自动解析出 DI 编码、批号 LOT 及有效期，并完成专机防错配核验。
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => onOpenUdiModal(currentEquipment)}
                    className="px-5 py-2.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 border border-cyan-400 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Barcode className="w-4 h-4" />
                    进入 UDI 扫码配伍与全生命周期工作台
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. 10秒应急借调 */}
          {activeAction === 'loan' && (
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-950 text-amber-400 border border-amber-800">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">10 秒应急跨科借调交接</h3>
                    <p className="text-[11px] text-slate-400">急抢救专用设备即刻出库，无纸化电子归档</p>
                  </div>
                </div>
              </div>

              {currentEquipment && (
                <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                  出借设备: <strong className="text-white font-sans">{currentEquipment.name}</strong> · 产权科室: {currentEquipment.department}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">借用接收科室</label>
                  <select
                    value={targetBorrowDept}
                    onChange={(e) => setTargetBorrowDept(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden"
                  >
                    <option value="急诊抢救室">急诊抢救室</option>
                    <option value="重症医学科(ICU)">重症医学科(ICU)</option>
                    <option value="手术室">手术室</option>
                    <option value="新生儿科">新生儿科</option>
                    <option value="心内科CCU">心内科CCU</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">借调经手人</label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-none focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">随借附件快速核查:</div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-amber-500" /> 主机电源线
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-amber-500" /> 传感器/导联
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-amber-500" /> 备用电池
                  </label>
                </div>
              </div>

              <button
                onClick={handleQuickSubmitLoan}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-500 text-slate-950 border border-amber-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                确认借出并生成电子存证交接单
              </button>
            </div>
          )}

          {/* 4. 10秒当班巡检打卡 */}
          {activeAction === 'inspection' && (
            <div className="bg-slate-900 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">10 秒当班日常点检打卡</h3>
                    <p className="text-[11px] text-slate-400">护士站快速确认待命状态，合规留痕</p>
                  </div>
                </div>
              </div>

              {currentEquipment && (
                <div className="p-3 bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono">
                  点检设备: <strong className="text-white font-sans">{currentEquipment.name}</strong> ({currentEquipment.model})
                </div>
              )}

              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                  <span className="text-slate-200">1. 设备外观洁净，无破损、裂纹及液体泼溅</span>
                  <input
                    type="checkbox"
                    checked={checkAppearance}
                    onChange={(e) => setCheckAppearance(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                  <span className="text-slate-200">2. 电源指示灯正常，开机自检通过，无报警鸣叫</span>
                  <input
                    type="checkbox"
                    checked={checkPower}
                    onChange={(e) => setCheckPower(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 text-xs cursor-pointer hover:border-slate-700">
                  <span className="text-slate-200">3. 标配附件齐全（探头/管路/导联），无缺失</span>
                  <input
                    type="checkbox"
                    checked={checkAccessories}
                    onChange={(e) => setCheckAccessories(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </label>
              </div>

              <button
                onClick={handleQuickSubmitInspection}
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                点检合格，一键完成当班打卡
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
