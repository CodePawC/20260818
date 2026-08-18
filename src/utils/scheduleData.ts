export interface WorkScheduleItem {
  id: string;
  title: string;
  category: '强检定标' | '预防性维护' | '故障抢修' | '科室巡检' | '质控抽检' | '例行工作';
  date: string; // YYYY-MM-DD
  timeRange: string; // e.g. "08:30 - 09:30"
  location: string; // e.g. "急救中心 抢救室"
  assignedStaff: string; // e.g. "崔工 (EMP-7001)"
  priority: 'urgent' | 'high' | 'normal';
  status: 'pending' | 'in_progress' | 'completed';
  relatedDeviceId?: string;
  relatedDeviceName?: string;
  relatedDeviceSn?: string;
  notes?: string;
}

export const INITIAL_SCHEDULE_ITEMS: WorkScheduleItem[] = [
  {
    id: 'SCH-20260817-001',
    title: 'ICU 重症呼吸机与生命体征监护仪晨间质控巡检',
    category: '科室巡检',
    date: '2026-08-17',
    timeRange: '08:30 - 09:30',
    location: '1号楼 7F 重症医学科(ICU)',
    assignedStaff: '张雪梅护士长 / 崔伟 (EMP-7001)',
    priority: 'high',
    status: 'in_progress',
    relatedDeviceId: 'DEV-0004',
    relatedDeviceName: '迈瑞 SV300 有创呼吸机',
    relatedDeviceSn: 'SV300-2022-8891',
    notes: '检查气源管路压力、自检传感器校准及备用电池充放电效能'
  },
  {
    id: 'SCH-20260817-002',
    title: '急诊科 抢救生命支持类设备交接班与除颤监护仪点检',
    category: '例行工作',
    date: '2026-08-17',
    timeRange: '08:00 - 08:30',
    location: '1号楼 1F 急诊科 抢救室',
    assignedStaff: '王护士长 (急诊科主管护师)',
    priority: 'high',
    status: 'completed',
    relatedDeviceId: '10176',
    relatedDeviceName: '双相波除颤起搏监护仪',
    relatedDeviceSn: 'D3-202209-441',
    notes: '完成交接班常规点检：除颤仪自检绿色指示灯正常，导联线完好，除颤膏及电极板备齐'
  },
  {
    id: 'SCH-20260817-003',
    title: '急诊科 便携式心肺复苏机电源故障现场排查与维修响应',
    category: '故障抢修',
    date: '2026-08-17',
    timeRange: '14:00 - 14:45',
    location: '1号楼 1F 急诊科 抢救室',
    assignedStaff: '崔伟 (EMP-7001) / 王护士长',
    priority: 'urgent',
    status: 'in_progress',
    relatedDeviceId: '10198',
    relatedDeviceName: '便携式电动心肺复苏机',
    relatedDeviceSn: 'CPR-202310-004',
    notes: '响应急诊科晨报：锂电池充不进电，排查电源插头触点与主板供电电路'
  },
  {
    id: 'SCH-20260817-004',
    title: '山东省计量科学研究院驻场：64排CT与DSA法定强检复核',
    category: '强检定标',
    date: '2026-08-17',
    timeRange: '10:00 - 11:45',
    location: '1号楼 -1F 医学影像中心 CT室',
    assignedStaff: '张明远 (EMP-7003)',
    priority: 'urgent',
    status: 'pending',
    relatedDeviceId: 'DEV-0001',
    relatedDeviceName: '联影 uCT 760 64排螺旋CT机',
    relatedDeviceSn: 'UI-CT760-2021-0988',
    notes: '依据 JJG 1026-2007 规范配合计量检定员测试高对比度分辨率与剂量指数 CTDIvol'
  },
  {
    id: 'SCH-20260817-005',
    title: '麻醉手术科 洁净手术间 高频电外科能量平台季度预防性维护 (PM)',
    category: '预防性维护',
    date: '2026-08-17',
    timeRange: '15:30 - 17:00',
    location: '1号楼 8F 麻醉手术科 第02手术间',
    assignedStaff: '赵秀兰护士长 / 美敦力原厂工程师',
    priority: 'normal',
    status: 'pending',
    relatedDeviceId: '10189',
    relatedDeviceName: '高频电外科能量平台 (电刀)',
    relatedDeviceSn: 'VALLEYLAB-8812',
    notes: '测试单极/双极功率输出精度、回路负极板监测系统(REM)报警及脚踏开关灵敏度'
  },
  {
    id: 'SCH-20260817-006',
    title: '急诊科 抢救转运呼吸机管路压力与备用氧气源例行测试',
    category: '科室巡检',
    date: '2026-08-17',
    timeRange: '16:30 - 17:15',
    location: '1号楼 1F 急诊科 留观病房',
    assignedStaff: '王护士长 / 孙志强 (EMP-7002)',
    priority: 'normal',
    status: 'pending',
    relatedDeviceId: '10196',
    relatedDeviceName: '电动涡轮急救转运呼吸机',
    relatedDeviceSn: 'SV300-202303-118',
    notes: '核实气源软管快插接口无漏气，备用锂电池续航充满 100%'
  },
  {
    id: 'SCH-20260817-007',
    title: '医学工程保障中心：全院三级公立医院绩效考核医疗设备完好率周例会',
    category: '例行工作',
    date: '2026-08-17',
    timeRange: '17:15 - 18:00',
    location: '门急诊医技楼 4F 医工保障中心会议室',
    assignedStaff: '孙志强 (EMP-7002) / 全体工程师',
    priority: 'normal',
    status: 'pending',
    notes: '通报近期急诊与ICU设备维修响应时长、强检申报执行进度及三季度备件领用预算'
  },
  {
    id: 'SCH-20260818-001',
    title: '检验科 全自动生化免疫流水线 试剂恒温模块温控复测',
    category: '质控抽检',
    date: '2026-08-18',
    timeRange: '09:00 - 10:30',
    location: '医技综合楼 2F 检验医学中心',
    assignedStaff: '张明远 (EMP-7003)',
    priority: 'normal',
    status: 'pending',
    relatedDeviceId: 'DEV-0005',
    relatedDeviceName: '罗氏 Cobas 8000 全自动生化免疫流水线',
    relatedDeviceSn: 'ROCHE-C8000-2023-4501',
    notes: '核验冷藏仓 2~8℃ 连续温湿度记录仪偏差及光度计零点漂移'
  },
  {
    id: 'SCH-20260819-001',
    title: '消毒供应中心(CSSD) 脉动真空高温高压压力蒸汽灭菌器特检定检',
    category: '强检定标',
    date: '2026-08-19',
    timeRange: '13:30 - 16:00',
    location: '供应楼 1F 消毒供应中心去污区',
    assignedStaff: '市特种设备检验研究院 / 崔伟',
    priority: 'high',
    status: 'pending',
    relatedDeviceId: 'DEV-0006',
    relatedDeviceName: '新华医疗 XG1.DW 脉动真空灭菌器',
    relatedDeviceSn: 'XH-DW-2021-9981',
    notes: '特种设备压力容器安全阀校验、压力表比对及生物指示物灭菌验证'
  },
  {
    id: 'SCH-20260820-001',
    title: '血液透析中心 透析水处理系统及透析机回路电导率巡检',
    category: '预防性维护',
    date: '2026-08-20',
    timeRange: '08:00 - 11:30',
    location: '内科楼 2F 血液净化中心',
    assignedStaff: '崔伟 (EMP-7001)',
    priority: 'high',
    status: 'pending',
    notes: '检测反渗透RO水产水水质、氯残留及透析液配比浓度校准'
  }
];

export const SCHEDULE_STORAGE_KEY = 'hospital_work_schedule_items_v2';

export function loadScheduleItems(): WorkScheduleItem[] {
  try {
    const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY) || localStorage.getItem('hospital_work_schedule_items_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seen = new Set<string>();
        return parsed.map((item: WorkScheduleItem, idx: number) => {
          let uniqueId = item.id;
          if (!uniqueId || seen.has(uniqueId)) {
            uniqueId = `SCH-${item.date?.replace(/-/g, '') || '20260817'}-${Date.now().toString().slice(-4)}-${idx + 1}`;
          }
          seen.add(uniqueId);
          return { ...item, id: uniqueId };
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load schedule items from storage:', err);
  }
  return INITIAL_SCHEDULE_ITEMS;
}

export function saveScheduleItems(items: WorkScheduleItem[]): void {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save schedule items to storage:', err);
  }
}
