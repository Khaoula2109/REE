import { Response } from 'supertest';

/**
 * Assert that response has pagination structure
 */
export function expectPagination(body: any) {
  expect(body).toHaveProperty('pagination');
  expect(body.pagination).toHaveProperty('total');
  expect(body.pagination).toHaveProperty('page');
  expect(body.pagination).toHaveProperty('limit');
  expect(body.pagination).toHaveProperty('totalPages');
}

/**
 * Assert that response has error message
 */
export function expectError(response: Response, status: number, message?: string) {
  expect(response.status).toBe(status);
  expect(response.body).toHaveProperty('error');
  if (message) {
    expect(response.body.error).toContain(message);
  }
}

/**
 * Assert that response is successful
 */
export function expectSuccess(response: Response, status: number = 200) {
  expect(response.status).toBe(status);
  expect(response.body).not.toHaveProperty('error');
}

/**
 * Get dates for testing (start and end of month)
 */
export function getTestDateRange() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return { startOfMonth, endOfMonth, now };
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
