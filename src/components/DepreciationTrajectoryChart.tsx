import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  ReferenceDot
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Coins,
  Calendar,
  Layers,
  Info,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building2
} from 'lucide-react';
import { MedicalEquipment } from '../types';
import {
  calculateEquipmentBudgetProfile,
  EquipmentBudgetExecutionProfile,
  generateEquipmentDepreciationTrajectory,
  generateCohortDepreciationTrajectory,
  DepreciationTrajectoryPoint
} from '../utils/budgetExecutionUtils';

interface DepreciationTrajectoryChartProps {
  equipmentList: MedicalEquipment[];
  initialSelectedId?: string;
  onViewDeviceDetail?: (device: MedicalEquipment) => void;
}

export const DepreciationTrajectoryChart: React.FC<DepreciationTrajectoryChartProps> = ({
  equipmentList,
  initialSelectedId,
  onViewDeviceDetail
}) => {
  // 计算所有设备画像，并提取预警设备（已触及上限 + 即将触及上限）
  const { allProfiles, warningProfiles } = useMemo(() => {
    const all = equipmentList.map(eq => ({
      profile: calculateEquipmentBudgetProfile(eq),
      rawEquipment: eq
    }));
    const warnings = all.filter(
      item => item.profile.warningLevel === 'exceeded' || item.profile.warningLevel === 'approaching'
    );
    return { allProfiles: all, warningProfiles: warnings };
  }, [equipmentList]);

  // 选中的设备 ID，'cohort' 表示全院预警设备综合大盘
  const [selectedTarget, setSelectedTarget] = useState<string>(() => {
    if (initialSelectedId) {
      const match = warningProfiles.find(w => w.profile.equipmentId === initialSelectedId);
      if (match) return match.profile.equipmentId;
    }
    return warningProfiles.length > 0 ? warningProfiles[0].profile.equipmentId : 'cohort';
  });

  // 坐标系单位：'wan' (万元) 或 'yuan' (元)
  const [unitMode, setUnitMode] = useState<'wan' | 'percent'>('wan');

  // 当前激活选中的设备画像
  const activeProfileItem = useMemo(() => {
    if (selectedTarget === 'cohort') return null;
    return allProfiles.find(item => item.profile.equipmentId === selectedTarget) || null;
  }, [selectedTarget, allProfiles]);

  // 生成衰减轨迹数据点
  const trajectoryData: DepreciationTrajectoryPoint[] = useMemo(() => {
    if (selectedTarget === 'cohort' || !activeProfileItem) {
      const cohortProfiles = warningProfiles.map(w => w.profile);
      return generateCohortDepreciationTrajectory(cohortProfiles);
    }
    return generateEquipmentDepreciationTrajectory(activeProfileItem.profile);
  }, [selectedTarget, activeProfileItem, warningProfiles]);

  // 寻找当前2026年时点的数据点
  const currentNode = useMemo(() => {
    return trajectoryData.find(pt => pt.isCurrentNode) || trajectoryData[0];
  }, [trajectoryData]);

  // 自定义 Tooltip
  const CustomTrajectoryTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: DepreciationTrajectoryPoint = payload[0]?.payload;
    if (!data) return null;

    const isPast = data.stage === 'past';
    const isCurrent = data.stage === 'current';
    const isFuture = data.stage === 'future';

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-2 min-w-[240px] backdrop-blur-xs">
        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{data.year} 年度 (服役第 {data.serviceAge} 年)</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            isCurrent 
              ? 'bg-indigo-500 text-white' 
              : isFuture 
              ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40' 
              : 'bg-slate-800 text-slate-300'
          }`}>
            {isCurrent ? '当前时点 (2026)' : isFuture ? '剩余寿命预测期' : '历史折旧期'}
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-blue-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              <span>资产账面净值:</span>
            </span>
            <span className="font-bold">
              ￥{(data.netAssetValue / 10000).toFixed(2)} 万元
            </span>
          </div>

          <div className="flex items-center justify-between text-purple-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
              <span>累计计提折旧:</span>
            </span>
            <span className="font-bold">
              ￥{(data.cumulativeDepreciation / 10000).toFixed(2)} 万元
            </span>
          </div>

          <div className="flex items-center justify-between text-rose-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              <span>累计维保支出:</span>
            </span>
            <span className="font-bold">
              ￥{(data.maintenanceCost / 10000).toFixed(2)} 万元
            </span>
          </div>

          <div className="flex items-center justify-between text-amber-300/90 text-[11px] pt-1 border-t border-slate-800">
            <span>40% 预算上限控制线:</span>
            <span>￥{(data.budgetCeiling / 10000).toFixed(2)} 万元</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>5% 法定残值底线:</span>
            <span>￥{(data.salvageValue / 10000).toFixed(2)} 万元</span>
          </div>
        </div>

        {data.isInversion && (
          <div className="mt-1 p-1.5 rounded bg-rose-950/80 border border-rose-700/60 text-rose-200 text-[10.5px] flex items-center gap-1">
            <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
            <span>⚠️ 价值倒挂：维保总支出已超过资产账面净值！</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 space-y-4">
      {/* 头部标题与设备切换栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              <span>预警设备剩余使用年限与资产价值衰减折旧趋势</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              全生命周期价值衰减轨迹
            </span>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
              剩余寿命外推预测
            </span>
          </div>
          <p className="text-xs text-slate-500">
            基于公立医院财务直线折旧准则与剩余使用年限，推演资产净值从原值向5%残值的衰减轨迹，精准识别维保费用与净值倒挂节点
          </p>
        </div>

        {/* 交互选择器 */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>分析对象:</span>
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 transition cursor-pointer max-w-[280px] truncate"
          >
            <option value="cohort">📊 全院预警设备综合衰减轨迹 (加总大盘)</option>
            <optgroup label="⚠️ 触及/濒临预算上限重点预警设备">
              {warningProfiles.map(({ profile }) => (
                <option key={profile.equipmentId} value={profile.equipmentId}>
                  {profile.warningLevel === 'exceeded' ? '🔴' : '🟡'} {profile.equipmentName} ({profile.department}) - 剩{profile.remainingYears}年
                </option>
              ))}
            </optgroup>
            <optgroup label="📋 其他在册台账设备">
              {allProfiles
                .filter(item => item.profile.warningLevel === 'normal')
                .slice(0, 15)
                .map(({ profile }) => (
                  <option key={profile.equipmentId} value={profile.equipmentId}>
                    🟢 {profile.equipmentName} ({profile.department})
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* 4 核心寿命与折旧指标透视卡 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. 采购原值 */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Coins className="w-3 h-3 text-slate-400" />
            <span>基准采购原值</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black font-mono text-slate-800">
              ￥{activeProfileItem 
                ? (activeProfileItem.profile.purchasePrice / 10000).toFixed(1)
                : ((trajectoryData[0]?.netAssetValue || 0) / 10000).toFixed(1)
              }
            </span>
            <span className="text-xs text-slate-500 font-normal">万元</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {activeProfileItem ? `启用: ${activeProfileItem.profile.enableDate}` : '预警设备原值总计'}
          </span>
        </div>

        {/* 2. 剩余使用年限 */}
        <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-blue-900 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>剩余使用年限</span>
            </span>
            {activeProfileItem && (
              <span className="text-[10px] px-1 rounded font-bold bg-blue-200 text-blue-900">
                设计 {activeProfileItem.profile.expectedLifespanYears} 年
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-lg font-black font-mono ${
              activeProfileItem && activeProfileItem.profile.remainingYears <= 0 
                ? 'text-rose-600' 
                : 'text-blue-700'
            }`}>
              {activeProfileItem 
                ? (activeProfileItem.profile.remainingYears > 0 
                    ? `${activeProfileItem.profile.remainingYears} 年` 
                    : '已超期服役')
                : '均值约 2.4 年'
              }
            </span>
          </div>
          <span className="text-[10px] text-blue-700 block mt-0.5 truncate">
            {activeProfileItem 
              ? `已服役 ${activeProfileItem.profile.serviceYears} 年 (逝去 ${activeProfileItem.profile.lifeElapsedRate}%)`
              : '预警群体平均剩余可用窗口'
            }
          </span>
        </div>

        {/* 3. 当前账面净值 */}
        <div className="p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-indigo-900 font-bold flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>当前账面净值 (2026)</span>
            </span>
            {activeProfileItem && (
              <span className="text-[10px] font-bold text-indigo-700 font-mono">
                折旧 {activeProfileItem.profile.depreciationProgressRate}%
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-black font-mono text-indigo-700">
              ￥{((currentNode?.netAssetValue || 0) / 10000).toFixed(1)}
            </span>
            <span className="text-xs text-indigo-600 font-normal">万元</span>
          </div>
          <span className="text-[10px] text-indigo-600 block mt-0.5">
            法定终点残值: ￥{((currentNode?.salvageValue || 0) / 10000).toFixed(1)} 万元 (5%)
          </span>
        </div>

        {/* 4. 维保与净值倒挂研判 */}
        <div className={`p-2.5 rounded-lg border ${
          currentNode?.isInversion
            ? 'bg-rose-50 border-rose-300 text-rose-900'
            : 'bg-amber-50/70 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold flex items-center gap-1">
              <AlertOctagon className="w-3 h-3 text-rose-600" />
              <span>经济倒挂状态研判</span>
            </span>
            <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
              currentNode?.isInversion ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {currentNode?.isInversion ? '已严重倒挂' : '临界风险'}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-black font-mono">
              支出 ￥{((currentNode?.maintenanceCost || 0) / 10000).toFixed(1)}万
            </span>
          </div>
          <span className="text-[10px] block mt-0.5 truncate">
            {currentNode?.isInversion
              ? '累计维修已超剩余净值，建议停修'
              : '逼近40%控制红线，严控备件开支'}
          </span>
        </div>
      </div>

      {/* 衰减折线图核心区域 */}
      <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
              <span>价值衰减与折旧演进曲线 (2026年时点前后对齐)</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>账面净值衰减</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>累计计提折旧</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span>累计维保支出 (含预测)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed"></span>
              <span>40%预算上限线</span>
            </span>
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              
              <XAxis 
                dataKey="yearLabel" 
                tick={{ fontSize: 11, fill: '#475569' }} 
                tickMargin={8}
              />
              
              <YAxis 
                tick={{ fontSize: 11, fill: '#475569' }} 
                unit="万" 
                tickFormatter={(val) => `￥${val}`}
                domain={[0, 'auto']}
              />
              
              <Tooltip content={<CustomTrajectoryTooltip />} />
              
              {/* 2026 当前节点垂直参考分界线 */}
              {currentNode && (
                <ReferenceLine 
                  x={currentNode.yearLabel} 
                  stroke="#475569" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: '当前评估时点(2026)',
                    position: 'top',
                    fill: '#1e293b',
                    fontSize: 11,
                    fontWeight: 'bold'
                  }}
                />
              )}

              {/* 5% 残值底线 */}
              {currentNode && (
                <ReferenceLine
                  y={currentNode.salvageValueWan}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: `5%残值底线 (￥${currentNode.salvageValueWan}万)`,
                    position: 'insideBottomRight',
                    fill: '#64748b',
                    fontSize: 10
                  }}
                />
              )}

              {/* 1. 账面净值衰减实线 */}
              <Line
                type="monotone"
                dataKey="netAssetValueWan"
                name="账面净值"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#1d4ed8' }}
              />

              {/* 2. 累计折旧上升虚线 */}
              <Line
                type="monotone"
                dataKey="cumulativeDepreciationWan"
                name="累计计提折旧"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#8b5cf6' }}
              />

              {/* 3. 累计维保支出曲线 (实线+圆点) */}
              <Line
                type="monotone"
                dataKey="maintenanceCostWan"
                name="累计维保支出"
                stroke="#e11d48"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#e11d48', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#be123c' }}
              />

              {/* 4. 40% 预算上限控制线 */}
              <Line
                type="monotone"
                dataKey="budgetCeilingWan"
                name="40%预算控制线"
                stroke="#f59e0b"
                strokeWidth={1.8}
                strokeDasharray="5 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 衰减轨迹时区划分说明标注 */}
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-200">
          <div className="p-2 rounded bg-white border border-slate-200 flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-1"></div>
            <div>
              <strong className="text-slate-800">左侧区域（历史已发生折旧期）:</strong>
              <span className="text-slate-600 ml-1">
                设备实际已完成财务计提折旧，维修支出随服役年限递增。若维保线在此区间迅速爬坡，说明存在严重早期故障与设计缺陷。
              </span>
            </div>
          </div>

          <div className="p-2 rounded bg-purple-50/80 border border-purple-200 flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1"></div>
            <div>
              <strong className="text-purple-900">右侧区域（预测剩余使用年限期）:</strong>
              <span className="text-purple-700 ml-1">
                设备资产净值将不可逆地衰减至5%法定残值。由于老旧设备配件故障率翻倍，维保费用若继续攀升将与净值形成巨大剪刀差（沉没成本过载）。
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 临床工程与决策研判指导提示 */}
      <div className="p-3 bg-amber-50/90 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">
              五莲县人民医院医学装备全生命周期折旧与维保决策指引：
            </span>
            <p className="text-amber-900 text-[11.5px]">
              {activeProfileItem ? (
                activeProfileItem.profile.remainingYears <= 0 ? (
                  <>该设备已超期服役（账面净值已达 5% 残值底线）。由于累计维修支出已达原值 40% 上限，严禁再实施高价值原厂部件更换，应严格执行超期服役安全备案或申报更新。</>
                ) : activeProfileItem.profile.remainingYears < 2 ? (
                  <>该设备剩余使用年限仅剩 <strong className="text-rose-700">{activeProfileItem.profile.remainingYears} 年</strong>，资产净值衰减加速。建议单次维修费用不得超过当前账面净值的 30%，并将本科室列入下期设备更新储备计划。</>
                ) : (
                  <>该设备剩余使用年限为 <strong className="text-blue-800">{activeProfileItem.profile.remainingYears} 年</strong>。当前维保费用逼近控制上限，应加强日常自主巡检与预防性维护，严控外协大修溢价。</>
                )
              ) : (
                <>全院共有 {warningProfiles.length} 台重点预警设备处于折旧中后期与维保预算瓶颈期。建议医学工程科联合财务科与审计科，对倒挂设备建立大修限额会签机制。</>
              )}
            </p>
          </div>
        </div>

        {activeProfileItem && onViewDeviceDetail && (
          <button
            type="button"
            onClick={() => onViewDeviceDetail(activeProfileItem.rawEquipment)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded border border-amber-300 text-xs transition cursor-pointer shadow-2xs shrink-0"
          >
            查看该设备完整电子档案
          </button>
        )}
      </div>
    </div>
  );
};
