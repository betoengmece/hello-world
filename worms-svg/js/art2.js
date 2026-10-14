// Arte em SVG da segunda leva de Pokémon (Fantasma, Gelo, Lutador e outros). Mesmo estilo do art.js:
// pés em y=0, virado para +x, contorno escuro fino e gradiente radial.
(() => {
  const MS = window.MS, A = MS.Art, { eye, feet, puff, f1 } = A.h;

  // ---------- Geodude ----------
  function geodude(c) {
    const lift = c.breath > 0 ? -10 : 0;
    const fingers = (x, y) => `<circle cx="${x - 1.6}" cy="${y - 4.2}" r="1.6" fill="url(#gGeo)" stroke="#4a463e" stroke-width=".9"/><circle cx="${x + 1.8}" cy="${y - 4}" r="1.6" fill="url(#gGeo)" stroke="#4a463e" stroke-width=".9"/>`;
    return `<ellipse cx="0" cy=".5" rx="15" ry="2.6" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(c.bob)})">
      <ellipse cx="-12.6" cy="-9" rx="5.2" ry="4.4" fill="url(#gGeo)" stroke="#4a463e" stroke-width="1.2"/>
      <path d="M-13,-8 l-4.5,-1.5" stroke="#4a463e" stroke-width="1" opacity="0"/>
      <path d="M-12,-8 Q-14.5,-19 -6,-23 Q2,-26.6 10,-21 Q15.4,-16 13.6,-8 Q10.6,-1 0,-1 Q-10,-1 -12,-8 Z" fill="url(#gGeo)" stroke="#4a463e" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M-8,-15 l3,2 l-1,3 M-5,-5.4 l4,-1.2 M6,-6 l3,1.4 M-2,-23 l2,2.4" fill="none" stroke="#6a665e" stroke-width="1" stroke-linecap="round"/>
      <path d="M-6,-21 Q-1,-24.6 5,-23.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".45"/>
      <path d="M0.6,-19.4 L6,-17 M8,-17 L13,-19.2" stroke="#2e2a24" stroke-width="2.2" stroke-linecap="round"/>
      ${eye(4.2, -14.4, 2.3, '#222', c.blink)}${eye(10, -14.4, 2.3, '#222', c.blink)}
      <ellipse cx="7.2" cy="-10.4" rx="2" ry="1.3" fill="#7e7a70"/>
      <path d="M3.4,-7.2 Q7.4,-4.6 11.4,-7.2" fill="none" stroke="#3a362e" stroke-width="1.1" stroke-linecap="round"/>
      <g transform="translate(0 ${f1(lift)})"><ellipse cx="14.6" cy="-9.4" rx="5.6" ry="4.8" fill="url(#gGeo)" stroke="#4a463e" stroke-width="1.2"/>${fingers(15, -9.4)}</g>
      ${puff(c, [12, -14], '#c8b8a0', '#f4ecd8')}
    </g>`;
  }

  // ---------- Zubat e Golbat ----------
  function bat(c, o) {
    const s = o.s, hv = Math.sin(c.f * 0.09) * 1.8;
    const fl = (c.flap || c.breath > 0) ? 0.5 : 0.3, w = Math.sin(c.f * fl) * 20;
    const wing = (sx, rot, sc) => `<g transform="translate(${sx * 4 * s} -2) scale(${sx * sc} ${sc}) rotate(${f1(rot)})">
      <path d="M0,0 Q-8,-20 -26,-16 Q-22,-10 -25,-4 Q-19,-6 -16,2 Q-11,-2 -8,5 Q-3,2 0,6 Z" fill="${o.wing}" stroke="${o.line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-3,0 L-20,-12 M-3,1 L-17,-2 M-3,2 L-10,3" stroke="${o.line}" stroke-width=".8" opacity=".55" fill="none"/></g>`;
    return `<ellipse cx="0" cy=".5" rx="${f1(8 * s - hv * 0.4)}" ry="2" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(-25 * s + hv)}) scale(${s})">
      ${wing(-1, -10 - w, 1)}${wing(1, -10 - w, 0.88)}
      <path d="M-6,-6 L-8.4,-17 L-1,-9 Z M3,-9 L8,-18 L8.6,-5 Z" fill="${o.wing}" stroke="${o.line}" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="0" cy="0" rx="8.4" ry="9.4" fill="url(#gBat)" stroke="${o.line}" stroke-width="1.3"/>
      ${c.blink ? '' : `<ellipse cx="-1.4" cy="-3.6" rx="1.4" ry="1.7" fill="#2a2a50"/><ellipse cx="4.6" cy="-3.6" rx="1.4" ry="1.7" fill="#2a2a50"/>`}
      <path d="M-5.6,1 Q-0.6,${o.mouth} 6,1 Q0,${o.mouth - 3} -5.6,1 Z" fill="#c43a6a" stroke="${o.line}" stroke-width="1"/>
      <path d="M-4,1.4 L-3.2,${o.fang} L-2,1.6 M2.4,1.6 L3.4,${o.fang} L4.6,1.4" fill="#fff" stroke="${o.line}" stroke-width=".7" stroke-linejoin="round"/>
      ${o.big ? `<path d="M-6.4,2 L-6,${o.fang + 1} L-5,2.6 M5.4,2.6 L6.2,${o.fang + 1} L7,2" fill="#fff" stroke="${o.line}" stroke-width=".6"/>` : ''}
      ${puff(c, [8, 3], '#b45ac8', '#f0cef6')}
    </g>`;
  }
  const zubat = c => bat(c, { s: 0.8, wing: '#5b66c8', line: '#252a6a', mouth: 8, fang: 5.4 });
  const golbat = c => bat(c, { s: 1.02, wing: '#6a54c0', line: '#2a1f6a', mouth: 12, fang: 7, big: true });

  // ---------- Gastly e Gengar ----------
  function gastly(c) {
    const t = c.f * 0.07 + c.x, hv = Math.sin(t) * 2.2;
    let gas = '';
    for (let i = 0; i < 7; i++) {
      const a = t * 1.3 + i * 0.9, r = 11 + (i % 3) * 2.4;
      gas += `<circle cx="${f1(Math.cos(a) * r)}" cy="${f1(Math.sin(a * 0.8) * r * 0.9)}" r="${f1(3.4 + (i % 3) * 1.2)}" fill="#7a56b4" opacity="${(0.28 + (i % 2) * 0.12).toFixed(2)}"/>`;
    }
    return `<ellipse cx="0" cy=".5" rx="${f1(9 - hv * 0.5)}" ry="2" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(-23 + hv)})">
      ${gas}
      <circle r="13.4" fill="#9a7ac8" opacity=".22"/>
      <circle r="11.6" fill="url(#gBlack)" stroke="#120e22" stroke-width="1.3"/>
      <path d="M-8,-7 Q-3,-11 3,-10" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".28"/>
      <path d="M-1,-8 L5,-5.6 M9.4,-5.4 L14,-7.6" stroke="#120e22" stroke-width="2" stroke-linecap="round" opacity="0"/>
      ${c.blink ? `<path d="M-0.6,-2 h5 M7,-2 h5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`
                : `<ellipse cx="2" cy="-2.4" rx="3.2" ry="4" fill="#fff" stroke="#120e22" stroke-width=".8"/><ellipse cx="9.4" cy="-2.2" rx="2.8" ry="3.6" fill="#fff" stroke="#120e22" stroke-width=".8"/>
                   <circle cx="3.2" cy="-2.2" r="1.7" fill="#5a2a8a"/><circle cx="10.2" cy="-2" r="1.5" fill="#5a2a8a"/><circle cx="3.6" cy="-3" r=".6" fill="#fff"/>`}
      <path d="M-1.4,-6.6 L4.6,-5.8 M7.4,-5.6 L12.6,-7" stroke="#120e22" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M-1.6,4.4 Q5,12 12,4.2 Q5,7.2 -1.6,4.4 Z" fill="#d03a6a" stroke="#120e22" stroke-width="1"/>
      <path d="M2.4,9.4 Q5,12.6 7.6,9.4" fill="#ff7a9a" stroke="none"/>
      ${puff(c, [10, 4], '#9a7ac8', '#e0d0f8')}
    </g>`;
  }

  function gengar(c) {
    const sw = Math.sin(c.f * 0.05) * 0.6;
    return feet(c.step, 'url(#gGhost)', '#2a1848', 5) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-6,-19 L-15,-23 L-8,-14 Z M-8,-12 L-17,-12 L-8,-7 Z M-5,-25 L-12,-31 L-3,-23 Z" fill="url(#gGhost)" stroke="#2a1848" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-13" rx="11.4" ry="11.6" fill="url(#gGhost)" stroke="#2a1848" stroke-width="1.3"/>
      <ellipse cx="2.6" cy="-10" rx="6.4" ry="6.6" fill="#c8b0ec" opacity=".45"/>
      <ellipse cx="9.6" cy="-12" rx="4.4" ry="3.6" fill="url(#gGhost)" stroke="#2a1848" stroke-width="1.1" transform="rotate(${f1(c.breath > 0 ? -30 : 10 + sw * 4)} 9.6 -12)"/>
      <path d="M-9,-33 L-10.6,-47 L-2,-37 Z" fill="url(#gGhost)" stroke="#2a1848" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M6,-38 L12,-48 L15,-33 Z" fill="url(#gGhost)" stroke="#2a1848" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse cx="2.4" cy="-29" rx="13.2" ry="10.6" fill="url(#gGhost)" stroke="#2a1848" stroke-width="1.3"/>
      <path d="M-7,-34 Q0,-38.4 8,-35" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".3"/>
      ${c.blink ? `<path d="M1,-30.6 h5 M9,-30.4 h5" stroke="#ff4a5a" stroke-width="1.6" stroke-linecap="round"/>`
                : `<path d="M0.6,-33 L7,-30.4 L5.6,-27.4 L0.6,-29.6 Z" fill="#ff4a5a" stroke="#7a1028" stroke-width=".9" stroke-linejoin="round"/>
                   <path d="M16,-33 L9.6,-30.4 L11,-27.4 L15.6,-29.6 Z" fill="#ff4a5a" stroke="#7a1028" stroke-width=".9" stroke-linejoin="round"/>
                   <circle cx="4.4" cy="-30.4" r=".9" fill="#fff"/><circle cx="11.6" cy="-30.4" r=".9" fill="#fff"/>`}
      <path d="M-1,-24 Q8,-14 16.6,-24.4 Q8,-20.4 -1,-24 Z" fill="#fff" stroke="#2a1848" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M2,-22.6 l1,2.4 l1.6,-2.2 M7,-21.4 l1.2,2.4 l1.4,-2.4 M12,-22.6 l1,2 l1.2,-2.4" fill="none" stroke="#2a1848" stroke-width=".7"/>
      ${puff(c, [12, -24], '#b45ac8', '#f0cef6')}
    </g>`;
  }

  // ---------- Machop e Machamp ----------
  function machoid(c, o) {
    const s = o.s, fist = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gMach)" stroke="#38406a" stroke-width="1.1"/>`;
    const punch = c.breath > 0 ? 7 : 0;
    const arm = (x, y, ex, ey, w) => `<path d="M${x},${y} L${ex},${ey}" stroke="#38406a" stroke-width="${w + 2.4}" stroke-linecap="round"/><path d="M${x},${y} L${ex},${ey}" stroke="#8896c8" stroke-width="${w}" stroke-linecap="round"/>${fist(ex, ey, w * 0.62 + 1)}`;
    return feet(c.step, 'url(#gMach)', '#38406a', 5 * s) + `
    <g transform="translate(0 ${f1(c.bob)}) scale(${s})">
      ${arm(-6, -20, -14, -12, 4.6)}
      ${o.four ? arm(-5, -15, -13, -5, 4.2) : ''}
      <ellipse cx="0" cy="-14" rx="9.6" ry="10.6" fill="url(#gMach)" stroke="#38406a" stroke-width="1.3"/>
      <path d="M-5,-18 Q0,-16 5,-18 M-6,-14 Q0,-12 6,-14 M-5,-10 Q0,-8.4 5,-10" fill="none" stroke="#38406a" stroke-width=".9" opacity=".55"/>
      <path d="M-9.6,-8 Q0,-4.4 9.6,-8 L9.4,-4.4 Q0,-1 -9.4,-4.4 Z" fill="#e0433a" stroke="#7a1c14" stroke-width="1"/>
      <circle cx="0" cy="-5.6" r="2.2" fill="#ffd34d" stroke="#7a5a08" stroke-width=".8"/>
      <ellipse cx="2" cy="-29" rx="9.4" ry="8" fill="url(#gMach)" stroke="#38406a" stroke-width="1.3"/>
      <path d="M-5.4,-34 L-4,-39 L-1,-35 L1,-40 L3.6,-35 L7,-38.6 L7.4,-34" fill="#d34a6a" stroke="#7a1c40" stroke-width="1" stroke-linejoin="round"/>
      <path d="M-6,-30 L-9.4,-31.6 L-7,-27 Z" fill="#8896c8" stroke="#38406a" stroke-width="1" stroke-linejoin="round"/>
      <path d="M2,-32.6 L7,-31 M9,-31 L12.4,-32.6" stroke="#222" stroke-width="1.6" stroke-linecap="round"/>
      ${eye(5, -28.6, 2.7, '#222', c.blink)}${eye(10.6, -28.6, 2.3, '#222', c.blink)}
      <path d="M5.4,-23.6 Q8.6,-22 11.4,-23.8" fill="none" stroke="#38406a" stroke-width="1.1" stroke-linecap="round"/>
      ${arm(7, -18, 14 + punch, -18 - punch * 0.2, 5)}
      ${o.four ? arm(7, -13, 14 + punch, -9, 4.6) : ''}
      ${puff(c, [14, -18], '#ffe9b0', '#ffffff')}
    </g>`;
  }
  const machop = c => machoid(c, { s: 1, four: false });
  const machamp = c => machoid(c, { s: 1.22, four: true });

  // ---------- Growlithe e Arcanine ----------
  function canine(c, o) {
    const s = o.s, st = c.step * 0.8;
    const leg = (x, k) => `<path d="M${x},-9 L${f1(x + k)},-1.4" stroke="#7a3208" stroke-width="5.2" stroke-linecap="round"/><path d="M${x},-9 L${f1(x + k)},-1.4" stroke="#f08a22" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="${f1(x + k + 1)}" cy="-1.2" rx="3.2" ry="1.7" fill="#fff0c8" stroke="#7a3208" stroke-width=".9"/>`;
    return `<ellipse cx="-1" cy=".5" rx="${f1(15 * s)}" ry="2.6" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(c.bob)}) scale(${s})">
      <path d="M-13,-14 Q-24,-19 -22,-29 Q-18,-24 -11,-20 Z" fill="${o.tail}" stroke="#7a3208" stroke-width="1.2" stroke-linejoin="round"/>
      ${o.long ? `<path d="M6,-26 Q-8,-33 -18,-21 Q-9,-22 -6,-12 Q2,-12 8,-17 Z" fill="${o.mane}" stroke="#a87a2a" stroke-width="1.1" stroke-linejoin="round"/>` : ''}
      ${leg(-9, st)}${leg(-4.4, -st)}
      <ellipse cx="-2" cy="-14" rx="13.6" ry="8.6" fill="url(#gArc)" stroke="#7a3208" stroke-width="1.3"/>
      <ellipse cx="0" cy="-9.4" rx="10" ry="4.4" fill="#fff0c8" opacity=".92"/>
      <path d="M-8,-21 L-6,-15.6 M-3,-22 L-1.6,-16 M2,-21.6 L2.4,-16.6" stroke="#2a1608" stroke-width="2" stroke-linecap="round"/>
      ${leg(5, st)}${leg(9.6, -st)}
      <path d="M2,-19 Q6,-13 13,-15.6 Q15,-24 10,-27 Z" fill="${o.mane}" stroke="#a87a2a" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="10.4" cy="-21" rx="8" ry="7" fill="url(#gArc)" stroke="#7a3208" stroke-width="1.3"/>
      <path d="M5,-26 L3,-33.4 L9,-27.6 Z" fill="url(#gArc)" stroke="#7a3208" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M11,-27.4 L15,-34 L16.4,-25.4 Z" fill="url(#gArc)" stroke="#7a3208" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M6.6,-25 L5.6,-30 M13,-25.6 L14.6,-30" stroke="#2a1608" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="16.4" cy="-18.8" rx="4.8" ry="3.6" fill="#fff0c8" stroke="#7a3208" stroke-width="1"/>
      <ellipse cx="19.6" cy="-20" rx="1.6" ry="1.2" fill="#222"/>
      ${eye(11.4, -23, 2.5, '#222', c.blink)}
      <path d="M13.4,-16.4 Q16.4,-15 19,-16.6" fill="none" stroke="#7a3208" stroke-width="1" stroke-linecap="round"/>
      <path d="M15,-16.2 L15.8,-14 L16.8,-16 Z" fill="#fff" stroke="#7a3208" stroke-width=".5"/>
      ${puff(c, [20, -17], '#ff7a1a', '#fff3a0')}
    </g>`;
  }
  const growlithe = c => canine(c, { s: 1, mane: '#fff0c8', tail: '#fff0c8' });
  const arcanine = c => canine(c, { s: 1.34, mane: '#fff4d0', tail: '#fff4d0', long: true });

  // ---------- Seel e Lapras ----------
  function seel(c) {
    const fl = Math.sin(c.f * 0.1 + c.x) * 3 + (c.breath > 0 ? -6 : 0);
    return `<ellipse cx="0" cy=".5" rx="17" ry="2.8" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-14,-5 Q-24,-2 -22,-11 Q-18,-8 -13,-9 Z" fill="url(#gSeel)" stroke="#6a7e9c" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse cx="-1" cy="-9.4" rx="15.6" ry="9.2" fill="url(#gSeel)" stroke="#6a7e9c" stroke-width="1.3"/>
      <ellipse cx="3" cy="-3.6" rx="7.4" ry="3.6" fill="url(#gSeel)" stroke="#6a7e9c" stroke-width="1" transform="rotate(${f1(fl)} 3 -3.6)"/>
      <ellipse cx="9.6" cy="-15" rx="8.6" ry="7.8" fill="url(#gSeel)" stroke="#6a7e9c" stroke-width="1.3"/>
      <path d="M8,-21.6 L11,-27.6 L13.4,-21.4 Z" fill="#fff" stroke="#6a7e9c" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M2.4,-20 L0.6,-24 L5,-21.4 Z M14.6,-20.8 L17,-24.4 L17.4,-19 Z" fill="#fff" stroke="#6a7e9c" stroke-width="1" stroke-linejoin="round"/>
      <ellipse cx="16.6" cy="-12.4" rx="4.8" ry="3.6" fill="url(#gSeel)" stroke="#6a7e9c" stroke-width="1"/>
      <ellipse cx="19.6" cy="-13.8" rx="2" ry="1.5" fill="#2a2a3a"/>
      <path d="M17,-11 L21.6,-10.4 M17,-10 L21,-8.4" stroke="#6a7e9c" stroke-width=".7" opacity=".8"/>
      ${eye(11.6, -16.6, 2.6, '#222', c.blink)}
      <path d="M13.4,-9 Q16.6,-7.6 19,-9.6" fill="none" stroke="#6a7e9c" stroke-width="1.1" stroke-linecap="round"/>
      ${puff(c, [20, -12], '#bfe9ff', '#ffffff')}
    </g>`;
  }

  function lapras(c) {
    const hv = Math.sin(c.f * 0.05) * 0.8, nk = Math.sin(c.f * 0.06 + c.x) * 1.4;
    return `<ellipse cx="0" cy=".5" rx="24" ry="3" fill="#000" opacity=".22"/>
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-18,-8 Q-30,-4 -27,-16 Q-22,-11 -16,-13 Z" fill="url(#gLap)" stroke="#1c4a70" stroke-width="1.2" stroke-linejoin="round"/>
      <ellipse cx="-12" cy="-3" rx="6.4" ry="3.2" fill="url(#gLap)" stroke="#1c4a70" stroke-width="1.1"/>
      <ellipse cx="11" cy="-3" rx="6.4" ry="3.2" fill="url(#gLap)" stroke="#1c4a70" stroke-width="1.1"/>
      <ellipse cx="0" cy="-12" rx="21" ry="11.4" fill="url(#gLap)" stroke="#1c4a70" stroke-width="1.4"/>
      <path d="M-18,-8 Q0,-1.6 19,-8 Q0,-4 -18,-8 Z" fill="#f0e8cc" opacity=".9"/>
      <ellipse cx="-6" cy="-19" rx="14.4" ry="9.6" fill="#8e8ea2" stroke="#4a4a5e" stroke-width="1.3"/>
      <path d="M-17,-22 L-20,-31 L-12,-25 Z M-9,-26 L-9,-36 L-2,-27 Z M0,-25 L3,-34 L6,-23 Z" fill="#ece4c8" stroke="#8a8266" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M8,-15 Q${f1(17 + nk)},-24 ${f1(15 + nk)},-37" fill="none" stroke="#1c4a70" stroke-width="12.4" stroke-linecap="round"/>
      <path d="M8,-15 Q${f1(17 + nk)},-24 ${f1(15 + nk)},-37" fill="none" stroke="#4a9ccc" stroke-width="9.6" stroke-linecap="round"/>
      <g transform="translate(${f1(nk)} ${f1(hv)})">
        <ellipse cx="18.6" cy="-42" rx="9.6" ry="8" fill="url(#gLap)" stroke="#1c4a70" stroke-width="1.3"/>
        <path d="M14,-47 L12,-55 L18,-48.4 Z M20.4,-48.4 L26,-54 L25,-46 Z" fill="url(#gLap)" stroke="#1c4a70" stroke-width="1.1" stroke-linejoin="round"/>
        <ellipse cx="22" cy="-38.6" rx="5.4" ry="3.8" fill="#f0e8cc" opacity=".85"/>
        ${eye(21.6, -43.6, 2.9, '#222', c.blink)}
        <path d="M21,-37.4 Q24.4,-35.6 27,-37.6" fill="none" stroke="#1c4a70" stroke-width="1.1" stroke-linecap="round"/>
        ${puff(c, [28, -38], '#bfe9ff', '#ffffff')}
      </g>
    </g>`;
  }

  // ---------- Magnemite ----------
  function magnemite(c) {
    const hv = Math.sin(c.f * 0.1 + c.x) * 2, sp = c.breath > 0 || c.charge;
    const magnet = (sx) => `<g transform="translate(${sx * 15} 0) scale(${sx} 1)">
      <rect x="-3" y="-2" width="9" height="4" fill="#9aa0ac" stroke="#4a5060" stroke-width="1"/>
      <path d="M6,-7 L6,7 L12,7 L12,4 L9,4 L9,-4 L12,-4 L12,-7 Z" fill="${sx > 0 ? '#e0433a' : '#3a6ee0'}" stroke="#2a2a3a" stroke-width="1" stroke-linejoin="round"/>
      <path d="M11,-7 L11,-4 L12,-4 L12,-7 Z M11,4 L11,7 L12,7 L12,4 Z" fill="#e8e8f0"/></g>`;
    return `<ellipse cx="0" cy=".5" rx="${f1(8 - hv * 0.4)}" ry="1.8" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(-21 + hv)})">
      ${magnet(-1)}${magnet(1)}
      <circle r="10.6" fill="url(#gMag)" stroke="#4a5060" stroke-width="1.3"/>
      <path d="M-7,-6.6 Q-2,-10.4 4,-9" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>
      <rect x="-1.8" y="-15" width="3.6" height="5" rx="1" fill="#9aa0ac" stroke="#4a5060" stroke-width="1"/>
      <circle cx="-6.4" cy="6" r="1.1" fill="#4a5060"/><circle cx="6.4" cy="6" r="1.1" fill="#4a5060"/>
      ${c.blink ? `<path d="M-4.4,0 h8.8" stroke="#222" stroke-width="1.5" stroke-linecap="round"/>`
                : `<circle cx="1" cy="0" r="5.6" fill="#fff" stroke="#222" stroke-width="1"/><circle cx="2.4" cy="0.2" r="2.8" fill="#222"/><circle cx="3.2" cy="-0.8" r="1" fill="#fff"/>`}
      ${sp ? `<path d="M-14,-9 l4,3 l-3,2 l4,4 M14,-9 l-4,3 l3,2 l-4,4" fill="none" stroke="#fff27a" stroke-width="1.4" stroke-linejoin="round"/>` : ''}
      ${puff(c, [11, 0], '#fff27a', '#ffffff')}
    </g>`;
  }

  // ---------- Electabuzz ----------
  function electabuzz(c) {
    const punch = c.breath > 0 ? 6 : 0, sp = c.charge || c.breath > 0, K = '#2a2433', O = '#5a3a08';
    const arm = (sx, sy, ex, ey, fx, fy) => `<path d="M${sx},${sy} Q${ex},${ey - 2} ${fx},${fy}" fill="none" stroke="${O}" stroke-width="8.6" stroke-linecap="round"/>
      <path d="M${sx},${sy} Q${ex},${ey - 2} ${fx},${fy}" fill="none" stroke="#f6cf2c" stroke-width="6.4" stroke-linecap="round"/>`;
    const band = (x, y, w) => `<path d="M${x - w},${y} l${w * 0.5},-2.6 l${w * 0.5},2.6 l${w * 0.5},-2.6 l${w * 0.5},2.6 l0,2.6 l${-w * 0.5},-2.6 l${-w * 0.5},2.6 l${-w * 0.5},-2.6 l${-w * 0.5},2.6 Z" fill="${K}"/>`;
    const spark = sp ? `<path d="M-19,-38 l4,3 l-3,2 l4,4 M21,-40 l-4,3 l3,2 l-4,4" fill="none" stroke="#fff27a" stroke-width="1.5" stroke-linejoin="round"/>` : '';
    return `<ellipse cx="0" cy=".5" rx="15" ry="2.6" fill="#000" opacity=".2"/>` + feet(c.step, 'url(#gBee)', O, 6) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-15 L-15,-17 L-13,-22 L-22,-24 L-18,-29 L-28,-34 L-14,-31 L-17,-26 L-9,-24 Z" fill="${K}" stroke="#14101c" stroke-width=".8" stroke-linejoin="round"/>
      ${arm(-10, -31, -17, -23, -12, -16)}
      <rect x="-9.4" y="-13" width="6.2" height="12" rx="3" fill="url(#gBee)" stroke="${O}" stroke-width="1.2"/><rect x="3.2" y="-13" width="6.2" height="12" rx="3" fill="url(#gBee)" stroke="${O}" stroke-width="1.2"/>
      <path d="M-9,-8 h5.6 M3.6,-8 h5.6" stroke="${K}" stroke-width="2" stroke-linecap="round"/>
      <path d="M-8.6,-11 Q-14.6,-22 -12.4,-33 Q0,-39.4 12.6,-33 Q14.6,-22 8.6,-11 Q0,-8 -8.6,-11 Z" fill="url(#gBee)" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M-12.2,-30 l4,2.6 l3.4,-3 l3.6,3 l3.6,-3 l3.4,3 l3.6,-3 l4,2.6 l.2,3 l-4,-2.4 l-3.2,3 l-3.6,-3 l-3.6,3 l-3.4,-3 l-3.6,3 l-4,-2.4 Z" fill="${K}"/>
      ${band(-9.4, -21.4, 9.4)}${band(-7.4, -13.4, 7.4)}
      <path d="M-8,-33 Q0,-37 8,-33" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".4"/>
      ${arm(10, -31, 18.5, -26 - punch * 0.1, 14 + punch * 1.4, -24 - punch * 0.3)}
      <path d="M13.2,-29.2 l.8,3 M16.8,-27.6 l.8,3" stroke="${K}" stroke-width="2.1" stroke-linecap="round"/>
      <circle cx="${f1(21 + punch * 1.4)}" cy="${f1(-25 - punch * 0.3)}" r="4.8" fill="url(#gBee)" stroke="${O}" stroke-width="1.3"/>
      <path d="M${f1(19.4 + punch * 1.4)},${f1(-27.2 - punch * 0.3)} l0.8,3.4 M${f1(22.4 + punch * 1.4)},${f1(-27.4 - punch * 0.3)} l0.8,3.4" stroke="${O}" stroke-width=".9" stroke-linecap="round"/>
      <ellipse cx="4" cy="-42.6" rx="10.6" ry="9.2" fill="url(#gBee)" stroke="${O}" stroke-width="1.4"/>
      <path d="M-4,-49.6 C-8.4,-53 -7,-60 -11,-62 C-5.4,-60.6 -2,-55.4 0,-50 Z M8.4,-50 C9.4,-55 14,-60 18,-60.4 C14.6,-57.4 14,-53.6 12.6,-49 Z" fill="${K}" stroke="#14101c" stroke-width=".8" stroke-linejoin="round"/>
      <circle cx="-11" cy="-62" r="1.8" fill="${sp ? '#fff27a' : '#6a5a7a'}"/><circle cx="18" cy="-60.4" r="1.8" fill="${sp ? '#fff27a' : '#6a5a7a'}"/>
      <path d="M-3.6,-42.4 L-6.4,-45.4 L-4.4,-38.4 Z" fill="url(#gBee)" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M1.4,-49.4 L4,-46 L6.4,-49.4" fill="none" stroke="${K}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>
      ${eye(5.6, -43.2, 3, '#222', c.blink)}${eye(11.6, -43.2, 2.4, '#222', c.blink)}
      <path d="M2.2,-47.4 L7.6,-45.6 M9.6,-45.8 L14.2,-47.6" stroke="${K}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M7,-36.6 Q10.6,-34.2 14,-36.6" fill="none" stroke="${O}" stroke-width="1.3" stroke-linecap="round"/>
      ${spark}
      ${puff(c, [14, -34], '#fff27a', '#ffffff')}
    </g>`;
  }

  // ---------- Magmar ----------
  function magmar(c) {
    const fl = k => Math.sin(c.f * 0.3 + k) * 1.6;
    const flame = (x, y, s, k) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,0 C-6,-4 -6,-12 0,-19 C1,-14 5,-14 5,-9 C7,-5 5,-1 0,0 Z" fill="#ff8a1a" stroke="#a02008" stroke-width=".9"/><path d="M0,-1 C-3,-4 -2,-9 0,-13 C2,-9 3,-4 0,-1 Z" fill="#ffd34d" transform="scale(1 ${(1 + fl(k) * 0.08).toFixed(2)})"/></g>`;
    return feet(c.step, 'url(#gMagmar)', '#6a1c08', 5.6) + `
    <g transform="translate(0 ${f1(c.bob)})">
      <path d="M-8,-9 Q-17,-8 -19,-17" fill="none" stroke="#6a1c08" stroke-width="5" stroke-linecap="round"/><path d="M-8,-9 Q-17,-8 -19,-17" fill="none" stroke="#f2582a" stroke-width="3.2" stroke-linecap="round"/>
      ${flame(-19, -15, 0.9, 1)}
      <ellipse cx="0" cy="-15" rx="10.4" ry="12" fill="url(#gMagmar)" stroke="#6a1c08" stroke-width="1.3"/>
      <ellipse cx="2" cy="-13" rx="6.6" ry="7.6" fill="#ffe08a" opacity=".85"/>
      <path d="M-3,-17 Q2,-20 6,-16 Q2,-13 -2,-11" fill="none" stroke="#f2a02a" stroke-width="1.3" stroke-linecap="round"/>
      <path d="M-5.6,-31 L-6,-39" stroke="none"/>
      ${flame(1, -39, 1.15, 0)}${flame(-5, -38, 0.7, 2)}
      <ellipse cx="2" cy="-31" rx="9.6" ry="8.6" fill="url(#gMagmar)" stroke="#6a1c08" stroke-width="1.3"/>
      <path d="M7,-30.4 Q14,-30.6 14.4,-26.4 Q12,-24 6,-25.6 Z" fill="#ffe08a" stroke="#6a1c08" stroke-width="1.1" stroke-linejoin="round"/>
      <circle cx="12.6" cy="-28.6" r=".9" fill="#6a1c08"/>
      ${eye(5.4, -33, 2.7, '#222', c.blink)}
      <path d="M2,-36.4 L7.6,-35.2" stroke="#6a1c08" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M6,-19 L${f1(13 + (c.breath > 0 ? 6 : 0))},-17" stroke="#6a1c08" stroke-width="5.6" stroke-linecap="round"/><path d="M6,-19 L${f1(13 + (c.breath > 0 ? 6 : 0))},-17" stroke="#f2582a" stroke-width="3.8" stroke-linecap="round"/>
      <circle cx="${f1(14 + (c.breath > 0 ? 6 : 0))}" cy="-17" r="3.4" fill="url(#gMagmar)" stroke="#6a1c08" stroke-width="1.1"/>
      ${puff(c, [14, -27], '#ff7a1a', '#fff3a0')}
    </g>`;
  }

  // ---------- Scyther ----------
  function scyther(c) {
    const fl = (c.flap || c.breath > 0) ? 0.8 : 0.5, w = Math.sin(c.f * fl) * 14;
    const cut = c.breath > 0 ? -22 : 0;
    const blade = (x, y, rot, k) => `<g transform="translate(${x} ${y}) rotate(${f1(rot)}) scale(${k})">
      <path d="M0,-1.8 L7,-1.8" stroke="#2f6c1a" stroke-width="4" stroke-linecap="round"/>
      <path d="M6,-2 C10,-11 22,-13 31,-3 C21,-5 14,-1 8,5 Z" fill="#f0ead0" stroke="#7a7250" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M10,-2 C16,-8 23,-8 28,-3" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".8"/></g>`;
    return `<ellipse cx="0" cy=".5" rx="12" ry="2.4" fill="#000" opacity=".2"/>
    <g transform="translate(0 ${f1(c.bob)})">
      <g transform="translate(-3 -26) rotate(${f1(-34 + w)})"><ellipse cx="-3" cy="-11" rx="5.6" ry="13" fill="url(#gWing)" stroke="#6a7aa0" stroke-width="1.1" opacity=".8"/></g>
      <g transform="translate(-2 -22) rotate(${f1(-56 + w * 0.8)})"><ellipse cx="-2" cy="-8" rx="4.2" ry="9.6" fill="url(#gWing)" stroke="#6a7aa0" stroke-width="1" opacity=".7"/></g>
      <path d="M-4,-8 L-6,-1" stroke="#2f6c1a" stroke-width="3.6" stroke-linecap="round"/><path d="M4,-8 L5,-1" stroke="#2f6c1a" stroke-width="3.6" stroke-linecap="round"/>
      <ellipse cx="-5.6" cy="-1" rx="4" ry="2" fill="#62b034" stroke="#2f6c1a" stroke-width="1"/><ellipse cx="6.4" cy="-1" rx="4" ry="2" fill="#62b034" stroke="#2f6c1a" stroke-width="1"/>
      <path d="M-4,-12 Q-12,-8 -13,-1 Q-5,-4 -1,-11 Z" fill="url(#gScy)" stroke="#2f6c1a" stroke-width="1.1" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-19" rx="7.4" ry="13" fill="url(#gScy)" stroke="#2f6c1a" stroke-width="1.3"/>
      <path d="M-5.4,-22 Q0,-19.6 5.4,-22 M-5.6,-16 Q0,-13.4 5.6,-16" fill="none" stroke="#2f6c1a" stroke-width=".9" opacity=".6"/>
      <ellipse cx="0.6" cy="-37" rx="7.2" ry="7.6" fill="url(#gScy)" stroke="#2f6c1a" stroke-width="1.3"/>
      <path d="M-2,-43 L-5,-52 M4,-43.4 L8,-51.6" stroke="#2f6c1a" stroke-width="1.4" stroke-linecap="round"/>
      <ellipse cx="4.2" cy="-37.6" rx="3" ry="3.6" fill="#fff" stroke="#2f6c1a" stroke-width=".9"/><circle cx="5" cy="-37.4" r="1.6" fill="#e5384e"/>
      <path d="M3,-32.4 Q5.6,-31 8,-32.6" fill="none" stroke="#2f6c1a" stroke-width="1" stroke-linecap="round"/>
      ${blade(-4, -27, 150, 0.8)}
      ${blade(5, -26, -20 + cut, 1)}
      ${puff(c, [8, -34], '#d8f0a0', '#ffffff')}
    </g>`;
  }

  const NEW = { geodude, zubat, golbat, gastly, gengar, machop, machamp, growlithe, arcanine, seel, lapras, magnemite, electabuzz, magmar, scyther };
  for (const k in NEW) A.register(k, NEW[k]);
})();
