import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export interface ManualLazyImageProps {
  src: string;
  alt: string;
  figureNumber?: string;
  caption?: string;
  sourceNote?: string;
  badge?: string;
  aspectRatio?: 'video' | '4/3' | '16/10' | '21/9' | 'square';
  className?: string;
}

export const ManualLazyImage: React.FC<ManualLazyImageProps> = ({
  src,
  alt,
  figureNumber,
  caption,
  sourceNote,
  badge = '标准规范图例',
  aspectRatio = 'video',
  className = ''
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. 基于 IntersectionObserver 的视口懒加载机制
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 若浏览器不支持 IntersectionObserver 则直接加载
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '250px 0px', // 提前 250px 触发预加载，消除视口等待感
        threshold: 0.01
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 键盘快捷键监听 (Esc 退出全屏弹窗)
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // 重置大图缩放
  const handleOpenModal = () => {
    setZoomLevel(1);
    setRotation(0);
    setIsModalOpen(true);
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    // 强制触发重载
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
  };

  // 高宽比映射
  const aspectClassMap = {
    video: 'aspect-video',
    '4/3': 'aspect-4/3',
    '16/10': 'aspect-[16/10]',
    '21/9': 'aspect-[21/9]',
    square: 'aspect-square'
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden border border-slate-200/90 bg-white shadow-2xs group ${className}`}
    >
      {/* 顶栏图例标识条 */}
      {(figureNumber || caption) && (
        <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {figureNumber && (
              <span className="font-mono font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded text-2xs shrink-0">
                {figureNumber}
              </span>
            )}
            {caption && (
              <span className="font-bold text-slate-800 truncate" title={caption}>
                {caption}
              </span>
            )}
          </div>
          {badge && (
            <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              <span>{badge}</span>
            </span>
          )}
        </div>
      )}

      {/* 图片主内容容器 */}
      <div className={`relative w-full ${aspectClassMap[aspectRatio]} overflow-hidden bg-slate-100 flex items-center justify-center`}>
        {/* 骨架屏：在图片未进入视口或正在加载中时呈现 */}
        {(!isLoaded && !hasError) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-100 select-none animate-pulse">
            {/* 骨架底纹渐变流动动效 */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <ImageIcon className="w-8 h-8 opacity-70 animate-bounce duration-1000" />
            </div>

            {/* 骨架条幅线 */}
            <div className="w-48 h-3.5 bg-slate-200 rounded-full mb-2" />
            <div className="w-32 h-2.5 bg-slate-200/80 rounded-full mb-4" />

            <div className="flex items-center gap-1.5 text-2xs font-medium text-slate-400">
              <Sparkles className="w-3 h-3 text-blue-400 animate-spin" />
              <span>正在懒加载规程图解...</span>
            </div>
          </div>
        )}

        {/* 加载失败兜底状态 */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-50 text-center space-y-2">
            <div className="p-2.5 rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-xs font-bold text-slate-800">图解资料加载遇到网络波动</div>
            <p className="text-2xs text-slate-500 max-w-sm">
              已启用智能重试机制，您可点击下方按钮尝试重新抓取本章节高清实物图解。
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重新加载</span>
            </button>
          </div>
        )}

        {/* 实际图片元素：进入视口后挂载 src */}
        {isInView && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => {
              setIsLoaded(true);
              setHasError(false);
            }}
            onError={() => {
              setIsLoaded(false);
              setHasError(true);
            }}
            className={`w-full h-full object-cover transition-all duration-700 ease-out cursor-pointer ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.99]'
            }`}
            onClick={handleOpenModal}
          />
        )}

        {/* 鼠标悬停时的查看大图按钮浮层 */}
        {isLoaded && !hasError && (
          <div
            onClick={handleOpenModal}
            className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer select-none"
          >
            <span className="px-3.5 py-1.5 bg-slate-900/80 backdrop-blur-md text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg transform -translate-y-1 group-hover:translate-y-0 transition-transform">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>查看高清图示细节</span>
            </span>
          </div>
        )}
      </div>

      {/* 底部注解或技术溯源信息 */}
      {sourceNote && (
        <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 text-2xs text-slate-500 flex items-center justify-between">
          <span className="truncate">{sourceNote}</span>
          <span className="text-3xs text-slate-400 font-mono">1080P 高清规程样张</span>
        </div>
      )}

      {/* 全屏放大查看 Lightbox 模态弹窗 */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col overflow-hidden text-slate-100 relative max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 模态框顶栏 */}
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {figureNumber && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-xs font-bold border border-blue-500/30 shrink-0">
                    {figureNumber}
                  </span>
                )}
                <span className="text-sm font-bold text-white truncate">
                  {caption || alt}
                </span>
              </div>

              {/* 图像控制工具箱 */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="放大 (+25%)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="缩小 (-25%)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-2xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="复位 100%"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="顺时针旋转90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
                  title="关闭 (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 图像交互展示区 */}
            <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-6 overflow-hidden min-h-[420px]">
              <div
                className="transition-transform duration-200 ease-out max-h-full max-w-full flex items-center justify-center"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
              >
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[68vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
                />
              </div>
            </div>

            {/* 模态框底栏 */}
            <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/90 text-2xs text-slate-400 flex items-center justify-between">
              <div>
                <span>{sourceNote || '五莲县人民医院医学装备数字化管理规程高清图示样张'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono">按 Esc 键或点击外部即可快速关闭</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
