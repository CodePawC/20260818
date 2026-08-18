import React, { useState, useEffect } from 'react';
import { Database, Cpu, Clock } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setTimeStr(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-8 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-xs font-medium text-slate-600 shrink-0 select-none z-10">
      {/* Left: DB Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800">系统数据库: 已连接</span>
          <span className="text-slate-500 font-mono text-xs">(0.12s 毫秒级同步)</span>
        </div>
      </div>

      {/* Right: Time & Version Info */}
      <div className="flex items-center gap-4 font-mono">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>{timeStr || '2026-08-08 00:00:00'}</span>
        </div>

        <div className="flex items-center gap-1 text-slate-600 border-l border-slate-300 pl-3">
          <Cpu className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800">MED-TECH OS v2.4.0</span>
        </div>
      </div>
    </footer>
  );
};
