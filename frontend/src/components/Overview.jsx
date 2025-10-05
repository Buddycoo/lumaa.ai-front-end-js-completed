import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAuthStore } from '../store/authStore';
import {
  Phone,
  TrendingUp,
  Users,
  Clock,
  Activity,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react';

const Overview = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  // Mock stats data based on refined requirements
  const adminStats = {
    totalRevenue: 15600,     // Admins see revenue
    totalMinutes: 2456,
    totalUsers: 12,
    activeUsers: 8,
    topUsersByRevenue: [
      { name: 'John Smith', revenue: 4500 },
      { name: 'Sarah Johnson', revenue: 3200 }
    ],
    topUsersByMinutes: [
      { name: 'Mike Wilson', minutes: 456 },
      { name: 'Lisa Brown', minutes: 389 }
    ]
  };
  
  // User stats - NO REVENUE anywhere
  const userStats = {
    callsMade: 156,
    pickupRate: 89,          // Success rate percentage
    minutesUsed: user?.minutes_used || 234,
    minutesAllocated: user?.minutes_allocated || 1000,
    category: user?.category || 'real_estate',
    botStatus: user?.status || 'active'
  };
  
  const StatsCard = ({ title, value, icon: Icon, trend, trendUp, className = '' }) => {
    return (
      <Card className={`bg-gray-900 border-gray-800 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-300">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white mb-1">
            {value}
          </div>
          {trend && (
            <p className={`text-xs ${
              trendUp === undefined 
                ? 'text-gray-500'
                : trendUp 
                  ? 'text-green-400'
                  : 'text-red-400'
            }`}>
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(amount);
  };
  
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes.toFixed(1)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };
  
  if (isAdmin) {
    // Admin Overview
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Monitor and manage your AI calling platform
            </p>
          </div>
        </div>
        
        {/* Admin Stats Cards - Focus on Revenue & User Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`$${adminStats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12% from last month"
            trendUp={true}
          />
          
          <StatsCard
            title="Total Minutes Used"
            value={adminStats.totalMinutes.toLocaleString()}
            icon={Clock}
            trend="+8% from last month"
            trendUp={true}
          />
          
          <StatsCard
            title="Total Users"
            value={adminStats.totalUsers.toString()}
            icon={Users}
            trend="+3 new this month"
            trendUp={true}
          />
          
          <StatsCard
            title="Active Users"
            value={adminStats.activeUsers.toString()}
            icon={Activity}
            trend="67% active rate"
            trendUp={true}
          />
        </div>
        
        {/* System Status */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#00FFD1]" />
              System Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Monitor and control AI system services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'AI Engine', key: 'ai', description: 'Core AI processing system' },
                { name: 'Call System', key: 'calls', description: 'Voice calling infrastructure' },
                { name: 'WhatsApp', key: 'whatsapp', description: 'WhatsApp integration service' }
              ].map((service) => (
                <div key={service.key} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{service.name}</h3>
                    <p className="text-sm text-gray-400">{service.description}</p>
                    <div className="flex items-center mt-2 gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stats.systemStatus[service.key] ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <span className={`text-xs ${
                        stats.systemStatus[service.key] ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stats.systemStatus[service.key] ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={stats.systemStatus[service.key] ? 'destructive' : 'default'}
                    className={stats.systemStatus[service.key] 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90'
                    }
                  >
                    {stats.systemStatus[service.key] ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // User Overview
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your Dashboard
          </h1>
          <p className="text-gray-400">
            Track your AI calling performance and usage
          </p>
        </div>
      </div>
      
      {/* User Stats Cards - NO REVENUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Calls Made"
          value={userStats.callsMade.toLocaleString()}
          icon={Phone}
          trend="Recent activity"
        />
        
        <StatsCard
          title="Pickup Rate"
          value={`${userStats.pickupRate}%`}
          icon={TrendingUp}
          trend="Success rate"
        />
        
        <StatsCard
          title="Category"
          value={userStats.category.replace('_', ' ').toUpperCase()}
          icon={BarChart3}
          trend="Your specialization"
        />
        
        <StatsCard
          title="Minutes Used"
          value={`${userStats.minutesUsed} / ${userStats.minutesAllocated}`}
          icon={Clock}
          trend={`${userStats.minutesAllocated - userStats.minutesUsed} remaining`}
        />
      </div>
      
      {/* Bot Status */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#00FFD1]" />
            Your AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 mb-1">
                Status: <span className={stats.botActive ? 'text-green-400' : 'text-red-400'}>
                  {stats.botActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Your AI bot is {stats.botActive ? 'ready to make calls' : 'currently paused'}
              </p>
            </div>
            <Button 
              className={stats.botActive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90'}
            >
              {stats.botActive ? 'Pause Bot' : 'Activate Bot'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;