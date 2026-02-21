/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Logs from './pages/Logs';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Dispatcher']} />}>
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/trips" element={<Trips />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Safety Officer']} />}>
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/logs" element={<Logs />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Fleet Manager']} />}>
              <Route path="/maintenance" element={<Maintenance />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Fleet Manager', 'Financial Analyst']} />}>
              <Route path="/expenses" element={<Expenses />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

