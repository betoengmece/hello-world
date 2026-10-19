// Terceira leva: Gato Persa (bolota de pelo, cara amassada e mal-humorada).
// Mania = engasgo de bola de pelo: o corpo dá trancos, o pescoço estica, a boca abre... e sai a bola de pelo.
// Pés em y = 0, virados para +x. c: { f, blink, breath, bob, step, mania (0..1 ou null), hurt }
(() => {
  const MS = window.MS = window.MS || {};
  const f1 = v => (+v).toFixed(1);
  const sin = Math.sin, cos = Math.cos, PI = Math.PI;
  const OUT = '#2a1f1a';
  const on = t => t !== null && t !== undefined;

  // contorno fofo: elipse feita de "nuvenzinhas" (pelo)
  function fluff(cx, cy, rx, ry, n, amp, fill, sw = 1.1, rot = 0) {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = rot + i / n * PI * 2, x = cx + cos(a) * rx, y = cy + sin(a) * ry;
      if (i === 0) { d = `M${f1(x)},${f1(y)}`; continue; }
      const am = rot + (i - 0.5) / n * PI * 2;
      d += ` Q${f1(cx + cos(am) * rx * (1 + amp))},${f1(cy + sin(am) * ry * (1 + amp))} ${f1(x)},${f1(y)}`;
    }
    return `<path d="${d} Z" fill="${fill}" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }
  // olho de gato persa: cobre, com pálpebra pesada (cara de tédio)
  function catEye(cx, cy, r, c, lid, fur, mode) {
    if (c.hurt) return `<path d="M${f1(cx - r * 0.7)},${f1(cy - r * 0.7)} L${f1(cx + r * 0.7)},${f1(cy + r * 0.7)} M${f1(cx + r * 0.7)},${f1(cy - r * 0.7)} L${f1(cx - r * 0.7)},${f1(cy + r * 0.7)}" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (mode === 'squeeze') return `<path d="M${f1(cx - r)},${f1(cy - r * 0.6)} L${f1(cx + r * 0.5)},${f1(cy)} L${f1(cx - r)},${f1(cy + r * 0.6)}" fill="none" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (mode === 'squeezeR') return `<path d="M${f1(cx + r)},${f1(cy - r * 0.6)} L${f1(cx - r * 0.5)},${f1(cy)} L${f1(cx + r)},${f1(cy + r * 0.6)}" fill="none" stroke="${OUT}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (c.blink) return `<path d="M${f1(cx - r)},${f1(cy)} Q${f1(cx)},${f1(cy + r * 0.7)} ${f1(cx + r)},${f1(cy)}" fill="none" stroke="${OUT}" stroke-width="1.3" stroke-linecap="round"/>`;
    const ly = cy - r + lid * r * 2;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(r)}" ry="${f1(r)}" fill="#fff" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="${f1(cx + r * 0.2)}" cy="${f1(cy + r * 0.1)}" rx="${f1(r * 0.72)}" ry="${f1(r * 0.78)}" fill="#e08a1c"/>
      <ellipse cx="${f1(cx + r * 0.2)}" cy="${f1(cy + r * 0.12)}" rx="${f1(r * 0.24)}" ry="${f1(r * 0.62)}" fill="#120c0a"/>
      <circle cx="${f1(cx + r * 0.42)}" cy="${f1(cy - r * 0.18)}" r="${f1(r * 0.22)}" fill="#fff"/>
      <path d="M${f1(cx - r * 1.15)},${f1(cy - r * 1.2)} L${f1(cx + r * 1.15)},${f1(cy - r * 1.2)} L${f1(cx + r * 1.15)},${f1(ly)} Q${f1(cx)},${f1(ly + r * 0.25)} ${f1(cx - r * 1.15)},${f1(ly)} Z" fill="${fur}"/>
      <path d="M${f1(cx - r * 1.02)},${f1(ly)} Q${f1(cx)},${f1(ly + r * 0.25)} ${f1(cx + r * 1.02)},${f1(ly)}" fill="none" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round"/>`;
  }
  // bola de pelo (projétil e a que sai da boca)
  const HAIRBALL = (r = 5) => `<g>${fluff(0, 0, r, r * 0.85, 9, 0.28, '#b88a5a', 1)}
    <path d="M${f1(-r * 0.6)},${f1(-r * 0.2)} q${f1(r * 0.4)},${f1(-r * 0.5)} ${f1(r)},${f1(-r * 0.3)} M${f1(-r * 0.3)},${f1(r * 0.35)} q${f1(r * 0.5)},${f1(-r * 0.3)} ${f1(r)},0" fill="none" stroke="#7a5430" stroke-width=".8" stroke-linecap="round"/>
    <ellipse cx="${f1(r * 0.35)}" cy="${f1(-r * 0.4)}" rx="${f1(r * 0.3)}" ry="${f1(r * 0.16)}" fill="#e8f8d0" opacity=".75"/></g>`;
  MS.HAIRBALL = HAIRBALL;

  function gato(c) {
    const fur = '#f3ede4', shade = '#ddd2c4', face = '#fbf6ee';
    const m = c.mania, gag = on(m) && m < 0.84, spit = on(m) && m >= 0.84;
    const heave = gag ? Math.max(0, sin(m * PI * 7.2)) : 0;          // trancos do engasgo
    const lean = gag ? 5 + heave * 5 + m * 3 : spit ? 6 : 0;          // estica o pescoço para a frente
    const dip = gag ? 6 + heave * 5 : spit ? 2 : 0;                   // abaixa a cabeça
    const crouch = gag ? 1.2 + heave * 1.6 : 0;
    const open = c.breath > 0 || c.hurt || heave > 0.45 || spit;
    const mw = c.breath > 0 ? 6 : spit ? 5.4 : 2.4 + heave * 3.2;
    const tail = sin(c.f * 0.12) * 10 + (gag ? heave * 14 : 0);
    const earFlat = gag ? 30 : 0;
    let eyeL = '', eyeR = '';
    if (gag && (heave > 0.12 || m > 0.06)) { eyeL = catEye(-1.5, -1.5, 3.6, c, 0, face, 'squeeze'); eyeR = catEye(7.5, -1.8, 3.2, c, 0, face, 'squeezeR'); }
    else if (spit) { eyeL = catEye(-1.5, -1.5, 3.6, c, 0.62, face); eyeR = catEye(7.5, -1.8, 3.2, c, 0.3, face); }
    else { eyeL = catEye(-1.5, -1.5, 3.6, c, 0.42, face); eyeR = catEye(7.5, -1.8, 3.2, c, 0.42, face); }
    const mouth = open
      ? `<ellipse cx="6" cy="${f1(7 + mw * 0.25)}" rx="${f1(Math.min(4.2, mw * 0.7))}" ry="${f1(mw * 0.5)}" fill="#6a1a24" stroke="${OUT}" stroke-width=".9"/>
         <path d="M${f1(4.2)},${f1(7.4 + mw * 0.5)} q1.8,${f1(spit ? 5 : 2.4)} 3.6,0 Z" fill="#ff8a9a" stroke="${OUT}" stroke-width=".6"/>`
      : `<path d="M3.2,7.6 Q4.6,6.4 6,7.4 Q7.4,6.4 8.8,7.6" fill="none" stroke="${OUT}" stroke-width="1" stroke-linecap="round"/>
         <path d="M3,9.2 Q6,8 9,9.2" fill="none" stroke="${OUT}" stroke-width=".8" stroke-linecap="round" opacity=".6"/>`;
    return `<g transform="translate(0 ${f1(c.bob + crouch)})">
      <g transform="translate(-12 -11) rotate(${f1(-25 + tail)})">
        ${fluff(-3, -8, 5, 9.5, 11, 0.22, fur, 1.1, 0.4)}
        <path d="M-4,-14 q2,4 0,9" fill="none" stroke="${shade}" stroke-width="1.4" stroke-linecap="round"/>
      </g>
      <ellipse cx="-5" cy="-1.4" rx="3.4" ry="2.2" fill="${shade}" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="6" cy="-1.4" rx="3.4" ry="2.2" fill="${shade}" stroke="${OUT}" stroke-width="1"/>
      ${fluff(-1, -9 - heave * 2.4, 12.5, 8.5 + heave * 2, 14, 0.14, fur)}
      <path d="M-8,-7 q4,3 9,2 M-3,-12 q5,2 10,0" fill="none" stroke="${shade}" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="${f1(-3 + c.step * 0.6)}" cy="-1.6" rx="3.6" ry="2.4" fill="${fur}" stroke="${OUT}" stroke-width="1"/>
      <ellipse cx="${f1(8 - c.step * 0.6)}" cy="-1.6" rx="3.6" ry="2.4" fill="${fur}" stroke="${OUT}" stroke-width="1"/>
      <g transform="translate(${f1(4 + lean)} ${f1(-24 + dip)}) rotate(${f1(gag ? 8 + heave * 8 : spit ? 6 : 0)})">
        <g transform="rotate(${f1(-earFlat)} -8 -9)"><path d="M-11,-7 L-10,-16 L-3,-11 Z" fill="${fur}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/><path d="M-9.6,-9 L-9.2,-13.4 L-5.4,-11 Z" fill="#f4b4bc"/></g>
        <g transform="rotate(${f1(earFlat)} 8 -10)"><path d="M5,-12 L12,-16 L12,-7 Z" fill="${fur}" stroke="${OUT}" stroke-width="1" stroke-linejoin="round"/><path d="M7,-12 L10.6,-14 L10.6,-9.6 Z" fill="#f4b4bc"/></g>
        ${fluff(2, 0, 15.5, 13.5, 16, 0.13, fur)}
        <ellipse cx="3" cy="1" rx="12" ry="10.5" fill="${face}"/>
        <path d="M-6,-9 Q-1,-12 5,-10" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        ${eyeL}${eyeR}
        <path d="M5,3 L7,3 L6,4.6 Z" fill="#e88a9a" stroke="${OUT}" stroke-width=".7" stroke-linejoin="round"/>
        <path d="M6,4.6 V6.6" stroke="${OUT}" stroke-width=".8"/>
        ${mouth}
        <path d="M-2,5 l-6,-1 M-2,6.4 l-6,1 M13,5 l5,-1.2 M13,6.4 l5,.8" stroke="${OUT}" stroke-width=".55" opacity=".6"/>
        <ellipse cx="-4" cy="5" rx="2.2" ry="1.2" fill="#ff9aa8" opacity=".45"/>
      </g>
      ${gag && heave > 0.5 ? `<g stroke="${OUT}" stroke-width=".9" stroke-linecap="round" fill="none" opacity=".75"><path d="M${f1(22 + lean)},-30 l4,-2 M${f1(23 + lean)},-25 l5,0 M${f1(22 + lean)},-20 l4,2"/></g>` : ''}
      ${spit ? `<g transform="translate(${f1(18 + (m - 0.84) * 60)} ${f1(-12 + (m - 0.84) * 70)})">${HAIRBALL(4.4)}</g>
        <g fill="#cfeaa8" stroke="${OUT}" stroke-width=".5"><circle cx="${f1(15 + lean)}" cy="-14" r="1.2"/><circle cx="${f1(18 + lean)}" cy="-10" r=".9"/></g>` : ''}
      ${c.breath > 0 ? `<g transform="translate(${f1(20 + lean)} -18)" opacity=".9">${fluff(0, 0, 3, 2.6, 7, 0.3, '#b88a5a', .8)}</g>` : ''}
    </g>`;
  }

  MS.Art.register('gato', gato);
  MS.CAT_FLUFF = fluff;
})();
