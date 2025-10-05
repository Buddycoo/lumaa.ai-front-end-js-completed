import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { 
  User, Shield, Key, 
  Save, Eye, EyeOff, 
  Settings as SettingsIcon 
} from 'lucide-react';
import axios from 'axios';

const Settings = () => {
  const { user } = useAuthStore();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // PIN change state
  const [pinForm, setPinForm] = useState({
    current_pin: '',
    new_pin: '',
    confirm_pin: ''
  });
  const [changingPin, setChangingPin] = useState(false);

  const categories = {
    'real_estate': 'Real Estate',
    'hospitality': 'Hospitality', 
    'sales': 'Sales',
    'healthcare': 'Healthcare',
    'automotive': 'Automotive'
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 4) {
      toast.error('Password must be at least 4 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Password changed successfully');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePinChange = async (e) => {
    e.preventDefault();
    
    if (pinForm.new_pin !== pinForm.confirm_pin) {
      toast.error('New PINs do not match');
      return;
    }

    if (pinForm.new_pin.length < 4 || pinForm.new_pin.length > 6) {
      toast.error('PIN must be 4-6 digits long');
      return;
    }

    if (!/^\d+$/.test(pinForm.new_pin)) {
      toast.error('PIN must contain only numbers');
      return;
    }

    setChangingPin(true);
    try {
      await axios.post('/user/change-pin', {
        current_pin: pinForm.current_pin,
        new_pin: pinForm.new_pin
      });
      
      toast.success('PIN changed successfully');
      setPinForm({
        current_pin: '',
        new_pin: '',
        confirm_pin: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change PIN');
    } finally {
      setChangingPin(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
  };

  const resetPinForm = () => {
    setPinForm({
      current_pin: '',
      new_pin: '',
      confirm_pin: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account settings and security</p>
      </div>

      {/* Account Information */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-[#00FFD1]" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Name</Label>
              <div className="mt-1 p-3 bg-gray-800 rounded-md text-white">
                {user?.name}
              </div>
            </div>
            
            <div>
              <Label className="text-gray-300">Email</Label>
              <div className="mt-1 p-3 bg-gray-800 rounded-md text-white">
                {user?.email}
              </div>
            </div>
            
            <div>
              <Label className="text-gray-300">Role</Label>
              <div className="mt-1 p-3 bg-gray-800 rounded-md text-white capitalize">
                {user?.role}
              </div>
            </div>
            
            <div>
              <Label className="text-gray-300">Category</Label>
              <div className="mt-1 p-3 bg-gray-800 rounded-md text-white">
                {categories[user?.category] || user?.category}
              </div>
            </div>

            {user?.role !== 'admin' && (
              <>
                <div>
                  <Label className="text-gray-300">Minutes Used</Label>
                  <div className="mt-1 p-3 bg-gray-800 rounded-md text-white">
                    {user?.minutes_used} / {user?.minutes_allocated}
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-300">Status</Label>
                  <div className="mt-1 p-3 bg-gray-800 rounded-md">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                      user?.status === 'active' ? 'bg-green-500' : 
                      user?.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {user?.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-[#00FFD1]" />
            Change Password
          </CardTitle>
          <p className="text-gray-400">Update your account password</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-gray-300">
                Current Password
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="new-password" className="text-gray-300">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-gray-300">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={changingPassword}
                className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
              >
                {changingPassword ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Changing...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={resetPasswordForm}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change PIN */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#00FFD1]" />
            Change PIN
          </CardTitle>
          <p className="text-gray-400">Update your security PIN for protected operations</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePinChange} className="space-y-4">
            <div>
              <Label htmlFor="current-pin" className="text-gray-300">
                Current PIN
              </Label>
              <div className="relative">
                <Input
                  id="current-pin"
                  type={showCurrentPin ? 'text' : 'password'}
                  value={pinForm.current_pin}
                  onChange={(e) => setPinForm({...pinForm, current_pin: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  maxLength={6}
                  pattern="[0-9]*"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showCurrentPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="new-pin" className="text-gray-300">
                New PIN (4-6 digits)
              </Label>
              <div className="relative">
                <Input
                  id="new-pin"
                  type={showNewPin ? 'text' : 'password'}
                  value={pinForm.new_pin}
                  onChange={(e) => setPinForm({...pinForm, new_pin: e.target.value.replace(/[^0-9]/g, '')})}
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  maxLength={6}
                  pattern="[0-9]*"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showNewPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-pin" className="text-gray-300">
                Confirm New PIN
              </Label>
              <Input
                id="confirm-pin"
                type="password"
                value={pinForm.confirm_pin}
                onChange={(e) => setPinForm({...pinForm, confirm_pin: e.target.value.replace(/[^0-9]/g, '')})}
                className="bg-gray-800 border-gray-700 text-white"
                maxLength={6}
                pattern="[0-9]*"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={changingPin}
                className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
              >
                {changingPin ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Changing...
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Change PIN
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={resetPinForm}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Notes */}
      <Card className="bg-blue-900/20 border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Security Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-300 text-sm space-y-2">
          <ul className="list-disc list-inside space-y-1">
            <li>Use a strong password with at least 8 characters</li>
            <li>Your PIN is required for sensitive operations like bot control and lead uploads</li>
            <li>Keep your credentials secure and don't share them with others</li>
            <li>Contact your admin if you forget your credentials</li>
            <li>For demo purposes, the current password is "pass"</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;