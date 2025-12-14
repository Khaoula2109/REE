import { Request, Response } from 'express';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';
import sequelize from '../config/database';
import Reading from '../models/Reading';
import Meter, { MeterType } from '../models/Meter';
import Agent from '../models/Agent';
import District from '../models/District';

/**
 * Generate Monthly Readings Report (PDF)
 * Purpose: Help redistribute agents efficiently
 */
export const generateMonthlyReadingsReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
      return;
    }

    // Get agent distribution by district
    const agentsByDistrict = await Agent.findAll({
      attributes: [
        'districtId',
        [sequelize.fn('COUNT', sequelize.col('Agent.id')), 'agentCount'],
      ],
      include: [
        {
          model: District,
          as: 'district',
          attributes: ['id', 'name', 'code'],
        },
      ],
      group: ['Agent.district_id', 'district.id'],
      raw: true,
    }) as any[];

    // Get readings by district and agent
    const readingsByDistrict = await Reading.findAll({
      attributes: [
        [sequelize.col('agent->district.id'), 'districtId'],
        [sequelize.col('agent->district.name'), 'districtName'],
        [sequelize.fn('COUNT', sequelize.col('Reading.id')), 'totalReadings'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('agent_id'))), 'activeAgents'],
      ],
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: [],
          include: [
            {
              model: District,
              as: 'district',
              attributes: [],
            },
          ],
        },
      ],
      where: {
        readingDate: {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        },
      },
      group: ['agent->district.id'],
      raw: true,
    }) as any[];

    // Get average readings per agent per day by district
    const avgReadingsByAgent = await Reading.findAll({
      attributes: [
        [sequelize.col('agent->district.id'), 'districtId'],
        [sequelize.col('agent->district.name'), 'districtName'],
        'agentId',
        [sequelize.col('agent.first_name'), 'agentFirstName'],
        [sequelize.col('agent.last_name'), 'agentLastName'],
        [sequelize.fn('COUNT', sequelize.col('Reading.id')), 'totalReadings'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.fn('DATE', sequelize.col('reading_date')))), 'daysWorked'],
      ],
      include: [
        {
          model: Agent,
          as: 'agent',
          attributes: [],
          include: [
            {
              model: District,
              as: 'district',
              attributes: [],
            },
          ],
        },
      ],
      where: {
        readingDate: {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        },
      },
      group: ['agent->district.id', 'Reading.agent_id'],
      raw: true,
    }) as any[];

    // Calculate averages
    const reportData = readingsByDistrict.map((district: any) => {
      const agentInfo = agentsByDistrict.find((a: any) => a.districtId === district.districtId);
      const agentDetails = avgReadingsByAgent.filter((a: any) => a.districtId === district.districtId);

      const avgPerDay = agentDetails.map((agent: any) => {
        const readings = parseInt(agent.totalReadings);
        const days = parseInt(agent.daysWorked);
        return {
          agentName: `${agent.agentLastName} ${agent.agentFirstName}`,
          totalReadings: readings,
          daysWorked: days,
          avgPerDay: days > 0 ? Math.round((readings / days) * 100) / 100 : 0,
        };
      });

      return {
        districtName: district.districtName,
        totalAgents: agentInfo ? parseInt(agentInfo.agentCount) : 0,
        activeAgents: parseInt(district.activeAgents),
        totalReadings: parseInt(district.totalReadings),
        agentDetails: avgPerDay,
      };
    });

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport-releves-mensuels.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1E40AF').text('REE - Rabat Energie & Eau', { align: 'center' });
    doc.fontSize(16).text('Rapport Mensuel des Relevés', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#000000').text(`Période: ${startDate} - ${endDate}`, { align: 'center' });
    doc.moveDown(2);

    // Report data
    reportData.forEach((district: any) => {
      doc.fontSize(14).fillColor('#F59E0B').text(district.districtName);
      doc.fontSize(10).fillColor('#000000');
      doc.text(`Nombre total d'agents: ${district.totalAgents}`);
      doc.text(`Agents actifs: ${district.activeAgents}`);
      doc.text(`Total des relevés: ${district.totalReadings}`);
      doc.moveDown();

      if (district.agentDetails.length > 0) {
        doc.fontSize(12).text('Détails par agent:');
        doc.fontSize(9);

        district.agentDetails.forEach((agent: any) => {
          doc.text(
            `  • ${agent.agentName}: ${agent.totalReadings} relevés en ${agent.daysWorked} jours (Moy: ${agent.avgPerDay}/jour)`
          );
        });
      }

      doc.moveDown(2);
    });

    // Footer
    doc.fontSize(8).fillColor('#666666').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
      align: 'center',
    });

    doc.end();
  } catch (error) {
    console.error('Generate monthly report error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
    }
  }
};

/**
 * Generate Consumption Evolution Report (PDF)
 * Purpose: Study consumption trends
 */
