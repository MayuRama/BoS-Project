import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Sliders,
  BarChart2,
  ShieldAlert,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Smartphone,
} from 'lucide-react';

const navItems = [
  { to: '/centralbank-portal/dashboard',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/centralbank-portal/ussd-transactions',  icon: Smartphone,      label: 'USSD Transactions' },
  { to: '/centralbank-portal/omo-sessions',       icon: TrendingUp,      label: 'OMO Sessions' },
  { to: '/centralbank-portal/dealer-management',  icon: Users,           label: 'Dealer Management' },
  { to: '/centralbank-portal/rate-controls',      icon: Sliders,         label: 'Rate Controls' },
  { to: '/centralbank-portal/reports',            icon: BarChart2,       label: 'Reports & Analytics' },
  { to: '/centralbank-portal/aml-alerts',         icon: ShieldAlert,     label: 'AML Alerts' },
  { to: '/centralbank-portal/audit-logs',         icon: ClipboardList,   label: 'Audit Logs' },
  { to: '/centralbank-portal/settings',           icon: Settings,        label: 'System Settings' },
];

const CBSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-bos-navy flex flex-col transition-all duration-300 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="bg-bos-green rounded-lg p-1.5 flex-shrink-0">
          <Building2 size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Bank of Somaliland</p>
            <p className="text-white/50 text-xs">FX Platform</p>
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
                  ? 'bg-bos-green/20 text-bos-green border-r-2 border-bos-green'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
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

      {/* Collapse toggle */}
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

export default CBSidebar;
