/**
 * Utility to probe and auto-discover Actual Budget server on Umbrel subnets (e.g. 10.21.x.x)
 */

async function probeActualServer(url) {
  try {
    const cleanUrl = String(url || '').trim().replace(/\/+$/, '');
    if (!cleanUrl) return false;
    const res = await fetch(`${cleanUrl}/account/needs-bootstrap`, {
      method: 'GET',
      signal: AbortSignal.timeout(350),
      headers: { Accept: 'application/json, text/plain, */*' }
    });
    if (res.ok) {
      const text = await res.text();
      return text.includes('bootstrapped') || text.includes('needs-bootstrap');
    }
  } catch {
    return false;
  }
  return false;
}

function getCandidateSubnetUrls(currentUrl) {
  let port = 5006;
  try {
    if (currentUrl) {
      const u = new URL(currentUrl);
      if (u.port) port = Number(u.port);
    }
  } catch {}

  const candidates = [];
  const add = (host) => {
    const u = `http://${host}:${port}`;
    if (!candidates.includes(u)) candidates.push(u);
  };

  // If previous URL was e.g. 10.21.0.2, search its immediate neighbours first
  if (currentUrl) {
    try {
      const parsed = new URL(currentUrl);
      if (parsed.hostname.startsWith('10.21.')) {
        const parts = parsed.hostname.split('.');
        const lastOctet = Number(parts[3]);
        if (lastOctet) {
          const prefix = parts.slice(0, 3).join('.');
          for (let delta = 1; delta <= 5; delta++) {
            if (lastOctet - delta >= 1) add(`${prefix}.${lastOctet - delta}`);
            if (lastOctet + delta <= 50) add(`${prefix}.${lastOctet + delta}`);
          }
        }
      }
    } catch {}
  }

  // Scan common Umbrel subnets 10.21.0.x and 10.21.21.x
  for (let i = 1; i <= 35; i++) {
    add(`10.21.0.${i}`);
    add(`10.21.21.${i}`);
  }

  return candidates;
}

async function discoverWorkingActualUrl(currentUrl) {
  if (currentUrl && (await probeActualServer(currentUrl))) {
    return currentUrl;
  }

  const candidates = getCandidateSubnetUrls(currentUrl);
  const batchSize = 15;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (u) => ({ url: u, ok: await probeActualServer(u) }))
    );
    const found = results.find((r) => r.ok);
    if (found) return found.url;
  }

  return null;
}

module.exports = { probeActualServer, discoverWorkingActualUrl };
