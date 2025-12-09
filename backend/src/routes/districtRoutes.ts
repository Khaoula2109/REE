import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAllDistricts } from '../controllers/districtController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/districts:
 *   get:
 *     tags: [Districts]
 *     summary: Get all districts
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllDistricts);

export default router;
