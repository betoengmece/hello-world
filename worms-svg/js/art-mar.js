// Fundo do mar: decoração (coral, alga, concha com pérola, estrela-do-mar, âncora, anêmona que brilha) e peixinhos ao fundo.
// Base em y = 0. Carregado depois de art.js: acrescenta tipos ao MS.Art.decor.
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const O = '#1a2a3a';
  const SH = '<ellipse cx="0" cy="0" rx="12" ry="2" fill="#000" opacity=".2"/>';
  // galho de coral: ramos que se dividem
  function branch(x, y, a, len, w, n, col) {
    if (n <= 0 || len < 3) return '';
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    return `<path d="M${f1(x)},${f1(y)} L${f1(x2)},${f1(y2)}" stroke="${col}" stroke-width="${f1(w)}" stroke-linecap="round"/>` +
      branch(x2, y2, a - 0.45, len * 0.72, w * 0.72, n - 1, col) + branch(x2, y2, a + 0.4, len * 0.7, w * 0.72, n - 1, col);
  }
  const ART = {
    coral: d => {
      const col = ['#ff6a7a', '#ff9a4a', '#ff7ac8', '#c87aff'][Math.abs(Math.round(d.x)) % 4];
      return `${SH}<g>${branch(0, 0, -Math.PI / 2, 12, 5.2, 4, O)}</g><g>${branch(0, 0, -Math.PI / 2, 12, 3.6, 4, col)}</g>
        <circle cx="-7" cy="-27" r="1.6" fill="#fff" opacity=".6"/><circle cx="6" cy="-30" r="1.3" fill="#fff" opacity=".6"/>`;
    },
    alga: () => `<path d="M-3,0 C-8,-12 4,-20 -2,-32 C-6,-40 2,-46 0,-54" fill="none" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-3,0 C-8,-12 4,-20 -2,-32 C-6,-40 2,-46 0,-54" fill="none" stroke="#3aa86a" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M3,0 C7,-10 -2,-18 4,-28 C8,-34 2,-38 5,-44" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M3,0 C7,-10 -2,-18 4,-28 C8,-34 2,-38 5,-44" fill="none" stroke="#5cc88a" stroke-width="2.8" stroke-linecap="round"/>
      <ellipse cx="-4" cy="-20" rx="3.4" ry="1.6" fill="#5cc88a" stroke="${O}" stroke-width=".7" transform="rotate(-30 -4 -20)"/>
      <ellipse cx="6" cy="-24" rx="3" ry="1.4" fill="#7ad8a0" stroke="${O}" stroke-width=".7" transform="rotate(25 6 -24)"/>`,
    concha: () => `${SH}<path d="M-11,-2 Q-12,-14 0,-16 Q12,-14 11,-2 Z" fill="#e8b4c8" stroke="${O}" stroke-width="1"/>
      <path d="M0,-2 L0,-15 M-4,-2 L-3,-15 M4,-2 L3,-15 M-8,-2 L-7,-12 M8,-2 L7,-12" stroke="#c88aa8" stroke-width=".9"/>
      <path d="M-11,-2 Q0,4 11,-2 Q0,0 -11,-2 Z" fill="#d8a0b8" stroke="${O}" stroke-width="1"/>
      <circle cx="0" cy="-2" r="3.2" fill="#fbfbff" stroke="#a8b8c8" stroke-width=".7"/><circle cx="-1" cy="-3" r="1" fill="#fff"/>`,
    estrela: () => `<g transform="translate(0 -4) rotate(12)"><path d="M0,-9 L2.6,-3 L9,-2.6 L4,1.6 L5.6,8 L0,4.4 L-5.6,8 L-4,1.6 L-9,-2.6 L-2.6,-3 Z" fill="#ff8a3a" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>
      <circle cx="0" cy="0" r="1" fill="#ffd8a0"/><circle cx="3" cy="-2" r=".7" fill="#ffd8a0"/><circle cx="-3" cy="-2" r=".7" fill="#ffd8a0"/><circle cx="2" cy="3.4" r=".7" fill="#ffd8a0"/><circle cx="-2" cy="3.4" r=".7" fill="#ffd8a0"/></g>`,
    ancora: () => `<g transform="rotate(-18)"><path d="M0,-30 L0,-2 M-8,-24 L8,-24" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M0,-30 L0,-2 M-8,-24 L8,-24" stroke="#7a8a96" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="0" cy="-33" r="3.2" fill="none" stroke="${O}" stroke-width="3.4"/><circle cx="0" cy="-33" r="3.2" fill="none" stroke="#7a8a96" stroke-width="1.8"/>
      <path d="M-12,-8 Q-10,0 0,-1 Q10,0 12,-8" fill="none" stroke="${O}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M-12,-8 Q-10,0 0,-1 Q10,0 12,-8" fill="none" stroke="#7a8a96" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M-4,-20 L-3,-6" stroke="#b8c4cc" stroke-width="1" opacity=".7"/>
      <path d="M2,-14 q2,1 1,3" stroke="#a86a3a" stroke-width="1.6" fill="none" opacity=".7"/></g>`,
    anemona: () => {
      let t = '';
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28, x2 = Math.cos(a) * 16, y2 = -8 + Math.sin(a) * 16; t += `<path d="M0,-8 Q${f1(x2 * 0.4 + (i - 4))},${f1(-12)} ${f1(x2)},${f1(y2)}" fill="none" stroke="#c87aff" stroke-width="2.6" stroke-linecap="round"/><circle cx="${f1(x2)}" cy="${f1(y2)}" r="1.8" fill="#ffe0ff"/>`; }
      return `<circle cx="0" cy="-14" r="20" fill="#c87aff" opacity=".18"/><circle cx="0" cy="-14" r="12" fill="#e8b0ff" opacity=".2"/>
        ${SH}${t}<path d="M-7,0 Q-8,-8 0,-9 Q8,-8 7,0 Z" fill="#8a4ac8" stroke="${O}" stroke-width="1"/>`;
    }
  };
  // os peixinhos que passam ao fundo (no lugar das nuvens quando o cenário é debaixo d'água)
  MS.FISH_SVG = `<g opacity=".55">
    <g transform="translate(-26 4)"><path d="M-9,0 Q0,-6 9,0 Q0,6 -9,0 Z M-9,0 L-15,-5 L-15,5 Z" fill="#cfe9ff"/></g>
    <g transform="translate(0 -8)"><path d="M-11,0 Q0,-7 11,0 Q0,7 -11,0 Z M-11,0 L-18,-6 L-18,6 Z" fill="#e0f4ff"/></g>
    <g transform="translate(22 6)"><path d="M-8,0 Q0,-5 8,0 Q0,5 -8,0 Z M-8,0 L-13,-4 L-13,4 Z" fill="#cfe9ff"/></g>
    <g transform="translate(6 12)"><path d="M-7,0 Q0,-4 7,0 Q0,4 -7,0 Z M-7,0 L-11,-3.4 L-11,3.4 Z" fill="#bfe0f8"/></g></g>`;
  MS.DECOR_HARD = Object.assign(MS.DECOR_HARD || {}, { coral: '#ff7a8a', concha: '#e8b4c8', estrela: '#ff8a3a', ancora: '#7a8a96', anemona: '#c87aff', alga: '#3aa86a' });
  const base = MS.Art.decor;
  MS.Art.decor = d => ART[d.type] ? `<g transform="translate(${d.x} ${f1(d.base + 1)}) scale(${d.s.toFixed(2)})">${ART[d.type](d)}</g>` : base(d);
})();
