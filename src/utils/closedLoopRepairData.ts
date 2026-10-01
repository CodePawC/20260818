import { ClosedLoopRepairTask } from '../types/closedLoopRepairTypes';

export const INITIAL_CLOSED_LOOP_TASKS: ClosedLoopRepairTask[] = [
  {
    id: 'TASK-20260923-01',
    taskNo: 'CL-REP-20260923-01',
    equipmentId: 'EQ-2023-09855',
    equipmentName: '德国狼牌输尿管硬镜',
    equipmentModel: 'Richard Wolf 8703.534 (8/9.8Fr 430mm 12°)',
    equipmentSn: 'RW-20230415-87035',
    assetNo: 'ZC-2023-09855',
    internalNo: '7991105',
    equipmentCategory: '医用光学内窥镜与微创器械',
    purchasePrice: 168000,
    enableDate: '2023-04-20',
    equipmentLocation: '1号楼 综合楼 8F 麻醉手术科 OR-03手术室',
    
    // 1. 麻醉手术科提交的报修信息
    department: '麻醉手术科',
    reporterId: 'STAFF-267-02',
    reporterName: '黄晓彤',
    reporterRole: '麻醉手术科护士长',
    reporterPhone: '7991086 / 13863371086',
    faultTime: '2026-09-23 08:20',
    urgency: 'critical',
    faultType: '光学成像模糊 / 镜体起雾 / 柱镜微裂',
    faultDescription: '泌尿外科输尿管碎石术中发现视野严重模糊起雾，图像光轴反光，无法清晰分辨输尿管壁与结石边界，严重影响手术安全。紧急更换备用镜后，该镜需设备科现场紧急勘查鉴定。',
    clinicalImpact: '科室仅剩 1 条备用镜，无法支持全天高密度碎石台次排期，存在急诊微创停台风险，亟需加急核验处置。',
    evidencePhotos: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
    ],

    // 2. 状态
    stage: 'verified',
    status: '已核验(待起草返厂)',

    // 3. 设备科现场核验记录
    onsiteVerification: {
      verifiedBy: '崔伟',
      verifierRole: '医疗设备科科长 / 主管工程师',
      verifierPhone: '6802 / 13806336802',
      verifiedAt: '2026-09-23 09:30',
      snMatched: true,
      verifiedSn: 'RW-20230415-87035',
      equipmentLocationConfirmed: '1号楼 综合楼 8F 手术室无菌器械暂存区',
      opticalTransmittance: '41.5% (出厂合格基准 >= 95%，透光率严重衰减断崖)',
      airtightnessLeakage: '0.05MPa负压浸水检测持续测漏，蓝宝石保护窗口封胶开裂，负压压降 0.025MPa/min，内部腔体进水潮湿',
      lensGroupCondition: '第2组 HOPKINS 柱状光学棒镜表面出现贝壳状碎裂应力纹，光轴偏斜 3.8°',
      testToolsUsed: [
        '内窥镜光学同轴度投影仪',
        '0.05MPa负压水密封测漏仪',
        '冷光源光纤光通量计',
        '百倍目镜微观检查仪'
      ],
      conclusionType: 'factory_repair',
      conclusionTitle: '内部柱镜碎裂进水，院内无修复条件，判定必须原厂返厂大修',
      technicalAssessment: '经设备科工程师携带专业内窥镜检测仪现场实测：该镜蓝宝石前端封胶老化开裂进水受潮，第2组柱镜微裂。该硬镜为高精密激光烧结光学总成，院内及第三方均缺乏百级洁净无尘室、激光光轴干涉准直仪与HOPKINS原厂透镜耗材，强行拆解会导致整镜光通量彻底报废。原厂返厂更换物镜蓝宝石窗与第2组棒镜、重新注氮激光密封并提供12个月保修是唯一技术可行路径。',
      technicianSignature: '崔伟 (电子核验章)'
    },

    timeline: [
      {
        id: 'EVT-01',
        stage: '科室报修',
        title: '麻醉手术科提交紧急报修申请',
        actorName: '黄晓彤',
        actorRole: '麻醉手术科护士长',
        actorDept: '麻醉手术科',
        time: '2026-09-23 08:20',
        notes: '术中发现图像严重模糊起雾，拍摄并上传现场照片，标定为【紧急】工单，呼叫设备科工程师现场核验。',
        badgeColor: 'blue'
      },
      {
        id: 'EVT-02',
        stage: '任务生成',
        title: '系统自动生成闭环维修任务记录',
        actorName: '系统自动调度',
        actorRole: '医学装备云端中枢',
        actorDept: '设备调度中心',
        time: '2026-09-23 08:22',
        notes: '生成关联任务工单 CL-REP-20260923-01，关联资产卡片 ZC-2023-09855，推送提醒至设备科驻场工程师。',
        badgeColor: 'indigo'
      },
      {
        id: 'EVT-03',
        stage: '现场核验',
        title: '设备科工程师到达手术室完成现场技术核验',
        actorName: '崔伟',
        actorRole: '主管工程师 / 设备科科长',
        actorDept: '医疗设备科',
        time: '2026-09-23 09:30',
        notes: '现场实机测漏并进行光学同轴度检测，证实透光率仅41.5%，蓝宝石封胶开裂进水、第2组柱镜碎裂，出具返厂大修判定结论。',
        signatureUrl: '崔伟_verified',
        badgeColor: 'emerald'
      }
    ],

    createdAt: '2026-09-23 08:20',
    updatedAt: '2026-09-23 09:30'
  },
  {
    id: 'TASK-20260923-02',
    taskNo: 'CL-REP-20260923-02',
    equipmentId: 'EQ-2022-0418',
    equipmentName: '德国德尔格麻醉机 (Dräger Primus)',
    equipmentModel: 'Primus',
    equipmentSn: 'DRG-202203-9021',
    assetNo: 'ZC-2022-0418',
    internalNo: '7991102',
    equipmentCategory: '呼吸麻醉与重症生命支持类',
    purchasePrice: 420000,
    enableDate: '2022-05-18',
    equipmentLocation: '1号楼 综合楼 8F 麻醉手术科 OR-06手术室',
    
    // 麻醉手术科新发报修
    department: '麻醉手术科',
    reporterId: 'STAFF-267-02',
    reporterName: '黄晓彤',
    reporterRole: '麻醉手术科护士长',
    reporterPhone: '7991086 / 13863371086',
    faultTime: '2026-09-23 09:05',
    urgency: 'high',
    faultType: '流量传感器校准失败 / 潮气量监测漂移',
    faultDescription: '晨起开机自检时，流量传感器校准测试报错代码 Err-32，呼气潮气量与设定值偏差超过 25%，机械通气回路存在微量泄漏声。已停用该机并切换至墙式供氧。',
    clinicalImpact: 'OR-06 手术室本日排期 4 台全麻胃肠腹腔镜手术，急需设备科工程师现场核验排查。',
    evidencePhotos: [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80'
    ],

    stage: 'reported',
    status: '待现场核验',

    timeline: [
      {
        id: 'EVT-DRG-01',
        stage: '科室报修',
        title: '麻醉手术科提交麻醉机自检报警故障报修',
        actorName: '黄晓彤',
        actorRole: '麻醉手术科护士长',
        actorDept: '麻醉手术科',
        time: '2026-09-23 09:05',
        notes: '开机自检流量传感器校准报警，潮气量监控漂移，提交工单请求设备科工程师紧急入室核验。',
        badgeColor: 'blue'
      },
      {
        id: 'EVT-DRG-02',
        stage: '任务生成',
        title: '系统生成关联闭环工单并分发至设备科',
        actorName: '系统自动调度',
        actorRole: '医学装备云端中枢',
        actorDept: '设备调度中心',
        time: '2026-09-23 09:06',
        notes: '生成关联任务工单 CL-REP-20260923-02，已指派急救生命支持专业组工程师崔伟接收。',
        badgeColor: 'indigo'
      }
    ],

    createdAt: '2026-09-23 09:05',
    updatedAt: '2026-09-23 09:06'
  }
];

const STORAGE_KEY = 'hospital-closed-loop-repair-tasks';

export function getClosedLoopTasks(): ClosedLoopRepairTask[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load closed loop tasks from storage', err);
  }
  return INITIAL_CLOSED_LOOP_TASKS;
}

export function saveClosedLoopTasks(tasks: ClosedLoopRepairTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Failed to save closed loop tasks to storage', err);
  }
}
