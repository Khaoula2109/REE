import { Request } from 'express';
import LoginLog from '../models/LoginLog';

interface LogLoginAttemptParams {
  email: string;
  userId?: number;
  success: boolean;
  failureReason?: string;
  req: Request;
}

/**
 * Log a login attempt (successful or failed)
 */
export const logLoginAttempt = async ({
  email,
  userId,
  success,
  failureReason,
  req,
}: LogLoginAttemptParams): Promise<void> => {
  try {
    // Extract IP address (handle proxy headers)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    // Extract User-Agent
    const userAgent = req.headers['user-agent'] || 'unknown';

    await LoginLog.create({
      userId,
      email,
      ipAddress,
      userAgent,
      success,
      failureReason,
    });
  } catch (error) {
    // Don't throw - logging failure shouldn't break the login process
    console.error('Failed to log login attempt:', error);
  }
};

/**
 * Get recent failed login attempts for an email
 */
export const getRecentFailedAttempts = async (
  email: string,
  minutes: number = 15
): Promise<number> => {
  try {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const count = await LoginLog.count({
      where: {
        email,
        success: false,
        createdAt: {
          $gte: since,
        } as any,
      },
    });

    return count;
  } catch (error) {
    console.error('Failed to get recent failed attempts:', error);
    return 0;
  }
};
