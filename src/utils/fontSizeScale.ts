// 系统字号调节工具：支持标准、大字号清晰浏览、特大号关怀模式
export type FontScale = 'standard' | 'large' | 'extra_large';

const STORAGE_KEY = 'medtech_font_scale';

export const FONT_SCALE_OPTIONS: { id: FontScale; label: string; desc: string; basePx: number }[] = [
  { id: 'standard', label: '标准 (16.5px)', desc: '舒适排版，适中信息密度', basePx: 16.5 },
  { id: 'large', label: '大字号 (18px)', desc: '清晰醒目，医护无忧浏览（推荐）', basePx: 18 },
  { id: 'extra_large', label: '特大号 (20px)', desc: '高亮大字，大屏/远视首选', basePx: 20 },
];

export function getStoredFontScale(): FontScale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'standard' || saved === 'large' || saved === 'extra_large') {
      return saved;
    }
  } catch {
    // ignore
  }
  // 默认采用清晰舒适的 'large'（17.5px基准），彻底解决"字号太小无法正常浏览"
  return 'large';
}

export function applyFontScale(scale: FontScale) {
  try {
    document.documentElement.setAttribute('data-font-scale', scale);
    localStorage.setItem(STORAGE_KEY, scale);
  } catch {
    // ignore
  }
}

// 页面初始化自执行
if (typeof window !== 'undefined') {
  applyFontScale(getStoredFontScale());
}
