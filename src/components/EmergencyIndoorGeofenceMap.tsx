import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  Search, 
  Filter, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Maximize2, 
  RefreshCw, 
  Send, 
  BellRing, 
  ExternalLink, 
  ArrowRight, 
  Building, 
  Building2, 
  Sparkles, 
  Navigation, 
  Crosshair, 
  QrCode, 
  Cpu, 
  Clock,
  Phone,
  Volume2
} from 'lucide-react';
import { MedicalEquipment, AuthUser } from '../types';
import { sendInstantPushNotification } from '../utils/mobileNotificationData';

interface EmergencyIndoorGeofenceMapProps {
  equipmentList: MedicalEquipment[];
  currentUser: AuthUser | null;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
  onOpenBorrowModal?: (device: MedicalEquipment) => void;
}

interface BeaconNode {
  id: string;
  equipmentId: string;
  equipmentName: string;
  model: string;
  sn: string;
  category: string;
  building: string;
  floor: string;
  room: string;
  x: number; // 百分比坐标 (0-100)
  y: number; // 百分比坐标 (0-100)
  batteryPercent: number;
  rssi: number; // 信号强度 dBm (-40 ~ -85)
  status: 'normal_in_place' | 'in_clinical_use' | 'low_battery' | 'geofence_breach';
  assignedDept: string;
  lastSeenSecondsAgo: number;
  isBreached?: boolean;
  breachReason?: string;
}

