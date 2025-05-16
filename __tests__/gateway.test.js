import assert from 'node:assert';
import test from 'node:test';
import { ApiGateway } from '../dist/gateway.js';

test('ApiGateway resolves routes and performs least-connection balancing', () => {
  const gw = new ApiGateway();
  gw.addService('auth', 'http://10.0.0.1:4000');
  gw.addRoute({ prefix: '/api/v1/auth', targetService: 'auth', rateLimitPerSec: 10 });

  const resolved = gw.resolveRoute('/api/v1/auth/login');
  assert.ok(resolved);
  assert.strictEqual(resolved.upstreamUrl, 'http://10.0.0.1:4000');
  assert.strictEqual(gw.checkRateLimit('client_ip_1', 2), true);
});
