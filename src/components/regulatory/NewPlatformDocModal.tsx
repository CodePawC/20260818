import React, { useState } from 'react';
import { X, FileText, CheckCircle2, Upload, Tag } from 'lucide-react';
import { RegulatoryPlatform, RegulatoryDocument } from '../../types/regulatoryPlatformTypes';

interface NewPlatformDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: RegulatoryPlatform[];
  defaultPlatformId?: number;
  onSaveDoc: (doc: RegulatoryDocument) => void;
}

export const NewPlatformDocModal: React.FC<NewPlatformDocModalProps> = ({
  isOpen,
  onClose,
  platforms,
  defaultPlatformId,
  onSaveDoc
}) => {
  const [platformId, setPlatformId] = useState<number>(defaultPlatformId || (platforms[0]?.id || 1));
  const [docTitle, setDocTitle] = useState<string>('');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docCategory, setDocCategory] = useState<RegulatoryDocument['docCategory']>('批复批文');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [uploader, setUploader] = useState<string>('崔伟');
  const [summary, setSummary] = useState<string>('');
  const [tagsString, setTagsString] = useState<string>('国家下发文件, 监管备案');
  const [simulatedFileName, setSimulatedFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('3.2 MB');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      alert('请输入文件或公文名称');
      return;
    }

    const selectedPlat = platforms.find(p => p.id === Number(platformId));
    const now = new Date();
    const docId = `DOC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedTags = tagsString
      .split(/[,，、\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const newDoc: RegulatoryDocument = {
      id: docId,
      platformId: Number(platformId),
      platformName: selectedPlat?.platformName || '国家监管机构',
      managingAuthority: selectedPlat?.managingAuthority || selectedPlat?.superiorMinistry || '主管部门',
      docTitle: docTitle.trim(),
      docNumber: docNumber.trim() || '内部归档号',
      docCategory,
      issueDate: issueDate || now.toISOString().slice(0, 10),
      expiryDate: expiryDate ? expiryDate : '长期有效',
      fileType: simulatedFileName.endsWith('.doc') || simulatedFileName.endsWith('.docx') ? 'doc' : 'pdf',
      fileSize: fileSize || '2.4 MB',
      uploader: uploader.trim() || '经办人',
      uploadDate: now.toISOString().slice(0, 10),
      summary: summary.trim() || docTitle.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ['公文档案']
    };

    onSaveDoc(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <FileText className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">归档国家/省市机构下发文件与证书</h3>
              <p className="text-xs text-emerald-200 mt-0.5">保存生态环境部、市监局、卫健委等机构下发的红头公文、批复、许可证及报告</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm text-slate-700">
          {/* Target Platform */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              关联的国家/省市监管系统与发文机构 <span className="text-rose-500">*</span>
            </label>
            <select
              value={platformId}
              onChange={(e) => setPlatformId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {platforms.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.id}] {p.platformName} ({p.managingAuthority || p.superiorMinistry})
                </option>
              ))}
            </select>
          </div>

          {/* Doc Title */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              文件/公文/证照全称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="例如：关于XX建设项目放射防护设施竣工验收的批复 / 辐射安全许可证"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Row: Doc Number & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">发文字号 / 许可证编号 / 备案凭证号</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="例如：鲁环审[2024]88号 / 鲁特登2026-0042"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">公文类别</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as RegulatoryDocument['docCategory'])}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="批复批文">批复批文（如环评审查批复、竣工环保批文）</option>
                <option value="许可证照">许可证照（如辐射安全许可证、大型配置许可）</option>
                <option value="备案凭证">备案凭证（如建设项目备案回执、职业病申报表）</option>
                <option value="检验报告">检验报告（如特检院定检报告、强检证书）</option>
                <option value="政策法规">政策法规 / 规范标准</option>
                <option value="整改通报">整改通报 / 监察指令书</option>
                <option value="其他文件">其他公文资料</option>
              </select>
            </div>
          </div>

          {/* Row: Issue Date & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">发文 / 核发日期</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">有效截止日期 (留空则为长期有效)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* File Upload Simulation */}
          <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700">上传红头文件PDF/扫描件/Word电子文档</p>
                <p className="text-[11px] text-slate-500">支持 PDF, DOCX, PNG, JPG 格式，系统将自动留存归档</p>
              </div>
              <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors">
                <span>浏览文件</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setSimulatedFileName(file.name);
                      setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                      if (!docTitle) {
                        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                />
              </label>
            </div>
            {simulatedFileName && (
              <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center justify-between">
                <span>已就绪文件: <strong>{simulatedFileName}</strong> ({fileSize})</span>
                <span className="text-emerald-600 font-mono">校验通过</span>
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">主要内容摘要 / 批复核心意见</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="概括该文件的核心条款、批复结论或重要提醒事项..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Tags & Uploader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>检索标签 (逗号分隔)</span>
              </label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="生态环境部, 辐射安全, 验收"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">归档登记人</label>
              <input
                type="text"
                value={uploader}
                onChange={(e) => setUploader(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>确认归档入库</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
