import { Request, Response } from 'express';
import District from '../models/District';

/**
 * Get all districts
 */
export const getAllDistricts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const districts = await District.findAll({
      order: [['name', 'ASC']],
    });

    res.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des districts' });
  }
};
