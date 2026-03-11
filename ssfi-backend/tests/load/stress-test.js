/**
 * SSFI Load / Stress Test
 * =======================
 * Safe, gradual load testing for Hostinger shared hosting.
 *
 * Usage:
 *   node tests/load/stress-test.js [mode]
 *
 * Modes:
 *   smoke     - 2 users, 30s   (verify everything works)
 *   load      - 10 users, 60s  (normal expected load)
 *   stress    - 25 users, 60s  (find the breaking point)
 *   spike     - 50 users, 30s  (sudden traffic burst)
 *
 * Examples:
 *   node tests/load/stress-test.js smoke
 *   node tests/load/stress-test.js load
 *   node tests/load/stress-test.js stress
 */

const BASE_URL = process.env.API_URL || 'https://api.ssfiskate.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ssfiskate.com';

// ── Test Profiles ──
const profiles = {
  smoke:  { concurrency: 2,  duration: 30, rampUp: 5  },
  load:   { concurrency: 10, duration: 60, rampUp: 15 },
  stress: { concurrency: 25, duration: 60, rampUp: 20 },
  spike:  { concurrency: 50, duration: 30, rampUp: 5  },
};

const mode = process.argv[2] || 'smoke';
const profile = profiles[mode];
if (!profile) {
  console.error(`Unknown mode: ${mode}. Use: smoke | load | stress | spike`);
  process.exit(1);
}

// ── Endpoints to Test ──
const endpoints = [
  // Frontend pages (served by Next.js/Vercel/Hostinger)
  { name: 'Homepage',           method: 'GET', url: `${FRONTEND_URL}/`,              weight: 25 },
  // API endpoints (confirmed working)
  { name: 'Active Programs',    method: 'GET', url: `${BASE_URL}/api/v1/beginner-cert/programs/active`, weight: 25 },
  { name: 'Events List',        method: 'GET', url: `${BASE_URL}/api/v1/events`,     weight: 20 },
  { name: 'News List',          method: 'GET', url: `${BASE_URL}/api/v1/news`,       weight: 15 },
  { name: 'Notifications',      method: 'GET', url: `${BASE_URL}/api/v1/notifications/public/active`, weight: 10 },
  { name: 'Locations',          method: 'GET', url: `${BASE_URL}/api/v1/locations/states`, weight: 5 },
];

// ── Stats Tracking ──
const stats = {
  totalRequests: 0,
  successful: 0,
  failed: 0,
  errors: {},
  latencies: [],
  byEndpoint: {},
  startTime: null,
  statusCodes: {},
};

function pickEndpoint() {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
  let r = Math.random() * totalWeight;
  for (const ep of endpoints) {
    r -= ep.weight;
    if (r <= 0) return ep;
  }
  return endpoints[0];
}

