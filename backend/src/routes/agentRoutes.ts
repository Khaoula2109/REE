import { Router } from 'express';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
  getAllAgents,
  getAgentById,
  updateAgent,
  updateAgentValidation,
  getAgentPerformance
} from '../controllers/agentController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/agents:
 *   get:
 *     tags: [Agents]
 *     summary: Get all agents
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getAllAgents);

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', getAgentById);

/**
 * @swagger
 * /api/agents/{id}:
 *   put:
 *     tags: [Agents]
 *     summary: Update agent
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', validate(updateAgentValidation), updateAgent);

/**
 * @swagger
 * /api/agents/{id}/performance:
 *   get:
 *     tags: [Agents]
 *     summary: Get agent performance metrics
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/performance', getAgentPerformance);

export default router;
