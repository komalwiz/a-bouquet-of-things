import { loadBouquet } from '../_store.js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (req.method !== 'GET' || !/^[a-z0-9]{1,32}$/i.test(id || '')) {
    return res.status(404).json({ error: 'This bouquet could not be found.' });
  }

  try {
    const bouquet = await loadBouquet(id);
    return bouquet
      ? res.status(200).json(bouquet)
      : res.status(404).json({ error: 'This bouquet could not be found.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not open this bouquet.' });
  }
}
