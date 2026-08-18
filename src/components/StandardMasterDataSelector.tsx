import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  UserCheck, 
  Search, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Layers, 
  Building, 
  Compass, 
  X,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  DepartmentMaster, 
  StaffPersonMaster, 
  LocationRoomMaster, 
  BuildingMaster, 
  CampusMaster,
  NmpaCategoryMasterItem
} from '../types';

// ==========================================
// 1. 检索式标准科室选择器 (Department Search Combobox)
// ==========================================
interface DepartmentSearchSelectProps {
  departments: DepartmentMaster[];
  selectedDepartmentName: string;
  onSelectDepartment: (dept: DepartmentMaster) => void;
  label?: string;
  required?: boolean;
}

export const DepartmentSearchSelect: React.FC<DepartmentSearchSelectProps> = ({
  departments,
  selectedDepartmentName,
  onSelectDepartment,
  label = '使用科室 (主数据字典)',
  required = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const set = new Set(departments.map(d => d.category));
    return ['ALL', ...Array.from(set)];
  }, [departments]);

  const currentDept = useMemo(() => {
    return departments.find(d => d.name === selectedDepartmentName);
  }, [departments, selectedDepartmentName]);

  // 搜索过滤（支持科室名、编码、拼音首字母估算、楼宇）
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const matchCat = selectedCategory === 'ALL' || d.category === selectedCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.buildingName.toLowerCase().includes(q) ||
        (d.leader && d.leader.toLowerCase().includes(q)) ||
        (d.defaultManager && d.defaultManager.toLowerCase().includes(q))
      );
    });
  }, [departments, searchQuery, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </span>
        <span className="text-[10px] text-indigo-600 font-normal">支持拼音/代码即时检索</span>
      </label>

      {/* Trigger Button */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full px-3 py-2 bg-white border rounded-lg flex items-center justify-between cursor-pointer transition shadow-2xs ${
          isOpen 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
            : 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/20'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {currentDept ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-slate-900 text-xs truncate">
                {currentDept.name}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 text-indigo-700 shrink-0">
                {currentDept.category}
              </span>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline truncate">
                ({currentDept.buildingName} {currentDept.defaultFloor})
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs">请选择标准科室...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-none ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full md:w-[420px] left-0 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box & Category Filter */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="快速搜索科室名称、编码或楼号..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat === 'ALL' ? '全部类别' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredDepartments.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                未找到匹配的标准科室
              </div>
            ) : (
              filteredDepartments.map(dept => {
                const isSelected = dept.name === selectedDepartmentName;
                return (
                  <div
                    key={dept.id}
                    onClick={() => {
                      onSelectDepartment(dept);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 rounded-lg flex items-start justify-between gap-2 cursor-pointer transition ${
                      isSelected 
                        ? 'bg-indigo-50/80 border border-indigo-200' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {dept.name}
                        </span>
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {dept.code}
                        </span>
                        <span className="px-1.5 py-0.2 text-[9px] font-semibold rounded bg-indigo-100 text-indigo-700">
                          {dept.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{dept.buildingName} {dept.defaultFloor}</span>
                        </span>
                        {dept.nursePhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{dept.nursePhone}</span>
                          </span>
                        )}
                        {dept.defaultManager && (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>{dept.defaultManager}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-1">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 2. 级联式空间与房间选择器 (Cascading Space & Room Picker)
// ==========================================
interface CascadingSpacePickerProps {
  campuses: CampusMaster[];
  buildings: BuildingMaster[];
  rooms: LocationRoomMaster[];
  currentBuilding: string;
  currentFloor: string;
  currentLocationPath: string;
  onSelectSpace: (data: {
    campusName: string;
    buildingName: string;
    floor: string;
    roomName?: string;
    fullLocationPath: string;
    departmentName?: string;
  }) => void;
}

export const CascadingSpacePicker: React.FC<CascadingSpacePickerProps> = ({
  campuses,
  buildings,
  rooms,
  currentBuilding,
  currentFloor,
  currentLocationPath,
  onSelectSpace
}) => {
  const [selectedCampusId, setSelectedCampusId] = useState<string>(() => {
    const matchedBuilding = buildings.find(b => b.name === currentBuilding);
    return matchedBuilding?.campusId || campuses[0]?.id || '';
  });

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(() => {
    const matchedBuilding = buildings.find(b => b.name === currentBuilding);
    return matchedBuilding?.id || buildings[0]?.id || '';
  });

  const [selectedFloor, setSelectedFloor] = useState<string>(currentFloor || '1F');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 联动可选项
  const availableBuildings = useMemo(() => {
    if (!selectedCampusId) return buildings;
    return buildings.filter(b => b.campusId === selectedCampusId);
  }, [buildings, selectedCampusId]);

  const activeBuilding = useMemo(() => {
    return buildings.find(b => b.id === selectedBuildingId) || availableBuildings[0];
  }, [buildings, selectedBuildingId, availableBuildings]);

  const availableFloors = useMemo(() => {
    return activeBuilding?.floors || ['-1F', '1F', '2F', '3F', '4F', '5F', '6F'];
  }, [activeBuilding]);

  // 根据当前选择过滤出来的可用房间
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchBuilding = !activeBuilding || r.buildingId === activeBuilding.id || r.buildingName === activeBuilding.name;
      const matchFloor = !selectedFloor || r.floor === selectedFloor;
      if (!roomSearchQuery.trim()) {
        return matchBuilding && matchFloor;
      }
      const q = roomSearchQuery.toLowerCase().trim();
      return (
        r.roomName.toLowerCase().includes(q) ||
        r.roomCode.toLowerCase().includes(q) ||
        r.fullLocationPath.toLowerCase().includes(q)
      );
    });
  }, [rooms, activeBuilding, selectedFloor, roomSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApplyCascade = (room?: LocationRoomMaster) => {
    const campusObj = campuses.find(c => c.id === selectedCampusId) || campuses[0];
    const buildingObj = activeBuilding;
    const campusName = campusObj?.name || '滨江总院区';
    const buildingName = buildingObj?.name || currentBuilding || '1号楼 综合楼';
    const floor = selectedFloor || '1F';
    const roomName = room ? room.roomName : '';
    const fullPath = room 
      ? room.fullLocationPath 
      : `${campusName} > ${buildingName} > ${floor}${roomName ? ` > ${roomName}` : ''}`;

    onSelectSpace({
      campusName,
      buildingName,
      floor,
      roomName,
      fullLocationPath: fullPath,
      departmentName: room?.departmentName
    });
    setIsPickerOpen(false);
  };

  return (
    <div className="space-y-2 relative" ref={popoverRef}>
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>空间与安装位置 (支持院区/楼宇/楼层/房间4级级联)</span>
        </label>
        <button
          type="button"
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
        >
          <Layers className="w-3 h-3" />
          <span>{isPickerOpen ? '收起级联选择面板' : '展开空间层级级联选择器'}</span>
        </button>
      </div>

      {/* 快捷呈现栏 */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-5">
          <div className="px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs flex items-center gap-1.5 font-medium text-slate-800">
            <Building className="w-3.5 h-3.5 text-slate-400 flex-none" />
            <span className="truncate">{currentBuilding || '未选择楼宇'}</span>
          </div>
        </div>
        <div className="col-span-2">
          <div className="px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-mono font-bold text-center text-indigo-900">
            {currentFloor || '1F'}
          </div>
        </div>
        <div className="col-span-5">
          <input
            type="text"
            value={currentLocationPath || ''}
            onChange={(e) => onSelectSpace({
              campusName: '',
              buildingName: currentBuilding,
              floor: currentFloor,
              fullLocationPath: e.target.value
            })}
            placeholder="精确安装位置 (如: 急诊抢救室01)"
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* 级联展开弹出层 */}
      {isPickerOpen && (
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200">标准空间位置 4 级级联与房间字典点选</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPickerOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 级联选择网格 */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {/* Step 1: 院区 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                1. 选择所属院区
              </label>
              <select
                value={selectedCampusId}
                onChange={(e) => {
                  setSelectedCampusId(e.target.value);
                  const firstB = buildings.find(b => b.campusId === e.target.value);
                  if (firstB) setSelectedBuildingId(firstB.id);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-indigo-400 outline-hidden"
              >
                {campuses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Step 2: 实体楼宇 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                2. 选择实体楼宇
              </label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-indigo-400 outline-hidden"
              >
                {availableBuildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Step 3: 楼层 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                3. 选择楼层 (Floor)
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-indigo-400 outline-hidden"
              >
                {availableFloors.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 4: 空间房间/床位点选 */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <span>4. 点选标准房间/床位 (已匹配 {filteredRooms.length} 个标准点位)</span>
              </label>
              <div className="relative w-48">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="搜索房间或工位..."
                  className="w-full pl-6 pr-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[11px] text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800">
              {filteredRooms.length === 0 ? (
                <div className="col-span-full py-4 text-center text-slate-500 text-xs">
                  当前楼层暂无预置房间，点击右下角按钮直接应用「楼宇+楼层」
                </div>
              ) : (
                filteredRooms.map(r => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => handleApplyCascade(r)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600/80 border border-slate-700 hover:border-indigo-400 text-left transition group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white group-hover:text-white truncate">
                        {r.roomName}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                        {r.roomCode}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-indigo-100 flex items-center justify-between mt-1">
                      <span>{r.roomType}</span>
                      {r.departmentName && <span className="truncate">{r.departmentName}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer of Cascade */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              预览路径: <span className="text-indigo-300 font-mono font-medium">{activeBuilding?.campusName} &gt; {activeBuilding?.name} &gt; {selectedFloor}</span>
            </span>
            <button
              type="button"
              onClick={() => handleApplyCascade()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>应用当前楼层空间</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 3. 检索式责任人与工程师选择器 (Staff Search Combobox)
// ==========================================
interface StaffSearchSelectProps {
  staff: StaffPersonMaster[];
  currentDepartmentName?: string;
  selectedStaffName: string;
  onSelectStaff: (person: StaffPersonMaster) => void;
  label?: string;
}

export const StaffSearchSelect: React.FC<StaffSearchSelectProps> = ({
  staff,
  currentDepartmentName,
  selectedStaffName,
  onSelectStaff,
  label = '设备责任人 / 医工专管员'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStaff = useMemo(() => {
    return staff.find(s => s.name === selectedStaffName);
  }, [staff, selectedStaffName]);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.employeeNo.toLowerCase().includes(q) ||
        s.departmentName.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    });
  }, [staff, searchQuery]);

  // 区分：科室直接人员 vs 医工/工程团队人员
  const deptStaff = useMemo(() => {
    return filteredStaff.filter(s => s.departmentName === currentDepartmentName);
  }, [filteredStaff, currentDepartmentName]);

  const engineeringStaff = useMemo(() => {
    return filteredStaff.filter(s => s.departmentName !== currentDepartmentName);
  }, [filteredStaff, currentDepartmentName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block font-bold text-slate-800 text-xs mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{label}</span>
        </span>
        <span className="text-[10px] text-slate-500 font-normal">支持姓名/工号/电话检索</span>
      </label>

      {/* Trigger */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full px-3 py-2 bg-white border rounded-lg flex items-center justify-between cursor-pointer transition shadow-2xs ${
          isOpen 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
            : 'border-slate-200 hover:border-indigo-300'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {currentStaff ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-slate-900 text-xs">
                {currentStaff.name}
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 shrink-0">
                {currentStaff.role}
              </span>
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                {currentStaff.departmentName} · {currentStaff.phone}
              </span>
            </div>
          ) : (
            <span className="text-slate-800 font-medium text-xs">{selectedStaffName || '请选择责任人...'}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-none ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full md:w-[380px] right-0 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 bg-slate-50 border-b border-slate-200">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索责任人姓名、工号、角色或电话..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredStaff.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                未找到匹配的人员
              </div>
            ) : (
              <>
                {deptStaff.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50/50 rounded">
                      本科室推荐责任人
                    </div>
                    {deptStaff.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectStaff(p);
                          setIsOpen(false);
                        }}
                        className="p-2 rounded hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{p.name}</span>
                            <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-600 font-mono">{p.employeeNo}</span>
                            <span className="text-[10px] text-emerald-700 font-semibold">{p.role}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{p.phone}</div>
                        </div>
                        {p.name === selectedStaffName && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                    ))}
                  </div>
                )}

                {engineeringStaff.length > 0 && (
                  <div className="p-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/60 rounded">
                      医学工程处 / 跨科室专管员
                    </div>
                    {engineeringStaff.map(p => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectStaff(p);
                          setIsOpen(false);
                        }}
                        className="p-2 rounded hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{p.name}</span>
                            <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-600 font-mono">{p.employeeNo}</span>
                            <span className="text-[10px] text-indigo-700">{p.departmentName} - {p.role}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{p.phone}</div>
                        </div>
                        {p.name === selectedStaffName && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. 国家NMPA医疗器械三级分类级联选择器 (NMPA Cascading Category Picker)
// ==========================================
interface CascadingCategoryPickerProps {
  categoryMaster: NmpaCategoryMasterItem[];
  selectedCategory: string;       // 大类 e.g. "06 医用成像器械"
  selectedLevel1: string;         // 一级分类 e.g. "诊断 X 射线机"
  selectedLevel2: string;         // 二级分类 e.g. "摄影 X 射线机 (DR)"
  onSelect: (result: {
    categoryNo: string;
    category: string;
    level1No: string;
    level1Category: string;
    level2No: string;
    level2Category: string;
    item?: NmpaCategoryMasterItem;
  }) => void;
  quickMatchedItem?: NmpaCategoryMasterItem | null;
}

export const CascadingCategoryPicker: React.FC<CascadingCategoryPickerProps> = ({
  categoryMaster,
  selectedCategory,
  selectedLevel1,
  selectedLevel2,
  onSelect,
  quickMatchedItem
}) => {
  // 提取所有可用的大类列表
  const mainCategories = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    categoryMaster.forEach(c => {
      if (!map.has(c.categoryName)) {
        map.set(c.categoryName, { code: c.categoryCode, name: c.categoryName });
      }
    });
    return Array.from(map.values());
  }, [categoryMaster]);

  // 根据当前选中的大类，筛选对应的一级分类
  const level1Options = useMemo(() => {
    if (!selectedCategory) return [];
    const map = new Map<string, { code: string; name: string }>();
    categoryMaster
      .filter(c => c.categoryName === selectedCategory || c.categoryCode === selectedCategory.split(' ')[0])
      .forEach(c => {
        if (!map.has(c.level1Name)) {
          map.set(c.level1Name, { code: c.level1Code, name: c.level1Name });
        }
      });
    return Array.from(map.values());
  }, [categoryMaster, selectedCategory]);

  // 根据当前选中的一级分类，筛选对应的二级分类
  const level2Options = useMemo(() => {
    if (!selectedLevel1) return [];
    return categoryMaster.filter(c => 
      (c.categoryName === selectedCategory || c.categoryCode === selectedCategory.split(' ')[0]) &&
      (c.level1Name === selectedLevel1 || c.level1Code === selectedLevel1.split(' ')[0])
    );
  }, [categoryMaster, selectedCategory, selectedLevel1]);

  const handleMainCategoryChange = (catName: string) => {
    const matched = categoryMaster.find(c => c.categoryName === catName);
    const catCode = matched?.categoryCode || catName.split(' ')[0] || '';
    
    // 自动联动取该大类下第一个一级、二级分类
    const l1List = categoryMaster.filter(c => c.categoryCode === catCode || c.categoryName === catName);
    const firstL1 = l1List[0];
    
    onSelect({
      categoryNo: catCode,
      category: catName,
      level1No: firstL1?.level1Code || '',
      level1Category: firstL1?.level1Name || '',
      level2No: firstL1?.level2Code || '',
      level2Category: firstL1?.level2Name || '',
      item: firstL1
    });
  };

  const handleLevel1Change = (l1Name: string) => {
    const matched = categoryMaster.find(c => 
      (c.categoryName === selectedCategory || c.categoryCode === selectedCategory.split(' ')[0]) &&
      c.level1Name === l1Name
    );
    onSelect({
      categoryNo: matched?.categoryCode || selectedCategory.split(' ')[0] || '',
      category: selectedCategory,
      level1No: matched?.level1Code || '',
      level1Category: l1Name,
      level2No: matched?.level2Code || '',
      level2Category: matched?.level2Name || '',
      item: matched
    });
  };

  const handleLevel2Change = (l2Name: string) => {
    const matched = categoryMaster.find(c => 
      (c.categoryName === selectedCategory || c.categoryCode === selectedCategory.split(' ')[0]) &&
      c.level1Name === selectedLevel1 &&
      c.level2Name === l2Name
    );
    if (matched) {
      onSelect({
        categoryNo: matched.categoryCode,
        category: matched.categoryName,
        level1No: matched.level1Code,
        level1Category: matched.level1Name,
        level2No: matched.level2Code,
        level2Category: matched.level2Name,
        item: matched
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* 智能推荐快速采纳卡片 */}
      {quickMatchedItem && (
        <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/80 flex items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-indigo-950">AI 智能匹配国家分类主数据：</span>
              <span className="text-indigo-800 font-medium">
                {quickMatchedItem.categoryName} <ArrowRight className="w-3 h-3 inline text-indigo-400 mx-0.5" /> {quickMatchedItem.level1Name} <ArrowRight className="w-3 h-3 inline text-indigo-400 mx-0.5" /> {quickMatchedItem.level2Name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect({
                categoryNo: quickMatchedItem.categoryCode,
                category: quickMatchedItem.categoryName,
                level1No: quickMatchedItem.level1Code,
                level1Category: quickMatchedItem.level1Name,
                level2No: quickMatchedItem.level2Code,
                level2Category: quickMatchedItem.level2Name,
                item: quickMatchedItem
              });
            }}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shrink-0 transition-colors shadow-2xs text-[11px]"
          >
            一键采纳
          </button>
        </div>
      )}

      {/* 三级级联下拉框 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* 1. 大类 (Category) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            大类 (NMPA 22大类) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => handleMainCategoryChange(e.target.value)}
              className="w-full text-xs py-2 pl-2.5 pr-7 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium text-slate-800 appearance-none"
            >
              <option value="">-- 请选择大类 --</option>
              {mainCategories.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 2. 一级分类 (Level 1) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            一级分类 (子类目)
          </label>
          <div className="relative">
            <select
              value={selectedLevel1}
              onChange={(e) => handleLevel1Change(e.target.value)}
              disabled={!selectedCategory || level1Options.length === 0}
              className="w-full text-xs py-2 pl-2.5 pr-7 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium text-slate-800 appearance-none"
            >
              <option value="">-- 请选择一级分类 --</option>
              {level1Options.map(l1 => (
                <option key={l1.name} value={l1.name}>
                  {l1.code ? `[${l1.code}] ` : ''}{l1.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 3. 二级分类 (Level 2) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            二级分类 (标准品类)
          </label>
          <div className="relative">
            <select
              value={selectedLevel2}
              onChange={(e) => handleLevel2Change(e.target.value)}
              disabled={!selectedLevel1 || level2Options.length === 0}
              className="w-full text-xs py-2 pl-2.5 pr-7 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium text-slate-800 appearance-none"
            >
              <option value="">-- 请选择二级分类 --</option>
              {level2Options.map(l2 => (
                <option key={l2.id} value={l2.level2Name}>
                  {l2.level2Name} ({l2.riskClass})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

