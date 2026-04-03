import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CBSidebar from './layout/CBSidebar';
import CBHeader from './layout/CBHeader';
import CBLogin from './pages/CBLogin';
import CBDashboard from './pages/CBDashboard';
import USSDTransactions from './pages/USSDTransactions';
import OMOSessions from './pages/OMOSessions';
import OMOSessionDetail from './pages/OMOSessionDetail';
import DealerManagement from './pages/DealerManagement';
import RateControls from './pages/RateControls';
import Reports from './pages/Reports';
import AMLAlerts from './pages/AMLAlerts';
import AuditLogs from './pages/AuditLogs';
import SystemSettings from './pages/SystemSettings';

const PortalLayout: React.FC = () => {
  const role = localStorage.getItem('cb_role') || 'FX Intervention Desk';
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <CBSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <CBHeader role={role} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<CBDashboard />} />
            <Route path="ussd-transactions" element={<USSDTransactions />} />
            <Route path="omo-sessions" element={<OMOSessions />} />
            <Route path="omo-sessions/:id" element={<OMOSessionDetail />} />
            <Route path="dealer-management" element={<DealerManagement />} />
            <Route path="rate-controls" element={<RateControls />} />
            <Route path="reports" element={<Reports />} />
            <Route path="aml-alerts" element={<AMLAlerts />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const CentralBankPortal: React.FC = () => {
  const isLoggedIn = localStorage.getItem('cb_logged_in') === 'true';

  return (
    <Routes>
      <Route path="login" element={isLoggedIn ? <Navigate to="/centralbank-portal/dashboard" replace /> : <CBLogin />} />
      <Route
        path="*"
        element={isLoggedIn ? <PortalLayout /> : <Navigate to="/centralbank-portal/login" replace />}
      />
    </Routes>
  );
};

export default CentralBankPortal;
