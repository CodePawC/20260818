import { MedicalEquipment } from '../types';

// 设备实物高清照片预设库（覆盖急救生命支持、呼吸、监护、输液、超声等高频应急设备）
export interface PhotoPreset {
  id: string;
  name: string;
  category: string;
  modelKeyword: string;
  url: string;
  sourceNote: string;
}

export const EQUIPMENT_PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'preset-sv300',
    name: '迈瑞 SV300 Pro / 有创无创一体化转运呼吸机',
    category: '呼吸、麻醉和急救器械',
    modelKeyword: 'SV300',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=320&q=70',
    sourceNote: '急救转运呼吸机标准实物图'
  },
  {
    id: 'preset-oxylog',
    name: '德尔格 Oxylog 3000 Plus / 便携式急救转运呼吸机',
    category: '呼吸、麻醉和急救器械',
    modelKeyword: 'Oxylog',
    url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=320&q=70',
    sourceNote: '车载与现场便携呼吸机实物图'
  },
  {
    id: 'preset-d6',
    name: '迈瑞 BeneHeart D6 / 双相波除颤起搏监护仪',
    category: '医用诊察和监护器械',
    modelKeyword: 'BeneHeart',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=320&q=70',
    sourceNote: '除颤起搏多功能一体机'
  },
  {
    id: 'preset-n15',
    name: '迈瑞 BeneVision N15 / 多参数生命体征监护仪',
    category: '医用诊察和监护器械',
    modelKeyword: 'BeneVision N15',
    url: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=320&q=70',
    sourceNote: '高阶床旁多参数监护仪'
  },
  {
    id: 'preset-n1',
    name: '迈瑞 BeneVision N1 / 便携转运多参数监护仪',
    category: '医用诊察和监护器械',
    modelKeyword: 'BeneVision N1',
    url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=320&q=70',
    sourceNote: '插拔式转运微型监护仪'
  },
  {
    id: 'preset-sp5',
    name: '迈瑞 BeneFusion SP5 / 双通道智能微量注射泵',
    category: '注输、护理和防护器械',
    modelKeyword: 'SP5',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=320&q=70',
    sourceNote: '双通道高精度微量注射泵'
  },
  {
    id: 'preset-vp5',
    name: '迈瑞 BeneFusion VP5 / 智能容积式输液泵',
    category: '注输、护理和防护器械',
    modelKeyword: 'VP5',
    url: 'https://images.unsplash.com/photo-1583912267550-d44d95bf0887?auto=format&fit=crop&w=320&q=70',
    sourceNote: '智能容积式输液泵'
  },
  {
    id: 'preset-m9',
    name: '迈瑞 M9 / 掌上床旁便携式彩色超声诊断仪 (POCUS)',
    category: '医用成像器械',
    modelKeyword: 'M9',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=320&q=70',
    sourceNote: '床旁急诊超声与探头'
  },
  {
    id: 'preset-suction',
    name: '达芬 DFX-23D / 移动式应急电动吸引器',
    category: '呼吸、麻醉和急救器械',
    modelKeyword: 'DFX',
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=320&q=70',
    sourceNote: '交直流两用负压吸引机'
  },
  {
    id: 'preset-hypothermia',
    name: '和佳 HGT-200 / 全自动医用升降温控温毯 (亚低温)',
    category: '注输、护理和防护器械',
    modelKeyword: 'HGT',
    url: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=320&q=70',
    sourceNote: '重症脑保护亚低温控温仪'
  },
  {
    id: 'preset-ecg',
    name: '数字式十二导联心电图机',
    category: '医用诊察和监护器械',
    modelKeyword: 'ECG',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=320&q=70',
    sourceNote: '十二导联心电分析仪'
  },
  {
    id: 'preset-aed',
    name: '自动体外除颤器 (AED 急救包)',
    category: '医用诊察和监护器械',
    modelKeyword: 'AED',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=320&q=70',
    sourceNote: '公共/病区便携AED除颤箱'
  }
];

