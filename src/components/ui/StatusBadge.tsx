import React from 'react';

type BadgeVariant =
  | 'Active' | 'Suspended' | 'Pending'
  | 'Open' | 'Pending Allocation' | 'Completed' | 'Cancelled'
  | 'Submitted' | 'Allocated' | 'Partial' | 'Rejected'
  | 'High' | 'Medium' | 'Low'
  | 'New' | 'Under Review' | 'Resolved'
  | 'Failed' | 'Buy USD' | 'Sell USD'
  | 'Injection' | 'Absorption'
  | string;

interface StatusBadgeProps {
  status: BadgeVariant;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  Active: 'bg-green-100 text-green-800',
  Suspended: 'bg-red-100 text-red-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Open: 'bg-green-100 text-green-800',
  'Pending Allocation': 'bg-blue-100 text-blue-800',
  Completed: 'bg-gray-100 text-gray-700',
  Cancelled: 'bg-red-100 text-red-700',
  Submitted: 'bg-blue-100 text-blue-800',
  Allocated: 'bg-green-100 text-green-800',
  Partial: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-100 text-gray-700',
  New: 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Failed: 'bg-red-100 text-red-800',
  'Buy USD': 'bg-emerald-100 text-emerald-800',
  'Sell USD': 'bg-orange-100 text-orange-800',
  Injection: 'bg-emerald-100 text-emerald-800',
  Absorption: 'bg-purple-100 text-purple-800',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const colorClass = colorMap[status] || 'bg-gray-100 text-gray-700';
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
