import { getFlower, getMeaning } from './data/flowers.js?v=5';

const positions = [
  { x: 210, y: 90, r: -4, s: 1.06 },
  { x: 139, y: 126, r: -14, s: 0.93 },
  { x: 284, y: 130, r: 12, s: 0.98 },
  { x: 92, y: 183, r: -18, s: 0.83 },
  { x: 329, y: 184, r: 19, s: 0.86 },
  { x: 181, y: 165, r: -6, s: 0.86 },
  { x: 248, y: 176, r: 7, s: 0.88 },
  { x: 127, y: 225, r: -12, s: 0.75 },
  { x: 293, y: 229, r: 11, s: 0.77 },
  { x: 207, y: 221, r: -3, s: 0.8 },
  { x: 64, y: 242, r: -22, s: 0.68 },
  { x: 354, y: 245, r: 21, s: 0.7 },
];

const dashColors = ['#ffc21a', '#fffaf0', '#ff8ccf'];
const confettiDashes = Array.from({ length: 22 }, (_, index) => {
  const angle = (index / 22) * Math.PI * 2 + (index % 3) * 0.09;
  const radius = 178 + (index % 4) * 9;
  const x = 210 + Math.cos(angle) * radius * 1.05;
  const y = 175 + Math.sin(angle) * radius * 0.82;
  const length = 9 + (index % 3) * 4;
  return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(angle) * length).toFixed(1)} ${(Math.sin(angle) * length).toFixed(1)}" stroke="${dashColors[index % 3]}"/>`;
}).join('');

const catLine = 'stroke="#161616" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
const catFur = '#ff9a3c';
const catArm = (d) => `<path d="${d}" fill="none" stroke="#161616" stroke-width="22" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${catFur}" stroke-width="16" stroke-linecap="round"/>`;

// Sits below the wrap on a taller canvas; paws are drawn in front of the wrap.
const catBack = `<g class="offer-cat" aria-hidden="true">
    <g class="cat-tail">
      <path d="M292 552 C342 550 352 508 332 488" fill="none" stroke="#161616" stroke-width="20" stroke-linecap="round"/>
      <path d="M292 552 C342 550 352 508 332 488" fill="none" stroke="${catFur}" stroke-width="14" stroke-linecap="round"/>
      <path d="M336 522 l10 -4 M342 506 l9 2" stroke="#d9601a" stroke-width="3" stroke-linecap="round"/>
    </g>
    <path d="M118 560 C122 530 160 518 210 518 C260 518 298 530 302 560Z" fill="${catFur}" ${catLine}/>
    <path d="M184 560 C188 546 198 540 210 540 C222 540 232 546 236 560Z" fill="#fff4dc" ${catLine}/>
    ${catArm('M150 548 Q130 470 168 412')}${catArm('M270 548 Q290 470 252 412')}
    <path d="M158 468 L166 418 L198 444Z" fill="${catFur}" ${catLine}/><path d="M167 454 L170 431 L186 445Z" fill="#ff8ccf"/>
    <path d="M262 468 L254 418 L222 444Z" fill="${catFur}" ${catLine}/><path d="M253 454 L250 431 L234 445Z" fill="#ff8ccf"/>
    <ellipse cx="210" cy="480" rx="60" ry="46" fill="${catFur}" ${catLine}/>
    <path d="M200 439 l2 11 M210 437 v12 M220 439 l-2 11" stroke="#d9601a" stroke-width="3.5" stroke-linecap="round"/>
    <g class="cat-eyes"><ellipse cx="187" cy="478" rx="6" ry="8" fill="#161616"/><ellipse cx="233" cy="478" rx="6" ry="8" fill="#161616"/><circle cx="189" cy="475" r="2.2" fill="#fff"/><circle cx="235" cy="475" r="2.2" fill="#fff"/></g>
    <circle cx="170" cy="496" r="7" fill="#ff8ccf" opacity=".8"/><circle cx="250" cy="496" r="7" fill="#ff8ccf" opacity=".8"/>
    <ellipse cx="210" cy="498" rx="19" ry="13" fill="#fff4dc" ${catLine}/>
    <path d="M205 491 h10 l-5 6Z" fill="#ff5a8a" stroke="#161616" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M210 497 q-4 7 -9 3 M210 497 q4 7 9 3" fill="none" stroke="#161616" stroke-width="2" stroke-linecap="round"/>
    <path d="M176 494 l-22 -4 M176 500 l-22 3 M244 494 l22 -4 M244 500 l22 3" stroke="#161616" stroke-width="1.8" stroke-linecap="round"/>
  </g>`;

