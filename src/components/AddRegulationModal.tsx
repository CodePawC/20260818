import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Paperclip,
  Tag,
  ShieldCheck,
  History,
  Clock
} from 'lucide-react';
import { 
  RegulationItem, 
  RegulationCategory, 
  RegulationLevel, 
  RegulationStatus, 
  RegulationAttachment,
  RegulationRevisionRecord
} from '../types/regulationTypes';
import { ActiveTab } from '../types';

interface AddRegulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (regulation: RegulationItem) => void;
  initialData?: RegulationItem | null;
  departments?: { name: string }[];
}

const CATEGORY_OPTIONS: { value: RegulationCategory; label: string }[] = [
  { value: '法规依据', label: '法规依据与上级准则' },
  { value: '采购准入', label: '配置论证与采购准入' },
  { value: '运行维保', label: '日常运行与预防性维护(PM)' },
  { value: '计量强检', label: '法定强检与周期校准' },
  { value: '急救调配', label: '急救储备与应急调配' },
  { value: '维修闭环', label: '临床报修与返厂维修闭环' },
  { value: '质控安全', label: '质量控制与安全防护' },
  { value: '资产处置', label: '调拨盘点与报废处置' },
  { value: '外协协同', label: '外协服务商与议价协同' },
  { value: '培训考核', label: '人员资质与操作培训' },
  { value: '应急预案', label: '设备突发故障应急预案' }
];

const LEVEL_OPTIONS: { value: RegulationLevel; label: string }[] = [
  { value: 'national', label: '国家法律法规与行业标准' },
  { value: 'hospital', label: '院级核心规章制度' },
  { value: 'departmental', label: '医学工程科级工作细则' },
  { value: 'sop', label: '临床设备标准操作规程 (SOP)' },
  { value: 'emergency', label: '重大意外突发事件应急预案' }
];

const STATUS_OPTIONS: { value: RegulationStatus; label: string }[] = [
  { value: 'active', label: '现行有效' },
  { value: 'trial', label: '试行阶段' },
  { value: 'reviewing', label: '修订研讨中' },
  { value: 'obsolete', label: '已废止/停用' }
];

const SYSTEM_TAB_OPTIONS: { tab: ActiveTab; label: string; desc: string }[] = [
  { tab: 'ledger', label: '设备技术台账', desc: '关联全院设备档案与技术参数' },
  { tab: 'maintenance', label: '维保强检计划', desc: '关联PM排程与法定计量器具' },
  { tab: 'emergency_reserve', label: '应急调配中心', desc: '关联急救生命支持机具借还' },
  { tab: 'repair_closed_loop', label: '维修闭环管理', desc: '关联报修、勘查与返厂闭环' },
  { tab: 'adverse_events', label: '不良事件监测', desc: '关联医疗器械不良事件直报' },
  { tab: 'mobile_inspection', label: '移动巡检盘点', desc: '关联现场扫码纠偏与点检' },
  { tab: 'vendor_collaboration', label: '外协维修协同', desc: '关联服务商报价与联合议价' },
  { tab: 'approvals', label: '业务审批中心', desc: '关联立项论证与报废流转' },
  { tab: 'parts_inventory', label: '备品备件库存', desc: '关联配件仓储与出入库核销' },
  { tab: 'master_data', label: '系统基础档案', desc: '关联人员资质与主数据配置' }
];

