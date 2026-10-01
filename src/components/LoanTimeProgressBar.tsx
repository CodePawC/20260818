import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Building2, 
  User, 
  Calendar, 
  AlertCircle, 
  Hourglass,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { EmergencyLoanRecord } from '../utils/emergencyReserveData';
import { MedicalEquipment } from '../types';

export interface LoanTimeProgressProps {
  loan?: EmergencyLoanRecord | {
    borrowTime?: string;
    expectedReturnTime?: string;
    loanDate?: string;
    expectedReturnDate?: string;
    borrowingDepartment?: string;
    borrowerName?: string;
    borrowerPhone?: string;
    borrowReason?: string;
    [key: string]: any;
  } | null;
  device?: MedicalEquipment | {
    id?: string;
    name?: string;
    status?: string;
    location?: string;
    [key: string]: any;
  } | null;
  mode?: 'card' | 'table' | 'compact' | 'mini' | 'badge';
  className?: string;
  showDetails?: boolean;
}

/**
 * 安全解析日期时间字符串为时间戳
 */
export const safeParseDate = (dateStr?: string): number => {
  if (!dateStr) return Date.now();
  const normalized = dateStr.trim().replace(/\//g, '-').replace(' ', 'T');
  const timestamp = new Date(normalized).getTime();
  return isNaN(timestamp) ? Date.now() : timestamp;
};

/**
 * 友好格式化时间差 (天/小时)
 */
export const formatDuration = (ms: number): string => {
  const absMs = Math.abs(ms);
  const totalMinutes = Math.round(absMs / (1000 * 60));
  if (totalMinutes < 60) {
    return `${Math.max(1, totalMinutes)}分钟`;
  }
  const totalHours = Math.round(absMs / (1000 * 3600));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days >= 1) {
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  }
  return `${Math.max(1, totalHours)}小时`;
};

export interface LoanProgressResult {
  borrowMs: number;
  expectedMs: number;
  nowMs: number;
  totalDurationMs: number;
  elapsedMs: number;
  remainingMs: number;
  isOverdue: boolean;
  overdueMs: number;
  rawPercent: number;
  clampedPercent: number;
  elapsedFormatted: string;
  totalFormatted: string;
  remainingFormatted: string;
  overdueFormatted: string;
  colorTheme: 'normal' | 'approaching' | 'overdue';
  statusLabel: string;
  
  // 核心业务属性：剩余天数倒计时、时间过半提醒、到期红色警示
  remainingDays: number;
  remainingDaysFormatted: string;
  overdueDays: number;
  isHalfwayPassed: boolean;
  urgencyLevel: 'normal' | 'halfway' | 'overdue';
  countdownLabel: string;
  countdownShortLabel: string;
  urgencyColorClasses: {
    badge: string;
    border: string;
    bg: string;
    text: string;
    ring: string;
  };
}

/**
 * 计算设备借用时效分析核心数据：
 * - 剩余使用天数倒计时
 * - 借调时间过半 (>= 50%) 自动触发黄色提醒
 * - 借调到期 (>= 100% 或当前时间超过预还时间) 自动触发红色提醒
 */
export const computeLoanTimeProgress = (
  borrowTime?: string,
  expectedReturnTime?: string,
  nowMs: number = Date.now()
): LoanProgressResult => {
  const borrowMs = safeParseDate(borrowTime);
  const expectedMs = safeParseDate(expectedReturnTime);
  const totalDurationMs = Math.max(1000 * 60 * 30, expectedMs - borrowMs);
  const elapsedMs = Math.max(0, nowMs - borrowMs);
  const isOverdue = nowMs >= expectedMs;
  const overdueMs = isOverdue ? nowMs - expectedMs : 0;
  const remainingMs = Math.max(0, expectedMs - nowMs);

  const rawPercent = Math.round((elapsedMs / totalDurationMs) * 100);
  const clampedPercent = isOverdue ? 100 : Math.min(100, Math.max(2, rawPercent));

  // 计算剩余天数与超期天数
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 3600 * 24)));
  const remainingHours = Math.round(remainingMs / (1000 * 3600));
  const overdueDays = isOverdue ? Math.max(1, Math.ceil(overdueMs / (1000 * 3600 * 24))) : 0;

  // 格式化剩余天数展示
  let remainingDaysFormatted = `${remainingDays}天`;
  if (remainingDays === 0 && remainingHours > 0) {
    remainingDaysFormatted = `${remainingHours}小时`;
  } else if (remainingDays === 0 && remainingHours === 0) {
    remainingDaysFormatted = '不足1小时';
  }

  // 借调时间是否已过半 (>= 50% 且未到期)
  const isHalfwayPassed = rawPercent >= 50 && !isOverdue;

  let colorTheme: 'normal' | 'approaching' | 'overdue';
  let urgencyLevel: 'normal' | 'halfway' | 'overdue';
  let statusLabel: string;
  let countdownLabel: string;
  let countdownShortLabel: string;
  let urgencyColorClasses: {
    badge: string;
    border: string;
    bg: string;
    text: string;
    ring: string;
  };

  if (isOverdue) {
    // 规则 1：到期时显示红色提醒
    colorTheme = 'overdue';
    urgencyLevel = 'overdue';
    statusLabel = overdueDays > 0 ? `超期 ${overdueDays} 天` : '已到期待还';
    countdownLabel = overdueDays > 0 ? `已到期 (超期 ${overdueDays} 天)` : '借期已到期 · 紧急还库';
    countdownShortLabel = overdueDays > 0 ? `已到期 · 超期${overdueDays}天` : '已到期待还';
    urgencyColorClasses = {
      badge: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold animate-pulse shadow-xs',
      border: 'border-rose-300 hover:border-rose-400',
      bg: 'bg-rose-50/40',
      text: 'text-rose-700',
      ring: 'ring-1 ring-rose-200'
    };
  } else if (isHalfwayPassed) {
    // 规则 2：借调时间过半时自动显示黄色提醒
    colorTheme = 'approaching';
    urgencyLevel = 'halfway';
    statusLabel = rawPercent >= 85 ? '即将到期' : '借期过半';
    countdownLabel = `借期过半 · 剩余使用: ${remainingDaysFormatted}`;
    countdownShortLabel = `剩 ${remainingDaysFormatted} (时间过半)`;
    urgencyColorClasses = {
      badge: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-xs',
      border: 'border-amber-300 hover:border-amber-400',
      bg: 'bg-amber-50/40',
      text: 'text-amber-800',
      ring: 'ring-1 ring-amber-200/60'
    };
  } else {
    // 规则 3：未过半正常状态
    colorTheme = 'normal';
    urgencyLevel = 'normal';
    statusLabel = '流转正常';
    countdownLabel = `剩余使用天数: ${remainingDaysFormatted}`;
    countdownShortLabel = `剩 ${remainingDaysFormatted}`;
    urgencyColorClasses = {
      badge: 'bg-blue-50 text-blue-700 border border-blue-200/80 font-medium',
      border: 'border-blue-200 hover:border-blue-300',
      bg: 'bg-blue-50/20',
      text: 'text-blue-700',
      ring: 'ring-1 ring-blue-100'
    };
  }

  return {
    borrowMs,
    expectedMs,
    nowMs,
    totalDurationMs,
    elapsedMs,
    remainingMs,
    isOverdue,
    overdueMs,
    rawPercent,
    clampedPercent,
    elapsedFormatted: formatDuration(elapsedMs),
    totalFormatted: formatDuration(totalDurationMs),
    remainingFormatted: formatDuration(remainingMs),
    overdueFormatted: formatDuration(overdueMs),
    colorTheme,
    statusLabel,
    remainingDays,
    remainingDaysFormatted,
    overdueDays,
    isHalfwayPassed,
    urgencyLevel,
    countdownLabel,
    countdownShortLabel,
    urgencyColorClasses
  };
};

/**
 * 独立的‘剩余使用天数’倒计时标签组件
 * - 借调时间过半自动显示黄色提醒
 * - 到期时自动显示红色提醒
 */
export const LoanCountdownBadge: React.FC<{
  borrowTime?: string;
  expectedReturnTime?: string;
  loan?: {
    borrowTime?: string;
    expectedReturnTime?: string;
    loanDate?: string;
    expectedReturnDate?: string;
    [key: string]: any;
  };
  variant?: 'badge' | 'tag' | 'pill' | 'banner';
  className?: string;
  showIcon?: boolean;
}> = ({
  borrowTime,
  expectedReturnTime,
  loan,
  variant = 'badge',
  className = '',
  showIcon = true
}) => {
  const bTime = borrowTime || loan?.borrowTime || loan?.loanDate || '';
  const eTime = expectedReturnTime || loan?.expectedReturnTime || loan?.expectedReturnDate || '';
  const progress = computeLoanTimeProgress(bTime, eTime);

  if (variant === 'banner') {
    return (
      <div className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs ${progress.urgencyColorClasses.badge} ${className}`}>
        <div className="flex items-center gap-1.5 font-bold">
          {progress.urgencyLevel === 'overdue' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          ) : progress.urgencyLevel === 'halfway' ? (
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          ) : (
            <Hourglass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          )}
          <span>{progress.countdownLabel}</span>
        </div>
        <span className="font-mono text-[11px] opacity-85">
          {progress.rawPercent}% ({progress.elapsedFormatted}/{progress.totalFormatted})
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] whitespace-nowrap transition-colors ${progress.urgencyColorClasses.badge} ${className}`}
      title={`借调时间: ${bTime} 至 ${eTime}\n已用: ${progress.rawPercent}% (${progress.elapsedFormatted})\n${progress.countdownLabel}`}
    >
      {showIcon && (
        progress.urgencyLevel === 'overdue' ? (
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 animate-bounce" />
        ) : progress.urgencyLevel === 'halfway' ? (
          <Clock className="w-3 h-3 text-amber-700 shrink-0" />
        ) : (
          <Clock className="w-2.5 h-2.5 text-blue-600 shrink-0" />
        )
      )}
      <span>{progress.countdownShortLabel}</span>
    </span>
  );
};

