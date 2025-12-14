import { Router } from 'express';
import { getAllDistricts } from '../controllers/districtController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All district routes require authentication
router.use(authenticate);

// Get all districts
router.get('/', getAllDistricts);

export default router;
