import { Router } from 'express';
import { generateMonthlyReadingsReport, generateConsumptionReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All report routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/reports/monthly-readings
 * @desc    Generate monthly readings report (PDF)
 * @access  Private
 */
router.get('/monthly-readings', generateMonthlyReadingsReport);

/**
 * @route   GET /api/reports/consumption-evolution
 * @desc    Generate consumption evolution report (PDF)
 * @access  Private
 */
router.get('/consumption-evolution', generateConsumptionReport);

export default router;
