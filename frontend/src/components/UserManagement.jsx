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

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const action = currentStatus === 'active' ? 'pause' : 'resume';
      await axios.post(`/admin/users/${userId}/${action}`);
      
      toast.success(`User ${action}d successfully`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ); 
      minutesLeft: 1910.3,
      lastActive: '3 days ago'
    }
  ];
  
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
        <Button className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      {/* Search and Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <select className="h-10 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white">
              <option value="all">All Roles</option>
              <option value="USER">Users</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </CardContent>
      </Card>
      
      {/* Users List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00FFD1]" />
            Active Users ({users.length})
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage user accounts, permissions, and usage limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userData) => (
              <div key={userData.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00FFD1] rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-black">
                      {userData.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{userData.name}</p>
                    <p className="text-sm text-gray-400">{userData.email}</p>
                    <p className="text-xs text-gray-500">Last active: {userData.lastActive}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userData.role === 'ADMIN' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
                    }`}>
                      {userData.role}
                    </span>
                  </div>
                  
                  <div className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userData.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                    }`}>
                      {userData.status}
                    </span>
                  </div>
                  
                  <div className="text-center min-w-[80px]">
                    <p className="text-white text-sm">{userData.minutesUsed.toFixed(1)}m used</p>
                    <p className="text-xs text-gray-500">{userData.minutesLeft.toFixed(1)}m left</p>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {users.length} of {users.length} users
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="border-gray-700 text-gray-500">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled className="border-gray-700 text-gray-500">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;