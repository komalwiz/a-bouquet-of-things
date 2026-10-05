// Upstash Redis REST credentials are injected by Vercel when the database is connected.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!url || !token) throw new Error('Storage is not configured.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error || 'Storage request failed.');
  return data.result;
}

export async function saveBouquet(id, bouquet) {
  await redis(['SET', `bouquet:${id}`, JSON.stringify(bouquet)]);
}

export async function loadBouquet(id) {
  const value = await redis(['GET', `bouquet:${id}`]);
  return value ? JSON.parse(value) : null;
}
