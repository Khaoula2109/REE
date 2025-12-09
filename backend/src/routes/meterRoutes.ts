import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllMeters,
  getMeterById,
  getAvailableAddresses,
  createMeter,
  updateMeter,
  deleteMeter,
} from '../controllers/meterController';
import { authenticate } from '../middleware/auth';
import { MeterType } from '../models/Meter';
import { validate } from '../middleware/validator';

const router = Router();

// All meter routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/meters
 * @desc    Get all meters
 * @access  Private
 */
router.get('/', getAllMeters);

/**
 * @route   GET /api/meters/available-addresses
 * @desc    Get addresses without meters
 * @access  Private
 */
router.get('/available-addresses', getAvailableAddresses);

/**
 * @route   GET /api/meters/:id
 * @desc    Get meter by ID
 * @access  Private
 */
router.get('/:id', getMeterById);

/**
 * @route   POST /api/meters
 * @desc    Create new meter
 * @access  Private
 */
router.post(
  '/',
  validate([
    body('addressId').notEmpty().withMessage('Adresse requise'),
    body('meterType').isIn(Object.values(MeterType)).withMessage('Type de compteur invalide'),
  ]),
  createMeter
);

/**
 * @route   PUT /api/meters/:id
 * @desc    Update meter
 * @access  Private
 */
router.put(
  '/:id',
  validate([
    body('addressId').optional().notEmpty().withMessage('Adresse requise'),
    body('meterType').optional().isIn(Object.values(MeterType)).withMessage('Type de compteur invalide'),
  ]),
  updateMeter
);

/**
 * @route   DELETE /api/meters/:id
 * @desc    Delete meter
 * @access  Private
 */
router.delete('/:id', deleteMeter);

export default router;
