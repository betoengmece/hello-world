// Monstrinhos originais: Brasito, Gotalho, Musguinho, Faiscolino, Pedrugo e Ventolina.
// Mesmo padrão da arte do jogo: pés em y = 0, virado para +x. Contexto c: { f, blink, breath, bob, step, charge, flap, mania, hurt }
//  - c.mania: progresso (0..1) da "mania" de cada um quando está parado; null/undefined = sem mania agora
//  - c.hurt: levou dano (olhos em X)
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const sin = Math.sin, PI = Math.PI;
  const OUT = '#2b2233';

  // olho grande e brilhante; fecha ao piscar; vira X quando apanha
  function eye(cx, cy, r, iris, c, look = 0.3) {
    if (c.hurt) return `<path d="M${f1(cx - r * 0.7)},${f1(cy - r * 0.7)} L${f1(cx + r * 0.7)},${f1(cy + r * 0.7)} M${f1(cx + r * 0.7)},${f1(cy - r * 0.7)} L${f1(cx - r * 0.7)},${f1(cy + r * 0.7)}" stroke="${OUT}" stroke-width="1.4" stroke-linecap="round"/>`;
    if (c.blink) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.8)} ${f1(cx + r)},${f1(cy)}" fill="none" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r)}" ry="${f1(r * 1.12)}" fill="#fff" stroke="${OUT}" stroke-width=".9"/>
      <ellipse cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.08)}" rx="${f1(r * 0.62)}" ry="${f1(r * 0.72)}" fill="${iris}"/>
      <circle cx="${f1(cx + r * look)}" cy="${f1(cy + r * 0.12)}" r="${f1(r * 0.32)}" fill="#1a1426"/>
      <circle cx="${f1(cx + r * (look + 0.22))}" cy="${f1(cy - r * 0.3)}" r="${f1(r * 0.24)}" fill="#fff"/>
      <circle cx="${f1(cx + r * (look - 0.2))}" cy="${f1(cy + r * 0.32)}" r="${f1(r * 0.11)}" fill="#fff" opacity=".8"/>`;
  }
  const stubs = (step, fill, dx = 4.5, rx = 3.6) => `<ellipse cx="${f1(-dx + step)}" cy="-1.8" rx="${rx}" ry="2.4" fill="${fill}" stroke="${OUT}" stroke-width="1"/>
    <ellipse cx="${f1(dx - step)}" cy="-1.8" rx="${rx}" ry="2.4" fill="${fill}" stroke="${OUT}" stroke-width="1"/>`;
  const blush = (x, y, col = '#ff7aa0') => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.2" fill="${col}" opacity=".55"/>`;
  // sopro do ataque (todos usam a mesma ideia, com as cores de cada um)
  function puff(c, mx, my, col, hi) {
    if (!(c.breath > 0)) return '';
    const j = sin(c.f * 1.7) * 2;
    return `<g opacity=".9"><path d="M${mx},${my - 2} Q${mx + 11},${f1(my - 7 + j)} ${mx + 24},${my - 1} Q${mx + 12},${my + 4} ${mx},${my + 3} Z" fill="${col}"/>
      <path d="M${mx},${my} Q${mx + 9},${my - 2} ${mx + 18},${my - 1} Q${mx + 9},${my + 2} ${mx},${my + 2} Z" fill="${hi}"/></g>`;
  }
  const mouthOpen = (x, y, w, c) => c.breath > 0 || c.hurt
    ? `<ellipse cx="${x}" cy="${y}" rx="${f1(w * 0.45)}" ry="${f1(w * 0.38)}" fill="#5a1a2a" stroke="${OUT}" stroke-width=".8"/>`
    : `<path d="M${f1(x - w / 2)},${y} Q${x},${f1(y + w * 0.55)} ${f1(x + w / 2)},${y}" fill="#5a1a2a" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>`;
  // curva 0..1 → sobe e desce (para as manias)
  const hump = (t, a = 0, b = 1) => (t === null || t === undefined || t < a || t > b) ? 0 : sin(PI * (t - a) / (b - a));

  // ---------- Brasito (fogo): brasa redonda com topete de chama; mania: tenta assoprar o próprio topete ----------
  function brasito(c) {
    const m = c.mania, blow = hump(m, 0.15, 0.85);
    const angry = c.breath > 0 || c.charge ? 1.35 : 1;
    const fl = (1 + 0.12 * sin(c.f * 0.45)) * angry * (1 - blow * 0.65);
    return stubs(c.step, '#7a2a1c') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <g transform="translate(-1 -24) scale(${f1(fl)} ${f1(fl)})">
        <path d="M0,2 C-9,0 -9,-9 -4,-16 C-3,-10 0,-12 -1,-19 C4,-14 9,-10 7,-3 C9,-6 10,-4 9,-1 C8,2 4,3 0,2 Z" fill="#ff7a1a" stroke="#a83a10" stroke-width=".8" stroke-linejoin="round"/>
        <path d="M0,1 C-5,0 -5,-6 -2,-10 C-1,-6 2,-8 1,-12 C5,-8 6,-4 4,0 Z" fill="#ffc23a"/>
        <path d="M0,0 C-2,-1 -2,-3 0,-5 C1,-3 2,-2 1,0 Z" fill="#fff6c8"/>
      </g>
      <ellipse cx="0" cy="-12.5" rx="12" ry="11" fill="#b8402c" stroke="${OUT}" stroke-width="1.2"/>
      <path d="M-8,-17 Q-11,-12 -9,-6" fill="none" stroke="#ff9a3c" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
      <path d="M-4,-4 l2,-3 l1,2 l2,-2" fill="none" stroke="#ff9a3c" stroke-width="1" stroke-linecap="round" opacity=".8"/>
      <path d="M8.5,-21 l2.2,1.2 l-.6,2.2 Z" fill="#7a2a1c"/>
      <ellipse cx="2.5" cy="-8.5" rx="6.5" ry="5" fill="#e0684a" opacity=".55"/>
      ${eye(1, -15, 3.4, '#ff9a1a', c)}${eye(8, -15.5, 3, '#ff9a1a', c)}
      ${blush(-2.5, -9.5)}${blush(10.5, -10)}
      ${blow > 0.05 ? `<ellipse cx="6.5" cy="-8.5" rx="1.6" ry="1.9" fill="#5a1a2a" stroke="${OUT}" stroke-width=".7"/>
        <g opacity="${f1(blow)}" stroke="#fff" stroke-width=".9" stroke-linecap="round" fill="none"><path d="M5,-12 q-2,-6 -3,-11"/><path d="M7,-12 q1,-6 -1,-12"/></g>`
        : `${mouthOpen(5.5, -9, 5, c)}<path d="M6.8,-9 l.8,1.6 l.8,-1.6 Z" fill="#fff"/>`}
      ${puff(c, 12, -9, '#ff7a1a', '#ffe08a')}
    </g>`;
  }

  // ---------- Gotalho (água): gota gorducha com concha-regador; mania: rega uma plantinha ----------
  function gotalho(c) {
    const m = c.mania, tip = hump(m, 0.1, 0.9);
    const wob = 1 + 0.03 * sin(c.f * 0.12);
    let drops = '';
    if (tip > 0.3) for (let i = 0; i < 3; i++) { const k = ((c.f * 0.08 + i / 3) % 1); drops += `<ellipse cx="${f1(15 + k * 2)}" cy="${f1(-20 + k * 16)}" rx="1" ry="1.5" fill="#8fdcff" opacity="${f1(1 - k * 0.6)}"/>`; }
    return stubs(c.step, '#3a8ad0', 4.5, 3.3) + `
    <g transform="translate(0 ${f1(c.bob)})">
      ${tip > 0.05 ? `<g transform="translate(17 0)"><path d="M0,0 Q-1,-4 0,-7" stroke="#3a8a3a" stroke-width="1.2" fill="none"/><path d="M0,-6 Q-4,-9 -5,-6 Q-2,-5 0,-6 Z M0,-5 Q4,-8 5,-5 Q2,-4 0,-5 Z" fill="#5cbf4a"/></g>` : ''}
      <g transform="translate(-9 -14) rotate(${f1(-tip * 35)})">
        <circle r="8.5" fill="#f2a65a" stroke="${OUT}" stroke-width="1.1"/>
        <path d="M0,0 m-5,0 a5,5 0 1,1 5,5 a3.2,3.2 0 1,1 -3.2,-3.2 a1.6,1.6 0 1,1 1.6,1.6" fill="none" stroke="#b8642a" stroke-width="1.1"/>
        <path d="M5,-6 L12,-11 L13,-9 L7,-4 Z" fill="#e48a3a" stroke="${OUT}" stroke-width=".9" stroke-linejoin="round"/>
        <circle cx="12.6" cy="-10.2" r="1.6" fill="#c9702c" stroke="${OUT}" stroke-width=".7"/>
      </g>
      ${drops}
      <g transform="translate(0 -1) scale(1 ${f1(wob)}) translate(0 1)">
        <path d="M2,-33 C6,-25 14,-18 14,-11 C14,-4 8,0 2,0 C-5,0 -10,-4 -10,-11 C-10,-18 -2,-25 2,-33 Z" fill="#5ab8f0" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-5,-15 C-6,-20 -3,-25 0,-28" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
        <ellipse cx="3" cy="-6" rx="7" ry="4" fill="#9fe0ff" opacity=".5"/>
      </g>
      ${eye(1.5, -14, 3.3, '#2a6ad0', c)}${eye(8.5, -14, 3.1, '#2a6ad0', c)}
      ${blush(-1.5, -9)}${blush(11.5, -9.5)}
      ${mouthOpen(6, -8.5, 5, c)}
      ${puff(c, 13, -9, '#5ab8f0', '#e6f8ff')}
    </g>`;
  }

  // ---------- Musguinho (planta): tronquinho com chapéu de cogumelo grande demais; mania: arruma o chapéu ----------
  function musguinho(c) {
    const m = c.mania, slip = hump(m, 0, 0.55), push = hump(m, 0.45, 1);
    const capY = -27 + slip * 6 - push * 2, sway = sin(c.f * 0.07) * 2;
    const armL = push > 0.1 ? -60 * push : 10 + sin(c.f * 0.1) * 6;
    return stubs(c.step, '#6a4428', 3.8, 3.2) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-7,-2 C-8,-10 -8,-18 -6,-24 L7,-24 C9,-18 9,-10 8,-2 Z" fill="#9a6a3e" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-4,-6 q1,-6 0,-12 M3,-4 q-1,-5 0,-9 M5,-14 q1,-3 0,-6" fill="none" stroke="#6a4428" stroke-width=".9" stroke-linecap="round"/>
      <path d="M-6,-5 q-3,-1 -4,1 q2,1 4,0 Z" fill="#6ac04a" stroke="#2f6a2a" stroke-width=".6"/>
      <g transform="translate(7 -15) rotate(${f1(armL)})"><path d="M0,0 L6,0" stroke="#6a4428" stroke-width="2" stroke-linecap="round"/><path d="M6,0 q3,-3 5,-1 q-2,3 -5,1 Z" fill="#6ac04a" stroke="#2f6a2a" stroke-width=".6"/></g>
      <g transform="translate(-7 -14) rotate(${f1(160 - sin(c.f * 0.1) * 6)})"><path d="M0,0 L5,0" stroke="#6a4428" stroke-width="2" stroke-linecap="round"/><path d="M5,0 q3,-3 5,-1 q-2,3 -5,1 Z" fill="#5aae3e" stroke="#2f6a2a" stroke-width=".6"/></g>
      ${eye(-1, -18.5 + slip * 1.2, 2.8, '#6a3a1a', { ...c, blink: c.blink || slip > 0.7 })}${eye(5, -18.5 + slip * 1.2, 2.6, '#6a3a1a', { ...c, blink: c.blink || slip > 0.7 })}
      ${blush(-3.5, -14.5, '#ff9a7a')}${blush(7.5, -14.5, '#ff9a7a')}
      ${mouthOpen(2.5, -12.5, 4, c)}
      <g transform="translate(${f1(sway * 0.3)} ${f1(capY)}) rotate(${f1(sway - slip * 8)})">
        <path d="M-15,4 C-15,-8 -6,-13 1,-13 C9,-13 17,-8 17,4 C10,6 -8,6 -15,4 Z" fill="#4fae6a" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-15,4 C-8,7 10,7 17,4 C12,9 -10,9 -15,4 Z" fill="#e8dcb0" stroke="${OUT}" stroke-width=".9"/>
        <circle cx="-7" cy="-4" r="2.4" fill="#d8f0b0"/><circle cx="4" cy="-8" r="2" fill="#d8f0b0"/><circle cx="10" cy="-1" r="2.6" fill="#d8f0b0"/><circle cx="-1" cy="0" r="1.4" fill="#d8f0b0"/>
        <path d="M13,-6 q3,-1 4,2" fill="none" stroke="#2f6a2a" stroke-width=".8"/>
      </g>
      ${puff(c, 9, -12, '#8adf5a', '#f0ffd0')}
    </g>`;
  }

  // ---------- Faiscolino (elétrico): bolinha de pelo com orelhas de tomada e cauda-lâmpada; mania: a lâmpada falha e ele dá tapinhas ----------
  function faiscolino(c) {
    const m = c.mania, off = m !== null && m !== undefined && m > 0.15 && m < 0.75 && (Math.floor(m * 40) % 3 !== 0);
    const tap = hump(m, 0.35, 0.8);
    const glow = off ? 0 : 0.55 + 0.25 * sin(c.f * 0.3) + (c.breath > 0 ? 0.3 : 0);
    const tw = sin(c.f * 0.09) * 6;
    return stubs(c.step, '#4a3e78') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-10 C-16,-12 -20,-20 -16,-27 C-14,-31 -12,-31 -11,-30" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round" transform="rotate(${f1(tw)} -8 -10)"/>
      <path d="M-8,-10 C-16,-12 -20,-20 -16,-27 C-14,-31 -12,-31 -11,-30" fill="none" stroke="#3a3a4a" stroke-width="1.8" stroke-linecap="round" transform="rotate(${f1(tw)} -8 -10)"/>
      <g transform="rotate(${f1(tw)} -8 -10) translate(-10 -33)">
        <circle r="${f1(9 * glow + 1)}" fill="#fff27a" opacity="${f1(glow * 0.35)}"/>
        <path d="M-3.5,2 C-6,-1 -6,-6 0,-7 C6,-6 6,-1 3.5,2 Z" fill="${off ? '#c8c8b0' : '#fff6a0'}" stroke="${OUT}" stroke-width=".9"/>
        <path d="M-1.5,1 L-1,-3 L0,-1 L1,-3 L1.5,1" fill="none" stroke="${off ? '#7a7a6a' : '#ff9a1a'}" stroke-width=".7"/>
        <rect x="-3" y="2" width="6" height="3" rx="1" fill="#9aa0b0" stroke="${OUT}" stroke-width=".7"/>
      </g>
      <ellipse cx="0" cy="-12" rx="11" ry="10.5" fill="#6a5aa8" stroke="${OUT}" stroke-width="1.2"/>
      <ellipse cx="2.5" cy="-8" rx="6.5" ry="5.5" fill="#bfb4f0"/>
      <g transform="translate(-4 -21) rotate(-18)"><rect x="-3" y="-7" width="6" height="7" rx="1.6" fill="#6a5aa8" stroke="${OUT}" stroke-width="1"/><path d="M-1.4,-7 v-3 M1.4,-7 v-3" stroke="#d8d8e0" stroke-width="1.2" stroke-linecap="round"/></g>
      <g transform="translate(6 -21.5) rotate(14)"><rect x="-3" y="-7" width="6" height="7" rx="1.6" fill="#6a5aa8" stroke="${OUT}" stroke-width="1"/><path d="M-1.4,-7 v-3 M1.4,-7 v-3" stroke="#d8d8e0" stroke-width="1.2" stroke-linecap="round"/></g>
      ${eye(0.5, -14, 3.4, '#f0c020', c)}${eye(7.5, -14, 3.1, '#f0c020', c)}
      ${blush(-2.5, -9.5, '#ffd34d')}${blush(10.5, -9.5, '#ffd34d')}
      ${mouthOpen(5, -8.5, 4.4, c)}
      ${tap > 0.05 ? `<g transform="translate(-8 -13) rotate(${f1(-120 - tap * 30)})"><path d="M0,0 L7,0" stroke="#6a5aa8" stroke-width="3" stroke-linecap="round"/><path d="M0,0 L7,0" stroke="#bfb4f0" stroke-width="1.4" stroke-linecap="round"/></g>` : ''}
      ${!off && c.breath > 0 ? `<path d="M10,-20 l3,-3 l-1,3 l3,-2" fill="none" stroke="#fff27a" stroke-width="1" stroke-linecap="round"/>` : ''}
      ${puff(c, 12, -9, '#fff27a', '#ffffff')}
    </g>`;
  }

  // ---------- Pedrugo (pedra): tatu de pedra com cristal torto na testa; mania: vira bola, rola um pouco e volta ----------
  function pedrugo(c) {
    const m = c.mania, curl = hump(m, 0, 1);
    const rollX = m !== null && m !== undefined ? sin(m * PI * 2) * 6 : 0;
    if (curl > 0.55) {                                          // enrolado como uma bola
      const r = (c.f * 9) % 360;
      return `<g transform="translate(${f1(rollX)} 0)"><g transform="translate(0 -10) rotate(${f1(r)})">
        <circle r="10" fill="#a89a86" stroke="${OUT}" stroke-width="1.2"/>
        <path d="M-9.6,-3 Q0,-6 9.6,-3 M-9.6,3 Q0,0 9.6,3 M-7,-7.5 Q0,-10 7,-7.5 M-7,7.5 Q0,5 7,7.5" fill="none" stroke="#5e5242" stroke-width="1.2" stroke-linecap="round"/>
        <circle cx="-4" cy="0" r="1" fill="#5e5242"/><circle cx="4" cy="-5" r=".8" fill="#5e5242"/>
        <path d="M2,-10 L4,-14 L6,-10 Z" fill="#b57cff" stroke="#5a2a9a" stroke-width=".7"/></g>
        <path d="M-6,-1 q-2,-2 -4,0 M8,-1 q2,-2 4,0" stroke="#fff" stroke-width=".8" fill="none" opacity="${f1(Math.abs(rollX) / 6)}"/></g>`;
    }
    return stubs(c.step, '#8a7e6c', 6, 3.4) + `
    <g transform="translate(${f1(rollX * curl)} ${f1(c.bob)})">
      <path d="M-13,-4 C-14,-14 -6,-21 3,-20 C10,-19 13,-13 12,-4 Z" fill="#a89a86" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-11,-10 C-6,-12 4,-12 11,-10 M-12,-6 C-6,-8 4,-8 12,-6 M-7,-16 C-2,-17 4,-17 8,-15" fill="none" stroke="#6e6252" stroke-width="1.1" stroke-linecap="round"/>
      <circle cx="-6" cy="-14" r="1" fill="#6e6252"/><circle cx="4" cy="-18" r=".8" fill="#6e6252"/>
      <path d="M-13,-5 Q-17,-4 -18,-1 Q-15,-1 -12,-3 Z" fill="#a89a86" stroke="${OUT}" stroke-width="1"/>
      <g transform="translate(9 -9)">
        <ellipse cx="3" cy="0" rx="7" ry="6" fill="#c8b8a0" stroke="${OUT}" stroke-width="1.1"/>
        <ellipse cx="9" cy="1.5" rx="2.4" ry="1.8" fill="#8a6a5a" stroke="${OUT}" stroke-width=".8"/>
        <path d="M1,-5 L3.5,-12 L6,-6.5 Z" fill="#b57cff" stroke="#5a2a9a" stroke-width=".8" stroke-linejoin="round" transform="rotate(14 3.5 -6)"/>
        <path d="M3,-7 L3.6,-10.5" stroke="#efdcff" stroke-width=".7" transform="rotate(14 3.5 -6)"/>
        ${eye(4, -1.2, 2.3, '#3a2a1a', { ...c, blink: c.blink || (m === null || m === undefined ? sin(c.f * 0.02) > 0.92 : false) }, 0.35)}
        ${c.breath > 0 || c.hurt ? `<ellipse cx="7" cy="4" rx="1.4" ry="1.1" fill="#5a1a2a"/>` : `<path d="M5.5,3.8 q1.5,1 3,0" fill="none" stroke="${OUT}" stroke-width=".8" stroke-linecap="round"/>`}
      </g>
      ${puff(c, 19, -8, '#c8b8a0', '#fff3dc')}
    </g>`;
  }

  // ---------- Ventolina (ar): corujinha de nuvem com óculos de aviador; mania: bate as asas contra o vento e vai para trás ----------
  function ventolina(c) {
    const m = c.mania, push = hump(m, 0, 1);
    const back = -push * 6, flapA = (c.flap || push > 0.05 || c.breath > 0) ? sin(c.f * (push > 0.05 ? 0.9 : 0.5)) * 30 : 6;
    const puffs = [[-9, -16, 7], [9, -16, 7], [0, -9, 10], [-6, -24, 7], [6, -24, 7], [0, -27, 6]];
    return `<g transform="translate(${f1(back)} 0)">` + stubs(c.step, '#f0a040', 3.5, 2.6) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <g transform="translate(-10 -16) rotate(${f1(-flapA)})"><path d="M0,0 C-8,-2 -12,4 -10,9 C-6,6 -3,5 0,4 Z" fill="#dcd6f8" stroke="${OUT}" stroke-width="1"/></g>
      ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f4f2ff" stroke="${OUT}" stroke-width="1.1"/>`).join('')}
      ${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${f1(r - 1.1)}" fill="#f4f2ff"/>`).join('')}
      <ellipse cx="1" cy="-10" rx="6" ry="4" fill="#dcd6f8" opacity=".8"/>
      <g transform="translate(10 -16) rotate(${f1(flapA)})"><path d="M0,0 C8,-2 12,4 10,9 C6,6 3,5 0,4 Z" fill="#dcd6f8" stroke="${OUT}" stroke-width="1"/></g>
      <path d="M-9,-29 Q1,-33.5 11,-29" fill="none" stroke="#7a4a2a" stroke-width="2"/>
      <circle cx="-1" cy="-31.5" r="2.5" fill="#7fe0f0" stroke="#7a4a2a" stroke-width="1.3"/><circle cx="5" cy="-31.5" r="2.5" fill="#7fe0f0" stroke="#7a4a2a" stroke-width="1.3"/>
      <path d="M-2,-32.5 l1.4,-.8 M4,-32.5 l1.4,-.8" stroke="#fff" stroke-width=".7"/>
      ${eye(-1.5, -18, 3.4, '#5a4ac0', c, push > 0.05 ? -0.1 : 0.3)}${eye(6, -18, 3.4, '#5a4ac0', c, push > 0.05 ? -0.1 : 0.3)}
      <path d="M1.5,-15 L4.5,-15 L3,-11.5 Z" fill="#f0a040" stroke="${OUT}" stroke-width=".8" stroke-linejoin="round"/>
      ${blush(-5, -13.5, '#ffa0c8')}${blush(9.5, -13.5, '#ffa0c8')}
      ${push > 0.05 ? `<g stroke="#bfe0ff" stroke-width="1" stroke-linecap="round" opacity="${f1(push)}"><path d="M18,-24 h7 M20,-17 h8 M18,-10 h6"/></g>` : ''}
      ${puff(c, 10, -13, '#e8f4ff', '#ffffff')}
    </g></g>`;
  }

  const NEW = { brasito, gotalho, musguinho, faiscolino, pedrugo, ventolina };
  const reg = () => { if (MS.Art && MS.Art.register) { for (const k in NEW) MS.Art.register(k, NEW[k]); return true; } return false; };
  if (!reg()) document.addEventListener('DOMContentLoaded', reg);
  MS.ORIG_ART = NEW;
})();
