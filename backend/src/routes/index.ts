import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import dashboardRoutes from './dashboardRoutes';
import agentRoutes from './agentRoutes';
import meterRoutes from './meterRoutes';
import readingRoutes from './readingRoutes';
import reportRoutes from './reportRoutes';
import districtRoutes from './districtRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/agents', agentRoutes);
router.use('/meters', meterRoutes);
router.use('/readings', readingRoutes);
router.use('/reports', reportRoutes);
router.use('/districts', districtRoutes);

export default router;