const PHOTO_STORAGE_KEY = 'hospital-equipment-custom-photos';

/**
 * 获取本地缓存的自定义设备照片映射表 (equipmentId -> photoUrl)
 */
export function getCustomPhotoMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PHOTO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse custom equipment photos', err);
  }
  return {};
}

/**
 * 保存单个设备的自定义照片 (支持 Base64 Data URL 或 网络 URL)
 */
export function saveEquipmentCustomPhoto(equipmentId: string, photoUrl: string): void {
  try {
    const current = getCustomPhotoMap();
    if (!photoUrl || !photoUrl.trim()) {
      delete current[equipmentId];
    } else {
      current[equipmentId] = photoUrl.trim();
    }
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save equipment photo', err);
  }
}

/**
 * 移除单个设备的自定义照片
 */
export function removeEquipmentCustomPhoto(equipmentId: string): void {
  try {
    const current = getCustomPhotoMap();
    delete current[equipmentId];
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to delete equipment photo', err);
  }
}

export const DEFAULT_MEDICAL_EQUIPMENT_PHOTO = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80';

/**
 * 智能获取设备的实物照片 URL：
 * 1. 用户自定义上传/修改的图片 (localStorage)
 * 2. 设备实体字段 item.imageUrl
 * 3. 根据型号或名称关键词自动匹配预设真实高清实物图
 * 4. 根据器械大类匹配默认预设
 * 5. 兜底医疗设备高清实景图
 */
export function getEquipmentPhoto(equipment?: MedicalEquipment | null): string {
  if (!equipment) {
    return DEFAULT_MEDICAL_EQUIPMENT_PHOTO;
  }

  // 1. 自定义上传照片
  const customMap = getCustomPhotoMap();
  if (customMap[equipment.id] && customMap[equipment.id].trim()) {
    return customMap[equipment.id].trim();
  }

  // 2. 字段自带 imageUrl
  if (equipment.imageUrl && equipment.imageUrl.trim()) {
    return equipment.imageUrl.trim();
  }

  // 3. 型号/名称关键词精准匹配
  const queryStr = `${equipment.model || ''} ${equipment.name || ''} ${equipment.level2Category || ''}`.toLowerCase();
  
  for (const preset of EQUIPMENT_PHOTO_PRESETS) {
    if (preset.modelKeyword && queryStr.includes(preset.modelKeyword.toLowerCase())) {
      return preset.url;
    }
  }

  // 4. 大类模糊匹配
  if (queryStr.includes('呼吸') || equipment.category?.includes('呼吸')) {
    return EQUIPMENT_PHOTO_PRESETS[0].url;
  }
  if (queryStr.includes('除颤') || queryStr.includes('aed')) {
    return EQUIPMENT_PHOTO_PRESETS[2].url;
  }
  if (queryStr.includes('监护') || equipment.category?.includes('监护')) {
    return EQUIPMENT_PHOTO_PRESETS[3].url;
  }
  if (queryStr.includes('注射泵') || queryStr.includes('微量泵')) {
    return EQUIPMENT_PHOTO_PRESETS[5].url;
  }
  if (queryStr.includes('输液泵')) {
    return EQUIPMENT_PHOTO_PRESETS[6].url;
  }
  if (queryStr.includes('超声') || equipment.category?.includes('成像')) {
    return EQUIPMENT_PHOTO_PRESETS[7].url;
  }
  if (queryStr.includes('吸引')) {
    return EQUIPMENT_PHOTO_PRESETS[8].url;
  }
  if (queryStr.includes('温') || queryStr.includes('毯')) {
    return EQUIPMENT_PHOTO_PRESETS[9].url;
  }
  if (queryStr.includes('心电')) {
    return EQUIPMENT_PHOTO_PRESETS[10].url;
  }

  // 5. 默认现代医疗设备照片
  return 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80';
}
