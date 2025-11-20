import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"

interface TableColumn<T> {
  key: keyof T | string
  header: string
  accessor?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  data?: T[]
  columns: TableColumn<T>[]
  pageSize?: number
  className?: string
  emptyMessage?: string
  showPagination?: boolean
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  className = "",
  emptyMessage = "No data available",
  showPagination = true,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1)
  
  // Safely handle undefined or null data
  const safeData = data || []
  
  const totalPages = Math.ceil(safeData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = showPagination ? safeData.slice(startIndex, endIndex) : safeData
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const getCellValue = (row: T, column: TableColumn<T>) => {
    if (column.accessor) {
      return column.accessor(row)
    }
    return row[column.key as keyof T]
  }
  
  return (
    <div className={className}>
      <div className="w-full overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b">
            <tr className="border-b transition-colors hover:bg-gray-50">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`h-10 px-4 text-left align-middle font-medium text-black ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-black"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b transition-colors hover:bg-gray-50"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`p-4 align-middle ${column.className || ''}`}
                    >
                      {getCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-black">
            Showing {startIndex + 1} to {Math.min(endIndex, safeData.length)} of{" "}
            {safeData.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  )
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="px-1 text-black">
                      ...
                    </span>
                  )
                }
                return null
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { Table, type TableColumn, type TableProps }