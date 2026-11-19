import http from 'node:http';

const CRAWLER_HOST = process.env.CRAWLER_HOST || '116.118.6.81';
const CRAWLER_PORT = Number(process.env.CRAWLER_PORT || 8000);

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  // Xử lý CORS Preflight nếu trình duyệt gửi OPTIONS
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
        'Content-Type, Authorization, X-Requested-With',
    );
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${CRAWLER_HOST}:${CRAWLER_PORT}`);
  const proxyPathParam = parsedUrl.searchParams.get('__path');
  let targetPathname = parsedUrl.pathname;

  if (proxyPathParam !== null) {
    const cleanPath = proxyPathParam.replace(/^\/+/, '');
    targetPathname = cleanPath ? `/${cleanPath}` : '/';
    parsedUrl.searchParams.delete('__path');
  }

  const search = parsedUrl.searchParams.toString();
  const upstreamPath = search ? `${targetPathname}?${search}` : targetPathname;

  // Lọc header sạch gửi sang VPS Crawler
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower.startsWith('x-vercel') ||
      lower === 'forwarded' ||
      lower.startsWith('x-forwarded-')
    ) {
      continue;
    }
    headers[lower] = value;
  }
  headers['host'] = `${CRAWLER_HOST}:${CRAWLER_PORT}`;

  const options = {
    hostname: CRAWLER_HOST,
    port: CRAWLER_PORT,
    path: upstreamPath,
    method: req.method,
    headers,
    timeout: 90000,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.statusCode = proxyRes.statusCode || 502;
    res.setHeader('X-Proxy-Upstream', 'Crawler-VPS');

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
      res.setHeader(key, value);
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
          message: 'Không thể kết nối tới máy chủ VPS Crawler.',
          detail: err.message,
        }),
      );
    } else {
      res.end();
    }
  });

  req.pipe(proxyReq);
}
