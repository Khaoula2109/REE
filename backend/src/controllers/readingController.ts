import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Reading from '../models/Reading';
import Meter from '../models/Meter';
import Agent from '../models/Agent';
import Address from '../models/Address';
import District from '../models/District';
import Client from '../models/Client';

/**
 * Get all readings with filters and pagination
 */
export const getAllReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      date,
      districtId,
      agentId,
      clientId,
      meterType,
      sortBy = 'readingDate',
      order = 'DESC',
    } = req.query;

    // Build filters
    const where: any = {};

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
      where.readingDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    if (agentId) {
      where.agentId = agentId;
    }

    // Include associations
    const include: any[] = [
      {
        model: Agent,
        as: 'agent',
        attributes: ['id', 'firstName', 'lastName'],
        include: [
          {
            model: District,
            as: 'district',
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
      {
        model: Meter,
        as: 'meter',
        attributes: ['id', 'meterId', 'meterType'],
        include: [
          {
            model: Address,
            as: 'address',
            attributes: ['id', 'street', 'number', 'floor', 'apartmentNumber'],
            include: [
              {
                model: District,
                as: 'district',
                attributes: ['id', 'name', 'code'],
                ...(districtId && { where: { id: districtId } }),
              },
              {
                model: Client,
                as: 'client',
                attributes: ['id', 'clientId', 'firstName', 'lastName'],
                ...(clientId && { where: { clientId } }),
              },
            ],
          },
        ],
        ...(meterType && { where: { meterType } }),
      },
    ];

    // Calculate pagination
    const offset = (Number(page) - 1) * Number(limit);

    // Get readings
    const { count, rows: readings } = await Reading.findAndCountAll({
      where,
      include,
      limit: Number(limit),
      offset,
      order: [[sortBy as string, order as string]],
    });

    res.json({
      data: readings,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des relevés' });
  }
};

/**
 * Get reading by ID
 */
export const getReadingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reading = await Reading.findByPk(id, {
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'personalPhone'],
        },
        {
          model: Meter,
          as: 'meter',
          attributes: ['id', 'meterId', 'meterType'],
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
        },
      ],
    });

    if (!reading) {
      res.status(404).json({ error: 'Relevé non trouvé' });
      return;
    }

    res.json(reading);
  } catch (error) {
    console.error('Get reading error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du relevé' });
  }
};

/**
 * Create new reading (usually from mobile app)
 */
export const createReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meterId, agentId, currentIndex, readingDate } = req.body;

    // Get meter
    const meter = await Meter.findByPk(meterId);

    if (!meter) {
      res.status(404).json({ error: 'Compteur non trouvé' });
      return;
    }

    // Validate current index
    if (currentIndex < meter.currentIndex) {
      res.status(400).json({ error: 'L\'index actuel ne peut pas être inférieur à l\'index précédent' });
      return;
    }

    // Create reading
    const reading = await Reading.create({
      meterId,
      agentId,
      previousIndex: meter.currentIndex,
      currentIndex,
      readingDate: readingDate || new Date(),
    });

    // Update meter
    meter.currentIndex = currentIndex;
    meter.lastReadingDate = readingDate || new Date();
    await meter.save();

    // Get full reading with associations
    const fullReading = await Reading.findByPk(reading.id, {
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Meter,
          as: 'meter',
          attributes: ['id', 'meterId', 'meterType'],
        },
      ],
    });

    res.status(201).json(fullReading);
  } catch (error) {
    console.error('Create reading error:', error);
    res.status(500).json({ error: 'Erreur lors de la création du relevé' });
  }
};

/**
 * Get reading history for a meter
 */
export const getMeterReadingHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meterId } = req.params;
    const { limit = 10 } = req.query;

    const readings = await Reading.findAll({
      where: { meterId },
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['readingDate', 'DESC']],
      limit: Number(limit),
    });

    res.json(readings);
  } catch (error) {
    console.error('Get meter history error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};

/**
 * Export readings to CSV
 */
export const exportReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, districtId, meterType } = req.query;

    // Build filters
    const where: any = {};
    if (startDate && endDate) {
      where.readingDate = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
      };
    }

    const meterWhere: any = {};
    if (meterType) {
      meterWhere.meterType = meterType;
    }

    const districtWhere: any = {};
    if (districtId) {
      districtWhere.id = districtId;
    }

    // Get readings
    const readings = await Reading.findAll({
      where,
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Meter,
          as: 'meter',
          attributes: ['id', 'meterId', 'meterType'],
          where: meterWhere,
          include: [
            {
              model: Address,
              as: 'address',
              include: [
                {
                  model: District,
                  as: 'district',
                  where: districtWhere,
                },
                {
                  model: Client,
                  as: 'client',
                },
              ],
            },
          ],
        },
      ],
      order: [['readingDate', 'DESC']],
    });

    // Format CSV
    let csv = 'Date,Agent,Adresse,Type Compteur,Index Précédent,Index Actuel,Consommation,Client\n';

    readings.forEach((reading: any) => {
      const agent = reading.agent.getFormattedName();
      const address = reading.meter.address.getFullAddress();
      const meterType = reading.meter.meterType === 'WATER' ? 'Eau' : 'Électricité';
      const client = reading.meter.address.client?.getFormattedName() || '';

      csv += `"${reading.readingDate.toLocaleString('fr-FR')}","${agent}","${address}","${meterType}","${reading.previousIndex}","${reading.currentIndex}","${reading.consumption}","${client}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=releves.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export readings error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des relevés' });
  }
};
