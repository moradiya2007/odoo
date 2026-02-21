export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';
}

export interface Vehicle {
  id: number;
  model: string;
  license_plate: string;
  capacity: number;
  odometer: number;
  status: 'Active' | 'Maintenance' | 'Retired' | 'On Trip';
  created_at: string;
  maintenance_alert?: string | null;
}

export interface Driver {
  id: number;
  name: string;
  license_number: string;
  license_expiry: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Suspended' | 'On Duty';
  created_at: string;
}

export interface Trip {
  id: number;
  vehicle_id: number;
  driver_id: number;
  cargo_weight: number;
  origin: string;
  destination: string;
  fuel_estimate: number;
  trip_status: 'Scheduled' | 'In Transit' | 'Completed' | 'Cancelled';
  start_time: string;
  end_time: string;
  created_at: string;
  license_plate?: string;
  driver_name?: string;
}

export interface Maintenance {
  id: number;
  vehicle_id: number;
  issue: string;
  cost: number;
  service_date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  created_at: string;
  license_plate?: string;
  model?: string;
}

export interface Expense {
  id: number;
  trip_id: number;
  fuel_cost: number;
  misc_cost: number;
  total_cost: number;
  created_at: string;
  origin?: string;
  destination?: string;
  license_plate?: string;
}

export interface Log {
  id: number;
  user_id: number;
  role: string;
  module: string;
  action: string;
  description: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  timestamp: string;
  user_name?: string;
}

export interface DashboardStats {
  activeVehicles?: number;
  activeTrips?: number;
  pendingMaintenance?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  roi?: number;
  activeDrivers?: number;
  safetyIncidents?: number;
}
