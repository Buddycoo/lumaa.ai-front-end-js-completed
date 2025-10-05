import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import Overview from './Overview';
import CallLogs from './CallLogs';
import BotSettings from './BotSettings';
import UserManagement from './UserManagement';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/calls" element={<CallLogs />} />
        <Route path="/settings" element={<BotSettings />} />
        <Route path="/users" element={<UserManagement />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;