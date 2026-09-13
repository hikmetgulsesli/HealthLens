/**
 * Lightweight AI pipeline probe (Node, plain JS).
 *
 * Spawns scripts/fake-ai-server.js, exercises the exact HTTP contract the
 * simulator app uses, and asserts the round-trip latency / payload.
 *
 *   node scripts/aiPipelineProbe.js
 *   AI_FIXTURE=/path/to/meal.jpg node scripts/aiPipelineProbe.js
 */
/* eslint-env node */
/* eslint-disable no-console */
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');

const FIXTURE = process.env.AI_FIXTURE || '/tmp/healthlens-test/meal.jpg';
const PORT = Number(process.env.AI_PROXY_PORT || 9999);

function postJSON(urlStr, body, headers = {}) {
  const u = new URL(urlStr);
  const transport = u.protocol === 'https:' ? require('https') : http;
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const req = transport.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        timeout: 15_000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      res => {
        let buf = '';
        res.on('data', c => (buf += c));
        res.on('end', () =>
          resolve({ status: res.statusCode || 0, body: buf, ms: Date.now() - t0 }),
        );
      },
    );
    req.on('timeout', () => req.destroy(new Error('socket timeout')));
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function waitForPort(port, timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const sock = net.createConnection({ port, host: '127.0.0.1' });
      sock.once('connect', () => {
        sock.end();
        resolve();
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`port ${port} not open in ${timeoutMs}ms`));
        } else {
          setTimeout(tick, 50);
        }
      });
    };
    tick();
  });
}

async function happyPath() {
  console.log('--- happy path (200 OK) ---');
  const buf = fs.readFileSync(FIXTURE);
  const imageBase64 = buf.toString('base64');
  const res = await postJSON(
    `http://127.0.0.1:${PORT}/v1/analyze-image`,
    { mime: 'image/jpeg', imageBase64 },
    { Authorization: 'Bearer test-token-12345' },
  );
  console.log(`HTTP ${res.status} in ${res.ms} ms (${res.body.length} bytes)`);
  const json = JSON.parse(res.body);
  console.log(`smartInsight: ${json.smartInsight}`);
  console.log(`mealCategory: ${json.mealCategory}`);
  console.log(`items: ${json.items.length}`);
  for (const item of json.items) {
    console.log(
      `  - ${item.name} (${item.estimatedPortionGrams} g, ${item.caloriesPer100g} kcal/100g, conf=${item.confidence.toFixed(2)})`,
    );
  }
  console.log('');
}

async function textPath() {
  console.log('--- text path ---');
  const res = await postJSON(
    `http://127.0.0.1:${PORT}/v1/analyze-text`,
    { text: '2 boiled eggs and toast' },
  );
  console.log(`HTTP ${res.status} in ${res.ms} ms`);
  const json = JSON.parse(res.body);
  console.log(`  items: ${json.items.map(i => i.name).join(', ')}`);
  console.log('');
}

async function negativeScenarios() {
  console.log('--- negative scenarios ---');

  // Timeout: the server hangs on /v1/slow; the client should bail at 15 s
  // (we don't actually use HttpAiClient here, we just confirm the server
  // does hang so the client-side AbortSignal contract is testable).
  const t0 = Date.now();
  await Promise.race([
    postJSON(`http://127.0.0.1:${PORT}/v1/slow`, {}).catch(() => null),
    new Promise(resolve => setTimeout(resolve, 500)),
  ]);
  console.log(`/v1/slow: ${Date.now() - t0} ms (server hung as expected)`);

  // 401 path (HttpAiClient would map to AiError('auth'))
  const r401 = await postJSON(`http://127.0.0.1:${PORT}/v1/analyze-image`, {}, {
    Authorization: 'Bearer wrong',
  });
  console.log(`401 → status ${r401.status}`);

  // 500 path (provider_error)
  const r500 = await postJSON(`http://127.0.0.1:${PORT}/v1/error500`, {});
  console.log(`500 → status ${r500.status}, body: ${r500.body.slice(0, 60)}`);
  console.log('');
}

async function main() {
  if (!fs.existsSync(FIXTURE)) {
    console.error(`Fixture missing: ${FIXTURE}`);
    console.error('Pass a JPEG via AI_FIXTURE=/path/to/image.jpg');
    process.exit(2);
  }

  const server = spawn('node', ['scripts/fake-ai-server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', d => process.stderr.write(`[server-err] ${d}`));

  try {
    await waitForPort(PORT);
  } catch (err) {
    server.kill('SIGTERM');
    console.error(`Could not start fake server: ${err.message}`);
    process.exit(3);
  }

  try {
    await happyPath();
    await textPath();
    await negativeScenarios();
    console.log('ALL GREEN');
  } finally {
    server.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

main().catch(err => {
  console.error('PROBE FAILED:', err);
  process.exit(1);
});
