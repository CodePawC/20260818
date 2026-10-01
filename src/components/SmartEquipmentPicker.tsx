import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  QrCode, 
  SlidersHorizontal, 
  Check, 
  ChevronDown, 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  Building2, 
  MapPin, 
  Tag, 
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { MedicalEquipment, AuthUser } from '../types';

interface SmartEquipmentPickerProps {
  equipmentList: MedicalEquipment[];
  selectedEquipmentId: string;
  onSelectEquipment: (equipmentId: string, equipment?: MedicalEquipment) => void;
  currentUser?: AuthUser;
  label?: string;
  required?: boolean;
  filterMode?: 'all' | 'clinical_only' | 'repairs_only';
  placeholder?: string;
  className?: string;
}

// 简易拼音首字母匹配辅助（针对医疗高频设备与科室）
const PINYIN_MAP: Record<string, string[]> = {
  hxj: ['呼吸机', '无创呼吸机', '转运呼吸机', '呼吸麻醉'],
  cfy: ['除颤仪', '除颤监护仪', '双相除颤'],
  jhy: ['监护仪', '多参数监护仪', '心电监护仪', '生命体征'],
  xdt: ['心电图机', '心电图'],
  cs: ['超声', '彩超', '便携超声', '超声诊断仪'],
  ct: ['ct', '计算机断层扫描', '双源ct'],
  mri: ['mri', '核磁共振', '磁共振'],
  dr: ['dr', '直接数字化x射线', '移动dr'],
  sxb: ['注射泵', '输液泵', '靶控微量注射泵'],
  mz: ['麻醉机', '手术麻醉'],
  icu: ['icu', '重症医学科', '重症监护'],
  jzk: ['急诊科', '急诊抢救室', '急诊'],
  fsk: ['放射影像科', '放射科', '医学影像'],
  ssmzk: ['手术麻醉科', '手术室', '麻醉科']
};

