// ===================== PORTRAITS ET TROPHÉES (dessinés en code, aucun fichier) =====================
// Portraits : un visage illustré, toujours le même pour un même nom (teint, coiffure, barbe, lunettes…),
// habillé selon le rôle : agent en costume, coach en survêtement, coéquipiers et rival en maillot.
const ART_SKIN = ['#f1c9a5', '#e7b48c', '#d49b70', '#b57a4f', '#8d5a38', '#5f3a22'];
const ART_HAIR = ['#1b1410', '#2e2018', '#4a3020', '#7a5233', '#b88a4e', '#d9c08a', '#8a8a8a', '#c4542a'];
const ART_BG = ['#1f4d3a', '#24435f', '#4a2f55', '#5a3b1f', '#2f4f4f', '#3d3d63', '#5b2c2c', '#28544a'];
function artHash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
// o : { f: femme, role: 'agent'|'coach'|'mate'|'rival'|'family'|'love'|'friend', age, shirt }
function portrait(name, o) {
  o = o || {}; const h = artHash(name + (o.role || '')), r = k => ((h >>> (k * 3)) & 7) / 7, f = !!o.f, old = (o.age || 30) >= 48;
  const skin = ART_SKIN[(o.skinSeed ? artHash(o.skinSeed) : h) % ART_SKIN.length], dark = ART_SKIN.indexOf(skin) >= 4;
  let hair = ART_HAIR[(h >>> 5) % (dark ? 3 : ART_HAIR.length - 2)]; if (old && r(2) > .35) hair = '#9a9a9a';
  const bg = ART_BG[(h >>> 9) % ART_BG.length], id = 'p' + (h % 1e6);
  const shirt = o.shirt || (o.role === 'agent' ? '#23262e' : o.role === 'coach' ? '#14324f' : ['#c8553d', '#2d6a4f', '#3a5a98', '#8f3b76', '#d4a017', '#444'][(h >>> 12) % 6]);
  // vêtements
  let body = `<path d="M8 64 C9 50 18 44 32 44 C46 44 55 50 56 64 Z" fill="${shirt}"/>`;
  if (o.role === 'agent') body += `<path d="M26 44 L32 56 L38 44 Z" fill="#f2f2f2"/><path d="M30.5 47 L33.5 47 L34.5 58 L32 61 L29.5 58 Z" fill="${['#b3202a', '#d4a017', '#2d6a9f'][h % 3]}"/><path d="M26 44 L32 58 L22 52 Z M38 44 L32 58 L42 52 Z" fill="#1a1c22" opacity=".9"/>`;
  else if (o.role === 'coach') body += `<path d="M27 44 L32 50 L37 44" fill="none" stroke="#f2f2f2" stroke-width="2"/><path d="M18 50 L18 64 M46 50 L46 64" stroke="#f2f2f2" stroke-width="1.5" opacity=".7"/>`;
  else if (o.role === 'mate' || o.role === 'rival') body += `<path d="M26 44 C28 48 36 48 38 44" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2"/>`;
  else body += `<path d="M27 44 C29 47 35 47 37 44" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`;
  // cheveux (derrière la tête)
  const style = f ? (h >>> 15) % 3 : (h >>> 15) % 5;
  let back = '', front = '';
  if (f) {
    if (style === 0) back = `<path d="M15 30 C14 14 22 9 32 9 C42 9 50 14 49 30 L50 48 C46 50 42 48 41 44 L23 44 C22 48 18 50 14 48 Z" fill="${hair}"/>`;
    else if (style === 1) back = `<path d="M17 28 C16 13 24 9 32 9 C40 9 48 13 47 28 L46 38 L18 38 Z" fill="${hair}"/><circle cx="32" cy="9" r="6" fill="${hair}"/>`;
    else back = `<path d="M15 30 C15 13 23 8 32 8 C41 8 49 13 49 30 C51 36 49 42 46 44 L18 44 C15 42 13 36 15 30 Z" fill="${hair}"/>`;
    front = `<path d="M19 24 C21 15 27 12 33 12 C40 12 45 16 46 24 C40 19 31 17 19 24 Z" fill="${hair}"/>`;
  } else if (!(old && style === 4)) {
    if (style === 0) front = `<path d="M19 24 C19 13 26 10 32 10 C39 10 46 13 45 24 C42 18 36 16 32 16 C27 16 22 18 19 24 Z" fill="${hair}"/>`;
    else if (style === 1) front = `<path d="M18 26 C17 12 25 8 32 8 C40 8 47 12 46 26 C44 19 40 15 32 15 C25 15 21 19 18 26 Z" fill="${hair}"/>`;
    else if (style === 2) front = `<g fill="${hair}">${[[21, 16], [26, 12], [32, 11], [38, 12], [43, 16], [19, 22], [45, 22], [24, 14], [40, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.2"/>`).join('')}</g>`;
    else if (style === 3) front = `<path d="M20 22 C21 15 26 12.5 32 12.5 C38 12.5 43 15 44 22 C40 19 36 18 32 18 C28 18 24 19 20 22 Z" fill="${hair}" opacity=".85"/>`;
    else front = `<path d="M18 27 C17 14 24 9 33 9 C42 9 47 15 46 27 L44 22 C40 14 26 13 20 22 Z" fill="${hair}"/>`;
  }
  // visage
  const beard = !f && (h >>> 18) % 4 === 0, glasses = (o.role === 'agent' && h % 2) || (old && (h >>> 20) % 3 === 0), smile = (h >>> 22) % 3;
  const eyeY = 29, brow = f ? 'M23 25.5 Q26 24 29 25.5 M35 25.5 Q38 24 41 25.5' : 'M22.5 25.5 L29 24.8 M35 24.8 L41.5 25.5';
  let face = `<rect x="27.5" y="38" width="9" height="8" rx="3" fill="${skin}"/><ellipse cx="32" cy="29" rx="13" ry="15" fill="${skin}"/><ellipse cx="19.2" cy="30" rx="2.4" ry="3.6" fill="${skin}"/><ellipse cx="44.8" cy="30" rx="2.4" ry="3.6" fill="${skin}"/>`;
  face += `<path d="${brow}" stroke="${f ? hair : '#2a1d14'}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".85"/>`;
  face += `<ellipse cx="26" cy="${eyeY}" rx="1.6" ry="1.9" fill="#1d1a18"/><ellipse cx="38" cy="${eyeY}" rx="1.6" ry="1.9" fill="#1d1a18"/><circle cx="26.5" cy="${eyeY - .6}" r=".5" fill="#fff"/><circle cx="38.5" cy="${eyeY - .6}" r=".5" fill="#fff"/>`;
  face += `<path d="M32 30 C31 33.5 30.5 34.5 32.5 35" stroke="rgba(0,0,0,.28)" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  face += smile === 0 ? `<path d="M27.5 38.2 Q32 41.8 36.5 38.2" stroke="#7a3b32" stroke-width="1.5" fill="none" stroke-linecap="round"/>` : smile === 1 ? `<path d="M28.5 38.8 Q32 40.4 35.5 38.8" stroke="#7a3b32" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : `<path d="M28 38 Q32 42.5 36 38 Z" fill="#7a3b32"/><path d="M29 38.4 Q32 39.6 35 38.4" stroke="#fff" stroke-width="1" fill="none"/>`;
  if (f) face += `<ellipse cx="23.5" cy="34" rx="2.6" ry="1.5" fill="#e0707a" opacity=".22"/><ellipse cx="40.5" cy="34" rx="2.6" ry="1.5" fill="#e0707a" opacity=".22"/>`;
  if (beard) face += `<path d="M20 31 C21 41 26 45 32 45 C38 45 43 41 44 31 C42 37 38 38.5 32 38.5 C26 38.5 22 37 20 31 Z" fill="${hair === '#9a9a9a' ? '#8c8c8c' : hair}" opacity=".9"/><path d="M28 38.6 Q32 40.2 36 38.6" stroke="#7a3b32" stroke-width="1.3" fill="none"/>`;
  if (old) face += `<path d="M22 33.5 Q24 35 25 34 M42 33.5 Q40 35 39 34" stroke="rgba(0,0,0,.18)" stroke-width=".8" fill="none"/>`;
  if (glasses) face += `<g fill="none" stroke="#1b1b1b" stroke-width="1.3"><rect x="21" y="26" width="9" height="6.5" rx="2.5"/><rect x="34" y="26" width="9" height="6.5" rx="2.5"/><path d="M30 28.5 L34 28.5"/></g>`;
  return `<svg class="pt" viewBox="0 0 64 64" role="img" aria-label="${esc(String(name))}"><defs><clipPath id="${id}"><circle cx="32" cy="32" r="32"/></clipPath></defs><g clip-path="url(#${id})"><rect width="64" height="64" fill="${bg}"/><circle cx="50" cy="12" r="22" fill="rgba(255,255,255,.06)"/>${back}${body}${face}${front}</g></svg>`;
}

