// Filhotes: a versão bebê de cada bicho (nasce do ovo pego com a rede e cresce ao vencer a fase).
// Registrados como 'bb_<espécie>'. Cabeça ainda maior, corpinho mínimo, olhos enormes e baixos no rosto.
// Pés em y = 0, virados para +x. c: { f, blink, breath, bob, step, mania (0..1 ou null), hurt, puffed }
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const OUT = '#2a1f1a';
  const on = t => t !== null && t !== undefined;
  const fluff = (...a) => MS.CAT_FLUFF(...a);

  // olhão de filhote (brilho duplo, íris grande)
  function eye(cx, cy, r, iris, c, look = 0.2) {
    if (c.hurt) return `<path d="M${f1(cx - r * 0.6)},${f1(cy - r * 0.6)} L${f1(cx + r * 0.6)},${f1(cy + r * 0.6)} M${f1(cx + r * 0.6)},${f1(cy - r * 0.6)} L${f1(cx - r * 0.6)},${f1(cy + r * 0.6)}" stroke="${OUT}" stroke-width="1.4" stroke-linecap="round"/>`;
    if (c.blink) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.8)} ${f1(cx + r)},${f1(cy)}" fill="none" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r)}" ry="${f1(r * 1.12)}" fill="#fff" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.12)}" rx="${f1(r * 0.74)}" ry="${f1(r * 0.86)}" fill="${iris}"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.18)}" rx="${f1(r * 0.44)}" ry="${f1(r * 0.52)}" fill="#120c0a"/>
      <circle cx="${f1(cx + r * (look + 0.3))}" cy="${f1(cy - r * 0.3)}" r="${f1(r * 0.32)}" fill="#fff"/>
      <circle cx="${f1(cx + r * (look - 0.22))}" cy="${f1(cy + r * 0.42)}" r="${f1(r * 0.16)}" fill="#fff" opacity=".9"/>`;
  }
  const blush = (x, y, col = '#ff8aa0', r = 2.4) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.55)}" fill="${col}" opacity=".6"/>`;
  const smile = (x, y, w = 3) => `<path d="M${f1(x - w / 2)},${y} Q${x},${f1(y + w * 0.7)} ${f1(x + w / 2)},${y}" fill="none" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>`;
  const mouthO = (x, y, w, h = w * 0.8) => `<ellipse cx="${x}" cy="${y}" rx="${f1(w / 2)}" ry="${f1(h / 2)}" fill="#6a1a24" stroke="${OUT}" stroke-width=".8"/>`;
  const foot = (x, col, rx = 2.6) => `<ellipse cx="${f1(x)}" cy="-1.5" rx="${rx}" ry="1.9" fill="${col}" stroke="${OUT}" stroke-width="1"/>`;
  function puff(c, mx, my, col) {
    if (!(c.breath > 0)) return '';
    return `<g opacity=".85"><path d="M${mx},${my - 1.6} Q${mx + 8},${f1(my - 5 + sin(c.f * 1.7))} ${mx + 16},${my - 1} Q${mx + 8},${my + 3} ${mx},${my + 2} Z" fill="${col}"/></g>`;
  }
  const hop = (c, k = 4) => on(c.mania) ? Math.abs(sin(c.mania * PI * 4)) * k : 0;
  const open = c => c.breath > 0 || c.hurt;

  // ---------- Caramelo filhote: orelhas caídas, barriguinha clara ----------
  function caramelo(c) {
    const body = '#d68d3c', light = '#f6d29a', dark = '#a8652a', wag = sin(c.f * (on(c.mania) ? 1.4 : 0.7));
    return `<g transform="translate(0 ${f1(c.bob - hop(c, 5))})">
      <g transform="translate(-7 -6) rotate(${f1(-50 + wag * 30)})"><path d="M0,0 c-2,-2 -2,-5 1,-6" fill="none" stroke="${OUT}" stroke-width="3.6" stroke-linecap="round"/><path d="M0,0 c-2,-2 -2,-5 1,-6" fill="none" stroke="${body}" stroke-width="2.2" stroke-linecap="round"/></g>
      <ellipse cx="0" cy="-5" rx="6.5" ry="4.6" fill="${body}" stroke="${OUT}" stroke-width="1"/>
      ${foot(-3 + c.step * 0.5, body, 2.4)}${foot(4 - c.step * 0.5, body, 2.4)}
      <g transform="translate(3 -15)">
        <path d="M-9,-4 C-14,-2 -13,7 -9,8 C-8,4 -7,1 -6,-2 Z" fill="${dark}" stroke="${OUT}" stroke-width="1"/>
        <circle r="11" fill="${body}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M5,-5 C9,-4 12,3 9,6 C8,2 6,0 4,-1 Z" fill="${dark}" stroke="${OUT}" stroke-width="1"/>
        <ellipse cx="5" cy="5" rx="5.5" ry="3.8" fill="${light}" stroke="${OUT}" stroke-width=".9"/>
        <ellipse cx="8.6" cy="3.2" rx="1.7" ry="1.3" fill="${OUT}"/>
        ${eye(-2, 0, 3.8, '#7a4012', c)}${eye(5.5, -0.5, 3.2, '#7a4012', c)}
        ${blush(-6, 5)}
        ${open(c) ? mouthO(5.5, 7, 3, 2.6) : `${smile(5.5, 6.6, 3)}<path d="M5,7.4 q.2,2.6 1.6,2.4 q.8,-.8 .4,-2.6 Z" fill="#ff7a8a" stroke="${OUT}" stroke-width=".5"/>`}
      </g>
      ${puff(c, 14, -12, '#f6d29a')}
    </g>`;
  }

  // ---------- Pinscher filhote: orelhas maiores que a cabeça e tremedeira em dobro ----------
  function pinscher(c) {
    const blk = '#2c2329', tan = '#c97b3c', shake = sin(c.f * 3.4) * (c.hurt ? 1.4 : 0.9);
    return `<g transform="translate(${f1(shake)} ${f1(c.bob - hop(c, 3))})">
      ${foot(-3 + c.step * 0.5, tan, 2)}${foot(3.6 - c.step * 0.5, tan, 2)}
      <ellipse cx="0" cy="-5" rx="5" ry="3.6" fill="${blk}" stroke="${OUT}" stroke-width="1"/>
      <g transform="translate(2 -14)">
        <path d="M-7,-4 L-15,-21 L-1,-8 Z" fill="${blk}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M-7,-6 L-12.5,-17 L-3,-8.5 Z" fill="#e09a9a"/>
        <path d="M2,-8 L10,-24 L11,-4 Z" fill="${blk}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M3.6,-8 L9.4,-19 L9.8,-6 Z" fill="#e09a9a"/>
        <circle r="10" fill="${blk}" stroke="${OUT}" stroke-width="1.2"/>
        <ellipse cx="5" cy="4.4" rx="4.6" ry="3.2" fill="${tan}"/>
        <ellipse cx="-3" cy="-5.6" rx="1.6" ry="1.1" fill="${tan}"/><ellipse cx="5" cy="-6" rx="1.4" ry="1" fill="${tan}"/>
        <ellipse cx="8.4" cy="3" rx="1.4" ry="1.1" fill="#111"/>
        ${eye(-2.4, -0.4, 4.2, '#5a2a12', c, 0.1)}${eye(5, -0.8, 3.6, '#5a2a12', c, 0.1)}
        ${open(c) || (on(c.mania) && Math.floor(c.mania * 8) % 2 === 0) ? mouthO(5, 6.6, 2.8, 2.6) : smile(5, 6.2, 2.4)}
      </g>
      ${on(c.mania) ? `<path d="M14,-22 l3,-2 M15,-18 l4,0" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>` : ''}
      ${puff(c, 13, -10, '#ffe0a0')}
    </g>`;
  }

  // ---------- Tatu-bola filhote: casquinha rosada; mania: vira bolinha e rola ----------
  function tatubola(c) {
    const shell = '#d8b48c', band = '#b88e66', skin = '#f0c8b0';
    if (on(c.mania) && c.mania > 0.2 && c.mania < 0.85) {
      const rot = (c.mania - 0.2) * 720, x = sin((c.mania - 0.2) / 0.65 * PI) * 6;
      return `<g transform="translate(${f1(x)} ${f1(c.bob - 9)}) rotate(${f1(rot)})">
        <circle r="9" fill="${shell}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-9,0 A9,9 0 0 1 9,0 M-7,-5 A9,9 0 0 1 7,-5 M-7,5 A9,9 0 0 0 7,5" fill="none" stroke="${band}" stroke-width="1.4"/>
        <ellipse cx="-3" cy="-4" rx="2.6" ry="1.4" fill="#fff" opacity=".45"/></g>`;
    }
    return `<g transform="translate(0 ${f1(c.bob)})">
      ${foot(-4 + c.step * 0.5, skin, 2)}${foot(4 - c.step * 0.5, skin, 2)}
      <path d="M-11,-3 C-12,-13 -2,-16 5,-12 L5,-3 Z" fill="${shell}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-7,-3 C-8,-9 -6,-12 -4,-13 M-3,-3 C-3,-9 -2,-12 0,-14 M1,-3 C1,-8 1,-11 3,-13" fill="none" stroke="${band}" stroke-width="1.2"/>
      <path d="M-11,-4 l-3,2" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/><path d="M-11,-4 l-3,2" stroke="${skin}" stroke-width="1.2" stroke-linecap="round"/>
      <g transform="translate(7 -12)">
        <ellipse cx="-4" cy="-8" rx="2.6" ry="4.6" fill="${skin}" stroke="${OUT}" stroke-width="1" transform="rotate(-20 -4 -8)"/>
        <ellipse cx="2" cy="-8.6" rx="2.4" ry="4.4" fill="${skin}" stroke="${OUT}" stroke-width="1" transform="rotate(18 2 -8.6)"/>
        <ellipse cx="0" cy="0" rx="8.6" ry="8" fill="${skin}" stroke="${OUT}" stroke-width="1.1"/>
        <ellipse cx="8" cy="2" rx="3.6" ry="2.6" fill="${skin}" stroke="${OUT}" stroke-width="1"/>
        <ellipse cx="10.6" cy="1.6" rx="1.1" ry=".9" fill="${OUT}"/>
        ${eye(-1.5, -1, 3.2, '#3a2418', c)}${eye(4.4, -1.2, 2.7, '#3a2418', c)}
        ${blush(-4, 3.6)}
        ${open(c) ? mouthO(6, 4.8, 2.2) : smile(6, 4.6, 2)}
      </g>
      ${puff(c, 18, -11, '#e8d8b8')}
    </g>`;
  }

  // ---------- Formiga filhote: larvinha cor de creme com cabeça vermelha e anteninhas ----------
  function formiga(c) {
    const red = '#d03c2c', cream = '#fbf2dc', w = on(c.mania) ? sin(c.mania * PI * 8) * 3 : sin(c.f * 0.2) * 0.8;
    return `<g transform="translate(0 ${f1(c.bob)})">
      <circle cx="${f1(-10 + w * 0.6)}" cy="-4" r="4" fill="${cream}" stroke="${OUT}" stroke-width="1"/>
      <circle cx="${f1(-5 + w * 0.3)}" cy="-5" r="5" fill="${cream}" stroke="${OUT}" stroke-width="1"/>
      <path d="M${f1(-12 + w * 0.6)},-6 q2,-1 3,1 M${f1(-7 + w * 0.3)},-8 q2,-1 3,1" fill="none" stroke="#e4d4b0" stroke-width="1" stroke-linecap="round"/>
      <g transform="translate(4 -12) rotate(${f1(w * 2)})">
        <path d="M-3,-8 q-2,-6 -6,-6 M3,-8 q1,-6 5,-7" fill="none" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="-9" cy="-14" r="1.6" fill="${red}" stroke="${OUT}" stroke-width=".7"/><circle cx="8" cy="-15" r="1.6" fill="${red}" stroke="${OUT}" stroke-width=".7"/>
        <circle r="10" fill="${red}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-5,-6 Q0,-9 5,-6" fill="none" stroke="#ff8a7a" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
        ${eye(-2, 0, 3.8, '#2a1410', c)}${eye(5, -0.4, 3.2, '#2a1410', c)}
        <path d="M6,6 l3,1.4 M6,6 l2.4,2.6" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
        ${open(c) ? mouthO(3, 6, 2.6) : smile(3, 5.6, 2.4)}
        ${blush(-5.5, 4.4, '#ffb0a0')}
      </g>
      ${puff(c, 13, -10, '#fff0c0')}
    </g>`;
  }

  // ---------- Rola-bosta filhote: besourinho brilhante empurrando uma bolinha de cocô ----------
  function rolabosta(c) {
    const g = '#2e4a3a', hi = '#6aa088', push = on(c.mania) ? sin(c.mania * PI * 4) * 4 : 0;
    return `<g transform="translate(0 ${f1(c.bob)})">
      <g transform="translate(${f1(15 + push)} -4) rotate(${f1(push * 30)})"><circle r="4" fill="#7a5430" stroke="${OUT}" stroke-width="1"/><path d="M-2,-1 q1,-2 3,-1 M-1,2 q2,0 2,-2" fill="none" stroke="#5a3a1e" stroke-width=".8"/></g>
      ${foot(-4 + c.step * 0.5, '#1a2a22', 2)}${foot(2 - c.step * 0.5, '#1a2a22', 2)}
      <ellipse cx="-3" cy="-6" rx="7" ry="5.4" fill="${g}" stroke="${OUT}" stroke-width="1.1"/>
      <path d="M-3,-11 V-1" stroke="${OUT}" stroke-width=".8"/><ellipse cx="-6" cy="-8" rx="2" ry="1.2" fill="${hi}" opacity=".7"/>
      <g transform="translate(5 -13)">
        <path d="M1,-9 q0,-5 4,-6 M5,-8 q3,-3 6,-2" fill="none" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>
        <circle r="9" fill="${g}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-5,-5 Q-1,-8 4,-6" fill="none" stroke="${hi}" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
        ${eye(-1.4, 0, 3.6, '#c8a030', c)}${eye(5, -0.4, 3, '#c8a030', c)}
        ${open(c) ? mouthO(4, 5.6, 2.4) : smile(4, 5.2, 2.4)}
        ${blush(-5, 4.2, '#ff9ab0', 1.8)}
      </g>
      ${puff(c, 13, -12, '#c8a070')}
    </g>`;
  }

  // ---------- Galinha filhote: pintinho com casca de ovo na cabeça ----------
  function galinha(c) {
    const y = '#ffd23a', yd = '#e8a81a', peep = on(c.mania) ? Math.abs(sin(c.mania * PI * 5)) : 0;
    const wing = c.breath > 0 ? sin(c.f * 1.3) * 25 : peep * 20;
    return `<g transform="translate(0 ${f1(c.bob - peep * 3)})">
      <path d="M-2,-3 l-1,3 M-3,0 h2.4 M3,-3 l1,3 M2.6,0 h2.6" stroke="#e08a1a" stroke-width="1.4" stroke-linecap="round"/>
      ${fluff(0, -11, 10.5, 9.5, 13, 0.1, y)}
      <g transform="translate(-6 -10) rotate(${f1(-wing)})"><path d="M0,0 c-3,2 -2,6 2,6 c1,-2 1,-4 0,-6 Z" fill="${yd}" stroke="${OUT}" stroke-width=".8"/></g>
      <path d="M-4,-19 q3,-3 6,-1" fill="none" stroke="#fff3a8" stroke-width="2" stroke-linecap="round"/>
      <g transform="rotate(${f1(-8 + peep * 14)} 0 -18)">
        <path d="M-8,-17 L-6,-21 L-3,-18 L0,-22 L3,-18 L6,-21 L8,-17 C8,-25 -8,-25 -8,-17 Z" fill="#fffaf0" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="-3" cy="-21.6" rx="1.4" ry=".8" fill="#e8dcc0"/>
      </g>
      ${eye(-0.5, -11, 3.4, '#2a1a10', c)}${eye(5.5, -11.2, 2.9, '#2a1a10', c)}
      <path d="M7.4,-8.4 L11.6,-7 L7.4,-5.6 Z" fill="#ff9a1a" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>
      ${open(c) || peep > 0.6 ? `<path d="M7.6,-7 L11,-7" stroke="${OUT}" stroke-width=".7"/>` : ''}
      ${blush(-4, -6.6, '#ff9a6a')}
      ${puff(c, 12, -7, '#fff6dc')}
    </g>`;
  }

  // ---------- Barata filhote: ninfa branquinha (recém-trocou de casca) ----------
  function barata(c) {
    const body = '#f4e8d6', sh = '#e2cfb2', dash = on(c.mania) ? sin(c.mania * PI * 6) * 4 : 0;
    const st = c.step * 0.5 + (on(c.mania) ? sin(c.f * 2.6) * 0.8 : 0);
    const legs = [-6, -2, 2].map((x, i) => `<path d="M${x},-3 l${f1((i % 2 ? st : -st) - 1.2)},3" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>`).join('');
    const ant = sin(c.f * 0.3) * 6;
    return `<g transform="translate(${f1(dash)} ${f1(c.bob)})">
      ${legs}
      <ellipse cx="-4" cy="-5" rx="8" ry="4.4" fill="${body}" stroke="${OUT}" stroke-width="1"/>
      <path d="M-9,-6 h4 M-8,-3.6 h5" stroke="${sh}" stroke-width="1"/>
      <g transform="translate(5 -12)">
        <path d="M2,-7 Q${f1(6 + ant)},-17 ${f1(12 + ant)},-15 M-1,-8 Q${f1(-2 + ant)},-18 ${f1(4 + ant)},-19" fill="none" stroke="#b89a70" stroke-width="1" stroke-linecap="round"/>
        <ellipse rx="9" ry="8.4" fill="${body}" stroke="${OUT}" stroke-width="1.2"/>
        <ellipse cx="-2" cy="-5" rx="4" ry="1.6" fill="#fff" opacity=".8"/>
        ${eye(-1.6, 0, 3.4, '#6a3a1a', c)}${eye(4.6, -0.3, 2.9, '#6a3a1a', c)}
        ${open(c) ? mouthO(4, 5, 2.2) : smile(4, 4.8, 2.2)}
        ${blush(-5, 3.6, '#ffb0a0', 1.8)}
      </g>
      ${puff(c, 13, -11, '#f0e0c0')}
    </g>`;
  }

  // ---------- Baiacu filhote: bolinha com espinhos moles e barbatanas batendo ----------
  function baiacu(c) {
    const p = c.puffed ? 1.3 : 1, fin = sin(c.f * 0.9) * 20, o = '#f2b84a', l = '#fff2c8';
    let sp = '';
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; sp += `<path d="M${f1(cos(a) * 8.6 * p)},${f1(sin(a) * 8.6 * p)} L${f1(cos(a) * (11 + (c.puffed ? 3 : 0)) * p)},${f1(sin(a) * (11 + (c.puffed ? 3 : 0)) * p)}" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>`; }
    return `<g transform="translate(0 ${f1(c.bob - 11 - sin(c.f * 0.12) * 1.5 - hop(c, 3))})">
      <g transform="translate(${f1(-9 * p)} 0) rotate(${f1(fin * 0.5)})"><path d="M0,0 L-6,-4 L-6,4 Z" fill="${o}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/></g>
      ${sp}
      <circle r="${f1(9 * p)}" fill="${o}" stroke="${OUT}" stroke-width="1.2"/>
      <ellipse cx="0" cy="${f1(3.6 * p)}" rx="${f1(6.6 * p)}" ry="${f1(4.4 * p)}" fill="${l}"/>
      <g transform="translate(-1 3) rotate(${f1(fin)})"><ellipse cx="0" cy="3" rx="1.8" ry="3" fill="#e08a1a" stroke="${OUT}" stroke-width=".8"/></g>
      ${eye(1, -2, 3.4, '#2a4a8a', c)}${eye(6.6, -2.4, 2.8, '#2a4a8a', c)}
      ${open(c) || c.puffed ? mouthO(7.6, 3.6, 2.4) : `<path d="M6.4,3.6 q1.4,1.2 2.8,0" fill="none" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>`}
      ${blush(-2, 2.6, '#ff8a8a', 1.8)}
      ${puff(c, 10, 2, '#cfefff')}
    </g>`;
  }

  // ---------- Camaleão filhote: rabo enrolado enorme e cores pastel ----------
  function camaleao(c) {
    const hue = on(c.mania) ? (110 + c.mania * 360) % 360 : 110;
    const col = `hsl(${hue.toFixed(0)},62%,62%)`, dk = `hsl(${hue.toFixed(0)},50%,44%)`;
    const roll = sin(c.f * 0.2) * 0.3;
    return `<g transform="translate(0 ${f1(c.bob)})">
      <path d="M-6,-6 C-14,-6 -16,-14 -11,-17 C-7,-19 -5,-14 -8,-13 C-10,-12 -10,-15 -9,-15" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-6,-6 C-14,-6 -16,-14 -11,-17 C-7,-19 -5,-14 -8,-13 C-10,-12 -10,-15 -9,-15" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/>
      ${foot(-3 + c.step * 0.5, dk, 2)}${foot(4 - c.step * 0.5, dk, 2)}
      <ellipse cx="0" cy="-5.6" rx="6.4" ry="4.2" fill="${col}" stroke="${OUT}" stroke-width="1"/>
      <g transform="translate(5 -14)">
        <path d="M-8,-4 C-7,-12 2,-13 5,-8 Z" fill="${dk}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <ellipse rx="9.6" ry="8.6" fill="${col}" stroke="${OUT}" stroke-width="1.2"/>
        <circle cx="1" cy="-1" r="5" fill="${col}" stroke="${OUT}" stroke-width="1"/>
        ${eye(1 + roll * 2, -1, 3.4, '#e8a020', c, roll)}
        ${open(c) ? mouthO(6, 4.6, 2.4) : smile(5.6, 4.4, 3)}
        ${blush(-4, 3, '#ff9ab0', 1.8)}
        <path d="M-6,1 h3 M-5,4 h3" stroke="${dk}" stroke-width="1" stroke-linecap="round" opacity=".6"/>
      </g>
      ${puff(c, 14, -10, '#ffb0c0')}
    </g>`;
  }

  // ---------- Pombo filhote: careca, penugem amarela espetada e bicão (feio-fofo) ----------
  function pombo(c) {
    const skin = '#e8b8a8', fuzz = '#f4d64a', bob = on(c.mania) ? sin(c.mania * PI * 8) * 2.5 : 0;
    return `<g transform="translate(0 ${f1(c.bob)})">
      <path d="M-2,-3 l-1,3 M-3,0 h2.4 M3,-3 l1,3 M2.6,0 h2.6" stroke="#d07a7a" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="-1" cy="-7" rx="7" ry="5.4" fill="${skin}" stroke="${OUT}" stroke-width="1"/>
      <path d="M-7,-9 l-2,-2 M-6,-6 l-3,0 M-4,-11 l-1,-3" stroke="${fuzz}" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M-5,-7 c-2,1 -2,4 1,4" fill="#d8a090" stroke="${OUT}" stroke-width=".8"/>
      <g transform="translate(${f1(4 + bob)} -16)">
        <path d="M-4,-8 l-1,-5 M-1,-9 l0,-6 M2,-9 l2,-5 M-6,-6 l-4,-3" stroke="${fuzz}" stroke-width="1.6" stroke-linecap="round"/>
        <circle r="9" fill="${skin}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M6,-1 C10,-2 15,0 15,3 C12,4 8,3 6,3 Z" fill="#8a8f9a" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        ${open(c) ? `<path d="M7,2.4 L14,3" stroke="${OUT}" stroke-width=".8"/>` : ''}
        <path d="M6,-2.6 q1,-1.4 2.4,-.2" fill="#fff" stroke="${OUT}" stroke-width=".6"/>
        ${eye(-1.6, -1.6, 3.4, '#e86a2a', c, 0.1)}${eye(4, -2, 2.6, '#e86a2a', c, 0.1)}
        <path d="M-4.6,-5.4 L1,-4.4 M2.6,-4.8 L6,-5.6" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
        ${blush(-4.4, 3.6, '#ff8a8a', 1.8)}
      </g>
      ${puff(c, 18, -13, '#f4e4b0')}
    </g>`;
  }

  // ---------- Abelha filhote: princesinha (tiara pequena, asinhas, sem escolta ainda) ----------
  function abelha(c) {
    const yb = '#f6c428', dk = '#2a2018', wing = sin(c.f * 2.4) * 16, fly = 8 + sin(c.f * 0.15) * 1.5 + hop(c, 4);
    return `<g transform="translate(0 ${f1(c.bob - fly)})">
      <path d="M-11,-3 l-3,1 l3,1 Z" fill="${dk}"/>
      <ellipse cx="-4" cy="-3" rx="7" ry="5.6" fill="${yb}" stroke="${OUT}" stroke-width="1"/>
      <path d="M-7,-8 v10 M-3,-8.6 v11" stroke="${dk}" stroke-width="1.8"/>
      <g transform="translate(-4 -8) rotate(${f1(-30 - wing)})"><ellipse cx="-2" cy="-5" rx="3" ry="5.4" fill="#eef8ff" fill-opacity=".8" stroke="${OUT}" stroke-width=".8"/></g>
      <g transform="translate(5 -12)">
        <path d="M-2,-8 q-2,-5 -5,-5 M2,-8 q2,-5 5,-5" fill="none" stroke="${OUT}" stroke-width="1" stroke-linecap="round"/>
        <circle cx="-7" cy="-13" r="1.4" fill="${dk}"/><circle cx="7" cy="-13" r="1.4" fill="${dk}"/>
        <circle r="9.4" fill="${yb}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-5,-9 L-4,-13 L-1.6,-10.4 L0,-14 L1.6,-10.4 L4,-13 L5,-9 Z" fill="#ffd84a" stroke="#a8761a" stroke-width=".9" stroke-linejoin="round"/>
        <circle cx="0" cy="-12.4" r="1" fill="#ff5a8a"/>
        ${eye(-1.6, 0, 3.4, '#5a3410', c)}${eye(4.6, -0.3, 2.9, '#5a3410', c)}
        ${open(c) ? mouthO(3.6, 5, 2.2) : smile(3.6, 4.8, 2.4)}
        ${blush(-5, 3.6, '#ff8a6a', 1.8)}
      </g>
      <g transform="translate(-1 -9) rotate(${f1(10 + wing)})"><ellipse cx="2" cy="-5" rx="2.8" ry="5" fill="#eef8ff" fill-opacity=".8" stroke="${OUT}" stroke-width=".8"/></g>
      ${puff(c, 13, -10, '#fff0a0')}
    </g>`;
  }

  // ---------- Sapo filhote: girino com perninhas (azul com pintas pretas) ----------
  function sapo(c) {
    const blue = '#2a8ae8', lb = '#7ac0ff', wig = sin(c.f * (on(c.mania) ? 1.2 : 0.35)) * (on(c.mania) ? 10 : 4);
    return `<g transform="translate(0 ${f1(c.bob - hop(c, 5))})">
      <path d="M-6,-6 Q-12,${f1(-7 + wig * 0.3)} -18,${f1(-6 + wig * 0.6)} Q-12,${f1(-3 + wig * 0.3)} -6,-3 Z" fill="${blue}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round" opacity=".95"/>
      <path d="M-4,-3 l-3,3 h-2 M2,-3 l1,3 h2" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M-4,-3 l-3,3 h-2 M2,-3 l1,3 h2" fill="none" stroke="${blue}" stroke-width=".7" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(2 -11)">
        <ellipse rx="10.4" ry="8.6" fill="${blue}" stroke="${OUT}" stroke-width="1.2"/>
        <circle cx="-6" cy="3" r="1.4" fill="#101820"/><circle cx="-2" cy="-6" r="1.1" fill="#101820"/><circle cx="7" cy="-5" r="1.2" fill="#101820"/>
        <path d="M-5,-6 Q0,-8.4 5,-6.6" fill="none" stroke="${lb}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        ${eye(-1, -2, 3.6, '#101820', c)}${eye(5.6, -2.4, 3, '#101820', c)}
        ${open(c) ? mouthO(4, 4.4, 3, 2) : smile(4, 3.6, 4)}
        ${blush(-5, 3, '#ff8ab0', 1.8)}
      </g>
      ${puff(c, 13, -9, '#c0f080')}
    </g>`;
  }

  // ---------- Pica-pau filhote: bicão desproporcional e topetinho; mania: pede comida de bico aberto ----------
  function picapau(c) {
    const red = '#e8322a', dk = '#2a2a34', beg = on(c.mania) ? Math.abs(sin(c.mania * PI * 6)) : 0;
    return `<g transform="translate(0 ${f1(c.bob - beg * 2)})">
      <path d="M-2,-3 l-1,3 M3,-3 l1,3" stroke="#7a7a7a" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M-8,-5 l-5,3 l5,0 Z" fill="${dk}" stroke="${OUT}" stroke-width=".8"/>
      <ellipse cx="-1" cy="-6" rx="6.4" ry="5" fill="${dk}" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="1" cy="-5" rx="3.4" ry="3" fill="#f4f0e8"/>
      <g transform="translate(3 -15) rotate(${f1(-beg * 18)})">
        <path d="M-6,-7 C-6,-13 0,-14 2,-10 C3,-13 6,-13 5,-9 Z" fill="${red}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <circle r="9" fill="${dk}" stroke="${OUT}" stroke-width="1.2"/>
        <ellipse cx="2" cy="2" rx="6.4" ry="5.6" fill="#f4f0e8"/>
        <path d="M7,${f1(-1 - beg * 2)} L18,1 L7,3 Z" fill="#c8a040" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        ${open(c) || beg > 0.3 ? `<path d="M7,3 L16,${f1(3 + beg * 4)} L7,${f1(5 + beg * 2)} Z" fill="#c8a040" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/><path d="M8,3 L14,${f1(3 + beg * 3)}" stroke="#ff6a8a" stroke-width="1.2"/>` : ''}
        ${eye(-1.6, -1, 3.4, '#2a1a10', c)}${eye(4.6, -1.4, 2.8, '#2a1a10', c)}
        ${blush(-3.6, 4, '#ff8a8a', 1.6)}
      </g>
      ${puff(c, 20, -15, '#e0c8a0')}
    </g>`;
  }

  // ---------- Pernilongo filhote: bolinha cinza fofa com tromba curtinha ----------
  function pernilongo(c) {
    const g = '#a8acb8', wing = sin(c.f * 2.8) * 20, fly = 9 + sin(c.f * 0.17) * 2;
    return `<g transform="translate(0 ${f1(c.bob - fly)})">
      <path d="M-3,-1 l-2,5 M0,-1 l0,5 M3,-1 l2,5" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-3" rx="5" ry="3.4" fill="#8a8e9a" stroke="${OUT}" stroke-width="1"/>
      <g transform="translate(-3 -9) rotate(${f1(-30 - wing)})"><ellipse cx="-2" cy="-5" rx="2.6" ry="5.6" fill="#eef6ff" fill-opacity=".7" stroke="${OUT}" stroke-width=".7"/></g>
      <g transform="translate(3 -10)">
        <path d="M-3,-7 q-2,-4 -4,-4 M2,-7 q1,-4 4,-5" fill="none" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
        <circle r="8.6" fill="${g}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M6,2.4 L11,3.6" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>
        ${eye(-1.4, -0.6, 3.6, '#d03838', c)}${eye(4.6, -1, 3, '#d03838', c)}
        ${blush(-4.6, 4, '#ff9ab0', 1.6)}
      </g>
      <g transform="translate(-1 -10) rotate(${f1(10 + wing)})"><ellipse cx="2" cy="-5" rx="2.4" ry="5.2" fill="#eef6ff" fill-opacity=".7" stroke="${OUT}" stroke-width=".7"/></g>
      ${on(c.mania) || c.breath > 0 ? `<g stroke="#fff" stroke-width=".8" fill="none" opacity=".8"><path d="M15,-16 q2,-2 0,-4 q-2,-2 0,-4"/></g>` : ''}
    </g>`;
  }

  // ---------- Gato filhote: bola de pelo persa com olhões redondos (ainda sem cara de tédio) ----------
  function gato(c) {
    const fur = '#f6f0e8', face = '#fdf9f2', m = c.mania, gag = on(m) && m < 0.84, heave = gag ? Math.max(0, sin(m * PI * 6)) : 0;
    const spit = on(m) && m >= 0.84;
    return `<g transform="translate(0 ${f1(c.bob + heave)})">
      <g transform="translate(-8 -6) rotate(${f1(-30 + sin(c.f * 0.12) * 12)})">${fluff(-2, -5, 3.4, 6, 9, 0.24, fur, 1, 0.4)}</g>
      ${fluff(-1, -5, 7.4, 5, 11, 0.16, fur)}
      ${foot(-3 + c.step * 0.5, fur, 2.4)}${foot(4 - c.step * 0.5, fur, 2.4)}
      <g transform="translate(${f1(3 + heave * 2)} ${f1(-15 + heave * 2)})">
        <path d="M-9,-5 L-8,-13 L-2,-9 Z M3,-9 L9,-13 L9,-5 Z" fill="${fur}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        ${fluff(1, 0, 11.6, 10.4, 14, 0.13, fur)}
        <ellipse cx="2" cy="1" rx="8.6" ry="7.6" fill="${face}"/>
        ${gag && heave > 0.3
          ? `<path d="M-4,-2 l3,1.6 l-3,1.6 M8,-2 l-3,1.6 l3,1.6" fill="none" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`
          : `${eye(-1.6, -0.6, 3.6, '#e08a1c', c, 0.1)}${eye(5.6, -0.8, 3.2, '#e08a1c', c, 0.1)}`}
        <path d="M3,3.6 L4.6,3.6 L3.8,4.8 Z" fill="#e88a9a"/>
        ${open(c) || heave > 0.5 || spit ? mouthO(3.8, 6.4, 2.6, 2.4) : `<path d="M2.4,5.6 Q3.1,6.4 3.8,5.6 Q4.5,6.4 5.2,5.6" fill="none" stroke="${OUT}" stroke-width=".8" stroke-linecap="round"/>`}
        ${blush(-4, 3.6, '#ff9aa8', 1.8)}
      </g>
      ${spit && MS.HAIRBALL ? `<g transform="translate(13 -4)">${MS.HAIRBALL(2.6)}</g>` : ''}
      ${puff(c, 13, -10, '#d8b890')}
    </g>`;
  }

  const B = { caramelo, pinscher, tatubola, formiga, rolabosta, galinha, barata, baiacu, camaleao, pombo, abelha, sapo, picapau, pernilongo, gato };
  for (const k in B) MS.Art.register('bb_' + k, B[k]);
  MS.Art.hasBaby = sp => !!B[sp];
})();
