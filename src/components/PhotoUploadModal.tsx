import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Link2, RotateCcw, Check, Sparkles } from 'lucide-react';
import { MedicalEquipment } from '../types';
import { EQUIPMENT_PHOTO_PRESETS, saveEquipmentCustomPhoto, removeEquipmentCustomPhoto, getEquipmentPhoto } from '../utils/equipmentPhotoUtils';

interface PhotoUploadModalProps {
  isOpen: boolean;
  equipment: MedicalEquipment | null;
  currentPhotoUrl: string;
  onClose: () => void;
  onPhotoUpdated: (equipmentId: string, newPhotoUrl: string) => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  equipment,
  currentPhotoUrl,
  onClose,
  onPhotoUpdated,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState(currentPhotoUrl);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !equipment) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择有效的图片文件 (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('图片大小不能超过 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewUrl(result);
      }
    };
    reader.onerror = () => {
      setUploadError('读取图片文件失败，请重试');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyPreset = (preset: typeof EQUIPMENT_PHOTO_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setPreviewUrl(preset.url);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setPreviewUrl(customUrlInput.trim());
  };

  const handleSave = () => {
    if (!equipment) return;
    saveEquipmentCustomPhoto(equipment.id, previewUrl);
    onPhotoUpdated(equipment.id, previewUrl);
    onClose();
  };

  const handleResetToDefault = () => {
    if (!equipment) return;
    removeEquipmentCustomPhoto(equipment.id);
    const defaultUrl = getEquipmentPhoto({ ...equipment, imageUrl: undefined });
    setPreviewUrl(defaultUrl);
    setSelectedPresetId('');
    setCustomUrlInput('');
    onPhotoUpdated(equipment.id, defaultUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                更新设备实物照 · {equipment.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {equipment.id} | 型号: {equipment.model} | SN: {equipment.sn}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switching */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'upload' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>本地上传 / 拍照</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('preset')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'preset' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>标准设备图库 ({EQUIPMENT_PHOTO_PRESETS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'url' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>网络图片链接</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer px-2 py-1"
            title="恢复系统初始默认照片"
          >
            <RotateCcw className="w-3 h-3" />
            <span>恢复默认</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
          
          {/* Mode 1: Local file upload */}
          {activeMode === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800">
                    点击选择实物照片 或 将图片文件拖拽至此处
                  </p>
                  <p className="text-[11px] text-slate-400">
                    支持 JPG、PNG、WebP 格式，建议比例 16:9 或 4:3 (不超过 8MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Preset library */}
          {activeMode === 'preset' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500">
                请从以下医院应急与生命支持类标准设备图库中点击挑选：
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
                {EQUIPMENT_PHOTO_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id || previewUrl === preset.url;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      className={`group border rounded-lg overflow-hidden cursor-pointer transition relative flex flex-col ${
                        isSelected ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-[11px]">
                        <p className="font-semibold text-slate-800 line-clamp-1">{preset.name}</p>
                        <p className="text-slate-400 text-[10px] truncate mt-0.5">{preset.sourceNote}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 3: Custom URL input */}
          {activeMode === 'url' && (
            <form onSubmit={handleApplyCustomUrl} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">图片网络地址 (Image URL):</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/medical-device-photo.jpg"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-100 focus:bg-white text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition cursor-pointer"
                  >
                    载入预览
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Real-time Preview Area */}
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center gap-4">
            <div className="w-32 h-20 rounded-md overflow-hidden bg-slate-900 border border-slate-300 shrink-0 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="预览实物图"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>实时效果预览</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                保存后，此实物照将在应急库设备卡片视图、列表略缩图以及设备借调凭证中同步呈现。
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-200/60 rounded-md text-xs font-medium transition cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>保存实物照片</span>
          </button>
        </div>

      </div>
    </div>
  );
};
