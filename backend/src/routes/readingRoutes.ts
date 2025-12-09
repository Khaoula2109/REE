import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllReadings,
  getReadingById,
  createReading,
  getMeterReadingHistory,
  exportReadings,
} from '../controllers/readingController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// All reading routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/readings
 * @desc    Get all readings with filters
 * @access  Private
 */
router.get('/', getAllReadings);

/**
 * @route   GET /api/readings/export
 * @desc    Export readings to CSV
 * @access  Private
 */
router.get('/export', exportReadings);

/**
 * @route   GET /api/readings/meter/:meterId
 * @desc    Get reading history for a meter
 * @access  Private
 */
router.get('/meter/:meterId', getMeterReadingHistory);

/**
 * @route   GET /api/readings/:id
 * @desc    Get reading by ID
 * @access  Private
 */
router.get('/:id', getReadingById);

/**
 * @route   POST /api/readings
 * @desc    Create new reading
 * @access  Private
 */
router.post(
  '/',
  validate([
    body('meterId').notEmpty().withMessage('ID du compteur requis'),
    body('agentId').notEmpty().withMessage('ID de l\'agent requis'),
    body('currentIndex').isFloat({ min: 0 }).withMessage('Index actuel invalide'),
    body('readingDate').optional().isISO8601().withMessage('Date invalide'),
  ]),
  createReading
);

export default router;
