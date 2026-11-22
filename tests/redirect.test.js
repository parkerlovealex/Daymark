'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/redirect');
const { resolveTarget, isSafeDestination } = handler;

const env = {
  REDIRECT_JOIN_US: 'https://us.example.test/signup',
  REDIRECT_JOIN_DEFAULT: 'https://global.example.test/signup',
  REDIRECT_BROWSE_DEFAULT: 'https://global.example.test/discover',
  REDIRECT_US_URL: 'https://us.example.test',
  REDIRECT_DEFAULT_URL: 'https://global.example.test',
};

test('US visitor receives the US action-specific destination', () => {
  const result = resolveTarget('join', 'US', env);
  assert.equal(result.destination, 'https://us.example.test/signup');
  assert.equal(result.country, 'US');
});

test('non-US visitor falls back to the action default', () => {
  const result = resolveTarget('join', 'CA', env);
  assert.equal(result.destination, 'https://global.example.test/signup');
});

test('shared country fallback is used when action-specific target is missing', () => {
  const result = resolveTarget('chat', 'US', env);
  assert.equal(result.destination, 'https://us.example.test');
});

test('unknown country falls back to the default destination', () => {
  const result = resolveTarget('browse', undefined, env);
  assert.equal(result.destination, 'https://global.example.test/discover');
});

test('unsupported actions are rejected', () => {
  assert.deepEqual(resolveTarget('https://evil.example', 'US', env), { error: 'unsupported_action' });
});

test('only HTTPS destinations (or localhost HTTP) are accepted', () => {
  assert.equal(isSafeDestination('https://app.example.test/path'), true);
  assert.equal(isSafeDestination('http://localhost:3000/path'), true);
  assert.equal(isSafeDestination('http://app.example.test/path'), false);
  assert.equal(isSafeDestination('javascript:alert(1)'), false);
});

test('handler returns a 302 and never accepts a URL from the query string', () => {
  const originalEnv = process.env.REDIRECT_JOIN_US;
  process.env.REDIRECT_JOIN_US = 'https://us.example.test/signup';
  const headers = {};
  const res = {
    statusCode: 200,
    setHeader(key, value) { headers[key] = value; },
    end(body) { this.body = body; },
  };
  handler({ method: 'GET', headers: { 'x-vercel-ip-country': 'US' }, query: { action: 'join', url: 'https://evil.example' } }, res);
  assert.equal(res.statusCode, 302);
  assert.equal(headers.Location, 'https://us.example.test/signup');
  assert.equal(headers['Cache-Control'], 'private, no-store');
  if (originalEnv === undefined) delete process.env.REDIRECT_JOIN_US;
  else process.env.REDIRECT_JOIN_US = originalEnv;
});
