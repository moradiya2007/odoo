import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  DollarSign, 
  FileText, 
  BarChart,
  LogOut
} from 'lucide-react';
import { clsx } from 'clsx';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
    { name: 'Vehicles', path: '/vehicles', icon: Truck, roles: ['Fleet Manager', 'Dispatcher'] },
    { name: 'Drivers', path: '/drivers', icon: Users, roles: ['Fleet Manager', 'Safety Officer'] },
    { name: 'Trips', path: '/trips', icon: Map, roles: ['Fleet Manager', 'Dispatcher'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['Fleet Manager'] },
    { name: 'Expenses', path: '/expenses', icon: DollarSign, roles: ['Fleet Manager', 'Financial Analyst'] },
    { name: 'Logs', path: '/logs', icon: FileText, roles: ['Fleet Manager', 'Safety Officer'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user.role));

  return (
    <div className="h-screen w-64 bg-[#1E1E2F] text-white flex flex-col shadow-xl fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 flex items-center space-x-3 border-b border-gray-700">
        <div className="w-8 h-8 bg-[#4FD1C5] rounded-lg flex items-center justify-center">
          <Truck className="text-[#1E1E2F]" size={20} />
        </div>
        <span className="text-xl font-bold tracking-wide">FleetFlow</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'bg-[#4FD1C5] text-[#1E1E2F] font-semibold shadow-lg shadow-[#4FD1C5]/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <link.icon size={20} />
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
