import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import Overview from './Overview';
import CallLogs from './CallLogs';
import BotSettings from './BotSettings';
import UserManagement from './UserManagement';
import UserPayments from './UserPayments';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // For now, use existing components but we'll modify them to match refined requirements
  const isAdmin = user?.role === 'admin';
  
  return (
    <DashboardLayout>
      <Routes>
        {isAdmin ? (
          // Admin routes - NO call logs, focus on user management
          <>
            <Route path="/" element={<Overview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/settings" element={<BotSettings />} />
          </>
        ) : (
          // User routes - NO revenue anywhere, lead details only
          <>
            <Route path="/" element={<Overview />} />
            <Route path="/calls" element={<CallLogs />} />
            <Route path="/settings" element={<BotSettings />} />
            <Route path="/billing" element={<UserPayments />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;