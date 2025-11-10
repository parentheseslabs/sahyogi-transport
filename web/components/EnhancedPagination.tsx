import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface EnhancedPaginationProps {
  pagination: Pagination;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function EnhancedPagination({
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange
}: EnhancedPaginationProps) {
  if (pagination.pages === 0) return null;

  return (
    <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <div className="text-black">
          {(pagination.page - 1) * pagination.limit + 1}-
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-gray-600">per page</span>
        </div>
      </div>
      <div className="flex gap-1 items-center">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrev}
          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft size={14} />
        </button>
        
        {/* Page Numbers */}
        <div className="flex gap-1">
          {(() => {
            const pages = [];
            const currentPage = pagination.page;
            const totalPages = pagination.pages;
            
            // Show first page
            if (totalPages > 0) {
              pages.push(
                <button
                  key={1}
                  onClick={() => onPageChange(1)}
                  className={`px-2 py-1 border rounded text-xs ${
                    currentPage === 1
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  1
                </button>
              );
            }
            
            // Show dots if there's a gap
            if (currentPage > 3) {
              pages.push(
                <span key="dots1" className="px-1 text-gray-500">...</span>
              );
            }
            
            // Show pages around current page
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
              if (i === 1 || i === totalPages) continue; // Skip first and last as they're handled separately
              pages.push(
                <button
                  key={i}
                  onClick={() => onPageChange(i)}
                  className={`px-2 py-1 border rounded text-xs ${
                    currentPage === i
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i}
                </button>
              );
            }
            
            // Show dots if there's a gap
            if (currentPage < totalPages - 2) {
              pages.push(
                <span key="dots2" className="px-1 text-gray-500">...</span>
              );
            }
            
            // Show last page
            if (totalPages > 1) {
              pages.push(
                <button
                  key={totalPages}
                  onClick={() => onPageChange(totalPages)}
                  className={`px-2 py-1 border rounded text-xs ${
                    currentPage === totalPages
                      ? 'bg-black text-white border-black'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              );
            }
            
            return pages;
          })()}
        </div>

        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNext}
          className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}