export const AddRegulationModal: React.FC<AddRegulationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  departments = []
}) => {
  const isEditing = Boolean(initialData);

  const [code, setCode] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [title, setTitle] = useState('');
  const [shortTitle, setShortTitle] = useState('');
  const [category, setCategory] = useState<RegulationCategory>('运行维保');
  const [level, setLevel] = useState<RegulationLevel>('hospital');
  const [status, setStatus] = useState<RegulationStatus>('active');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [issuedBy, setIssuedBy] = useState('五莲县人民医院 医学工程保障中心');
  const [signatory, setSignatory] = useState('医学工程科主任');
  const [applicableDepartmentsText, setApplicableDepartmentsText] = useState('全院临床科室, 医学工程保障中心');
  const [keywordsText, setKeywordsText] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [isMustRead, setIsMustRead] = useState(false);
  const [selectedTab, setSelectedTab] = useState<ActiveTab | ''>('');
  const [attachments, setAttachments] = useState<RegulationAttachment[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');

  // 制度修订记录台账 (历次修改留痕)
  const [revisionHistory, setRevisionHistory] = useState<RegulationRevisionRecord[]>([]);
  const [newRevVersion, setNewRevVersion] = useState('');
  const [newRevDate, setNewRevDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRevApprover, setNewRevApprover] = useState('');
  const [newRevSummary, setNewRevSummary] = useState('');

  // 错误提示
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (initialData) {
        setCode(initialData.code);
        setDocNumber(initialData.docNumber);
        setTitle(initialData.title);
        setShortTitle(initialData.shortTitle || '');
        setCategory(initialData.category);
        setLevel(initialData.level);
        setStatus(initialData.status);
        setEffectiveDate(initialData.effectiveDate);
        setVersion(initialData.version);
        setIssuedBy(initialData.issuedBy);
        setSignatory(initialData.signatory);
        setApplicableDepartmentsText(initialData.applicableDepartments.join(', '));
        setKeywordsText(initialData.keywords.join(', '));
        setSummary(initialData.summary);
        setContent(initialData.content);
        setIsMustRead(Boolean(initialData.isMustReadForHospitalAccreditation));
        setSelectedTab(initialData.linkedSystemTab?.tab || '');
        setAttachments(initialData.attachments || []);
        // 初始化或保留修订历史
        const existingRevs: RegulationRevisionRecord[] = initialData.revisionHistory && initialData.revisionHistory.length > 0
          ? [...initialData.revisionHistory]
          : [
              {
                version: initialData.version || 'v1.0',
                date: initialData.revisionDate || initialData.effectiveDate || '2026-01-01',
                approver: initialData.signatory,
                author: initialData.issuedBy,
                summary: '初始版本颁布施行'
              }
            ];
        setRevisionHistory(existingRevs);
        setNewRevApprover(initialData.signatory);
      } else {
        const randomNo = Math.floor(Math.random() * 89 + 10);
        setCode(`YXGC-ZD-2026-${randomNo}`);
        setDocNumber(`院医工发〔2026〕${randomNo}号`);
        setTitle('');
        setShortTitle('');
        setCategory('运行维保');
        setLevel('hospital');
        setStatus('active');
        setEffectiveDate(new Date().toISOString().split('T')[0]);
        setVersion('v1.0');
        setIssuedBy('五莲县人民医院 医学工程保障中心');
        setSignatory('医学工程科主任');
        setApplicableDepartmentsText('全院临床科室, 医学工程保障中心');
        setKeywordsText('制度规范, 日常管理, 等级评审核心');
        setSummary('');
        setRevisionHistory([
          {
            version: 'v1.0',
            date: new Date().toISOString().split('T')[0],
            approver: '医学工程科主任',
            author: '医学工程保障中心',
            summary: '新制订本制度并正式发布执行'
          }
        ]);
        setNewRevApprover('医学工程科主任');
        setContent(`### 第一章 总则与规范目的
**第一条** 为进一步规范医疗设备管理，确保临床医疗安全与仪器完好率，制定本制度。

### 第二章 职责分工与协同
**第二条** 医学工程保障中心负责本制度的宣贯、技术支撑与执行监督；临床科室负责按规定履行日常操作与保管责任。

### 第三章 具体管理流程与要求
**第三条** 相关操作人员应当严格遵守操作规程，发现异常及时上报。

### 第四章 监督考核与附则
**第四条** 本制度自发布之日起施行，由医学工程保障中心负责解释。`);
        setIsMustRead(true);
        setSelectedTab('ledger');
        setAttachments([
          {
            id: `att-${Date.now()}-1`,
            name: '制度执行日常检查确认表.docx',
            size: '115 KB',
            type: 'docx',
            downloadCount: 0
          }
        ]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // 提取目录
  const parseTableOfContents = (markdownContent: string) => {
    const lines = markdownContent.split('\n');
    const toc: { id: string; title: string; level: number }[] = [];
    let count = 1;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        toc.push({
          id: `sec-${count++}`,
          title: trimmed.replace('### ', '').trim(),
          level: 1
        });
      } else if (trimmed.startsWith('#### ')) {
        toc.push({
          id: `sec-${count++}`,
          title: trimmed.replace('#### ', '').trim(),
          level: 2
        });
      }
    });
    if (toc.length === 0) {
      toc.push({ id: 'sec-1', title: '正文总纲', level: 1 });
    }
    return toc;
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const newAtt: RegulationAttachment = {
      id: `att-${Date.now()}`,
      name: newAttachmentName.trim(),
      size: `${Math.floor(Math.random() * 300 + 80)} KB`,
      type: newAttachmentName.endsWith('.pdf') ? 'pdf' : newAttachmentName.endsWith('.xlsx') ? 'xlsx' : 'docx',
      downloadCount: 0
    };
    setAttachments([...attachments, newAtt]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  // 添加修订记录
  const handleAddRevisionRecord = () => {
    if (!newRevSummary.trim()) {
      setErrorMsg('请填写修订记录的变更要点与原因！');
      return;
    }
    const record: RegulationRevisionRecord = {
      version: newRevVersion.trim() || `v${(parseFloat(version.replace('v', '')) + 0.1).toFixed(1)}`,
      date: newRevDate || new Date().toISOString().split('T')[0],
      approver: newRevApprover.trim() || signatory.trim() || '主管副院长',
      author: issuedBy.trim() || '医学工程保障中心',
      summary: newRevSummary.trim()
    };
    setRevisionHistory([...revisionHistory, record]);
    // 自动联动更新主版本号与签发审批人
    if (newRevVersion.trim()) {
      setVersion(newRevVersion.trim());
    }
    if (newRevApprover.trim()) {
      setSignatory(newRevApprover.trim());
    }
    setNewRevSummary('');
    setNewRevVersion('');
  };

  const handleRemoveRevisionRecord = (index: number) => {
    setRevisionHistory(revisionHistory.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('请填写制度完整名称！');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('请填写制度正文内容！');
      return;
    }

    const depts = applicableDepartmentsText
      .split(/[,，、;；]/)
      .map(s => s.trim())
      .filter(Boolean);

    const kws = keywordsText
      .split(/[,，、;；]/)
      .map(s => s.trim())
      .filter(Boolean);

    const linkedTabObj = SYSTEM_TAB_OPTIONS.find(o => o.tab === selectedTab);

    const regulationToSave: RegulationItem = {
      id: initialData?.id || `REG-${Date.now().toString().slice(-4)}`,
      code: code.trim() || `YXGC-ZD-${new Date().getFullYear()}-01`,
      docNumber: docNumber.trim() || `院医工发〔${new Date().getFullYear()}〕01号`,
      title: title.trim().startsWith('《') ? title.trim() : `《${title.trim()}》`,
      shortTitle: shortTitle.trim() || undefined,
      category,
      level,
      status,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      revisionDate: new Date().toISOString().split('T')[0],
      version: version.trim() || 'v1.0',
      revisionHistory: revisionHistory.length > 0 ? revisionHistory : undefined,
      issuedBy: issuedBy.trim() || '五莲县人民医院 医学工程保障中心',
      signatory: signatory.trim() || '医学工程科主任',
      applicableDepartments: depts.length > 0 ? depts : ['全院临床科室'],
      keywords: kws.length > 0 ? kws : ['管理制度'],
      summary: summary.trim() || title.trim(),
      tableOfContents: parseTableOfContents(content),
      content,
      attachments: attachments.length > 0 ? attachments : undefined,
      linkedSystemTab: linkedTabObj ? {
        tab: linkedTabObj.tab,
        label: linkedTabObj.label,
        description: linkedTabObj.desc
      } : undefined,
      readCount: initialData?.readCount || 1,
      isMustReadForHospitalAccreditation: isMustRead,
      updatedAt: new Date().toISOString()
    };

    onSave(regulationToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                {isEditing ? '修订 / 完善管理制度档案' : '存放 / 录入新管理规章制度'}
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/20 text-blue-50">
                  {isEditing ? initialData?.code : '新制度备案'}
                </span>
              </h2>
              <p className="text-xs text-blue-100/90 mt-0.5">
                录入权威规章制度正文、责任部门、分类标签及配套表单，全院人员可即时全文检索
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容区 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. 基本信息卡片 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>制度基本发文信息</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  制度内部编码 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value)}
                  placeholder="如 YXGC-ZD-2026-01"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  官方发文字号 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={docNumber} 
                  onChange={e => setDocNumber(e.target.value)}
                  placeholder="如 院医工发〔2026〕08号"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  版本号
                </label>
                <input 
                  type="text" 
                  value={version} 
                  onChange={e => setVersion(e.target.value)}
                  placeholder="如 v3.0"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                制度全称 (含书名号) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                placeholder="例如: 《医疗设备预防性维护(PM)与定期保养工作制度》"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  业务类别 <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value as RegulationCategory)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  制度层级 <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={level} 
                  onChange={e => setLevel(e.target.value as RegulationLevel)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LEVEL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  执行状态 <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as RegulationStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  施行生效日期 <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="date" 
                  value={effectiveDate} 
                  onChange={e => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  发布机构 / 责任部门
                </label>
                <input 
                  type="text" 
                  value={issuedBy} 
                  onChange={e => setIssuedBy(e.target.value)}
                  placeholder="五莲县人民医院 医学工程保障中心"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  签发审批人
                </label>
                <input 
                  type="text" 
                  value={signatory} 
                  onChange={e => setSignatory(e.target.value)}
                  placeholder="分管副院长 / 医工主任"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isMustRead} 
                  onChange={e => setIsMustRead(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  标记为「三甲综合医院评审核心必查制度」
                </span>
              </label>
            </div>
          </div>

          {/* 2. 适用科室与搜索关键词 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                适用范围 / 责任科室 (英文或中文逗号分隔)
              </label>
              <input 
                type="text" 
                value={applicableDepartmentsText} 
                onChange={e => setApplicableDepartmentsText(e.target.value)}
                placeholder="例如: 全院临床科室, 手术麻醉中心, 重症医学科"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                检索关键词标签 (支持全文即搜)
              </label>
              <input 
                type="text" 
                value={keywordsText} 
                onChange={e => setKeywordsText(e.target.value)}
                placeholder="例如: 预防性维护, PM计划, 巡检, 等级评审核心"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 3. 关联系统功能模块 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              联动系统业务模块 (查阅制度时可一键跳转前往实际功能操作)
            </label>
            <select 
              value={selectedTab} 
              onChange={e => setSelectedTab(e.target.value as ActiveTab | '')}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- 不绑定具体系统模块 (仅作为纯规章制度存储) --</option>
              {SYSTEM_TAB_OPTIONS.map(item => (
                <option key={item.tab} value={item.tab}>
                  【{item.label}】 - {item.desc}
                </option>
              ))}
            </select>
          </div>

          {/* 4. 制度摘要 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              制度核心要点与摘要
            </label>
            <textarea 
              rows={2}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="简要概括本制度管理规范核心要义与管理要求..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
          </div>

          {/* 5. 制度正式条文正文 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                制度正式条文正文 <span className="text-rose-500">*</span> (支持 Markdown 章节标记，如 ### 第一章 ...)
              </label>
              <span className="text-[11px] text-slate-400">
                以 ### 第一章 作为一级章节，系统将自动生成可点击目录导航
              </span>
            </div>
            <textarea 
              rows={12}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="编写或粘贴规章制度全文正文..."
              className="w-full font-mono text-xs px-3.5 py-3 bg-white border border-slate-300 rounded-xl leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              required
            />
          </div>

          {/* 6. 附件及配套表单 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                <span>配套执行表单 / 附件规程 (可供全院在线下载与查阅)</span>
              </div>
              <span className="text-[11px] text-slate-400">共 {attachments.length} 份附件</span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{att.name}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">({att.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="移除附件"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newAttachmentName}
                onChange={e => setNewAttachmentName(e.target.value)}
                placeholder="输入配套表单文件名，如: 医疗设备预防性维护PM巡检记录表.docx"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttachment();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加附件</span>
              </button>
            </div>
          </div>

          {/* 7. 制度修订记录台账 (版本沿革与签批留痕) */}
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <History className="w-4 h-4 text-indigo-600" />
                <span>制度修订记录台账 (版本沿革、签发审批与修改要点留痕)</span>
              </div>
              <span className="text-[11px] text-indigo-600 font-medium">已记录 {revisionHistory.length} 次修订</span>
            </div>

            {/* 历次修订记录清单 */}
            {revisionHistory.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-indigo-100 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-indigo-50/70 text-slate-700 font-semibold border-b border-indigo-100">
                    <tr>
                      <th className="py-2 px-3 w-16">版本号</th>
                      <th className="py-2 px-3 w-28">修订日期</th>
                      <th className="py-2 px-3 w-32">签发审批人</th>
                      <th className="py-2 px-3">修订要点与原因说明</th>
                      <th className="py-2 px-3 w-12 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {revisionHistory.map((rev, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-indigo-700">{rev.version}</td>
                        <td className="py-2 px-3 text-slate-600">{rev.date}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{rev.approver || '-'}</td>
                        <td className="py-2 px-3 text-slate-600 text-xs leading-relaxed">{rev.summary}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRevisionRecord(rIdx)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="删除此修订记录"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 新增修订记录输入行 */}
            <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-2.5">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>新增修订/审批批注记录</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <input
                    type="text"
                    value={newRevVersion}
                    onChange={e => setNewRevVersion(e.target.value)}
                    placeholder="新版本号 (例: v3.3)"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={newRevDate}
                    onChange={e => setNewRevDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newRevApprover}
                    onChange={e => setNewRevApprover(e.target.value)}
                    placeholder="本次签发审批人 (例: 医工科主任/副院长)"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRevSummary}
                  onChange={e => setNewRevSummary(e.target.value)}
                  placeholder="本次修订具体内容 (例: 增加第三方维修公司审批与付款流程细则)"
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRevisionRecord();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddRevisionRecord}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>添加记录</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* 底部按钮栏 */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            制度保存后将立即存入系统制度中心，支持即时全文检索、阅读与下载
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? '保存修订' : '确认存入制度库'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
