import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DealerSidebar from './layout/DealerSidebar';
import DealerHeader from './layout/DealerHeader';
import DealerLogin from './pages/DealerLogin';
import DealerDashboard from './pages/DealerDashboard';
import DealerOMOSessions from './pages/DealerOMOSessions';
import DealerMyRates from './pages/DealerMyRates';
import DealerTransactions from './pages/DealerTransactions';
import AllocationResults from './pages/AllocationResults';
import DealerNotifications from './pages/DealerNotifications';
import DealerProfile from './pages/DealerProfile';

const PortalLayout: React.FC = () => (
  <div className="flex h-screen overflow-hidden bg-gray-50">
    <DealerSidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      <DealerHeader />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<DealerDashboard />} />
          <Route path="omo-sessions" element={<DealerOMOSessions />} />
          <Route path="my-rates" element={<DealerMyRates />} />
          <Route path="transactions" element={<DealerTransactions />} />
          <Route path="allocation-results" element={<AllocationResults />} />
          <Route path="notifications" element={<DealerNotifications />} />
          <Route path="profile" element={<DealerProfile />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  </div>
);

const DealerPortal: React.FC = () => {
  const isLoggedIn = localStorage.getItem('dealer_logged_in') === 'true';

  return (
    <Routes>
      <Route path="login" element={isLoggedIn ? <Navigate to="/dealer-portal/dashboard" replace /> : <DealerLogin />} />
      <Route
        path="*"
        element={isLoggedIn ? <PortalLayout /> : <Navigate to="/dealer-portal/login" replace />}
      />
    </Routes>
  );
};

export default DealerPortal;
