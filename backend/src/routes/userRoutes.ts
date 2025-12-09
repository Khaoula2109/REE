import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { validate } from '../middleware/validator';

const router = Router();

// All user routes require authentication and SUPERADMIN role
router.use(authenticate);
router.use(authorize(UserRole.SUPERADMIN));

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (SUPERADMIN)
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (SUPERADMIN)
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (SUPERADMIN)
 */
router.post(
  '/',
  validate([
    body('lastName').notEmpty().withMessage('Nom requis'),
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('role').optional().isIn(Object.values(UserRole)).withMessage('Rôle invalide'),
  ]),
  createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (SUPERADMIN)
 */
router.put(
  '/:id',
  validate([
    body('lastName').optional().notEmpty().withMessage('Nom requis'),
    body('firstName').optional().notEmpty().withMessage('Prénom requis'),
    body('role').optional().isIn(Object.values(UserRole)).withMessage('Rôle invalide'),
  ]),
  updateUser
);

/**
 * @route   POST /api/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (SUPERADMIN)
 */
router.post('/:id/reset-password', resetUserPassword);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (SUPERADMIN)
 */
router.delete('/:id', deleteUser);

export default router;
