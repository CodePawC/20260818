import React, { useState, useEffect, useMemo } from 'react';
import { MedicalEquipment, EquipmentCategory, EquipmentStatus, DepartmentMaster, StaffPersonMaster, LocationRoomMaster, BuildingMaster, CampusMaster, MetrologyCatalogueItem, NmpaCategoryMasterItem } from '../types';
import { CATEGORIES } from '../mockData';
import { X, Save, Building2, MapPin, Phone, UserCheck, Sparkles, Check, Layers, ShieldCheck, Scale, AlertCircle, Info, Tag, Hash } from 'lucide-react';
import { DepartmentSearchSelect, CascadingSpacePicker, StaffSearchSelect, CascadingCategoryPicker } from './StandardMasterDataSelector';
import { matchEquipmentToMetrologyCatalogue, enrichEquipmentWithMetrologyPolicy, DEFAULT_METROLOGY_CATALOGUE } from '../utils/metrologyCatalogueData';
import { DEFAULT_NMPA_CATEGORY_MASTER, matchEquipmentToNmpaCategory } from '../utils/nmpaCategoryData';
import { enrichEquipmentWithMasterData } from '../utils/masterData';
import { generatePureNumericInternalNo } from '../utils/internalNoGenerator';

interface AddEquipmentModalProps {
  isOpen: boolean;
  editingEquipment: MedicalEquipment | null;
  departments: DepartmentMaster[];
  staff: StaffPersonMaster[];
  rooms: LocationRoomMaster[];
  buildings: BuildingMaster[];
  campuses: CampusMaster[];
  allEquipment?: MedicalEquipment[];
  metrologyCatalogue?: MetrologyCatalogueItem[];
  categoryMaster?: NmpaCategoryMasterItem[];
  onClose: () => void;
  onSubmit: (equipmentData: Partial<MedicalEquipment>) => void;
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  isOpen,
  editingEquipment,
  departments,
  staff,
  rooms,
  buildings,
  campuses,
  allEquipment = [],
  metrologyCatalogue,
  categoryMaster,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<MedicalEquipment>>({
    id: '',
    assetNo: '',
    assetOwnership: '医院自有',
    codeId: '',
    internalNo: '',
    usageLocation: '',
    categoryNo: '06',
    category: '医用成像器械',
    level1No: '01',
    level1Category: '诊断X射线机',
    level2No: '01',
    level2Category: '血管造影X射线机',
    name: '',
    model: '',
    enableDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
    productValidity: '10',
    sn: '',
    manufacturer: '',
    calibration: 'Yes',
    calibrationUnit: '市级',
    department: '急诊科',
    building: '1号楼 综合楼',
    floor: '1F',
    nursePhone: '7991000',
    manager: '崔工',
    status: '正常运行',
    purchasePrice: 100000,
    location: ''
  });

  const activeCatalogue = metrologyCatalogue && metrologyCatalogue.length > 0
    ? metrologyCatalogue
    : DEFAULT_METROLOGY_CATALOGUE;

  const activeCategoryMaster = categoryMaster && categoryMaster.length > 0
    ? categoryMaster
    : DEFAULT_NMPA_CATEGORY_MASTER;

  // 动态推荐最匹配的 NMPA 22大类标准分类主数据
  const liveCategoryMatch = useMemo(() => {
    if (!formData.name) return null;
    const match = matchEquipmentToNmpaCategory(formData.name || '', formData.model || '', activeCategoryMaster);
    return match.matchedItem;
  }, [formData.name, formData.model, activeCategoryMaster]);

  // 动态计算该设备名称/型号/分类匹配到的国家强检目录规则
  const livePolicyMatch = useMemo(() => {
    return matchEquipmentToMetrologyCatalogue(
      formData.name || '',
      formData.model || '',
      `${formData.category || ''} ${formData.level1Category || ''} ${formData.level2Category || ''}`,
      activeCatalogue
    );
  }, [formData.name, formData.model, formData.category, formData.level1Category, formData.level2Category, activeCatalogue]);

