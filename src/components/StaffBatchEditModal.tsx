import React, { useState } from 'react';
import { StaffPersonMaster, DepartmentMaster, StaffRoleDefinition, StakeholderCluster } from '../types';
import { SPECIALTY_DOMAIN_OPTIONS, STAKEHOLDER_CLUSTERS, StakeholderClusterDefinition } from '../utils/staffRolesData';
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Tag, 
  Users, 
  X,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

interface StaffBatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStaffIds: string[];
  allStaff: StaffPersonMaster[];
  departments: DepartmentMaster[];
  roles: StaffRoleDefinition[];
  clusters?: StakeholderClusterDefinition[];
  onBatchUpdate: (updatedStaff: StaffPersonMaster[]) => void;
}

export const StaffBatchEditModal: React.FC<StaffBatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedStaffIds,
  allStaff,
  departments,
  roles,
  clusters = STAKEHOLDER_CLUSTERS,
  onBatchUpdate
}) => {
  // Field enable flags
  const [updateCluster, setUpdateCluster] = useState(false);
  const [targetCluster, setTargetCluster] = useState<string>('hospital_administration');

  const [updateOrg, setUpdateOrg] = useState(false);
  const [targetOrg, setTargetOrg] = useState<string>('五莲县人民医院');

  const [updateDept, setUpdateDept] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState<string>(departments[0]?.id || '303');

  const [updateRole, setUpdateRole] = useState(false);
  const [targetRole, setTargetRole] = useState<string>(roles[0]?.name || '设备管理员');

  const [updateStatus, setUpdateStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'active' | 'inactive' | 'on_leave'>('active');

  const [updateEmergencyTier, setUpdateEmergencyTier] = useState(false);
  const [targetEmergencyTier, setTargetEmergencyTier] = useState<'L1' | 'L2' | 'L3' | 'none'>('L1');

  const [updatePrimary, setUpdatePrimary] = useState(false);
  const [targetPrimary, setTargetPrimary] = useState<boolean>(true);

  const [updateSpecialties, setUpdateSpecialties] = useState(false);
  const [specialtyMode, setSpecialtyMode] = useState<'append' | 'replace'>('append');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  if (!isOpen || selectedStaffIds.length === 0) return null;

  const selectedStaffMembers = allStaff.filter(s => selectedStaffIds.includes(s.id));

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter(s => s !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const handleApplyBatchChanges = () => {
    if (!updateCluster && !updateOrg && !updateDept && !updateRole && !updateStatus && !updateEmergencyTier && !updatePrimary && !updateSpecialties) {
      alert('请至少勾选并配置一项批量修改内容！');
      return;
    }

    const targetDept = departments.find(d => d.id === targetDeptId);

    const updatedStaffList = allStaff.map(member => {
      if (!selectedStaffIds.includes(member.id)) return member;

      let updated = { ...member };

      if (updateCluster) {
        updated.stakeholderCategory = targetCluster;
      }

      if (updateOrg && targetOrg.trim()) {
        updated.organization = targetOrg.trim();
      }

      if (updateDept && targetDept) {
        updated.departmentId = targetDept.id;
        updated.departmentName = targetDept.name;
      }

      if (updateRole) {
        updated.role = targetRole;
      }

      if (updateStatus) {
        updated.status = targetStatus;
      }

      if (updateEmergencyTier) {
        updated.emergencyTier = targetEmergencyTier;
      }

      if (updatePrimary) {
        updated.isPrimaryContact = targetPrimary;
      }

      if (updateSpecialties) {
        if (specialtyMode === 'replace') {
          updated.specialties = selectedSpecialties.length > 0 ? [...selectedSpecialties] : undefined;
        } else {
          // append mode
          const current = updated.specialties || [];
          const merged = Array.from(new Set([...current, ...selectedSpecialties]));
          updated.specialties = merged.length > 0 ? merged : undefined;
        }
      }

      return updated;
    });

    onBatchUpdate(updatedStaffList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base text-white">批量修改干系人与工程师档案</h3>
              <p className="text-xs text-slate-300">
                已选中 <strong className="text-amber-400">{selectedStaffIds.length}</strong> 位人员记录，勾选下方需要同步修改的属性
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target summary preview */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold shrink-0">待修改成员:</span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {selectedStaffMembers.slice(0, 8).map(s => (
              <span key={s.id} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px] shrink-0">
                {s.name} ({s.departmentName})
              </span>
            ))}
            {selectedStaffMembers.length > 8 && (
              <span className="text-slate-400 text-xs shrink-0 font-mono">
                +等 {selectedStaffMembers.length} 人
              </span>
            )}
          </div>
        </div>

        {/* Options Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* 1. Dry Cluster & Org */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cluster */}
            <div className={`p-3.5 rounded-xl border transition ${updateCluster ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateCluster}
                    onChange={(e) => setUpdateCluster(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>批量修改干系人群体类型</span>
                </label>
              </div>
              {updateCluster && (
                <select
                  value={targetCluster}
                  onChange={(e) => setTargetCluster(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 font-medium text-teal-700"
                >
                  {clusters.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.shortName})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Org */}
            <div className={`p-3.5 rounded-xl border transition ${updateOrg ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateOrg}
                    onChange={(e) => setUpdateOrg(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>批量修改所属单位/企业</span>
                </label>
              </div>
              {updateOrg && (
                <input
                  type="text"
                  placeholder="例：通用电气医疗 / 深圳迈瑞 / 五莲县人民医院"
                  value={targetOrg}
                  onChange={(e) => setTargetOrg(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
          </div>

          {/* 2. Department & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Department */}
            <div className={`p-3.5 rounded-xl border transition ${updateDept ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateDept}
                    onChange={(e) => setUpdateDept(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>批量修改所属科室</span>
                </label>
              </div>
              {updateDept && (
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Role */}
            <div className={`p-3.5 rounded-xl border transition ${updateRole ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateRole}
                    onChange={(e) => setUpdateRole(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>批量变更角色岗位职责</span>
                </label>
              </div>
              {updateRole && (
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name} ({r.categoryLabel})</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* 3. Emergency Tier & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Emergency Tier */}
            <div className={`p-3.5 rounded-xl border transition ${updateEmergencyTier ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateEmergencyTier}
                    onChange={(e) => setUpdateEmergencyTier(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>批量调整应急响应梯队</span>
                </label>
              </div>
              {updateEmergencyTier && (
                <select
                  value={targetEmergencyTier}
                  onChange={(e) => setTargetEmergencyTier(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="L1">L1 一线现场快速响应 (急救/抢修第一责任人)</option>
                  <option value="L2">L2 院内医工专业保障 (维修主管/质控/计量)</option>
                  <option value="L3">L3 原厂专家/24H远程支持 (原厂专机大修)</option>
                  <option value="none">无应急响应梯队 (常规人员/销售专员)</option>
                </select>
              )}
            </div>

            {/* Status */}
            <div className={`p-3.5 rounded-xl border transition ${updateStatus ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>批量变更在职状态</span>
                </label>
              </div>
              {updateStatus && (
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">在职 (Active) - 正常指派与展示</option>
                  <option value="on_leave">休假中 (On Leave) - 临时暂停调度</option>
                  <option value="inactive">离职/停用 (Inactive) - 存档停用</option>
                </select>
              )}
            </div>
          </div>

          {/* 4. Primary Contact Switch */}
          <div className={`p-3.5 rounded-xl border transition ${updatePrimary ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updatePrimary}
                  onChange={(e) => setUpdatePrimary(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>批量设定科室首要设备对接责任人</span>
              </label>
            </div>
            {updatePrimary && (
              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="batchPrimaryRadio"
                    checked={targetPrimary === true}
                    onChange={() => setTargetPrimary(true)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-emerald-700">设为本科室首选责任人</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="batchPrimaryRadio"
                    checked={targetPrimary === false}
                    onChange={() => setTargetPrimary(false)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-600">取消首选责任人标记</span>
                </label>
              </div>
            )}
          </div>

          {/* 5. Specialties Batch Assignment */}
          <div className={`p-3.5 rounded-xl border transition ${updateSpecialties ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 font-bold text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateSpecialties}
                  onChange={(e) => setUpdateSpecialties(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>批量分配专长领域与服务产品线</span>
              </label>

              {updateSpecialties && (
                <div className="flex items-center gap-2 text-[11px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="specialtyMode"
                      checked={specialtyMode === 'append'}
                      onChange={() => setSpecialtyMode('append')}
                      className="text-indigo-600"
                    />
                    <span>追加到已有专长</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="specialtyMode"
                      checked={specialtyMode === 'replace'}
                      onChange={() => setSpecialtyMode('replace')}
                      className="text-indigo-600"
                    />
                    <span className="text-rose-600 font-bold">全量替换覆盖</span>
                  </label>
                </div>
              )}
            </div>

            {updateSpecialties && (
              <div className="mt-3">
                <div className="text-[11px] text-slate-500 mb-2">点击勾选需要批量赋权的专长领域：</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {SPECIALTY_DOMAIN_OPTIONS.map(opt => {
                    const isSelected = selectedSpecialties.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleSpecialty(opt)}
                        className={`px-2 py-1.5 rounded text-[11px] text-left border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 text-purple-800 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * 仅勾选启用的配置项会应用到已选人员
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition cursor-pointer text-xs"
            >
              取消
            </button>
            <button
              onClick={handleApplyBatchChanges}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>确认应用批量修改</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
