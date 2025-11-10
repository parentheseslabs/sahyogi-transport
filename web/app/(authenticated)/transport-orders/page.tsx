'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Eye, MapPin, Building2, DollarSign, Calendar, FileText, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';
import EnhancedPagination from '../../../components/EnhancedPagination';
import { useRouter } from 'next/navigation';

interface TransportOrder {
  id: number;
  enquiryId: number;
  brokerId: number;
  routeId: number;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderWithDetails {
  order: TransportOrder;
  enquiry: {
    id: number;
    from: string;
    to: string;
    cargoType: string;
    cargoWeight?: number;
  } | null;
  lead: {
    id: number;
    name: string;
  } | null;
  broker: {
    id: number;
    companyName: string;
    personName: string;
    city: string;
  } | null;
  route: {
    id: number;
    name: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TransportOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, fromDate, toDate, sortBy, sortOrder, pageSize]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`http://localhost:3001/api/transport-orders?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data.orders || []);
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-orders/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete order');

      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
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

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Transport Orders</h1>
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
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Lead</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Broker</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {getSortIcon('amount')}
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
                  <td colSpan={8} className="px-3 py-6 text-center text-black text-xs">Loading...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-black text-xs">No orders found</td>
                </tr>
              ) : (
                orders.map((orderWithDetails) => (
                  <tr key={orderWithDetails.order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      TO{orderWithDetails.order.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      <button
                        onClick={() => router.push(`/enquiries/${orderWithDetails.order.enquiryId}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        CE{orderWithDetails.order.enquiryId}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {orderWithDetails.lead?.name || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      <div className="flex items-center gap-1">
                        <Building2 size={12} />
                        <span>{orderWithDetails.broker?.companyName || 'Unknown Broker'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{orderWithDetails.route?.name || 'Unknown Route'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      <div className="flex items-center gap-1">
                        <span>₹{orderWithDetails.order.amount}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(orderWithDetails.order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleDelete(orderWithDetails.order.id)}
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