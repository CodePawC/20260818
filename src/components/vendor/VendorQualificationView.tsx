import React, { useState } from 'react';
import { 
  ShieldCheck, Upload, Search, Filter, AlertTriangle, 
  CheckCircle2, Clock, Calendar, Building, FileText, 
  Download, Eye, Plus, X, Award, Sparkles, Check, 
  ExternalLink, Printer
} from 'lucide-react';
import { 
  CorporateQualification, 
  QualificationType,
  QualificationCategory,
  VendorUserAccount 
} from '../../types/vendorCollaborationTypes';

interface VendorQualificationViewProps {
  currentVendor: VendorUserAccount;
  qualifications: CorporateQualification[];
  onAddOrUpdateQualification: (qualification: CorporateQualification) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorQualificationView: React.FC<VendorQualificationViewProps> = ({
  currentVendor,
  qualifications,
  onAddOrUpdateQualification,
  onToast,
}) => {
  const [filterType, setFilterType] = useState<QualificationType | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewQual, setPreviewQual] = useState<CorporateQualification | null>(null);

  // 上传/补充资质表单状态
  const [qualType, setQualType] = useState<QualificationCategory>('DEVICE_OPERATION_PERMIT');
  const [qualName, setQualName] = useState('医疗器械经营许可证 (二类/三类服务与销售)');
  const [certNo, setCertNo] = useState(`苏械经营许2026${Math.floor(1000 + Math.random() * 9000)}号`);
  const [authority, setAuthority] = useState('江苏省药品监督管理局');
  const [validFrom, setValidFrom] = useState('2024-01-01');
  const [validUntil, setValidUntil] = useState('2029-12-31');
  const [legalPerson, setLegalPerson] = useState(currentVendor.contactPerson || '陈伟民');
  const [scope, setScope] = useState('Ⅲ类、Ⅱ类医疗器械维保、修理、租赁与零配件供应，重点涵盖医用磁共振、CT及超声诊断设备。');
  const [fileName, setFileName] = useState('企业营业执照与经营许可证原件扫描件.pdf');

  // 统计指标
  const totalCount = qualifications.length;
  const validCount = qualifications.filter(q => q.status === 'VALID').length;
  const expiringCount = qualifications.filter(q => q.status === 'EXPIRING_SOON').length;
  const pendingCount = qualifications.filter(q => q.status === 'UNDER_REVIEW' || q.status === 'PENDING_AUDIT').length;

  const filteredQualifications = qualifications.filter(q => {
    const matchesType = filterType === 'ALL' || q.category === filterType;
    const displayName = q.title || q.name || '';
    const matchesKeyword = 
      !searchKeyword ||
      displayName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.certificateNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      q.issuingAuthority.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesType && matchesKeyword;
  });

  const handleOpenUploadModal = (typeToSelect?: QualificationCategory) => {
    if (typeToSelect) setQualType(typeToSelect);
    setShowUploadModal(true);
  };

