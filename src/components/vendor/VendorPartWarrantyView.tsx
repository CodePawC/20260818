import React, { useState } from 'react';
import { 
  ShieldCheck, Search, Filter, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, Calendar, Printer, Wrench, Check, ArrowRight
} from 'lucide-react';
import { PartWarrantyRecord, VendorUserAccount } from '../../types/vendorCollaborationTypes';

interface VendorPartWarrantyViewProps {
  currentVendor: VendorUserAccount;
  records: PartWarrantyRecord[];
  onToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const VendorPartWarrantyView: React.FC<VendorPartWarrantyViewProps> = ({
  currentVendor,
  records,
  onToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_WARRANTY' | 'EXPIRING_SOON' | 'ALARM'>('ALL');

  const filteredRecords = records.filter(r => {
    const matchSearch = 
      r.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchStatus = true;
    if (statusFilter === 'IN_WARRANTY') matchStatus = r.status === 'IN_WARRANTY';
    if (statusFilter === 'EXPIRING_SOON') matchStatus = r.status === 'EXPIRING_SOON';
    if (statusFilter === 'ALARM') matchStatus = r.hasReFaultAlarm;

    return matchSearch && matchStatus;
  });

  const inWarrantyCount = records.filter(r => r.status === 'IN_WARRANTY').length;
  const expiringSoonCount = records.filter(r => r.status === 'EXPIRING_SOON').length;
  const alarmCount = records.filter(r => r.hasReFaultAlarm).length;

  const handlePrintWarrantyCard = (item: PartWarrantyRecord) => {
    onToast(`已生成【${item.equipmentName} - ${item.partName}】配件全生命周期质保凭证 (PDF)`, 'success');
  };

  const handleApplyFreeRework = (item: PartWarrantyRecord) => {
    onToast(`已为【${item.equipmentName}】发起【质保期内免费返修】快速工单，工时费与备件费均按0元核销录入！`, 'success');
  };

  return (
    <div className="space-y-5">
      {/* 统计指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">在保配件总数</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600">
            {inWarrantyCount} <span className="text-xs font-normal text-slate-500">件</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">大修与更换备件在保履约率100%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">临期预警 (≤30天)</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600">
            {expiringSoonCount} <span className="text-xs font-normal text-slate-500">件</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">即将过保，建议安排巡检复查</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">返修告警 (零收费)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-rose-600">
            {alarmCount} <span className="text-xs font-normal text-slate-500">件触警</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">同配件同故障拦截，执行免费质保</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">质保履约信誉分</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-blue-600">
            100 分
          </div>
          <div className="mt-1 text-[11px] text-slate-400">无返修推诿拒赔违约记录</div>
        </div>
      </div>

      {/* 搜索与筛选 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索设备名称、配件型号、工单号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              全部 ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_WARRANTY')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'IN_WARRANTY' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              在保中 ({inWarrantyCount})
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRING_SOON')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'EXPIRING_SOON' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              临期预警 ({expiringSoonCount})
            </button>
            <button
              onClick={() => setStatusFilter('ALARM')}
              className={`px-3 py-1 rounded-md transition ${statusFilter === 'ALARM' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'hover:text-slate-900'}`}
            >
              返修告警 ({alarmCount})
            </button>
          </div>
        </div>
      </div>

      {/* 配件质保列表 */}
      <div className="space-y-3.5">
        {filteredRecords.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl border p-4.5 hover:shadow-sm transition ${
              item.hasReFaultAlarm ? 'border-rose-300 ring-2 ring-rose-100/70' : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.hasReFaultAlarm
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : item.status === 'EXPIRING_SOON'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{item.partName}</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                      型号: {item.partModel}
                    </span>
                    {item.hasReFaultAlarm ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold inline-flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        触碰质保期返修拦截
                      </span>
                    ) : item.status === 'EXPIRING_SOON' ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        剩余 {item.remainingDays} 天到期
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        在保生效中 (剩余 {item.remainingDays} 天)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    所属装机设备: <strong className="text-slate-800">{item.equipmentName}</strong> ({item.equipmentDept})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintWarrantyCard(item)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>质保卡存证</span>
                </button>
                {item.hasReFaultAlarm && (
                  <button
                    type="button"
                    onClick={() => handleApplyFreeRework(item)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>执行0元免费返修</span>
                  </button>
                )}
              </div>
            </div>

            {/* 质保期进度与时效 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-3 bg-slate-50/70 p-3 rounded-lg border border-slate-100 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">安装换件交付日期</span>
                <span className="font-bold text-slate-800">{item.installDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">承诺质保期限</span>
                <span className="font-bold text-slate-800">{item.warrantyPeriodMonths} 个月</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">质保截止日期</span>
                <span className="font-bold text-slate-800">{item.warrantyEndDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">责任主修工程师</span>
                <span className="font-bold text-slate-800 font-sans">{item.engineerName}</span>
              </div>
            </div>

            {item.hasReFaultAlarm && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>系统内控预警：该设备于质保期内再次上报相同故障，已自动触发“免费返修保护”！</span>
                </div>
                <div className="text-[11px] text-rose-700 pl-5.5">
                  根据《公立医院外协维修服务管理办法》，此工单配件费与工时费均自动置为0元，服务商须在2小时内响应并限期完成返修调试，严禁向医院重复请款。
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
