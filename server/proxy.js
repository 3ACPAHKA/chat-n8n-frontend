const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3001;
const TARGET_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.mup.me/webhook/chat';
const SECRET = process.env.WEBHOOK_SECRET;

const server = http.createServer((req, res) => {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/webhook/chat') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Prepare request to n8n
      const targetUrlParsed = url.parse(TARGET_URL);
      const options = {
        hostname: targetUrlParsed.hostname,
        port: targetUrlParsed.port || 443,
        path: targetUrlParsed.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      };

      if (SECRET) {
        options.headers['Authorization'] = 'Bearer ' + SECRET;
      }

      const proxyReq = https.request(options, (proxyRes) => {
        let responseData = '';
        proxyRes.on('data', (chunk) => {
          responseData += chunk;
        });
        proxyRes.on('end', () => {
          res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(responseData);
        });
      });

      proxyReq.on('error', (e) => {
        console.error(e);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});
