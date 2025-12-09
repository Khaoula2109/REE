import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import db from '../config/database';
import { comparePassword, hashPassword, isPasswordValid } from '../utils/password';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, User } from '../types';

export const loginValidation = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await db('users')
      .where({ email })
      .first<User>();

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        lastName: user.lastName,
        firstName: user.firstName,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const payload = verifyToken(refreshToken);
    if (!payload) {
      throw new AppError('Invalid refresh token', 401);
    }

    const newToken = generateToken(payload);

    res.json({
      message: 'Token refreshed',
      token: newToken
    });
  } catch (error) {
    next(error);
  }
};

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required')
];

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const validation = isPasswordValid(newPassword);
    if (!validation.valid) {
      throw new AppError(validation.message!, 400);
    }

    const user = await db('users')
      .where({ id: userId })
      .first<User>();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await db('users')
      .where({ id: userId })
      .update({
        password: hashedPassword,
        must_change_password: false,
        updated_at: db.fn.now()
      });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};
