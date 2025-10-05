import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('USER', 'ADMIN').default('USER'),
  minutesLeft: Joi.number().min(0).default(0)
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  minutesLeft: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
});

export const botSettingsSchema = Joi.object({
  openingMessage: Joi.string().max(500).required(),
  model: Joi.string().valid('GPT-4.1', 'Lumaa-Sales-LLM', 'GPT-3.5-Turbo').required(),
  temperature: Joi.number().min(0).max(1).required(),
  responseLength: Joi.number().min(50).max(500).required(),
  category: Joi.string().valid('sales', 'support', 'appointment').required()
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.details.map(d => d.message) 
      });
    }
    next();
  };
};