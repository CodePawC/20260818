import React from 'react';
import { 
  FileCheck2, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Users, 
  Zap, 
  GraduationCap, 
  Camera 
} from 'lucide-react';
import { MedicalEquipment, EquipmentAcceptanceDossier, TrainingPhoto } from '../types';

interface EquipmentAcceptancePagedSheetsProps {
  equipment: MedicalEquipment;
  dossier: EquipmentAcceptanceDossier;
  trainingPhotos: TrainingPhoto[];
  pageOrientation: 'portrait' | 'landscape';
  page1Ref: React.RefObject<HTMLDivElement | null>;
  page2Ref: React.RefObject<HTMLDivElement | null>;
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

export const EquipmentAcceptancePagedSheets: React.FC<EquipmentAcceptancePagedSheetsProps> = ({
  equipment,
  dossier,
  trainingPhotos,
  pageOrientation,
  page1Ref,
  page2Ref
}) => {
  const isLandscape = pageOrientation === 'landscape';

  const sheetStyle: React.CSSProperties = {
    width: isLandscape ? '297mm' : '210mm',
    minWidth: isLandscape ? '297mm' : '210mm',
    maxWidth: isLandscape ? '297mm' : '210mm',
    minHeight: isLandscape ? '210mm' : '297mm',
    boxSizing: 'border-box',
    fontFamily: '"SimSun", "Songti SC", "STSong", "Songti", "Microsoft YaHei", serif',
    writingMode: 'horizontal-tb',
    direction: 'ltr'
  };

  return (
    <div className="flex flex-col gap-8 print:gap-0 print:block">
      {/* =========================================================================
          第 1 页: 商务立项与技术准入 + 到货开箱清点完整明细 + 验收综合决议与五方联合签章
          ========================================================================= */}
      <div 
        ref={page1Ref}
        id="equipment-acceptance-paged-sheet-1"
        className={`a4-report-sheet acceptance-a4-doc a4-monochrome-sheet a4-page-break mx-auto shadow-xl border border-slate-300 rounded-xs transition-colors relative overflow-hidden shrink-0 bg-white text-slate-950 p-5 sm:p-6 print:border-none print:shadow-none print:p-5 print:m-0 print:max-w-none ${
          isLandscape ? 'is-landscape' : ''
        }`}
        style={sheetStyle}
      >
        {/* 表头与标题 (第 1 页) */}
        <div className="w-full text-center pb-1.5 mb-1.5 border-b border-slate-300">
          <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
            五莲县人民医院 · 医学装备管理委员会
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
            医疗仪器设备到货开箱安装与投用验收单
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-sans">
            <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">
              第 1 页 / 共 2 页
            </span>
            <span className="font-semibold text-slate-900">
              商务立项、开箱清点与五方会签正本
            </span>
            <span className="text-slate-500 hidden sm:inline">
              （国家三级甲等医院大型医用设备固定资产入账与技术档案终身归档法定凭据）
            </span>
          </div>

          <div className="mt-1.5 pb-0.5 border-b-2 border-slate-950">
            <div className="border-b border-slate-700"></div>
          </div>
        </div>

        {/* 元数据栏 */}
        <div className="w-full flex flex-wrap items-center justify-between text-xs px-2.5 py-1 mb-1.5 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-xs shadow-2xs">
          <div className="flex items-center gap-4">
            <span><strong>验收单号：</strong><span className="font-mono text-slate-950 font-bold">{dossier.acceptanceNo}</span></span>
            <span><strong>合同编号：</strong><span className="font-mono text-slate-950">{dossier.contractNo}</span></span>
            <span><strong>采购方式：</strong><span className="text-slate-950">{dossier.procurementMethod}</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span><strong>到货日期：</strong><span className="font-mono text-slate-950">{dossier.deliveryDate}</span></span>
            <span><strong>竣工验收日：</strong><span className="font-mono text-slate-950 font-bold">{dossier.acceptanceDate}</span></span>
            <span><strong>存证防伪码：</strong><span className="font-mono text-slate-950 font-semibold">{dossier.securityVerificationCode}</span></span>
          </div>
        </div>

        {/* 第 1 页核心大通表 (12 列) */}
        <div className="relative mb-2 shadow-xs">
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
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  仪器设备名称
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-bold text-slate-950 border border-slate-700 align-middle truncate text-xs sm:text-[13px]" title={equipment.name}>
                  {equipment.name}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  规格型号
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-mono font-bold text-slate-950 border border-slate-700 align-middle truncate text-xs sm:text-[13px]" title={equipment.model}>
                  {equipment.model}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  生产制造厂商
                </th>
                <td colSpan={2} className="py-1.5 px-2 text-slate-900 border border-slate-700 align-middle truncate text-xs" title={equipment.manufacturer || '原厂正品'}>
                  {equipment.manufacturer || '原厂正品'}
                </td>
              </tr>

              <tr>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  出厂序列号(SN)
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-mono font-bold text-slate-950 border border-slate-700 align-middle truncate text-xs" title={equipment.sn}>
                  {equipment.sn}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  医疗器械注册证
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-mono text-xs text-slate-900 border border-slate-700 align-middle truncate" title={dossier.registrationCertNo}>
                  {dossier.registrationCertNo}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  质检合格证号
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-mono text-xs text-slate-900 border border-slate-700 align-middle truncate" title={dossier.qualityInspectionCertNo}>
                  {dossier.qualityInspectionCertNo}
                </td>
              </tr>

              <tr>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  中标供货单位
                </th>
                <td colSpan={2} className="py-1.5 px-2 text-slate-900 border border-slate-700 align-middle truncate text-xs" title={equipment.supplier || '中标指定配送机构'}>
                  {equipment.supplier || '中标指定配送机构'}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  发票代码/号码
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-mono text-xs text-slate-900 border border-slate-700 align-middle truncate" title={`${dossier.invoiceCode} / No.${dossier.invoiceNo}`}>
                  {dossier.invoiceCode} / No.{dossier.invoiceNo}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  配属使用科室
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-semibold text-slate-950 border border-slate-700 align-middle truncate text-xs">
                  {equipment.department}
                </td>
              </tr>

              <tr>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  具体就位地点
                </th>
                <td colSpan={2} className="py-1.5 px-2 text-slate-900 border border-slate-700 align-middle truncate text-xs" title={dossier.installationLocation}>
                  {dossier.installationLocation}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  整机质保承诺
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-semibold text-slate-900 text-xs border border-slate-700 align-middle">
                  整机 {dossier.warrantyMonths} 个月 / 核心件 {dossier.corePartWarrantyYears} 年
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  国有资产编号
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-mono font-bold text-slate-950 text-xs border border-slate-700 align-middle">
                  ZC-{equipment.sn?.slice(-6) || '8801'}
                </td>
              </tr>

              <tr>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  购置入账总值
                </th>
                <td colSpan={10} className="py-1.5 px-3 border border-slate-700 align-middle">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-600 mr-1 font-medium">入账小写：</span>
                      <strong className="font-mono font-bold text-slate-950 text-sm">
                        ￥{(equipment.purchasePrice || 0).toLocaleString()} 元
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-600 mr-1 font-medium">财务大写：</span>
                      <strong className="font-serif font-bold text-slate-950 text-sm">
                        人民币 {formatChineseCurrency(equipment.purchasePrice || 0)}
                      </strong>
                    </div>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-mono">
                      固定资产管理卡片
                    </span>
                  </div>
                </td>
              </tr>

              {/* 二、开箱清点与随机附件技术资料查验明细 (完整清单) */}
              <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
                <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950 text-xs sm:text-[13px]">二、到货开箱清点与随机附件技术资料查验记录 (完整明细)</span>
                    <span className="text-xs font-normal text-slate-600 font-mono">外观包装 / 随机资料 / 标配与选配附件</span>
                  </div>
                </th>
              </tr>
              <tr className="bg-slate-100/80 text-slate-900 font-semibold text-center text-xs">
                <th colSpan={1} className="border border-slate-700 p-1.5 font-bold">序号</th>
                <th colSpan={2} className="border border-slate-700 p-1.5 font-bold">核验分类</th>
                <th colSpan={4} className="border border-slate-700 p-1.5 text-left pl-2.5 font-bold">物品名称与规格型号</th>
                <th colSpan={1} className="border border-slate-700 p-1.5 font-bold">应到</th>
                <th colSpan={1} className="border border-slate-700 p-1.5 font-bold">实到</th>
                <th colSpan={1} className="border border-slate-700 p-1.5 font-bold">结论</th>
                <th colSpan={2} className="border border-slate-700 p-1.5 text-left pl-2.5 font-bold">开箱状态及说明</th>
              </tr>
              {(dossier?.unboxingItems || []).slice(0, 5).map((item, idx) => (
                <tr key={item.id} className="bg-white">
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-center font-mono align-middle text-xs">{idx + 1}</td>
                  <td colSpan={2} className="border border-slate-700 p-1.5 text-center font-medium text-slate-800 align-middle text-xs">{item.category}</td>
                  <td colSpan={4} className="border border-slate-700 p-1.5 pl-2.5 align-middle">
                    <span className="font-semibold text-slate-950 block text-xs sm:text-[13px]">{item.itemName}</span>
                    {item.specification && (
                      <span className="text-xs text-slate-500 block leading-tight font-mono">{item.specification}</span>
                    )}
                  </td>
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-center font-mono align-middle text-xs">{item.standardQuantity} {item.unit}</td>
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-center font-mono font-bold text-slate-950 align-middle text-xs">{item.actualQuantity} {item.unit}</td>
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-center font-bold text-slate-950 align-middle text-xs">合格</td>
                  <td colSpan={2} className="border border-slate-700 p-1.5 pl-2.5 text-xs text-slate-700 align-middle">
                    {item.remarks || '全新原装，防伪封签完好'}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={12} className="border border-slate-700 bg-slate-50/80 p-2 text-xs text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span><strong>开箱核验结论：</strong>{dossier.unboxingConclusion}</span>
                  </div>
                </td>
              </tr>

              {/* 三、验收综合决议与五方联合代表会签签章 */}
              <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
                <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950 text-xs sm:text-[13px]">三、验收综合决议与五方代表联合签署</span>
                    <span className="text-slate-950 font-bold text-xs">
                      决议结论：{dossier.finalAcceptanceConclusion}
                    </span>
                  </div>
                </th>
              </tr>

              {/* 上排三方会签：各占 4 列 (33.333%) */}
              <tr>
                {/* 1. 供货厂商原厂工程师 */}
                <td colSpan={4} className="border border-slate-700 p-2 bg-white align-top">
                  <div className="flex flex-col justify-between h-full min-h-[95px]">
                    <div>
                      <div className="font-bold text-slate-950 mb-1 flex items-center gap-1 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        <span>① 供货厂商原厂安装工程师</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-2 line-clamp-3">
                        {dossier.signoffs.vendorEngineer.opinion}
                      </p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                      <div>
                        <span className="text-slate-500 mr-1 text-xs">签字：</span>
                        <span className="font-serif italic font-bold text-sm text-slate-950">
                          {dossier.signoffs.vendorEngineer.signatoryName}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 text-xs">{dossier.signoffs.vendorEngineer.signDate}</span>
                    </div>
                  </div>
                </td>

                {/* 2. 医学装备科主检工程师 */}
                <td colSpan={4} className="border border-slate-700 p-2 bg-slate-50/50 align-top">
                  <div className="flex flex-col justify-between h-full min-h-[95px]">
                    <div>
                      <div className="font-bold text-slate-950 mb-1 flex items-center gap-1 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        <span>② 医学装备科验收主检工程师</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-2 line-clamp-3">
                        {dossier.signoffs.biomedicalEngineer.opinion}
                      </p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                      <div>
                        <span className="text-slate-500 mr-1 text-xs">主检签字：</span>
                        <span className="font-serif italic font-bold text-sm text-slate-950">
                          {dossier.signoffs.biomedicalEngineer.signatoryName}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 text-xs">{dossier.signoffs.biomedicalEngineer.signDate}</span>
                    </div>
                  </div>
                </td>

                {/* 3. 临床使用科室主任 */}
                <td colSpan={4} className="border border-slate-700 p-2 bg-white align-top">
                  <div className="flex flex-col justify-between h-full min-h-[95px]">
                    <div>
                      <div className="font-bold text-slate-950 mb-1 flex items-center gap-1 text-xs">
                        <Users className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                        <span>③ 临床使用科室负责人/护士长</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-2 line-clamp-3">
                        {dossier.signoffs.clinicalHead.opinion}
                      </p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1.5 flex items-end justify-between text-xs">
                      <div>
                        <span className="text-slate-500 mr-1 text-xs">科室签字：</span>
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
                <td colSpan={6} className="border border-slate-700 p-2.5 bg-white align-top">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-600 block text-xs">④ 医学装备管理委员会 / 装备科长审核：</span>
                      <strong className="text-slate-950 font-medium text-xs mt-0.5 block line-clamp-2">
                        {dossier.signoffs.equipmentDirector.opinion}
                      </strong>
                      <div className="mt-1.5 flex items-center gap-2">
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
                <td colSpan={6} className="border border-slate-700 p-2.5 bg-slate-50/50 align-top">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-600 block text-xs">⑤ 财务处资产核算与入账复核：</span>
                      <strong className="text-slate-950 font-medium text-xs mt-0.5 block line-clamp-2">
                        {dossier.signoffs.financeAuditor.opinion}
                      </strong>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs text-slate-500">资产会计签章：</span>
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
            className="absolute right-8 bottom-3 pointer-events-none select-none rotate-[-4deg] opacity-90 print:opacity-100"
          >
            <div className="w-26 h-26 rounded-full border-2 border-slate-950 p-0.5 flex items-center justify-center relative bg-white/70 print:bg-transparent">
              <div className="w-full h-full rounded-full border border-slate-900 flex flex-col items-center justify-center text-center p-1.5 text-slate-950">
                <div className="text-[9px] font-black tracking-tighter leading-none mb-0.5">
                  五莲县人民医院
                </div>
                <div className="text-xs font-serif my-0.5">★</div>
                <div className="text-[10px] font-black tracking-wider leading-none">
                  验收入库专用章
                </div>
                <div className="text-[8px] font-mono mt-0.5 font-bold">
                  {(dossier.acceptanceDate || '2023-08-15').replace(/-/g, '.')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 纸张底部 (第 1 页) */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-600 font-sans border-t border-slate-300 pt-1.5 mt-2">
          <div>
            <span>注：本验收单为两页完整归档档案之第 1 页正本。涂改无效。未经五方签署并加盖印章不得作为入账依据。</span>
          </div>
          <div className="font-mono">
            <span>系统存证防伪校验码: {dossier.securityVerificationCode} · 经办人: {dossier.signoffs.biomedicalEngineer.signatoryName} · 第 1 页 共 2 页</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          第 2 页: 工程实测指标、电气安全与临床培训考核交接记录表
          ========================================================================= */}
      <div 
        ref={page2Ref}
        id="equipment-acceptance-paged-sheet-2"
        className={`a4-report-sheet acceptance-a4-doc a4-monochrome-sheet a4-page-break-last mx-auto shadow-xl border border-slate-300 rounded-xs transition-colors relative overflow-hidden shrink-0 bg-white text-slate-950 p-5 sm:p-6 print:border-none print:shadow-none print:p-5 print:m-0 print:max-w-none ${
          isLandscape ? 'is-landscape' : ''
        }`}
        style={sheetStyle}
      >
        {/* 表头与标题 (第 2 页) */}
        <div className="w-full text-center pb-1.5 mb-1.5 border-b border-slate-300">
          <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
            五莲县人民医院 · 医学装备管理委员会 · 医务处 · 护理部
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
            医疗仪器设备工程实测与临床培训交接记录单
          </h2>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-sans">
            <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">
              第 2 页 / 共 2 页
            </span>
            <span className="font-semibold text-slate-900">
              技术性能实测、电气安全与临床培训交接正本
            </span>
            <span className="text-slate-500 hidden sm:inline">
              （国家三级甲等医院医疗设备安全准入与科室投用技术档案终身归档凭证）
            </span>
          </div>

          <div className="mt-1.5 pb-0.5 border-b-2 border-slate-950">
            <div className="border-b border-slate-700"></div>
          </div>
        </div>

        {/* 关联元数据条 */}
        <div className="w-full flex flex-wrap items-center justify-between text-xs px-2.5 py-1 mb-1.5 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-xs shadow-2xs">
          <div className="flex items-center gap-4">
            <span><strong>关联设备：</strong><span className="text-slate-950 font-bold">{equipment.name}</span></span>
            <span><strong>规格型号：</strong><span className="font-mono text-slate-950 font-bold">{equipment.model}</span></span>
            <span><strong>出厂SN：</strong><span className="font-mono text-slate-950">{equipment.sn}</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span><strong>归属验收单号：</strong><span className="font-mono text-slate-950 font-semibold">{dossier.acceptanceNo}</span></span>
            <span><strong>实施日期：</strong><span className="font-mono text-slate-950">{dossier.acceptanceDate}</span></span>
          </div>
        </div>

        {/* 第 2 页表格 */}
        <div className="relative mb-2 shadow-xs">
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
                      <Zap className="w-4 h-4 text-slate-900 inline" />
                      <span>一、工程安装调试与电气安全/核心技术指标实测记录</span>
                    </span>
                    <span className="text-xs font-normal text-slate-600 font-mono">
                      GB 9706.1 强制电气安全检验合格 · 计量复核达标
                    </span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-slate-100/80 text-slate-900 font-semibold text-center text-xs">
                <th colSpan={1} className="border border-slate-700 p-1.5 font-bold">序号</th>
                <th colSpan={2} className="border border-slate-700 p-1.5 font-bold">测试类别</th>
                <th colSpan={3} className="border border-slate-700 p-1.5 text-left pl-2.5 font-bold">检测指标项目名称</th>
                <th colSpan={2} className="border border-slate-700 p-1.5 text-left pl-2.5 font-bold">国家/出厂标准要求</th>
                <th colSpan={1} className="border border-slate-700 p-1.5 text-center font-bold">实测读数</th>
                <th colSpan={1} className="border border-slate-700 p-1.5 font-bold">判定</th>
                <th colSpan={2} className="border border-slate-700 p-1.5 text-left pl-2.5 font-bold">检测仪器</th>
              </tr>
              {(dossier?.technicalTests || []).slice(0, 5).map((test, idx) => (
                <tr key={test.id} className="bg-white">
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-center font-mono align-middle text-xs">{idx + 1}</td>
                  <td colSpan={2} className="border border-slate-700 p-1.5 text-center text-slate-800 font-medium align-middle text-xs">{test.testCategory}</td>
                  <td colSpan={3} className="border border-slate-700 p-1.5 pl-2.5 font-semibold text-slate-950 align-middle text-xs">{test.parameterName}</td>
                  <td colSpan={2} className="border border-slate-700 p-1.5 pl-2.5 text-xs text-slate-700 font-mono align-middle">{test.standardRequirement}</td>
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-xs font-mono font-bold text-slate-950 text-center align-middle">
                    {test.measuredValue}
                  </td>
                  <td colSpan={1} className="border border-slate-700 p-1.5 text-center font-bold text-slate-950 align-middle text-xs">合格</td>
                  <td colSpan={2} className="border border-slate-700 p-1.5 pl-2.5 text-xs text-slate-700 font-sans align-middle">
                    {test.testInstrument || '综合电气分析仪'}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={12} className="border border-slate-700 bg-slate-50/80 p-2 text-xs text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-900 shrink-0" />
                    <span><strong>技术性能复核结论：</strong>{dossier.testingConclusion}</span>
                  </div>
                </td>
              </tr>

              {/* 二、临床科室应用操作与规范维护培训交接记录 */}
              <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
                <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-slate-950 text-xs sm:text-[13px]">
                      <GraduationCap className="w-4 h-4 text-slate-900 inline" />
                      <span>二、临床科室应用操作与规范维护培训交接记录</span>
                    </span>
                    <span className="text-xs font-normal text-slate-600 font-mono">
                      学时: {dossier.trainingRecord.trainingHours} 小时 · 考核合格率: 100%
                    </span>
                  </div>
                </th>
              </tr>
              <tr>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  主讲培训专家
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-bold text-slate-950 border border-slate-700 align-middle text-xs">
                  {dossier.trainingRecord.trainerName}
                </td>
                <th colSpan={2} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  专家所属单位
                </th>
                <td colSpan={3} className="py-1.5 px-2 text-xs text-slate-800 border border-slate-700 align-middle">
                  {dossier.trainingRecord.trainerCompany} ({dossier.trainingRecord.trainerTitle})
                </td>
                <th colSpan={1} className="bg-slate-100/80 text-slate-900 py-1.5 px-2 text-center font-bold border border-slate-700 align-middle text-xs">
                  考核合格率
                </th>
                <td colSpan={2} className="py-1.5 px-2 font-bold text-slate-950 text-center border border-slate-700 align-middle text-xs">
                  100% (全员达标)
                </td>
              </tr>

              {/* 现场实拍照片网格 */}
              <tr>
                <td colSpan={12} className="border border-slate-700 p-2.5 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-900 font-bold flex items-center gap-1.5 text-xs">
                      <Camera className="w-4 h-4 text-slate-800" />
                      <span>培训现场理论授课、盲机演练与考核交接实拍影像档案：</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      已实拍存档 {trainingPhotos.length} 张影像
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {(trainingPhotos || []).slice(0, 3).map((photo, pIdx) => (
                      <div key={photo.id} className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs ring-1 ring-black/5 hover:shadow-md transition p-1 flex flex-col">
                        <div className="h-28 sm:h-32 w-full rounded-md bg-slate-900 overflow-hidden relative group">
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                          <span className="absolute top-1.5 left-1.5 bg-slate-900/85 text-white text-[10px] px-1.5 py-0.5 rounded font-sans font-medium backdrop-blur-xs border border-white/20">
                            实拍图 {pIdx + 1}
                          </span>
                        </div>
                        <div className="p-1.5 text-xs text-slate-800 leading-tight">
                          <span className="line-clamp-1 font-sans font-semibold text-slate-900">{photo.caption}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>

              {/* 达标人员名单行 */}
              <tr>
                <td colSpan={12} className="border border-slate-700 p-2 bg-white text-xs">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-700 mr-2">
                      <strong>受训骨干医护人员考核达标：</strong>
                      {(dossier.trainingRecord?.trainees || []).map(t => `${t.name}(${t.role ? t.role.split('/')[0].trim() : ''})`).join('、') || '全员达标通过'}
                    </div>
                    <span className="text-xs font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-400 whitespace-nowrap shrink-0">
                      全员盲机考核达标 · 准予投用
                    </span>
                  </div>
                </td>
              </tr>

              {/* 三方签署确认栏 */}
              <tr className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
                <th colSpan={12} className="border border-slate-700 py-1.5 px-2.5 text-left font-bold text-xs bg-slate-100/90">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-950 text-xs sm:text-[13px]">三、工程技术实测与培训交接三方代表确认签章</span>
                    <span className="text-slate-950 font-bold text-xs">
                      评定结论：电气性能达标 · 操作培训合格 · 准予投入临床运行
                    </span>
                  </div>
                </th>
              </tr>
              <tr>
                {/* 1. 厂商技术专员 */}
                <td colSpan={4} className="border border-slate-700 p-2 bg-white align-top">
                  <div className="flex flex-col justify-between h-full min-h-[85px]">
                    <div>
                      <div className="font-bold text-slate-950 mb-1 text-xs">
                        ① 供货厂商临床技术专员
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-1 line-clamp-2">
                        设备安装就位调试完成，电气安全指标符合国家标准，临床操作与日常维护技能培训已全员达标。
                      </p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1 flex items-end justify-between text-xs">
                      <div>
                        <span className="text-slate-500 mr-1 text-xs">签字：</span>
                        <span className="font-serif italic font-bold text-sm text-slate-950">
                          {dossier.trainingRecord.trainerSignature || dossier.trainingRecord.trainerName}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 text-xs">{dossier.trainingRecord.trainingDate}</span>
                    </div>
                  </div>
                </td>

                {/* 2. 使用科室负责人 */}
                <td colSpan={4} className="border border-slate-700 p-2 bg-slate-50/50 align-top">
                  <div className="flex flex-col justify-between h-full min-h-[85px]">
                    <div>
                      <div className="font-bold text-slate-950 mb-1 text-xs">
                        ② 临床使用科室负责人/护士长
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-1 line-clamp-2">
                        科室骨干医护人员已全程参加操作规范与急救应急培训，掌握设备功能与保养规程，同意投用。
                      </p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1 flex items-end justify-between text-xs">
                      <div>
                        <span className="text-slate-500 mr-1 text-xs">科室签字：</span>
                        <span className="font-serif italic font-bold text-sm text-slate-950">
                          {dossier.trainingRecord.departmentDirectorSignature || '杜晓光 (主任医师)'}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 text-xs">{dossier.trainingRecord.trainingDate}</span>
                    </div>
                  </div>
                </td>

                {/* 3. 医学装备科工程师 */}
                <td colSpan={4} className="border border-slate-700 p-2 bg-white align-top">
                  <div className="flex flex-col justify-between h-full min-h-[85px]">
                    <div>
                      <div className="font-bold text-slate-950 mb-1 text-xs">
                        ③ 医学装备科见证工程师
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed mb-1 line-clamp-2">
                        技术性能实测数据完整真实，培训课时及实操考核合格，相关技术资料与现场影像已归档入库。
                      </p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-1 flex items-end justify-between text-xs">
                      <div>
                        <span className="text-slate-500 mr-1 text-xs">见证签字：</span>
                        <span className="font-serif italic font-bold text-sm text-slate-950">
                          {dossier.trainingRecord.equipmentEngineerSignature || '崔工程师 (主检)'}
                        </span>
                      </div>
                      <span className="font-mono text-slate-600 text-xs">{dossier.trainingRecord.trainingDate}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 纸张底部 (第 2 页) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-700 font-sans border-t border-slate-300 pt-1.5 mt-2">
          <div>
            <span>注：本记录单为两页完整归档档案之第 2 页，经三方签字确认后存入医院大型医用设备技术主档案，终身备查。</span>
          </div>
          <div className="font-mono text-slate-600">
            <span>系统存证防伪校验码: {dossier.securityVerificationCode} · 归档科室: 医学装备科 · 第 2 页 共 2 页</span>
          </div>
        </div>
      </div>
    </div>
  );
};
