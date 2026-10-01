import React, { useState } from 'react';
import { 
  Award, Search, Filter, Clock, Calendar, AlertCircle, 
  CheckCircle2, DollarSign, Upload, FileText, ChevronRight, 
  Send, ShieldCheck, ArrowRight, Building, Check, Sparkles,
  Printer, X, Tag, FileCheck
} from 'lucide-react';
import { 
  BiddingProject, 
  BidSubmission, 
  VendorUserAccount 
} from '../../types/vendorCollaborationTypes';

interface VendorBiddingCenterViewProps {
  currentVendor: VendorUserAccount;
  biddingProjects: BiddingProject[];
  onSubmitBid: (projectId: string, submission: BidSubmission) => void;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorBiddingCenterView: React.FC<VendorBiddingCenterViewProps> = ({
  currentVendor,
  biddingProjects,
  onSubmitBid,
  onToast,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(biddingProjects[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'BIDDED' | 'WON'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [showSelfCheckModal, setShowSelfCheckModal] = useState(false);
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);

  // 投标表单状态
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [quotePartsAmount, setQuotePartsAmount] = useState<number>(0);
  const [quoteLaborAmount, setQuoteLaborAmount] = useState<number>(0);
  const [deliveryDays, setDeliveryDays] = useState<number>(3);
  const [warrantyMonths, setWarrantyMonths] = useState<number>(12);
  const [schemeDescription, setSchemeDescription] = useState('');
  const [bidDocFileName, setBidDocFileName] = useState('企业盖章投标文件及维修方案承诺书.pdf');

  const selectedProject = biddingProjects.find(p => p.id === selectedProjectId) || biddingProjects[0];

  // 筛选列表
  const filteredProjects = biddingProjects.filter(p => {
    const matchesStatus = 
      filterStatus === 'ALL' ? true :
      filterStatus === 'OPEN' ? p.status === 'OPEN' :
      filterStatus === 'BIDDED' ? (p.status === 'BIDDED' || Boolean(p.mySubmission)) :
      filterStatus === 'WON' ? (p.status === 'WON' || p.mySubmission?.status === 'ACCEPTED') : true;

    const matchesKeyword = 
      !searchKeyword ||
      p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.department.toLowerCase().includes(searchKeyword.toLowerCase());

    return matchesStatus && matchesKeyword;
  });

  const handleOpenBidModal = (project: BiddingProject) => {
    setSelectedProjectId(project.id);
    const suggestedPrice = Math.round(project.maxBudget * 0.9);
    setQuoteAmount(suggestedPrice);
    setQuotePartsAmount(Math.round(suggestedPrice * 0.75));
    setQuoteLaborAmount(Math.round(suggestedPrice * 0.25));
    setDeliveryDays(project.equipmentList[0]?.expectedDeliveryDays || 5);
    setWarrantyMonths(project.minWarrantyMonths || 12);
    setSchemeDescription(`我方【${currentVendor.vendorName}】郑重承诺：派出原厂资深主任工程师驻场服务，零配件全部采用正品原厂认证部件，提供${project.minWarrantyMonths || 12}个月全保，完全响应贵院竞价文件全部技术规范。`);
    setShowBidModal(true);
  };

  const handleSubmitBidForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (quoteAmount <= 0) {
      onToast('请输入有效的竞标报价金额', 'warning');
      return;
    }
    if (quoteAmount > selectedProject.maxBudget) {
      onToast(`报价不能超过最高限价 ¥${selectedProject.maxBudget.toLocaleString()}`, 'warning');
      return;
    }

    const newSubmission: BidSubmission = {
      bidId: `BID-SUB-${Date.now().toString().slice(-6)}`,
      projectId: selectedProject.id,
      vendorId: currentVendor.vendorId,
      vendorName: currentVendor.vendorName,
      submittedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      quoteAmount,
      quotePartsAmount,
      quoteLaborAmount,
      deliveryDays,
      warrantyMonths,
      schemeDescription,
      bidDocumentFileName: bidDocFileName,
      status: 'SHORTLISTED',
      evaluationScore: 92.5,
      hospitalFeedback: '竞价标书已成功提交并送交医院专家评审委员会，技术与价格初审通过。'
    };

    onSubmitBid(selectedProject.id, newSubmission);
    setShowBidModal(false);
    onToast(`✅ 已成功提交针对【${selectedProject.title}】的竞标报价！`, 'success');
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 左侧：竞价项目列表导航栏 */}
      <div className="w-full md:w-96 lg:w-[420px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
        
        {/* 标题与搜索栏 */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">公开竞价与招标中心</h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              共 {biddingProjects.length} 项
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索竞价编号、项目名称、科室..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {/* 状态过滤标签 */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: '全部' },
              { id: 'OPEN', label: '竞价中' },
              { id: 'BIDDED', label: '已出价' },
              { id: 'WON', label: '已中标' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`flex-1 py-1 text-xs font-medium rounded-lg transition text-center cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 竞价项目滚动列表 */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              无匹配的竞价项目
            </div>
          ) : (
            filteredProjects.map(project => {
              const isSelected = project.id === selectedProjectId;
              const hasBidded = Boolean(project.mySubmission);
              const isWon = project.status === 'WON' || project.mySubmission?.status === 'ACCEPTED';

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-3 rounded-xl transition cursor-pointer text-left border ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {project.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isWon ? (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          已中标
                        </span>
                      ) : hasBidded ? (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                          已出价
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          竞价中
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">
                        {project.bidsCount}家参与
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2 leading-relaxed">
                    {project.title}
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/80 text-[11px]">
                    <span className="text-slate-500 truncate max-w-[140px]">
                      {project.department}
                    </span>
                    <div className="font-mono font-bold text-slate-800">
                      限价: <span className="text-blue-700">¥{project.maxBudget.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      截止: {project.deadlineDate.split(' ')[0]}
                    </span>
                    <span className="font-medium text-slate-500">
                      质保≥{project.minWarrantyMonths}个月
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 右侧：竞价详情工作区与投标交互面板 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {selectedProject ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* 项目头部核心概览 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                    {selectedProject.id}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {selectedProject.category === 'EQUIPMENT_REPAIR' ? '单次专项抢修竞价' :
                     selectedProject.category === 'ANNUAL_MAINTENANCE' ? '年度预防性保修招标' :
                     selectedProject.category === 'SPARE_PARTS' ? '备件批量采购竞价' : '第三方计量检测招标'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                    selectedProject.urgency === 'EMERGENCY' ? 'bg-red-50 text-red-700 border border-red-200' :
                    selectedProject.urgency === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedProject.urgency === 'EMERGENCY' ? '紧急竞价' : selectedProject.urgency === 'HIGH' ? '高优先级' : '常规竞价'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSelfCheckModal(true)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>资质门槛自检</span>
                  </button>

                  {selectedProject.mySubmission ? (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>已投: ¥{selectedProject.mySubmission.quoteAmount.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCommitmentModal(true)}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>投标响应承诺函</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenBidModal(selectedProject)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>立即参与竞标报价</span>
                    </button>
                  )}
                </div>
              </div>

              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {selectedProject.title}
              </h1>

              {/* 核心财务与时效指标看板 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 font-medium">医院最高限价 (预算)</div>
                  <div className="text-base font-bold font-mono text-blue-700 mt-1">
                    ¥{selectedProject.maxBudget.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 font-medium">竞价截止倒计时</div>
                  <div className="text-sm font-bold font-mono text-amber-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedProject.deadlineDate}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 font-medium">最低质保期要求</div>
                  <div className="text-sm font-bold font-mono text-slate-800 mt-1">
                    ≥ {selectedProject.minWarrantyMonths} 个月
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-slate-400 font-medium">申请科室 / 需求方</div>
                  <div className="text-sm font-bold text-slate-800 mt-1 truncate">
                    {selectedProject.department}
                  </div>
                </div>
              </div>
            </div>

            {/* 我的竞标记录与专家评分 (若已提交) */}
            {selectedProject.mySubmission && (
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-2xl p-5 border border-blue-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">我方已提交竞标方案</h3>
                    <span className="font-mono text-[11px] text-slate-400">({selectedProject.mySubmission.submittedAt})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs">
                    综合专家评分: <strong className="font-mono text-sm text-blue-800">{selectedProject.mySubmission.evaluationScore || 92.5}分</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/80 p-3 rounded-xl border border-blue-100">
                  <div>
                    <span className="text-slate-400">竞标总报价:</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      ¥{selectedProject.mySubmission.quoteAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">配件费用拆解:</span>
                    <div className="font-mono font-bold text-slate-700">
                      ¥{selectedProject.mySubmission.quotePartsAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">工时与检测费:</span>
                    <div className="font-mono font-bold text-slate-700">
                      ¥{selectedProject.mySubmission.quoteLaborAmount.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">承诺质保 / 工期:</span>
                    <div className="font-mono font-bold text-slate-800">
                      {selectedProject.mySubmission.warrantyMonths}个月 / {selectedProject.mySubmission.deliveryDays}天交付
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100">
                  <div className="font-semibold text-slate-800 mb-1">施工与保障技术承诺：</div>
                  <p>{selectedProject.mySubmission.schemeDescription}</p>
                  {selectedProject.mySubmission.bidDocumentFileName && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-blue-600 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>投标文件: {selectedProject.mySubmission.bidDocumentFileName}</span>
                    </div>
                  )}
                </div>

                {selectedProject.mySubmission.hospitalFeedback && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">医院评标意见反馈：</span>
                      <span className="text-emerald-800 ml-1">{selectedProject.mySubmission.hospitalFeedback}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 标的设备与故障清单 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>竞价标的设备与维保需求明细</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <th className="py-2.5 px-3 font-semibold">标的设备名称</th>
                      <th className="py-2.5 px-3 font-semibold">型号规格</th>
                      <th className="py-2.5 px-3 font-semibold">安装科室</th>
                      <th className="py-2.5 px-3 font-semibold">故障症状与维保范围</th>
                      <th className="py-2.5 px-3 font-semibold text-right">要求交付周期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProject.equipmentList.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.equipmentName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{item.model}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.department}</td>
                        <td className="py-2.5 px-3 text-slate-700 max-w-xs">{item.faultSymptomOrScope}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                          ≤ {item.expectedDeliveryDays} 天
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 技术参数与服务商资质硬性门槛 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>竞标资质门槛与技术规范要求</span>
              </h3>

              <ul className="space-y-2 text-xs text-slate-600">
                {selectedProject.technicalRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            请选择竞价项目查看详情
          </div>
        )}
      </div>

      {/* 在线提交竞价投标模态框 */}
      {showBidModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">在线填报竞标报价方案</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-md">{selectedProject.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBidModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBidForm} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* 预算上限提示 */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <span className="text-blue-900 font-medium">医院设定的最高限价：</span>
                <span className="font-mono font-bold text-blue-800 text-sm">
                  ¥{selectedProject.maxBudget.toLocaleString()}
                </span>
              </div>

              {/* 报价三项 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    竞标总报价 (元) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedProject.maxBudget}
                    value={quoteAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuoteAmount(val);
                      setQuotePartsAmount(Math.round(val * 0.75));
                      setQuoteLaborAmount(Math.round(val * 0.25));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    其中备件费 (元)
                  </label>
                  <input
                    type="number"
                    value={quotePartsAmount}
                    onChange={(e) => setQuotePartsAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    工时与差旅费 (元)
                  </label>
                  <input
                    type="number"
                    value={quoteLaborAmount}
                    onChange={(e) => setQuoteLaborAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* 工期与质保 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    承诺交付天数 (天)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    承诺质保期 (月，≥{selectedProject.minWarrantyMonths})
                  </label>
                  <input
                    type="number"
                    required
                    min={selectedProject.minWarrantyMonths}
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* 施工方案说明 */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  服务技术方案与售后响应承诺 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={schemeDescription}
                  onChange={(e) => setSchemeDescription(e.target.value)}
                  placeholder="详细描述施工方案、备件供应渠道、驻场工程师资质及应急保障机制..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* 投标文件上传 */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  投标文件及盖章报价单 (PDF/扫描件)
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium truncate max-w-xs">{bidDocFileName}</span>
                  </div>
                  <label className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer font-semibold shadow-2xs">
                    重新上传
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setBidDocFileName(e.target.files[0].name);
                          onToast(`已选定标书文件: ${e.target.files[0].name}`);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* 企业资质自动核验预先自检提示 */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>企业资质及授权门槛已自动智能核验 (100% 合规)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-mono font-bold">
                    免审通过
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800 leading-tight">
                  《医疗器械经营许可证》、《辐射安全许可证》、《西门子/瓦里安原厂认证授权》均在有效期内，满足招标文件第 3.2 条款硬性准入要求。
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>正式递交竞标报价</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 资质门槛合规自检模态框 */}
      {showSelfCheckModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">投标合规与准入门槛智能自检结果</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSelfCheckModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                <div className="font-bold text-blue-900">{selectedProject.title}</div>
                <div className="text-blue-700 text-[11px] mt-0.5">
                  最高限价: ¥{selectedProject.maxBudget.toLocaleString()} • 最低质保: {selectedProject.minWarrantyMonths}个月
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>企业主体资格（营业执照）</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">三合一统一社会信用代码已核验，状态正常有效</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">合规</span>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>医疗器械经营许可范围</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">包含二/三类医疗器械维保维修与零配件销售资质</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">合规</span>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>原厂技术授权与备件直供证明</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">在有效期内，覆盖标的设备品牌</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">合规</span>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>AAA级战略合作商免保特权</span>
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">全院考评第1名，本竞标免交投标保证金 (¥10,000)</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">特权生效</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSelfCheckModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                关闭自检报告
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 标准化投标响应承诺函预览与导出模态框 */}
      {showCommitmentModal && selectedProject && selectedProject.mySubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">公开竞价投标响应承诺书 (标准化底稿)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCommitmentModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-300 rounded-xl p-5 space-y-4 bg-slate-50/50 font-sans leading-relaxed">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  五莲县人民医院医用设备维修公开竞价
                </h2>
                <h3 className="text-sm font-semibold text-slate-700">
                  投标报价与技术服务响应承诺书
                </h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  项目编号: {selectedProject.id} • 投送日期: {selectedProject.mySubmission.submittedAt}
                </div>
              </div>

              <div className="space-y-2 text-slate-700">
                <p><strong>致：五莲县人民医院医学装备处（招标评标委员会）</strong></p>
                <p>
                  我方（<strong>{currentVendor.vendorName}</strong>）认真审阅了贵院关于【<strong>{selectedProject.title}</strong>】的公开竞价文件，经我公司技术及商务团队审慎测算，郑重承诺如下：
                </p>
                
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-xs">
                  <div>1. 竞标总报价：<strong className="text-blue-700 font-bold text-sm">¥{selectedProject.mySubmission.quoteAmount.toLocaleString()} 元</strong></div>
                  <div className="text-slate-500 pl-3">（其中原厂备件费：¥{selectedProject.mySubmission.quotePartsAmount.toLocaleString()} 元；工时及技术服务费：¥{selectedProject.mySubmission.quoteLaborAmount.toLocaleString()} 元）</div>
                  <div>2. 承诺交付工期：<strong>{selectedProject.mySubmission.deliveryDays} 个日历天</strong> 完成修复并通过临床验收</div>
                  <div>3. 承诺质量保修期：<strong>{selectedProject.mySubmission.warrantyMonths} 个月</strong>（质保期内发生相同故障实行全免费返修）</div>
                </div>

                <p>
                  <strong>服务与保障承诺：</strong>{selectedProject.mySubmission.schemeDescription}
                </p>

                <p className="text-[11px] text-slate-500">
                  我方承诺上述所有技术参数及配件均为原厂正品，绝不使用假冒伪劣及翻新旧件。如违反上述承诺，愿无条件承担全额赔偿及法律责任。
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-slate-600">投标服务商（盖章）：</div>
                  <div className="font-bold text-slate-900 mt-1">{currentVendor.vendorName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">法定代表人/授权代表：{currentVendor.contactName}</div>
                </div>
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-red-500 text-red-600 flex items-center justify-center font-bold text-xs rotate-[-12deg] select-none">
                  电子签章核准
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCommitmentModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  onToast('已向打印机发送承诺书打印任务并生成电子盖章PDF存档！', 'success');
                  setShowCommitmentModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>立即打印/导出承诺函PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
