import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import {
  getAllUsers,
  getUserById,
  createUser,
  createUserValidation,
  updateUser,
  updateUserValidation,
  resetUserPassword
} from '../controllers/userController';

const router = Router();

// All routes require authentication and SUPERADMIN role
router.use(authenticate, authorize(UserRole.SUPERADMIN));

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(createUserValidation), createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', validate(updateUserValidation), updateUser);

/**
 * @swagger
 * /api/users/{id}/reset-password:
 *   post:
 *     tags: [Users]
 *     summary: Reset user password
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/reset-password', resetUserPassword);

export default router;
