// API gateway base URL (runtime configurable)
// Priority:
// 1) window.GATEWAY_URL (injected by deploy/platform)
// 2) localStorage override (manual debug, only on localhost)
// 3) local dev fallback (:3000)
// 4) production fallback (Railway gateway)
(function initApiBase() {
  const PROD_GATEWAY_FALLBACK = 'https://gateway-production-16f9.up.railway.app';
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  const localOverride = isLocal
    ? window.localStorage.getItem('GATEWAY_URL')
    : '';

  const runtimeGateway =
    (typeof window.GATEWAY_URL === 'string' && window.GATEWAY_URL.trim()) ||
    localOverride ||
    '';

  const sanitizedRuntime = runtimeGateway
    .trim()
    .replace(/\/+$/, '')
    .replace(/(https?:\/\/[^/]+)\:3000$/, '$1');

  const selected = sanitizedRuntime
    ? sanitizedRuntime
    : (isLocal ? `${window.location.protocol}//${host}:3000` : PROD_GATEWAY_FALLBACK);

  window.API_BASE = selected.replace(/\/+$/, '');
})();

const API_BASE = window.API_BASE;
