import { bouquetSvg, flowerThumbnail, safeText } from './bouquet.js?v=7';
import { flowers, getFlower, getMeaning, meanings } from './data/flowers.js?v=5';
import { clearDraft, createBouquet, getBouquet, loadDraft, saveDraft } from './storage.js';

const app = document.querySelector('#app');
const pathMatch = location.pathname.match(/^\/bouquet\/([a-z0-9]+)$/i);
const storedDraft = loadDraft();
let bouquetAudio = null;

const state = {
  mode: pathMatch ? 'recipient-loading' : 'creator',
  step: storedDraft?.items?.length ? 'resting' : 'intro',
  items: storedDraft?.items || [],
  draft: { flowerId: flowers[0].id, meaningId: null, photo: '' },
  recipientName: storedDraft?.recipientName || '',
  creatorName: storedDraft?.creatorName || '',
  note: storedDraft?.note || '',
  shareId: storedDraft?.shareId || '',
  bouquet: null,
  opened: false,
  bloomed: false,
  justPlaced: null,
  activeIndex: null,
  unlocked: new Set(),
  justUnlocked: null,
  notesOpen: false,
  notesShown: false,
  catShown: false,
  songStatus: 'idle',
  busy: false,
  error: '',
  toast: '',
};

function button(label, action, className = 'button-primary', extra = '') {
  return `<button class="${className}" type="button" data-action="${action}" ${extra}>${label}</button>`;
}

function iconButton(label, action, icon) {
  return `<button class="icon-button" type="button" data-action="${action}" aria-label="${label}" title="${label}">${icon}</button>`;
}

function persistCreator() {
  saveDraft({
    items: state.items,
    recipientName: state.recipientName,
    creatorName: state.creatorName,
    note: state.note,
    shareId: state.shareId,
  });
}

