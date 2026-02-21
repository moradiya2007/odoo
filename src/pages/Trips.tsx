import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Trip, Vehicle, Driver } from '../types';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Trips = () => {
  const { token, user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Partial<Trip>>({});
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        fetch(`/api/trips?${queryParams.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vehicles?status=Active', { headers: { Authorization: `Bearer ${token}` } }), // Only fetch active for dropdown
        fetch('/api/drivers?status=Active', { headers: { Authorization: `Bearer ${token}` } }), // Only fetch active for dropdown
      ]);

      if (tripsRes.ok) setTrips(await tripsRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [token, statusFilter, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const method = currentTrip.id ? 'PUT' : 'POST';
    const url = currentTrip.id ? `/api/trips/${currentTrip.id}` : '/api/trips';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(currentTrip),
      });
      
      if (res.ok) {
        fetchData();
        setIsModalOpen(false);
        setCurrentTrip({});
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save trip');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Trip },
    { header: 'Origin', accessor: 'origin' as keyof Trip },
    { header: 'Destination', accessor: 'destination' as keyof Trip },
    { header: 'Vehicle', accessor: 'license_plate' as keyof Trip },
    { header: 'Driver', accessor: 'driver_name' as keyof Trip },
    { 
      header: 'Status', 
      accessor: (row: Trip) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.trip_status === 'Completed' ? 'bg-green-500/10 text-green-400' :
          row.trip_status === 'In Transit' ? 'bg-blue-500/10 text-blue-400' :
          row.trip_status === 'Scheduled' ? 'bg-yellow-500/10 text-yellow-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {row.trip_status}
        </span>
      )
    },
  ];

  const canEdit = user?.role === 'Fleet Manager' || user?.role === 'Dispatcher';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Trips</h1>
        {canEdit && (
          <button
            onClick={() => { setCurrentTrip({}); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-[#4FD1C5] text-[#1E1E2F] px-4 py-2 rounded-xl font-bold hover:bg-[#38B2AC] transition-colors shadow-lg shadow-[#4FD1C5]/20"
          >
            <Plus size={20} />
            <span>New Trip</span>
          </button>
        )}
      </div>

      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#4FD1C5] outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Transit">In Transit</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input
          type="text"
          placeholder="Search Origin, Dest, Driver..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2 w-64 focus:ring-2 focus:ring-[#4FD1C5] outline-none"
        />
      </div>

      <DataTable
        columns={columns}
        data={trips}
        onEdit={canEdit ? (trip) => { setCurrentTrip(trip); setIsModalOpen(true); } : undefined}
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
                  {currentTrip.id ? 'Edit Trip' : 'Schedule New Trip'}
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
                    <label className="text-sm font-medium text-gray-300">Origin</label>
                    <input
                      required
                      value={currentTrip.origin || ''}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, origin: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Destination</label>
                    <input
                      required
                      value={currentTrip.destination || ''}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, destination: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                {!currentTrip.id && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Vehicle</label>
                      <select
                        required
                        value={currentTrip.vehicle_id || ''}
                        onChange={(e) => setCurrentTrip({ ...currentTrip, vehicle_id: Number(e.target.value) })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                      >
                        <option value="">Select Vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.license_plate} ({v.model}) - {v.capacity}kg</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Driver</label>
                      <select
                        required
                        value={currentTrip.driver_id || ''}
                        onChange={(e) => setCurrentTrip({ ...currentTrip, driver_id: Number(e.target.value) })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                      >
                        <option value="">Select Driver</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Cargo Weight (kg)</label>
                    <input
                      type="number"
                      required
                      value={currentTrip.cargo_weight || ''}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, cargo_weight: Number(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Fuel Estimate (L)</label>
                    <input
                      type="number"
                      required
                      value={currentTrip.fuel_estimate || ''}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, fuel_estimate: Number(e.target.value) })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={currentTrip.start_time || ''}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, start_time: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">End Time (Est)</label>
                    <input
                      type="datetime-local"
                      value={currentTrip.end_time || ''}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, end_time: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    />
                  </div>
                </div>

                {currentTrip.id && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Status</label>
                    <select
                      value={currentTrip.trip_status || 'Scheduled'}
                      onChange={(e) => setCurrentTrip({ ...currentTrip, trip_status: e.target.value as any })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-[#4FD1C5] outline-none"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

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
                    Save Trip
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

export default Trips;
