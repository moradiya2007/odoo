import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fleetflow-secret-key-change-me';

app.use(cors());
app.use(express.json());

// Database Setup
const db = new Database('fleetflow.db');
db.pragma('journal_mode = WAL');

// Initialize Tables
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL, -- 'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model TEXT NOT NULL,
      license_plate TEXT UNIQUE NOT NULL,
      capacity INTEGER NOT NULL, -- in kg
      odometer INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active', -- 'Active', 'Maintenance', 'Retired'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      license_expiry DATE NOT NULL,
      phone TEXT,
      status TEXT DEFAULT 'Active', -- 'Active', 'On Leave', 'Suspended'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER,
      driver_id INTEGER,
      cargo_weight INTEGER,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      fuel_estimate INTEGER, -- in liters
      trip_status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'In Transit', 'Completed', 'Cancelled'
      start_time DATETIME,
      end_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY(driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      issue TEXT NOT NULL,
      cost REAL,
      service_date DATE NOT NULL,
      status TEXT DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      fuel_cost REAL DEFAULT 0,
      misc_cost REAL DEFAULT 0,
      total_cost REAL GENERATED ALWAYS AS (fuel_cost + misc_cost) VIRTUAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(trip_id) REFERENCES trips(id)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role TEXT,
      module TEXT,
      action TEXT,
      description TEXT,
      level TEXT DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR'
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Seed Initial Users if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const password = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    
    insertUser.run('Admin User', 'admin@fleetflow.com', password, 'Fleet Manager');
    insertUser.run('Dispatch User', 'dispatch@fleetflow.com', password, 'Dispatcher');
    insertUser.run('Safety User', 'safety@fleetflow.com', password, 'Safety Officer');
    insertUser.run('Finance User', 'finance@fleetflow.com', password, 'Financial Analyst');
    
    console.log('Database seeded with initial users.');
  }
};

initDb();

// Logger Helper
const logAction = (userId: number | null, role: string | null, module: string, action: string, description: string, level: string = 'INFO') => {
  try {
    const stmt = db.prepare('INSERT INTO logs (user_id, role, module, action, description, level) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(userId, role, module, action, description, level);
  } catch (err) {
    console.error('Logging failed:', err);
  }
};

// Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      logAction(req.user.id, req.user.role, 'Auth', 'Access Denied', `Attempted access to restricted resource`, 'WARN');
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Routes

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logAction(null, null, 'Auth', 'Login Failed', `Failed login attempt for ${email}`, 'WARN');
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
  logAction(user.id, user.role, 'Auth', 'Login Success', `User ${user.name} logged in`);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.sendStatus(404);
  res.json(user);
});

// Dashboard Stats
app.get('/api/dashboard/stats', authenticateToken, (req: any, res) => {
  const { role } = req.user;
  let stats: any = {};

  if (role === 'Fleet Manager' || role === 'Dispatcher') {
    stats.activeVehicles = (db.prepare("SELECT count(*) as count FROM vehicles WHERE status = 'Active'").get() as any).count;
    stats.activeTrips = (db.prepare("SELECT count(*) as count FROM trips WHERE trip_status = 'In Transit'").get() as any).count;
    stats.pendingMaintenance = (db.prepare("SELECT count(*) as count FROM maintenance WHERE status = 'Pending'").get() as any).count;
  }

  if (role === 'Fleet Manager' || role === 'Financial Analyst') {
    stats.totalRevenue = 150000; // Mock value for demo
    stats.totalExpenses = (db.prepare('SELECT sum(total_cost) as total FROM expenses').get() as any).total || 0;
    stats.roi = stats.totalExpenses > 0 ? ((stats.totalRevenue - stats.totalExpenses) / stats.totalExpenses * 100).toFixed(1) : 0;
  }

  if (role === 'Safety Officer' || role === 'Fleet Manager') {
    stats.activeDrivers = (db.prepare("SELECT count(*) as count FROM drivers WHERE status = 'Active'").get() as any).count;
    stats.safetyIncidents = 2; // Mock value
  }

  res.json(stats);
});

// GPS Simulation Background Job - REMOVED
// const startGPSSimulation = () => { ... };

