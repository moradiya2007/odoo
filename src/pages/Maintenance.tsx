import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Maintenance, Vehicle } from '../types';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MaintenancePage = () => {
  const { token, user } = useAuth();
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<Maintenance>>({});
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [maintRes, vehiclesRes] = await Promise.all([
        fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vehicles', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (maintRes.ok) setMaintenance(await maintRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const method = 'POST'; // Only create allowed for now based on requirements, or maybe edit? Assuming create for simplicity
    const url = '/api/maintenance';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(currentRecord),
      });
      
      if (res.ok) {
        fetchData();
        setIsModalOpen(false);
        setCurrentRecord({});
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save maintenance record');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Maintenance },
    { header: 'Vehicle', accessor: 'license_plate' as keyof Maintenance },
    { header: 'Issue', accessor: 'issue' as keyof Maintenance },
    { header: 'Cost', accessor: (row: Maintenance) => `$${row.cost}` },
    { header: 'Date', accessor: 'service_date' as keyof Maintenance },
    { 
      header: 'Status', 
      accessor: (row: Maintenance) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Completed' ? 'bg-green-500/10 text-green-400' :
          row.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
          'bg-yellow-500/10 text-yellow-400'
        }`}>
          {row.status}
        </span>
      )
    },
  ];

  const canEdit = user?.role === 'Fleet Manager';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Maintenance</h1>
        {canEdit && (
          <button
            onClick={() => { setCurrentRecord({}); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-[#4FD1C5] text-[#1E1E2F] px-4 py-2 rounded-xl font-bold hover:bg-[#38B2AC] transition-colors shadow-lg shadow-[#4FD1C5]/20"
          >
            <Plus size={20} />
            <span>Log Maintenance</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={maintenance}
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
                <h2 className="text-xl font-bold text-white">Log Maintenance</h2>
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
                  <label className="text-sm font-medium text-gray-300">Vehicle</label>
                  <select
                    required
                    value={currentRecord.vehicle_id || ''}
                    onChange={(e) => setCurrentRecord({ ...currentRecord, vehicle_id: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.license_plate} ({v.model})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Issue Description</label>
                  <textarea
                    required
                    value={currentRecord.issue || ''}
                    onChange={(e) => setCurrentRecord({ ...currentRecord, issue: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Cost ($)</label>
                    <input
                      type="number"
                      required
                      value={currentRecord.cost || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, cost: Number(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Service Date</label>
                    <input
                      type="date"
                      required
                      value={currentRecord.service_date || ''}
                      onChange={(e) => setCurrentRecord({ ...currentRecord, service_date: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <select
                    value={currentRecord.status || 'Pending'}
                    onChange={(e) => setCurrentRecord({ ...currentRecord, status: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
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
                    Save Record
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

export default MaintenancePage;
