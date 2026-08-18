import React, { useState } from 'react';
import { StaffRoleDefinition } from '../types';
import { DEFAULT_STAFF_ROLES, getRoleBadgeStyle } from '../utils/staffRolesData';
import { 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Layers, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface StaffRoleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: StaffRoleDefinition[];
  onUpdateRoles: (newRoles: StaffRoleDefinition[]) => void;
}

const AVAILABLE_PERMISSIONS = [
  '台账管理',
  '故障报修',
  '工单维修',
  '抢修响应',
  '强检申报',
  '计量计划',
  '法定检定',
  '质控抽检',
  '不良事件',
  '预防性维护',
  '报废签署',
  '立项论证',
  '应急调配',
  '备用机出入库',
  '日常巡检',
  '交接班盘点',
  '原厂大修',
  '托管巡检',
  // 行政职能管理权限
  '技术准入',
  '临床安全',
  '不良事件调查',
  '灭菌质控',
  '感控监测',
  '内镜洗消',
  '资产建卡',
  '折旧计提',
  '固定资产盘点',
  '报废核销',
  '成本效益核算',
  '招投标管理',
  '商务合同',
  '供应商资质审核',
  '网络准入',
  'PACS/DICOM接口',
  '网络安全审计',
  '消防安全',
  '放射源保卫',
  '物价编码',
  '医保对标',
  '收费合规审核',
  '采购审计',
  '效益审计',
  '急救设备督导',
  '操作规范考核'
];