  // 当选择科室时，自动联动科室配置的主数据（楼宇、楼层、护士站电话、默认责任人）
  const handleDepartmentChange = (newDeptName: string) => {
    const matchedDept = departments.find(d => d.name === newDeptName);
    if (matchedDept) {
      setFormData(prev => ({
        ...prev,
        department: newDeptName,
        building: matchedDept.buildingName || prev.building,
        floor: matchedDept.defaultFloor || prev.floor,
        nursePhone: matchedDept.nursePhone || prev.nursePhone,
        manager: matchedDept.defaultManager || prev.manager
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        department: newDeptName
      }));
    }
  };

  // 快捷从标准空间房间字典点选
  const handleSelectRoom = (room: LocationRoomMaster) => {
    setFormData(prev => ({
      ...prev,
      building: room.buildingName,
      floor: room.floor,
      location: room.fullLocationPath,
      department: room.departmentName || prev.department
    }));
  };

  useEffect(() => {
    if (editingEquipment) {
      setFormData(editingEquipment);
    } else {
      const randomId = (10000 + Math.floor(Math.random() * 9000)).toString();
      const defaultDept = departments[0] || {
        name: '急诊科',
        buildingName: '1号楼 综合楼',
        defaultFloor: '1F',
        nursePhone: '7991000',
        defaultManager: '崔工'
      };

      setFormData({
        id: randomId,
        assetNo: `ZC-2023-${randomId}`,
        assetOwnership: '医院自有',
        codeId: `COD-${randomId}`,
        internalNo: '',
        usageLocation: '',
        categoryNo: '06',
        category: '医用成像器械',
        level1No: '01',
        level1Category: '诊断X射线机',
        level2No: '01',
        level2Category: '血管造影X射线机',
        name: '',
        model: '',
        enableDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        productValidity: '10',
        sn: `SN-${Date.now().toString().slice(-6)}`,
        manufacturer: '深圳迈瑞生物医疗',
        calibration: 'Yes',
        calibrationUnit: '市级',
        department: defaultDept.name,
        building: defaultDept.buildingName,
        floor: defaultDept.defaultFloor,
        nursePhone: defaultDept.nursePhone,
        manager: defaultDept.defaultManager,
        status: '正常运行',
        purchasePrice: 100000,
        location: ''
      });
    }
  }, [editingEquipment, isOpen, departments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('请填写设备名称！');
      return;
    }

    // 1. 同步主数据 (科室电话、标准空间、责任人)
    let processed = enrichEquipmentWithMasterData(
      formData as MedicalEquipment,
      departments,
      false
    );

    // 2. 同步强检目录政策动态判定
    processed = enrichEquipmentWithMetrologyPolicy(processed, activeCatalogue);

    onSubmit(processed);
    onClose();
  };

  // 匹配当前选中科室相关的人员名册
  const filteredStaffForDept = staff.filter(
    s => s.departmentName === formData.department || s.role === '设备管理员' || s.role === '维修工程师'
  );

