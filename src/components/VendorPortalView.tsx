import React, { useState } from 'react';
import { 
  Building2, ArrowLeft, Printer, FileSpreadsheet, 
  Wrench, Users, Receipt, ChevronDown, Check,
  Sparkles, Layers, LayoutDashboard, Award, Coins,
  ShieldCheck, Upload, TrendingUp, Calendar, ChevronRight,
  FileCheck2, AlertTriangle, ExternalLink, HelpCircle
} from 'lucide-react';
import { 
  VendorCollaborationOrder, 
  VendorUserAccount,
  BiddingProject,
  CorporateQualification,
  StructuredDocumentRecord,
  BidSubmission
} from '../types/vendorCollaborationTypes';
import { VENDOR_ACCOUNTS } from '../utils/vendorCollaborationData';
import { 
  getBiddingProjects, 
  getCorporateQualifications, 
  getStructuredDocuments,
  submitBid,
  saveQualification,
  addOrUpdateStructuredDocument
} from '../utils/vendorBiddingAndDocsData';
import { MonthlyFrameworkWorkspace } from './MonthlyFrameworkWorkspace';
import { VendorSpecialOrderWorkbench } from './vendor/VendorSpecialOrderWorkbench';
import { VendorEngineersSlaTab } from './vendor/VendorEngineersSlaTab';
import { VendorFinanceAnalyticsTab } from './vendor/VendorFinanceAnalyticsTab';
import { VendorHomeAnalyticsView } from './vendor/VendorHomeAnalyticsView';
import { VendorBiddingCenterView } from './vendor/VendorBiddingCenterView';
import { VendorNegotiationCenterView } from './vendor/VendorNegotiationCenterView';
import { VendorStructuredDocsCenterView } from './vendor/VendorStructuredDocsCenterView';
import { VendorQualificationView } from './vendor/VendorQualificationView';
import { VendorDossierPdfModal } from './VendorDossierPdfModal';
import { MonthlyFrameworkAuditReportModal } from './MonthlyFrameworkAuditReportModal';

interface VendorPortalViewProps {
  currentVendor: VendorUserAccount;
  orders: VendorCollaborationOrder[];
  onUpdateOrder: (updatedOrder: VendorCollaborationOrder) => void;
  onLogout: () => void;
  onSwitchVendor?: (vendor: VendorUserAccount) => void;
}

export type VendorPortalTab = 
  | 'HOME'
  | 'BIDDING'
  | 'NEGOTIATION'
  | 'STRUCTURED_DOCS'
  | 'QUALIFICATIONS'
  | 'MONTHLY_FRAMEWORK'
  | 'SPECIAL_ORDERS'
  | 'ENGINEERS_SLA'
  | 'FINANCE_ANALYTICS';

