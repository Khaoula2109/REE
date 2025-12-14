import { Request, Response } from 'express';
import Reading from '../models/Reading';
import Meter from '../models/Meter';
import Address from '../models/Address';
import Client from '../models/Client';
import { Op } from 'sequelize';

/**
 * Send readings data to billing system (SI Facturation)
 * Fetches all calculated readings and formats them for the billing system
 */
export const sendToBilling = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const whereClause: any = {};
    if (startDate || endDate) {
      whereClause.readingDate = {};
      if (startDate) {
        whereClause.readingDate[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.readingDate[Op.lte] = new Date(endDate as string);
      }
    }

    // Fetch readings with all necessary data
    const readings = await Reading.findAll({
      where: whereClause,
      include: [
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
                  model: Client,
                  as: 'client',
                  attributes: ['id', 'clientId', 'firstName', 'lastName'],
                },
              ],
            },
          ],
        },
      ],
      order: [['readingDate', 'ASC']],
    });

    // Format data for billing system according to specs
    const billingData = readings.map((reading) => ({
      clientId: reading.meter?.address?.client?.clientId || null,
      addressId: reading.meter?.address?.id || null,
      address: {
        street: reading.meter?.address?.street || '',
        number: reading.meter?.address?.number || '',
        floor: reading.meter?.address?.floor || null,
        apartmentNumber: reading.meter?.address?.apartmentNumber || null,
      },
      meterNumber: reading.meter?.meterId || '',
      readingDate: reading.readingDate,
      consumptionWater: reading.meter?.meterType === 'WATER' ? Number(reading.consumption) : null,
      consumptionElectricity: reading.meter?.meterType === 'ELECTRICITY' ? Number(reading.consumption) : null,
    }));

    // Group by client and address for billing system
    const groupedData: { [key: string]: any } = {};

    billingData.forEach((item) => {
      const key = `${item.clientId}_${item.addressId}`;

      if (!groupedData[key]) {
        groupedData[key] = {
          clientId: item.clientId,
          addressId: item.addressId,
          address: item.address,
          readingDate: item.readingDate,
          consumptionWater: 0,
          consumptionElectricity: 0,
          meters: [],
        };
      }

      // Sum consumptions
      if (item.consumptionWater) {
        groupedData[key].consumptionWater += item.consumptionWater;
      }
      if (item.consumptionElectricity) {
        groupedData[key].consumptionElectricity += item.consumptionElectricity;
      }

      groupedData[key].meters.push({
        meterNumber: item.meterNumber,
        readingDate: item.readingDate,
        consumption: item.consumptionWater || item.consumptionElectricity,
        type: item.consumptionWater ? 'WATER' : 'ELECTRICITY',
      });
    });

    const formattedData = Object.values(groupedData);

    // In a real implementation, this would call an external web service
    // For now, we return the formatted data
    // Example:
    // await axios.post('http://si-facturation-url/api/readings', formattedData);

    res.json({
      message: 'Données envoyées au système de facturation avec succès',
      count: formattedData.length,
      data: formattedData,
      summary: {
        totalReadings: readings.length,
        totalClients: formattedData.length,
        dateRange: {
          start: startDate || 'all',
          end: endDate || 'all',
        },
      },
    });
  } catch (error) {
    console.error('Send to billing error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi au système de facturation' });
  }
};

/**
 * Get billing export status and statistics
 */
export const getBillingStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalReadings = await Reading.count();
    const lastReading = await Reading.findOne({
      order: [['readingDate', 'DESC']],
      attributes: ['readingDate'],
    });

    res.json({
      totalReadingsAvailable: totalReadings,
      lastReadingDate: lastReading?.readingDate || null,
      status: 'ready',
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};
