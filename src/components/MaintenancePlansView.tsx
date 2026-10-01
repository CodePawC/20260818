import React, { useState, useMemo, useEffect } from 'react';
import { MedicalEquipment, AuthUser } from '../types';
import { Calendar, Wrench, Search } from 'lucide-react';
import { getUserDepartment, isHeadNurse, isClinicalStaff } from '../utils/authUtils';
import { Pagination } from './Pagination';

interface MaintenancePlansViewProps {
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser | null;
  onOpenRepairModalForDevice: (device: MedicalEquipment) => void;
}

export const MaintenancePlansView: React.FC<MaintenancePlansViewProps> = ({
  equipmentList,
  currentUser,
  onOpenRepairModalForDevice,
}) => {
  const userDept = getUserDepartment(currentUser);
  const isNurse = isHeadNurse(currentUser) || isClinicalStaff(currentUser);
  const [deptFilter, setDeptFilter] = useState<string>(() => (isNurse && userDept ? userDept : ''));
  const [searchKey, setSearchKey] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    equipmentList.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [equipmentList]);

  const filteredList = useMemo(() => {
    return equipmentList.filter(item => {
      if (deptFilter && item.department !== deptFilter) return false;
      if (searchKey) {
        const kw = searchKey.toLowerCase();
        const matches = 
          item.name.toLowerCase().includes(kw) ||
          item.sn.toLowerCase().includes(kw) ||
          item.model.toLowerCase().includes(kw) ||
          (item.manager && item.manager.toLowerCase().includes(kw));
        if (!matches) return false;
      }
      return true;
    });
  }, [equipmentList, deptFilter, searchKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deptFilter, searchKey]);

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-md border border-slate-200 h-full flex flex-col min-h-0 overflow-hidden shadow-xs">
      <div className="p-3 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between flex-none gap-2.5">
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            预防性维保(PM)与计量校准计划表 Maintenance Plans
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            按季度定期对全院生命支持类与急救设备执行例行清洁、定标与安全检测
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Department filter */}
          <div className="flex items-center gap-1">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">全部科室</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {userDept && isNurse && (
              <button
                type="button"
                onClick={() => setDeptFilter(deptFilter === userDept ? '' : userDept)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  deptFilter === userDept
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {deptFilter === userDept ? `锁定${userDept}` : `仅看${userDept}`}
              </button>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="搜索设备、SN号..."
              className="pl-8 pr-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 w-44"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-2xs border-b border-slate-200">
            <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-2.5">Asset ID / 编号</th>
              <th className="px-4 py-2.5">Asset Name / 设备名称</th>
              <th className="px-4 py-2.5">Dept / 科室</th>
              <th className="px-4 py-2.5">Manager / 负责人</th>
              <th className="px-4 py-2.5">Last PM / 上次维保</th>
              <th className="px-4 py-2.5">Next PM / 预计下次</th>
              <th className="px-4 py-2.5">Cycle Status / 周期状态</th>
              <th className="px-4 py-2.5 text-right">Action / 操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                  暂无匹配的预防性维保计划设备。
                </td>
              </tr>
            ) : (
              paginatedList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-2.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                    {item.sn}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <span className="block text-[11px] text-slate-400 font-normal">{item.model}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{item.department}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{item.manager}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">{item.lastMaintenanceDate || '未记录'}</td>
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {item.nextMaintenanceDate || '2026-12-31'}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {item.status === '维护保养中' ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                        MAINTENANCE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        REGULAR
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => onOpenRepairModalForDevice(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition shadow-xs inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      发起例行PM保养
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed Footer Pagination */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalCount={filteredList.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};
