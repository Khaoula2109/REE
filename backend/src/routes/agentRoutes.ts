import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllAgents,
  getAgentById,
  getAgentPerformance,
  updateAgent,
  createAgent,
  deleteAgent,
} from '../controllers/agentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';

const router = Router();

// All agent routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/agents
 * @desc    Get all agents
 * @access  Private
 */
router.get('/', getAllAgents);

/**
 * @route   GET /api/agents/:id
 * @desc    Get agent by ID
 * @access  Private
 */
router.get('/:id', getAgentById);

/**
 * @route   GET /api/agents/:id/performance
 * @desc    Get agent performance metrics
 * @access  Private
 */
router.get('/:id/performance', getAgentPerformance);

/**
 * @route   POST /api/agents
 * @desc    Create new agent
 * @access  Private
 */
router.post(
  '/',
  validate([
    body('lastName').notEmpty().withMessage('Nom requis'),
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('personalPhone').notEmpty().withMessage('Téléphone personnel requis'),
    body('districtId').notEmpty().withMessage('Quartier requis'),
  ]),
  createAgent
);

/**
 * @route   PUT /api/agents/:id
 * @desc    Update agent
 * @access  Private
 */
router.put(
  '/:id',
  validate([
    body('lastName').optional().notEmpty().withMessage('Nom requis'),
    body('firstName').optional().notEmpty().withMessage('Prénom requis'),
    body('personalPhone').optional().notEmpty().withMessage('Téléphone personnel requis'),
    body('districtId').optional().notEmpty().withMessage('Quartier requis'),
  ]),
  updateAgent
);

/**
 * @route   DELETE /api/agents/:id
 * @desc    Delete agent
 * @access  Private
 */
router.delete('/:id', deleteAgent);

export default router;