  const handleSaveQualification = (e: React.FormEvent) => {
    e.preventDefault();

    // 计算到期天数
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status = diffDays < 0 ? 'EXPIRED' : diffDays <= 60 ? 'EXPIRING_SOON' : 'VALID';

    const newQual: CorporateQualification = {
      id: `QUAL-${Date.now()}`,
      vendorId: currentVendor.vendorId,
      category: qualType,
      title: qualName,
      name: qualName,
      certificateNo: certNo,
      issuingAuthority: authority,
      issuedDate: validFrom,
      expiryDate: validUntil,
      validFrom,
      validUntil,
      daysToExpiry: diffDays,
      status,
      legalPerson,
      registeredCapital: '1000 万元人民币',
      scopeOfOperation: scope,
      businessScope: scope,
      fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      fileName,
      uploadedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      verifiedByHospital: true,
      notes: '由供应商法人资质库同步，经医院医工处资质合规审核认证备案。'
    };

    onAddOrUpdateQualification(newQual);
    setShowUploadModal(false);
    onToast(`✅ 企业资质【${qualName}】已成功上传并归档！`, 'success');
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 顶部标题与资质合规仪表盘 */}
      <div className="bg-white border-b border-slate-200 p-4 sm:p-5 shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                企业资质与证照准入管理
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                全资质在线审查合格
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              本模块统一上传并管理企业法人营业执照、医疗器械经营许可证、厂家原厂授权书及工程师资质证书
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onToast('正在生成《五莲县人民医院外协企业全套资质审查合规档案.pdf》...', 'info')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>导出资质审查档案</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenUploadModal()}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>上传/补充新资质证照</span>
            </button>
          </div>
        </div>

        {/* 4组指标卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 font-medium">已归档总资质</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalCount} 项</div>
          </div>
          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80">
            <span className="text-teal-800 font-medium">在期有效准入资质</span>
            <div className="text-xl font-bold font-mono text-teal-700 mt-1">{validCount} 项</div>
          </div>
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
            <span className="text-amber-800 font-medium">临期预警 (60天内)</span>
            <div className="text-xl font-bold font-mono text-amber-700 mt-1">{expiringCount} 项</div>
          </div>
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
            <span className="text-blue-800 font-medium">医院医工处审核备案</span>
            <div className="text-xl font-bold font-mono text-blue-700 mt-1">100% 备案率</div>
          </div>
        </div>
      </div>

      {/* 搜索与分类Tab切换 */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索资质名称、证书编号、发证机关..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto">
            {[
              { id: 'ALL', label: '全部资质' },
              { id: 'BUSINESS_LICENSE', label: '营业执照' },
              { id: 'DEVICE_OPERATION_PERMIT', label: '医疗器械许可' },
              { id: 'MANUFACTURER_AUTH_LETTER', label: '厂家授权书' },
              { id: 'RADIATION_SAFETY_PERMIT', label: '辐射安全许可' },
              { id: 'ENGINEER_CERTIFICATION', label: '工程师证书' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  filterType === tab.id
                    ? 'bg-teal-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          共展现 <strong className="font-mono text-slate-800">{filteredQualifications.length}</strong> 份法定证照
        </div>
      </div>

      {/* 资质卡片网格列表 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQualifications.map(qual => {
            const isValid = qual.status === 'VALID';
            const isExpiring = qual.status === 'EXPIRING_SOON';
            const isExpired = qual.status === 'EXPIRED';
            const qualExpiryDate = qual.expiryDate || qual.validUntil || '2029-12-31';
            const qualDisplayName = qual.title || qual.name || '法定资质证照';
            const daysLeft = qual.daysToExpiry ?? 365;

            return (
              <div
                key={qual.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-teal-300 hover:shadow-sm transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isExpiring ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
                      }`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {qual.certificateNo}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      isExpiring ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {isValid ? '在期有效' : isExpiring ? `临期 (${daysLeft}天)` : '已过期'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-3 group-hover:text-teal-700 transition leading-snug">
                    {qualDisplayName}
                  </h3>

                  <div className="mt-2 text-xs text-slate-500 space-y-1">
                    <div>发证机关: <span className="text-slate-800">{qual.issuingAuthority}</span></div>
                    {qual.legalPerson && (
                      <div>法定代表人: <span className="text-slate-800">{qual.legalPerson}</span></div>
                    )}
                    {(qual.scopeOfOperation || qual.businessScope) && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 line-clamp-2">
                        {qual.scopeOfOperation || qual.businessScope}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      有效期至: <strong className="font-mono text-slate-700">{qualExpiryDate}</strong>
                    </span>
                    <span className="font-mono font-medium text-slate-600">
                      距到期 {daysLeft} 天
                    </span>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-3">
                    <div 
                      className={`h-1.5 rounded-full ${
                        isExpiring ? 'bg-amber-500' : isExpired ? 'bg-red-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, (qual.daysToExpiry / 730) * 100))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewQual(qual)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>查看证照详情</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQualName(qual.name);
                        setCertNo(qual.certificateNo);
                        setAuthority(qual.issuingAuthority);
                        setShowUploadModal(true);
                      }}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                    >
                      更新换证
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 证照详情预览模态框 */}
      {previewQual && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">{previewQual.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQual(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div><span className="text-slate-400">证书编号：</span><strong className="font-mono text-slate-900">{previewQual.certificateNo}</strong></div>
                <div><span className="text-slate-400">发证机关：</span><span className="text-slate-800">{previewQual.issuingAuthority}</span></div>
                <div><span className="text-slate-400">有效期期限：</span><span className="font-mono text-slate-800">{previewQual.validFrom} 至 {previewQual.validUntil}</span></div>
                {previewQual.legalPerson && (
                  <div><span className="text-slate-400">法定代表人：</span><span className="text-slate-800">{previewQual.legalPerson}</span></div>
                )}
                {previewQual.registeredCapital && (
                  <div><span className="text-slate-400">注册资本：</span><span className="text-slate-800">{previewQual.registeredCapital}</span></div>
                )}
              </div>

              {previewQual.businessScope && (
                <div>
                  <span className="font-bold text-slate-700 block mb-1">准入经营与维保许可范围：</span>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 leading-relaxed">
                    {previewQual.businessScope}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div className="text-teal-900 font-medium">医院医工处资质认证结论：</div>
                <span className="font-bold text-teal-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  审核通过・准入备案
                </span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">电子资质防伪查验一致</span>
              <button
                type="button"
                onClick={() => setPreviewQual(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 上传新资质模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">上传与申报企业法定资质</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQualification} className="p-5 space-y-3 overflow-y-auto text-xs">
              
              {/* 证件扫描件上传 */}
              <div className="border-2 border-dashed border-teal-200 bg-teal-50/40 rounded-xl p-4 text-center space-y-1">
                <Upload className="w-6 h-6 text-teal-600 mx-auto" />
                <div className="text-slate-700 font-semibold">上传资质正本扫描件 / 电子证照 (PDF/图片)</div>
                <p className="text-[11px] text-slate-400 truncate max-w-xs mx-auto">已选文件: {fileName}</p>
                <label className="inline-block px-3 py-1 rounded-lg bg-white border border-teal-200 text-teal-700 font-bold text-xs shadow-2xs cursor-pointer hover:bg-teal-50">
                  选择本地文件
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFileName(e.target.files[0].name);
                        onToast(`已选定资质文件: ${e.target.files[0].name}`);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">资质证照类型</label>
                  <select
                    value={qualType}
                    onChange={(e) => setQualType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="BUSINESS_LICENSE">企业法人营业执照 (统一社会信用代码)</option>
                    <option value="DEVICE_OPERATION_PERMIT">医疗器械经营许可证 (二类/三类)</option>
                    <option value="MANUFACTURER_AUTH_LETTER">原厂设备维修技术授权书</option>
                    <option value="RADIATION_SAFETY_PERMIT">辐射安全许可证 (含射线装置)</option>
                    <option value="SPECIAL_EQUIPMENT_CERT">特种设备安装维保资质</option>
                    <option value="ENGINEER_CERTIFICATION">原厂主任工程师认证资质证书</option>
                    <option value="ISO_QUALITY_MANAGEMENT">ISO9001/ISO13485质量管理体系认证</option>
                    <option value="OTHER_CREDENTIAL">其他资质备案证明</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">证照全称</label>
                  <input
                    type="text"
                    required
                    value={qualName}
                    onChange={(e) => setQualName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">证书编号 / 统一代码</label>
                  <input
                    type="text"
                    required
                    value={certNo}
                    onChange={(e) => setCertNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">发证行政机关</label>
                  <input
                    type="text"
                    required
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">有效起始日</label>
                  <input
                    type="date"
                    required
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">有效截止日</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">法定许可与准入经营范围</label>
                <textarea
                  rows={2}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>提交审核备案</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
