import { Request, Response } from 'express';
import Agent from '../models/Agent';
import Meter from '../models/Meter';
import Address from '../models/Address';
import District from '../models/District';
import Client from '../models/Client';
import Reading from '../models/Reading';
import { Op } from 'sequelize';

/**
 * Get addresses to visit for an agent
 * Returns addresses in the agent's district that haven't been read this month
 */
export const getAddressesToVisit = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      res.status(401).json({ error: 'Agent non identifié' });
      return;
    }

    // Get agent to find their district
    const agent = await Agent.findByPk(agentId);

    if (!agent) {
      res.status(404).json({ error: 'Agent non trouvé' });
      return;
    }

    // Get start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all meters in agent's district
    const meters = await Meter.findAll({
      include: [
        {
          model: Address,
          as: 'address',
          where: { districtId: agent.districtId },
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name', 'code'],
            },
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'clientId', 'firstName', 'lastName', 'phone'],
            },
          ],
        },
      ],
    });

    // Get readings for this month
    const meterIds = meters.map((m) => m.id);
    const readingsThisMonth = await Reading.findAll({
      where: {
        meterId: { [Op.in]: meterIds },
        readingDate: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
      attributes: ['meterId'],
    });

    const readMeterIds = new Set(readingsThisMonth.map((r) => r.meterId));

    // Filter meters that haven't been read this month
    const metersToRead = meters.filter((m) => !readMeterIds.has(m.id));

    // Format response
    const addressesToVisit = metersToRead.map((meter) => ({
      meterId: meter.id,
      meterNumber: meter.meterId,
      meterType: meter.meterType,
      currentIndex: Number(meter.currentIndex),
      address: {
        id: meter.address?.id,
        street: meter.address?.street,
        number: meter.address?.number,
        floor: meter.address?.floor,
        apartmentNumber: meter.address?.apartmentNumber,
        district: meter.address?.district?.name,
      },
      client: {
        id: meter.address?.client?.id,
        clientId: meter.address?.client?.clientId,
        name: `${meter.address?.client?.firstName} ${meter.address?.client?.lastName}`,
        phone: meter.address?.client?.phone,
      },
    }));

    res.json({
      total: addressesToVisit.length,
      addresses: addressesToVisit,
      period: {
        start: startOfMonth,
        end: endOfMonth,
      },
    });
  } catch (error) {
    console.error('Get addresses to visit error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des adresses' });
  }
};

/**
 * Create a new reading from mobile app
 */
export const createReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { meterId, currentIndex, readingDate } = req.body;

    if (!agentId) {
      res.status(401).json({ error: 'Agent non identifié' });
      return;
    }

    // Validate input
    if (!meterId || currentIndex === undefined) {
      res.status(400).json({ error: 'Données manquantes (meterId, currentIndex requis)' });
      return;
    }

    // Get meter
    const meter = await Meter.findByPk(meterId);

    if (!meter) {
      res.status(404).json({ error: 'Compteur non trouvé' });
      return;
    }

    // Verify agent is assigned to this meter's district
    const agent = await Agent.findByPk(agentId, {
      include: [{ model: District, as: 'district' }],
    });

    const meterWithAddress = await Meter.findByPk(meterId, {
      include: [{ model: Address, as: 'address' }],
    });

    if (agent?.districtId !== meterWithAddress?.address?.districtId) {
      res.status(403).json({ error: 'Vous n\'êtes pas autorisé à relever ce compteur' });
      return;
    }

    // Validate currentIndex is not less than meter's currentIndex
    const newIndex = Number(currentIndex);
    const previousIndex = Number(meter.currentIndex);

    if (newIndex < previousIndex) {
      res.status(400).json({
        error: 'L\'index actuel ne peut pas être inférieur à l\'index précédent',
        previousIndex,
        currentIndex: newIndex,
      });
      return;
    }

    // Create reading (consumption will be calculated automatically by beforeCreate hook)
    const reading = await Reading.create({
      meterId,
      agentId,
      previousIndex,
      currentIndex: newIndex,
      readingDate: readingDate ? new Date(readingDate) : new Date(),
    });

    // Update meter's current index and last reading date
    await meter.update({
      currentIndex: newIndex,
      lastReadingDate: reading.readingDate,
    });

    res.status(201).json({
      message: 'Relevé enregistré avec succès',
      reading: {
        id: reading.id,
        meterId: reading.meterId,
        meterNumber: meter.meterId,
        previousIndex: Number(reading.previousIndex),
        currentIndex: Number(reading.currentIndex),
        consumption: Number(reading.consumption),
        readingDate: reading.readingDate,
      },
    });
  } catch (error) {
    console.error('Create reading error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du relevé' });
  }
};

/**
 * Get agent statistics
 */
export const getAgentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;

    if (!agentId) {
      res.status(401).json({ error: 'Agent non identifié' });
      return;
    }

    // Get today's readings count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReadings = await Reading.count({
      where: {
        agentId,
        readingDate: {
          [Op.between]: [today, tomorrow],
        },
      },
    });

    // Get this month's readings count
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthReadings = await Reading.count({
      where: {
        agentId,
        readingDate: {
          [Op.between]: [startOfMonth, endOfMonth],
        },
      },
    });

    // Get total readings
    const totalReadings = await Reading.count({ where: { agentId } });

    // Calculate average readings per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30DaysReadings = await Reading.count({
      where: {
        agentId,
        readingDate: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    });

    const avgPerDay = Math.round((last30DaysReadings / 30) * 10) / 10;

    // Get agent info
    const agent = await Agent.findByPk(agentId, {
      include: [{ model: District, as: 'district', attributes: ['id', 'name'] }],
    });

    res.json({
      agent: {
        id: agent?.id,
        name: `${agent?.firstName} ${agent?.lastName}`,
        district: agent?.district?.name,
      },
      stats: {
        today: todayReadings,
        thisMonth: monthReadings,
        total: totalReadings,
        averagePerDay: avgPerDay,
        dailyGoal: 50,
        todayProgress: Math.min(Math.round((todayReadings / 50) * 100), 100),
      },
    });
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

/**
 * Get agent reading history
 */
export const getAgentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const agentId = req.user?.userId;
    const { limit = 50, offset = 0 } = req.query;

    if (!agentId) {
      res.status(401).json({ error: 'Agent non identifié' });
      return;
    }

    const readings = await Reading.findAll({
      where: { agentId },
      include: [
        {
          model: Meter,
          as: 'meter',
          attributes: ['id', 'meterId', 'meterType'],
          include: [
            {
              model: Address,
              as: 'address',
              attributes: ['street', 'number'],
            },
          ],
        },
      ],
      limit: Number(limit),
      offset: Number(offset),
      order: [['readingDate', 'DESC']],
    });

    const total = await Reading.count({ where: { agentId } });

    const formattedReadings = readings.map((r) => ({
      id: r.id,
      meterNumber: r.meter?.meterId,
      meterType: r.meter?.meterType,
      address: `${r.meter?.address?.number} ${r.meter?.address?.street}`,
      previousIndex: Number(r.previousIndex),
      currentIndex: Number(r.currentIndex),
      consumption: Number(r.consumption),
      readingDate: r.readingDate,
    }));

    res.json({
      total,
      readings: formattedReadings,
    });
  } catch (error) {
    console.error('Get agent history error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};
