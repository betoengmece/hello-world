// Decoração dos mundos temáticos dos bichos: Quintal, Cozinha, Praia e Cidade.
// Escala de "bicho": os objetos do dia a dia ficam enormes perto deles. Base em y = 0.
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const O = '#2a1f1a';
  const SH = '<ellipse cx="0" cy="0" rx="12" ry="2" fill="#000" opacity=".18"/>';
  const ART = {
    // ----- Quintal -----
    vaso: d => `${SH}<path d="M-9,-14 L9,-14 L7,0 L-7,0 Z" fill="#c8643a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <rect x="-10.5" y="-17" width="21" height="4" rx="1" fill="#d8784a" stroke="${O}" stroke-width="1.1"/>
      <path d="M0,-17 Q-2,-26 -6,-30 M0,-17 Q1,-27 5,-32 M0,-17 Q4,-23 9,-25" fill="none" stroke="#3f8a2a" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="-6" cy="-31" r="3.2" fill="${d.col}" stroke="${O}" stroke-width=".8"/><circle cx="5" cy="-33" r="3.4" fill="${d.col}" stroke="${O}" stroke-width=".8"/><circle cx="9.5" cy="-25.5" r="2.8" fill="${d.col}" stroke="${O}" stroke-width=".8"/>
      <circle cx="-6" cy="-31" r="1.1" fill="#ffcf33"/><circle cx="5" cy="-33" r="1.2" fill="#ffcf33"/><circle cx="9.5" cy="-25.5" r="1" fill="#ffcf33"/>
      <path d="M-6,-12 L-5,-3" stroke="#fff" stroke-width="1.2" opacity=".35" stroke-linecap="round"/>`,
    regador: () => `${SH}<path d="M-9,0 L-8,-16 L6,-16 L7,0 Z" fill="#4aa0d8" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M6,-7 L17,-17 L19,-15 L8,-4" fill="#4aa0d8" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
      <ellipse cx="18.6" cy="-16.4" rx="2.4" ry="3.2" fill="#3a88c0" stroke="${O}" stroke-width=".9" transform="rotate(-40 18.6 -16.4)"/>
      <path d="M-8,-12 C-15,-12 -15,-3 -8,-4" fill="none" stroke="${O}" stroke-width="3"/><path d="M-8,-12 C-15,-12 -15,-3 -8,-4" fill="none" stroke="#4aa0d8" stroke-width="1.6"/>
      <path d="M-6,-14 L-5,-2" stroke="#fff" stroke-width="1.4" opacity=".4" stroke-linecap="round"/>`,
    bola: () => `${SH}<circle cy="-9" r="9" fill="#ff5a4a" stroke="${O}" stroke-width="1.1"/>
      <path d="M-9,-9 Q0,-4 9,-9 M0,-18 Q-4,-9 0,0" fill="none" stroke="#fff" stroke-width="2.2"/>
      <ellipse cx="-3.6" cy="-13.4" rx="2.8" ry="1.6" fill="#fff" opacity=".55" transform="rotate(-30 -3.6 -13.4)"/>`,
    casinha: () => `<ellipse cx="0" cy="0" rx="20" ry="2.4" fill="#000" opacity=".18"/>
      <rect x="-15" y="-22" width="30" height="22" fill="#e8b46a" stroke="${O}" stroke-width="1.2"/>
      <path d="M-15,-16 h30 M-15,-10 h30 M-15,-4 h30" stroke="#c8944a" stroke-width=".9"/>
      <path d="M-19,-21 L0,-36 L19,-21 Z" fill="#c84a3a" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M-6,0 L-6,-10 Q0,-17 6,-10 L6,0 Z" fill="#3a2418" stroke="${O}" stroke-width="1"/>
      <rect x="-5" y="-30" width="10" height="5" rx="1" fill="#fff" stroke="${O}" stroke-width=".8"/><circle cx="0" cy="-27.5" r="1.3" fill="#c84a3a"/>
      <path d="M10,0 a3,2 0 1 1 6,0" fill="#e0e0e0" stroke="${O}" stroke-width=".9"/>`,
    // ----- Cozinha -----
    xicara: () => `${SH}<path d="M-9,-14 L9,-14 L7,-2 Q0,1 -7,-2 Z" fill="#ffffff" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M9,-11 C15,-11 15,-4 8,-4" fill="none" stroke="${O}" stroke-width="3"/><path d="M9,-11 C15,-11 15,-4 8,-4" fill="none" stroke="#fff" stroke-width="1.6"/>
      <ellipse cx="0" cy="-14" rx="9" ry="2" fill="#6a3a1e" stroke="${O}" stroke-width=".9"/>
      <path d="M-6,-10 Q0,-7 6,-10" fill="none" stroke="#ff7a9a" stroke-width="1.6" stroke-linecap="round"/><circle cx="0" cy="-6" r="1.6" fill="#ff7a9a"/>
      <ellipse cx="0" cy="0" rx="13" ry="2.2" fill="#f4f4f4" stroke="${O}" stroke-width=".9"/>
      <path d="M-3,-17 q-2,-4 1,-7 q2,-3 0,-6 M3,-17 q-2,-3 1,-6" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`,
    panela: () => `<ellipse cx="0" cy="0" rx="17" ry="2.4" fill="#000" opacity=".2"/>
      <path d="M-14,-18 L14,-18 L13,-2 Q0,1 -13,-2 Z" fill="#9aa0aa" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>
      <rect x="-21" y="-16" width="8" height="3" rx="1.4" fill="#2a2a30" stroke="${O}" stroke-width=".9"/><rect x="13" y="-16" width="8" height="3" rx="1.4" fill="#2a2a30" stroke="${O}" stroke-width=".9"/>
      <path d="M-15,-18 Q0,-26 15,-18 Z" fill="#b4bac4" stroke="${O}" stroke-width="1.1"/><rect x="-2.6" y="-26" width="5.2" height="3.6" rx="1.4" fill="#2a2a30"/>
      <path d="M-10,-15 L-9,-4" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>`,
    garrafa: () => `<ellipse cx="0" cy="0" rx="8" ry="1.8" fill="#000" opacity=".2"/>
      <path d="M-6,0 L-6,-20 Q-6,-25 -2.6,-28 L-2.6,-36 L2.6,-36 L2.6,-28 Q6,-25 6,-20 L6,0 Z" fill="#7ad0a0" fill-opacity=".85" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <rect x="-3.2" y="-39" width="6.4" height="3.6" rx="1" fill="#e8322a" stroke="${O}" stroke-width=".9"/>
      <rect x="-6" y="-16" width="12" height="9" fill="#fff6dc" stroke="${O}" stroke-width=".8"/><path d="M-3,-11.5 h6" stroke="#e8322a" stroke-width="1.6"/>
      <path d="M-3.6,-22 L-3.6,-2" stroke="#fff" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>`,
    maca: () => `<ellipse cx="0" cy="0" rx="9" ry="1.8" fill="#000" opacity=".2"/>
      <path d="M0,-15 C-6,-19 -11,-14 -10,-8 C-9,-2 -4,1 0,-1 C4,1 9,-2 10,-8 C11,-14 6,-19 0,-15 Z" fill="#e8322a" stroke="${O}" stroke-width="1.1"/>
      <path d="M0,-15 Q1,-19 3,-21" fill="none" stroke="#6a3a1e" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M2,-19 Q7,-22 9,-18 Q5,-16 2,-19 Z" fill="#5cb83a" stroke="${O}" stroke-width=".8"/>
      <ellipse cx="-5" cy="-11" rx="2" ry="3" fill="#fff" opacity=".45"/>`,
    queijo: () => `<ellipse cx="0" cy="0" rx="15" ry="2" fill="#000" opacity=".2"/>
      <path d="M-14,0 L-14,-12 L12,-20 L14,-12 L14,0 Z" fill="#ffd23a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-14,-12 L14,-12" stroke="${O}" stroke-width="1"/><path d="M-14,-12 L12,-20 L14,-12 Z" fill="#ffe27a" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
      <circle cx="-7" cy="-6" r="2.4" fill="#e8a81a"/><circle cx="3" cy="-4" r="1.6" fill="#e8a81a"/><circle cx="8" cy="-8" r="2" fill="#e8a81a"/><circle cx="2" cy="-15" r="1.2" fill="#f0b830"/>`,
    pote: () => `<ellipse cx="0" cy="0" rx="13" ry="2.2" fill="#000" opacity=".2"/>
      <path d="M-10,-24 Q-12,-24 -12,-20 L-12,-4 Q-12,0 -8,0 L8,0 Q12,0 12,-4 L12,-20 Q12,-24 10,-24 Z" fill="#e8f4fa" fill-opacity=".55" stroke="${O}" stroke-width="1.1"/>
      <circle cx="-5" cy="-6" r="4.4" fill="#d8a060" stroke="#8a5a2e" stroke-width=".8"/><circle cx="4" cy="-5" r="4.4" fill="#d8a060" stroke="#8a5a2e" stroke-width=".8"/><circle cx="0" cy="-13" r="4.4" fill="#c88a4a" stroke="#8a5a2e" stroke-width=".8"/><circle cx="7" cy="-14" r="3.6" fill="#d8a060" stroke="#8a5a2e" stroke-width=".8"/>
      <circle cx="-5" cy="-7" r=".9" fill="#4a2a14"/><circle cx="-3" cy="-5" r=".8" fill="#4a2a14"/><circle cx="4" cy="-6" r=".9" fill="#4a2a14"/><circle cx="1" cy="-14" r=".8" fill="#4a2a14"/>
      <rect x="-9" y="-29" width="18" height="6" rx="2" fill="#c8945a" stroke="${O}" stroke-width="1"/><path d="M-8,-27 h16" stroke="#a8743e" stroke-width=".8"/>
      <path d="M-9,-21 L-9,-5" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>`,
    pratos: () => `<ellipse cx="0" cy="0" rx="16" ry="2.2" fill="#000" opacity=".2"/>
      ${[0, 1, 2, 3, 4].map(i => `<path d="M-14,${-2 - i * 4} Q0,${2 - i * 4} 14,${-2 - i * 4} L12,${-5 - i * 4} L-12,${-5 - i * 4} Z" fill="#fbfbf8" stroke="${O}" stroke-width=".9" stroke-linejoin="round"/><path d="M-13,${-3.4 - i * 4} Q0,${0.4 - i * 4} 13,${-3.4 - i * 4}" fill="none" stroke="#4a8ad0" stroke-width="1"/>`).join('')}
      <ellipse cx="0" cy="-22" rx="12" ry="2.4" fill="#f0f0ea" stroke="${O}" stroke-width=".9"/>`,
    bule: () => `<ellipse cx="0" cy="0" rx="15" ry="2.2" fill="#000" opacity=".2"/>
      <path d="M8,-12 C14,-14 16,-20 20,-22 L21,-20 C18,-17 16,-10 9,-6 Z" fill="#5aa0c8" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M-9,-14 C-16,-14 -16,-4 -9,-5" fill="none" stroke="${O}" stroke-width="3.4"/><path d="M-9,-14 C-16,-14 -16,-4 -9,-5" fill="none" stroke="#5aa0c8" stroke-width="2"/>
      <path d="M-11,-2 Q-13,-16 0,-18 Q13,-16 11,-2 Q0,1 -11,-2 Z" fill="#5aa0c8" stroke="${O}" stroke-width="1.1"/>
      <path d="M-7,-18 Q0,-24 7,-18 Z" fill="#4a88b0" stroke="${O}" stroke-width="1"/><circle cx="0" cy="-23" r="2" fill="#ffd23a" stroke="${O}" stroke-width=".8"/>
      <path d="M-8,-9 Q0,-5 8,-9" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="2 2.4"/>
      <path d="M-7,-14 Q-8,-8 -6,-4" fill="none" stroke="#fff" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>
      <path d="M21,-24 q-2,-4 1,-7 q2,-3 0,-6" fill="none" stroke="#fff" stroke-width="1.3" opacity=".8" stroke-linecap="round"/>`,
    fruteira: () => `<ellipse cx="0" cy="0" rx="16" ry="2.2" fill="#000" opacity=".2"/>
      <path d="M-7,-12 C-12,-24 -2,-28 4,-26 C-2,-24 -4,-18 -2,-12 Z" fill="#ffd84a" stroke="${O}" stroke-width=".9"/>
      <circle cx="5" cy="-15" r="5" fill="#e8322a" stroke="${O}" stroke-width=".9"/><path d="M5,-20 q1,-3 3,-3" stroke="#6a3a1e" stroke-width="1" fill="none"/>
      <g fill="#8a4ac8" stroke="${O}" stroke-width=".6"><circle cx="-8" cy="-14" r="2.4"/><circle cx="-11" cy="-15" r="2.4"/><circle cx="-9.5" cy="-17.6" r="2.4"/><circle cx="-12.6" cy="-18" r="2.2"/></g>
      <circle cx="11" cy="-13" r="4" fill="#ff9a2a" stroke="${O}" stroke-width=".9"/>
      <path d="M-15,-12 L15,-12 Q13,-1 0,-1 Q-13,-1 -15,-12 Z" fill="#d8a060" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-12,-9 L12,-9 M-10,-5 L10,-5" stroke="#a8743e" stroke-width="1"/><rect x="-5" y="-1.4" width="10" height="1.6" fill="#a8743e"/>`,
    // ----- Praia -----
    guardasol: d => `<ellipse cx="0" cy="0" rx="14" ry="2" fill="#000" opacity=".18"/>
      <path d="M0,0 L1,-34" stroke="#f4f0e6" stroke-width="2" stroke-linecap="round"/><path d="M0,0 L1,-34" stroke="${O}" stroke-width=".5" opacity=".5"/>
      <path d="M-20,-28 Q1,-50 22,-28 Z" fill="#ff6a5a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-20,-28 Q-12,-31 -6,-28 Q-3,-44 1,-46 Q5,-44 8,-28 Q14,-31 22,-28" fill="none" stroke="${O}" stroke-width=".8"/>
      <path d="M-6,-28 Q-3,-44 1,-46 Q5,-44 8,-28 Q1,-31 -6,-28 Z" fill="#fff"/>`,
    balde: () => `${SH}<path d="M-8,-13 L8,-13 L6,0 L-6,0 Z" fill="#ffc83a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-8,-13 Q0,-24 8,-13" fill="none" stroke="${O}" stroke-width="1"/>
      <path d="M8,-2 L17,-12" stroke="#4aa0d8" stroke-width="2.4" stroke-linecap="round"/><path d="M15,-15 L20,-10 L17,-8 L13,-12 Z" fill="#4aa0d8" stroke="${O}" stroke-width=".8"/>
      <path d="M-5,-11 L-4,-2" stroke="#fff" stroke-width="1.2" opacity=".45" stroke-linecap="round"/>`,
    castelo: () => `<ellipse cx="0" cy="0" rx="16" ry="2" fill="#000" opacity=".15"/>
      <path d="M-14,0 L-14,-14 L-11,-14 L-11,-17 L-8,-17 L-8,-14 L-5,-14 L-5,-24 L-3,-24 L-3,-27 L0,-27 L0,-24 L3,-24 L3,-27 L6,-27 L6,-24 L8,-24 L8,-14 L11,-14 L11,-17 L14,-17 L14,0 Z" fill="#ead59c" stroke="#a98c52" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-2,0 L-2,-6 Q1.5,-10 5,-6 L5,0 Z" fill="#a98c52"/>
      <path d="M1.5,-27 L1.5,-34 L6,-32 L1.5,-30" fill="#ff5a4a" stroke="${O}" stroke-width=".6"/>
      <circle cx="-9" cy="-7" r=".9" fill="#c9ad6e"/><circle cx="10" cy="-5" r=".9" fill="#c9ad6e"/>`,
    concha: d => `<path d="M-6,0 Q-7,-8 0,-10 Q7,-8 6,0 Z" fill="${d.col === '#ffffff' ? '#ffe0d0' : '#ffd0c0'}" stroke="${O}" stroke-width=".9"/>
      <path d="M0,0 L0,-9 M-3,0 L-2,-8.4 M3,0 L2,-8.4 M-5,0 L-4.6,-6 M5,0 L4.6,-6" stroke="#d89a8a" stroke-width=".8"/>`,
    // ----- Cidade -----
    poste: () => `<ellipse cx="0" cy="0" rx="7" ry="1.6" fill="#000" opacity=".2"/>
      <rect x="-1.6" y="-44" width="3.2" height="44" fill="#4a4f5a" stroke="${O}" stroke-width=".8"/>
      <path d="M0,-44 Q0,-50 8,-50 L10,-50" fill="none" stroke="#4a4f5a" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M6,-50 L16,-50 L14,-46 L8,-46 Z" fill="#3a3f4a" stroke="${O}" stroke-width=".8"/>
      <ellipse cx="11" cy="-45" rx="3" ry="1.4" fill="#fff6c0"/><path d="M8,-45 L4,-30 L18,-30 L14,-45 Z" fill="#fff6c0" opacity=".18"/>
      <rect x="-3" y="-4" width="6" height="4" fill="#3a3f4a"/>`,
    lixeira: () => `${SH}<path d="M-8,-17 L8,-17 L7,0 L-7,0 Z" fill="#4a8a5a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-4,-14 V-3 M0,-14 V-3 M4,-14 V-3" stroke="#3a6a46" stroke-width="1.2"/>
      <path d="M-9.5,-17 L9.5,-17 L8,-21 L-8,-21 Z" fill="#5aa06a" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M-5,-21 q1,-4 4,-3 q2,-3 4,0" fill="#e8e0d0" stroke="${O}" stroke-width=".7"/><path d="M3,-21 l3,-4 l2,3 Z" fill="#ffd23a" stroke="${O}" stroke-width=".6"/>`,
    hidrante: () => `${SH}<path d="M-5,0 L-5,-14 Q-5,-20 0,-20 Q5,-20 5,-14 L5,0 Z" fill="#e8322a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <rect x="-7" y="-14" width="14" height="3" rx="1" fill="#c8221a" stroke="${O}" stroke-width=".9"/>
      <circle cx="-6" cy="-8" r="2" fill="#c8221a" stroke="${O}" stroke-width=".8"/><circle cx="6" cy="-8" r="2" fill="#c8221a" stroke="${O}" stroke-width=".8"/>
      <rect x="-1.4" y="-23" width="2.8" height="3" fill="#c8221a" stroke="${O}" stroke-width=".7"/><rect x="-6.5" y="-2" width="13" height="2" fill="#a81a14"/>
      <path d="M-3,-17 L-3,-3" stroke="#fff" stroke-width="1.2" opacity=".4" stroke-linecap="round"/>`,
    cone: () => `${SH}<path d="M-3,-22 L3,-22 L8,-2 L-8,-2 Z" fill="#ff8a2a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M-4.6,-15 L4.6,-15 L5.8,-10 L-5.8,-10 Z" fill="#fff"/><rect x="-10" y="-2.6" width="20" height="2.6" rx="1" fill="#e86a1a" stroke="${O}" stroke-width=".9"/>`,
    banco: () => `<ellipse cx="0" cy="0" rx="19" ry="2" fill="#000" opacity=".18"/>
      <path d="M-14,0 V-8 M14,0 V-8 M-14,-10 V-20 M14,-10 V-20" stroke="#3a3f4a" stroke-width="2.2"/>
      <rect x="-17" y="-11" width="34" height="3.4" rx="1" fill="#a8743a" stroke="${O}" stroke-width=".9"/>
      <rect x="-17" y="-21" width="34" height="3.2" rx="1" fill="#a8743a" stroke="${O}" stroke-width=".9"/><rect x="-17" y="-16.4" width="34" height="3.2" rx="1" fill="#b8844a" stroke="${O}" stroke-width=".9"/>`
  };
  const base = MS.Art.decor;
  MS.Art.decor = d => ART[d.type] ? `<g transform="translate(${d.x} ${f1(d.base + 1)}) scale(${d.s.toFixed(2)})">${ART[d.type](d)}</g>` : base(d);
})();
