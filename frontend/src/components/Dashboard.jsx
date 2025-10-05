import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import AdminOverview from './AdminOverview';
import UserOverview from './UserOverview';
import UserCallLogs from './UserCallLogs';
import UserBotSettings from './UserBotSettings';
import UserLeads from './UserLeads';
import AdminUserManagement from './AdminUserManagement';
import Settings from './Settings';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <DashboardLayout>
      <Routes>
        {/* Admin Routes */}
        {isAdmin ? (
          <>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/users" element={<AdminUserManagement />} />
            <Route path="/settings" element={<Settings />} />
          </>
        ) : (
          /* User Routes */
          <>
            <Route path="/" element={<UserOverview />} />
            <Route path="/calls" element={<UserCallLogs />} />
            <Route path="/bot-settings" element={<UserBotSettings />} />
            <Route path="/leads" element={<UserLeads />} />
            <Route path="/settings" element={<Settings />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;