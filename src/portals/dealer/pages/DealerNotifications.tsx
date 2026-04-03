import React, { useState } from 'react';
import { Bell, TrendingUp, ArrowLeftRight, Settings, Wallet, CheckCheck } from 'lucide-react';
import { notifications as initialNotifications } from '../../../data/mockData';
import type { Notification } from '../../../types';

const typeIcon = (type: Notification['type']) => {
  switch (type) {
    case 'OMO': return <TrendingUp size={16} className="text-blue-600" />;
    case 'Transaction': return <ArrowLeftRight size={16} className="text-green-600" />;
    case 'Settlement': return <Wallet size={16} className="text-purple-600" />;
    case 'Rate': return <Bell size={16} className="text-yellow-600" />;
    case 'System': return <Settings size={16} className="text-gray-500" />;
    default: return <Bell size={16} className="text-gray-400" />;
  }
};

const typeBg = (type: Notification['type']) => {
  switch (type) {
    case 'OMO': return 'bg-blue-50 border-blue-200';
    case 'Transaction': return 'bg-green-50 border-green-200';
    case 'Settlement': return 'bg-purple-50 border-purple-200';
    case 'Rate': return 'bg-yellow-50 border-yellow-200';
    case 'System': return 'bg-gray-50 border-gray-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

const DealerNotifications: React.FC = () => {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [filter, setFilter] = useState<'All' | 'Unread' | 'OMO' | 'Transaction' | 'System'>('All');

  const filtered = notifs.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'All') return true;
    return n.type === filter;
  });

  const unreadCount = notifs.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
        {(['All', 'Unread', 'OMO', 'Transaction', 'System'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {f}
            {f === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.map(n => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${!n.read ? typeBg(n.type) + ' shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
          >
            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${!n.read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
              {typeIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-semibold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                  <span className="text-xs text-gray-400 whitespace-nowrap">{n.timestamp.replace('T', ' ').slice(0, 16)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-2 ${
                n.type === 'OMO' ? 'bg-blue-100 text-blue-700' :
                n.type === 'Transaction' ? 'bg-green-100 text-green-700' :
                n.type === 'Settlement' ? 'bg-purple-100 text-purple-700' :
                n.type === 'Rate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-600'
              }`}>{n.type}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Bell size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No notifications to show</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerNotifications;
