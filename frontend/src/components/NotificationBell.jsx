import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Mail, User, MessageSquare, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'contact_form':
        return <Mail className="h-4 w-4 text-blue-400" />;
      case 'admin_update':
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) fetchNotifications();
        }}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-[#00FFD1] text-black text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <Card className="absolute right-0 mt-2 w-96 bg-gray-900 border-gray-800 shadow-xl z-50 max-h-[500px] overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Notifications</h3>
              <p className="text-xs text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={`p-4 hover:bg-gray-800 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-gray-800/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="h-2 w-2 bg-[#00FFD1] rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* Contact Form Details */}
                        {notification.type === 'contact_form' && notification.contact_email && (
                          <div className="mt-2 p-2 bg-gray-800 rounded text-xs space-y-1">
                            <p className="text-gray-300">
                              <span className="text-gray-500">From:</span> {notification.contact_name}
                            </p>
                            <p className="text-gray-300">
                              <span className="text-gray-500">Email:</span> {notification.contact_email}
                            </p>
                            {notification.contact_phone && (
                              <p className="text-gray-300">
                                <span className="text-gray-500">Phone:</span> {notification.contact_phone}
                              </p>
                            )}
                            {notification.contact_company && (
                              <p className="text-gray-300">
                                <span className="text-gray-500">Company:</span> {notification.contact_company}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-800 text-center">
              <Button
                onClick={() => {
                  setShowDropdown(false);
                  // Could navigate to a full notifications page
                }}
                variant="ghost"
                className="text-[#00FFD1] hover:text-[#00FFD1]/80 text-sm"
              >
                View All Notifications
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default NotificationBell;