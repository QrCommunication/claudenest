/**
 * `claudenest-agent ping` — measure reachability + latency to the remote server.
 *
 * Probes the Laravel health endpoint (`/up`, with `/api/health` and root as
 * fallbacks) over N attempts and reports per-attempt + summary latency, the
 * way the classic `ping(8)` tool does. No auth required.
 */

const HEALTH_PATHS = ['/up', '/api/health', '/'];

interface PingAttempt {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
}

async function probeOnce(url: string, timeoutMs: number): Promise<PingAttempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    return { ok: res.ok, status: res.status, latencyMs };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'request failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve the first health path that responds (avoids 404 noise on `/`). */
async function resolveHealthUrl(serverUrl: string, timeoutMs: number): Promise<string> {
  const base = serverUrl.replace(/\/+$/, '');
  for (const p of HEALTH_PATHS) {
    const url = `${base}${p}`;
    const attempt = await probeOnce(url, timeoutMs);
    if (attempt.ok || (attempt.status && attempt.status < 500)) return url;
  }
  return `${base}${HEALTH_PATHS[0]}`;
}

export async function pingServer(
  serverUrl: string,
  count = 4,
  timeoutMs = 5000,
): Promise<number> {
  const target = await resolveHealthUrl(serverUrl, timeoutMs);
  console.log(`PING ${target}`);

  const latencies: number[] = [];
  let received = 0;

  for (let i = 0; i < count; i++) {
    const attempt = await probeOnce(target, timeoutMs);
    if (attempt.ok && attempt.latencyMs !== undefined) {
      received++;
      latencies.push(attempt.latencyMs);
      console.log(`reply from server: seq=${i + 1} status=${attempt.status} time=${attempt.latencyMs}ms`);
    } else {
      console.log(`request timeout: seq=${i + 1} ${attempt.error ?? `status=${attempt.status}`}`);
    }
    if (i < count - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  const loss = Math.round(((count - received) / count) * 100);
  console.log(`\n--- ${serverUrl} ping statistics ---`);
  console.log(`${count} requests, ${received} responses, ${loss}% loss`);

  if (latencies.length > 0) {
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    console.log(`rtt min/avg/max = ${min}/${avg}/${max} ms`);
  }

  // Exit code: 0 if any response, 1 if total loss (script-friendly).
  return received > 0 ? 0 : 1;
}
