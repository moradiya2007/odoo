import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Driver } from '../types';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Drivers = () => {
  const { token, user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Partial<Driver>>({});
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDrivers = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/drivers?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDrivers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [token, statusFilter, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const method = currentDriver.id ? 'PUT' : 'POST';
    const url = currentDriver.id ? `/api/drivers/${currentDriver.id}` : '/api/drivers';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(currentDriver),
      });
      
      if (res.ok) {
        fetchDrivers();
        setIsModalOpen(false);
        setCurrentDriver({});
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save driver');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Driver },
    { header: 'Name', accessor: 'name' as keyof Driver },
    { header: 'License Number', accessor: 'license_number' as keyof Driver },
    { header: 'Expiry', accessor: 'license_expiry' as keyof Driver },
    { header: 'Phone', accessor: 'phone' as keyof Driver },
    { 
      header: 'Status', 
      accessor: (row: Driver) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-500/10 text-green-400' :
          row.status === 'On Leave' ? 'bg-yellow-500/10 text-yellow-400' :
          row.status === 'On Duty' ? 'bg-blue-500/10 text-blue-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {row.status}
        </span>
      )
    },
  ];

  const canEdit = user?.role === 'Fleet Manager' || user?.role === 'Safety Officer';
  const canCreate = user?.role === 'Fleet Manager';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Drivers</h1>
        {canCreate && (
          <button
            onClick={() => { setCurrentDriver({}); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-[#4FD1C5] text-[#1E1E2F] px-4 py-2 rounded-xl font-bold hover:bg-[#38B2AC] transition-colors shadow-lg shadow-[#4FD1C5]/20"
          >
            <Plus size={20} />
            <span>Add Driver</span>
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
          <option value="On Duty">On Duty</option>
          <option value="On Leave">On Leave</option>
          <option value="Suspended">Suspended</option>
        </select>
        <input
          type="text"
          placeholder="Search Name or License..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-[#4FD1C5] outline-none"
        />
      </div>

      <DataTable
        columns={columns}
        data={drivers}
        onEdit={canEdit ? (driver) => { setCurrentDriver(driver); setIsModalOpen(true); } : undefined}
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
                  {currentDriver.id ? 'Edit Driver' : 'Add New Driver'}
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Name</label>
                  <input
                    required
                    value={currentDriver.name || ''}
                    onChange={(e) => setCurrentDriver({ ...currentDriver, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">License Number</label>
                    <input
                      required
                      value={currentDriver.license_number || ''}
                      onChange={(e) => setCurrentDriver({ ...currentDriver, license_number: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={currentDriver.license_expiry || ''}
                      onChange={(e) => setCurrentDriver({ ...currentDriver, license_expiry: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Phone</label>
                    <input
                      required
                      value={currentDriver.phone || ''}
                      onChange={(e) => setCurrentDriver({ ...currentDriver, phone: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <select
                      value={currentDriver.status || 'Active'}
                      onChange={(e) => setCurrentDriver({ ...currentDriver, status: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
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
                    Save Driver
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

export default Drivers;
