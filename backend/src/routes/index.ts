import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import dashboardRoutes from './dashboardRoutes';
import readingRoutes from './readingRoutes';
import agentRoutes from './agentRoutes';
import meterRoutes from './meterRoutes';
import reportRoutes from './reportRoutes';
import districtRoutes from './districtRoutes';
import billingRoutes from './billingRoutes';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/readings', readingRoutes);
router.use('/agents', agentRoutes);
router.use('/meters', meterRoutes);
router.use('/reports', reportRoutes);
router.use('/districts', districtRoutes);
router.use('/billing', billingRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

export default router;
