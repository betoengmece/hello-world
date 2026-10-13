// Arte em SVG: personagens, cenário e objetos. Cada personagem é desenhado com os pés em y=0, virado para +x.
// ctx: { f: frame, blink, breath, bob, step, x, charge }
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);

  function eye(cx, cy, r, pupil, closed) {
    if (closed) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.7)} ${f1(cx + r)},${f1(cy)}"
                          fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#222" stroke-width=".8"/>
            <circle cx="${f1(cx + r * 0.3)}" cy="${cy}" r="${f1(r * 0.58)}" fill="${pupil}"/>
            <circle cx="${f1(cx + r * 0.45)}" cy="${f1(cy - r * 0.3)}" r="${f1(r * 0.24)}" fill="#fff"/>`;
  }

  function feet(step, grad, stroke, dx = 4) {
    return `<ellipse cx="${f1(-dx + step)}" cy="-2" rx="3.8" ry="2.6" fill="${grad}" stroke="${stroke}" stroke-width="1"/>
            <ellipse cx="${f1(dx - step)}" cy="-2" rx="3.8" ry="2.6" fill="${grad}" stroke="${stroke}" stroke-width="1"/>`;
  }

  // sopro do ataque saindo da boca
  function puff(c, m, col, hi) {
    if (!(c.breath > 0)) return '';
    const [mx, my] = m, j = Math.sin(c.f * 1.7) * 2;
    return `<g opacity="${(c.breath / 18).toFixed(2)}">
      <path d="M${mx},${my - 2} Q${mx + 11},${f1(my - 7 + j)} ${mx + 25},${my - 1} Q${mx + 13},${my + 4} ${mx},${my + 3} Z" fill="${col}"/>
      <path d="M${mx},${my} Q${mx + 9},${my - 2} ${mx + 19},${my - 1} Q${mx + 9},${my + 2} ${mx},${my + 2} Z" fill="${hi}"/></g>`;
  }

  function starPath(n, R, r, rot) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = rot + i * Math.PI / n - Math.PI / 2, rr = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + f1(Math.cos(a) * rr) + ',' + f1(Math.sin(a) * rr);
    }
    return d + 'Z';
  }

  // ---------- Iniciais ----------
  function charmander(c) {
    const sc = 1 + 0.14 * Math.sin(c.f * 0.35 + c.x);
    return feet(c.step, 'url(#gOrange)', '#6b2a0e') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-6,-8 C-14,-8 -17,-15 -14,-22" fill="none" stroke="#6b2a0e" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M-6,-8 C-14,-8 -17,-15 -14,-22" fill="none" stroke="#f58a30" stroke-width="4.3" stroke-linecap="round"/>
      <circle cx="-14" cy="-29" r="10" fill="url(#fireball)" opacity=".55"/>
      <g transform="translate(-14 -22) scale(1 ${sc.toFixed(2)})">
        <path d="M0,0 C-6,-4 -5,-10 0,-15 C1,-11 4,-12 4,-9 C6,-5 4,-1 0,0 Z" fill="#ff8a1a"/>
        <path d="M0,-1 C-3,-3 -2,-7 0,-10 C2,-7 3,-3 0,-1 Z" fill="#ffd34d"/>
        <path d="M0,-2 C-1.2,-3 -1,-5 0,-6 C1,-5 1.2,-3 0,-2 Z" fill="#fffbe0"/>
      </g>
      <ellipse cx="0" cy="-12" rx="9" ry="10" fill="url(#gOrange)" stroke="#6b2a0e" stroke-width="1.2"/>
      <ellipse cx="1.5" cy="-9" rx="5.5" ry="6.5" fill="url(#gCream)"/>
      <path d="M4,-13 Q9,-13 9,-10" fill="none" stroke="#6b2a0e" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M4,-13 Q9,-13 9,-10" fill="none" stroke="#f5892e" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="3" cy="-22" rx="8.5" ry="7.8" fill="url(#gOrange)" stroke="#6b2a0e" stroke-width="1.2"/>
      ${eye(5.5, -23.5, 3.3, '#1b2a5a', c.blink)}
      <circle cx="9.8" cy="-20.5" r=".7" fill="#6b2a0e"/>
      <path d="M5,-17.5 Q8.5,-15 11,-17.5" fill="none" stroke="#6b2a0e" stroke-width="1" stroke-linecap="round"/>
      ${puff(c, [11, -18], '#ff7a1a', '#fff3a0')}
    </g>`;
  }

  function bulbasaur(c) {
    return feet(c.step, 'url(#gGreen)', '#1d4a2a') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <ellipse cx="0" cy="-12" rx="9.5" ry="9.5" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1.2"/>
      <ellipse cx="2" cy="-8.5" rx="5" ry="5" fill="url(#gCreamGreen)"/>
      <path d="M-5,-15 l2,-1.5 l1,2 Z M-1,-18 l2,-1 l.6,2 Z M-6,-10 l2,-.5 l.3,1.8 Z" fill="#2b6b3a"/>
      <ellipse cx="-6" cy="-22" rx="8" ry="7.5" fill="url(#gBulb)" stroke="#1d4a2a" stroke-width="1.1"/>
      <path d="M-8,-27 Q-9,-31 -6,-34" fill="none" stroke="#1d4a2a" stroke-width=".7" opacity=".6"/>
      <path d="M-6,-29 Q-11,-37 -17,-35 Q-13,-29 -6,-29 Z" fill="#2e9a4a" stroke="#1d4a2a" stroke-width=".8"/>
      <path d="M-5,-29 Q-3,-37 2,-38 Q0,-31 -5,-29 Z" fill="#3fae5a" stroke="#1d4a2a" stroke-width=".8"/>
      <path d="M0,-25 L1.5,-30.5 L4.5,-26.5 Z M6,-25.5 L9,-29.5 L10,-24.5 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width=".9" stroke-linejoin="round"/>
      <ellipse cx="4.5" cy="-20" rx="8.2" ry="7" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1.2"/>
      ${eye(6.5, -21, 2.9, '#c0392b', c.blink)}
      <path d="M7,-16 Q10,-14.5 11,-16.8" fill="none" stroke="#1d4a2a" stroke-width="1" stroke-linecap="round"/>
      <ellipse cx="6" cy="-12" rx="3" ry="1.8" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1"/>
      ${puff(c, [11, -18], '#5cc46a', '#e6ffd0')}
    </g>`;
  }

  function squirtle(c) {
    return feet(c.step, 'url(#gBlue)', '#1d4a6b') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-7 Q-16,-8 -15,-2 Q-14,2 -10.5,.5" fill="none" stroke="#1d4a6b" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M-8,-7 Q-16,-8 -15,-2 Q-14,2 -10.5,.5" fill="none" stroke="#8fd3ef" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="0" cy="-12" rx="9.5" ry="9.5" fill="url(#gBlue)" stroke="#1d4a6b" stroke-width="1.2"/>
      <ellipse cx="2.5" cy="-8" rx="5" ry="4.2" fill="url(#gCream)" stroke="#b89a5a" stroke-width=".6"/>
      <path d="M-10,-11 Q-11,-23 0,-23 Q9,-23 8,-13 Q7,-6 -1,-6 Q-10,-6 -10,-11 Z" fill="url(#gShell)" stroke="#4a2a10" stroke-width="1.2"/>
      <path d="M-5,-19 L-1,-16 L3,-19 M-1,-16 L-1,-11 M-7,-12 L-1,-11 L5,-12" fill="none" stroke="#6b4016" stroke-width="1"/>
      <path d="M-10,-10 Q-1,-4 8,-11" fill="none" stroke="#f3e2b0" stroke-width="1.6"/>
      <ellipse cx="6" cy="-10" rx="3" ry="1.8" fill="url(#gBlue)" stroke="#1d4a6b" stroke-width="1"/>
      <circle cx="6.5" cy="-19.5" r="7" fill="url(#gBlue)" stroke="#1d4a6b" stroke-width="1.2"/>
      ${eye(9, -21, 2.6, '#6b3a1a', c.blink)}
      <path d="M8,-15.5 Q11,-14 11,-16.5" fill="none" stroke="#1d4a6b" stroke-width="1" stroke-linecap="round"/>
      ${puff(c, [11, -17], '#6ad0ff', '#e6f8ff')}
    </g>`;
  }

  // ---------- Neutro ----------
  function pikachu(c) {
    const fl = c.charge ? (c.f % 8 < 4 ? 1 : 0.35) : 0;
    const bob = Math.sin(c.f * 0.08) * 0.7;
    const closed = ((c.f + 37) % 260) < 7;
    const darkEye = cx => closed
      ? `<path d="M${cx - 2},-23 Q${cx},-21.6 ${cx + 2},-23" fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
      : `<circle cx="${cx}" cy="-23" r="2.1" fill="#222"/><circle cx="${f1(cx + 0.7)}" cy="-23.8" r=".75" fill="#fff"/>`;
    const sparks = c.charge
      ? `<path d="M-11,-22 l-5,-3 l2,-1 l-4,-3 M-11,-18 l-5,2 M11,-22 l5,-3 l-2,-1 l4,-3 M11,-18 l5,2"
           fill="none" stroke="#fff27a" stroke-width="1.6" stroke-linecap="round" opacity="${fl}"/>` : '';
    return `
      ${c.charge ? `<circle cx="0" cy="-18" r="${f1(22 + fl * 5)}" fill="url(#voltGlow)" opacity="${fl}"/>` : ''}
      <ellipse cx="-4" cy="-2" rx="3.4" ry="2.3" fill="url(#gYellow)" stroke="#5a4300" stroke-width="1"/>
      <ellipse cx="4" cy="-2" rx="3.4" ry="2.3" fill="url(#gYellow)" stroke="#5a4300" stroke-width="1"/>
      <g transform="translate(0 ${f1(bob)})">
        <path d="M7,-7 L13,-11 L10,-14 L17,-22 L13,-23 L19,-32 L8,-24 L11,-22 L5,-15 L8,-13 Z"
              fill="url(#gYellow)" stroke="#5a4300" stroke-width="1" stroke-linejoin="round"/>
        <path d="M7,-7 L13,-11 L10,-14 L8,-13 Z" fill="#8a5a1a"/>
        <ellipse cx="0" cy="-12" rx="9" ry="10.5" fill="url(#gYellow)" stroke="#5a4300" stroke-width="1.2"/>
        <path d="M-5,-27 Q-11,-34 -12,-42 Q-6,-37 -1,-29 Z" fill="#222" stroke="#5a4300" stroke-width="1"/>
        <path d="M-5,-27 Q-9.5,-32 -10.2,-36.5 Q-5.5,-34 -1,-29 Z" fill="url(#gYellow)"/>
        <path d="M5,-27 Q11,-34 12,-42 Q6,-37 1,-29 Z" fill="#222" stroke="#5a4300" stroke-width="1"/>
        <path d="M5,-27 Q9.5,-32 10.2,-36.5 Q5.5,-34 1,-29 Z" fill="url(#gYellow)"/>
        <ellipse cx="0" cy="-21.5" rx="9.5" ry="8" fill="url(#gYellow)" stroke="#5a4300" stroke-width="1.2"/>
        ${darkEye(-3.5)}${darkEye(3.5)}
        <circle cx="-6.6" cy="-18.4" r="2.6" fill="#ef4b3c"/><circle cx="6.6" cy="-18.4" r="2.6" fill="#ef4b3c"/>
        <circle cx="0" cy="-20.3" r=".6" fill="#222"/>
        <path d="M-2,-17.6 Q-1,-16 0,-17.3 Q1,-16 2,-17.6" fill="none" stroke="#5a4300" stroke-width=".9" stroke-linecap="round"/>
        <ellipse cx="-5" cy="-11" rx="2.6" ry="1.6" fill="url(#gYellow)" stroke="#5a4300" stroke-width=".9"/>
        <ellipse cx="5" cy="-11" rx="2.6" ry="1.6" fill="url(#gYellow)" stroke="#5a4300" stroke-width=".9"/>
        ${sparks}
      </g>`;
  }

  // ---------- Selvagens ----------
  function rattata(c) {
    const tw = Math.sin(c.f * 0.12) * 2.5;
    return feet(c.step, 'url(#gPurple)', '#3f2260', 5) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-7 C-18,-6 -21,-14 -17,${f1(-19 + tw)} C-15,-24 -19,-27 -15,${f1(-30 + tw)}" fill="none" stroke="#7a4a62" stroke-width="3.6" stroke-linecap="round"/>
      <path d="M-8,-7 C-18,-6 -21,-14 -17,${f1(-19 + tw)} C-15,-24 -19,-27 -15,${f1(-30 + tw)}" fill="none" stroke="#e0aac0" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="-1" cy="-9" rx="10.5" ry="8" fill="url(#gPurple)" stroke="#3f2260" stroke-width="1.2"/>
      <path d="M-4,-9 Q4,-4 9,-9 Q6,-2.5 -3,-3 Z" fill="url(#gCream)"/>
      <path d="M-2.5,-16 L-1,-20 L1,-16 Z" fill="#3f2260" opacity=".55"/>
      <path d="M2,-23 Q0.5,-33 6,-31 Q10,-28 8,-22 Z" fill="url(#gPurple)" stroke="#3f2260" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M3.5,-24 Q3,-30 6,-29.5 Q8,-28 7,-24 Z" fill="#e0aac0"/>
      <path d="M9,-23 Q10.5,-32 15,-29 Q17,-25 13,-21 Z" fill="url(#gPurple)" stroke="#3f2260" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M10.5,-24 Q11.5,-29.5 14,-28 Q15,-26 12.5,-23 Z" fill="#e0aac0"/>
      <ellipse cx="7" cy="-15.5" rx="8" ry="6.8" fill="url(#gPurple)" stroke="#3f2260" stroke-width="1.2"/>
      <ellipse cx="11.5" cy="-13" rx="4.2" ry="3.4" fill="url(#gCream)"/>
      ${c.blink ? `<path d="M7,-18 Q9.2,-16.6 11.4,-18" fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
                : `<circle cx="9.3" cy="-18" r="2.2" fill="#fff" stroke="#3f2260" stroke-width=".7"/><circle cx="9.9" cy="-18" r="1.3" fill="#b01d2f"/><circle cx="10.3" cy="-18.5" r=".5" fill="#fff"/>`}
      <circle cx="14.6" cy="-14.5" r="1" fill="#222"/>
      <path d="M11.5,-12.6 L11.5,-9 L14.3,-9.3 L14,-12.8 Z" fill="#fff" stroke="#6a5a4a" stroke-width=".6"/>
      <path d="M12,-14.5 L20,-16 M12,-13.6 L20,-12.6" stroke="#3f2260" stroke-width=".6" stroke-linecap="round"/>
      ${puff(c, [12, -15], '#d8d0c0', '#ffffff')}
    </g>`;
  }

  function pidgey(c) {
    const flap = (c.flap || c.breath > 0) ? Math.sin(c.f * 0.9) * 28 : Math.sin(c.f * 0.05) * 3;
    return `
      <path d="M-5,-5 L-4,-1 M3,-5 L4,-1" stroke="#d98a2a" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M-3,-1 l-2,1 M-3,-1 l2,1 M4,-1 l-2,1 M4,-1 l2,1" stroke="#d98a2a" stroke-width="1" stroke-linecap="round"/>
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-12 L-19,-16 L-17,-12 L-20,-10.5 L-16,-9 L-18,-6.5 L-8,-8 Z" fill="#c75b3a" stroke="#6b3a1e" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M-13,-12 L-19,-13.5 M-12,-9.5 L-17,-8.3" stroke="#f0d0a0" stroke-width="1"/>
      <ellipse cx="-1" cy="-11.5" rx="10.5" ry="8.5" fill="url(#gBrown)" stroke="#5e3b1c" stroke-width="1.2"/>
      <ellipse cx="3" cy="-9" rx="6.5" ry="6" fill="url(#gCream)"/>
      <g transform="translate(-4 -13) rotate(${f1(flap)})">
        <path d="M0,0 Q-7,-2 -12,5 Q-6,6 -1,5 Z" fill="url(#gBrown)" stroke="#5e3b1c" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-3,2 L-9,4.5" stroke="#f0d0a0" stroke-width="1.1"/>
      </g>
      <circle cx="6" cy="-21.5" r="7.2" fill="url(#gBrown)" stroke="#5e3b1c" stroke-width="1.2"/>
      <path d="M-1,-26 Q-2,-34 4,-31 Q3,-37 8,-32 Q10,-35 11,-28 Q6,-29 -1,-26 Z" fill="#f2c15a" stroke="#8a5a1a" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M2,-30 Q3,-34 5,-31" fill="none" stroke="#d94a2a" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M10,-22.5 L17,-20.6 L10.5,-18.6 Z" fill="#f2a23a" stroke="#8a5a1a" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M10.5,-20.6 L16,-20.6" stroke="#8a5a1a" stroke-width=".6"/>
      ${c.blink ? `<path d="M5.4,-23.2 Q7.4,-21.8 9.4,-23.2" fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
                : `<circle cx="7.6" cy="-23" r="2.4" fill="#fff" stroke="#5e3b1c" stroke-width=".7"/><circle cx="8.1" cy="-23" r="1.5" fill="#222"/><circle cx="8.6" cy="-23.6" r=".5" fill="#fff"/>`}
      ${puff(c, [14, -22], '#e8f0ff', '#ffffff')}
    </g>`;
  }

  function caterpie(c) {
    const w = i => Math.sin(c.f * 0.1 + i * 0.9) * 1.1;
    const seg = (x, y, r, i) => `
      <circle cx="${f1(x)}" cy="${f1(y + w(i))}" r="${r}" fill="url(#gCat)" stroke="#2c6a1e" stroke-width="1.1"/>
      <ellipse cx="${f1(x + 1)}" cy="${f1(y + w(i) + r * 0.45)}" rx="${f1(r * 0.62)}" ry="${f1(r * 0.35)}" fill="#e6f5a8" opacity=".75"/>
      <ellipse cx="${f1(x + 1)}" cy="${f1(y + w(i) + r + 0.5)}" rx="2.6" ry="1.5" fill="#f4eed0" stroke="#7a6a3a" stroke-width=".6"/>`;
    return `
    <g transform="translate(0 ${f1(c.bob * 0.5)})">
      ${seg(-16, -4, 3.8, 3)}${seg(-9, -5, 4.8, 2)}${seg(-1, -6, 5.6, 1)}
      <path d="M8,-18 Q8,-24 5,-26 M10,-18 Q12,-24 15,-25" fill="none" stroke="#e8452a" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="5" cy="-26" r="1.9" fill="#ff9a3a"/><circle cx="15" cy="-25" r="1.9" fill="#ff9a3a"/>
      ${seg(9, -9.5, 8, 0)}
      ${c.blink ? `<path d="M9.5,-12.5 Q12.5,-10.5 15.5,-12.5" fill="none" stroke="#222" stroke-width="1.2" stroke-linecap="round"/>`
                : `<circle cx="12.5" cy="-12.5" r="3.9" fill="#fff" stroke="#2c4a14" stroke-width=".9"/><circle cx="13.6" cy="-12.3" r="2.4" fill="#222"/><circle cx="14.3" cy="-13.4" r=".9" fill="#fff"/>`}
      <path d="M12,-5.4 Q15,-3.6 17.2,-5.6" fill="none" stroke="#2c4a14" stroke-width="1" stroke-linecap="round"/>
      ${puff(c, [15, -8], '#f4f4f4', '#ffffff')}
    </g>`;
  }

  function starmie(c) {
    const bob = Math.sin(c.f * 0.07) * 2.5, rock = Math.sin(c.f * 0.035) * 14;
    return `
      <ellipse cx="0" cy=".5" rx="${f1(11 - bob * 0.5)}" ry="2.4" fill="#000" opacity=".22"/>
      <g transform="translate(0 ${f1(-23 + bob)}) rotate(${f1(rock)})">
        <circle r="26" fill="url(#voltGlow)" opacity=".18"/>
        <path d="${starPath(5, 20, 8, Math.PI / 5)}" fill="url(#gStar)" stroke="#4a2478" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="${starPath(5, 20, 8, 0)}" fill="url(#gStar)" stroke="#4a2478" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="${starPath(5, 15, 6, 0)}" fill="#d9b0ff" opacity=".35"/>
        <circle r="7.2" fill="#f2c94c" stroke="#8a6a10" stroke-width="1"/>
        <circle r="5.4" fill="url(#gRed)" stroke="#8a1030" stroke-width=".8"/>
        <circle cx="-1.6" cy="-1.8" r="1.6" fill="#fff" opacity=".85"/>
      </g>
      ${puff(c, [14, -26], '#6ad0ff', '#e6f8ff')}`;
  }

  function magikarp(c) {
    const hop = Math.max(0, Math.sin(c.f * 0.1)), flop = Math.sin(c.f * 0.2) * 3;
    return `
    <g transform="translate(0 ${f1(-hop * 7)}) rotate(${f1(-hop * 14)} -2 0)">
      <path d="M-9,-12 Q-19,${f1(-22 + flop)} -22,-19 Q-18,-14 -22,-8 Q-19,${f1(-3 + flop)} -9,-10 Z" fill="#fbe9a8" stroke="#a8421e" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-4,-20 Q-2,-27 3,-31 Q4,-26 7,-23 Z" fill="#fbe9a8" stroke="#a8421e" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-12" rx="12.5" ry="10" fill="url(#gFish)" stroke="#8a2c10" stroke-width="1.3"/>
      <path d="M-10,-9 Q0,-3 11,-9 Q8,-2 0,-2 Q-8,-2 -10,-9 Z" fill="#fbe9a8"/>
      <path d="M-4,-14 q2,-2 4,0 M2,-17 q2,-2 4,0 M-7,-9 q2,-2 4,0" fill="none" stroke="#b83a18" stroke-width=".9" opacity=".7"/>
      <path d="M-3,-10 Q-8,-5 -2,-4 Q0,-7 -3,-10 Z" fill="#fbe9a8" stroke="#a8421e" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M11,-8 Q17,-4 15,1 M10,-7 Q13,-3 9,1" fill="none" stroke="#fbe9a8" stroke-width="2" stroke-linecap="round"/>
      <path d="M11,-8 Q17,-4 15,1 M10,-7 Q13,-3 9,1" fill="none" stroke="#a8421e" stroke-width=".7" stroke-linecap="round" opacity=".7"/>
      ${c.blink ? `<path d="M5,-14 Q7.5,-12.4 10,-14" fill="none" stroke="#222" stroke-width="1.2" stroke-linecap="round"/>`
                : `<circle cx="7.5" cy="-14.5" r="3.4" fill="#fff" stroke="#8a2c10" stroke-width=".9"/><circle cx="8.3" cy="-14.5" r="2" fill="#222"/><circle cx="8.9" cy="-15.4" r=".8" fill="#fff"/>`}
      <path d="M11.5,-11 Q14.5,-9.5 12.5,-7.6" fill="#7a1c0c" stroke="#8a2c10" stroke-width=".9"/>
      ${puff(c, [14, -9], '#6ad0ff', '#e6f8ff')}
    </g>`;
  }

  function dratini(c) {
    const s = Math.sin(c.f * 0.08), s2 = Math.sin(c.f * 0.08 + 1.4);
    const tx = -22, ty = f1(-3 + s);
    const body = `M${tx},${ty} Q-16,${f1(1 + s)} -12,-5 Q-8,-10 -3,-6 Q2,-2 3,-9 Q${f1(3 + s2 * 0.8)},-13 ${f1(5 + s2)},-15`;
    const hx = 7 + s2 * 1.1, hy = -21 + s2 * 0.7;
    return `
      <ellipse cx="-8" cy=".5" rx="17" ry="2.2" fill="#000" opacity=".18"/>
      <path d="${body}" fill="none" stroke="#1d3f7a" stroke-width="10.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${body}" fill="none" stroke="url(#gDrat)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${body}" fill="none" stroke="#f2f6ff" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 3.4" transform="translate(1 2.2)" opacity=".9"/>
      <path d="${body}" fill="none" stroke="#cfe6ff" stroke-width="1.6" stroke-linecap="round" transform="translate(-1 -2.6)" opacity=".7"/>
      <circle cx="${tx}" cy="${ty}" r="3.4" fill="#e8f1ff" stroke="#1d3f7a" stroke-width="1"/>
      <circle cx="${f1(tx - 0.8)}" cy="${f1(-4 + s)}" r="1" fill="#fff"/>
      <g transform="translate(${f1(hx)} ${f1(hy)})">
        <path d="M-7,-1 Q-14,-8 -12,2 Q-9,3 -6,2 Z" fill="#fff" stroke="#1d3f7a" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-5,-4 Q-9,-13 -3.4,-7 Z" fill="#fff" stroke="#1d3f7a" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="0" cy="0" rx="9.6" ry="8.2" fill="url(#gDrat)" stroke="#1d3f7a" stroke-width="1.4"/>
        <path d="M-5,-5.5 Q0,-8.6 5,-5.8" fill="none" stroke="#bfe0ff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
        <ellipse cx="3" cy="4" rx="6.4" ry="3.4" fill="#f4f8ff"/>
        <path d="M-1.2,-7.4 L1,-12.6 L3.2,-7.4 Z" fill="#fff" stroke="#1d3f7a" stroke-width=".9" stroke-linejoin="round"/>
        ${c.blink ? `<path d="M1.6,-1.6 Q4.4,0.4 7.2,-1.6" fill="none" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>`
                  : `<ellipse cx="4.6" cy="-1.4" rx="3.3" ry="3.7" fill="#fff" stroke="#1d3f7a" stroke-width=".8"/><ellipse cx="5.2" cy="-1.2" rx="2.3" ry="2.8" fill="#7a3ac4"/><ellipse cx="5.6" cy="-1.1" rx="1.2" ry="1.7" fill="#2a1048"/><circle cx="6.2" cy="-2.6" r=".95" fill="#fff"/><circle cx="4.4" cy=".2" r=".5" fill="#fff"/>`}
        <path d="M5.4,4.2 Q8,5.2 8.8,3" fill="none" stroke="#1d3f7a" stroke-width="1" stroke-linecap="round"/>
        <ellipse cx="-1.6" cy="2.6" rx="2" ry="1.2" fill="#ff9ab8" opacity=".55"/>
      </g>
      ${puff(c, [16, -20], '#8a5cff', '#d8c8ff')}`;
  }


  // ---------- Evoluções (um estágio) e Onix ----------
  function charmeleon(c) {
    const sc = 1 + 0.14 * Math.sin(c.f * 0.35 + c.x);
    return feet(c.step, 'url(#gCrimson)', '#5a160c') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-6,-9 C-17,-9 -20,-17 -16,-26" fill="none" stroke="#5a160c" stroke-width="7.4" stroke-linecap="round"/>
      <path d="M-6,-9 C-17,-9 -20,-17 -16,-26" fill="none" stroke="#e0442e" stroke-width="5" stroke-linecap="round"/>
      <circle cx="-16" cy="-34" r="11" fill="url(#fireball)" opacity=".55"/>
      <g transform="translate(-16 -26) scale(1.15 ${(1.15 * sc).toFixed(2)})">
        <path d="M0,0 C-6,-4 -5,-10 0,-15 C1,-11 4,-12 4,-9 C6,-5 4,-1 0,0 Z" fill="#ff8a1a"/>
        <path d="M0,-1 C-3,-3 -2,-7 0,-10 C2,-7 3,-3 0,-1 Z" fill="#ffd34d"/>
        <path d="M0,-2 C-1.2,-3 -1,-5 0,-6 C1,-5 1.2,-3 0,-2 Z" fill="#fffbe0"/>
      </g>
      <ellipse cx="0" cy="-13" rx="9.5" ry="11" fill="url(#gCrimson)" stroke="#5a160c" stroke-width="1.2"/>
      <ellipse cx="1.5" cy="-10" rx="5.5" ry="7" fill="url(#gCream)"/>
      <path d="M-4,-30 Q-14,-33 -15,-22 Q-10,-27 -3,-25 Z" fill="#c42f20" stroke="#5a160c" stroke-width="1" stroke-linejoin="round"/>
      <path d="M4,-14 Q10,-14 10,-10" fill="none" stroke="#5a160c" stroke-width="4" stroke-linecap="round"/>
      <path d="M4,-14 Q10,-14 10,-10" fill="none" stroke="#e0442e" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M9.4,-9 l1.4,-2 M8,-8.4 l.6,-2.2" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
      <ellipse cx="3" cy="-26" rx="9" ry="8.2" fill="url(#gCrimson)" stroke="#5a160c" stroke-width="1.2"/>
      <path d="M8,-28 Q16,-27 14.5,-22 Q12,-19 7,-20 Z" fill="url(#gCrimson)" stroke="#5a160c" stroke-width="1.1" stroke-linejoin="round"/>
      ${eye(5.5, -27.5, 3.2, '#1b2a5a', c.blink)}
      <path d="M2.5,-31 L9,-29.4" stroke="#5a160c" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="13" cy="-24.5" r=".8" fill="#5a160c"/>
      <path d="M7,-21 Q11,-19.5 14,-21.5" fill="none" stroke="#5a160c" stroke-width="1" stroke-linecap="round"/>
      ${puff(c, [13, -21], '#ff7a1a', '#fff3a0')}
    </g>`;
  }

  function ivysaur(c) {
    return feet(c.step, 'url(#gGreen)', '#1d4a2a') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <ellipse cx="0" cy="-12" rx="10.2" ry="9.8" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1.2"/>
      <ellipse cx="2" cy="-8.5" rx="5.2" ry="5" fill="url(#gCreamGreen)"/>
      <circle cx="-5" cy="-14" r="1.6" fill="#2b6b3a" opacity=".7"/><circle cx="-2" cy="-17.5" r="1.3" fill="#2b6b3a" opacity=".7"/>
      <ellipse cx="-6" cy="-23" rx="10" ry="8.6" fill="url(#gBulb)" stroke="#1d4a2a" stroke-width="1.2"/>
      <path d="M-9,-29 Q-10,-33 -7,-36" fill="none" stroke="#1d4a2a" stroke-width=".7" opacity=".6"/>
      <path d="M-6,-30 Q-18,-34 -19,-42 Q-9,-40 -6,-30 Z" fill="#e8607a" stroke="#8a2a40" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M-6,-30 Q-2,-40 6,-40 Q4,-33 -6,-30 Z" fill="#f08aa0" stroke="#8a2a40" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M-6,-30 Q-9,-42 -6,-46 Q-1,-40 -6,-30 Z" fill="#ff9ab0" stroke="#8a2a40" stroke-width=".9" stroke-linejoin="round"/>
      <circle cx="-6" cy="-31" r="2" fill="#ffe27a"/>
      <path d="M0,-26 L2,-32 L5,-27.5 Z M7,-26.5 L10.5,-31 L11,-25.5 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width=".9" stroke-linejoin="round"/>
      <ellipse cx="5" cy="-21" rx="8.8" ry="7.4" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1.2"/>
      <path d="M-.5,-27 Q2,-26 3,-23.5" fill="none" stroke="#2b6b3a" stroke-width="1.6" opacity=".7"/>
      ${eye(7, -22, 2.9, '#c0392b', c.blink)}
      <path d="M7.5,-16.5 Q10.5,-15 12,-17" fill="none" stroke="#1d4a2a" stroke-width="1" stroke-linecap="round"/>
      <ellipse cx="6.5" cy="-12" rx="3.4" ry="1.9" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1"/>
      ${puff(c, [12, -19], '#5cc46a', '#e6ffd0')}
    </g>`;
  }

  function wartortle(c) {
    return feet(c.step, 'url(#gBlue)', '#1d4a6b') + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-8 Q-20,-8 -19,-20 Q-18,-28 -12,-26" fill="none" stroke="#1d4a6b" stroke-width="8.4" stroke-linecap="round"/>
      <path d="M-8,-8 Q-20,-8 -19,-20 Q-18,-28 -12,-26" fill="none" stroke="#e6f6ff" stroke-width="6" stroke-linecap="round"/>
      <path d="M-8,-8 Q-20,-8 -19,-20" fill="none" stroke="#8fd3ef" stroke-width="2" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="0" cy="-12" rx="10" ry="9.8" fill="url(#gBlue)" stroke="#1d4a6b" stroke-width="1.2"/>
      <ellipse cx="2.5" cy="-8" rx="5.4" ry="4.4" fill="url(#gCream)" stroke="#b89a5a" stroke-width=".6"/>
      <path d="M-11,-11 Q-12,-25 0,-25 Q10,-25 9,-13 Q8,-6 -1,-6 Q-11,-6 -11,-11 Z" fill="url(#gShell)" stroke="#4a2a10" stroke-width="1.2"/>
      <path d="M-6,-21 L-1,-17.5 L4,-21 M-1,-17.5 L-1,-11 M-8,-12.5 L-1,-11 L6,-12.5" fill="none" stroke="#6b4016" stroke-width="1"/>
      <path d="M-11,-10 Q-1,-3.5 9,-11.5" fill="none" stroke="#f3e2b0" stroke-width="1.8"/>
      <ellipse cx="6.5" cy="-10" rx="3.2" ry="1.9" fill="url(#gBlue)" stroke="#1d4a6b" stroke-width="1"/>
      <path d="M2,-27 Q-6,-40 -14,-33 Q-7,-33 -4,-26 Z" fill="#e6f6ff" stroke="#1d4a6b" stroke-width="1" stroke-linejoin="round"/>
      <path d="M5,-27.5 Q0,-42 -7,-38 Q-1,-35 1,-27 Z" fill="#cfeaff" stroke="#1d4a6b" stroke-width="1" stroke-linejoin="round"/>
      <circle cx="7" cy="-21" r="7.6" fill="url(#gBlue)" stroke="#1d4a6b" stroke-width="1.2"/>
      ${eye(9.6, -22.4, 2.7, '#6b3a1a', c.blink)}
      <path d="M8.5,-16.4 Q11.5,-15 12,-17.2" fill="none" stroke="#1d4a6b" stroke-width="1" stroke-linecap="round"/>
      ${puff(c, [12, -17], '#6ad0ff', '#e6f8ff')}
    </g>`;
  }

  function raticate(c) {
    const tw = Math.sin(c.f * 0.1) * 2;
    return feet(c.step, 'url(#gTan)', '#5a3a1c', 5) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-9,-8 C-21,-8 -23,-17 -18,${f1(-23 + tw)} C-16,-27 -21,-30 -17,${f1(-33 + tw)}" fill="none" stroke="#8a5a40" stroke-width="3.8" stroke-linecap="round"/>
      <path d="M-9,-8 C-21,-8 -23,-17 -18,${f1(-23 + tw)} C-16,-27 -21,-30 -17,${f1(-33 + tw)}" fill="none" stroke="#e8b8a0" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="-1" cy="-10" rx="11.5" ry="9" fill="url(#gTan)" stroke="#5a3a1c" stroke-width="1.2"/>
      <path d="M-4,-10 Q4,-4 10,-10 Q7,-2.5 -3,-3 Z" fill="url(#gCream)"/>
      <path d="M2.5,-24 L3,-32 L9,-26 Z" fill="url(#gTan)" stroke="#5a3a1c" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M9,-25 L13.5,-32 L16,-23 Z" fill="url(#gTan)" stroke="#5a3a1c" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M4,-25.5 L4.5,-30 L7.5,-26.5 Z M10.5,-25 L13,-29 L14,-24.5 Z" fill="#c07a60"/>
      <ellipse cx="8" cy="-17" rx="9" ry="7.6" fill="url(#gTan)" stroke="#5a3a1c" stroke-width="1.2"/>
      <ellipse cx="13" cy="-14" rx="5" ry="3.8" fill="url(#gCream)"/>
      ${c.blink ? `<path d="M7.5,-19.4 Q9.7,-18 12,-19.4" fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
                : `<circle cx="10" cy="-19.4" r="1.9" fill="#222"/><circle cx="10.6" cy="-20" r=".6" fill="#fff"/>`}
      <circle cx="16.8" cy="-15.6" r="1.2" fill="#222"/>
      <path d="M12.6,-13.6 L12.6,-6.5 L16.2,-6.8 L15.8,-13.8 Z" fill="#fff" stroke="#6a5a4a" stroke-width=".8"/>
      <path d="M14.2,-13.6 L14.2,-6.6" stroke="#6a5a4a" stroke-width=".5"/>
      <path d="M14,-15.6 L22,-18 M14,-14.4 L22,-14.4 M14,-13.4 L21.5,-11" stroke="#5a3a1c" stroke-width=".6" stroke-linecap="round"/>
      ${puff(c, [14, -16], '#d8d0c0', '#ffffff')}
    </g>`;
  }

  function pidgeotto(c) {
    const flap = (c.flap || c.breath > 0) ? Math.sin(c.f * 0.9) * 28 : Math.sin(c.f * 0.05) * 3;
    return `
      <path d="M-5,-5 L-4,-1 M3,-5 L4,-1" stroke="#d98a2a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M-3,-1 l-2,1 M-3,-1 l2,1 M4,-1 l-2,1 M4,-1 l2,1" stroke="#d98a2a" stroke-width="1" stroke-linecap="round"/>
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-9,-13 L-24,-19 L-21,-14 L-26,-12 L-21,-10 L-24,-6 L-9,-8 Z" fill="#d6563a" stroke="#6b3a1e" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M-24,-19 L-21,-14 L-26,-12 Z" fill="#f2c15a"/>
      <ellipse cx="-1" cy="-13" rx="11.8" ry="9.6" fill="url(#gBrown)" stroke="#5e3b1c" stroke-width="1.2"/>
      <ellipse cx="3.5" cy="-10.5" rx="7" ry="6.4" fill="url(#gCream)"/>
      <g transform="translate(-5 -15) rotate(${f1(flap)})">
        <path d="M0,0 Q-8,-3 -15,6 Q-7,8 -1,6 Z" fill="url(#gBrown)" stroke="#5e3b1c" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-3,2.5 L-11,5.4" stroke="#f0d0a0" stroke-width="1.2"/>
      </g>
      <circle cx="7" cy="-24" r="7.6" fill="url(#gBrown)" stroke="#5e3b1c" stroke-width="1.2"/>
      <path d="M2,-30 Q-8,-41 -22,-36 Q-13,-35 -7,-27 Z" fill="#f2c15a" stroke="#8a5a1a" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M-4,-33 Q-12,-40 -22,-36" fill="none" stroke="#d94a2a" stroke-width="2" stroke-linecap="round"/>
      <path d="M2,-30 Q3,-36 8,-33 Q7,-28 2,-30 Z" fill="#f2c15a" stroke="#8a5a1a" stroke-width=".8"/>
      <path d="M11,-25 L19,-22.6 L11.5,-20.4 Z" fill="#f2a23a" stroke="#8a5a1a" stroke-width=".8" stroke-linejoin="round"/>
      <path d="M8.5,-25.4 L-1,-26.6" stroke="#3a2410" stroke-width="2.4" stroke-linecap="round"/>
      ${c.blink ? `<path d="M6.4,-25.6 Q8.4,-24.2 10.4,-25.6" fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
                : `<circle cx="8.6" cy="-25.2" r="2.4" fill="#fff" stroke="#5e3b1c" stroke-width=".7"/><circle cx="9.1" cy="-25.2" r="1.5" fill="#222"/>`}
      ${puff(c, [16, -23], '#e8f0ff', '#ffffff')}
    </g>`;
  }

  function butterfree(c) {
    const bob = Math.sin(c.f * 0.07) * 2.5, fl = 1 - Math.abs(Math.sin(c.f * 0.22)) * 0.45;
    return `
      <ellipse cx="0" cy=".5" rx="${f1(11 - bob * 0.5)}" ry="2.4" fill="#000" opacity=".2"/>
      <g transform="translate(0 ${f1(-24 + bob)})">
        <g transform="scale(${fl.toFixed(2)} 1)">
          <path d="M-2,-4 Q-4,-26 -17,-26 Q-27,-22 -22,-8 Q-17,-1 -2,0 Z" fill="url(#gWing)" stroke="#5a5498" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M-3,2 Q-18,2 -21,10 Q-20,18 -12,17 Q-4,15 -2,5 Z" fill="url(#gWing)" stroke="#5a5498" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M-4,-4 Q-10,-14 -16,-21 M-4,-2 Q-12,-6 -21,-8 M-3,4 Q-9,8 -15,14" fill="none" stroke="#5a5498" stroke-width=".8" opacity=".7"/>
          <ellipse cx="-12" cy="-12" rx="3.2" ry="5" fill="#2a2a46" opacity=".75" transform="rotate(-25 -12 -12)"/>
        </g>
        <path d="M2,10 l-1,5 M4,10 l1,5" stroke="#4a4698" stroke-width="1.3" stroke-linecap="round"/>
        <ellipse cx="1" cy="2" rx="5.4" ry="9.4" fill="url(#gBfly)" stroke="#2a2858" stroke-width="1.2"/>
        <path d="M6,-1 Q10,1 8,5" fill="none" stroke="#2a2858" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M6,-1 Q10,1 8,5" fill="none" stroke="#7a74d0" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M3,-14 Q-1,-24 -6,-23 M5,-15 Q8,-25 13,-23" fill="none" stroke="#2a2858" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="2.5" cy="-11" r="7.2" fill="url(#gBfly)" stroke="#2a2858" stroke-width="1.2"/>
        ${c.blink ? `<path d="M3.4,-13.6 Q6,-12 8.6,-13.6" fill="none" stroke="#222" stroke-width="1.2" stroke-linecap="round"/>`
                  : `<circle cx="6" cy="-12.6" r="3.8" fill="#e0243e" stroke="#2a2858" stroke-width=".8"/><circle cx="5.2" cy="-14" r="1.3" fill="#fff"/>`}
        <path d="M6,-6.4 Q8.4,-5.4 9.6,-7" fill="none" stroke="#2a2858" stroke-width="1" stroke-linecap="round"/>
      </g>
      ${puff(c, [10, -30], '#e6e2ff', '#ffffff')}`;
  }

  function gyarados(c) {
    const s = Math.sin(c.f * 0.06), s2 = Math.sin(c.f * 0.06 + 1.2);
    const body = `M-20,-3 Q-24,-14 -12,-16 Q0,-18 -2,-28 Q-4,${f1(-38 + s)} ${f1(6 + s2)},-41`;
    const hx = 12 + s2 * 1.4, hy = -43 + s * 1.2;
    return `
      <path d="${body}" fill="none" stroke="#1d3f7a" stroke-width="15" stroke-linecap="round"/>
      <path d="${body}" fill="none" stroke="#3f74c8" stroke-width="12.4" stroke-linecap="round"/>
      <path d="${body}" fill="none" stroke="#8cc0f6" stroke-width="2.6" stroke-linecap="round" transform="translate(-2 -3)" opacity=".7"/>
      <path d="${body}" fill="none" stroke="#f3e6a0" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="3 4.5" transform="translate(3 3)"/>
      <path d="M-24,-12 L-30,-9 L-26,-17 Z M-5,-22 L-12,-19 L-7,-27 Z" fill="#f2c15a" stroke="#8a5a1a" stroke-width=".9" stroke-linejoin="round"/>
      <g transform="translate(${f1(hx)} ${f1(hy)})">
        <path d="M-6,-6 L-12,-18 L-3,-9 L-5,-21 L2,-10 Z" fill="#e8452a" stroke="#7a1c0c" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-9,2 Q-17,4 -20,12 Q-12,8 -7,6 Z" fill="#f3e6a0" stroke="#8a5a1a" stroke-width=".9" stroke-linejoin="round"/>
        <ellipse cx="0" cy="0" rx="11.6" ry="8.4" fill="#3f74c8" stroke="#1d3f7a" stroke-width="1.4"/>
        <path d="M2,-6.4 Q12,-6 13,-1 L3,-1 Z" fill="#5a8ee0"/>
        <path d="M3,2 Q10,2 13,4.6 Q9,10 2,9 Q-3,7 -2,3 Z" fill="#7a1c1c" stroke="#1d3f7a" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M5,3 l1.6,3 l1.6,-3 M9,3.4 l1.2,2.4 l1.4,-2.6" fill="#fff" stroke="#fff" stroke-width=".6"/>
        <path d="M12,-2 Q22,0 21,6 M11,0 Q18,5 14,11" fill="none" stroke="#f3e6a0" stroke-width="1.6" stroke-linecap="round"/>
        ${c.blink ? `<path d="M2,-3.6 Q5,-2 8,-3.6" fill="none" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>`
                  : `<path d="M1.6,-6 L8.6,-3.4" stroke="#1d3f7a" stroke-width="1.5"/><circle cx="5.2" cy="-2.6" r="2.7" fill="#fff" stroke="#1d3f7a" stroke-width=".8"/><circle cx="5.8" cy="-2.4" r="1.5" fill="#222"/>`}
      </g>
      ${puff(c, [20, -42], '#6ad0ff', '#e6f8ff')}`;
  }

  function dragonair(c) {
    const s = Math.sin(c.f * 0.07), s2 = Math.sin(c.f * 0.07 + 1.3);
    const body = `M-31,${f1(-3 + s)} Q-23,${f1(1 + s)} -17,-7 Q-11,-13 -5,-8 Q2,-3 3,-15 Q${f1(3 + s2)},-26 ${f1(7 + s2)},-33`;
    const hx = 11 + s2 * 1.3, hy = -39 + s2 * 0.8;
    return `
      <path d="${body}" fill="none" stroke="#2a4f9a" stroke-width="11" stroke-linecap="round"/>
      <path d="${body}" fill="none" stroke="url(#gDrai)" stroke-width="8.8" stroke-linecap="round"/>
      <path d="${body}" fill="none" stroke="#f2f6ff" stroke-width="3" stroke-linecap="round" stroke-dasharray="4 5" transform="translate(1.5 3)" opacity=".9"/>
      <circle cx="-31" cy="${f1(-3 + s)}" r="3.6" fill="#7ab4ff" stroke="#2a4f9a" stroke-width="1"/>
      <circle cx="-31.8" cy="${f1(-4 + s)}" r="1.2" fill="#fff"/>
      <circle cx="4" cy="-17" r="3" fill="#7ab4ff" stroke="#2a4f9a" stroke-width=".9"/><circle cx="3.4" cy="-17.8" r="1" fill="#fff"/>
      <g transform="translate(${f1(hx)} ${f1(hy)})">
        <path d="M-6,-3 Q-15,-12 -12,-1 Z" fill="#f2f6ff" stroke="#2a4f9a" stroke-width=".9" stroke-linejoin="round"/>
        <path d="M-3,-5 Q-10,-16 -7,-4 Z" fill="#f2f6ff" stroke="#2a4f9a" stroke-width=".9" stroke-linejoin="round"/>
        <ellipse cx="0" cy="0" rx="8.8" ry="7" fill="url(#gDrai)" stroke="#2a4f9a" stroke-width="1.3"/>
        <ellipse cx="2.4" cy="3" rx="6.4" ry="3.2" fill="#f2f6ff" opacity=".9"/>
        <path d="M-1,-6.6 L1.4,-12 L3.6,-6.6 Z" fill="#f2f6ff" stroke="#2a4f9a" stroke-width=".8" stroke-linejoin="round"/>
        ${c.blink ? `<path d="M2,-2.4 Q4.2,-0.8 6.4,-2.4" fill="none" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
                  : `<circle cx="4.6" cy="-2" r="2.6" fill="#fff" stroke="#2a4f9a" stroke-width=".7"/><circle cx="5.1" cy="-2" r="1.7" fill="#6a2a9a"/><circle cx="5.6" cy="-2.7" r=".6" fill="#fff"/>`}
        <path d="M5.4,3 Q8.6,3.6 8.8,1.4" fill="none" stroke="#2a4f9a" stroke-width=".9" stroke-linecap="round"/>
      </g>
      ${puff(c, [19, -39], '#8a5cff', '#d8c8ff')}`;
  }

  function onix(c) {
    const sw = Math.sin(c.f * 0.05) * 1.6;
    const seg = (x, y, r, k) => `<g transform="translate(${f1(x)} ${f1(y)})">
      <circle r="${r}" fill="url(#gRock)" stroke="#3c3c46" stroke-width="1.3"/>
      <path d="M${-r * 0.5},${-r * 0.2} l${r * 0.4},${r * 0.2} M${r * 0.1},${r * 0.4} l${r * 0.4},-${r * 0.1}" stroke="#4a4a56" stroke-width=".9" stroke-linecap="round" opacity=".7"/>
      <circle cx="${f1(-r * 0.35)}" cy="${f1(-r * 0.4)}" r="${f1(r * 0.28)}" fill="#fff" opacity=".28"/></g>`;
    return `
      <ellipse cx="-4" cy="1" rx="20" ry="3" fill="#000" opacity=".25"/>
      ${seg(-17, -8, 8.4)}${seg(-6, -9, 11)}${seg(2 + sw * 0.3, -21, 10.4)}${seg(-2 + sw * 0.6, -32, 10)}${seg(4 + sw, -43, 9.4)}
      <g transform="translate(${f1(13 + sw * 1.2)} -53)">
        <path d="M-6,-8 L-4,-17 L1,-9 L5,-16 L7,-7 Z" fill="url(#gRock)" stroke="#3c3c46" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-12,-1 Q-13,-10 -2,-11 Q11,-12 13,-2 Q12,8 0,9 Q-11,9 -12,-1 Z" fill="url(#gRock)" stroke="#3c3c46" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M-6,-6 l3,2 M4,-8 l3,1.4 M-2,5 l4,-1" stroke="#4a4a56" stroke-width=".9" stroke-linecap="round" opacity=".7"/>
        ${c.blink ? `<path d="M0,-1.2 L6,-1.2" stroke="#222" stroke-width="1.4" stroke-linecap="round"/>`
                  : `<ellipse cx="3.6" cy="-1.6" rx="2.5" ry="1.9" fill="#111"/><circle cx="4.2" cy="-2.2" r=".7" fill="#fff"/><path d="M0,-5 L7,-2.6" stroke="#3c3c46" stroke-width="1.6" stroke-linecap="round"/>`}
        <path d="M3,4.6 Q8,5.4 11,3" fill="none" stroke="#3c3c46" stroke-width="1.2" stroke-linecap="round"/>
      </g>
      ${puff(c, [18, -48], '#b8a898', '#e8e0d0')}`;
  }


  // ---------- Pokémon de Kanto adicionais (no mesmo estilo dos demais) ----------
  function jigglypuff(c) {
    const sq = 1 + Math.sin(c.f * 0.07 + c.x) * 0.012;
    return feet(c.step, 'url(#gPink)', '#9a4a6a', 6) + `
    <g transform="translate(0 ${f1(c.bob)}) scale(1 ${sq.toFixed(3)})">
      <path d="M-8,-27 L-11,-38 L-2,-30 Z" fill="url(#gPink)" stroke="#9a4a6a" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-7.6,-29 L-9.4,-35 L-4,-30.4 Z" fill="#7a5468"/>
      <path d="M4,-30 L9,-39 L11.6,-26 Z" fill="url(#gPink)" stroke="#9a4a6a" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M5.6,-30 L8.8,-36 L9.8,-28 Z" fill="#7a5468"/>
      <ellipse cx="0" cy="-16" rx="14.6" ry="14" fill="url(#gPink)" stroke="#9a4a6a" stroke-width="1.3"/>
      <ellipse cx="3" cy="-9" rx="8.6" ry="6.4" fill="#ffe8f0" opacity=".55"/>
      <ellipse cx="9" cy="-12.5" rx="4" ry="2.8" fill="url(#gPink)" stroke="#9a4a6a" stroke-width="1"/>
      <path d="M-1,-27.6 C-10,-30 -9,-37 -2,-35.6 C3,-34.6 2,-30.4 -1.2,-31.4 C-3.4,-32 -2.2,-34 -0.4,-33.6" fill="none" stroke="#9a4a6a" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M-1,-27.6 C-10,-30 -9,-37 -2,-35.6 C3,-34.6 2,-30.4 -1.2,-31.4 C-3.4,-32 -2.2,-34 -0.4,-33.6" fill="none" stroke="#f59cbc" stroke-width="1.5" stroke-linecap="round"/>
      ${eye(1.6, -18.6, 4.2, '#1f8f9a', c.blink)}${eye(10, -18.2, 3.7, '#1f8f9a', c.blink)}
      <path d="M6,-11 Q8.6,-9.4 11,-11.4" fill="none" stroke="#9a4a6a" stroke-width="1.1" stroke-linecap="round"/>
      <ellipse cx="-6.4" cy="-13.4" rx="2.6" ry="1.5" fill="#ff7aa0" opacity=".5"/>
      ${puff(c, [13, -22], '#ffb3d0', '#fff0f6')}
    </g>`;
  }

  function beedrill(c) {
    const fl = (c.flap || c.breath > 0) ? 0.95 : 0.6, w = Math.sin(c.f * fl) * 26;
    const hv = Math.sin(c.f * 0.07) * 1.6, atk = c.breath > 0 ? 8 : 0;
    return `
      <ellipse cx="-1" cy=".5" rx="${f1(9 - hv * 0.5)}" ry="2.2" fill="#000" opacity=".2"/>
      <g transform="translate(0 ${f1(-18 + hv)})">
        <g transform="translate(-4 -6) rotate(${f1(-30 + w)})"><ellipse cx="-4" cy="-13" rx="6" ry="14" fill="url(#gWing)" stroke="#6a7aa0" stroke-width="1.1" opacity=".92"/></g>
        <g transform="translate(-3 -4) rotate(${f1(-56 + w * 0.8)})"><ellipse cx="-3" cy="-9" rx="4.4" ry="9.5" fill="url(#gWing)" stroke="#6a7aa0" stroke-width="1" opacity=".85"/></g>
        <path d="M-1,15 L1,26 L3.4,15 Z" fill="#e8e8ee" stroke="#4a3a2a" stroke-width="1" stroke-linejoin="round"/>
        <ellipse cx="0" cy="6" rx="7.2" ry="11.4" fill="url(#gBee)" stroke="#5a3a08" stroke-width="1.2"/>
        <path d="M-6.8,3 Q0,6.4 6.8,3 L6.4,7 Q0,10.4 -6.4,7 Z M-5.8,11 Q0,14.4 5.8,11 L4.6,14 Q0,16.6 -4.6,14 Z" fill="#2c2433"/>
        <ellipse cx="6" cy="-1" rx="3" ry="2.4" fill="#e8e8ee" stroke="#4a3a2a" stroke-width="1" transform="rotate(30 6 -1)"/>
        <path d="M5,-1 L${f1(15 + atk)},${f1(-2.4 - atk * 0.2)} L6.4,2 Z" fill="#f4f4f8" stroke="#4a3a2a" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-1,6 L-8,10 L-3,13 Z" fill="#e8e8ee" stroke="#4a3a2a" stroke-width="1" stroke-linejoin="round" opacity=".9"/>
        <path d="M-2,-12 L-6,-20 M3,-12.4 L7,-20.4" fill="none" stroke="#4a3a2a" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="1.6" cy="-8" r="9" fill="url(#gBee)" stroke="#5a3a08" stroke-width="1.3"/>
        ${c.blink ? `<path d="M0,-9 Q3,-7.4 6,-9" fill="none" stroke="#222" stroke-width="1.2" stroke-linecap="round"/>`
                  : `<ellipse cx="-2.4" cy="-8.6" rx="3.2" ry="4.4" fill="#e5384e" stroke="#7a1028" stroke-width=".9"/><ellipse cx="5.6" cy="-8.4" rx="3.2" ry="4.4" fill="#e5384e" stroke="#7a1028" stroke-width=".9"/><circle cx="-3.2" cy="-10.2" r="1" fill="#fff"/><circle cx="4.8" cy="-10" r="1" fill="#fff"/>`}
        <path d="M-1,-2.4 Q2,-1 4.6,-2.6" fill="none" stroke="#5a3a08" stroke-width="1" stroke-linecap="round"/>
        ${puff(c, [15, -2], '#c783e4', '#f0cef6')}
      </g>`;
  }

  function dugtrio(c) {
    const b = k => Math.sin(c.f * 0.08 + k) * 1.4 + (c.breath > 0 ? -3 : 0);
    const head = (x, top, k, r) => `<g transform="translate(${x} ${f1(b(k))})">
      <path d="M${-r},-2 L${-r},${top + r} Q${-r},${top} 0,${top} Q${r},${top} ${r},${top + r} L${r},-2 Z" fill="url(#gTan)" stroke="#5a3a1c" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M${-r + 2.4},${top + 4} Q${-r + 3},${top + 1.4} ${-r + 6.4},${top + 1.4}" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
      ${c.blink ? `<path d="M-3.6,${top + r * 0.7} h2.6 M1.6,${top + r * 0.7} h2.6" stroke="#222" stroke-width="1.1" stroke-linecap="round"/>`
                : `<circle cx="-2.4" cy="${top + r * 0.7}" r="1.5" fill="#222"/><circle cx="2.8" cy="${top + r * 0.7}" r="1.5" fill="#222"/><circle cx="-2" cy="${f1(top + r * 0.7 - 0.5)}" r=".45" fill="#fff"/><circle cx="3.2" cy="${f1(top + r * 0.7 - 0.5)}" r=".45" fill="#fff"/>`}
      <ellipse cx="0.6" cy="${top + r * 1.2}" rx="3.6" ry="2.4" fill="#e8a09a" stroke="#8a4a40" stroke-width=".8"/></g>`;
    return `
      <ellipse cx="0" cy="1" rx="19" ry="4.4" fill="#6b4a2a" opacity=".55"/>
      ${head(-13, -23, 0.8, 6.8)}${head(14, -26, 2.4, 7)}${head(0, -34, 4.2, 8)}
      <path d="M-20,1 Q-14,-6 -6,-4 Q0,-9 7,-4 Q15,-7 20,1 Z" fill="url(#gBrown)" stroke="#5a3a1c" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="-14" cy="-1.4" r="1.2" fill="#7f5328"/><circle cx="12" cy="-1.8" r="1.4" fill="#7f5328"/><circle cx="2" cy="-1" r="1" fill="#7f5328"/>
      ${puff(c, [9, -27], '#c8a070', '#f0e0c0')}`;
  }

  function exeggutor(c) {
    const sw = Math.sin(c.f * 0.06) * 1.4;
    const face = (x, y, r, k) => `<g transform="translate(${f1(x)} ${f1(y)})">
      <circle r="${r}" fill="url(#gCoco)" stroke="#7a6230" stroke-width="1.2"/>
      <path d="M${-r * 0.7},${-r * 0.5} Q${-r * 0.3},${-r * 0.95} ${r * 0.2},${-r * 0.8}" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".5"/>
      ${c.blink ? `<path d="M${-r * 0.55},${-r * 0.1} h${r * 0.4} M${r * 0.15},${-r * 0.1} h${r * 0.4}" stroke="#222" stroke-width="1" stroke-linecap="round"/>`
                : `<ellipse cx="${f1(-r * 0.32)}" cy="${f1(-r * 0.1)}" rx="${f1(r * 0.2)}" ry="${f1(r * 0.28)}" fill="#222"/><ellipse cx="${f1(r * 0.36)}" cy="${f1(-r * 0.1)}" rx="${f1(r * 0.2)}" ry="${f1(r * 0.28)}" fill="#222"/><circle cx="${f1(-r * 0.27)}" cy="${f1(-r * 0.22)}" r=".5" fill="#fff"/><circle cx="${f1(r * 0.41)}" cy="${f1(-r * 0.22)}" r=".5" fill="#fff"/>`}
      <path d="M${-r * 0.4},${r * 0.35} Q0,${r * 0.75 + k} ${r * 0.45},${r * 0.35}" fill="none" stroke="#7a4a30" stroke-width="1" stroke-linecap="round"/></g>`;
    return feet(c.step, 'url(#gBrown)', '#5a3a1c', 5) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-4.6,-3 Q-5.6,-16 -4.2,-27 L4.2,-27 Q5.6,-16 4.6,-3 Z" fill="url(#gBrown)" stroke="#5a3a1c" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-5,-10 Q0,-8 5,-10 M-4.8,-16.4 Q0,-14.4 4.8,-16.4 M-4.4,-22.6 Q0,-20.6 4.4,-22.6" fill="none" stroke="#5a3a1c" stroke-width=".9" opacity=".7"/>
      <g transform="rotate(${f1(sw * 2)} 0 -27)">
        <path d="M-1,-38 C-12,-44 -22,-42 -26,-34 C-17,-37 -9,-35 -2,-33 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1" stroke-linejoin="round"/>
        <path d="M1,-39 C8,-49 19,-50 25,-42 C16,-43 9,-39 3,-34 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1" stroke-linejoin="round"/>
        <path d="M-2,-40 C-9,-47 -12,-52 -10,-56 C-4,-52 0,-47 1,-40 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width="1" stroke-linejoin="round"/>
        ${face(-8.4, -31.4, 7.4, 0)}${face(8.8, -31.6, 7.6, 0.4)}${face(0.4, -36.6, 8.2, 0.8)}
      </g>
      ${puff(c, [12, -29], '#e8a8f0', '#fff0ff')}
    </g>`;
  }

  function snorlax(c) {
    const br = Math.sin(c.f * 0.045) * 0.9;
    return `
      <ellipse cx="0" cy=".5" rx="21" ry="3.2" fill="#000" opacity=".22"/>
      <ellipse cx="-9.4" cy="-3.4" rx="7.4" ry="4.4" fill="url(#gCream)" stroke="#2f5868" stroke-width="1.2"/>
      <ellipse cx="9.6" cy="-3.4" rx="7.4" ry="4.4" fill="url(#gCream)" stroke="#2f5868" stroke-width="1.2"/>
      <g transform="translate(0 ${f1(c.bob)}) scale(1 ${(1 + br * 0.012).toFixed(3)})">
        <ellipse cx="0" cy="-17.4" rx="19" ry="16" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.4"/>
        <ellipse cx="1.6" cy="-14.4" rx="12.4" ry="11.6" fill="url(#gCream)" stroke="#b8a878" stroke-width=".8"/>
        <path d="M-17,-22 Q-23,-18 -19,-9 Q-15,-9 -13,-13 Z" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M14,-24 Q22,-21 19,-11 Q14,-10 11,-15 Z" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-9,-30 L-10.6,-40 L-3,-34.6 Z" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M7,-34.6 L13.4,-40.6 L13.6,-29.6 Z" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.2" stroke-linejoin="round"/>
        <ellipse cx="2.4" cy="-27.6" rx="12.6" ry="9.8" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.4"/>
        <path d="M-6,-30 Q2,-37 11,-31 L11,-26 Q2,-31 -6,-26 Z" fill="#2f5868" opacity=".28"/>
        <ellipse cx="4.6" cy="-25.2" rx="9.6" ry="7" fill="url(#gCream)" stroke="#b8a878" stroke-width=".8"/>
        ${c.blink ? `<path d="M-0.4,-26.4 h4.2 M7.4,-26.4 h4.2" stroke="#222" stroke-width="1.3" stroke-linecap="round"/>`
                  : `<path d="M-0.6,-27.4 L4,-26.6 M7.6,-26.6 L12,-27.6" stroke="#222" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="2.2" cy="-25.6" rx="1.4" ry="1" fill="#222"/><ellipse cx="9.8" cy="-25.6" rx="1.4" ry="1" fill="#222"/>`}
        <ellipse cx="6.2" cy="-21.4" rx="3.6" ry="1.5" fill="#fff" opacity=".0"/>
        <path d="M2.4,-21.6 Q6.4,-19 11,-21.6" fill="none" stroke="#5a4a3a" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M3.4,-21.4 L4,-19 L5.2,-21 M8.6,-21.4 L9,-19.2 L10.2,-21.6" fill="#fff" stroke="#6a5a4a" stroke-width=".6" stroke-linejoin="round"/>
        <ellipse cx="9.6" cy="-8.4" rx="5" ry="3.6" fill="url(#gSnor)" stroke="#2f5868" stroke-width="1.1" transform="rotate(${f1(c.breath > 0 ? -30 : 0)} 9.6 -8.4)"/>
        <ellipse cx="8.8" cy="-8.8" rx="2.6" ry="2" fill="url(#gCream)"/>
      </g>
      ${puff(c, [12, -24], '#e8e0c8', '#ffffff')}`;
  }

  const BODIES = { charmander, bulbasaur, squirtle, pikachu, rattata, pidgey, caterpie, starmie, magikarp, dratini,
    charmeleon, ivysaur, wartortle, raticate, pidgeotto, butterfree, gyarados, dragonair, onix,
    jigglypuff, beedrill, dugtrio, exeggutor, snorlax };

  // ---------- Pokébola ----------
  function ball(r, rot = 0, open = 0, col = '#e63b3b') {
    const gap = open ? `<circle r="${f1(r * 1.4)}" fill="url(#zap)" opacity="${open}"/>` : '';
    return `${gap}<g transform="rotate(${f1(rot)})">
      <circle r="${r}" fill="#fff" stroke="#222" stroke-width="${f1(Math.max(1, r * 0.18))}"/>
      <path d="M${-r},0 A${r},${r} 0 0 1 ${r},0 Z" fill="${col}" stroke="#222" stroke-width="${f1(Math.max(1, r * 0.1))}" stroke-linejoin="round"/>
      <path d="M${f1(-r * 0.7)},${f1(-r * 0.5)} A${f1(r * 0.85)},${f1(r * 0.85)} 0 0 1 ${f1(-r * 0.1)},${f1(-r * 0.85)}" fill="none" stroke="#fff" stroke-width="${f1(Math.max(.8, r * 0.14))}" stroke-linecap="round" opacity=".6"/>
      <rect x="${-r}" y="${f1(-r * 0.13)}" width="${2 * r}" height="${f1(r * 0.26)}" fill="#222"/>
      <circle r="${f1(r * 0.34)}" fill="#fff" stroke="#222" stroke-width="${f1(Math.max(1, r * 0.14))}"/>
      <circle r="${f1(r * 0.14)}" fill="#ddd"/></g>`;
  }

  // ---------- Treinador (intro) ----------
  function trainer(c) {
    const walk = c.step || 0;
    return `
      <ellipse cx="0" cy=".5" rx="13" ry="3" fill="#000" opacity=".25"/>
      <rect x="-7" y="-20" width="5.4" height="19" rx="2" fill="#33415c" transform="rotate(${f1(walk * 3)} -4 -20)"/>
      <rect x="1.5" y="-20" width="5.4" height="19" rx="2" fill="#33415c" transform="rotate(${f1(-walk * 3)} 4 -20)"/>
      <path d="M-9,-1 Q-9,-4 -3,-4 L-1,-1 Z M0,-1 Q0,-4 6,-4 L9,-1 Z" fill="#e63b3b" stroke="#6a1818" stroke-width=".8"/>
      <g transform="translate(0 ${f1(c.bob || 0)})">
        <path d="M-9,-21 L-8,-40 Q0,-45 8,-40 L9,-21 Z" fill="#2f6fd0" stroke="#173a78" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M-2,-42 L-1,-22 L3,-22 L3,-42 Z" fill="#e9eefc" opacity=".85"/>
        <rect x="-9" y="-24" width="18" height="3" fill="#173a78"/>
        <g transform="translate(-1 -38) rotate(${f1(c.armBack)})">
          <path d="M0,0 L0,15" stroke="#173a78" stroke-width="6.4" stroke-linecap="round"/>
          <path d="M0,0 L0,15" stroke="#2f6fd0" stroke-width="4.6" stroke-linecap="round"/>
          <circle cy="16" r="3" fill="#f1c9a0" stroke="#8a5a3a" stroke-width=".7"/>
          ${c.hold ? `<g transform="translate(0 20)">${ball(5.2, c.f * 4)}</g>` : ''}
        </g>
        <circle cx="1" cy="-48" r="7.6" fill="#f1c9a0" stroke="#8a5a3a" stroke-width="1"/>
        <path d="M-7,-49 Q-7,-58 2,-58 Q9,-58 9,-50 Z" fill="#e63b3b" stroke="#6a1818" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M6,-51 L15,-50 L7,-47.5 Z" fill="#c42b2b" stroke="#6a1818" stroke-width=".9" stroke-linejoin="round"/>
        <circle cx="1.5" cy="-54" r="2.4" fill="#fff" stroke="#6a1818" stroke-width=".7"/>
        <path d="M-7.4,-47 Q-9,-42 -6,-41" fill="none" stroke="#2a1a10" stroke-width="2" stroke-linecap="round"/>
        <circle cx="4.5" cy="-47.5" r="1.1" fill="#222"/>
        <path d="M3.4,-43.6 Q5.5,-42.6 7,-44" fill="none" stroke="#8a3a2a" stroke-width=".9" stroke-linecap="round"/>
      </g>`;
  }
  function trainerFront(c) {   // braço que arremessa, desenhado por cima do corpo
    return `<g transform="translate(0 ${f1(c.bob || 0)})"><g transform="translate(2 -38) rotate(${f1(c.arm)})">
      <path d="M0,0 L0,15" stroke="#173a78" stroke-width="6.8" stroke-linecap="round"/>
      <path d="M0,0 L0,15" stroke="#2f6fd0" stroke-width="5" stroke-linecap="round"/>
      <circle cy="16.5" r="3.2" fill="#f1c9a0" stroke="#8a5a3a" stroke-width=".7"/>
      ${c.hold ? `<g transform="translate(0 21)">${ball(5.4, c.f * 4)}</g>` : ''}
    </g></g>`;
  }

  // ---------- Decoração de terreno ----------
  function decor(d) {
    let s = '';
    switch (d.type) {
      case 'pine':
        s = `<rect x="-1.6" y="-8" width="3.2" height="8" fill="#5b3a1e"/>
             <path d="M0,-36 L-9,-18 L-5,-18 L-12,-6 L12,-6 L5,-18 L9,-18 Z" fill="#2f7d3a" stroke="#1d4f25" stroke-width="1" stroke-linejoin="round"/>
             <path d="M0,-36 L-4,-27 L1,-27 Z" fill="#4fa35a" opacity=".7"/>`; break;
      case 'tree':
        s = `<path d="M-2,0 L-1.5,-15 L1.5,-15 L2,0 Z" fill="#6b4423"/>
             <circle cx="-7" cy="-17" r="7" fill="url(#gTree)"/><circle cx="7" cy="-17" r="7" fill="url(#gTree)"/>
             <circle cx="0" cy="-23" r="10" fill="url(#gTree)"/>`; break;
      case 'rock':
        s = `<path d="M-10,0 Q-11,-7 -4,-9 Q3,-12 8,-6 Q11,-2 10,0 Z" fill="#8c8f94" stroke="#55585c" stroke-width="1"/>
             <path d="M-5,-7 Q0,-9.5 4,-7" fill="none" stroke="#c4c7cc" stroke-width="1.2" stroke-linecap="round"/>`; break;
      case 'bush':
        s = `<circle cx="-6" cy="-4" r="5.5" fill="url(#gTree)"/><circle cx="6" cy="-4" r="5.5" fill="url(#gTree)"/>
             <circle cx="0" cy="-7" r="7" fill="url(#gTree)"/>`; break;
      case 'palm':
        s = `<path d="M-1,0 Q-5,-18 3,-34 L6,-33 Q-1,-18 3,0 Z" fill="#a8743a" stroke="#6b4423" stroke-width="1"/>
             <path d="M-3,-8 l7,-1 M-4,-14 l7,-1 M-2,-20 l7,-1 M0,-26 l6,-1" stroke="#6b4423" stroke-width=".8"/>
             <g transform="translate(4 -34)" fill="#3fa24a" stroke="#1f6a2a" stroke-width=".9" stroke-linejoin="round">
               <path d="M0,0 Q-12,-10 -24,-4 Q-12,-4 0,0 Z"/><path d="M0,0 Q12,-11 25,-3 Q12,-4 0,0 Z"/>
               <path d="M0,0 Q-8,-16 -17,-14 Q-8,-9 0,0 Z"/><path d="M0,0 Q8,-17 18,-13 Q8,-9 0,0 Z"/>
               <path d="M0,0 Q-14,2 -21,10 Q-9,3 0,0 Z"/><path d="M0,0 Q14,2 21,9 Q9,3 0,0 Z"/>
               <circle cx="-2" cy="2" r="2.6" fill="#7a4a1e" stroke="none"/><circle cx="2.5" cy="2.5" r="2.6" fill="#7a4a1e" stroke="none"/>
             </g>`; break;
      case 'stalag':
        s = `<path d="M-8,0 L-3,-20 L0,-33 L3,-18 L9,0 Z" fill="#6a6280" stroke="#3a3350" stroke-width="1" stroke-linejoin="round"/>
             <path d="M0,-33 L-3,-20 L-1,-18 Z" fill="#a49cbc" opacity=".6"/>
             <path d="M7,0 L10,-12 L13,0 Z" fill="#5a5270" stroke="#3a3350" stroke-width=".8"/>`; break;
      case 'crystal':
        s = `<circle cy="-8" r="14" fill="${d.col}" opacity=".18"/>
             <path d="M-7,0 L-6,-14 L-3,-19 L0,-14 L0,0 Z" fill="${d.col}" stroke="#fff" stroke-opacity=".7" stroke-width=".9" stroke-linejoin="round"/>
             <path d="M0,0 L0,-22 L3.5,-28 L7,-21 L6,0 Z" fill="${d.col}" stroke="#fff" stroke-opacity=".7" stroke-width=".9" stroke-linejoin="round"/>
             <path d="M3.5,-28 L1.5,-20 L3,-3" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6" stroke-linecap="round"/>
             <path d="M6,0 L8,-9 L12,-5 L11,0 Z" fill="${d.col}" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>`; break;
      default:
        s = `<path d="M0,0 Q1,-4 0,-8" fill="none" stroke="#3f8a2a" stroke-width="1.2"/>
             <circle cx="-2" cy="-9" r="1.9" fill="${d.col}"/><circle cx="2" cy="-9" r="1.9" fill="${d.col}"/>
             <circle cx="0" cy="-11" r="1.9" fill="${d.col}"/><circle cx="0" cy="-7" r="1.9" fill="${d.col}"/>
             <circle cx="0" cy="-9" r="1.3" fill="#ffcf33"/>`;
    }
    return `<g transform="translate(${d.x} ${f1(d.base + 1)}) scale(${d.s.toFixed(2)})">${s}</g>`;
  }

  // ---------- Cenário da cidade (fase inicial) ----------
  // casa com terraço, muro, lagoa, poste e árvores; tudo estático
  function cityStatic(pond) {
    const bricks = (x, y, w, h) => {
      let s = '';
      for (let j = 0; j < h / 9; j++) {
        s += `<line x1="${x}" y1="${y + j * 9}" x2="${x + w}" y2="${y + j * 9}" stroke="#7a3a22" stroke-width=".8"/>`;
        for (let i = (j % 2) * 9; i < w; i += 18) s += `<line x1="${x + i}" y1="${y + j * 9}" x2="${x + i}" y2="${y + j * 9 + 9}" stroke="#7a3a22" stroke-width=".8"/>`;
      }
      return s;
    };
    const lamp = x => `<rect x="${x - 1.5}" y="350" width="3" height="70" fill="#4a4f5a"/>
      <path d="M${x - 8},350 Q${x},340 ${x + 8},350 Z" fill="#4a4f5a"/><circle cx="${x}" cy="352" r="3.4" fill="#ffe9a0"/>
      <circle cx="${x}" cy="352" r="14" fill="url(#sunGlow)" opacity=".6"/>`;
    const tree = (x, s) => `<g transform="translate(${x} 420) scale(${s})"><rect x="-2.5" y="-24" width="5" height="24" fill="#6b4423"/>
      <circle cx="-9" cy="-30" r="11" fill="url(#gTree)"/><circle cx="9" cy="-30" r="11" fill="url(#gTree)"/><circle cx="0" cy="-40" r="14" fill="url(#gTree)"/></g>`;
    let water = '';
    if (pond) {
      water = `<path d="${pond}" fill="#3a9ad8"/><path d="${pond}" fill="url(#seaFront)" opacity=".55"/>`;
    }
    return `
      <rect x="0" y="418" width="800" height="3" fill="#6f7580" opacity=".35"/>
      <g>
        <rect x="124" y="360" width="104" height="60" fill="#f3e6c8" stroke="#8a7650" stroke-width="1.2"/>
        <path d="M118,360 L134,340 L218,340 L234,360 Z" fill="#d84c3a" stroke="#7a2418" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M118,360 h116 v6 h-116 Z" fill="#fff"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${118 + i * 19.3}" y="360" width="9.7" height="6" fill="#d84c3a"/>`).join('')}
        <rect x="136" y="372" width="30" height="24" rx="2" fill="#9fd8f0" stroke="#4a6a7a" stroke-width="1.2"/>
        <path d="M151,372 v24 M136,384 h30" stroke="#4a6a7a" stroke-width="1"/>
        <rect x="180" y="378" width="30" height="42" rx="2" fill="#7a4a2a" stroke="#3a2210" stroke-width="1.2"/>
        <circle cx="203" cy="400" r="1.8" fill="#ffd34d"/>
        <rect x="150" y="344" width="44" height="12" rx="3" fill="#fff" stroke="#7a2418" stroke-width="1"/>
        <circle cx="163" cy="350" r="3.6" fill="#e63b3b"/><rect x="170" y="347" width="18" height="2" fill="#7a2418" opacity=".6"/><rect x="170" y="351" width="12" height="2" fill="#7a2418" opacity=".6"/>
      </g>
      ${tree(40, 1.1)}${tree(310, 0.95)}${lamp(268)}${lamp(540)}
      <g>
        <rect x="468" y="335" width="18" height="85" fill="#c4683e" stroke="#6a2e18" stroke-width="1.3"/>
        ${bricks(468, 335, 18, 85)}
        <rect x="464" y="329" width="26" height="8" rx="2" fill="#9a4a2a" stroke="#5a2412" stroke-width="1.2"/>
      </g>
      ${water}
      <path d="M606,${pond ? 420 : 420} q-8,-3 -3,-8 q6,-4 10,3 Z M702,420 q8,-3 3,-8 q-6,-4 -10,3 Z" fill="#9aa0a8" stroke="#555a62" stroke-width="1"/>
      <g>
        <rect x="700" y="292" width="100" height="128" fill="#efe1c0" stroke="#8a7650" stroke-width="1.3"/>
        <rect x="694" y="284" width="106" height="9" rx="2" fill="#b5503a" stroke="#6a2418" stroke-width="1.3"/>
        <rect x="694" y="272" width="6" height="14" fill="#b5503a" stroke="#6a2418" stroke-width="1"/>
        <rect x="716" y="310" width="26" height="30" rx="2" fill="#9fd8f0" stroke="#4a6a7a" stroke-width="1.2"/>
        <rect x="756" y="310" width="26" height="30" rx="2" fill="#9fd8f0" stroke="#4a6a7a" stroke-width="1.2"/>
        <path d="M729,310 v30 M716,325 h26 M769,310 v30 M756,325 h26" stroke="#4a6a7a" stroke-width="1"/>
        <rect x="716" y="358" width="26" height="30" rx="2" fill="#9fd8f0" stroke="#4a6a7a" stroke-width="1.2"/>
        <rect x="754" y="364" width="30" height="56" rx="2" fill="#7a4a2a" stroke="#3a2210" stroke-width="1.2"/>
        <circle cx="777" cy="394" r="1.8" fill="#ffd34d"/>
        <rect x="778" y="268" width="14" height="16" fill="#9aa0a8" stroke="#555a62" stroke-width="1"/>
      </g>`;
  }

  MS.Art = {
    draw(sp, c) { return BODIES[sp](c); },
    ball, trainer, trainerFront, decor, cityStatic,
    typeDots(types, cx, y, colors) {      // bolinhas coloridas dos tipos, centralizadas em cx
      const n = types.length, w = n * 8;
      return types.map((t, i) =>
        `<circle cx="${f1(cx - w / 2 + 4 + i * 8)}" cy="${y}" r="3.1" fill="${colors[t]}" stroke="#000" stroke-width=".7"/>`).join('');
    }
  };
})();
