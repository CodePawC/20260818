import React, { useState } from 'react';
import { MedicalEquipment, RepairRecord, AuthUser } from '../types';
import { History, Search, Wrench, CheckCircle2, Stethoscope } from 'lucide-react';
import { isHeadNurse, getUserDepartment } from '../utils/authUtils';

interface RepairLogsViewProps {
  equipmentList: MedicalEquipment[];
  currentUser?: AuthUser;
  onOpenRepairModal: () => void;
  onViewPartner?: (partnerName: string) => void;
}

export const RepairLogsView: React.FC<RepairLogsViewProps> = ({
  equipmentList,
  currentUser,
  onOpenRepairModal,
  onViewPartner
}) => {
  const [searchKey, setSearchKey] = useState('');

  const isNurse = isHeadNurse(currentUser);
  const userDept = getUserDepartment(currentUser);

  // Extract all repair records across equipment
  const allRepairs: RepairRecord[] = [];
  equipmentList.forEach(e => {
    e.repairRecords.forEach(r => {
      allRepairs.push({
        ...r,
        equipmentName: r.equipmentName || e.name,
        equipmentSn: r.equipmentSn || e.sn
      });
    });
  });

  const filteredRepairs = allRepairs.filter(r => 
    r.equipmentName.includes(searchKey) ||
    r.equipmentSn.includes(searchKey) ||
    r.faultDescription.includes(searchKey) ||
    r.technician.includes(searchKey)
  );

  const totalRepairCost = allRepairs.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="bg-white rounded-md border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between flex-none gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            {isNurse ? <Stethoscope className="w-5 h-5 text-rose-600" /> : <History className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                {isNurse && userDept ? `【${userDept}】设备报修与维保记录` : '全院设备维修与保养工单总台账 Repair Logs'}
              </h2>
              {isNurse && userDept && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  科室专属台账
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              本科室累计工单 <strong className="text-slate-800">{allRepairs.length}</strong> 份 | 维保费用总支出{' '}
              <strong className="text-rose-500 font-mono font-bold notranslate" translate="no">￥{totalRepairCost.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="搜索描述、序列号、工程师..."
              className="pl-9 pr-3 py-2 bg-slate-100 border-none rounded-lg text-xs font-medium w-60 text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            onClick={onOpenRepairModal}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Wrench className="w-4 h-4" />
            登记新维修工单
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredRepairs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            暂无匹配的维修保养记录。
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Work Order / 工单号</th>
                <th className="px-6 py-4">Asset / 设备及序列号</th>
                <th className="px-6 py-4">Type / 类型</th>
                <th className="px-6 py-4">Report Date / 时间</th>
                <th className="px-6 py-4">Description / 故障现象</th>
                <th className="px-6 py-4">Technician / 维保人员</th>
                <th className="px-6 py-4">Cost / 支出金额 (元/RMB)</th>
                <th className="px-6 py-4 text-right">Status / 状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {filteredRepairs.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 font-medium">
                    {record.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {record.equipmentName}
                    <span className="block font-mono text-xs text-slate-400 font-normal">
                      {record.equipmentSn}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      record.repairType.includes('保养') || record.repairType.includes('校准') ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.repairType}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {record.faultDate}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate text-slate-600 font-medium" title={record.faultDescription}>
                    {record.faultDescription}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {onViewPartner && record.technician ? (
                      <button
                        type="button"
                        onClick={() => onViewPartner(record.technician)}
                        className="text-blue-700 hover:text-blue-900 hover:underline font-semibold cursor-pointer text-left"
                        title={`查看服务商/维保单位【${record.technician}】档案`}
                      >
                        {record.technician}
                      </button>
                    ) : (
                      record.technician
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-800 notranslate" translate="no">
                    ￥{(record.cost || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                      record.status === '已完成' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {record.status === '已完成' ? 'COMPLETED' : record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
