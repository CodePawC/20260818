import { MedicalEquipment, StatusLog } from '../types';
import { loadEmergencyLoans, EmergencyLoanRecord } from './emergencyReserveData';

export type TrajectoryEventType = 
  | 'spatial_relocation'      // 物理空间迁徙 / 院区楼宇科室搬迁 / 在位纠偏
  | 'status_transition'       // 资产运行状态演更 (验收入库/在用完好/PM保养/故障报修/封存/报废)
  | 'emergency_loan'          // 急救设备应急借调 / 跨科周转 / 归还质检
  | 'factory_repair'          // 外协或原厂返厂物流流转
  | 'metrology_verification'  // 国家法定强检定标 / 周期校准送检
  | 'initial_commissioning';  // 初始验收投运与科室初装挂账

export interface TrajectoryEvent {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  equipmentSn: string;
  internalNo: string;
  department: string;
  eventType: TrajectoryEventType;
  eventTitle: string;
  timestamp: string; // YYYY-MM-DD HH:mm
  operator: string;
  operatorRole: string;
  
  // 空间与状态位移
  fromLocation?: string;
  toLocation?: string;
  fromDepartment?: string;
  toDepartment?: string;
  fromStatus?: string;
  toStatus?: string;

  // 凭证与存证
  voucherNo?: string; // 关联单号 e.g. "LOAN-20260819-001", "APP-2026-0818-001", "CQS-2026-WL09", "WO-20260901-01"
  voucherType?: string; // "借调凭单" | "报修工单" | "强检证书" | "流转审批" | "验收入库单"
  details: string;
  caSignatureHash?: string;
  isPaperlessArchived?: boolean;

  // 原生设备引用
  equipmentOriginal?: MedicalEquipment;
}

export interface SpatialMigrationStats {
  totalEvents: number;
  spatialRelocationsCount: number;
  statusTransitionsCount: number;
  emergencyLoansCount: number;
  factoryRepairsCount: number;
  metrologyCount: number;
  activeLoanOverstayCount: number;
  topMovingDepartments: { name: string; outCount: number; inCount: number }[];
  highMobilityEquipment: {
    id: string;
    name: string;
    model: string;
    department: string;
    totalMoves: number;
    lastMoveDate: string;
    currentLocation: string;
  }[];
  departmentFlowMatrix: {
    from: string;
    to: string;
    count: number;
    equipmentNames: string[];
  }[];
}

/**
 * 格式化哈希值作为模拟 CA 电子存证指纹
 */
function generateCaHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `CA-WLH-2026-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * 聚合全院所有设备的完整生命周期轨迹事件
 */
export function generateFullTrajectoryEvents(equipmentList: MedicalEquipment[]): TrajectoryEvent[] {
  const events: TrajectoryEvent[] = [];

  // 1. 读取应急借调记录
  const emergencyLoans = loadEmergencyLoans();

  equipmentList.forEach(eq => {
    const internalNo = eq.internalNo || `WLH-${eq.categoryNo || 'EQ'}-${eq.id.replace(/\D/g, '').slice(-4) || '1001'}`;
    const baseLoc = eq.location || eq.usageLocation || `${eq.building || '综合楼'}-${eq.floor || '1F'}-${eq.department}`;

    // 1. 初始验收与建档投运事件 (Initial Commissioning)
    const enableTime = eq.enableDate || eq.purchaseDate || '2023-01-15';
    events.push({
      id: `EVT-INIT-${eq.id}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentModel: eq.model || '标准型号',
      equipmentSn: eq.sn || 'SN-UNKNOWN',
      internalNo,
      department: eq.department,
      eventType: 'initial_commissioning',
      eventTitle: '临床技术验收合格并正式挂账投运',
      timestamp: `${enableTime.replace(/\//g, '-')} 09:30`,
      operator: eq.manager || '崔伟',
      operatorRole: '医学工程保障处工程师',
      fromLocation: '院外原厂送达 / 物流收货检验区',
      toLocation: baseLoc,
      fromDepartment: '医学装备验收中心',
      toDepartment: eq.department,
      fromStatus: '验收入库',
      toStatus: '正常运行',
      voucherNo: `RCV-${eq.id.replace(/\D/g, '').slice(-6) || '202301'}`,
      voucherType: '验收入库单',
      details: `设备由供应商【${eq.supplier || eq.manufacturer || '原厂授权代理'}】完成三方联合现场安装调试，电气安全GB 9706.1检测与临床操作培训合格，正式录入全院固定资产台账并交接科室。`,
      caSignatureHash: generateCaHash(`INIT-${eq.id}-${enableTime}`),
      isPaperlessArchived: true,
      equipmentOriginal: eq
    });

    // 2. 状态更迭日志 (Status Logs)
    if (Array.isArray(eq.statusLogs) && eq.statusLogs.length > 0) {
      eq.statusLogs.forEach(log => {
        let eventType: TrajectoryEventType = 'status_transition';
        let eventTitle = `设备状态调整: ${log.oldStatus} ➔ ${log.newStatus}`;

        if (log.reason.includes('移') || log.reason.includes('搬迁') || log.reason.includes('盘点')) {
          eventType = 'spatial_relocation';
          eventTitle = '临床空间物理挪移与在位纠偏';
        }

        events.push({
          id: `EVT-STATUS-${log.id}`,
          equipmentId: eq.id,
          equipmentName: eq.name,
          equipmentModel: eq.model || '标准型号',
          equipmentSn: eq.sn || 'SN-UNKNOWN',
          internalNo,
          department: eq.department,
          eventType,
          eventTitle,
          timestamp: log.timestamp.length === 10 ? `${log.timestamp} 14:20` : log.timestamp,
          operator: log.operator || '系统管理员',
          operatorRole: '设备运维经办人',
          fromLocation: baseLoc,
          toLocation: baseLoc,
          fromDepartment: eq.department,
          toDepartment: eq.department,
          fromStatus: log.oldStatus,
          toStatus: log.newStatus,
          voucherNo: `AUD-${log.id.slice(-6)}`,
          voucherType: '状态变动存证',
          details: log.reason || `临床科室运行状态发生演更（${log.oldStatus} 变更为 ${log.newStatus}）。`,
          caSignatureHash: generateCaHash(`STATUS-${log.id}`),
          isPaperlessArchived: true,
          equipmentOriginal: eq
        });
      });
    }

    // 3. 关联该设备的借调流水 (Emergency Loans)
    const relatedLoans = emergencyLoans.filter(l => l.equipmentId === eq.id || l.equipmentSn === eq.sn);
    relatedLoans.forEach(loan => {
      // 借出记录
      events.push({
        id: `EVT-LOAN-OUT-${loan.id}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        equipmentModel: eq.model || loan.equipmentModel,
        equipmentSn: eq.sn || loan.equipmentSn,
        internalNo,
        department: loan.borrowingDepartment,
        eventType: 'emergency_loan',
        eventTitle: `急救机具应急借调出库 (${loan.borrowingDepartment})`,
        timestamp: loan.borrowTime,
        operator: loan.borrowerName,
        operatorRole: `借入科室经办人 (${loan.borrowerPhone || '护士站'})`,
        fromLocation: loan.dispatchLocation || '医疗设备应急库',
        toLocation: `${loan.borrowingDepartment} 抢救重症监护区`,
        fromDepartment: '医疗设备应急库',
        toDepartment: loan.borrowingDepartment,
        fromStatus: '备用待命',
        toStatus: '应急在用',
        voucherNo: loan.id,
        voucherType: '应急借调单',
        details: `事由: ${loan.borrowReason}。随附附件清点: ${(loan.accessoriesIncluded || []).join('、') || '全套主机线缆'}，经出库自检合格出库。`,
        caSignatureHash: generateCaHash(`LOAN-OUT-${loan.id}`),
        isPaperlessArchived: true,
        equipmentOriginal: eq
      });

      // 若已归还，追加归还记录
      if (loan.status === 'returned' && loan.actualReturnTime) {
        events.push({
          id: `EVT-LOAN-RET-${loan.id}`,
          equipmentId: eq.id,
          equipmentName: eq.name,
          equipmentModel: eq.model || loan.equipmentModel,
          equipmentSn: eq.sn || loan.equipmentSn,
          internalNo,
          department: eq.department,
          eventType: 'emergency_loan',
          eventTitle: `急救机具借调期满归还核验入库`,
          timestamp: loan.actualReturnTime,
          operator: loan.returnInspector || loan.approver || '李强 (应急库管)',
          operatorRole: '医学工程处验收工程师',
          fromLocation: `${loan.borrowingDepartment} 抢救重症监护区`,
          toLocation: loan.dispatchLocation || '医疗设备应急库',
          fromDepartment: loan.borrowingDepartment,
          toDepartment: '医疗设备应急库',
          fromStatus: '应急在用',
          toStatus: loan.returnCondition === 'faulty' ? '故障待修' : '备用待命',
          voucherNo: loan.id,
          voucherType: '借调归还单',
          details: `设备归还验收结论: ${loan.returnCondition === 'intact' ? '完好无损，清洁消毒到位' : loan.returnCondition === 'needs_cleaning' ? '已安排终末擦拭消毒' : '发现功能轻微异常，已转报修'}。${loan.notes || ''}`,
          caSignatureHash: generateCaHash(`LOAN-RET-${loan.id}`),
          isPaperlessArchived: true,
          equipmentOriginal: eq
        });
      }
    });

    // 4. 维保与维修记录 (Repairs)
    if (Array.isArray(eq.repairRecords) && eq.repairRecords.length > 0) {
      eq.repairRecords.forEach(rep => {
        const isCompleted = rep.status === '已完成';
        const isFactory = rep.repairType?.includes('返厂') || rep.technician?.includes('原厂');

        events.push({
          id: `EVT-REP-${rep.id}`,
          equipmentId: eq.id,
          equipmentName: eq.name,
          equipmentModel: eq.model || '标准型号',
          equipmentSn: eq.sn || 'SN-UNKNOWN',
          internalNo,
          department: eq.department,
          eventType: isFactory ? 'factory_repair' : 'status_transition',
          eventTitle: isFactory ? `精密部件返厂维修与物流流转` : `现场工程维修处置 (${rep.repairType || '常规故障'})`,
          timestamp: rep.faultDate ? `${rep.faultDate} 11:00` : `${enableTime} 11:00`,
          operator: rep.technician || '临床维修工程师',
          operatorRole: isFactory ? '原厂签约驻场工程师' : '医学工程处维修工程师',
          fromLocation: baseLoc,
          toLocation: isFactory ? '原厂保税维修保税检测工厂 (上海/北京)' : baseLoc,
          fromDepartment: eq.department,
          toDepartment: isFactory ? '原厂精密检测中心' : eq.department,
          fromStatus: '故障待修',
          toStatus: isCompleted ? '正常运行' : '维修处理中',
          voucherNo: rep.recordNo || `REP-${rep.id.slice(-6)}`,
          voucherType: '维修服务工单',
          details: `故障现象: ${rep.faultDescription}。维修结果/方案: ${rep.resolution || '完成技术整修与配件更换'}。更换配件: ${rep.partsReplaced || '无消耗核心配件'}，费用: ¥${rep.cost || 0}。`,
          caSignatureHash: generateCaHash(`REP-${rep.id}`),
          isPaperlessArchived: true,
          equipmentOriginal: eq
        });
      });
    }

    // 5. 国家法定计量强检或周期校准记录 (Metrology)
    if (eq.calibration === 'Yes' && eq.lastCalibrationDate) {
      events.push({
        id: `EVT-METRO-${eq.id}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        equipmentModel: eq.model || '标准型号',
        equipmentSn: eq.sn || 'SN-UNKNOWN',
        internalNo,
        department: eq.department,
        eventType: 'metrology_verification',
        eventTitle: `国家法定计量检定/校准定标合格`,
        timestamp: `${eq.lastCalibrationDate} 15:30`,
        operator: eq.calibrationUnit || '山东省计量科学研究院',
        operatorRole: '法定计量授权检定员 (持证专家)',
        fromLocation: baseLoc,
        toLocation: baseLoc,
        fromDepartment: eq.department,
        toDepartment: eq.department,
        fromStatus: '强检定标中',
        toStatus: '正常运行',
        voucherNo: `CQS-2026-WLH-${eq.id.replace(/\D/g, '').slice(-4) || '8812'}`,
        voucherType: '国家计量检定证书',
        details: `受托检定机构【${eq.calibrationUnit || '法定计量机构'}】完成现场量值传递检定，依据 JJG 国家规程，各项示值误差与电气安全指标均合格，核发全国统一格式强检合格标签，有效周期至: ${eq.nextCalibrationDate || '2027-03-15'}。`,
        caSignatureHash: generateCaHash(`METRO-${eq.id}-${eq.lastCalibrationDate}`),
        isPaperlessArchived: true,
        equipmentOriginal: eq
      });
    }

    // 6. 丰富代表性高频流动设备的跨病区物理搬迁与巡检纠偏模拟数据
    if (['EMG-1001', 'EMG-1002', 'EMG-1003', 'EQ-2023-001', 'EQ-2023-003'].includes(eq.id)) {
      events.push({
        id: `EVT-MOVE-1-${eq.id}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        equipmentModel: eq.model || '标准型号',
        equipmentSn: eq.sn || 'SN-UNKNOWN',
        internalNo,
        department: eq.department,
        eventType: 'spatial_relocation',
        eventTitle: '全院急救绿色通道空间快速转运随行',
        timestamp: '2026-08-10 16:45',
        operator: '孙志强 (急救支持工程师)',
        operatorRole: '院内应急调配值班人',
        fromLocation: '中心院区 1号楼 1F 急诊抢救大厅',
        toLocation: '中心院区 2号楼 8F 麻醉手术科 手术3间',
        fromDepartment: '急诊医学科',
        toDepartment: '麻醉手术科',
        fromStatus: '正常运行',
        toStatus: '正常运行',
        voucherNo: `MIG-20260810-${eq.id.slice(-4)}`,
        voucherType: '院内转运记录',
        details: `配合急诊危重多发伤患者紧急行急诊介入手术，随车转运监测生命体征，术后设备就地在麻醉手术科留用待命，已完成移动PDA扫码在位纠偏。`,
        caSignatureHash: generateCaHash(`MOVE-1-${eq.id}`),
        isPaperlessArchived: true,
        equipmentOriginal: eq
      });
    }
  });

  // 按时间倒序排序 (最新事件在前)
  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * 汇总空间流转与变动统计数据
 */
export function calculateSpatialMigrationStats(equipmentList: MedicalEquipment[]): SpatialMigrationStats {
  const events = generateFullTrajectoryEvents(equipmentList);
  const emergencyLoans = loadEmergencyLoans();

  let spatialRelocationsCount = 0;
  let statusTransitionsCount = 0;
  let emergencyLoansCount = 0;
  let factoryRepairsCount = 0;
  let metrologyCount = 0;

  const deptOutMap: Record<string, number> = {};
  const deptInMap: Record<string, number> = {};
  const flowMatrixMap: Record<string, { count: number; eqNames: Set<string> }> = {};
  const equipmentMoveMap: Record<string, { eq: MedicalEquipment; count: number; lastDate: string; lastLoc: string }> = {};

  events.forEach(ev => {
    if (ev.eventType === 'spatial_relocation') spatialRelocationsCount++;
    else if (ev.eventType === 'status_transition') statusTransitionsCount++;
    else if (ev.eventType === 'emergency_loan') emergencyLoansCount++;
    else if (ev.eventType === 'factory_repair') factoryRepairsCount++;
    else if (ev.eventType === 'metrology_verification') metrologyCount++;

    // 统计科室流动
    if (ev.fromDepartment && ev.toDepartment && ev.fromDepartment !== ev.toDepartment) {
      deptOutMap[ev.fromDepartment] = (deptOutMap[ev.fromDepartment] || 0) + 1;
      deptInMap[ev.toDepartment] = (deptInMap[ev.toDepartment] || 0) + 1;

      const flowKey = `${ev.fromDepartment}➔${ev.toDepartment}`;
      if (!flowMatrixMap[flowKey]) {
        flowMatrixMap[flowKey] = { count: 0, eqNames: new Set() };
      }
      flowMatrixMap[flowKey].count += 1;
      flowMatrixMap[flowKey].eqNames.add(ev.equipmentName);
    }

    // 统计设备变动频次
    if (ev.equipmentOriginal) {
      const eqId = ev.equipmentId;
      if (!equipmentMoveMap[eqId]) {
        equipmentMoveMap[eqId] = {
          eq: ev.equipmentOriginal,
          count: 0,
          lastDate: ev.timestamp,
          lastLoc: ev.toLocation || ev.equipmentOriginal.location || '在册位置'
        };
      }
      equipmentMoveMap[eqId].count += 1;
      if (ev.timestamp > equipmentMoveMap[eqId].lastDate) {
        equipmentMoveMap[eqId].lastDate = ev.timestamp;
        equipmentMoveMap[eqId].lastLoc = ev.toLocation || equipmentMoveMap[eqId].lastLoc;
      }
    }
  });

  // 滞留超期预警统计 (借用超过 14 天尚未归还)
  const activeLoanOverstayCount = emergencyLoans.filter(l => {
    if (l.status !== 'borrowed' && (l.status as string) !== 'overdue') return false;
    const borrowDate = new Date(l.borrowTime.split(' ')[0]).getTime();
    const now = Date.now();
    const daysDiff = (now - borrowDate) / (1000 * 3600 * 24);
    return daysDiff > 14 || (l.status as string) === 'overdue';
  }).length;

  // 活跃流动科室列表
  const allDeptNames = Array.from(new Set([...Object.keys(deptOutMap), ...Object.keys(deptInMap)]));
  const topMovingDepartments = allDeptNames.map(name => ({
    name,
    outCount: deptOutMap[name] || 0,
    inCount: deptInMap[name] || 0
  })).sort((a, b) => (b.outCount + b.inCount) - (a.outCount + a.inCount)).slice(0, 8);

  // 高频流动机具
  const highMobilityEquipment = Object.entries(equipmentMoveMap)
    .map(([id, data]) => ({
      id,
      name: data.eq.name,
      model: data.eq.model || '标准型',
      department: data.eq.department,
      totalMoves: data.count,
      lastMoveDate: data.lastDate,
      currentLocation: data.lastLoc
    }))
    .sort((a, b) => b.totalMoves - a.totalMoves)
    .slice(0, 10);

  // 流向矩阵
  const departmentFlowMatrix = Object.entries(flowMatrixMap)
    .map(([key, data]) => {
      const [from, to] = key.split('➔');
      return {
        from,
        to,
        count: data.count,
        equipmentNames: Array.from(data.eqNames).slice(0, 3)
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    totalEvents: events.length,
    spatialRelocationsCount,
    statusTransitionsCount,
    emergencyLoansCount,
    factoryRepairsCount,
    metrologyCount,
    activeLoanOverstayCount,
    topMovingDepartments,
    highMobilityEquipment,
    departmentFlowMatrix
  };
}
