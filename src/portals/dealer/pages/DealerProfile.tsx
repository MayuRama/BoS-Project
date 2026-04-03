import React, { useState } from 'react';
import { User, Building2, Phone, Mail, CreditCard } from 'lucide-react';

const DealerProfile: React.FC = () => {
  const [participationActive, setParticipationActive] = useState(true);

  const users = [
    { name: 'Ahmed Ali Mohamed', role: 'Operations Manager', username: 'ahmed.ali', lastLogin: '2024-03-15 09:22', status: 'Active' },
    { name: 'Amina Hassan Warsame', role: 'Administrator', username: 'amina.hassan', lastLogin: '2024-03-14 16:45', status: 'Active' },
    { name: 'Omar Jama Ibrahim', role: 'Operator', username: 'omar.jama', lastLogin: '2024-03-13 11:30', status: 'Active' },
    { name: 'Faadumo Abdi', role: 'Operator', username: 'faadumo.abdi', lastLogin: '2024-03-10 08:15', status: 'Inactive' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Dealer account information and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dealer Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-bos-blue text-white w-12 h-12 rounded-xl flex items-center justify-center">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">Premier Exchange Co.</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Tier 1</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            {[
              { icon: CreditCard, label: 'Dealer ID', value: 'D002' },
              { icon: CreditCard, label: 'License Number', value: 'FX-LIC-2019-002' },
              { icon: Building2, label: 'Registered Date', value: '20 May 2019' },
              { icon: Mail, label: 'Contact Email', value: 'ops@premierexchange.so' },
              { icon: Phone, label: 'Contact Phone', value: '+252-63-7712000' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-50">
                <item.icon size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 w-36">{item.label}</span>
                <span className="font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Wallet Details</h2>
          <div className="space-y-4">
            {/* Zaad */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">Z</div>
                <span className="font-semibold text-green-800">Zaad Wallet</span>
              </div>
              <p className="font-mono text-lg font-bold text-green-900">063-7712-002</p>
              <p className="text-xs text-green-700 mt-1">Primary settlement wallet</p>
            </div>

            {/* e-Dahab */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">eD</div>
                <span className="font-semibold text-blue-800">e-Dahab Wallet</span>
              </div>
              <p className="font-mono text-lg font-bold text-blue-900">770-3312-002</p>
              <p className="text-xs text-blue-700 mt-1">Secondary settlement wallet</p>
            </div>

            {/* Participation Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Participation Status</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle to pause/resume FX activity</p>
                </div>
                <div
                  onClick={() => setParticipationActive(p => !p)}
                  className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${participationActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${participationActive ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </div>
              <p className={`text-xs font-medium mt-2 ${participationActive ? 'text-green-700' : 'text-gray-500'}`}>
                {participationActive ? 'Active — participating in FX market' : 'Paused — not participating'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Accounts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">User Accounts</h2>
          <span className="text-xs text-gray-400">{users.length} users</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Role', 'Username', 'Last Login', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.username} className="hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-7 h-7 bg-bos-blue text-white rounded-full flex items-center justify-center text-xs">
                      <User size={13} />
                    </div>
                    <span className="font-medium text-gray-800">{u.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.username}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.lastLogin}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DealerProfile;