export const EmergencyIndoorGeofenceMap: React.FC<EmergencyIndoorGeofenceMapProps> = ({
  equipmentList,
  currentUser,
  onViewDeviceDetail,
  onOpenBorrowModal
}) => {
  // 当前选中的楼宇与楼层
  const [selectedBuilding, setSelectedBuilding] = useState<'surgical' | 'emergency' | 'tech_center'>('emergency');
  const [selectedFloor, setSelectedFloor] = useState<string>('1F');
  
  // 选中的设备定位信标
  const [selectedBeaconId, setSelectedBeaconId] = useState<string | null>('BCN-001');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingRadar, setIsSimulatingRadar] = useState<boolean>(false);
  const [findNearestTarget, setFindNearestTarget] = useState<'defibrillator' | 'ventilator' | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 院内高精度定位有源标签节点数据
  const [beaconNodes, setBeaconNodes] = useState<BeaconNode[]>([
    {
      id: 'BCN-001',
      equipmentId: 'EQ-2026-EM01',
      equipmentName: '卓尔 R-Series 双相波除颤监护仪',
      model: 'ZOLL R-Series ALS',
      sn: 'SN-ZOLL-EM01',
      category: '除颤起搏类',
      building: 'emergency',
      floor: '1F',
      room: '急诊科 · 抢救室1床旁',
      x: 32,
      y: 42,
      batteryPercent: 96,
      rssi: -48,
      status: 'normal_in_place',
      assignedDept: '急诊科抢救室',
      lastSeenSecondsAgo: 3
    },
    {
      id: 'BCN-002',
      equipmentId: 'EQ-2026-EM02',
      equipmentName: '迈瑞 SV300 急救转运呼吸机',
      model: 'Mindray SV300',
      sn: 'SN-MR-EM02',
      category: '呼吸麻醉类',
      building: 'emergency',
      floor: '1F',
      room: '急诊科 · 创伤复苏单元',
      x: 64,
      y: 36,
      batteryPercent: 88,
      rssi: -52,
      status: 'in_clinical_use',
      assignedDept: '急诊科创伤外科',
      lastSeenSecondsAgo: 5
    },
    {
      id: 'BCN-003',
      equipmentId: 'EQ-2026-EM03',
      equipmentName: '迈瑞 BeneFusion VP5 智能微量输液泵',
      model: 'BeneFusion VP5',
      sn: 'SN-MR-VP03',
      category: '注输护理类',
      building: 'emergency',
      floor: '1F',
      room: '急诊观察室 · 04床',
      x: 78,
      y: 68,
      batteryPercent: 42,
      rssi: -65,
      status: 'low_battery',
      assignedDept: '急诊留观室',
      lastSeenSecondsAgo: 8
    },
    {
      id: 'BCN-004',
      equipmentId: 'EQ-2026-EM04',
      equipmentName: '迈瑞 SV800 有创重症呼吸机',
      model: 'Mindray SV800',
      sn: 'SN-MR-2023-ICU09',
      category: '呼吸麻醉类',
      building: 'emergency',
      floor: '1F',
      room: '1号楼大厅西侧连廊 (门禁闸口旁)',
      x: 18,
      y: 84,
      batteryPercent: 79,
      rssi: -78,
      status: 'geofence_breach',
      assignedDept: '重症医学科 (ICU)',
      lastSeenSecondsAgo: 2,
      isBreached: true,
      breachReason: '擅自越出外科楼ICU电子围栏！感应探头检测正向门诊大厅连廊移动，存在失控或非法转运风险！'
    },
    {
      id: 'BCN-005',
      equipmentId: 'EQ-2026-EM05',
      equipmentName: '普诺飞 移动电动心肺复苏机 (LUCAS 3)',
      model: 'Stryker LUCAS 3',
      sn: 'SN-LUCAS-02',
      category: '急救生命支持类',
      building: 'emergency',
      floor: '1F',
      room: '急诊 EICU 重症监护仓',
      x: 48,
      y: 62,
      batteryPercent: 92,
      rssi: -50,
      status: 'normal_in_place',
      assignedDept: '急诊重症监护室(EICU)',
      lastSeenSecondsAgo: 4
    },
    {
      id: 'BCN-006',
      equipmentId: 'EQ-2026-EM06',
      equipmentName: '飞利浦 TC20 自动分析心电图机',
      model: 'PageWriter TC20',
      sn: 'SN-PHI-ECG01',
      category: '诊察监护类',
      building: 'emergency',
      floor: '1F',
      room: '门急诊分诊台 / 胸痛中心初筛间',
      x: 35,
      y: 78,
      batteryPercent: 85,
      rssi: -55,
      status: 'normal_in_place',
      assignedDept: '急诊分诊台',
      lastSeenSecondsAgo: 6
    }
  ]);

  // 过滤信标
  const filteredBeacons = useMemo(() => {
    return beaconNodes.filter(b => {
      const matchBuilding = b.building === selectedBuilding;
      const matchCategory = categoryFilter === 'all' || b.category.includes(categoryFilter);
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        b.equipmentName.toLowerCase().includes(q) ||
        b.sn.toLowerCase().includes(q) ||
        b.room.toLowerCase().includes(q) ||
        b.assignedDept.toLowerCase().includes(q);
      return matchBuilding && matchCategory && matchQuery;
    });
  }, [beaconNodes, selectedBuilding, categoryFilter, searchQuery]);

  // 当前选中的信标详情
  const activeBeacon = useMemo(() => {
    return beaconNodes.find(b => b.id === selectedBeaconId) || beaconNodes[0];
  }, [beaconNodes, selectedBeaconId]);

  // 越界告警信标
  const breachedBeacons = useMemo(() => {
    return beaconNodes.filter(b => b.isBreached || b.status === 'geofence_breach');
  }, [beaconNodes]);

  // 一键向企业微信 / 钉钉 / 移动护理 PDA 广播越界追查令
  const handlePushBreachAlert = async (beacon: BeaconNode) => {
    try {
      await sendInstantPushNotification({
        title: `【电子围栏越界越区告警】${beacon.equipmentName} 异常移位`,
        summary: `蓝牙AOA基站告警：急救生命支持设备【${beacon.equipmentName} (${beacon.sn})】已被移出预设科室安全边界，当前停留在【${beacon.room}】！请现场医工与安保协同核查。`,
        scenario: 'emergency_loan',
        scenarioTitle: '电子围栏越界防失控告警',
        channel: 'wecom',
        priority: 'P1_CRITICAL',
        equipmentName: beacon.equipmentName,
        equipmentModel: beacon.model,
        equipmentSn: beacon.sn,
        department: beacon.assignedDept,
        location: beacon.room,
        recipientName: '医院总值班 / 驻场急救医工组',
        recipientRole: '安保巡查与急救医工',
        recipientTarget: '企微突发事件应急协同群',
        actions: [
          { key: 'confirm_arrival', label: '现场拦截核查打卡', color: 'danger', actionType: 'arrive_scene' },
          { key: 'call_phone', label: '呼叫责任科室护士长', color: 'primary', actionType: 'call_phone' }
        ]
      });

      showToast(`🚨 已成功向【企业微信】及【移动PDA】推送【${beacon.equipmentName}】越界追查广播！`);
    } catch (err: any) {
      showToast(`推送失败: ${err.message}`);
    }
  };

  // 解除越界告警（转为授权临时转运）
  const handleAuthorizeTransit = (beaconId: string) => {
    setBeaconNodes(prev => prev.map(b => {
      if (b.id === beaconId) {
        return {
          ...b,
          isBreached: false,
          status: 'in_clinical_use',
          breachReason: undefined
        };
      }
      return b;
    }));
    showToast('✅ 已核准授权本次跨区转运，电子围栏警报已临时解除（有效期 2 小时）');
  };

  // 找离急诊抢救室最近的设备
  const handleFindNearest = (target: 'defibrillator' | 'ventilator') => {
    setFindNearestTarget(target);
    setIsSimulatingRadar(true);
    setTimeout(() => {
      setIsSimulatingRadar(false);
      const targetBeacon = target === 'defibrillator' 
        ? beaconNodes.find(b => b.category.includes('除颤')) 
        : beaconNodes.find(b => b.category.includes('呼吸'));
      if (targetBeacon) {
        setSelectedBeaconId(targetBeacon.id);
        showToast(`📍 测算完成：离抢救室最近的【${targetBeacon.equipmentName}】位于【${targetBeacon.room}】，直线距离 18米，电量 ${targetBeacon.batteryPercent}% 随时待命！`);
      }
    }, 700);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden select-none">
      
      {/* 顶部控制与快速统计条 */}
      <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                全院急救与生命支持设备高精度室内定位与电子围栏看板
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                UWB / 蓝牙 AOA 亚米级定位 (35cm)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              实时监测除颤仪、呼吸机、注射泵、CPR机具楼层在位分布，越界防盗与 50 米极速抢救寻机
            </p>
          </div>
        </div>

        {/* 寻机快捷操作 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleFindNearest('defibrillator')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-950 cursor-pointer active:scale-95"
            title="一键测算距离抢救室最近的除颤仪"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>急救找机：最近除颤仪</span>
          </button>

          <button
            type="button"
            onClick={() => handleFindNearest('ventilator')}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer active:scale-95"
            title="一键测算可用呼吸机位置"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>急救找机：最近呼吸机</span>
          </button>
        </div>
      </div>

      {/* 越界警告横幅 */}
      {breachedBeacons.length > 0 && (
        <div className="px-5 py-2.5 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3 shrink-0 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <span>
              <strong>电子围栏警报：</strong> 检测到 <strong>{breachedBeacons[0].equipmentName} ({breachedBeacons[0].sn})</strong> 异常移位越界！停留在【{breachedBeacons[0].room}】。
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleAuthorizeTransit(breachedBeacons[0].id)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition"
            >
              授权临时跨区
            </button>
            <button
              type="button"
              onClick={() => handlePushBreachAlert(breachedBeacons[0])}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>企微/PDA广播拦截</span>
            </button>
          </div>
        </div>
      )}

      {/* 提示反馈 Toast */}
      {toastMessage && (
        <div className="px-5 py-2 bg-emerald-950 text-emerald-300 border-b border-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 主体工作区：左侧平面地图 (8列) + 右侧雷达详情与信标池 (4列) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        
        {/* 左侧：室内矢量地图呈现 (8列) */}
        <div className="lg:col-span-8 flex flex-col h-full border-r border-slate-800 bg-slate-950 p-4 relative overflow-hidden">
          
          {/* 地图顶部微型工具条：楼宇与楼层切换 */}
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0 z-10">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSelectedBuilding('emergency')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  selectedBuilding === 'emergency'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>门急诊与创伤综合楼 (1F 抢救区)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedBuilding('surgical')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  selectedBuilding === 'surgical'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>综合外科大楼 (4F ICU 重症病区)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>基站在线: 12/12</span>
              </span>
            </div>
          </div>

          {/* SVG 医院高仿真室内楼层平面图 */}
          <div className="flex-1 relative rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-inner flex items-center justify-center">
            
            {/* 网格底纹 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

            {/* 室内房间结构线 (SVG) */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* 电子围栏流动警告线 */}
                <pattern id="breachPattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#f43f5e" strokeWidth="3" opacity="0.4" />
                </pattern>
              </defs>

              {/* 房间区域 1: 急诊抢救大厅 (安全合规核心区) */}
              <rect x="25%" y="20%" width="30%" height="45%" rx="12" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
              <text x="27%" y="26%" fill="#93c5fd" fontSize="12" fontWeight="bold">急诊抢救室 · 1-4床抢救单元</text>
              <text x="27%" y="30%" fill="#64748b" fontSize="10">【电子安全围栏核心区 A-01】</text>

              {/* 房间区域 2: 创伤复苏单元 */}
              <rect x="58%" y="20%" width="38%" height="32%" rx="12" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" opacity="0.8" />
              <text x="60%" y="26%" fill="#93c5fd" fontSize="12" fontWeight="bold">严重创伤复苏抢救仓</text>
              <text x="60%" y="30%" fill="#64748b" fontSize="10">急救转运通道直达</text>

              {/* 房间区域 3: 急诊留观与输液病区 */}
              <rect x="58%" y="56%" width="38%" height="38%" rx="12" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
              <text x="60%" y="62%" fill="#cbd5e1" fontSize="12" fontWeight="bold">急诊观察室 · 01-12床</text>

              {/* 房间区域 4: 急诊分诊台与预检通道 */}
              <rect x="25%" y="68%" width="30%" height="26%" rx="12" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
              <text x="27%" y="74%" fill="#cbd5e1" fontSize="12" fontWeight="bold">预检分诊台 / 胸痛卒中前哨</text>

              {/* 危险区：出入口越界警戒线 (电子围栏防盗感应门) */}
              <rect x="5%" y="72%" width="16%" height="24%" rx="8" fill="url(#breachPattern)" stroke="#f43f5e" strokeWidth="2.5" />
              <text x="6%" y="78%" fill="#fda4af" fontSize="11" fontWeight="bold">1号楼连廊出口</text>
              <text x="6%" y="83%" fill="#fb7185" fontSize="9">【电子围栏防盗门禁】</text>

              {/* 寻机最佳路径虚线高亮 */}
              {findNearestTarget && (
                <path 
                  d="M 280, 240 L 450, 190" 
                  stroke="#38bdf8" 
                  strokeWidth="3" 
                  strokeDasharray="6 4" 
                  fill="none" 
                  className="animate-pulse"
                />
              )}
            </svg>

            {/* 信标锚点 (Beacons) */}
            {filteredBeacons.map(beacon => {
              const isSelected = selectedBeaconId === beacon.id;
              const isBreach = beacon.isBreached || beacon.status === 'geofence_breach';

              return (
                <div
                  key={beacon.id}
                  onClick={() => setSelectedBeaconId(beacon.id)}
                  style={{ left: `${beacon.x}%`, top: `${beacon.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                >
                  {/* 雷达脉冲扩散波圈 */}
                  <span className={`absolute -inset-2.5 rounded-full opacity-60 animate-ping pointer-events-none ${
                    isBreach ? 'bg-rose-500' : isSelected ? 'bg-cyan-400' : 'bg-blue-400'
                  }`} />

                  {/* 核心坐标圆标 */}
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-125 ${
                    isBreach 
                      ? 'bg-rose-600 border-white shadow-rose-900/60 ring-4 ring-rose-500/40 animate-bounce' 
                      : isSelected
                      ? 'bg-cyan-500 border-white shadow-cyan-900/50 ring-4 ring-cyan-500/30'
                      : beacon.status === 'low_battery'
                      ? 'bg-amber-600 border-white'
                      : 'bg-blue-600 border-blue-200'
                  }`}>
                    {beacon.category.includes('呼吸') ? (
                      <span className="text-[10px] font-bold">呼</span>
                    ) : beacon.category.includes('除颤') ? (
                      <span className="text-[10px] font-bold">颤</span>
                    ) : (
                      <span className="text-[10px] font-bold">泵</span>
                    )}
                  </div>

                  {/* 悬浮标签 */}
                  <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md pointer-events-none transition-all ${
                    isSelected 
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50 z-30' 
                      : 'bg-slate-950/90 text-slate-300 border border-slate-700/80 group-hover:opacity-100 opacity-80'
                  }`}>
                    {beacon.equipmentName.slice(0, 8)}
                  </div>
                </div>
              );
            })}

            {/* 地图图例 */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-1 shadow-lg pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>正常在位 (急诊抢救室安全区)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>越界擅自移位 (电子围栏报警)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>低电量 (&lt;50% 待充电)</span>
              </div>
            </div>

          </div>
        </div>

        {/* 右侧：设备实时信标雷达面板与极速处置 (4列) */}
        <div className="lg:col-span-4 flex flex-col h-full bg-slate-950 p-4 overflow-y-auto custom-scrollbar space-y-4">
          
          {/* 选中的信标卡片 */}
          {activeBeacon && (
            <div className={`rounded-2xl p-4 border transition ${
              activeBeacon.isBreached
                ? 'bg-rose-950/40 border-rose-800 shadow-lg shadow-rose-950/30'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeBeacon.isBreached
                    ? 'bg-rose-600 text-white animate-pulse'
                    : activeBeacon.status === 'low_battery'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600/30 text-emerald-300'
                }`}>
                  {activeBeacon.isBreached ? '⚠️ 越界擅自移位' : '在位正常待命'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  心跳 {activeBeacon.lastSeenSecondsAgo}s 前
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-2 leading-snug">
                {activeBeacon.equipmentName}
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                型号: {activeBeacon.model} | SN: {activeBeacon.sn}
              </p>

              {/* 越界警报详细信息 */}
              {activeBeacon.isBreached && activeBeacon.breachReason && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs leading-relaxed">
                  {activeBeacon.breachReason}
                </div>
              )}

              {/* 物理属性网格 */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block text-[10px]">所在位置</span>
                  <span className="font-semibold text-slate-200 truncate block">{activeBeacon.room}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block text-[10px]">归属科室</span>
                  <span className="font-semibold text-slate-200 truncate block">{activeBeacon.assignedDept}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block text-[10px]">电池电量</span>
                  <span className="font-semibold text-emerald-400 font-mono flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    {activeBeacon.batteryPercent}%
                  </span>
                </div>
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                  <span className="text-slate-500 block text-[10px]">AOA 信号强度</span>
                  <span className="font-semibold text-cyan-400 font-mono">
                    {activeBeacon.rssi} dBm
                  </span>
                </div>
              </div>

              {/* 快速动作 */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                {activeBeacon.isBreached ? (
                  <button
                    type="button"
                    onClick={() => handlePushBreachAlert(activeBeacon)}
                    className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-950 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>推送企微/PDA追查令</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const eq = equipmentList.find(e => e.id === activeBeacon.equipmentId);
                      if (eq && onOpenBorrowModal) onOpenBorrowModal(eq);
                      else showToast(`已选定【${activeBeacon.equipmentName}】，可直接在临床办理出库借用`);
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-950 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>立即发起应急借调</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 全院信标列表与分类过滤 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col flex-1 min-h-[220px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>实时在位机具 ({filteredBeacons.length})</span>
              </h4>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-750 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-hidden"
              >
                <option value="all">全部分类</option>
                <option value="除颤">除颤仪</option>
                <option value="呼吸">呼吸机</option>
                <option value="注输">注输泵</option>
              </select>
            </div>

            {/* 信标快速滚动列表 */}
            <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
              {filteredBeacons.map(beacon => {
                const isSelected = selectedBeaconId === beacon.id;
                const isBreach = beacon.isBreached || beacon.status === 'geofence_breach';

                return (
                  <div
                    key={beacon.id}
                    onClick={() => setSelectedBeaconId(beacon.id)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500' 
                        : isBreach
                        ? 'bg-rose-950/20 border-rose-800/60'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200 truncate">{beacon.equipmentName}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        isBreach ? 'bg-rose-600 text-white' : 'bg-slate-800 text-emerald-400'
                      }`}>
                        {isBreach ? '越界' : '在位'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>{beacon.room}</span>
                      <span className="font-mono text-emerald-400">{beacon.batteryPercent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
