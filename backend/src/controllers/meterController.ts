import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Meter, { MeterType } from '../models/Meter';
import Address from '../models/Address';
import District from '../models/District';
import Client from '../models/Client';
import Reading from '../models/Reading';
import Agent from '../models/Agent';

/**
 * Get all meters with filters and pagination
 */
export const getAllMeters = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      districtId,
      meterType,
      search,
      sortBy = 'meterId',
      order = 'ASC',
    } = req.query;

    // Build filters
    const where: any = {};
    if (meterType) {
      where.meterType = meterType;
    }

    if (search) {
      where.meterId = { [Op.like]: `%${search}%` };
    }

    // Build district filter for addresses
    const addressWhere: any = {};
    if (districtId) {
      addressWhere.districtId = districtId;
    }

    // Calculate pagination
    const offset = (Number(page) - 1) * Number(limit);

    // Get meters
    const { count, rows: meters } = await Meter.findAndCountAll({
      where,
      include: [
        {
          model: Address,
          as: 'address',
          where: addressWhere,
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'clientId', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      limit: Number(limit),
      offset,
      order: [[sortBy as string, order as string]],
    });

    res.json({
      meters,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get meters error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des compteurs' });
  }
};

/**
 * Get meter by ID with reading history
 */
export const getMeterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const meter = await Meter.findByPk(id, {
      include: [
        {
          model: Address,
          as: 'address',
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'clientId', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    if (!meter) {
      res.status(404).json({ error: 'Compteur non trouvé' });
      return;
    }

    // Get last 10 readings
    const readings = await Reading.findAll({
      where: { meterId: id },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['readingDate', 'DESC']],
      limit: 10,
    });

    res.json({
      ...meter.toJSON(),
      recentReadings: readings,
    });
  } catch (error) {
    console.error('Get meter error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du compteur' });
  }
};

/**
 * Get addresses without meters (for adding new meters)
 */
export const getAvailableAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { districtId, search, meterType } = req.query;

    // Build filters
    const where: any = {};
    if (districtId) {
      where.districtId = districtId;
    }

    if (search) {
      where[Op.or] = [
        { street: { [Op.like]: `%${search}%` } },
        { number: { [Op.like]: `%${search}%` } },
      ];
    }

    // Get all addresses
    const addresses = await Address.findAll({
      where,
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'clientId', 'firstName', 'lastName'],
        },
        {
          model: Meter,
          as: 'meters',
          attributes: ['id', 'meterId', 'meterType'],
        },
      ],
    });

    // Filter addresses that don't have the specified meter type (or any meter if not specified)
    const availableAddresses = addresses.filter((address: any) => {
      const meters = address.meters || [];

      if (meterType) {
        // Check if this specific meter type doesn't exist
        const hasType = meters.some((m: any) => m.meterType === meterType);
        return !hasType;
      } else {
        // Check if address has less than maximum meters (2 for normal, 4 for buildings)
        const maxMeters = address.addressType === 'BUILDING' ? 4 : 2;
        return meters.length < maxMeters;
      }
    });

    res.json(availableAddresses);
  } catch (error) {
    console.error('Get available addresses error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses disponibles' });
  }
};

/**
 * Create new meter
 */
export const createMeter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { addressId, meterType } = req.body;

    // Validate address exists
    const address = await Address.findByPk(addressId, {
      include: [
        {
          model: Meter,
          as: 'meters',
        },
      ],
    });

    if (!address) {
      res.status(404).json({ error: 'Adresse non trouvée' });
      return;
    }

    // Check if meter type already exists for this address
    const existingMeter = address.meters?.find((m: any) => m.meterType === meterType);
    if (existingMeter) {
      res.status(400).json({ error: 'Un compteur de ce type existe déjà pour cette adresse' });
      return;
    }

    // Check maximum meters limit
    const maxMeters = address.addressType === 'BUILDING' ? 4 : 2;
    if ((address.meters?.length || 0) >= maxMeters) {
      res.status(400).json({ error: `Le nombre maximum de compteurs (${maxMeters}) est atteint pour cette adresse` });
      return;
    }

    // Create meter
    const meter = await Meter.create({
      meterType,
      addressId,
      currentIndex: 0,
    });

    // Get full meter with associations
    const fullMeter = await Meter.findByPk(meter.id, {
      include: [
        {
          model: Address,
          as: 'address',
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'clientId', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    res.status(201).json(fullMeter);
  } catch (error) {
    console.error('Create meter error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compteur' });
  }
};

/**
 * Update meter
 */
export const updateMeter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { addressId, meterType } = req.body;

    const meter = await Meter.findByPk(id);

    if (!meter) {
      res.status(404).json({ error: 'Compteur non trouvé' });
      return;
    }

    // Update fields
    if (addressId !== undefined) meter.addressId = addressId;
    if (meterType !== undefined) meter.meterType = meterType;

    await meter.save();

    // Get updated meter with associations
    const updatedMeter = await Meter.findByPk(id, {
      include: [
        {
          model: Address,
          as: 'address',
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'clientId', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    res.json(updatedMeter);
  } catch (error) {
    console.error('Update meter error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du compteur' });
  }
};

/**
 * Delete meter
 */
export const deleteMeter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const meter = await Meter.findByPk(id);

    if (!meter) {
      res.status(404).json({ error: 'Compteur non trouvé' });
      return;
    }

    // Check if meter has readings
    const readingsCount = await Reading.count({ where: { meterId: id } });

    if (readingsCount > 0) {
      res.status(400).json({ error: 'Impossible de supprimer un compteur avec des relevés existants' });
      return;
    }

    await meter.destroy();

    res.json({ message: 'Compteur supprimé avec succès' });
  } catch (error) {
    console.error('Delete meter error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compteur' });
  }
};
