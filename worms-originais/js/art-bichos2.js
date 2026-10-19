// Segunda leva de bichos cabeçudos: Galinha, Barata, Baiacu, Camaleão e Pombo.
// Pés em y = 0, virados para +x. c: { f, blink, breath, bob, step, mania (0..1 ou null), hurt, puffed }
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const OUT = '#2a1f1a';
  const hump = (t, a = 0, b = 1) => (t === null || t === undefined || t < a || t > b) ? 0 : sin(PI * (t - a) / (b - a));
  const on = t => t !== null && t !== undefined;

  function eye(cx, cy, r, iris, c, look = 0.25, ry = 1.15, lookY = 0.1) {
    if (c.hurt) return `<path d="M${f1(cx - r * 0.65)},${f1(cy - r * 0.65)} L${f1(cx + r * 0.65)},${f1(cy + r * 0.65)} M${f1(cx + r * 0.65)},${f1(cy - r * 0.65)} L${f1(cx - r * 0.65)},${f1(cy + r * 0.65)}" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (c.blink) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.8)} ${f1(cx + r)},${f1(cy)}" fill="none" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r)}" ry="${f1(r * ry)}" fill="#fff" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * lookY)}" rx="${f1(r * 0.66)}" ry="${f1(r * 0.76 * ry)}" fill="${iris}"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * (lookY + 0.04))}" rx="${f1(r * 0.38)}" ry="${f1(r * 0.44 * ry)}" fill="#120c0a"/>
      <circle cx="${f1(cx + r * (look + 0.26))}" cy="${f1(cy + r * (lookY - 0.42))}" r="${f1(r * 0.28)}" fill="#fff"/>
      <circle cx="${f1(cx + r * (look - 0.18))}" cy="${f1(cy + r * (lookY + 0.28))}" r="${f1(r * 0.13)}" fill="#fff" opacity=".85"/>`;
  }
  const blush = (x, y, col = '#ff8aa0', r = 2.4) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.55)}" fill="${col}" opacity=".55"/>`;
  function puff(c, mx, my, col, hi) {
    if (!(c.breath > 0)) return '';
    const j = sin(c.f * 1.7) * 2;
    return `<g opacity=".9"><path d="M${mx},${my - 2} Q${mx + 11},${f1(my - 7 + j)} ${mx + 24},${my - 1} Q${mx + 12},${my + 4} ${mx},${my + 3} Z" fill="${col}"/>
      <path d="M${mx},${my} Q${mx + 9},${my - 2} ${mx + 18},${my - 1} Q${mx + 9},${my + 2} ${mx},${my + 2} Z" fill="${hi}"/></g>`;
  }
  const mouthO = (x, y, w, h = w * 0.8) => `<ellipse cx="${x}" cy="${y}" rx="${f1(w / 2)}" ry="${f1(h / 2)}" fill="#6a1a24" stroke="${OUT}" stroke-width=".8"/>`;
  const birdFoot = (x, st) => `<path d="M${f1(x)},-5 L${f1(x + st)},-1 M${f1(x + st - 2.4)},0 L${f1(x + st)},-1 L${f1(x + st + 2.6)},0" fill="none" stroke="#e08a1a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`;

  // ---------- Galinha: nervosa, crista enorme; mania: bica o chão sem parar e solta penas ----------
  function galinha(c) {
    const m = c.mania, peck = on(m) ? Math.max(0, sin(m * PI * 8)) : 0;
    const wing = c.breath > 0 ? sin(c.f * 1.2) * 25 : sin(c.f * 0.15) * 4;
    return `<g transform="translate(0 ${f1(c.bob)})">
      ${birdFoot(-3, c.step * 0.6)}${birdFoot(3, -c.step * 0.6)}
      <path d="M-11,-12 C-15,-16 -15,-21 -12,-24 C-11,-20 -9,-18 -7,-17 Z" fill="#fff" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
      <ellipse cx="-1" cy="-10" rx="9.5" ry="7.5" fill="#fbf8f0" stroke="${OUT}" stroke-width="1.1"/>
      <g transform="translate(-3 -11) rotate(${f1(-wing)})"><path d="M0,0 C-2,4 2,8 7,6 C5,4 4,1 3,-1 Z" fill="#ece6d8" stroke="${OUT}" stroke-width=".9"/></g>
      <g transform="translate(${f1(4 + peck * 4)} ${f1(-22 + peck * 9)}) rotate(${f1(peck * 35)})">
        <path d="M-4,-10 C-5,-15 -1,-16 0,-12 C0,-17 5,-17 5,-12 C6,-16 10,-14 8,-9 Z" fill="#e8322a" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <circle r="10" fill="#fff" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M8,-1 L15,1.5 L8,4 Z" fill="#ffb21a" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        ${c.breath > 0 || c.hurt ? `<path d="M8,1.6 L13.6,1.8" stroke="${OUT}" stroke-width=".8"/>` : ''}
        <path d="M8.5,4 C9,8 6,9 6,6 Z" fill="#e8322a" stroke="${OUT}" stroke-width=".8"/>
        ${eye(-1, -1, 3.6, '#c86010', c, 0.3)}${eye(5.5, -1.6, 3, '#c86010', c, 0.3)}
        ${blush(-5, 4.5)}
      </g>
      ${peck > 0.6 ? `<path d="M14,-4 q2,-3 4,-2 q-1,2 -4,2 Z M10,-8 q3,-2 4,0 q-2,1 -4,0 Z" fill="#fff" stroke="${OUT}" stroke-width=".6"/>` : ''}
      ${puff(c, 18, -21, '#fff6dc', '#ffffff')}
    </g>`;
  }

  // ---------- Barata: cabeçuda e cascuda, antenas compridas; mania: mexe as antenas e dá corridinhas ----------
  function barata(c) {
    const m = c.mania, dash = on(m) ? sin(m * PI * 6) * 4 : 0;
    const ant = sin(c.f * (on(m) ? 0.9 : 0.25)) * (on(m) ? 14 : 6);
    const wings = c.breath > 0 ? 1 : on(m) ? hump(m, 0.6, 1) : 0;
    const st = c.step * 0.6 + (on(m) ? sin(c.f * 2.4) : 0);
    const legs = [-7, -2, 3].map((x, i) => `<path d="M${x},-5 l${f1((i % 2 ? st : -st) - 1.6)},3 l${f1(0.6 + (i % 2 ? st : -st))},2" fill="none" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    return `<g transform="translate(${f1(dash)} ${f1(c.bob)})">
      ${legs}
      <ellipse cx="-4" cy="-8" rx="10" ry="5.6" fill="#7a3e1c" stroke="${OUT}" stroke-width="1.1"/>
      <path d="M-13,-8 Q-4,-11 5,-8" fill="none" stroke="#a8622e" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
      ${wings > 0.05 ? `<g opacity=".85"><path d="M-2,-11 C-10,${f1(-14 - wings * 8)} -18,${f1(-12 - wings * 6)} -16,-8 C-12,-8 -6,-9 -2,-11 Z" fill="#c8a07a" fill-opacity=".7" stroke="${OUT}" stroke-width=".8"/></g>` : ''}
      <g transform="translate(6 -16)">
        <path d="M2,-9 Q${f1(6 + ant * 0.2)},-22 ${f1(14 + ant * 0.4)},${f1(-24 + ant * 0.3)} M-2,-9 Q${f1(-1 - ant * 0.2)},-22 ${f1(4 - ant * 0.4)},${f1(-26 - ant * 0.3)}" fill="none" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>
        <circle r="9.5" fill="#8a4a24" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-6,-6 Q-1,-9 4,-7" fill="none" stroke="#c07a44" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
        ${eye(-1, 0, 3.4, '#3a1a08', c, 0.3)}${eye(5.5, -0.5, 3, '#3a1a08', c, 0.3)}
        ${c.breath > 0 || c.hurt ? mouthO(5.5, 5.6, 2.6, 2) : `<path d="M3.4,5 q2,1.2 4,-.2" stroke="${OUT}" stroke-width=".9" fill="none" stroke-linecap="round"/>`}
        <path d="M8,5.5 l3,1.6 M8.4,3.6 l3.2,-.6" stroke="${OUT}" stroke-width=".9" stroke-linecap="round"/>
      </g>
      ${puff(c, 17, -12, '#c8a07a', '#f0dcc0')}
    </g>`;
  }

  // ---------- Baiacu: peixinho redondo que anda nas nadadeiras; infla e vira bola de espinhos; mania: soluço que infla sozinho ----------
  function baiacu(c) {
    const m = c.mania, k = c.puffed ? 1 : hump(m, 0.2, 0.8);
    const R = 11 + k * 5;
    let spikes = '';
    if (k > 0.15) for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2, x1 = cos(a) * (R - 1), y1 = sin(a) * (R - 1), x2 = cos(a) * (R + 3.5 * k), y2 = sin(a) * (R + 3.5 * k); spikes += `M${f1(x1 - sin(a) * 1.2)},${f1(y1 + cos(a) * 1.2)} L${f1(x2)},${f1(y2)} L${f1(x1 + sin(a) * 1.2)},${f1(y1 - cos(a) * 1.2)} Z `; }
    const hop = c.step ? Math.abs(sin(c.step)) * 2 : 0;
    return `<g transform="translate(0 ${f1(c.bob - hop)})">
      <path d="M-3,-1 l-4,1 l2,-4 Z M3,-1 l4,1 l-2,-4 Z" fill="#e8a83a" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>
      <g transform="translate(0 ${f1(-R - 1)})">
        <path d="M${f1(-R + 1)},0 L${f1(-R - 6)},-6 L${f1(-R - 5)},6 Z" fill="#e8a83a" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        ${spikes ? `<path d="${spikes}" fill="#f6e6b0" stroke="${OUT}" stroke-width=".7" stroke-linejoin="round"/>` : ''}
        <circle r="${f1(R)}" fill="#f2c45a" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M${f1(-R * 0.8)},${f1(R * 0.3)} Q0,${f1(R * 1.05)} ${f1(R * 0.8)},${f1(R * 0.3)} Q0,${f1(R * 0.6)} ${f1(-R * 0.8)},${f1(R * 0.3)} Z" fill="#fff4d0"/>
        <circle cx="${f1(-R * 0.45)}" cy="${f1(-R * 0.55)}" r="1.4" fill="#b8822a"/><circle cx="${f1(-R * 0.1)}" cy="${f1(-R * 0.75)}" r="1.1" fill="#b8822a"/><circle cx="${f1(-R * 0.7)}" cy="${f1(-R * 0.15)}" r="1.2" fill="#b8822a"/>
        <path d="M${f1(-R * 0.2)},${f1(R * 0.15)} q-3,3 -1,6" fill="#e8a83a" stroke="${OUT}" stroke-width=".8"/>
        ${eye(R * 0.15, -R * 0.2, 3.6 + k * 0.6, '#2a6ab0', c, 0.3)}${eye(R * 0.15 + 7, -R * 0.25, 3.2 + k * 0.5, '#2a6ab0', c, 0.3)}
        ${k > 0.5 ? `${blush(R * 0.1, R * 0.25, '#ff6a6a', 2.4)}${blush(R * 0.1 + 9, R * 0.2, '#ff6a6a', 2)}` : blush(R * 0.05, R * 0.25)}
        ${c.breath > 0 || c.hurt || k > 0.5 ? mouthO(R * 0.55 + 4, R * 0.25, 2.8, 2.6) : `<ellipse cx="${f1(R * 0.55 + 4)}" cy="${f1(R * 0.25)}" rx="1.4" ry="1.2" fill="#6a1a24"/>`}
      </g>
      ${puff(c, R + 6, -R - 1, '#bfe9ff', '#ffffff')}
    </g>`;
  }

  // ---------- Camaleão: olhos que giram cada um para um lado, cauda em espiral; mania: muda de cor ----------
  const CAM_COLORS = [['#5cbf4a', '#3a8a2e', '#a8e07a'], ['#f0a03a', '#b86a1a', '#ffd08a'], ['#a86ad8', '#6a3a9a', '#d8b0ff'], ['#4ab8d8', '#2a7a9a', '#a8e8ff']];
  function camaleao(c) {
    const m = c.mania;
    const ci = on(m) ? Math.min(3, Math.floor(m * 4)) : 0, [body, dark, light] = CAM_COLORS[ci];
    const eyeA = sin(c.f * 0.13) * 0.45, eyeB = cos(c.f * 0.09 + 1) * 0.45;
    const tl = c.breath > 0 ? 1 : 0;
    return `<g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-7 C-16,-6 -18,-14 -13,-16 C-9,-17 -8,-13 -11,-12 C-13,-11 -14,-13 -12.5,-13.5" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
      <path d="M-8,-7 C-16,-6 -18,-14 -13,-16 C-9,-17 -8,-13 -11,-12 C-13,-11 -14,-13 -12.5,-13.5" fill="none" stroke="${body}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M-6,-4 l-2,4 M-1,-4 l1,4 M4,-4 l-1,4" stroke="${OUT}" stroke-width="2.6" stroke-linecap="round"/><path d="M-6,-4 l-2,4 M-1,-4 l1,4 M4,-4 l-1,4" stroke="${dark}" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="-1" cy="-8" rx="8" ry="5" fill="${body}" stroke="${OUT}" stroke-width="1.1"/>
      <path d="M-7,-12 l2,-2 l2,2 l2,-2 l2,2 l2,-2 l2,2" fill="none" stroke="${dark}" stroke-width="1.1" stroke-linejoin="round"/>
      <g transform="translate(6 -18)">
        <path d="M-9,-3 C-9,-10 -3,-14 3,-14 C1,-11 1,-8 3,-6 Z" fill="${dark}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-9,0 C-9,-8 -2,-11 4,-10 C9,-9 13,-4 13,2 C13,7 6,9 -1,8 C-6,8 -9,5 -9,0 Z" fill="${body}" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-4,-6 Q1,-9 6,-7" fill="none" stroke="${light}" stroke-width="1.8" stroke-linecap="round"/>
        <g><circle cx="0" cy="-1" r="5.4" fill="${body}" stroke="${OUT}" stroke-width="1.1"/>${c.hurt ? eye(0, -1, 3.2, '#f0c020', c) : c.blink ? `<path d="M-3,-1 h6" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>` : `<circle cx="${f1(cos(eyeA) * 2.2)}" cy="${f1(-1 + sin(eyeA) * 2.2)}" r="2.2" fill="#fff" stroke="${OUT}" stroke-width=".7"/><circle cx="${f1(cos(eyeA) * 2.6)}" cy="${f1(-1 + sin(eyeA) * 2.6)}" r="1.1" fill="#120c0a"/>`}</g>
        <g><circle cx="7" cy="-2" r="4.6" fill="${body}" stroke="${OUT}" stroke-width="1.1"/>${c.hurt ? eye(7, -2, 2.8, '#f0c020', c) : c.blink ? `<path d="M4.6,-2 h5" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>` : `<circle cx="${f1(7 + cos(eyeB) * 1.8)}" cy="${f1(-2 + sin(eyeB) * 1.8)}" r="1.9" fill="#fff" stroke="${OUT}" stroke-width=".7"/><circle cx="${f1(7 + cos(eyeB) * 2.2)}" cy="${f1(-2 + sin(eyeB) * 2.2)}" r=".95" fill="#120c0a"/>`}</g>
        ${blush(-4, 5, '#ff9ab0', 2)}
        <path d="M5,6 Q9,7.6 13,4" fill="none" stroke="${OUT}" stroke-width="1" stroke-linecap="round"/>
        ${tl ? `<path d="M13,4 Q20,2 27,3" stroke="#ff6a8a" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="27" cy="3" r="2.6" fill="#ff6a8a" stroke="${OUT}" stroke-width=".7"/>` : ''}
      </g>
    </g>`;
  }

  // ---------- Pombo: estufado, pescoço furta-cor, olho laranja; mania: anda balançando a cabeça e estufa o peito ----------
  function pombo(c) {
    const m = c.mania, bob = on(m) ? sin(m * PI * 8) * 3 : sin(c.f * 0.1) * 0.6;
    const strut = on(m) ? hump(m) * 5 : 0, chest = on(m) ? 1 + hump(m, 0.3, 0.9) * 0.18 : 1;
    return `<g transform="translate(${f1(strut)} ${f1(c.bob)})">
      ${birdFoot(-3, c.step * 0.6 + (on(m) ? sin(m * PI * 8) * 1.5 : 0)).replace(/#e08a1a/g, '#e86a6a')}${birdFoot(3, -c.step * 0.6 - (on(m) ? sin(m * PI * 8) * 1.5 : 0)).replace(/#e08a1a/g, '#e86a6a')}
      <path d="M-10,-9 L-17,-11 L-15,-6 Z" fill="#6a7486" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/>
      <g transform="translate(0 -9) scale(${f1(chest)})"><ellipse cx="-1" cy="0" rx="9.5" ry="6.6" fill="#9aa4b6" stroke="${OUT}" stroke-width="1.1"/>
        <path d="M-7,-2 C-4,2 2,2 5,-1" fill="none" stroke="#6a7486" stroke-width="1.1"/><path d="M-6,1 C-3,4 1,4 4,2" fill="none" stroke="#6a7486" stroke-width="1.1"/></g>
      <g transform="translate(${f1(5 + bob)} -20)">
        <path d="M-7,10.5 Q0,15.5 7,9.5 L5,4 L-6,5 Z" fill="#5aa88a" stroke="${OUT}" stroke-width=".9"/>
        <path d="M-5,12 Q0,14 5,11" stroke="#9a6ad0" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>
        <circle r="9.5" fill="#a8b2c4" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-5,-6 Q-1,-9 4,-7" fill="none" stroke="#d0d8e6" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M8,-1 L13,1 L8,3 Z" fill="#3a3a44" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>
        <ellipse cx="8.6" cy="-1.4" rx="1.6" ry="1" fill="#f0f0f0" stroke="${OUT}" stroke-width=".5"/>
        ${eye(-1, -1, 3.3, '#f07a1a', c, 0.3)}${eye(5, -1.4, 2.8, '#f07a1a', c, 0.3)}
        ${blush(-5, 4, '#ffa0b0', 2)}
        ${c.breath > 0 || c.hurt ? mouthO(10, 2.6, 2.2, 1.8) : ''}
      </g>
      ${puff(c, 18, -19, '#e8eef6', '#ffffff')}
    </g>`;
  }

  // ---------- Abelha rainha: cabeção, coroa dourada, asinhas; as 3 abelhinhas que voam em volta são desenhadas pelo jogo ----------
  // mania: a dança do oito (é assim que as abelhas mostram para as outras onde tem flor)
  function abelha(c) {
    const m = c.mania, dx = on(m) ? sin(m * PI * 4) * 5 : 0, dy = on(m) ? sin(m * PI * 8) * 2 : 0, wig = on(m) ? sin(c.f * 1.6) * 8 : 0;
    const wing = sin(c.f * 1.4) * 18;
    return `<g transform="translate(${f1(dx)} ${f1(c.bob + dy - 4)})">
      <path d="M-14,-9 L-18,-8 L-14,-6.4 Z" fill="#3a2a1a" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>
      <g transform="rotate(${f1(wig)} -3 -9)">
        <ellipse cx="-5" cy="-9" rx="9.5" ry="7" fill="#f6c428" stroke="${OUT}" stroke-width="1.1"/>
        <path d="M-9,-15.6 Q-10.5,-9 -9,-2.6 L-6,-2.2 Q-7.4,-9 -6,-15.9 Z M-3,-16 Q-4.2,-9 -3,-2 L0,-2.4 Q-1.2,-9 0,-15.6 Z" fill="#2a2018"/>
      </g>
      <g transform="translate(-4 -17) rotate(${f1(-20 - wing)})"><ellipse cx="-4" cy="-6" rx="5.5" ry="8" fill="#e8f6ff" fill-opacity=".85" stroke="${OUT}" stroke-width=".9"/></g>
      <g transform="translate(0 -17) rotate(${f1(10 + wing)})"><ellipse cx="2" cy="-7" rx="5" ry="7.5" fill="#e8f6ff" fill-opacity=".85" stroke="${OUT}" stroke-width=".9"/></g>
      <path d="M-4,-3 l-1,4 M1,-3 l1,4" stroke="${OUT}" stroke-width="1.6" stroke-linecap="round"/>
      <g transform="translate(7 -19)">
        <path d="M-2,-10 Q-6,-17 -9,-17 M3,-10 Q5,-17 9,-18" fill="none" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="-9" cy="-17" r="1.4" fill="${OUT}"/><circle cx="9" cy="-18" r="1.4" fill="${OUT}"/>
        <circle r="10" fill="#ffd84a" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-5,-6 Q-1,-9 4,-7" fill="none" stroke="#fff2a0" stroke-width="1.8" stroke-linecap="round"/>
        <g transform="translate(-1 -9.5)">
          <path d="M-6,0 L-7,-7 L-3.4,-3.4 L0,-8.4 L3.4,-3.4 L7,-7 L6,0 Z" fill="#ffc21a" stroke="#8a5a00" stroke-width=".9" stroke-linejoin="round"/>
          <circle cx="0" cy="-8.4" r="1.2" fill="#ff4a6a"/><circle cx="-7" cy="-7" r=".9" fill="#4ac8ff"/><circle cx="7" cy="-7" r=".9" fill="#4ac8ff"/>
          <path d="M-5.6,-1.4 H5.6" stroke="#fff3a0" stroke-width=".8"/>
        </g>
        ${eye(-1.5, 0, 3.6, '#5a3a10', c, 0.3)}${eye(5.5, -0.4, 3.2, '#5a3a10', c, 0.3)}
        ${blush(-5.5, 5, '#ff9a8a')}
        ${c.breath > 0 || c.hurt ? mouthO(5.5, 6, 2.6, 2) : `<path d="M3,5.2 q2.2,1.8 4.4,0" stroke="${OUT}" stroke-width=".9" fill="none" stroke-linecap="round"/>`}
      </g>
      ${puff(c, 18, -18, '#ffd84a', '#fff8d0')}
    </g>`;
  }
  // abelhinha da escolta (desenhada pelo jogo voando em volta da rainha e como projétil)
  MS.BEE_MINI = `<ellipse cx="0" cy="0" rx="3.6" ry="2.8" fill="#f6c428" stroke="#2a1f1a" stroke-width=".8"/><path d="M-1.4,-2.6 V2.6 M1,-2.7 V2.7" stroke="#2a2018" stroke-width="1.1"/><ellipse cx="-.6" cy="-3.6" rx="2" ry="2.6" fill="#e8f6ff" fill-opacity=".85" stroke="#2a1f1a" stroke-width=".6"/><circle cx="3.2" cy="-.6" r="1.4" fill="#ffd84a" stroke="#2a1f1a" stroke-width=".6"/><circle cx="3.6" cy="-.9" r=".55" fill="#1a1008"/>`;

  const NEW = { galinha, barata, baiacu, camaleao, pombo, abelha };
  const reg = () => { if (MS.Art && MS.Art.register) { for (const k in NEW) MS.Art.register(k, NEW[k]); return true; } return false; };
  if (!reg()) document.addEventListener('DOMContentLoaded', reg);
})();
