import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateMonthlyReadingsReport,
  generateConsumptionEvolutionReport
} from '../controllers/reportController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/reports/monthly-readings:
 *   get:
 *     tags: [Reports]
 *     summary: Generate monthly readings report (PDF)
 *     security:
 *       - bearerAuth: []
 */
router.get('/monthly-readings', generateMonthlyReadingsReport);

/**
 * @swagger
 * /api/reports/consumption-evolution:
 *   get:
 *     tags: [Reports]
 *     summary: Generate consumption evolution report (PDF)
 *     security:
 *       - bearerAuth: []
 */
router.get('/consumption-evolution', generateConsumptionEvolutionReport);

export default router;
