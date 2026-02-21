import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import { Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';

const Expenses = () => {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        // Map CSV fields to expected API format
        // Expected CSV: LicensePlate,Amount,Type,Date
        const transactions = results.data.map((row: any) => ({
          license_plate: row.LicensePlate,
          amount: parseFloat(row.Amount),
          type: row.Type,
          date: row.Date
        })).filter((t: any) => t.license_plate && !isNaN(t.amount));

        try {
          const res = await fetch('/api/expenses/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ transactions })
          });
          
          const data = await res.json();
          if (res.ok) {
            setImportStatus(`Successfully imported ${data.count} transactions.`);
            fetchExpenses();
            setTimeout(() => {
              setIsImportOpen(false);
              setImportStatus('');
            }, 2000);
          } else {
            setImportStatus(`Error: ${data.message}`);
          }
        } catch (err) {
          setImportStatus('Failed to upload data.');
        }
      }
    });
  };

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Expense },
    { header: 'Trip ID', accessor: 'trip_id' as keyof Expense },
    { header: 'Vehicle', accessor: 'license_plate' as keyof Expense },
    { header: 'Route', accessor: (row: Expense) => `${row.origin} → ${row.destination}` },
    { header: 'Fuel Cost', accessor: (row: Expense) => `$${row.fuel_cost.toFixed(2)}` },
    { header: 'Misc Cost', accessor: (row: Expense) => `$${row.misc_cost.toFixed(2)}` },
    { header: 'Total', accessor: (row: Expense) => `$${row.total_cost.toFixed(2)}`, className: 'font-bold text-[#4FD1C5]' },
  ];

  // Prepare chart data (last 5 expenses for simplicity)
  const chartData = expenses.slice(0, 10).map(e => ({
    name: `Trip ${e.trip_id}`,
    fuel: e.fuel_cost,
    misc: e.misc_cost
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Expenses & Financials</h1>
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center space-x-2 bg-[#4FD1C5] text-[#1E1E2F] px-4 py-2 rounded-xl font-bold hover:bg-[#38B2AC] transition-colors shadow-lg shadow-[#4FD1C5]/20"
        >
          <Upload size={20} />
          <span>Import Fuel Card Data</span>
        </button>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg h-80">
        <h3 className="text-lg font-bold text-white mb-4">Cost Breakdown (Recent Trips)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
              itemStyle={{ color: '#F3F4F6' }}
            />
            <Bar dataKey="fuel" stackId="a" fill="#4FD1C5" name="Fuel Cost" />
            <Bar dataKey="misc" stackId="a" fill="#F6AD55" name="Misc Cost" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable
        columns={columns}
        data={expenses}
      />

      <AnimatePresence>
        {isImportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Import Fuel Data</h2>
                <button onClick={() => setIsImportOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-gray-400 text-sm">
                  Upload a CSV file with columns: <code>LicensePlate, Amount, Type, Date</code>
                </p>
                
                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-[#4FD1C5] transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-gray-500 mb-2" size={32} />
                  <p className="text-gray-400 font-medium">Click to upload CSV</p>
                </div>

                {importStatus && (
                  <div className={`p-3 rounded-lg text-sm ${importStatus.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {importStatus}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
