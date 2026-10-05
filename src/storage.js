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

const linkKeys = [['flowerId', 'f'], ['meaningId', 'm'], ['content', 'c'], ['songTitle', 't'], ['artist', 'a'], ['link', 'l'], ['photo', 'p']];
const safePhoto = (value) => (/^data:image\/(webp|jpeg|png);base64,[a-z0-9+/=]+$/i.test(value) ? value : '');

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
      items: compact.i.slice(0, 12).map((item) => {
        const decoded = Object.fromEntries(linkKeys.map(([key, short]) => [key, String(item?.[short] ?? '')]));
        return { ...decoded, photo: safePhoto(decoded.photo) };
      }),
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

const pasteHost = 'https://dpaste.com';
const oneDay = 24 * 60 * 60 * 1000;
const wiltedMessage = 'This bouquet has wilted. Bouquets only last a day, so ask for a fresh one?';
const incompleteMessage = 'This bouquet link looks incomplete. Could you ask for the link again?';

// The bouquet is encrypted before upload; the key lives only in the link, so dpaste stores unreadable data.
export async function createShortLink(bouquet) {
  const code = await encodeBouquet(bouquet);
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify({ code, expiresAt: Date.now() + oneDay }));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
  const payload = new Uint8Array(iv.length + sealed.length);
  payload.set(iv);
  payload.set(sealed, iv.length);

  const response = await fetch(`${pasteHost}/api/v2/`, {
    method: 'POST',
    body: new URLSearchParams({ content: toBase64Url(payload), expiry_days: '1', syntax: 'text' }),
  });
  if (!response.ok) throw new Error('Could not shorten this bouquet.');
  const id = (await response.text()).trim().split('/').pop();
  if (!/^[A-Za-z0-9]+$/.test(id)) throw new Error('Could not shorten this bouquet.');
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return `${id}.${toBase64Url(rawKey)}`;
}

export async function openShortLink(token) {
  const [id, keyText] = token.split('.');
  if (!/^[A-Za-z0-9]+$/.test(id || '') || !keyText) throw new Error(incompleteMessage);

  const response = await fetch(`${pasteHost}/${id}.txt`);
  if (response.status === 404 || response.status === 410) throw new Error(wiltedMessage);
  if (!response.ok) throw new Error('This bouquet could not be reached. Try again in a moment?');

  let opened;
  try {
    const payload = fromBase64Url((await response.text()).trim());
    const key = await crypto.subtle.importKey('raw', fromBase64Url(keyText), 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: payload.slice(0, 12) }, key, payload.slice(12));
    opened = JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error(incompleteMessage);
  }
  if (!(Number(opened.expiresAt) > Date.now())) throw new Error(wiltedMessage);
  return { ...(await decodeBouquet(String(opened.code))), expiresAt: Number(opened.expiresAt) };
}