const catFront = `<g class="offer-cat" aria-hidden="true">
    <ellipse cx="168" cy="410" rx="16" ry="13" fill="${catFur}" ${catLine}/>
    <ellipse cx="252" cy="410" rx="16" ry="13" fill="${catFur}" ${catLine}/>
    <path d="M162 404 v7 M169 403 v8 M246 404 v7 M253 403 v8" stroke="#161616" stroke-width="1.8" stroke-linecap="round"/>
  </g>
  <g class="cat-bubble" aria-hidden="true">
    <rect x="292" y="426" width="112" height="40" rx="20" fill="#fffaf0" ${catLine}/>
    <path d="M302 462 L278 482 L318 465" fill="#fffaf0" ${catLine}/>
    <text x="348" y="451" text-anchor="middle" font-size="17" font-weight="600" fill="#161616" font-family="Bricolage Grotesque, Avenir Next, sans-serif">For you!</text>
  </g>`;

const escapeText = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function petalRing(count, radius, petalWidth, petalHeight, color, wobble = 0) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (360 / count) * index + (index % 2 ? wobble : -wobble);
    const offset = index % 3 === 0 ? 1.8 : index % 3 === 1 ? -1.2 : 0;
    const width = petalWidth + (index % 2 ? 1.2 : -0.8);
    const height = petalHeight + (index % 3 === 0 ? 1.5 : -0.5);
    return `<ellipse cx="${offset}" cy="-${radius}" rx="${width}" ry="${height}" fill="${color}" stroke="#161616" stroke-width="2" vector-effect="non-scaling-stroke" transform="rotate(${angle})" />`;
  }).join('');
}