export const SmartEquipmentPicker: React.FC<SmartEquipmentPickerProps> = ({
  equipmentList,
  selectedEquipmentId,
  onSelectEquipment,
  currentUser,
  label = '报修/维保目标设备',
  required = true,
  filterMode = 'all',
  placeholder = '搜索设备名称 / 型号 / 序列号(SN) / 资产编号 / 临床自编号 / 科室 / 房间号...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [scanInput, setScanInput] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 获取当前选中的设备对象
  const currentEquipment = useMemo(() => {
    return equipmentList.find(e => e.id === selectedEquipmentId);
  }, [equipmentList, selectedEquipmentId]);

  // 获取用户所在科室
  const userDept = currentUser?.department || '';

  // 提取全院所有科室列表并去重
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [equipmentList]);

  // 提取设备分类列表
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [equipmentList]);

  // 点击外部关闭弹层
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 打开弹层时聚焦搜索输入框
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // 智能过滤匹配算法
  const filteredEquipment = useMemo(() => {
    let list = equipmentList;

    // 1. 科室筛选
    if (selectedDept === 'MY_DEPT' && userDept) {
      list = list.filter(e => e.department === userDept || e.department?.includes(userDept));
    } else if (selectedDept !== 'ALL') {
      list = list.filter(e => e.department === selectedDept);
    }

    // 2. 状态筛选
    if (selectedStatus === 'FAULT_ONLY') {
      list = list.filter(e => e.status === '故障待修' || e.status === '维护保养中');
    } else if (selectedStatus !== 'ALL') {
      list = list.filter(e => e.status === selectedStatus);
    }

    // 3. 类别筛选
    if (selectedCategory !== 'ALL') {
      list = list.filter(e => e.category === selectedCategory);
    }

    // 4. 关键词搜索 (支持多关键词、多字段、拼音首字母模糊匹配)
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    // 检查是否有拼音首字母简码命中
    const pinyinKeywords = PINYIN_MAP[q] || [];

    return list.filter(e => {
      const name = (e.name || '').toLowerCase();
      const model = (e.model || '').toLowerCase();
      const sn = (e.sn || '').toLowerCase();
      const assetNo = (e.assetNo || '').toLowerCase();
      const codeId = (e.codeId || '').toLowerCase();
      const internalNo = (e.internalNo || '').toLowerCase();
      const dept = (e.department || '').toLowerCase();
      const loc = (e.location || e.usageLocation || '').toLowerCase();
      const brand = (e.manufacturer || '').toLowerCase();
      const category = (e.category || '').toLowerCase();

      // 文本直配
      const directMatch = 
        name.includes(q) ||
        model.includes(q) ||
        sn.includes(q) ||
        assetNo.includes(q) ||
        codeId.includes(q) ||
        internalNo.includes(q) ||
        dept.includes(q) ||
        loc.includes(q) ||
        brand.includes(q) ||
        category.includes(q);

      if (directMatch) return true;

      // 拼音命中匹配
      if (pinyinKeywords.length > 0) {
        return pinyinKeywords.some(kw => 
          name.includes(kw.toLowerCase()) || 
          category.includes(kw.toLowerCase()) ||
          dept.includes(kw.toLowerCase())
        );
      }

      return false;
    });
  }, [equipmentList, selectedDept, selectedStatus, selectedCategory, searchQuery, userDept]);

  // 选中某台设备
  const handleSelect = (eq: MedicalEquipment) => {
    onSelectEquipment(eq.id, eq);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 模拟扫码/条码识别并秒级选中设备
  const handleBarcodeScan = (codeToSearch?: string) => {
    const raw = (codeToSearch || scanInput).trim();
    if (!raw) {
      setScanFeedback({ success: false, msg: '请输入或扫描有效条码/二维码/SN' });
      return;
    }

    // 查找匹配项
    const target = equipmentList.find(e => 
      e.sn.toLowerCase() === raw.toLowerCase() ||
      (e.assetNo && e.assetNo.toLowerCase() === raw.toLowerCase()) ||
      (e.codeId && e.codeId.toLowerCase() === raw.toLowerCase()) ||
      (e.id && e.id.toLowerCase() === raw.toLowerCase()) ||
      (e.internalNo && e.internalNo.toLowerCase() === raw.toLowerCase())
    );

    if (target) {
      handleSelect(target);
      setIsScanModalOpen(false);
      setScanInput('');
      setScanFeedback(null);
    } else {
      // 模糊查找
      const fuzzy = equipmentList.find(e => 
        e.sn.toLowerCase().includes(raw.toLowerCase()) ||
        (e.assetNo && e.assetNo.toLowerCase().includes(raw.toLowerCase())) ||
        (e.name && e.name.toLowerCase().includes(raw.toLowerCase()))
      );
      if (fuzzy) {
        handleSelect(fuzzy);
        setIsScanModalOpen(false);
        setScanInput('');
        setScanFeedback(null);
      } else {
        setScanFeedback({ success: false, msg: `未找到与「${raw}」匹配的设备台账` });
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 头部 Label & 快捷状态 */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-amber-500 text-white text-2xs font-bold flex items-center justify-center">1</span>
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="text-2xs font-bold text-amber-700 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition shadow-2xs"
            title="模拟扫描设备铭牌二维码/条形码"
          >
            <QrCode className="w-3 h-3 text-amber-600" />
            <span>扫码识机</span>
          </button>
          {userDept && (
            <button
              type="button"
              onClick={() => {
                setSelectedDept('MY_DEPT');
                setIsOpen(true);
              }}
              className="text-2xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition"
            >
              <Building2 className="w-3 h-3 text-blue-500" />
              <span>本科室({userDept})设备</span>
            </button>
          )}
        </div>
      </div>

      {/* 选中的设备预览卡片 (已选状态) */}
      {currentEquipment ? (
        <div className="bg-white border-2 border-amber-400 rounded-xl p-3 shadow-2xs space-y-2 relative overflow-hidden transition-all hover:border-amber-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    {currentEquipment.name}
                  </h4>
                  <span className="text-xs font-semibold text-slate-600 font-mono">
                    {currentEquipment.model}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold inline-flex items-center gap-1 ${
                    currentEquipment.status === '正常运行' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentEquipment.status === '故障待修'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      currentEquipment.status === '正常运行' ? 'bg-emerald-500' : currentEquipment.status === '故障待修' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                    {currentEquipment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1 truncate font-mono">
                    <span className="text-slate-400">SN:</span>
                    <span className="font-bold text-slate-800 truncate">{currentEquipment.sn}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{currentEquipment.department}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{currentEquipment.location || currentEquipment.usageLocation || '病区床旁'}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <Tag className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-slate-500 truncate">{currentEquipment.internalNo ? `编号: ${currentEquipment.internalNo}` : `资产: ${currentEquipment.assetNo || currentEquipment.id}`}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>更换/重新检索</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      ) : (
        /* 未选择设备时的主触发按钮 */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 bg-white border-2 border-dashed border-amber-400 hover:border-amber-600 rounded-xl text-left transition-all flex items-center justify-between shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 text-slate-500 group-hover:text-slate-800">
            <Search className="w-4 h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium">
              点击快速检索 1,000+ 台设备（支持型号/SN/科室/拼音模糊查）
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            <span>选择设备</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </button>
      )}

      {/* 智能下拉检索面板 */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150 max-h-[500px] flex flex-col">
          {/* 1. 搜索框与扫码入口 */}
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsScanModalOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-600" />
              <span>扫码录入</span>
            </button>
          </div>

          {/* 2. 快捷标签与维度过滤 Chips */}
          <div className="space-y-1.5 border-y border-slate-100 py-2">
            {/* 科室快捷筛选 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-2xs scrollbar-thin">
              <span className="text-slate-400 font-semibold shrink-0">科室:</span>
              <button
                type="button"
                onClick={() => setSelectedDept('ALL')}
                className={`px-2 py-0.5 rounded-full font-bold transition shrink-0 cursor-pointer ${
                  selectedDept === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部科室 ({equipmentList.length})
              </button>

              {userDept && (
                <button
                  type="button"
                  onClick={() => setSelectedDept('MY_DEPT')}
                  className={`px-2 py-0.5 rounded-full font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedDept === 'MY_DEPT'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <Building2 className="w-2.5 h-2.5" />
                  <span>📍 本科室: {userDept}</span>
                </button>
              )}

              {departmentOptions.slice(0, 5).map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2 py-0.5 rounded-full font-medium transition shrink-0 cursor-pointer ${
                    selectedDept === dept
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* 状态快捷筛选 */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-2xs">
              <span className="text-slate-400 font-semibold shrink-0">状态:</span>
              {[
                { key: 'ALL', label: '全部状态' },
                { key: 'FAULT_ONLY', label: '🔴 故障待修/保养中', badge: '优先' },
                { key: '正常运行', label: '🟢 正常在用' },
                { key: '故障待修', label: '🔴 故障' }
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setSelectedStatus(st.key)}
                  className={`px-2 py-0.5 rounded-full font-medium transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedStatus === st.key
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{st.label}</span>
                  {st.badge && (
                    <span className="bg-rose-500 text-white text-[9px] px-1 rounded-full font-bold">
                      {st.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 匹配结果统计 */}
          <div className="flex items-center justify-between text-2xs text-slate-500 px-1">
            <span>
              已为您精准匹配到 <strong className="text-amber-700 font-bold">{filteredEquipment.length}</strong> 台设备 (总共 {equipmentList.length} 台)
            </span>
            {searchQuery && (
              <span className="text-slate-400">
                支持拼音简拼搜索 (如 hxj = 呼吸机, icu = 重症监护)
              </span>
            )}
          </div>

          {/* 4. 虚拟滚动/高清晰度设备列表 */}
          <div className="flex-1 overflow-y-auto max-h-72 divide-y divide-slate-100 border border-slate-100 rounded-lg pr-1">
            {filteredEquipment.length > 0 ? (
              filteredEquipment.map((eq) => {
                const isCurrent = eq.id === selectedEquipmentId;
                const isFault = eq.status === '故障待修' || eq.status === '维护保养中';

                return (
                  <div
                    key={eq.id}
                    onClick={() => handleSelect(eq)}
                    className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition rounded-md ${
                      isCurrent
                        ? 'bg-amber-50/80 border-l-4 border-amber-500'
                        : isFault
                        ? 'hover:bg-rose-50/60 bg-rose-50/20'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {eq.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 font-mono">
                          {eq.model}
                        </span>
                        {eq.internalNo && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-medium">
                            {eq.internalNo}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          eq.status === '正常运行'
                            ? 'bg-emerald-100 text-emerald-800'
                            : eq.status === '故障待修'
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {eq.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-mono text-slate-700 font-semibold">
                          SN: {eq.sn}
                        </span>
                        <span>•</span>
                        <span className="text-slate-800 font-medium">
                          {eq.department}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 truncate max-w-[150px]">
                          {eq.location || eq.usageLocation || '在科'}
                        </span>
                        {eq.repairRecords && eq.repairRecords.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold">
                              历史维修 {eq.repairRecords.length} 次
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isCurrent ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-white hover:bg-amber-500 hover:text-white text-slate-700 border border-slate-200 hover:border-amber-500 rounded text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          选用
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">未找到符合搜索条件的设备</p>
                <p className="text-2xs text-slate-400">
                  建议尝试缩短关键词、或切换上方【全部科室】/【全部状态】筛选
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('ALL');
                    setSelectedStatus('ALL');
                  }}
                  className="mt-2 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-2xs font-semibold"
                >
                  重置筛选条件
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 模拟扫码识别弹窗 (QR / Barcode Scanner Modal) */}
      {isScanModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">扫码识别设备 (二维码/条形码)</h3>
                  <p className="text-2xs text-slate-500">模拟临床护士/维保工程师现场扫码直接录入工单</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsScanModalOpen(false);
                  setScanFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 模拟取景器与激光扫描动画 */}
            <div className="relative h-44 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-4 border-2 border-slate-700">
              <div className="w-32 h-32 border-2 border-amber-400 rounded-lg relative flex items-center justify-center">
                {/* 激光红线扫描动画 */}
                <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce top-1/2" />
                <QrCode className="w-16 h-16 text-amber-300/30" />
              </div>
              <p className="text-2xs text-slate-300 mt-2 font-mono">
                [ 模拟扫码头待命：将设备条码/铭牌二维码对准取景框 ]
              </p>
            </div>

            {/* 手动输入或快捷测试码 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                条形码 / 资产编码 / 序列号 (SN)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeScan();
                    }
                  }}
                  placeholder="如: MD-2023-8891 或输入部分SN..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleBarcodeScan()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  识别选定
                </button>
              </div>

              {scanFeedback && (
                <p className={`text-xs ${scanFeedback.success ? 'text-emerald-600' : 'text-rose-600'} font-semibold mt-1`}>
                  {scanFeedback.msg}
                </p>
              )}
            </div>

            {/* 快速体验芯片按钮 */}
            <div className="bg-slate-50 p-2.5 rounded-lg space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 block">
                ⚡ 快捷测试扫码（点击模拟扫码选中典型高危设备）：
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {equipmentList.slice(0, 4).map(eq => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => handleBarcodeScan(eq.sn)}
                    className="text-[10.5px] px-2 py-0.5 bg-white hover:bg-amber-100 text-slate-700 border border-slate-200 hover:border-amber-300 rounded font-mono transition cursor-pointer truncate max-w-[130px]"
                    title={`SN: ${eq.sn} (${eq.name})`}
                  >
                    {eq.name.slice(0, 4)} ({eq.sn.slice(-4)})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
