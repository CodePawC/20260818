import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Database, 
  Palette, 
  Sliders, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Layers,
  Settings,
  Server,
  ArrowRight,
  QrCode,
  KeyRound,
  Link2
} from 'lucide-react';
import { AiConfigView } from './AiConfigView';
import { DatabaseBackupView } from './DatabaseBackupView';
import { SystemUpdateConfigView } from './SystemUpdateConfigView';
import { CaoliaoIntegrationView } from './CaoliaoIntegrationView';
import { CaoliaoSyncSettingsView } from './CaoliaoSyncSettingsView';
import { ActiveTab } from '../types';

interface SystemOpsUnifiedViewProps {
  initialSubTab?: 'ai_config' | 'database_backup' | 'system_update' | 'caoliao_hub' | 'caoliao_integration' | 'caoliao_sync_settings';
  onNavigateTab?: (tab: ActiveTab) => void;
  onViewEquipmentDetails?: (item: any, initialTab?: string) => void;
}

export const SystemOpsUnifiedView: React.FC<SystemOpsUnifiedViewProps> = ({
  initialSubTab = 'ai_config',
  onNavigateTab,
  onViewEquipmentDetails
}) => {
  // 顶层四大运维支柱 Tab
  const [activeSubTab, setActiveSubTab] = useState<'ai_config' | 'database_backup' | 'system_update' | 'caoliao_hub'>(() => {
    if (initialSubTab === 'caoliao_integration' || initialSubTab === 'caoliao_sync_settings' || initialSubTab === 'caoliao_hub') {
      return 'caoliao_hub';
    }
    return (initialSubTab as any) || 'ai_config';
  });

  // 草料二维码一体化专区内的子切换：'sync_settings' (OpenAPI凭据与22大类映射规则) vs 'rds_linkage' (阿里云RDS数据库与扫码报修联动)
  const [caoliaoViewMode, setCaoliaoViewMode] = useState<'sync_settings' | 'rds_linkage'>(() => {
    return initialSubTab === 'caoliao_integration' ? 'rds_linkage' : 'sync_settings';
  });

  useEffect(() => {
    if (initialSubTab) {
      if (initialSubTab === 'caoliao_sync_settings') {
        setActiveSubTab('caoliao_hub');
        setCaoliaoViewMode('sync_settings');
      } else if (initialSubTab === 'caoliao_integration') {
        setActiveSubTab('caoliao_hub');
        setCaoliaoViewMode('rds_linkage');
      } else if (initialSubTab === 'caoliao_hub') {
        setActiveSubTab('caoliao_hub');
      } else {
        setActiveSubTab(initialSubTab as any);
      }
    }
  }, [initialSubTab]);

  const tabsConfig = [
    {
      id: 'ai_config' as const,
      name: 'AI 智能模型配置',
      badge: '大模型 / 提示词 / RAG',
      icon: Bot,
      desc: 'Gemini / 本地大模型接入、专科 Prompt 人设与医学知识库检索',
      activeColor: 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
    },
    {
      id: 'database_backup' as const,
      name: '数据备份与数据库',
      badge: '连接池 / 定时备份 / 灾备快照',
      icon: Database,
      desc: 'PostgreSQL / MySQL 集群连接、每日定时全量快照与一键灾难恢复',
      activeColor: 'border-blue-600 text-blue-700 bg-blue-50/50'
    },
    {
      id: 'system_update' as const,
      name: '前端 UI 与系统更新',
      badge: '主题定制 / 特性开关 / 热更新',
      icon: Palette,
      desc: 'UI 主题色板、医院品牌机构定制、功能特性热插拔与版本在线热更新',
      activeColor: 'border-purple-600 text-purple-700 bg-purple-50/50'
    },
    {
      id: 'caoliao_hub' as const,
      name: '草料二维码对接与同步',
      badge: 'OpenAPI · 阿里云RDS · 分类映射',
      icon: QrCode,
      desc: '草料开放平台 API Key、22大类设备活码映射规则与官方 MySQL 数据库扫码联动一体化管理',
      activeColor: 'border-teal-600 text-teal-700 bg-teal-50/50'
    }
  ];

  return (
    <div className="w-full min-h-full bg-slate-50/50 pb-12 flex flex-col flex-1">
      {/* 顶部统一控制台导航条 */}
      <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white shadow-md shadow-indigo-100 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  系统与运维管理中心
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  统一运维控制台
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                五莲县人民医院医学装备 AI 智能引擎、多源数据库灾难备份、前端 UI 更新与草料二维码一体化对接
              </p>
            </div>
          </div>

          {/* 状态指示 */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>系统运行正常 · 生产稳定版</span>
            </div>
          </div>
        </div>

        {/* 顶部四大支柱模块切换标签栏（已消除重复） */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-0">
            {tabsConfig.map(tab => {
              const isActive = activeSubTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`py-3 px-4 sm:px-5 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? `${tab.activeColor} border-b-2 font-bold shadow-2xs rounded-t-lg`
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-current' : 'text-slate-400'}`} />
                  <span>{tab.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md hidden md:inline-block ${
                    isActive ? 'bg-white/90 font-bold shadow-2xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 核心内容渲染区 - 采用充满屏幕的视觉效果 */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex-1">
        {activeSubTab === 'ai_config' && (
          <div className="animate-in fade-in duration-150 w-full">
            <AiConfigView />
          </div>
        )}

        {activeSubTab === 'database_backup' && (
          <div className="animate-in fade-in duration-150 w-full">
            <DatabaseBackupView />
          </div>
        )}

        {activeSubTab === 'system_update' && (
          <div className="animate-in fade-in duration-150 w-full">
            <SystemUpdateConfigView />
          </div>
        )}

        {activeSubTab === 'caoliao_hub' && (
          <div className="animate-in fade-in duration-150 w-full space-y-4">
            {/* 草料二维码一体化子分栏切换 Bar */}
            <div className="bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCaoliaoViewMode('sync_settings')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    caoliaoViewMode === 'sync_settings'
                      ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                  <span>草料 OpenAPI 密钥与设备分类映射规则</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 font-mono">22大类映射</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCaoliaoViewMode('rds_linkage')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    caoliaoViewMode === 'rds_linkage'
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>阿里云 RDS 数据库直通与现场扫码联动</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-mono">1602个活码</span>
                </button>
              </div>

              <div className="text-2xs text-slate-500 hidden md:flex items-center gap-2 px-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>草料开放平台 OpenAPI & 阿里云 RDS 专线双通道就绪</span>
              </div>
            </div>

            {/* 子视图呈现 */}
            {caoliaoViewMode === 'sync_settings' ? (
              <CaoliaoSyncSettingsView 
                onNavigateTab={onNavigateTab} 
                onOpenLedgerWithCategory={(categoryNo) => {
                  if (onNavigateTab) {
                    onNavigateTab('ledger');
                  }
                }}
              />
            ) : (
              <CaoliaoIntegrationView 
                onViewEquipmentDetails={onViewEquipmentDetails} 
                onNavigateTab={(tab) => {
                  if (tab === 'caoliao_sync_settings') {
                    setCaoliaoViewMode('sync_settings');
                  } else if (onNavigateTab) {
                    onNavigateTab(tab);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
