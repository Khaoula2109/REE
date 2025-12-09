import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import db from '../config/database';
import { hashPassword, generateRandomPassword } from '../utils/password';
import { formatName } from '../utils/formatters';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, User, UserRole } from '../types';
import emailService from '../services/emailService';

export const createUserValidation = [
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('role').isIn(['SUPERADMIN', 'USER']).withMessage('Invalid role')
];

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, sortBy = 'name' } = req.query;

    let query = db('users').select(
      'id',
      'last_name as lastName',
      'first_name as firstName',
      'email',
      'role',
      'created_at as createdAt',
      'updated_at as updatedAt'
    );

    if (role) {
      query = query.where({ role });
    }

    if (sortBy === 'role') {
      query = query.orderBy('role', 'asc');
    } else {
      query = query.orderBy('last_name', 'asc').orderBy('first_name', 'asc');
    }

    const users = await query;

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await db('users')
      .where({ id })
      .select(
        'id',
        'last_name as lastName',
        'first_name as firstName',
        'email',
        'role',
        'must_change_password as mustChangePassword',
        'created_at as createdAt',
        'updated_at as updatedAt'
      )
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lastName, firstName, email, role } = req.body;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    const formattedLastName = formatName(lastName, true);
    const formattedFirstName = formatName(firstName, false);

    const password = generateRandomPassword();
    const hashedPassword = await hashPassword(password);

    const [userId] = await db('users').insert({
      last_name: formattedLastName,
      first_name: formattedFirstName,
      email,
      password: hashedPassword,
      role,
      must_change_password: true
    });

    await emailService.sendWelcomeEmail(email, formattedFirstName, password);

    const user = await db('users')
      .where({ id: userId })
      .select(
        'id',
        'last_name as lastName',
        'first_name as firstName',
        'email',
        'role',
        'created_at as createdAt'
      )
      .first();

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserValidation = [
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('role').optional().isIn(['SUPERADMIN', 'USER']).withMessage('Invalid role')
];

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { lastName, firstName, role } = req.body;

    const user = await db('users').where({ id }).first();
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updates: any = {
      updated_at: db.fn.now()
    };

    if (lastName) updates.last_name = formatName(lastName, true);
    if (firstName) updates.first_name = formatName(firstName, false);
    if (role) updates.role = role;

    await db('users').where({ id }).update(updates);

    const updatedUser = await db('users')
      .where({ id })
      .select(
        'id',
        'last_name as lastName',
        'first_name as firstName',
        'email',
        'role',
        'updated_at as updatedAt'
      )
      .first();

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await db('users')
      .where({ id })
      .select('id', 'email', 'first_name as firstName')
      .first();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(newPassword);

    await db('users')
      .where({ id })
      .update({
        password: hashedPassword,
        must_change_password: true,
        updated_at: db.fn.now()
      });

    await emailService.sendPasswordResetEmail(user.email, user.firstName, newPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};
