import React from 'react';
import { Bell, LogOut, User, ChevronDown } from 'lucide-react';

interface CBHeaderProps {
  role: string;
}

const CBHeader: React.FC<CBHeaderProps> = ({ role }) => {
  const handleLogout = () => {
    localStorage.removeItem('cb_logged_in');
    localStorage.removeItem('cb_role');
    localStorage.removeItem('cb_username');
    localStorage.removeItem('cb_fullName');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.replace('/centralbank-portal/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          Central Bank of Somaliland — FX Intervention System
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Rate ticker */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-gray-500">USD/SL</span>
          <span className="font-bold text-gray-900">572</span>
          <span className="text-green-600 font-medium">+0.35%</span>
        </div>

        {/* Alerts bell */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="bg-bos-navy text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
            <User size={14} />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">FX Admin</p>
            <p className="text-xs text-gray-400">{role}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default CBHeader;
