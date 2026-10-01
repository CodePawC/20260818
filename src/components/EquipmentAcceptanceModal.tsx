import React, { useRef, useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  FileCheck2, 
  Package, 
  Zap, 
  GraduationCap, 
  Users, 
  Loader2, 
  FileText, 
  Camera, 
  Plus, 
  Trash2, 
  Eye, 
  LayoutGrid, 
  Smartphone,
  Check,
  FileStack
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { MedicalEquipment, EquipmentAcceptanceDossier, TrainingPhoto, AcceptanceSignoffDetail } from '../types';
import { 
  getEquipmentAcceptanceDossier, 
  saveEquipmentAcceptanceDossier,
  getStoredTrainingPhotos,
  saveStoredTrainingPhotos
} from '../utils/equipmentAcceptanceData';
import { EquipmentAcceptanceSingleSheet } from './EquipmentAcceptanceSingleSheet';
import { EquipmentAcceptancePagedSheets } from './EquipmentAcceptancePagedSheets';
import { EquipmentTrainingSheets } from './EquipmentTrainingSheets';
import { TrainingPhotoUploadModal } from './TrainingPhotoUploadModal';

interface EquipmentAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: MedicalEquipment | null;
  initialViewMode?: 'paper' | 'training_paper' | 'unboxing' | 'technical' | 'photos' | 'signoffs';
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
    } else if (!str.startsWith('零') && str.length > 0) {
      str = '零' + str;
    }
    integerPart = Math.floor(integerPart / 10);
    unitIdx++;
  }
  return (str || '零') + '元整';
}

