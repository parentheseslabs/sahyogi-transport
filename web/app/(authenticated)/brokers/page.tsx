'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, ArrowUpDown, Calendar } from 'lucide-react';
import EnhancedPagination from '../../../components/EnhancedPagination';
import { toast } from 'react-toastify';

interface Broker {
  id: number;
  companyName: string;
  personName?: string;
  phone: string;
  alternatePhone?: string;
  city?: string;
  remarks?: string;
  referrer?: string;
  createdAt: string;
  updatedAt: string;
}

interface BrokerRegion {
  id: number;
  region?: string;
  state?: string;
  city?: string;
  brokerId: number;
}

interface BrokerVehicleType {
  id: number;
  vehicleType: string;
  brokerId: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
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
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentBroker, setCurrentBroker] = useState<Broker | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    personName: '',
    phone: '',
    alternatePhone: '',
    city: '',
    remarks: '',
    referrer: '',
  });
  const [brokerRegions, setBrokerRegions] = useState<BrokerRegion[]>([]);
  const [brokerVehicleTypes, setBrokerVehicleTypes] = useState<BrokerVehicleType[]>([]);
  const [newRegion, setNewRegion] = useState({ region: '', state: '', city: '' });
  const [newVehicleType, setNewVehicleType] = useState('');
  const [editingRegionIndex, setEditingRegionIndex] = useState<number | null>(null);
  const [editingVehicleTypeIndex, setEditingVehicleTypeIndex] = useState<number | null>(null);
  const [editingRegion, setEditingRegion] = useState({ region: '', state: '', city: '' });
  const [editingVehicleTypeValue, setEditingVehicleTypeValue] = useState('');

  useEffect(() => {
    fetchBrokers();
  }, [pagination.page, fromDate, toDate, sortBy, sortOrder, pageSize]);

  const fetchBrokers = async () => {
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

      const response = await fetch(`http://localhost:3001/api/brokers?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch brokers');

      const data = await response.json();
      setBrokers(data.brokers);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchBrokers();
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
    setCurrentBroker(null);
    setFormData({
      companyName: '',
      personName: '',
      phone: '',
      alternatePhone: '',
      city: '',
      remarks: '',
      referrer: '',
    });
    setBrokerRegions([]);
    setBrokerVehicleTypes([]);
    setNewRegion({ region: '', state: '', city: '' });
    setNewVehicleType('');
    setEditingRegionIndex(null);
    setEditingVehicleTypeIndex(null);
    setEditingRegion({ region: '', state: '', city: '' });
    setEditingVehicleTypeValue('');
    setShowModal(true);
  };

  const handleEdit = async (broker: Broker) => {
    setIsEdit(true);
    setCurrentBroker(broker);
    setFormData({
      companyName: broker.companyName,
      personName: broker.personName || '',
      phone: broker.phone,
      alternatePhone: broker.alternatePhone || '',
      city: broker.city || '',
      remarks: broker.remarks || '',
      referrer: broker.referrer || '',
    });
    
    // Fetch broker regions and vehicle types from API
    try {
      const token = localStorage.getItem('token');
      
      // Fetch regions
      const regionsResponse = await fetch(`http://localhost:3001/api/brokers/${broker.id}/regions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Fetch vehicle types
      const vehicleTypesResponse = await fetch(`http://localhost:3001/api/brokers/${broker.id}/vehicle-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (regionsResponse.ok) {
        const regionsData = await regionsResponse.json();
        setBrokerRegions(regionsData.regions || []);
      } else {
        setBrokerRegions([]);
      }
      
      if (vehicleTypesResponse.ok) {
        const vehicleTypesData = await vehicleTypesResponse.json();
        setBrokerVehicleTypes(vehicleTypesData.vehicleTypes || []);
      } else {
        setBrokerVehicleTypes([]);
      }
    } catch (error) {
      console.error('Error fetching broker details:', error);
      setBrokerRegions([]);
      setBrokerVehicleTypes([]);
    }
    
    setNewRegion({ region: '', state: '', city: '' });
    setNewVehicleType('');
    setEditingRegionIndex(null);
    setEditingVehicleTypeIndex(null);
    setEditingRegion({ region: '', state: '', city: '' });
    setEditingVehicleTypeValue('');
    setShowModal(true);
  };

  const addRegion = () => {
    if (newRegion.region.trim() || newRegion.state.trim() || newRegion.city.trim()) {
      const newRegionEntry: BrokerRegion = {
        id: Date.now(), // Temporary ID for new entries
        region: newRegion.region.trim() || undefined,
        state: newRegion.state.trim() || undefined,
        city: newRegion.city.trim() || undefined,
        brokerId: currentBroker?.id || 0,
      };
      setBrokerRegions([...brokerRegions, newRegionEntry]);
      setNewRegion({ region: '', state: '', city: '' });
    }
  };

  const removeRegion = (index: number) => {
    const newRegions = brokerRegions.filter((_, i) => i !== index);
    setBrokerRegions(newRegions);
  };

  const addVehicleType = () => {
    if (newVehicleType.trim()) {
      const newVehicleTypeEntry: BrokerVehicleType = {
        id: Date.now(), // Temporary ID for new entries
        vehicleType: newVehicleType.trim(),
        brokerId: currentBroker?.id || 0,
      };
      setBrokerVehicleTypes([...brokerVehicleTypes, newVehicleTypeEntry]);
      setNewVehicleType('');
    }
  };

  const removeVehicleType = (index: number) => {
    const newVehicleTypes = brokerVehicleTypes.filter((_, i) => i !== index);
    setBrokerVehicleTypes(newVehicleTypes);
  };

  const startEditingRegion = (index: number, currentRegion: BrokerRegion) => {
    setEditingRegionIndex(index);
    setEditingRegion({
      region: currentRegion.region || '',
      state: currentRegion.state || '',
      city: currentRegion.city || '',
    });
  };

  const saveRegionEdit = () => {
    if (editingRegionIndex !== null && (editingRegion.region.trim() || editingRegion.state.trim() || editingRegion.city.trim())) {
      const newRegions = [...brokerRegions];
      newRegions[editingRegionIndex] = {
        ...newRegions[editingRegionIndex],
        region: editingRegion.region.trim() || undefined,
        state: editingRegion.state.trim() || undefined,
        city: editingRegion.city.trim() || undefined,
      };
      setBrokerRegions(newRegions);
    }
    setEditingRegionIndex(null);
    setEditingRegion({ region: '', state: '', city: '' });
  };

  const cancelRegionEdit = () => {
    setEditingRegionIndex(null);
    setEditingRegion({ region: '', state: '', city: '' });
  };

  const startEditingVehicleType = (index: number, currentValue: string) => {
    setEditingVehicleTypeIndex(index);
    setEditingVehicleTypeValue(currentValue);
  };

  const saveVehicleTypeEdit = () => {
    if (editingVehicleTypeIndex !== null && editingVehicleTypeValue.trim()) {
      const newVehicleTypes = [...brokerVehicleTypes];
      newVehicleTypes[editingVehicleTypeIndex] = {
        ...newVehicleTypes[editingVehicleTypeIndex],
        vehicleType: editingVehicleTypeValue.trim(),
      };
      setBrokerVehicleTypes(newVehicleTypes);
    }
    setEditingVehicleTypeIndex(null);
    setEditingVehicleTypeValue('');
  };

  const cancelVehicleTypeEdit = () => {
    setEditingVehicleTypeIndex(null);
    setEditingVehicleTypeValue('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this broker?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/brokers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle restrict deletion (400) and other errors gracefully
        toast.error(errorData.message || 'Failed to delete broker');
        return; // Exit early without throwing
      }

      fetchBrokers();
      toast.success('Broker deleted successfully');
    } catch (error) {
      console.error('Error deleting broker:', error);
      toast.error('Failed to delete broker');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = isEdit
        ? `http://localhost:3001/api/brokers/${currentBroker?.id}`
        : 'http://localhost:3001/api/brokers';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          regions: brokerRegions,
          vehicleTypes: brokerVehicleTypes,
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'create'} broker`);

      setShowModal(false);
      fetchBrokers();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} broker:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} broker`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Transport Brokers</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
        >
          <Plus size={14} />
          Add Broker
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black" size={14} />
            <input
              type="text"
              placeholder="Search by ID, company, person, or city..."
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
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center gap-1">
                    Company Name
                    {getSortIcon('companyName')}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('personName')}
                >
                  <div className="flex items-center gap-1">
                    Contact Person
                    {getSortIcon('personName')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Phone</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center gap-1">
                    City
                    {getSortIcon('city')}
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
              ) : brokers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-black text-xs">No brokers found</td>
                </tr>
              ) : (
                brokers.map((broker) => (
                  <tr key={broker.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      B{broker.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      {broker.companyName}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {broker.personName || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">{broker.phone}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {broker.city || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {broker.referrer || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(broker.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(broker)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(broker.id)}
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
          <div className="bg-white rounded max-w-2xl w-full p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">{isEdit ? 'Edit Broker' : 'New Broker'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Company Name*</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Referrer</label>
                  <input
                    type="text"
                    value={formData.referrer}
                    onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-2">Operating Regions</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    value={newRegion.region}
                    onChange={(e) => setNewRegion({ ...newRegion, region: e.target.value })}
                    placeholder="Region (optional)"
                    className="px-2 py-1.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="text"
                    value={newRegion.state}
                    onChange={(e) => setNewRegion({ ...newRegion, state: e.target.value })}
                    placeholder="State"
                    className="px-2 py-1.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                  <input
                    type="text"
                    value={newRegion.city}
                    onChange={(e) => setNewRegion({ ...newRegion, city: e.target.value })}
                    placeholder="City"
                    className="px-2 py-1.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                    onKeyPress={(e) => e.key === 'Enter' && addRegion()}
                  />
                </div>
                <button
                  type="button"
                  onClick={addRegion}
                  className="mb-2 px-3 py-1.5 bg-black text-white rounded text-xs hover:bg-black/80"
                >
                  Add Region
                </button>
                <div className="space-y-1">
                  {brokerRegions.map((regionData, index) => (
                    <div key={index} className="flex items-center justify-between bg-white border border-black rounded px-2 py-1">
                      {editingRegionIndex === index ? (
                        <div className="flex-1 space-y-1">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editingRegion.region}
                              onChange={(e) => setEditingRegion({ ...editingRegion, region: e.target.value })}
                              placeholder="Region"
                              className="px-1 py-0.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                            />
                            <input
                              type="text"
                              value={editingRegion.state}
                              onChange={(e) => setEditingRegion({ ...editingRegion, state: e.target.value })}
                              placeholder="State"
                              className="px-1 py-0.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                            />
                            <input
                              type="text"
                              value={editingRegion.city}
                              onChange={(e) => setEditingRegion({ ...editingRegion, city: e.target.value })}
                              placeholder="City"
                              className="px-1 py-0.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') saveRegionEdit();
                                if (e.key === 'Escape') cancelRegionEdit();
                              }}
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={saveRegionEdit}
                              className="text-green-600 hover:text-green-700 text-xs"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRegionEdit}
                              className="text-gray-500 hover:text-gray-700 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span 
                            className="text-xs text-black cursor-pointer hover:bg-gray-50 flex-1 py-0.5"
                            onClick={() => startEditingRegion(index, regionData)}
                            title="Click to edit"
                          >
                            {[regionData.region, regionData.state, regionData.city].filter(Boolean).join(', ') || 'Empty region'}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEditingRegion(index, regionData)}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRegion(index)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {brokerRegions.length === 0 && (
                    <div className="text-xs text-black bg-white border border-black rounded px-2 py-2 text-center">
                      No regions added yet
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-2">Vehicle Types</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value)}
                    placeholder="Enter vehicle type"
                    className="flex-1 px-2 py-1.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                    onKeyPress={(e) => e.key === 'Enter' && addVehicleType()}
                  />
                  <button
                    type="button"
                    onClick={addVehicleType}
                    className="px-3 py-1.5 bg-black text-white rounded text-xs hover:bg-black/80"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1">
                  {brokerVehicleTypes.map((vehicleTypeData, index) => (
                    <div key={index} className="flex items-center justify-between bg-white border border-black rounded px-2 py-1">
                      {editingVehicleTypeIndex === index ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editingVehicleTypeValue}
                            onChange={(e) => setEditingVehicleTypeValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') saveVehicleTypeEdit();
                              if (e.key === 'Escape') cancelVehicleTypeEdit();
                            }}
                            className="flex-1 px-1 py-0.5 border border-black rounded text-xs text-black focus:ring-1 focus:ring-black"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveVehicleTypeEdit}
                            className="text-green-600 hover:text-green-700 text-xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelVehicleTypeEdit}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span 
                            className="text-xs text-black cursor-pointer hover:bg-gray-50 flex-1 py-0.5"
                            onClick={() => startEditingVehicleType(index, vehicleTypeData.vehicleType)}
                            title="Click to edit"
                          >
                            {vehicleTypeData.vehicleType}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEditingVehicleType(index, vehicleTypeData.vehicleType)}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeVehicleType(index)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {brokerVehicleTypes.length === 0 && (
                    <div className="text-xs text-black bg-white border border-black rounded px-2 py-2 text-center">
                      No vehicle types added yet
                    </div>
                  )}
                </div>
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