function bouquetSong() {
  return state.bouquet?.items.find((item) => item.meaningId === 'song' && /^https?:\/\//i.test(item.link || '')) || null;
}

function isDirectAudioLink(link) {
  return /\.(mp3|m4a|aac|ogg|oga|wav)(?:[?#].*)?$/i.test(link || '');
}

function playBouquetSong() {
  const song = bouquetSong();
  if (!song || !isDirectAudioLink(song.link)) {
    state.songStatus = song ? 'link-only' : 'none';
    return;
  }

  bouquetAudio?.pause();
  bouquetAudio = new Audio(song.link);
  bouquetAudio.loop = true;
  bouquetAudio.volume = 0.55;
  state.songStatus = 'starting';
  bouquetAudio.play().then(() => {
    state.songStatus = 'playing';
    render();
  }).catch(() => {
    state.songStatus = 'paused';
    render();
  });
}

function soundtrackControl() {
  const song = bouquetSong();
  if (!song || !isDirectAudioLink(song.link)) return '';
  const playing = state.songStatus === 'playing' || state.songStatus === 'starting';
  return `<button class="soundtrack-control" type="button" data-action="toggle-song" aria-label="${playing ? 'Pause' : 'Play'} bouquet song" title="${playing ? 'Pause' : 'Play'} bouquet song"><span aria-hidden="true">${playing ? 'Ⅱ' : '♪'}</span><span>Bouquet song</span></button>`;
}

function creatorHeading() {
  if (state.step === 'intro') {
    return `<div class="opening-copy"><p class="eyebrow">A Bouquet of Things</p><h1>Make someone<br>a <em>bouquet</em>.</h1><p>Put a few things in it.</p></div>`;
  }
  const count = state.items.length;
  return `<div class="stage-copy"><p class="eyebrow">A Bouquet of Things</p><h1>${count ? `${count} little ${count === 1 ? 'thing' : 'things'},<br>all together.` : 'Start with a flower.'}</h1></div>`;
}

function flowerPicker() {
  return `<div class="tray-heading"><span class="step-mark">1</span><div><h2>Pick a flower.</h2><p>Whichever one feels right.</p></div></div>
    <div class="flower-picker" role="list" aria-label="Choose a flower">
      ${flowers.map((flower) => `<button class="flower-choice" type="button" data-action="pick-flower" data-value="${flower.id}" aria-label="Choose ${flower.name}">
        ${flowerThumbnail(flower)}<span>${flower.name}</span>
      </button>`).join('')}
    </div>`;
}

function meaningPicker() {
  const flower = getFlower(state.draft.flowerId);
  return `${iconButton('Back to flowers', 'back-to-flowers', '←')}
    <div class="tray-heading"><span class="step-mark">2</span><div><h2>What does it hold?</h2><p>${safeText(flower.name)}, with something tucked inside.</p></div></div>
    <div class="meaning-list">
      ${meanings.map((meaning) => `<button type="button" data-action="pick-meaning" data-value="${meaning.id}"><span>${safeText(meaning.label)}</span><span aria-hidden="true">→</span></button>`).join('')}
    </div>`;
}

function contentFields(meaning) {
  if (meaning.kind === 'song') {
    return `<label>Song title<input name="songTitle" required maxlength="100" placeholder="${safeText(meaning.placeholder)}"></label>
      <label>Artist<input name="artist" required maxlength="100" placeholder="Who plays it?"></label>
      <label>Song link<input name="link" type="url" required placeholder="https://…"><span class="field-hint">Direct .mp3, .m4a or .ogg links play when the bouquet opens. Spotify and YouTube links open from the flower.</span></label>
      <label>A tiny note <span class="optional">optional</span><textarea name="content" maxlength="280" placeholder="Why this one?"></textarea></label>`;
  }
  if (meaning.kind === 'photo') {
    return `<label class="photo-drop"><input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" ${state.draft.photo ? '' : 'required'}><span>${state.draft.photo ? 'Choose a different photo' : 'Choose a photo'}</span></label>
      ${state.draft.photo ? `<img class="photo-preview" src="${state.draft.photo}" alt="Your chosen photo preview">` : ''}
      <label>A note <span class="optional">optional</span><textarea name="content" maxlength="280" placeholder="${safeText(meaning.placeholder)}"></textarea></label>`;
  }
  return `<label class="visually-hidden" for="thing-content">${safeText(meaning.label)}</label><textarea id="thing-content" class="big-note" name="content" required maxlength="280" placeholder="${safeText(meaning.placeholder)}" autofocus></textarea>`;
}

function contentComposer() {
  const meaning = getMeaning(state.draft.meaningId);
  return `${iconButton('Back to meanings', 'back-to-meanings', '←')}
    <div class="tray-heading"><span class="step-mark">3</span><div><p class="mini-label">${safeText(meaning.label)}</p><h2>${safeText(meaning.prompt)}</h2></div></div>
    <form class="content-form" data-form="place-flower">
      ${contentFields(meaning)}
      <div class="tray-actions"><button class="button-primary" type="submit">Place it in the bouquet <span aria-hidden="true">↗</span></button></div>
    </form>`;
}

function restingTray() {
  return `<div class="resting-tray">
    <p>${state.items.length < 3 ? 'A few more makes a lovely bunch.' : state.items.length < 12 ? 'One more?' : 'That is one very full bouquet.'}</p>
    <div class="resting-actions">
      ${state.items.length < 12 ? button('Add another flower', 'add-flower', 'button-secondary') : ''}
      ${button('Send it?', 'open-share')}
    </div>
  </div>`;
}

function shareTray() {
  if (!state.shareId) {
    return `${iconButton('Back to bouquet', 'close-share', '←')}
      <div class="tray-heading"><span class="step-mark">✦</span><div><h2>Who is it for?</h2><p>Just enough for the little note on the wrapping.</p></div></div>
      <form class="share-details" data-form="save-bouquet">
        <div class="field-pair"><label>Their name <span class="optional">optional</span><input name="recipientName" maxlength="60" value="${safeText(state.recipientName)}" placeholder="Sam"></label>
        <label>Your name <span class="optional">optional</span><input name="creatorName" maxlength="60" value="${safeText(state.creatorName)}" placeholder="Alex"></label></div>
        <label>A note on the wrapping <span class="optional">optional</span><textarea name="note" maxlength="180" placeholder="I made a little something for you.">${safeText(state.note)}</textarea></label>
        ${state.error ? `<p class="form-error" role="alert">${safeText(state.error)}</p>` : ''}
        <button class="button-primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Tying the ribbon…' : 'Make the link'}</button>
      </form>`;
  }

  const url = `${location.origin}/bouquet/${state.shareId}`;
  const whatsappText = encodeURIComponent(`I made a little something for you 🌼\n${url}`);
  return `<div class="send-ready"><p class="eyebrow">Ready to go</p><h2>Send it?</h2><p>The same little bouquet, wherever the link goes.</p>
    <div class="share-actions">
      <a class="button-primary whatsapp" href="https://wa.me/?text=${whatsappText}" target="_blank" rel="noreferrer"><span aria-hidden="true">↗</span> Send on WhatsApp</a>
      <button class="button-secondary" type="button" data-action="show-email"><span aria-hidden="true">✉</span> Send by email</button>
      <button class="button-secondary" type="button" data-action="copy-link"><span aria-hidden="true">⧉</span> Copy link</button>
    </div>
    <form class="email-postcard ${state.emailOpen ? 'is-open' : ''}" data-form="send-email">
      <div class="postcard-stamp">🌼</div><p class="mini-label">A tiny digital postcard</p>
      <label>Email address<input type="email" name="email" required placeholder="friend@example.com"></label>
      <button class="button-small" type="submit">Open email</button>
    </form>
    <div class="after-share"><button type="button" data-action="print">Print this bouquet</button><span aria-hidden="true">·</span><button type="button" data-action="add-after-share">Add one more</button></div>
  </div>`;
}

function creatorTray() {
  if (state.step === 'flower') return flowerPicker();
  if (state.step === 'meaning') return meaningPicker();
  if (state.step === 'content') return contentComposer();
  if (state.step === 'share') return shareTray();
  return restingTray();
}

function printComposition(bouquet) {
  const recipient = bouquet.recipientName ? `For ${safeText(bouquet.recipientName)}` : 'Made just for you';
  return `<section class="print-sheet" aria-hidden="true">
    <header><p>A Bouquet of Things</p><h1>${recipient}</h1></header>
    <div class="print-bouquet">${bouquetSvg(bouquet.items)}</div>
    <div class="print-notes">${bouquet.items.map((item, index) => {
      const meaning = getMeaning(item.meaningId);
      const flower = getFlower(item.flowerId);
      const mainText = item.songTitle ? `${item.songTitle} — ${item.artist}` : item.content || 'Just because.';
      return `<article style="--note-color:${flower.color}"><span>${index + 1}</span><div><h2>${safeText(meaning.label)}</h2><p>${safeText(mainText)}</p>${item.photo ? `<img src="${item.photo}" alt="">` : ''}</div></article>`;
    }).join('')}</div>
    <footer>${bouquet.creatorName ? `Made by ${safeText(bouquet.creatorName)}, with a little thought.` : 'Made with a little thought.'}</footer>
  </section>`;
}

function renderCreator() {
  const draftBouquet = {
    items: state.items,
    recipientName: state.recipientName,
    creatorName: state.creatorName,
  };
  app.innerHTML = `<div class="paper-noise"></div>
    <header class="site-header"><a href="/" aria-label="A Bouquet of Things home"><span class="brand-flower">✿</span><span>A Bouquet of Things</span></a>
      ${state.items.length ? iconButton('Start over', 'reset', '↺') : ''}
    </header>
    <main class="creator-shell ${state.step === 'intro' ? 'is-intro' : ''}">
      <section class="object-stage" aria-live="polite">
        ${creatorHeading()}
        <div class="bouquet-frame ${state.items.length ? 'has-flowers' : ''}">${bouquetSvg(state.items, { newIndex: state.justPlaced })}</div>
        ${state.step === 'intro' ? `<div class="intro-action">${button('Pick the first flower', 'begin')}</div>` : ''}
      </section>
      ${state.step !== 'intro' ? `<aside class="maker-tray">${creatorTray()}</aside>` : ''}
    </main>
    ${printComposition(draftBouquet)}
    <div class="toast ${state.toast ? 'is-visible' : ''}" role="status">${safeText(state.toast)}</div>`;
  state.justPlaced = null;
}

function itemContent(item) {
  const meaning = getMeaning(item.meaningId);
  const safeLink = /^https?:\/\//i.test(item.link || '') ? item.link : '';
  let content = `<p class="flower-kind">${safeText(meaning.label)}</p>`;
  if (item.photo) content += `<img class="recipient-photo" src="${item.photo}" alt="A photo tucked into this flower">`;
  if (item.songTitle) {
    content += `<h2>${safeText(item.songTitle)}</h2><p class="artist">${safeText(item.artist)}</p>`;
    if (safeLink) content += `<a class="song-link" href="${safeText(safeLink)}" target="_blank" rel="noreferrer">Listen to this one <span aria-hidden="true">↗</span></a>`;
  }
  if (item.content) content += `<p class="note-copy">${safeText(item.content)}</p>`;
  return content;
}

function renderRecipient() {
  if (state.mode === 'recipient-loading') {
    app.innerHTML = `<main class="loading-view"><div class="loading-flower">✿</div><p>Gathering the flowers…</p></main>`;
    return;
  }
  if (state.mode === 'recipient-error') {
    app.innerHTML = `<main class="error-view"><p class="eyebrow">A Bouquet of Things</p><h1>Oh. This one wandered off.</h1><p>${safeText(state.error)}</p><a class="button-primary" href="/">Make a new bouquet</a></main>`;
    return;
  }

  const bouquet = state.bouquet;
  if (!state.opened) {
    app.innerHTML = `<div class="paper-noise"></div><main class="recipient-gate">
      <p class="eyebrow">A Bouquet of Things</p>
      <div class="closed-bouquet">${bouquetSvg(bouquet.items)}</div>
      <div class="gate-copy"><h1>Someone made<br>something <em>for you</em>.</h1>${bouquet.note ? `<p>“${safeText(bouquet.note)}”</p>` : ''}
      <p class="discovery-copy">Every flower is holding a memory, song, or little note. Open the bouquet, then tap each one to unlock it.</p>
      ${button('Tap to open your bouquet', 'open-bouquet')}</div>
    </main>${printComposition(bouquet)}`;
    return;
  }

  const activeItem = state.activeIndex === null ? null : bouquet.items[state.activeIndex];
  const unlockedCount = state.unlocked.size;
  const unlockedOrder = [...state.unlocked].reverse();
  const showNotes = state.notesOpen && unlockedCount > 0;
  const notesArriving = showNotes && !state.notesShown;
  const complete = unlockedCount === bouquet.items.length;
  const catArriving = complete && !state.catShown;
  const bouquetClass = `${state.bloomed ? 'is-open is-settled' : 'is-open'}${catArriving ? ' cat-arriving' : ''}`;
  app.innerHTML = `<div class="paper-noise"></div>
    <header class="recipient-header"><span class="brand-flower">✿</span><span>${bouquet.recipientName ? `For ${safeText(bouquet.recipientName)}` : 'A Bouquet of Things'}</span>${soundtrackControl()}${iconButton('Print this bouquet', 'print', '⤓')}</header>
    <main class="recipient-open">
      <div class="recipient-instruction"><p><strong>${unlockedCount === bouquet.items.length ? 'You found every little thing.' : 'Tap each flower to unlock the memory inside.'}</strong><span>${unlockedCount} of ${bouquet.items.length} unlocked${activeItem ? ' · There it is.' : ''}</span></p></div>
      <div class="recipient-bouquet${complete ? ' is-complete' : ''}">${bouquetSvg(bouquet.items, { interactive: true, className: bouquetClass, offer: complete })}</div>
      <aside class="flower-note ${showNotes ? 'is-open' : ''} ${notesArriving ? 'is-arriving' : ''} ${complete ? 'is-docked' : ''}" aria-live="polite" aria-label="Unlocked notes">
        ${showNotes ? `<div class="notes-head"><p class="flower-kind">Unlocked so far · ${unlockedCount} of ${bouquet.items.length}</p><button class="note-close" type="button" data-action="close-note" aria-label="Hide notes">×</button></div>
        ${unlockedOrder.map((index) => `<article class="note-card${index === state.activeIndex ? ' is-current' : ''}${index === state.justUnlocked ? ' is-new' : ''}">${itemContent(bouquet.items[index])}<p class="note-number">Flower ${index + 1} of ${bouquet.items.length}</p></article>`).join('')}` : ''}
      </aside>
      <footer class="recipient-footer"><button type="button" data-action="print">Print this bouquet</button><span>${bouquet.creatorName ? `Made by ${safeText(bouquet.creatorName)}.` : 'Made with a little thought.'}</span></footer>
    </main>${printComposition(bouquet)}`;
  state.bloomed = true;
  state.notesShown = showNotes;
  state.catShown = complete;
  state.justUnlocked = null;
  app.querySelector('.note-card.is-current')?.scrollIntoView({ block: 'nearest' });
}

function openFlower(index) {
  if (!state.unlocked.has(index)) state.justUnlocked = index;
  state.unlocked.add(index);
  state.activeIndex = index;
  state.notesOpen = true;
  render();
}

function render() {
  if (state.mode === 'creator') renderCreator();
  else renderRecipient();
}

// Clipboard API only exists on https or localhost; fall back for plain-http network addresses.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}

function setToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = '';
    render();
  }, 1800);
}

