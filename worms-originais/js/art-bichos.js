// Bichos caricatos em estilo "cabeção": cabeça grande, corpinho pequeno, patinhas curtas, olhos enormes.
// Caramelo (vira-lata), Pinscher, Tatu-bola, Formiga e Rola-bosta.
// Pés em y = 0, virados para +x. c: { f, blink, breath, bob, step, charge, flap, mania (0..1 ou null), hurt }
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const sin = Math.sin, PI = Math.PI;
  const OUT = '#2a1f1a';
  const hump = (t, a = 0, b = 1) => (t === null || t === undefined || t < a || t > b) ? 0 : sin(PI * (t - a) / (b - a));
  const on = t => t !== null && t !== undefined;

  // olho grande e brilhante (fecha ao piscar, vira X quando apanha)
  function eye(cx, cy, r, iris, c, look = 0.25, ry = 1.15) {
    if (c.hurt) return `<path d="M${f1(cx - r * 0.65)},${f1(cy - r * 0.65)} L${f1(cx + r * 0.65)},${f1(cy + r * 0.65)} M${f1(cx + r * 0.65)},${f1(cy - r * 0.65)} L${f1(cx - r * 0.65)},${f1(cy + r * 0.65)}" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (c.blink) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.8)} ${f1(cx + r)},${f1(cy)}" fill="none" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r)}" ry="${f1(r * ry)}" fill="#fff" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.1)}" rx="${f1(r * 0.66)}" ry="${f1(r * 0.76 * ry)}" fill="${iris}"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.14)}" rx="${f1(r * 0.38)}" ry="${f1(r * 0.44 * ry)}" fill="#120c0a"/>
      <circle cx="${f1(cx + r * (look + 0.26))}" cy="${f1(cy - r * 0.32)}" r="${f1(r * 0.28)}" fill="#fff"/>
      <circle cx="${f1(cx + r * (look - 0.18))}" cy="${f1(cy + r * 0.38)}" r="${f1(r * 0.13)}" fill="#fff" opacity=".85"/>`;
  }
  const blush = (x, y, col = '#ff8aa0', r = 2.4) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.55)}" fill="${col}" opacity=".55"/>`;
  const foot = (x, col, rx = 3.2) => `<ellipse cx="${f1(x)}" cy="-1.6" rx="${rx}" ry="2.1" fill="${col}" stroke="${OUT}" stroke-width="1"/>`;
  function puff(c, mx, my, col, hi) {
    if (!(c.breath > 0)) return '';
    const j = sin(c.f * 1.7) * 2;
    return `<g opacity=".9"><path d="M${mx},${my - 2} Q${mx + 11},${f1(my - 7 + j)} ${mx + 24},${my - 1} Q${mx + 12},${my + 4} ${mx},${my + 3} Z" fill="${col}"/>
      <path d="M${mx},${my} Q${mx + 9},${my - 2} ${mx + 18},${my - 1} Q${mx + 9},${my + 2} ${mx},${my + 2} Z" fill="${hi}"/></g>`;
  }
  const mouthO = (x, y, w, h = w * 0.8) => `<ellipse cx="${x}" cy="${y}" rx="${f1(w / 2)}" ry="${f1(h / 2)}" fill="#6a1a24" stroke="${OUT}" stroke-width=".8"/>`;

  // ---------- Caramelo: vira-lata cabeçudo, sorrisão e língua de fora; mania: pulinhos de alegria ----------
  function caramelo(c) {
    const m = c.mania, jump = on(m) ? Math.abs(sin(m * PI * 3)) * 6 : 0;
    const wag = sin(c.f * (on(m) ? 1.2 : 0.6));
    const body = '#d68d3c', light = '#f6d29a', dark = '#a8652a';
    const ear = on(m) ? sin(m * PI * 6) * 18 : sin(c.f * 0.05) * 4;
    const open = c.breath > 0 || c.hurt;
    return `<g transform="translate(0 ${f1(-jump + c.bob)})">
      <g transform="translate(-8 -9) rotate(${f1(-40 + wag * 30)})"><path d="M0,0 C-3,-3 -3,-8 1,-9" fill="none" stroke="${OUT}" stroke-width="4.4" stroke-linecap="round"/><path d="M0,0 C-3,-3 -3,-8 1,-9" fill="none" stroke="${body}" stroke-width="2.8" stroke-linecap="round"/></g>
      ${foot(-5 + c.step * 0.6, dark, 2.8)}${foot(4 - c.step * 0.6, dark, 2.8)}
      <ellipse cx="-1" cy="-7.5" rx="8" ry="6" fill="${body}" stroke="${OUT}" stroke-width="1.1"/>
      <ellipse cx="1" cy="-5.5" rx="5" ry="3.2" fill="${light}"/>
      ${foot(-2 - c.step * 0.6, body, 2.8)}${foot(7 + c.step * 0.6, body, 2.8)}
      <g transform="translate(3 -21)">
        <g transform="rotate(${f1(-20 - ear)} -8 -6)"><path d="M-8,-6 C-15,-7 -16,2 -11,6 C-9,2 -7,-1 -5,-3 Z" fill="${dark}" stroke="${OUT}" stroke-width="1"/></g>
        <circle r="12" fill="${body}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-6,-10 Q-1,-13 5,-11" fill="none" stroke="#f0b060" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        <g transform="rotate(${f1(-ear * 0.6)} 5 -9)"><path d="M3,-9 C4,-17 11,-16 11,-8 Z" fill="${dark}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/></g>
        <ellipse cx="6.5" cy="5" rx="6.5" ry="5" fill="${light}" stroke="${OUT}" stroke-width="1"/>
        <ellipse cx="10.4" cy="2.4" rx="2.2" ry="1.7" fill="#2a1f1a"/><ellipse cx="10" cy="1.9" rx=".7" ry=".5" fill="#fff" opacity=".7"/>
        ${eye(-0.5, -2.5, 3.8, '#7a4012', c)}${eye(7.5, -3, 3.3, '#7a4012', c)}
        ${blush(-5, 4)}${blush(12, 6, '#ff8aa0', 1.8)}
        ${open ? mouthO(6.5, 7.5, 4, 3.4)
          : `<path d="M3.5,6.5 Q6.5,9.6 9.5,6.5" fill="none" stroke="${OUT}" stroke-width="1" stroke-linecap="round"/>
             <path d="M5.4,8 q.2,${f1(3.4 + (on(m) ? sin(m * PI * 8) : 0))} 2.2,${f1(3.2 + (on(m) ? sin(m * PI * 8) : 0))} q1.2,-1 .6,-3.4 Z" fill="#ff7a8a" stroke="${OUT}" stroke-width=".6"/>`}
      </g>
      ${puff(c, 15, -14, '#f6d29a', '#fff8e8')}
    </g>`;
  }

  // ---------- Pinscher: cabeção preto com orelhonas, olhos saltados, treme sem parar; mania: late e dá um passinho para trás ----------
  function pinscher(c) {
    const m = c.mania, bark = on(m) && (Math.floor(m * 10) % 2 === 0);
    const shake = sin(c.f * 3.1) * (c.hurt ? 1.2 : 0.6);
    const back = on(m) ? -Math.floor(m * 5) * 0.9 : 0;
    const blk = '#2c2329', tan = '#c97b3c';
    const open = bark || c.breath > 0 || c.hurt;
    return `<g transform="translate(${f1(shake + back)} ${f1(c.bob)})">
      <path d="M-6,-8 l-3,-4" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/><path d="M-6,-8 l-3,-4" stroke="${blk}" stroke-width="1.7" stroke-linecap="round"/>
      ${foot(-4 + c.step * 0.6, tan, 2.2)}${foot(4 - c.step * 0.6, tan, 2.2)}
      <path d="M-4,-3 v-3 M4,-3 v-3" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/><path d="M-4,-3 v-3 M4,-3 v-3" stroke="${tan}" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="0" cy="-8" rx="6.5" ry="4.6" fill="${blk}" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="3" cy="-7" rx="2.8" ry="2.4" fill="${tan}"/>
      <g transform="translate(3 -20) rotate(${f1(open ? -6 : 0)})">
        <path d="M-8,-6 L-12,-24 L-2,-10 Z" fill="${blk}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M-8,-8.5 L-10.5,-19.5 L-4,-10.5 Z" fill="#e09a9a"/>
        <path d="M2,-10 L7,-26 L10,-7 Z" fill="${blk}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M3.6,-10 L6.8,-21 L8.6,-9 Z" fill="#e09a9a"/>
        <ellipse cx="0" cy="0" rx="11" ry="10.5" fill="${blk}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-6,-8 Q-1,-11 4,-9" fill="none" stroke="#5a4a54" stroke-width="1.6" stroke-linecap="round"/>
        <ellipse cx="7" cy="5.5" rx="5.6" ry="4.4" fill="${tan}" stroke="${OUT}" stroke-width="1"/>
        <ellipse cx="11.2" cy="3.4" rx="1.8" ry="1.4" fill="#120c0a"/>
        <ellipse cx="-2.5" cy="-6.6" rx="2" ry="1.2" fill="${tan}"/><ellipse cx="5.5" cy="-6.8" rx="1.8" ry="1.1" fill="${tan}"/>
        ${eye(-2, -1.5, 4.4, '#6a3010', c, 0.3, 1.05)}${eye(6.5, -1.5, 3.8, '#6a3010', c, 0.3, 1.05)}
        ${open ? `<path d="M3,7 L11,7 L9.6,11 L4.4,10.6 Z" fill="#6a1a24" stroke="${OUT}" stroke-width=".8"/><path d="M5,7 l.7,1.6 l.7,-1.6 M8,7 l.7,1.6 l.7,-1.6" fill="#fff"/>`
               : `<path d="M4,8 q3.4,1.4 6.4,-.4" fill="none" stroke="${OUT}" stroke-width=".9"/>`}
        ${bark ? `<g stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"><path d="M15,0 l4,-2.4"/><path d="M15.6,5 l5,0"/><path d="M15,10 l4,2.4"/></g>` : ''}
      </g>
      ${puff(c, 14, -14, '#e8e0ff', '#ffffff')}
    </g>`;
  }

  // ---------- Tatu-bola: cabeção com capacete de casco e orelhinhas; mania: vira bola, espia com um olhinho e desenrola ----------
  function tatubola(c) {
    const m = c.mania, curl = on(m) ? (m < 0.25 ? m / 0.25 : m > 0.8 ? (1 - m) / 0.2 : 1) : 0;
    const shell = '#8f7c62', band = '#5e4e3a', skin = '#e2bd92';
    if (curl > 0.5) {
      const peek = on(m) && m > 0.4 && m < 0.75;
      return `<g transform="translate(0 ${f1(-11 + c.bob)})">
        <circle r="11.5" fill="${shell}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-10,-5.5 Q0,-10 10,-5.5 M-11.3,0 Q0,-4.5 11.3,0 M-10,5.5 Q0,1 10,5.5" fill="none" stroke="${band}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M-6,-8 Q-2,-10 2,-9.5" stroke="#c0aa88" stroke-width="1.6" stroke-linecap="round" fill="none"/>
        ${peek ? `<g transform="translate(6.5 3.5)"><ellipse rx="3.8" ry="3" fill="${skin}" stroke="${OUT}" stroke-width=".8"/>${eye(0.6, 0, 2.1, '#3a2010', c, 0.35)}</g>`
               : `<path d="M5,5 q2.4,1.6 4.6,0" stroke="${OUT}" stroke-width=".9" fill="none"/>`}
      </g>`;
    }
    return `<g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-4 Q-13,-4 -14,-1" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/><path d="M-8,-4 Q-13,-4 -14,-1" fill="none" stroke="${shell}" stroke-width="1.7" stroke-linecap="round"/>
      ${foot(-5 + c.step * 0.6, skin, 2.6)}${foot(3 - c.step * 0.6, skin, 2.6)}
      <path d="M-10,-3 C-11,-11 -5,-15 0,-15 C5,-15 9,-11 8,-3 Z" fill="${shell}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-4,-14 Q-5,-9 -5,-3.4 M1,-15 Q1,-9 1,-3 " fill="none" stroke="${band}" stroke-width="1.3" stroke-linecap="round"/>
      <g transform="translate(6 -16)">
        <path d="M-7,-6 L-9,-13 L-3,-9 Z M1,-9 L2,-15 L5,-8 Z" fill="${skin}" stroke="${OUT}" stroke-width=".9" stroke-linejoin="round"/>
        <circle r="10" fill="${skin}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-9,-3 C-9,-11 -2,-13 4,-11 C7,-10 9,-7 9,-4 C5,-6 -4,-6 -9,-3 Z" fill="${shell}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-6,-7 Q-1,-9 4,-8" fill="none" stroke="${band}" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M6,1 C9,0 13,1 14,3 C12,5 8,5 6,4 Z" fill="${skin}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="13.6" cy="2.6" rx="1.3" ry="1.1" fill="#3a2010"/>
        ${eye(-1.5, 0, 3.4, '#4a2a12', c)}${eye(5, 0, 3, '#4a2a12', c)}
        ${blush(-5.5, 5)}${c.breath > 0 || c.hurt ? mouthO(8.5, 6, 2.6, 2.2) : `<path d="M6.5,5.5 q2,1.4 4,0" fill="none" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>`}
      </g>
      ${puff(c, 21, -13, '#c8b8a0', '#fff3dc')}
    </g>`;
  }

  // ---------- Formiga: cabeção vermelho com antenas, corpinho de três bolinhas, segura uma migalha gigante; mania: bate as pinças ----------
  function formiga(c) {
    const m = c.mania, clack = on(m) ? Math.abs(sin(m * PI * 7)) : 0.25 + 0.1 * sin(c.f * 0.2);
    const tap = on(m) ? sin(m * PI * 10) : 0;
    const red = '#d03c2c', dark = '#8a221a';
    const carry = !(c.breath > 0);
    const legs = [-7, -3, 1].map((x, i) => { const s = (i % 2 ? c.step : -c.step) * 0.5 + (i === 2 ? tap : 0); return `<path d="M${x},-6 l${f1(-1.6 + s)},3 l${f1(0.6 + s)},3" fill="none" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
    return `<g transform="translate(0 ${f1(c.bob)})">
      ${legs}
      <ellipse cx="-9" cy="-8" rx="5.2" ry="4.4" fill="${red}" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="-10" cy="-9.6" rx="2" ry="1.1" fill="#ff9a8a" opacity=".6"/>
      <ellipse cx="-3" cy="-7.5" rx="2.8" ry="2.4" fill="${dark}" stroke="${OUT}" stroke-width=".9"/>
      ${carry ? `<g transform="translate(4 -37) rotate(${f1(sin(c.f * 0.1) * 5)})">
        <path d="M-10,1 C-11,-5 -5,-9 1,-8.5 C8,-9 11,-4 10,1 C7,4 -6,4 -10,1 Z" fill="#ecc474" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <circle cx="-4" cy="-3" r="1" fill="#b8883a"/><circle cx="3" cy="-5" r=".9" fill="#b8883a"/><circle cx="5" cy="0" r="1" fill="#b8883a"/>
        <path d="M-6,-6 Q-2,-8 2,-7.5" stroke="#fff2c8" stroke-width="1.4" stroke-linecap="round" fill="none"/></g>
        <path d="M-2,-24 L-3,-33 M8,-24 L9,-33" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>` : ''}
      <g transform="translate(3 -18)">
        <path d="M-3,-10 Q-6,-17 -10,-17 M4,-10 Q5,-17 9,-18" fill="none" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="-10" cy="-17" r="1.3" fill="${OUT}"/><circle cx="9" cy="-18" r="1.3" fill="${OUT}"/>
        <circle r="11" fill="${red}" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-6,-8 Q-1,-11 4,-9" fill="none" stroke="#ff8a7a" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <path d="M-5.5,-6.4 L0,-4.6 M3.6,-5 L8.4,-6.6" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>
        ${eye(-1.5, -0.5, 3.6, '#1a0c0a', c, 0.3)}${eye(6, -0.5, 3.2, '#1a0c0a', c, 0.3)}
        ${blush(-6, 5, '#ffb0a0')}
        <g transform="translate(8 6)">
          <path d="M0,0 Q5,${f1(-1 - clack * 3)} 6.5,${f1(1 - clack * 2.6)} Q3,${f1(0.4 - clack)} 0,1 Z" fill="${dark}" stroke="${OUT}" stroke-width=".8"/>
          <path d="M0,1 Q5,${f1(3 + clack * 3)} 6.5,${f1(1.4 + clack * 2.6)} Q3,${f1(1.6 + clack)} 0,1.6 Z" fill="${dark}" stroke="${OUT}" stroke-width=".8"/>
        </g>
        ${c.breath > 0 || c.hurt ? mouthO(5, 6, 2.6, 2) : ''}
      </g>
      ${puff(c, 17, -12, '#ecc474', '#fff4d8')}
    </g>`;
  }

  // ---------- Rola-bosta: cabeção com chifrinho, carapaça brilhante pequena, bola de terra atrás; mania: a bola rola de volta e ele corre atrás ----------
  function rolabosta(c) {
    const m = c.mania, away = on(m) ? hump(m, 0, 0.6) * 12 : 0, chase = on(m) ? hump(m, 0.3, 1) * 7 : 0;
    const st = c.step + (on(m) && m > 0.3 ? sin(c.f * 2) * 1.4 : 0);
    const roll = (c.f * 3 + away * 20) % 360;
    const kick = c.breath > 0;
    const shellC = '#2f4f3e', hi = '#7fbf9a';
    return `<g transform="translate(0 ${f1(c.bob)})">
      ${kick ? '' : `<g transform="translate(${f1(-16 - away)} -9.5) rotate(${f1(-roll)})">
        <circle r="9.5" fill="#7a5230" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-6,-4 q3,-2 5,1 M2,4 q3,-1 4,2 M-3,6 q1,-2 3,-1 M3,-6 q2,1 1,3" fill="none" stroke="#5a3a20" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="-4" cy="2" r="1" fill="#9a7048"/><circle cx="5" cy="-2" r=".9" fill="#9a7048"/></g>`}
      <g transform="translate(${f1(-chase * 0.6)} 0)">
        <path d="M-7,-5 l${f1(-4 + st)},-1.5 l-1.4,-2.4 M-4,-3 l${f1(-1.6 - st)},3 M1,-3 l${f1(1.6 + st)},3" fill="none" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="-3" cy="-8" rx="7" ry="5.6" fill="${shellC}" stroke="${OUT}" stroke-width="1.1"/>
        <path d="M-3,-13.5 L-3,-3" stroke="${OUT}" stroke-width=".8"/>
        <path d="M-8,-10 Q-6,-12.5 -3.5,-12.5" fill="none" stroke="${hi}" stroke-width="1.4" stroke-linecap="round"/>
        <g transform="translate(6 -15)">
          <path d="M3,-8 Q6,-16 2,-18" fill="none" stroke="${OUT}" stroke-width="3.2" stroke-linecap="round"/><path d="M3,-8 Q6,-16 2,-18" fill="none" stroke="#3e6650" stroke-width="1.8" stroke-linecap="round"/>
          <circle r="9.5" fill="#28402f" stroke="${OUT}" stroke-width="1.2"/>
          <path d="M-5,-6 Q-1,-9 3,-8" fill="none" stroke="${hi}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
          ${eye(-1, 0, 3.4, '#3aa060', c)}${eye(5.5, -0.4, 3, '#3aa060', c)}
          ${blush(-5, 5, '#ff9ab0', 2)}
          ${c.breath > 0 || c.hurt ? mouthO(5, 5.6, 2.6, 2) : `<path d="M3,5 q2,1.6 4,0" stroke="${OUT}" stroke-width=".9" fill="none" stroke-linecap="round"/>`}
          <path d="M8,6 l3,1.6 M8.4,4 l3.4,-.4" stroke="${OUT}" stroke-width="1" stroke-linecap="round"/>
        </g>
      </g>
      ${on(m) && m > 0.25 && m < 0.9 ? `<g stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".8"><path d="M18,-14 h4 M19,-9 h5"/></g>` : ''}
      ${puff(c, 18, -12, '#9a7048', '#d8b890')}
    </g>`;
  }

  const NEW = { caramelo, pinscher, tatubola, formiga, rolabosta };
  const reg = () => { if (MS.Art && MS.Art.register) { for (const k in NEW) MS.Art.register(k, NEW[k]); return true; } return false; };
  if (!reg()) document.addEventListener('DOMContentLoaded', reg);
})();
