import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ArchivesPage from './pages/ArchivesPage';
import SettingsPage from './pages/SettingsPage';
import Vault from '../features/vault/Vault';
import ConsentPage from '../features/consent/ConsentPage';
import Insights from '../features/insights/Insights';
import Marketplace from '../features/marketplace/Marketplace';
import Security from '../features/security/Security';
import Demo from '../features/demo/Demo';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/vault" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/security" element={<Security />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/vault" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default App;

