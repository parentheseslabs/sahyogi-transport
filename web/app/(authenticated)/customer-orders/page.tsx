'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Eye, Package, ArrowUp, ArrowDown, ArrowUpDown, Calendar, X } from 'lucide-react';
import EnhancedPagination from '../../../components/EnhancedPagination';

interface CustomerOrder {
  id: number;
  enquiryId: number;
  quoteId: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined data
  enquiryFrom?: string;
  enquiryTo?: string;
  cargoType?: string;
  leadName?: string;
  quoteAmount?: number;
  quoteStatus?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, status, fromDate, toDate, sortBy, sortOrder, pageSize]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        ...(status && { status }),
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`http://localhost:3001/api/customer-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch customer orders');

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer order? This will revert the enquiry back to pending status.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete customer order');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting customer order:', error);
      alert('Failed to delete customer order');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchOrders();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPagination({ ...pagination, page: 1 });
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPagination({ ...pagination, page: 1, limit: newPageSize });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleStatusUpdate = async (id: number, newStatus: 'active' | 'completed' | 'cancelled') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Customer Orders</h1>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black" size={14} />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black focus:border-transparent"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={(e) => handleSearch(e as any)}
            className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1">
            <Calendar size={12} className="text-gray-500" />
            <span className="text-xs text-gray-600">Date Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
            placeholder="From Date"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
            placeholder="To Date"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              title="Clear date filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Order ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Enquiry ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Cargo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Quote Amount</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-black text-xs">Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-black text-xs">No customer orders found</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      CO{order.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      <button
                        onClick={() => router.push(`/enquiries/${order.enquiryId}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        E{order.enquiryId}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      {order.leadName || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {order.enquiryFrom && order.enquiryTo
                        ? `${order.enquiryFrom} → ${order.enquiryTo}`
                        : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {order.cargoType || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black font-medium">
                      {order.quoteAmount ? `₹${order.quoteAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value as 'active' | 'completed' | 'cancelled')}
                        className={`px-1.5 py-0.5 rounded text-xs border-0 capitalize ${getStatusColor(order.status)}`}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => router.push(`/customer-orders/${order.id}`)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => router.push(`/enquiries/${order.enquiryId}`)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="View Enquiry"
                        >
                          <Package size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Order"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <EnhancedPagination
          pagination={pagination}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}