export const LoanTimeProgressBar: React.FC<LoanTimeProgressProps> = ({
  loan,
  device,
  mode = 'card',
  className = '',
  showDetails = true
}) => {
  const progress = loan ? computeLoanTimeProgress(loan.borrowTime, loan.expectedReturnTime) : null;

  // 1. 超紧凑迷你条模式 (适合表格细小单元格)
  if (mode === 'mini') {
    if (!loan || !progress) {
      return (
        <span className="text-[10px] text-emerald-600 font-mono inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          待命在库
        </span>
      );
    }

    return (
      <div 
        className={`w-full space-y-1 ${className}`} 
        title={`借调时效: ${loan.borrowTime} 至 ${loan.expectedReturnTime} | 当前进度: ${progress.rawPercent}% ${progress.isOverdue ? `(已超期 ${progress.overdueFormatted})` : `(剩余 ${progress.remainingFormatted})`}`}
      >
        <div className="flex items-center justify-between text-[10px] font-mono leading-none">
          <span className={`font-semibold ${progress.isOverdue ? 'text-rose-600 font-bold' : progress.colorTheme === 'approaching' ? 'text-amber-700' : 'text-slate-600'}`}>
            {progress.isOverdue ? `超期 ${progress.overdueFormatted}` : `${progress.rawPercent}%`}
          </span>
          <span className="text-slate-400 text-[9px]">{progress.remainingFormatted ? `剩${progress.remainingFormatted}` : ''}</span>
        </div>
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${
          progress.isOverdue ? 'bg-rose-100' : progress.colorTheme === 'approaching' ? 'bg-amber-100' : 'bg-slate-100'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progress.isOverdue ? 'bg-rose-600' : progress.colorTheme === 'approaching' ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${progress.clampedPercent}%` }}
          />
        </div>
      </div>
    );
  }

  // 2. 卡片视图模式 (按中文规范全面采用横向单行流式排版，横向一体化贯通，严格避免纵向堆叠折字)
  if (mode === 'card') {
    // 情况 A：借调在用设备 (Active Loan) - 横向流式单行状态条
    if (loan && progress) {
      const returnDateShort = loan.expectedReturnTime ? loan.expectedReturnTime.slice(5, 10) : '-';

      return (
        <div
          className={`w-full min-w-0 rounded-md px-2.5 py-1.5 border flex items-center justify-between gap-2 text-xs transition-all ${
            progress.isOverdue
              ? 'bg-rose-50/50 border-rose-200/90'
              : progress.colorTheme === 'approaching'
              ? 'bg-amber-50/50 border-amber-200/90'
              : 'bg-slate-50/90 border-slate-200/90'
          } ${className}`}
          title={`借调科室: ${loan.borrowingDepartment}\n经办人: ${loan.borrowerName || '-'}\n借出时间: ${loan.borrowTime}\n应还时间: ${loan.expectedReturnTime}\n时效进度: ${progress.rawPercent}%`}
        >
          {/* 左侧：借调科室与状态图标 (横向排版，严格单行) */}
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${
              progress.isOverdue ? 'text-rose-600' : progress.colorTheme === 'approaching' ? 'text-amber-600' : 'text-blue-600'
            }`} />
            <span className="truncate font-medium text-xs text-slate-800 whitespace-nowrap" title={loan.borrowingDepartment}>
              {loan.borrowingDepartment}
            </span>
          </div>

          {/* 中间：横向延展流式时效进度轨 */}
          <div className={`flex-1 min-w-[32px] h-1.5 rounded-full overflow-hidden shrink ${
            progress.isOverdue ? 'bg-rose-100' : progress.colorTheme === 'approaching' ? 'bg-amber-100' : 'bg-slate-200/80'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                progress.isOverdue
                  ? 'bg-rose-500'
                  : progress.colorTheme === 'approaching'
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progress.clampedPercent}%` }}
            />
          </div>

          {/* 右侧：倒计时胶囊与应还时效 (规整横向对齐) */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <span className={`px-1.5 py-0.2 rounded text-[11px] font-medium font-mono whitespace-nowrap ${
              progress.isOverdue
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : progress.colorTheme === 'approaching'
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {progress.isOverdue ? `超期${progress.overdueDays}天` : `剩${progress.remainingDays}天`}
            </span>
            <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap hidden sm:inline">
              ({returnDateShort}还)
            </span>
          </div>
        </div>
      );
    }

    // 情况 B：维护/维修中设备 (Maintenance / Repair) - 横向流式单行状态条
    if (device?.status === '故障待修' || device?.status === '维护保养中') {
      return (
        <div
          className={`w-full min-w-0 rounded-md px-2.5 py-1.5 border flex items-center justify-between gap-2 text-xs transition-all bg-purple-50/30 border-purple-200/80 ${className}`}
          title="设备处于检修维保状态，暂时不可借调"
        >
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <AlertTriangle className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="font-medium text-xs text-purple-950 whitespace-nowrap">{device?.status || '检修中'}</span>
            <span className="px-1.5 py-0.2 rounded text-[11px] font-medium bg-purple-100/80 text-purple-800 border border-purple-200/80 whitespace-nowrap">
              暂停调配
            </span>
          </div>

          <div className="flex-1 min-w-[32px] h-1.5 rounded-full overflow-hidden bg-purple-100 shrink">
            <div className="h-full rounded-full bg-purple-400 w-2/3 transition-all duration-300" />
          </div>

          <span className="font-mono text-[11px] text-purple-600 font-medium whitespace-nowrap shrink-0">
            维保中
          </span>
        </div>
      );
    }

    // 情况 C：在库待命可借设备 (Available / Standby) - 横向流式单行就绪条，全横向规范对齐
    return (
      <div
        className={`w-full min-w-0 rounded-md px-2.5 py-1.5 border flex items-center justify-between gap-2 text-xs transition-all bg-emerald-50/25 border-emerald-200/70 ${className}`}
        title="设备在库应急就绪，随时支持临床科室紧急调配出库"
      >
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium text-xs text-emerald-950 whitespace-nowrap">在库待命</span>
          <span className="px-1.5 py-0.2 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200/80 whitespace-nowrap">
            随时可借
          </span>
        </div>

        <div className="flex-1 min-w-[32px] h-1.5 rounded-full overflow-hidden bg-emerald-100 shrink">
          <div className="h-full rounded-full bg-emerald-500 w-full transition-all duration-300" />
        </div>

        <span className="font-mono text-[11px] text-emerald-700 font-medium whitespace-nowrap shrink-0">
          100%完好
        </span>
      </div>
    );
  }

  // 3. 表格模式 (用于表格中的详细列展示)
  if (!loan || !progress) {
    return (
      <div className={`p-2 rounded-md border text-xs space-y-1 bg-emerald-50/40 border-emerald-200/70 text-emerald-900 ${className}`}>
        <div className="flex items-center justify-between font-bold text-[11px]">
          <span className="flex items-center gap-1 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>在库待命 · 应急储备充裕</span>
          </span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            100% 就绪
          </span>
        </div>
        <div className="text-[10.5px] text-slate-500">随时可供各临床科室紧急借调出库使用</div>
      </div>
    );
  }

  return (
    <div
      className={`p-2 rounded-md border text-xs space-y-1.5 ${
        progress.isOverdue
          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
          : progress.colorTheme === 'approaching'
          ? 'bg-amber-50/80 border-amber-300 text-amber-950'
          : 'bg-slate-50/90 border-slate-200 text-slate-800'
      } ${className}`}
      title={`借调开始: ${loan.borrowTime} | 预计归还: ${loan.expectedReturnTime}`}
    >
      {/* 顶部：借调科室与‘剩余使用天数’倒计时标签 */}
      <div className="flex items-center justify-between font-bold text-[11px] gap-1">
        <span className="flex items-center gap-1 truncate text-slate-900">
          <Building2 className={`w-3.5 h-3.5 shrink-0 ${progress.isOverdue ? 'text-rose-600' : progress.colorTheme === 'approaching' ? 'text-amber-700' : 'text-blue-600'}`} />
          <span>借至: {loan.borrowingDepartment}</span>
        </span>
        {progress.isOverdue ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 shrink-0 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            超期 {progress.overdueFormatted}
          </span>
        ) : progress.colorTheme === 'approaching' ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 shadow-2xs">
            <Clock className="w-3 h-3 text-amber-700" />
            借期过半 · 剩{progress.remainingDaysFormatted}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            <Hourglass className="w-2.5 h-2.5 text-blue-600" />
            剩 {progress.remainingDaysFormatted}
          </span>
        )}
      </div>

      {/* 经办与预计归还时间 */}
      <div className="text-[10.5px] text-slate-600 flex items-center justify-between flex-wrap gap-1">
        <span className="truncate">经办: {loan.borrowerName} {loan.borrowerPhone ? `(${loan.borrowerPhone})` : ''}</span>
        <span className="font-mono text-slate-700">预还: {loan.expectedReturnTime ? loan.expectedReturnTime.slice(5) : '-'}</span>
      </div>

      {/* 进度条与百分比 */}
      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className={`font-medium flex items-center gap-1 ${
            progress.isOverdue ? 'text-rose-700 font-bold' : progress.colorTheme === 'approaching' ? 'text-amber-800 font-semibold' : 'text-slate-600'
          }`}>
            <span>借用时效</span>
            {progress.isOverdue ? (
              <span className="text-rose-600 font-bold">(已超期 {progress.overdueFormatted})</span>
            ) : progress.colorTheme === 'approaching' ? (
              <span className="text-amber-800 font-bold">(借期过半 · 剩{progress.remainingDaysFormatted})</span>
            ) : (
              <span className="text-slate-400 font-normal">({progress.remainingFormatted ? `剩 ${progress.remainingFormatted}` : '待归还'})</span>
            )}
          </span>
          <span className={`font-mono font-bold ${
            progress.isOverdue ? 'text-rose-700' : progress.colorTheme === 'approaching' ? 'text-amber-700' : 'text-blue-700'
          }`}>
            {progress.rawPercent}%
          </span>
        </div>

        {/* 进度条轨道 */}
        <div className={`h-1.5 w-full rounded-full overflow-hidden ${
          progress.isOverdue ? 'bg-rose-200/90' : progress.colorTheme === 'approaching' ? 'bg-amber-200/80' : 'bg-slate-200'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progress.isOverdue
                ? 'bg-rose-600'
                : progress.colorTheme === 'approaching'
                ? 'bg-amber-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${progress.clampedPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
          <span>已占用 {progress.elapsedFormatted}</span>
          <span>计划周转 {progress.totalFormatted}</span>
        </div>
      </div>

      {/* 事由说明（若存在） */}
      {showDetails && loan.borrowReason && (
        <div className="text-[10px] text-slate-500 line-clamp-1 italic pt-0.5 border-t border-slate-200/50">
          “{loan.borrowReason}”
        </div>
      )}
    </div>
  );
};
