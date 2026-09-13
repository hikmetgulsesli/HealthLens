/**
 * Tiny mock for the HealthLens AI_PROXY.
 *
 * Listens on http://127.0.0.1:9999 and answers the two endpoints the app
 * uses: /v1/analyze-image and /v1/analyze-text. Behaves like a deterministic
 * mock kitchen: it echoes the image mime + dimensions, returns a hand-
 * written food list, and prints the full request envelope to stdout so
 * we can watch the bytes flow.
 *
 *   node scripts/fake-ai-server.js
 *
 * Pair with `npm test -- offlineQueueProcess` to exercise the full
 * AI pipeline against a real socket without needing a deployed Kimi /
 * Minimax proxy.
 */
/* eslint-env node */
/* eslint-disable no-console */
const http = require('http');

function readBody(req) {
  return new Promise(resolve => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

const PORT = 9999;
http
  .createServer(async (req, res) => {
    const body = await readBody(req);
    const auth = req.headers.authorization;
    let payload = {};
    try { payload = JSON.parse(body); } catch {}

    console.log(`\n--- ${req.method} ${req.url}`);
    console.log('auth:', auth);
    console.log('content-length:', body.length);
    console.log('mime:', payload.mime);
    console.log('imageBase64 bytes:', (payload.imageBase64 || '').length);

    if (req.url === '/v1/analyze-image') {
      const result = {
        imageUri: payload.imageBase64 ? 'file://received.jpg' : '',
        imageUris: payload.imageBase64 ? ['file://received.jpg'] : [],
        mealCategory: 'lunch',
        smartInsight: 'Bu bir mock AI analizidir. 5 malzeme tespit edildi.',
        items: [
          {
            id: 'item-1',
            name: 'Penne Makarna',
            confidence: 0.92,
            estimatedPortionGrams: 250,
            caloriesPer100g: 165,
            proteinPer100g: 6,
            carbsPer100g: 31,
            fatPer100g: 1,
            fiberPer100g: 2,
            sugarPer100g: 1,
            sodiumPer100g: 0.3,
          },
          {
            id: 'item-2',
            name: 'Dana Eti',
            confidence: 0.88,
            estimatedPortionGrams: 150,
            caloriesPer100g: 250,
            proteinPer100g: 26,
            carbsPer100g: 0,
            fatPer100g: 17,
            fiberPer100g: 0,
            sugarPer100g: 0,
            sodiumPer100g: 0.06,
          },
          {
            id: 'item-3',
            name: 'Domates Sosu',
            confidence: 0.81,
            estimatedPortionGrams: 50,
            caloriesPer100g: 35,
            proteinPer100g: 1.5,
            carbsPer100g: 6,
            fatPer100g: 0.2,
            fiberPer100g: 1.5,
            sugarPer100g: 4,
            sodiumPer100g: 0.4,
          },
        ],
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else if (req.url === '/v1/analyze-text') {
      const result = {
        items: [
          {
            id: 'txt-1',
            name: payload.text || 'Bilinmeyen',
            confidence: 1,
            estimatedPortionGrams: 200,
            caloriesPer100g: 100,
            proteinPer100g: 5,
            carbsPer100g: 15,
            fatPer100g: 2,
          },
        ],
        mealCategory: 'lunch',
        smartInsight: 'Text-based mock response.',
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } else if (req.url === '/v1/slow') {
      // Hang forever to simulate a server-side stall. The client must
      // surface a timeout via its AbortSignal (15 s in HttpAiClient).
      // We never respond; the probe races the test against a 17 s wall.
      return;
    } else if (req.url === '/v1/error500') {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal_error' }));
    } else {
      res.writeHead(404);
      res.end('not found');
    }
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`fake AI server listening on http://127.0.0.1:${PORT}`);
  });
