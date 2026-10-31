import React, { useState, useMemo, useEffect } from 'react';
import { AuthUser, MedicalEquipment } from '../../types';
import { 
  DrgGroupMaster, 
  DrgCaseAuditRecord, 
  DedicatedEquipmentAuditSummary, 
  DrgAuditFilterState,
  DrgWarningAlert
} from '../../types/drgTypes';
import { 
  DEFAULT_DRG_GROUPS, 
  INITIAL_DRG_AUDIT_CASES, 
  getStoredDrgCases, 
  saveStoredDrgCases, 
  resetStoredDrgCases,
  calculateEquipmentAuditSummaries, 
  calculateDrgAuditKpis,
  detectDrgEquipmentWarningAlerts,
  saveHandledAlertRecord
} from '../../utils/drgAuditData';
import { isHeadNurse, isDepartmentRestricted, getUserDepartment } from '../../utils/authUtils';
import { DrgAuditKpiStrip } from './DrgAuditKpiStrip';
import { DrgAuditFilterBar } from './DrgAuditFilterBar';
import { DrgAuditCaseTable } from './DrgAuditCaseTable';
import { DrgDedicatedEquipmentTable } from './DrgDedicatedEquipmentTable';
import { DrgAuditDrillDownDrawer } from './DrgAuditDrillDownDrawer';
import { DrgSimulationModal } from './DrgSimulationModal';
import { DrgWarningNotificationBanner } from './DrgWarningNotificationBanner';
import { DrgWarningDrillDownModal } from './DrgWarningDrillDownModal';

interface DrgCostAuditViewProps {
  currentUser?: AuthUser;
  equipmentList?: MedicalEquipment[];
  onNavigateToLedger?: (equipmentId?: string) => void;
  onNavigateToRoi?: () => void;
}

