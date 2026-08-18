const fs = require('fs');
const path = require('path');

const tsvPath = path.join(__dirname, 'rawData.tsv');
const rawTsv = fs.readFileSync(tsvPath, 'utf8');

const lines = rawTsv.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0);
const header = lines[0].split('\t');

const equipments = [];
const departmentsSet = new Set();
const categoriesSet = new Set();

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split('\t');
  const id = cols[0]?.trim() || `EQ-${i}`;
  const categoryNo = cols[1]?.trim() || '';
  const category = cols[2]?.trim() || '医用诊察和监护器械';
  const level1No = cols[3]?.trim() || '';
  const level1Category = cols[4]?.trim() || '';
  const level2No = cols[5]?.trim() || '';
  const level2Category = cols[6]?.trim() || '';
  const name = cols[7]?.trim() || (cols[8]?.trim() ? `${cols[8].trim()}医疗设备` : '医疗设备');
  const model = cols[8]?.trim() || '-';
  const enableDate = cols[9]?.trim() || '2022/1/1';
  const productValidity = cols[10]?.trim() || '10';
  const sn = cols[11]?.trim() || `SN-${id}`;
  const manufacturer = cols[12]?.trim() || '国产/进口医疗器械';
  const calibration = cols[13]?.trim() || 'No';
  const calibrationUnit = cols[14]?.trim() || '';
  const department = cols[15]?.trim() || '麻醉手术科';
  const building = cols[16]?.trim() || '1号楼 综合楼';
  const floor = cols[17]?.trim() || '1';
  const nursePhone = cols[18]?.trim() || '';

  if (department) departmentsSet.add(department);
  if (category) categoriesSet.add(category);

  // Determine calibration type & fee policy
  let calibrationType = '免计量';
  let feePolicy = 'none';
  let catalogueCode = undefined;
  
  if (calibration.toLowerCase() === 'yes') {
    // Check if mandatory (e.g. ECG, EEG, Ultrasound, CT, DSA, DR, BP)
    const lowerName = (name + ' ' + model + ' ' + level2Category).toLowerCase();
    if (
      lowerName.includes('心电') || 
      lowerName.includes('ecg') || 
      lowerName.includes('脑电') || 
      lowerName.includes('eeg') || 
      lowerName.includes('超声') || 
      lowerName.includes('彩超') || 
      lowerName.includes('ct') || 
      lowerName.includes('x射线') || 
      lowerName.includes('dr') || 
      lowerName.includes('血管造影') || 
      lowerName.includes('血压') || 
      lowerName.includes('加速器') || 
      lowerName.includes('听力')
    ) {
      calibrationType = '强检(国家免费)';
      feePolicy = 'free_national';
      catalogueCode = lowerName.includes('心电') ? 'QJ-01' : 
                      lowerName.includes('脑电') ? 'QJ-02' :
                      lowerName.includes('超声') || lowerName.includes('彩超') ? 'QJ-03' :
                      lowerName.includes('ct') ? 'QJ-04' :
                      lowerName.includes('血管造影') ? 'QJ-05' :
                      lowerName.includes('x射线') || lowerName.includes('dr') ? 'QJ-06' :
                      lowerName.includes('血压') ? 'QJ-07' :
                      lowerName.includes('加速器') ? 'QJ-08' :
                      lowerName.includes('听力') ? 'QJ-14' : 'QJ-01';
    } else {
      calibrationType = '定期校准(自费)';
      feePolicy = 'paid_hospital';
      catalogueCode = lowerName.includes('注射泵') || lowerName.includes('输液泵') ? 'JZ-01' :
                      lowerName.includes('电刀') || lowerName.includes('射频') ? 'JZ-03' :
                      lowerName.includes('除颤') ? 'JZ-04' :
                      lowerName.includes('呼吸机') ? 'JZ-05' :
                      lowerName.includes('麻醉机') ? 'JZ-06' :
                      lowerName.includes('离心机') ? 'JZ-07' :
                      lowerName.includes('监护') ? 'JZ-02' : 'JZ-10';
    }
  }

  // Generate sensible next/last calibration dates
  const lastCalDate = calibration.toLowerCase() === 'yes' ? '2025-05-15' : undefined;
  const nextCalDate = calibration.toLowerCase() === 'yes' ? '2026-05-15' : undefined;
  const certNo = calibration.toLowerCase() === 'yes' ? `CAL-${id}-${Math.floor(1000 + Math.random()*9000)}` : undefined;

  // Estimated purchase price based on category
  let purchasePrice = 50000;
  if (name.includes('CT') || model.includes('NeuViz') || model.includes('Emotion')) purchasePrice = 3800000;
  else if (name.includes('磁共振') || model.includes('MAGNETOM')) purchasePrice = 6500000;
  else if (name.includes('血管造影') || model.includes('Arits')) purchasePrice = 4200000;
  else if (name.includes('加速器')) purchasePrice = 8500000;
  else if (name.includes('超声') || name.includes('彩超')) purchasePrice = 680000;
  else if (name.includes('透析') || model.includes('4008') || model.includes('5008')) purchasePrice = 160000;
  else if (name.includes('呼吸机') || model.includes('SERVO') || model.includes('SV')) purchasePrice = 220000;
  else if (name.includes('麻醉')) purchasePrice = 280000;
  else if (name.includes('监护仪')) purchasePrice = 35000;
  else if (name.includes('除颤')) purchasePrice = 65000;
  else if (name.includes('注射泵') || name.includes('输液泵')) purchasePrice = 12000;
  else if (name.includes('血压计') || name.includes('血压表')) purchasePrice = 650;
  else if (name.includes('内窥镜') || name.includes('喉镜')) purchasePrice = 150000;
  else if (name.includes('PCR') || name.includes('生化') || name.includes('发光')) purchasePrice = 320000;

  equipments.push({
    id,
    categoryNo: categoryNo || undefined,
    category,
    level1No: level1No || undefined,
    level1Category: level1Category || undefined,
    level2No: level2No || undefined,
    level2Category: level2Category || undefined,
    name,
    model,
    enableDate,
    manufactureDate: enableDate,
    productValidity: productValidity || '10',
    sn: sn || `SN-${id}`,
    manufacturer: manufacturer || '知名医疗器械制造企业',
    calibration,
    calibrationType,
    catalogueCode,
    feePolicy,
    calibrationUnit: calibrationUnit ? `${calibrationUnit}法定计量检测机构` : (calibration.toLowerCase() === 'yes' ? '市级法定计量检定机构' : undefined),
    lastCalibrationDate: lastCalDate,
    nextCalibrationDate: nextCalDate,
    calibrationCertificateNo: certNo,
    department: department || '设备科',
    building: building || '1号楼 综合楼',
    floor: floor || '1',
    nursePhone: nursePhone || '',
    status: '正常运行',
    manager: `${department}责任人`,
    purchasePrice,
    repairCount: 0,
    repairRecords: [],
    statusLogs: []
  });
}

const fileContent = `import { MedicalEquipment } from './types';

export const INITIAL_EQUIPMENT: MedicalEquipment[] = ${JSON.stringify(equipments, null, 2)};

export const DEPARTMENTS = ${JSON.stringify(Array.from(departmentsSet), null, 2)};

export const CATEGORIES = ${JSON.stringify(Array.from(categoriesSet), null, 2)};
`;

const targetFile = path.join(__dirname, '..', 'src', 'mockData.ts');
fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log(`Successfully generated ${equipments.length} equipment items in ${targetFile}`);
