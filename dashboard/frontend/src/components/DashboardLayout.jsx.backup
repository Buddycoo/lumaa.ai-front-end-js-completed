import React, { useEffect, useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Phone,
  Settings,
  Users,
  LogOut,
  FileText,
  Bot,
  Upload,
  AlertTriangle,
  Shield,
  Bell,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState(null);
  
  const isAdmin = user?.role === 'admin';
  
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await axios.get('/system/status');
      setSystemStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Check if user is blocked
  if (user?.status === 'blocked') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Account Blocked</h1>
          <p className="text-gray-400 mb-6">You have been blocked by the admin. Please contact support.</p>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }
  
  const adminMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Overview',
      href: '/dashboard'
    },
    {
      icon: Users,
      label: 'User Management',
      href: '/dashboard/users'
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings'
    }
  ];

  const userMenuItems = [
    {
      icon: LayoutDashboard,
      label: 'Overview',
      href: '/dashboard'
    },
    {
      icon: Phone,
      label: 'Call Logs',
      href: '/dashboard/calls'
    },
    {
      icon: Bot,
      label: 'Bot Settings',
      href: '/dashboard/bot-settings'
    },
    ...(user?.category === 'sales' ? [{
      icon: Upload,
      label: 'Upload Leads',
      href: '/dashboard/leads'
    }] : []),
    {
      icon: Settings,
      label: 'Settings',
      href: '/dashboard/settings'
    }
  ];
  
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;
  
  return (
    <div className="h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <button onClick={() => navigate('/')} className="text-left">
              <h1 className="text-xl font-bold text-[#00FFD1]">
                Lumaa AI
              </h1>
              <p className="text-xs text-gray-400 mt-1">Dashboard</p>
            </button>
          </div>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
          
          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
              <div className="w-8 h-8 rounded-full bg-[#00FFD1] flex items-center justify-center">
                <span className="text-xs font-bold text-black">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name}
                </p>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-gray-400" />
                  <p className="text-xs text-gray-400">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full mt-3 justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {isAdmin ? 'Admin Dashboard' : 'Your Dashboard'}
            </h2>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-400">Welcome, {user?.name}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;