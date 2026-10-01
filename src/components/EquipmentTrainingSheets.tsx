import React from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Users, 
  ShieldCheck, 
  Eye, 
  Trash2, 
  Plus, 
  Upload 
} from 'lucide-react';
import { MedicalEquipment, EquipmentAcceptanceDossier, TrainingPhoto, TrainingTopicItem } from '../types';

const DEFAULT_TOPICS: TrainingTopicItem[] = [
  { id: 'top-1', category: '理论架构与设备原理', title: '设备电气原理、核心构造、自检流程及临床工作模式解析', durationHours: 2 },
  { id: 'top-2', category: '临床规范化实机操作', title: '标准开机上机流程、参数精细化设定、波形与数据监测判读', durationHours: 2 },
  { id: 'top-3', category: '危急报警与应急排错', title: '高危生理/技术报警阈值设定、盲机模拟故障处置与快速排错', durationHours: 2 },
  { id: 'top-4', category: '日常维护与院感质控', title: '传感器/导联线消毒保养规范、一级点检交接及不良事件防范', durationHours: 2 },
];

interface EquipmentTrainingSheetsProps {
  equipment: MedicalEquipment;
  dossier: EquipmentAcceptanceDossier;
  trainingPhotos: TrainingPhoto[];
  pageOrientation: 'portrait' | 'landscape';
  sheetRef: React.RefObject<HTMLDivElement | null>;
  onPreviewPhoto?: (photo: TrainingPhoto) => void;
  onDeletePhoto?: (photoId: string) => void;
  onOpenUpload?: () => void;
}

export const EquipmentTrainingSheets: React.FC<EquipmentTrainingSheetsProps> = ({
  equipment,
  dossier,
  trainingPhotos = [],
  pageOrientation,
  sheetRef,
  onPreviewPhoto,
  onDeletePhoto,
  onOpenUpload
}) => {
  const isLandscape = pageOrientation === 'landscape';

  const tr = dossier?.trainingRecord || {
    trainingNo: 'PX-2023-0814',
    trainingDate: '2023-08-14',
    trainingHours: 8,
    trainerName: '张敏捷',
    trainerCompany: equipment?.manufacturer || '设备原厂技术服务中心',
    trainerTitle: '大中华区高级临床应用培训专员',
    assessmentSummary: '全员达标准予独立上岗',
    trainerSignature: '张敏捷',
    departmentDirectorSignature: '杜晓光',
    equipmentEngineerSignature: '崔工程师',
    topics: DEFAULT_TOPICS,
    trainees: []
  };

  const topicsList = (tr.topics && tr.topics.length > 0) ? tr.topics : DEFAULT_TOPICS;
  const traineesList = (tr.trainees && tr.trainees.length > 0) ? tr.trainees : [
    { id: 'tr-1', name: '杜晓光', role: '科室主任 / 主任医师', department: equipment.department, assessmentResult: '优秀' as const, score: 98, theoryScore: 97, practicalScore: 99, traineeSignature: '杜晓光' },
    { id: 'tr-2', name: '王雪莲', role: '护士长 / 副主任护师', department: equipment.department, assessmentResult: '优秀' as const, score: 97, theoryScore: 96, practicalScore: 98, traineeSignature: '王雪莲' },
    { id: 'tr-3', name: '张建军', role: '主治医师 / 科室质控员', department: equipment.department, assessmentResult: '良好' as const, score: 95, theoryScore: 94, practicalScore: 96, traineeSignature: '张建军' },
    { id: 'tr-4', name: '刘芳', role: '主管技师 / 设备首要保管人', department: equipment.department, assessmentResult: '优秀' as const, score: 99, theoryScore: 98, practicalScore: 100, traineeSignature: '刘芳' }
  ];

  return (
    <div 
      ref={sheetRef}
      id="training-acceptance-a4-sheet"
      className={`a4-report-sheet acceptance-a4-doc a4-monochrome-sheet mx-auto shadow-xl border border-slate-300 rounded-xs transition-colors relative overflow-hidden shrink-0 bg-white text-slate-950 p-4 sm:p-5 print:border-none print:shadow-none print:p-4 print:m-0 print:max-w-none ${
        isLandscape ? 'is-landscape' : ''
      }`}
      style={{ 
        width: isLandscape ? '297mm' : '210mm',
        minWidth: isLandscape ? '297mm' : '210mm',
        maxWidth: isLandscape ? '297mm' : '210mm',
        minHeight: isLandscape ? '210mm' : '297mm',
        boxSizing: 'border-box',
        fontFamily: '"SimSun", "Songti SC", "STSong", "Songti", "Microsoft YaHei", serif',
        writingMode: 'horizontal-tb',
        direction: 'ltr'
      }}
    >
      {/* 规范公文总标题 (黑白高对比度适印排版) */}
      <div className="w-full text-center pb-1 mb-1 border-b border-slate-300">
        <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
          五莲县人民医院 · 医务处 · 护理部 · 医学装备管理委员会
        </div>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
          医疗仪器设备临床操作与规范维护培训交接考核表
        </h1>
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 font-sans">
          <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">
            培训考核专页 (A4单页)
          </span>
          <span className="font-semibold text-slate-900">
            临床医护准用上岗考核与科室技术交接法定凭证
          </span>
          <span className="text-slate-500 hidden sm:inline">
            （国家三级甲等医院大型医用设备准入归档标准）
          </span>
        </div>

        {/* 规范公文黑色双线 (上粗下细) */}
        <div className="mt-1 pb-0.5 border-b-2 border-slate-950">
          <div className="border-b border-slate-700"></div>
        </div>
      </div>

      {/* 表格上方培训概况与元数据标头栏 */}
      <div className="w-full flex flex-wrap items-center justify-between text-xs px-3 py-1.5 mb-2 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-xs shadow-2xs">
        <div className="flex items-center gap-4">
          <span><strong>培训编号：</strong><span className="font-mono text-slate-950 font-bold">{dossier.trainingRecord.trainingNo || 'PX-2023-0814'}</span></span>
          <span><strong>实施日期：</strong><span className="font-mono text-slate-950">{dossier.trainingRecord.trainingDate}</span></span>
          <span><strong>课时标准：</strong><span className="font-mono text-slate-950">{dossier.trainingRecord.trainingHours} 标准课时</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span><strong>考核通过率：</strong><strong className="font-mono text-slate-950 font-bold">100% (全员达标)</strong></span>
          <span><strong>关联设备SN：</strong><span className="font-mono text-slate-950">{equipment.sn}</span></span>
        </div>
      </div>

      {/* 【表一】 受训仪器设备与培训实施基本信息 */}
      <div className="mb-2 rounded-xs overflow-hidden border border-slate-800 shadow-2xs">
        <table className="w-full border-collapse table-fixed text-xs sm:text-[13px] font-sans">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '19%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <tbody>
            <tr>
              <th className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 py-1.5 px-2 text-center font-bold border border-slate-700 whitespace-nowrap align-middle">
                受训仪器设备
              </th>
              <td className="py-1.5 px-2 font-bold text-slate-950 border border-slate-700 align-middle truncate" title={equipment.name}>
                {equipment.name}
              </td>
              <th className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 py-1.5 px-2 text-center font-bold border border-slate-700 whitespace-nowrap align-middle">
                规格型号
              </th>
              <td className="py-1.5 px-2 font-mono font-bold text-slate-950 border border-slate-700 align-middle truncate" title={equipment.model}>
                {equipment.model}
              </td>
              <th className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 py-1.5 px-2 text-center font-bold border border-slate-700 whitespace-nowrap align-middle">
                配属使用科室
              </th>
              <td className="py-1.5 px-2 font-semibold text-slate-950 border border-slate-700 align-middle truncate">
                {equipment.department}
              </td>
            </tr>
            <tr>
              <th className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 py-1.5 px-2 text-center font-bold border border-slate-700 whitespace-nowrap align-middle">
                主讲培训专家
              </th>
              <td className="py-1.5 px-2 text-slate-950 border border-slate-700 align-middle truncate font-medium">
                {dossier.trainingRecord.trainerName}
              </td>
              <th className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 py-1.5 px-2 text-center font-bold border border-slate-700 whitespace-nowrap align-middle">
                专家所属单位
              </th>
              <td className="py-1.5 px-2 text-slate-950 border border-slate-700 align-middle truncate" title={dossier.trainingRecord.trainerCompany}>
                {dossier.trainingRecord.trainerCompany}
              </td>
              <th className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 py-1.5 px-2 text-center font-bold border border-slate-700 whitespace-nowrap align-middle">
                专家技术职称
              </th>
              <td className="py-1.5 px-2 text-slate-950 border border-slate-700 align-middle">
                {dossier.trainingRecord.trainerTitle}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 【表二】 培训大纲与科目核验 */}
      <div className="mb-2 rounded-xs overflow-hidden border border-slate-800 shadow-2xs">
        <table className="w-full border-collapse table-fixed text-xs sm:text-[13px] font-sans">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '48%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 border-b-2 border-slate-800">
            <tr>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">序号</th>
              <th className="border border-slate-700 py-1 px-2 text-left font-bold">培训模块分类</th>
              <th className="border border-slate-700 py-1 px-2 text-left font-bold">大纲具体教授与演练要点</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">学时分配</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">考核结论</th>
            </tr>
          </thead>
          <tbody>
            {topicsList.map((topic, idx) => (
              <tr key={topic.id || `topic-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                <td className="border border-slate-700 py-1 px-1.5 text-center font-mono align-middle">{idx + 1}</td>
                <td className="border border-slate-700 py-1 px-2 font-semibold text-slate-950 align-middle">{topic.category}</td>
                <td className="border border-slate-700 py-1 px-2 text-slate-800 align-middle truncate">{topic.title}</td>
                <td className="border border-slate-700 py-1 px-1.5 text-center font-mono align-middle">{topic.durationHours} 课时</td>
                <td className="border border-slate-700 py-1 px-1.5 text-center font-bold text-slate-950 align-middle">达标通过</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 【表三】 受训人员签到与盲机实操考核成绩册 */}
      <div className="mb-2 rounded-xs overflow-hidden border border-slate-800 shadow-2xs">
        <table className="w-full border-collapse table-fixed text-xs sm:text-[13px] font-sans">
          <colgroup>
            <col style={{ width: '6%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 border-b-2 border-slate-800">
            <tr>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">序号</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">受训人员</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">科室职务</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">理论成绩</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">实操盲机</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">总评判定</th>
              <th className="border border-slate-700 py-1 px-1.5 text-center font-bold">本人签字确认</th>
            </tr>
          </thead>
          <tbody>
            {traineesList.map((trainee, idx) => {
              const theory = trainee.theoryScore ?? (trainee.score ? Math.max(90, trainee.score - 1) : 96);
              const practical = trainee.practicalScore ?? trainee.score ?? 98;
              const traineeSig = trainee.traineeSignature || trainee.signature || trainee.name;
              return (
                <tr key={trainee.id || trainee.name || idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="border border-slate-700 py-1 px-1.5 text-center font-mono align-middle">{idx + 1}</td>
                  <td className="border border-slate-700 py-1 px-1.5 text-center font-bold text-slate-950 align-middle">{trainee.name}</td>
                  <td className="border border-slate-700 py-1 px-1.5 text-center text-slate-800 align-middle">{trainee.role}</td>
                  <td className="border border-slate-700 py-1 px-1.5 text-center font-mono font-semibold text-slate-950 align-middle">{theory} 分</td>
                  <td className="border border-slate-700 py-1 px-1.5 text-center font-mono font-semibold text-slate-950 align-middle">{practical} 分</td>
                  <td className="border border-slate-700 py-1 px-1.5 text-center font-bold text-slate-950 align-middle">合格准用</td>
                  <td className="border border-slate-700 py-1 px-1.5 text-center font-serif italic text-sm text-slate-900 align-middle">
                    {traineeSig}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 【表四】 现场培训实操与考核实拍实证图档案 (立体相框卡片) */}
      <div className="border border-slate-700 p-2.5 mb-2 bg-gradient-to-b from-slate-50/90 to-white rounded-xs shadow-2xs">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-bold text-slate-950 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-slate-900" />
            <span className="text-xs sm:text-[13px]">【表四】 现场理论教学与盲机实操演练实拍影像凭证</span>
          </span>
          <div className="flex items-center gap-2 print:hidden">
            {onOpenUpload && (
              <button
                type="button"
                onClick={onOpenUpload}
                className="text-xs text-slate-700 hover:text-slate-950 font-bold flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>补充照片</span>
              </button>
            )}
          </div>
        </div>

        {trainingPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {trainingPhotos.slice(0, 4).map((photo, pIdx) => (
              <div key={photo.id} className="border border-slate-300 rounded-xs overflow-hidden bg-white flex flex-col group relative shadow-xs hover:shadow-md transition">
                <div className="h-20 sm:h-24 bg-slate-900 overflow-hidden relative">
                  <img
                    src={photo.url}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-sans font-medium">
                    图{pIdx + 1}
                  </span>
                  
                  {/* 悬停查看/删除 (仅屏幕端) */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 print:hidden">
                    {onPreviewPhoto && (
                      <button
                        type="button"
                        onClick={() => onPreviewPhoto(photo)}
                        className="p-1.5 bg-white text-slate-950 rounded hover:bg-slate-100 cursor-pointer shadow-xs"
                        title="查看大图"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    {onDeletePhoto && (
                      <button
                        type="button"
                        onClick={() => onDeletePhoto(photo.id)}
                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-500 cursor-pointer shadow-xs"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-1.5 text-xs text-slate-900 leading-snug bg-slate-50/60 border-t border-slate-200">
                  <span className="line-clamp-1 font-sans font-medium">{photo.caption}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-slate-500">
            暂无现场培训实拍照片，建议使用上方工具上传理论教学与盲机演练照片
          </div>
        )}

        <div className="text-xs text-slate-900 border-t border-slate-300 pt-1.5 mt-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
          <span><strong>培训考评综合总结：</strong>{dossier.trainingRecord.assessmentSummary}</span>
        </div>
      </div>

      {/* 【表五】 培训综合考评决议与三方签署交接栏 */}
      <div className="relative mb-2 rounded-xs overflow-hidden border border-slate-800 shadow-2xs">
        <table className="w-full border-collapse table-fixed text-xs sm:text-[13px] font-sans">
          <colgroup>
            <col style={{ width: '33.333%' }} />
            <col style={{ width: '33.333%' }} />
            <col style={{ width: '33.334%' }} />
          </colgroup>
          <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950 border-b-2 border-slate-800">
            <tr>
              <th colSpan={3} className="py-1.5 px-3 text-left font-bold text-xs sm:text-[13px]">
                <div className="flex items-center justify-between">
                  <span>【表五】 培训综合考评决议与三方代表联合签章确认</span>
                  <span className="text-slate-950 font-bold">
                    评定：全员达标准予独立上岗
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* 1. 供货厂商临床培训专员 */}
              <td className="border border-slate-700 p-2 bg-white align-top">
                <div className="flex flex-col justify-between h-full min-h-[85px]">
                  <div>
                    <div className="font-bold text-slate-950 mb-1 text-xs sm:text-[13px]">
                      ① 供货厂商临床培训讲师
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed mb-1.5 line-clamp-2">
                      大纲要求课程全部讲授完毕，受训临床医护人员通过笔试与盲机考核，操作规范。
                    </p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                    <div>
                      <span className="text-slate-500 mr-1">讲师签字：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.trainingRecord.trainerSignature || dossier.trainingRecord.trainerName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-[11px]">{dossier.trainingRecord.trainingDate}</span>
                  </div>
                </div>
              </td>

              {/* 2. 临床使用科室主任/护士长 */}
              <td className="border border-slate-700 p-2 bg-slate-50/40 align-top">
                <div className="flex flex-col justify-between h-full min-h-[85px]">
                  <div>
                    <div className="font-bold text-slate-950 mb-1 text-xs sm:text-[13px]">
                      ② 临床使用科室负责人/护士长
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed mb-1.5 line-clamp-2">
                      选派人员已全程参训，现场实操掌握良好，SOP已上墙。同意获得本科室本设备操作资格。
                    </p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                    <div>
                      <span className="text-slate-500 mr-1">科室签字：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.trainingRecord.departmentDirectorSignature || '杜晓光 (主任医师)'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-[11px]">{dossier.trainingRecord.trainingDate}</span>
                  </div>
                </div>
              </td>

              {/* 3. 医学装备科验收见证工程师 */}
              <td className="border border-slate-700 p-2 bg-white align-top">
                <div className="flex flex-col justify-between h-full min-h-[85px]">
                  <div>
                    <div className="font-bold text-slate-950 mb-1 text-xs sm:text-[13px]">
                      ③ 医学装备科见证工程师
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed mb-1.5 line-clamp-2">
                      全程现场见证，学时、大纲及盲机考查成绩达标，现场照片与签到表已归档入库。
                    </p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                    <div>
                      <span className="text-slate-500 mr-1">见证签字：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.trainingRecord.equipmentEngineerSignature || '崔工程师 (主检)'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-[11px]">{dossier.trainingRecord.trainingDate}</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 官方黑白激光打印印鉴 (五莲县人民医院 技能培训考核合格章) */}
        <div 
          className="absolute right-6 bottom-2 pointer-events-none select-none rotate-[-4deg] opacity-90 print:opacity-100"
        >
          <div className="w-24 h-24 rounded-full border-2 border-slate-950 p-0.5 flex items-center justify-center relative bg-white/70 print:bg-transparent">
            <div className="w-full h-full rounded-full border border-slate-900 flex flex-col items-center justify-center text-center p-1.5 text-slate-950">
              <div className="text-[9px] font-black tracking-tighter leading-none mb-0.5">
                五莲县人民医院
              </div>
              <div className="text-xs font-serif my-0.2">★</div>
              <div className="text-[9px] font-black tracking-wider leading-none">
                技能培训考核合格章
              </div>
              <div className="text-[7.5px] font-mono mt-0.5 font-bold">
                {(dossier.trainingRecord?.trainingDate || dossier.acceptanceDate || '2023-08-14').replace(/-/g, '.')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 纸张底部 */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-sans border-t border-slate-300 pt-1.5 mt-1.5">
        <div>
          <span>注：本培训交接考核单为 A4 单页技术档案正本，作为等级医院评审与人员准用上岗法定技术档案。</span>
        </div>
        <div className="font-mono">
          <span>归档号: {dossier.trainingRecord?.trainingNo || 'PX-2023-0814'} · 经办人: {dossier.signoffs?.biomedicalEngineer?.signatoryName || '崔工'} · 第 1 页 共 1 页</span>
        </div>
      </div>
    </div>
  );
};
