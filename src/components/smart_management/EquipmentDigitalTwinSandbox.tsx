import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Layers, 
  Activity, 
  ShieldAlert, 
  Radio, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  Boxes, 
  Search, 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  HeartPulse, 
  Battery, 
  Info,
  Send,
  Sliders,
  Thermometer,
  Wifi,
  History,
  MapPin,
  Wrench,
  Sparkles
} from 'lucide-react';
import { FloorSpaceTopology, EmergencySimulationScenario, DigitalTwinDeviceItem, MedicalEquipment } from '../../types';
import { DEFAULT_FLOOR_TOPOLOGY, PRESET_EMERGENCY_SCENARIOS } from '../../utils/smartManagementData';

interface EquipmentDigitalTwinSandboxProps {
  equipments: MedicalEquipment[];
  onOpenBorrowModal?: (equipment?: MedicalEquipment) => void;
  onOpenTroubleshootModal?: (equipment?: MedicalEquipment) => void;
}

export const EquipmentDigitalTwinSandbox: React.FC<EquipmentDigitalTwinSandboxProps> = ({
  equipments,
  onOpenBorrowModal,
  onOpenTroubleshootModal
}) => {
  const [topology, setTopology] = useState<FloorSpaceTopology[]>(DEFAULT_FLOOR_TOPOLOGY);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('HQ-EMERGENCY');
  const [selectedFloorIndex, setSelectedFloorIndex] = useState<number>(0);
  const [selectedDevice, setSelectedDevice] = useState<DigitalTwinDeviceItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lifeSupportOnly, setLifeSupportOnly] = useState<boolean>(false);
  const [deviceDetailTab, setDeviceDetailTab] = useState<'telemetry' | 'trajectory'>('telemetry');
  const [isPlayingTrajectory, setIsPlayingTrajectory] = useState<boolean>(false);
  const [activeTrajectoryStep, setActiveTrajectoryStep] = useState<number>(2);

  // 应急演练沙盘推演状态
  const [activeScenario, setActiveScenario] = useState<EmergencySimulationScenario>(PRESET_EMERGENCY_SCENARIOS[0]);
  const [simStepIndex, setSimStepIndex] = useState<number>(0);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [simCompleted, setSimCompleted] = useState<boolean>(false);
  const [simDispatchSuccessMessage, setSimDispatchSuccessMessage] = useState<string | null>(null);

  // 获取服务端最新空间沙盘
  useEffect(() => {
    fetch('/api/sandbox/topology')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.topology)) {
          setTopology(data.topology);
        }
      })
      .catch(err => {
        console.warn('Fallback to local topology data:', err);
      });
  }, []);

  // 楼宇列表
  const buildings = useMemo(() => {
    const map = new Map<string, string>();
    topology.forEach(t => map.set(t.buildingCode, t.buildingName));
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [topology]);

  // 当前选中建筑的楼层
  const currentBuildingFloors = useMemo(() => {
    return topology.filter(t => t.buildingCode === selectedBuilding);
  }, [topology, selectedBuilding]);

  // 当前选中的楼层对象
  const activeFloor = useMemo(() => {
    if (currentBuildingFloors.length === 0) return topology[0];
    return currentBuildingFloors[selectedFloorIndex] || currentBuildingFloors[0];
  }, [currentBuildingFloors, selectedFloorIndex]);

  // 过滤当前楼层中的设备
  const visibleDevices = useMemo(() => {
    if (!activeFloor || !activeFloor.devices) return [];
    return activeFloor.devices.filter(d => {
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchLifeSupport = !lifeSupportOnly || d.isLifeSupport;
      return matchStatus && matchLifeSupport;
    });
  }, [activeFloor, statusFilter, lifeSupportOnly]);

  // 应急模拟步进自动执行计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimRunning && !simCompleted) {
      timer = setTimeout(() => {
        if (simStepIndex < activeScenario.steps.length - 1) {
          setSimStepIndex(prev => prev + 1);
        } else {
          setIsSimRunning(false);
          setSimCompleted(true);
        }
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [isSimRunning, simStepIndex, simCompleted, activeScenario]);

  // 重置演练
  const handleResetSimulation = () => {
    setIsSimRunning(false);
    setSimStepIndex(0);
    setSimCompleted(false);
    setSimDispatchSuccessMessage(null);
  };

  // 开始演练
  const handleStartSimulation = () => {
    handleResetSimulation();
    setIsSimRunning(true);
  };

  // 下发正式调配指令
  const handleCommitDispatch = () => {
    const orderCode = `SIM-ORD-${Date.now().toString().slice(-6)}`;
    setSimDispatchSuccessMessage(`【应急动员已闭环】已生成应急调配指令单 ${orderCode}，全院 ${activeScenario.targetNeedCount} 台生命支持机具动员方案已同步抄送医工科与接收科室护士站！`);
  };

  return (
    <div className="space-y-6">
      {/* 顶部数字孪生沙盘控制台横幅 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>五莲县人民医院 · 全院医疗设备空间数字孪生沙盘</span>
              <span aria-hidden="true">·</span>
              <span>实时态势感知中枢</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              沉浸式设备运行数字沙盘与跨科室应急推演中心
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              基于空间建筑几何拓扑，高精度映射急救综合楼、住院部及门诊医技各楼层急救生命支持机具负荷状态，支持重大抢救事件一键应急征集与借调动员推演。
            </p>
          </div>

          {/* 全院空间资产运行概览 */}
          <div className="flex items-center gap-4 bg-slate-800/80 border border-slate-700/80 rounded-lg p-4 shrink-0 font-mono">
            <div className="text-center px-3 border-r border-slate-700">
              <span className="text-xs text-slate-400 block mb-1 font-sans">监控楼宇空间</span>
              <div className="text-3xl font-extrabold text-sky-400">4 <span className="text-sm font-normal text-slate-400">栋</span></div>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-sans">28个临床医技单元</span>
            </div>
            <div className="text-center px-3 border-r border-slate-700">
              <span className="text-xs text-slate-400 block mb-1 font-sans">急救在位总机</span>
              <div className="text-3xl font-bold text-emerald-400">48 <span className="text-sm font-normal text-slate-400">台</span></div>
              <span className="text-[11px] text-emerald-400 block mt-0.5 font-sans">生命支持机具池</span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs text-slate-400 block mb-1 font-sans">综合负荷率</span>
              <div className="text-3xl font-bold text-white">82.4<span className="text-sm font-normal text-slate-400">%</span></div>
              <span className="text-[11px] text-sky-400 block mt-0.5 font-sans">高周转运行中</span>
            </div>
          </div>
        </div>

        {/* 楼宇切换标签 */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-sans mr-1">切换院区建筑：</span>
            {buildings.map(b => (
              <button
                key={b.code}
                onClick={() => {
                  setSelectedBuilding(b.code);
                  setSelectedFloorIndex(0);
                }}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  selectedBuilding === b.code
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{b.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700">
              <input
                type="checkbox"
                checked={lifeSupportOnly}
                onChange={e => setLifeSupportOnly(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500 focus:ring-0"
              />
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5" /> 仅显急救生命支持机具
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 主体交互区：左侧楼层网格空间拓扑 + 右侧应急调配推演控制台 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：楼层与机房可视化数字孪生网格 (占 7 列) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">{activeFloor?.floorLabel || '空间楼层态势'}</h3>
              </div>

              {/* 楼层选择器 */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                {currentBuildingFloors.map((f, idx) => (
                  <button
                    key={f.floor}
                    onClick={() => setSelectedFloorIndex(idx)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      selectedFloorIndex === idx
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.floor}F
                  </button>
                ))}
              </div>
            </div>

            {/* 楼层状态统计指标 */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                <span className="text-slate-500 block mb-0.5">该层总在册</span>
                <span className="text-base font-bold font-mono text-slate-900">{activeFloor?.totalEquipmentCount} 台</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <span className="text-emerald-700 block mb-0.5">正常运转</span>
                <span className="text-base font-bold font-mono text-emerald-700">{activeFloor?.runningCount} 台</span>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-lg p-2.5">
                <span className="text-sky-700 block mb-0.5">待命闲置</span>
                <span className="text-base font-bold font-mono text-sky-700">{activeFloor?.idleCount} 台</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                <span className="text-rose-700 block mb-0.5">故障报修</span>
                <span className="text-base font-bold font-mono text-rose-700">{activeFloor?.faultyCount} 台</span>
              </div>
            </div>

            {/* 孪生空间设备网格 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>现场房间与在位机具分布图谱</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 运转中
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> 待命备用
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 待修中
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {visibleDevices.map(device => {
                  const isSelected = selectedDevice?.id === device.id;
                  const isRunning = device.status === 'running';
                  const isIdle = device.status === 'idle';

                  return (
                    <div
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-0.5">
                            <span className="font-mono text-slate-600 font-semibold">{device.id}</span>
                            <span aria-hidden="true">·</span>
                            <span>{device.roomName}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{device.name}</h4>
                        </div>

                        <div className="shrink-0 text-right">
                          {isRunning && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5">
                              运行中
                            </span>
                          )}
                          {isIdle && (
                            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200/60 rounded px-1.5 py-0.5">
                              待命中
                            </span>
                          )}
                          {!isRunning && !isIdle && (
                            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/60 rounded px-1.5 py-0.5">
                              {device.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-2">
                          {device.isLifeSupport && (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5">
                              <HeartPulse className="w-2.5 h-2.5" /> 生命支持
                            </span>
                          )}
                          {device.batteryLevel !== undefined && (
                            <span className="flex items-center gap-0.5 text-slate-600">
                              <Battery className="w-3 h-3 text-slate-400" />
                              <span className="font-mono">{device.batteryLevel}%</span>
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-slate-700 font-medium">
                          负荷率: {device.loadRatio}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 选中设备交互抽屉/面板 */}
            {selectedDevice && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 mt-4 text-xs shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedDevice.name}</span>
                    <span className="text-slate-500 font-mono">[{selectedDevice.id}]</span>
                    {selectedDevice.status === 'running' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        正常运转
                      </span>
                    )}
                    {selectedDevice.status === 'idle' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        待命中
                      </span>
                    )}
                    {selectedDevice.status === 'faulty' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        故障待修
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedDevice(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm px-1.5 py-0.5 hover:bg-slate-200/60 rounded cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                  <div>规格型号: <span className="font-medium text-slate-900">{selectedDevice.model}</span></div>
                  <div>归属科室: <span className="font-medium text-slate-900">{selectedDevice.department}</span></div>
                  <div>物理房间: <span className="font-medium text-slate-900">{selectedDevice.roomName}</span></div>
                  <div>出厂SN: <span className="font-medium text-slate-900 font-mono">{selectedDevice.sn}</span></div>
                </div>

                {/* 子面板切换标签 */}
                <div className="flex items-center gap-1 border-b border-slate-200 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeviceDetailTab('telemetry')}
                    className={`px-3 py-1.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                      deviceDetailTab === 'telemetry'
                        ? 'border-sky-600 text-sky-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>实时物联遥测 (IoT Telemetry)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceDetailTab('trajectory')}
                    className={`px-3 py-1.5 font-semibold text-xs border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                      deviceDetailTab === 'trajectory'
                        ? 'border-sky-600 text-sky-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>空间流转轨迹 (Spatial Path)</span>
                  </button>
                </div>

                {/* 视图1：实时物联遥测卡片群 */}
                {deviceDetailTab === 'telemetry' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>供电工况</span>
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">220.4 V</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Battery className="w-3 h-3 text-emerald-600" />
                        <span>备电: 100% (交流在线)</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>机身工况温度</span>
                        <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">36.5 ℃</div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        机内风道散热正常 (湿度48%)
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>物联心跳</span>
                        <Wifi className="w-3.5 h-3.5 text-sky-500" />
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">-58 dBm</div>
                      <div className="text-[10px] text-slate-500">
                        蓝牙AOA + LoRaWAN (2s/次)
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>负荷与电气安全</span>
                        <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="font-mono text-sm font-bold text-slate-900">{selectedDevice.loadRatio}% 负荷</div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        GB9706.1 漏电流 24μA 合规
                      </div>
                    </div>
                  </div>
                )}

                {/* 视图2：空间时空调配轨迹与回放 */}
                {deviceDetailTab === 'trajectory' && (
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        <span>院内空间物理流转与实时调配时空链路</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlayingTrajectory(true);
                          setActiveTrajectoryStep(0);
                          setTimeout(() => setActiveTrajectoryStep(1), 700);
                          setTimeout(() => {
                            setActiveTrajectoryStep(2);
                            setIsPlayingTrajectory(false);
                          }, 1500);
                        }}
                        disabled={isPlayingTrajectory}
                        className="px-2.5 py-1 text-[11px] font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Play className="w-3 h-3 text-sky-600" />
                        <span>{isPlayingTrajectory ? '正在轨迹回溯...' : '空间轨迹回放'}</span>
                      </button>
                    </div>

                    <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {[
                        {
                          time: '08:00',
                          location: '急救设备保障库房 (综合楼B1F)',
                          action: '出库自检合格 · 备用转应急待命',
                          step: 0
                        },
                        {
                          time: '09:15',
                          location: '急救转运通道 (综合楼1F大厅)',
                          action: '蓝牙AOA网关感应移入 · 运往急诊抢救区',
                          step: 1
                        },
                        {
                          time: '10:30 (当前)',
                          location: `${selectedDevice.roomName} (${selectedDevice.department})`,
                          action: '接电满负荷监护救治 · 实时遥测心跳在线',
                          step: 2
                        }
                      ].map((item, idx) => {
                        const isCurrent = activeTrajectoryStep === idx;
                        return (
                          <div key={idx} className="relative">
                            <div
                              className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 transition-all ${
                                isCurrent
                                  ? 'bg-sky-600 border-white ring-2 ring-sky-500 scale-125'
                                  : 'bg-white border-slate-400'
                              }`}
                            />
                            <div
                              className={`p-2 rounded border text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-sky-50/70 border-sky-300 text-sky-900 font-semibold'
                                  : 'bg-slate-50/50 border-slate-200/60 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-500">{item.time}</span>
                                <span className="font-medium text-slate-800">{item.location}</span>
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-600">{item.action}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  {onOpenBorrowModal && (
                    <button
                      onClick={() => {
                        const matched = equipments.find(e => e.id === selectedDevice.id);
                        onOpenBorrowModal(matched);
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>发起应急借调</span>
                    </button>
                  )}
                  {onOpenTroubleshootModal && (
                    <button
                      onClick={() => {
                        const matched = equipments.find(e => e.id === selectedDevice.id);
                        onOpenTroubleshootModal(matched);
                      }}
                      className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-sky-200" />
                      <span>Gemini 深度排障与处置建议</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：交互式应急动员沙盘推演控制台 (占 5 列) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">突发公共事件应急动员推演</h3>
              </div>
              <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
                三甲急救演练专用
              </span>
            </div>

            {/* 预设演练场景切换 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">选择推演演练场景：</label>
              <select
                value={activeScenario.id}
                onChange={e => {
                  const sc = PRESET_EMERGENCY_SCENARIOS.find(s => s.id === e.target.value);
                  if (sc) {
                    setActiveScenario(sc);
                    handleResetSimulation();
                  }
                }}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:border-sky-500 focus:outline-hidden font-medium text-slate-800 bg-slate-50/50"
              >
                {PRESET_EMERGENCY_SCENARIOS.map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>

            {/* 场景详情卡片 */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">应急触发原因：</span>
                <span className="text-slate-500 font-mono">预计调集耗时: {activeScenario.estimatedMobilizeMinutes} 分钟</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{activeScenario.triggerCause}</p>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700 font-medium">
                <span>需求目标: <strong className="text-rose-600 font-mono">{activeScenario.targetNeedCount} 台</strong> {activeScenario.deviceCategory}</span>
                <span>接收目标: {activeScenario.targetDepartment}</span>
              </div>
            </div>

            {/* 各科室调拨配额与安全底线 */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-800 block">全院来源科室征集与安全底线：</span>
              <div className="space-y-1.5">
                {activeScenario.sourceDepartments.map((sd, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded p-2 text-[11px]">
                    <span className="font-medium text-slate-800">{sd.department}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">在册: {sd.availableCount}</span>
                      <span className="text-sky-600 font-bold">借调: {sd.proposedBorrowCount} 台</span>
                      <span className="text-emerald-600">留存安全底线: {sd.safetyReserveRemaining} 台</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 演练步骤步进器 */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">沙盘推演执行阶段：</span>
                <span className="font-mono text-slate-500">
                  阶段 {simStepIndex + 1} / {activeScenario.steps.length}
                </span>
              </div>

              <div className="space-y-2">
                {activeScenario.steps.map((st, idx) => {
                  const isCurrent = simStepIndex === idx;
                  const isPast = simStepIndex > idx || simCompleted;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-sky-50 border-sky-400 ring-1 ring-sky-400/20 shadow-xs'
                          : isPast
                          ? 'bg-slate-50 border-slate-200 opacity-90'
                          : 'bg-white border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className={isCurrent ? 'text-sky-900' : isPast ? 'text-slate-800' : 'text-slate-400'}>
                          {st.phase}
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{st.durationMin} 分钟</span>
                        </div>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-sky-800' : 'text-slate-500'}`}>
                        {st.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 调配指令下发成功提示 */}
            {simDispatchSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{simDispatchSuccessMessage}</span>
              </div>
            )}

            {/* 推演操作控制按钮组 */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={handleResetSimulation}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置推演</span>
              </button>

              <div className="flex items-center gap-2">
                {!simCompleted ? (
                  <button
                    onClick={handleStartSimulation}
                    disabled={isSimRunning}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isSimRunning ? '推演演算中...' : '开始沙盘推演'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCommitDispatch}
                    disabled={Boolean(simDispatchSuccessMessage)}
                    className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>下发真实应急调配单</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
