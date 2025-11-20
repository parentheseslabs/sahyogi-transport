'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { toast } from 'react-toastify';

interface VehicleType {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VehicleTypesPage() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicle-types`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch vehicle types');
      
      const data = await response.json();
      setVehicleTypes(data);
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      toast.error('Failed to fetch vehicle types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingVehicleType 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle-types/${editingVehicleType.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/vehicle-types`;
      
      const method = editingVehicleType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save vehicle type');

      await fetchVehicleTypes();
      setIsModalOpen(false);
      setEditingVehicleType(null);
      setFormData({ name: '', description: '' });
      toast.success(editingVehicleType ? 'Vehicle type updated successfully' : 'Vehicle type created successfully');
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      toast.error('Failed to save vehicle type');
    }
  };

  const handleEdit = (vehicleType: VehicleType) => {
    setEditingVehicleType(vehicleType);
    setFormData({
      name: vehicleType.name,
      description: vehicleType.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle type?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehicle-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete vehicle type');

      await fetchVehicleTypes();
      toast.success('Vehicle type deleted successfully');
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      toast.error('Failed to delete vehicle type');
    }
  };

  const openCreateModal = () => {
    setEditingVehicleType(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  if (loading) {
    return <div>Loading vehicle types...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicle Types</h1>
        <Button onClick={openCreateModal}>
          Add Vehicle Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-black text-xs">Loading...</td>
                    </tr>
                  ) : vehicleTypes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-black text-xs">No vehicle types found</td>
                    </tr>
                  ) : (
                    vehicleTypes.map((vehicleType) => (
                      <tr key={vehicleType.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                          {vehicleType.name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                          {vehicleType.description || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                          {new Date(vehicleType.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEdit(vehicleType)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(vehicleType.id)}
                              className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {editingVehicleType ? 'Edit Vehicle Type' : 'Create Vehicle Type'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name *
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter vehicle type name"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingVehicleType ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}