import React, { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const [jumpPageInput, setJumpPageInput] = useState(currentPage.toString());

  const startEntry = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalCount);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpPageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      setJumpPageInput(currentPage.toString());
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="px-4 py-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 shrink-0 text-sm text-slate-600">
      {/* Left: Summary & Page Size Selection */}
      <div className="flex items-center gap-3">
        <span className="font-medium text-slate-700">
          显示 <strong className="text-slate-900 font-bold">{startEntry}</strong> - <strong className="text-slate-900 font-bold">{endEntry}</strong> / 共 <strong className="text-slate-900 font-bold">{totalCount}</strong> 条
        </span>
        <div className="flex items-center gap-1.5 ml-1">
          <span className="text-slate-500 text-sm font-medium">每页:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
          >
            <option value={10}>10 条/页</option>
            <option value={20}>20 条/页</option>
            <option value={50}>50 条/页</option>
            <option value={100}>100 条/页</option>
          </select>
        </div>
      </div>

      {/* Right: Page Buttons & Jump Form */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              onPageChange(currentPage - 1);
              setJumpPageInput((currentPage - 1).toString());
            }}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          >
            上一页
          </button>

          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 text-sm font-medium">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                onClick={() => {
                  onPageChange(p as number);
                  setJumpPageInput((p as number).toString());
                }}
                className={`min-w-[32px] h-8 px-2.5 border rounded-md text-sm font-bold transition cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              onPageChange(currentPage + 1);
              setJumpPageInput((currentPage + 1).toString());
            }}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
          >
            下一页
          </button>
        </div>

        <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-slate-600 text-sm font-medium">
          <span>跳至</span>
          <input
            type="text"
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            className="w-11 px-1.5 py-1 text-center border border-slate-300 rounded-md bg-white text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs font-mono"
          />
          <span>页</span>
        </form>
      </div>
    </div>
  );
};
