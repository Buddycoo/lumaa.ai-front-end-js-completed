import express from 'express';
import { prisma } from '../server';
import { AuthRequest, authenticateToken, requireAdmin } from '../middleware/auth';
import { botSettingsSchema, validateRequest } from '../utils/validation';

const router = express.Router();

// GET /api/system/status
router.get('/status', authenticateToken, async (req, res, next) => {
  try {
    const systemStatus = await prisma.systemStatus.findMany();
    
    const status = systemStatus.reduce((acc, service) => {
      acc[service.serviceName] = {
        enabled: service.isEnabled,
        updatedAt: service.updatedAt
      };
      return acc;
    }, {} as Record<string, any>);
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// POST /api/system/toggle - Admin only
router.post('/toggle', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { serviceName } = req.body;
    const userId = req.user!.id;
    
    if (!['ai', 'calls', 'whatsapp'].includes(serviceName)) {
      return res.status(400).json({ error: 'Invalid service name' });
    }
    
    // Get current status
    let service = await prisma.systemStatus.findUnique({
      where: { serviceName }
    });
    
    if (!service) {
      // Create if doesn't exist
      service = await prisma.systemStatus.create({
        data: {
          serviceName,
          isEnabled: false,
          updatedBy: userId
        }
      });
    }
    
    // Toggle status
    const updatedService = await prisma.systemStatus.update({
      where: { serviceName },
      data: {
        isEnabled: !service.isEnabled,
        updatedBy: userId
      }
    });
    
    res.json({
      serviceName: updatedService.serviceName,
      enabled: updatedService.isEnabled,
      updatedAt: updatedService.updatedAt
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/system/bot-settings
router.get('/bot-settings', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    let botSettings = await prisma.botSetting.findFirst({
      where: { userId }
    });
    
    if (!botSettings) {
      // Create default settings if none exist
      botSettings = await prisma.botSetting.create({
        data: { userId }
      });
    }
    
    res.json(botSettings);
  } catch (error) {
    next(error);
  }
});

// POST /api/system/bot-settings
router.post('/bot-settings', authenticateToken, validateRequest(botSettingsSchema), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { openingMessage, model, temperature, responseLength, category } = req.body;
    
    const botSettings = await prisma.botSetting.upsert({
      where: { userId },
      update: {
        openingMessage,
        model,
        temperature,
        responseLength,
        category
      },
      create: {
        userId,
        openingMessage,
        model,
        temperature,
        responseLength,
        category
      }
    });
    
    res.json(botSettings);
  } catch (error) {
    next(error);
  }
});

export default router;