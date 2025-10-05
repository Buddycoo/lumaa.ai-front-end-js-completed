import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Bell, Settings, User } from 'lucide-react';

const Header: React.FC = () => {
  const { user } = useAuthStore();
  
  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-white">
          Welcome, {user?.name}
        </h2>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Bell className="h-4 w-4" />
        </Button>
        
        {/* Settings */}
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Settings className="h-4 w-4" />
        </Button>
        
        {/* Profile */}
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;