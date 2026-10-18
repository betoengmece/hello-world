// IA da CPU em segundo plano: simula ângulos e forças fora da linha que desenha a tela (o jogo não engasga enquanto ela pensa)
'use strict';
let mask = null, W = 0, H = 0;
self.onmessage = e => {
  const m = e.data;
  if (m.mask) { mask = new Uint8Array(m.mask); W = m.W; H = m.H; }
  const { wp, tg, cands, scoreU, foes, team, pStep, wind, windY, GRAV, WATER } = m;
  const solid = (x, y) => { x = Math.floor(x); y = Math.floor(y); return x >= 0 && x < W && y >= 0 && y < H && mask[y * W + x] === 1; };
  const sim = (x0, y0, a, sp) => {
    let x = x0, y = y0, vx = sp * wp.speed * Math.cos(a), vy = -sp * wp.speed * Math.sin(a);
    const gk = GRAV * wp.grav / 3, wm = wp.windMul === undefined ? 1 : wp.windMul;
    let dug = 0;
    for (let n = 0; n < 700; n++) {
      for (let s = 0; s < 3; s++) {
        vx += wind * 0.0012 * wm; vy += gk + windY * 0.0012 * wm; x += vx / 3; y += vy / 3;
        if (x < -60 || x > W + 60 || y > H + 60 || y >= WATER) return null;
        if (wp.dig) { if (solid(x, y)) { vy -= gk * 0.6; if (++dug >= wp.dig) return { x, y }; } else if (dug) return { x, y }; }
        else if (wp.phase ? (solid(x, y) && solid(x, y - 26)) : solid(x, y)) return { x, y };
        for (let k = 0; k < tg.length; k++) { const dx = tg[k].x - x, dy = tg[k].y - y; if (dx * dx + dy * dy < tg[k].r2) return { x, y }; }
      }
    }
    return null;
  };
  const score = (lx, ly) => {
    let sc = 0;
    for (const v of scoreU) {
      const d = Math.hypot(v.x - lx, v.y - ly); if (d >= wp.boom) continue;
      const dmg = wp.dmg * (1 - d / wp.boom) * v.mul;
      if (v.team === 2) continue;
      if (v.team === team) sc -= dmg * 1.3; else sc += dmg + (dmg >= v.hp ? 30 : 0);
    }
    return sc;
  };
  let best = null, bestS = -1e9, near = null, nearD = 1e9;
  for (const c of cands) {
    const a = c.ang * Math.PI / 180;
    for (let pw = 18; pw <= 100; pw += pStep) {
      const sp = 3 + pw * 0.075;
      let s = 0, dmin = 1e9;
      for (let i = 0; i < wp.count; i++) {
        const off = wp.count === 1 ? 0 : (i - (wp.count - 1) / 2) * wp.spread * Math.PI / 180;
        const r = sim(c.x0, c.y0, a + off, sp);
        if (!r) continue;
        s += score(r.x, r.y);
        for (const f of foes) dmin = Math.min(dmin, Math.hypot(r.x - f.x, r.y - f.y));
      }
      s += Math.random() * 0.5;
      if (s > bestS) { bestS = s; best = { ang: c.ang, pw, face: c.face }; }
      if (dmin < nearD) { nearD = dmin; near = { ang: c.ang, pw, face: c.face }; }
    }
  }
  self.postMessage({ id: m.id, best, bestS, near, nearD });
};
