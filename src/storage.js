const draftKey = 'bouquet-of-things-draft';

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(draftKey)) || null;
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

export function clearDraft() {
  localStorage.removeItem(draftKey);
}

export async function createBouquet(bouquet) {
  const response = await fetch('/api/bouquets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bouquet),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not save this bouquet.');
  return result.id;
}

export async function getBouquet(id) {
  const response = await fetch(`/api/bouquets/${encodeURIComponent(id)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'This bouquet could not be found.');
  return result;
}