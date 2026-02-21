import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardStats } from '../types';
import { motion } from 'motion/react';
import { Truck, Map, Wrench, DollarSign, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => {
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-500/10 text-blue-400',
    'green': 'bg-green-500/10 text-green-400',
    'orange': 'bg-orange-500/10 text-orange-400',
    'emerald': 'bg-emerald-500/10 text-emerald-400',
    'purple': 'bg-purple-500/10 text-purple-400',
    'red': 'bg-red-500/10 text-red-400',
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color] || 'bg-gray-500/10 text-gray-400'}`}>
          <Icon size={24} />
        </div>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };
    fetchStats();
  }, [token]);

  if (!stats) return <div className="text-white">Loading...</div>;

  const data = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.activeVehicles !== undefined && (
          <StatCard title="Active Vehicles" value={stats.activeVehicles} icon={Truck} color="blue" />
        )}
        {stats.activeTrips !== undefined && (
          <StatCard title="Active Trips" value={stats.activeTrips} icon={Map} color="green" />
        )}
        {stats.pendingMaintenance !== undefined && (
          <StatCard title="Maintenance Alerts" value={stats.pendingMaintenance} icon={Wrench} color="orange" />
        )}
        {stats.totalRevenue !== undefined && (
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="emerald" />
        )}
        {stats.activeDrivers !== undefined && (
          <StatCard title="Active Drivers" value={stats.activeDrivers} icon={Users} color="purple" />
        )}
        {stats.safetyIncidents !== undefined && (
          <StatCard title="Safety Incidents" value={stats.safetyIncidents} icon={AlertTriangle} color="red" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">Monthly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                  itemStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="value" fill="#4FD1C5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Vehicle #10{i} dispatched</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-400">Completed</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
