import React, { useState, useEffect } from 'react';
import { PartnerOrganization, PartnerType } from '../types';
import { Building2, X, ShieldCheck, Phone, Mail, MapPin, FileText, CheckCircle2 } from 'lucide-react';

interface AddPartnerModalProps {
  isOpen: boolean;
  initialData?: PartnerOrganization | null;
  onClose: () => void;
  onSubmit: (partner: PartnerOrganization) => void;
}

export const AddPartnerModal: React.FC<AddPartnerModalProps> = ({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<PartnerOrganization>>({
    name: '',
    shortName: '',
    type: 'manufacturer',
    level: '设备生产厂家 / 原厂',
    contactPerson: '',
    contactTitle: '业务对接主管',
    contactPhone: '',
    hotline: '',
    email: '',
    address: '',
    website: '',
    qualifications: ['医疗器械生产/经营许可证', 'ISO 13485'],
    certNumbers: { '资质许可证': '2026-MED-001' },
    contractNo: `HT-${new Date().getFullYear()}-001`,
    contractName: '2026年度医学装备技术服务与维保协议',
    contractPeriod: '2026-01-01 至 2026-12-31',
    contractStatus: '履约中',
    serviceScope: ['设备定期校准与预防性维护', '急修应急响应与原厂备件保供'],
    turnaroundTime: '24 小时内完成检修并出具报告',
    emergencyResponse: '急救重症设备 2 小时到达现场',
    settlementTerms: '按季度对账核销，开具增值税专用发票',
    bankAccount: {
      bankName: '中国工商银行',
      accountNo: '',
      taxNo: '',
    },
    cooperationRating: 4.8,
    notes: '',
  });

  const [qualInput, setQualInput] = useState<string>('');
  const [scopeInput, setScopeInput] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        id: `PARTNER-${Date.now()}`,
        name: '',
        shortName: '',
        type: 'manufacturer',
        level: '设备生产厂家 / 原厂',
        contactPerson: '',
        contactTitle: '业务对接主管',
        contactPhone: '',
        hotline: '',
        email: '',
        address: '',
        website: '',
        qualifications: ['医疗器械生产/经营许可证', 'ISO 13485'],
        certNumbers: { '资质许可证': '2026-MED-001' },
        contractNo: `HT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        contractName: '2026年度医学装备技术服务与维保协议',
        contractPeriod: '2026-01-01 至 2026-12-31',
        contractStatus: '履约中',
        serviceScope: ['设备定期校准与预防性维护', '急修应急响应与原厂备件保供'],
        turnaroundTime: '24 小时内完成检修并出具报告',
        emergencyResponse: '急救重症设备 2 小时到达现场',
        settlementTerms: '按季度对账核销，开具增值税专用发票',
        bankAccount: {
          bankName: '中国工商银行',
          accountNo: '',
          taxNo: '',
        },
        cooperationRating: 4.8,
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('请填写单位全称');
      return;
    }

    const finalPartner: PartnerOrganization = {
      id: formData.id || `PARTNER-${Date.now()}`,
      name: formData.name.trim(),
      shortName: formData.shortName?.trim() || formData.name.trim().slice(0, 8),
      type: formData.type || 'manufacturer',
      level: formData.level || '设备制造/服务商',
      contactPerson: formData.contactPerson || '业务主管',
      contactTitle: formData.contactTitle || '客户经理',
      contactPhone: formData.contactPhone || '020-88888888',
      hotline: formData.hotline || '400-800-0000',
      email: formData.email || 'service@partner.com',
      address: formData.address || '医学产业园区',
      website: formData.website || '',
      qualifications: formData.qualifications || ['医疗器械资质备案'],
      certNumbers: formData.certNumbers || {},
      contractNo: formData.contractNo || `HT-2026-${Date.now().toString().slice(-4)}`,
      contractName: formData.contractName || '2026年度技术服务协议',
      contractPeriod: formData.contractPeriod || '2026-01-01 至 2026-12-31',
      contractStatus: formData.contractStatus || '履约中',
      serviceScope: formData.serviceScope || ['医学装备技术保障'],
      turnaroundTime: formData.turnaroundTime || '24小时响应',
      emergencyResponse: formData.emergencyResponse || '2小时急救响应',
      settlementTerms: formData.settlementTerms || '按季度结算',
      bankAccount: {
        bankName: formData.bankAccount?.bankName || '中国工商银行',
        accountNo: formData.bankAccount?.accountNo || '',
        taxNo: formData.bankAccount?.taxNo || '',
      },
      cooperationRating: formData.cooperationRating || 4.8,
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString().split('T')[0],
    };

    onSubmit(finalPartner);
    onClose();
  };

  const handleAddQualification = () => {
    if (!qualInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), qualInput.trim()]
    }));
    setQualInput('');
  };

  const handleRemoveQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: (prev.qualifications || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialData ? '编辑往来单位与服务商档案' : '登记新增往来单位与服务商'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                录入计量检定机构、原厂制造商、第三方维保公司及耗材供应商合作信息
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Section 1: Basic Classification */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. 机构属性与基本信息
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  单位全称 (营业执照/法定机构名称) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 深圳迈瑞生物医疗电子股份有限公司"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">系统显示简称</label>
                <input
                  type="text"
                  value={formData.shortName || ''}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="例如: 迈瑞医疗"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">单位类别分类</label>
                <select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as PartnerType;
                    let defaultLevel = '设备生产厂家 / 原厂';
                    if (newType === 'calibration_agency') defaultLevel = '省级/市级法定计量检定机构';
                    else if (newType === 'third_party_repair') defaultLevel = '专业第三方医疗设备维保机构';
                    else if (newType === 'supplier') defaultLevel = '备件耗材特约配送商';
                    setFormData({ ...formData, type: newType, level: defaultLevel });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="calibration_agency">法定计量检测机构 (强检/校准)</option>
                  <option value="manufacturer">设备生产厂家 / 原厂厂商 (OEM)</option>
                  <option value="third_party_repair">第三方专业维保公司 (ISO)</option>
                  <option value="supplier">备件与特约供货商 (SPD)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">资质级别/行业地位</label>
                <input
                  type="text"
                  value={formData.level || ''}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  placeholder="例如: 省级法定计量检定机构 / 行业上市原厂"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">合作履约状态</label>
                <select
                  value={formData.contractStatus}
                  onChange={(e) => setFormData({ ...formData, contractStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="履约中">履约中 (正常合作)</option>
                  <option value="长期合作">长期合作 (框架协议)</option>
                  <option value="临期需续签">临期需续签</option>
                  <option value="已到期">已到期</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contacts & Hotline */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. 专属对接团队与 24h 应急热线
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">对接联系人</label>
                <input
                  type="text"
                  value={formData.contactPerson || ''}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="例如: 周经理"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">职务/职称</label>
                <input
                  type="text"
                  value={formData.contactTitle || ''}
                  onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                  placeholder="例如: 华南区技术总监 / 资深工程师"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">联系电话 / 手机</label>
                <input
                  type="text"
                  value={formData.contactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="例如: 020-88889999 / 13800000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">24小时应急抢修热线</label>
                <input
                  type="text"
                  value={formData.hotline || ''}
                  onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                  placeholder="例如: 400-800-8888"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">官方服务邮箱</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="例如: service@partner.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">服务时效承诺 (SLA)</label>
                <input
                  type="text"
                  value={formData.emergencyResponse || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyResponse: e.target.value })}
                  placeholder="例如: 急救设备 2 小时响应"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1">服务基地 / 实验室基地地址</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="例如: 广州市天河区高新技术产业园区10号国家医学检验基地"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Qualifications and Certifications */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. 资质认证与合作协议
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">资质认证标签</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.qualifications?.map((q, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold border border-blue-200 flex items-center gap-1"
                    >
                      {q}
                      <button
                        type="button"
                        onClick={() => handleRemoveQualification(idx)}
                        className="text-blue-400 hover:text-blue-700 cursor-pointer ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qualInput}
                    onChange={(e) => setQualInput(e.target.value)}
                    placeholder="输入新资质（如 CMA、CNAS、ISO 13485、特种设备许可）"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddQualification}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs transition cursor-pointer"
                  >
                    + 添加资质
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">协议编号</label>
                  <input
                    type="text"
                    value={formData.contractNo || ''}
                    onChange={(e) => setFormData({ ...formData, contractNo: e.target.value })}
                    placeholder="例如: HT-2026-088"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">协议全称</label>
                  <input
                    type="text"
                    value={formData.contractName || ''}
                    onChange={(e) => setFormData({ ...formData, contractName: e.target.value })}
                    placeholder="例如: 2026年度医学装备技术服务与维保协议"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">合作履约有效期</label>
                  <input
                    type="text"
                    value={formData.contractPeriod || ''}
                    onChange={(e) => setFormData({ ...formData, contractPeriod: e.target.value })}
                    placeholder="2026-01-01 至 2026-12-31"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">结算条款与周期</label>
                  <input
                    type="text"
                    value={formData.settlementTerms || ''}
                    onChange={(e) => setFormData({ ...formData, settlementTerms: e.target.value })}
                    placeholder="例如: 按季度对账挂账核销，提供增值税专票"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Bank Account */}
          <div className="pt-3 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              4. 开户行与财务对账开票信息
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">开户银行</label>
                <input
                  type="text"
                  value={formData.bankAccount?.bankName || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount!, bankName: e.target.value }
                  })}
                  placeholder="中国工商银行广州分行"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">银行对公账号</label>
                <input
                  type="text"
                  value={formData.bankAccount?.accountNo || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount!, accountNo: e.target.value }
                  })}
                  placeholder="360200000000000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">纳税人识别号 (税号)</label>
                <input
                  type="text"
                  value={formData.bankAccount?.taxNo || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    bankAccount: { ...formData.bankAccount!, taxNo: e.target.value }
                  })}
                  placeholder="91440000XXXXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            <label className="block text-slate-700 font-semibold text-xs mb-1">备注说明</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="记录该往来单位的特殊维保要求、驻院工程师名单或备件仓位置等..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {initialData ? '保存修改' : '确认建档并保存'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
