import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  Camera,
  CameraOff,
  Flashlight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Wrench,
  FileText,
  SlidersHorizontal,
  Smartphone,
  Monitor,
  Printer,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Building,
  Upload,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Info,
  X,
  Battery,
  Wifi,
  ExternalLink,
  ClipboardCheck,
  CheckSquare,
  Volume2,
  VolumeX,
  Download,
  Image as ImageIcon,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  MedicalEquipment, 
  AuthUser, 
  DepartmentMaster, 
  CampusMaster, 
  BuildingMaster, 
  LocationRoomMaster, 
  StaffPersonMaster, 
  EquipmentStatus,
  MobileInspectionAuditRecord,
  InspectionAuditResult
} from '../types';
import { LoanTimeProgressBar } from './LoanTimeProgressBar';
import { Pagination } from './Pagination';
import { getEquipmentValidityInfo } from '../utils/validityUtils';

interface MobileInspectionViewProps {
  equipmentList: MedicalEquipment[];
  currentUser: AuthUser;
  departments: DepartmentMaster[];
  campuses?: CampusMaster[];
  buildings?: BuildingMaster[];
  rooms?: LocationRoomMaster[];
  staff?: StaffPersonMaster[];
  preSelectedEquipmentId?: string | null;
  onClearPreSelectedEquipment?: () => void;
  onOpenQrModal?: (list: MedicalEquipment[]) => void;
  onUpdateEquipmentLocation?: (id: string, newLocation: string, newBuilding?: string, newFloor?: string, newDept?: string) => void;
  onSubmitStatusChange?: (id: string, newStatus: EquipmentStatus, reason: string, operator: string) => void;
  onSubmitRepair?: (repairData: any) => void;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
}

// 模拟或真实扫码成功提示音
function playScanBeep(success = true, enabled = true) {
  if (!enabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = success ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(success ? 880 : 320, ctx.currentTime);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (success ? 0.14 : 0.28));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.14 : 0.28));
  } catch (e) {
    // Web Audio blocked or not supported
  }
}

function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  } catch (e) {}
}

const STORAGE_KEY = 'hospital-mobile-inspection-audits';
const SOUND_KEY = 'hospital-mobile-inspection-sound';

export const MobileInspectionView: React.FC<MobileInspectionViewProps> = ({
  equipmentList,
  currentUser,
  departments,
  campuses = [],
  buildings = [],
  rooms = [],
  staff = [],
  preSelectedEquipmentId,
  onClearPreSelectedEquipment,
  onOpenQrModal,
  onUpdateEquipmentLocation,
  onSubmitStatusChange,
  onSubmitRepair,
  onViewDeviceDetail
}) => {
  // 视图显示模式: 'handheld' (手持PDA手机模式) 或 'console' (全景工作台模式)
  const [viewMode, setViewMode] = useState<'handheld' | 'console'>('handheld');

  // 音频提示开关
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SOUND_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_KEY, String(next));
      } catch {}
      return next;
    });
  };

  // 当前巡检选定科室 (默认为当前用户所属科室，或第一个科室)
  const [selectedDeptName, setSelectedDeptName] = useState<string>(() => {
    return currentUser.departmentName || (departments[0]?.name || '急诊医学科');
  });

  // 摄像头扫码状态
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanAnimationRef = useRef<number | null>(null);

  // 扫码输入查询框与手动快速匹配
  const [manualKeyword, setManualKeyword] = useState<string>('');
  const [activeEquipment, setActiveEquipment] = useState<MedicalEquipment | null>(null);

  // 现场巡检核对清单状态
  const [appearanceOk, setAppearanceOk] = useState<boolean>(true);
  const [electricalOk, setElectricalOk] = useState<boolean>(true);
  const [accessoriesOk, setAccessoriesOk] = useState<boolean>(true);
  const [cleanlinessOk, setCleanlinessOk] = useState<boolean>(true);
  const [batteryOk, setBatteryOk] = useState<boolean>(true);
  const [inspectionNotes, setInspectionNotes] = useState<string>('');
  const [photoProof, setPhotoProof] = useState<string | null>(null);

  // 现场极速报修弹窗状态
  const [isQuickRepairOpen, setIsQuickRepairOpen] = useState<boolean>(false);
  const [repairFaultDesc, setRepairFaultDesc] = useState<string>('');
  const [repairUrgency, setRepairUrgency] = useState<'紧急' | '普通'>('紧急');

  // 位置纠偏弹窗状态
  const [isLocationFixOpen, setIsLocationFixOpen] = useState<boolean>(false);
  const [targetBuilding, setTargetBuilding] = useState<string>('');
  const [targetFloor, setTargetFloor] = useState<string>('');
  const [targetRoom, setTargetRoom] = useState<string>('');

  // 批量盘点确认弹窗
  const [isBatchAuditModalOpen, setIsBatchAuditModalOpen] = useState<boolean>(false);

  // 巡检流水凭证卡详情弹窗
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<MobileInspectionAuditRecord | null>(null);

  // 全景工作台筛选过滤状态
  const [consoleSearch, setConsoleSearch] = useState<string>('');
  const [consoleFilterStatus, setConsoleFilterStatus] = useState<'all' | 'pending' | 'audited' | 'discrepancy' | 'fault'>('all');

  // 历史巡检盘点流水记录
  const [inspectionRecords, setInspectionRecords] = useState<MobileInspectionAuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // 成功反馈 Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);
  const showToast = (text: string, type: 'success' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 响应预选设备联动载入
  useEffect(() => {
    if (preSelectedEquipmentId) {
      const found = equipmentList.find(e => e.id === preSelectedEquipmentId);
      if (found) {
        if (found.department && found.department !== selectedDeptName) {
          setSelectedDeptName(found.department);
        }
        setActiveEquipment(found);
        showToast(`已快捷载入【${found.name}】进行巡检核对`);
        onClearPreSelectedEquipment?.();
      }
    }
  }, [preSelectedEquipmentId, equipmentList, selectedDeptName, onClearPreSelectedEquipment]);

  // 持久化记录
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inspectionRecords));
    } catch (e) {}
  }, [inspectionRecords]);

  // 当选定设备变化时，重置巡检清单项
  useEffect(() => {
    if (activeEquipment) {
      setAppearanceOk(true);
      setElectricalOk(true);
      setAccessoriesOk(true);
      setCleanlinessOk(true);
      setBatteryOk(true);
      setInspectionNotes('');
      setPhotoProof(null);
      setRepairFaultDesc('');

      // 初始化纠偏字段
      setTargetBuilding(activeEquipment.building || '1号门诊医技综合大楼');
      setTargetFloor(activeEquipment.floor || '3F');
      setTargetRoom(activeEquipment.location || '');
    }
  }, [activeEquipment]);

  // 科室设备列表与盘点统计
  const deptEquipmentList = useMemo(() => {
    if (!selectedDeptName) return equipmentList;
    return equipmentList.filter(e => 
      e.department === selectedDeptName || 
      e.ownerDepartment === selectedDeptName ||
      (e.currentLoan && e.currentLoan.borrowingDepartment === selectedDeptName)
    );
  }, [equipmentList, selectedDeptName]);

  // 统计本科室盘点情况
  const auditStats = useMemo(() => {
    const totalCount = deptEquipmentList.length;
    // 获取本科室已盘点过的设备ID集合 (基于记录)
    const auditedIds = new Set(
      inspectionRecords
        .filter(r => r.department === selectedDeptName)
        .map(r => r.equipmentId)
    );
    const auditedCount = deptEquipmentList.filter(e => auditedIds.has(e.id)).length;
    const pendingCount = Math.max(0, totalCount - auditedCount);
    const coveragePercent = totalCount > 0 ? Math.round((auditedCount / totalCount) * 100) : 100;

    // 异常与纠偏数
    const discrepancyCount = inspectionRecords.filter(
      r => r.department === selectedDeptName && r.result !== 'normal_present'
    ).length;

    return {
      totalCount,
      auditedCount,
      pendingCount,
      coveragePercent,
      discrepancyCount
    };
  }, [deptEquipmentList, inspectionRecords, selectedDeptName]);

  // 全景盘点工作台按搜索词与状态筛选后的设备列表
  const filteredConsoleList = useMemo(() => {
    return deptEquipmentList.filter(eq => {
      if (consoleSearch.trim()) {
        const q = consoleSearch.trim().toLowerCase();
        const matchName = (eq.name || '').toLowerCase().includes(q);
        const matchAsset = (eq.assetNo || eq.id || '').toLowerCase().includes(q);
        const matchSn = (eq.sn || '').toLowerCase().includes(q);
        const matchModel = (eq.model || '').toLowerCase().includes(q);
        const matchLoc = (eq.location || '').toLowerCase().includes(q);
        if (!matchName && !matchAsset && !matchSn && !matchModel && !matchLoc) {
          return false;
        }
      }
      if (consoleFilterStatus === 'all') return true;
      const rec = inspectionRecords.find(r => r.equipmentId === eq.id);
      if (consoleFilterStatus === 'pending') return !rec;
      if (consoleFilterStatus === 'audited') return rec?.result === 'normal_present';
      if (consoleFilterStatus === 'discrepancy') return rec?.result === 'location_discrepancy';
      if (consoleFilterStatus === 'fault') return rec?.result === 'fault_reported' || eq.status === '故障待修';
      return true;
    });
  }, [deptEquipmentList, consoleSearch, consoleFilterStatus, inspectionRecords]);

  // 全景工作台设备列表分页
  const [consolePage, setConsolePage] = useState<number>(1);
  const [consolePageSize, setConsolePageSize] = useState<number>(15);

  useEffect(() => {
    setConsolePage(1);
  }, [consoleSearch, consoleFilterStatus, selectedDeptName]);

  const paginatedConsoleList = useMemo(() => {
    const start = (consolePage - 1) * consolePageSize;
    return filteredConsoleList.slice(start, start + consolePageSize);
  }, [filteredConsoleList, consolePage, consolePageSize]);

  // 寻找设备逻辑：根据扫描到的原始文本匹配设备
  const findEquipmentByCode = useCallback((rawCode: string): MedicalEquipment | null => {
    if (!rawCode) return null;
    const clean = rawCode.trim();

    // 格式1: "ID:EQ-2024-001|SN:98321045|DEPT:急诊医学科"
    if (clean.includes('|')) {
      const parts = clean.split('|');
      let extractedId = '';
      let extractedSn = '';
      for (const p of parts) {
        if (p.startsWith('ID:')) extractedId = p.replace('ID:', '').trim();
        if (p.startsWith('SN:')) extractedSn = p.replace('SN:', '').trim();
      }
      if (extractedId) {
        const found = equipmentList.find(e => e.id.toLowerCase() === extractedId.toLowerCase() || e.assetNo?.toLowerCase() === extractedId.toLowerCase());
        if (found) return found;
      }
      if (extractedSn) {
        const found = equipmentList.find(e => e.sn.toLowerCase() === extractedSn.toLowerCase());
        if (found) return found;
      }
    }

    // 格式2: 直接ID、资产编号、序列号或内部编号匹配
    const lower = clean.toLowerCase();
    const exact = equipmentList.find(
      e =>
        e.id.toLowerCase() === lower ||
        (e.assetNo && e.assetNo.toLowerCase() === lower) ||
        (e.sn && e.sn.toLowerCase() === lower) ||
        (e.internalNo && e.internalNo.toLowerCase() === lower)
    );
    if (exact) return exact;

    // 格式3: 模糊名称或包含匹配
    const fuzzy = equipmentList.find(
      e =>
        e.name.toLowerCase().includes(lower) ||
        (e.model && e.model.toLowerCase().includes(lower))
    );
    return fuzzy || null;
  }, [equipmentList]);

  // 成功识别设备后的处理
  const handleRecognizeEquipment = useCallback((device: MedicalEquipment) => {
    playScanBeep(true);
    triggerHaptic();
    setActiveEquipment(device);
    showToast(`识别成功: ${device.name} (${device.assetNo || device.id})`);
  }, []);

  // ================= 摄像头视频扫码处理 (jsQR) =================
  const stopCamera = useCallback(() => {
    if (scanAnimationRef.current) {
      cancelAnimationFrame(scanAnimationRef.current);
      scanAnimationRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      scanAnimationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      scanAnimationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      const detected = findEquipmentByCode(code.data);
      if (detected) {
        handleRecognizeEquipment(detected);
        // 扫码成功后暂停持续高频扫描 1.5 秒
        setTimeout(() => {
          if (isCameraActive) {
            scanAnimationRef.current = requestAnimationFrame(scanFrame);
          }
        }, 1500);
        return;
      }
    }

    scanAnimationRef.current = requestAnimationFrame(scanFrame);
  }, [findEquipmentByCode, handleRecognizeEquipment, isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        stopCamera();
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        scanAnimationRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn('Camera stream could not start:', err);
      setCameraError(
        err.name === 'NotAllowedError' 
          ? '请允许浏览器访问摄像头权限后重试' 
          : '无法启动摄像头设备，您可使用图片扫码或一键快速选择测试'
      );
      setIsCameraActive(false);
    }
  };

  // 翻转摄像头
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  // 切换闪光灯
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      if (capabilities.torch) {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({ advanced: [{ torch: nextTorch }] });
        setIsTorchOn(nextTorch);
      } else {
        showToast('当前摄像头硬件不支持闪光灯补光', 'warn');
      }
    } catch (e) {
      showToast('手电筒调用失败', 'warn');
    }
  };

  // 组件卸载时清理摄像头
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 相册二维码图片识别
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          const detected = findEquipmentByCode(code.data);
          if (detected) {
            handleRecognizeEquipment(detected);
          } else {
            showToast(`识别到二维码内容: "${code.data}"，但未在台账中匹配到相应设备`, 'warn');
          }
        } else {
          showToast('未能从所选图片中解析出有效二维码', 'warn');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 截取当前摄像头画面作为现场存证照片
  const captureCameraSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoProof(dataUrl);
        showToast('已截取当前摄像头画面作为现场存证照片', 'success');
        playScanBeep(true, soundEnabled);
        triggerHaptic();
      }
    } catch (e) {
      showToast('无法截取画面，请点击上传照片', 'warn');
    }
  };

  // 上传现场存证照片
  const handleProofPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setPhotoProof(res);
        showToast('已上传现场存证照片', 'success');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 巡检结论提交：在位完好 · 确认打卡
  const handleConfirmInPlacePass = () => {
    if (!activeEquipment) return;

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newRecord: MobileInspectionAuditRecord = {
      id: `INSP-${Date.now().toString().slice(-6)}`,
      equipmentId: activeEquipment.id,
      equipmentName: activeEquipment.name,
      equipmentModel: activeEquipment.model || '-',
      department: activeEquipment.department,
      recordedLocation: activeEquipment.location || `${activeEquipment.building || ''} ${activeEquipment.floor || ''}`,
      actualLocation: activeEquipment.location || `${activeEquipment.building || ''} ${activeEquipment.floor || ''}`,
      locationMatched: true,
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectorRole: currentUser.role,
      inspectionTime: timeStr,
      result: 'normal_present',
      statusSnapshot: activeEquipment.status,
      appearanceCondition: appearanceOk ? '完好' : '轻微磨损',
      electricalSafe: electricalOk,
      accessoriesComplete: accessoriesOk,
      cleanliness: cleanlinessOk ? '清洁完好' : '待消毒保养',
      batteryCondition: batteryOk ? '正常待命' : '电量偏低',
      remarks: inspectionNotes || '巡检在位，外观性能良好',
      fieldPhotoUrl: photoProof || undefined
    };

    setInspectionRecords(prev => [newRecord, ...prev]);
    showToast(`✅ ${activeEquipment.name} 巡检在位核查已完成！`);
    playScanBeep(true, soundEnabled);
    triggerHaptic();
  };

  // 提交位置纠偏并更新
  const handleConfirmLocationFix = () => {
    if (!activeEquipment) return;

    const newLocationStr = `${targetBuilding} ${targetFloor} ${targetRoom}`.trim();
    if (onUpdateEquipmentLocation) {
      onUpdateEquipmentLocation(activeEquipment.id, newLocationStr, targetBuilding, targetFloor, selectedDeptName);
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newRecord: MobileInspectionAuditRecord = {
      id: `INSP-${Date.now().toString().slice(-6)}`,
      equipmentId: activeEquipment.id,
      equipmentName: activeEquipment.name,
      equipmentModel: activeEquipment.model || '-',
      department: selectedDeptName,
      recordedLocation: activeEquipment.location || '未登记',
      actualLocation: newLocationStr,
      locationMatched: false,
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectorRole: currentUser.role,
      inspectionTime: timeStr,
      result: 'location_discrepancy',
      statusSnapshot: activeEquipment.status,
      appearanceCondition: '完好',
      electricalSafe: true,
      accessoriesComplete: true,
      cleanliness: '清洁完好',
      remarks: `现场纠偏位置: 原[${activeEquipment.location}] -> 新[${newLocationStr}]`,
      fieldPhotoUrl: photoProof || undefined
    };

    setInspectionRecords(prev => [newRecord, ...prev]);
    setIsLocationFixOpen(false);
    showToast(`📍 已将设备位置纠偏并同步保存为: ${newLocationStr}`);
    playScanBeep(true, soundEnabled);
    triggerHaptic();
  };

  // 提交现场极速故障报修
  const handleQuickRepairSubmit = () => {
    if (!activeEquipment || !repairFaultDesc.trim()) {
      showToast('请输入故障具体现象描述', 'warn');
      return;
    }

    const repairPayload = {
      equipmentId: activeEquipment.id,
      equipmentName: activeEquipment.name,
      equipmentSn: activeEquipment.sn,
      faultDate: new Date().toISOString().split('T')[0],
      repairType: '紧急故障维修',
      faultDescription: `【移动巡检现场直报】${repairFaultDesc} (紧急度: ${repairUrgency})`,
      technician: currentUser.name || '移动端巡检工程师',
      cost: 0,
      resolution: '待工程师响应排查',
      status: '处理中'
    };

    if (onSubmitRepair) {
      onSubmitRepair(repairPayload);
    }
    if (onSubmitStatusChange) {
      onSubmitStatusChange(activeEquipment.id, '故障待修', `移动扫码巡检报修: ${repairFaultDesc}`, currentUser.name);
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newRecord: MobileInspectionAuditRecord = {
      id: `INSP-${Date.now().toString().slice(-6)}`,
      equipmentId: activeEquipment.id,
      equipmentName: activeEquipment.name,
      equipmentModel: activeEquipment.model || '-',
      department: activeEquipment.department,
      recordedLocation: activeEquipment.location || '',
      actualLocation: activeEquipment.location || '',
      locationMatched: true,
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectorRole: currentUser.role,
      inspectionTime: timeStr,
      result: 'fault_reported',
      statusSnapshot: '故障待修',
      appearanceCondition: appearanceOk ? '完好' : '破损严重',
      electricalSafe: electricalOk,
      accessoriesComplete: accessoriesOk,
      cleanliness: '清洁完好',
      remarks: `现场报修: ${repairFaultDesc}`,
      fieldPhotoUrl: photoProof || undefined
    };

    setInspectionRecords(prev => [newRecord, ...prev]);
    setIsQuickRepairOpen(false);
    showToast(`🚨 报修工单已生成，设备状态已切换为【故障待修】！`);
    playScanBeep(false, soundEnabled);
    triggerHaptic();
  };

  // 批量一键核验本科室待盘设备
  const handleBatchConfirmInPlace = () => {
    const pendingDevices = deptEquipmentList.filter(e => !inspectionRecords.some(r => r.equipmentId === e.id));
    if (pendingDevices.length === 0) {
      showToast('本科室所有设备均已完成盘点，无需批量核验', 'warn');
      setIsBatchAuditModalOpen(false);
      return;
    }

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    const newRecords: MobileInspectionAuditRecord[] = pendingDevices.map((dev, idx) => ({
      id: `INSP-BATCH-${Date.now().toString().slice(-5)}-${idx + 1}`,
      equipmentId: dev.id,
      equipmentName: dev.name,
      equipmentModel: dev.model || '-',
      department: dev.department,
      recordedLocation: dev.location || `${dev.building || ''} ${dev.floor || ''}`,
      actualLocation: dev.location || `${dev.building || ''} ${dev.floor || ''}`,
      locationMatched: true,
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectorRole: currentUser.role,
      inspectionTime: timeStr,
      result: 'normal_present',
      statusSnapshot: dev.status,
      appearanceCondition: '完好',
      electricalSafe: true,
      accessoriesComplete: true,
      cleanliness: '清洁完好',
      batteryCondition: '正常待命',
      remarks: '科室现场集中盘点 · 批量合规在位确认'
    }));

    setInspectionRecords(prev => [...newRecords, ...prev]);
    setIsBatchAuditModalOpen(false);
    showToast(`✅ 已成功批量完成【${selectedDeptName}】${pendingDevices.length} 台设备在位核验！`);
    playScanBeep(true, soundEnabled);
    triggerHaptic();
  };

  // 导出 CSV 盘点报告
  const handleExportCsvAuditReport = () => {
    if (deptEquipmentList.length === 0) {
      showToast('当前科室暂无设备可导出', 'warn');
      return;
    }
    const headers = ['序号', '设备名称', '资产编号', '规格型号', '科室', '账面位置', '现场核验位置', '位置是否相符', '盘点状态', '核验时间', '巡检员', '备注说明'];
    const rows = deptEquipmentList.map((eq, index) => {
      const rec = inspectionRecords.find(r => r.equipmentId === eq.id);
      return [
        index + 1,
        `"${(eq.name || '').replace(/"/g, '""')}"`,
        `"${(eq.assetNo || eq.id || '').replace(/"/g, '""')}"`,
        `"${(eq.model || '').replace(/"/g, '""')}"`,
        `"${(eq.department || '').replace(/"/g, '""')}"`,
        `"${(eq.location || '').replace(/"/g, '""')}"`,
        `"${(rec?.actualLocation || eq.location || '').replace(/"/g, '""')}"`,
        rec ? (rec.locationMatched ? '相符' : '位置异常纠偏') : '未核验',
        rec ? (rec.result === 'normal_present' ? '在位合规' : rec.result === 'location_discrepancy' ? '纠偏更新' : '报修待修') : '待核验',
        rec?.inspectionTime || '-',
        rec?.inspectorName || '-',
        `"${(rec?.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `科室设备盘点报表_${selectedDeptName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`已成功导出【${selectedDeptName}】盘点明细 CSV 报表`);
  };

  // 快捷模拟扫码候选设备 (取本科室或全院急救监护代表设备)
  const quickDemoDevices = useMemo(() => {
    const list = deptEquipmentList.length > 0 ? deptEquipmentList : equipmentList;
    return list.slice(0, 8);
  }, [deptEquipmentList, equipmentList]);

  // 打印科室盘点清册
  const handlePrintAuditSheet = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = deptEquipmentList.map((eq, idx) => {
      const record = inspectionRecords.find(r => r.equipmentId === eq.id);
      const isAudited = Boolean(record);
      const statusText = record ? (
        record.result === 'normal_present' ? '在位合格' :
        record.result === 'location_discrepancy' ? '位置纠偏' :
        record.result === 'fault_reported' ? '现场报修' : '异常'
      ) : '待盘点';

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; font-size: 11px;">
          <td style="padding: 6px 8px;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-weight: bold;">${eq.name}</td>
          <td style="padding: 6px 8px; font-family: monospace;">${eq.assetNo || eq.id}</td>
          <td style="padding: 6px 8px;">${eq.model || '-'}</td>
          <td style="padding: 6px 8px;">${eq.location || '-'}</td>
          <td style="padding: 6px 8px;">${eq.status}</td>
          <td style="padding: 6px 8px; font-weight: bold; color: ${isAudited ? '#047857' : '#b45309'};">
            ${statusText}
          </td>
          <td style="padding: 6px 8px; font-size: 10px;">${record ? record.inspectionTime : '-'}</td>
          <td style="padding: 6px 8px; font-size: 10px;">${record ? record.inspectorName : '-'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>医疗设备盘点清册 - ${selectedDeptName}</title>
          <style>
            @media print { body { padding: 15px; } }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; }
            h1 { font-size: 18px; margin: 0 0 6px 0; text-align: center; }
            .sub { font-size: 12px; color: #475569; text-align: center; margin-bottom: 16px; }
            .info-bar { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { background: #f1f5f9; padding: 6px 8px; font-size: 11px; text-align: left; border-bottom: 2px solid #94a3b8; }
            .footer-sign { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; padding-top: 10px; border-top: 1px dashed #94a3b8; }
          </style>
        </head>
        <body>
          <h1>三甲综合医院 • 科室医疗设备移动巡检与资产盘点清册</h1>
          <div class="sub">盘点科室：${selectedDeptName} ｜ 盘点日期：${new Date().toLocaleDateString('zh-CN')} ｜ 盘点负责人：${currentUser.name} (${currentUser.role})</div>
          
          <div class="info-bar">
            <span>应盘设备总数：<strong>${auditStats.totalCount}</strong> 台</span>
            <span>已盘在位数量：<strong>${auditStats.auditedCount}</strong> 台</span>
            <span>盘点核查覆盖率：<strong>${auditStats.coveragePercent}%</strong></span>
            <span>异常与纠偏：<strong>${auditStats.discrepancyCount}</strong> 台</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px;">序号</th>
                <th>设备名称</th>
                <th>资产编号/ID</th>
                <th>规格型号</th>
                <th>存放房间/位置</th>
                <th>运行状态</th>
                <th>盘点结论</th>
                <th>核验时间</th>
                <th>核对人</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-sign">
            <div>临床科室护士长/责任人签字：____________________ 日期：___________</div>
            <div>医学工程处巡检工程师签字：____________________ 日期：___________</div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-100 overflow-hidden relative select-none">
      {/* Toast 悬浮提示 */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs md:text-sm font-bold border ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-amber-600 text-white border-amber-500'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 顶部控制栏 */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-slate-900 truncate">
                手机扫码巡检 / 快速盘点
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                PDA 智能终端
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              支持摄像头实时扫码、条码枪速录、位置纠偏、状态体检与现场一键报修
            </p>
          </div>
        </div>

        {/* 交互模式与操作按钮 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 科室筛选选择器 */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium hidden md:inline">盘点科室:</span>
            <select
              value={selectedDeptName}
              onChange={(e) => {
                setSelectedDeptName(e.target.value);
                setActiveEquipment(null);
              }}
              className="bg-transparent font-bold text-slate-800 outline-hidden cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 音频提示开关 */}
          <button
            onClick={toggleSound}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              soundEnabled ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-300 text-slate-400'
            }`}
            title={soundEnabled ? "扫码音效: 已开启 (点击静音)" : "扫码音效: 已静音 (点击开启)"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{soundEnabled ? '音效开启' : '静音'}</span>
          </button>

          {/* 批量打印标签贴 */}
          {onOpenQrModal && (
            <button
              onClick={() => onOpenQrModal(deptEquipmentList)}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="批量打印当前科室所有设备机身标签贴"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden md:inline">打印科室标签卡</span>
            </button>
          )}

          {/* 打印盘点表 */}
          <button
            onClick={handlePrintAuditSheet}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="打印当前科室盘点报告清册"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">导出盘点单</span>
          </button>

          {/* 模式切换: 手机PDA vs 全景工作台 */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
            <button
              onClick={() => setViewMode('handheld')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'handheld'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>手持PDA</span>
            </button>
            <button
              onClick={() => setViewMode('console')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'console'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>全景盘点台</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主体视窗区域 */}
      <div className="flex-1 p-2 md:p-3.5 overflow-hidden flex min-h-0">
        {viewMode === 'handheld' ? (
          /* =========================================================================
             1. 手机手持移动终端模式 (Mobile Handheld PDA Terminal Simulation)
             ========================================================================= */
          <div className="w-full h-full flex items-center justify-center overflow-y-auto py-1">
            {/* 模拟手机机身 */}
            <div className="w-full max-w-[430px] h-[98%] max-h-[840px] bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-700 flex flex-col relative overflow-hidden">
              {/* 手机听筒和摄像头开孔 */}
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-1.5 shrink-0 flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-900 rounded-full ml-3 border border-slate-700"></div>
              </div>

              {/* 模拟屏幕内部 */}
              <div className="flex-1 bg-slate-50 rounded-[28px] overflow-hidden flex flex-col border border-slate-800/20 relative shadow-inner">
                {/* 模拟系统状态栏 */}
                <div className="h-6 bg-slate-900 text-white px-4 flex items-center justify-between text-[10px] font-mono shrink-0 select-none">
                  <span>{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-[9px] font-sans font-bold bg-indigo-500/30 text-indigo-300 px-1 rounded">5G</span>
                    <Wifi className="w-3 h-3" />
                    <Battery className="w-3.5 h-3.5" />
                    <span>98%</span>
                  </div>
                </div>

                {/* 移动端标题头 */}
                <div className="bg-indigo-700 text-white px-3.5 py-2 flex items-center justify-between shrink-0 shadow-xs">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span className="truncate">{selectedDeptName}</span>
                      <span className="text-[10px] bg-indigo-900/60 px-1.5 py-0.2 rounded font-normal">
                        巡检中
                      </span>
                    </div>
                    <div className="text-[10px] text-indigo-200 mt-0.5 truncate">
                      巡检员: {currentUser.name} ({currentUser.role})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-200 font-mono">已盘/应盘</div>
                    <div className="text-xs font-black font-mono">
                      {auditStats.auditedCount} / {auditStats.totalCount} ({auditStats.coveragePercent}%)
                    </div>
                  </div>
                </div>

                {/* 移动端滚动操作区 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {/* 1. 摄像头扫码视口区 */}
                  <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-md relative border border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                    {isCameraActive ? (
                      <div className="relative w-full h-[220px] bg-black flex items-center justify-center overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* 扫描瞄准十字架与激光扫描线 */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-44 h-44 border-2 border-emerald-400 rounded-xl relative shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                            {/* 四个高亮角标 */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                            {/* 扫描动画激光红线 */}
                            <div className="w-full h-0.5 bg-emerald-400 absolute top-0 animate-pulse shadow-[0_0_8px_#34d399]"></div>
                          </div>
                        </div>

                        {/* 摄像头悬浮控制按钮 */}
                        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2 text-white text-xs z-10">
                          <button
                            onClick={toggleTorch}
                            className={`p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
                              isTorchOn ? 'bg-amber-500 text-white' : 'bg-slate-800/80 text-slate-200'
                            }`}
                            title="手电筒补光"
                          >
                            <Flashlight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={captureCameraSnapshot}
                            className="px-2.5 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white backdrop-blur-md transition cursor-pointer flex items-center gap-1 shadow-sm"
                            title="截取当前画面作为现场存证"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">拍照存证</span>
                          </button>
                          <button
                            onClick={toggleCameraFacing}
                            className="p-2 rounded-full bg-slate-800/80 backdrop-blur-md text-slate-200 hover:text-white transition cursor-pointer"
                            title="翻转镜头"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 摄像头未启动状态 */
                      <div className="p-5 text-center text-slate-300 flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">开启摄像头扫码识别</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            支持扫描机身二维标签、国标SN条形码
                          </div>
                        </div>
                        {cameraError && (
                          <div className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-800/50">
                            {cameraError}
                          </div>
                        )}
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>启动现场摄像头</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. 辅助快速录入与照片上传 */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={manualKeyword}
                          onChange={(e) => setManualKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && manualKeyword.trim()) {
                              const found = findEquipmentByCode(manualKeyword.trim());
                              if (found) {
                                handleRecognizeEquipment(found);
                                setManualKeyword('');
                              } else {
                                showToast(`未查找到匹配编号为 [${manualKeyword}] 的设备`, 'warn');
                              }
                            }
                          }}
                          placeholder="手动输入资产号/SN或扫码枪输入..."
                          className="w-full pl-8 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      {/* 上传图片识别 */}
                      <label className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>图片</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* 常见急救重症设备一键快捷选取 */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                        <span>科室待巡检设备快速选取:</span>
                        <span className="text-indigo-600 font-mono">共{quickDemoDevices.length}台</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {quickDemoDevices.map(eq => (
                          <button
                            key={eq.id}
                            onClick={() => handleRecognizeEquipment(eq)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold border transition truncate max-w-[170px] cursor-pointer ${
                              activeEquipment?.id === eq.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {eq.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. 已扫描设备“体检档案卡”与现场核查 */}
                  {activeEquipment ? (
                    <div className="bg-white rounded-2xl p-3 border-2 border-indigo-500/40 shadow-sm space-y-3">
                      {/* 头部信息 */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 overflow-hidden font-bold">
                            {activeEquipment.photoUrl ? (
                              <img src={activeEquipment.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShieldCheck className="w-6 h-6 text-indigo-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">
                              {activeEquipment.name}
                            </h4>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                              资产编号: <span className="font-bold text-indigo-700">{activeEquipment.assetNo || activeEquipment.id}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              SN: {activeEquipment.sn || '-'} ｜ 型号: {activeEquipment.model || '-'}
                            </div>
                          </div>
                        </div>

                        {/* 状态徽章 */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 border ${
                          activeEquipment.status === '正常运行'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : activeEquipment.status === '故障待修'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {activeEquipment.status}
                        </span>
                      </div>

                      {/* 位置核实与纠偏提示 */}
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-indigo-600" />
                            登记位置:
                          </span>
                          <span className="font-bold text-slate-800 truncate">
                            {activeEquipment.location || `${activeEquipment.building || ''} ${activeEquipment.floor || ''}`}
                          </span>
                        </div>

                        {/* 是否存在位置偏差判断 */}
                        {activeEquipment.department !== selectedDeptName ? (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1 min-w-0 truncate">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">
                                登记归属为【{activeEquipment.department}】，实际在【{selectedDeptName}】
                              </span>
                            </div>
                            <button
                              onClick={() => setIsLocationFixOpen(true)}
                              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer"
                            >
                              纠偏更新
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-emerald-700">
                            <span className="flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              科室位置相符在册
                            </span>
                            <button
                              onClick={() => setIsLocationFixOpen(true)}
                              className="text-[10px] text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                            >
                              变更房间
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 借用状态进度条 (若设备处于借出状态) */}
                      {activeEquipment.currentLoan && activeEquipment.currentLoan.loanStatus !== 'returned' && (
                        <div className="p-2.5 bg-cyan-50/60 border border-cyan-200 rounded-xl">
                          <div className="text-[11px] font-extrabold text-cyan-900 mb-1 flex items-center justify-between">
                            <span>应急调配借用中</span>
                            <span className="font-mono text-[10px]">
                              借用科室: {activeEquipment.currentLoan.borrowingDepartment}
                            </span>
                          </div>
                          <LoanTimeProgressBar
                            loan={activeEquipment.currentLoan as any}
                            mode="compact"
                          />
                        </div>
                      )}

                      {/* 超期服役与特许准用重点质控特别提示 */}
                      {(() => {
                        const vInfo = getEquipmentValidityInfo(activeEquipment);
                        if (!vInfo.isExpired) return null;

                        if (vInfo.isFilingActive) {
                          return (
                            <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1 font-bold text-emerald-900">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  <span>特许准用重点质控巡检设备</span>
                                </div>
                                <span className="font-mono text-[10px] font-bold text-emerald-800 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
                                  备案号: {vInfo.overdueFiling?.filingNo}
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-800">
                                该设备超期服役 +{vInfo.yearsPast}年，已通过 72h 连续运行稳定性测试。准用有效截止至 <strong>{vInfo.overdueFiling?.validUntil}</strong>。请特别复核电气安全与关键参数零点漂移！
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1 font-bold text-amber-900">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <span>超期待备案/评估设备 (超期 +{vInfo.yearsPast}年)</span>
                              </div>
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                待备案
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              出厂设计寿命已届满，尚未取得特许准用备案批文。巡检中如发现性能漂移或安全隐患，请立即申请报修或建议提请医学装备委员会评估！
                            </p>
                          </div>
                        );
                      })()}

                      {/* 现场核查打卡清单 (Checklist) */}
                      <div className="space-y-1.5 text-xs">
                        <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                          <span>现场体检核对项:</span>
                          <span className="text-[10px] text-indigo-600">全部合格自动通过</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <label className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={appearanceOk}
                              onChange={(e) => setAppearanceOk(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-0"
                            />
                            <span className="truncate">主机外壳无破损</span>
                          </label>

                          <label className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={electricalOk}
                              onChange={(e) => setElectricalOk(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-0"
                            />
                            <span className="truncate">电源/接地良好</span>
                          </label>

                          <label className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={accessoriesOk}
                              onChange={(e) => setAccessoriesOk(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-0"
                            />
                            <span className="truncate">随机附件导联齐全</span>
                          </label>

                          <label className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cleanlinessOk}
                              onChange={(e) => setCleanlinessOk(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-0"
                            />
                            <span className="truncate">清洁无污物残留</span>
                          </label>

                          <label className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={batteryOk}
                              onChange={(e) => setBatteryOk(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-0"
                            />
                            <span className="truncate">备用电池正常待命</span>
                          </label>
                        </div>

                        {/* 现场存证照片板块 */}
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                              现场照片存证:
                            </span>
                            {photoProof && (
                              <button
                                type="button"
                                onClick={() => setPhotoProof(null)}
                                className="text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>移除照片</span>
                              </button>
                            )}
                          </div>

                          {photoProof ? (
                            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 group">
                              <img src={photoProof} alt="现场存证" className="w-full h-24 object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                                存证已载入 (将关联至打卡记录)
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {isCameraActive && (
                                <button
                                  type="button"
                                  onClick={captureCameraSnapshot}
                                  className="flex-1 py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>抓取当前帧</span>
                                </button>
                              )}
                              <label className="flex-1 py-1 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer">
                                <Upload className="w-3 h-3" />
                                <span>上传现场照片</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handleProofPhotoUpload}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 巡检核查动作按钮栏 */}
                      <div className="pt-2 flex items-center gap-1.5">
                        {/* 1. 正常在位合格打卡 */}
                        <button
                          onClick={handleConfirmInPlacePass}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>在位完好 · 确认打卡</span>
                        </button>

                        {/* 2. 现场极速报修 */}
                        <button
                          onClick={() => setIsQuickRepairOpen(true)}
                          className="px-2.5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-md"
                          title="现场发现故障极速报修"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>极速报修</span>
                        </button>

                        {/* 3. 打印机身标签二维码贴 */}
                        {onOpenQrModal && (
                          <button
                            type="button"
                            onClick={() => onOpenQrModal([activeEquipment])}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-xs border border-slate-200"
                            title="打印机身标签二维码贴"
                          >
                            <QrCode className="w-4 h-4 text-indigo-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 提示卡 */
                    <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-300 text-slate-400 space-y-2">
                      <QrCode className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-xs font-bold text-slate-600">等待扫描医疗设备资产标识卡</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                        可通过开启上方摄像头对准二维码，或在快捷测试栏点击任意设备即可载入核对。
                      </div>
                    </div>
                  )}

                  {/* 4. 今日巡检记录简报 */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        最近巡检流水 (今日)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">共 {inspectionRecords.length} 条</span>
                    </div>

                    {inspectionRecords.length === 0 ? (
                      <div className="text-[11px] text-slate-400 py-3 text-center">
                        暂无巡检核查记录，扫描并确认后自动记录
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {inspectionRecords.slice(0, 5).map((rec) => (
                          <div
                            key={rec.id}
                            onClick={() => setSelectedRecordDetail(rec)}
                            className="p-2 bg-slate-50 hover:bg-indigo-50/70 rounded-lg border border-slate-100 flex items-center justify-between text-[11px] cursor-pointer transition"
                            title="点击查看详细巡检存证凭证"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-slate-800 truncate flex items-center gap-1">
                                <span>{rec.equipmentName}</span>
                                {rec.fieldPhotoUrl && (
                                  <Camera className="w-3 h-3 text-indigo-500 shrink-0" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono truncate">
                                {rec.inspectionTime.split(' ')[1] || rec.inspectionTime} ｜ 核对人: {rec.inspectorName}
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              rec.result === 'normal_present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.result === 'location_discrepancy'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {rec.result === 'normal_present' ? '在位合格' : rec.result === 'location_discrepancy' ? '位置纠偏' : '现场报修'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 移动端底部轻量工具栏 */}
                <div className="h-10 bg-white border-t border-slate-200 px-4 flex items-center justify-around text-xs text-slate-600 shrink-0 select-none">
                  <span className="font-semibold text-indigo-700">扫码巡检</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-slate-500">科室资产 ({deptEquipmentList.length})</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-slate-500">巡检流水</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             2. 全景科室巡检工作台模式 (Inspection Console View)
             ========================================================================= */
          <div className="w-full h-full flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
            {/* 左侧: 摄像头扫码与即时识别卡 */}
            <div className="w-full md:w-[380px] flex-none flex flex-col gap-3 min-h-0 overflow-y-auto">
              {/* 摄像头与扫码卡片 */}
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    现场扫码识别终端
                  </h3>
                  <button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isCameraActive
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>{isCameraActive ? '关闭摄像头' : '启动摄像头'}</span>
                  </button>
                </div>

                {isCameraActive ? (
                  <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-36 h-36 border-2 border-emerald-400 rounded-lg relative">
                        <div className="w-full h-0.5 bg-emerald-400 absolute top-0 animate-pulse shadow-md"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Camera className="w-6 h-6 text-slate-300 mb-1" />
                    <span>点击右上角启动摄像头或在下方快捷选择</span>
                  </div>
                )}

                {/* 快速扫码输入 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualKeyword}
                    onChange={(e) => setManualKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualKeyword.trim()) {
                        const f = findEquipmentByCode(manualKeyword.trim());
                        if (f) {
                          handleRecognizeEquipment(f);
                          setManualKeyword('');
                        }
                      }
                    }}
                    placeholder="输入设备资产号 / 序列号..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                  <label className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>图片</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {/* 快速定位科室代表设备 */}
                <div>
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">本科室代表设备快速定位:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickDemoDevices.map(eq => (
                      <button
                        key={eq.id}
                        onClick={() => handleRecognizeEquipment(eq)}
                        className={`px-2 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                          activeEquipment?.id === eq.id
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {eq.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 当前激活设备卡片 */}
              {activeEquipment && (
                <div className="bg-white rounded-xl border border-indigo-200 p-3.5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{activeEquipment.name}</h4>
                      <div className="text-xs text-indigo-700 font-mono font-bold mt-0.5">
                        {activeEquipment.assetNo || activeEquipment.id}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SN: {activeEquipment.sn} ｜ 型号: {activeEquipment.model}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      {activeEquipment.status}
                    </span>
                  </div>

                  {/* 位置对比 */}
                  <div className="p-2 bg-slate-50 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">系统登记位置:</span>
                      <span className="font-bold text-slate-800">{activeEquipment.location || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">当前巡检科室:</span>
                      <span className="font-bold text-indigo-700">{selectedDeptName}</span>
                    </div>
                  </div>

                  {/* 现场存证照片预览与上传 */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        现场存证照片:
                      </span>
                      {photoProof && (
                        <button
                          type="button"
                          onClick={() => setPhotoProof(null)}
                          className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          移除照片
                        </button>
                      )}
                    </div>
                    {photoProof ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-24">
                        <img src={photoProof} alt="现场照片" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <label className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>上传现场设备存证照片</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProofPhotoUpload}
                        />
                      </label>
                    )}
                  </div>

                  {/* 快速动作 */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleConfirmInPlacePass}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>在位合格打卡</span>
                    </button>
                    <button
                      onClick={() => setIsLocationFixOpen(true)}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                      title="校准位置"
                    >
                      位置纠偏
                    </button>
                    <button
                      onClick={() => setIsQuickRepairOpen(true)}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                      title="极速报修"
                    >
                      报修
                    </button>
                    {onOpenQrModal && (
                      <button
                        onClick={() => onOpenQrModal([activeEquipment])}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                        title="打印机身二维码标签"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 右侧: 科室设备盘点总览清册与统计 */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
              {/* 统计指标卡 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-bold">应盘总台数</div>
                  <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                    {auditStats.totalCount} <span className="text-xs font-normal text-slate-500">台</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-emerald-600 font-bold">已盘在位核验</div>
                  <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                    {auditStats.auditedCount} <span className="text-xs font-normal text-slate-500">台</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-indigo-600 font-bold">盘点覆盖率</div>
                  <div className="text-xl font-black text-indigo-700 mt-1 font-mono">
                    {auditStats.coveragePercent}%
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-amber-600 font-bold">位置纠偏 / 异常</div>
                  <div className="text-xl font-black text-amber-700 mt-1 font-mono">
                    {auditStats.discrepancyCount} <span className="text-xs font-normal text-slate-500">项</span>
                  </div>
                </div>
              </div>

              {/* 科室设备盘点表格与多维检索工具栏 */}
              <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-0 overflow-hidden">
                {/* 表格顶部检索与操作栏 */}
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={consoleSearch}
                        onChange={(e) => setConsoleSearch(e.target.value)}
                        placeholder="搜索设备名称、编号、SN、位置..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                      />
                      {consoleSearch && (
                        <button
                          onClick={() => setConsoleSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 状态筛选切换器 */}
                    <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs">
                      {[
                        { key: 'all', label: '全部', count: deptEquipmentList.length },
                        { key: 'pending', label: '待核验', count: auditStats.pendingCount },
                        { key: 'audited', label: '在位合规', count: auditStats.auditedCount },
                        { key: 'discrepancy', label: '位置纠偏', count: auditStats.discrepancyCount }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setConsoleFilterStatus(tab.key as any)}
                          className={`px-2 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                            consoleFilterStatus === tab.key
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 动作按钮群 */}
                  <div className="flex items-center gap-2">
                    {/* 一键批量盘点 */}
                    <button
                      onClick={() => setIsBatchAuditModalOpen(true)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title="快速批量核验当前科室待盘设备"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>一键批量核验 ({auditStats.pendingCount})</span>
                    </button>

                    {/* 导出 CSV */}
                    <button
                      onClick={handleExportCsvAuditReport}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title="导出 CSV 盘点报告表格"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>导出CSV</span>
                    </button>

                    {/* 打印清册 */}
                    <button
                      onClick={handlePrintAuditSheet}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                      title="打印/导出科室设备盘点报告"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>打印盘点单</span>
                    </button>

                    {/* 批量打印标签 */}
                    {onOpenQrModal && (
                      <button
                        onClick={() => onOpenQrModal(deptEquipmentList)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        title="批量打印当前科室所有设备机身标签卡"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden md:inline">标签卡</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 表格内容 */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-2.5 px-3">序号</th>
                        <th className="py-2.5 px-3">设备名称</th>
                        <th className="py-2.5 px-3">资产编号</th>
                        <th className="py-2.5 px-3">规格型号</th>
                        <th className="py-2.5 px-3">账面登记位置</th>
                        <th className="py-2.5 px-3">现场核验位置</th>
                        <th className="py-2.5 px-3">设备状态</th>
                        <th className="py-2.5 px-3">盘点核验结论</th>
                        <th className="py-2.5 px-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredConsoleList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-10 text-center text-slate-400">
                            未检索到符合条件的科室设备
                          </td>
                        </tr>
                      ) : (
                        paginatedConsoleList.map((eq, idx) => {
                          const rec = inspectionRecords.find(r => r.equipmentId === eq.id);
                          const isAudited = Boolean(rec);

                          return (
                            <tr
                              key={eq.id}
                              className={`hover:bg-slate-50/80 transition cursor-pointer ${
                                activeEquipment?.id === eq.id ? 'bg-indigo-50/60 font-medium' : ''
                              }`}
                              onClick={() => handleRecognizeEquipment(eq)}
                            >
                              <td className="py-2.5 px-3 font-mono text-slate-500">{(consolePage - 1) * consolePageSize + idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{eq.name}</span>
                                  {rec?.fieldPhotoUrl && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (rec) setSelectedRecordDetail(rec);
                                      }}
                                      title="已附加现场存证照片"
                                      className="text-indigo-600 hover:text-indigo-800"
                                    >
                                      <Camera className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-indigo-700">{eq.assetNo || eq.id}</td>
                              <td className="py-2.5 px-3 text-slate-600">{eq.model || '-'}</td>
                              <td className="py-2.5 px-3 text-slate-600">{eq.location || '-'}</td>
                              <td className="py-2.5 px-3 font-medium">
                                {rec ? (
                                  <span className={rec.locationMatched ? 'text-slate-700' : 'text-amber-700 font-bold'}>
                                    {rec.actualLocation}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  eq.status === '正常运行' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {eq.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                {isAudited && rec ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      rec.result === 'normal_present'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : rec.result === 'location_discrepancy'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {rec.result === 'normal_present' ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3" />
                                          在位合规
                                        </>
                                      ) : rec.result === 'location_discrepancy' ? (
                                        <>
                                          <MapPin className="w-3 h-3" />
                                          位置纠偏
                                        </>
                                      ) : (
                                        <>
                                          <Wrench className="w-3 h-3" />
                                          现场报修
                                        </>
                                      )}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRecordDetail(rec);
                                      }}
                                      className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-semibold cursor-pointer"
                                      title="查看详细凭据与存证"
                                    >
                                      凭据
                                    </button>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                                    <Clock className="w-3.5 h-3.5" />
                                    待核验
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleRecognizeEquipment(eq)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold transition cursor-pointer"
                                  >
                                    {isAudited ? '重核' : '核验打卡'}
                                  </button>
                                  {onOpenQrModal && (
                                    <button
                                      onClick={() => onOpenQrModal([eq])}
                                      className="p-1 hover:bg-slate-200 text-slate-500 rounded transition cursor-pointer"
                                      title="打印此设备标签贴"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Console Footer Pagination */}
                <Pagination
                  currentPage={consolePage}
                  pageSize={consolePageSize}
                  totalCount={filteredConsoleList.length}
                  onPageChange={setConsolePage}
                  onPageSizeChange={(sz) => {
                    setConsolePageSize(sz);
                    setConsolePage(1);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= 位置纠偏 Modal ================= */}
      {isLocationFixOpen && activeEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                现场设备位置校准与纠偏
              </h3>
              <button
                onClick={() => setIsLocationFixOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{activeEquipment.name}</div>
                <div className="text-slate-500 mt-1">原系统登记位置: {activeEquipment.location || '未登记'}</div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">所在院区 / 楼宇:</label>
                <input
                  type="text"
                  value={targetBuilding}
                  onChange={(e) => setTargetBuilding(e.target.value)}
                  placeholder="例如: 1号门诊医技大楼"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">所在楼层:</label>
                  <input
                    type="text"
                    value={targetFloor}
                    onChange={(e) => setTargetFloor(e.target.value)}
                    placeholder="如: 3F"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">具体房间/床位:</label>
                  <input
                    type="text"
                    value={targetRoom}
                    onChange={(e) => setTargetRoom(e.target.value)}
                    placeholder="如: 急救抢救室02床"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsLocationFixOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmLocationFix}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                保存纠偏并记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 现场极速报修 Modal ================= */}
      {isQuickRepairOpen && activeEquipment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-600" />
                现场极速报修工单建立
              </h3>
              <button
                onClick={() => setIsQuickRepairOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{activeEquipment.name}</div>
                <div className="text-slate-500 mt-0.5">资产编号: {activeEquipment.assetNo || activeEquipment.id}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  故障现象描述 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={repairFaultDesc}
                  onChange={(e) => setRepairFaultDesc(e.target.value)}
                  placeholder="详细描述现场设备故障现象，如开机报警Code 04、导联线接触不良等..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl h-20 focus:outline-hidden focus:border-rose-500"
                />

                {/* 快捷常用故障词 */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['开机无显示', '自检报错报警', '导联接触不良', '电池充不进电', '管路接口漏气'].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setRepairFaultDesc(prev => prev ? `${prev}，${w}` : w)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-50 text-[10px] text-slate-700 hover:text-rose-700 border border-slate-200 cursor-pointer"
                    >
                      +{w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">紧急程度:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRepairUrgency('紧急')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      repairUrgency === '紧急'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    紧急 (急救急诊支持)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepairUrgency('普通')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      repairUrgency === '普通'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    普通 (排单巡检维护)
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsQuickRepairOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleQuickRepairSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                即刻派单直报
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 批量一键盘点确认 Modal ================= */}
      {isBatchAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 bg-emerald-50 flex items-center justify-between">
              <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                科室集中盘点 · 批量一键在位核验
              </h3>
              <button
                onClick={() => setIsBatchAuditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1">
                <div className="font-bold text-emerald-900">
                  即将对【{selectedDeptName}】待盘点的 {auditStats.pendingCount} 台设备生成在位核验记录
                </div>
                <div className="text-emerald-700 leading-relaxed text-[11px]">
                  适用于科室月度例行集中现场巡检。批量将外观完好、电气安全、附件齐全、清洁正常的待盘设备标记为【在位合规】。
                </div>
              </div>

              {/* 待批量核对设备预览清单 */}
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>待核验设备清单:</span>
                  <span className="font-mono text-slate-500 text-[11px]">{auditStats.pendingCount} 台</span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2 text-xs space-y-1">
                  {deptEquipmentList
                    .filter(e => !inspectionRecords.some(r => r.equipmentId === e.id))
                    .map((dev, idx) => (
                      <div key={dev.id} className="py-1 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-800 truncate max-w-[200px]">
                          {idx + 1}. {dev.name}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          {dev.assetNo || dev.id} ｜ {dev.location || '待定位置'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* 盘点员署名 */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-500">巡检核验责任人:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {currentUser.name} ({currentUser.role})
                </span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setIsBatchAuditModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleBatchConfirmInPlace}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>确认批量完成在位核验</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 巡检存证核验凭证详情 Modal ================= */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-indigo-50/70 flex items-center justify-between">
              <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                医疗设备移动巡检 · 在位核验电子存证凭证
              </h3>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* 设备标头信息 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{selectedRecordDetail.equipmentName}</div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      资产编号: {selectedRecordDetail.equipmentId} ｜ 规格: {selectedRecordDetail.equipmentModel}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedRecordDetail.result === 'normal_present'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedRecordDetail.result === 'location_discrepancy'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedRecordDetail.result === 'normal_present' ? '在位合格' : selectedRecordDetail.result === 'location_discrepancy' ? '位置纠偏' : '现场报修'}
                  </span>
                </div>
              </div>

              {/* 位置与流水详情 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px]">账面登记位置</div>
                  <div className="font-bold text-slate-800 mt-0.5 truncate">{selectedRecordDetail.recordedLocation || '-'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-400 text-[10px]">现场实际核对位置</div>
                  <div className={`font-bold mt-0.5 truncate ${selectedRecordDetail.locationMatched ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedRecordDetail.actualLocation || '-'}
                  </div>
                </div>
              </div>

              {/* 性能安全自检清单 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 mb-1">现场巡检自检项目结论:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>外观结构: {selectedRecordDetail.appearanceCondition || '完好'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>电气接地: {selectedRecordDetail.electricalSafe ? '安全良好' : '异常'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>随机配件: {selectedRecordDetail.accessoriesComplete ? '完整齐备' : '缺失'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>清洁消毒: {selectedRecordDetail.cleanliness || '清洁完好'}</span>
                  </div>
                </div>
                {selectedRecordDetail.batteryCondition && (
                  <div className="flex items-center gap-1.5 text-slate-700 text-[11px] pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>蓄电池待命状态: {selectedRecordDetail.batteryCondition}</span>
                  </div>
                )}
              </div>

              {/* 现场存证照片 */}
              {selectedRecordDetail.fieldPhotoUrl && (
                <div>
                  <div className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>现场拍照存证影像:</span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={selectedRecordDetail.fieldPhotoUrl}
                      alt="巡检存证"
                      className="w-full max-h-52 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* 巡检备考与时间印章 */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-[11px] text-slate-500">巡检备注: {selectedRecordDetail.remarks || '无'}</div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>巡检员: {selectedRecordDetail.inspectorName} ({selectedRecordDetail.inspectorRole})</span>
                  <span className="font-mono">记录时间: {selectedRecordDetail.inspectionTime}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="font-mono text-[10px] text-slate-400">凭证编号: {selectedRecordDetail.id}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedRecordDetail(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>医疗设备现场巡检核查凭证 - ${selectedRecordDetail.equipmentName}</title>
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #0f172a; }
                            h2 { text-align: center; margin: 0 0 4px 0; font-size: 18px; }
                            .sub { text-align: center; font-size: 11px; color: #475569; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
                            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
                            th { background: #f8fafc; font-weight: bold; width: 120px; }
                            .photo-box { margin-top: 15px; text-align: center; }
                            .photo-box img { max-height: 200px; border: 1px solid #cbd5e1; border-radius: 4px; }
                            .sign { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; }
                          </style>
                        </head>
                        <body>
                          <h2>三甲综合医院 • 医疗设备现场巡检与资产核对电子存证单</h2>
                          <div class="sub">凭证编号：${selectedRecordDetail.id} ｜ 打印时间：${new Date().toLocaleString('zh-CN')}</div>
                          <table>
                            <tr><th>设备名称</th><td><strong>${selectedRecordDetail.equipmentName}</strong></td><th>资产编号</th><td>${selectedRecordDetail.equipmentId}</td></tr>
                            <tr><th>规格型号</th><td>${selectedRecordDetail.equipmentModel}</td><th>所属科室</th><td>${selectedRecordDetail.department}</td></tr>
                            <tr><th>登记账面位置</th><td>${selectedRecordDetail.recordedLocation}</td><th>现场实际核对位置</th><td>${selectedRecordDetail.actualLocation}</td></tr>
                            <tr><th>核查结论</th><td><strong>${selectedRecordDetail.result === 'normal_present' ? '在位合格' : selectedRecordDetail.result === 'location_discrepancy' ? '位置纠偏' : '现场故障报修'}</strong></td><th>设备状态快照</th><td>${selectedRecordDetail.statusSnapshot}</td></tr>
                            <tr><th>巡检工程师</th><td>${selectedRecordDetail.inspectorName} (${selectedRecordDetail.inspectorRole})</td><th>核验打卡时间</th><td>${selectedRecordDetail.inspectionTime}</td></tr>
                            <tr><th>自检项目</th><td colspan="3">外观: ${selectedRecordDetail.appearanceCondition} ｜ 电气: ${selectedRecordDetail.electricalSafe ? '安全良好' : '异常'} ｜ 配件: ${selectedRecordDetail.accessoriesComplete ? '齐全' : '缺失'} ｜ 清洁: ${selectedRecordDetail.cleanliness}</td></tr>
                            <tr><th>巡检备注说明</th><td colspan="3">${selectedRecordDetail.remarks || '-'}</td></tr>
                          </table>
                          ${selectedRecordDetail.fieldPhotoUrl ? `<div class="photo-box"><div style="font-size: 11px; margin-bottom: 5px;">现场拍照存证照片:</div><img src="${selectedRecordDetail.fieldPhotoUrl}" /></div>` : ''}
                          <div class="sign">
                            <div>科室现场交接人签名：___________________</div>
                            <div>巡检工程师电子签章：[已加密核验] ${selectedRecordDetail.inspectorName}</div>
                          </div>
                          <script>window.onload = function() { window.print(); }</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印存证凭单</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
