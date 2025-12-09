import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  getAllMeters,
  getMeterById,
  createMeter,
  createMeterValidation,
  getAvailableAddresses
} from '../controllers/meterController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/meters:
 *   get:
 *     tags: [Meters]
 *     summary: Get all meters
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllMeters);

/**
 * @swagger
 * /api/meters/available-addresses:
 *   get:
 *     tags: [Meters]
 *     summary: Get addresses without meters
 *     security:
 *       - bearerAuth: []
 */
router.get('/available-addresses', getAvailableAddresses);

/**
 * @swagger
 * /api/meters/{id}:
 *   get:
 *     tags: [Meters]
 *     summary: Get meter by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getMeterById);

/**
 * @swagger
 * /api/meters:
 *   post:
 *     tags: [Meters]
 *     summary: Create new meter
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(createMeterValidation), createMeter);

export default router;
