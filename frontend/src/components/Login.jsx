import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: email, 2: code, 3: new password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleGoogleLogin = () => {
    // For now, redirect to mock Google OAuth
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`;
  };
  
  // Forgot Password Handlers
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    
    try {
      const response = await axios.post('/api/auth/forgot-password', { email: forgotEmail });
      if (response.data.code) {
        // TODO: Remove this in production - code should be sent via email
        toast.success(`Reset code: ${response.data.code} (check console)`);
        console.log('Reset Code:', response.data.code);
      } else {
        toast.success('If the email exists, a verification code has been sent');
      }
      setForgotPasswordStep(2);
    } catch (error) {
      toast.error('Failed to send reset code');
    } finally {
      setResetLoading(false);
    }
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    
    try {
      await axios.post('/api/auth/verify-reset-code', {
        email: forgotEmail,
        code: resetCode
      });
      toast.success('Code verified! Set your new password');
      setForgotPasswordStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setResetLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setResetLoading(true);
    
    try {
      await axios.post('/api/auth/reset-password', {
        email: forgotEmail,
        code: resetCode,
        new_password: newPassword
      });
      toast.success('Password reset successfully! Please login');
      setShowForgotPassword(false);
      setForgotPasswordStep(1);
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };
  
  const resetForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#00FFD1] mb-2">
            Lumaa AI Dashboard
          </h1>
          <p className="text-gray-400">
            Sign in to access your AI calling platform
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {searchParams.get('error') === 'oauth_failed' && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-900/20 border border-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-sm">OAuth login failed. Please contact admin.</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-900/20 border border-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400 text-sm">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lumaa.ai"
                  required
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-400 hover:text-[#00FFD1] underline"
                >
                  Forgot Password?
                </button>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90 font-medium"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full mt-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </div>
            
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-400 font-medium">Demo Credentials:</p>
              <div className="bg-gray-800 p-3 rounded-md space-y-1">
                <p className="text-sm text-[#00FFD1]">👑 Admin: <span className="text-white">admin@lumaa.ai</span> / <span className="text-white">pass</span></p>
                <p className="text-sm text-blue-400">👤 User: <span className="text-white">user@lumaa.ai</span> / <span className="text-white">pass</span></p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-400 hover:text-[#00FFD1] underline"
              >
                ← Back to Homepage
              </button>
            </div>
          </CardContent>
        </Card>
        
        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border-gray-800 w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Reset Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {forgotPasswordStep === 1 && "Enter your email to receive a verification code"}
                  {forgotPasswordStep === 2 && "Enter the 6-digit code sent to your email"}
                  {forgotPasswordStep === 3 && "Enter your new password"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {forgotPasswordStep === 1 && (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-gray-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          placeholder="your@email.com"
                          className="bg-gray-800 border-gray-700 text-white pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={resetForgotPasswordModal}
                        variant="outline"
                        className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                      >
                        {resetLoading ? 'Sending...' : 'Send Code'}
                      </Button>
                    </div>
                  </form>
                )}
                
                {forgotPasswordStep === 2 && (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-code" className="text-gray-300">Verification Code</Label>
                      <Input
                        id="reset-code"
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        required
                        maxLength={6}
                        placeholder="123456"
                        className="bg-gray-800 border-gray-700 text-white text-center text-2xl tracking-widest"
                      />
                      <p className="text-xs text-gray-400">
                        Code sent to {forgotEmail}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => setForgotPasswordStep(1)}
                        variant="outline"
                        className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                      >
                        {resetLoading ? 'Verifying...' : 'Verify Code'}
                      </Button>
                    </div>
                  </form>
                )}
                
                {forgotPasswordStep === 3 && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-300">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="Min 8 characters"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password" className="text-gray-300">Confirm Password</Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={resetForgotPasswordModal}
                        variant="outline"
                        className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                      >
                        {resetLoading ? 'Resetting...' : 'Reset Password'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;