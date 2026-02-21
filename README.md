🚚 FleetFlow – Fleet & Logistics Management System

📌 Project Overview

FleetFlow is a full-stack Fleet & Logistics Management System built to manage vehicles, drivers, trips, maintenance records, and operational expenses through a modern dashboard interface and a reliable MySQL backend.

The system focuses on:

- Accurate fleet lifecycle management
- Role-based operational access
- Stable authentication and backend logic
- Clean, professional UI
- Prevention of issues like double booking, status mismatch, and filtering errors

This project demonstrates a realistic logistics management workflow with emphasis on backend consistency, usability, and structured data handling.

---

🎯 Main Objectives

- Centralized fleet management system
- Smooth trip scheduling and tracking
- Proper driver and vehicle lifecycle control
- Maintenance logging and alerts
- Expense tracking for operational visibility
- Secure role-based access

---

👥 User Roles & Access Control

🧑‍💼 Fleet Manager

Complete system control:

- Manage vehicles, drivers, trips, maintenance, expenses
- View dashboards and reports
- Access system logs
- Operational oversight

---

🚦 Dispatcher

- Create and manage trips
- Assign drivers and vehicles
- Monitor trip progress
- Restricted from financial reports and logs

---

🦺 Safety Officer

- Monitor driver compliance
- Track license expiry and driver status
- View driver data only
- Cannot create trips or access finance data

---

💰 Financial Analyst

- View expense records and financial data
- Fuel and maintenance cost insights
- Cannot modify operational fleet data

---

🚀 Core Features

🚛 Vehicle Management

- Add, edit, and monitor vehicles
- Track:
  - Model
  - License plate
  - Capacity
  - Odometer reading
  - Status (Active, On Trip, Maintenance)
- Maintenance alerts based on mileage

---

👨‍✈️ Driver Management

- Driver registration and tracking
- License number and expiry tracking
- Driver status management:
  - Active
  - On Duty
  - Suspended
  - On Leave

---

🗺 Trip Management

- Create logistics trips
- Assign driver and vehicle
- Cargo validation against vehicle capacity
- Automatic lifecycle updates:

When trip starts:

- Vehicle → On Trip
- Driver → On Duty

When trip completes:

- Vehicle → Active
- Driver → Active

This prevents double booking and maintains operational consistency.

---

🧰 Maintenance Module

- Record service details
- Maintenance cost tracking
- Issue logging
- Vehicle maintenance history

---

💵 Expense Tracking

- Trip expense recording
- Fuel and miscellaneous cost tracking
- Financial visibility for analysis

---

📊 Dashboards

Each role sees a customized dashboard:

- Operational KPIs for managers
- Trip data for dispatchers
- Driver compliance for safety officers
- Financial insights for analysts

No generic dashboard is used.

---

🔒 Security & Authentication

- JWT-based authentication
- Role-based authorization middleware
- Password hashing with bcrypt
- Protected API endpoints
- Secure environment variable configuration

---

🧠 Logging System

System logs include:

- Login success and failure
- Unauthorized access attempts
- Trip lifecycle updates
- Maintenance updates
- Expense updates

Used for auditing, debugging, and monitoring.

---

🛠 Technology Stack

Frontend

- React + Vite
- Dark modern UI
- Responsive layout
- Smooth filtering and forms

---

Backend

- Node.js + Express
- MySQL database
- REST API architecture
- Async/Await error handling

---

Database Tables

- Users
- Vehicles
- Drivers
- Trips
- Maintenance
- Expenses
- Logs

---

📦 Installation Guide

Prerequisites

- Node.js installed
- MySQL installed and running
- Git installed

---

1️⃣ Clone Repository

git clone <your-repository-link>
cd fleetflow

---

2️⃣ Install Dependencies

npm install

(Repeat inside frontend/backend folders if separate.)

---

3️⃣ Configure Environment Variables

Create ".env" file:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=fleetflow
JWT_SECRET=your_secret_key

---

4️⃣ Setup Database

- Import SQL schema
- Verify all tables created

---

5️⃣ Start Backend

npm run server

---

6️⃣ Start Frontend

npm run dev

---

🧪 Testing Checklist

- Role-based login verification
- Trip creation and lifecycle update
- Maintenance record logging
- Expense entry testing
- Vehicle/Driver filtering

---

✨ Highlights of the Project

- Stable backend logic with transaction handling
- No double booking of resources
- Clean professional UI
- Strong authentication system
- Realistic fleet workflow implementation

---

📚 Learning Outcomes

This project demonstrates:

- Full-stack application development
- MySQL database design
- Role-based authentication
- REST API development
- UI/UX dashboard design
- Operational logistics modeling

---

📬 Support / Contribution

If you'd like to improve or extend the project:

- Create an issue
- Submit a pull request
- Suggest enhancements

---

FleetFlow – Simplifying Fleet Operations with Reliability and Clarity.