export const generateConsumptionReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, meterType } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Les dates de début et de fin sont requises' });
      return;
    }

    // Build meter type filter
    const meterTypeFilter: any = {};
    if (meterType) {
      meterTypeFilter.meterType = meterType;
    }

    // Get monthly consumption evolution
    const monthlyConsumption = await Reading.findAll({
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
      where: {
        readingDate: {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        },
      },
      group: ['meter.meter_type', sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m'), 'ASC']],
      raw: true,
    }) as any[];

    // Get previous year data for comparison
    const startLastYear = new Date(startDate as string);
    startLastYear.setFullYear(startLastYear.getFullYear() - 1);
    const endLastYear = new Date(endDate as string);
    endLastYear.setFullYear(endLastYear.getFullYear() - 1);

    const lastYearConsumption = await Reading.findAll({
      attributes: [
        [sequelize.col('meter.meter_type'), 'meterType'],
        [sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m'), 'month'],
        [sequelize.fn('AVG', sequelize.col('consumption')), 'avgConsumption'],
      ],
      include: [
        {
          model: Meter,
          as: 'meter',
          attributes: [],
          where: meterTypeFilter,
        },
      ],
      where: {
        readingDate: {
          [Op.between]: [startLastYear, endLastYear],
        },
      },
      group: ['meter.meter_type', sequelize.fn('DATE_FORMAT', sequelize.col('reading_date'), '%Y-%m')],
      raw: true,
    }) as any[];

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=rapport-evolution-consommation.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1E40AF').text('REE - Rabat Energie & Eau', { align: 'center' });
    doc.fontSize(16).text('Rapport d\'Évolution de la Consommation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#000000').text(`Période: ${startDate} - ${endDate}`, { align: 'center' });
    doc.moveDown(2);

    // Group by meter type
    const waterData = monthlyConsumption.filter((d: any) => d.meterType === MeterType.WATER);
    const electricityData = monthlyConsumption.filter((d: any) => d.meterType === MeterType.ELECTRICITY);

    // Water consumption
    if (waterData.length > 0) {
      doc.fontSize(14).fillColor('#3B82F6').text('Consommation d\'Eau (m³)');
      doc.fontSize(10).fillColor('#000000');
      doc.moveDown();

      waterData.forEach((data: any) => {
        const lastYear = lastYearConsumption.find(
          (ly: any) => ly.meterType === MeterType.WATER && ly.month.substring(5) === data.month.substring(5)
        );

        const avgConsumption = parseFloat(data.avgConsumption).toFixed(2);
        const totalConsumption = parseFloat(data.totalConsumption).toFixed(2);
        const lastYearAvg = lastYear ? parseFloat(lastYear.avgConsumption).toFixed(2) : 'N/A';

        doc.text(`${data.month}:`);
        doc.text(`  • Consommation moyenne: ${avgConsumption} m³`);
        doc.text(`  • Consommation totale: ${totalConsumption} m³`);
        doc.text(`  • Nombre de relevés: ${data.readingsCount}`);
        if (lastYear) {
          const diff = ((parseFloat(avgConsumption) - parseFloat(lastYearAvg)) / parseFloat(lastYearAvg)) * 100;
          doc.text(`  • Évolution (N-1): ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`);
        }
        doc.moveDown();
      });

      doc.moveDown();
    }

    // Electricity consumption
    if (electricityData.length > 0) {
      doc.fontSize(14).fillColor('#F59E0B').text('Consommation d\'Électricité (kWh)');
      doc.fontSize(10).fillColor('#000000');
      doc.moveDown();

      electricityData.forEach((data: any) => {
        const lastYear = lastYearConsumption.find(
          (ly: any) => ly.meterType === MeterType.ELECTRICITY && ly.month.substring(5) === data.month.substring(5)
        );

        const avgConsumption = parseFloat(data.avgConsumption).toFixed(2);
        const totalConsumption = parseFloat(data.totalConsumption).toFixed(2);
        const lastYearAvg = lastYear ? parseFloat(lastYear.avgConsumption).toFixed(2) : 'N/A';

        doc.text(`${data.month}:`);
        doc.text(`  • Consommation moyenne: ${avgConsumption} kWh`);
        doc.text(`  • Consommation totale: ${totalConsumption} kWh`);
        doc.text(`  • Nombre de relevés: ${data.readingsCount}`);
        if (lastYear) {
          const diff = ((parseFloat(avgConsumption) - parseFloat(lastYearAvg)) / parseFloat(lastYearAvg)) * 100;
          doc.text(`  • Évolution (N-1): ${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`);
        }
        doc.moveDown();
      });
    }

    // Footer
    doc.fontSize(8).fillColor('#666666').text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, {
      align: 'center',
    });

    doc.end();
  } catch (error) {
    console.error('Generate consumption report error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
    }
  }
};