async function compressPhoto(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  if (file.type === 'image/gif') return dataUrl;
  const image = await new Promise((resolve, reject) => {
    const candidate = new Image();
    candidate.onload = () => resolve(candidate);
    candidate.onerror = reject;
    candidate.src = dataUrl;
  });
  const max = 1800;
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

app.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action], [data-flower-index]');
  if (!target) return;

  if (target.hasAttribute('data-flower-index')) {
    openFlower(Number(target.dataset.flowerIndex));
    return;
  }

  const action = target.dataset.action;
  if (action === 'begin' || action === 'add-flower' || action === 'add-after-share') {
    state.step = 'flower';
    state.shareId = '';
  } else if (action === 'pick-flower') {
    state.draft = { flowerId: target.dataset.value, meaningId: null, photo: '' };
    state.step = 'meaning';
  } else if (action === 'pick-meaning') {
    state.draft.meaningId = target.dataset.value;
    state.step = 'content';
  } else if (action === 'back-to-flowers') {
    state.step = 'flower';
  } else if (action === 'back-to-meanings') {
    state.step = 'meaning';
  } else if (action === 'open-share') {
    state.step = 'share';
  } else if (action === 'close-share') {
    state.step = 'resting';
  } else if (action === 'show-email') {
    state.emailOpen = true;
  } else if (action === 'copy-link') {
    const url = `${location.origin}/bouquet/${state.shareId}`;
    if (await copyText(url)) setToast('Copied 🌼');
    else window.prompt('Copy this link:', url);
    return;
  } else if (action === 'print') {
    window.print();
    return;
  } else if (action === 'open-bouquet') {
    state.opened = true;
    render();
    playBouquetSong();
    return;
  } else if (action === 'toggle-song') {
    if (!bouquetAudio) {
      playBouquetSong();
    } else if (bouquetAudio.paused) {
      bouquetAudio.play().then(() => {
        state.songStatus = 'playing';
        render();
      }).catch(() => setToast('Tap the song flower to open its link.'));
    } else {
      bouquetAudio.pause();
      state.songStatus = 'paused';
      render();
    }
    return;
  } else if (action === 'close-note') {
    state.activeIndex = null;
    state.notesOpen = false;
    render();
    return;
  } else if (action === 'reset') {
    if (!confirm('Start this bouquet over?')) return;
    clearDraft();
    state.items = [];
    state.shareId = '';
    state.step = 'intro';
  }
  persistCreator();
  render();
});

