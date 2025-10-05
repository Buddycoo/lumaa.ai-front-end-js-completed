import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Login from '../components/Login';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh');
    
    if (token && refreshToken) {
      // Set tokens from OAuth callback
      useAuthStore.setState({
        accessToken: token,
        refreshToken: refreshToken,
        isAuthenticated: true
      });
      
      // Get user info
      // This would typically be handled by the auth store
      navigate('/dashboard');
    }
  }, [searchParams, navigate]);
  
  return <Login />;
};

export default LoginPage;