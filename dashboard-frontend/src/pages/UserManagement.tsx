import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, Plus, Search, MoreVertical, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const UserManagement: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  
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
            Active Users
          </CardTitle>
          <CardDescription className="text-gray-400">
            Manage user accounts, permissions, and usage limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock user entries */}
            {[
              { name: 'Ahmed Hassan', email: 'ahmed@emirates.ae', role: 'USER', status: 'Active', minutesUsed: 234.5, minutesLeft: 765.5 },
              { name: 'Sarah Al-Mansouri', email: 'sarah@techinnovations.ae', role: 'USER', status: 'Active', minutesUsed: 156.2, minutesLeft: 843.8 },
              { name: 'Admin Manager', email: 'manager@lumaa.ai', role: 'ADMIN', status: 'Active', minutesUsed: 0, minutesLeft: 5000 },
              { name: 'Maria Rodriguez', email: 'maria@luxuryhotels.ae', role: 'USER', status: 'Paused', minutesUsed: 89.7, minutesLeft: 1910.3 }
            ].map((userData, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#00FFD1] rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-black">
                      {userData.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{userData.name}</p>
                    <p className="text-sm text-gray-400">{userData.email}</p>
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
                  
                  <div className="text-center">
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
              Showing 4 of 4 users
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