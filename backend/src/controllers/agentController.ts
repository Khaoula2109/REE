import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import db from '../config/database';
import { formatName } from '../utils/formatters';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export const getAllAgents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { districtId, search, sortBy = 'name' } = req.query;

    let query = db('agents')
      .select(
        'agents.id',
        'agents.first_name as firstName',
        'agents.last_name as lastName',
        'agents.personal_phone as personalPhone',
        'agents.professional_phone as professionalPhone',
        'agents.district_id as districtId',
        'districts.name as districtName',
        'districts.code as districtCode'
      )
      .join('districts', 'agents.district_id', 'districts.id');

    if (districtId) {
      query = query.where('agents.district_id', districtId);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function () {
        this.where('agents.first_name', 'like', searchTerm)
          .orWhere('agents.last_name', 'like', searchTerm);
      });
    }

    if (sortBy === 'district') {
      query = query.orderBy('districts.name', 'asc');
    } else {
      query = query.orderBy('agents.last_name', 'asc').orderBy('agents.first_name', 'asc');
    }

    const agents = await query;

    res.json({ agents });
  } catch (error) {
    next(error);
  }
};

export const getAgentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const agent = await db('agents')
      .select(
        'agents.id',
        'agents.first_name as firstName',
        'agents.last_name as lastName',
        'agents.personal_phone as personalPhone',
        'agents.professional_phone as professionalPhone',
        'agents.district_id as districtId',
        'districts.name as districtName',
        'districts.code as districtCode'
      )
      .join('districts', 'agents.district_id', 'districts.id')
      .where('agents.id', id)
      .first();

    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    res.json({ agent });
  } catch (error) {
    next(error);
  }
};

export const updateAgentValidation = [
  body('districtId').optional().isInt().withMessage('Invalid district ID')
];

export const updateAgent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { districtId } = req.body;

    const agent = await db('agents').where({ id }).first();
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    if (districtId) {
      const district = await db('districts').where({ id: districtId }).first();
      if (!district) {
        throw new AppError('District not found', 404);
      }

      await db('agents')
        .where({ id })
        .update({
          district_id: districtId,
          updated_at: db.fn.now()
        });
    }

    const updatedAgent = await db('agents')
      .select(
        'agents.id',
        'agents.first_name as firstName',
        'agents.last_name as lastName',
        'agents.personal_phone as personalPhone',
        'agents.professional_phone as professionalPhone',
        'agents.district_id as districtId',
        'districts.name as districtName'
      )
      .join('districts', 'agents.district_id', 'districts.id')
      .where('agents.id', id)
      .first();

    res.json({
      message: 'Agent updated successfully',
      agent: updatedAgent
    });
  } catch (error) {
    next(error);
  }
};

export const getAgentPerformance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { months = '3' } = req.query;

    const agent = await db('agents').where({ id }).first();
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    const monthsCount = parseInt(months as string);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsCount);

    const performanceData = await db('readings')
      .select(
        db.raw('DATE(reading_date) as date'),
        db.raw('COUNT(*) as readingsCount')
      )
      .where('agent_id', id)
      .where('reading_date', '>=', startDate)
      .groupBy(db.raw('DATE(reading_date)'))
      .orderBy('date', 'asc');

    const totalReadings = performanceData.reduce((sum, day) => sum + day.readingsCount, 0);
    const daysWorked = performanceData.length;
    const averagePerDay = daysWorked > 0 ? Math.round((totalReadings / daysWorked) * 100) / 100 : 0;

    res.json({
      agentId: parseInt(id),
      averagePerDay,
      totalReadings,
      daysWorked,
      period: monthsCount,
      dailyPerformance: performanceData.map((day) => ({
        date: day.date,
        readings: day.readingsCount
      }))
    });
  } catch (error) {
    next(error);
  }
};
