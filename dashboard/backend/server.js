const express = require('express');
const cors = require('cors');
require('dotenv').config();

const prisma = require('./utils/db');
const { generateTokens, verifyToken, verifyAdmin, hashPassword, comparePassword } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'dashboard-backend', database: 'PostgreSQL' });
});

// ========================================
// AUTH ROUTES
// ========================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || password !== 'pass') {
      return res.status(401).json({ detail: 'Invalid credentials - use password: pass' });
    }
    
    // Allow paused users to login - they see blocking modal
    
    const tokens = generateTokens(user);
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        category: user.category,
        status: user.status,
        pause_reason: user.pauseReason,
        minutes_used: user.minUsed,
        minutes_allocated: user.minSubscribed,
        revenue_generated: user.revenueGenerated,
        created_at: user.createdAt
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    });
    
    if (!user) {
      return res.status(404).json({ detail: 'User not found' });
    }
    
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      status: user.status,
      pause_reason: user.pauseReason,
      minutes_used: user.minUsed,
      minutes_allocated: user.minSubscribed,
      created_at: user.createdAt
    };
    
    if (user.role === 'admin') {
      userData.revenue_generated = user.revenueGenerated;
    }
    
    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ detail: 'Failed to get user' });
  }
});

// Change password
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    
    if (current_password !== 'pass') {
      return res.status(400).json({ detail: 'Current password is incorrect' });
    }
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: new_password }
    });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ detail: 'Failed to change password' });
  }
});

// Forgot password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.json({ message: 'If the email exists, a verification code has been sent' });
    }
    
    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetCode,
        resetTokenExpiry: expiry
      }
    });
    
    res.json({ 
      message: 'Verification code generated',
      code: resetCode // TODO: Remove in production, send via email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ detail: 'Failed to send reset code' });
  }
});

// Verify reset code
app.post('/api/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ detail: 'Invalid or expired verification code' });
    }
    
    if (user.resetToken !== code || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ detail: 'Invalid or expired verification code' });
    }
    
    res.json({ message: 'Code verified successfully' });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ detail: 'Failed to verify code' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ detail: 'Invalid or expired verification code' });
    }
    
    if (user.resetToken !== code || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ detail: 'Invalid or expired verification code' });
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: new_password,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ detail: 'Failed to reset password' });
  }
});

// Verify PIN
app.post('/api/auth/verify-pin', verifyToken, async (req, res) => {
  try {
    const { pin } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id } 
    });
    
    if (user.pinCode !== pin) {
      return res.status(401).json({ detail: 'Invalid PIN' });
    }
    
    res.json({ message: 'PIN verified successfully' });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ detail: 'Failed to verify PIN' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Dashboard Backend running on http://localhost:${PORT}`);
});

// ========================================
// ADMIN ROUTES CONTINUED
// ========================================

// Get all users
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      category: u.category,
      status: u.status,
      pause_reason: u.pauseReason,
      minutes_used: u.minUsed,
      minutes_allocated: u.minSubscribed,
      revenue_generated: u.revenueGenerated,
      credits_balance: u.creditsRemaining,
      monthly_cost: u.monthlyPlanCost,
      created_at: u.createdAt
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ detail: 'Failed to get users' });
  }
});

// Create, pause, resume users routes... (add all other routes here)
// Create user
app.post('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, category, pin_code, minutes_allocated, sip_endpoints, concurrency } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ detail: 'Email already exists' });
    }
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: password || 'pass',
        category,
        pinCode: pin_code,
        minSubscribed: minutes_allocated || 1000,
        sipEndpoints: sip_endpoints,
        concurrency: concurrency || 5
      }
    });
    
    res.json({ message: 'User created successfully', user_id: user.id });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ detail: 'Failed to create user' });
  }
});

// Update user
app.put('/api/admin/users/:userId', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.userId },
      data: req.body
    });
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(404).json({ detail: 'User not found' });
  }
});

// Pause user
app.post('/api/admin/users/:userId/pause', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason, admin_pin } = req.body;
    
    if (admin_pin !== '1509') {
      return res.status(403).json({ detail: 'Invalid PIN. Admin PIN required to pause users.' });
    }
    
    await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        status: 'PAUSED',
        pauseReason: reason
      }
    });
    
    res.json({ message: 'User paused successfully', reason });
  } catch (error) {
    console.error('Pause user error:', error);
    res.status(404).json({ detail: 'User not found' });
  }
});

// Resume user
app.post('/api/admin/users/:userId/resume', verifyToken, verifyAdmin, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        status: 'ACTIVE',
        pauseReason: null
      }
    });
    
    res.json({ message: 'User resumed successfully' });
  } catch (error) {
    console.error('Resume user error:', error);
    res.status(404).json({ detail: 'User not found' });
  }
});

// Pause all users
app.post('/api/admin/users/pause-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason, admin_pin } = req.body;
    
    if (admin_pin !== '1509') {
      return res.status(403).json({ detail: 'Invalid PIN. Admin PIN required to pause all users.' });
    }
    
    const result = await prisma.user.updateMany({
      where: { role: 'USER', status: 'ACTIVE' },
      data: {
        status: 'PAUSED',
        pauseReason: reason
      }
    });
    
    res.json({ 
      message: `Paused ${result.count} user(s) successfully`,
      count: result.count,
      reason
    });
  } catch (error) {
    console.error('Pause all error:', error);
    res.status(500).json({ detail: 'Failed to pause users' });
  }
});

