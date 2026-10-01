import React from 'react';
import { 
  FileCheck2, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Users, 
  Camera 
} from 'lucide-react';
import { MedicalEquipment, EquipmentAcceptanceDossier, TrainingPhoto } from '../types';

interface EquipmentAcceptanceSingleSheetProps {
  equipment: MedicalEquipment;
  dossier: EquipmentAcceptanceDossier;
  trainingPhotos: TrainingPhoto[];
  pageOrientation: 'portrait' | 'landscape';
  sheetRef: React.RefObject<HTMLDivElement | null>;
  onSwitchToTraining?: () => void;
}

function formatChineseCurrency(num: number): string {
  if (isNaN(num) || num <= 0) return '零元整';
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
  let integerPart = Math.floor(num);
  let str = '';
  let unitIdx = 0;

  while (integerPart > 0 && unitIdx < units.length) {
    const digit = integerPart % 10;
    if (digit !== 0) {
      str = digits[digit] + units[unitIdx] + str;
    } else if (str && !str.startsWith('零')) {
      str = '零' + str;
    }
    integerPart = Math.floor(integerPart / 10);
    unitIdx++;
  }
  return (str || '零') + '元整';
}

export const EquipmentAcceptanceSingleSheet: React.FC<EquipmentAcceptanceSingleSheetProps> = ({
  equipment,
  dossier,
  trainingPhotos,
  pageOrientation,
  sheetRef,
  onSwitchToTraining
}) => {
  const isLandscape = pageOrientation === 'landscape';

  return (
    <div 
      ref={sheetRef}
      id="equipment-acceptance-a4-sheet"
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
      {/* 规范公文总标题 (黑白高对比度适印排版，移除彩色杂音) */}
      <div className="w-full text-center pb-1 mb-1 border-b border-slate-300">
        <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
          五莲县人民医院 · 医学装备管理委员会
        </div>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
          医疗仪器设备到货开箱安装与投用验收单
        </h1>
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 font-sans">
          <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">
            单页正本
          </span>
          <span className="font-semibold text-slate-900">
            固定资产终身技术档案与财务入账法定凭据
          </span>
          <span className="text-slate-500 hidden sm:inline">
            （国家三级甲等医院大型医用设备验收规范）
          </span>
        </div>

        {/* 规范公文黑色双线 (上粗下细) */}
        <div className="mt-1 pb-0.5 border-b-2 border-slate-950">
          <div className="border-b border-slate-700"></div>
        </div>
      </div>

      {/* 表格上方紧凑规范的单据元数据栏 */}
      <div className="w-full flex flex-wrap items-center justify-between text-xs px-2.5 py-1 mb-1.5 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-xs shadow-2xs">
        <div className="flex items-center gap-3.5">
          <span><strong>验收单号：</strong><span className="font-mono text-slate-950 font-bold">{dossier.acceptanceNo}</span></span>
          <span><strong>合同编号：</strong><span className="font-mono text-slate-950">{dossier.contractNo}</span></span>
          <span><strong>采购方式：</strong><span className="text-slate-950">{dossier.procurementMethod}</span></span>
        </div>
        <div className="flex items-center gap-3.5">
          <span><strong>到货日期：</strong><span className="font-mono text-slate-950">{dossier.deliveryDate}</span></span>
          <span><strong>竣工验收日：</strong><span className="font-mono text-slate-950 font-bold">{dossier.acceptanceDate}</span></span>
          <span><strong>存证防伪码：</strong><span className="font-mono text-slate-950 font-semibold">{dossier.securityVerificationCode}</span></span>
        </div>
      </div>

      {/* 规范一体化 12 列大通表 */}
      <div className="relative mb-1 shadow-xs">
        <table className="w-full border-collapse border-2 border-slate-800 table-fixed text-xs font-sans">
          <colgroup>
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3333%' }} />
            <col style={{ width: '8.3337%' }} />
          </colgroup>

          <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-b-2 border-slate-800 select-none">
            <tr className="text-slate-950">
              <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-slate-950 text-xs sm:text-[13px]">
                    <FileCheck2 className="w-4 h-4 text-slate-900 inline" />
                    <span>一、设备商务立项与法定技术准入基本信息</span>
                  </span>
                  <span className="text-xs font-normal text-slate-600 font-mono">
                    采购方式: {dossier.procurementMethod} · 档案号: {equipment.id}
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                仪器设备名称
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-bold text-slate-950 border border-slate-700 align-middle truncate text-xs sm:text-[13px]" title={equipment.name}>
                {equipment.name}
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                规格型号
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-mono font-bold text-slate-950 border border-slate-700 align-middle truncate text-xs sm:text-[13px]" title={equipment.model}>
                {equipment.model}
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                生产制造厂商
              </th>
              <td colSpan={2} className="py-1 px-1.5 text-slate-900 border border-slate-700 align-middle truncate text-xs" title={equipment.manufacturer || '原厂正品'}>
                {equipment.manufacturer || '原厂正品'}
              </td>
            </tr>

            <tr>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                出厂序列号(SN)
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-mono font-bold text-slate-950 border border-slate-700 align-middle truncate text-xs" title={equipment.sn}>
                {equipment.sn}
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                医疗器械注册证
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-mono text-xs text-slate-900 border border-slate-700 align-middle truncate" title={dossier.registrationCertNo}>
                {dossier.registrationCertNo}
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                质检合格证号
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-mono text-xs text-slate-900 border border-slate-700 align-middle truncate" title={dossier.qualityInspectionCertNo}>
                {dossier.qualityInspectionCertNo}
              </td>
            </tr>

            <tr>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                中标供货单位
              </th>
              <td colSpan={2} className="py-1 px-1.5 text-slate-900 border border-slate-700 align-middle truncate text-xs" title={equipment.supplier || '中标指定配送机构'}>
                {equipment.supplier || '中标指定配送机构'}
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                发票代码/号码
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-mono text-xs text-slate-900 border border-slate-700 align-middle truncate" title={`${dossier.invoiceCode} / No.${dossier.invoiceNo}`}>
                {dossier.invoiceCode} / No.{dossier.invoiceNo}
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                配属科室/地点
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-semibold text-slate-950 border border-slate-700 align-middle truncate text-xs" title={`${equipment.department} · ${dossier.installationLocation}`}>
                {equipment.department} ({dossier.installationLocation})
              </td>
            </tr>

            <tr>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                整机质保承诺
              </th>
              <td colSpan={2} className="py-1 px-1.5 font-semibold text-slate-900 text-xs border border-slate-700 align-middle">
                整机 {dossier.warrantyMonths} 个月 / 核心件 {dossier.corePartWarrantyYears} 年
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                购置入账总值
              </th>
              <td colSpan={6} className="py-1 px-2.5 border border-slate-700 align-middle">
                <div className="flex items-center justify-between text-xs sm:text-[13px]">
                  <span>小写：<strong className="font-mono font-bold text-slate-950">￥{(equipment.purchasePrice || 0).toLocaleString()} 元</strong></span>
                  <span>大写：<strong className="font-serif font-bold text-slate-950">人民币 {formatChineseCurrency(equipment.purchasePrice || 0)}</strong></span>
                  <span className="text-xs text-slate-600 font-mono">资产卡: ZC-{equipment.sn?.slice(-6) || '8801'}</span>
                </div>
              </td>
            </tr>

            {/* 二、开箱清点与附件查验记录 (紧凑精选) */}
            <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
              <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px]">二、开箱清点与随机附件技术资料查验记录</span>
                  <span className="text-xs font-normal text-slate-600">外观包装完好 · 随机资料齐全 · 附件核验无损</span>
                </div>
              </th>
            </tr>
            <tr className="bg-slate-100/80 text-slate-900 font-semibold text-center text-xs">
              <th colSpan={1} className="border border-slate-700 py-1 font-bold">序号</th>
              <th colSpan={2} className="border border-slate-700 py-1 font-bold">核验分类</th>
              <th colSpan={4} className="border border-slate-700 py-1 text-left pl-2 font-bold">物品名称与规格型号</th>
              <th colSpan={1} className="border border-slate-700 py-1 font-bold">应到</th>
              <th colSpan={1} className="border border-slate-700 py-1 font-bold">实到</th>
              <th colSpan={1} className="border border-slate-700 py-1 font-bold">结论</th>
              <th colSpan={2} className="border border-slate-700 py-1 text-left pl-2 font-bold">开箱状态及说明</th>
            </tr>
            {(dossier?.unboxingItems || []).slice(0, 3).map((item, idx) => (
              <tr key={item.id} className="bg-white hover:bg-slate-50/70 transition">
                <td colSpan={1} className="border border-slate-700 py-1 text-center font-mono align-middle text-xs">{idx + 1}</td>
                <td colSpan={2} className="border border-slate-700 py-1 text-center font-medium text-slate-800 align-middle text-xs">{item.category}</td>
                <td colSpan={4} className="border border-slate-700 py-1 pl-2 align-middle truncate text-xs">
                  <span className="font-semibold text-slate-950 mr-1">{item.itemName}</span>
                  {item.specification && <span className="text-slate-500 font-mono">({item.specification})</span>}
                </td>
                <td colSpan={1} className="border border-slate-700 py-1 text-center font-mono align-middle text-xs">{item.standardQuantity} {item.unit}</td>
                <td colSpan={1} className="border border-slate-700 py-1 text-center font-mono font-bold text-slate-950 align-middle text-xs">{item.actualQuantity} {item.unit}</td>
                <td colSpan={1} className="border border-slate-700 py-1 text-center font-bold text-slate-950 align-middle text-xs">合格</td>
                <td colSpan={2} className="border border-slate-700 py-1 pl-2 text-xs text-slate-700 align-middle truncate">
                  {item.remarks || '全新原装，封签完好'}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={12} className="border border-slate-700 bg-slate-100/70 py-1 px-2.5 text-xs text-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                  <span><strong>开箱核验结论：</strong>{dossier.unboxingConclusion}</span>
                </div>
              </td>
            </tr>

            {/* 三、工程安装调试与电气安全/核心指标实测 (紧凑精选) */}
            <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
              <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px]">三、工程安装调试与电气安全/核心技术指标实测</span>
                  <span className="text-xs font-normal text-slate-600">GB 9706.1 强制电气安全检验合格</span>
                </div>
              </th>
            </tr>
            <tr className="bg-slate-100/80 text-slate-900 font-semibold text-center text-xs">
              <th colSpan={1} className="border border-slate-700 py-1 font-bold">序号</th>
              <th colSpan={2} className="border border-slate-700 py-1 font-bold">测试类别</th>
              <th colSpan={3} className="border border-slate-700 py-1 text-left pl-2 font-bold">检测指标项目名称</th>
              <th colSpan={2} className="border border-slate-700 py-1 text-left pl-2 font-bold">标准要求</th>
              <th colSpan={1} className="border border-slate-700 py-1 text-center font-bold">实测读数</th>
              <th colSpan={1} className="border border-slate-700 py-1 font-bold">判定</th>
              <th colSpan={2} className="border border-slate-700 py-1 text-left pl-2 font-bold">检测仪器</th>
            </tr>
            {(dossier?.technicalTests || []).slice(0, 3).map((test, idx) => (
              <tr key={test.id} className="bg-white hover:bg-slate-50/70 transition">
                <td colSpan={1} className="border border-slate-700 py-1 text-center font-mono align-middle text-xs">{idx + 1}</td>
                <td colSpan={2} className="border border-slate-700 py-1 text-center text-slate-800 font-medium align-middle text-xs">{test.testCategory}</td>
                <td colSpan={3} className="border border-slate-700 py-1 pl-2 font-semibold text-slate-950 align-middle truncate text-xs">{test.parameterName}</td>
                <td colSpan={2} className="border border-slate-700 py-1 pl-2 text-xs text-slate-700 font-mono align-middle truncate">{test.standardRequirement}</td>
                <td colSpan={1} className="border border-slate-700 py-1 text-xs font-mono font-bold text-slate-950 text-center align-middle">
                  {test.measuredValue}
                </td>
                <td colSpan={1} className="border border-slate-700 py-1 text-center font-bold text-slate-950 align-middle text-xs">合格</td>
                <td colSpan={2} className="border border-slate-700 py-1 pl-2 text-xs text-slate-700 font-sans align-middle truncate">
                  {test.testInstrument || '综合电气分析仪'}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={12} className="border border-slate-700 bg-slate-100/70 py-1 px-2.5 text-xs text-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                  <span><strong>技术性能复核结论：</strong>{dossier.testingConclusion}</span>
                </div>
              </td>
            </tr>

            {/* 四、临床科室应用操作与规范维护培训交接记录 */}
            <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
              <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px]">四、临床科室应用操作与规范维护培训交接记录</span>
                  <span className="text-xs font-normal text-slate-600">
                    学时: {dossier.trainingRecord.trainingHours} 小时 · 全员考核合格率 100%
                  </span>
                </div>
              </th>
            </tr>
            <tr>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                培训讲师及单位
              </th>
              <td colSpan={4} className="py-1 px-2 font-medium text-slate-950 border border-slate-700 align-middle truncate text-xs">
                {dossier.trainingRecord?.trainerName || '张敏捷'} ({dossier.trainingRecord?.trainerCompany || '原厂技术服务中心'} · {dossier.trainingRecord?.trainerTitle || '资深应用专员'})
              </td>
              <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1 px-1.5 text-center font-bold border border-slate-700 align-middle text-xs">
                受训考核达标骨干
              </th>
              <td colSpan={4} className="py-1 px-2 font-semibold text-slate-950 border border-slate-700 align-middle truncate text-xs">
                {(dossier.trainingRecord?.trainees || []).map(t => `${t.name}(${t.role ? t.role.split('/')[0].trim() : ''})`).join('、') || '全员达标通过'}
              </td>
            </tr>

            {/* 单页精选：展示 1-2 张现场实拍缩略图与考评总结 (增强立体质感与真实相纸深度) */}
            {trainingPhotos.length > 0 && (
              <tr>
                <td colSpan={12} className="border border-slate-700 p-2 bg-gradient-to-b from-slate-50 to-slate-100/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Camera className="w-4 h-4 text-slate-800 shrink-0" />
                      <span className="font-bold text-xs text-slate-900">现场培训影像凭证:</span>
                      <div className="flex items-center gap-3">
                        {trainingPhotos.slice(0, 2).map((photo, pIdx) => (
                          <div key={photo.id} className="flex items-center gap-2 bg-white border border-slate-300 px-2 py-1 rounded-md shadow-xs ring-1 ring-black/5 hover:shadow-md transition">
                            <div className="w-14 h-9 bg-slate-900 rounded-xs overflow-hidden shrink-0 border border-slate-200 shadow-2xs relative group">
                              <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-mono py-0.2">
                                实拍图{pIdx + 1}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[200px] font-sans">
                              {photo.caption}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {onSwitchToTraining && (
                      <button
                        type="button"
                        onClick={onSwitchToTraining}
                        className="text-xs text-blue-700 hover:text-blue-900 font-bold underline print:hidden cursor-pointer whitespace-nowrap"
                      >
                        查看 A4 培训专页 &gt;
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* 五、验收综合决议与五方联合代表会签签章 */}
            <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
              <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-[13px]">五、验收综合决议与五方代表联合签章</span>
                  <span className="text-slate-950 font-bold text-xs sm:text-[13px]">
                    决议结论：{dossier.finalAcceptanceConclusion}
                  </span>
                </div>
              </th>
            </tr>

            {/* 上排三方会签：各占 4 列 (33.333%) */}
            <tr>
              {/* 1. 供货厂商原厂工程师 */}
              <td colSpan={4} className="border border-slate-700 p-2 bg-white align-top">
                <div className="flex flex-col justify-between h-full min-h-[85px]">
                  <div>
                    <div className="font-bold text-slate-950 mb-1 flex items-center gap-1 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>① 供货厂商原厂安装工程师</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-1 line-clamp-2">
                      {dossier.signoffs.vendorEngineer.opinion}
                    </p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                    <div>
                      <span className="text-slate-500 mr-1">签字：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.signoffs.vendorEngineer.signatoryName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-xs">{dossier.signoffs.vendorEngineer.signDate}</span>
                  </div>
                </div>
              </td>

              {/* 2. 医学装备科验收主检工程师 */}
              <td colSpan={4} className="border border-slate-700 p-2 bg-slate-50/60 align-top">
                <div className="flex flex-col justify-between h-full min-h-[85px]">
                  <div>
                    <div className="font-bold text-slate-950 mb-1 flex items-center gap-1 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>② 医学装备科验收主检工程师</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-1 line-clamp-2">
                      {dossier.signoffs.biomedicalEngineer.opinion}
                    </p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                    <div>
                      <span className="text-slate-500 mr-1">主检签字：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.signoffs.biomedicalEngineer.signatoryName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-xs">{dossier.signoffs.biomedicalEngineer.signDate}</span>
                  </div>
                </div>
              </td>

              {/* 3. 临床使用科室负责人/护士长 */}
              <td colSpan={4} className="border border-slate-700 p-2 bg-white align-top">
                <div className="flex flex-col justify-between h-full min-h-[85px]">
                  <div>
                    <div className="font-bold text-slate-950 mb-1 flex items-center gap-1 text-xs">
                      <Users className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                      <span>③ 临床使用科室负责人/护士长</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed mb-1 line-clamp-2">
                      {dossier.signoffs.clinicalHead.opinion}
                    </p>
                  </div>
                  <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                    <div>
                      <span className="text-slate-500 mr-1">科室签字：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.signoffs.clinicalHead.signatoryName}
                      </span>
                    </div>
                    <span className="font-mono text-slate-600 text-xs">{dossier.signoffs.clinicalHead.signDate}</span>
                  </div>
                </div>
              </td>
            </tr>

            {/* 下排两方签批：各占 6 列 (50%) */}
            <tr>
              {/* 4. 医学装备管理委员会 / 装备科长审核 */}
              <td colSpan={6} className="border border-slate-700 p-2 bg-white align-top">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 block text-xs">④ 医学装备管理委员会 / 装备科长审核：</span>
                    <strong className="text-slate-950 font-medium text-xs block line-clamp-1 mt-0.5">
                      {dossier.signoffs.equipmentDirector.opinion}
                    </strong>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">科长签批：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.signoffs.equipmentDirector.signatoryName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500 text-right whitespace-nowrap ml-2">
                    {dossier.signoffs.equipmentDirector.signDate}
                  </span>
                </div>
              </td>

              {/* 5. 财务处资产核算与入账复核 */}
              <td colSpan={6} className="border border-slate-700 p-2 bg-slate-50/60 align-top">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-600 block text-xs">⑤ 财务处资产核算与入账复核：</span>
                    <strong className="text-slate-950 font-medium text-xs block line-clamp-1 mt-0.5">
                      {dossier.signoffs.financeAuditor.opinion}
                    </strong>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">财务复核：</span>
                      <span className="font-serif italic font-bold text-sm text-slate-950">
                        {dossier.signoffs.financeAuditor.signatoryName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-500 text-right whitespace-nowrap ml-2">
                    {dossier.signoffs.financeAuditor.signDate}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 黑白激光打印高对比度印鉴 (五莲县人民医院 验收入库专用章) */}
        <div 
          className="absolute right-6 bottom-2 pointer-events-none select-none rotate-[-4deg] opacity-90 print:opacity-100"
        >
          <div className="w-24 h-24 rounded-full border-2 border-slate-950 p-0.5 flex items-center justify-center relative bg-white/70 print:bg-transparent">
            <div className="w-full h-full rounded-full border border-slate-900 flex flex-col items-center justify-center text-center p-1.5 text-slate-950">
              <div className="text-[9px] font-black tracking-tighter leading-none mb-0.5">
                五莲县人民医院
              </div>
              <div className="text-xs font-serif my-0.2">★</div>
              <div className="text-[9.5px] font-black tracking-wider leading-none">
                验收入库专用章
              </div>
              <div className="text-[7.5px] font-mono mt-0.5 font-bold">
                {(dossier.acceptanceDate || '2023-08-15').replace(/-/g, '.')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 纸张底部版权与法律说明 */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 font-sans border-t border-slate-300 pt-1.5 mt-1.5">
        <div>
          <span>注：本验收单为单页正本，涂改无效。未经五方签署并加盖印章不得作为固定资产入账及付款凭据。</span>
        </div>
        <div className="font-mono text-slate-600">
          <span>防伪存证码: {dossier.securityVerificationCode} · 经办人: {dossier.signoffs.biomedicalEngineer.signatoryName} · 第 1 页 共 1 页</span>
        </div>
      </div>
    </div>
  );
};
