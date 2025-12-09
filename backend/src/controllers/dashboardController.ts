import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthRequest } from '../types';

export const getCoverageRate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { districtId } = req.query;

    // Get total meters count
    let totalMetersQuery = db('meters').count('* as total');
    if (districtId) {
      totalMetersQuery = totalMetersQuery
        .join('addresses', 'meters.address_id', 'addresses.id')
        .where('addresses.district_id', districtId);
    }
    const [{ total: totalMeters }] = await totalMetersQuery;

    // Get meters with readings in current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    let readMetersQuery = db('readings')
      .countDistinct('meter_id as count')
      .where('reading_date', '>=', currentMonth);

    if (districtId) {
      readMetersQuery = readMetersQuery
        .join('meters', 'readings.meter_id', 'meters.id')
        .join('addresses', 'meters.address_id', 'addresses.id')
        .where('addresses.district_id', districtId);
    }

    const [{ count: metersRead }] = await readMetersQuery;

    const coverageRate = totalMeters > 0 ? (metersRead / totalMeters) * 100 : 0;

    // Get breakdown by district
    const breakdown = await db('districts')
      .select('districts.id', 'districts.name', 'districts.code')
      .leftJoin('addresses', 'districts.id', 'addresses.district_id')
      .leftJoin('meters', 'addresses.id', 'meters.address_id')
      .count('meters.id as totalMeters')
      .groupBy('districts.id', 'districts.name', 'districts.code')
      .orderBy('districts.name');

    const breakdownWithReads = await Promise.all(
      breakdown.map(async (district) => {
        const [{ count }] = await db('readings')
          .countDistinct('readings.meter_id as count')
          .join('meters', 'readings.meter_id', 'meters.id')
          .join('addresses', 'meters.address_id', 'addresses.id')
          .where('addresses.district_id', district.id)
          .where('readings.reading_date', '>=', currentMonth);

        const districtCoverageRate = district.totalMeters > 0 ? (count / district.totalMeters) * 100 : 0;

        return {
          districtId: district.id,
          districtName: district.name,
          districtCode: district.code,
          totalMeters: district.totalMeters,
          metersRead: count,
          coverageRate: Math.round(districtCoverageRate * 100) / 100
        };
      })
    );

    res.json({
      overall: {
        totalMeters,
        metersRead,
        coverageRate: Math.round(coverageRate * 100) / 100
      },
      breakdown: breakdownWithReads
    });
  } catch (error) {
    next(error);
  }
};

export const getReadingsPerAgent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { districtId, period = '30' } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period as string));

    let query = db('agents')
      .select(
        'agents.id',
        'agents.first_name as firstName',
        'agents.last_name as lastName',
        'districts.name as districtName',
        'districts.id as districtId'
      )
      .join('districts', 'agents.district_id', 'districts.id')
      .leftJoin('readings', function () {
        this.on('agents.id', '=', 'readings.agent_id').andOn('readings.reading_date', '>=', db.raw('?', [daysAgo]));
      })
      .count('readings.id as totalReadings')
      .groupBy('agents.id', 'agents.first_name', 'agents.last_name', 'districts.name', 'districts.id');

    if (districtId) {
      query = query.where('agents.district_id', districtId);
    }

    const results = await query;

    const days = parseInt(period as string);
    const agentsStats = results.map((agent) => ({
      agentId: agent.id,
      agentName: `${agent.firstName} ${agent.lastName}`,
      districtName: agent.districtName,
      districtId: agent.districtId,
      totalReadings: agent.totalReadings,
      averagePerDay: Math.round((agent.totalReadings / days) * 100) / 100
    }));

    res.json({ agents: agentsStats, period: days });
  } catch (error) {
    next(error);
  }
};

export const getConsumptionEvolution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, months = '12' } = req.query;

    const monthsCount = parseInt(months as string);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsCount);

    let query = db('readings')
      .select(
        db.raw('YEAR(reading_date) as year'),
        db.raw('MONTH(reading_date) as month'),
        db.raw('AVG(consumption) as avgConsumption'),
        db.raw('SUM(consumption) as totalConsumption'),
        db.raw('COUNT(*) as readingsCount')
      )
      .join('meters', 'readings.meter_id', 'meters.id')
      .where('readings.reading_date', '>=', startDate)
      .groupBy(db.raw('YEAR(reading_date), MONTH(reading_date)'))
      .orderBy('year', 'asc')
      .orderBy('month', 'asc');

    if (type) {
      query = query.where('meters.type', type);
    }

    const results = await query;

    const monthlyData = results.map((row) => ({
      year: row.year,
      month: row.month,
      averageConsumption: Math.round(row.avgConsumption * 100) / 100,
      totalConsumption: Math.round(row.totalConsumption * 100) / 100,
      readingsCount: row.readingsCount
    }));

    res.json({ monthlyData, months: monthsCount });
  } catch (error) {
    next(error);
  }
};
