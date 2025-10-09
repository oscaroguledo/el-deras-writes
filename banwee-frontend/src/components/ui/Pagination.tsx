import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showPageNumbers?: boolean;
}
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showPageNumbers = true
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      // Calculate start and end of page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      // Add page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }
      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };
  return <div className={cn('flex justify-center mt-6', className)}>
      <div className="flex items-center">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md border border-gray-300 mr-2 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Previous page">
          <ChevronLeftIcon size={16} />
        </button>
        {showPageNumbers && getPageNumbers().map((page, index) => page < 0 ? <span key={`ellipsis-${index}`} className="px-2">
                ...
              </span> : <button key={page} onClick={() => onPageChange(page)} className={cn('w-8 h-8 mx-1 flex items-center justify-center rounded-md', currentPage === page ? 'bg-primary text-white' : 'border border-gray-300 hover:bg-gray-50')}>
                {page}
              </button>)}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md border border-gray-300 ml-2 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Next page">
          <ChevronRightIcon size={16} />
        </button>
      </div>
    </div>;
};