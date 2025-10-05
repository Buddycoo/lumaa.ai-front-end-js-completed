import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateTokens = (user: User) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const generateResetToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '1h'
  });
};