import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Log } from '../types';

const Logs = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, [token]);

  const columns = [
    { header: 'Time', accessor: (row: Log) => new Date(row.timestamp).toLocaleString() },
    { header: 'Level', accessor: (row: Log) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        row.level === 'ERROR' ? 'bg-red-500/10 text-red-400' :
        row.level === 'WARN' ? 'bg-yellow-500/10 text-yellow-400' :
        'bg-blue-500/10 text-blue-400'
      }`}>
        {row.level}
      </span>
    )},
    { header: 'User', accessor: (row: Log) => row.user_name || 'System' },
    { header: 'Role', accessor: 'role' as keyof Log },
    { header: 'Module', accessor: 'module' as keyof Log },
    { header: 'Action', accessor: 'action' as keyof Log },
    { header: 'Description', accessor: 'description' as keyof Log },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">System Logs</h1>
      <DataTable
        columns={columns}
        data={logs}
      />
    </div>
  );
};

export default Logs;
