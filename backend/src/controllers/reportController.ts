import { Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import db from '../config/database';
import { AuthRequest } from '../types';

export const generateMonthlyReadingsReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();

    // Agent distribution by district
    const agentsByDistrict = await db('agents')
      .select(
        'districts.name as districtName',
        db.raw('COUNT(agents.id) as agentCount')
      )
      .join('districts', 'agents.district_id', 'districts.id')
      .groupBy('districts.id', 'districts.name')
      .orderBy('districts.name');

    // Average readings per agent per day per district
    const readingsByDistrict = await db('readings')
      .select(
        'districts.name as districtName',
        db.raw('COUNT(readings.id) as totalReadings'),
        db.raw('COUNT(DISTINCT readings.agent_id) as agentCount'),
        db.raw('DATEDIFF(?, ?) as days', [end, start]),
        db.raw('COUNT(readings.id) / (COUNT(DISTINCT readings.agent_id) * DATEDIFF(?, ?)) as avgPerAgentPerDay', [end, start])
      )
      .join('agents', 'readings.agent_id', 'agents.id')
      .join('districts', 'agents.district_id', 'districts.id')
      .whereBetween('readings.reading_date', [start, end])
      .groupBy('districts.id', 'districts.name')
      .orderBy('districts.name');

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=monthly-readings-report.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#1E40AF').text('REE - Rapport Mensuel des Relevés', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#F59E0B').text(`Période: ${start.toLocaleDateString('fr-MA')} - ${end.toLocaleDateString('fr-MA')}`, { align: 'center' });
    doc.moveDown(2);

    // Agent Distribution
    doc.fontSize(16).fillColor('#1E40AF').text('Répartition des Agents par Quartier');
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#000');
    agentsByDistrict.forEach((item) => {
      doc.text(`${item.districtName}: ${item.agentCount} agent(s)`);
    });

    doc.moveDown(2);

    // Readings Statistics
    doc.fontSize(16).fillColor('#1E40AF').text('Statistiques des Relevés par Quartier');
    doc.moveDown(1);

    doc.fontSize(10).fillColor('#000');
    readingsByDistrict.forEach((item) => {
      doc.text(`${item.districtName}:`);
      doc.text(`  - Total des relevés: ${item.totalReadings}`, { indent: 20 });
      doc.text(`  - Moyenne par agent/jour: ${Math.round(item.avgPerAgentPerDay * 100) / 100}`, { indent: 20 });
      doc.moveDown(0.5);
    });

    doc.moveDown(2);

    // Footer
    doc.fontSize(8).fillColor('#666').text(
      `Généré le ${new Date().toLocaleString('fr-MA')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};

export const generateConsumptionEvolutionReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, type } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = endDate ? new Date(endDate as string) : new Date();

    let query = db('readings')
      .select(
        db.raw('YEAR(reading_date) as year'),
        db.raw('MONTH(reading_date) as month'),
        'meters.type',
        db.raw('AVG(consumption) as avgConsumption'),
        db.raw('SUM(consumption) as totalConsumption'),
        db.raw('COUNT(*) as readingsCount')
      )
      .join('meters', 'readings.meter_id', 'meters.id')
      .whereBetween('readings.reading_date', [start, end])
      .groupBy(db.raw('YEAR(reading_date), MONTH(reading_date), meters.type'))
      .orderBy('year', 'asc')
      .orderBy('month', 'asc')
      .orderBy('type');

    if (type) {
      query = query.where('meters.type', type);
    }

    const results = await query;

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=consumption-evolution-report.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#1E40AF').text('REE - Rapport d\'Évolution de la Consommation', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#F59E0B').text(`Période: ${start.toLocaleDateString('fr-MA')} - ${end.toLocaleDateString('fr-MA')}`, { align: 'center' });
    doc.moveDown(2);

    // Water consumption
    const waterData = results.filter((r) => r.type === 'WATER');
    if (waterData.length > 0) {
      doc.fontSize(16).fillColor('#1E40AF').text('Consommation d\'Eau (m³)');
      doc.moveDown(1);

      doc.fontSize(10).fillColor('#000');
      waterData.forEach((item) => {
        const monthName = new Date(item.year, item.month - 1).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' });
        doc.text(`${monthName}: ${Math.round(item.avgConsumption * 100) / 100} m³ (moyenne) - ${Math.round(item.totalConsumption)} m³ (total)`);
      });

      doc.moveDown(2);
    }

    // Electricity consumption
    const electricityData = results.filter((r) => r.type === 'ELECTRICITY');
    if (electricityData.length > 0) {
      doc.fontSize(16).fillColor('#1E40AF').text('Consommation d\'Électricité (kWh)');
      doc.moveDown(1);

      doc.fontSize(10).fillColor('#000');
      electricityData.forEach((item) => {
        const monthName = new Date(item.year, item.month - 1).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' });
        doc.text(`${monthName}: ${Math.round(item.avgConsumption * 100) / 100} kWh (moyenne) - ${Math.round(item.totalConsumption)} kWh (total)`);
      });

      doc.moveDown(2);
    }

    // Footer
    doc.fontSize(8).fillColor('#666').text(
      `Généré le ${new Date().toLocaleString('fr-MA')}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};
