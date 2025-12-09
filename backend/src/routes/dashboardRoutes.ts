import { Router } from 'express';
import {
  getCoverageRate,
  getReadingsPerAgent,
  getConsumptionEvolution,
  getOverallStats,
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/coverage-rate
 * @desc    Get coverage rate by district
 * @access  Private
 */
router.get('/coverage-rate', getCoverageRate);

/**
 * @route   GET /api/dashboard/readings-per-agent
 * @desc    Get daily readings per agent
 * @access  Private
 */
router.get('/readings-per-agent', getReadingsPerAgent);

/**
 * @route   GET /api/dashboard/consumption-evolution
 * @desc    Get average consumption evolution
 * @access  Private
 */
router.get('/consumption-evolution', getConsumptionEvolution);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get overall statistics
 * @access  Private
 */
router.get('/stats', getOverallStats);

export default router;
