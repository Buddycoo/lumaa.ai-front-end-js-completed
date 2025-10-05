import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../server';
import { User } from '@prisma/client';

export const configurePassport = () => {
  // JWT Strategy
  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!,
  }, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with Google ID
      let user = await prisma.user.findUnique({
        where: { googleId: profile.id }
      });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      user = await prisma.user.findUnique({
        where: { email: profile.emails![0].value }
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id }
        });
        return done(null, user);
      }

      // Create new user (only if admin has pre-created the email)
      // For security, we don't auto-create users via OAuth
      return done(null, false, { message: 'Account not found. Please contact admin.' });
    } catch (error) {
      return done(error, false);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};