// Resume all users
app.post('/api/admin/users/resume-all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await prisma.user.updateMany({
      where: { role: 'USER', status: 'PAUSED' },
      data: {
        status: 'ACTIVE',
        pauseReason: null
      }
    });
    
    res.json({ 
      message: `Resumed ${result.count} user(s) successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Resume all error:', error);
    res.status(500).json({ detail: 'Failed to resume users' });
  }
});

// Admin overview
app.get('/api/admin/overview', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' }
    });
    
    const totalRevenue = users.reduce((sum, u) => sum + (u.revenueGenerated || 0), 0);
    const totalMinutesUsed = users.reduce((sum, u) => sum + (u.minUsed || 0), 0);
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
    
    const topUsers = users
      .sort((a, b) => (b.revenueGenerated || 0) - (a.revenueGenerated || 0))
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        revenue: u.revenueGenerated || 0,
        minutes_used: u.minUsed || 0,
        category: u.category
      }));
    
    res.json({
      total_revenue: totalRevenue,
      total_minutes_used: totalMinutesUsed,
      total_users: users.length,
      active_users: activeUsers,
      top_users: topUsers
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ detail: 'Failed to get overview' });
  }
});

// Notifications
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const where = req.user.role === 'admin' 
      ? { userId: null } 
      : { userId: req.user.id };
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    res.json(notifications.map(n => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      is_read: n.isRead,
      contact_name: n.contactName,
      contact_email: n.contactEmail,
      contact_phone: n.contactPhone,
      contact_company: n.contactCompany,
      created_at: n.createdAt
    })));
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ detail: 'Failed to get notifications' });
  }
});

// Get unread count
app.get('/api/notifications/unread-count', verifyToken, async (req, res) => {
  try {
    const where = req.user.role === 'admin' 
      ? { userId: null, isRead: false } 
      : { userId: req.user.id, isRead: false };
    
    const count = await prisma.notification.count({ where });
    
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ detail: 'Failed to get count' });
  }
});

// Mark as read
app.post('/api/notifications/:notificationId/read', verifyToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.notificationId },
      data: { isRead: true }
    });
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(404).json({ detail: 'Notification not found' });
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, message } = req.body;
    
    await prisma.notification.create({
      data: {
        type: 'contact_form',
        title: `New Contact Form from ${name}`,
        message,
        contactName: name,
        contactEmail: email,
        contactPhone: phone,
        contactCompany: company
      }
    });
    
    res.json({ 
      message: 'Thank you for contacting us! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ detail: 'Failed to submit form' });
  }
});

// Send admin update
app.post('/api/admin/send-update', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { subject, message, recipient_type, category, recipient_ids } = req.body;
    
    let users = [];
    if (recipient_type === 'all') {
      users = await prisma.user.findMany({ where: { role: 'USER' } });
    } else if (recipient_type === 'category' && category) {
      users = await prisma.user.findMany({ where: { role: 'USER', category } });
    } else if (recipient_type === 'individual' && recipient_ids) {
      users = await prisma.user.findMany({ where: { id: { in: recipient_ids } } });
    }
    
    await Promise.all(users.map(user => 
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'admin_update',
          title: subject,
          message
        }
      })
    ));
    
    res.json({ 
      message: `Update sent to ${users.length} user(s)`,
      users_count: users.length
    });
  } catch (error) {
    console.error('Send update error:', error);
    res.status(500).json({ detail: 'Failed to send update' });
  }
});

// User call logs
app.get('/api/user/call-logs', verifyToken, async (req, res) => {
  try {
    const callLogs = await prisma.callLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(callLogs.map(log => ({
      id: log.id,
      call_date: log.callDate,
      call_time: log.callTime,
      duration: log.duration,
      call_outcome: log.callOutcome,
      lead_name: log.leadName,
      lead_phone: log.leadPhone,
      lead_email: log.leadEmail,
      notes: log.notes,
      created_at: log.createdAt
    })));
  } catch (error) {
    console.error('Get call logs error:', error);
    res.status(500).json({ detail: 'Failed to get call logs' });
  }
});

// User bot settings
app.get('/api/user/bot-settings', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    const categorySettings = await prisma.botSettings.findFirst({
      where: { category: user.category }
    });
    
    res.json({
      opening_message: user.prompt || categorySettings?.openingMessage,
      prompt: user.prompt,
      model: categorySettings?.model || 'gpt-4',
      temperature: categorySettings?.temperature || 0.7
    });
  } catch (error) {
    console.error('Get bot settings error:', error);
    res.status(500).json({ detail: 'Failed to get bot settings' });
  }
});

// Update user bot settings
app.put('/api/user/bot-settings', verifyToken, async (req, res) => {
  try {
    const { prompt, opening_message } = req.body;
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { prompt: prompt || opening_message }
    });
    
    res.json({ message: 'Bot settings updated successfully' });
  } catch (error) {
    console.error('Update bot settings error:', error);
    res.status(500).json({ detail: 'Failed to update bot settings' });
  }
});

// User leads
app.get('/api/user/leads', verifyToken, async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(leads);
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ detail: 'Failed to get leads' });
  }
});

// System status
app.get('/api/system/status', (req, res) => {
  res.json({ status: 'operational', database: 'PostgreSQL' });
});

