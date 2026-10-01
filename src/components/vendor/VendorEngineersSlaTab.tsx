import React, { useState } from 'react';
import { 
  Users, ShieldCheck, Clock, CheckCircle2, Phone, Award, 
  AlertTriangle, Wrench, Calendar, MapPin, Search, Filter, 
  TrendingUp, Radio, Check, ChevronRight, Activity, Zap
} from 'lucide-react';
import { VendorUserAccount } from '../../types/vendorCollaborationTypes';

interface VendorEngineersSlaTabProps {
  currentVendor: VendorUserAccount;
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

interface EngineerProfile {
  id: string;
  name: string;
  gender: '男' | '女';
  avatar: string;
  title: string;
  phone: string;
  badgeNo: string;
  certifications: string[];
  assignedArea: string;
  dutyStatus: 'ON_DUTY' | 'IN_REPAIR' | 'STANDBY' | 'OFF_DUTY';
  monthlyCompletedOrders: number;
  satisfactionRating: number;
  specialties: string[];
}

export const VendorEngineersSlaTab: React.FC<VendorEngineersSlaTabProps> = ({
  currentVendor,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dutyFilter, setDutyFilter] = useState<'ALL' | 'ON_DUTY' | 'IN_REPAIR' | 'STANDBY'>('ALL');
  const [selectedEngineer, setSelectedEngineer] = useState<EngineerProfile | null>(null);

  // 驻场工程师团队名录数据
  const [engineers, setEngineers] = useState<EngineerProfile[]>([
    {
      id: 'ENG-001',
      name: currentVendor.contactPerson || '陈工',
      gender: '男',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      title: '主任级驻场工程师 / 驻院项目主管',
      phone: currentVendor.phone || '13812345678',
      badgeNo: 'RES-ENG-701',
      certifications: ['大型放射影像三级认证', '高压及射频系统原厂维保资质', '国家医疗器械临床工程师证'],
      assignedArea: '全院大型医疗设备 / 影像科 / 放射科 / 介入室',
      dutyStatus: 'ON_DUTY',
      monthlyCompletedOrders: 38,
      satisfactionRating: 4.98,
      specialties: ['超导核磁 (MRI)', '多排CT', '大型DSA血管造影机', '数字胃肠DR'],
    },
    {
      id: 'ENG-002',
      name: '张宇',
      gender: '男',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      title: '生命支持类设备高级工程师',
      phone: '13910022334',
      badgeNo: 'RES-ENG-702',
      certifications: ['危重症急救设备原厂校准证', '呼吸机管路气路检定专员', '医工质控初级测评师'],
      assignedArea: '急诊科 / 重症监护室 (ICU) / 麻醉手术部 / 新生儿科 (NICU)',
      dutyStatus: 'IN_REPAIR',
      monthlyCompletedOrders: 54,
      satisfactionRating: 4.95,
      specialties: ['高端呼吸机', '多参数监护仪', '双向波除颤起搏仪', '微量注射泵/输液泵'],
    },
    {
      id: 'ENG-003',
      name: '李晨曦',
      gender: '女',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
      title: '内窥镜与微创外科技术专员',
      phone: '13699887766',
      badgeNo: 'RES-ENG-703',
      certifications: ['医用光学与电子内镜清洗消毒质控', '微创硬镜系统光纤调校认证'],
      assignedArea: '微创内镜中心 / 消化内镜室 / 消毒供应室 (CSSD)',
      dutyStatus: 'STANDBY',
      monthlyCompletedOrders: 29,
      satisfactionRating: 4.92,
      specialties: ['电子胃肠镜', '超声内镜', '4K超高清腹腔镜', '硬性膀胱镜/关节镜'],
    },
    {
      id: 'ENG-004',
      name: '王凯旋',
      gender: '男',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      title: '检验体外诊断(IVD)与超声系统工程师',
      phone: '13755443322',
      badgeNo: 'RES-ENG-704',
      certifications: ['生化免疫流水线维护证', '超声探头声学阻抗测量认证', 'ISO15189质控员'],
      assignedArea: '检验科 / 输血科 / 彩超室 / 健康体检中心',
      dutyStatus: 'ON_DUTY',
      monthlyCompletedOrders: 42,
      satisfactionRating: 4.96,
      specialties: ['全自动生化分析仪', '化学发光仪', '彩色多普勒超声诊断仪', '血气分析仪'],
    },
    {
      id: 'ENG-005',
      name: '赵子豪',
      gender: '男',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&auto=format&fit=crop&q=80',
      title: '综合动力与医用气电气系统工程师',
      phone: '13566778899',
      badgeNo: 'RES-ENG-705',
      certifications: ['医用中心供氧系统特种作业证', '高压氧舱维保资质', '强弱电系统巡检专员'],
      assignedArea: '动力设备层 / 医用气站 / 高压氧舱 / 负压吸引泵房',
      dutyStatus: 'ON_DUTY',
      monthlyCompletedOrders: 61,
      satisfactionRating: 4.94,
      specialties: ['制氧机组', '医用空气压缩机', '中央负压泵站', '医用高压氧舱配电柜'],
    }
  ]);

  // 考勤打卡登记模拟
  const handleCheckIn = (engineerId: string) => {
    setEngineers(prev => prev.map(eng => {
      if (eng.id === engineerId) {
        const nextStatus = eng.dutyStatus === 'ON_DUTY' ? 'IN_REPAIR' : 'ON_DUTY';
        return { ...eng, dutyStatus: nextStatus };
      }
      return eng;
    }));
    onToast('已更新该工程师驻场值守打卡状态！', 'success');
  };

  const filteredEngineers = engineers.filter(eng => {
    if (dutyFilter !== 'ALL' && eng.dutyStatus !== dutyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        eng.name.toLowerCase().includes(q) ||
        eng.badgeNo.toLowerCase().includes(q) ||
        eng.title.toLowerCase().includes(q) ||
        eng.assignedArea.toLowerCase().includes(q) ||
        eng.specialties.some(s => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div id="vendor-engineers-sla-tab" className="space-y-4">
      {/* 顶部 SLA 履约时效承诺看板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">15分钟极速响应</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              100% 达成
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">11.4</span>
            <span className="text-xs font-medium text-slate-500">分钟 (平均接单)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
            电话 / 系统报修后15分钟内技术主管接单响应并指导急救措施
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">急诊ICU 2小时到场</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              98.9% 达成
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">26</span>
            <span className="text-xs font-medium text-slate-500">分钟 (驻场平均到达)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
            急救与生命支持类设备常驻值守，院内科室极速直达
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">24小时首修闭环 (FTFR)</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-bold border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              94.6% 达成
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">224</span>
            <span className="text-xs font-medium text-slate-500">件 / 本月完工</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
            常规零星设备配件现货供应，当日报修次日晨会前验收交还
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">原厂备件保供通道</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10.5px] font-bold border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" />
              正品溯源
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">100%</span>
            <span className="text-xs font-medium text-slate-500">原厂/认证件</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
            落实大型医疗设备以旧换新，旧件退库率 100% 审计合规
          </p>
        </div>
      </div>

      {/* 工程师名录过滤工具栏 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setDutyFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                dutyFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部人员 ({engineers.length})
            </button>
            <button
              type="button"
              onClick={() => setDutyFilter('ON_DUTY')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                dutyFilter === 'ON_DUTY'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              在岗值守 ({engineers.filter(e => e.dutyStatus === 'ON_DUTY').length})
            </button>
            <button
              type="button"
              onClick={() => setDutyFilter('IN_REPAIR')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                dutyFilter === 'IN_REPAIR'
                  ? 'bg-white text-blue-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              现场维修中 ({engineers.filter(e => e.dutyStatus === 'IN_REPAIR').length})
            </button>
            <button
              type="button"
              onClick={() => setDutyFilter('STANDBY')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                dutyFilter === 'STANDBY'
                  ? 'bg-white text-amber-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              待命应急 ({engineers.filter(e => e.dutyStatus === 'STANDBY').length})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工程师姓名、专长或科室..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400 transition"
          />
        </div>
      </div>

      {/* 工程师卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredEngineers.map((engineer) => {
          return (
            <div
              key={engineer.id}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 shadow-2xs flex flex-col justify-between gap-3 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700">
                      <img
                        src={engineer.avatar}
                        alt={engineer.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{engineer.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {engineer.badgeNo}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{engineer.title}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border shrink-0 ${
                    engineer.dutyStatus === 'ON_DUTY'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : engineer.dutyStatus === 'IN_REPAIR'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {engineer.dutyStatus === 'ON_DUTY' && '● 在岗值守'}
                    {engineer.dutyStatus === 'IN_REPAIR' && '● 现场抢修中'}
                    {engineer.dutyStatus === 'STANDBY' && '● 应急待命'}
                  </span>
                </div>

                {/* 责任片区与科室 */}
                <div className="mt-3 bg-slate-50 rounded-lg p-2 text-xs border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">常驻对口片区：</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 pl-5 leading-snug">
                    {engineer.assignedArea}
                  </p>
                </div>

                {/* 维修擅长领域 */}
                <div className="mt-2.5">
                  <span className="text-[10.5px] font-semibold text-slate-400 block mb-1">主责设备类型：</span>
                  <div className="flex flex-wrap gap-1">
                    {engineer.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10.5px] font-medium border border-slate-200/60"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 资质与证书 */}
                <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                  {engineer.certifications.slice(0, 2).map((cert, ci) => (
                    <div key={ci} className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部业务统计与操作栏 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px]">本月工单: <strong className="text-slate-800 font-mono">{engineer.monthlyCompletedOrders}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500 text-[11px]">满意度: <strong className="text-amber-600 font-mono">{engineer.satisfactionRating}</strong>★</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onToast(`正在呼叫驻场工程师 【${engineer.name}】（电话：${engineer.phone}）...`, 'info');
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title={`拨打工程师电话: ${engineer.phone}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheckIn(engineer.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer shadow-2xs"
                  >
                    切换状态
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部驻场应急保障承诺与联络备忘录 */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              驻场医工服务项目部 · 24小时应急联动矩阵
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              医院医学工程科紧急故障申报专线：0539-7991000 | 驻场项目经理直通车：{currentVendor.contactPerson} ({currentVendor.phone})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-slate-500">执勤标准：<strong>GB/T 42128 医疗器械使用质量管理规范</strong></span>
        </div>
      </div>
    </div>
  );
};
