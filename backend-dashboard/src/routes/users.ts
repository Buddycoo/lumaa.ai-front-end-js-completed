import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { createUserSchema, updateUserSchema, validateRequest } from '../utils/validation';
import { createError } from '../middleware/errorHandler';

const router = express.Router();

// GET /api/users - Admin only
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          minutesUsed: true,
          minutesLeft: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { callLogs: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Admin only
router.post('/', authenticateToken, requireAdmin, validateRequest(createUserSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, minutesLeft } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER',
        minutesLeft: minutesLeft || 0
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        minutesUsed: true,
        minutesLeft: true,
        isActive: true,
        createdAt: true
      }
    });
    
    // Create default bot settings
    await prisma.botSetting.create({
      data: {
        userId: user.id
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - Admin only
router.put('/:id', authenticateToken, requireAdmin, validateRequest(updateUserSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        minutesUsed: true,
        minutesLeft: true,
        isActive: true,
        createdAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Admin only
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    
    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      throw createError('Cannot delete your own account', 400);
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:id/toggle - Admin only
router.post('/:id/toggle', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw createError('User not found', 404);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

export default router;