export const EquipmentAcceptanceModal: React.FC<EquipmentAcceptanceModalProps> = ({
  isOpen,
  onClose,
  equipment,
  initialViewMode = 'paper'
}) => {
  if (!isOpen || !equipment) return null;

  // 核心视图切换
  const [activeViewMode, setActiveViewMode] = useState<'paper' | 'training_paper' | 'unboxing' | 'technical' | 'photos' | 'signoffs'>(initialViewMode);
  
  // 打印与幅面排版模式: 'single' (尽量一页纸) | 'paged' (严格分页)
  const [pageLayoutMode, setPageLayoutMode] = useState<'single' | 'paged'>('single');

  // 纸张方向: 默认横向 (更符合宽表格与标准 A4 报表排版)
  const [pageOrientation, setPageOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // 档案数据与照片状态
  const [dossier, setDossier] = useState<EquipmentAcceptanceDossier>(() => 
    getEquipmentAcceptanceDossier(equipment)
  );

  const [trainingPhotos, setTrainingPhotos] = useState<TrainingPhoto[]>(() => 
    getStoredTrainingPhotos(equipment?.id || '')
  );

  // 弹窗与交互状态
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewingPhoto, setPreviewingPhoto] = useState<TrainingPhoto | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');

  // 打印与 PDF 抓取 Refs
  const singleSheetRef = useRef<HTMLDivElement | null>(null);
  const pagedSheet1Ref = useRef<HTMLDivElement | null>(null);
  const pagedSheet2Ref = useRef<HTMLDivElement | null>(null);
  const trainingSheetRef = useRef<HTMLDivElement | null>(null);
  const unboxingSheetRef = useRef<HTMLDivElement | null>(null);
  const technicalSheetRef = useRef<HTMLDivElement | null>(null);
  const signoffsSheetRef = useRef<HTMLDivElement | null>(null);

  // 同步初始化模式
  useEffect(() => {
    setActiveViewMode(initialViewMode);
  }, [initialViewMode]);

  // 当设备变更时重新载入档案
  useEffect(() => {
    if (equipment) {
      const loaded = getEquipmentAcceptanceDossier(equipment);
      setDossier(loaded);
      const photos = getStoredTrainingPhotos(equipment.id);
      setTrainingPhotos(photos);
    }
  }, [equipment]);

  // 原生系统打印
  const handlePrint = () => {
    window.print();
  };

  // 高清导出 A4 PDF 档案 (支持单页与分页双页自动拼接)
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const isLandscape = pageOrientation === 'landscape';
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;

      if (activeViewMode === 'paper') {
        if (pageLayoutMode === 'single') {
          // 单页模式：单张 A4
          if (!singleSheetRef.current) throw new Error('未找到单页验收单DOM');
          setPdfProgress('正在捕获 A4 单页验收单正本...');
          const dataUrl = await toJpeg(singleSheetRef.current, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
          pdf.save(`五莲县人民医院_医疗仪器设备验收单_${equipment.sn}_单页正本.pdf`);
        } else {
          // 分页模式：两页严格分离
          if (!pagedSheet1Ref.current || !pagedSheet2Ref.current) {
            throw new Error('未找到分页验收单DOM');
          }
          setPdfProgress('正在生成第 1 页 (立项开箱与五方签署)...');
          const page1Url = await toJpeg(pagedSheet1Ref.current, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          pdf.addImage(page1Url, 'JPEG', 0, 0, pageWidth, pageHeight);

          setPdfProgress('正在生成第 2 页 (技术实测与临床培训)...');
          const page2Url = await toJpeg(pagedSheet2Ref.current, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: '#ffffff'
          });
          pdf.addPage('a4', isLandscape ? 'landscape' : 'portrait');
          pdf.addImage(page2Url, 'JPEG', 0, 0, pageWidth, pageHeight);

          pdf.save(`五莲县人民医院_医疗仪器设备验收单_${equipment.sn}_完整双页版.pdf`);
        }
      } else if (activeViewMode === 'training_paper') {
        // 培训交接考核表
        if (!trainingSheetRef.current) throw new Error('未找到培训单DOM');
        setPdfProgress('正在生成 A4 临床培训考核交接单...');
        const dataUrl = await toJpeg(trainingSheetRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        pdf.save(`五莲县人民医院_临床培训考核交接单_${equipment.sn}.pdf`);
      } else if (activeViewMode === 'unboxing') {
        if (!unboxingSheetRef.current) throw new Error('未找到开箱清单DOM');
        setPdfProgress('正在生成 A4 开箱清点明细表...');
        const dataUrl = await toJpeg(unboxingSheetRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        pdf.save(`五莲县人民医院_开箱清点明细表_${equipment.sn}.pdf`);
      } else if (activeViewMode === 'technical') {
        if (!technicalSheetRef.current) throw new Error('未找到实测报告DOM');
        setPdfProgress('正在生成 A4 技术性能检验报告...');
        const dataUrl = await toJpeg(technicalSheetRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        pdf.save(`五莲县人民医院_技术实测报告_${equipment.sn}.pdf`);
      } else if (activeViewMode === 'signoffs') {
        if (!signoffsSheetRef.current) throw new Error('未找到会签表DOM');
        setPdfProgress('正在生成 A4 五方联合签批表...');
        const dataUrl = await toJpeg(signoffsSheetRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight);
        pdf.save(`五莲县人民医院_五方签批审批表_${equipment.sn}.pdf`);
      }
    } catch (err) {
      console.error('导出 PDF 失败:', err);
      alert('导出 PDF 失败，请直接使用“调用系统打印”并在打印机选项中选择“另存为 PDF”。');
    } finally {
      setIsExportingPdf(false);
      setPdfProgress('');
    }
  };

  // 新增照片
  const handlePhotoUploaded = (newPhoto: TrainingPhoto) => {
    const updated = [newPhoto, ...trainingPhotos];
    setTrainingPhotos(updated);
    saveStoredTrainingPhotos(equipment.id, updated);

    const updatedDossier = {
      ...dossier,
      trainingRecord: {
        ...dossier.trainingRecord,
        photos: updated
      }
    };
    setDossier(updatedDossier);
    saveEquipmentAcceptanceDossier(equipment.id, updatedDossier);
  };

  // 删除照片
  const handleDeletePhoto = (photoId: string) => {
    if (!window.confirm('确定要从本设备的培训档案中移除该张现场照片吗？')) {
      return;
    }
    const updated = trainingPhotos.filter(p => p.id !== photoId);
    setTrainingPhotos(updated);
    saveStoredTrainingPhotos(equipment.id, updated);

    const updatedDossier = {
      ...dossier,
      trainingRecord: {
        ...dossier.trainingRecord,
        photos: updated
      }
    };
    setDossier(updatedDossier);
    saveEquipmentAcceptanceDossier(equipment.id, updatedDossier);
  };

  const isLandscape = pageOrientation === 'landscape';

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:z-auto">
      <div 
        id="equipment-acceptance-modal"
        className={`bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full transition-all flex flex-col max-h-[95vh] overflow-hidden print:max-h-none print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none ${
          isLandscape ? 'max-w-[1300px]' : 'max-w-5xl'
        }`}
      >
        
        {/* ======================= 头部工具条 (Screen only) ======================= */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  <span>医疗仪器设备验收与培训档案 (A4规范化打印系统)</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    黑白激光打印优化 · 无彩色联单限制
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>设备: <strong className="text-slate-200">{equipment.name}</strong></span>
                <span>·</span>
                <span className="font-mono">SN: <strong className="text-slate-200">{equipment.sn}</strong></span>
                <span>·</span>
                <span>科室: <strong className="text-slate-200">{equipment.department}</strong></span>
                <span>·</span>
                <span className="text-emerald-300 font-semibold">适印 A4 标准幅面</span>
              </div>
            </div>
          </div>

          {/* 快捷操作区 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 纸张方向切换: 竖向 / 横向 */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPageOrientation('landscape')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  pageOrientation === 'landscape'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="切换为 A4 横向排版 (297×210mm，推荐宽表格横向排列)"
              >
                <LayoutGrid className="w-3.5 h-3.5 rotate-90" />
                <span>横向 A4</span>
              </button>
              <button
                type="button"
                onClick={() => setPageOrientation('portrait')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  pageOrientation === 'portrait'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="切换为 A4 竖向排版 (210×297mm)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>竖向 A4</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer shadow-2xs"
              title="调用系统原生打印预览或另存为 PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>调用系统打印</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
              title="导出带高对比度公章与矢量排版的高清 A4 格式 PDF"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? '正在导出...' : '导出 A4 PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================= 二级导航：所有表格 A4 规范切换 (Screen only) ======================= */}
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          
          {/* 左侧：全部报表选项卡 */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveViewMode('paper')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'paper'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-900" />
              <span>📄 综合验收入库单 (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('training_paper')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'training_paper'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-slate-900" />
              <span>🎓 临床培训交接单 (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('unboxing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'unboxing'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4 text-slate-900" />
              <span>📦 开箱清点明细 (A4单页)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('technical')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'technical'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-slate-900" />
              <span>⚡ 技术实测报告 (A4单页)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('signoffs')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'signoffs'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-slate-900" />
              <span>🖋️ 五方签批表 (A4单页)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveViewMode('photos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeViewMode === 'photos'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-slate-900" />
              <span>📸 现场实拍档案 ({trainingPhotos.length})</span>
            </button>
          </div>

          {/* 右侧：当在验收入库单时，支持单页与分页切换 */}
          {activeViewMode === 'paper' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium px-2 flex items-center gap-1">
                <span>排版策略:</span>
              </span>
              <button
                type="button"
                onClick={() => setPageLayoutMode('single')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  pageLayoutMode === 'single'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="优先紧凑排版，确保所有核心信息完整容纳于一页 A4 纸内"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 尽量单页模式 (1页纸)</span>
              </button>
              <button
                type="button"
                onClick={() => setPageLayoutMode('paged')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  pageLayoutMode === 'paged'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="完整信息全量展示，按第1页立项开箱会签+第2页技术实测培训实照严格分页"
              >
                <FileStack className="w-3.5 h-3.5" />
                <span>📑 完整双页模式 (2页纸)</span>
              </button>
            </div>
          )}
        </div>

        {/* 提示通知条：说明不支持彩色打印与无碳联单已移除 */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-600 font-sans print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 bg-slate-200 px-1.5 py-0.2 rounded text-[10px]">
              黑白适印优化
            </span>
            <span>已取消四联彩色复写与彩色网底，全表采用深黑高对比线框、标准宋体与单色验讫专用章，适配各类医院激光黑白打印机。</span>
          </div>
          <div className="font-mono text-slate-400">
            幅面：{isLandscape ? 'A4 横向 (297×210mm)' : 'A4 竖向 (210×297mm)'} · 当前模式: {pageLayoutMode === 'single' ? '单页优先' : '两页完整归档'}
          </div>
        </div>

        {/* ======================= 中间主工作区：A4 纸质档案预览 ======================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 print:p-0 print:bg-white print:overflow-visible">
          
          {/* 1. 综合验收入库单 (单页或双页模式) */}
          <div className={activeViewMode === 'paper' ? 'block' : 'hidden print:hidden'}>
            {pageLayoutMode === 'single' ? (
              <EquipmentAcceptanceSingleSheet
                equipment={equipment}
                dossier={dossier}
                trainingPhotos={trainingPhotos}
                pageOrientation={pageOrientation}
                sheetRef={singleSheetRef}
                onSwitchToTraining={() => setActiveViewMode('training_paper')}
              />
            ) : (
              <EquipmentAcceptancePagedSheets
                equipment={equipment}
                dossier={dossier}
                trainingPhotos={trainingPhotos}
                pageOrientation={pageOrientation}
                page1Ref={pagedSheet1Ref}
                page2Ref={pagedSheet2Ref}
              />
            )}
          </div>

          {/* 2. 临床操作与规范维护培训交接单 (独立 A4 单页档案) */}
          <div className={activeViewMode === 'training_paper' ? 'block' : 'hidden print:hidden'}>
            <EquipmentTrainingSheets
              equipment={equipment}
              dossier={dossier}
              trainingPhotos={trainingPhotos}
              pageOrientation={pageOrientation}
              sheetRef={trainingSheetRef}
              onPreviewPhoto={(p) => setPreviewingPhoto(p)}
              onDeletePhoto={handleDeletePhoto}
              onOpenUpload={() => setIsUploadModalOpen(true)}
            />
          </div>

          {/* 3. 开箱清点明细表 (A4 单页标准版) */}
          <div className={activeViewMode === 'unboxing' ? 'block' : 'hidden print:hidden'}>
            <div 
              ref={unboxingSheetRef}
              id="unboxing-acceptance-a4-sheet"
              className={`a4-report-sheet acceptance-a4-doc a4-monochrome-sheet mx-auto shadow-xl border border-slate-300 rounded-xs transition-colors relative overflow-hidden shrink-0 bg-white text-slate-950 p-5 sm:p-6 print:border-none print:shadow-none print:p-5 print:m-0 print:max-w-none ${
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
              <div className="w-full text-center pb-1.5 mb-1.5 border-b border-slate-300">
                <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
                  五莲县人民医院 · 医学装备管理委员会
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
                  医疗仪器设备到货开箱清点与技术资料查验明细表
                </h1>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-sans">
                  <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">A4 单页明细</span>
                  <span>原厂包装指标 · NMPA 注册证 · 随机资料 · 标配与选配附件</span>
                </div>
                <div className="mt-1.5 pb-0.5 border-b-2 border-slate-950">
                  <div className="border-b border-slate-700"></div>
                </div>
              </div>

              <div className="w-full flex flex-wrap items-center justify-between text-xs sm:text-[13px] px-2.5 py-1.5 mb-2 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 shadow-2xs">
                <div className="flex items-center gap-4">
                  <span><strong>仪器名称：</strong><span className="text-slate-950 font-bold">{equipment.name}</span></span>
                  <span><strong>规格型号：</strong><span className="font-mono text-slate-950 font-bold">{equipment.model}</span></span>
                  <span><strong>序列号SN：</strong><span className="font-mono text-slate-950">{equipment.sn}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span><strong>清点日期：</strong><span className="font-mono text-slate-950">{dossier.deliveryDate}</span></span>
                  <span><strong>清点总项：</strong><span className="font-mono text-slate-950 font-bold">{dossier.unboxingItems.length} 项</span></span>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-700 table-fixed text-xs sm:text-[13px] font-sans mb-3 shadow-2xs">
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
                  <tr>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">序号</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">核验类别</th>
                    <th className="border border-slate-700 p-1.5 text-left pl-2 font-bold">物品/部件名称与出厂规格</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">应到数量</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">实到数量</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">状态判定</th>
                    <th className="border border-slate-700 p-1.5 text-left pl-2 font-bold">现场清点备注</th>
                  </tr>
                </thead>
                <tbody>
                  {(dossier.unboxingItems || []).map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="border border-slate-700 p-1.5 text-center font-mono align-middle">{idx + 1}</td>
                      <td className="border border-slate-700 p-1.5 text-center font-medium text-slate-800 align-middle">{item.category}</td>
                      <td className="border border-slate-700 p-1.5 pl-2 align-middle">
                        <span className="font-semibold text-slate-950 block">{item.itemName}</span>
                        {item.specification && (
                          <span className="text-[11px] text-slate-600 block leading-tight font-mono">{item.specification}</span>
                        )}
                      </td>
                      <td className="border border-slate-700 p-1.5 text-center font-mono align-middle">{item.standardQuantity} {item.unit}</td>
                      <td className="border border-slate-700 p-1.5 text-center font-mono font-bold text-slate-950 align-middle">{item.actualQuantity} {item.unit}</td>
                      <td className="border border-slate-700 p-1.5 text-center font-bold text-slate-950 align-middle">合格</td>
                      <td className="border border-slate-700 p-1.5 pl-2 text-xs text-slate-700 align-middle">
                        {item.remarks || '全新原装无破损'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border border-slate-700 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 p-2.5 mb-3 text-xs sm:text-[13px] text-slate-800 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span><strong>开箱核验综合结论：</strong>{dossier.unboxingConclusion}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-sans">
                  <span>清点见证人：<strong className="text-slate-950 font-serif">{dossier.signoffs.biomedicalEngineer.signatoryName}</strong></span>
                  <span>供货方代表：<strong className="text-slate-950 font-serif">{dossier.signoffs.vendorEngineer.signatoryName}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-600 font-sans border-t border-slate-300 pt-2">
                <span>注：本明细表为医疗仪器设备到货开箱清点单页法定档案，作为设备技术资料与资产档案附页。</span>
                <span className="font-mono">防伪存证码: {dossier.securityVerificationCode} · 第 1 页 共 1 页</span>
              </div>
            </div>
          </div>

          {/* 4. 技术性能与电气安全实测报告 (A4 单页标准版) */}
          <div className={activeViewMode === 'technical' ? 'block' : 'hidden print:hidden'}>
            <div 
              ref={technicalSheetRef}
              id="technical-acceptance-a4-sheet"
              className={`a4-report-sheet acceptance-a4-doc a4-monochrome-sheet mx-auto shadow-xl border border-slate-300 rounded-xs transition-colors relative overflow-hidden shrink-0 bg-white text-slate-950 p-5 sm:p-6 print:border-none print:shadow-none print:p-5 print:m-0 print:max-w-none ${
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
              <div className="w-full text-center pb-1.5 mb-1.5 border-b border-slate-300">
                <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
                  五莲县人民医院 · 医学装备管理委员会
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
                  医疗仪器设备工程实测与电气安全检验报告
                </h1>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-sans">
                  <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">A4 单页报告</span>
                  <span>国家强制标准 GB 9706.1 医用电气设备安全 · 核心性能实测</span>
                </div>
                <div className="mt-1.5 pb-0.5 border-b-2 border-slate-950">
                  <div className="border-b border-slate-700"></div>
                </div>
              </div>

              <div className="w-full flex flex-wrap items-center justify-between text-xs sm:text-[13px] px-2.5 py-1.5 mb-2 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 shadow-2xs">
                <div className="flex items-center gap-4">
                  <span><strong>受测设备：</strong><span className="text-slate-950 font-bold">{equipment.name}</span></span>
                  <span><strong>型号：</strong><span className="font-mono text-slate-950 font-bold">{equipment.model}</span></span>
                  <span><strong>SN：</strong><span className="font-mono text-slate-950">{equipment.sn}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span><strong>检验日期：</strong><span className="font-mono text-slate-950">{dossier.acceptanceDate}</span></span>
                  <span><strong>实测项：</strong><span className="font-mono text-slate-950 font-bold">{dossier.technicalTests.length} 项全合格</span></span>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-700 table-fixed text-xs sm:text-[13px] font-sans mb-3 shadow-2xs">
                <colgroup>
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 text-slate-950">
                  <tr>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">序号</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">测试类别</th>
                    <th className="border border-slate-700 p-1.5 text-left pl-2 font-bold">检测指标项目名称</th>
                    <th className="border border-slate-700 p-1.5 text-left pl-2 font-bold">国家/规范标准要求</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">实测读数</th>
                    <th className="border border-slate-700 p-1.5 text-center font-bold">判定</th>
                    <th className="border border-slate-700 p-1.5 text-left pl-2 font-bold">检测仪器</th>
                  </tr>
                </thead>
                <tbody>
                  {(dossier.technicalTests || []).map((t, idx) => (
                    <tr key={t.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="border border-slate-700 p-1.5 text-center font-mono align-middle">{idx + 1}</td>
                      <td className="border border-slate-700 p-1.5 text-center font-medium text-slate-800 align-middle">{t.testCategory}</td>
                      <td className="border border-slate-700 p-1.5 pl-2 font-semibold text-slate-950 align-middle">{t.parameterName}</td>
                      <td className="border border-slate-700 p-1.5 pl-2 text-[11px] text-slate-700 font-mono align-middle">{t.standardRequirement}</td>
                      <td className="border border-slate-700 p-1.5 text-center font-mono font-bold text-slate-950 align-middle">{t.measuredValue}</td>
                      <td className="border border-slate-700 p-1.5 text-center font-bold text-slate-950 align-middle">合格</td>
                      <td className="border border-slate-700 p-1.5 pl-2 text-[11px] text-slate-700 align-middle truncate">{t.testInstrument || '综合电气分析仪'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border border-slate-700 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 p-2.5 mb-3 text-xs sm:text-[13px] text-slate-800 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span><strong>工程技术性能检验结论：</strong>{dossier.testingConclusion}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-sans">
                  <span>检验工程师：<strong className="text-slate-950 font-serif">{dossier.signoffs.biomedicalEngineer.signatoryName}</strong></span>
                  <span>厂商工程师：<strong className="text-slate-950 font-serif">{dossier.signoffs.vendorEngineer.signatoryName}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-600 font-sans border-t border-slate-300 pt-2">
                <span>注：本检验报告符合 GB 9706.1 强制电气安全规程，作为医疗设备安全入网准用凭据。</span>
                <span className="font-mono">防伪存证码: {dossier.securityVerificationCode} · 第 1 页 共 1 页</span>
              </div>
            </div>
          </div>

          {/* 5. 五方联合会签审批表 (A4 单页标准版) */}
          <div className={activeViewMode === 'signoffs' ? 'block' : 'hidden print:hidden'}>
            <div 
              ref={signoffsSheetRef}
              id="signoffs-acceptance-a4-sheet"
              className={`a4-report-sheet acceptance-a4-doc a4-monochrome-sheet mx-auto shadow-xl border border-slate-300 rounded-xs transition-colors relative overflow-hidden shrink-0 bg-white text-slate-950 p-5 sm:p-6 print:border-none print:shadow-none print:p-5 print:m-0 print:max-w-none ${
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
              <div className="w-full text-center pb-1.5 mb-1.5 border-b border-slate-300">
                <div className="text-xs font-bold text-slate-800 tracking-[0.25em] uppercase mb-0.5">
                  五莲县人民医院 · 医学装备管理委员会
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-wider font-serif block w-full text-center leading-tight mb-0.5">
                  医疗仪器设备验收决议与五方联合代表签批审批单
                </h1>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-sans">
                  <span className="font-bold border border-slate-800 px-1.5 py-0.2 rounded-xs text-slate-950">A4 单页审批</span>
                  <span>供货厂商 · 医学装备科 · 临床科室 · 装备委员会 · 财务处</span>
                </div>
                <div className="mt-1.5 pb-0.5 border-b-2 border-slate-950">
                  <div className="border-b border-slate-700"></div>
                </div>
              </div>

              <div className="w-full flex flex-wrap items-center justify-between text-xs sm:text-[13px] px-2.5 py-1.5 mb-2 border border-slate-700 font-sans text-slate-800 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 shadow-2xs">
                <div className="flex items-center gap-4">
                  <span><strong>设备名称：</strong><span className="text-slate-950 font-bold">{equipment.name}</span></span>
                  <span><strong>型号规格：</strong><span className="font-mono text-slate-950 font-bold">{equipment.model}</span></span>
                  <span><strong>序列号SN：</strong><span className="font-mono text-slate-950">{equipment.sn}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span><strong>决议结论：</strong><strong className="text-slate-950 font-bold">{dossier.finalAcceptanceConclusion}</strong></span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {(Object.values(dossier?.signoffs || {}) as AcceptanceSignoffDetail[]).map((sign, idx) => (
                  <div key={sign.roleCode} className="border border-slate-700 p-2.5 bg-gradient-to-b from-white to-slate-50/70 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1 text-xs sm:text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-950 bg-gradient-to-r from-slate-200 to-slate-100 px-2 py-0.5 rounded border border-slate-400 shadow-2xs">
                          {idx + 1}. {sign.roleTitle}
                        </span>
                        <span className="text-slate-700 font-semibold">{sign.departmentOrCompany}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-600 font-medium">签署日期: {sign.signDate}</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed mb-1.5 font-sans">
                      {sign.opinion}
                    </p>
                    <div className="flex items-center justify-between text-xs sm:text-[13px] pt-1 border-t border-dashed border-slate-300 font-sans">
                      <div>
                        <span className="text-slate-500">签署人：</span>
                        <span className="font-serif italic font-bold text-sm text-slate-950 ml-1">{sign.signatoryName}</span>
                        {sign.jobTitle && <span className="text-slate-600 text-xs ml-1">({sign.jobTitle})</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono">
                        <span>资质/工号: {sign.employeeNoOrCert}</span>
                        <span>电话: {sign.phone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-600 font-sans border-t border-slate-300 pt-2">
                <span>注：本审批单包含五方代表独立签署意见，经医学装备委员会审核与财务处入账复核后作为法定凭据。</span>
                <span className="font-mono">防伪存证码: {dossier.securityVerificationCode} · 第 1 页 共 1 页</span>
              </div>
            </div>
          </div>

          {/* 6. 现场实拍照片管理 (交互式管理) */}
          {activeViewMode === 'photos' && (
            <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-800" />
                    <span>临床培训现场实操照片全景档案 ({trainingPhotos.length} 张)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    用于记录理论授课、盲机演练、危急报警应急排障及现场考核交接实景，所有照片自动在 A4 培训交接单与验收入库单中排版并支持打印
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>上传新照片</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewMode('training_paper')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer"
                  >
                    查看 A4 培训单打印版
                  </button>
                </div>
              </div>

              {trainingPhotos.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h5 className="font-bold text-slate-700 text-sm">暂无上传的现场培训照片</h5>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    点击下方按钮上传或拍照，系统将自动录入设备技术档案并生成 A4 纸质文档
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>立即上传现场照片</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {(trainingPhotos || []).map((photo, idx) => (
                    <div 
                      key={photo.id}
                      className="rounded-xl border border-slate-300 overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col group ring-1 ring-slate-900/5"
                    >
                      <div className="h-44 bg-slate-950 relative overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded font-semibold shadow-xs">
                          {photo.category === 'lecture' ? '理论授课' : photo.category === 'operation' ? '盲机实操' : photo.category === 'assessment' ? '技能考核' : '签字交接'}
                        </span>
                        <span className="absolute top-2 right-2 bg-slate-800/90 text-white text-[11px] px-1.5 py-0.5 rounded font-mono font-bold shadow-xs">
                          #{idx + 1}
                        </span>

                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewingPhoto(photo)}
                            className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 shadow flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>查看大图</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-500 shadow flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>删除</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <p className="text-xs sm:text-[13px] font-semibold text-slate-800 leading-snug">
                          {photo.caption}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 font-mono">
                          <span>{photo.uploadedAt}</span>
                          <span className="text-slate-700 font-sans font-medium">{photo.takenBy || '医学装备科'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ======================= 底部固定状态条 (Screen only) ======================= */}
        <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-950 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>验收状态：{dossier.finalAcceptanceConclusion}</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-medium">
              临床培训：4 名骨干达标 ({trainingPhotos.length} 张现场实拍影像)
            </span>
            <span className="text-slate-300">|</span>
            <span>整机保修：<strong className="text-slate-800">{dossier.warrantyMonths}个月</strong></span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>安全防伪存证码: {dossier.securityVerificationCode}</span>
          </div>
        </div>

      </div>

      {/* 照片上传弹窗 */}
      <TrainingPhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        equipmentName={equipment.name}
        equipmentSn={equipment.sn}
        departmentName={equipment.department}
        onPhotoUploaded={handlePhotoUploaded}
      />

      {/* 照片大图查看 Lightbox */}
      {previewingPhoto && (
        <div 
          className="fixed inset-0 z-90 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewingPhoto(null)}
        >
          <div 
            className="bg-slate-900 rounded-2xl overflow-hidden max-w-3xl w-full border border-slate-700 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black flex items-center justify-center min-h-[360px] max-h-[70vh]">
              <img
                src={previewingPhoto.url}
                alt={previewingPhoto.caption}
                className="max-h-[70vh] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setPreviewingPhoto(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-sm text-slate-100">{previewingPhoto.caption}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  时间: {previewingPhoto.uploadedAt} · 见证人: {previewingPhoto.takenBy || '医学装备科'}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-800 text-white font-bold text-[11px]">
                {previewingPhoto.category === 'lecture' ? '理论教学' : previewingPhoto.category === 'operation' ? '盲机实操' : previewingPhoto.category === 'assessment' ? '技能考核' : '签署交接'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 导出 PDF 全屏加载提示 */}
      {isExportingPdf && (
        <div className="fixed inset-0 z-90 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full flex flex-col items-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-900">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                正在生成高分辨率 A4 PDF 档案
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-mono">{pdfProgress || '正在合成高清晰度矢量影像...'}</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-slate-900 h-full w-3/4 animate-pulse" />
            </div>
            <span className="text-[11px] text-slate-400">适配黑白激光打印与国家三甲评审归档要求</span>
          </div>
        </div>
      )}
    </div>
  );
};
