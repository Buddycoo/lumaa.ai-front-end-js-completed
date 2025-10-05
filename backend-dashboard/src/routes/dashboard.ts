import express from 'express';
import { prisma } from '../server';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);

    if (isAdmin) {
      // Admin stats - global metrics
      const [totalCalls, totalUsers, activeUsers, totalRevenue, systemStatus] = await Promise.all([
        prisma.callLog.count(),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.callLog.aggregate({ _sum: { cost: true } }),
        prisma.systemStatus.findMany()
      ]);

      // Recent call activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentCalls = await prisma.callLog.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: { id: true },
        _sum: { cost: true, duration: true }
      });

      const pickupRate = await prisma.callLog.groupBy({
        by: ['status'],
        _count: { id: true }
      });

      const successfulCalls = pickupRate.find(p => p.status === 'SUCCESS')?._count?.id || 0;
      const totalCallsCount = pickupRate.reduce((sum, p) => sum + p._count.id, 0);
      const pickupPercentage = totalCallsCount > 0 ? (successfulCalls / totalCallsCount) * 100 : 0;

      res.json({
        totalCalls,
        totalRevenue: totalRevenue._sum.cost || 0,
        activeClients: activeUsers,
        pickupRate: Math.round(pickupPercentage),
        systemStatus: systemStatus.reduce((acc, status) => {
          acc[status.serviceName] = status.isEnabled;
          return acc;
        }, {} as Record<string, boolean>),
        recentActivity: recentCalls.map(call => ({
          date: call.createdAt,
          calls: call._count.id,
          revenue: call._sum.cost || 0,
          minutes: call._sum.duration || 0
        }))
      });
    } else {
      // User stats - personal metrics
      const [userCalls, userRevenue, userSettings] = await Promise.all([
        prisma.callLog.count({ where: { userId: user.id } }),
        prisma.callLog.aggregate({ 
          where: { userId: user.id }, 
          _sum: { cost: true, duration: true } 
        }),
        prisma.botSetting.findFirst({ where: { userId: user.id } })
      ]);

      // User's pickup rate
      const userPickupStats = await prisma.callLog.groupBy({
        by: ['status'],
        where: { userId: user.id },
        _count: { id: true }
      });

      const userSuccessfulCalls = userPickupStats.find(p => p.status === 'SUCCESS')?._count?.id || 0;
      const userTotalCalls = userPickupStats.reduce((sum, p) => sum + p._count.id, 0);
      const userPickupRate = userTotalCalls > 0 ? (userSuccessfulCalls / userTotalCalls) * 100 : 0;

      // Get fresh user data for minutes
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { minutesUsed: true, minutesLeft: true }
      });

      res.json({
        callsMade: userCalls,
        pickupRate: Math.round(userPickupRate),
        revenue: userRevenue._sum.cost || 0,
        minutesUsed: userData?.minutesUsed || 0,
        minutesLeft: userData?.minutesLeft || 0,
        totalCost: userRevenue._sum.cost || 0,
        totalMinutes: userRevenue._sum.duration || 0,
        avgCostPerMinute: userRevenue._sum.duration ? 
          (userRevenue._sum.cost || 0) / userRevenue._sum.duration : 0,
        botActive: userSettings?.isActive || false
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/call-logs
router.get('/call-logs', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);
    
    const { page = 1, limit = 10, status, project, startDate, endDate } = req.query;
    
    const where: any = {};
    
    // Non-admin users can only see their own calls
    if (!isAdmin) {
      where.userId = user.id;
    }
    
    // Apply filters
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (project) {
      where.project = { contains: project as string, mode: 'insensitive' };
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const [callLogs, totalCount] = await Promise.all([
      prisma.callLog.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.callLog.count({ where })
    ]);
    
    res.json({
      callLogs,
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

// GET /api/dashboard/call-logs/:id
router.get('/call-logs/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user.role);
    
    const where: any = { id };
    if (!isAdmin) {
      where.userId = user.id;
    }
    
    const callLog = await prisma.callLog.findFirst({
      where,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    if (!callLog) {
      return res.status(404).json({ error: 'Call log not found' });
    }
    
    res.json(callLog);
  } catch (error) {
    next(error);
  }
});

export default router;