async function makeRequest(endpoint) {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(endpoint.url, {
      method: endpoint.method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'SSFI-LoadTest/1.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;
    const status = res.status;

    // Track stats
    stats.totalRequests++;
    stats.latencies.push(latency);
    stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;

    if (!stats.byEndpoint[endpoint.name]) {
      stats.byEndpoint[endpoint.name] = { count: 0, success: 0, fail: 0, latencies: [] };
    }
    stats.byEndpoint[endpoint.name].count++;
    stats.byEndpoint[endpoint.name].latencies.push(latency);

    if (status >= 200 && status < 400) {
      stats.successful++;
      stats.byEndpoint[endpoint.name].success++;
    } else {
      stats.failed++;
      stats.byEndpoint[endpoint.name].fail++;
      const errKey = `${endpoint.name} → ${status}`;
      stats.errors[errKey] = (stats.errors[errKey] || 0) + 1;
    }

    return { status, latency };
  } catch (err) {
    clearTimeout(timeout);
    const latency = Date.now() - start;
    stats.totalRequests++;
    stats.failed++;
    const errMsg = err.name === 'AbortError' ? 'TIMEOUT' : err.code || err.message;
    const errKey = `${endpoint.name} → ${errMsg}`;
    stats.errors[errKey] = (stats.errors[errKey] || 0) + 1;

    if (!stats.byEndpoint[endpoint.name]) {
      stats.byEndpoint[endpoint.name] = { count: 0, success: 0, fail: 0, latencies: [] };
    }
    stats.byEndpoint[endpoint.name].count++;
    stats.byEndpoint[endpoint.name].fail++;
    stats.byEndpoint[endpoint.name].latencies.push(latency);

    return { status: 0, latency, error: errMsg };
  }
}

// ── Virtual User (simulates one browser session) ──
async function virtualUser(userId, durationMs) {
  const endTime = Date.now() + durationMs;

  while (Date.now() < endTime) {
    const endpoint = pickEndpoint();
    await makeRequest(endpoint);
    // Random think time: 500ms-2s (simulates user reading/clicking)
    await sleep(500 + Math.random() * 1500);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Percentile Calculator ──
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * (p / 100)) - 1;
  return sorted[Math.max(0, idx)];
}

// ── Report ──
function printReport() {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rps = (stats.totalRequests / (elapsed || 1)).toFixed(1);
  const successRate = stats.totalRequests > 0
    ? ((stats.successful / stats.totalRequests) * 100).toFixed(1)
    : '0';

  console.log('\n' + '='.repeat(70));
  console.log(`  SSFI LOAD TEST RESULTS — ${mode.toUpperCase()} MODE`);
  console.log('='.repeat(70));
  console.log(`  Duration:       ${elapsed}s`);
  console.log(`  Virtual Users:  ${profile.concurrency}`);
  console.log(`  Total Requests: ${stats.totalRequests}`);
  console.log(`  Requests/sec:   ${rps}`);
  console.log(`  Success Rate:   ${successRate}%`);
  console.log(`  Successful:     ${stats.successful}`);
  console.log(`  Failed:         ${stats.failed}`);
  console.log('');

  // Latency
  console.log('  ── Latency (ms) ──');
  console.log(`  Avg:  ${(stats.latencies.reduce((a, b) => a + b, 0) / (stats.latencies.length || 1)).toFixed(0)}ms`);
  console.log(`  P50:  ${percentile(stats.latencies, 50)}ms`);
  console.log(`  P90:  ${percentile(stats.latencies, 90)}ms`);
  console.log(`  P95:  ${percentile(stats.latencies, 95)}ms`);
  console.log(`  P99:  ${percentile(stats.latencies, 99)}ms`);
  console.log(`  Max:  ${Math.max(...stats.latencies, 0)}ms`);
  console.log('');

  // Status codes
  console.log('  ── HTTP Status Codes ──');
  for (const [code, count] of Object.entries(stats.statusCodes).sort()) {
    const pct = ((count / stats.totalRequests) * 100).toFixed(1);
    console.log(`  ${code}: ${count} (${pct}%)`);
  }
  console.log('');

  // Per-endpoint breakdown
  console.log('  ── Per Endpoint ──');
  console.log('  ' + '-'.repeat(66));
  console.log(`  ${'Endpoint'.padEnd(22)} ${'Reqs'.padStart(6)} ${'OK'.padStart(6)} ${'Fail'.padStart(6)} ${'Avg(ms)'.padStart(8)} ${'P95(ms)'.padStart(8)}`);
  console.log('  ' + '-'.repeat(66));
  for (const [name, data] of Object.entries(stats.byEndpoint)) {
    const avg = (data.latencies.reduce((a, b) => a + b, 0) / (data.latencies.length || 1)).toFixed(0);
    const p95 = percentile(data.latencies, 95);
    console.log(`  ${name.padEnd(22)} ${String(data.count).padStart(6)} ${String(data.success).padStart(6)} ${String(data.fail).padStart(6)} ${String(avg).padStart(8)} ${String(p95).padStart(8)}`);
  }
  console.log('');

  // Errors
  if (Object.keys(stats.errors).length > 0) {
    console.log('  ── Errors ──');
    for (const [err, count] of Object.entries(stats.errors)) {
      console.log(`  ${err}: ${count}x`);
    }
    console.log('');
  }

  // Recommendation
  console.log('  ── Recommendation ──');
  const failRate = stats.totalRequests > 0 ? (stats.failed / stats.totalRequests) * 100 : 0;
  const avgLatency = stats.latencies.reduce((a, b) => a + b, 0) / (stats.latencies.length || 1);
  const p95Latency = percentile(stats.latencies, 95);

  if (failRate < 1 && p95Latency < 2000) {
    console.log(`  ✅ Server handled ${profile.concurrency} concurrent users well.`);
    if (mode !== 'stress' && mode !== 'spike') {
      console.log(`  → Try the next level: node tests/load/stress-test.js ${mode === 'smoke' ? 'load' : 'stress'}`);
    }
  } else if (failRate < 5 && p95Latency < 5000) {
    console.log(`  ⚠️  Server is under pressure at ${profile.concurrency} users.`);
    console.log(`  → ${failRate.toFixed(1)}% errors, P95 latency ${p95Latency}ms`);
    console.log(`  → This is likely near your Hostinger hosting limit.`);
  } else {
    console.log(`  ❌ Server struggles with ${profile.concurrency} concurrent users.`);
    console.log(`  → ${failRate.toFixed(1)}% error rate, P95 latency ${p95Latency}ms`);
    console.log(`  → Consider: connection pooling, caching, or upgrading hosting.`);
  }

  console.log('='.repeat(70));
}

// ── Live Progress ──
let progressInterval;
function startProgress() {
  progressInterval = setInterval(() => {
    const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
    const rps = (stats.totalRequests / (elapsed || 1)).toFixed(1);
    process.stdout.write(
      `\r  ⏱ ${elapsed}s | Reqs: ${stats.totalRequests} | OK: ${stats.successful} | Fail: ${stats.failed} | RPS: ${rps}  `
    );
  }, 1000);
}

// ── Main ──
async function main() {
  console.log('');
  console.log('='.repeat(70));
  console.log(`  SSFI Load Test — ${mode.toUpperCase()} MODE`);
  console.log(`  Target:       ${BASE_URL}`);
  console.log(`  Concurrency:  ${profile.concurrency} virtual users`);
  console.log(`  Duration:     ${profile.duration}s`);
  console.log(`  Ramp-up:      ${profile.rampUp}s`);
  console.log('='.repeat(70));
  console.log('');

  // Quick connectivity check
  console.log('  Checking connectivity...');
  try {
    const checkRes = await fetch(`${BASE_URL}/api/v1/health`, {
      signal: AbortSignal.timeout(10000)
    }).catch(() => null);

    if (!checkRes) {
      // Try without /health
      const checkRes2 = await fetch(`${BASE_URL}/api/v1/events`, {
        signal: AbortSignal.timeout(10000)
      });
      console.log(`  ✅ API reachable (${checkRes2.status})`);
    } else {
      console.log(`  ✅ API reachable (${checkRes.status})`);
    }
  } catch (err) {
    console.error(`  ❌ Cannot reach ${BASE_URL}: ${err.message}`);
    console.error('  Set API_URL env var if using a different URL.');
    process.exit(1);
  }

  console.log(`  Starting ${profile.concurrency} virtual users over ${profile.rampUp}s ramp-up...\n`);

  stats.startTime = Date.now();
  startProgress();

  // Ramp up users gradually
  const userPromises = [];
  const delayBetweenUsers = (profile.rampUp * 1000) / profile.concurrency;

  for (let i = 0; i < profile.concurrency; i++) {
    const remainingTime = profile.duration * 1000 - (i * delayBetweenUsers);
    if (remainingTime > 0) {
      userPromises.push(
        sleep(i * delayBetweenUsers).then(() => virtualUser(i + 1, remainingTime))
      );
    }
  }

  await Promise.all(userPromises);

  clearInterval(progressInterval);
  process.stdout.write('\r' + ' '.repeat(80) + '\r'); // Clear progress line
  printReport();
}

main().catch(console.error);