  // 匹配当前科室关联的空间房间
  const filteredRoomsForDept = rooms.filter(
    r => r.departmentName === formData.department || r.buildingName === formData.building
  );


  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>{editingEquipment ? '编辑设备档案 (主数据标准联动)' : '新增医疗设备入库登记'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              科室、楼宇与责任人已与全院主数据中心强校验联动，选择科室将自动填充归属空间与对接人员。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section 1: 设备基础规格 */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <span>1. 设备基本资产规格</span>
            </h3>
            
            {/* 资产编号、资产归属、code_id、课内编号 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  资产编号 <span className="text-slate-400 font-normal">(Asset No.)</span>
                </label>
                <input
                  type="text"
                  value={formData.assetNo || ''}
                  onChange={(e) => setFormData({ ...formData, assetNo: e.target.value })}
                  placeholder="例：ZC-2023-10086"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  资产归属 <span className="text-slate-400 font-normal">(Ownership)</span>
                </label>
                <select
                  value={formData.assetOwnership || '医院自有'}
                  onChange={(e) => setFormData({ ...formData, assetOwnership: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="医院自有">医院自有 (固定资产)</option>
                  <option value="经营性租赁">经营性租赁</option>
                  <option value="融资租赁">融资租赁</option>
                  <option value="厂商投放">厂商投放 (耗材联动)</option>
                  <option value="借用设备">跨机构/跨科借用</option>
                  <option value="受赠资产">公益受赠资产</option>
                  <option value="科室自筹">科室自筹</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  code_id <span className="text-slate-400 font-normal">(溯源码)</span>
                </label>
                <input
                  type="text"
                  value={formData.codeId || ''}
                  onChange={(e) => setFormData({ ...formData, codeId: e.target.value })}
                  placeholder="例：COD-10086"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 text-xs">
                    科室内部编号 <span className="text-slate-400 font-normal">(纯数字自增)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNo = generatePureNumericInternalNo(formData, allEquipment);
                      setFormData(prev => ({ ...prev, internalNo: nextNo }));
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition"
                    title="按【当前科室 + 二级品目】生成纯数字顺序号"
                  >
                    <Hash className="w-3 h-3" />
                    <span>自动分配</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.internalNo || ''}
                  onChange={(e) => setFormData({ ...formData, internalNo: e.target.value.replace(/\D/g, '') })}
                  placeholder="例：1, 2, 3 (纯数字)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 font-bold text-amber-900"
                  title="纯数字编号：同科室同二级品目下自动按自然数1,2,3顺序递增"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  设备名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例：医用多参数监护仪"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  出厂序列号(SN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sn || ''}
                  onChange={(e) => setFormData({ ...formData, sn: e.target.value })}
                  placeholder="例：EQ-20260301-09"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">规格型号</label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="例：BeneVision N17"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* NMPA 22大类国家医疗器械分类目录主数据 (级联/智能推荐) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-[11px]">
                    医疗器械分类目录主数据 (大类 / 一级分类 / 二级分类)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  NMPA 2017版 22大类标准编码体系
                </span>
              </div>

              <CascadingCategoryPicker
                categoryMaster={activeCategoryMaster}
                selectedCategory={formData.category || ''}
                selectedLevel1={formData.level1Category || ''}
                selectedLevel2={formData.level2Category || ''}
                quickMatchedItem={liveCategoryMatch}
                onSelect={(res) => {
                  setFormData(prev => ({
                    ...prev,
                    categoryNo: res.categoryNo,
                    category: res.category,
                    level1No: res.level1No,
                    level1Category: res.level1Category,
                    level2No: res.level2No,
                    level2Category: res.level2Category,
                    riskClass: res.item?.riskClass || prev.riskClass,
                    depreciationYears: res.item?.defaultDepreciationYears || prev.depreciationYears
                  }));
                }}
              />
            </div>

            {/* 动态强检目录政策合规实时判定卡片 */}
            {formData.name && (
              <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs transition-all ${
                livePolicyMatch.matchType === 'mandatory'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : livePolicyMatch.matchType === 'periodic_calibration'
                  ? 'bg-sky-50/90 border-sky-300 text-sky-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  {livePolicyMatch.matchType === 'mandatory' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : livePolicyMatch.matchType === 'periodic_calibration' ? (
                    <Scale className="w-4 h-4 text-sky-600 shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">
                        {livePolicyMatch.matchType === 'mandatory' ? '⚖️ 动态匹配国家法定强检目录' : livePolicyMatch.matchType === 'periodic_calibration' ? '📐 动态匹配医院定期校准目录' : '⚪ 常规免计量设备'}
                      </span>
                      {livePolicyMatch.matchedItem && (
                        <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-white border text-[11px]">
                          {livePolicyMatch.matchedItem.catalogueCode} {livePolicyMatch.matchedItem.name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-85 mt-0.5">
                      {livePolicyMatch.matchReason}（保存时将自动对齐政策与申报平台）
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                    livePolicyMatch.matchType === 'mandatory'
                      ? 'bg-emerald-200/60 text-emerald-900 border-emerald-400'
                      : livePolicyMatch.matchType === 'periodic_calibration'
                      ? 'bg-sky-200/60 text-sky-900 border-sky-400'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}>
                    {livePolicyMatch.matchType === 'mandatory' ? '国家财政免费检定' : livePolicyMatch.matchType === 'periodic_calibration' ? '医院自费定期校准' : '免检'}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">生产制造厂商</label>
                <input
                  type="text"
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="例：深圳迈瑞 / GE医疗"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">采购金额 (元)</label>
                <input
                  type="number"
                  value={formData.purchasePrice || 0}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">运行状态</label>
                <select
                  value={formData.status || '正常运行'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as EquipmentStatus })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="正常运行">正常运行</option>
                  <option value="维护保养中">维护保养中</option>
                  <option value="故障待修">故障待修</option>
                  <option value="停用/报废">停用/报废</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: 组织与空间归属 (级联/检索式标准化选择) */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-md shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                    <span>2. 组织架构与空间主数据级联/检索配置</span>
                  </h3>
                  <p className="text-[11px] text-indigo-700">
                    支持按科室名称/拼音即时检索，自动级联带出空间、电话与管理专管员
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                主数据标准化校验
              </span>
            </div>

            {/* 科室检索 + 责任人检索 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DepartmentSearchSelect
                departments={departments}
                selectedDepartmentName={formData.department || ''}
                onSelectDepartment={(dept) => {
                  setFormData(prev => ({
                    ...prev,
                    department: dept.name,
                    building: dept.buildingName || prev.building,
                    floor: dept.defaultFloor || prev.floor,
                    nursePhone: dept.nursePhone || prev.nursePhone,
                    manager: dept.defaultManager || prev.manager
                  }));
                }}
              />

              <StaffSearchSelect
                staff={staff}
                currentDepartmentName={formData.department}
                selectedStaffName={formData.manager || ''}
                onSelectStaff={(person) => {
                  setFormData(prev => ({
                    ...prev,
                    manager: person.name
                  }));
                }}
              />
            </div>

            {/* 电话与楼层微调 & 具体使用场所 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>归属楼宇 (Building)</span>
                </label>
                <input
                  type="text"
                  value={formData.building || ''}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="例：1号楼 综合楼"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                  <span className="font-mono">#</span>
                  <span>所在楼层 (Floor)</span>
                </label>
                <input
                  type="text"
                  value={formData.floor || ''}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  placeholder="例：1F / 3F"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>护士站 / 抢救台分机</span>
                </label>
                <input
                  type="text"
                  value={formData.nursePhone || ''}
                  onChange={(e) => setFormData({ ...formData, nursePhone: e.target.value })}
                  placeholder="例：7991000"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>具体使用场所 / 房间</span>
                </label>
                <input
                  type="text"
                  value={formData.usageLocation || formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, usageLocation: e.target.value, location: e.target.value })}
                  placeholder="例：1号楼 3F 超声科1室"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* 4级级联空间选择器 (院区 -> 楼宇 -> 楼层 -> 房间) */}
            <div className="pt-2 border-t border-indigo-100/80">
              <CascadingSpacePicker
                campuses={campuses}
                buildings={buildings}
                rooms={rooms}
                currentBuilding={formData.building || ''}
                currentFloor={formData.floor || ''}
                currentLocationPath={formData.location || ''}
                onSelectSpace={(spaceData) => {
                  setFormData(prev => ({
                    ...prev,
                    building: spaceData.buildingName,
                    floor: spaceData.floor,
                    location: spaceData.fullLocationPath,
                    department: spaceData.departmentName || prev.department
                  }));
                }}
              />

              {/* 空间房间推荐快捷 Chips */}
              {filteredRoomsForDept.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] font-bold text-indigo-700">本科室/当前楼宇标准空间:</span>
                  {filteredRoomsForDept.slice(0, 5).map(rm => (
                    <button
                      type="button"
                      key={rm.id}
                      onClick={() => handleSelectRoom(rm)}
                      className="px-2 py-0.5 rounded bg-white hover:bg-indigo-100 border border-indigo-200 text-slate-700 text-[11px] font-mono transition cursor-pointer flex items-center gap-1 shadow-2xs hover:text-indigo-900"
                    >
                      <MapPin className="w-3 h-3 text-indigo-500" />
                      <span>{rm.roomName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: 寿命、计量与时间节点 */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-700">
              3. 寿命、采购与启用节点
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">购入日期</label>
                <input
                  type="date"
                  value={formData.purchaseDate || ''}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">出厂日期</label>
                <input
                  type="date"
                  value={formData.manufactureDate || ''}
                  onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">临床启用日期</label>
                <input
                  type="date"
                  value={formData.enableDate || ''}
                  onChange={(e) => setFormData({ ...formData, enableDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">设计机械寿命 (年)</label>
                <input
                  type="number"
                  placeholder="例：10"
                  value={formData.productValidity || ''}
                  onChange={(e) => setFormData({ ...formData, productValidity: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>保存设备档案</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
