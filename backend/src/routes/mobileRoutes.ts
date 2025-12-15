import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAddressesToVisit,
  createReading,
  getAgentStats,
  getAgentHistory,
} from '../controllers/mobileController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// All mobile routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/mobile/addresses
 * @desc    Get list of addresses to visit (not read this month)
 * @access  Private (Agent)
 */
router.get('/addresses', getAddressesToVisit);

/**
 * @route   POST /api/mobile/readings
 * @desc    Create a new reading from mobile app
 * @access  Private (Agent)
 */
router.post(
  '/readings',
  validate([
    body('meterId').notEmpty().withMessage('ID du compteur requis'),
    body('currentIndex').isFloat({ min: 0 }).withMessage('Index actuel invalide'),
    body('readingDate').optional().isISO8601().withMessage('Date invalide'),
  ]),
  createReading
);

/**
 * @route   GET /api/mobile/stats
 * @desc    Get agent statistics (today, this month, total, average)
 * @access  Private (Agent)
 */
router.get('/stats', getAgentStats);

/**
 * @route   GET /api/mobile/history
 * @desc    Get agent reading history
 * @access  Private (Agent)
 * @query   limit - Number of readings to return (default: 50)
 * @query   offset - Offset for pagination (default: 0)
 */
router.get('/history', getAgentHistory);

export default router;
