import React, { useState, useEffect } from 'react';
import { X, Building2, ShieldCheck, Globe, Key, Lock, User, FileText, CheckCircle2, Hash } from 'lucide-react';
import { RegulatoryPlatform } from '../../types/regulatoryPlatformTypes';

interface NewPlatformUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: RegulatoryPlatform) => void;
  editingPlatform?: RegulatoryPlatform | null;
  existingPlatforms: RegulatoryPlatform[];
}

export const NewPlatformUnitModal: React.FC<NewPlatformUnitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPlatform,
  existingPlatforms
}) => {
  const [platformName, setPlatformName] = useState<string>('');
  const [superiorMinistry, setSuperiorMinistry] = useState<string>('国家市场监督管理总局');
  const [customSuperiorMinistry, setCustomSuperiorMinistry] = useState<string>('');
  const [affiliationRelation, setAffiliationRelation] = useState<string>('隶属');
  const [managingAuthority, setManagingAuthority] = useState<string>('');
  const [systemLevel, setSystemLevel] = useState<RegulatoryPlatform['systemLevel']>('国家级');
  const [category, setCategory] = useState<RegulatoryPlatform['category']>('special_equipment');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    if (editingPlatform) {
      setPlatformName(editingPlatform.platformName || '');
      if (['中华人民共和国生态环境部', '国家市场监督管理总局', '国家卫生健康委员会', '山东省市场监督管理局', '日照市市场监督管理局'].includes(editingPlatform.superiorMinistry)) {
        setSuperiorMinistry(editingPlatform.superiorMinistry);
        setCustomSuperiorMinistry('');
      } else {
        setSuperiorMinistry('other');
        setCustomSuperiorMinistry(editingPlatform.superiorMinistry || '');
      }
      setAffiliationRelation(editingPlatform.affiliationRelation || '');
      setManagingAuthority(editingPlatform.managingAuthority || '');
      setSystemLevel(editingPlatform.systemLevel || '国家级');
      setCategory(editingPlatform.category || 'other');
      setUsername(editingPlatform.username || '');
      setPassword(editingPlatform.password || '');
      setUrl(editingPlatform.url || '');
      setRemarks(editingPlatform.remarks || '');
    } else {
      // New unit defaults
      const maxId = existingPlatforms.reduce((max, p) => Math.max(max, p.id), 0);
      setPlatformName('');
      setSuperiorMinistry('国家市场监督管理总局');
      setCustomSuperiorMinistry('');
      setAffiliationRelation('隶属');
      setManagingAuthority('');
      setSystemLevel('国家级');
      setCategory('special_equipment');
      setUsername('12371121494574329G'); // default to hospital uniform credit code
      setPassword('');
      setUrl('');
      setRemarks('');
    }
  }, [editingPlatform, existingPlatforms, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platformName.trim()) {
      alert('请填写监管平台/档案单位名称');
      return;
    }

    const finalSuperior = superiorMinistry === 'other' 
      ? customSuperiorMinistry.trim() || '其他国家/省市监管部门'
      : superiorMinistry;

    const nextId = editingPlatform 
      ? editingPlatform.id 
      : (existingPlatforms.reduce((max, p) => Math.max(max, p.id), 0) + 1);

    const platformData: RegulatoryPlatform = {
      id: nextId,
      platformName: platformName.trim(),
      superiorMinistry: finalSuperior,
      affiliationRelation: affiliationRelation.trim() || '业务指导',
      managingAuthority: managingAuthority.trim() || finalSuperior,
      systemLevel,
      category,
      username: username.trim(),
      password: password.trim(),
      url: url.trim() || '#',
      remarks: remarks.trim(),
      lastLoginDate: editingPlatform?.lastLoginDate || new Date().toISOString().slice(0, 10),
      totalLogins: editingPlatform?.totalLogins || 0,
      docCount: editingPlatform?.docCount || 0
    };

    onSave(platformData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Building2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {editingPlatform ? '修改监管档案单位信息' : '录入新的监管档案单位'}
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                录入国家、省级或市属监管机构平台、对应登录账号密码及办事联络指南
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-700 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Platform Name */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>平台名称 / 档案单位全称 <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="例如：全国放射卫生信息管理平台 / 山东省特种设备综合检验与监管平台"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
              required
            />
          </div>

          {/* Row 2: Superior Ministry & Affiliation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                隶属机关 <span className="text-rose-500">*</span>
              </label>
              <select
                value={superiorMinistry}
                onChange={(e) => setSuperiorMinistry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="中华人民共和国生态环境部">中华人民共和国生态环境部</option>
                <option value="国家市场监督管理总局">国家市场监督管理总局</option>
                <option value="国家卫生健康委员会">国家卫生健康委员会</option>
                <option value="山东省市场监督管理局">山东省市场监督管理局</option>
                <option value="日照市市场监督管理局">日照市市场监督管理局</option>
                <option value="other">自定义其他部委机关...</option>
              </select>
              {superiorMinistry === 'other' && (
                <input
                  type="text"
                  value={customSuperiorMinistry}
                  onChange={(e) => setCustomSuperiorMinistry(e.target.value)}
                  placeholder="请输入具体隶属部委/机关名称"
                  className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                />
              )}
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">隶属关系</label>
              <input
                type="text"
                value={affiliationRelation}
                onChange={(e) => setAffiliationRelation(e.target.value)}
                placeholder="例如：同一部门 / 直属 / 隶属 / 下辖指导"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Managing Authority & System Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                管理机关 (具体直属单位/市监局/特检院)
              </label>
              <input
                type="text"
                value={managingAuthority}
                onChange={(e) => setManagingAuthority(e.target.value)}
                placeholder="例如：山东省特种设备检验研究院 / 日照市市场监督管理局"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">系统层级</label>
                <select
                  value={systemLevel}
                  onChange={(e) => setSystemLevel(e.target.value as RegulatoryPlatform['systemLevel'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
                >
                  <option value="国家级">国家级</option>
                  <option value="省级">省级</option>
                  <option value="市级">市级</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">监管业务分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RegulatoryPlatform['category'])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs"
                >
                  <option value="special_equipment">特种设备</option>
                  <option value="radiation">核技术与辐射</option>
                  <option value="medical_device">医疗器械与MDR</option>
                  <option value="metrology">法定强检计量</option>
                  <option value="environmental">环保竣工验收</option>
                  <option value="occupational_health">职业病危害</option>
                  <option value="other">综合监管</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 4: Credentials Box (Username & Password) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-amber-600" />
              <span>登录凭据 (账号密码安全存储)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  用户名 / 统一信用代码 / 手机号
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="如: cuiwei / 12371121494574329G"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  系统登录密码
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入登录密码（保存后默认掩码保护）"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Row 5: URL */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>系统官方登录网址链接</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="例如：https://beian.china-eia.com/a/login"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            />
          </div>

          {/* Row 6: Remarks & Mailing Address */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>备注 / 业务指南 / 线下材料邮寄窗口与联系电话</span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="例如：放射源转移纸质材料邮寄：济南市市中区站前路9号山东省政务服务中心三楼C10窗口 收件人 C10窗口 0531 82083225..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs"
            />
          </div>

          {/* Footer Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingPlatform ? '保存修改' : '确认录入并建档'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
