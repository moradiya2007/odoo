import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Vehicle } from '../types';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Vehicles = () => {
  const { token, user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle>>({});
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/vehicles?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVehicles();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [token, statusFilter, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const method = currentVehicle.id ? 'PUT' : 'POST';
    const url = currentVehicle.id ? `/api/vehicles/${currentVehicle.id}` : '/api/vehicles';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(currentVehicle),
      });
      
      if (res.ok) {
        fetchVehicles();
        setIsModalOpen(false);
        setCurrentVehicle({});
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save vehicle');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Vehicle },
    { header: 'Model', accessor: 'model' as keyof Vehicle },
    { header: 'License Plate', accessor: 'license_plate' as keyof Vehicle },
    { header: 'Capacity (kg)', accessor: 'capacity' as keyof Vehicle },
    { header: 'Odometer (km)', accessor: 'odometer' as keyof Vehicle },
    { 
      header: 'Status', 
      accessor: (row: Vehicle) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-500/10 text-green-400' :
          row.status === 'Maintenance' ? 'bg-orange-500/10 text-orange-400' :
          row.status === 'On Trip' ? 'bg-blue-500/10 text-blue-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Alerts',
      accessor: (row: Vehicle) => row.maintenance_alert ? (
        <span className="text-xs font-bold text-red-400 flex items-center gap-1">
          ⚠️ {row.maintenance_alert}
        </span>
      ) : null
    }
  ];

  const canEdit = user?.role === 'Fleet Manager';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Vehicles</h1>
        {canEdit && (
          <button
            onClick={() => { setCurrentVehicle({}); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-[#4FD1C5] text-[#1E1E2F] px-4 py-2 rounded-xl font-bold hover:bg-[#38B2AC] transition-colors shadow-lg shadow-[#4FD1C5]/20"
          >
            <Plus size={20} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#4FD1C5] outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Trip">On Trip</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
        <input
          type="text"
          placeholder="Search Model or Plate..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-[#4FD1C5] outline-none"
        />
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        onEdit={canEdit ? (vehicle) => { setCurrentVehicle(vehicle); setIsModalOpen(true); } : undefined}
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                  {currentVehicle.id ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Model</label>
                    <input
                      required
                      value={currentVehicle.model || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, model: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">License Plate</label>
                    <input
                      required
                      value={currentVehicle.license_plate || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, license_plate: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Capacity (kg)</label>
                    <input
                      type="number"
                      required
                      value={currentVehicle.capacity || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, capacity: Number(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Odometer (km)</label>
                    <input
                      type="number"
                      required
                      value={currentVehicle.odometer || ''}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, odometer: Number(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <select
                    value={currentVehicle.status || 'Active'}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, status: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-[#4FD1C5] text-[#1E1E2F] font-bold hover:bg-[#38B2AC] shadow-lg shadow-[#4FD1C5]/20 transition-colors"
                  >
                    Save Vehicle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Vehicles;