// Vehicles
app.get('/api/vehicles', authenticateToken, (req: any, res) => {
  const { status, search } = req.query;
  // Enhanced query to get counts for predictive maintenance
  let query = `
    SELECT v.*, 
    (SELECT COUNT(*) FROM trips t WHERE t.vehicle_id = v.id) as trip_count,
    (SELECT COUNT(*) FROM maintenance m WHERE m.vehicle_id = v.id) as maintenance_count
    FROM vehicles v 
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (model LIKE ? OR license_plate LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const vehicles = db.prepare(query).all(params);

  // Predictive Maintenance Logic
  const maintenanceAlerts = vehicles.map((v: any) => {
    let alert = null;
    const highMileage = v.odometer > 100000;
    const frequentTrips = v.trip_count > 50; // Arbitrary threshold
    const frequentMaintenance = v.maintenance_count > 5;

    if (highMileage && frequentTrips) {
      alert = 'High Usage & Mileage: Service Urgent';
    } else if (highMileage) {
      alert = 'High Mileage: Service Recommended';
    } else if (frequentMaintenance) {
      alert = 'Frequent Repairs: Check Reliability';
    } else if (v.id % 10 === 0) { // Keep some random factor for demo variety if data is low
       alert = 'Scheduled Service Overdue';
    }
    return { ...v, maintenance_alert: alert };
  });

  res.json(maintenanceAlerts);
});

app.post('/api/vehicles', authenticateToken, authorizeRole(['Fleet Manager']), (req: any, res) => {
  const { model, license_plate, capacity, odometer, status } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO vehicles (model, license_plate, capacity, odometer, status) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(model, license_plate, capacity, odometer, status || 'Active');
    logAction(req.user.id, req.user.role, 'Vehicles', 'Create', `Created vehicle ${license_plate}`);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/vehicles/:id', authenticateToken, authorizeRole(['Fleet Manager']), (req: any, res) => {
  const { model, license_plate, capacity, odometer, status } = req.body;
  try {
    const stmt = db.prepare('UPDATE vehicles SET model = ?, license_plate = ?, capacity = ?, odometer = ?, status = ? WHERE id = ?');
    stmt.run(model, license_plate, capacity, odometer, status, req.params.id);
    logAction(req.user.id, req.user.role, 'Vehicles', 'Update', `Updated vehicle ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Drivers
app.get('/api/drivers', authenticateToken, (req: any, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM drivers WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR license_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';
  const drivers = db.prepare(query).all(params);
  res.json(drivers);
});

app.post('/api/drivers', authenticateToken, authorizeRole(['Fleet Manager']), (req: any, res) => {
  const { name, license_number, license_expiry, phone, status } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO drivers (name, license_number, license_expiry, phone, status) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(name, license_number, license_expiry, phone, status || 'Active');
    logAction(req.user.id, req.user.role, 'Drivers', 'Create', `Created driver ${name}`);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/drivers/:id', authenticateToken, authorizeRole(['Fleet Manager', 'Safety Officer']), (req: any, res) => {
  const { name, license_number, license_expiry, phone, status } = req.body;
  try {
    const stmt = db.prepare('UPDATE drivers SET name = ?, license_number = ?, license_expiry = ?, phone = ?, status = ? WHERE id = ?');
    stmt.run(name, license_number, license_expiry, phone, status, req.params.id);
    logAction(req.user.id, req.user.role, 'Drivers', 'Update', `Updated driver ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});


// Trips
app.get('/api/trips', authenticateToken, (req: any, res) => {
  const { status, search } = req.query;
  let query = `
    SELECT t.*, v.license_plate, d.name as driver_name 
    FROM trips t 
    LEFT JOIN vehicles v ON t.vehicle_id = v.id 
    LEFT JOIN drivers d ON t.driver_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'All') {
    query += ' AND t.trip_status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (t.origin LIKE ? OR t.destination LIKE ? OR d.name LIKE ? OR v.license_plate LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY t.start_time DESC';
  const trips = db.prepare(query).all(params);
  res.json(trips);
});

app.post('/api/trips', authenticateToken, authorizeRole(['Fleet Manager', 'Dispatcher']), (req: any, res) => {
  const { vehicle_id, driver_id, cargo_weight, origin, destination, fuel_estimate, start_time, end_time } = req.body;
  
  // Validation: Check vehicle capacity and status
  const vehicle = db.prepare('SELECT capacity, status FROM vehicles WHERE id = ?').get(vehicle_id) as any;
  if (!vehicle) return res.status(400).json({ message: 'Vehicle not found' });
  if (vehicle.status !== 'Active') return res.status(400).json({ message: `Vehicle is not active (Status: ${vehicle.status})` });
  if (cargo_weight > vehicle.capacity) return res.status(400).json({ message: `Cargo exceeds vehicle capacity (${vehicle.capacity}kg)` });

  // Validation: Check driver availability
  const driver = db.prepare('SELECT status FROM drivers WHERE id = ?').get(driver_id) as any;
  if (!driver) return res.status(400).json({ message: 'Driver not found' });
  if (driver.status !== 'Active') return res.status(400).json({ message: `Driver is not active (Status: ${driver.status})` });

  const createTripTransaction = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO trips (vehicle_id, driver_id, cargo_weight, origin, destination, fuel_estimate, start_time, end_time, trip_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Scheduled')
    `);
    const info = stmt.run(vehicle_id, driver_id, cargo_weight, origin, destination, fuel_estimate, start_time, end_time);
    
    // Automatically update vehicle and driver status to prevent double booking
    db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(vehicle_id);
    db.prepare("UPDATE drivers SET status = 'On Duty' WHERE id = ?").run(driver_id);

    return info;
  });

  try {
    const info = createTripTransaction();
    logAction(req.user.id, req.user.role, 'Trips', 'Create', `Created trip from ${origin} to ${destination}`);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/trips/:id', authenticateToken, authorizeRole(['Fleet Manager', 'Dispatcher']), (req: any, res) => {
  const { trip_status } = req.body;
  const tripId = req.params.id;

  const updateTripTransaction = db.transaction(() => {
    const trip = db.prepare('SELECT vehicle_id, driver_id FROM trips WHERE id = ?').get(tripId) as any;
    if (!trip) throw new Error('Trip not found');

    // Prevent desync: Check if vehicle/driver exist
    const vehicle = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(trip.vehicle_id);
    const driver = db.prepare('SELECT id FROM drivers WHERE id = ?').get(trip.driver_id);

    if (!vehicle || !driver) throw new Error('Associated vehicle or driver not found');

    db.prepare('UPDATE trips SET trip_status = ? WHERE id = ?').run(trip_status, tripId);

    if (trip_status === 'Completed' || trip_status === 'Cancelled') {
      // Revert statuses to Active
      db.prepare("UPDATE vehicles SET status = 'Active' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'Active' WHERE id = ?").run(trip.driver_id);
    } else if (trip_status === 'In Transit') {
      // Ensure statuses are set to On Trip/On Duty
      db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'On Duty' WHERE id = ?").run(trip.driver_id);
    }
  });

  try {
    updateTripTransaction();
    logAction(req.user.id, req.user.role, 'Trips', 'Update', `Updated trip ${tripId} status to ${trip_status}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// GPS Tracking Update - REMOVED

// Maintenance
app.get('/api/maintenance', authenticateToken, (req, res) => {
  const maintenance = db.prepare(`
    SELECT m.*, v.license_plate, v.model
    FROM maintenance m
    JOIN vehicles v ON m.vehicle_id = v.id
    ORDER BY m.service_date DESC
  `).all();
  res.json(maintenance);
});

app.post('/api/maintenance', authenticateToken, authorizeRole(['Fleet Manager']), (req: any, res) => {
  const { vehicle_id, issue, cost, service_date, status } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO maintenance (vehicle_id, issue, cost, service_date, status) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(vehicle_id, issue, cost, service_date, status || 'Pending');
    
    // Auto update vehicle status if maintenance is pending/in-progress
    if (status !== 'Completed') {
      db.prepare("UPDATE vehicles SET status = 'Maintenance' WHERE id = ?").run(vehicle_id);
    }

    logAction(req.user.id, req.user.role, 'Maintenance', 'Create', `Logged maintenance for vehicle ${vehicle_id}`);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Expenses
app.get('/api/expenses', authenticateToken, authorizeRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
  const expenses = db.prepare(`
    SELECT e.*, t.origin, t.destination, v.license_plate
    FROM expenses e
    JOIN trips t ON e.trip_id = t.id
    JOIN vehicles v ON t.vehicle_id = v.id
    ORDER BY e.created_at DESC
  `).all();
  res.json(expenses);
});

// Fuel Import
app.post('/api/expenses/import', authenticateToken, authorizeRole(['Fleet Manager', 'Financial Analyst']), (req: any, res) => {
  const { transactions } = req.body; // Expecting array of { license_plate, amount, type, date }

  if (!Array.isArray(transactions)) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  const importTransaction = db.transaction(() => {
    let count = 0;
    for (const tx of transactions) {
      // Find vehicle
      const vehicle = db.prepare('SELECT id FROM vehicles WHERE license_plate = ?').get(tx.license_plate) as any;
      if (vehicle) {
        // Find active or recent trip for this vehicle (simplified logic: attach to latest trip or null)
        const trip = db.prepare('SELECT id FROM trips WHERE vehicle_id = ? ORDER BY start_time DESC LIMIT 1').get(vehicle.id) as any;
        
        const stmt = db.prepare('INSERT INTO expenses (trip_id, fuel_cost, misc_cost) VALUES (?, ?, ?)');
        if (tx.type === 'Fuel') {
          stmt.run(trip ? trip.id : null, tx.amount, 0);
        } else {
          stmt.run(trip ? trip.id : null, 0, tx.amount);
        }
        count++;
      }
    }
    return count;
  });

  try {
    const count = importTransaction();
    logAction(req.user.id, req.user.role, 'Expenses', 'Import', `Imported ${count} fuel transactions`);
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Logs
app.get('/api/logs', authenticateToken, (req: any, res) => {
  const { role } = req.user;
  let query = 'SELECT l.*, u.name as user_name FROM logs l LEFT JOIN users u ON l.user_id = u.id';
  
  if (role === 'Safety Officer') {
    query += " WHERE l.module = 'Drivers' OR l.module = 'Safety'";
  } else if (role !== 'Fleet Manager') {
    // Other roles can only see their own logs or limited logs? 
    // Requirement says Safety Officer sees safety logs.
    // Dispatcher cannot see logs.
    if (role === 'Dispatcher' || role === 'Financial Analyst') {
       return res.status(403).json({ message: 'Access denied' });
    }
  }
  
  query += ' ORDER BY l.timestamp DESC LIMIT 100';
  const logs = db.prepare(query).all();
  res.json(logs);
});

// Vite Integration
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  })();
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
