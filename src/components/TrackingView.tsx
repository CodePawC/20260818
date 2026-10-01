import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment, StatusLog } from '../types';
import { Activity, ShieldCheck, RefreshCw, Search, Filter } from 'lucide-react';
import { Pagination } from './Pagination';

interface TrackingViewProps {
  equipmentList: MedicalEquipment[];
  onOpenStatusChange: (device: MedicalEquipment) => void;
}

export const TrackingView: React.FC<TrackingViewProps> = ({
  equipmentList,
  onOpenStatusChange,
}) => {
  // Aggregate all status logs
  const allLogs: (StatusLog & { deviceName: string; deviceSn: string; department: string })[] = useMemo(() => {
    const list: (StatusLog & { deviceName: string; deviceSn: string; department: string })[] = [];
    equipmentList.forEach(e => {
      e.statusLogs.forEach(l => {
        list.push({
          ...l,
          deviceName: e.name,
          deviceSn: e.sn,
          department: e.department
        });
      });
    });
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [equipmentList]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, statusFilter, departmentFilter]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set(allLogs.map(l => l.department));
    return Array.from(set);
  }, [allLogs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matches = 
          log.deviceName.toLowerCase().includes(kw) ||
          log.deviceSn.toLowerCase().includes(kw) ||
          log.operator.toLowerCase().includes(kw) ||
          log.reason.toLowerCase().includes(kw);
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && log.newStatus !== statusFilter) {
        return false;
      }
      if (departmentFilter !== 'all' && log.department !== departmentFilter) {
        return false;
      }
      return true;
    });
  }, [allLogs, searchKeyword, statusFilter, departmentFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex-1 min-h-0 flex flex-col overflow-hidden shadow-xs">
      {/* Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">全院设备运行状态变动实时追踪 Status Tracking</h2>
            <p className="text-2xs sm:text-xs text-slate-500 font-medium">
              透明化变动履历审计（正常运行 / 维护保养中 / 故障待修 / 报废停用）
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索设备、SN、经办人、事由..."
              className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium w-48 text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">全部变动后状态</option>
            <option value="正常运行">正常运行</option>
            <option value="维护保养中">维护保养中</option>
            <option value="故障待修">故障待修</option>
            <option value="报废停用">报废停用</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 outline-none"
          >
            <option value="all">全部科室</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 bg-slate-50/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>设备状态切换动向 ({filteredLogs.length} 条记录)</span>
            <span>第 {currentPage} / {Math.ceil(filteredLogs.length / pageSize) || 1} 页</span>
          </div>

          {paginatedLogs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>未查询到匹配的状态变动日志</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-3.5 py-1">
              {paginatedLogs.map((log) => (
                <div key={log.id} className="relative bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-blue-200 transition">
                  <div className="absolute -left-8 top-5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100"></div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono font-medium text-slate-600">{log.timestamp}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">经办人: {log.operator}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm">{log.deviceName}</span>
                    <span className="font-mono text-xs text-slate-400">[{log.deviceSn}]</span>
                    <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">{log.department}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold pt-1">
                    <span className="text-slate-400">{log.oldStatus}</span>
                    <span className="text-blue-500">➔</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                      log.newStatus === '正常运行' ? 'bg-emerald-100 text-emerald-700' :
                      log.newStatus === '维护保养中' ? 'bg-amber-100 text-amber-700' :
                      log.newStatus === '故障待修' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {log.newStatus}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 mt-2 font-medium">
                    <strong className="text-slate-700">事由/描述:</strong> {log.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={filteredLogs.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};