export const StaffRoleConfigModal: React.FC<StaffRoleConfigModalProps> = ({
  isOpen,
  onClose,
  roles,
  onUpdateRoles
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [editingRole, setEditingRole] = useState<StaffRoleDefinition | null>(null);
  const [isEditingNew, setIsEditingNew] = useState(false);

  if (!isOpen) return null;

  const filteredRoles = roles.filter(r => {
    if (activeCategory === 'ALL') return true;
    return r.category === activeCategory;
  });

  const handleSaveRole = (roleToSave: StaffRoleDefinition) => {
    if (!roleToSave.name.trim()) {
      alert('请填写角色名称！');
      return;
    }

    const idx = roles.findIndex(r => r.id === roleToSave.id);
    if (idx !== -1) {
      const updated = [...roles];
      updated[idx] = roleToSave;
      onUpdateRoles(updated);
    } else {
      onUpdateRoles([...roles, roleToSave]);
    }
    setEditingRole(null);
    setIsEditingNew(false);
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    if (confirm(`确定删除自定义角色 "${roleName}" 吗？已关联此角色的人员仍将保留角色名称。`)) {
      onUpdateRoles(roles.filter(r => r.id !== roleId));
      if (editingRole?.id === roleId) {
        setEditingRole(null);
      }
    }
  };

  const handleResetDefaultRoles = () => {
    if (confirm('确定恢复系统标准角色设定字典（共 10 种标准角色）吗？')) {
      onUpdateRoles(DEFAULT_STAFF_ROLES);
    }
  };

  const togglePermission = (perm: string) => {
    if (!editingRole) return;
    const current = editingRole.permissions || [];
    if (current.includes(perm)) {
      setEditingRole({
        ...editingRole,
        permissions: current.filter(p => p !== perm)
      });
    } else {
      setEditingRole({
        ...editingRole,
        permissions: [...current, perm]
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] max-h-[780px] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">人员与工程师角色设定与职责字典</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  共 {roles.length} 种角色
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                定义全院临床设备管理员、医学工程部工程师、计量专员、质控主管与厂商驻场人员的岗位职责与权限标签
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Categories Bar & Actions */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-semibold">角色大类:</span>
            {[
              { id: 'ALL', label: '全部角色' },
              { id: 'clinical', label: '临床科室管理' },
              { id: 'engineering', label: '医学工程保障' },
              { id: 'administration', label: '行政与职能监管' },
              { id: 'management', label: '科室与院级管理' },
              { id: 'partner', label: '厂商与合作保障' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-md transition font-bold cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newRole: StaffRoleDefinition = {
                  id: `ROLE_CUSTOM_${Date.now()}`,
                  name: '',
                  category: 'engineering',
                  categoryLabel: '医学工程保障',
                  description: '',
                  badgeColor: 'indigo',
                  permissions: ['台账管理', '故障报修'],
                  isSystemDefault: false
                };
                setEditingRole(newRole);
                setIsEditingNew(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建自定义角色</span>
            </button>

            <button
              onClick={handleResetDefaultRoles}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition shadow-2xs"
              title="恢复系统预设的标准角色字典"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>恢复标准预设</span>
            </button>
          </div>
        </div>

        {/* Content Body: Role Grid + Role Editor Panel */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row bg-slate-100/40">
          
          {/* Left: Role List Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredRoles.map(role => {
                const style = getRoleBadgeStyle(role.name);
                const isSelected = editingRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => {
                      setEditingRole(role);
                      setIsEditingNew(false);
                    }}
                    className={`p-4 rounded-xl border bg-white transition cursor-pointer flex flex-col justify-between shadow-2xs ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' 
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
                              {role.name}
                            </span>
                            {role.isSystemDefault ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                系统标准
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                自定义
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                            归类：{role.categoryLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRole(role);
                              setIsEditingNew(false);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="编辑角色职责"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!role.isSystemDefault && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRole(role.id, role.name);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer ml-1"
                              title="删除角色"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {role.description || '暂无角色详细描述'}
                      </p>
                    </div>

                    {/* Permissions list */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-500 mb-1">
                        核心权责与职能标签:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map(p => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px]">未分配职能权限</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Role Detail / Editor Drawer */}
          {editingRole ? (
            <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-5 flex flex-col justify-between shrink-0 shadow-lg animate-in slide-in-from-right-4 duration-150">
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{isEditingNew ? '新建角色定义' : `配置角色: ${editingRole.name}`}</span>
                  </h4>
                  <button
                    onClick={() => setEditingRole(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">角色名称 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    placeholder="例：驻场专机工程师 / 质控专员"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">所属大类</label>
                  <select
                    value={editingRole.category}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const labelMap: Record<string, string> = {
                        clinical: '临床科室管理',
                        engineering: '医学工程保障',
                        administration: '行政与职能监管',
                        management: '科室与院级管理',
                        partner: '厂商与合作保障'
                      };
                      setEditingRole({
                        ...editingRole,
                        category: val,
                        categoryLabel: labelMap[val] || '医学工程保障'
                      });
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="clinical">临床科室管理</option>
                    <option value="engineering">医学工程保障</option>
                    <option value="administration">行政与职能监管 (医务/院感/财务/招标/信息等)</option>
                    <option value="management">科室与院级管理</option>
                    <option value="partner">厂商与合作保障</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1">岗位职责与权责说明</label>
                  <textarea
                    rows={3}
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    placeholder="简述该角色的主要业务工作范围、考核重点与对接事项..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 resize-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 text-xs mb-1.5">
                    点选权责与职能标签 (已勾选 {(editingRole.permissions || []).length} 项):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AVAILABLE_PERMISSIONS.map(perm => {
                      const isChecked = (editingRole.permissions || []).includes(perm);
                      return (
                        <button
                          key={perm}
                          type="button"
                          onClick={() => togglePermission(perm)}
                          className={`px-2 py-1.5 rounded-md text-[11px] font-medium border flex items-center justify-between transition cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{perm}</span>
                          {isChecked && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 shrink-0 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRole(editingRole)}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>保存角色配置</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex w-80 border-l border-slate-200 p-6 flex-col items-center justify-center text-center text-slate-400">
              <Info className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-medium">点击左侧任意角色卡片即可查看或修改角色权责与权限标签</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
