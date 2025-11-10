'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, ArrowUpDown, Calendar } from 'lucide-react';
import EnhancedPagination from '../../../components/EnhancedPagination';

interface Lead {
  id: number;
  name: string;
  phone: string;
  alternatePhone?: string;
  source: string;
  referrer?: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
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
  const [source, setSource] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    source: 'unknown',
    referrer: '',
  });

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, source, fromDate, toDate, sortBy, sortOrder, pageSize]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(source && { source }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`http://localhost:3001/api/leads?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch leads');

      const data = await response.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchLeads();
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

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentLead(null);
    setFormData({ name: '', phone: '', alternatePhone: '', source: 'unknown', referrer: '' });
    setShowModal(true);
  };

  const handleEdit = (lead: Lead) => {
    setIsEdit(true);
    setCurrentLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      alternatePhone: lead.alternatePhone || '',
      source: lead.source,
      referrer: lead.referrer || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete lead');

      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = isEdit
        ? `http://localhost:3001/api/leads/${currentLead?.id}`
        : 'http://localhost:3001/api/leads';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'create'} lead`);

      setShowModal(false);
      fetchLeads();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} lead:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} lead`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Customers</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
        >
          <Plus size={14} />
          Add Customer
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black" size={14} />
            <input
              type="text"
              placeholder="Search by ID, name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black focus:border-transparent"
            />
          </div>

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
          >
            <option value="">All Sources</option>
            <option value="unknown">Unknown</option>
            <option value="referral">Referral</option>
            <option value="india_mart">IndiaMart</option>
            <option value="just_dial">JustDial</option>
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
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Phone</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Alternate Phone</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('source')}
                >
                  <div className="flex items-center gap-1">
                    Source
                    {getSortIcon('source')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Referrer</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created At
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-black text-xs">Loading...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-black text-xs">No leads found</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      B{lead.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      {lead.name}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">{lead.phone}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {lead.alternatePhone || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs capitalize">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {lead.referrer || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(lead)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">{isEdit ? 'Edit Lead' : 'New Lead'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Name*</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Phone*</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="unknown">Unknown</option>
                  <option value="referral">Referral</option>
                  <option value="india_mart">IndiaMart</option>
                  <option value="just_dial">JustDial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Referrer</label>
                <input
                  type="text"
                  value={formData.referrer}
                  onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                  placeholder="Who referred this lead?"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-black text-white rounded text-xs hover:bg-gray-800"
                >
                  {isEdit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
