import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCoverageRate,
  getReadingsPerAgent,
  getConsumptionEvolution
} from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/coverage-rate:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get coverage rate statistics
 *     security:
 *       - bearerAuth: []
 */
router.get('/coverage-rate', getCoverageRate);

/**
 * @swagger
 * /api/dashboard/readings-per-agent:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get readings per agent statistics
 *     security:
 *       - bearerAuth: []
 */
router.get('/readings-per-agent', getReadingsPerAgent);

/**
 * @swagger
 * /api/dashboard/consumption-evolution:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get consumption evolution data
 *     security:
 *       - bearerAuth: []
 */
router.get('/consumption-evolution', getConsumptionEvolution);

export default router;