// ---------- trophées : une icône par type de titre ----------
function trophyKind(t) {
  t = String(t || '').toLowerCase();
  if (/ballon d'or/.test(t)) return 'bdo';
  if (/soulier|meilleur buteur|golden boot/.test(t)) return 'boot';
  if (/ligue des champions|champions league|europa|conférence|continental|libertadores|afrique|asie/.test(t)) return 'ucl';
  if (/coupe du monde|euro|copa|nations|sélection|cdm/.test(t)) return 'world';
  if (/montée|promotion/.test(t)) return 'up';
  if (/coupe|cup|pokal|copa del|fa cup|taça/.test(t)) return 'cup';
  if (/meilleur|joueur|révélation|golden|kopa|trophée/.test(t)) return 'medal';
  return 'league';
}
function trophyIcon(t, sz) {
  const k = trophyKind(t), s = sz || 40, G = `<defs><linearGradient id="tg${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".45" stop-color="#f2c043"/><stop offset="1" stop-color="#a8700e"/></linearGradient></defs>`, g = `url(#tg${k})`;
  const P = {
    cup: `<path d="M20 8h24v10c0 10-6 17-12 18-6-1-12-8-12-18z" fill="${g}"/><path d="M20 12h-6c0 8 4 12 8 12M44 12h6c0 8-4 12-8 12" fill="none" stroke="${g}" stroke-width="3"/><rect x="29" y="36" width="6" height="8" fill="${g}"/><rect x="22" y="44" width="20" height="6" rx="1.5" fill="#5a3b12"/><rect x="20" y="50" width="24" height="6" rx="1.5" fill="#3d2a0d"/>`,
    ucl: `<path d="M22 8h20v12c0 9-5 15-10 16-5-1-10-7-10-16z" fill="${g}"/><path d="M22 10c-9 0-12 4-12 9s5 9 13 9M42 10c9 0 12 4 12 9s-5 9-13 9" fill="none" stroke="${g}" stroke-width="3.2"/><rect x="29" y="36" width="6" height="9" fill="${g}"/><path d="M21 45h22l3 11H18z" fill="#3d2a0d"/>`,
    world: `<path d="M24 56h16l-3-8h-10z" fill="#3d2a0d"/><path d="M27 48c-6-6-9-13-7-21 2-9 9-14 12-17 3 3 10 8 12 17 2 8-1 15-7 21z" fill="${g}"/><circle cx="32" cy="22" r="7" fill="#fff7d6" opacity=".55"/>`,
    league: `<path d="M32 6l18 6v14c0 14-9 22-18 28-9-6-18-14-18-28V12z" fill="${g}"/><path d="M32 13l11 4v9c0 9-5 14-11 18-6-4-11-9-11-18v-9z" fill="#7a520c" opacity=".35"/><path d="M32 18l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" fill="#fff7d6"/>`,
    bdo: `<circle cx="32" cy="27" r="19" fill="${g}"/><g fill="#7a520c" opacity=".45"><polygon points="32,19 39,24 36.5,32 27.5,32 25,24"/><path d="M32 8v11M39 24l10-4M36.5 32l7 9M27.5 32l-7 9M25 24l-10-4" stroke="#7a520c" stroke-width="1.6"/></g><path d="M22 48h20l2 8H20z" fill="#3d2a0d"/><path d="M26 44h12l-1 4H27z" fill="${g}"/>`,
    boot: `<path d="M10 40l1-14c0-6 3-9 9-9h9c3 0 4 2 6 4 7 4 15 6 20 8 4 1 5 5 5 8 0 3-2 4-5 4H12z" fill="${g}"/><path d="M11 41h48c0 3-2 5-5 5H13c-2 0-3-2-2-5z" fill="#3d2a0d"/><g fill="#3d2a0d"><rect x="15" y="46" width="4" height="5" rx="1"/><rect x="24" y="46" width="4" height="5" rx="1"/><rect x="44" y="46" width="4" height="5" rx="1"/><rect x="52" y="46" width="4" height="5" rx="1"/></g>`,
    medal: `<path d="M22 4h8l4 14h-8zM42 4h-8l-4 14h8z" fill="#b3202a"/><circle cx="32" cy="36" r="15" fill="${g}"/><circle cx="32" cy="36" r="10" fill="none" stroke="#7a520c" stroke-width="1.5" opacity=".6"/><path d="M32 29l2 4.2 4.6.6-3.3 3.2.8 4.5-4.1-2.2-4.1 2.2.8-4.5-3.3-3.2 4.6-.6z" fill="#fff7d6"/>`,
    up: `<path d="M32 6l18 18H40v22H24V24H14z" fill="${g}"/><rect x="20" y="50" width="24" height="6" rx="1.5" fill="#3d2a0d"/>`,
  };
  return `<svg class="ti" viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true">${G}${P[k]}</svg>`;
}
