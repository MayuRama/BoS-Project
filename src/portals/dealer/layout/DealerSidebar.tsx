import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Sliders,
  ArrowLeftRight,
  Award,
  Bell,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Banknote,
} from 'lucide-react';

const navItems = [
  { to: '/dealer-portal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dealer-portal/omo-sessions', icon: TrendingUp, label: 'OMO Sessions' },
  { to: '/dealer-portal/my-rates', icon: Sliders, label: 'My Rates' },
  { to: '/dealer-portal/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/dealer-portal/allocation-results', icon: Award, label: 'Allocation Results' },
  { to: '/dealer-portal/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dealer-portal/profile', icon: UserCircle, label: 'Profile' },
];

const DealerSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`bg-bos-blue flex flex-col transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="bg-white/20 rounded-lg p-1.5 flex-shrink-0">
          <Banknote size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">FX Dealer Portal</p>
            <p className="text-white/50 text-xs">Premier Exchange Co.</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm transition-colors relative group ${
                isActive
                  ? 'bg-white/20 text-white border-r-2 border-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Tier badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <p className="text-white/50 text-xs">Dealer Tier</p>
            <p className="text-white font-bold text-sm">Tier 1 — Active</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-white/10 text-white/40 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        {!collapsed && <span className="text-xs ml-2">Collapse</span>}
      </button>
    </aside>
  );
};

export default DealerSidebar;
