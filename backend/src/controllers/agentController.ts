import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Agent from '../models/Agent';
import District from '../models/District';
import Reading from '../models/Reading';

/**
 * Get all agents with filters
 */
export const getAllAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { districtId, sortBy = 'lastName', order = 'ASC', search } = req.query;

    // Build filters
    const where: any = {};
    if (districtId) {
      where.districtId = districtId;
    }

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    const agents = await Agent.findAll({
      where,
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
        },
      ],
      order: [[sortBy as string, order as string]],
    });

    res.json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des agents' });
  }
};

/**
 * Get agent by ID with performance metrics
 */
export const getAgentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByPk(id, {
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    if (!agent) {
      res.status(404).json({ error: 'Agent non trouvé' });
      return;
    }

    res.json(agent);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'agent' });
  }
};

/**
 * Get agent performance metrics
 */
export const getAgentPerformance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startDate, endDate, period = '3months' } = req.query;

    // Calculate date range
    let start: Date;
    const end: Date = endDate ? new Date(endDate as string) : new Date();

    if (startDate) {
      start = new Date(startDate as string);
    } else {
      // Default based on period
      start = new Date();
      switch (period) {
        case '1week':
          start.setDate(start.getDate() - 7);
          break;
        case '1month':
          start.setMonth(start.getMonth() - 1);
          break;
        case '3months':
          start.setMonth(start.getMonth() - 3);
          break;
        case '6months':
          start.setMonth(start.getMonth() - 6);
          break;
        case '1year':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setMonth(start.getMonth() - 3);
      }
    }

    // Get daily readings count
    const dailyReadings = await Reading.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('reading_date')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      where: {
        agentId: id,
        readingDate: {
          [Op.between]: [start, end],
        },
      },
      group: [sequelize.fn('DATE', sequelize.col('reading_date'))],
      order: [[sequelize.fn('DATE', sequelize.col('reading_date')), 'ASC']],
      raw: true,
    });

    // Calculate average
    const totalReadings = dailyReadings.reduce((sum: number, day: any) => sum + parseInt(day.count), 0);
    const avgPerDay = dailyReadings.length > 0 ? totalReadings / dailyReadings.length : 0;

    res.json({
      period: {
        start,
        end,
      },
      dailyReadings: dailyReadings.map((day: any) => ({
        date: day.date,
        count: parseInt(day.count),
      })),
      avgReadingsPerDay: Math.round(avgPerDay * 100) / 100,
      totalReadings,
      daysWorked: dailyReadings.length,
    });
  } catch (error) {
    console.error('Get agent performance error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des performances' });
  }
};

/**
 * Update agent (mainly for district assignment)
 */
export const updateAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { districtId, lastName, firstName, personalPhone, professionalPhone } = req.body;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      res.status(404).json({ error: 'Agent non trouvé' });
      return;
    }

    // Update fields
    if (districtId !== undefined) agent.districtId = districtId;
    if (lastName !== undefined) agent.lastName = lastName;
    if (firstName !== undefined) agent.firstName = firstName;
    if (personalPhone !== undefined) agent.personalPhone = personalPhone;
    if (professionalPhone !== undefined) agent.professionalPhone = professionalPhone;

    await agent.save();

    // Get updated agent with associations
    const updatedAgent = await Agent.findByPk(id, {
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    res.json(updatedAgent);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'agent' });
  }
};

/**
 * Create agent
 */
export const createAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lastName, firstName, personalPhone, professionalPhone, districtId } = req.body;

    const agent = await Agent.create({
      lastName,
      firstName,
      personalPhone,
      professionalPhone,
      districtId,
    });

    // Get agent with associations
    const fullAgent = await Agent.findByPk(agent.id, {
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
        },
      ],
    });

    res.status(201).json(fullAgent);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'agent' });
  }
};

/**
 * Delete agent
 */
export const deleteAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByPk(id);

    if (!agent) {
      res.status(404).json({ error: 'Agent non trouvé' });
      return;
    }

    // Check if agent has readings
    const readingsCount = await Reading.count({ where: { agentId: id } });

    if (readingsCount > 0) {
      res.status(400).json({ error: 'Impossible de supprimer un agent avec des relevés existants' });
      return;
    }

    await agent.destroy();

    res.json({ message: 'Agent supprimé avec succès' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'agent' });
  }
};
