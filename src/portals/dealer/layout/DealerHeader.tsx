import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';

const DealerHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('dealer_logged_in');
    navigate('/dealer-portal/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium">
          Premier Exchange Co. — Licensed FX Dealer
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Rate display */}
        <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
          <span className="text-gray-500">Buy</span>
          <span className="font-bold text-gray-900">SL 567</span>
          <span className="w-px h-3 bg-gray-300" />
          <span className="text-gray-500">Sell</span>
          <span className="font-bold text-gray-900">SL 572</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="bg-bos-blue text-white w-8 h-8 rounded-full flex items-center justify-center">
            <User size={14} />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">Premier Exchange</p>
            <p className="text-xs text-gray-400">Tier 1 Dealer</p>
          </div>
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

export default DealerHeader;
