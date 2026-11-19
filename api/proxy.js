import https from 'node:https';

const UPSTREAM_HOST = 'api.influencermatch.site';
const UPSTREAM_ORIGIN = `https://${UPSTREAM_HOST}`;

const channelOAuthCallbacks = new Set([
  '/api/v1/integrations/meta/callback',
  '/api/v1/integrations/instagram/callback',
  '/api/v1/integrations/tiktok/callback',
]);

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

// Only forward clean client headers; never forward Vercel/proxy headers like
// `forwarded`, `x-forwarded-host`, `x-vercel-*` which cause Spring's
// ForwardedHeaderFilter + CorsFilter to return 403 Invalid CORS request.
const ALLOWED_REQUEST_HEADERS = new Set([
  'accept',
  'accept-encoding',
  'accept-language',
  'authorization',
  'cache-control',
  'content-length',
  'content-type',
  'cookie',
  'idempotency-key',
  'if-match',
  'if-none-match',
  'pragma',
  'user-agent',
  'x-csrf-token',
  'x-xsrf-token',
  'x-requested-with',
  'x-service-key',
]);

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
export const maxDuration = 60;

export function channelOAuthReturn(req, pathname, params, upstreamStatus) {
  if (req.method !== 'GET' || !channelOAuthCallbacks.has(pathname)
      || !/\btext\/html\b/i.test(req.headers.accept || '')
      || (req.headers['sec-fetch-mode'] && req.headers['sec-fetch-mode'] !== 'navigate')) return null;

  // UI hints only. The portal reads its bound session before showing a result.
  const outcome = params.get('error') === 'access_denied' ? 'cancelled' : upstreamStatus === 409 ? 'conflict' : 'return';
  return '/creator/social-accounts?oauth=' + outcome;
}

export default function handler(req, res) {
  // Handle CORS preflight directly if browser sends OPTIONS
  if (req.method === 'OPTIONS') {
    const reqOrigin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] ||
        'Content-Type, Authorization, X-XSRF-TOKEN, X-CSRF-TOKEN, X-Requested-With, If-Match, Idempotency-Key',
    );
    res.statusCode = 204;
    res.end();
    return;
  }

  // Reconstruct upstream path + query string
  const parsedUrl = new URL(req.url || '/', UPSTREAM_ORIGIN);
  const proxyPathParam = parsedUrl.searchParams.get('__proxy_path');
  let targetPathname = parsedUrl.pathname;

  if (targetPathname === '/api/proxy' && proxyPathParam !== null) {
    const cleanPath = proxyPathParam.replace(/^\/+/, '');
    targetPathname = cleanPath ? `/api/${cleanPath}` : '/api';
  }
  parsedUrl.searchParams.delete('__proxy_path');

  // Opening the AI endpoint in a browser should lead to its UI. API clients
  // keep receiving the upstream response, including authentication errors.
  if (
    req.method === 'GET' &&
    targetPathname === '/api/v1/ai/campaign-autofill' &&
    req.headers.accept?.includes('text/html')
  ) {
    res.statusCode = 302;
    res.setHeader('Location', '/campaigns/create');
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }

  const search = parsedUrl.searchParams.toString();
  const upstreamPath = search ? `${targetPathname}?${search}` : targetPathname;
  const isChannelOAuthNavigation = channelOAuthReturn(req, targetPathname, parsedUrl.searchParams);

  const returnToChannels = (upstreamStatus) => {
    if (res.writableEnded) return;
    res.writeHead(303, {
      Location: channelOAuthReturn(req, targetPathname, parsedUrl.searchParams, upstreamStatus),
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    });
    res.end();
  };

  // Build clean upstream headers without `forwarded` or `x-forwarded-*`
  const headers = {
    host: UPSTREAM_HOST,
    origin: UPSTREAM_ORIGIN,
    referer: `${UPSTREAM_ORIGIN}/`,
  };

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (
      ALLOWED_REQUEST_HEADERS.has(lower) ||
      lower.startsWith('x-xsrf-') ||
      lower.startsWith('x-csrf-')
    ) {
      headers[lower] = value;
    }
  }

  const options = {
    hostname: UPSTREAM_HOST,
    port: 443,
    path: upstreamPath,
    method: req.method,
    headers,
    agent,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    if (isChannelOAuthNavigation) {
      proxyRes.once('end', () => returnToChannels(proxyRes.statusCode));
      proxyRes.once('error', () => returnToChannels());
      proxyRes.resume();
      return;
    }
    res.statusCode = proxyRes.statusCode || 502;
    res.setHeader('X-Proxy-Upstream', UPSTREAM_HOST);

    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (value === undefined) continue;
      const lower = key.toLowerCase();

      if (
        lower === 'access-control-allow-origin' ||
        lower === 'access-control-allow-credentials' ||
        lower === 'transfer-encoding'
      ) {
        continue;
      }

      if (lower === 'set-cookie' && Array.isArray(value)) {
        // Strip Domain attribute so cookies bind to the current frontend host (e.g. *.vercel.app)
        const rewrittenCookies = value.map((cookie) =>
          cookie.replace(/;\s*Domain=[^;]+/gi, ''),
        );
        res.setHeader('Set-Cookie', rewrittenCookies);
      } else {
        res.setHeader(key, value);
      }
    }

    proxyRes.pipe(res);
  });

  if (isChannelOAuthNavigation) {
    proxyReq.setTimeout(30000, () => proxyReq.destroy());
  }
  proxyReq.on('error', (err) => {
    if (isChannelOAuthNavigation) {
      returnToChannels();
      return;
    }
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          success: false,
          message: 'Không thể kết nối tới máy chủ API upstream.',
          detail: err.message,
        }),
      );
    } else {
      res.end();
    }
  });

  req.pipe(proxyReq);
}
