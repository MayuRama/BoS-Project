import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import CentralBankPortal from './portals/centralbank/CentralBankPortal';
import DealerPortal from './portals/dealer/DealerPortal';

const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/centralbank-portal/*" element={<CentralBankPortal />} />
        <Route path="/dealer-portal/*" element={<DealerPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
