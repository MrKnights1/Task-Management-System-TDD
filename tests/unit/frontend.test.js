import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { getTestDb, clearDatabase, closeDatabase } from '../helpers/testDatabase.js';

describe('Feature 5: Web UI - Static File Serving', () => {
  let db;
  let server;
  const BASE_URL = 'http://localhost:3002';

  beforeAll(async () => {
    db = getTestDb();
    await clearDatabase();

    const { startServer } = await import('../../src/server.js');
    server = await startServer(3002, db);
  });

  afterAll(async () => {
    if (server) {
      server.stop();
    }
    await closeDatabase();
  });

  test('should serve HTML page at root path', async () => {
    const response = await fetch(`${BASE_URL}/`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('<html');
    expect(html).toContain('Task Management');
  });

  test('should serve CSS files', async () => {
    const response = await fetch(`${BASE_URL}/css/style.css`);

    expect(response.status).toBe(200);
  });

  test('should serve JavaScript files', async () => {
    const response = await fetch(`${BASE_URL}/js/app.js`);

    expect(response.status).toBe(200);
  });

  test('should return 401 for non-public paths without authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/tasks`);

    expect(response.status).toBe(401);
  });
});
