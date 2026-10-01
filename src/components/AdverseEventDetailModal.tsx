import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Download, 
  Send, 
  Clock, 
  FileText, 
  Building2, 
  User, 
  Stethoscope, 
  Wrench, 
  Tag, 
  History,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  AdverseEventRecord, 
  AdverseEventCapa,
  CausalityConclusion 
} from '../types/adverseEventTypes';
import { 
  getSeverityConfig, 
  getStatusConfig, 
  getCausalityConfig,
  generateNmpaXmlReport,
  reportEventToNmpa
} from '../utils/adverseEventData';

interface AdverseEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AdverseEventRecord | null;
  currentUserName?: string;
  onUpdateEvent: (updated: AdverseEventRecord) => void;
}

export const AdverseEventDetailModal: React.FC<AdverseEventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUserName = '崔工',
  onUpdateEvent
}) => {
  if (!isOpen || !event) return null;

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'investigation' | 'capa' | 'xml' | 'print'>('overview');

  // CAPA 新增表单状态
  const [showAddCapa, setShowAddCapa] = useState(false);
  const [capaTitle, setCapaTitle] = useState('');
  const [capaType, setCapaType] = useState<AdverseEventCapa['type']>('maintenance_strengthening');
  const [capaDept, setCapaDept] = useState('医学装备保障科');
  const [capaPerson, setCapaPerson] = useState(currentUserName);
  const [capaDeadline, setCapaDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );

  // 现场调查编辑状态
  const [isEditingInvestigation, setIsEditingInvestigation] = useState(false);
  const [editedFault, setEditedFault] = useState(event.faultPhenomenon);
  const [editedAction, setEditedAction] = useState(event.immediateAction);
  const [editedConclusion, setEditedConclusion] = useState<CausalityConclusion>(event.causalityConclusion);

  const severityCfg = getSeverityConfig(event.severity);
  const statusCfg = getStatusConfig(event.status);
  const causalityCfg = getCausalityConfig(event.causalityConclusion);

  // 直报国家监测网
  const handleReportToNmpa = () => {
    if (!window.confirm(`确认将本单【${event.title}】直报至国家医疗器械不良事件监测信息系统吗？\n系统将自动生成标准数据包并通过直报接口上传。`)) {
      return;
    }
    const { updatedEvent, receiptNo } = reportEventToNmpa(event, currentUserName);
    onUpdateEvent(updatedEvent);
    alert(`直报成功！已取得国家医疗器械不良事件监测网直报回执编号：\n${receiptNo}`);
  };

  // 结案归档
  const handleCloseCase = () => {
    if (!window.confirm('确认完成所有整改与跟进，将该不良事件结案归档吗？')) return;
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated: AdverseEventRecord = {
      ...event,
      status: 'closed',
      timeline: [
        ...event.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowStr,
          operator: currentUserName,
          action: '结案归档',
          details: '不良事件已完成原因排查、因果评定、国家网直报及CAPA整改验证，正式结案。'
        }
      ]
    };
    onUpdateEvent(updated);
  };

  // 保存调查结论
  const handleSaveInvestigation = () => {
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated: AdverseEventRecord = {
      ...event,
      faultPhenomenon: editedFault,
      immediateAction: editedAction,
      causalityConclusion: editedConclusion,
      evaluatorName: currentUserName,
      evaluatedAt: nowStr,
      status: event.status === 'pending_review' ? 'investigating' : event.status,
      timeline: [
        ...event.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowStr,
          operator: currentUserName,
          action: '更新医工调查与因果评定',
          details: `因果关系评定为【${editedConclusion}】，更新了故障原因与处置措施。`
        }
      ]
    };
    onUpdateEvent(updated);
    setIsEditingInvestigation(false);
  };

  // 添加 CAPA
  const handleAddCapa = () => {
    if (!capaTitle.trim()) return;
    const newCapa: AdverseEventCapa = {
      id: `CAPA-${Date.now().toString().slice(-4)}`,
      type: capaType,
      title: capaTitle.trim(),
      description: '针对本次事件提出的纠偏与预防措施。',
      targetDepartment: capaDept,
      responsiblePerson: capaPerson,
      deadline: capaDeadline,
      status: 'in_progress'
    };
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const updated: AdverseEventRecord = {
      ...event,
      status: event.status === 'nmpa_reported' ? 'capa_tracking' : event.status,
      capaList: [...event.capaList, newCapa],
      timeline: [
        ...event.timeline,
        {
          id: `LOG-${Date.now()}`,
          timestamp: nowStr,
          operator: currentUserName,
          action: '建立纠偏与预防措施(CAPA)',
          details: `立项整改：${newCapa.title} (责任人: ${newCapa.responsiblePerson})`
        }
      ]
    };
    onUpdateEvent(updated);
    setShowAddCapa(false);
    setCapaTitle('');
  };

  // 下载标准 XML
  const handleDownloadXml = () => {
    const xmlContent = generateNmpaXmlReport(event);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.id}_NMPA_MDR_Report.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 打印 A4 表格
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Topbar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${severityCfg.badgeBg}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-400">{event.id}</span>
                <span className={`px-2 py-0.5 rounded text-2xs font-bold ${severityCfg.badgeBg}`}>
                  {severityCfg.label}
                </span>
                <span className={`px-2 py-0.5 rounded text-2xs font-bold border ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
                {event.nmpaReceiptNo && (
                  <span className="px-2 py-0.5 rounded text-2xs bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    国家直报回执: {event.nmpaReceiptNo}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-bold text-white mt-1 line-clamp-1">{event.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="导出国家直报 XML 报文"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>XML报文</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('print')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer"
              title="A4 规范报告表打印预览"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>A4报告表</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Nav */}
        <div className="bg-slate-100 px-6 border-b border-slate-200 flex items-center gap-4 text-xs font-medium">
          {[
            { key: 'overview', label: '综合概览与表单' },
            { key: 'investigation', label: '医工调查与因果评定' },
            { key: 'capa', label: `纠偏预防措施 (${(event.capaList || []).length})` },
            { key: 'xml', label: '国家监测网报文 (XML)' },
            { key: 'print', label: 'A4 标准打印预览' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`py-2.5 border-b-2 transition cursor-pointer ${
                activeSubTab === tab.key 
                  ? 'border-indigo-600 text-indigo-600 font-bold' 
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs bg-slate-50/50">

          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              {/* 法定时限与状态条 */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>报告时间: <strong className="text-slate-800 font-mono">{event.reportedAt}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span>法定上报截止: <strong className="text-rose-700 font-mono">{event.statutoryDeadline}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.status !== 'nmpa_reported' && event.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={handleReportToNmpa}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>直报国家监测网 (NMPA)</span>
                    </button>
                  )}
                  {event.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={handleCloseCase}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium transition cursor-pointer"
                    >
                      结案归档
                    </button>
                  )}
                </div>
              </div>

              {/* 器械信息卡片 */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    <span>涉及医疗器械详情（台账联动）</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-2xs bg-indigo-50 text-indigo-700 font-mono font-bold">
                    管理分类：{event.deviceRiskClass}类医疗器械
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500">器械名称:</span>
                    <div className="font-bold text-slate-800">{event.equipmentName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">规格型号:</span>
                    <div className="font-mono text-slate-700">{event.equipmentModel}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">出厂编号 (SN):</span>
                    <div className="font-mono font-bold text-slate-800">{event.equipmentSn}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">资产编号:</span>
                    <div className="font-mono text-slate-600">{event.equipmentAssetNo || '未登记'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">生产企业:</span>
                    <div className="text-slate-700">{event.manufacturer}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">注册证号:</span>
                    <div className="font-mono text-slate-700">{event.registrationNo}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">使用状态:</span>
                    <div className="text-slate-700 font-medium">
                      {event.deviceUsageState === 'in_use' ? '在用 (连接患者)' : '待机/自检中'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">关联耗材:</span>
                    <div className="text-slate-700 font-mono">
                      {event.consumablesName ? `${event.consumablesName} (${event.consumablesBatchNo})` : '无耗材关联'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 患者临床转归与过程 */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>患者临床过程与转归</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                    event.clinicalOutcome === 'death' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    结局: {event.clinicalOutcome === 'cured' ? '痊愈' : event.clinicalOutcome === 'improved' ? '好转' : event.clinicalOutcome === 'death' ? '死亡' : '未损害'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-500">患者姓名 (脱敏):</span>
                    <div className="font-bold text-slate-800">{event.patientNameMasked}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">住院病案号:</span>
                    <div className="font-mono text-slate-700">{event.patientMedicalRecordNo}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">性别 / 年龄:</span>
                    <div className="text-slate-700">{event.patientGender} / {event.patientAge}岁</div>
                  </div>
                  <div>
                    <span className="text-slate-500">原发疾病:</span>
                    <div className="text-slate-700">{event.primaryDiagnosis}</div>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-slate-500 font-bold block mb-1">对患者造成的伤害及危险描述:</span>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
                    {event.harmDescription}
                  </div>
                </div>
                {event.remedialMedicalAction && (
                  <div className="pt-1">
                    <span className="text-slate-500 font-bold block mb-1">采取的医疗抢救措施:</span>
                    <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100 text-emerald-900">
                      {event.remedialMedicalAction}
                    </div>
                  </div>
                )}
              </div>

              {/* 故障表现与应急处置 */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 shadow-2xs">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>设备故障现象与现场应急处置</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-2xs bg-amber-50 text-amber-800 font-medium">
                    实物已封存: {event.samplePreserved ? '是 (贴签封存)' : '否'}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">故障具体现象:</span>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed">
                      {event.faultPhenomenon}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold block mb-1">现场紧急控制措施:</span>
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700 leading-relaxed">
                      {event.immediateAction}
                    </div>
                  </div>
                </div>
              </div>

              {/* 报告人信息与流转历史 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>报告人信息</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>科室: <strong className="text-slate-800">{event.department}</strong></div>
                    <div>报告人: <strong className="text-slate-800">{event.reporterName}</strong> ({event.reporterPhone})</div>
                    <div>身份: {event.reporterProfession === 'nurse' ? '临床护士' : event.reporterProfession === 'physician' ? '临床医生' : '临床医学工程师'}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-100">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span>流转日志追溯 ({(event.timeline || []).length})</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {(event.timeline || []).map((item) => (
                      <div key={item.id} className="text-3xs space-y-0.5 border-l-2 border-indigo-400 pl-2">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>{item.operator}</span>
                          <span className="font-mono">{item.timestamp}</span>
                        </div>
                        <div className="font-bold text-slate-700">{item.action}</div>
                        <div className="text-slate-500">{item.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATION & CAUSALITY */}
          {activeSubTab === 'investigation' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>医学工程处因果关系评定（国家药监局五项准则分析）</span>
                  </div>
                  {!isEditingInvestigation && (
                    <button
                      type="button"
                      onClick={() => setIsEditingInvestigation(true)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-2xs font-bold transition cursor-pointer"
                    >
                      编辑评定结论
                    </button>
                  )}
                </div>

                {/* 五项准则明细 */}
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <span>1. 使用器械与不良事件发生是否存在明确的时间先后顺序？</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {event.causalityCriterion1_timeSequence ? '是 (肯定)' : '否'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <span>2. 不良事件是否属于该类器械可能导致的已知风险/说明书已知不良反应？</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {event.causalityCriterion2_knownRisk ? '是 (符合已知风险特征)' : '否'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <span>3. 停用该器械或排除故障后，不良事件是否停止或减轻 (去激发试验)？</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {event.causalityCriterion3_dechallenge === true ? '是 (脱机后好转)' : event.causalityCriterion3_dechallenge === false ? '否' : '不适用'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <span>4. 再次使用该器械是否再次出现类似反应 (再激发试验)？</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {event.causalityCriterion4_rechallenge === true ? '是 (再次诱发)' : event.causalityCriterion4_rechallenge === false ? '否' : '未再次使用'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <span>5. 事件是否可由患者自身病情、合并用药、其他并发症或操作疏忽解释？</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {event.causalityCriterion5_alternativeCause === 'excluded' ? '已明确排除自身病情 (器械原因为主)' : event.causalityCriterion5_alternativeCause === 'partial' ? '部分可能相关' : '不能排除'}
                    </span>
                  </div>
                </div>

                {/* 综合判定结果 */}
                <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <div>
                    <div className="text-3xs text-slate-500 font-bold uppercase tracking-wider">综合因果关系评价评定</div>
                    <div className="text-sm font-bold text-indigo-950 mt-0.5">
                      {causalityCfg.label}
                    </div>
                  </div>
                  <div className="text-right text-3xs text-slate-500">
                    <div>评价专家: <strong className="text-slate-800">{event.evaluatorName || '院级质控组'}</strong></div>
                    <div>评价时间: <span className="font-mono">{event.evaluatedAt || event.reportedAt}</span></div>
                  </div>
                </div>

                {/* 编辑模式表单 */}
                {isEditingInvestigation && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3 mt-3">
                    <div className="font-bold text-amber-900">修订医工现场调查与因果评定</div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">设备故障现象深度分析</label>
                      <textarea
                        rows={2}
                        value={editedFault}
                        onChange={(e) => setEditedFault(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">医学工程现场处置及技术测试</label>
                      <textarea
                        rows={2}
                        value={editedAction}
                        onChange={(e) => setEditedAction(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">修订综合因果结论</label>
                      <select
                        value={editedConclusion}
                        onChange={(e) => setEditedConclusion(e.target.value as any)}
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-bold"
                      >
                        <option value="definite">肯定相关 (Definite)</option>
                        <option value="probable">很可能相关 (Probable)</option>
                        <option value="possible">可能相关 (Possible)</option>
                        <option value="unlikely">可能无关 (Unlikely)</option>
                        <option value="unassessable">待评价 (Pending)</option>
                        <option value="unclassifiable">无法评价 (Unclassifiable)</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingInvestigation(false)}
                        className="px-3 py-1 bg-white border border-slate-300 rounded text-xs"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveInvestigation}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                      >
                        保存评定结论
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CAPA */}
          {activeSubTab === 'capa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">纠偏与预防措施 (CAPA - Corrective and Preventive Actions)</h4>
                  <p className="text-3xs text-slate-500">依据不良事件原因，建立厂家召回沟通、耗材批次下架、临床培训或设备预防性检修任务</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCapa(!showAddCapa)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>建立整改项目</span>
                </button>
              </div>

              {/* 新增 CAPA 表单 */}
              {showAddCapa && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2">
                  <div className="font-bold text-indigo-950">新建不良事件整改防范任务</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-0.5">措施类型</label>
                      <select
                        value={capaType}
                        onChange={(e) => setCapaType(e.target.value as any)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                      >
                        <option value="maintenance_strengthening">设备预防性维护升级 / 强化抽检</option>
                        <option value="vendor_recall">厂家召回 / 警示通告 / 硬件升级</option>
                        <option value="clinical_training">临床操作规程规范 / 人员再培训</option>
                        <option value="sop_revision">修订院内临床器械使用 SOP</option>
                        <option value="equipment_scrapping">建议报废淘汰高风险设备</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-0.5">责任科室 / 部门</label>
                      <input
                        type="text"
                        value={capaDept}
                        onChange={(e) => setCapaDept(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-0.5">责任人 / 截止时限</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={capaPerson}
                          onChange={(e) => setCapaPerson(e.target.value)}
                          className="w-1/2 p-1.5 bg-white border border-slate-200 rounded text-xs"
                        />
                        <input
                          type="date"
                          value={capaDeadline}
                          onChange={(e) => setCapaDeadline(e.target.value)}
                          className="w-1/2 p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-0.5">具体措施与目标描述</label>
                    <input
                      type="text"
                      placeholder="如: 对全院在用54台呼吸机呼吸回路呼气阀进行气密性与冷凝水回流专项排查"
                      value={capaTitle}
                      onChange={(e) => setCapaTitle(e.target.value)}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCapa(false)}
                      className="px-3 py-1 bg-white border border-slate-300 rounded text-xs"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCapa}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                    >
                      确认建立整改
                    </button>
                  </div>
                </div>
              )}

              {/* CAPA 列表 */}
              {(!event.capaList || event.capaList.length === 0) ? (
                <div className="p-8 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                  暂未关联纠偏防范措施。请点击上方按钮建立整改项目。
                </div>
              ) : (
                <div className="space-y-2">
                  {event.capaList.map((capa) => (
                    <div key={capa.id} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-3xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {capa.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                            capa.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {capa.status === 'completed' ? '已验证完成' : '整改推进中'}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{capa.title}</span>
                        </div>
                        <p className="text-3xs text-slate-500 leading-relaxed">{capa.description}</p>
                        <div className="text-3xs text-slate-400 flex items-center gap-4 pt-0.5">
                          <span>责任科室: <strong className="text-slate-700">{capa.targetDepartment}</strong></span>
                          <span>责任人: <strong className="text-slate-700">{capa.responsiblePerson}</strong></span>
                          <span>整改期限: <strong className="font-mono text-slate-700">{capa.deadline}</strong></span>
                          {capa.completedDate && <span>完成时间: {capa.completedDate}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: XML VIEWER */}
          {activeSubTab === 'xml' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">国家医疗器械不良事件监测信息系统 (NMPA) 直报报文</h4>
                  <p className="text-3xs text-slate-500">符合国家药监局不良事件数据交换规范的标准 XML 报文结构</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载 .xml 报文文件</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-3xs font-mono overflow-x-auto leading-relaxed max-h-[500px]">
                {generateNmpaXmlReport(event)}
              </pre>
            </div>
          )}

          {/* TAB 5: A4 PRINT PREVIEW */}
          {activeSubTab === 'print' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-lg">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">可疑医疗器械不良事件报告表（国家规范版）</h4>
                  <p className="text-3xs text-slate-500">格式符合药监部门不良事件纸质归档与三甲评审审查标准</p>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>立即打印 / 另存为 PDF</span>
                </button>
              </div>

              {/* 标准 A4 纸张排版容器 */}
              <div className="bg-white p-8 border border-slate-300 shadow-md max-w-3xl mx-auto text-slate-900 text-xs font-sans print:border-none print:shadow-none print:p-0">
                {/* 报表标题 */}
                <div className="text-center pb-4 border-b-2 border-slate-800 mb-4">
                  <div className="text-sm font-bold text-slate-700">五莲县人民医院</div>
                  <h1 className="text-lg font-extrabold tracking-wide mt-1">可疑医疗器械不良事件报告表</h1>
                  <div className="flex justify-between items-center text-3xs text-slate-500 mt-2">
                    <span>报告单编号: <strong className="font-mono text-slate-800">{event.id}</strong></span>
                    <span>国家直报回执: <strong className="font-mono text-slate-800">{event.nmpaReceiptNo || '未直报/本地暂存'}</strong></span>
                    <span>报告日期: <strong className="font-mono text-slate-800">{event.reportedAt}</strong></span>
                  </div>
                </div>

                {/* 报表表格结构 */}
                <table className="w-full border-collapse border border-slate-800 text-2xs">
                  <tbody>
                    {/* 第一部分: 报告人 */}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-800 p-1.5">一、报告来源与报告人信息</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50 w-28">报告单位</td>
                      <td className="border border-slate-800 p-1.5">五莲县人民医院</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50 w-28">发生科室</td>
                      <td className="border border-slate-800 p-1.5">{event.department}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">报告人姓名</td>
                      <td className="border border-slate-800 p-1.5">{event.reporterName}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">联系电话</td>
                      <td className="border border-slate-800 p-1.5 font-mono">{event.reporterPhone}</td>
                    </tr>

                    {/* 第二部分: 涉及器械 */}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-800 p-1.5">二、涉及医疗器械情况</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">产品名称</td>
                      <td className="border border-slate-800 p-1.5 font-bold">{event.equipmentName}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">规格型号</td>
                      <td className="border border-slate-800 p-1.5 font-mono">{event.equipmentModel}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">出厂编号 (SN)</td>
                      <td className="border border-slate-800 p-1.5 font-mono font-bold">{event.equipmentSn}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">资产编号</td>
                      <td className="border border-slate-800 p-1.5 font-mono">{event.equipmentAssetNo || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">生产企业</td>
                      <td className="border border-slate-800 p-1.5">{event.manufacturer}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">注册证号</td>
                      <td className="border border-slate-800 p-1.5 font-mono">{event.registrationNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">管理类别</td>
                      <td className="border border-slate-800 p-1.5">{event.deviceRiskClass}类医疗器械</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">器械使用状态</td>
                      <td className="border border-slate-800 p-1.5">{event.deviceUsageState === 'in_use' ? '在用' : '待机备用'}</td>
                    </tr>

                    {/* 第三部分: 患者情况 */}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-800 p-1.5">三、患者临床情况及转归结局</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">患者姓名 (脱敏)</td>
                      <td className="border border-slate-800 p-1.5">{event.patientNameMasked}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">住院病案号</td>
                      <td className="border border-slate-800 p-1.5 font-mono">{event.patientMedicalRecordNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">原发疾病</td>
                      <td className="border border-slate-800 p-1.5">{event.primaryDiagnosis}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">不良事件严重度</td>
                      <td className="border border-slate-800 p-1.5 font-bold text-rose-700">{severityCfg.label}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">机体危害表现</td>
                      <td colSpan={3} className="border border-slate-800 p-2 leading-relaxed">{event.harmDescription}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">采取急救措施</td>
                      <td colSpan={3} className="border border-slate-800 p-2">{event.remedialMedicalAction || '未执行特殊救治'}</td>
                    </tr>

                    {/* 第四部分: 故障表现与因果判定 */}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={4} className="border border-slate-800 p-1.5">四、设备故障分析与因果关系评定</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">设备故障现象</td>
                      <td colSpan={3} className="border border-slate-800 p-2 leading-relaxed">{event.faultPhenomenon}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">现场控制措施</td>
                      <td colSpan={3} className="border border-slate-800 p-2">{event.immediateAction}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">因果关系结论</td>
                      <td className="border border-slate-800 p-1.5 font-bold text-indigo-900">{causalityCfg.label}</td>
                      <td className="border border-slate-800 p-1.5 font-bold bg-slate-50">评价专家签名</td>
                      <td className="border border-slate-800 p-1.5">{event.evaluatorName || '医学装备管理委员会'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* 签字确认区域 */}
                <div className="grid grid-cols-3 gap-4 pt-6 text-3xs text-slate-600">
                  <div>
                    <span>报告科室负责人签字: ____________</span>
                  </div>
                  <div>
                    <span>医学工程科审核签字: ____________</span>
                  </div>
                  <div>
                    <span>医疗器械不良事件管理机构(审核确认)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            直报监管状态：
            <strong className="text-slate-700 ml-1">{statusCfg.label}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
};
