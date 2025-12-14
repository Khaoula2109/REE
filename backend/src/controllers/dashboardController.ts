import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Reading from '../models/Reading';
import Meter, { MeterType } from '../models/Meter';
import Agent from '../models/Agent';
import District from '../models/District';
import Address from '../models/Address';

/**
 * Get coverage rate by district
 */
export const getCoverageRate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate as string);
    }

    // Get all districts with their meter counts
    const districts = await District.findAll({
      attributes: [
        'id',
        'name',
        'code',
        [sequelize.fn('COUNT', sequelize.col('addresses->meters.id')), 'totalMeters'],
      ],
      include: [
        {
          model: Address,
          as: 'addresses',
          attributes: [],
          include: [
            {
              model: Meter,
              as: 'meters',
              attributes: [],
            },
          ],
        },
      ],
      group: ['District.id'],
      raw: true,
    });

    // Get readings count by district
    const readingsByDistrict = await Reading.findAll({
      attributes: [
        [sequelize.col('meter->address.district_id'), 'districtId'],
        [sequelize.fn('COUNT', sequelize.col('Reading.id')), 'readingsCount'],
      ],
      include: [
        {
          model: Meter,
          as: 'meter',
          attributes: [],
          include: [
            {
              model: Address,
              as: 'address',
              attributes: [],
            },
          ],
        },
      ],
      where: Object.keys(dateFilter).length > 0 ? { readingDate: dateFilter } : {},
      group: ['meter->address.district_id'],
      raw: true,
    });

    // Calculate coverage rate for each district
    const coverageData = districts.map((district: any) => {
      const reading = readingsByDistrict.find((r: any) => r.districtId === district.id);
      const readingsCount = reading ? parseInt(reading.readingsCount) : 0;
      const totalMeters = parseInt(district.totalMeters) || 0;
      const coverageRate = totalMeters > 0 ? (readingsCount / totalMeters) * 100 : 0;

      return {
        districtId: district.id,
        districtName: district.name,
        districtCode: district.code,
        totalMeters,
        readingsCount,
        coverageRate: Math.round(coverageRate * 100) / 100,
      };
    });

    res.json(coverageData);
  } catch (error) {
    console.error('Coverage rate error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul du taux de couverture' });
  }
};

/**
 * Get daily readings per agent
 */
export const getReadingsPerAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, districtId } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate as string);
    }

    // Build agent filter
    const agentFilter: any = {};
    if (districtId) {
      agentFilter.districtId = districtId;
    }

    // Get readings per agent with date range
    const agentReadings = await Reading.findAll({
      attributes: [
        'agentId',
        [sequelize.fn('COUNT', sequelize.col('Reading.id')), 'totalReadings'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.fn('DATE', sequelize.col('reading_date')))), 'daysWorked'],
      ],
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'districtId'],
          where: agentFilter,
          include: [
            {
              model: District,
              as: 'district',
              attributes: ['id', 'name', 'code'],
            },
          ],
        },
      ],
      where: Object.keys(dateFilter).length > 0 ? { readingDate: dateFilter } : {},
      group: ['Reading.agent_id', 'agent.id', 'agent->district.id'],
    });

    // Calculate average per day
    const agentStats = agentReadings.map((reading: any) => {
      const totalReadings = parseInt(reading.getDataValue('totalReadings'));
      const daysWorked = parseInt(reading.getDataValue('daysWorked'));
      const avgPerDay = daysWorked > 0 ? totalReadings / daysWorked : 0;

      return {
        agentId: reading.agent.id,
        agentName: reading.agent.getFormattedName(),
        districtId: reading.agent.district?.id,
        districtName: reading.agent.district?.name,
        totalReadings,
        daysWorked,
        avgReadingsPerDay: Math.round(avgPerDay * 100) / 100,
      };
    });

    res.json(agentStats);
  } catch (error) {
    console.error('Readings per agent error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des relevés par agent' });
  }
};

/**
 * Get average consumption evolution
 */
export const getConsumptionEvolution = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, meterType } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter[Op.gte] = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter[Op.lte] = new Date(endDate as string);
    }

    // Build meter type filter
    const meterTypeFilter: any = {};
    if (meterType) {
      meterTypeFilter.meterType = meterType;
    }

    // Get monthly average consumption by meter type
    const consumptionData = await Reading.findAll({
      attributes: [
        [sequelize.col('meter.meter_type'), 'meterType'],
        [sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m'), 'month'],
        [sequelize.fn('AVG', sequelize.col('consumption')), 'avgConsumption'],
        [sequelize.fn('SUM', sequelize.col('consumption')), 'totalConsumption'],
        [sequelize.fn('COUNT', sequelize.col('Reading.id')), 'readingsCount'],
      ],
      include: [
        {
          model: Meter,
          as: 'meter',
          attributes: [],
          where: meterTypeFilter,
        },
      ],
      where: Object.keys(dateFilter).length > 0 ? { readingDate: dateFilter } : {},
      group: ['meter.meter_type', sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m'), 'ASC']],
      raw: true,
    });

    // Format the data
    const formattedData = consumptionData.map((item: any) => ({
      meterType: item.meterType,
      month: item.month,
      avgConsumption: Math.round(parseFloat(item.avgConsumption) * 100) / 100,
      totalConsumption: Math.round(parseFloat(item.totalConsumption) * 100) / 100,
      readingsCount: parseInt(item.readingsCount),
      unit: item.meterType === MeterType.WATER ? 'm³' : 'kWh',
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Consumption evolution error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul de l\'évolution de la consommation' });
  }
};

/**
 * Get overall statistics for dashboard
 */
export const getOverallStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total meters
    const totalMeters = await Meter.count();

    // Total readings this month
    const monthlyReadings = await Reading.count({
      where: {
        readingDate: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    // Total agents
    const totalAgents = await Agent.count();

    // Average consumption this month
    const avgConsumption = await Reading.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('consumption')), 'avgConsumption']],
      where: {
        readingDate: {
          [Op.gte]: startOfMonth,
        },
      },
      raw: true,
    });

    res.json({
      totalMeters,
      monthlyReadings,
      totalAgents,
      avgConsumption: Math.round(parseFloat(avgConsumption?.avgConsumption || '0') * 100) / 100,
    });
  } catch (error) {
    console.error('Overall stats error:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
};
