import { Router } from 'express';
import { sendToBilling, getBillingStats } from '../controllers/billingController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

// All billing routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/billing/stats
 * @desc    Get billing export statistics
 * @access  Private
 */
router.get('/stats', getBillingStats);

/**
 * @route   POST /api/billing/send
 * @desc    Send readings data to SI Facturation
 * @access  Private (Admin only)
 * @query   startDate (optional) - Start date filter (ISO format)
 * @query   endDate (optional) - End date filter (ISO format)
 */
router.post('/send', authorize([UserRole.SUPERADMIN, UserRole.USER]), sendToBilling);

export default router;
