import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { 
  Phone, Clock, TrendingUp, 
  Pause, Play, AlertTriangle, 
  Shield, Bot, Activity 
} from 'lucide-react';
import axios from 'axios';

const UserOverview = () => {
  const { user } = useAuthStore();
  const [userStats, setUserStats] = useState(null);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinModal, setPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [actionType, setActionType] = useState('');
  
  const categories = {
    'real_estate': 'Real Estate',
    'hospitality': 'Hospitality', 
    'sales': 'Sales',
    'healthcare': 'Healthcare',
    'automotive': 'Automotive'
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [callLogsRes] = await Promise.all([
        axios.get('/user/call-logs?limit=5')
      ]);
      
      setCallLogs(callLogsRes.data);
    } catch (error) {
      toast.error('Failed to load user data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBotToggle = async (action) => {
    setActionType(action);
    setPinModal(true);
  };

  const submitPinAction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/user/${actionType}-bot`, { pin });
      toast.success(`Bot ${actionType}d successfully`);
      setPinModal(false);
      setPin('');
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${actionType} bot`);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      blocked: 'bg-red-500'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${variants[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  const pickupRate = callLogs.length > 0 ? 
    Math.round((callLogs.filter(log => log.call_outcome !== 'no_answer').length / callLogs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Dashboard</h1>
          <p className="text-gray-400">{categories[user?.category]} • {user?.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Bot Status:</span>
            {getStatusBadge(user?.status)}
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Calls Made</CardTitle>
            <Phone className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{callLogs.length}</div>
            <p className="text-xs text-gray-400">Recent calls</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Pickup Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pickupRate}%</div>
            <p className="text-xs text-gray-400">Success rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Minutes Used</CardTitle>
            <Clock className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{user?.minutes_used}</div>
            <p className="text-xs text-gray-400">of {user?.minutes_allocated} allocated</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Category</CardTitle>
            <Bot className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white">{categories[user?.category]}</div>
            <p className="text-xs text-gray-400">Specialization</p>
          </CardContent>
        </Card>
      </div>

      {/* Bot Control */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Bot Control</CardTitle>
          <p className="text-gray-400">Pause or resume your AI bot (PIN required)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-[#00FFD1]" />
              <div>
                <p className="text-white font-medium">AI Bot Status</p>
                <p className="text-sm text-gray-400">
                  {user?.status === 'active' ? 'Your bot is active and taking calls' : 'Your bot is currently paused'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleBotToggle(user?.status === 'active' ? 'pause' : 'resume')}
              variant={user?.status === 'active' ? 'destructive' : 'default'}
              className="flex items-center gap-2"
              disabled={user?.status === 'blocked'}
            >
              {user?.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {user?.status === 'active' ? 'Pause Bot' : 'Resume Bot'}
            </Button>
          </div>

          {user?.status === 'blocked' && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-900/20 border border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Bot Blocked by Admin</p>
                <p className="text-sm text-red-300">Please contact support to reactivate your account</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Call Logs */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Call Logs</CardTitle>
          <p className="text-gray-400">Your latest call activities</p>
        </CardHeader>
        <CardContent>
          {callLogs.length > 0 ? (
            <div className="space-y-3">
              {callLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">{log.lead_name}</p>
                      <p className="text-sm text-gray-400">{log.lead_phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white capitalize">{log.call_outcome.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-400">{log.duration_minutes} min</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No call logs yet</p>
              <p className="text-sm">Your call history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PIN Modal */}
      <Dialog open={pinModal} onOpenChange={setPinModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#00FFD1]" />
              PIN Verification Required
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPinAction} className="space-y-4">
            <div>
              <p className="text-gray-400 mb-3">
                Enter your PIN to {actionType} the bot
              </p>
              <Input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                maxLength={6}
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPinModal(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserOverview;