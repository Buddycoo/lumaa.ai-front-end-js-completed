import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { 
  UserPlus, Pause, Play, Settings, 
  User as UserIcon, Edit, Crown, Clock 
} from 'lucide-react';
import axios from 'axios';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [botSettingsModal, setBotSettingsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
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

  const [editUser, setEditUser] = useState({
    name: '',
    category: '',
    minutes_allocated: 0,
    status: ''
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
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
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
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/users/${selectedUser.id}`, editUser);
      toast.success('User updated successfully');
      setEditUserModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleUserStatusToggle = async (userId, currentStatus) => {
    if (currentStatus === 'active') {
      // For now, show alert - pause modal would go here
      toast.error('Please use the new UserManagement component for pause functionality');
    } else {
      // Resume user directly
      try {
        await axios.post(`/admin/users/${userId}/resume`);
        toast.success('User resumed successfully');
        fetchUsers();
      } catch (error) {
        toast.error('Failed to resume user');
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      category: user.category,
      minutes_allocated: user.minutes_allocated,
      status: user.status
    });
    setEditUserModal(true);
  };

  const fetchBotSettings = async (category) => {
    try {
      const response = await axios.get(`/admin/bot-settings/${category}`);
      setBotSettings(response.data);
      setSelectedCategory(category);
      setBotSettingsModal(true);
    } catch (error) {
      // If no settings exist, create defaults
      setBotSettings({
        model: 'gpt-4',
        temperature: 0.7,
        opening_message: `Hello! I'm an AI assistant specialized in ${category.replace('_', ' ')}. How can I help you today?`,
        prompt: `You are a professional AI assistant for ${category.replace('_', ' ')}. Be helpful, knowledgeable, and maintain a professional tone.`
      });
      setSelectedCategory(category);
      setBotSettingsModal(true);
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
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Manage users and their access</p>
        </div>
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
      </div>

      {/* Users Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Users</CardTitle>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(user)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Edit className="h-3 w-3" />
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

      {/* Edit User Modal */}
      <Dialog open={editUserModal} onOpenChange={setEditUserModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label htmlFor="editName" className="text-gray-300">Name</Label>
              <Input
                id="editName"
                value={editUser.name}
                onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="editCategory" className="text-gray-300">Category</Label>
              <Select value={editUser.category} onValueChange={(value) => setEditUser({...editUser, category: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editMinutes" className="text-gray-300">Minutes Allocated</Label>
              <Input
                id="editMinutes"
                type="number"
                value={editUser.minutes_allocated}
                onChange={(e) => setEditUser({...editUser, minutes_allocated: parseInt(e.target.value)})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                Update User
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditUserModal(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={botSettings.temperature || 0.7}
                onChange={(e) => setBotSettings({...botSettings, temperature: parseFloat(e.target.value)})}
                className="w-full mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="opening" className="text-gray-300">Opening Message</Label>
              <textarea
                id="opening"
                value={botSettings.opening_message || ''}
                onChange={(e) => setBotSettings({...botSettings, opening_message: e.target.value})}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 text-white rounded-md"
                rows={3}
                maxLength={500}
              />
            </div>
            
            <div>
              <Label htmlFor="prompt" className="text-gray-300">System Prompt</Label>
              <textarea
                id="prompt"
                value={botSettings.prompt || ''}
                onChange={(e) => setBotSettings({...botSettings, prompt: e.target.value})}
                className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 text-white rounded-md"
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
    </div>
  );
};

export default AdminUserManagement;