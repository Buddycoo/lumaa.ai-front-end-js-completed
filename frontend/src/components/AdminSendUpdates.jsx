import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Send, Users, Filter, Calendar, Mail, Bell, CheckCircle } from 'lucide-react';
import axios from 'axios';

const AdminSendUpdates = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    recipient_type: 'all', // all, category, individual
    category: '',
    recipient_ids: [],
    send_email: true,
    send_notification: true,
    scheduled_time: null
  });

  const categories = [
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'sales', label: 'Sales' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'automotive', label: 'Automotive' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.message) {
      toast.error('Subject and message are required');
      return;
    }

    if (formData.recipient_type === 'category' && !formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (formData.recipient_type === 'individual' && formData.recipient_ids.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/send-update', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`✅ Update sent to ${response.data.users_count} user(s)!`);
      
      // Reset form
      setFormData({
        subject: '',
        message: '',
        recipient_type: 'all',
        category: '',
        recipient_ids: [],
        send_email: true,
        send_notification: true,
        scheduled_time: null
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send update');
    } finally {
      setSending(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      recipient_ids: prev.recipient_ids.includes(userId)
        ? prev.recipient_ids.filter(id => id !== userId)
        : [...prev.recipient_ids, userId]
    }));
  };

  const getRecipientCount = () => {
    if (formData.recipient_type === 'all') return users.length;
    if (formData.recipient_type === 'category' && formData.category) {
      return users.filter(u => u.category === formData.category).length;
    }
    if (formData.recipient_type === 'individual') {
      return formData.recipient_ids.length;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Send Updates</h1>
        <p className="text-gray-400">
          Send announcements and updates to users via email and in-app notifications
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Compose Update</CardTitle>
            <CardDescription className="text-gray-400">
              Create a message to send to your users
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-gray-300">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., New Feature Release, System Maintenance"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Write your message here..."
                  rows={6}
                  className="bg-gray-800 border-gray-700 text-white resize-none"
                  required
                />
                <p className="text-xs text-gray-500">
                  {formData.message.length} characters
                </p>
              </div>

              {/* Recipient Type */}
              <div className="space-y-2">
                <Label className="text-gray-300">Recipients *</Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: 'all', category: '', recipient_ids: [] })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.recipient_type === 'all'
                        ? 'border-[#00FFD1] bg-[#00FFD1]/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <Users className={`h-5 w-5 mx-auto mb-2 ${
                      formData.recipient_type === 'all' ? 'text-[#00FFD1]' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.recipient_type === 'all' ? 'text-white' : 'text-gray-400'
                    }`}>
                      All Users
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: 'category', recipient_ids: [] })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.recipient_type === 'category'
                        ? 'border-[#00FFD1] bg-[#00FFD1]/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <Filter className={`h-5 w-5 mx-auto mb-2 ${
                      formData.recipient_type === 'category' ? 'text-[#00FFD1]' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.recipient_type === 'category' ? 'text-white' : 'text-gray-400'
                    }`}>
                      By Category
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: 'individual', category: '' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.recipient_type === 'individual'
                        ? 'border-[#00FFD1] bg-[#00FFD1]/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <CheckCircle className={`h-5 w-5 mx-auto mb-2 ${
                      formData.recipient_type === 'individual' ? 'text-[#00FFD1]' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.recipient_type === 'individual' ? 'text-white' : 'text-gray-400'
                    }`}>
                      Select Users
                    </p>
                  </button>
                </div>
              </div>

              {/* Category Selection */}
              {formData.recipient_type === 'category' && (
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">Select Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white"
                    required
                  >
                    <option value="">Choose a category...</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Individual User Selection */}
              {formData.recipient_type === 'individual' && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Users</Label>
                  <div className="max-h-64 overflow-y-auto border border-gray-700 rounded-lg bg-gray-800 p-3 space-y-2">
                    {users.map(user => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.recipient_ids.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <span className="text-xs text-gray-500 capitalize">
                          {user.category?.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Options */}
              <div className="space-y-3">
                <Label className="text-gray-300">Delivery Method</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.send_notification}
                      onChange={(e) => setFormData({ ...formData, send_notification: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Bell className="h-4 w-4 text-[#00FFD1]" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">In-App Notification</p>
                      <p className="text-xs text-gray-400">Send as notification in user dashboard</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.send_email}
                      onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Mail className="h-4 w-4 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Email</p>
                      <p className="text-xs text-gray-400">Send via email (AWS SES - configured later)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  Will be sent to <span className="text-[#00FFD1] font-semibold">{getRecipientCount()}</span> user(s)
                </div>
                <Button
                  type="submit"
                  disabled={sending || getRecipientCount() === 0}
                  className="bg-[#00FFD1] text-black hover:bg-[#00FFD1]/90"
                >
                  {sending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Update
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gray-900 border-gray-800 h-fit">
          <CardHeader>
            <CardTitle className="text-white text-lg">Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-[#00FFD1] mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium">In-App</p>
                  <p className="text-xs text-gray-400">Users see notifications in their dashboard bell icon</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium">Email (Coming Soon)</p>
                  <p className="text-xs text-gray-400">Requires AWS SES credentials configuration</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm text-white font-medium">Recipients</p>
                  <p className="text-xs text-gray-400">Choose all users, by category, or specific individuals</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                💡 Tip: Keep messages concise and actionable for better engagement
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSendUpdates;