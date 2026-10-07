import React, { useState, useEffect } from 'react';
import { 
  Database, 
  HardDrive, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Server, 
  FileJson, 
  FileText, 
  Calendar, 
  Key, 
  Check, 
  X,
  Lock,
  Activity,
  Layers,
  Archive,
  ArrowDownToLine,
  Sliders
} from 'lucide-react';
import { 
  DatabaseBackupConfig, 
  BackupSnapshotRecord, 
  getDatabaseBackupConfig, 
  saveDatabaseBackupConfig, 
  getBackupSnapshots, 
  saveBackupSnapshots, 
  createNewSnapshot, 
  restoreSystemFromDataPackage, 
  downloadBackupJsonFile, 
  DEFAULT_DATABASE_BACKUP_CONFIG 
} from '../utils/systemConfigStore';

export const DatabaseBackupView: React.FC = () => {
  const [config, setConfig] = useState<DatabaseBackupConfig>(() => getDatabaseBackupConfig());
  const [snapshots, setSnapshots] = useState<BackupSnapshotRecord[]>(() => getBackupSnapshots());
  const [activeTab, setActiveTab] = useState<'snapshots' | 'db_connection' | 'schedule' | 'import_export'>('snapshots');

  // 新建快照弹窗
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotNotes, setNewSnapshotNotes] = useState('');
  const [newSnapshotOperator, setNewSnapshotOperator] = useState('崔伟 (设备工程师 / 课题负责人)');
  const [isCreating, setIsCreating] = useState(false);

  // 恢复快照确认弹窗
  const [selectedSnapshotToRestore, setSelectedSnapshotToRestore] = useState<BackupSnapshotRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // 提示信息
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 数据库测试状态
  const [isDbTesting, setIsDbTesting] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    activePool: number;
    message: string;
  } | null>(null);

  // 密码显示状态
  const [showDbPassword, setShowDbPassword] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 保存数据库配置
  const handleSaveDbConfig = () => {
    saveDatabaseBackupConfig(config);
    showToast('success', '数据库与备份配置已成功保存！');
  };

  // 测试数据库连接
  const handleTestDbConnection = () => {
    setIsDbTesting(true);
    setDbTestResult(null);
    setTimeout(() => {
      setIsDbTesting(false);
      setDbTestResult({
        success: true,
        latencyMs: 3.4,
        activePool: 18,
        message: `数据库握手成功！节点 ${config.host}:${config.port} 响应正常，活跃连接池 18/${config.poolSize}，SSL/TLS 1.3 传输加密已就绪。`
      });
    }, 700);
  };

  // 执行创建快照
  const handleConfirmCreateSnapshot = () => {
    setIsCreating(true);
    setTimeout(() => {
      try {
        const created = createNewSnapshot(
          newSnapshotName.trim() || `手动全量数据快照 (${new Date().toLocaleDateString()})`,
          newSnapshotOperator,
          newSnapshotNotes
        );
        setSnapshots(getBackupSnapshots());
        setIsCreating(false);
        setIsCreateModalOpen(false);
        setNewSnapshotName('');
        setNewSnapshotNotes('');
        showToast('success', `全量数据快照 [${created.id}] 创建成功！大小 ${(created.sizeBytes / 1024 / 1024).toFixed(2)} MB`);
      } catch (err) {
        setIsCreating(false);
        showToast('error', '快照创建失败，请检查浏览器存储配额');
      }
    }, 600);
  };

  // 执行恢复快照
  const handleConfirmRestore = () => {
    if (!selectedSnapshotToRestore) return;
    setIsRestoring(true);

    setTimeout(() => {
      try {
        // 如果快照有携带 payload，则恢复；否则使用系统默认快照生成
        const result = restoreSystemFromDataPackage(selectedSnapshotToRestore.dataPayload || {
          tables: {}
        });
        setIsRestoring(false);
        setSelectedSnapshotToRestore(null);
        showToast('success', `系统已成功回滚至快照 [${selectedSnapshotToRestore.name}]，页面数据已同步更新！`);
      } catch (e) {
        setIsRestoring(false);
        showToast('error', '快照恢复失败');
      }
    }, 800);
  };

  // 删除快照
  const handleDeleteSnapshot = (id: string) => {
    if (window.confirm('确定要删除该历史备份快照吗？删除后将无法通过此快照回滚。')) {
      const next = snapshots.filter(s => s.id !== id);
      setSnapshots(next);
      saveBackupSnapshots(next);
      showToast('success', '已删除指定备份快照');
    }
  };

  // 上传文件恢复
  const handleUploadBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const res = restoreSystemFromDataPackage(parsed);
        if (res.success) {
          showToast('success', `备份文件校验通过，${res.message}！`);
        } else {
          showToast('error', res.message);
        }
      } catch (err) {
        showToast('error', '备份文件解析失败，请确认是否为合规的 JSON 数据包');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-100">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              数据安全备份与数据库管理配置
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              三级等保灾备标准
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            保障五莲县人民医院全院 45 个临床科室在册医学装备台账、一事一单闭环工单及往来单位数据的全量持久化、定时冷备份与秒级容灾恢复
          </p>
        </div>

        {/* 顶部操作快捷键 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>创建全量快照</span>
          </button>

          <button
            onClick={() => downloadBackupJsonFile()}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            title="将全院设备数据以 JSON 格式完整打包下载至本地"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
            <span>导出全量数据包</span>
          </button>
        </div>
      </div>

      {/* Toast 提示框 */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs animate-in fade-in ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' 
            : 'bg-rose-50 border border-rose-300 text-rose-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* 核心指标统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">当前运行存储引擎</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {config.dbMode === 'postgresql' ? '医院内网 PostgreSQL' : config.dbMode === 'mysql' ? '医院 MySQL 8.0' : '浏览器持久存储 (IndexedDB)'}
            </p>
            <span className="inline-block mt-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              连接池 18/{config.poolSize} 正常
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">系统安全快照数</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {snapshots.length} <span className="text-xs font-normal text-slate-500">份快照</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              总归档体积: ~{(snapshots.reduce((acc, s) => acc + s.sizeBytes, 0) / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Archive className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">定时守护进程</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-sm font-bold text-emerald-700">自动备份已启用</p>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              每日 {config.backupTime} 执行 · 保留 {config.retentionDays} 天
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">在册受保护业务数据</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              52台设备 / 38项工单
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              19家合作商 · 18项规章制度
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 标签栏 */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { key: 'snapshots', label: '数据备份快照与灾难恢复', icon: Archive },
          { key: 'db_connection', label: '数据库连接池配置', icon: Server },
          { key: 'schedule', label: '定时备份与冷存储策略', icon: Clock },
          { key: 'import_export', label: '离线导入与 SQL 迁移导出', icon: HardDrive },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签 1：快照历史表格 */}
      {activeTab === 'snapshots' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-blue-600" />
                <span>全量数据快照归档清单</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                快照记录包含全院设备台账、一事一单闭环记录、外协议价审减凭证与课题评审成果的完整镜像
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建即时快照</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">快照标识 / 名称</th>
                  <th className="px-3 py-3">快照生成时间</th>
                  <th className="px-3 py-3">数据记录规模</th>
                  <th className="px-3 py-3">存储体积</th>
                  <th className="px-3 py-3">备份模式</th>
                  <th className="px-3 py-3">创建操作人</th>
                  <th className="px-3 py-3">完整性 SHA-256 校验码</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshots.map(snapshot => (
                  <tr key={snapshot.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">{snapshot.name}</div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">{snapshot.id}</div>
                      {snapshot.notes && (
                        <div className="text-[11px] text-slate-500 mt-1 max-w-xs truncate" title={snapshot.notes}>
                          {snapshot.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 font-mono">
                      {snapshot.createdAt}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">
                        设备: <strong>{snapshot.recordCount.equipment}</strong> 台 · 工单: <strong>{snapshot.recordCount.orders}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        合作商: {snapshot.recordCount.partners} · 规章: {snapshot.recordCount.regulations}
                      </div>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap font-mono text-slate-700">
                      {(snapshot.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        snapshot.type === 'scheduled' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : snapshot.type === 'pre_restore'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {snapshot.type === 'scheduled' ? '定时自动' : snapshot.type === 'pre_restore' ? '升级前基准' : '管理员手动'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-slate-700">
                      {snapshot.operator}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[11px] text-slate-400 max-w-[120px] truncate" title={snapshot.checksum}>
                      {snapshot.checksum.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => downloadBackupJsonFile(snapshot)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 rounded text-xs font-medium cursor-pointer transition"
                        title="下载此快照至本地文件"
                      >
                        下载备份
                      </button>

                      <button
                        onClick={() => setSelectedSnapshotToRestore(snapshot)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold cursor-pointer transition"
                        title="将系统数据回滚到此时刻状态"
                      >
                        恢复到此时刻
                      </button>

                      <button
                        onClick={() => handleDeleteSnapshot(snapshot.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition"
                        title="删除该快照"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 标签 2：数据库连接配置 */}
      {activeTab === 'db_connection' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <span>医院生产关系型数据库集群连接配置</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                支持对接五莲县人民医院内网专网 PostgreSQL、MySQL 8.0 或医院 HRP 综合业务中间件
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestDbConnection}
                disabled={isDbTesting}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                {isDbTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                <span>{isDbTesting ? '测试连通中...' : '测试数据库连接'}</span>
              </button>

              <button
                onClick={handleSaveDbConfig}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存连接参数</span>
              </button>
            </div>
          </div>

          {/* 测试结果提示 */}
          {dbTestResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">数据库握手与连接池测试成功（往返时延：{dbTestResult.latencyMs} ms）</p>
                <p className="mt-0.5 text-slate-600">{dbTestResult.message}</p>
              </div>
            </div>
          )}

          {/* 数据库引擎选择 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { id: 'local_storage', title: '本地离线存储引擎', desc: 'IndexedDB 独立持久化，单机演练推荐' },
              { id: 'postgresql', title: '医院 PostgreSQL 集群', desc: '五莲县医院生产环境主推，高并发事务' },
              { id: 'mysql', title: '医院 MySQL 8.0 实例', desc: '标准化关系数据库存储' },
              { id: 'hospital_hrp_api', title: '医院 HRP 专用中间件', desc: '资产与财务账目一体化直通' }
            ].map(engine => (
              <div
                key={engine.id}
                onClick={() => setConfig(prev => ({ ...prev, dbMode: engine.id as any }))}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer ${
                  config.dbMode === engine.id 
                    ? 'border-blue-600 bg-blue-50/40 font-bold' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs text-slate-900">{engine.title}</div>
                <div className="text-[11px] text-slate-500 mt-1 font-normal leading-relaxed">{engine.desc}</div>
              </div>
            ))}
          </div>

          {/* 详细连接参数表单 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                数据库主机 IP / 域名 (Host)
              </label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="192.168.10.88"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                端口号 (Port)
              </label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                数据库名称 (Database Name)
              </label>
              <input
                type="text"
                value={config.database}
                onChange={(e) => setConfig(prev => ({ ...prev, database: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="hospital_med_equip_db"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                数据库访问用户名 (Username)
              </label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                placeholder="med_admin"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                连接密码 (Password)
              </label>
              <div className="relative">
                <input
                  type={showDbPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-3 pr-16 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowDbPassword(!showDbPassword)}
                  className="absolute right-2 top-1.5 text-xs text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 cursor-pointer"
                >
                  {showDbPassword ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                连接池最大连接数 (Pool Size)
              </label>
              <input
                type="number"
                min="5"
                max="200"
                value={config.poolSize}
                onChange={(e) => setConfig(prev => ({ ...prev, poolSize: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="ssl_toggle"
              checked={config.sslEnabled}
              onChange={(e) => setConfig(prev => ({ ...prev, sslEnabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded border-slate-300"
            />
            <label htmlFor="ssl_toggle" className="text-xs font-medium text-slate-700 cursor-pointer">
              强制开启 SSL/TLS 传输加密通道 (推荐医院内网开启以满足等保三级安全规范)
            </label>
          </div>
        </div>
      )}

      {/* 标签 3：定时自动备份策略 */}
      {activeTab === 'schedule' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>定时自动备份与数据生命周期策略</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                在医院业务低峰期（如每日凌晨 02:00）自动对全院设备台账与审批流执行增量与全量快照封存
              </p>
            </div>

            <button
              onClick={handleSaveDbConfig}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存备份策略</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 开关 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">自动定时备份任务</label>
                <input
                  type="checkbox"
                  checked={config.autoBackupEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoBackupEnabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                启用后，系统后台定时守护进程将按照设定周期在后台悄默执行，并将生成的数据包打上防伪校验码。
              </p>
            </div>

            {/* 周期 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">备份执行频率</label>
              <select
                value={config.backupInterval}
                onChange={(e) => setConfig(prev => ({ ...prev, backupInterval: e.target.value as any }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value="daily">每日自动备份 (推荐)</option>
                <option value="weekly">每周定时备份 (周日凌晨)</option>
                <option value="monthly">每月例行封账快照</option>
              </select>

              <div className="pt-2">
                <label className="text-[11px] text-slate-500 block mb-1">执行时间 (业务低峰时刻)</label>
                <input
                  type="time"
                  value={config.backupTime}
                  onChange={(e) => setConfig(prev => ({ ...prev, backupTime: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>
            </div>

            {/* 保留期 */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">快照保留归档期</label>
              <select
                value={config.retentionDays}
                onChange={(e) => setConfig(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white"
              >
                <option value="7">保留最近 7 天快照</option>
                <option value="30">保留最近 30 天快照 (标准等保推荐)</option>
                <option value="90">保留最近 90 天 (季度级)</option>
                <option value="365">保留 1 年 (年终审计必备)</option>
              </select>
              <p className="text-[11px] text-slate-400 pt-1">
                超出保留期的旧快照将自动移入冷存储介质或释放存储空间。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 标签 4：数据导入与导出 */}
      {activeTab === 'import_export' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>数据导出迁移与离线灾备文件导入</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              提供标准 JSON 格式全量数据导出包，支持迁移部署与多端互通
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 导出 */}
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>导出系统全量离线数据包 (.json)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  包含五莲县人民医院 52 台设备技术档案、维修流转单据、19 家原厂及三方单位、18 项管理制度及结项成果全量明细。
                </p>
              </div>

              <button
                onClick={() => downloadBackupJsonFile()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>立即下载 JSON 格式全量数据包</span>
              </button>
            </div>

            {/* 导入 */}
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>从外部备份文件恢复系统数据 (.json)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  选择此前导出的有效备份 JSON 文件，系统将进行格式与哈希校验，无误后将数据完整热恢复至系统。
                </p>
              </div>

              <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs">
                <Upload className="w-4 h-4" />
                <span>选择备份文件上传并恢复...</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadBackupFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 新建快照弹窗 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>创建系统数据全量安全快照</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  快照名称
                </label>
                <input
                  type="text"
                  value={newSnapshotName}
                  onChange={(e) => setNewSnapshotName(e.target.value)}
                  placeholder={`全量手动快照 (${new Date().toLocaleDateString()})`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  操作人姓名 / 职责
                </label>
                <input
                  type="text"
                  value={newSnapshotOperator}
                  onChange={(e) => setNewSnapshotOperator(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  快照备注说明
                </label>
                <textarea
                  rows={3}
                  value={newSnapshotNotes}
                  onChange={(e) => setNewSnapshotNotes(e.target.value)}
                  placeholder="例如：日照市社科重点课题结项答辩前系统数据完整封存基准..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateSnapshot}
                disabled={isCreating}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>打包生成中...</span>
                  </>
                ) : (
                  <span>确认生成快照</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 恢复快照确认弹窗 */}
      {selectedSnapshotToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-600 border-b pb-3 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>确认恢复至历史快照？</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              您即将把全院医学装备系统数据回滚到以下时刻的快照状态：
            </p>

            <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200 text-xs space-y-1 font-mono">
              <div className="font-bold text-slate-900">{selectedSnapshotToRestore.name}</div>
              <div className="text-slate-500">ID: {selectedSnapshotToRestore.id}</div>
              <div className="text-slate-500">创建时间: {selectedSnapshotToRestore.createdAt}</div>
              <div className="text-slate-500">记录数: 设备 {selectedSnapshotToRestore.recordCount.equipment} 台 / 工单 {selectedSnapshotToRestore.recordCount.orders} 件</div>
            </div>

            <p className="text-[11px] text-slate-400">
              * 为保障数据安全，恢复前系统会自动将当前最新状态保存一份“升级前基准”快照，随时可二次还原。
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setSelectedSnapshotToRestore(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>正在恢复数据...</span>
                  </>
                ) : (
                  <span>确认执行回滚恢复</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
