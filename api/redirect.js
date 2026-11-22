'use strict';

const ALLOWED_ACTIONS = new Set(['join', 'browse', 'chat', 'call', 'pricing', 'contact']);
const COUNTRY_CODE = /^[A-Z]{2}$/;

function normalizeSingle(value, fallback) {
  if (Array.isArray(value)) value = value[0];
  if (typeof value !== 'string') return fallback;
  return value.trim().toLowerCase() || fallback;
}

function isSafeDestination(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch (_) {
    return false;
  }
}

function resolveTarget(actionValue, countryValue, env) {
  const action = normalizeSingle(actionValue, 'join');
  if (!ALLOWED_ACTIONS.has(action)) return { error: 'unsupported_action' };

  const rawCountry = typeof countryValue === 'string' ? countryValue.trim().toUpperCase() : '';
  const country = COUNTRY_CODE.test(rawCountry) ? rawCountry : 'DEFAULT';
  const actionKey = action.toUpperCase();
  const candidates = [
    env[`REDIRECT_${actionKey}_${country}`],
    env[`REDIRECT_${actionKey}_DEFAULT`],
    env[`REDIRECT_${country}_URL`],
    env.REDIRECT_DEFAULT_URL,
  ];

  for (const candidate of candidates) {
    if (isSafeDestination(candidate)) {
      return { action, country, destination: candidate.trim() };
    }
  }
  return { error: 'destination_not_configured', action, country };
}

module.exports = function redirectHandler(req, res) {
  if (!['GET', 'HEAD'].includes(String(req.method || 'GET').toUpperCase())) {
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Cache-Control', 'private, no-store');
    res.statusCode = 405;
    return res.end('Method not allowed');
  }

  const country = req.headers && req.headers['x-vercel-ip-country'];
  const result = resolveTarget(req.query && req.query.action, country, process.env);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'X-Vercel-IP-Country');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (result.error === 'unsupported_action') {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Unknown redirect action.' }));
  }

  if (result.error) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      error: 'Redirect destination is not configured.',
      action: result.action,
      country: result.country,
      setup: 'Add the matching REDIRECT_<ACTION>_<COUNTRY> or REDIRECT_<ACTION>_DEFAULT environment variable in Vercel.',
    }));
  }

  res.statusCode = 302;
  res.setHeader('Location', result.destination);
  return res.end();
};

module.exports.resolveTarget = resolveTarget;
module.exports.isSafeDestination = isSafeDestination;
