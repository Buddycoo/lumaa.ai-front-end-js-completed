import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout: React.FC = () => {
  return (
    <div className="h-screen bg-black flex">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <Sidebar className="h-full" />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;