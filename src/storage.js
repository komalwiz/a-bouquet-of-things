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

const linkKeys = [['flowerId', 'f'], ['meaningId', 'm'], ['content', 'c'], ['songTitle', 't'], ['artist', 'a'], ['link', 'l']];

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  return Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), (char) => char.charCodeAt(0));
}

async function transform(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

// Bouquets travel inside the share link, so no server or database is needed.
export async function encodeBouquet(bouquet) {
  const compact = {
    r: bouquet.recipientName || undefined,
    c: bouquet.creatorName || undefined,
    n: bouquet.note || undefined,
    i: bouquet.items.map((item) => Object.fromEntries(linkKeys.filter(([key]) => item[key]).map(([key, short]) => [short, item[key]]))),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  if (typeof CompressionStream === 'function') return `z${toBase64Url(await transform(bytes, new CompressionStream('deflate-raw')))}`;
  return `j${toBase64Url(bytes)}`;
}

export async function decodeBouquet(code) {
  try {
    let bytes = fromBase64Url(code.slice(1));
    if (code[0] === 'z') bytes = await transform(bytes, new DecompressionStream('deflate-raw'));
    else if (code[0] !== 'j') throw new Error('Unknown link format');
    const compact = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(compact.i) || compact.i.length === 0) throw new Error('No flowers');
    return {
      recipientName: String(compact.r || ''),
      creatorName: String(compact.c || ''),
      note: String(compact.n || ''),
      items: compact.i.slice(0, 12).map((item) => Object.fromEntries(linkKeys.map(([key, short]) => [key, String(item?.[short] ?? '')]))),
    };
  } catch {
    throw new Error('This bouquet link looks incomplete. Could you ask for the link again?');
  }
}

export async function getBouquet(id) {
  const response = await fetch(`/api/bouquets/${encodeURIComponent(id)}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'This bouquet could not be found.');
  return result;
}