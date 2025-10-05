import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { prisma } from '../server';
import { generateTokens, verifyRefreshToken, generateResetToken } from '../utils/jwt';
import { loginSchema, validateRequest } from '../utils/validation';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      throw createError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError('Account is deactivated', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Return user data and tokens
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token required', 401);
    }

    const decoded = verifyRefreshToken(refreshToken);
    
    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.isActive) {
      throw createError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      const tokens = generateTokens(req.user as any);
      
      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?` +
        `token=${tokens.accessToken}&refresh=${tokens.refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  res.json({
    user: req.user
  });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
  // In a more complex setup, you'd add the token to a blacklist
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link will be sent.' });
    }

    const resetToken = generateResetToken(user.id);
    
    // TODO: Send email with reset link
    // For now, just return success
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ message: 'If the email exists, a reset link will be sent.' });
  } catch (error) {
    next(error);
  }
});

export default router;