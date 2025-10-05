import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Users, Plus, Search, Shield, Play, Pause, Edit, DollarSign, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import axios from 'axios';

const UserManagement = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addUserModal, setAddUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Pause modal states
  const [pauseModal, setPauseModal] = useState(false);
  const [pauseAllModal, setPauseAllModal] = useState(false);
  const [userToPause, setUserToPause] = useState(null);
  const [pauseData, setPauseData] = useState({
    reason: '',
    admin_pin: ''
  });
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
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

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

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

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/users', {
        ...newUser,
        password: 'pass' // Default password for demo
      });
      
      toast.success('User created successfully');
      setAddUserModal(false);
      setNewUser({
        name: '',
        email: '',
        category: '',
        pin_code: '',
        minutes_allocated: 1000
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const pauseReasons = [
    'Payment Overdue',
    'Terms Violation',
    'System Maintenance',
    'Suspicious Activity',
    'Account Under Review',
    'Other'
  ];

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (currentStatus === 'active') {
      // Show pause modal with reason and PIN
      setUserToPause(userId);
      setPauseModal(true);
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

  const handlePauseUser = async (e) => {
    e.preventDefault();
    
    if (!pauseData.reason) {
      toast.error('Please select a reason');
      return;
    }
    
    if (pauseData.admin_pin !== '1509') {
      toast.error('Invalid admin PIN');
      return;
    }
    
    try {
      await axios.post(`/admin/users/${userToPause}/pause`, pauseData);
      toast.success('User paused successfully');
      setPauseModal(false);
      setPauseData({ reason: '', admin_pin: '' });
      setUserToPause(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to pause user');
    }
  };

  const handlePauseAllUsers = async (e) => {
    e.preventDefault();
    
    if (!pauseData.reason) {
      toast.error('Please select a reason');
      return;
    }
    
    if (pauseData.admin_pin !== '1509') {
      toast.error('Invalid admin PIN');
      return;
    }
    
    try {
      const response = await axios.post('/admin/users/pause-all', pauseData);
      toast.success(`${response.data.count} users paused successfully`);
      setPauseAllModal(false);
      setPauseData({ reason: '', admin_pin: '' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to pause users');
    }
  };

  const handleResumeAllUsers = async () => {
    if (!window.confirm('Resume all paused users?')) return;
    
    try {
      const response = await axios.post('/admin/users/resume-all');
      toast.success(`${response.data.count} users resumed successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to resume users');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUserModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/users/${selectedUser.id}/edit`, selectedUser);
      toast.success('User updated successfully');
      setEditUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleSendPaymentLink = async (user) => {
    try {
      const response = await axios.post('/admin/send-payment-link', {
        user_id: user.id,
        amount: user.monthly_plan_cost || 150,
        description: `Monthly subscription - ${new Date().toLocaleDateString()}`
      });
      
      toast.success(`Payment link sent to ${user.name}`);
      console.log('Payment link:', response.data.payment_link);
    } catch (error) {
      toast.error('Failed to send payment link');
    }
  };
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-400">
            Manage user accounts and permissions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleResumeAllUsers}
            variant="outline"
            className="bg-green-600/20 border-green-600 text-green-400 hover:bg-green-600/30"
          >
            <Play className="h-4 w-4 mr-2" />
            Resume All
          </Button>
          
          <Button 
            onClick={() => setPauseAllModal(true)}
            variant="outline"
            className="bg-yellow-600/20 border-yellow-600 text-yellow-400 hover:bg-yellow-600/30"
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause All
          </Button>
          
          <Button 
            onClick={() => setAddUserModal(true)}
            className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* Add User Modal */}
      <Dialog open={addUserModal} onOpenChange={setAddUserModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter email address"
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
                  onChange={(e) => setNewUser({...newUser, pin_code: e.target.value.replace(/[^0-9]/g, '')})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter PIN"
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
                  placeholder="1000"
                  required
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                  Create User
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAddUserModal(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      
      {/* Search */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Users List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00FFD1]" />
            Users ({filteredUsers.length})
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage user accounts, permissions, and usage limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((userData) => (
                <div key={userData.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#00FFD1] rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-black">
                        {userData.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{userData.name}</p>
                      <p className="text-sm text-gray-400">{userData.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {categories.find(c => c.value === userData.category)?.label || userData.category}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <Badge className={`${
                        userData.status === 'active' ? 'bg-green-600' : 
                        userData.status === 'paused' ? 'bg-yellow-600' : 'bg-red-600'
                      } text-white`}>
                        {userData.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="text-center min-w-[120px]">
                      <div className="flex items-center gap-2 text-[#00FFD1]">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          ${userData.revenue_generated?.toLocaleString() || 0}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    
                    <div className="text-center min-w-[100px]">
                      <div className="flex items-center gap-2 text-white">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {userData.minutes_used} / {userData.minutes_allocated}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Minutes</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={userData.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleToggleUserStatus(userData.id, userData.status)}
                        className={userData.status === 'active' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90'
                        }
                      >
                        {userData.status === 'active' ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Resume
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(userData)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={editUserModal} onOpenChange={setEditUserModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label htmlFor="editName" className="text-gray-300">Full Name</Label>
                <Input
                  id="editName"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="editEmail" className="text-gray-300">Email Address</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="editCategory" className="text-gray-300">Category</Label>
                <Select 
                  value={selectedUser.category} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, category: value})}
                >
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editMinutes" className="text-gray-300">Minutes Allocated</Label>
                  <Input
                    id="editMinutes"
                    type="number"
                    value={selectedUser.minutes_allocated}
                    onChange={(e) => setSelectedUser({...selectedUser, minutes_allocated: parseInt(e.target.value)})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="editPlanCost" className="text-gray-300">Monthly Plan Cost (AED)</Label>
                  <Input
                    id="editPlanCost"
                    type="number"
                    step="0.01"
                    value={selectedUser.monthly_plan_cost || 150}
                    onChange={(e) => setSelectedUser({...selectedUser, monthly_plan_cost: parseFloat(e.target.value)})}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
                  Update User
                </Button>
                <Button 
                  type="button"
                  onClick={() => handleSendPaymentLink(selectedUser)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Send Payment Link
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
          )}
        </DialogContent>
      </Dialog>
      
      {/* Pause Single User Modal */}
      <Dialog open={pauseModal} onOpenChange={setPauseModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pause className="h-5 w-5 text-yellow-400" />
              Pause User
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePauseUser} className="space-y-4">
            <div>
              <Label htmlFor="pause-reason" className="text-gray-300">Reason for Pausing *</Label>
              <select
                id="pause-reason"
                value={pauseData.reason}
                onChange={(e) => setPauseData({...pauseData, reason: e.target.value})}
                className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white"
                required
              >
                <option value="">Select a reason...</option>
                {pauseReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="pause-pin" className="text-gray-300">Admin PIN *</Label>
              <Input
                id="pause-pin"
                type="password"
                value={pauseData.admin_pin}
                onChange={(e) => setPauseData({...pauseData, admin_pin: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter PIN (1509)"
                maxLength={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">PIN protection required to pause users</p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPauseModal(false);
                  setPauseData({ reason: '', admin_pin: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Pause User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Pause All Users Modal */}
      <Dialog open={pauseAllModal} onOpenChange={setPauseAllModal}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pause className="h-5 w-5 text-yellow-400" />
              Pause All Users
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePauseAllUsers} className="space-y-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ This will pause all active users. They will be able to login but cannot access any features.
              </p>
            </div>
            
            <div>
              <Label htmlFor="pause-all-reason" className="text-gray-300">Reason for Global Pause *</Label>
              <select
                id="pause-all-reason"
                value={pauseData.reason}
                onChange={(e) => setPauseData({...pauseData, reason: e.target.value})}
                className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white"
                required
              >
                <option value="">Select a reason...</option>
                {pauseReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="pause-all-pin" className="text-gray-300">Admin PIN *</Label>
              <Input
                id="pause-all-pin"
                type="password"
                value={pauseData.admin_pin}
                onChange={(e) => setPauseData({...pauseData, admin_pin: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Enter PIN (1509)"
                maxLength={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">PIN 1509 required for global pause</p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPauseAllModal(false);
                  setPauseData({ reason: '', admin_pin: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Pause All Users
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;