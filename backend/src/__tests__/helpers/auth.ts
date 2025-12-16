import jwt from 'jsonwebtoken';
import User from '../../models/User';
import Agent from '../../models/Agent';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Generate a JWT token for testing
 */
export function generateTestToken(userId: number, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate an auth header with Bearer token
 */
export function authHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get auth header for a user
 */
export function getUserAuthHeader(user: User): { Authorization: string } {
  const token = generateTestToken(user.id, user.role);
  return authHeader(token);
}

/**
 * Get auth header for an agent
 */
export function getAgentAuthHeader(agent: Agent): { Authorization: string } {
  const token = generateTestToken(agent.id, 'AGENT');
  return authHeader(token);
}