app.addEventListener('keydown', (event) => {
  const flower = event.target.closest('[data-flower-index]');
  if (flower && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    openFlower(Number(flower.dataset.flowerIndex));
  }
});

app.addEventListener('change', async (event) => {
  if (event.target.name !== 'photo' || !event.target.files?.[0]) return;
  const file = event.target.files[0];
  if (file.size > 12_000_000) {
    setToast('Try a photo under 12 MB.');
    return;
  }
  state.draft.photo = await compressPhoto(file);
  render();
});

app.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  if (form.dataset.form === 'place-flower') {
    state.items.push({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      flowerId: state.draft.flowerId,
      meaningId: state.draft.meaningId,
      content: String(data.get('content') || '').trim(),
      songTitle: String(data.get('songTitle') || '').trim(),
      artist: String(data.get('artist') || '').trim(),
      link: String(data.get('link') || '').trim(),
      photo: state.draft.photo || '',
    });
    state.draft = { flowerId: flowers[0].id, meaningId: null, photo: '' };
    state.justPlaced = state.items.length - 1;
    state.shareId = '';
    state.step = 'resting';
    persistCreator();
    render();
  }

  if (form.dataset.form === 'save-bouquet') {
    state.recipientName = String(data.get('recipientName') || '').trim();
    state.creatorName = String(data.get('creatorName') || '').trim();
    state.note = String(data.get('note') || '').trim();
    state.busy = true;
    state.error = '';
    render();
    try {
      state.shareId = await createBouquet({
        items: state.items,
        recipientName: state.recipientName,
        creatorName: state.creatorName,
        note: state.note,
      });
      persistCreator();
    } catch (error) {
      state.error = error.message;
    } finally {
      state.busy = false;
      render();
    }
  }

  if (form.dataset.form === 'send-email') {
    const email = String(data.get('email') || '');
    const url = `${location.origin}/bouquet/${state.shareId}`;
    const subject = encodeURIComponent('A little bouquet for you 🌼');
    const body = encodeURIComponent(`${state.note || 'I made a little something for you.'}\n\nOpen your bouquet: ${url}\n\nMade with a little thought.`);
    location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  }
});

async function start() {
  render();
  if (!pathMatch) return;
  try {
    state.bouquet = await getBouquet(pathMatch[1]);
    state.mode = 'recipient';
  } catch (error) {
    state.mode = 'recipient-error';
    state.error = error.message;
  }
  render();
}

start();