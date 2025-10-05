import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  BarChart3,
  Phone,
  Settings,
  Users,
  LogOut,
  Shield,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Overview',
      href: '/dashboard',
      adminOnly: false
    },
    {
      icon: BarChart3,
      label: 'Metrics',
      href: '/dashboard/metrics',
      adminOnly: false
    },
    {
      icon: Phone,
      label: 'Call Logs',
      href: '/dashboard/calls',
      adminOnly: false
    },
    {
      icon: Settings,
      label: 'Bot Settings',
      href: '/dashboard/settings',
      adminOnly: false
    },
    {
      icon: Users,
      label: 'User Control',
      href: '/dashboard/users',
      adminOnly: true
    },
    {
      icon: Activity,
      label: 'System Status',
      href: '/dashboard/system',
      adminOnly: true
    }
  ];
  
  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);
  
  return (
    <div className={cn('flex flex-col h-full bg-gray-900 border-r border-gray-800', className)}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-[#00FFD1]">
          Lumaa AI
        </h1>
        <p className="text-xs text-gray-400 mt-1">Dashboard</p>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                )}
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
  );
};

export default Sidebar;