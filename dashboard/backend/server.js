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