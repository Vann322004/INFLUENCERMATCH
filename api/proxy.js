import https from 'node:https';

const UPSTREAM_HOST = 'api.influencermatch.site';
const UPSTREAM_ORIGIN = `https://${UPSTREAM_HOST}`;

const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  rejectUnauthorized: false,
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
        'Content-Type, Authorization, X-XSRF-TOKEN, X-CSRF-TOKEN, X-Requested-With, If-Match',
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

  const search = parsedUrl.searchParams.toString();
  const upstreamPath = search ? `${targetPathname}?${search}` : targetPathname;

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

  proxyReq.on('error', (err) => {
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
