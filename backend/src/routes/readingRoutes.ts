import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  getAllReadings,
  getReadingById,
  createReading,
  createReadingValidation
} from '../controllers/readingController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/readings:
 *   get:
 *     tags: [Readings]
 *     summary: Get all readings
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllReadings);

/**
 * @swagger
 * /api/readings/{id}:
 *   get:
 *     tags: [Readings]
 *     summary: Get reading by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getReadingById);

/**
 * @swagger
 * /api/readings:
 *   post:
 *     tags: [Readings]
 *     summary: Create new reading
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(createReadingValidation), createReading);

export default router;
