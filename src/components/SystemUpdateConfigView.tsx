import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  RefreshCw, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Monitor, 
  Smartphone, 
  Layout, 
  Eye, 
  Sliders, 
  Building2, 
  ShieldCheck, 
  Bell, 
  ToggleLeft, 
  ToggleRight, 
  Layers, 
  ArrowUpCircle, 
  Clock, 
  Check, 
  Info,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  History
} from 'lucide-react';
import { 
  UiDesignConfig, 
  getUiDesignConfig, 
  saveUiDesignConfig, 
  DEFAULT_UI_DESIGN_CONFIG 
} from '../utils/systemConfigStore';

// 配色主题方案字典
const THEME_PALETTES = [
  {
    id: 'medical_navy',
    name: '医疗藏青 (经典官方)',
    desc: '沉稳权威的三甲医院医工与质控主色调，对比度舒适',
    primaryColor: '#1e40af', // blue-800
    accentColor: '#3b82f6',  // blue-500
    bgHeader: 'bg-slate-900',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'cyan_tech',
    name: '智慧科技青 (现代数字)',
    desc: '现代数字化智慧医院风格，活力与科技感并存',
    primaryColor: '#0e7490', // cyan-700
    accentColor: '#06b6d4',  // cyan-500
    bgHeader: 'bg-cyan-950',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300'
  },
  {
    id: 'emerald_health',
    name: '健康祖母绿 (质控生态)',
    desc: '医疗器械质量与生命支持绿色生命线',
    primaryColor: '#047857', // emerald-700
    accentColor: '#10b981',  // emerald-500
    bgHeader: 'bg-emerald-950',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  {
    id: 'minimal_slate',
    name: '极简石板灰 (沉稳公文)',
    desc: '行政机关公文与极简工业风，适合大屏长期监视',
    primaryColor: '#334155', // slate-700
    accentColor: '#64748b',  // slate-500
    bgHeader: 'bg-slate-950',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300'
  },
  {
    id: 'warm_stone',
    name: '暖色典雅 (温和亲和)',
    desc: '柔和温暖的医疗关怀色系，减轻临床医护视觉疲劳',
    primaryColor: '#78350f', // amber-900
    accentColor: '#d97706',  // amber-600
    bgHeader: 'bg-stone-900',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
  }
];

export const SystemUpdateConfigView: React.FC = () => {
  const [config, setConfig] = useState<UiDesignConfig>(() => getUiDesignConfig());
  const [activeTab, setActiveTab] = useState<'theme' | 'branding' | 'flags' | 'version_release'>('theme');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<{
    version: string;
    releaseDate: string;
    notes: string[];
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 保存配置
  const handleSaveConfig = () => {
    const updated = {
      ...config,
      lastUpdated: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };
    setConfig(updated);
    saveUiDesignConfig(updated);
    showToast('前端 UI 配置与更新参数已成功保存并下发！');
  };

  // 恢复默认
  const handleReset = () => {
    if (window.confirm('确定要将前端 UI 主题与更新配置重置为官方默认状态吗？')) {
      setConfig(DEFAULT_UI_DESIGN_CONFIG);
      saveUiDesignConfig(DEFAULT_UI_DESIGN_CONFIG);
      showToast('已恢复官方默认主题配置');
    }
  };

  // 检查版本更新
  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setUpdateAvailable(null);

    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateAvailable({
        version: 'v2.5.2-Hotfix',
        releaseDate: '2026-10-06 18:00',
        notes: [
          '优化麻醉科电子内窥镜返厂议价联合签字审批交互；',
          '新增移动端扫码巡检暗光手电筒辅助与快速连续扫码盘点；',
          '优化结项万字报告 A4 单页分页阅读排版，彻底消除冗余提示；',
          '系统安全补丁：加固离线备份数据包 SHA-256 完整性防篡改签名。'
        ]
      });
    }, 900);
  };

  // 执行热更新应用
  const handleApplyUpdate = () => {
    if (!updateAvailable) return;
    const nextConfig = {
      ...config,
      uiVersion: updateAvailable.version,
      lastUpdated: new Date().toLocaleString()
    };
    setConfig(nextConfig);
    saveUiDesignConfig(nextConfig);
    setUpdateAvailable(null);
    showToast(`系统已成功热升级至最新版本 [${updateAvailable.version}]！`);
  };

  // 切换特性开关
  const handleToggleFlag = (key: keyof UiDesignConfig['featureFlags']) => {
    setConfig(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [key]: !prev.featureFlags[key]
      }
    }));
  };

  return (
    <div className="w-full space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-md shadow-purple-100">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              系统更新与前端 UI 视觉设计配置
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              热更新 & 动态皮肤
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            专为系统正式上线后的运维期设计：支持热插拔功能开关、院区品牌定制、UI 主题调色板切换及前端版本在线无感热更新
          </p>
        </div>

        {/* 顶部操作区 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-purple-700 border border-purple-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            {isCheckingUpdate ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <ArrowUpCircle className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>{isCheckingUpdate ? '正在检查云端更新...' : '检查前端 UI 更新'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>恢复默认</span>
          </button>

          <button
            onClick={handleSaveConfig}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>保存并全院生效</span>
          </button>
        </div>
      </div>

      {/* Toast 提示 */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-lg text-xs sm:text-sm flex items-center gap-2 animate-in fade-in duration-200 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 核心指标统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">当前运行 UI 版本</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
              {config.uiVersion}
            </p>
            <span className="inline-block mt-1 text-[11px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              发布通道: {config.releaseChannel.toUpperCase()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layout className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">激活主题调色板</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {THEME_PALETTES.find(t => t.id === config.themePalette)?.name.split(' ')[0] || '经典藏青'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              圆角: {config.borderRadius === 'sharp' ? '锐利公文' : config.borderRadius === 'soft' ? '柔和圆润' : '现代平滑'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">专属机构定制实体</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate max-w-[130px]">
              {config.hospitalName}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              简称: {config.hospitalShortName}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">特性开关已开启</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {Object.values(config.featureFlags).filter(Boolean).length} / {Object.keys(config.featureFlags).length} 项功能
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              上次更新: {config.lastUpdated}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 更新可用提示卡片 */}
      {updateAvailable && (
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-xl text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
              <span className="font-bold text-purple-950 text-sm">
                发现全新前端 UI 增量更新补丁包: {updateAvailable.version}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                ({updateAvailable.releaseDate})
              </span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-xs pl-1">
              {updateAvailable.notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setUpdateAvailable(null)}
              className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-100 cursor-pointer"
            >
              暂不升级
            </button>
            <button
              onClick={handleApplyUpdate}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>一键热加载应用</span>
            </button>
          </div>
        </div>
      )}

      {/* 标签栏 */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { key: 'theme', label: '主题调色板与排版风格', icon: Palette },
          { key: 'branding', label: '医院机构品牌与公告栏', icon: Building2 },
          { key: 'flags', label: '上线功能特性开关 (Feature Flags)', icon: SlidersHorizontal },
          { key: 'version_release', label: '版本管理与发布通道', icon: History },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-purple-600 text-purple-700 font-bold bg-purple-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签 1：主题调色板与排版风格 */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>全院客户端视觉主题色板 (Design Palette)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                实时切换界面主基调色彩，改变侧边栏高亮、按钮、徽标与状态指引配色
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {THEME_PALETTES.map(palette => (
                <div
                  key={palette.id}
                  onClick={() => setConfig(prev => ({ ...prev, themePalette: palette.id as any }))}
                  className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    config.themePalette === palette.id
                      ? 'border-purple-600 bg-purple-50/30 ring-2 ring-purple-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-5 h-5 rounded-full border border-black/10 shadow-2xs" 
                        style={{ backgroundColor: palette.primaryColor }}
                      />
                      <div 
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" 
                        style={{ backgroundColor: palette.accentColor }}
                      />
                    </div>
                    <p className="font-bold text-xs text-slate-900">{palette.name}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{palette.desc}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${palette.badgeClass}`}>
                      示例徽章
                    </span>
                    {config.themePalette === palette.id && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 圆角与排版密度 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  界面组件圆角风格 (Border Radius)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sharp', label: '锐利公文 (0px)' },
                    { id: 'modern', label: '现代平滑 (8px)' },
                    { id: 'soft', label: '柔和圆润 (16px)' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, borderRadius: r.id as any }))}
                      className={`py-2 px-1 text-center text-xs font-medium border transition cursor-pointer ${
                        r.id === 'sharp' ? 'rounded-xs' : r.id === 'soft' ? 'rounded-xl' : 'rounded-md'
                      } ${
                        config.borderRadius === r.id
                          ? 'border-purple-600 bg-purple-50 text-purple-800 font-bold'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  信息呈现密度 (UI Density)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: '高密紧凑' },
                    { id: 'comfortable', label: '标准舒适' },
                    { id: 'relaxed', label: '通透宽松' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, density: d.id as any }))}
                      className={`py-2 text-center text-xs font-medium rounded-lg border transition cursor-pointer ${
                        config.density === d.id
                          ? 'border-purple-600 bg-purple-50 text-purple-800 font-bold'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  导航布局架构 (Navigation Mode)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sidebar', label: '侧边栏 (默认)' },
                    { id: 'top_nav', label: '顶部通栏' },
                    { id: 'dual_split', label: '双栏分屏' }
                  ].map(layout => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, layoutMode: layout.id as any }))}
                      className={`py-2 text-center text-xs font-medium rounded-lg border transition cursor-pointer ${
                        config.layoutMode === layout.id
                          ? 'border-purple-600 bg-purple-50 text-purple-800 font-bold'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 即时效果实测沙盒预览窗 */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>实时外观设计即时沙盒预览 (Live Preview)</span>
              </h3>
              <span className="text-xs text-slate-400">所见即所得 · 修改上方配置即时同步</span>
            </div>

            {/* 模拟 Header 与 卡片小窗 */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs bg-slate-50">
              {/* 模拟顶栏 */}
              <div className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                    style={{ backgroundColor: THEME_PALETTES.find(t => t.id === config.themePalette)?.primaryColor || '#1e40af' }}
                  >
                    WL
                  </div>
                  <span className="font-bold text-xs text-slate-900">{config.hospitalName}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-xs text-slate-500">{config.systemTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    THEME_PALETTES.find(t => t.id === config.themePalette)?.badgeClass
                  }`}>
                    单轨稳定运行
                  </span>
                </div>
              </div>

              {/* 模拟公告栏 */}
              {config.showSystemNotice && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{config.systemNoticeText}</span>
                </div>
              )}

              {/* 模拟内容区 */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400">在册特急机具</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">45 台待命</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400">本月麻醉内窥镜议价</span>
                  <p className="text-base font-bold text-emerald-700 mt-0.5">审减 45.2 万元</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-slate-400">法定强检合规率</span>
                  <p className="text-base font-bold text-blue-700 mt-0.5">100% 零漏检</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签 2：医院机构品牌与公告栏 */}
      {activeTab === 'branding' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>医院机构品牌信息与全局广播配置</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              修改医院正式法人单位名称、机构缩写、系统顶栏主标题以及全院滚动公告条
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                医院全称 (Hospital Full Name)
              </label>
              <input
                type="text"
                value={config.hospitalName}
                onChange={(e) => setConfig(prev => ({ ...prev, hospitalName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="例如：五莲县人民医院"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                机构简称 (Short Name)
              </label>
              <input
                type="text"
                value={config.hospitalShortName}
                onChange={(e) => setConfig(prev => ({ ...prev, hospitalShortName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="例如：五莲县医"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                系统大标题 / 顶栏副标题 (System Title)
              </label>
              <input
                type="text"
                value={config.systemTitle}
                onChange={(e) => setConfig(prev => ({ ...prev, systemTitle: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                placeholder="例如：医学装备全生命周期闭环管理系统"
              />
            </div>
          </div>

          {/* 全局通知广播设置 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-slate-900">顶栏全局紧急广播通告条</span>
              </div>
              <input
                type="checkbox"
                checked={config.showSystemNotice}
                onChange={(e) => setConfig(prev => ({ ...prev, showSystemNotice: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded"
              />
            </div>

            {config.showSystemNotice && (
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  通告文案内容 (全院各科室登录后顶栏醒目提示):
                </label>
                <input
                  type="text"
                  value={config.systemNoticeText}
                  onChange={(e) => setConfig(prev => ({ ...prev, systemNoticeText: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  placeholder="输入通告内容..."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 标签 3：特性开关 Feature Flags */}
      {activeTab === 'flags' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <span>上线后功能特性热插拔开关 (Feature Flags)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              无需重新发布编译代码，管理员在后台即可动态开启或隐藏特定业务功能或实验性特性
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'threeDDigitalTwin' as const,
                title: '3D 数字孪生与全景科室展示',
                desc: '在综合大盘启用 3D 楼宇与生命支持设备空间分布交互渲染'
              },
              {
                key: 'highContrastMobile' as const,
                title: '移动端高对比度巡检模式',
                desc: '优化临床工程师在暗光机房与库房中扫码识别的清晰度'
              },
              {
                key: 'pmGanttChart' as const,
                title: '预防性维护 (PM) 甘特图排程',
                desc: '以甘特图形式展现全院 45 科室各月份 PM 巡检排班日程'
              },
              {
                key: 'voiceNlpTrigger' as const,
                title: '语音口述报修直接生成工单',
                desc: '允许临床护士通过麦克风口述故障现象并由 AI 语义自动转为工单'
              },
              {
                key: 'kanbanOrderView' as const,
                title: '维修工单敏捷看板 (Kanban 视图)',
                desc: '支持在待响应、维修中、待质检、已验收状态列之间拖拽流转'
              },
              {
                key: 'autoCalibrationWarning' as const,
                title: '法定强检超期强制弹窗强提醒',
                desc: '当临近法定定检 30 天内或超期，登录后向医工管理员弹出强提醒'
              }
            ].map(flag => (
              <div 
                key={flag.key}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{flag.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{flag.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleFlag(flag.key)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    config.featureFlags[flag.key] ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    config.featureFlags[flag.key] ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 标签 4：版本管理与发布通道 */}
      {activeTab === 'version_release' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <span>版本发布管理与热更新通道</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              监控当前生产运行版本，支持灰度发布切换、升级回滚与版本历史追溯
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'stable',
                title: 'Stable 生产稳定通道 (推荐)',
                badge: '三甲医院主推',
                desc: '仅接收经过全院回归测试与安全等保验收的成熟版本，稳定性最高'
              },
              {
                id: 'beta',
                title: 'Beta 灰度测试通道',
                badge: '医工骨干先行',
                desc: '提前 7 天体验麻醉科内镜议价与 AI 新特性，供科室主任与护士长试用'
              },
              {
                id: 'canary',
                title: 'Canary 每日体验通道',
                badge: '前沿实验性',
                desc: '包含最新的微调实验功能，适合系统总架构师与技术调试'
              }
            ].map(ch => (
              <div
                key={ch.id}
                onClick={() => setConfig(prev => ({ ...prev, releaseChannel: ch.id as any }))}
                className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  config.releaseChannel === ch.id
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-slate-900">{ch.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      {ch.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{ch.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 版本历史与一键回滚 */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-800 mb-2">已封存部署的历史版本回滚点：</h3>
            <div className="space-y-2">
              {[
                { version: 'v2.5.0-Release', date: '2026-10-06 17:30', desc: '社科课题结项规范与多源数据库备份与AI配置全功能版本 (当前活跃)', current: true },
                { version: 'v2.4.8-Release', date: '2026-09-30 09:00', desc: '完成麻醉手术科电子内窥镜联合议价与三线表规范排版', current: false },
                { version: 'v2.4.0-Release', date: '2026-09-15 14:20', desc: '全院45个临床科室完成资产主数据建档与在位扫码纠偏', current: false }
              ].map(ver => (
                <div key={ver.version} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 font-mono">{ver.version}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-500">{ver.date}</span>
                    <p className="text-slate-600 mt-0.5 text-[11px]">{ver.desc}</p>
                  </div>
                  <div>
                    {ver.current ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        当前运行中
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`确定要将前端 UI 版本一键回滚至 ${ver.version} 吗？`)) {
                            setConfig(prev => ({ ...prev, uiVersion: ver.version }));
                            showToast(`已成功回滚至历史基准版本 [${ver.version}]`);
                          }
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium cursor-pointer transition"
                      >
                        回滚至此版本
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
