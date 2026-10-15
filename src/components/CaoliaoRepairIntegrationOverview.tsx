import React, { useState, useEffect, useMemo } from 'react';
import { 
  QrCode, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  Bot, 
  Activity, 
  Building2, 
  Phone, 
  User, 
  FileText, 
  Layers, 
  Check, 
  ExternalLink, 
  Flame, 
  Stethoscope, 
  Video, 
  Image as ImageIcon,
  ChevronRight,
  Filter,
  Search,
  Eye,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { MedicalEquipment, AuthUser, ActiveTab } from '../types';

export interface CaoliaoLiveRepairItem {
  recordId: number;
  codeId: number;
  equipmentName: string;
  recordTime: string;
  recordNo: string;
  reporterName: string;
  reporterPhone: string;
  faultDescription: string;
  photoUrl?: string;
  videoUrl?: string;
  processStatus: string;
  createSource?: string;
}

export interface CaoliaoTriageAdvice {
  urgencyLevel: 'CRITICAL' | 'URGENT' | 'ROUTINE';
  urgencyLabel: string;
  slaMinutes: number;
  slaLabel: string;
  categoryTag: string;
  primaryRisk: string;
  clinicalAdvice: string;
  engineeringChecklist: string[];
  partsStagingAdvice: string;
  recommendedEngineerRole: string;
}

interface CaoliaoRepairIntegrationOverviewProps {
  currentUser?: AuthUser | null;
  equipmentList?: MedicalEquipment[];
  onViewEquipmentDetails?: (item: any, initialTab?: string) => void;
  onOpenAiDiagnose?: (device: MedicalEquipment) => void;
  onNavigateToTab?: (tab: ActiveTab) => void;
  onRepairSynced?: () => void;
}

// 智能医学工程分诊预处理规则生成器
export function generateCaoliaoTriageAdvice(
  repair: CaoliaoLiveRepairItem, 
  matchedEquip?: MedicalEquipment | null
): CaoliaoTriageAdvice {
  const text = `${repair.equipmentName} ${repair.faultDescription} ${matchedEquip?.name || ''} ${matchedEquip?.category || ''}`.toLowerCase();

  // 1. 生命支持与特级抢救机具 (呼吸、麻醉、除颤、ECMO、心肺复苏)
  if (text.includes('呼吸') || text.includes('麻醉') || text.includes('除颤') || text.includes('复苏') || text.includes('ecmo') || text.includes('起搏')) {
    return {
      urgencyLevel: 'CRITICAL',
      urgencyLabel: '🔴 一级特级预警 · 生命支持抢救机具',
      slaMinutes: 5,
      slaLabel: '5分钟内到场抢修',
      categoryTag: '急救与生命支持',
      primaryRisk: '直接关联患者氧合与循环生命指征维系，存在通气衰竭或恶性心律失常抢救受阻极高安全隐患。',
      clinicalAdvice: '立即停止使用故障机具！床旁立即启用备用简易人工呼吸气囊或推入科室备用机无缝接替；电话直通医工急救抢修专班。',
      engineeringChecklist: [
        '1. 进场首先检测中心供气/氧源减压阀输出压力 (需维持在 0.28~0.6 MPa 规定范围)',
        '2. 检查吸气/呼气活瓣膜片是否老化粘连、呼气流量传感器是否受水汽凝结污染',
        '3. 检查手控 APL 压力限制阀密封胶垫与机控/手控自动转换阀气密性',
        '4. 进入维护工程模式读取内部故障代码 (Error Log) 并运行系统气密性自检',
        '5. 联接标准模拟肺复测潮气量(Vt)、吸气峰压(Ppeak)与呼气末正压(PEEP)'
      ],
      partsStagingAdvice: '原厂呼气阀盒总成、超声流量传感器、APL限压阀、高压氧源减压软管',
      recommendedEngineerRole: '急救生命支持设备主管工程师 (应急抢修组)'
    };
  }

  // 2. 连续生命体征监护与电生理 (监护仪、心电、脑电)
  if (text.includes('监护') || text.includes('心电') || text.includes('脑电') || text.includes('导联') || text.includes('血氧') || text.includes('血压') || text.includes('触屏') || text.includes('屏幕')) {
    return {
      urgencyLevel: 'URGENT',
      urgencyLabel: '🟡 二级紧急预警 · 临床连续生命监护',
      slaMinutes: 15,
      slaLabel: '15分钟内响应',
      categoryTag: '生理监护与电生理',
      primaryRisk: '术中或病房患者心率、脉搏、血氧饱和度监测中断，可能遗漏生命指征突变。',
      clinicalAdvice: '若属触屏失灵，后置 USB 接口可临时插入备用飞梭旋钮或医用鼠标应急设置；若心电干扰，更换优质抗干扰电极片并重新脱脂。',
      engineeringChecklist: [
        '1. 检查电容/电阻触摸屏 FPC 排线是否受潮松动或金手指氧化接触不良',
        '2. 测量开关电源板输出 (+5V, +12V) 直流纹波，排查供电电压跌落导致触摸主控芯片死锁',
        '3. 检查 ECG 5/12 导联信号输入插座针脚完整性与屏蔽接地线阻抗 (<0.1Ω)',
        '4. 重新进入工程工厂菜单执行触摸屏五点十字坐标校准 (Touch Calibration)',
        '5. 检查机内风扇防尘网积灰与散热通道温度传感器状态'
      ],
      partsStagingAdvice: '12.1/15寸触摸外屏玻璃总成、5导联心电主缆、一体化抗干扰血氧探头、内部软排线',
      recommendedEngineerRole: '诊察监护设备专业组工程师'
    };
  }

  // 3. 微量药物输注与精准给药 (注射泵、输液泵、营养泵)
  if (text.includes('泵') || text.includes('注射') || text.includes('输液') || text.includes('排空') || text.includes('滴数') || text.includes('走速')) {
    return {
      urgencyLevel: 'URGENT',
      urgencyLabel: '🟡 二级紧急预警 · 精准药物输注机具',
      slaMinutes: 20,
      slaLabel: '20分钟内响应',
      categoryTag: '微量输注与护理',
      primaryRisk: '血管活性药、高危静脉化疗药或麻醉镇痛药给药中断或流速不准，易引起患者循环剧烈波动。',
      clinicalAdvice: '立即停止该泵给药，使用科室备用微量泵接续输注；标记设备并保留当前注射器规格与设置参数待检。',
      engineeringChecklist: [
        '1. 检查注射器规格检测霍尔传感器滑块位置，排查滑块脱轨导致的“假排空”误报警',
        '2. 检查推注滑块传动丝杆螺母有无卡滞、清洗滑轨光轴并加注特种医用阻尼油',
        '3. 检查推头压力阻塞传感器应变片弹性与零点漂移参数',
        '4. 使用输液泵检测仪做 1ml/h, 5ml/h, 20ml/h 标准流量精密度验证 (误差需≤±2%)',
        '5. 检查内置动力锂电池充放电循环衰减与交流适配器充电回路'
      ],
      partsStagingAdvice: '推注头光电传感器组件、传动步进电机齿轮箱、压力阻塞传感器总成',
      recommendedEngineerRole: '常规护理与输注机具工程师'
    };
  }

  // 4. 血液透析与体外净化 (血液透析、CRRT、水处理)
  if (text.includes('透析') || text.includes('血液净化') || text.includes('crrt') || text.includes('水路') || text.includes('消毒') || text.includes('电导')) {
    return {
      urgencyLevel: 'URGENT',
      urgencyLabel: '🟡 二级紧急预警 · 血液净化与透析系统',
      slaMinutes: 30,
      slaLabel: '30分钟内响应',
      categoryTag: '血液净化透析',
      primaryRisk: '水路错误或电导率自检超标导致透析排班受阻，如酸碱残留可能造成患者溶血或发热反应。',
      clinicalAdvice: '暂停安排患者上机，悬挂【停机检修】标识；消毒报警切勿强行切断总电源，须等待工程师指导余液冲洗。',
      engineeringChecklist: [
        '1. 检查反渗透水进水减压阀压力 (0.15~0.25 MPa) 及滤芯进出水压差',
        '2. 检查各路比例电磁阀 (V24/V34/V43) 结晶卡塞情况，测量线圈直流阻抗',
        '3. 使用标准校准电导液清洁并标定 A/B 透析液温度补偿电导率池',
        '4. 检查平衡腔除气室负压泵压力传感器读数与超滤除水称重模块精度',
        '5. 运行完整水路冲洗程序，使用余氯与化学残留试纸做出口水纯度定性检测'
      ],
      partsStagingAdvice: '原厂进水比例电磁阀、平衡腔密封隔膜、水路减压阀过滤网、管路O型圈包',
      recommendedEngineerRole: '血液净化专业高级维保工程师'
    };
  }

  // 5. 大型医学影像与超声放射 (超声、DR、CT、内窥镜)
  if (text.includes('超声') || text.includes('探头') || text.includes('影像') || text.includes('dr') || text.includes('ct') || text.includes('内窥') || text.includes('胃镜') || text.includes('肠镜')) {
    return {
      urgencyLevel: 'URGENT',
      urgencyLabel: '🟡 二级紧急预警 · 核心影像诊断设备',
      slaMinutes: 30,
      slaLabel: '30分钟内响应',
      categoryTag: '医学影像与内窥镜',
      primaryRisk: '影像伪影盲区或高压电路短路，导致临床误诊漏诊或损伤高价值进口探头与球管。',
      clinicalAdvice: '探头声头若有物理撞击裂纹严禁接触人体！断开高压电源；调配隔壁诊室同规格备用探头。',
      engineeringChecklist: [
        '1. 断开探头插座，使用高纯度无水乙醇清洁探头多触点插头金手指氧化积尘',
        '2. 检查探头声头透镜硅胶层脱胶起泡及压电晶片声场盲区',
        '3. 检查前端波束形成处理板 (Front-End Beamformer) 低压滤波稳压电源',
        '4. 调出系统灰阶测试图 (Gray Scale Pattern) 测试全通道信号增益一致性',
        '5. 进行探头高频患者漏电流测试，确保符合 GB 9706.1 医用电气安全标准'
      ],
      partsStagingAdvice: '同规格备用腹部/浅表探头、探头插座锁紧扣件、低噪声前端直流稳压模块',
      recommendedEngineerRole: '医学影像与超声专职工程师'
    };
  }

  // 6. 通用临床辅助机具与常规故障 (打印机、台车、床、普通机械等)
  return {
    urgencyLevel: 'ROUTINE',
    urgencyLabel: '🟢 三级常规处理 · 临床常规辅助机具',
    slaMinutes: 60,
    slaLabel: '60分钟内处理',
    categoryTag: '通用辅助机具',
    primaryRisk: '局部配件机械卡死或外围耗材安装异常，暂不直接危及生命安全。',
    clinicalAdvice: '如有备用辅机请先行替换使用；请记录故障提示代码，保持设备现场原状以便工程师进场复测。',
    engineeringChecklist: [
      '1. 核对设备铭牌出厂编号 (SN) 与草料二维码活码数据库绑定信息的一致性',
      '2. 现场复查故障复现触发条件，排查外接电源线接插牢固度与插座保险管',
      '3. 测试机身金属外壳绝缘电阻与接地连续性，清洁机身散热风道防尘网',
      '4. 更换损耗老化机械零部件并做全功能负荷运行测试',
      '5. 记录维修配件消耗与维修工时，由临床责任医护现场签字验收确认'
    ],
    partsStagingAdvice: '通用机械传动易损件、电源保险管、标准仪器工具箱',
    recommendedEngineerRole: '综合维修工班责任工程师'
  };
}

export const CaoliaoRepairIntegrationOverview: React.FC<CaoliaoRepairIntegrationOverviewProps> = ({
  currentUser,
  equipmentList = [],
  onViewEquipmentDetails,
  onOpenAiDiagnose,
  onNavigateToTab,
  onRepairSynced
}) => {
  const [repairs, setRepairs] = useState<CaoliaoLiveRepairItem[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'pending' | 'synced'>('all');
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [syncedOrderIds, setSyncedOrderIds] = useState<Set<number>>(new Set());
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. 获取最新草料实时报修记录与统计
  const fetchCaoliaoData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // 获取报修记录
      const res = await fetch('/api/caoliao/repairs?pageSize=10');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRepairs(json.data);
        if (json.data.length > 0 && expandedRecordId === null) {
          // 默认展开首条
          setExpandedRecordId(json.data[0].recordId);
        }
      }

      // 获取统计大盘
      const statRes = await fetch('/api/caoliao/stats');
      const statJson = await statRes.json();
      if (statJson.success && statJson.data) {
        setStats(statJson.data);
      }
    } catch (err: any) {
      console.error('Failed to load caoliao repairs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCaoliaoData();
    // 30秒定时轮询最新现场扫码报修
    const timer = setInterval(() => {
      fetchCaoliaoData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 匹配院内技术台账
  const getMatchedEquipment = (codeId: number | string, eqName?: string): MedicalEquipment | null => {
    if (!equipmentList || equipmentList.length === 0) return null;
    const cStr = String(codeId).trim();
    // 1. 按 codeId 精确匹配
    let matched = equipmentList.find(e => e.codeId && String(e.codeId).trim() === cStr);
    if (matched) return matched;

    // 2. 按设备 ID 匹配
    matched = equipmentList.find(e => String(e.id) === cStr);
    if (matched) return matched;

    // 3. 按名称或模糊匹配
    if (eqName) {
      const cleanName = eqName.replace(/^[^-]+-/, '').trim();
      matched = equipmentList.find(e => e.name.includes(cleanName) || cleanName.includes(e.name));
    }
    return matched || null;
  };

  // 2. 一键转为院内正式维修工单
  const handleSyncToWorkOrder = async (item: CaoliaoLiveRepairItem) => {
    setSyncingId(item.recordId);
    try {
      const matched = getMatchedEquipment(item.codeId, item.equipmentName);
      const res = await fetch('/api/caoliao/sync-repair-to-workorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caoliaoRepair: item,
          targetEquipmentId: matched?.id,
          engineerName: currentUser?.name || '医工值班工程师'
        })
      });
      const json = await res.json();
      if (json.success) {
        setSyncedOrderIds(prev => new Set(prev).add(item.recordId));
        showToast(`已成功将【${item.equipmentName}】草料报修直转为院内正式维修工单！`, 'success');

        // 同步直接写入院内调度大厅工单池
        try {
          const raw = localStorage.getItem('hospital-medtech-workorders');
          const currentOrders = raw ? JSON.parse(raw) : [];
          const woId = `WO-CL-${item.recordNo || item.recordId}`;
          if (!currentOrders.some((o: any) => o.id === woId)) {
            const matchedEquip = getMatchedEquipment(item.codeId, item.equipmentName);
            const newWO = {
              id: woId,
              equipmentId: matchedEquip?.id || `EQ-CL-${item.codeId}`,
              equipmentName: matchedEquip?.name || item.equipmentName,
              equipmentModel: matchedEquip?.model || '在册机具',
              equipmentSn: matchedEquip?.sn || 'SN-CAOLIAO',
              internalNo: matchedEquip?.internalNo || `CL-${item.codeId}`,
              category: matchedEquip?.category || '草料在册机具',
              department: matchedEquip?.department || '临床科室',
              location: `${matchedEquip?.department || '临床科室'} · 现场使用区`,
              reporterName: item.reporterName || '临床医护',
              reporterPhone: item.reporterPhone || '',
              reportTime: item.recordTime ? String(item.recordTime).replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
              priority: 'P2_URGENT',
              workOrderType: 'emergency_breakdown',
              faultDescription: `【草料扫码直报 单号 ${item.recordNo || item.recordId}】${item.faultDescription}`,
              status: 'pending_dispatch',
              biomedicalGroup: '急救生命支持技术组',
              source: 'caoliao',
              caoliaoRecordId: item.recordId,
              caoliaoRecordNo: item.recordNo,
              caoliaoCodeId: String(item.codeId),
              photoUrl: item.photoUrl,
              videoUrl: item.videoUrl,
              partsReplaced: [],
              totalRepairCost: 0,
              totalDowntimeHours: 0.5,
              slaResponseLimitMinutes: 30,
              slaRepairLimitHours: 4,
              isSlaResponseMet: false,
              isSlaRepairMet: false
            };
            currentOrders.unshift(newWO);
            localStorage.setItem('hospital-medtech-workorders', JSON.stringify(currentOrders));
            window.dispatchEvent(new CustomEvent('work_orders_updated'));
          }
        } catch (e) {
          console.warn('Sync to local workorders storage warning:', e);
        }

        if (onRepairSynced) onRepairSynced();
      } else {
        showToast(json.error || '工单转换失败', 'error');
      }
    } catch (e: any) {
      showToast('网络异常，转换工单失败', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  // 3. 计算已处理与分级统计
  const enrichedRepairs = useMemo(() => {
    return repairs.map(r => {
      const matched = getMatchedEquipment(r.codeId, r.equipmentName);
      const advice = generateCaoliaoTriageAdvice(r, matched);
      const isSynced = syncedOrderIds.has(r.recordId) || r.processStatus === '已完成' || r.processStatus === '已受理';
      return {
        ...r,
        matchedEquipment: matched,
        advice,
        isSynced
      };
    });
  }, [repairs, equipmentList, syncedOrderIds]);

  // 过滤
  const filteredList = useMemo(() => {
    return enrichedRepairs.filter(item => {
      // 关键字搜索
      if (searchKeyword.trim()) {
        const q = searchKeyword.trim().toLowerCase();
        const match = 
          item.equipmentName.toLowerCase().includes(q) ||
          item.faultDescription.toLowerCase().includes(q) ||
          item.recordNo.toLowerCase().includes(q) ||
          item.reporterName.toLowerCase().includes(q) ||
          String(item.codeId).includes(q);
        if (!match) return false;
      }

      // Tab 过滤
      if (activeFilter === 'critical') {
        return item.advice.urgencyLevel === 'CRITICAL';
      }
      if (activeFilter === 'pending') {
        return !item.isSynced;
      }
      if (activeFilter === 'synced') {
        return item.isSynced;
      }
      return true;
    });
  }, [enrichedRepairs, activeFilter, searchKeyword]);

  const criticalCount = enrichedRepairs.filter(r => r.advice.urgencyLevel === 'CRITICAL').length;
  const pendingCount = enrichedRepairs.filter(r => !r.isSynced).length;
  const totalCount = enrichedRepairs.length;

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-xl border border-teal-500/30 shadow-md overflow-hidden transition-all duration-300">
      
      {/* Toast 提示浮窗 */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 ${
          toastMessage.type === 'success' ? 'bg-emerald-500/90 text-white border-emerald-400' :
          toastMessage.type === 'error' ? 'bg-rose-500/90 text-white border-rose-400' :
          'bg-slate-800 text-white border-slate-700'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <AlertTriangle className="w-4 h-4 text-rose-200" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 顶部标题与监控状态条 Header */}
      <div className="p-3.5 sm:p-4 bg-slate-950/80 border-b border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0 border border-teal-400/40">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>草料二维码维保集成概览</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>现场扫码实时接入直通</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-2xs font-mono bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
                阿里云 RDS 生产库 · 1602个活码
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 truncate">
              即时汇聚全院现场草料扫码报修单，精准研判生命支持与急救风险，智能生成医工预处理分诊处置方案
            </p>
          </div>
        </div>

        {/* 右侧统计芯片与操作按钮 */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* 核心指标统计芯片 */}
          <div className="flex items-center gap-1.5 text-2xs font-semibold bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              最近接入: <strong className="text-white font-mono">{totalCount}</strong>
            </span>
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>特级预警: <strong className="font-mono">{criticalCount}</strong></span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              待响应: <strong className="font-mono">{pendingCount}</strong>
            </span>
          </div>

          {/* 刷新按钮 */}
          <button
            type="button"
            onClick={() => fetchCaoliaoData(false)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title="刷新获取最新草料现场报修记录"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
          </button>

          {/* 进入系统草料接口联动控制台与调度大厅 */}
          {onNavigateToTab && (
            <>
              <button
                type="button"
                onClick={() => onNavigateToTab('dispatch')}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs border border-indigo-500/50"
                title="进入医工闭环调度大厅进行派工流转"
              >
                <span>调度大厅</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTab('caoliao_integration')}
                className="px-2.5 py-1.5 rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-2xs border border-teal-500/50"
                title="打开完整草料二维码报修数据库联动接口控制台"
              >
                <span>接口拓扑</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </>
          )}

          {/* 折叠/展开控制 */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            title={isCollapsed ? '展开集成概览' : '折叠概览'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 展开后的主体内容区 */}
      {!isCollapsed && (
        <div className="p-3.5 sm:p-4 space-y-3.5 animate-in fade-in duration-200">
          
          {/* 过滤切换 Bar & 搜索 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-teal-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                全部实时报修 ({enrichedRepairs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('critical')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'critical'
                    ? 'bg-rose-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-800/80 text-rose-300 hover:bg-rose-950/60'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>特级与高危 ({criticalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'pending'
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-800/80 text-amber-300 hover:bg-amber-950/60'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>待接单响应 ({pendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('synced')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'synced'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-slate-800/80 text-emerald-300 hover:bg-emerald-950/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>已联动医院工单 ({enrichedRepairs.filter(r => r.isSynced).length})</span>
              </button>
            </div>

            {/* 快速搜索框 */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索单号/设备/故障/报修人..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          {/* 实时工单列表与预处理卡片 */}
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400 mb-2" />
              <p className="text-xs">正在连接草料 RDS 数据库获取最新扫码报修履历...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
              <p className="text-xs font-semibold text-slate-300">暂无符合条件的草料现场报修记录</p>
              <p className="text-2xs text-slate-500 mt-0.5">全院设备运行平稳，临床扫码报修已全量接单或筛选无结果。</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => {
                const isExpanded = expandedRecordId === item.recordId;
                const advice = item.advice;
                const matched = item.matchedEquipment;

                return (
                  <div 
                    key={item.recordId}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                      advice.urgencyLevel === 'CRITICAL'
                        ? 'bg-slate-950/90 border-rose-500/40 hover:border-rose-400'
                        : advice.urgencyLevel === 'URGENT'
                        ? 'bg-slate-950/85 border-amber-500/30 hover:border-amber-400/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-teal-500/40'
                    }`}
                  >
                    {/* 卡片头部 summary (点击可展开/收起预处理建议) */}
                    <div 
                      onClick={() => setExpandedRecordId(isExpanded ? null : item.recordId)}
                      className="p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 cursor-pointer select-none hover:bg-white/[0.02]"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {/* 状态图标 */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          advice.urgencyLevel === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : advice.urgencyLevel === 'URGENT'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                        }`}>
                          {advice.urgencyLevel === 'CRITICAL' ? (
                            <Flame className="w-4 h-4 animate-pulse" />
                          ) : advice.urgencyLevel === 'URGENT' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Wrench className="w-4 h-4" />
                          )}
                        </div>

                        {/* 设备与单号信息 */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                              {item.equipmentName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-teal-300 border border-teal-500/30">
                              草料单号: {item.recordNo}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                              code_id: {item.codeId}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              advice.urgencyLevel === 'CRITICAL'
                                ? 'bg-rose-500 text-white'
                                : advice.urgencyLevel === 'URGENT'
                                ? 'bg-amber-500 text-slate-950 font-extrabold'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {advice.urgencyLabel.split(' · ')[0]}
                            </span>
                          </div>

                          {/* 故障简述与报修人 */}
                          <div className="text-xs text-slate-300 mt-1 flex items-center gap-2.5 flex-wrap">
                            <span className="text-rose-200 font-medium">
                              故障表现: <strong className="text-white">{item.faultDescription}</strong>
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="flex items-center gap-1 text-slate-400 text-2xs">
                              <User className="w-3 h-3 text-slate-500" />
                              <span>{item.reporterName}</span>
                              {item.reporterPhone && (
                                <span className="font-mono text-slate-400">({item.reporterPhone})</span>
                              )}
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="flex items-center gap-1 text-slate-400 text-2xs">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{item.recordTime}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 右侧流转状态 & 操作栏 */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                        {item.isSynced ? (
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>已转院内工单</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSyncToWorkOrder(item)}
                            disabled={syncingId === item.recordId}
                            className="px-2.5 py-1 rounded-md text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white transition flex items-center gap-1 cursor-pointer shadow-2xs border border-teal-400/40"
                            title="将草料扫码报修直接转换为医院工单并分配责任工程师"
                          >
                            {syncingId === item.recordId ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3 text-amber-300" />
                            )}
                            <span>一键转院内工单</span>
                          </button>
                        )}

                        {/* 展开/收起箭头 */}
                        <button
                          type="button"
                          onClick={() => setExpandedRecordId(isExpanded ? null : item.recordId)}
                          className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 展开后：智能医学工程预处理建议与技术台账联动面板 */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/80 space-y-3.5 animate-in slide-in-from-top-1 duration-150">
                        
                        {/* 1. 预处理研判与核心建议 (Triage & Clinical Recommendations) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          
                          {/* 左列 (2/3): 临床应急措施与现场排查要点 */}
                          <div className="lg:col-span-2 space-y-3">
                            
                            {/* 临床应急即刻响应 */}
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-teal-300 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                                  <span>临床科室应急预处理建议 (即刻应对)</span>
                                </span>
                                <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                  SLA要求: {advice.slaLabel}
                                </span>
                              </div>
                              <p className="text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-2 rounded border border-slate-800">
                                {advice.clinicalAdvice}
                              </p>
                              <div className="text-2xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                                <span>安全风险研判: {advice.primaryRisk}</span>
                              </div>
                            </div>

                            {/* 医工现场进场排查 5 步要点 */}
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-indigo-300 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>医工现场排查要点 (标准化进场排查)</span>
                                </span>
                                <span className="text-2xs font-normal text-slate-400">
                                  建议专业组: <strong className="text-slate-200">{advice.recommendedEngineerRole}</strong>
                                </span>
                              </div>
                              <ul className="space-y-1 text-slate-300 text-2xs pl-1">
                                {advice.engineeringChecklist.map((step, idx) => (
                                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1 shrink-0" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* 右列 (1/3): 关联院内技术档案与备品备件准备 */}
                          <div className="space-y-3">
                            {/* 备件调拨预警 */}
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                                <Layers className="w-3.5 h-3.5 text-amber-400" />
                                <span>建议预备零配件与工具</span>
                              </div>
                              <p className="text-slate-300 text-2xs leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800 font-mono">
                                {advice.partsStagingAdvice}
                              </p>
                            </div>

                            {/* 关联的院内台账卡片 */}
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                              <div className="flex items-center justify-between text-slate-300 font-bold">
                                <span>关联院内技术台账档案</span>
                                {matched ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    ✓ 已绑定
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    台账自动匹配
                                  </span>
                                )}
                              </div>

                              {matched ? (
                                <div className="space-y-1.5 text-2xs text-slate-300">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">设备编号:</span>
                                    <span className="font-mono text-white">{matched.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">规格型号:</span>
                                    <span className="text-slate-200">{matched.model || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">使用科室:</span>
                                    <span className="text-slate-200">{matched.department}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">当前状态:</span>
                                    <span className={`font-semibold ${
                                      matched.status === '正常运行' ? 'text-emerald-400' : 'text-amber-400'
                                    }`}>
                                      {matched.status}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-2xs text-slate-400">
                                  该草料活码 (code_id: {item.codeId}) 暂未在本地设备台账匹配到唯一编码，转为工单时将自动建卡。
                                </p>
                              )}

                              {/* 操作按钮组 */}
                              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                                {matched && onViewEquipmentDetails && (
                                  <button
                                    type="button"
                                    onClick={() => onViewEquipmentDetails(matched, 'timeline')}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-700"
                                  >
                                    <Activity className="w-3 h-3" />
                                    <span>生命周期时间轴</span>
                                  </button>
                                )}

                                {matched && onOpenAiDiagnose && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenAiDiagnose(matched)}
                                    className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer border border-indigo-700/50"
                                    title="将草料故障表现直接发送给 Gemini 医工专家进行深层排故推演"
                                  >
                                    <Bot className="w-3 h-3 text-indigo-400" />
                                    <span>AI 深度排故</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 现场拍摄照片或视频凭证 (如果有) */}
                        {(item.photoUrl || item.videoUrl) && (
                          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-3 text-xs">
                            <span className="text-slate-400 text-2xs font-semibold flex items-center gap-1">
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>报修现场媒体证据:</span>
                            </span>
                            {item.photoUrl && (
                              <a
                                href={item.photoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 hover:text-white flex items-center gap-1 text-2xs border border-slate-700"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>现场故障照片</span>
                              </a>
                            )}
                            {item.videoUrl && (
                              <a
                                href={item.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 hover:text-white flex items-center gap-1 text-2xs border border-slate-700"
                              >
                                <Video className="w-3 h-3" />
                                <span>现场录制短视频</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