export const DrgCostAuditView: React.FC<DrgCostAuditViewProps> = ({
  currentUser,
  equipmentList,
  onNavigateToLedger,
  onNavigateToRoi
}) => {
  const isRestrictedDept = isHeadNurse(currentUser) || isDepartmentRestricted(currentUser);
  const userDept = getUserDepartment(currentUser) || '';

  // 1. 全局病案数据状态（本地持久化）
  const [cases, setCases] = useState<DrgCaseAuditRecord[]>(() => {
    return getStoredDrgCases();
  });

  // 2. 筛选状态
  const [filter, setFilter] = useState<DrgAuditFilterState>({
    department: isRestrictedDept && userDept ? userDept : 'all',
    drgCodeOrKeyword: '',
    auditStatus: 'all',
    viewMode: 'drg_case_view',
    timePeriod: 'current_month',
    riskLevel: 'all'
  });

  // 3. 弹窗与抽屉控制
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DrgGroupMaster | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<DedicatedEquipmentAuditSummary | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  // 专机专耗红色/黄色预警穿透下钻弹窗
  const [drillDownAlert, setDrillDownAlert] = useState<DrgWarningAlert | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const handleOpenAlertDrillDown = (alert: DrgWarningAlert) => {
    setDrillDownAlert(alert);
    setIsAlertModalOpen(true);
  };

  // 当外部科室属性变化时同步初始科室
  useEffect(() => {
    if (isRestrictedDept && userDept) {
      setFilter(prev => ({ ...prev, department: userDept }));
    }
  }, [isRestrictedDept, userDept]);

  // 科室选项列表
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_DRG_GROUPS.forEach(g => set.add(g.departmentName));
    cases.forEach(c => set.add(c.departmentName));
    return Array.from(set);
  }, [cases]);

  // 筛选后的病案集合
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // 科室过滤
      if (filter.department !== 'all' && c.departmentName !== filter.department) {
        return false;
      }
      // 关键字搜索 (病组代码、名称、病案号、患者、设备号、耗材条码)
      if (filter.drgCodeOrKeyword.trim()) {
        const kw = filter.drgCodeOrKeyword.toLowerCase();
        const matches = 
          c.drgCode.toLowerCase().includes(kw) ||
          c.drgName.toLowerCase().includes(kw) ||
          c.caseId.toLowerCase().includes(kw) ||
          c.patientName.toLowerCase().includes(kw) ||
          c.equipmentInternalNo.toLowerCase().includes(kw) ||
          c.consumableBarcode.toLowerCase().includes(kw);
        if (!matches) return false;
      }
      // 钩稽状态过滤
      if (filter.auditStatus !== 'all' && c.auditStatus !== filter.auditStatus) {
        return false;
      }
      return true;
    });
  }, [cases, filter]);

  // 筛选后的DRG病组定义
  const filteredGroups = useMemo(() => {
    return DEFAULT_DRG_GROUPS.filter(g => {
      if (filter.department !== 'all' && g.departmentName !== filter.department) {
        return false;
      }
      if (filter.drgCodeOrKeyword.trim()) {
        const kw = filter.drgCodeOrKeyword.toLowerCase();
        const matches = 
          g.drgCode.toLowerCase().includes(kw) ||
          g.drgName.toLowerCase().includes(kw) ||
          g.departmentName.toLowerCase().includes(kw);
        if (!matches) return false;
      }
      return true;
    });
  }, [filter.department, filter.drgCodeOrKeyword]);

  // 计算专机汇总
  const equipmentSummaries = useMemo(() => {
    return calculateEquipmentAuditSummaries(filteredCases);
  }, [filteredCases]);

  // 计算全局KPI (基于筛选范围内的病案)
  const kpiMetrics = useMemo(() => {
    return calculateDrgAuditKpis(filteredCases);
  }, [filteredCases]);

  // 预警通知状态管理
  const [alertTick, setAlertTick] = useState(0);

  // 计算单机耗材超标与红黄预警列表
  const warningAlerts = useMemo(() => {
    return detectDrgEquipmentWarningAlerts(filteredCases, filteredGroups, equipmentSummaries);
  }, [filteredCases, filteredGroups, equipmentSummaries, alertTick]);

  // 从预警横幅下钻特定专机
  const handleDrillDownEquipmentByNo = (internalNo: string) => {
    const found = equipmentSummaries.find(e => e.internalNo === internalNo);
    if (found) {
      setSelectedEquipment(found);
      setSelectedGroup(null);
      setIsDrillDownOpen(true);
    }
  };

  // 处理预警闭环整改填报
  const handleHandleAlert = (alertId: string, remark: string) => {
    saveHandledAlertRecord(alertId, remark);
    setAlertTick(prev => prev + 1);
  };

  // 操作：重置数据
  const handleResetCases = () => {
    if (window.confirm('确定要重置DRG病组与专机专耗核算流水数据至初始状态吗？')) {
      const reset = resetStoredDrgCases();
      setCases(reset);
    }
  };

  // 操作：点击病组穿透
  const handleSelectGroup = (group: DrgGroupMaster) => {
    setSelectedGroup(group);
    setSelectedEquipment(null);
    setIsDrillDownOpen(true);
  };

  // 操作：点击专机穿透
  const handleSelectEquipment = (eq: DedicatedEquipmentAuditSummary) => {
    setSelectedEquipment(eq);
    setSelectedGroup(null);
    setIsDrillDownOpen(true);
  };

  // 操作：导出三甲质控审计报告
  const handleExportAuditReport = () => {
    setSelectedGroup(null);
    setSelectedEquipment(null);
    setIsDrillDownOpen(true);
  };

  // 操作：快捷只看异常
  const handleFilterAnomaly = () => {
    setFilter(prev => ({
      ...prev,
      auditStatus: prev.auditStatus === 'all' ? 'missing_consumable' : 'all'
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* 顶部标题区 */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>医保DRG病组成本与专机专耗钩稽核算工作台</span>
              <span className="text-xs font-normal text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                三甲公立医院国考标准 · 2026版
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              建立“DRG病组医保支付 - 专机开机工时折旧 - 条码级专用高值耗材出库”三位一体的全流程双向审计与成本效益监控体系。
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto text-xs">
            {onNavigateToRoi && (
              <button
                onClick={onNavigateToRoi}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg transition-colors"
              >
                跳转单机效益ROI
              </button>
            )}
            {onNavigateToLedger && (
              <button
                onClick={() => onNavigateToLedger()}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg transition-colors"
              >
                查看设备技术台账
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-4">
        {/* 1. 顶层国考三甲质控KPI卡片条 */}
        <DrgAuditKpiStrip
          metrics={kpiMetrics}
          onFilterAnomaly={handleFilterAnomaly}
        />

        {/* 1.5 专机耗材消耗异常红黄预警通知横幅 */}
        <DrgWarningNotificationBanner
          alerts={warningAlerts}
          onDrillDownEquipment={handleDrillDownEquipmentByNo}
          onDrillDownAlert={handleOpenAlertDrillDown}
          onHandleAlert={handleHandleAlert}
        />

        {/* 2. 筛选与专业操作栏 */}
        <DrgAuditFilterBar
          filter={filter}
          onFilterChange={setFilter}
          departmentOptions={departmentOptions}
          onOpenSimulation={() => setIsSimulationOpen(true)}
          onExportAuditReport={handleExportAuditReport}
          onResetCases={handleResetCases}
          isRestrictedDept={isRestrictedDept}
        />

        {/* 3. 主工作台表格视图 */}
        {filter.viewMode === 'drg_case_view' ? (
          <DrgAuditCaseTable
            groups={filteredGroups}
            cases={filteredCases}
            alerts={warningAlerts}
            onSelectGroup={handleSelectGroup}
            onDrillDownCase={() => {}}
            onDrillDownAlert={handleOpenAlertDrillDown}
          />
        ) : (
          <DrgDedicatedEquipmentTable
            summaries={equipmentSummaries}
            alerts={warningAlerts}
            onSelectEquipment={handleSelectEquipment}
            onDrillDownAlert={handleOpenAlertDrillDown}
          />
        )}
      </div>

      {/* 4. 穿透审计与条码流水抽屉 */}
      <DrgAuditDrillDownDrawer
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        selectedGroup={selectedGroup}
        selectedEquipment={selectedEquipment}
        cases={cases}
      />

      {/* 4.5 专机专耗红色/黄色预警详细费用构成与关联维保穿透下钻弹窗 */}
      <DrgWarningDrillDownModal
        isOpen={isAlertModalOpen}
        onClose={() => {
          setIsAlertModalOpen(false);
          setDrillDownAlert(null);
        }}
        alert={drillDownAlert}
        cases={cases}
        groups={filteredGroups}
        equipmentSummaries={equipmentSummaries}
        equipmentList={equipmentList}
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToRoi={onNavigateToRoi}
        onHandleAlert={handleHandleAlert}
      />

      {/* 5. 新设备引进DRG保本点测算模拟器 */}
      <DrgSimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        groups={DEFAULT_DRG_GROUPS}
      />
    </div>
  );
};
