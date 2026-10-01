import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Tag,
  User,
  FileText
} from 'lucide-react';
import { TrainingPhoto } from '../types';

interface TrainingPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentName: string;
  equipmentSn?: string;
  departmentName?: string;
  onPhotoUploaded: (photo: TrainingPhoto) => void;
}

const PRESET_CAPTIONS = [
  '原厂临床应用专员主讲系统架构与开机自检理论要点',
  '科室医护骨干在工程师指导下进行盲机演练与参数微调',
  '典型危急报警应急排障与故障模拟现场带教',
  '临床操作技能实操盲机考评全员达标',
  '三方联合签署培训合格确认书与设备现场交接'
];

export const TrainingPhotoUploadModal: React.FC<TrainingPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  equipmentName,
  equipmentSn,
  departmentName,
  onPhotoUploaded
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [category, setCategory] = useState<'lecture' | 'operation' | 'assessment' | 'handover'>('operation');
  const [takenBy, setTakenBy] = useState<string>('医学装备科工程师');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择有效的图片文件 (JPG, PNG, WebP 等)');
      return;
    }
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoDataUrl(result);
      if (!caption) {
        setCaption(`【${equipmentName}】临床操作培训与实操带教现场`);
      }
    };
    reader.onerror = () => {
      setErrorMessage('读取图片文件失败，请重试');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    if (!photoDataUrl) {
      setErrorMessage('请先上传或拍摄培训现场照片');
      return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newPhoto: TrainingPhoto = {
      id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: photoDataUrl,
      caption: caption.trim() || `【${equipmentName}】新机临床操作与维护培训现场`,
      uploadedAt: dateStr,
      category,
      takenBy: takenBy.trim() || '医学装备科'
    };

    onPhotoUploaded(newPhoto);
    // Reset
    setPhotoDataUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-80 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* 标题栏 */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/90 flex items-center justify-center text-white shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">上传培训现场实操照片</h3>
              <p className="text-[11px] text-slate-400">
                用于自动生成并打印在标准 A4 临床培训交接单与验收档案中
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* 设备信息提示 */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500">归档设备：</span>
              <strong className="text-slate-900">{equipmentName}</strong>
              {equipmentSn && <span className="text-slate-500 font-mono ml-2">(SN: {equipmentSn})</span>}
            </div>
            {departmentName && (
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium text-[11px]">
                {departmentName}
              </span>
            )}
          </div>

          {/* 上传区域 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>现场照片上传 (支持拖拽 / 拍照 / 本地文件)</span>
              <span className="text-[11px] text-slate-400 font-normal">支持 JPG/PNG，A4 排版自适应</span>
            </label>

            {photoDataUrl ? (
              <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-slate-900 group">
                <img
                  src={photoDataUrl}
                  alt="预览照片"
                  className="w-full h-48 sm:h-56 object-contain bg-slate-950"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-slate-900 text-xs font-semibold rounded-lg shadow-md hover:bg-slate-100 cursor-pointer"
                  >
                    重新上传
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl('')}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-red-500 cursor-pointer"
                  >
                    移除图片
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-purple-500 bg-purple-50/50 text-purple-700'
                    : 'border-slate-300 hover:border-purple-400 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    点击选择本地照片 或 直接拖拽到此处
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    移动设备可直接调用摄像头拍照上传现场培训场景
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 培训阶段分类 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              培训场景分类
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'lecture', label: '理论授课' },
                { key: 'operation', label: '盲机实操' },
                { key: 'assessment', label: '技能考核' },
                { key: 'handover', label: '签字交接' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key as any)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition cursor-pointer text-center ${
                    category === item.key
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 照片文字描述 / 说明 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>现场照片说明与图题 (将直接打印在 A4 凭单上)</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="如：原厂临床应用专员现场指导医护人员参数设定与盲机演练..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
            
            {/* 快捷推荐词 */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-purple-500" />
                快捷选用:
              </span>
              {PRESET_CAPTIONS.slice(0, 3).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCaption(preset)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700 transition cursor-pointer border border-slate-200"
                >
                  {preset.slice(0, 16)}...
                </button>
              ))}
            </div>
          </div>

          {/* 记录人 / 拍摄人 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              现场记录 / 见证人
            </label>
            <input
              type="text"
              value={takenBy}
              onChange={(e) => setTakenBy(e.target.value)}
              placeholder="如：医学装备科工程师 / 护士长"
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            />
          </div>

        </div>

        {/* 底部操作条 */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            上传后照片将同步沉淀至全院资产档案
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!photoDataUrl}
              className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>确认归档照片</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