function flowerHead(flower) {
  const outline = '#161616';
  const common = `stroke="${outline}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  switch (flower.id) {
    case 'tulip':
      return `<path d="M-29 4 C-31-18-19-31-9-34 C-8-21-1-16 2-9 C7-22 16-29 27-31 C30-8 21 16 1 22 C-15 19-26 13-29 4Z" fill="${flower.color}" ${common}/><path d="M-7-32 C-4-21 0-16 2-9" fill="none" ${common}/>`;
    case 'sunflower':
      return `${petalRing(14, 27, 9, 22, flower.color, 2)}<circle r="24" fill="${flower.accent}" ${common}/>${petalRing(9, 10, 2.2, 4, '#f7eee0', 3)}`;
    case 'poppy':
      return `<path d="M0 2 C-4-31-35-35-39-7 C-42 16-18 26 0 11 C14 29 40 19 39-5 C38-31 8-31 0 2Z" fill="${flower.color}" ${common}/><path d="M0 2 C-15-11-21-13-31-12 M0 2 C15-12 24-13 33-10" fill="none" stroke="#f59a9d" stroke-width="2.4"/><circle r="11" fill="${flower.accent}" ${common}/><circle r="3.5" fill="#f7eee0"/>`;
    case 'bluebell':
      return `<path d="M-2-34 C-2-16-16-16-24-7" fill="none" ${common}/><path d="M-1-31 C2-12 14-12 24-5" fill="none" ${common}/><path d="M-1-31 L0 2" fill="none" ${common}/><path d="M-38-7 Q-24-21-11-7 L-14 12 Q-24 21-35 11Z" fill="${flower.color}" ${common}/><path d="M10-5 Q24-19 37-3 L33 15 Q22 23 13 11Z" fill="${flower.color}" ${common}/><path d="M-13 2 Q0-12 13 1 L10 22 Q0 30-10 20Z" fill="${flower.color}" ${common}/>`;
    case 'cosmos':
      return `${petalRing(7, 22, 17, 27, flower.color, 4)}<circle r="13" fill="${flower.accent}" ${common}/><circle cx="-4" cy="-2" r="2" fill="#fff7e8"/><circle cx="5" cy="3" r="2" fill="#fff7e8"/>`;
    case 'zinnia':
      return `${petalRing(10, 22, 9, 19, flower.color, 2)}<g transform="rotate(17)">${petalRing(8, 12, 7, 13, flower.accent, 3)}</g><circle r="7" fill="#f7eee0" ${common}/>`;
    case 'anemone':
      return `${petalRing(6, 21, 18, 28, flower.color, 3)}<path d="M-11-24 Q-5-10-2-3 M8-25 Q4-11 2-3" fill="none" stroke="#efa2b9" stroke-width="2.2"/><circle r="16" fill="${flower.accent}" ${common}/>${petalRing(10, 11, 1.8, 5, '#fff7e8', 1)}`;
    case 'clover':
      return `<circle cx="-15" cy="-10" r="18" fill="${flower.color}" ${common}/><circle cx="15" cy="-10" r="18" fill="${flower.color}" ${common}/><circle cx="0" cy="14" r="18" fill="${flower.color}" ${common}/><circle r="7" fill="${flower.accent}" ${common}/>`;
    case 'marigold':
      return `<path d="M0-35 C9-42 18-31 18-22 C31-28 39-15 31-5 C44 1 36 17 24 18 C27 34 11 39 2 29 C-7 42-23 34-22 21 C-39 22-42 5-30-4 C-41-16-27-30-16-24 C-13-38-4-41 0-35Z" fill="${flower.color}" ${common}/><path d="M-17-16 Q0-29 17-15 Q28 0 17 17 Q0 30-17 16 Q-29 0-17-16Z" fill="${flower.accent}" opacity=".82" ${common}/><circle r="8" fill="#fff7e8" ${common}/>`;
    default:
      return `${petalRing(9, 24, 10, 24, flower.color, 3)}<circle r="15" fill="${flower.accent}" ${common}/><circle r="5" fill="#fff7e8"/><path d="M-7-2 Q0-8 7-2" fill="none" stroke="#f3a0b5" stroke-width="1.8"/>`;
  }
}

function flowerGroup(item, index, interactive, isNew) {
  const flower = getFlower(item.flowerId);
  const meaning = getMeaning(item.meaningId);
  const position = positions[index % positions.length];
  const baseX = 184 + ((index * 17) % 48);
  const leafX = position.x + ((baseX - position.x) * 0.42);
  const leafY = position.y + 126;
  const leafSide = index % 2 ? -1 : 1;
  const leafTipX = leafX + (leafSide * 42);
  const interactiveAttributes = interactive
    ? `role="button" tabindex="0" data-flower-index="${index}" aria-label="Open ${escapeText(meaning.label)}"`
    : '';
  const stemPath = `M${baseX} 390 Q${position.x + (index % 2 ? 18 : -18)} 286 ${position.x} ${position.y + 18}`;
  return `<g class="bouquet-flower flower-${index + 1}${isNew ? ' is-new' : ''}" ${interactiveAttributes} style="--flower-order:${index}">
    <path class="stem-outline" d="${stemPath}" />
    <path class="stem" d="${stemPath}" />
    <path class="leaf" d="M${(baseX + position.x) / 2} 305 Q${position.x - 48} 280 ${position.x - 37} 316 Q${position.x - 12} 322 ${(baseX + position.x) / 2} 305Z" />
    <path class="leaf leaf-small" d="M${leafX} ${leafY} Q${leafTipX} ${leafY - 29} ${leafTipX} ${leafY + 2} Q${leafX + (leafSide * 20)} ${leafY + 18} ${leafX} ${leafY}Z" />
    <g transform="translate(${position.x} ${position.y}) rotate(${position.r}) scale(${position.s})">${flowerHead(flower)}</g>
  </g>`;
}

export function bouquetSvg(items = [], { interactive = false, className = '', newIndex = null, offer = false } = {}) {
  const flowers = items.map((item, index) => flowerGroup(item, index, interactive, index === newIndex)).join('');
  const emptySprigs = items.length === 0 ? `<g class="empty-sprig"><path class="stem-outline" d="M206 390 Q174 255 197 125"/><path class="stem" d="M206 390 Q174 255 197 125"/><path class="leaf" d="M186 238 Q140 205 151 260 Q169 273 186 238Z"/><path class="leaf" d="M190 201 Q231 169 221 221 Q204 233 190 201Z"/><circle cx="197" cy="118" r="11" fill="#ffc21a" stroke="#161616" stroke-width="2.6"/></g>` : '';
  return `<svg class="bouquet-art ${className}${offer ? ' is-offering' : ''}" viewBox="0 0 420 ${offer ? 560 : 440}" role="img" aria-label="${offer ? 'A little cat holding up an illustrated bouquet' : 'An illustrated bouquet'} with ${items.length} ${items.length === 1 ? 'flower' : 'flowers'}">
    ${offer ? catBack : ''}
    <g class="bouquet-body">
    <g class="bouquet-speckles" aria-hidden="true" fill="none" stroke-width="5" stroke-linecap="round">${confettiDashes}</g>
    <g class="bouquet-stems">${emptySprigs}${flowers}</g>
    <g class="bouquet-wrap">
      <path d="M128 300 L146 288 L164 304 L184 290 L204 306 L224 290 L244 304 L264 288 L290 300 L260 416 Q207 436 158 414Z" fill="#ff8ccf" stroke="#161616" stroke-width="3" stroke-linejoin="round"/>
      <g fill="#fffaf0" stroke="#161616" stroke-width="1.5"><circle cx="160" cy="324" r="4"/><circle cx="192" cy="332" r="3.5"/><circle cx="226" cy="326" r="4"/><circle cx="256" cy="320" r="3.5"/><circle cx="174" cy="398" r="3.5"/><circle cx="242" cy="396" r="4"/><circle cx="208" cy="414" r="3"/></g>
      <path d="M140 345 Q207 368 276 343 L272 360 Q207 384 144 362Z" fill="#ffc21a" stroke="#161616" stroke-width="2.6"/>
      <path d="M203 366 L190 402 L199 397 L205 406Z" fill="#ee3124" stroke="#161616" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M211 366 L226 400 L216 396 L210 405Z" fill="#ee3124" stroke="#161616" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M207 362 C178 344 165 365 185 383 C194 388 202 379 207 362Z" fill="#ee3124" stroke="#161616" stroke-width="2.6"/>
      <path d="M208 362 C237 343 251 363 231 383 C219 389 212 378 208 362Z" fill="#ee3124" stroke="#161616" stroke-width="2.6"/>
      <circle cx="207" cy="364" r="7" fill="#8fd3ff" stroke="#161616" stroke-width="2.6"/>
    </g>
    </g>
    ${offer ? catFront : ''}
  </svg>`;
}

export function flowerThumbnail(flower) {
  return `<svg viewBox="0 0 90 110" aria-hidden="true"><path d="M45 102 Q37 65 45 48" class="thumb-stem-outline"/><path d="M45 102 Q37 65 45 48" class="thumb-stem"/><path d="M42 77 Q19 64 25 84 Q37 88 42 77Z" class="thumb-leaf"/><g transform="translate(45 39) scale(.72)">${flowerHead(flower)}</g></svg>`;
}

export function safeText(value) {
  return escapeText(value);
}