import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Users, DollarSign, Clock, TrendingUp, 
  UserPlus, Pause, Play, Settings, 
  Crown, User as UserIcon, AlertTriangle 
} from 'lucide-react';
import axios from 'axios';

const AdminOverview = () => {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [botSettingsModal, setBotSettingsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [botSettings, setBotSettings] = useState({});

  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: 'pass',
    category: '',
    pin_code: '',
    minutes_allocated: 1000
  });

  const categories = [
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'sales', label: 'Sales' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'automotive', label: 'Automotive' }
  ];

  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3', label: 'Claude 3' }
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [overviewRes, usersRes] = await Promise.all([
        axios.get('/admin/overview'),
        axios.get('/admin/users')
      ]);
      
      setOverview(overviewRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/users', newUser);
      toast.success('User created successfully');
      setCreateUserModal(false);
      setNewUser({
        name: '',
        email: '',
        password: 'pass',
        category: '',
        pin_code: '',
        minutes_allocated: 1000
      });
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const action = currentStatus === 'active' ? 'pause' : 'resume';
      await axios.post(`/admin/users/${userId}/${action}`);
      toast.success(`User ${action}d successfully`);
      fetchAdminData();
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const handleGlobalPause = async () => {
    try {
      const action = overview?.is_global_paused ? 'resume-all' : 'pause-all';
      await axios.post(`/admin/${action}`);
      toast.success(`System ${action === 'pause-all' ? 'paused' : 'resumed'} successfully`);
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to toggle global pause');
    }
  };

  const fetchBotSettings = async (category) => {
    try {
      const response = await axios.get(`/admin/bot-settings/${category}`);
      setBotSettings(response.data);
      setSelectedCategory(category);
      setBotSettingsModal(true);
    } catch (error) {
      toast.error('Failed to load bot settings');
    }
  };

  const handleUpdateBotSettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/bot-settings/${selectedCategory}`, botSettings);
      toast.success('Bot settings updated successfully');
      setBotSettingsModal(false);
    } catch (error) {
      toast.error('Failed to update bot settings');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-green-500',
      paused: 'bg-yellow-500',
      blocked: 'bg-red-500'
    };
    return (
      <Badge className={`${variants[status]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={handleGlobalPause}
            variant={overview?.is_global_paused ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            {overview?.is_global_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {overview?.is_global_paused ? 'Resume All' : 'Pause All'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${overview?.total_revenue?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Minutes Used</CardTitle>
            <Clock className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.total_minutes_used?.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.total_users}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00FFD1]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.active_users}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Top Users by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.top_users_by_revenue?.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-white">{user.name}</span>
                </div>
                <span className="text-[#00FFD1]">${user.revenue_generated?.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Top Users by Minutes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.top_users_by_minutes?.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-white">{user.name}</span>
                </div>
                <span className="text-[#00FFD1]">{user.minutes_used?.toLocaleString()} min</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">User Management</CardTitle>
          <Dialog open={createUserModal} onOpenChange={setCreateUserModal}>
            <DialogTrigger asChild>
              <Button className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select value={newUser.category} onValueChange={(value) => setNewUser({...newUser, category: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pin" className="text-gray-300">PIN Code (4-6 digits)</Label>
                  <Input
                    id="pin"
                    value={newUser.pin_code}
                    onChange={(e) => setNewUser({...newUser, pin_code: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                    maxLength={6}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="minutes" className="text-gray-300">Minutes Allocated</Label>
                  <Input
                    id="minutes"
                    type="number"
                    value={newUser.minutes_allocated}
                    onChange={(e) => setNewUser({...newUser, minutes_allocated: parseInt(e.target.value)})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                    Create User
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCreateUserModal(false)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Category</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Revenue</TableHead>
                <TableHead className="text-gray-400">Minutes</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-gray-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-gray-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    {categories.find(c => c.value === user.category)?.label}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-[#00FFD1]">
                    ${user.revenue_generated?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-white">
                    {user.minutes_used}/{user.minutes_allocated}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={user.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleUserStatusToggle(user.id, user.status)}
                      >
                        {user.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bot Settings by Category */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Universal Bot Settings</CardTitle>
          <p className="text-gray-400">Configure bot settings for each category</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => fetchBotSettings(category.value)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bot Settings Modal */}
      <Dialog open={botSettingsModal} onOpenChange={setBotSettingsModal}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Bot Settings - {categories.find(c => c.value === selectedCategory)?.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateBotSettings} className="space-y-6">
            <div>
              <Label className="text-gray-300">Model</Label>
              <Select 
                value={botSettings.model} 
                onValueChange={(value) => setBotSettings({...botSettings, model: value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {models.map(model => (
                    <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-300">Temperature: {botSettings.temperature}</Label>
              <Slider
                value={[botSettings.temperature || 0.7]}
                onValueChange={([value]) => setBotSettings({...botSettings, temperature: value})}
                max={2}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="opening" className="text-gray-300">Opening Message</Label>
              <Textarea
                id="opening"
                value={botSettings.opening_message || ''}
                onChange={(e) => setBotSettings({...botSettings, opening_message: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
                maxLength={500}
              />
            </div>
            
            <div>
              <Label htmlFor="prompt" className="text-gray-300">System Prompt</Label>
              <Textarea
                id="prompt"
                value={botSettings.prompt || ''}
                onChange={(e) => setBotSettings({...botSettings, prompt: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                rows={6}
                maxLength={2000}
              />
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                Save Settings
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setBotSettingsModal(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Global Pause Warning */}
      {overview?.is_global_paused && (
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">System Globally Paused</p>
              <p className="text-red-300 text-sm">All users are currently unable to access the system</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOverview;