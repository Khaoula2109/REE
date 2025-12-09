import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import db from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../types';

export const getAllReadings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      date,
      districtId,
      agentId,
      meterId,
      type,
      sortBy = 'date',
      order = 'desc',
      page = '1',
      limit = '20'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db('readings')
      .select(
        'readings.id',
        'readings.reading_date as readingDate',
        'readings.consumption',
        'readings.new_index as newIndex',
        'readings.previous_index as previousIndex',
        'agents.first_name as agentFirstName',
        'agents.last_name as agentLastName',
        'agents.id as agentId',
        'meters.id as meterId',
        'meters.type as meterType',
        'addresses.street',
        'addresses.building_number as buildingNumber',
        'districts.name as districtName',
        'districts.id as districtId',
        'clients.first_name as clientFirstName',
        'clients.last_name as clientLastName'
      )
      .join('agents', 'readings.agent_id', 'agents.id')
      .join('meters', 'readings.meter_id', 'meters.id')
      .join('addresses', 'meters.address_id', 'addresses.id')
      .join('districts', 'addresses.district_id', 'districts.id')
      .join('clients', 'addresses.client_id', 'clients.id');

    if (date) {
      const searchDate = new Date(date as string);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      query = query.whereBetween('readings.reading_date', [searchDate, nextDate]);
    }

    if (districtId) {
      query = query.where('addresses.district_id', districtId);
    }

    if (agentId) {
      query = query.where('readings.agent_id', agentId);
    }

    if (meterId) {
      query = query.where('readings.meter_id', meterId);
    }

    if (type) {
      query = query.where('meters.type', type);
    }

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count('* as count');

    if (sortBy === 'district') {
      query = query.orderBy('districts.name', order as string);
    } else if (sortBy === 'agent') {
      query = query.orderBy('agents.last_name', order as string);
    } else {
      query = query.orderBy('readings.reading_date', order as string);
    }

    const readings = await query
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json({
      readings: readings.map((r) => ({
        ...r,
        fullAddress: `${r.buildingNumber} ${r.street}, ${r.districtName}`,
        agentName: `${r.agentFirstName} ${r.agentLastName}`,
        clientName: `${r.clientFirstName} ${r.clientLastName}`
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count,
        pages: Math.ceil(count / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getReadingById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const reading = await db('readings')
      .select(
        'readings.id',
        'readings.reading_date as readingDate',
        'readings.consumption',
        'readings.new_index as newIndex',
        'readings.previous_index as previousIndex',
        'agents.first_name as agentFirstName',
        'agents.last_name as agentLastName',
        'agents.id as agentId',
        'meters.id as meterId',
        'meters.type as meterType',
        'addresses.street',
        'addresses.building_number as buildingNumber',
        'districts.name as districtName',
        'clients.id as clientId',
        'clients.first_name as clientFirstName',
        'clients.last_name as clientLastName',
        'clients.email as clientEmail',
        'clients.phone as clientPhone'
      )
      .join('agents', 'readings.agent_id', 'agents.id')
      .join('meters', 'readings.meter_id', 'meters.id')
      .join('addresses', 'meters.address_id', 'addresses.id')
      .join('districts', 'addresses.district_id', 'districts.id')
      .join('clients', 'addresses.client_id', 'clients.id')
      .where('readings.id', id)
      .first();

    if (!reading) {
      throw new AppError('Reading not found', 404);
    }

    res.json({
      reading: {
        ...reading,
        fullAddress: `${reading.buildingNumber} ${reading.street}, ${reading.districtName}`,
        agentName: `${reading.agentFirstName} ${reading.agentLastName}`,
        clientName: `${reading.clientFirstName} ${reading.clientLastName}`
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createReadingValidation = [
  body('meterId').notEmpty().withMessage('Meter ID is required'),
  body('agentId').isInt().withMessage('Valid agent ID is required'),
  body('newIndex').isFloat({ min: 0 }).withMessage('Valid new index is required'),
  body('readingDate').optional().isISO8601().withMessage('Valid date is required')
];

export const createReading = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { meterId, agentId, newIndex, readingDate } = req.body;

    const meter = await db('meters').where({ id: meterId }).first();
    if (!meter) {
      throw new AppError('Meter not found', 404);
    }

    const agent = await db('agents').where({ id: agentId }).first();
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    const previousIndex = meter.current_index;
    const consumption = newIndex - previousIndex;

    if (consumption < 0) {
      throw new AppError('New index cannot be less than current index', 400);
    }

    const date = readingDate ? new Date(readingDate) : new Date();

    const [readingId] = await db('readings').insert({
      meter_id: meterId,
      agent_id: agentId,
      previous_index: previousIndex,
      new_index: newIndex,
      consumption,
      reading_date: date
    });

    await db('meters')
      .where({ id: meterId })
      .update({
        current_index: newIndex,
        last_reading_date: date,
        updated_at: db.fn.now()
      });

    const reading = await db('readings')
      .select(
        'readings.*',
        'agents.first_name as agentFirstName',
        'agents.last_name as agentLastName',
        'meters.type as meterType'
      )
      .join('agents', 'readings.agent_id', 'agents.id')
      .join('meters', 'readings.meter_id', 'meters.id')
      .where('readings.id', readingId)
      .first();

    res.status(201).json({
      message: 'Reading created successfully',
      reading
    });
  } catch (error) {
    next(error);
  }
};
