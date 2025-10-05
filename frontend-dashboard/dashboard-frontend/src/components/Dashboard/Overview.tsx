import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
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
import { formatCurrency, formatDuration } from '../../lib/utils';
import StatsCard from './StatsCard';
import SystemToggle from './SystemToggle';

const Overview: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/dashboard/stats`);
      return response.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
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
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Calls"
            value={stats?.totalCalls?.toLocaleString() || '0'}
            icon={Phone}
            trend="+12% from last month"
            trendUp={true}
          />
          
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={DollarSign}
            trend="+8% from last month"
            trendUp={true}
          />
          
          <StatsCard
            title="Active Clients"
            value={stats?.activeClients?.toString() || '0'}
            icon={Users}
            trend="+3 new this month"
            trendUp={true}
          />
          
          <StatsCard
            title="Pickup Rate"
            value={`${stats?.pickupRate || 0}%`}
            icon={TrendingUp}
            trend="+2.5% improvement"
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
              <SystemToggle
                serviceName="ai"
                label="AI Engine"
                description="Core AI processing system"
                enabled={stats?.systemStatus?.ai || false}
              />
              
              <SystemToggle
                serviceName="calls"
                label="Call System"
                description="Voice calling infrastructure"
                enabled={stats?.systemStatus?.calls || false}
              />
              
              <SystemToggle
                serviceName="whatsapp"
                label="WhatsApp"
                description="WhatsApp integration service"
                enabled={stats?.systemStatus?.whatsapp || false}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                <Phone className="h-4 w-4 mr-2" />
                Check Call Logs
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">API Response Time</span>
                  <span className="text-green-400">45ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Database Status</span>
                  <span className="text-green-400">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">AI Model Status</span>
                  <span className="text-green-400">Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
      
      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Calls Made"
          value={stats?.callsMade?.toLocaleString() || '0'}
          icon={Phone}
          trend="This month"
        />
        
        <StatsCard
          title="Pickup Rate"
          value={`${stats?.pickupRate || 0}%`}
          icon={TrendingUp}
          trend="Success rate"
        />
        
        <StatsCard
          title="Revenue Generated"
          value={formatCurrency(stats?.revenue || 0)}
          icon={DollarSign}
          trend="Total earnings"
        />
        
        <StatsCard
          title="Minutes Used"
          value={formatDuration(stats?.minutesUsed || 0)}
          icon={Clock}
          trend={`${formatDuration(stats?.minutesLeft || 0)} remaining`}
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
                Status: <span className={stats?.botActive ? 'text-green-400' : 'text-red-400'}>
                  {stats?.botActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Your AI bot is {stats?.botActive ? 'ready to make calls' : 'currently paused'}
              </p>
            </div>
            <Button 
              className={stats?.botActive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90'}
            >
              {stats?.botActive ? 'Pause Bot' : 'Activate Bot'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Usage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Usage Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Total Cost</span>
              <span className="text-white font-medium">{formatCurrency(stats?.totalCost || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg. Cost/Min</span>
              <span className="text-white font-medium">{formatCurrency(stats?.avgCostPerMinute || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Total Minutes</span>
              <span className="text-white font-medium">{formatDuration(stats?.totalMinutes || 0)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
              <Phone className="h-4 w-4 mr-2" />
              Start New Campaign
            </Button>
            <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Call History
            </Button>
            <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
              <Settings className="h-4 w-4 mr-2" />
              Configure Bot
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;