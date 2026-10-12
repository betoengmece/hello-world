// Motor do jogo: mundo, física, turnos, IA, captura, fase inicial, campanha, menus e controles
(() => {
  const MS = window.MS, Sfx = MS.Sfx, Art = MS.Art;
  const { WEAPONS, SPECIES, THEMES, STAGES, TYPE_COLOR, TYPE_NAME, typeMult } = MS;

  const W = 800, H = 500, WATER = 480;
  const GRAV = 0.2;           // gravidade base (px/frame²)
  const WALK_MAX = 120;       // distância máxima de caminhada por turno
  const VOLT_X = 400;         // posição do Pikachu no modo Versus
  const WEAK = 0.35;          // abaixo dessa fração de PV o inimigo pode ser capturado
  const PLAYER_COL = '#3a9bff', WILD_COL = '#e0433a', GUEST_COL = '#ffd34d';
  const SAVE_KEY = 'ms_campaign_v1';
  // tipos de bola: a Great e a Ultra têm chance de captura maior e só aparecem como itens pelo campo
  const BALLS = {
    ball:  { name: 'Pokébola',   mul: 1,   col: '#e63b3b', key: 'balls' },
    great: { name: 'Great Ball', mul: 1.5, col: '#2f7fe0', key: 'great' },
    ultra: { name: 'Ultra Ball', mul: 2.3, col: '#f2c230', key: 'ultra' }
  };
  const BALL_ORDER = ['ball', 'great', 'ultra'];
  // clima: só em cenários ao ar livre (a Caverna não tem). Reforça golpes de certos tipos
  const WEATHER = {
    rain:  { name: 'Chuva',       note: 'Água +50%',            boost: { water: 1.5 } },
    sun:   { name: 'Sol forte',   note: 'Fogo e Planta +40%',   boost: { fire: 1.4, grass: 1.4 } },
    storm: { name: 'Tempestade',  note: 'Elétrico +50%',        boost: { electric: 1.5 } }
  };

  const $ = id => document.getElementById(id);
  const f1 = v => (+v).toFixed(1);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- Estado ----------
  let scene = 'menu';          // 'menu' | 'intro' | 'team' | 'battle'
  let kind = 'versus';         // tipo de batalha: 'versus' | 'campaign'
  let frameNo = 0;
  let heights, grass, tuft, decor = [], graves = [], parts = [], floaters = [], clouds = [], cloudEls = [], fx = [], projs = [];
  let units = [], teams = [], turnTeam = 0, state = 'aim', wind = 0, power = 0, charging = false, angle = 45;
  let walkBudget = WALK_MAX, dirty = true, msg = '', msgT = 0, keys = {};
  let neutral = null, lastShotVolt = false, voltDelay = 0, voltSide = 1;
  let guest = null, gCool = 1, gMode = '', gT = 0, gSide = 1, gDelay = 100, lastShotGuest = false, splashU = null, evo = null;
  let weather = null, lightT = 300, bolt = null;
  let ballMode = false, ballType = 'ball', pickups = [], ai = null, cap = null, panel = null, pendingPanel = null;
  let campaign = null, stageIdx = 0, stageCaught = [], intro = null, teamSel = null;
  let uiList = [], uiSel = 0, themeKey = 'campo';
  let focus = { x: 400, y: 250 };
  let flash = { a: 0, col: '#fff' }, skipT = 0;
  const lastAngles = {};      // último ângulo usado por cada lado (vale também ao recomeçar)

  const activeUnit = () => { const t = teams[turnTeam]; return t ? t.units[t.cur] : undefined; };
  const showMsg = (text, frames) => { msg = text; msgT = frames; };
  const teamAlive = t => t.units.some(u => u.alive);
  const gy = x => heights[clamp(Math.round(x), 0, W - 1)];
  const spOf = u => SPECIES[u.sp];
  const centerOf = u => ({ x: u.x, y: u.y - spOf(u).hitY * u.scale });
  const hitRof = u => spOf(u).hitR * u.scale * (u.hrMul || 1);

  // ---------- Câmera 2.5D ----------
  const cam = { x: 400, y: 250, z: 1, shake: 0, sx: 0, sy: 0 };

  function updateCamera() {
    let tx = 400, ty = 250, tz = 1, k = 0.06;
    if (scene === 'menu' || scene === 'team') { tz = 1; }
    else if (state === 'capture' && cap) { tx = cap.x; ty = cap.by - 10; tz = 1.8; k = 0.08; }
    else if (state === 'flying' && projs.length) {
      const p = projs[Math.floor(projs.length / 2)];
      tx = p.x; ty = p.y; tz = scene === 'intro' ? 1.2 : 1.35; k = 0.12;
    } else if (state === 'settle') { tx = focus.x; ty = focus.y; tz = 1.25; }
    else if (state === 'volt' && neutral) { tx = neutral.x; ty = neutral.y - 30; tz = 1.7; }
    else if (state === 'guest' && guest) { tx = guest.x; ty = guest.y - 40; tz = 1.45; }
    else if ((state === 'aim' || state === 'ai') && charging && scene === 'battle') {
      const u = activeUnit(); if (u) { tx = u.x; ty = u.y - 30; tz = 1.15; k = 0.04; }
    }
    cam.z += (tz - cam.z) * k * 0.8;
    cam.x += (tx - cam.x) * k;
    cam.y += (ty - cam.y) * k;
    const vw = W / cam.z / 2, vh = H / cam.z / 2;
    cam.x = clamp(cam.x, vw, W - vw);
    cam.y = clamp(cam.y, vh, H - vh);
    cam.sx = cam.shake ? rnd(-cam.shake, cam.shake) : 0;
    cam.sy = cam.shake ? rnd(-cam.shake, cam.shake) : 0;
    cam.shake = cam.shake > 0.3 ? cam.shake * 0.88 : 0;
  }

  // f = profundidade da camada (0 = infinito, 1 = mundo, >1 = primeiro plano)
  function camT(f) {
    const z = 1 + (cam.z - 1) * f;
    const cx = 400 + (cam.x + cam.sx - 400) * f, cy = 250 + (cam.y + cam.sy - 250) * f;
    return `translate(400 250) scale(${z.toFixed(3)}) translate(${f1(-cx)} ${f1(-cy)})`;
  }

  const FX_FILL = { fire: 'url(#boom)', leaf: 'url(#leafBoom)', water: 'url(#splash)', thunder: 'url(#zap)',
                    normal: 'url(#hitBoom)', gust: 'url(#gustBoom)', web: 'url(#webBoom)', dragon: 'url(#dragBoom)', rock: 'url(#rockBoom)' };

  // ---------- Geração do mundo ----------
  function hillPath(pts) {
    let d = `M0,${H} L${pts[0].x},${f1(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      d += ` Q${pts[i].x},${f1(pts[i].y)} ${f1(mx)},${f1(my)}`;
    }
    const last = pts[pts.length - 1];
    return d + ` L${last.x},${f1(last.y)} L${W},${H} Z`;
  }

  function bandPath(off) {
    let d = `M0,${H}`;
    for (let x = 0; x <= W; x += 4) d += ` L${x},${f1(heights[Math.min(x, W - 1)] + off(x))}`;
    return d + ` L${W},${H} Z`;
  }

  function setStop(id, col) { $(id).setAttribute('stop-color', col); }

  function applyTheme(key) {
    const t = THEMES[key]; themeKey = key;
    t.sky.forEach((c, i) => setStop('skyS' + i, c));
    t.far.forEach((c, i) => setStop('farS' + i, c));
    t.near.forEach((c, i) => setStop('nearS' + i, c));
    t.dirt.forEach((c, i) => setStop('dirtS' + i, c));
    setStop('seaBS0', t.sea[0]); setStop('seaBS1', t.sea[1]);
    setStop('seaFS0', t.sea[2]); setStop('seaFS1', t.sea[3]);
    $('strata1').setAttribute('fill', t.s1); $('strata2').setAttribute('fill', t.s2);
    $('treeline').setAttribute('fill', t.tl);
    $('edgeGrass').setAttribute('stroke', t.g[0]); $('tbackGrass').setAttribute('stroke', t.g[0]);
    $('edgeGrassHi').setAttribute('stroke', t.g[1]); $('tufts').setAttribute('stroke', t.g[2]);
    $('fore').setAttribute('fill', t.fore);
    if (t.sun) {
      $('sun').style.display = '';
      for (const id of ['sunGlowC', 'sunC']) { $(id).setAttribute('cx', t.sun.x); $(id).setAttribute('cy', t.sun.y); }
      $('sunC').setAttribute('fill', t.sun.col);
    } else $('sun').style.display = 'none';
    $('clouds').setAttribute('opacity', t.clouds);
  }

  function skyline() {
    let d = `M-60,${H}`, win = '';
    for (let x = -40; x < W + 60;) {
      const bw = rnd(34, 62), top = rnd(255, 345);
      d += ` L${f1(x)},${f1(top)} L${f1(x + bw)},${f1(top)}`;
      for (let wy = top + 9; wy < 405; wy += 12)
        for (let wx = x + 6; wx < x + bw - 8; wx += 10) if (Math.random() < 0.5) win += `M${f1(wx)},${f1(wy)}h4v5h-4z`;
      x += bw + rnd(0, 4);
    }
    return { d: d + ` L${W + 60},${H} Z`, win };
  }

  function genWorld(key) {
    applyTheme(key);
    const T = THEMES[key], base = T.terrain.base, amp = T.terrain.amp;
    const p1 = rnd(0, 6.3), p2 = rnd(0, 6.3), p3 = rnd(0, 6.3);
    const bumps = Array.from({ length: 5 }, () => ({ c: rnd(40, 760), w: rnd(35, 100), h: rnd(-75, 55) }));
    heights = new Float32Array(W); grass = new Uint8Array(W).fill(1); tuft = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      let h = base + amp * (26 * Math.sin(x * 0.011 + p1) + 14 * Math.sin(x * 0.029 + p2) + 5 * Math.sin(x * 0.07 + p3));
      for (const b of bumps) h += amp * b.h * Math.exp(-(((x - b.c) / b.w) ** 2));
      heights[x] = clamp(h, 150, 440);
      tuft[x] = rnd(4, 9);
    }
    let hmin = 500; for (let x = 0; x < W; x++) hmin = Math.min(hmin, heights[x]);
    $('dirt').setAttribute('y1', f1(hmin - 30));
    $('strata1').setAttribute('d', bandPath(x => 48 + 8 * Math.sin(x * 0.05 + p2)));
    $('strata2').setAttribute('d', bandPath(x => 115 + 12 * Math.sin(x * 0.03 + p1)));

    // montanhas ao fundo
    const far = [], near = [];
    for (let x = -20; x <= W + 40; x += 60) far.push({ x, y: rnd(150, 215) });
    for (let x = -20; x <= W + 40; x += 45) near.push({ x, y: rnd(212, 262) });
    $('mtFarPath').setAttribute('d', hillPath(far));
    $('mtNearPath').setAttribute('d', hillPath(near));

    // faixa de fundo: prédios (cidade), dunas (praia), pedras pontudas (caverna) ou pinheiros
    let tl = '', win = '';
    if (key === 'cidade') { const s = skyline(); tl = s.d; win = s.win; }
    else if (key === 'praia') {
      const pts = []; for (let x = -20; x <= W + 40; x += 70) pts.push({ x, y: rnd(268, 290) });
      tl = hillPath(pts);
    } else {
      tl = `M-60,${H}`;
      const cave = key === 'caverna';
      for (let x = -60; x <= W + 60; x += cave ? rnd(18, 34) : rnd(9, 17)) {
        const baseY = 262 + 10 * Math.sin(x * 0.01 + p3), h = cave ? rnd(22, 52) : rnd(14, 32), hw = cave ? rnd(7, 13) : rnd(5, 9);
        tl += ` L${f1(x - hw)},${f1(baseY)} L${f1(x)},${f1(baseY - h)} L${f1(x + hw)},${f1(baseY)}`;
      }
      tl += ` L${W + 60},${H} Z`;
    }
    $('treeline').setAttribute('d', tl);
    $('tlWin').setAttribute('d', win);

    // touceiras de capim em primeiro plano, nos cantos
    const clump = (cx, b, n, hmax) => {
      let d = '';
      for (let i = 0; i < n; i++) {
        const x = cx + rnd(-34, 34), h = rnd(hmax * 0.5, hmax), lean = rnd(-9, 9);
        d += `M${f1(x - 3)},${b} Q${f1(x + lean * 0.5)},${f1(b - h * 0.6)} ${f1(x + lean)},${f1(b - h)} ` +
             `Q${f1(x + lean * 0.3 + 1)},${f1(b - h * 0.5)} ${f1(x + 3)},${b} Z `;
      }
      return d;
    };
    $('fore').setAttribute('d', clump(-14, 520, 16, 72) + clump(814, 520, 16, 72));
    $('introBack').innerHTML = '';
    decor = []; dirty = true;
  }

  function genDecor(avoid) {
    decor = [];
    const list = THEMES[themeKey].decor;
    if (!list.length) return;
    for (let tries = 0; decor.length < 11 && tries < 300; tries++) {
      const x = Math.round(rnd(15, 785));
      if (avoid.some(a => Math.abs(a - x) < 28)) continue;
      if (decor.some(d => Math.abs(d.x - x) < 26)) continue;
      decor.push({ x, base: heights[x], type: pick(list), s: rnd(0.8, 1.15),
                   col: pick(['#ff6b8a', '#ffd84d', '#ffffff', '#b98cff', '#7ae8ff', '#ff9be8']) });
    }
    dirty = true;
  }

  function genClouds() {
    clouds = Array.from({ length: 5 }, () => ({ x: rnd(-50, 850), y: rnd(36, 140), s: rnd(0.55, 1.15), sp: rnd(0.04, 0.12) }));
    const CLOUD = `<g opacity=".92">
      <ellipse cx="0" cy="8" rx="46" ry="10" fill="#d9e6f2"/>
      <circle cx="-22" cy="0" r="16" fill="#fff"/><circle cx="0" cy="-9" r="22" fill="#fff"/>
      <circle cx="24" cy="0" r="15" fill="#fff"/><rect x="-38" y="0" width="78" height="12" rx="6" fill="#fff"/></g>`;
    $('clouds').innerHTML = clouds.map(() => `<g>${CLOUD}</g>`).join('');
    cloudEls = [...$('clouds').children];
  }

  function resetCommon() {
    fx = []; projs = []; parts = []; floaters = []; graves = [];
    power = 0; charging = false; ballMode = false; pickups = []; weather = null; bolt = null; ai = null; cap = null; panel = null; pendingPanel = null;
    lastShotVolt = false; voltDelay = 0; neutral = null; keys = {};
    guest = null; gCool = 1; gMode = ''; lastShotGuest = false; splashU = null; evo = null;
    cam.x = 400; cam.y = 250; cam.z = 1; cam.shake = 0;
    Sfx.chargeStop();
  }

  function mkUnit(sp, x, team, face, hpMult = 1) {
    const S = SPECIES[sp], maxhp = Math.round(S.maxhp * hpMult);
    return { sp, name: S.name, team, x, y: gy(x), hp: maxhp, maxhp, alive: true, face: face || 1, breath: 0, hurt: 0,
             walkT: 0, moving: false, blinkOff: Math.floor(rnd(0, 230)), webbed: false, stuck: false, hidden: false, capScale: 1,
             scale: S.scale || 1, hop: 0, dealt: 0, rid: -1, turnsLeft: 0 };
  }

  // ---------- Menu ----------
  function initMenu() {
    scene = 'menu'; kind = 'menu'; resetCommon();
    genWorld('campo'); genClouds(); genDecor([105, 185, 615, 695]);
    units = [mkUnit('charmander', 105, 0, 1), mkUnit('bulbasaur', 185, 0, 1), mkUnit('squirtle', 615, 0, -1), mkUnit('pikachu', 695, 0, -1)];
    teams = []; state = 'menu'; wind = 0; msg = ''; msgT = 0; uiSel = 0;
    syncButtons();
  }

  // ---------- Versus (3 times + Pikachu no meio) ----------
  const TEAM_DEF = [
    { name: 'Fogo',   color: '#e0433a', sp: 'charmander', spawn: [60, 140] },
    { name: 'Planta', color: '#3fae5a', sp: 'bulbasaur',  spawn: [660, 740] },
    { name: 'Água',   color: '#3a7de0', sp: 'squirtle',   spawn: [230, 310] }
  ];

  function initVersus() {
    scene = 'battle'; kind = 'versus'; resetCommon();
    genWorld('campo'); genClouds();
    genDecor(TEAM_DEF.flatMap(t => t.spawn).concat([VOLT_X]));
    units = []; teams = TEAM_DEF.map(d => ({ name: d.name, color: d.color, units: [], cur: 0, ai: false }));
    TEAM_DEF.forEach((d, ti) => d.spawn.forEach(x0 => {
      const x = x0 + rnd(-6, 6), u = mkUnit(d.sp, x, ti, x < VOLT_X ? 1 : -1);
      units.push(u); teams[ti].units.push(u);
    }));
    neutral = mkUnit('pikachu', VOLT_X, -1, 1);
    turnTeam = 0; state = 'aim'; stageIdx = 0;
    startTurn();
    syncButtons();
  }

  // ---------- Campanha ----------
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && Array.isArray(s.roster) && s.roster.length && s.roster.every(r => SPECIES[r]) &&
          Number.isInteger(s.stage) && s.stage >= 0 && s.stage < STAGES.length) {
        s.great = Math.max(0, Math.min(9, +s.great || 0)); s.ultra = Math.max(0, Math.min(9, +s.ultra || 0));
        s.xp = s.roster.map((_, i) => (Array.isArray(s.xp) && +s.xp[i] > 0) ? Math.round(+s.xp[i]) : 0);
        return s;
      }
    } catch (_) {}
    return null;
  }
  function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ roster: campaign.roster, xp: campaign.xp, great: campaign.great, ultra: campaign.ultra, stage: campaign.stage, balls: campaign.balls, weakStart: campaign.weakStart })); } catch (_) {}
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (_) {} }

  function newCampaign(starter) {
    campaign = { roster: [starter], xp: [0], great: 0, ultra: 0, stage: 0, balls: 0, weakStart: SPECIES[starter].maxhp < 100, sel: [0] };
    beginStage(0);
  }
  function continueCampaign() {
    const s = loadSave(); if (!s) return;
    campaign = { roster: s.roster.slice(), xp: s.xp.slice(), great: s.great, ultra: s.ultra, stage: s.stage, balls: s.balls || 0, weakStart: !!s.weakStart, sel: [0] };
    beginStage(s.stage);
  }

  function beginStage(si) {
    campaign.stage = si;
    campaign.balls = Math.min(9, campaign.balls + (STAGES[si].boss ? 5 : 3));
    campaign.ballsStart = campaign.balls; campaign.greatStart = campaign.great; campaign.ultraStart = campaign.ultra;
    campaign.rosterStart = campaign.roster.slice();
    campaign.xpStart = campaign.xp.slice();
    if (campaign.roster.length <= 3) {
      campaign.partyIdx = campaign.roster.map((_, i) => i);
      campaign.party = campaign.roster.slice();
      initStage(si);
    } else {
      campaign.sel = campaign.sel.filter(i => i < campaign.roster.length).slice(0, 3);
      if (!campaign.sel.length) campaign.sel = [0];
      scene = 'team'; kind = 'campaign'; stageIdx = si; resetCommon(); uiSel = 0;
      genWorld(STAGES[si].theme); genClouds(); units = []; teams = []; state = 'menu'; msg = ''; msgT = 0;
      syncButtons();
    }
  }

  function initStage(si) {
    scene = 'battle'; kind = 'campaign'; stageIdx = si; resetCommon(); stageCaught = [];
    const st = STAGES[si];
    genWorld(st.theme); genClouds();
    const px = [95, 165, 235], ex = [705, 635, 565];
    genDecor(px.concat(ex));
    const mercy = (si === 0 && campaign.weakStart) ? 0.75 : 1;
    units = [];
    teams = [
      { name: 'Você', color: PLAYER_COL, units: [], cur: 0, ai: false },
      { name: 'Selvagens', color: WILD_COL, units: [], cur: 0, ai: true }
    ];
    campaign.partyIdx.forEach((ri, i) => {
      const u = mkUnit(campaign.roster[ri], px[i] + rnd(-5, 5), 0, 1); u.rid = ri; units.push(u); teams[0].units.push(u);
    });
    gCool = 1 + Math.floor(Math.random() * 2);
    st.enemies.forEach((sp, i) => {
      const u = mkUnit(sp, ex[i] + rnd(-5, 5), 1, -1, st.hpMult * mercy); units.push(u); teams[1].units.push(u);
    });
    teams[1].cur = teams[1].units.length - 1;
    spawnPickups();
    weather = null; lightT = 200 + Math.floor(Math.random() * 200); bolt = null;
    let roll = Math.random();
    for (const w of (st.weather || [])) { if (roll < w.p) { weather = w.type; break; } roll -= w.p; }
    if (weather === 'rain' || weather === 'storm') $('sun').style.display = 'none';   // céu fechado: sem sol
    turnTeam = 0; state = 'aim';
    startTurn();
    showMsg(`Fase ${si + 1}: ${st.name}` + (weather ? ` · ${WEATHER[weather].name} (${WEATHER[weather].note})` : ''), 170);
    syncButtons();
  }

  function restartStage() {
    campaign.roster = campaign.rosterStart.slice();
    campaign.xp = campaign.xpStart.slice();
    campaign.balls = campaign.ballsStart; campaign.great = campaign.greatStart; campaign.ultra = campaign.ultraStart;
    initStage(stageIdx);
  }

  // XP ganho ao vencer a fase; devolve as linhas do painel e as evoluções que aconteceram
  function awardXp() {
    const lines = [], evos = [];
    campaign.partyIdx.forEach(ri => {
      const sp = campaign.roster[ri], S = SPECIES[sp];
      if (!S.evo) return;
      const u = units.find(x => x.rid === ri);
      const gain = 50 + 15 * stageIdx + Math.min(70, Math.round((u ? u.dealt : 0) * 0.5));
      campaign.xp[ri] += gain;
      if (campaign.xp[ri] >= S.evoXp) {
        evos.push({ ri, from: sp, to: S.evo });
        campaign.roster[ri] = S.evo;
        lines.push(`${S.name}: +${gain} XP — evoluiu para ${SPECIES[S.evo].name}!`);
      } else lines.push(`${S.name}: +${gain} XP (${campaign.xp[ri]}/${S.evoXp})`);
    });
    return { lines, evos };
  }

  function stageClear() {
    state = 'over'; guest = null; units = units.filter(u => u.team !== 2);
    const last = stageIdx >= STAGES.length - 1;
    Sfx.win();
    const xp = awardXp();
    if (!last) { campaign.stage = stageIdx + 1; saveGame(); } else clearSave();
    const buttons = last
      ? [{ label: 'Menu principal', fn: initMenu }]
      : [{ label: 'Próxima fase ▶', fn: () => beginStage(stageIdx + 1) }, { label: 'Menu', fn: initMenu }];
    pendingPanel = { t: 70, evos: xp.evos, panel: {
      title: last ? '🏆 Você é o Campeão!' : 'Fase concluída!',
      sub: last ? `Você terminou a campanha com ${campaign.roster.length} Pokémon.` : `${STAGES[stageIdx].name} superada.`,
      lines: xp.lines, caught: stageCaught.slice(), buttons } };
    showMsg(last ? 'Campeão!' : 'Fase concluída!', 70);
  }

  // ---------- Cena de evolução ----------
  function startEvolutions(list, after) {
    evo = { list, i: 0, t: 0, after, played: false, done: false };
    state = 'evolve'; msg = ''; msgT = 0; syncButtons();
  }
  function stepEvolve() {
    const e = evo; if (!e) return;
    e.t++;
    if (e.t === 40) Sfx.evolve();
    if (e.t === 258) Sfx.evolveDone();
    if (e.t >= 270 && e.t === 270) { flash.a = 0.9; flash.col = '#ffffff'; }
    if (e.t >= 400) nextEvolution();
  }
  function nextEvolution() {
    const e = evo; if (!e) return;
    Sfx.chargeStop();
    if (++e.i < e.list.length) { e.t = 0; return; }
    panel = e.after; evo = null; state = 'over'; uiSel = 0; syncButtons();
  }
  function skipEvolve() {
    if (!evo) return;
    if (evo.t < 258) { evo.t = 258; Sfx.evolveDone(); flash.a = 0.9; flash.col = '#ffffff'; }   // pula direto para o resultado
    else if (evo.t >= 290) nextEvolution();
  }

  function evolveSvg() {
    const e = evo, ev = e.list[e.i], t = e.t;
    const A = SPECIES[ev.from], B = SPECIES[ev.to];
    const ctx = { f: frameNo, blink: false, breath: 0, bob: Math.sin(frameNo * 0.08) * 0.7, step: 0, x: 0, flap: false };
    const sprite = (sp, white, sc) => `<g transform="translate(400 372) scale(${f1(3.2 * sc)})"${white ? ' filter="url(#fWhite)"' : ''}>${Art.draw(sp, ctx)}</g>`;
    let s = `<rect width="800" height="500" fill="#06101f" opacity=".9"/>`;
    const glow = clamp((t - 40) / 200, 0, 1);
    if (t >= 40 && t < 270) {
      s += `<circle cx="400" cy="300" r="${f1(60 + glow * 110 + Math.sin(frameNo * 0.4) * 6)}" fill="#fff" opacity="${(0.1 + glow * 0.3).toFixed(2)}"/>`;
      for (let i = 0; i < 14; i++) {
        const a = i * (Math.PI * 2 / 14) + frameNo * 0.01, r1 = 70 + glow * 40, r2 = r1 + 30 + glow * 150;
        s += `<line x1="${f1(400 + Math.cos(a) * r1)}" y1="${f1(300 + Math.sin(a) * r1)}" x2="${f1(400 + Math.cos(a) * r2)}" y2="${f1(300 + Math.sin(a) * r2)}" stroke="#bfe3ff" stroke-width="2.4" stroke-linecap="round" opacity="${(0.15 + glow * 0.45).toFixed(2)}"/>`;
      }
    }
    let title = '', sub = '';
    if (t < 40) { s += sprite(ev.from, false, A.scale || 1); title = 'O quê?'; sub = `${A.name} está evoluindo!`; }
    else if (t < 258) {
      // alterna entre as duas silhuetas, cada vez mais rápido
      const period = Math.max(3, Math.round(22 - glow * 19));
      const k = Math.floor((t - 40) / period) % 2 === 0;
      s += sprite(k ? ev.from : ev.to, true, (k ? A.scale : B.scale) || 1);
      title = 'O quê?'; sub = `${A.name} está evoluindo!`;
    } else if (t < 270) { s += sprite(ev.to, true, B.scale || 1); }
    else {
      s += sprite(ev.to, false, B.scale || 1);
      title = 'Parabéns!'; sub = `${A.name} evoluiu para ${B.name}!`;
      for (let i = 0; i < 6; i++) {
        const a = frameNo * 0.05 + i * 1.05;
        s += `<text x="${f1(400 + Math.cos(a) * 120)}" y="${f1(270 + Math.sin(a) * 60)}" font-size="16" text-anchor="middle" fill="#ffd34d" opacity=".9">★</text>`;
      }
    }
    s += `<text x="400" y="86" text-anchor="middle" font-size="34" font-weight="800" fill="#ffd34d" stroke="#6a3a00" stroke-width="5" paint-order="stroke">${title}</text>
          <text x="400" y="122" text-anchor="middle" font-size="22" font-weight="bold" fill="#fff">${sub}</text>`;
    if (t >= 290) s += `<text x="400" y="470" text-anchor="middle" font-size="13" fill="#fff" opacity="${(0.55 + 0.4 * Math.sin(frameNo * 0.1)).toFixed(2)}">toque ou tecle ENTER para continuar</text>`;
    else if (t > 50) s += `<text x="400" y="470" text-anchor="middle" font-size="11" fill="#fff" opacity=".45">toque / ENTER para pular</text>`;
    return s;
  }

  function stageLose() {
    state = 'over'; guest = null; units = units.filter(u => u.team !== 2); Sfx.lose();
    pendingPanel = { t: 70, panel: {
      title: 'Seus Pokémon desmaiaram...', sub: 'Tente de novo com outra estratégia.', lines: [], caught: [],
      buttons: [{ label: 'Tentar de novo', fn: restartStage }, { label: 'Menu', fn: initMenu }] } };
    showMsg('Derrota...', 70);
  }

  // ---------- Itens: Pokébolas espalhadas pelo campo (um motivo para andar) ----------
  function spawnPickups() {
    pickups = [];
    const n = 4, x0 = 270, x1 = 530;
    for (let i = 0; i < n; i++) {
      const roll = Math.random();
      const type = roll < 0.5 ? 'ball' : roll < 0.84 ? 'great' : 'ultra';
      for (let tries = 0; tries < 30; tries++) {
        const x = x0 + (x1 - x0) * (i / (n - 1)) + rnd(-22, 22);
        if (gy(x) > WATER - 40 || units.some(u => Math.abs(u.x - x) < 26) || pickups.some(p => Math.abs(p.x - x) < 40)) continue;
        pickups.push({ x, type, ph: rnd(0, 6) }); break;
      }
    }
  }

  function stepPickups() {
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i], y = gy(p.x);
      if (y > WATER - 10) { pickups.splice(i, 1); continue; }                 // caiu na água
      const who = teams[0] && teams[0].units.find(u => u.alive && !u.hidden && Math.abs(u.x - p.x) < 14 && Math.abs(u.y - y) < 30);
      if (!who) continue;
      const B = BALLS[p.type], key = B.key;
      campaign[key] = Math.min(9, campaign[key] + 1);
      pickups.splice(i, 1);
      Sfx.ballCatch();
      spray(p.x, y - 10, 12, '#fff27a', 3, 0.02, 34, 2, 'spark');
      floaters.push({ x: p.x, y: y - 34, t: 0, text: p.type === 'ball' ? '+1 Pokébola' : `+1 ${B.name}!`, col: B.col === '#e63b3b' ? '#ffd34d' : B.col, size: 15 });
    }
  }

  function pickupsSvg() {
    return pickups.map(p => {
      const B = BALLS[p.type], y = gy(p.x), bob = Math.sin(frameNo * 0.08 + p.ph) * 3, k = 0.5 + 0.5 * Math.sin(frameNo * 0.1 + p.ph);
      const big = p.type !== 'ball';
      return `<g transform="translate(${f1(p.x)} ${f1(y)})">
        <ellipse cx="0" cy="1" rx="${f1(6 - bob * 0.4)}" ry="1.8" fill="#000" opacity=".25"/>
        <circle cx="0" cy="${f1(-12 + bob)}" r="${f1(11 + k * 3)}" fill="${B.col}" opacity="${(0.18 + k * 0.14).toFixed(2)}"/>
        <g transform="translate(0 ${f1(-12 + bob)})">${Art.ball(big ? 7.5 : 6.5, frameNo * (big ? 2 : 0), 0, B.col)}</g>
        <path transform="translate(0 ${f1(-30 + bob)})" d="M-3.5,0 L3.5,0 L0,5 Z" fill="${big ? B.col : '#fff'}" stroke="#000" stroke-width=".8" stroke-linejoin="round"/>
        ${big ? `<text x="0" y="${f1(-35 + bob)}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="${B.col}" stroke="#000" stroke-width=".6" paint-order="stroke">${p.type === 'great' ? 'GREAT' : 'ULTRA'}</text>` : ''}
      </g>`;
    }).join('');
  }

  // ---------- Fase inicial: arremessar Pokébolas na cidade ----------
  const TRAINER = { x: 70, y: 420 };
  const POND = { x0: 612, x1: 702, water: 432 };
  const WALL = { x0: 468, x1: 486, top: 335 };
  const ROOF = { x0: 700, top: 292 };

  function initIntro() {
    scene = 'intro'; kind = 'intro'; resetCommon();
    genWorld('cidade'); genClouds();
    for (let x = POND.x0; x <= POND.x1; x++) heights[x] = 420 + 32 * Math.sin(Math.PI * (x - POND.x0) / (POND.x1 - POND.x0));
    let pond = `M${POND.x0},${POND.water}`;
    for (let x = POND.x0; x <= POND.x1; x += 2) pond += ` L${x},${f1(Math.max(heights[x], POND.water))}`;
    pond += ` L${POND.x1},${POND.water} Z`;
    $('introBack').innerHTML = Art.cityStatic(pond);
    decor = []; teams = []; units = [];
    const mk = (sp, x, y, extra) => Object.assign(mkUnit(sp, x, -1, -1), { y }, extra);
    intro = {
      balls: 5, t: 0, swing: 0, chosen: null, doneT: 0, outT: 0,
      targets: [
        mk('charmander', 742, ROOF.top, { hard: 3, home: 742 }),
        mk('bulbasaur', 572, 420, { hard: 3, home: 572 }),
        mk('squirtle', 655, POND.water, { hard: 3, home: 655 }),
        mk('pidgey', 330, 190, { hard: 1, hrMul: 1.7, home: 330, flying: true }),
        mk('rattata', 290, 420, { hard: 1, hrMul: 1.45, home: 290, dir: 1 }),
        mk('caterpie', 410, 420, { hard: 1, hrMul: 1.5, home: 410 })
      ]
    };
    wind = 0; state = 'aim';
    { const m = lastAngles.campaign0; angle = m === undefined ? 45 : clamp(m > 90 ? 180 - m : m, 4, 88); }
    showMsg('Acerte a Pokébola no Pokémon que você quer como parceiro!', 260);
    syncButtons();
  }

  function stepIntro() {
    const I = intro; I.t++;
    const t = I.t;
    for (const u of I.targets) {
      if (u === I.chosen && state === 'capture') continue;
      u.moving = false;
      switch (u.sp) {
        case 'charmander': u.x = u.home + 22 * Math.sin(t * 0.02); break;
        case 'bulbasaur': u.x = u.home + 22 * Math.sin(t * 0.017 + 1); break;
        case 'squirtle': {
          const p = (t % 270) / 270;
          const sub = p < 0.5 ? 0 : p < 0.58 ? (p - 0.5) / 0.08 * 36 : p < 0.82 ? 36 : 36 - (p - 0.82) / 0.1 * 36;
          u.y = POND.water + clamp(sub, 0, 36); u.submerged = sub > 14; break;
        }
        case 'pidgey': u.x = u.home + 75 * Math.sin(t * 0.014); u.y = 185 + 22 * Math.sin(t * 0.031) + 14;
          u.face = Math.cos(t * 0.014) >= 0 ? 1 : -1; break;
        case 'rattata': {
          u.x += u.dir * 1.3; u.moving = true; u.walkT++;
          if (u.x > 360) u.dir = -1; if (u.x < 215) u.dir = 1;
          u.face = u.dir; break;
        }
        default: break;
      }
    }
    if (I.swing > 0) I.swing--;
    if (state === 'aim') {
      if (keys.up) angle = Math.min(88, angle + 1.2);
      if (keys.down) angle = Math.max(4, angle - 1.2);
      if (charging) { power = Math.min(100, power + 0.9); Sfx.chargeSet(power); }
    }
    if (state === 'flying') stepIntroProj();
    if (state === 'capture' && cap) stepCapture();
    if (state === 'out' && --I.outT <= 0) {
      const weak = I.targets.filter(u => u.hard === 1);
      const u = pick(weak);
      showMsg(`Acabaram as Pokébolas! ${u.name} decidiu te acompanhar.`, 200);
      pickTarget(u, u.x, u.y - 14);
    }
    if (I.doneT > 0 && --I.doneT === 0) newCampaign(I.chosen.sp);
  }

  function fireIntro() {
    if (state !== 'aim' || !charging) return;
    const a = angle * Math.PI / 180, sp = (3 + power * 0.075) * 1.3;
    projs.push({ wk: 'ball', wp: WEAPONS.ball, owner: 'trainer', x: TRAINER.x + 16, y: TRAINER.y - 52,
                 vx: sp * Math.cos(a), vy: -sp * Math.sin(a), trail: [], spin: 0, age: 0 });
    intro.balls--; intro.swing = 10; lastAngles.campaign0 = angle;
    Sfx.chargeStop(); Sfx.ballThrow();
    power = 0; charging = false; state = 'flying';
  }

  function stepIntroProj() {
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i];
      p.trail.push({ x: p.x, y: p.y }); if (p.trail.length > 10) p.trail.shift();
      let out = null, hit = null;
      for (let s = 0; s < 3 && !out && !hit; s++) {
        p.vy += GRAV / 3; p.x += p.vx / 3; p.y += p.vy / 3; p.age++;
        if (p.x < -40 || p.x > W + 40 || p.y > H + 40) { out = 'gone'; break; }
        for (const u of intro.targets) {
          if (u.submerged) continue;
          const c = centerOf(u);
          if (Math.hypot(c.x - p.x, c.y - p.y) < hitRof(u) + 3) { hit = u; break; }
        }
        if (hit) break;
        if (p.x > WALL.x0 && p.x < WALL.x1 && p.y > WALL.top) { out = 'wall'; break; }
        if (p.x > ROOF.x0 && p.y > ROOF.top) { out = 'wall'; break; }
        if (p.x > POND.x0 && p.x < POND.x1 && p.y > POND.water + 2) { out = 'water'; break; }
        if (p.x >= 0 && p.x < W && p.y >= heights[Math.round(p.x)]) { out = 'ground'; break; }
      }
      if (hit) { projs.splice(i, 1); pickTarget(hit, p.x, p.y); }
      else if (out) {
        projs.splice(i, 1);
        if (out === 'water') { Sfx.splash(); spray(p.x, POND.water, 10, '#bfe9ff', 3, 0.15, 40, 2, 'drop'); }
        else if (out !== 'gone') { Sfx.ballLand(); spray(p.x, p.y, 8, '#d8c8b0', 2.5, 0.12, 30, 2, 'chunk'); }
        floaters.push({ x: clamp(p.x, 30, 770), y: clamp(p.y, 60, 410), t: 0, text: 'Errou!', col: '#ffffff', size: 16 });
      }
    }
    if (!projs.length && state === 'flying') {
      if (intro.balls > 0) state = 'aim';
      else { state = 'out'; intro.outT = 60; }
    }
  }

  function pickTarget(u, x, y) {
    intro.chosen = u; projs.length = 0;
    Sfx.ballHit();
    startCapture(u, x, y, true, () => {
      Sfx.win();
      showMsg(`${u.name} é o seu parceiro!`, 200);
      intro.doneT = 170; state = 'over';
    });
  }

  // ---------- Captura ----------
  function startCapture(u, x, y, success, done) {
    state = 'capture';
    cap = { u, x, y, by: y, t: 0, success, done, rot: 0, open: 0, alpha: 1, vy: 0, shakes: success ? 3 : 1 + Math.floor(Math.random() * 3),
            groundY: gy(x) - 5, landed: false, stars: false };
    if (scene === 'intro') cap.groundY = u.sp === 'charmander' ? ROOF.top - 5 : u.sp === 'squirtle' ? POND.water - 2 : gy(x) - 5;
    u.hidden = false;
  }

  function stepCapture() {
    const c = cap, u = c.u; c.t++;
    const t = c.t, SH = 22, FALL = 30, S0 = SH + FALL + 12, SK = 46;
    if (t <= SH) { u.capScale = Math.max(0, 1 - t / SH); }
    else if (t === SH + 1) { u.capScale = 0; u.hidden = true; }
    if (t > SH && !c.landed) {
      c.vy += 0.45; c.by += c.vy;
      if (c.by >= c.groundY) {
        c.by = c.groundY; c.landed = true; Sfx.ballLand();
        spray(c.x, c.by + 4, 6, '#d8c8b0', 2, 0.1, 20, 1.6, 'chunk');
      }
    }
    const k = Math.floor((t - S0) / SK);
    if (t >= S0 && k < c.shakes) {
      const ph = (t - S0) - k * SK;
      if (ph === 0) Sfx.ballShake();
      c.rot = ph < 32 ? Math.sin(ph / 32 * Math.PI * 3) * 26 : 0;
    } else c.rot *= 0.8;
    const end = S0 + c.shakes * SK + 14;
    if (t === end) {
      if (c.success) {
        Sfx.ballCatch(); c.stars = true;
        spray(c.x, c.by - 6, 18, '#fff27a', 4, 0.02, 40, 2, 'spark');
        floaters.push({ x: c.x, y: c.by - 40, t: 0, text: 'Capturado!', col: '#ffd34d', size: 20 });
        showMsg(`${u.name} capturado!`, 120);
      } else {
        Sfx.ballFail(); c.open = 1;
        u.hidden = false; u.capScale = 0.01;
        floaters.push({ x: c.x, y: c.by - 40, t: 0, text: 'Escapou!', col: '#ff8a7a', size: 20 });
        showMsg(`${u.name} escapou da Pokébola!`, 100);
      }
    }
    if (t > end && !c.success && u.capScale < 1) u.capScale = Math.min(1, u.capScale + 0.08);
    if (t > end) { c.alpha = c.success ? Math.max(0, 1 - (t - end - 30) / 30) : Math.max(0, 1 - (t - end) / 14); c.open *= 0.92; }
    if (t > end + 60) {
      const done = c.done, ok = c.success;
      u.capScale = 1; cap = null;
      done(ok);
    }
  }

  function captureChance(u, mul = BALLS[ballType].mul) {
    return clamp(spOf(u).catch * mul * (1.05 - (u.hp / u.maxhp) * 0.9), 0.05, 0.95);
  }

  function toggleBall() {
    if (scene !== 'battle' || kind !== 'campaign' || state !== 'aim' || charging) return;
    const avail = BALL_ORDER.filter(k => campaign[BALLS[k].key] > 0);
    if (ballMode) {            // B de novo: troca para a próxima bola (Great, Ultra) e por fim guarda
      const i = avail.indexOf(ballType);
      if (i >= 0 && i < avail.length - 1) { ballType = avail[i + 1]; Sfx.select(); showMsg(`${BALLS[ballType].name} pronta! (chance maior)`, 90); }
      else { ballMode = false; Sfx.click(); showMsg('Pokébola guardada.', 60); }
      return;
    }
    if (!avail.length) { showMsg('Você está sem Pokébolas!', 90); Sfx.ballFail(); return; }
    if (!teams[1].units.concat(guest ? [guest] : []).some(u => u.alive && !u.hidden && u.hp / u.maxhp <= WEAK)) {
      showMsg('Nenhum inimigo está fraco o bastante!', 100); Sfx.ballFail(); return;
    }
    ballMode = true; ballType = avail[0]; Sfx.select();
    showMsg(avail.length > 1 ? 'Pokébola pronta! (B troca de bola)' : 'Pokébola pronta! Acerte um inimigo fraco.', 110);
  }

  // ---------- Física e regras ----------
  function carve(cx, cy, r) {
    if (r <= 0) return;
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++) {
      const dd = r * r - (x - cx) * (x - cx);
      if (dd <= 0) continue;
      const dy = Math.sqrt(dd), top = cy - dy, bot = cy + dy;
      if (top <= heights[x] && bot > heights[x]) { heights[x] = bot; grass[x] = 0; }
    }
    for (let x = Math.max(0, Math.floor(cx - r - 8)); x <= Math.min(W - 1, Math.ceil(cx + r + 8)); x++) {
      if (Math.hypot(x - cx, heights[x] - cy) < r + 8) grass[x] = 0;
    }
    decor = decor.filter(d => {
      const hit = gy(d.x) > d.base + 2 || Math.hypot(d.x - cx, d.base - 10 - cy) < r;
      if (hit) burstDecor(d);
      return !hit;
    });
    dirty = true;
  }

  const sideColor = u => (u.team === 2 ? GUEST_COL : teams[u.team] ? teams[u.team].color : '#fff');

  const wxMul = type => (weather && WEATHER[weather].boost[type]) || 1;

  function explode(x, y, p) {
    const wp = p.wp, style = wp.style;
    let anyHurt = false, sup = false, weak = false;
    focus = { x, y };
    cam.shake = Math.max(cam.shake, wp.boom / 6);
    Sfx.boom(style);
    if (wp.boom >= 40 || style === 'thunder') { flash.a = Math.min(0.5, wp.boom / 100); flash.col = { fire: '#ffd9a0', dragon: '#c8b0ff', thunder: '#fffbb0', rock: '#e8dcc0' }[style] || '#ffffff'; }
    carve(x, y, wp.carve);
    fx.push({ x, y, t: 0, max: 36, r: wp.boom, fill: FX_FILL[style] });
    burst(x, y, style);
    for (const u of units) {
      if (!u.alive || u.hidden) continue;
      const c = centerOf(u), d = Math.hypot(c.x - x, c.y - y);
      if (d >= wp.boom) continue;
      const k = 1 - d / wp.boom, mult = typeMult(wp.type, spOf(u).types);
      const dmg = Math.round(wp.dmg * k * mult * wxMul(wp.type));
      if (dmg > 0) {
        u.hp -= dmg; u.hurt = 24; anyHurt = true;
        if (p.ownerUnit && p.ownerUnit.team === 0 && u.team > 0) p.ownerUnit.dealt += dmg;
        floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: '-' + dmg, col: sideColor(u) });
        if (mult > 1 && k > 0.2) { sup = true; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Super efetivo!', col: '#ff9a1a', size: 12 }); }
        else if (mult < 1 && k > 0.2) { weak = true; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Pouco efetivo...', col: '#b8c0cc', size: 12 }); }
      }
      if (wp.web && k > 0.15 && !(u.team === 2 && u.webbed)) { u.webbed = true; floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 34, t: 6, text: 'Preso! Perde a vez', col: '#ffffff', size: 12 }); }
      if (wp.push) {
        const dir = (u.x - x) >= 0 ? 1 : -1;
        u.x = clamp(u.x + dir * wp.push * k, 8, W - 8);
      }
    }
    if (anyHurt && wxMul(wp.type) > 1) floaters.push({ x, y: y - 30, t: 0, text: WEATHER[weather].name + ' reforça!', col: '#9fe0ff', size: 12 });
    if (anyHurt) Sfx.hurt();
    if (sup) setTimeout(() => Sfx.superEff(), 140);
    else if (weak) setTimeout(() => Sfx.weakEff(), 140);
  }

  // Cria os projéteis de um ataque (alguns lançam vários)
  function launch(wk, x, y, a, sp, owner, ownerUnit) {
    const wp = WEAPONS[wk];
    for (let i = 0; i < wp.count; i++) {
      const off = wp.count === 1 ? 0 : (i - (wp.count - 1) / 2) * wp.spread * Math.PI / 180;
      const aa = a + off, s = sp * wp.speed;
      projs.push({ wk, wp, owner, ownerUnit, x, y, vx: s * Math.cos(aa), vy: -s * Math.sin(aa), trail: [], spin: rnd(0, 6), age: 0 });
    }
  }

  function fire() {
    if (state !== 'aim' && state !== 'ai') return;
    const u = activeUnit(); if (!u) return;
    const S = spOf(u), a = angle * Math.PI / 180, sp = 3 + power * 0.075;
    u.face = Math.cos(a) >= 0 ? 1 : -1;
    if (!ballMode && WEAPONS[S.weapon].none) {
      u.hop = 1; splashU = u; state = 'skip'; skipT = 80; walkBudget = 0; charging = false; power = 0; ai = null;
      Sfx.chargeStop(); Sfx.splash();
      showMsg(`${u.name} usou Splash! Mas nada aconteceu...`, 80);
      return;
    }
    if (ballMode) {
      launch('ball', u.x + u.face * 8 * u.scale, u.y - S.h * 0.6 * u.scale, a, sp, 'player', u);
      projs[projs.length - 1].bt = ballType;
      campaign[BALLS[ballType].key]--; ballMode = false; Sfx.ballThrow();
    } else {
      const mx = u.x + u.face * S.mouth[0] * u.scale, my = u.y + S.mouth[1] * u.scale;
      launch(S.weapon, mx, my, a, sp, 'unit', u);
      u.breath = 18; Sfx.shoot(WEAPONS[S.weapon].style);
      muzzle(mx, my, WEAPONS[S.weapon].style, a);
    }
    Sfx.chargeStop();
    lastAngles[kind + turnTeam] = angle;
    power = 0; charging = false; state = 'flying'; ai = null;
  }

  function voltShoot() {
    const deg = rnd(40, 75);
    const a = (voltSide > 0 ? deg : 180 - deg) * Math.PI / 180;
    launch('volt', neutral.x, neutral.y - 34, a, rnd(5, 6.5), 'volt', null);
    lastShotVolt = true; state = 'flying'; Sfx.shoot('thunder');
    muzzle(neutral.x, neutral.y - 34, 'thunder', a);
  }

  // ---------- Efeitos do tiro ----------
  const STYLE_COL = { rock: '#c8b898', fire: '#ffb020', leaf: '#7be07b', water: '#9fe0ff', thunder: '#fff27a', normal: '#fff6c8', gust: '#ffffff', web: '#ffffff', dragon: '#9a6aff' };

  function muzzle(x, y, style, a) {
    const col = STYLE_COL[style] || '#fff';
    fx.push({ x, y, t: 0, max: 16, r: 20, fill: FX_FILL[style] });
    for (let i = 0; i < 12; i++) {
      const s = rnd(1, 3.2), da = rnd(-0.5, 0.5);
      addPart({ x, y, vx: Math.cos(a + da) * s, vy: -Math.sin(a + da) * s, g: 0, life: 20, max: 20, r: rnd(1.2, 2.6), col, kind: 'ember' });
    }
    if (style === 'fire' || style === 'dragon' || style === 'thunder') cam.shake = Math.max(cam.shake, 2);
  }

  // rastro de partículas que sai do projétil (cada ataque tem o seu)
  function trailFx(p) {
    if (p.wk === 'ball') return;
    const st = p.wp.style, x = p.x, y = p.y, e = frameNo % 2 === 0;
    switch (st) {
      case 'fire':
        if (e) addPart({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-0.3, 0.3), vy: rnd(-0.8, -0.2), g: -0.01, life: 26, max: 26, r: rnd(1.4, 2.8), col: pick(['#ffb020', '#ff7a1a', '#ffe27a']), kind: 'ember' });
        break;
      case 'dragon':
        addPart({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-0.4, 0.4), vy: rnd(-0.6, 0.2), g: 0, life: 30, max: 30, r: rnd(1.4, 3), col: pick(['#9a6aff', '#c8b0ff', '#5a8aff']), kind: 'ember' });
        break;
      case 'water':
        addPart({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: rnd(-0.4, 0.4), vy: rnd(-0.3, 0.3), g: 0.12, life: 30, max: 30, r: rnd(1.2, 2.2), col: '#bfe9ff', kind: 'drop' });
        break;
      case 'leaf':
        if (frameNo % 3 === 0) addPart({ x, y, vx: rnd(-0.4, 0.4), vy: rnd(-0.2, 0.4), g: 0.02, life: 44, max: 44, r: rnd(2, 3), col: '#5cc46a', kind: 'leaf' });
        break;
      case 'thunder':
        addPart({ x, y, vx: rnd(-1.6, 1.6), vy: rnd(-1.6, 1.6), g: 0, life: 12, max: 12, r: rnd(1, 1.8), col: '#fff27a', kind: 'spark' });
        break;
      case 'normal':
        if (frameNo % 3 === 0) addPart({ x, y, vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), g: 0, life: 18, max: 18, r: rnd(1.4, 2.4), col: '#fff6c8', kind: 'ember' });
        break;
      case 'gust':
        if (e) addPart({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-0.5, 0.2), vy: rnd(-0.3, 0.3), g: 0, life: 22, max: 22, r: rnd(1.4, 2.4), col: '#ffffff', kind: 'drop' });
        break;
      case 'web':
        if (e) addPart({ x, y, vx: rnd(-0.2, 0.2), vy: rnd(0, 0.3), g: 0.02, life: 44, max: 44, r: 1.2, col: '#ffffff', kind: 'drop' });
        break;
      case 'rock':
        if (e) addPart({ x: x + rnd(-3, 3), y: y + rnd(-3, 3), vx: rnd(-0.4, 0.4), vy: rnd(-0.2, 0.5), g: 0.05, life: 28, max: 28, r: rnd(1.4, 2.6), col: pick(['#b8a898', '#8c8f94', '#d8c8b0']), kind: 'ember' });
        break;
    }
  }

  function stepProjs() {
    for (let i = projs.length - 1; i >= 0; i--) {
      const p = projs[i], isBall = p.wk === 'ball';
      trailFx(p);
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 14) p.trail.shift();
      let outcome = null, target = null;
      for (let s = 0; s < 3 && !outcome; s++) {
        p.vx += wind * 0.0012;
        p.vy += GRAV * p.wp.grav / 3;
        p.x += p.vx / 3; p.y += p.vy / 3; p.age++;
        if (p.x < -60 || p.x > W + 60 || p.y > H + 60) { outcome = 'gone'; break; }
        if (p.y >= WATER && p.wp.style !== 'water') {
          outcome = 'gone'; Sfx.splash();
          for (let k = 0; k < 10; k++) addPart({ x: p.x, y: WATER, vx: rnd(-1.5, 1.5), vy: rnd(-3, -1), g: 0.15, life: 40, max: 40, r: rnd(1.2, 2.2), col: '#bfe9ff', kind: 'drop' });
          break;
        }
        for (const u of units) {
          if (!u.alive || u.hidden) continue;
          if (u === p.ownerUnit && p.age < 40) continue;
          if (isBall && u.team === 0) continue;                       // a bola atravessa os seus parceiros
          const c = centerOf(u);
          if (Math.hypot(c.x - p.x, c.y - p.y) < hitRof(u)) { target = u; break; }
        }
        if (target) { outcome = 'unit'; break; }
        if (p.x >= 0 && p.x < W && p.y >= heights[Math.round(p.x)]) { outcome = 'ground'; break; }
        if (neutral && p.owner !== 'volt' && Math.hypot(neutral.x - p.x, (neutral.y - 14) - p.y) < 14) { outcome = 'ground'; break; }
      }
      if (!outcome) continue;
      projs.splice(i, 1);
      if (outcome === 'gone') continue;
      if (isBall) { ballResolve(p, target, outcome); continue; }
      explode(p.x, Math.min(p.y, H), p);
    }
    if (!projs.length && state === 'flying') state = 'settle';
  }

  function ballResolve(p, u, outcome) {
    focus = { x: p.x, y: p.y };
    if (!u) {
      Sfx.ballLand();
      spray(p.x, p.y, 8, '#d8c8b0', 2.5, 0.12, 30, 2, 'chunk');
      floaters.push({ x: clamp(p.x, 30, 770), y: clamp(p.y - 20, 60, 440), t: 0, text: 'Errou!', col: '#ffffff', size: 16 });
      return;
    }
    Sfx.ballHit();
    const frac = u.hp / u.maxhp;
    if (frac > WEAK) {
      Sfx.ballFail();
      floaters.push({ x: u.x, y: u.y - spOf(u).h * u.scale - 18, t: 0, text: 'Ainda está forte!', col: '#ffb3a8', size: 14 });
      showMsg(`${u.name} ainda está forte demais!`, 100);
      return;
    }
    const ok = Math.random() < captureChance(u, BALLS[p.bt || 'ball'].mul);
    startCapture(u, p.x, p.y, ok, success => {
      if (success) {
        u.alive = false; u.captured = true; u.hp = 0;
        campaign.roster.push(u.sp); campaign.xp.push(0); stageCaught.push(u.sp);
        if (u === guest) { guest = null; gCool = 1 + Math.floor(Math.random() * 3); units = units.filter(v => v !== u); }
      }
      state = 'settle';
    });
    if (cap) cap.col = BALLS[p.bt || 'ball'].col;
  }

  function updateUnits() {
    for (const u of units) {
      if (!u.alive || (scene === 'intro')) continue;
      const g = gy(u.x);
      if (u.y < g - 0.5) u.y = Math.min(g, u.y + 2.5);
      else if (u.y > g + 0.5) u.y = g;
    }
    for (let i = graves.length - 1; i >= 0; i--) {
      const g = graves[i];
      g.y = Math.min(gy(g.x), g.y + 2.5);
      if (g.y > WATER) graves.splice(i, 1);
    }
  }

  function walkUnit(u, dir) {
    if (!u || walkBudget <= 0) return false;
    const nx = clamp(u.x + dir * 1.5, 8, W - 8);
    if (gy(nx) < u.y - 10) return false;                              // parede alta demais
    if (neutral && Math.abs(nx - VOLT_X) < 18) return false;
    for (const v of units) if (v !== u && v.alive && !v.hidden && Math.abs(v.x - nx) < 12 && Math.abs(v.y - u.y) < 22) return false;
    u.x = nx; u.moving = true; u.walkT++;
    if (u.walkT % 10 === 0) Sfx.step();
    walkBudget -= 1.5;
    return true;
  }

  function nextAlive(t, from) {
    const n = t.units.length;
    for (let i = 1; i <= n; i++) { const j = (((from + i) % n) + n) % n; if (t.units[j].alive) return j; }
    return Math.max(0, from);
  }
  function fixCur(t) {
    if (!t.units[t.cur] || !t.units[t.cur].alive) { const i = t.units.findIndex(u => u.alive); if (i >= 0) t.cur = i; }
  }

  function nextFree(t, from) {
    const n = t.units.length;
    for (let i = 1; i <= n; i++) { const j = (((from + i) % n) + n) % n; const v = t.units[j]; if (v.alive && !v.stuck) return j; }
    return from;
  }

  function startTurn() {
    const t = teams[turnTeam];
    // teia: quem foi preso fica sem agir neste turno do seu time
    for (const v of t.units) { v.stuck = v.alive && v.webbed; v.webbed = false; }
    const free = t.units.filter(v => v.alive && !v.stuck);
    ai = null; charging = false; power = 0; ballMode = false;
    if (!free.length) {
      const who = kind === 'campaign' ? (t.ai ? 'Os selvagens' : 'Seu time') : `Time ${t.name}`;
      state = 'skip'; skipT = 100; walkBudget = 0;
      showMsg(`${who}: preso na teia, perde a vez!`, 100);
      Sfx.weakEff();
      return;
    }
    if (t.ai) t.cur = nextFree(t, t.cur);
    else if (!t.units[t.cur] || !t.units[t.cur].alive || t.units[t.cur].stuck) t.cur = t.units.indexOf(free[0]);
    const u = activeUnit();
    const wmax = kind === 'campaign' ? STAGES[stageIdx].wind : 3;
    wind = Math.round(rnd(-wmax, wmax));
    walkBudget = WALK_MAX;
    const mem = lastAngles[kind + turnTeam];        // mantém o último ângulo usado
    if (t.ai) {
      state = 'ai'; ai = { phase: 'think0', t: 0 };
      angle = mem !== undefined ? mem : 135;
      showMsg(`${u.name} selvagem ataca!`, 90);
    } else {
      state = 'aim';
      angle = mem !== undefined ? mem : (u.face === 1 ? 45 : 135);
      showMsg(kind === 'campaign' ? `Sua vez: ${u.name}!` : `Vez de ${t.name}!`, 110);
    }
    if (u.stuck) u.stuck = false;
    Sfx.turn();
  }

  function switchUnit() {
    if (scene !== 'battle' || state !== 'aim' || charging) return;
    const t = teams[turnTeam];
    const j = nextFree(t, t.cur);
    if (j !== t.cur) { t.cur = j; Sfx.click(); ballMode = false; }
  }

  function settle() {
    if (projs.length) return;
    if (units.some(u => u.alive && !u.hidden && u.y < gy(u.x) - 0.5)) return;   // ainda caindo
    for (const u of units) {
      if (!u.alive) continue;
      const drowned = u.y > WATER - 6;
      if (u.hp <= 0 || drowned) {
        u.alive = false; u.hp = 0;
        if (drowned) {
          for (let k = 0; k < 16; k++) addPart({ x: u.x, y: WATER, vx: rnd(-2, 2), vy: rnd(-4, -1.5), g: 0.15, life: 45, max: 45, r: rnd(1.5, 2.5), col: '#bfe9ff', kind: 'drop' });
          Sfx.splash();
        } else if (kind === 'versus') graves.push({ x: u.x, y: u.y - 30 });
        else { smoke(u.x, u.y - 14, 8); spray(u.x, u.y - 14, 10, '#ffffff', 2.5, 0.02, 30, 2, 'spark'); }
        Sfx.death();
        showMsg(`${u.name} ${drowned ? 'afogou!' : 'desmaiou!'}`, 100);
      }
    }
    teams.forEach(fixCur);
    if (guest && !guest.alive) { guest = null; gCool = 1 + Math.floor(Math.random() * 3); }
    units = units.filter(u => u.team !== 2 || u.alive);

    if (kind === 'campaign') {
      if (!teamAlive(teams[1])) { stageClear(); return; }
      if (!teamAlive(teams[0])) { stageLose(); return; }
      if (lastShotGuest) { lastShotGuest = false; turnTeam = 0; startTurn(); return; }
      const next = 1 - turnTeam;
      turnTeam = next;
      if (next === 0 && roundEnd()) return;     // fim da rodada: o visitante pode aparecer, atacar ou sumir
      startTurn();
      return;
    }

    const aliveTeams = teams.filter(teamAlive);
    if (aliveTeams.length <= 1) {
      state = 'over';
      const winner = aliveTeams.length === 0 ? 'Empate' : aliveTeams[0].name;
      showMsg('Fim de jogo! ' + winner + ' venceu! (toque em ↻ ou tecle R)', 1e9);
      Sfx.win();
      return;
    }
    if (lastShotVolt) { lastShotVolt = false; startTurn(); return; }
    const prev = turnTeam;
    let n = prev;
    do { n = (n + 1) % teams.length; } while (!teamAlive(teams[n]));
    turnTeam = n;
    if (n < prev) {
      voltSide = Math.random() < 0.5 ? -1 : 1;
      voltDelay = 100; state = 'volt';
      showMsg('Pikachu vai atirar para a ' + (voltSide < 0 ? 'ESQUERDA' : 'DIREITA') + '!', 100);
      Sfx.voltWarn();
      return;
    }
    startTurn();
  }

  // ---------- Visitantes neutros (atacam qualquer lado, podem ser capturados) ----------
  function roundEnd() {
    const defs = STAGES[stageIdx].guests || [];
    if (guest && guest.alive) {
      const g = guest; gT = 0;
      if (g.turnsLeft <= 0) {
        gMode = 'leave'; state = 'guest';
        showMsg(`${g.name} foi embora...`, 80); Sfx.weakEff();
        return true;
      }
      g.turnsLeft--;
      if (g.webbed) {
        g.webbed = false; g.stuck = true; gMode = 'stuck'; state = 'guest';
        showMsg(`${g.name} está preso na teia!`, 70); Sfx.weakEff();
        return true;
      }
      gMode = 'warn'; gDelay = 100; gSide = Math.random() < 0.5 ? -1 : 1; g.face = gSide; state = 'guest';
      showMsg(`${g.name} vai atacar a ${gSide < 0 ? 'ESQUERDA' : 'DIREITA'}!`, 100); Sfx.voltWarn();
      return true;
    }
    if (!defs.length) return false;
    if (gCool > 0) { gCool--; return false; }
    // sorteio por raridade: quanto menor o número, mais difícil de aparecer
    const def = defs.slice().sort(() => Math.random() - 0.5).find(d => Math.random() < d.rarity);
    if (!def) return false;
    let x = 400, tries = 0;
    do { x = rnd(310, 490); tries++; } while (tries < 40 && (gy(x) > WATER - 40 || units.some(v => v.alive && Math.abs(v.x - x) < 42)));
    if (gy(x) > WATER - 40) return false;
    const g = mkUnit(def.sp, x, 2, Math.random() < 0.5 ? 1 : -1, 1);
    g.capScale = 0; g.turnsLeft = 2 + (def.rarity >= 0.2 ? 1 : 0) + Math.floor(Math.random() * 2);
    guest = g; units.push(g); gMode = 'appear'; gT = 0; state = 'guest';
    showMsg(`${g.name} selvagem apareceu!`, 100); Sfx.ballCatch();
    spray(x, g.y - 14, 14, '#fff27a', 3.2, 0.02, 40, 2, 'spark');
    return true;
  }

  function guestShoot() {
    const g = guest, S = spOf(g), wp = WEAPONS[S.weapon];
    if (!g || wp.none) { lastShotGuest = true; state = 'settle'; return; }
    const deg = rnd(35, 72), a = (gSide > 0 ? deg : 180 - deg) * Math.PI / 180;
    const mx = g.x + gSide * S.mouth[0] * g.scale, my = g.y + S.mouth[1] * g.scale;
    launch(S.weapon, mx, my, a, rnd(5.2, 8.4), 'guest', g);
    g.breath = 18; lastShotGuest = true; state = 'flying'; Sfx.shoot(wp.style);
    muzzle(mx, my, wp.style, a);
  }

  function stepGuest() {
    const g = guest;
    if (!g || !g.alive) { guest = null; startTurn(); return; }
    gT++;
    if (gMode === 'appear') {
      g.capScale = Math.min(1, gT / 30);
      if (gT >= 90) startTurn();
    } else if (gMode === 'warn') {
      g.face = gSide;
      if (gT >= gDelay) guestShoot();
    } else if (gMode === 'stuck') {
      if (gT >= 70) { g.stuck = false; startTurn(); }
    } else if (gMode === 'leave') {
      g.capScale = Math.max(0.001, 1 - gT / 30);
      if (gT === 30) { spray(g.x, g.y - 14, 14, '#ffffff', 3, 0.02, 36, 2, 'spark'); }
      if (gT >= 40) {
        units = units.filter(v => v !== g); guest = null;
        gCool = 1 + Math.floor(Math.random() * 3);        // pode voltar depois (ou não)
        startTurn();
      }
    }
  }

  // ---------- IA dos selvagens ----------
  function simShot(wp, shooter, x0, y0, a, sp) {
    let x = x0, y = y0, vx = sp * wp.speed * Math.cos(a), vy = -sp * wp.speed * Math.sin(a);
    for (let n = 0; n < 700; n++) {
      for (let s = 0; s < 3; s++) {
        vx += wind * 0.0012; vy += GRAV * wp.grav / 3; x += vx / 3; y += vy / 3;
        if (x < -60 || x > W + 60 || y > H + 60 || y >= WATER) return null;
        if (x >= 0 && x < W && y >= heights[Math.round(x)]) return { x, y };
        for (const v of units) {
          if (!v.alive || v.hidden || v === shooter || (wp.style === 'ball' && v.team === 0)) continue;
          const c = centerOf(v);
          if (Math.hypot(c.x - x, c.y - y) < hitRof(v)) return { x, y };
        }
      }
    }
    return null;
  }

  function scoreHit(wp, shooter, lx, ly) {
    let sc = 0;
    for (const v of units) {
      if (!v.alive || v.hidden) continue;
      const c = centerOf(v), d = Math.hypot(c.x - lx, c.y - ly);
      if (d >= wp.boom) continue;
      const dmg = wp.dmg * (1 - d / wp.boom) * typeMult(wp.type, spOf(v).types) * wxMul(wp.type);
      if (v.team === 2) continue;                                   // visitante neutro: a IA ignora
      if (v.team === shooter.team) sc -= dmg * 1.3;
      else sc += dmg + (dmg >= v.hp ? 30 : 0);
    }
    return sc;
  }

  function planShot(u) {
    const S = spOf(u), wp = WEAPONS[S.weapon];
    const foes = units.filter(v => v.alive && !v.hidden && v.team !== u.team && v.team !== 2);
    let best = null, bestS = -1e9, near = null, nearD = 1e9;
    for (let ang = 8; ang <= 172; ang += 3) {
      const a = ang * Math.PI / 180, face = Math.cos(a) >= 0 ? 1 : -1;
      const x0 = u.x + face * S.mouth[0] * u.scale, y0 = u.y + S.mouth[1] * u.scale;
      for (let pw = 18; pw <= 100; pw += 5) {
        const sp = 3 + pw * 0.075;
        let score = 0, dmin = 1e9;
        for (let i = 0; i < wp.count; i++) {
          const off = wp.count === 1 ? 0 : (i - (wp.count - 1) / 2) * wp.spread * Math.PI / 180;
          const r = simShot(wp, u, x0, y0, a + off, sp);
          if (!r) continue;
          score += scoreHit(wp, u, r.x, r.y);
          for (const f of foes) dmin = Math.min(dmin, Math.hypot(r.x - f.x, r.y - f.y));
        }
        score += Math.random() * 0.5;
        if (score > bestS) { bestS = score; best = { ang, pw }; }
        if (dmin < nearD) { nearD = dmin; near = { ang, pw }; }
      }
    }
    let pick1 = bestS > 1 ? best : (near || { ang: 120, pw: 60 });
    const err = STAGES[stageIdx].err;
    const e1 = (Math.random() + Math.random() - 1) * err, e2 = (Math.random() + Math.random() - 1) * err * 0.7;
    ai.angle = clamp(pick1.ang + e1, 5, 175);
    ai.power = clamp(pick1.pw + e2, 15, 100);
  }

  function nearestFoe(u) {
    let best = null, bd = 1e9;
    for (const v of units) if (v.alive && !v.hidden && v.team !== u.team && v.team !== 2) { const d = Math.abs(v.x - u.x); if (d < bd) { bd = d; best = v; } }
    return best;
  }

  function stepAI() {
    const u = activeUnit(), a = ai;
    if (!u || !u.alive || !a) { state = 'settle'; return; }
    a.t++;
    if (a.phase === 'think0') {
      if (spOf(u).weapon === 'splash') { a.phase = 'splash'; a.t = 0; showMsg(`${u.name} usou Splash!`, 80); Sfx.splash(); return; }
      const f = nearestFoe(u);
      a.walkDir = f ? Math.sign(f.x - u.x) * (Math.random() < 0.7 ? 1 : -1) : -1;
      a.walkLeft = (u.webbed || Math.random() < 0.45) ? 0 : Math.round(rnd(15, 50));
      a.phase = 'walk';
    } else if (a.phase === 'walk') {
      if (a.walkLeft > 0 && walkBudget > 0) {
        if (walkUnit(u, a.walkDir || -1)) a.walkLeft -= 1.5; else a.walkLeft = 0;
        u.face = a.walkDir >= 0 ? 1 : -1;
      } else a.phase = 'plan';
    } else if (a.phase === 'plan') {
      planShot(u); a.phase = 'aim';
    } else if (a.phase === 'aim') {
      const d = a.angle - angle;
      if (Math.abs(d) <= 1.8) { angle = a.angle; a.phase = 'wait'; a.t = 0; } else angle += Math.sign(d) * 1.8;
    } else if (a.phase === 'wait') {
      if (a.t > 18) { a.phase = 'charge'; power = 0; charging = true; Sfx.chargeStart(); }
    } else if (a.phase === 'charge') {
      power = Math.min(100, power + 1.3); Sfx.chargeSet(power);
      if (power >= a.power) fire();
    } else if (a.phase === 'splash') {
      u.hop = a.t;
      if (a.t > 80) { u.hop = 0; state = 'settle'; }
    }
  }

  // ---------- Partículas ----------
  function addPart(p) { if (parts.length < 320) parts.push(p); }

  function spray(x, y, n, col, sp, g, life, r, kind) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0.08, Math.PI - 0.08), s = rnd(sp * 0.35, sp);
      addPart({ x, y, vx: Math.cos(a) * s, vy: -Math.sin(a) * s, g, life: rnd(life * 0.6, life), max: life, r: rnd(r * 0.6, r), col, kind });
    }
  }
  function smoke(x, y, n) {
    for (let i = 0; i < n; i++) {
      addPart({ x: x + rnd(-8, 8), y: y + rnd(-6, 4), vx: rnd(-0.3, 0.3) + wind * 0.05, vy: rnd(-0.7, -0.3),
                g: 0, life: rnd(50, 80), max: 80, r: rnd(5, 9), col: '#5d5d5d', kind: 'smoke' });
    }
  }
  function burst(x, y, style) {
    switch (style) {
      case 'fire':
        spray(x, y, 14, '#5b3a20', 4, 0.15, 70, 3.2, 'chunk'); spray(x, y, 18, '#ffb020', 3.2, 0.04, 40, 1.8, 'ember'); smoke(x, y, 6); break;
      case 'leaf':
        spray(x, y, 10, '#5cc46a', 2.5, 0.03, 70, 3.4, 'leaf'); spray(x, y, 5, '#5b3a20', 2.5, 0.15, 50, 2, 'chunk'); break;
      case 'water':
        spray(x, y, 24, '#9fe0ff', 3.8, 0.15, 50, 2.3, 'drop'); break;
      case 'normal':
        spray(x, y, 12, '#fff2c8', 3.6, 0.06, 36, 2.2, 'ember'); spray(x, y, 7, '#5b3a20', 3, 0.15, 55, 2.4, 'chunk'); smoke(x, y, 2); break;
      case 'gust':
        spray(x, y, 14, '#ffffff', 3, 0.0, 44, 2.6, 'drop'); spray(x, y, 6, '#cfe0ff', 2, 0.0, 50, 3, 'drop'); break;
      case 'web':
        spray(x, y, 14, '#ffffff', 2.8, 0.03, 70, 1.6, 'drop'); break;
      case 'rock':
        spray(x, y, 18, '#8c8f94', 4, 0.17, 70, 3.4, 'chunk'); spray(x, y, 10, '#b8a898', 3, 0.15, 60, 2.6, 'chunk'); smoke(x, y, 6); break;
      case 'dragon':
        spray(x, y, 16, '#9a6aff', 4, 0.04, 50, 2.2, 'ember'); spray(x, y, 10, '#5b3a20', 3.6, 0.15, 60, 2.8, 'chunk'); smoke(x, y, 4); break;
      default:
        spray(x, y, 16, '#fff27a', 4.5, 0, 22, 1.4, 'spark'); spray(x, y, 8, '#5b3a20', 3, 0.15, 60, 2.6, 'chunk'); smoke(x, y, 3);
    }
  }
  function burstDecor(d) {
    const y = d.base - 10;
    if (d.type === 'rock' || d.type === 'stalag') spray(d.x, y, 8, '#8c8f94', 3, 0.15, 60, 2.6, 'chunk');
    else if (d.type === 'crystal') spray(d.x, y, 10, d.col, 3, 0.1, 50, 2.2, 'spark');
    else spray(d.x, y, 8, d.type === 'flower' ? d.col : '#4f9a3a', 2.2, 0.03, 70, 3, 'leaf');
  }
  function stepParts() {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g; p.vx *= 0.985;
      if (p.kind === 'leaf') { p.vx += Math.sin((frameNo + i) * 0.15) * 0.05; p.vy = Math.min(p.vy, 1.2); }
      p.x += p.vx; p.y += p.vy;
      if (p.g > 0.1 && p.x >= 0 && p.x < W && p.y >= heights[Math.round(p.x)]) { p.y = heights[Math.round(p.x)]; p.vy *= -0.3; p.vx *= 0.5; }
      if (--p.life <= 0 || p.y > H + 20) parts.splice(i, 1);
    }
  }

  // ---------- Desenho ----------
  const blink = u => ((frameNo + u.blinkOff) % 230) < 7;

  function unitSvg(u, opt = {}) {
    const S = spOf(u), sc = u.scale * u.capScale;
    const bob = Math.sin(frameNo * 0.08 + u.x * 0.1) * 0.7;
    const step = u.moving ? Math.sin(u.walkT * 0.5) * 1.6 : 0;
    const flash = u.hurt > 0 && (u.hurt % 6 < 3);
    const col = opt.color || sideColor(u);
    const hop = u.hop ? -Math.abs(Math.sin(u.hop * 0.18)) * 16 : 0;
    const ctx = { f: frameNo, blink: blink(u), breath: u.breath, bob, step, x: u.x, charge: !!opt.charge, flap: !!u.flying };
    const ly = -(S.h * u.scale + 12);
    let label = '';
    if (!opt.noLabel && u.capScale > 0.5) {
      const hp = clamp(u.hp / u.maxhp, 0, 1);
      label = `<g transform="translate(0 ${f1(ly)})">
        ${opt.extra || ''}
        <text x="0" y="0" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#fff" stroke="#000" stroke-width=".6">${u.name}</text>
        ${Art.typeDots(S.types, 0, -12, TYPE_COLOR)}
        ${opt.noBar ? '' : `<rect x="-15" y="3" width="30" height="5.5" rx="2.75" fill="#000" opacity=".6"/>
        <rect x="-14" y="4" width="${f1(28 * hp)}" height="3.5" rx="1.75" fill="${col}"/>`}
        ${(u.webbed || u.stuck) ? `<g transform="translate(21 -2)" stroke="#fff" stroke-width="1" fill="none"><circle r="4.5"/><circle r="2"/><path d="M-5,0H5M0,-5V5M-3.5,-3.5L3.5,3.5M3.5,-3.5L-3.5,3.5" stroke-width=".7"/></g>` : ''}
      </g>`;
    }
    const web = (u.webbed || u.stuck) ? `<g transform="translate(0 ${f1(-S.hitY * u.scale)})" stroke="#fff" stroke-width="1" fill="rgba(255,255,255,.18)" opacity=".9">
      <circle r="${f1(15 * u.scale)}"/><circle r="${f1(8 * u.scale)}"/>
      <path d="M-15,0H15M0,-15V15M-10.6,-10.6L10.6,10.6M10.6,-10.6L-10.6,10.6" stroke-width=".8" transform="scale(${f1(u.scale)})"/></g>` : '';
    const shadow = opt.noShadow ? '' : `<ellipse cx="0" cy="${f1(gy(u.x) - u.y + 0.5)}" rx="${f1(11 * u.scale)}" ry="${f1(2.6 * u.scale)}" fill="#000" opacity=".25"/>`;
    return `<g transform="translate(${f1(u.x)} ${f1(u.y + hop)})">
      ${shadow}
      <g transform="scale(${f1(u.face * sc)} ${f1(sc)})"${flash ? ' opacity=".45"' : ''}>${Art.draw(u.sp, ctx)}</g>
      ${web}${label}</g>`;
  }

  function renderTerrain() {
    let d = 'M0,' + f1(heights[0]);
    for (let x = 1; x < W; x++) d += ' L' + x + ',' + f1(heights[x]);
    d += ` L${W},${f1(heights[W - 1])} L${W},${H} L0,${H} Z`;
    $('tclipPath').setAttribute('d', d);
    $('tback').setAttribute('d', 'M-12,' + f1(heights[0]) + d.replace(/^M/, ' L'));
    let g = '', b = '', inG = false, inB = false, tf = '';
    for (let x = 0; x < W; x += 2) {
      const y = f1(heights[x]);
      if (grass[x]) { g += (inG ? ' L' : ' M') + x + ',' + y; inG = true; inB = false; }
      else          { b += (inB ? ' L' : ' M') + x + ',' + y; inB = true; inG = false; }
    }
    for (let x = 3; x < W; x += 7) {
      if (!grass[x]) continue;
      const y = heights[x], t = tuft[x];
      tf += `M${x},${f1(y)} l-2,${f1(-t * 0.7)} M${x},${f1(y)} l.6,${f1(-t)} M${x},${f1(y)} l2.6,${f1(-t * 0.6)} `;
    }
    $('edgeGrass').setAttribute('d', g); $('edgeGrassHi').setAttribute('d', g);
    $('edgeBurnt').setAttribute('d', b);
    $('tbackGrass').setAttribute('d', g); $('tbackBurnt').setAttribute('d', b);
    $('tufts').setAttribute('d', tf);
    $('decor').innerHTML = decor.map(Art.decor).join('');
  }

  function renderWater() {
    let back = `M0,${H}`, front = `M0,${H}`;
    for (let x = 0; x <= W; x += 10) {
      back  += ` L${x},${f1(472 + 3 * Math.sin(x * 0.03 + frameNo * 0.04))}`;
      front += ` L${x},${f1(481 + 3 * Math.sin(x * 0.045 - frameNo * 0.05) + 1.5 * Math.sin(x * 0.11 + frameNo * 0.08))}`;
    }
    $('waveBack').setAttribute('d', back + ` L${W},${H} Z`);
    $('waveFront').setAttribute('d', front + ` L${W},${H} Z`);
  }

  function renderClouds() {
    clouds.forEach((c, i) => {
      c.x += c.sp + wind * 0.04;
      if (c.x > W + 110) c.x = -110;
      if (c.x < -110) c.x = W + 110;
      cloudEls[i].setAttribute('transform', `translate(${f1(c.x)} ${f1(c.y)}) scale(${c.s.toFixed(2)})`);
    });
  }

  const ballIcon = (x, y, r) => `<g transform="translate(${x} ${y})">${Art.ball(r, 0)}</g>`;

  // ---------- Clima (desenhado em tela cheia, por cima do mundo) ----------
  function stepWeather() {
    if (weather !== 'storm') { bolt = null; return; }
    if (bolt) { if (++bolt.t > 12) bolt = null; }
    if (--lightT <= 0) {
      lightT = 240 + Math.floor(Math.random() * 360);
      const x = rnd(80, 720); let pts = [[x, 0]], cx = x, cy = 0;
      const endY = rnd(280, 380);
      while (cy < endY) { cx += rnd(-22, 22); cy += rnd(22, 44); pts.push([cx, Math.min(cy, endY)]); }
      bolt = { pts, t: 0 };
      flash.a = 0.7; flash.col = '#f4f6ff';
      setTimeout(() => { if (weather === 'storm') Sfx.boom('thunder'); }, 260);
    }
    if (bolt && bolt.t === 5) flash.a = Math.max(flash.a, 0.45);
  }

  function weatherSvg() {
    if (!weather || scene !== 'battle' || kind !== 'campaign') return '';
    let s = '';
    if (weather === 'rain') {
      s += `<rect width="800" height="500" fill="#0a1a33" opacity=".3"/>`;
      const sl = -wind * 0.1 - 0.12;
      for (let i = 0; i < 90; i++) {
        const sp = 15 + (i % 5) * 2.5, y = ((frameNo * sp + i * 53) % 540) - 20, x = ((i * 131.7) % 880) - 40 + y * -sl;
        s += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x + sl * 16)}" y2="${f1(y + 16)}" stroke="#cfe9ff" stroke-width="${i % 3 ? 1.1 : 1.6}" opacity="${(0.28 + (i % 4) * 0.08).toFixed(2)}" stroke-linecap="round"/>`;
      }
    } else if (weather === 'sun') {
      s += `<rect width="800" height="500" fill="#ffb347" opacity=".09"/>
        <g transform="translate(690 52)">
          <circle r="190" fill="#fff2b0" opacity=".05"/><circle r="120" fill="#fff2b0" opacity=".07"/><circle r="64" fill="#fff6c8" opacity=".14"/>
          ${Array.from({ length: 10 }, (_, i) => `<path transform="rotate(${f1(i * 36 + frameNo * 0.15)})" d="M-5,-70 L0,-260 L5,-70 Z" fill="#fff6c8" opacity=".07"/>`).join('')}
        </g>
        <circle cx="560" cy="150" r="14" fill="#fff6c8" opacity=".07"/><circle cx="470" cy="215" r="22" fill="#ffd9a0" opacity=".06"/><circle cx="390" cy="270" r="10" fill="#fff6c8" opacity=".08"/>`;
    } else if (weather === 'storm') {
      s += `<rect width="800" height="500" fill="#0c1030" opacity=".4"/>`;
      if (bolt) {
        const d = bolt.pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])},${f1(p[1])}`).join(' '), o = Math.max(0, 1 - bolt.t / 12);
        s += `<path d="${d}" fill="none" stroke="#ffe96a" stroke-width="9" stroke-linejoin="round" opacity="${(o * 0.35).toFixed(2)}"/>
              <path d="${d}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" opacity="${o.toFixed(2)}"/>`;
      }
    }
    return s;
  }

  function weatherBadge() {
    if (!weather || kind !== 'campaign') return '';
    const W_ = WEATHER[weather];
    let icon;
    if (weather === 'sun') icon = `<circle r="5.5" fill="#ffd34d"/>${Array.from({ length: 8 }, (_, i) => `<path transform="rotate(${i * 45})" d="M0,-8 L0,-11" stroke="#ffd34d" stroke-width="1.8" stroke-linecap="round"/>`).join('')}`;
    else if (weather === 'rain') icon = `<path d="M-8,2 Q-9,-4 -3,-4 Q-1,-9 4,-6 Q9,-6 8,1 Z" fill="#9fb8d8"/><path d="M-5,5 l-1.5,4 M0,5 l-1.5,4 M5,5 l-1.5,4" stroke="#6ad0ff" stroke-width="1.6" stroke-linecap="round"/>`;
    else icon = `<path d="M-8,0 Q-9,-6 -3,-6 Q-1,-11 4,-8 Q9,-8 8,-1 Z" fill="#6a7090"/><path d="M1,1 L-3,7 L0,7 L-2,12 L4,5 L1,5 Z" fill="#ffe96a" stroke="#8a6a00" stroke-width=".5" stroke-linejoin="round"/>`;
    return `<rect x="478" y="8" width="150" height="34" rx="12" fill="#0d1b2a" opacity=".72"/>
      <g transform="translate(498 25)">${icon}</g>
      <text x="514" y="22" font-size="11" font-weight="bold" fill="#fff">${W_.name}</text>
      <text x="514" y="35" font-size="9.5" fill="#bfe3ff">${W_.note}</text>`;
  }

  function hudSvg() {
    if (scene === 'intro') {
      let s = `<rect x="8" y="8" width="176" height="40" rx="12" fill="#0d1b2a" opacity=".72"/>
        <text x="20" y="25" font-size="10" fill="#ddd" letter-spacing="1">POKÉBOLAS</text>`;
      for (let i = 0; i < 5; i++) s += `<g opacity="${i < intro.balls ? 1 : 0.18}">${ballIcon(26 + i * 28, 36, 7)}</g>`;
      return s;
    }
    if (scene !== 'battle' || state === 'over' || state === 'evolve') return '';
    const isVisit = !!guest && (state === 'guest' || lastShotGuest);
    const isVolt = state === 'volt' || lastShotVolt || isVisit;
    const t = teams[turnTeam], u = activeUnit();
    let name, col;
    if (isVisit) { name = guest.name + ' (visitante)'; col = GUEST_COL; }
    else if (isVolt) { name = 'Pikachu'; col = '#ffd83a'; }
    else if (kind === 'campaign') { name = t.ai ? `${u.name} selvagem` : u.name; col = t.color; }
    else { name = t.name; col = t.color; }
    const walkW = (Math.max(0, walkBudget) / WALK_MAX) * 170;
    const ww = Math.abs(wind) / 3 * 50;
    const wx = wind >= 0 ? 400 : 400 - ww;
    const arrow = wind > 0 ? `M${f1(400 + ww)},26.5 l6,4 l-6,4 Z` : `M${f1(400 - ww)},26.5 l-6,4 l6,4 Z`;
    let s = `
      <rect x="8" y="8" width="222" height="40" rx="12" fill="#0d1b2a" opacity=".72"/>
      <circle cx="26" cy="24" r="7" fill="${col}" stroke="#fff" stroke-width="2"/>
      <text x="40" y="29" font-size="14" font-weight="bold" fill="#fff">Vez: ${name}</text>
      ${isVolt || (t && t.ai) ? '' : `<rect x="40" y="35" width="172" height="5" rx="2.5" fill="#000" opacity=".5"/>
        <rect x="41" y="36" width="${f1(Math.max(0, walkW - 2))}" height="3" rx="1.5" fill="#9be36a"/>`}
      <rect x="330" y="8" width="140" height="34" rx="12" fill="#0d1b2a" opacity=".72"/>
      <text x="400" y="21" text-anchor="middle" font-size="9" fill="#ddd" letter-spacing="1.5">${wind ? 'VENTO' : 'SEM VENTO'}</text>
      <rect x="345" y="27" width="110" height="7" rx="3.5" fill="#000" opacity=".5"/>
      <line x1="400" y1="25" x2="400" y2="36" stroke="#fff" stroke-width="1" opacity=".6"/>
      ${wind ? `<rect x="${f1(wx)}" y="28.5" width="${f1(ww)}" height="4" rx="2" fill="#8fe0ff"/><path d="${arrow}" fill="#8fe0ff"/>` : ''}`;
    s += weatherBadge();
    if (kind === 'campaign') {
      s += `<rect x="238" y="8" width="84" height="40" rx="12" fill="#0d1b2a" opacity=".72"/>
        ${ballIcon(258, 28, 9)}
        <text x="274" y="33" font-size="16" font-weight="bold" fill="#fff">×${campaign.balls}</text>
        <text x="312" y="43" text-anchor="end" font-size="8" fill="#bbb">[B]</text>`;
      if (campaign.great > 0 || campaign.ultra > 0) {
        s += `<rect x="238" y="52" width="150" height="22" rx="11" fill="#0d1b2a" opacity=".72"/>
          <g transform="translate(252 63)">${Art.ball(6, 0, 0, BALLS.great.col)}</g><text x="262" y="67" font-size="12" font-weight="bold" fill="#fff">×${campaign.great}</text>
          <g transform="translate(312 63)">${Art.ball(6, 0, 0, BALLS.ultra.col)}</g><text x="322" y="67" font-size="12" font-weight="bold" fill="#fff">×${campaign.ultra}</text>`;
      }
      if (ballMode) s += `<rect x="238" y="78" width="170" height="22" rx="11" fill="${BALLS[ballType].col}" opacity=".92"/>
        <text x="323" y="93" text-anchor="middle" font-size="11" font-weight="bold" fill="${ballType === 'ultra' ? '#2a1a00' : '#fff'}">${BALLS[ballType].name.toUpperCase()} ATIVA</text>`;
    }
    return s;
  }

  function msgSvg() {
    if (!msg) return '';
    const w = Math.min(780, msg.length * 12.5 + 40);
    const my = state === 'guest' ? 84 : 206;       // durante o visitante a mensagem sobe para não cobri-lo
    return `<rect x="${f1(400 - w / 2)}" y="${my}" width="${f1(w)}" height="44" rx="14" fill="#000" opacity=".45"/>
            <text x="400" y="${my + 29}" text-anchor="middle" font-size="22" font-weight="bold" fill="#fff">${msg}</text>`;
  }

  function projSvg(p) {
    const st = p.wp.style;
    let ph = '';
    if (p.wk === 'ball') {
      p.trail.forEach((tp, i) => {
        const k = (i + 1) / p.trail.length;
        ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1 + 2 * k)}" fill="#fff" opacity="${(k * 0.4).toFixed(2)}"/>`;
      });
      return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)})">${Art.ball(6, frameNo * 14, 0, BALLS[p.bt || 'ball'].col)}</g>`;
    }
    switch (st) {
      case 'fire':
      case 'dragon': {
        const c1 = st === 'fire' ? ['#ffb020', '#ff5a1f'] : ['#b79cff', '#6a3cff'];
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(2 + 5 * k)}" fill="${k > 0.5 ? c1[0] : c1[1]}" opacity="${(k * 0.7).toFixed(2)}"/>`;
        });
        return ph + `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1((st === 'fire' ? 7 : 8.5) + Math.sin(frameNo * 0.6) * 1.2)}" fill="url(#${st === 'fire' ? 'fireball' : 'dragFire'})"/>`;
      }
      case 'leaf': {
        const deg = Math.atan2(p.vy, p.vx) * 180 / Math.PI + Math.sin(frameNo * 0.4 + p.spin) * 25;
        return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)})">
          <path d="M-8,0 Q0,-6 8,0 Q0,6 -8,0 Z" fill="url(#gGreen)" stroke="#1d4a2a" stroke-width=".8"/>
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#1d4a2a" stroke-width=".7"/></g>`;
      }
      case 'water':
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1.5 + 2 * k)}" fill="#bfe9ff" opacity="${(k * 0.6).toFixed(2)}"/>`;
        });
        return ph + `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="5.2" fill="#7fd0ff" stroke="#1f6fb0" stroke-width="1"/>
               <circle cx="${f1(p.x - 1.6)}" cy="${f1(p.y - 1.6)}" r="1.7" fill="#fff"/>`;
      case 'normal': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1.5 + 3 * k)}" fill="#fff" opacity="${(k * 0.5).toFixed(2)}"/>`;
        });
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 12) % 360})">
          <path d="M0,-7 L2,-2 L7,-2 L3,1.5 L4.5,7 L0,3.5 L-4.5,7 L-3,1.5 L-7,-2 L-2,-2 Z" fill="#fff6c8" stroke="#c98a2a" stroke-width="1" stroke-linejoin="round"/></g>`;
      }
      case 'gust': {
        const deg = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
        return `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(deg)})" opacity=".92">
          <path d="M-12,-5 Q4,-12 10,0 Q4,-5 -12,-2 Z" fill="#fff" stroke="#9ab8e8" stroke-width=".9"/>
          <path d="M-12,5 Q4,12 10,0 Q4,5 -12,2 Z" fill="#e3eeff" stroke="#9ab8e8" stroke-width=".9"/></g>`;
      }
      case 'rock': {
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(1.5 + 3 * k)}" fill="#c8b898" opacity="${(k * 0.4).toFixed(2)}"/>`;
        });
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 9 + p.spin * 50) % 360})">
          <path d="M-8,-3 L-3,-8 L5,-7 L9,-1 L6,6 L-3,8 L-9,3 Z" fill="url(#gRock)" stroke="#3c3c46" stroke-width="1.3" stroke-linejoin="round"/>
          <path d="M-4,-2 L1,-4 M0,3 L4,1" stroke="#4a4a56" stroke-width=".9" stroke-linecap="round"/></g>`;
      }
      case 'web':
        p.trail.forEach((tp, i) => {
          const k = (i + 1) / p.trail.length;
          ph += `<circle cx="${f1(tp.x)}" cy="${f1(tp.y)}" r="${f1(0.8 + 1.6 * k)}" fill="#fff" opacity="${(k * 0.5).toFixed(2)}"/>`;
        });
        return ph + `<g transform="translate(${f1(p.x)} ${f1(p.y)}) rotate(${(frameNo * 5) % 360})" stroke="#fff" stroke-width="1" fill="rgba(255,255,255,.35)">
          <circle r="6"/><circle r="3"/><path d="M-6,0H6M0,-6V6M-4.3,-4.3L4.3,4.3M4.3,-4.3L-4.3,4.3" stroke-width=".8"/></g>`;
      default: { // trovoada em ziguezague
        const pts = p.trail.concat([{ x: p.x, y: p.y }]);
        const d = pts.map((tp, i) => `${i ? 'L' : 'M'}${f1(tp.x)},${f1(tp.y + (i % 2 ? 3 : -3))}`).join(' ');
        return `<path d="${d}" fill="none" stroke="#ffd000" stroke-width="4.5" stroke-linejoin="round" opacity=".45"/>
               <path d="${d}" fill="none" stroke="#fffbd0" stroke-width="2" stroke-linejoin="round"/>
               <circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="4.5" fill="url(#zap)"/>`;
      }
    }
  }

  function captureSvg() {
    if (!cap) return '';
    const c = cap;
    let s = '';
    if (c.t <= 22) s += `<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${f1(6 + c.t * 1.2)}" fill="#fff" opacity="${(1 - c.t / 22).toFixed(2)}"/>`;
    s += `<g opacity="${c.alpha.toFixed(2)}"><g transform="translate(${f1(c.x)} ${f1(c.by)}) rotate(${f1(c.rot)})">${Art.ball(8, 0, c.open, c.col || '#e63b3b')}</g></g>`;
    if (c.stars) for (let i = 0; i < 3; i++) {
      const a = frameNo * 0.08 + i * 2.1;
      s += `<text x="${f1(c.x + Math.cos(a) * 14)}" y="${f1(c.by - 16 - Math.abs(Math.sin(a)) * 8)}" font-size="12" text-anchor="middle" fill="#ffd34d" opacity="${c.alpha.toFixed(2)}">★</text>`;
    }
    return s;
  }

  function weakMarker(u) {
    // bolinha pulsando sobre inimigos que já podem ser capturados
    const S = spOf(u), bounce = Math.sin(frameNo * 0.2) * 2.5;
    let s = `<g transform="translate(0 ${f1(-(S.h * u.scale + 36) + bounce)})">${Art.ball(6, 0)}</g>`;
    if (ballMode) s += `<text x="0" y="${f1(-(S.h * u.scale + 46))}" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffd34d" stroke="#000" stroke-width=".7">${Math.round(captureChance(u) * 100)}%</text>`;
    return s;
  }

  function renderBattleUnits(act) {
    let wh = '';
    for (const u of units) {
      if (!u.alive) continue;
      if (u.hidden && !(cap && cap.u === u)) continue;
      if (u.hidden) continue;
      let extra = '';
      const isFoe = kind === 'campaign' && u.team >= 1;
      let s = unitSvg(u, u.team === 2 ? { extra: `<text x="0" y="-26" text-anchor="middle" font-size="8.5" font-weight="bold" fill="${GUEST_COL}" stroke="#000" stroke-width=".5" letter-spacing="1">VISITANTE</text>` } : {});
      if (isFoe && u.hp / u.maxhp <= WEAK && state !== 'capture') s = s.replace(/<\/g>$/, `${weakMarker(u)}</g>`);
      if (u === act && (state === 'aim' || state === 'ai') && !teams[turnTeam].ai) {
        s = s.replace(/<\/g>$/, `<path transform="translate(0 ${f1(-(spOf(u).h * u.scale + 34) + Math.sin(frameNo * 0.15) * 3)})" d="M-6,0 L6,0 L0,8 Z"
          fill="${teams[u.team].color}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></g>`);
      }
      wh += s + extra;
    }
    return wh;
  }

  function aimSvg(x1, y1, a, rel) {
    const x2 = x1 + Math.cos(a) * 46, y2 = y1 - Math.sin(a) * 46;
    return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"
              stroke="#fff" stroke-opacity=".85" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round"/>
             <g transform="translate(${f1(x2)} ${f1(y2)})">
               <circle r="6" fill="none" stroke="${ballMode ? '#ffd34d' : '#ff4d4d'}" stroke-width="2"/>
               <path d="M-10,0 L-4,0 M4,0 L10,0 M0,-10 L0,-4 M0,4 L0,10" stroke="${ballMode ? '#ffd34d' : '#ff4d4d'}" stroke-width="2" stroke-linecap="round"/>
             </g>
             <text x="${f1(x2)}" y="${f1(y2 - 13)}" text-anchor="middle" font-size="10" font-weight="bold" fill="#fff" stroke="#000" stroke-width=".4">${rel}°</text>`;
  }

  function renderIntro() {
    const I = intro;
    // treinador
    const charge = charging;
    const arm = I.swing > 0 ? -85 + (I.swing / 10) * 40 : (charge ? 20 + power * 1.25 : 12 + Math.sin(frameNo * 0.05) * 3);
    const hold = state === 'aim' && I.balls > 0;
    const bob = Math.sin(frameNo * 0.08) * 0.6;
    let s = `<g transform="translate(${TRAINER.x} ${TRAINER.y})">
      ${Art.trainer({ f: frameNo, bob, step: 0, armBack: 8 + Math.sin(frameNo * 0.05) * 2, hold: false })}
      ${Art.trainerFront({ f: frameNo, bob, arm, hold })}</g>`;
    // alvos
    for (const u of I.targets) {
      if (u === I.chosen && state === 'capture' && u.hidden) continue;
      const stars = u.hard === 3 ? '★★★' : '★';
      const label = `<text x="0" y="-26" text-anchor="middle" font-size="10" font-weight="bold" fill="${u.hard === 3 ? '#ff9a8a' : '#a8f0a0'}" stroke="#000" stroke-width=".5">${stars}</text>`;
      if (u.sp === 'squirtle') {
        s += `<g clip-path="url(#pondClip)">${unitSvg(u, { noLabel: true, noShadow: true })}</g>
          <g transform="translate(${f1(u.x)} 388)"><text x="0" y="0" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#fff" stroke="#000" stroke-width=".6">${u.name}</text>
          ${Art.typeDots(spOf(u).types, 0, -12, TYPE_COLOR)}<text x="0" y="-26" text-anchor="middle" font-size="10" font-weight="bold" fill="#ff9a8a" stroke="#000" stroke-width=".5">★★★</text></g>`;
      } else s += unitSvg(u, { color: '#fff', noBar: true, noShadow: u.sp === 'pidgey', extra: label });
    }
    $('intro').innerHTML = s;

    let aim = '';
    if (state === 'aim' && I.balls > 0) aim = aimSvg(TRAINER.x + 16, TRAINER.y - 52, angle * Math.PI / 180, Math.round(angle));
    $('aim').innerHTML = aim;
  }

  function renderAll() {
    if (dirty) { renderTerrain(); dirty = false; }
    renderWater();
    renderClouds();
    $('Lsky').setAttribute('transform', camT(0.08));
    $('Lfar').setAttribute('transform', camT(0.25));
    $('Lnear').setAttribute('transform', camT(0.5));
    $('Lmid').setAttribute('transform', camT(0.65));
    $('Lworld').setAttribute('transform', camT(1));
    $('Lfore').setAttribute('transform', camT(1.3));

    const inBattle = scene === 'battle';
    const act = inBattle && state !== 'over' && teams[turnTeam] ? activeUnit() : null;
    if (act && (state === 'aim' || (state === 'ai' && ai && ai.phase !== 'walk' && ai.phase !== 'think0')) && act.alive)
      act.face = Math.cos(angle * Math.PI / 180) >= 0 ? 1 : -1;

    if (scene === 'intro') renderIntro();
    else {
      $('intro').innerHTML = '';
      let aim = '';
      if (inBattle && act && (state === 'aim' || (state === 'ai' && ai && ['aim', 'wait', 'charge'].includes(ai.phase)))) {
        const S = spOf(act);
        const a = angle * Math.PI / 180;
        const mx = ballMode ? 8 : S.mouth[0], my = ballMode ? -S.h * 0.6 : S.mouth[1];
        const rel = Math.round(act.face === 1 ? angle : 180 - angle);
        aim = aimSvg(act.x + act.face * mx * act.scale, act.y + my * act.scale, a, rel);
      }
      $('aim').innerHTML = aim;
    }

    if (scene === 'battle') $('introBack').innerHTML = kind === 'campaign' ? pickupsSvg() : '';
    $('graves').innerHTML = graves.map(g => `<g transform="translate(${f1(g.x)} ${f1(g.y)})">
      <path d="M-7,0 L-7,-14 Q-7,-21 0,-21 Q7,-21 7,-14 L7,0 Z" fill="#b4b8be" stroke="#5c6067" stroke-width="1.2"/>
      <path d="M0,-17 L0,-6 M-3.5,-13 L3.5,-13" stroke="#5c6067" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="-9" y="-1.5" width="18" height="3" rx="1" fill="#6b4a2b"/></g>`).join('');

    $('worms').innerHTML = scene === 'intro' ? '' : (inBattle ? renderBattleUnits(act) : units.map(u => unitSvg(u, { color: '#fff', noBar: true })).join(''));

    $('volt').innerHTML = neutral
      ? `<g transform="translate(${neutral.x} ${f1(gy(neutral.x))})">
           <ellipse cx="0" cy=".5" rx="11" ry="2.6" fill="#000" opacity=".25"/>
           ${Art.draw('pikachu', { f: frameNo, blink: false, breath: 0, bob: 0, step: 0, x: 0, charge: state === 'volt' })}</g>
         <text x="${neutral.x}" y="${f1(gy(neutral.x) - 50)}" text-anchor="middle" font-size="10.5" font-weight="bold"
               fill="#fff27a" stroke="#000" stroke-width=".6">Pikachu</text>` : '';

    $('proj').innerHTML = projs.map(projSvg).join('') + captureSvg();

    $('pshadow').innerHTML = projs.map(p => {
      if (p.x < 0 || p.x >= W) return '';
      const g = gy(p.x), k = clamp(1 - Math.max(0, g - p.y) / 260, 0.15, 1);
      return `<ellipse cx="${f1(p.x)}" cy="${f1(g)}" rx="${f1(8 * k + 2)}" ry="${f1(2.4 * k + 0.6)}" fill="#000" opacity="${(0.35 * k).toFixed(2)}"/>`;
    }).join('');

    $('parts').innerHTML = parts.map(p => {
      const k = p.life / p.max, op = Math.min(1, k * 1.5).toFixed(2);
      if (p.kind === 'smoke') return `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(p.r + (1 - k) * 10)}" fill="${p.col}" opacity="${(k * 0.45).toFixed(2)}"/>`;
      if (p.kind === 'leaf') return `<ellipse cx="${f1(p.x)}" cy="${f1(p.y)}" rx="${f1(p.r)}" ry="${f1(p.r * 0.5)}"
                                      transform="rotate(${(frameNo * 8 + p.max * 7) % 360} ${f1(p.x)} ${f1(p.y)})" fill="${p.col}" opacity="${op}"/>`;
      return `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${f1(p.r)}" fill="${p.col}" opacity="${op}"/>`;
    }).join('');

    $('fx').innerHTML = fx.map(f => {
      const k = f.t / f.max;
      return `<circle cx="${f1(f.x)}" cy="${f1(f.y)}" r="${f1(f.r * Math.min(1, k * 1.6))}" fill="${f.fill}" opacity="${(1 - k).toFixed(2)}"/>
              <circle cx="${f1(f.x)}" cy="${f1(f.y)}" r="${f1(f.r * k * 1.4)}" fill="none" stroke="#fff"
                      stroke-width="${f1(3 * (1 - k))}" opacity="${(0.8 * (1 - k)).toFixed(2)}"/>`;
    }).join('');

    $('floaters').innerHTML = floaters.map(f => `<text x="${f1(f.x)}" y="${f1(f.y - f.t * 0.5)}" text-anchor="middle"
        font-size="${f.size || 15}" font-weight="bold" fill="${f.col}" stroke="${f.col === '#ffffff' || f.col === '#fff' ? '#000' : '#fff'}" stroke-width=".8"
        opacity="${clamp(1 - f.t / 60, 0, 1).toFixed(2)}">${f.text}</text>`).join('');

    $('powerbar').innerHTML = charging
      ? `<rect x="10" y="${scene === 'battle' && kind === 'campaign' ? 82 : 54}" width="208" height="14" rx="7" fill="#000" opacity=".45"/>
         <rect x="12" y="${scene === 'battle' && kind === 'campaign' ? 84 : 56}" width="${f1(power * 2.04)}" height="10" rx="5" fill="url(#pow)"/>`
      : '';

    $('hud').innerHTML = weatherSvg() + (flash.a > 0.01 ? `<rect width="800" height="500" fill="${flash.col}" opacity="${flash.a.toFixed(2)}"/>` : '') + hudSvg();
    $('msgbox').innerHTML = msgSvg();
    renderOverlay();
  }

  // ---------- Menus e painéis (coordenadas próprias para toque/clique) ----------
  function uiBtn(x, y, w, h, label, fn, o = {}) {
    const idx = uiList.length;
    uiList.push({ x, y, w, h, fn, disabled: !!o.disabled });
    const sel = idx === uiSel && !o.disabled;
    return `<g opacity="${o.disabled ? 0.4 : 1}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"
      fill="${sel ? '#ffb347' : '#1b2a44'}" fill-opacity="${sel ? 0.97 : 0.9}" stroke="#fff" stroke-opacity="${sel ? 1 : 0.6}" stroke-width="${sel ? 3 : 2}"/>
      <text x="${x + w / 2}" y="${y + h / 2 + (o.fs || 20) * 0.35}" text-anchor="middle" font-size="${o.fs || 20}" font-weight="bold"
        fill="${sel ? '#241400' : '#fff'}">${label}</text></g>`;
  }

  function menuSvg() {
    const save = loadSave();
    let s = `<rect width="800" height="500" fill="#0b1630" opacity=".38"/>
      <g transform="translate(400 112)" text-anchor="middle">
        <text y="0" font-size="52" font-weight="900" fill="#fff" stroke="#173a78" stroke-width="7" paint-order="stroke" letter-spacing="1">Monstrinhos</text>
        <text y="38" font-size="30" font-weight="800" fill="#ffd34d" stroke="#6a3a00" stroke-width="5" paint-order="stroke" letter-spacing="4">DE ARTILHARIA</text>
      </g>
      <g transform="translate(130 100)">${Art.ball(30, -12)}</g><g transform="translate(670 100)">${Art.ball(30, 12)}</g>`;
    let y = 196;
    if (save) { s += uiBtn(250, y, 300, 50, `Continuar — Fase ${save.stage + 1}`, continueCampaign); y += 62; }
    s += uiBtn(250, y, 300, 50, 'Novo jogo (campanha)', startNewGame); y += 62;
    s += uiBtn(250, y, 300, 50, 'Versus (3 times, local)', initVersus);
    s += `<text x="400" y="472" text-anchor="middle" font-size="10" fill="#fff" opacity=".8">Projeto de fã, sem fins lucrativos. Pokémon e seus nomes pertencem a Nintendo / Game Freak / Creatures.</text>
      <text x="400" y="488" text-anchor="middle" font-size="10" fill="#fff" opacity=".6">Todas as artes são desenhos próprios em SVG.</text>`;
    return s;
  }

  function startNewGame() { clearSave(); initIntro(); }

  function typeChips(types, cx, y) { return Art.typeDots(types, cx, y, TYPE_COLOR); }

  function teamSvg() {
    const R = campaign.roster, st = STAGES[stageIdx], n = R.length;
    const cols = 7, cw = 100, gap = 8, x0 = Math.round((W - (cols * cw + (cols - 1) * gap)) / 2), y0 = 118, ch = 150;
    const foes = st.enemies.map(e => SPECIES[e]);
    let s = `<rect width="800" height="500" fill="#0b1630" opacity=".55"/>
      <text x="400" y="42" text-anchor="middle" font-size="26" font-weight="800" fill="#fff">Escolha até 3 Pokémon</text>
      <text x="400" y="66" text-anchor="middle" font-size="13" fill="#ffd34d">Fase ${stageIdx + 1}: ${st.name}</text>
      <text x="400" y="88" text-anchor="middle" font-size="12" fill="#cfe">Inimigos: ${foes.map(f => f.name).join(', ')}</text>
      <text x="400" y="106" text-anchor="middle" font-size="11" fill="#fff" opacity=".8">▲ = seu ataque é super efetivo contra algum inimigo</text>`;
    R.forEach((sp, i) => {
      const S = SPECIES[sp], col = i % cols, row = Math.floor(i / cols);
      const x = x0 + col * (cw + gap), y = y0 + row * (ch + 10), picked = campaign.sel.includes(i);
      const idx = uiList.length;
      uiList.push({ x, y, w: cw, h: ch, fn: () => {
        const k = campaign.sel.indexOf(i);
        if (k >= 0) { if (campaign.sel.length > 1) campaign.sel.splice(k, 1); }
        else if (campaign.sel.length < 3) campaign.sel.push(i);
        else { showMsg('Máximo de 3 Pokémon!', 60); return; }
        Sfx.click();
      } });
      const wp = WEAPONS[S.weapon];
      const adv = !wp.none && foes.some(f => typeMult(wp.type, f.types) > 1);
      const selCur = idx === uiSel;
      s += `<g><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="12" fill="${picked ? '#2b4a2a' : '#1b2a44'}" fill-opacity=".92"
          stroke="${picked ? '#8fe070' : '#fff'}" stroke-opacity="${picked ? 1 : 0.45}" stroke-width="${picked ? 3 : 1.5}"/>
        ${selCur ? `<rect x="${x - 3}" y="${y - 3}" width="${cw + 6}" height="${ch + 6}" rx="14" fill="none" stroke="#ffb347" stroke-width="3"/>` : ''}
        <g transform="translate(${x + cw / 2} ${y + 84}) scale(1.3)">${Art.draw(sp, { f: frameNo, blink: false, breath: 0, bob: Math.sin(frameNo * 0.08 + i) * 0.7, step: 0, x: i })}</g>
        <text x="${x + cw / 2}" y="${y + 106}" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#fff">${S.name}</text>
        ${typeChips(S.types, x + cw / 2, y + 118)}
        <text x="${x + cw / 2}" y="${y + 134}" text-anchor="middle" font-size="9.5" fill="#cde">${wp.label}</text>
        ${adv ? `<text x="${x + cw - 10}" y="${y + 20}" text-anchor="end" font-size="14" font-weight="bold" fill="#8fe070">▲</text>` : ''}
        ${S.evo ? `<rect x="${x + 14}" y="${y + 140}" width="${cw - 28}" height="4" rx="2" fill="#000" opacity=".55"/><rect x="${x + 14}" y="${y + 140}" width="${f1((cw - 28) * clamp(campaign.xp[i] / S.evoXp, 0, 1))}" height="4" rx="2" fill="#6ad0ff"/>` : ''}
        ${picked ? `<text x="${x + 10}" y="${y + 20}" font-size="14" font-weight="bold" fill="#8fe070">✔</text>` : ''}</g>`;
    });
    s += `<text x="400" y="440" text-anchor="middle" font-size="13" fill="#fff">Escolhidos: ${campaign.sel.length}/3 &nbsp;·&nbsp; Pokébolas: ${campaign.balls}</text>`;
    s += uiBtn(280, 450, 240, 40, 'Começar ▶', () => {
      campaign.partyIdx = campaign.sel.slice();
      campaign.party = campaign.sel.map(i => campaign.roster[i]);
      Sfx.select(); initStage(stageIdx);
    }, { fs: 18 });
    if (msg) s += msgSvg();
    return s;
  }

  function panelSvg() {
    const P = panel;
    const nl = (P.lines || []).length, bx = 130, by = 90, bw = 540, bh = (P.caught.length ? 320 : 250) + nl * 20;
    let s = `<rect width="800" height="500" fill="#000" opacity=".5"/>
      <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="20" fill="#13203a" fill-opacity=".96" stroke="#ffd34d" stroke-width="3"/>
      <text x="400" y="${by + 54}" text-anchor="middle" font-size="30" font-weight="800" fill="#ffd34d">${P.title}</text>
      <text x="400" y="${by + 82}" text-anchor="middle" font-size="15" fill="#fff">${P.sub}</text>`;
    let y = by + 100;
    (P.lines || []).forEach((ln, i) => { s += `<text x="400" y="${y + 6 + i * 20}" text-anchor="middle" font-size="13.5" fill="${ln.includes('evoluiu') ? '#6ad0ff' : '#cfe'}" font-weight="${ln.includes('evoluiu') ? 'bold' : 'normal'}">${ln}</text>`; });
    y += nl * 20;
    if (P.caught.length) {
      s += `<text x="400" y="${y + 18}" text-anchor="middle" font-size="13" fill="#8fe070" font-weight="bold">Capturados nesta fase</text>`;
      const n = P.caught.length, step = 90, sx = 400 - (n - 1) * step / 2;
      P.caught.forEach((sp, i) => {
        s += `<g transform="translate(${f1(sx + i * step)} ${y + 88})">${Art.draw(sp, { f: frameNo, blink: false, breath: 0, bob: Math.sin(frameNo * 0.08 + i) * 0.7, step: 0, x: i })}
          <text y="14" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">${SPECIES[sp].name}</text></g>`;
      });
      y += 130;
    } else y += 20;
    const bn = P.buttons.length, bwid = 200, g = 20, total = bn * bwid + (bn - 1) * g;
    P.buttons.forEach((b, i) => { s += uiBtn(400 - total / 2 + i * (bwid + g), by + bh - 64, bwid, 44, b.label, b.fn, { fs: 17 }); });
    return s;
  }

  function renderOverlay() {
    uiList = [];
    let s = '';
    if (scene === 'menu') s = menuSvg();
    else if (scene === 'team') s = teamSvg();
    if (evo) s = evolveSvg();
    if (panel) { uiList = []; s += panelSvg(); }
    if (uiSel >= uiList.length) uiSel = Math.max(0, uiList.length - 1);
    $('overlay').innerHTML = s;
  }

  // ---------- Botões de toque ----------
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  else { $('soundBtn').setAttribute('transform', 'translate(124 0)'); $('menuBtn').setAttribute('transform', 'translate(124 0)'); }

  function syncButtons() {
    const b = scene === 'battle' && !panel && state !== 'evolve', i = scene === 'intro';
    const camp = b && kind === 'campaign';
    const show = { left: b, right: b, up: b || i, down: b || i, fire: b || i, switch: b, restart: b || i,
                   ball: camp, menu: b || i, sound: true };
    // na fase da cidade os botões vão para a esquerda, para não cobrir a lagoa e os alvos da direita
    const introPos = { up: 'translate(-536 0)', down: 'translate(-536 0)', fire: 'translate(190 452) scale(.75) translate(-738 -436)' };
    document.querySelectorAll('.btn').forEach(el => {
      el.style.display = show[el.dataset.act] ? '' : 'none';
      if (introPos[el.dataset.act]) el.setAttribute('transform', i ? introPos[el.dataset.act] : '');
    });
  }

  function toggleSound() {
    Sfx.unlock();
    $('soundIcon').textContent = Sfx.toggle() ? '🔊' : '🔇';
  }
  ['keydown', 'pointerdown', 'pointerup', 'touchend', 'click'].forEach(ev => addEventListener(ev, () => Sfx.unlock(), { passive: true }));

  function restart() {
    Sfx.click();
    if (scene === 'intro') initIntro();
    else if (scene === 'battle' && kind === 'versus') initVersus();
    else if (scene === 'battle' && kind === 'campaign') restartStage();
  }

  function pressFire() {
    if (state === 'aim' && !charging && (scene === 'intro' ? intro.balls > 0 : !teams[turnTeam].ai)) {
      charging = true; power = 0; Sfx.unlock(); Sfx.chargeStart();
    }
  }
  function releaseFire() {
    if (!charging) return;
    if (scene === 'intro') fireIntro();
    else if (state === 'aim') fire();
  }

  document.querySelectorAll('.btn').forEach(btn => {
    const act = btn.dataset.act;
    const holdKey = { left: 'left', right: 'right', up: 'up', down: 'down' }[act];
    const press = e => {
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      btn.classList.add('on');
      if (holdKey) keys[holdKey] = true;
      else if (act === 'fire') pressFire();
      else if (act === 'switch') switchUnit();
      else if (act === 'restart') restart();
      else if (act === 'ball') toggleBall();
      else if (act === 'menu') { Sfx.click(); initMenu(); }
      else if (act === 'sound') toggleSound();
    };
    const release = e => {
      e.preventDefault();
      btn.classList.remove('on');
      if (holdKey) keys[holdKey] = false;
      else if (act === 'fire') releaseFire();
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  });

  // clique/toque nos menus: testa as áreas desenhadas no overlay
  function svgPoint(e) {
    const r = $('game').getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function uiHit(p) { return uiList.findIndex(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h); }
  $('game').addEventListener('pointerdown', e => {
    if (e.target.closest && e.target.closest('.btn')) return;
    if (evo) { Sfx.unlock(); skipEvolve(); return; }
    if (!uiList.length) return;
    const i = uiHit(svgPoint(e));
    if (i >= 0 && !uiList[i].disabled) { uiSel = i; Sfx.unlock(); activate(i); }
  });
  $('game').addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !uiList.length) return;
    const i = uiHit(svgPoint(e));
    if (i >= 0 && i !== uiSel) uiSel = i;
  });
  $('game').addEventListener('contextmenu', e => e.preventDefault());

  function activate(i) {
    const b = uiList[i];
    if (!b || b.disabled) return;
    if (!(scene === 'team' && !panel)) Sfx.select();
    b.fn();
  }

  // ---------- Teclado ----------
  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

  addEventListener('keydown', e => {
    if (e.key === 'm' || e.key === 'M') { toggleSound(); return; }
    if (evo) {
      if (e.key === 'Escape') initMenu();
      else if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) skipEvolve(); }
      return;
    }
    // menus, seleção de time e painéis
    if (scene === 'menu' || scene === 'team' || panel) {
      const n = uiList.length; if (!n) return;
      const team = scene === 'team' && !panel;
      if (e.key === 'ArrowRight' || (!team && e.key === 'ArrowDown')) { uiSel = (uiSel + 1) % n; Sfx.click(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || (!team && e.key === 'ArrowUp')) { uiSel = (uiSel + n - 1) % n; Sfx.click(); e.preventDefault(); }
      else if (team && e.key === 'ArrowDown') { uiSel = Math.min(n - 1, uiSel + 7); Sfx.click(); e.preventDefault(); }
      else if (team && e.key === 'ArrowUp') { uiSel = Math.max(0, uiSel - 7); Sfx.click(); e.preventDefault(); }
      else if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat) activate(uiSel); }
      else if (e.key === 'Escape' && scene !== 'menu') initMenu();
      return;
    }
    if (e.key === 'Escape') { initMenu(); return; }
    if (e.key === 'r' || e.key === 'R') { restart(); return; }
    if (state === 'over') return;
    if (ARROWS[e.key]) { keys[ARROWS[e.key]] = true; e.preventDefault(); return; }
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) pressFire(); return; }
    if (e.key === 'Tab') { e.preventDefault(); switchUnit(); return; }
    if (e.key === 'b' || e.key === 'B') toggleBall();
  });

  addEventListener('keyup', e => {
    if (ARROWS[e.key]) keys[ARROWS[e.key]] = false;
    else if (e.code === 'Space') releaseFire();
  });
  addEventListener('blur', () => { keys = {}; charging = false; power = 0; Sfx.chargeStop(); });

  // ---------- Loop ----------
  function stepBattle() {
    if (state === 'aim') {
      if (keys.up)   angle = Math.min(180, angle + 1.2);
      if (keys.down) angle = Math.max(0, angle - 1.2);
      if (!charging) {
        if (keys.left)  walkUnit(activeUnit(), -1);
        if (keys.right) walkUnit(activeUnit(), 1);
      } else {
        power = Math.min(100, power + 0.9);
        Sfx.chargeSet(power);
      }
    }
    if (state === 'ai') stepAI();
    if (state === 'skip' && splashU) splashU.hop++;
    if (state === 'skip' && --skipT <= 0) { if (splashU) { splashU.hop = 0; splashU = null; } state = 'settle'; }
    if (state === 'guest') stepGuest();
    if (state === 'evolve') stepEvolve();
    if (state === 'flying') stepProjs();
    if (state === 'volt' && --voltDelay <= 0) voltShoot();
    if (state === 'capture' && cap) stepCapture();
    if (state === 'settle') settle();
    if (kind === 'campaign' && state !== 'over' && state !== 'evolve') stepPickups();
    if (pendingPanel && --pendingPanel.t <= 0) {
      const pp = pendingPanel; pendingPanel = null;
      if (pp.evos && pp.evos.length) startEvolutions(pp.evos, pp.panel);
      else { panel = pp.panel; uiSel = 0; syncButtons(); }
    }
  }

  function frame() {
    frameNo++;
    for (const u of units) {
      if (u.breath > 0) u.breath--;
      if (u.hurt > 0) u.hurt--;
      if (scene !== 'intro') u.moving = false;
    }
    if (scene === 'battle') { stepBattle(); stepWeather(); }
    else if (scene === 'intro') stepIntro();
    updateUnits();
    stepParts();
    flash.a *= 0.86;
    for (const f of fx) f.t++;
    fx = fx.filter(f => f.t < f.max);
    for (const f of floaters) f.t++;
    floaters = floaters.filter(f => f.t < 60);
    if (msgT > 0 && --msgT === 0) msg = '';
    updateCamera();
    renderAll();
    requestAnimationFrame(frame);
  }

  // para testes automatizados
  MS.debug = {
    get: () => ({ scene, kind, state, stageIdx, units, teams, campaign, cap, intro, panel, angle, power, wind, ballMode, turnTeam, ai, guest, gCool, gMode, evo }),
    get pickups() { return pickups; }, BALLS,
    setWeather: w => { weather = w; lightT = 5; $('sun').style.display = (w === 'rain' || w === 'storm') ? 'none' : ''; }, get weather() { return weather; },
    forceGuest: sp => { gCool = 0; STAGES[stageIdx].guests = [{ sp, rarity: 1 }]; },
    skipEvolve, stageClear,
    initMenu, initVersus, initIntro, initStage, newCampaign, beginStage, fire, toggleBall, pickTarget,
    setAngle: a => { angle = a; }, setPower: p => { power = p; },
    // procura (ângulo, força) para acertar um alvo com a arma 'wk' a partir do personagem da vez
    findShot: (target, wk) => {
      const u = activeUnit(), wp = WEAPONS[wk], S = spOf(u);
      for (let ang = 10; ang <= 170; ang += 1) {
        const a = ang * Math.PI / 180, face = Math.cos(a) >= 0 ? 1 : -1;
        const x0 = wk === 'ball' ? u.x + face * 8 * u.scale : u.x + face * S.mouth[0] * u.scale;
        const y0 = wk === 'ball' ? u.y - S.h * 0.6 * u.scale : u.y + S.mouth[1] * u.scale;
        for (let pw = 10; pw <= 100; pw += 1) {
          const r = simShot(wp, u, x0, y0, a, 3 + pw * 0.075);
          if (!r) continue;
          const c = centerOf(target);
          if (Math.hypot(c.x - r.x, c.y - r.y) < Math.max(12, hitRof(target) + 1)) return { ang, pw };
        }
      }
      return null;
    }
  };

  initMenu();
  requestAnimationFrame(frame);
})();
