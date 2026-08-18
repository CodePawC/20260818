import React, { useState } from 'react';
import { StakeholderClusterDefinition, STAKEHOLDER_CLUSTERS } from '../utils/staffRolesData';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Check, 
  X, 
  Building2, 
  Wrench, 
  Activity, 
  ShieldCheck, 
  Award, 
  Users, 
  Briefcase,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface StakeholderClusterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  clusters: StakeholderClusterDefinition[];
  onUpdateClusters: (newClusters: StakeholderClusterDefinition[]) => void;
}

const COLOR_PRESETS = [
  { id: 'teal', label: '青绿 (行政职能)', badge: 'bg-teal-50 text-teal-700 border-teal-200', bg: 'bg-teal-50/60', text: 'text-teal-800', dot: 'bg-teal-600', border: 'border-teal-200' },
  { id: 'indigo', label: '靛蓝 (医工保障)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', bg: 'bg-indigo-50/60', text: 'text-indigo-800', dot: 'bg-indigo-600', border: 'border-indigo-200' },
  { id: 'emerald', label: '翠绿 (临床医护)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bg: 'bg-emerald-50/60', text: 'text-emerald-800', dot: 'bg-emerald-600', border: 'border-emerald-200' },
  { id: 'amber', label: '琥珀 (原厂售后)', badge: 'bg-amber-50 text-amber-800 border-amber-200', bg: 'bg-amber-50/60', text: 'text-amber-800', dot: 'bg-amber-600', border: 'border-amber-200' },
  { id: 'sky', label: '天蓝 (三方维保)', badge: 'bg-sky-50 text-sky-700 border-sky-200', bg: 'bg-sky-50/60', text: 'text-sky-800', dot: 'bg-sky-600', border: 'border-sky-200' },
  { id: 'purple', label: '丁香紫 (法定计量)', badge: 'bg-purple-50 text-purple-700 border-purple-200', bg: 'bg-purple-50/60', text: 'text-purple-800', dot: 'bg-purple-600', border: 'border-purple-200' },
  { id: 'rose', label: '玫瑰红 (急救监管)', badge: 'bg-rose-50 text-rose-700 border-rose-200', bg: 'bg-rose-50/60', text: 'text-rose-800', dot: 'bg-rose-600', border: 'border-rose-200' },
  { id: 'slate', label: '岩灰 (后勤支撑)', badge: 'bg-slate-100 text-slate-700 border-slate-300', bg: 'bg-slate-100/70', text: 'text-slate-800', dot: 'bg-slate-600', border: 'border-slate-300' },
  { id: 'orange', label: '暖橙 (学术协作)', badge: 'bg-orange-50 text-orange-800 border-orange-200', bg: 'bg-orange-50/60', text: 'text-orange-800', dot: 'bg-orange-600', border: 'border-orange-200' }
];

export const StakeholderClusterConfigModal: React.FC<StakeholderClusterConfigModalProps> = ({
  isOpen,
  onClose,
  clusters,
  onUpdateClusters
}) => {
  const [editingCluster, setEditingCluster] = useState<StakeholderClusterDefinition | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    const newId = `cluster_custom_${Date.now().toString().slice(-4)}`;
    setFormId(newId);
    setFormName('');
    setFormShortName('');
    setFormDescription('');
    setSelectedColorIndex(0);
    setIsAddingNew(true);
    setEditingCluster(null);
  };

  const handleStartEdit = (cluster: StakeholderClusterDefinition) => {
    setFormId(cluster.id);
    setFormName(cluster.name);
    setFormShortName(cluster.shortName);
    setFormDescription(cluster.description);
    
    const colorIdx = COLOR_PRESETS.findIndex(c => cluster.badgeClass.includes(c.id));
    setSelectedColorIndex(colorIdx >= 0 ? colorIdx : 0);
    
    setEditingCluster(cluster);
    setIsAddingNew(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formShortName.trim()) {
      alert('请完整填写干系人群体全称与简称！');
      return;
    }

    const color = COLOR_PRESETS[selectedColorIndex] || COLOR_PRESETS[0];

    if (isAddingNew) {
      const newDef: StakeholderClusterDefinition = {
        id: formId || `cluster_custom_${Date.now()}`,
        name: formName.trim(),
        shortName: formShortName.trim(),
        description: formDescription.trim(),
        badgeClass: color.badge,
        bgColor: color.bg,
        textColor: color.text,
        dotColor: color.dot,
        borderColor: color.border,
        iconName: 'Users',
        isSystemDefault: false
      };
      onUpdateClusters([...clusters, newDef]);
    } else if (editingCluster) {
      const updated = clusters.map(c => {
        if (c.id === editingCluster.id) {
          return {
            ...c,
            name: formName.trim(),
            shortName: formShortName.trim(),
            description: formDescription.trim(),
            badgeClass: color.badge,
            bgColor: color.bg,
            textColor: color.text,
            dotColor: color.dot,
            borderColor: color.border
          };
        }
        return c;
      });
      onUpdateClusters(updated);
    }

    setIsAddingNew(false);
    setEditingCluster(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`确定删除自定义干系人群体分类 "${name}" 吗？`)) {
      onUpdateClusters(clusters.filter(c => c.id !== id));
      if (editingCluster?.id === id) {
        setEditingCluster(null);
      }
    }
  };

  const handleResetToDefault = () => {
    if (confirm('确定将干系人群体分类字典重置为系统出厂标准（包含医工、临床、行政职能、原厂、三方、计量机构）吗？')) {
      onUpdateClusters(STAKEHOLDER_CLUSTERS);
      setIsAddingNew(false);
      setEditingCluster(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="font-bold text-base text-white">干系人群体分类字典配置 (Stakeholder Clusters Manager)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持新增各类行政管理部门、外部协作单位、监管评审专家等自定义干系人群体
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Left: Cluster List */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>当前群体分类矩阵</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[11px]">
                  {clusters.length} 个分类
                </span>
              </span>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetToDefault}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded transition flex items-center gap-1 cursor-pointer"
                  title="恢复出厂标准设置"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置出厂</span>
                </button>
                <button
                  onClick={handleStartAdd}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增分类</span>
                </button>
              </div>
            </div>

            {clusters.map((cluster) => {
              const isSelected = editingCluster?.id === cluster.id;
              return (
                <div
                  key={cluster.id}
                  className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-teal-50/80 border-teal-400 shadow-xs ring-1 ring-teal-400/40' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${cluster.badgeClass}`}>
                          {cluster.shortName}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{cluster.name}</span>
                        {cluster.isSystemDefault && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                            内置
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {cluster.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(cluster)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer transition"
                        title="编辑此分类"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {!cluster.isSystemDefault && (
                        <button
                          onClick={() => handleDelete(cluster.id, cluster.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition"
                          title="删除此分类"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Add/Edit Form */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-between bg-white overflow-y-auto">
            {isAddingNew || editingCluster ? (
              <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>{isAddingNew ? '录入新干系人群体分类' : `编辑分类: ${editingCluster?.name}`}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingCluster(null);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    取消
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    群体标识代码 (Key) <span className="text-slate-400 font-normal">(英文唯一标识)</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isAddingNew || editingCluster?.isSystemDefault}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="例: hospital_administration / external_experts"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono text-xs bg-slate-50 disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      群体全称 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例: 院内行政与职能监管集群"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      界面简短标签 (2-6字) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例: 行政职能 / 评审专家"
                      value={formShortName}
                      onChange={(e) => setFormShortName(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    职责描述与涵盖部门/机构范围
                  </label>
                  <textarea
                    rows={3}
                    placeholder="简述该群体的职能定位，例如：涵盖医务科、护理部、院感科、财务科、采购招标办、保卫消防、信息网络、医保物价等职能部门对接人。"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    视觉徽章与主题色标
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((color, idx) => {
                      const isSelected = selectedColorIndex === idx;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setSelectedColorIndex(idx)}
                          className={`p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer transition ${
                            isSelected 
                              ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${color.badge}`}>
                            {color.label.split(' ')[0]}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-800 font-bold" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preview Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold text-slate-500 mb-1">实时徽章与卡片预览</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold border ${COLOR_PRESETS[selectedColorIndex]?.badge}`}>
                      {formShortName || '分类简称'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{formName || '群体全称'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingCluster(null);
                    }}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>保存分类配置</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Layers className="w-12 h-12 text-slate-300 mb-3" />
                <h5 className="font-bold text-slate-700 text-sm">选择左侧分类进行编辑或点击新增</h5>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  系统默认提供 6 大标准群体（含行政职能部门）。您可以根据医院实际管理架构，自由增设新的干系人群体。
                </p>
                <button
                  onClick={handleStartAdd}
                  className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增干系人群体分类</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            提示：新增分类后，将在人员录入、批量导入、批量编辑及顶部筛选矩阵中即时生效。
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs cursor-pointer"
          >
            完成并返回名册
          </button>
        </div>

      </div>
    </div>
  );
};