export const VendorPortalView: React.FC<VendorPortalViewProps> = ({
  currentVendor,
  orders,
  onUpdateOrder,
  onLogout,
  onSwitchVendor,
}) => {
  // 左侧主菜单标签，默认进入主页数据简要分析
  const [activeMainTab, setActiveMainTab] = useState<VendorPortalTab>('HOME');

  // 数据集状态
  const [biddingProjects, setBiddingProjects] = useState<BiddingProject[]>(() => getBiddingProjects());
  const [qualifications, setQualifications] = useState<CorporateQualification[]>(() => getCorporateQualifications());
  const [structuredDocs, setStructuredDocs] = useState<StructuredDocumentRecord[]>(() => getStructuredDocuments());

  // 快捷上传单据类型透传
  const [quickUploadType, setQuickUploadType] = useState<'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION' | null>(null);

  // 公司快速切换下拉显隐
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  // 模态框状态
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierOrder, setDossierOrder] = useState<VendorCollaborationOrder>(orders[0]);
  const [showAuditReportModal, setShowAuditReportModal] = useState(false);

  // 友好浮动通知
  const [notifyMsg, setNotifyMsg] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotifyMsg({ text, type });
    setTimeout(() => {
      setNotifyMsg(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // 本供应商专属工单
  const vendorOrders = orders.filter(o => o.vendorId === currentVendor.vendorId);
  const effectiveOrders = vendorOrders.length > 0 ? vendorOrders : orders;

  // 待办与指标数据
  const openBiddingsCount = biddingProjects.filter(b => b.status === 'OPEN').length;
  const negotiatingOrdersCount = effectiveOrders.filter(o => o.status === 'MULTI_DEPT_NEGOTIATING').length;
  const expiringQualsCount = qualifications.filter(q => q.status === 'EXPIRING_SOON').length;

  // 统一整齐规范的菜单栏分组配置 (严格统一为6个中文字符，无省略号)
  const menuGroups: {
    groupTitle: string;
    items: {
      id: VendorPortalTab;
      title: string;
      icon: React.ComponentType<{ className?: string }>;
      badgeText: string;
      badgeVariant: 'neutral' | 'warning' | 'danger' | 'success';
    }[];
  }[] = [
    {
      groupTitle: '业务协同交易',
      items: [
        {
          id: 'HOME',
          title: '主页数据概览',
          icon: LayoutDashboard,
          badgeText: '总览',
          badgeVariant: 'neutral'
        },
        {
          id: 'BIDDING',
          title: '公开竞价投标',
          icon: Award,
          badgeText: openBiddingsCount > 0 ? `${openBiddingsCount}项` : '参投',
          badgeVariant: openBiddingsCount > 0 ? 'warning' : 'neutral'
        },
        {
          id: 'NEGOTIATION',
          title: '联合议价磋商',
          icon: Coins,
          badgeText: negotiatingOrdersCount > 0 ? `${negotiatingOrdersCount}单` : '达成',
          badgeVariant: negotiatingOrdersCount > 0 ? 'danger' : 'success'
        },
        {
          id: 'MONTHLY_FRAMEWORK',
          title: '零星维保结算',
          icon: FileSpreadsheet,
          badgeText: '48项',
          badgeVariant: 'neutral'
        }
      ]
    },
    {
      groupTitle: '单据资质合规',
      items: [
        {
          id: 'STRUCTURED_DOCS',
          title: '结构单据台账',
          icon: Layers,
          badgeText: `${structuredDocs.length}份`,
          badgeVariant: 'neutral'
        },
        {
          id: 'QUALIFICATIONS',
          title: '企业资质证照',
          icon: ShieldCheck,
          badgeText: expiringQualsCount > 0 ? `${expiringQualsCount}临期` : '合规',
          badgeVariant: expiringQualsCount > 0 ? 'warning' : 'success'
        }
      ]
    },
    {
      groupTitle: '履约经营对账',
      items: [
        {
          id: 'SPECIAL_ORDERS',
          title: '专项大修工单',
          icon: Wrench,
          badgeText: `${effectiveOrders.length}单`,
          badgeVariant: 'neutral'
        },
        {
          id: 'ENGINEERS_SLA',
          title: '驻场团队时效',
          icon: Users,
          badgeText: '99.4%',
          badgeVariant: 'success'
        },
        {
          id: 'FINANCE_ANALYTICS',
          title: '资金经营对账',
          icon: Receipt,
          badgeText: '已对账',
          badgeVariant: 'neutral'
        }
      ]
    }
  ];

  // 投标操作
  const handleSubmitBid = (projectId: string, submission: BidSubmission) => {
    const updated = submitBid(projectId, submission);
    setBiddingProjects(updated);
  };

  // 资质更新/上传
  const handleAddOrUpdateQualification = (qual: CorporateQualification) => {
    const updated = saveQualification(qual);
    setQualifications(updated);
  };

  // 结构化单据上传/更新
  const handleAddOrUpdateDoc = (doc: StructuredDocumentRecord) => {
    const updated = addOrUpdateStructuredDocument(doc);
    setStructuredDocs(updated);
  };

  // 从首页点击快捷上传
  const handleOpenQuickUpload = (docType: 'INVOICE' | 'REPAIR_REPORT' | 'QUOTATION') => {
    setQuickUploadType(docType);
    setActiveMainTab('STRUCTURED_DOCS');
  };

  const handleOpenDossier = (order: VendorCollaborationOrder) => {
    setDossierOrder(order);
    setShowDossierModal(true);
  };

  return (
    <div id="vendor-portal-view" className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans select-none">
      
      {/* 顶部轻量全局功能栏 (支持CSS选择器2) */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between gap-3 shrink-0 shadow-2xs z-30">
        
        {/* 左侧：系统标识与当前合作商身份 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>

          <div className="min-w-0 flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              五莲县人民医院
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">
              医疗装备协同管理云门户
            </span>
          </div>
        </div>

        {/* 右侧：服务商切换、审计底稿与退出 */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 服务商切换下拉 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowVendorDropdown(!showVendorDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="点击切换外协服务商视角"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">{currentVendor.vendorName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {showVendorDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 bg-slate-50 flex items-center justify-between">
                  <span>切换入驻外协服务商</span>
                  <span className="font-mono">共{VENDOR_ACCOUNTS.length}家</span>
                </div>
                <div className="py-1 max-h-56 overflow-y-auto">
                  {VENDOR_ACCOUNTS.map((v) => (
                    <button
                      key={v.vendorId}
                      type="button"
                      onClick={() => {
                        if (onSwitchVendor) onSwitchVendor(v);
                        setShowVendorDropdown(false);
                        showToast(`已切换至：${v.vendorName}`, 'info');
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                        v.vendorId === currentVendor.vendorId ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <span className="truncate">{v.vendorName}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {v.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAuditReportModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer shadow-2xs"
            title="打印或预览审计对账底稿"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>审计底稿</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer active:scale-95 border border-slate-200"
            title="退出服务商协同门户，返回医院内部管理系统"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>返回医院管理端</span>
          </button>
        </div>
      </header>

      {/* 主界面主体结构：左侧菜单栏 + 右侧功能视窗 (支持CSS选择器1) */}
      <main className="flex-1 min-h-0 overflow-hidden relative w-full flex flex-row">
        
        {/* ===================== 左侧菜单栏 (Left Sidebar Navigation) ===================== */}
        <aside className="w-[268px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full z-20 shadow-2xs">
          
          {/* 服务商简要名片 */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
              <span>认证合作供应商</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                履约中
              </span>
            </div>
            <div className="font-bold text-xs text-slate-900 truncate" title={currentVendor.vendorName}>
              {currentVendor.vendorName}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-500">
              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium border border-blue-100/80">
                {currentVendor.category}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-mono">{currentVendor.contactPerson}</span>
            </div>
          </div>

          {/* 导航菜单列表 (规范整齐、高一致性、无省略号) */}
          <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 text-xs">
            {menuGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span className="whitespace-nowrap">{group.groupTitle}</span>
                  <span className="font-mono text-[9px] text-slate-300 font-normal">{group.items.length}项</span>
                </div>
                
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = activeMainTab === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.id === 'STRUCTURED_DOCS') {
                            setQuickUploadType(null);
                          }
                          setActiveMainTab(item.id);
                        }}
                        className={`group relative flex items-center justify-between w-full h-10 px-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-600/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-1">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                          }`}>
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <span className="whitespace-nowrap tracking-normal text-left font-medium">{item.title}</span>
                        </div>

                        {/* 统一规整徽标 (无省略号、完全对齐) */}
                        <div className="shrink-0 pl-1">
                          {isActive ? (
                            <span className="h-5 min-w-[34px] px-1.5 rounded-full text-[10px] font-semibold inline-flex items-center justify-center bg-white/20 text-white backdrop-blur-xs whitespace-nowrap">
                              {item.badgeText}
                            </span>
                          ) : (
                            <span className={`h-5 min-w-[34px] px-1.5 rounded-full text-[10px] font-medium inline-flex items-center justify-center whitespace-nowrap ${
                              item.badgeVariant === 'warning'
                                ? 'bg-amber-100 text-amber-800'
                                : item.badgeVariant === 'danger'
                                ? 'bg-rose-100 text-rose-700'
                                : item.badgeVariant === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70 font-mono'
                            }`}>
                              {item.badgeText}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 底部系统协同连接状态 */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100 shrink-0" />
                <span>医院专线通道</span>
              </span>
              <span className="font-mono text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                实时连通
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              标准：公立医院DRG与医疗装备品控
            </div>
          </div>
        </aside>

        {/* ===================== 右侧功能视窗 (Content Area) ===================== */}
        <section className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-slate-50">
          
          {/* 1. 工作台主页 (数据简要分析) */}
          {activeMainTab === 'HOME' && (
            <div className="w-full h-full flex-1 min-h-0">
              <VendorHomeAnalyticsView
                currentVendor={currentVendor}
                orders={orders}
                biddingProjects={biddingProjects}
                qualifications={qualifications}
                structuredDocs={structuredDocs}
                onNavigateTab={(tabKey) => setActiveMainTab(tabKey)}
                onOpenQuickUpload={handleOpenQuickUpload}
              />
            </div>
          )}

          {/* 2. 公开竞价与招标中心 (支持竞价功能) */}
          {activeMainTab === 'BIDDING' && (
            <div className="w-full h-full flex-1 min-h-0">
              <VendorBiddingCenterView
                currentVendor={currentVendor}
                biddingProjects={biddingProjects}
                onSubmitBid={handleSubmitBid}
                onToast={showToast}
              />
            </div>
          )}

          {/* 3. 多科室联合议价 (支持议价功能) */}
          {activeMainTab === 'NEGOTIATION' && (
            <div className="w-full h-full flex-1 min-h-0">
              <VendorNegotiationCenterView
                currentVendor={currentVendor}
                orders={orders}
                onUpdateOrder={onUpdateOrder}
                onToast={showToast}
                onOpenDossierModal={handleOpenDossier}
              />
            </div>
          )}

          {/* 4. 单据与结构化中心 (发票/维修报告/报价单上传与结构化整理) */}
          {activeMainTab === 'STRUCTURED_DOCS' && (
            <div className="w-full h-full flex-1 min-h-0">
              <VendorStructuredDocsCenterView
                currentVendor={currentVendor}
                structuredDocs={structuredDocs}
                orders={orders}
                onAddOrUpdateDoc={handleAddOrUpdateDoc}
                onToast={showToast}
                initialUploadType={quickUploadType}
              />
            </div>
          )}

          {/* 5. 企业资质与证照管理 (企业资质也是从该处上传) */}
          {activeMainTab === 'QUALIFICATIONS' && (
            <div className="w-full h-full flex-1 min-h-0">
              <VendorQualificationView
                currentVendor={currentVendor}
                qualifications={qualifications}
                onAddOrUpdateQualification={handleAddOrUpdateQualification}
                onToast={showToast}
              />
            </div>
          )}

          {/* 6. 零星维保框架月度结算 */}
          {activeMainTab === 'MONTHLY_FRAMEWORK' && (
            <div className="w-full h-full flex-1 min-h-0">
              <MonthlyFrameworkWorkspace
                currentVendor={currentVendor}
                hideHeader={true}
                onSwitchToSpecialOrders={() => setActiveMainTab('SPECIAL_ORDERS')}
                onLogout={onLogout}
                onSwitchVendor={onSwitchVendor}
              />
            </div>
          )}

          {/* 7. 专项大修工单台账 */}
          {activeMainTab === 'SPECIAL_ORDERS' && (
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto">
              <VendorSpecialOrderWorkbench
                currentVendor={currentVendor}
                orders={orders}
                onUpdateOrder={onUpdateOrder}
                onToast={showToast}
                onOpenDossierModal={handleOpenDossier}
              />
            </div>
          )}

          {/* 8. 驻场工程师团队与服务SLA */}
          {activeMainTab === 'ENGINEERS_SLA' && (
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto">
              <VendorEngineersSlaTab
                currentVendor={currentVendor}
                onToast={showToast}
              />
            </div>
          )}

          {/* 9. 经营对账与回款台账 */}
          {activeMainTab === 'FINANCE_ANALYTICS' && (
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto">
              <VendorFinanceAnalyticsTab
                currentVendor={currentVendor}
                onToast={showToast}
              />
            </div>
          )}

        </section>
      </main>

      {/* 浮动轻量 Toast 提示 */}
      {notifyMsg && (
        <div className="fixed top-16 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 transition-all bg-white text-slate-800 border-slate-200 animate-in fade-in slide-in-from-top-2">
          {notifyMsg.type === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
          {notifyMsg.type === 'warning' && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
          {notifyMsg.type === 'info' && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
          <span>{notifyMsg.text}</span>
          <button 
            type="button" 
            onClick={() => setNotifyMsg(null)}
            className="text-slate-400 hover:text-slate-600 ml-2 cursor-pointer text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 一案一档归档卷宗 PDF 模态框 */}
      {showDossierModal && dossierOrder && (
        <VendorDossierPdfModal
          order={dossierOrder}
          onClose={() => setShowDossierModal(false)}
        />
      )}

      {/* 框架审计对账底稿模态框 */}
      {showAuditReportModal && (
        <MonthlyFrameworkAuditReportModal
          onClose={() => setShowAuditReportModal(false)}
        />
      )}
    </div>
  );
};
