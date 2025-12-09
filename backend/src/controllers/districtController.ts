import { Request, Response, NextFunction } from 'express';
import db from '../config/database';

export const getAllDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const districts = await db('districts')
      .select('id', 'name', 'code')
      .orderBy('name', 'asc');

    res.json({ districts });
  } catch (error) {
    next(error);
  }
};
