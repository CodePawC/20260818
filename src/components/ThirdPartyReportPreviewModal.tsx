import React from 'react';
import { ThirdPartyInspectionReport } from '../types';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  User, 
  Activity, 
  Clock, 
  Check, 
  Sparkles,
  QrCode,
  BadgeCheck
} from 'lucide-react';

interface ThirdPartyReportPreviewModalProps {
  report: ThirdPartyInspectionReport | null;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSn?: string;
  department?: string;
  onClose: () => void;
}

export const ThirdPartyReportPreviewModal: React.FC<ThirdPartyReportPreviewModalProps> = ({
  report,
  equipmentName = '医用数字化X射线机 (DR)',
  equipmentModel = 'Shimadzu Sonialvision G4',
  equipmentSn = 'SN-SHZ-2013-0988',
  department = '医学影像科',
  onClose
}) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app or browser sandbox, initiate download of report blob/data
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.fileName.replace(/\.pdf$/, '') + '_核验归档.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold truncate max-w-md">{report.fileName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  CMA/CNAS已验签
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                第三方法定计量检验机构 · 具备国家 CMA 计量认证与 CNAS 实验室认可资质
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="打印本报告"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>打印</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="导出下载"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载报告</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-Fidelity Report Sheet View */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100/70">
          <div className="bg-white rounded-xl shadow-md border border-slate-300/80 p-8 max-w-2xl mx-auto relative overflow-hidden font-serif text-slate-900">
            {/* Official Report Header */}
            <div className="border-b-2 border-slate-800 pb-5 text-center relative font-sans">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 border border-slate-400 text-[10px] font-bold text-slate-700 font-mono">
                    CMA 2026150899Z
                  </span>
                  <span className="px-1.5 py-0.5 border border-slate-400 text-[10px] font-bold text-slate-700 font-mono">
                    CNAS L0198
                  </span>
                </div>
                <div className="font-mono text-slate-600">
                  报告编号：<strong className="text-slate-900">{report.reportNo}</strong>
                </div>
              </div>

              <h1 className="text-xl md:text-2xl font-bold tracking-wider text-slate-900 font-serif">
                {report.agencyName}
              </h1>
              <div className="text-base md:text-lg font-bold text-slate-800 tracking-widest mt-1 font-serif">
                {report.reportTypeName}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                TEST & VERIFICATION REPORT FOR OVERDUE MEDICAL EQUIPMENT
              </p>
            </div>

            {/* Basic Sample Profile */}
            <div className="mt-5 space-y-4 font-sans text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">受检设备名称：</span>
                    <strong className="text-slate-900">{equipmentName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">规格型号：</span>
                    <span className="font-mono font-bold text-slate-900">{equipmentModel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-500">出厂机身编号 (SN)：</span>
                    <span className="font-mono font-bold text-slate-900">{equipmentSn}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">委托/使用单位：</span>
                    <span className="font-bold text-slate-900">五莲县人民医院 ({department})</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700 border-t border-slate-200/80 pt-2">
                  <div>
                    <span className="text-slate-500">检验检测类别：</span>
                    <span className="font-bold text-emerald-800">超期服役性能稳定性评定 & 医用电气安全</span>
                  </div>
                  <div>
                    <span className="text-slate-500">检验完成日期：</span>
                    <span className="font-mono font-bold text-slate-900">{report.extractedData?.testDate || report.uploadDate.slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              {/* Execution Standards */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-slate-800 space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>依据检验检测技术标准与评价规范：</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-blue-800 space-y-0.5">
                  <li>GB 9706.1-2020《医用电气设备 第1部分：基本安全和基本性能的通用要求》</li>
                  <li>YY/T 0011-2021《医用诊断X射线机稳定性评价通用技术规范》</li>
                  <li>三级甲等公立医院超期大型医用装备 72 小时满负荷模拟连续工况检验规程</li>
                </ul>
              </div>

              {/* Core Test Data Summary */}
              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>关键质控项目实测记录与判定结果</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    综合评定：合格 (QUALIFIED)
                  </span>
                </h3>

                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="py-2 px-3">检定项目</th>
                        <th className="py-2 px-3">标准限值要求</th>
                        <th className="py-2 px-3">现场实测值</th>
                        <th className="py-2 px-3">单项结论</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">保护接地阻抗</td>
                        <td className="py-2 px-3 text-slate-600">&lt; 0.100 Ω</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">
                          {report.extractedData?.groundResistance || '0.042 Ω'}
                        </td>
                        <td className="py-2 px-3 font-sans text-emerald-700 font-bold">合格</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">对地漏电流 (正常工况)</td>
                        <td className="py-2 px-3 text-slate-600">&lt; 0.500 mA</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">
                          {report.extractedData?.leakageCurrent || '0.086 mA'}
                        </td>
                        <td className="py-2 px-3 font-sans text-emerald-700 font-bold">合格</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">连续满载运行工况考核</td>
                        <td className="py-2 px-3 text-slate-600">&ge; 72 小时连续工况</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">
                          {report.extractedData?.continuousHours || 72} 小时无死机
                        </td>
                        <td className="py-2 px-3 font-sans text-emerald-700 font-bold">合格</td>
                      </tr>
                      <tr className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">输出参数最大零点漂移率</td>
                        <td className="py-2 px-3 text-slate-600">&le; 1.50%</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">
                          {report.extractedData?.driftRate || '0.28%'}
                        </td>
                        <td className="py-2 px-3 font-sans text-emerald-700 font-bold">合格</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Conclusion Box */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-lg space-y-1.5">
                <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>国家法定检验机构综合评定结论：</span>
                </div>
                <p className="text-emerald-950 text-xs leading-relaxed font-sans">
                  该受检医疗装备在完成关键元器件整修后，经 72 小时满负荷模拟连续工况运行与 GB 9706.1-2020 电气安全全项测试，<strong>各项输出指标与电气防护指标均达到国家标准与临床诊断性能要求，未发现热衰减、绝缘击穿或零点超差缺陷</strong>。准予在医院医学装备管理委员会监管下办理特许准用备案。
                </p>
              </div>

              {/* Signatures & CA Verification Info */}
              <div className="border-t border-slate-200 pt-4 flex items-end justify-between font-sans text-xs text-slate-600">
                <div className="space-y-1">
                  <div>主检工程师：<span className="font-bold text-slate-900">赵晨光 (高工/检定员证号: JD-201889)</span></div>
                  <div>审核人：<span className="font-bold text-slate-900">李建平 (主任技师)</span></div>
                  <div>批准人：<span className="font-bold text-slate-900">王海峰 (质检中心副主任)</span></div>
                  <div className="text-[10px] text-slate-400 font-mono mt-2">
                    电子防伪哈希：SHA256:7f4c99e2a819b52c009d11e...
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-1 text-emerald-700 font-bold">
                    <BadgeCheck className="w-4 h-4" />
                    <span>CA 数字认证证书有效</span>
                  </div>
                  <div className="text-slate-500">签发日期：{report.extractedData?.testDate || '2026-05-25'}</div>
                  <div className="text-[10px] text-slate-400">有效查验网址：www.sd-mdeqc.org.cn</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-mono">文件类型: {report.fileType.toUpperCase()}</span>
            <span>·</span>
            <span>大小: {report.fileSize || '3.2 MB'}</span>
            <span>·</span>
            <span>归档时间: {report.uploadDate}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            关闭预览
          </button>
        </div>
      </div>
    </div>
  );
};
