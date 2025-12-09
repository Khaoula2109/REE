import { Response, NextFunction } from 'express';
import { body } from 'express-validator';
import db from '../config/database';
import { generateMeterId } from '../utils/formatters';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest, MeterType } from '../types';

export const getAllMeters = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, districtId, page = '1', limit = '20' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = db('meters')
      .select(
        'meters.id',
        'meters.type',
        'meters.current_index as currentIndex',
        'meters.last_reading_date as lastReadingDate',
        'addresses.street',
        'addresses.building_number as buildingNumber',
        'addresses.district_id as districtId',
        'districts.name as districtName',
        'clients.first_name as clientFirstName',
        'clients.last_name as clientLastName'
      )
      .join('addresses', 'meters.address_id', 'addresses.id')
      .join('districts', 'addresses.district_id', 'districts.id')
      .join('clients', 'addresses.client_id', 'clients.id');

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function () {
        this.where('meters.id', 'like', searchTerm)
          .orWhere('addresses.street', 'like', searchTerm)
          .orWhere('addresses.building_number', 'like', searchTerm);
      });
    }

    if (districtId) {
      query = query.where('addresses.district_id', districtId);
    }

    const [{ count }] = await db('meters')
      .join('addresses', 'meters.address_id', 'addresses.id')
      .count('* as count')
      .where(function () {
        if (search) {
          const searchTerm = `%${search}%`;
          this.where('meters.id', 'like', searchTerm)
            .orWhere('addresses.street', 'like', searchTerm)
            .orWhere('addresses.building_number', 'like', searchTerm);
        }
        if (districtId) {
          this.where('addresses.district_id', districtId);
        }
      })
      .first();

    const meters = await query
      .orderBy('meters.id', 'desc')
      .limit(parseInt(limit as string))
      .offset(offset);

    res.json({
      meters: meters.map((m) => ({
        ...m,
        fullAddress: `${m.buildingNumber} ${m.street}, ${m.districtName}`
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

export const getMeterById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const meter = await db('meters')
      .select(
        'meters.id',
        'meters.type',
        'meters.current_index as currentIndex',
        'meters.last_reading_date as lastReadingDate',
        'meters.address_id as addressId',
        'addresses.street',
        'addresses.building_number as buildingNumber',
        'districts.name as districtName',
        'clients.id as clientId',
        'clients.first_name as clientFirstName',
        'clients.last_name as clientLastName'
      )
      .join('addresses', 'meters.address_id', 'addresses.id')
      .join('districts', 'addresses.district_id', 'districts.id')
      .join('clients', 'addresses.client_id', 'clients.id')
      .where('meters.id', id)
      .first();

    if (!meter) {
      throw new AppError('Meter not found', 404);
    }

    const history = await db('readings')
      .select(
        'readings.id',
        'readings.reading_date as readingDate',
        'readings.previous_index as previousIndex',
        'readings.new_index as newIndex',
        'readings.consumption',
        'agents.first_name as agentFirstName',
        'agents.last_name as agentLastName'
      )
      .join('agents', 'readings.agent_id', 'agents.id')
      .where('readings.meter_id', id)
      .orderBy('readings.reading_date', 'desc')
      .limit(10);

    res.json({
      meter: {
        ...meter,
        fullAddress: `${meter.buildingNumber} ${meter.street}, ${meter.districtName}`
      },
      history
    });
  } catch (error) {
    next(error);
  }
};

export const createMeterValidation = [
  body('addressId').isInt().withMessage('Valid address ID is required'),
  body('type').isIn(['WATER', 'ELECTRICITY']).withMessage('Invalid meter type')
];

export const createMeter = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { addressId, type } = req.body;

    const address = await db('addresses').where({ id: addressId }).first();
    if (!address) {
      throw new AppError('Address not found', 404);
    }

    const existingMeter = await db('meters')
      .where({ address_id: addressId, type })
      .first();

    if (existingMeter) {
      throw new AppError(`A ${type} meter already exists for this address`, 400);
    }

    const metersAtAddress = await db('meters')
      .where({ address_id: addressId })
      .count('* as count')
      .first();

    const maxMeters = address.is_building ? 4 : 2;
    if (metersAtAddress && metersAtAddress.count >= maxMeters) {
      throw new AppError(`Maximum ${maxMeters} meters allowed for this address`, 400);
    }

    const lastMeter = await db('meters')
      .select('id')
      .orderBy('id', 'desc')
      .first();

    const newMeterId = await generateMeterId(lastMeter?.id || null);

    await db('meters').insert({
      id: newMeterId,
      address_id: addressId,
      type,
      current_index: 0,
      last_reading_date: null
    });

    const meter = await db('meters')
      .select(
        'meters.id',
        'meters.type',
        'meters.current_index as currentIndex',
        'addresses.street',
        'addresses.building_number as buildingNumber',
        'districts.name as districtName'
      )
      .join('addresses', 'meters.address_id', 'addresses.id')
      .join('districts', 'addresses.district_id', 'districts.id')
      .where('meters.id', newMeterId)
      .first();

    res.status(201).json({
      message: 'Meter created successfully',
      meter
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableAddresses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { districtId, search } = req.query;

    let query = db('addresses')
      .select(
        'addresses.id',
        'addresses.street',
        'addresses.building_number as buildingNumber',
        'addresses.is_building as isBuilding',
        'districts.name as districtName',
        'districts.id as districtId',
        'clients.first_name as clientFirstName',
        'clients.last_name as clientLastName'
      )
      .join('districts', 'addresses.district_id', 'districts.id')
      .join('clients', 'addresses.client_id', 'clients.id')
      .leftJoin('meters', 'addresses.id', 'meters.address_id')
      .groupBy('addresses.id')
      .havingRaw('COUNT(meters.id) < IF(addresses.is_building = 1, 4, 2)');

    if (districtId) {
      query = query.where('addresses.district_id', districtId);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(function () {
        this.where('addresses.street', 'like', searchTerm)
          .orWhere('addresses.building_number', 'like', searchTerm);
      });
    }

    const addresses = await query.orderBy('addresses.street', 'asc');

    const addressesWithMeterCount = await Promise.all(
      addresses.map(async (address) => {
        const [{ count }] = await db('meters')
          .where({ address_id: address.id })
          .count('* as count');

        return {
          ...address,
          fullAddress: `${address.buildingNumber} ${address.street}, ${address.districtName}`,
          meterCount: count,
          maxMeters: address.isBuilding ? 4 : 2
        };
      })
    );

    res.json({ addresses: addressesWithMeterCount });
  } catch (error) {
    next(error);
  }
};
