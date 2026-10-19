// Bichos caricatos: Caramelo (vira-lata), Pinscher, Tatu-bola, Formiga e Rola-bosta.
// Pés em y = 0, virados para +x. c: { f, blink, breath, bob, step, charge, flap, mania (0..1 ou null), hurt }
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const OUT = '#2a1f1a';
  const hump = (t, a = 0, b = 1) => (t === null || t === undefined || t < a || t > b) ? 0 : sin(PI * (t - a) / (b - a));
  const on = t => t !== null && t !== undefined;

  function eye(cx, cy, r, iris, c, look = 0.3, ry = 1.12) {
    if (c.hurt) return `<path d="M${f1(cx - r * 0.7)},${f1(cy - r * 0.7)} L${f1(cx + r * 0.7)},${f1(cy + r * 0.7)} M${f1(cx + r * 0.7)},${f1(cy - r * 0.7)} L${f1(cx - r * 0.7)},${f1(cy + r * 0.7)}" stroke="${OUT}" stroke-width="1.4" stroke-linecap="round"/>`;
    if (c.blink) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.8)} ${f1(cx + r)},${f1(cy)}" fill="none" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r)}" ry="${f1(r * ry)}" fill="#fff" stroke="${OUT}" stroke-width=".9"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.08)}" rx="${f1(r * 0.6)}" ry="${f1(r * 0.7 * ry)}" fill="${iris}"/>
      <circle cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.12)}" r="${f1(r * 0.32)}" fill="#120c0a"/>
      <circle cx="${f1(cx + r * (look + 0.22))}" cy="${f1(cy - r * 0.3)}" r="${f1(r * 0.24)}" fill="#fff"/>`;
  }
  function puff(c, mx, my, col, hi) {
    if (!(c.breath > 0)) return '';
    const j = sin(c.f * 1.7) * 2;
    return `<g opacity=".9"><path d="M${mx},${my - 2} Q${mx + 11},${f1(my - 7 + j)} ${mx + 24},${my - 1} Q${mx + 12},${my + 4} ${mx},${my + 3} Z" fill="${col}"/>
      <path d="M${mx},${my} Q${mx + 9},${my - 2} ${mx + 18},${my - 1} Q${mx + 9},${my + 2} ${mx},${my + 2} Z" fill="${hi}"/></g>`;
  }
  // perninha com joelho (patas de cachorro)
  const leg = (x, y, len, ang, col, w = 3.2) => {
    const ex = x + sin(ang) * len, ey = y + cos(ang) * len;
    return `<path d="M${f1(x)},${f1(y)} L${f1(ex)},${f1(ey)}" stroke="${OUT}" stroke-width="${f1(w + 1.6)}" stroke-linecap="round"/>
      <path d="M${f1(x)},${f1(y)} L${f1(ex)},${f1(ey)}" stroke="${col}" stroke-width="${f1(w)}" stroke-linecap="round"/>`;
  };

  // ---------- Caramelo: o vira-lata do Brasil. Sorrisão, língua de fora, rabo que não para; mania: pulinhos de alegria ----------
  function caramelo(c) {
    const m = c.mania, jump = on(m) ? Math.abs(sin(m * PI * 3)) * 7 : 0;
    const wag = sin(c.f * (on(m) ? 1.1 : 0.55)) * 0.5;
    const st = c.step * 0.25, body = '#d38a3a', belly = '#f3cd8e';
    const earF = on(m) ? sin(m * PI * 6) * 0.4 : 0;
    return `<g transform="translate(0 ${f1(-jump + c.bob)})">
      ${leg(-8, -10, 9, 0.15 + st, '#b8742e')}${leg(7, -10, 9, -0.1 - st, '#b8742e')}
      <g transform="translate(-12 -15) rotate(${f1(-30 + wag * 57)})"><path d="M0,0 C-4,-4 -4,-10 1,-12" fill="none" stroke="${OUT}" stroke-width="4.6" stroke-linecap="round"/><path d="M0,0 C-4,-4 -4,-10 1,-12" fill="none" stroke="${body}" stroke-width="3" stroke-linecap="round"/></g>
      <ellipse cx="-1" cy="-15" rx="13" ry="7.5" fill="${body}" stroke="${OUT}" stroke-width="1.2"/>
      <ellipse cx="0" cy="-11.5" rx="9" ry="3.5" fill="${belly}"/>
      ${leg(-5, -10, 9, -0.1 - st, body)}${leg(9, -10, 9, 0.12 + st, body)}
      <g transform="translate(11 -21)">
        <g transform="rotate(${f1(-25 + earF * 57)} -3 -6)"><path d="M-3,-6 C-8,-8 -9,-2 -6,2 C-4,-1 -2,-3 -1,-5 Z" fill="#a8652a" stroke="${OUT}" stroke-width="1"/></g>
        <ellipse cx="0" cy="0" rx="8.5" ry="7.5" fill="${body}" stroke="${OUT}" stroke-width="1.2"/>
        <ellipse cx="7" cy="2.5" rx="5" ry="3.6" fill="${belly}" stroke="${OUT}" stroke-width="1"/>
        <ellipse cx="11.4" cy="1" rx="1.8" ry="1.4" fill="#2a1f1a"/>
        <path d="M2,-7 C3,-13 7,-12 7,-7 Z" fill="#b8742e" stroke="${OUT}" stroke-width="1" transform="rotate(${f1(earF * -30)} 4 -7)"/>
        ${eye(2.5, -2, 2.8, '#6a3a12', c)}
        ${c.breath > 0 || c.hurt
          ? `<ellipse cx="8" cy="5.5" rx="2.6" ry="2" fill="#5a1a1a" stroke="${OUT}" stroke-width=".7"/>`
          : `<path d="M4.5,4.5 Q8,8 11.5,4.5" fill="none" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
             <path d="M7.4,6 q.4,${f1(4 + (on(m) ? sin(m * PI * 8) * 1.2 : 0))} 2.4,${f1(3.6 + (on(m) ? sin(m * PI * 8) * 1.2 : 0))} q1.2,-1 .4,-3.6 Z" fill="#ff7a8a" stroke="${OUT}" stroke-width=".6"/>`}
        <ellipse cx="0" cy="3.5" rx="1.8" ry="1" fill="#ff8aa0" opacity=".45"/>
      </g>
      ${puff(c, 22, -16, '#f3cd8e', '#fff8e8')}
    </g>`;
  }

  // ---------- Pinscher: pequeno, treme sem parar, olhos saltados, se acha um leão; mania: late até dar um passinho para trás ----------
  function pinscher(c) {
    const m = c.mania, bark = on(m) && (Math.floor(m * 10) % 2 === 0);
    const shake = sin(c.f * 3.1) * (c.hurt ? 1.2 : 0.55);
    const back = on(m) ? -Math.floor(m * 5) * 0.8 : 0;
    const blk = '#2a2228', tan = '#c9783a', st = c.step * 0.3;
    const open = bark || c.breath > 0 || c.hurt;
    return `<g transform="translate(${f1(shake + back)} ${f1(c.bob)})">
      ${leg(-6, -9, 8.5, 0.1 + st, '#1e181c', 2.2)}${leg(6, -9, 8.5, -0.05 - st, '#1e181c', 2.2)}
      <path d="M-10,-14 l-3,-5" stroke="${OUT}" stroke-width="3.4" stroke-linecap="round"/><path d="M-10,-14 l-3,-5" stroke="${blk}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="0" cy="-13" rx="10.5" ry="5.6" fill="${blk}" stroke="${OUT}" stroke-width="1.1"/>
      <ellipse cx="6" cy="-11" rx="4" ry="3" fill="${tan}"/>
      ${leg(-3, -9, 8.5, -0.06 - st, tan, 2.2)}${leg(8, -9, 8.5, 0.1 + st, tan, 2.2)}
      <g transform="translate(9 -20) rotate(${f1(open ? -8 : 0)})">
        <path d="M-5,-4 L-8,-16 L-1,-6 Z" fill="${blk}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-6,-6 L-7.3,-12.5 L-3,-6.5 Z" fill="#d88a8a"/>
        <path d="M1,-5 L2,-17 L6,-5 Z" fill="${blk}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="0" cy="0" rx="6.5" ry="6" fill="${blk}" stroke="${OUT}" stroke-width="1.1"/>
        <path d="M3,1 L12,2.5 L11,5 L3,5 Z" fill="${tan}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="12" cy="2.4" rx="1.4" ry="1.1" fill="#120c0a"/>
        <ellipse cx="-0.5" cy="-4.8" rx="1.6" ry="1" fill="${tan}"/><ellipse cx="4.6" cy="-4.4" rx="1.4" ry=".9" fill="${tan}"/>
        ${eye(0, -1.5, 3.2, '#5a2a10', c, 0.35, 1.0)}${eye(5, -1.2, 2.7, '#5a2a10', c, 0.35, 1.0)}
        ${open ? `<path d="M4,5 L11.5,5 L10,9 L5,8.5 Z" fill="#5a1a1a" stroke="${OUT}" stroke-width=".7"/><path d="M6,5 l.6,1.4 l.6,-1.4 M9,5 l.6,1.4 l.6,-1.4" fill="#fff"/>` : `<path d="M5,6 q3,1 6,-.4" fill="none" stroke="${OUT}" stroke-width=".8"/>`}
        ${bark ? `<g stroke="#fff" stroke-width="1.1" stroke-linecap="round" fill="none"><path d="M15,0 l4,-2"/><path d="M15.5,4 l5,0"/><path d="M15,8 l4,2"/></g>` : ''}
      </g>
      ${puff(c, 22, -15, '#e8e0ff', '#ffffff')}
    </g>`;
  }

  // ---------- Tatu-bola: cascudo e medroso; mania: vira bola, espia com um olhinho e desenrola ----------
  function tatubola(c) {
    const m = c.mania, curl = on(m) ? (m < 0.25 ? m / 0.25 : m > 0.8 ? (1 - m) / 0.2 : 1) : 0;
    const shell = '#8c7a62', band = '#5e4e3a', skin = '#d8b48a';
    if (curl > 0.5) {
      const peek = on(m) && m > 0.4 && m < 0.75;
      return `<g transform="translate(0 ${f1(-10 + c.bob)})">
        <circle r="10.5" fill="${shell}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-9,-5 Q0,-9 9,-5 M-10.3,0 Q0,-4 10.3,0 M-9,5 Q0,1 9,5" fill="none" stroke="${band}" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M2,-10.4 Q9,-9 10.4,-2 Q6,-6 2,-10.4 Z" fill="#a8946e" stroke="${OUT}" stroke-width=".8"/>
        ${peek ? `<g transform="translate(6 3)"><ellipse rx="3" ry="2.4" fill="${skin}" stroke="${OUT}" stroke-width=".7"/>${eye(0.4, 0, 1.6, '#3a2010', c, 0.4)}</g>` : `<path d="M5,4 q2,1.5 4,0" stroke="${OUT}" stroke-width=".8" fill="none"/>`}
      </g>`;
    }
    const st = c.step * 0.6;
    return `<g transform="translate(0 ${f1(c.bob)})">
      <ellipse cx="${f1(-6 + st)}" cy="-1.8" rx="3" ry="2" fill="${skin}" stroke="${OUT}" stroke-width=".9"/><ellipse cx="${f1(6 - st)}" cy="-1.8" rx="3" ry="2" fill="${skin}" stroke="${OUT}" stroke-width=".9"/>
      <path d="M-12,-5 Q-17,-5 -18,-1" fill="none" stroke="${OUT}" stroke-width="3.2" stroke-linecap="round"/><path d="M-12,-5 Q-17,-5 -18,-1" fill="none" stroke="${shell}" stroke-width="1.9" stroke-linecap="round"/>
      <path d="M-13,-3.5 C-14,-14 -6,-20 1,-20 C8,-20 13,-14 12,-3.5 Z" fill="${shell}" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-5,-19 Q-6,-11 -6,-4 M0,-20 Q0,-11 0,-3.5 M5,-19 Q6,-11 6,-4" fill="none" stroke="${band}" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="-9" cy="-10" r=".9" fill="${band}"/><circle cx="9" cy="-12" r=".9" fill="${band}"/><circle cx="-3" cy="-15" r=".8" fill="${band}"/>
      <g transform="translate(11 -8)">
        <path d="M-2,-4 Q2,-9 6,-5" fill="#a8946e" stroke="${OUT}" stroke-width=".9"/>
        <path d="M0,-5 L-2,-10 L2,-6 Z" fill="${skin}" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>
        <path d="M-1,-3 C2,-6 8,-4 11,0 C8,3 2,3 -1,2 Z" fill="${skin}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="11" cy="0" rx="1.2" ry="1" fill="#3a2010"/>
        ${eye(3.5, -1.4, 2, '#3a2010', c, 0.4)}
        ${c.breath > 0 || c.hurt ? `<ellipse cx="8" cy="2" rx="1.3" ry="1" fill="#5a1a1a"/>` : ''}
      </g>
      ${puff(c, 22, -8, '#c8b8a0', '#fff3dc')}
    </g>`;
  }

  // ---------- Formiga: brava e esforçada, carrega uma migalha gigante; mania: bate as pinças, "vem que tem" ----------
  function formiga(c) {
    const m = c.mania, clack = on(m) ? Math.abs(sin(m * PI * 7)) : 0.25 + 0.1 * sin(c.f * 0.2);
    const tap = on(m) ? sin(m * PI * 10) * 1.5 : 0;
    const red = '#c8382a', dark = '#7a1e18', st = c.step * 0.7;
    const legs = [[-6, 0.35], [0, 0], [5, -0.3]].map(([x, a], i) => {
      const s = (i % 2 ? st : -st) + (i === 2 ? tap * 0.1 : 0);
      return `<path d="M${x},-9 l${f1(-3 + s)},4 l${f1(1 + s)},5" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('');
    const carry = !(c.breath > 0);
    return `<g transform="translate(0 ${f1(c.bob)})">
      ${legs}
      <ellipse cx="-9" cy="-11" rx="7" ry="5.6" fill="${red}" stroke="${OUT}" stroke-width="1.1"/>
      <ellipse cx="-11" cy="-13" rx="2.6" ry="1.4" fill="#ff8a7a" opacity=".6"/>
      <ellipse cx="-1" cy="-12" rx="3.6" ry="2.8" fill="${dark}" stroke="${OUT}" stroke-width="1"/>
      <path d="M2,-14 L4,-21" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/><path d="M2,-14 L4,-21" stroke="${dark}" stroke-width="1.2" stroke-linecap="round"/>
      <g transform="translate(6 -20)">
        <path d="M-1,-5 Q-3,-12 -7,-13 M2,-5 Q2,-12 5,-14" fill="none" stroke="${OUT}" stroke-width="1" stroke-linecap="round"/>
        <circle cx="-7" cy="-13" r="1" fill="${OUT}"/><circle cx="5" cy="-14" r="1" fill="${OUT}"/>
        <ellipse cx="0" cy="0" rx="6.4" ry="5.6" fill="${red}" stroke="${OUT}" stroke-width="1.1"/>
        <path d="M-1,-4.2 L5,-2.6" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>
        ${eye(2.2, -0.8, 2.4, '#1a0c0a', c, 0.35)}
        <g transform="translate(5.5 3)">
          <path d="M0,0 Q5,${f1(-1 - clack * 3)} 6,${f1(1 - clack * 2.5)} Q3,${f1(0.5 - clack)} 0,1 Z" fill="${dark}" stroke="${OUT}" stroke-width=".8"/>
          <path d="M0,1 Q5,${f1(3 + clack * 3)} 6,${f1(1.5 + clack * 2.5)} Q3,${f1(1.5 + clack)} 0,1.5 Z" fill="${dark}" stroke="${OUT}" stroke-width=".8"/>
        </g>
      </g>
      ${carry ? `<g transform="translate(3 -29) rotate(${f1(sin(c.f * 0.1) * 4)})">
        <path d="M-9,0 C-10,-6 -4,-10 2,-9 C8,-10 11,-4 9,1 C6,4 -6,4 -9,0 Z" fill="#e8c070" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <circle cx="-3" cy="-4" r=".9" fill="#b8883a"/><circle cx="3" cy="-6" r=".8" fill="#b8883a"/><circle cx="5" cy="-1" r=".9" fill="#b8883a"/>
        <path d="M-4,1 L-1,10 M5,1 L4,10" stroke="${OUT}" stroke-width="1.4" stroke-linecap="round"/></g>` : ''}
      ${puff(c, 14, -17, '#e8c070', '#fff4d8')}
    </g>`;
  }

  // ---------- Rola-bosta: besouro que empurra uma bola de terra com as patas de trás; mania: a bola rola de volta e ele corre atrás ----------
  function rolabosta(c) {
    const m = c.mania, away = on(m) ? hump(m, 0, 0.6) * 12 : 0, chase = on(m) ? hump(m, 0.3, 1) * 8 : 0;
    const st = c.step + (on(m) && m > 0.3 ? sin(c.f * 2) * 1.5 : 0);
    const roll = (c.f * 3 + away * 20) % 360;
    const kick = c.breath > 0;
    const shellC = '#2e4a3a', hi = '#6fa88a';
    return `<g transform="translate(0 ${f1(c.bob)})">
      ${kick ? '' : `<g transform="translate(${f1(-17 - away)} -10) rotate(${f1(-roll)})">
        <circle r="10" fill="#7a5230" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-6,-4 q3,-2 5,1 M2,4 q3,-1 4,2 M-3,6 q1,-2 3,-1 M3,-6 q2,1 1,3" fill="none" stroke="#5a3a20" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="-4" cy="2" r="1" fill="#9a7048"/><circle cx="5" cy="-2" r=".9" fill="#9a7048"/></g>`}
      <g transform="translate(${f1(-chase * 0.6)} 0)">
        <path d="M-7,-8 l${f1(-5 + st)},-2 l-2,-3 M-4,-6 l${f1(-2 - st)},6 M2,-6 l${f1(2 + st)},6 M6,-7 l${f1(4 - st)},7" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="-1" cy="-11" rx="10" ry="7.5" fill="${shellC}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-1,-18.5 L-1,-4" stroke="${OUT}" stroke-width=".9"/>
        <path d="M-7,-15 Q-4,-18 0,-17.5" fill="none" stroke="${hi}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
        <g transform="translate(9 -10)">
          <ellipse cx="0" cy="0" rx="5" ry="4.2" fill="#24382c" stroke="${OUT}" stroke-width="1.1"/>
          <path d="M3,-3 Q6,-8 4,-10" fill="none" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/><path d="M3,-3 Q6,-8 4,-10" fill="none" stroke="#3a5a48" stroke-width="1.2" stroke-linecap="round"/>
          ${eye(1.6, -0.6, 2.2, '#2a6a3a', c, 0.4)}
          ${c.breath > 0 || c.hurt ? `<ellipse cx="4.2" cy="2.4" rx="1.2" ry="1" fill="#5a1a1a"/>` : `<path d="M2.6,2.4 q1.4,1 2.6,0" stroke="${OUT}" stroke-width=".7" fill="none"/>`}
          <path d="M4,3 l3,1.4 M4,1.5 l3.4,-.4" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
        </g>
      </g>
      ${on(m) && m > 0.25 && m < 0.9 ? `<g stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"><path d="M14,-14 h4 M15,-9 h5"/></g>` : ''}
      ${puff(c, 15, -10, '#9a7048', '#d8b890')}
    </g>`;
  }

  const NEW = { caramelo, pinscher, tatubola, formiga, rolabosta };
  const reg = () => { if (MS.Art && MS.Art.register) { for (const k in NEW) MS.Art.register(k, NEW[k]); return true; } return false; };
  if (!reg()) document.addEventListener('DOMContentLoaded', reg);
})();
