import { randomUUID } from 'node:crypto';
import { saveBouquet } from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  let bouquet = req.body;
  try {
    if (typeof bouquet === 'string') bouquet = JSON.parse(bouquet);
  } catch {
    return res.status(400).json({ error: 'Could not read this bouquet.' });
  }
  if (!bouquet || !Array.isArray(bouquet.items) || bouquet.items.length < 1 || bouquet.items.length > 12) {
    return res.status(400).json({ error: 'Add at least one flower.' });
  }

  const id = randomUUID().replaceAll('-', '').slice(0, 12);
  try {
    await saveBouquet(id, { ...bouquet, id, createdAt: new Date().toISOString() });
    return res.status(201).json({ id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not save this bouquet.' });
  }
}
